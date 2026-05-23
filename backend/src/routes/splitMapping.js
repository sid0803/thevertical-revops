// backend/src/routes/splitMapping.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/split/handoffs
// @desc    Get all handoff tickets
router.get('/handoffs', verifyToken, async (req, res) => {
  try {
    const handoffs = await prisma.handoff.findMany({
      include: {
        client: {
          include: {
            lead: {
              select: { name: true, phone: true, assignedTo: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Dynamically update SLA breaches on fetch
    const now = new Date();
    const updatedHandoffs = await Promise.all(handoffs.map(async (h) => {
      const hoursSinceCreation = (now - new Date(h.createdAt)) / (1000 * 60 * 60);
      const daysSinceCreation = hoursSinceCreation / 24;

      let breached = h.slaBreached;

      // 48h SLA for handoff meeting
      if (!h.meetingDone && hoursSinceCreation > 48) {
        breached = true;
      }
      // 5-day (120h) SLA for complete onboarding
      if (!h.onboardingDone && daysSinceCreation > 5) {
        breached = true;
      }

      if (breached !== h.slaBreached) {
        return await prisma.handoff.update({
          where: { id: h.id },
          data: { slaBreached: breached },
          include: {
            client: {
              include: {
                lead: {
                  select: { name: true, phone: true, assignedTo: { select: { name: true } } }
                }
              }
            }
          }
        });
      }
      return h;
    }));

    return res.json(updatedHandoffs);
  } catch (error) {
    console.error('Error fetching handoffs:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/split/handoffs/:id
// @desc    Update handoff checklist progress
router.put('/handoffs/:id', verifyToken, requireRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingDone, introMailSent, onboardingDone, activationDone } = req.body;

    const handoff = await prisma.handoff.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!handoff) {
      return res.status(404).json({ message: 'Handoff ticket not found' });
    }

    const now = new Date();
    const hoursSinceCreation = (now - new Date(handoff.createdAt)) / (1000 * 60 * 60);
    const daysSinceCreation = hoursSinceCreation / 24;

    let slaBreached = handoff.slaBreached;

    // Check SLA breaches
    if (meetingDone && !handoff.meetingDone && hoursSinceCreation > 48) {
      slaBreached = true;
    }
    if (onboardingDone && !handoff.onboardingDone && daysSinceCreation > 5) {
      slaBreached = true;
    }

    // Determine status
    let status = 'PENDING';
    let handoffDate = handoff.handoffDate;

    const isAllDone = introMailSent && meetingDone && onboardingDone && activationDone;
    if (isAllDone) {
      status = 'COMPLETED';
      handoffDate = now;
    } else if (slaBreached) {
      status = 'BREACHED';
    }

    const updatedHandoff = await prisma.handoff.update({
      where: { id },
      data: {
        introMailSent,
        meetingDone,
        onboardingDone,
        activationDone,
        slaBreached,
        status,
        handoffDate
      },
      include: {
        client: {
          include: {
            lead: {
              select: { name: true, phone: true, assignedTo: { select: { name: true } } }
            }
          }
        }
      }
    });

    return res.json(updatedHandoff);
  } catch (error) {
    console.error('Error updating handoff checklist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/split/commitments
// @desc    Get client commitments list
router.get('/commitments', verifyToken, async (req, res) => {
  try {
    const commitments = await prisma.commitment.findMany({
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true }
        }
      }
    });
    return res.json(commitments);
  } catch (error) {
    console.error('Error fetching commitments:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/split/commitments/:id
// @desc    Update client commitment configuration
router.put('/commitments/:id', verifyToken, requireRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { agentCount, talkTimeTarget, revenueCommitment } = req.body;

    const updated = await prisma.commitment.update({
      where: { id },
      data: {
        ...(agentCount !== undefined && { agentCount: parseInt(agentCount) }),
        ...(talkTimeTarget !== undefined && { talkTimeTarget: parseInt(talkTimeTarget) }),
        ...(revenueCommitment !== undefined && { revenueCommitment: parseFloat(revenueCommitment) })
      },
      include: {
        client: {
          select: { id: true, companyName: true }
        }
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating commitment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/split/attribution
// @desc    Generate revenue split-mapping attribution reports
router.get('/attribution', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'), async (req, res) => {
  try {
    // Fetch all clients, invoices, and commitments
    const clients = await prisma.client.findMany({
      include: {
        lead: {
          include: {
            assignedTo: {
              select: { id: true, name: true }
            }
          }
        },
        handoff: true,
        commitment: true,
        invoices: {
          orderBy: { createdAt: 'asc' } // First invoice is initial sale
        }
      }
    });

    let reports = [];

    clients.forEach(client => {
      const salesExec = client.lead.assignedTo;
      if (!salesExec) return; // Skip if no sales exec assigned to lead

      const initialInvoice = client.invoices[0];
      const expansionInvoices = client.invoices.slice(1);
      const commitment = client.commitment;

      // 1. Initial Sale Attribution (100% Sales Exec)
      if (initialInvoice) {
        reports.push({
          clientId: client.id,
          companyName: client.companyName,
          invoiceNumber: initialInvoice.invoiceNumber,
          invoiceDate: initialInvoice.createdAt,
          revenueType: 'INITIAL_SALE',
          totalRevenue: initialInvoice.totalAmount,
          salesExecName: salesExec.name,
          amName: 'N/A',
          salesShare: initialInvoice.totalAmount,
          amShare: 0.0,
          notes: 'Initial sale credited 100% to Sales Exec'
        });
      }

      // 2. Expansion Sales Attribution
      expansionInvoices.forEach(inv => {
        let salesShare = 0.0;
        let amShare = 0.0;
        let type = 'EXPANSION';
        let notes = '';

        const invoiceDate = new Date(inv.createdAt);
        const windowEnd = commitment ? new Date(commitment.windowEnd) : null;

        const withinWindow = windowEnd ? invoiceDate <= windowEnd : true;

        if (withinWindow) {
          // Rule 2: Expansion within 60 days -> 100% Sales Exec
          salesShare = inv.totalAmount;
          amShare = 0.0;
          notes = 'Expansion within 60-day window (100% Sales Exec)';
        } else {
          // Check notes for "joint" split
          const isJoint = inv.status.includes('joint') || (inv.payments && inv.payments.some(p => p.notes?.toLowerCase().includes('joint')));
          
          if (isJoint) {
            // Rule 4: Joint expansion post-window -> 70% Sales Exec / 30% AM
            salesShare = inv.totalAmount * 0.70;
            amShare = inv.totalAmount * 0.30;
            notes = 'Joint expansion split (70% Sales Exec / 30% AM)';
            type = 'JOINT_EXPANSION';
          } else {
            // Rule 3: Post-window expansion -> 100% AM
            salesShare = 0.0;
            amShare = inv.totalAmount;
            notes = 'Post-window expansion (100% AM)';
          }
        }

        reports.push({
          clientId: client.id,
          companyName: client.companyName,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.createdAt,
          revenueType: type,
          totalRevenue: inv.totalAmount,
          salesExecName: salesExec.name,
          amName: 'AM User', // Default AM name
          salesShare,
          amShare,
          notes
        });
      });
    });

    return res.json(reports);
  } catch (error) {
    console.error('Error generating attribution report:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
