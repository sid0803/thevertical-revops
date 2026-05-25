// backend/src/routes/proposals.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to calculate totals for a proposal
function calculateProposalTotals(lineItems, gstRate) {
  let oneTimeTotal = 0;
  let monthlyTotal = 0;
  let consumptionTotal = 0;

  const processedItems = lineItems.map((item, idx) => {
    const qty = parseFloat(item.qty) || 0;
    const costPerUnit = parseFloat(item.costPerUnit) || 0;
    const totalAmount = qty * costPerUnit;

    if (item.billingType === 'ONE_TIME') {
      oneTimeTotal += totalAmount;
    } else if (item.billingType === 'MONTHLY') {
      monthlyTotal += totalAmount;
    } else if (item.billingType === 'CONSUMPTION') {
      consumptionTotal += totalAmount;
    }

    return {
      sortOrder: item.sortOrder || idx + 1,
      component: item.component,
      description: item.description || '',
      qty,
      costPerUnit,
      totalAmount,
      billingType: item.billingType
    };
  });

  const subtotal = oneTimeTotal + monthlyTotal + consumptionTotal;
  const rate = parseFloat(gstRate) || 0;
  const gstAmount = subtotal * (rate / 100);
  const grandTotal = subtotal + gstAmount;

  return {
    oneTimeTotal,
    monthlyTotal,
    consumptionTotal,
    subtotal,
    gstAmount,
    grandTotal,
    processedItems
  };
}

// @route   GET /api/proposals
// @desc    Get all proposals with client info
router.get('/', verifyToken, async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/proposals/:id
// @desc    Get single proposal with line items
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'new' || id.length < 10) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    return res.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal detail:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/proposals
// @desc    Create a new proposal
router.post('/', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { clientId, clientName, validityDays, gstRate, notes, lineItems } = req.body;

    if (!clientName && !clientId) {
      return res.status(400).json({ message: 'Client name or Client reference is required' });
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ message: 'At least one line item is required' });
    }

    let finalClientName = clientName;
    if (clientId) {
      const clientObj = await prisma.client.findUnique({ where: { id: clientId } });
      if (clientObj) {
        finalClientName = clientObj.companyName;
      }
    }

    // Auto-generate proposalNumber: PROP-YYYY-MM-XXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `PROP-${year}-${month}-`;

    const lastProposal = await prisma.proposal.findFirst({
      where: { proposalNumber: { startsWith: prefix } },
      orderBy: { proposalNumber: 'desc' }
    });

    let seq = 1;
    if (lastProposal) {
      const parts = lastProposal.proposalNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }
    const proposalNumber = `${prefix}${String(seq).padStart(4, '0')}`;

    // Calculate totals
    const totals = calculateProposalTotals(lineItems, gstRate);

    // Database transaction
    const result = await prisma.$transaction(async (tx) => {
      const newProposal = await tx.proposal.create({
        data: {
          proposalNumber,
          clientId: clientId || null,
          clientName: finalClientName,
          validityDays: parseInt(validityDays) || 15,
          oneTimeTotal: totals.oneTimeTotal,
          monthlyTotal: totals.monthlyTotal,
          consumptionTotal: totals.consumptionTotal,
          subtotal: totals.subtotal,
          gstRate: parseFloat(gstRate) || 18,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
          status: 'DRAFT',
          notes
        }
      });

      const itemsData = totals.processedItems.map(item => ({
        proposalId: newProposal.id,
        sortOrder: item.sortOrder,
        component: item.component,
        description: item.description,
        qty: item.qty,
        costPerUnit: item.costPerUnit,
        totalAmount: item.totalAmount,
        billingType: item.billingType
      }));

      await tx.proposalItem.createMany({
        data: itemsData
      });

      return tx.proposal.findUnique({
        where: { id: newProposal.id },
        include: { lineItems: true }
      });
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/proposals/:id
// @desc    Update a proposal and its line items
router.put('/:id', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'new' || id.length < 10) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }
    const { clientId, clientName, validityDays, gstRate, notes, status, lineItems } = req.body;

    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      include: { lineItems: true }
    });

    if (!existingProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (existingProposal.status === 'ACCEPTED') {
      return res.status(400).json({ message: 'Cannot edit an already accepted proposal' });
    }

    let finalClientName = clientName || existingProposal.clientName;
    if (clientId) {
      const clientObj = await prisma.client.findUnique({ where: { id: clientId } });
      if (clientObj) {
        finalClientName = clientObj.companyName;
      }
    }

    let totals = {
      oneTimeTotal: existingProposal.oneTimeTotal,
      monthlyTotal: existingProposal.monthlyTotal,
      consumptionTotal: existingProposal.consumptionTotal,
      subtotal: existingProposal.subtotal,
      gstAmount: existingProposal.gstAmount,
      grandTotal: existingProposal.grandTotal,
      processedItems: []
    };

    const hasLineItems = lineItems && Array.isArray(lineItems) && lineItems.length > 0;
    if (hasLineItems) {
      totals = calculateProposalTotals(lineItems, gstRate !== undefined ? gstRate : existingProposal.gstRate);
    } else if (gstRate !== undefined) {
      // Just recalculate GST on existing items
      const existingItems = existingProposal.lineItems;
      totals = calculateProposalTotals(existingItems, gstRate);
    }

    const updatedProposal = await prisma.$transaction(async (tx) => {
      if (hasLineItems) {
        // Delete existing items
        await tx.proposalItem.deleteMany({ where: { proposalId: id } });

        // Create new ones
        const itemsData = totals.processedItems.map(item => ({
          proposalId: id,
          sortOrder: item.sortOrder,
          component: item.component,
          description: item.description,
          qty: item.qty,
          costPerUnit: item.costPerUnit,
          totalAmount: item.totalAmount,
          billingType: item.billingType
        }));

        await tx.proposalItem.createMany({
          data: itemsData
        });
      }

      return tx.proposal.update({
        where: { id },
        data: {
          clientId: clientId !== undefined ? (clientId || null) : existingProposal.clientId,
          clientName: finalClientName,
          validityDays: validityDays !== undefined ? parseInt(validityDays) : existingProposal.validityDays,
          oneTimeTotal: totals.oneTimeTotal,
          monthlyTotal: totals.monthlyTotal,
          consumptionTotal: totals.consumptionTotal,
          subtotal: totals.subtotal,
          gstRate: gstRate !== undefined ? parseFloat(gstRate) : existingProposal.gstRate,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
          status: status || existingProposal.status,
          notes: notes !== undefined ? notes : existingProposal.notes
        },
        include: { lineItems: true }
      });
    });

    return res.json(updatedProposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/proposals/:id/send
// @desc    Mark proposal as sent
router.post('/:id/send', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'new' || id.length < 10) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }
    const proposal = await prisma.proposal.findUnique({ where: { id } });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: 'SENT' }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error sending proposal:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/proposals/:id/convert
// @desc    Convert accepted proposal to live invoice (creates default 50/50 payment slabs)
router.post('/:id/convert', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'new' || id.length < 10) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (!proposal.clientId) {
      return res.status(400).json({ message: 'Cannot convert proposal without an assigned client account. Link a client first.' });
    }

    // Auto-generate invoiceNumber: INV-YYYY-MM-XXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}-${month}-`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' }
    });

    let seq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }
    const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;

    const newInvoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: proposal.clientId,
          baseAmount: proposal.subtotal,
          gstRate: proposal.gstRate,
          gstAmount: proposal.gstAmount,
          totalAmount: proposal.grandTotal,
          paidAmount: 0.0,
          outstandingAmount: proposal.grandTotal,
          status: 'DRAFT',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          notes: `Converted from Proposal ${proposal.proposalNumber}. ${proposal.notes || ''}`
        }
      });

      // 2. Create default 50/50 slabs
      const slabAmt = proposal.grandTotal * 0.5;
      await tx.paymentSlab.create({
        data: {
          invoiceId: invoice.id,
          slabNumber: 1,
          percentage: 50.0,
          amount: slabAmt,
          dueDate: new Date()
        }
      });

      await tx.paymentSlab.create({
        data: {
          invoiceId: invoice.id,
          slabNumber: 2,
          percentage: 50.0,
          amount: slabAmt,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15))
        }
      });

      // 3. Mark proposal as ACCEPTED
      await tx.proposal.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      });

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { slabs: true, client: true }
      });
    });

    return res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error converting proposal to invoice:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
