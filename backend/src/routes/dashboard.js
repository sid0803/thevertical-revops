// backend/src/routes/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary metrics, funnels, and leaderboard
router.get('/summary', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
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
      DISCOVERY_CALL: 0,
      DEMO: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WIN: 0,
      LOSS: 0
    };

    leads.forEach(l => {
      if (leadsByStage[l.stage] !== undefined) {
        leadsByStage[l.stage] += 1;
      }
    });

    // 2. Calculate conversion %
    const convertedCount = leadsByStage.WIN;
    const conversionRate = totalLeads > 0 ? parseFloat(((convertedCount / totalLeads) * 100).toFixed(1)) : 0.0;

    // 3. Billing metrics
    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: { slabs: true }
    });

    let totalRevenue = 0;
    let cashCollected = 0;
    let pendingInvoices = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.totalAmount;
      const paid = inv.slabs.filter(s => s.isPaid).reduce((sum, s) => sum + s.amount, 0);
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
        assignedLeads: {
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
      const userLeads = user.assignedLeads;
      const total = userLeads.length;
      const converted = userLeads.filter(l => l.stage === 'WIN').length;
      
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

    // 7. Dynamic AI Insights compiled from active DB state
    const allLeads = await prisma.lead.findMany({
      include: {
        activities: true,
        client: { include: { commitment: true } }
      }
    });

    const aiInsights = [];

    // Insight 1: Lead Scoring (based on talk-time duration)
    const activeLeadsWithCalls = allLeads
      .filter(l => l.stage !== 'WIN' && l.stage !== 'LOSS')
      .map(l => {
        const totalDuration = l.activities
          .filter(a => a.type === 'CALL')
          .reduce((sum, a) => sum + (a.callDuration || 0), 0);
        return { lead: l, totalDuration };
      })
      .filter(x => x.totalDuration > 0)
      .sort((a, b) => b.totalDuration - a.totalDuration);

    if (activeLeadsWithCalls.length > 0) {
      const topLead = activeLeadsWithCalls[0];
      const probability = Math.min(97, 45 + Math.round(topLead.totalDuration / 12));
      const mins = Math.round(topLead.totalDuration / 60);
      aiInsights.push({
        type: 'lead_score',
        title: 'AI Lead Scoring',
        color: 'text-sky-400',
        content: `${topLead.lead.name} has a ${probability}% conversion probability based on ${mins} mins of logged call activity.`
      });
    } else {
      aiInsights.push({
        type: 'lead_score',
        title: 'AI Lead Scoring',
        color: 'text-sky-400',
        content: 'Qualify more leads with call interactions to unlock predictive scoring models.'
      });
    }

    // Insight 2: Follow-up prompts (leads stuck in PROPOSAL_SHARED)
    const proposalLeads = allLeads.filter(l => l.stage === 'PROPOSAL');
    if (proposalLeads.length > 0) {
      const oldestProposal = proposalLeads.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))[0];
      const days = Math.max(1, Math.round((new Date() - new Date(oldestProposal.updatedAt)) / (1000 * 60 * 60 * 24)));
      aiInsights.push({
        type: 'follow_up',
        title: 'AI Follow-up Prompt',
        color: 'text-accent-blue',
        content: `Lead ${oldestProposal.name} has been stuck in PROPOSAL_SHARED stage for ${days} days. Action Required: follow up on outstanding proposal.`
      });
    } else {
      aiInsights.push({
        type: 'follow_up',
        title: 'AI Follow-up Prompt',
        color: 'text-accent-blue',
        content: 'No leads currently stuck in proposal stage. Keep pushing active opportunities.'
      });
    }

    // Insight 3: Deal Risk Alert (Leads stuck in NEW or INTERESTED with no activities)
    const stuckLeads = allLeads.filter(l => 
      ['DISCOVERY_CALL', 'DEMO'].includes(l.stage) &&
      (l.activities.length === 0 || (new Date() - new Date(l.updatedAt)) / (1000 * 60 * 60 * 24) > 3)
    );

    if (stuckLeads.length > 0) {
      const topStuck = stuckLeads[0];
      const days = Math.max(1, Math.round((new Date() - new Date(topStuck.updatedAt)) / (1000 * 60 * 60 * 24)));
      aiInsights.push({
        type: 'risk_alert',
        title: 'AI Deal Risk Alert',
        color: 'text-red-400',
        content: `${topStuck.name} is flagged as STUCK. Lead has been inactive for ${days} days with no recent updates.`
      });
    } else {
      aiInsights.push({
        type: 'risk_alert',
        title: 'AI Deal Risk Alert',
        color: 'text-red-400',
        content: 'Risk index is optimal. All active pipelines are moving sequentially.'
      });
    }

    // Insight 4: Expansion Predictor (based on commitments of active clients)
    const clientsWithCommitments = allLeads
      .filter(l => l.client?.commitment)
      .map(l => l.client);

    if (clientsWithCommitments.length > 0) {
      const client = clientsWithCommitments[0];
      const commitment = client.commitment;
      const outstandingVal = commitment.revenueCommitment - commitment.actualRevenue;
      const days = Math.max(0, Math.round((new Date(commitment.windowEnd) - new Date()) / (1000 * 60 * 60 * 24)));
      
      if (outstandingVal > 0) {
        aiInsights.push({
          type: 'expansion',
          title: 'AI Expansion Predictor',
          color: 'text-green-400',
          content: `${client.companyName} has an outstanding ₹${outstandingVal.toLocaleString('en-IN')} target under 60-day SLA window. ${days} days remaining to close.`
        });
      } else {
        aiInsights.push({
          type: 'expansion',
          title: 'AI Expansion Predictor',
          color: 'text-green-400',
          content: `Revenue targets fully achieved for ${client.companyName} within active SLA window.`
        });
      }
    } else {
      aiInsights.push({
        type: 'expansion',
        title: 'AI Expansion Predictor',
        color: 'text-green-400',
        content: 'No active SLA commitments found. Convert payments to begin tracking expansion attribution.'
      });
    }

    return res.json({
      totalLeads,
      leadsByStage,
      conversionRate,
      totalRevenue,
      cashCollected,
      pendingInvoices,
      overdueHandoffs,
      teamPerformance,
      recentActivities,
      aiInsights
    });

  } catch (error) {
    console.error('Error compiling dashboard summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
