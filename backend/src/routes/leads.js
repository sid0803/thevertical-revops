// backend/src/routes/leads.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { verifyToken, getAccessibleUserIds, checkLeadAccess } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Lead Scoring Helpers
async function increaseLeadScore(leadId, incrementAmount = 15) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      const newScore = Math.min(100, (lead.score || 50) + incrementAmount);
      await prisma.lead.update({
        where: { id: leadId },
        data: { score: newScore }
      });
    }
  } catch (error) {
    console.error('Failed to increase lead score:', error);
  }
}

async function runLeadScoreDecay() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const inactiveLeads = await prisma.lead.findMany({
      where: {
        activities: {
          none: {
            createdAt: {
              gte: twentyFourHoursAgo
            }
          }
        },
        stage: {
          notIn: ['WIN', 'LOSS']
        },
        score: {
          gt: 0
        }
      }
    });

    console.log(`[Score Decay] Found ${inactiveLeads.length} inactive leads to decay.`);
    for (const lead of inactiveLeads) {
      const newScore = Math.max(0, (lead.score || 50) - 5);
      await prisma.lead.update({
        where: { id: lead.id },
        data: { score: newScore }
      });
    }
    return inactiveLeads.length;
  } catch (error) {
    console.error('Error during lead score decay:', error);
    return 0;
  }
}

// Run decay once after server starts (5 seconds delay to let DB settle) and then every 24 hours
setTimeout(() => {
  runLeadScoreDecay();
}, 5000);
setInterval(runLeadScoreDecay, 24 * 60 * 60 * 1000);

// Manual score decay trigger
router.post('/decay', verifyToken, async (req, res) => {
  try {
    const count = await runLeadScoreDecay();
    return res.json({ message: `Score decay completed. ${count} leads decayed.` });
  } catch (error) {
    console.error('Manual decay error:', error);
    return res.status(500).json({ message: 'Error running decay' });
  }
});

// New v2 pipeline stages in order
const STAGE_ORDER = {
  'DISCOVERY_CALL': 1,
  'DEMO': 2,
  'PROPOSAL': 3,
  'NEGOTIATION': 4,
  'WIN': 5
};

const CLOSED_STAGES = ['WIN', 'LOSS'];

// @route   GET /api/leads
router.get('/', verifyToken, async (req, res) => {
  try {
    const userIds = await getAccessibleUserIds(req.user);
    let whereClause = {};
    if (userIds !== null) whereClause.assignedToId = { in: userIds };

    const { stage, assignedToId, from, to, search, dateFilter } = req.query;

    if (stage) whereClause.stage = stage;
    if (assignedToId) {
      whereClause.assignedToId = req.user.role === 'SALES_EXEC' ? req.user.id : assignedToId;
    }

    // Date filter shortcuts: today, yesterday, tomorrow, custom (from/to)
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    } else if (dateFilter === 'yesterday') {
      const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    } else if (dateFilter === 'tomorrow') {
      const start = new Date(now); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    } else if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { companyName: { contains: search } },
        { personalEmail: { contains: search } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        _count: { select: { tasks: true, files: true, activities: true } }
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
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const userIds = await getAccessibleUserIds(req.user);
    let whereClause = {
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { companyName: { contains: q } }
      ]
    };
    if (userIds !== null) whereClause.assignedToId = { in: userIds };

    const leads = await prisma.lead.findMany({
      where: whereClause,
      take: 10,
      select: { id: true, name: true, phone: true, stage: true, companyName: true }
    });
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const {
      name, phone, personalEmail, companyName, companyEmail,
      linkedinUrl, socialMediaUrl, source, notes, assignedToId
    } = req.body;

    if (!name || !phone || !source) {
      return res.status(400).json({ message: 'Name, phone, and source are mandatory' });
    }

    // Duplicate check
    const duplicate = await prisma.lead.findFirst({
      where: {
        OR: [
          { phone },
          ...(personalEmail ? [{ personalEmail }] : [])
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
    if (!assignedId && ['SALES_EXEC', 'TEAM_LEADER'].includes(req.user.role)) {
      assignedId = req.user.id;
    }

    const newLead = await prisma.lead.create({
      data: {
        name, phone, personalEmail, companyName, companyEmail,
        linkedinUrl, socialMediaUrl, source, notes,
        assignedToId: assignedId,
        stage: 'DISCOVERY_CALL'
      }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: newLead.id, userId: req.user.id,
        type: 'STAGE_CHANGE',
        description: `Lead created — started at DISCOVERY CALL stage`
      }
    });

    return res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leads/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userIds = await getAccessibleUserIds(req.user);

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        client: true,
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { dueDate: 'asc' }
        },
        files: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (userIds !== null && !userIds.includes(lead.assignedToId)) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    // Auto-update overdue status on tasks before returning
    const nowTime = new Date();
    const overdueTaskIds = lead.tasks
      .filter(t => !t.isCompleted && !t.isOverdue && new Date(t.dueDate) < nowTime)
      .map(t => t.id);

    if (overdueTaskIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: overdueTaskIds } },
        data: { isOverdue: true }
      });
      overdueTaskIds.forEach(tid => {
        const task = lead.tasks.find(t => t.id === tid);
        if (task) task.isOverdue = true;
      });
    }

    return res.json(lead);
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead contact/company info
router.put('/:id', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const {
      name, phone, personalEmail, companyName, companyEmail,
      linkedinUrl, socialMediaUrl, source, notes, assignedToId
    } = req.body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(personalEmail !== undefined && { personalEmail }),
        ...(companyName !== undefined && { companyName }),
        ...(companyEmail !== undefined && { companyEmail }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(socialMediaUrl !== undefined && { socialMediaUrl }),
        ...(source && { source }),
        ...(notes !== undefined && { notes }),
        ...(assignedToId && { assignedToId })
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leads/:id/stage
router.put('/:id/stage', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const { stage, lossReason } = req.body;

    if (!stage) return res.status(400).json({ message: 'Stage is required' });

    const lead = await prisma.lead.findUnique({ where: { id }, include: { client: true } });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const currentStage = lead.stage;
    if (currentStage === stage) return res.json(lead);

    // WIN is final — cannot go backwards once won
    if (currentStage === 'WIN') {
      return res.status(400).json({ message: 'Cannot change stage. Deal is Won and client has been created.' });
    }

    // LOSS can be re-opened to any stage (revive the lead)
    const isCurrentInFlow = STAGE_ORDER[currentStage] !== undefined;
    const isTargetInFlow = STAGE_ORDER[stage] !== undefined;

    if (currentStage !== 'LOSS' && isCurrentInFlow && isTargetInFlow) {
      const currentIdx = STAGE_ORDER[currentStage];
      const targetIdx = STAGE_ORDER[stage];

      if (targetIdx < currentIdx) {
        return res.status(400).json({ message: `Cannot go backwards in pipeline from ${currentStage} to ${stage}` });
      }
      if (targetIdx - currentIdx > 1) {
        const nextStageName = Object.keys(STAGE_ORDER).find(k => STAGE_ORDER[k] === currentIdx + 1);
        return res.status(400).json({ message: `Cannot skip stages. Next stage must be ${nextStageName}` });
      }
    }

    // Require lossReason for LOSS
    if (stage === 'LOSS' && !lossReason) {
      return res.status(400).json({ message: 'Loss reason is required when marking a lead as Lost' });
    }

    const updateData = { stage };
    if (stage === 'LOSS') updateData.lossReason = lossReason;
    updateData.score = Math.min(100, (lead.score || 50) + 15);

    const updatedLead = await prisma.lead.update({ where: { id }, data: updateData });

    // Auto-create client on WIN
    if (stage === 'WIN' && !lead.client) {
      const amUser = await prisma.user.findFirst({ where: { role: 'ACCOUNT_MANAGER' } });
      const amUserId = amUser ? amUser.id : req.user.id;

      const client = await prisma.client.create({
        data: {
          leadId: lead.id,
          companyName: lead.companyName || `${lead.name} Corp`,
          contactName: lead.name,
          phone: lead.phone,
          email: lead.personalEmail || lead.companyEmail || `${lead.name.toLowerCase().replace(/ /g, '')}@example.com`,
          state: 'Maharashtra',
          amcStartDate: new Date(),
          amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
      });

      const now = new Date();
      await prisma.handoff.create({
        data: {
          clientId: client.id, accountManagerId: amUserId, status: 'PENDING',
          slaDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
          onboardingDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.commitment.create({
        data: {
          clientId: client.id, agentCount: 0, talkTimeTarget: 0, revenueCommitment: 0.0,
          windowStart: now,
          windowEnd: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          actualTalkTime: 0, actualRevenue: 0.0
        }
      });
    }

    const description = stage === 'LOSS'
      ? `${currentStage} → LOSS ❌ | Reason: ${lossReason}`
      : stage === 'WIN'
      ? `${currentStage} → WIN 🎉 | Client account created`
      : `${currentStage} → ${stage}`;

    await prisma.leadActivity.create({
      data: { leadId: id, userId: req.user.id, type: 'STAGE_CHANGE', description }
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error('Error updating stage:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/note
router.post('/:id/note', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Note content is required' });

    const activity = await prisma.leadActivity.create({
      data: { leadId: id, userId: req.user.id, type: 'NOTE', description },
      include: { user: { select: { id: true, name: true } } }
    });
    await increaseLeadScore(id, 15);
    return res.status(201).json(activity);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/call
// @desc    Log call/meeting activity with meetingType
router.post('/:id/call', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const { duration, description, meetingType } = req.body;

    if (!description || duration === undefined) {
      return res.status(400).json({ message: 'Description and duration are required' });
    }

    const durationMins = parseInt(duration);
    const durationSecs = durationMins * 60;

    const meetingLabel = {
      'PHONE_CALL': '📞 Phone Call',
      'ONLINE_MEETING': '💻 Online Meeting',
      'FACE_TO_FACE': '🤝 Face-to-Face',
      'OFFICE_VISIT': '🏢 Office Visit',
      'EMAIL_SENT': '📧 Email Sent',
      'WHATSAPP_MSG': '💬 WhatsApp'
    }[meetingType] || '📞 Call';

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id, userId: req.user.id, type: 'CALL',
        meetingType: meetingType || 'PHONE_CALL',
        description: `${meetingLabel} — ${description} (${durationMins} min)`,
        callDuration: durationSecs
      },
      include: { user: { select: { id: true, name: true } } }
    });

    // Update commitment talk time if client exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { client: { include: { commitment: true } } }
    });
    if (lead?.client?.commitment) {
      await prisma.commitment.update({
        where: { id: lead.client.commitment.id },
        data: { actualTalkTime: lead.client.commitment.actualTalkTime + durationMins }
      });
    }

    await increaseLeadScore(id, 15);
    return res.status(201).json(activity);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/email-log
// @desc    Log manual email activity
router.post('/:id/email-log', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const { subject, body, direction, toEmail } = req.body;
    if (!subject || !body) return res.status(400).json({ message: 'Subject and body are required' });

    const dirLabel = direction === 'RECEIVED' ? 'Received from' : 'Sent to';
    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id, userId: req.user.id, type: 'EMAIL',
        meetingType: direction === 'RECEIVED' ? 'EMAIL_RECEIVED' : 'EMAIL_SENT',
        description: JSON.stringify({ subject, body, direction: direction || 'SENT', toEmail })
      },
      include: { user: { select: { id: true, name: true } } }
    });
    await increaseLeadScore(id, 15);
    return res.status(201).json(activity);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leads/:id/whatsapp-log
// @desc    Log manual WhatsApp message
router.post('/:id/whatsapp-log', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkLeadAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const { message, direction } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id, userId: req.user.id, type: 'WHATSAPP',
        meetingType: 'WHATSAPP_MSG',
        description: JSON.stringify({ message, direction: direction || 'SENT' })
      },
      include: { user: { select: { id: true, name: true } } }
    });
    await increaseLeadScore(id, 15);
    return res.status(201).json(activity);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Helper: simple vanilla CSV parser
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Clean headers (remove BOM if present, trim)
  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    results.push({ rowNumber: i + 1, data: rowObj });
  }
  return results;
}

// In-memory Job Tracker for Async Imports
const importJobs = new Map();

async function processImportJob(jobId, parsedRows, overwrite, userId, defaultAssigneeId) {
  const job = importJobs.get(jobId);
  if (!job) return;

  let imported = 0;
  let updated = 0;
  let duplicates = 0;
  let failed = 0;
  const details = [];

  const total = parsedRows.length;

  for (let i = 0; i < total; i++) {
    const row = parsedRows[i];
    const { rowNumber, data } = row;
    const { name, phone, personalEmail, companyName, companyEmail, linkedinUrl, socialMediaUrl, source, notes, assignedToId } = data;

    if (!name || !phone) {
      failed++;
      details.push({
        row: rowNumber,
        status: 'failed',
        message: 'Missing mandatory fields: Name and Phone are required.'
      });
      job.progress = Math.round(((i + 1) / total) * 100);
      job.summary = { total, imported, updated, duplicates, failed };
      job.details = [...details];
      importJobs.set(jobId, job);
      continue;
    }

    // Check duplicate in database
    let existing = null;
    try {
      existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { phone: phone.trim() },
            ...(personalEmail?.trim() ? [{ personalEmail: personalEmail.trim() }] : [])
          ]
        }
      });
    } catch (err) {
      failed++;
      details.push({
        row: rowNumber,
        status: 'failed',
        message: 'Database query error during lookup.'
      });
      job.progress = Math.round(((i + 1) / total) * 100);
      job.summary = { total, imported, updated, duplicates, failed };
      job.details = [...details];
      importJobs.set(jobId, job);
      continue;
    }

    if (existing) {
      if (overwrite) {
        try {
          const updatedLead = await prisma.lead.update({
            where: { id: existing.id },
            data: {
              name: name.trim(),
              personalEmail: personalEmail?.trim() || existing.personalEmail,
              companyName: companyName?.trim() || existing.companyName,
              companyEmail: companyEmail?.trim() || existing.companyEmail,
              linkedinUrl: linkedinUrl?.trim() || existing.linkedinUrl,
              socialMediaUrl: socialMediaUrl?.trim() || existing.socialMediaUrl,
              source: source?.trim() || existing.source,
              notes: notes?.trim() || existing.notes,
              assignedToId: assignedToId?.trim() || existing.assignedToId || defaultAssigneeId
            }
          });

          await prisma.leadActivity.create({
            data: {
              leadId: updatedLead.id,
              userId: userId,
              type: 'NOTE',
              description: 'Lead details updated via bulk CSV import (overwrite enabled)'
            }
          });

          updated++;
        } catch (err) {
          failed++;
          details.push({
            row: rowNumber,
            status: 'failed',
            message: err.message || 'Database error updating lead.'
          });
        }
      } else {
        duplicates++;
        details.push({
          row: rowNumber,
          status: 'skipped',
          message: `Lead with phone "${phone}" or email "${personalEmail || ''}" already exists.`
        });
      }
    } else {
      // Create new lead
      try {
        const newLead = await prisma.lead.create({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            personalEmail: personalEmail?.trim() || null,
            companyName: companyName?.trim() || null,
            companyEmail: companyEmail?.trim() || null,
            linkedinUrl: linkedinUrl?.trim() || null,
            socialMediaUrl: socialMediaUrl?.trim() || null,
            source: source?.trim() || 'Bulk Import',
            notes: notes?.trim() || null,
            assignedToId: assignedToId?.trim() || defaultAssigneeId,
            stage: 'DISCOVERY_CALL'
          }
        });

        await prisma.leadActivity.create({
          data: {
            leadId: newLead.id,
            userId: userId,
            type: 'STAGE_CHANGE',
            description: 'Lead created via bulk CSV import'
          }
        });

        imported++;
      } catch (err) {
        failed++;
        details.push({
          row: rowNumber,
          status: 'failed',
          message: err.message || 'Database error creating lead.'
        });
      }
    }

    // Update progress
    job.progress = Math.round(((i + 1) / total) * 100);
    job.summary = { total, imported, updated, duplicates, failed };
    job.details = [...details];
    importJobs.set(jobId, job);
  }

  job.status = 'completed';
  importJobs.set(jobId, job);
}

// @route   POST /api/leads/bulk-upload
// @desc    Bulk upload leads via CSV file (Asynchronous)
router.post('/bulk-upload', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const overwrite = req.body.overwrite === 'true';
    const csvText = req.file.buffer.toString('utf-8');
    const parsedRows = parseCSV(csvText);

    if (parsedRows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid' });
    }

    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    importJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      progress: 0,
      summary: {
        total: parsedRows.length,
        imported: 0,
        updated: 0,
        duplicates: 0,
        failed: 0
      },
      details: []
    });

    // Start background processing
    processImportJob(jobId, parsedRows, overwrite, req.user.id, req.user.id).catch(err => {
      console.error(`Error in processImportJob ${jobId}:`, err);
      const job = importJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.details.push({
          row: 0,
          status: 'failed',
          message: err.message || 'Fatal error processing bulk import.'
        });
        importJobs.set(jobId, job);
      }
    });

    return res.status(202).json({
      success: true,
      jobId,
      message: 'Bulk import task started successfully.'
    });
  } catch (error) {
    console.error('Error initiating bulk upload:', error);
    return res.status(500).json({ message: 'Server error during bulk import' });
  }
});

// @route   GET /api/leads/bulk-upload/status/:jobId
// @desc    Check status of bulk import job
router.get('/bulk-upload/status/:jobId', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  const { jobId } = req.params;
  const job = importJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ message: 'Import job not found' });
  }
  
  return res.json(job);
});

export default router;
