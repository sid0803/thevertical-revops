// backend/src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start with an insecure configuration.');
}

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return user details without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamLeaderId: user.teamLeaderId,
    };

    return res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side clears localStorage, server acknowledges)
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user info
router.get('/me', verifyToken, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
