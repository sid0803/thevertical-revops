// backend/src/routes/users.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/users
// @desc    Get all users
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamLeaderId: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Admin only)
router.post('/', verifyToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, teamLeaderId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        teamLeaderId: teamLeaderId || null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamLeaderId: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (Admin only)
router.put('/:id', verifyToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, teamLeaderId } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(teamLeaderId !== undefined && { teamLeaderId: teamLeaderId || null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamLeaderId: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Toggle user active status (Admin only)
router.put('/:id/status', verifyToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : !existing.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamLeaderId: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
