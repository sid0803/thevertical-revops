// backend/src/routes/targets.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get start and end dates for a month string (e.g. "2026-05")
function getMonthDateRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// @route   GET /api/targets
// @desc    Get targets
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { month } = req.query;

    const where = {};
    if (month) {
      where.month = month;
    }

    if (role === 'TEAM_LEADER') {
      where.assignedById = userId;
    } else if (role === 'SALES_EXEC') {
      where.assignedToId = userId;
    }

    const targets = await prisma.target.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { month: 'desc' }
    });

    return res.json(targets);
  } catch (error) {
    console.error('Error fetching targets:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/targets
// @desc    Create or update target (Team Leaders, Managers, Admins)
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'), async (req, res) => {
  try {
    const { assignedToId, month, callTarget, talkTimeTarget, revenueTarget, leadTarget } = req.body;
    const { id: loggedInUserId, role: loggedInUserRole } = req.user;

    if (!assignedToId || !month) {
      return res.status(400).json({ message: 'Assigned user and month are required' });
    }

    // Verify target user is a Sales Exec and team member (if logged in user is TEAM_LEADER)
    const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser.role !== 'SALES_EXEC') {
      return res.status(400).json({ message: 'Targets can only be set for SALES_EXEC users' });
    }

    if (loggedInUserRole === 'TEAM_LEADER' && targetUser.teamLeaderId !== loggedInUserId) {
      return res.status(403).json({ message: 'You can only set targets for sales reps in your team' });
    }

    const target = await prisma.target.upsert({
      where: {
        assignedToId_month: {
          assignedToId,
          month
        }
      },
      update: {
        assignedById: loggedInUserId,
        callTarget: parseInt(callTarget) || 0,
        talkTimeTarget: parseInt(talkTimeTarget) || 0,
        revenueTarget: parseFloat(revenueTarget) || 0,
        leadTarget: parseInt(leadTarget) || 0
      },
      create: {
        assignedToId,
        assignedById: loggedInUserId,
        month,
        callTarget: parseInt(callTarget) || 0,
        talkTimeTarget: parseInt(talkTimeTarget) || 0,
        revenueTarget: parseFloat(revenueTarget) || 0,
        leadTarget: parseInt(leadTarget) || 0
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } }
      }
    });

    return res.json(target);
  } catch (error) {
    console.error('Error setting target:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/targets/progress
// @desc    Get progress actuals vs targets for a specific user & month
router.get('/progress', verifyToken, async (req, res) => {
  try {
    const { id: loggedInUserId, role: loggedInUserRole } = req.user;
    const userId = req.query.userId || loggedInUserId;
    const month = req.query.month || new Date().toISOString().substring(0, 7); // YYYY-MM

    // Authorization checks
    if (userId !== loggedInUserId && !['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(loggedInUserRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (loggedInUserRole === 'TEAM_LEADER') {
      const rep = await prisma.user.findUnique({ where: { id: userId } });
      if (rep && rep.teamLeaderId !== loggedInUserId && userId !== loggedInUserId) {
        return res.status(403).json({ message: 'Access denied for team members outside your team' });
      }
    }

    const { startDate, endDate } = getMonthDateRange(month);

    // Get Target
    const target = await prisma.target.findUnique({
      where: {
        assignedToId_month: {
          assignedToId: userId,
          month
        }
      }
    }) || {
      callTarget: 0,
      talkTimeTarget: 0,
      revenueTarget: 0,
      leadTarget: 0
    };

    // Calculate actual calls & call duration
    const callActivities = await prisma.leadActivity.findMany({
      where: {
        userId,
        type: 'CALL',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const actualCalls = callActivities.length;
    const actualTalkTime = Math.round(
      callActivities.reduce((sum, act) => sum + (act.callDuration || 0), 0) / 60
    ); // in minutes

    // Calculate lead conversions (Stage PAYMENT_COMPLETED or lead activities transitioning to PAYMENT_COMPLETED)
    const convertedLeadsCount = await prisma.lead.count({
      where: {
        assignedToId: userId,
        stage: 'WIN',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate actual revenue collected from paid invoices belonging to leads owned by this rep
    const paidSlabs = await prisma.paymentSlab.findMany({
      where: {
        isPaid: true,
        paidAt: {
          gte: startDate,
          lte: endDate
        },
        invoice: {
          client: {
            lead: {
              assignedToId: userId
            }
          }
        }
      }
    });

    const actualRevenue = paidSlabs.reduce((sum, slab) => sum + slab.amount, 0);

    return res.json({
      month,
      userId,
      target: {
        callTarget: target.callTarget,
        talkTimeTarget: target.talkTimeTarget,
        revenueTarget: target.revenueTarget,
        leadTarget: target.leadTarget
      },
      actual: {
        calls: actualCalls,
        talkTime: actualTalkTime, // minutes
        leads: convertedLeadsCount,
        revenue: actualRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching progress actuals:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/targets/team
// @desc    Get progress details for all reps under a Team Leader or in system
router.get('/team', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'), async (req, res) => {
  try {
    const { id: loggedInUserId, role: loggedInUserRole } = req.user;
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    // Get list of sales reps
    const where = { role: 'SALES_EXEC' };
    if (loggedInUserRole === 'TEAM_LEADER') {
      where.teamLeaderId = loggedInUserId;
    }

    const reps = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });

    const { startDate, endDate } = getMonthDateRange(month);

    const teamProgress = await Promise.all(
      reps.map(async (rep) => {
        const target = await prisma.target.findUnique({
          where: {
            assignedToId_month: {
              assignedToId: rep.id,
              month
            }
          }
        }) || {
          callTarget: 0,
          talkTimeTarget: 0,
          revenueTarget: 0,
          leadTarget: 0
        };

        const callActivities = await prisma.leadActivity.findMany({
          where: {
            userId: rep.id,
            type: 'CALL',
            createdAt: { gte: startDate, lte: endDate }
          }
        });

        const actualCalls = callActivities.length;
        const actualTalkTime = Math.round(
          callActivities.reduce((sum, act) => sum + (act.callDuration || 0), 0) / 60
        );

        const convertedLeadsCount = await prisma.lead.count({
          where: {
            assignedToId: rep.id,
            stage: 'WIN',
            updatedAt: { gte: startDate, lte: endDate }
          }
        });

        const paidSlabs = await prisma.paymentSlab.findMany({
          where: {
            isPaid: true,
            paidAt: { gte: startDate, lte: endDate },
            invoice: {
              client: {
                lead: {
                  assignedToId: rep.id
                }
              }
            }
          }
        });

        const actualRevenue = paidSlabs.reduce((sum, slab) => sum + slab.amount, 0);

        return {
          rep: { id: rep.id, name: rep.name, email: rep.email },
          target,
          actual: {
            calls: actualCalls,
            talkTime: actualTalkTime,
            leads: convertedLeadsCount,
            revenue: actualRevenue
          }
        };
      })
    );

    return res.json(teamProgress);
  } catch (error) {
    console.error('Error fetching team progress:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
