// backend/src/routes/leads.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

const STAGE_ORDER = {
  'NEW': 1,
  'INTERESTED': 2,
  'PROPOSAL_SHARED': 3,
  'PAYMENT_COMPLETED': 4
};

// Helper: Get accessible assigned user IDs for a user based on their role
async function getAccessibleUserIds(user) {
  if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER' || user.role === 'FINANCE' || user.role === 'ACCOUNT_MANAGER') {
    return null; // Can see everything
  }

  if (user.role === 'TEAM_LEADER') {
    const teamMembers = await prisma.user.findMany({
      where: { teamLeaderId: user.id },
      select: { id: true }
    });
    const ids = teamMembers.map(m => m.id);
    ids.push(user.id);
    return ids;
  }

  if (user.role === 'SALES_EXEC') {
    return [user.id];
  }

  return [];
}

// @route   GET /api/leads
// @desc    Get all leads (filtered by role + query params)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userIds = await getAccessibleUserIds(req.user);
    
    let whereClause = {};
    if (userIds !== null) {
      whereClause.assignedToId = { in: userIds };
    }

    // Apply stage, assignedTo, search, date filters
    const { stage, assignedToId, from, to, search } = req.query;
    
    if (stage) {
      whereClause.stage = stage;
    }
    if (assignedToId) {
      // SECURITY: SALES_EXEC can only filter by their own ID, prevent IDOR
      if (req.user.role === 'SALES_EXEC') {
        whereClause.assignedToId = req.user.id;
      } else {
        whereClause.assignedToId = assignedToId;
      }
    }
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/search
// @desc    Global search leads by name or phone or company
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const userIds = await getAccessibleUserIds(req.user);
    let whereClause = {
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { company: { contains: q } }
      ]
    };

    if (userIds !== null) {
      whereClause.assignedToId = { in: userIds };
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        stage: true,
        company: true
      }
    });

    return res.json(leads);
  } catch (error) {
    console.error('Lead search error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead (with strict duplicate check)
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { name, phone, email, source, company, notes, assignedToId } = req.body;

    if (!name || !phone || !source) {
      return res.status(400).json({ message: 'Name, phone, and source are mandatory fields' });
    }

    // Duplicate check: check if phone or email already exists
    const duplicate = await prisma.lead.findFirst({
      where: {
        OR: [
          { phone: phone },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });

    if (duplicate) {
      return res.status(409).json({
        error: 'Lead already exists',
        existingLeadId: duplicate.id,
        existingLeadName: duplicate.name
      });
    }

    let assignedId = assignedToId;
    if (!assignedId && (req.user.role === 'SALES_EXEC' || req.user.role === 'TEAM_LEADER')) {
      assignedId = req.user.id;
    }

    const newLead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        source,
        company,
        notes,
        assignedToId: assignedId,
        stage: 'NEW'
      }
    });

    // Log initial STAGE_CHANGE activity
    await prisma.leadActivity.create({
      data: {
        leadId: newLead.id,
        userId: req.user.id,
        type: 'STAGE_CHANGE',
        description: `Lead created in stage NEW`
      }
    });

    if (notes) {
      await prisma.leadActivity.create({
        data: {
          leadId: newLead.id,
          userId: req.user.id,
          type: 'NOTE',
          description: `Initial note: ${notes}`
        }
      });
    }

    return res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/:id
// @desc    Get lead details + activities timeline
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userIds = await getAccessibleUserIds(req.user);

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        client: true,
        activities: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check authorization to view this lead
    if (userIds !== null && !userIds.includes(lead.assignedToId)) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    return res.json(lead);
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id/stage
// @desc    Update lead stage (with strict validation)
router.put('/:id/stage', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ message: 'Stage is required' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const currentStage = lead.stage;

    // Strict Stage transition verification
    if (currentStage === stage) {
      return res.json(lead);
    }

    // Payment Completed is final stage, cannot transition out of it
    if (currentStage === 'PAYMENT_COMPLETED') {
      return res.status(400).json({ message: 'Cannot change stage. Deal is closed and billing is active.' });
    }

    const isCurrentInFlow = STAGE_ORDER[currentStage] !== undefined;
    const isTargetInFlow = STAGE_ORDER[stage] !== undefined;

    // Enforce flow rule if both are in standard flow:
    if (isCurrentInFlow && isTargetInFlow) {
      const currentIdx = STAGE_ORDER[currentStage];
      const targetIdx = STAGE_ORDER[stage];

      if (targetIdx < currentIdx) {
        return res.status(400).json({ message: `Cannot go backwards in sales funnel from ${currentStage} to ${stage}` });
      }

      if (targetIdx - currentIdx > 1) {
        return res.status(400).json({ message: `Cannot skip stages. Must go sequentially (e.g. from ${currentStage} to ${Object.keys(STAGE_ORDER).find(k => STAGE_ORDER[k] === currentIdx + 1)})` });
      }
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { stage }
    });

    // Create STAGE_CHANGE activity logs
    let description = `${currentStage} → ${stage}`;
    
    // Auto-create client on PAYMENT_COMPLETED
    if (stage === 'PAYMENT_COMPLETED' && !lead.client) {
      // Find an Account Manager to assign handoff to (defaulting to the seeded AM User, or anyone with role ACCOUNT_MANAGER)
      const amUser = await prisma.user.findFirst({
        where: { role: 'ACCOUNT_MANAGER' }
      });
      const amUserId = amUser ? amUser.id : req.user.id;

      // Create Client
      const client = await prisma.client.create({
        data: {
          leadId: lead.id,
          companyName: lead.company || `${lead.name} Corp`,
          contactName: lead.name,
          phone: lead.phone,
          email: lead.email || `${lead.name.toLowerCase().replace(/ /g, '')}@example.com`,
          state: 'Maharashtra',
          amcStartDate: new Date(),
          amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
      });

      const now = new Date();

      // Create Handoff Ticket with SLA deadlines (48h meeting, 5d onboarding)
      await prisma.handoff.create({
        data: {
          clientId: client.id,
          accountManagerId: amUserId,
          status: 'PENDING',
          slaDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
          onboardingDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        }
      });

      // Create Commitment window (60 days)
      await prisma.commitment.create({
        data: {
          clientId: client.id,
          agentCount: 0,
          talkTimeTarget: 0,
          revenueCommitment: 0.0,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          actualTalkTime: 0,
          actualRevenue: 0.0
        }
      });
    }

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId: req.user.id,
        type: 'STAGE_CHANGE',
        description
      }
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error('Error updating stage:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/note
// @desc    Add note activity to lead
router.post('/:id/note', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId: req.user.id,
        type: 'NOTE',
        description
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return res.status(201).json(activity);
  } catch (error) {
    console.error('Error logging note:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/call
// @desc    Log call activity to lead & sync to Commitment talk time
router.post('/:id/call', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, description } = req.body; // duration in minutes

    if (!description || duration === undefined) {
      return res.status(400).json({ message: 'Description and duration (in minutes) are required' });
    }

    const durationMins = parseInt(duration);
    const durationSecs = durationMins * 60;

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId: req.user.id,
        type: 'CALL',
        description: `${description} (${durationMins} min call)`,
        callDuration: durationSecs
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    // If lead has client, update active commitment actualTalkTime
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { client: { include: { commitment: true } } }
    });

    if (lead?.client?.commitment) {
      const commitment = lead.client.commitment;
      await prisma.commitment.update({
        where: { id: commitment.id },
        data: {
          actualTalkTime: commitment.actualTalkTime + durationMins
        }
      });
    }

    return res.status(201).json(activity);
  } catch (error) {
    console.error('Error logging call:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
