// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamLeaderId: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or session invalid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export async function getAccessibleUserIds(user) {
  if (['SUPER_ADMIN', 'MANAGER', 'FINANCE', 'ACCOUNT_MANAGER'].includes(user.role)) {
    return null; // Can see everything
  }
  if (user.role === 'TEAM_LEADER') {
    const members = await prisma.user.findMany({
      where: { teamLeaderId: user.id },
      select: { id: true }
    });
    return [...members.map(m => m.id), user.id];
  }
  if (user.role === 'SALES_EXEC') {
    return [user.id];
  }
  return [];
}

export async function checkLeadAccess(leadId, user) {
  if (!leadId) return false;
  const userIds = await getAccessibleUserIds(user);
  if (userIds === null) return true; // Has access to all

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true }
  });
  if (!lead) return false;

  return userIds.includes(lead.assignedToId);
}

