// backend/src/routes/cadences.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/cadences/active-tasks
// @desc    Get all active cadence tasks due for the logged-in user
router.get('/active-tasks', verifyToken, async (req, res) => {
  try {
    const enrollments = await prisma.leadCadence.findMany({
      where: {
        status: 'ACTIVE',
        lead: {
          assignedToId: req.user.id
        }
      },
      include: {
        lead: true,
        cadence: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' }
            }
          }
        }
      }
    });

    const activeTasks = enrollments.map(enr => {
      const currentStep = enr.cadence.steps.find(s => s.stepNumber === enr.currentStepNumber);
      const triggerDate = new Date(enr.lastStepTriggeredAt);
      triggerDate.setDate(triggerDate.getDate() + (currentStep?.delayDays || 0));
      const isDue = triggerDate <= new Date();

      return {
        id: enr.id,
        lead: enr.lead,
        cadenceName: enr.cadence.name,
        stepNumber: enr.currentStepNumber,
        totalSteps: enr.cadence.steps.length,
        stepType: currentStep?.type || 'CALL',
        template: currentStep?.template || '',
        isDue,
        dueDate: triggerDate
      };
    });

    return res.json(activeTasks);
  } catch (e) {
    console.error('Error fetching active cadence tasks:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cadences
// @desc    List all cadences
router.get('/', verifyToken, async (req, res) => {
  try {
    const cadences = await prisma.cadence.findMany({
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    });
    return res.json(cadences);
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cadences
// @desc    Create a sequence with steps
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER'), async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const newCadence = await prisma.cadence.create({
      data: {
        name,
        description,
        steps: {
          create: (steps || []).map((step, idx) => ({
            stepNumber: idx + 1,
            type: step.type || 'CALL',
            delayDays: parseInt(step.delayDays || 0),
            template: step.template || ''
          }))
        }
      },
      include: { steps: true }
    });

    return res.status(201).json(newCadence);
  } catch (e) {
    console.error('Error creating cadence:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cadences/:id/enroll
// @desc    Enroll leads into a sequence
router.post('/:id/enroll', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: 'leadIds array is required' });
    }

    const enrollments = [];
    for (const leadId of leadIds) {
      try {
        const enr = await prisma.leadCadence.upsert({
          where: {
            leadId_cadenceId: { leadId, cadenceId: id }
          },
          update: {
            currentStepNumber: 1,
            status: 'ACTIVE',
            lastStepTriggeredAt: new Date()
          },
          create: {
            leadId,
            cadenceId: id,
            currentStepNumber: 1,
            status: 'ACTIVE',
            lastStepTriggeredAt: new Date()
          }
        });
        enrollments.push(enr);
      } catch (err) {
        console.error(`Failed to enroll lead ${leadId}:`, err);
      }
    }

    return res.json({ message: `Successfully enrolled ${enrollments.length} leads.`, enrollments });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cadences/enrollments/:id/step
// @desc    Progress enrollment step or update status
router.put('/enrollments/:id/step', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enrollment = await prisma.leadCadence.findUnique({
      where: { id },
      include: { cadence: { include: { steps: true } } }
    });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (status) {
      const updated = await prisma.leadCadence.update({
        where: { id },
        data: { status }
      });
      return res.json(updated);
    }

    const totalSteps = enrollment.cadence.steps.length;
    if (enrollment.currentStepNumber >= totalSteps) {
      const updated = await prisma.leadCadence.update({
        where: { id },
        data: { status: 'COMPLETED', updatedAt: new Date() }
      });
      return res.json({ message: 'Cadence completed', enrollment: updated });
    } else {
      const updated = await prisma.leadCadence.update({
        where: { id },
        data: {
          currentStepNumber: enrollment.currentStepNumber + 1,
          lastStepTriggeredAt: new Date(),
          updatedAt: new Date()
        }
      });
      return res.json({ message: 'Moved to next step', enrollment: updated });
    }
  } catch (e) {
    console.error('Error updating enrollment step:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
