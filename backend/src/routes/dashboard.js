// backend/src/routes/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary metrics, funnels, and leaderboard
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { from, to, userId } = req.query;

    // Build filters
    let leadWhere = {};
    let invoiceWhere = {};
    let activityWhere = {};

    if (userId) {
      leadWhere.assignedToId = userId;
    }
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      
      leadWhere.createdAt = dateFilter;
      invoiceWhere.createdAt = dateFilter;
      activityWhere.createdAt = dateFilter;
    }

    // 1. Fetch leads counts
    const totalLeads = await prisma.lead.count({ where: leadWhere });
    const leads = await prisma.lead.findMany({
      where: leadWhere,
      select: { stage: true }
    });

    const leadsByStage = {
      NEW: 0,
      INTERESTED: 0,
      PROPOSAL_SHARED: 0,
      PAYMENT_COMPLETED: 0,
      RNR_DNP: 0,
      NOT_INTERESTED: 0
    };

    leads.forEach(l => {
      if (leadsByStage[l.stage] !== undefined) {
        leadsByStage[l.stage] += 1;
      }
    });

    // 2. Calculate conversion %
    const convertedCount = leadsByStage.PAYMENT_COMPLETED;
    const conversionRate = totalLeads > 0 ? parseFloat(((convertedCount / totalLeads) * 100).toFixed(1)) : 0.0;

    // 3. Billing metrics
    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: { payments: true }
    });

    let totalRevenue = 0;
    let cashCollected = 0;
    let pendingInvoices = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.totalAmount;
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      cashCollected += paid;
      if (inv.status !== 'PAID') {
        pendingInvoices += 1;
      }
    });

    // 4. Overdue SLA Handoffs
    const overdueHandoffs = await prisma.handoff.count({
      where: {
        OR: [
          { status: 'BREACHED' },
          { slaBreached: true }
        ]
      }
    });

    // 5. Leaderboard / Team performance
    // Query users who are SALES_EXEC or TEAM_LEADER
    const salesUsers = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_EXEC', 'TEAM_LEADER'] }
      },
      select: {
        id: true,
        name: true,
        role: true,
        leads: {
          select: {
            stage: true,
            client: {
              include: {
                invoices: true
              }
            }
          }
        }
      }
    });

    const teamPerformance = salesUsers.map(user => {
      const userLeads = user.leads;
      const total = userLeads.length;
      const converted = userLeads.filter(l => l.stage === 'PAYMENT_COMPLETED').length;
      
      let revenue = 0;
      userLeads.forEach(l => {
        if (l.client && l.client.invoices) {
          l.client.invoices.forEach(inv => {
            revenue += inv.totalAmount;
          });
        }
      });

      return {
        name: user.name,
        role: user.role === 'TEAM_LEADER' ? 'Team Lead' : 'Sales Rep',
        leads: total,
        converted,
        conversionRate: total > 0 ? parseFloat(((converted / total) * 100).toFixed(1)) : 0.0,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue); // Rank by revenue

    // 6. Recent global activities
    const recentActivities = await prisma.leadActivity.findMany({
      where: activityWhere,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        lead: { select: { id: true, name: true } }
      }
    });

    return res.json({
      totalLeads,
      leadsByStage,
      conversionRate,
      totalRevenue,
      cashCollected,
      pendingInvoices,
      overdueHandoffs,
      teamPerformance,
      recentActivities
    });

  } catch (error) {
    console.error('Error compiling dashboard summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
