// backend/src/routes/tasks.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, checkLeadAccess } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: auto-flag overdue tasks
async function flagOverdueTasks() {
  const now = new Date();
  await prisma.task.updateMany({
    where: { isCompleted: false, isOverdue: false, dueDate: { lt: now } },
    data: { isOverdue: true }
  });
}

// @route   GET /api/tasks?leadId=xxx
// @desc    Get all tasks for a lead, grouped by overdue/today/upcoming
router.get('/', verifyToken, async (req, res) => {
  try {
    await flagOverdueTasks();

    const { leadId } = req.query;
    if (!leadId) return res.status(400).json({ message: 'leadId is required' });

    const hasAccess = await checkLeadAccess(leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const tasks = await prisma.task.findMany({
      where: { leadId },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(now); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setHours(23, 59, 59, 999);

    const grouped = {
      overdue: tasks.filter(t => t.isOverdue && !t.isCompleted),
      today: tasks.filter(t => !t.isOverdue && !t.isCompleted && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd),
      tomorrow: tasks.filter(t => !t.isCompleted && new Date(t.dueDate) >= tomorrowStart && new Date(t.dueDate) <= tomorrowEnd),
      upcoming: tasks.filter(t => !t.isCompleted && new Date(t.dueDate) > tomorrowEnd),
      completed: tasks.filter(t => t.isCompleted)
    };

    return res.json({ tasks, grouped });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get all overdue tasks for the current rep (for dashboard widget)
router.get('/overdue', verifyToken, async (req, res) => {
  try {
    await flagOverdueTasks();

    let whereClause = { isOverdue: true, isCompleted: false };

    if (!['SUPER_ADMIN', 'MANAGER', 'FINANCE', 'ACCOUNT_MANAGER'].includes(req.user.role)) {
      whereClause.assignedToId = req.user.id;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        lead: { select: { id: true, name: true, companyName: true, stage: true } },
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task for a lead
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { leadId, title, description, taskType, dueDate, assignedToId } = req.body;

    if (!leadId || !title || !dueDate) {
      return res.status(400).json({ message: 'leadId, title, and dueDate are required' });
    }

    const hasAccess = await checkLeadAccess(leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this lead record' });
    }

    const due = new Date(dueDate);
    const isOverdue = due < new Date();

    const task = await prisma.task.create({
      data: {
        leadId,
        title,
        description,
        taskType: taskType || 'FOLLOW_UP',
        dueDate: due,
        isOverdue,
        assignedToId: assignedToId || req.user.id
      },
      include: { assignedTo: { select: { id: true, name: true } } }
    });

    // Log as activity on the lead
    await prisma.leadActivity.create({
      data: {
        leadId, userId: req.user.id, type: 'NOTE',
        description: `📋 Task created: "${title}" — due ${due.toLocaleDateString('en-IN')}`
      }
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id/complete
// @desc    Mark a task as completed
router.put('/:id/complete', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { lead: { select: { id: true } } }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasAccess = await checkLeadAccess(task.leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this task record' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date(), isOverdue: false }
    });

    // Log completion on lead activity
    await prisma.leadActivity.create({
      data: {
        leadId: task.lead.id, userId: req.user.id, type: 'NOTE',
        description: `✅ Task completed: "${task.title}"`
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task details
router.put('/:id', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasAccess = await checkLeadAccess(task.leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this task record' });
    }

    const { title, description, taskType, dueDate, assignedToId } = req.body;

    const due = dueDate ? new Date(dueDate) : undefined;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(taskType && { taskType }),
        ...(due && { dueDate: due, isOverdue: due < new Date() }),
        ...(assignedToId && { assignedToId })
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
router.delete('/:id', verifyToken, requireRoles('SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const hasAccess = await checkLeadAccess(task.leadId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this task record' });
    }

    await prisma.task.delete({ where: { id } });
    return res.json({ message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
