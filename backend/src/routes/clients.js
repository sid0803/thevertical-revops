// backend/src/routes/clients.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/clients
// @desc    Get all active client accounts
router.get('/', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'ACCOUNT_MANAGER', 'FINANCE'), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        lead: {
          select: { name: true, phone: true, email: true, stage: true, assignedTo: { select: { name: true } } }
        },
        handoff: true,
        commitment: true,
        invoices: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
