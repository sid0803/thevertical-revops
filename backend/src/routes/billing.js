// backend/src/routes/billing.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to recalculate invoice paid/outstanding amounts and status
async function syncInvoiceTotals(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { slabs: true }
  });

  const paidAmount = invoice.slabs.filter(s => s.isPaid).reduce((sum, s) => sum + s.amount, 0);
  const outstandingAmount = Math.max(0, invoice.totalAmount - paidAmount);

  let status = 'DRAFT';
  if (paidAmount >= invoice.totalAmount) {
    status = 'PAID';
  } else if (paidAmount > 0) {
    status = 'PARTIALLY_PAID';
  }

  // Check if past due date and outstanding > 0
  if (status !== 'PAID' && invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
    status = 'OVERDUE';
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, outstandingAmount, status },
    include: { slabs: true }
  });

  // Sync actualRevenue on Client's Commitment
  const client = await prisma.client.findUnique({
    where: { id: invoice.clientId },
    include: { commitment: true, invoices: { include: { slabs: true } } }
  });

  if (client?.commitment) {
    let totalPaidRevenue = 0;
    client.invoices.forEach(inv => {
      inv.slabs.forEach(s => {
        if (s.isPaid) {
          totalPaidRevenue += s.amount;
        }
      });
    });

    await prisma.commitment.update({
      where: { id: client.commitment.id },
      data: { actualRevenue: totalPaidRevenue }
    });
  }

  return updatedInvoice;
}

// @route   GET /api/billing/invoices
// @desc    Get all invoices with query filters
router.get('/invoices', verifyToken, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true }
        },
        slabs: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check due dates and update status to OVERDUE if needed
    const now = new Date();
    const updatedInvoices = await Promise.all(invoices.map(async (inv) => {
      if (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now && inv.status !== 'OVERDUE') {
        return await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: 'OVERDUE' },
          include: { client: { select: { id: true, companyName: true, contactName: true } }, slabs: true }
        });
      }
      return inv;
    }));

    return res.json(updatedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/invoices
// @desc    Create a new invoice + 2 default 50/50 slabs
router.post('/invoices', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { clientId, baseAmount, gstRate, dueDate, notes } = req.body;

    if (!clientId || baseAmount === undefined || gstRate === undefined) {
      return res.status(400).json({ message: 'Client, base amount, and GST rate are required' });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const base = parseFloat(baseAmount);
    const rate = parseFloat(gstRate);
    const gstAmount = base * (rate / 100);
    const totalAmount = base + gstAmount;

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

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        baseAmount: base,
        gstRate: rate,
        gstAmount,
        totalAmount,
        paidAmount: 0.0,
        outstandingAmount: totalAmount,
        status: 'DRAFT',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes
      }
    });

    // Create default slabs: 50% upfront, 50% balance
    const slabAmt = totalAmount * 0.5;
    await prisma.paymentSlab.create({
      data: {
        invoiceId: newInvoice.id,
        slabNumber: 1,
        percentage: 50.0,
        amount: slabAmt,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    await prisma.paymentSlab.create({
      data: {
        invoiceId: newInvoice.id,
        slabNumber: 2,
        percentage: 50.0,
        amount: slabAmt,
        dueDate: dueDate ? new Date(new Date(dueDate).setDate(new Date(dueDate).getDate() + 15)) : null
      }
    });

    const populatedInvoice = await prisma.invoice.findUnique({
      where: { id: newInvoice.id },
      include: { slabs: true, client: true }
    });

    return res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/billing/invoices/:id
// @desc    Get invoice details + slabs + client details
router.get('/invoices/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true, phone: true, email: true }
        },
        slabs: { orderBy: { slabNumber: 'asc' } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/billing/invoices/:id/slabs
// @desc    Overwrite all slabs (validates total percentages <= 100%)
router.put('/invoices/:id/slabs', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { slabs } = req.body; // Array: [{ slabNumber, percentage, amount, dueDate, isPaid, paidAt, paymentNote }]

    if (!slabs || !Array.isArray(slabs)) {
      return res.status(400).json({ message: 'Slabs array is required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { slabs: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if any paid slabs are being deleted or edited
    const paidSlabs = invoice.slabs.filter(s => s.isPaid);
    for (const paid of paidSlabs) {
      const match = slabs.find(s => s.id === paid.id);
      if (!match) {
        return res.status(400).json({ message: `Cannot delete a paid slab (Slab #${paid.slabNumber})` });
      }
      if (Math.abs(match.amount - paid.amount) > 0.01) {
        return res.status(400).json({ message: `Cannot modify the amount of a paid slab (Slab #${paid.slabNumber})` });
      }
    }

    // Validate sum of percentages <= 100%
    const totalPercentage = slabs.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
    if (totalPercentage > 100.01) {
      return res.status(400).json({ message: `Total slab percentages (${totalPercentage}%) cannot exceed 100%` });
    }

    // Wipe unpaid slabs
    await prisma.paymentSlab.deleteMany({
      where: {
        invoiceId: id,
        isPaid: false
      }
    });

    // Create new ones or update
    for (const slab of slabs) {
      const percentValue = parseFloat(slab.percentage);
      const amountValue = invoice.totalAmount * (percentValue / 100);

      if (slab.id) {
        // Update existing paid/unpaid slab
        await prisma.paymentSlab.update({
          where: { id: slab.id },
          data: {
            slabNumber: parseInt(slab.slabNumber),
            percentage: percentValue,
            amount: amountValue,
            dueDate: slab.dueDate ? new Date(slab.dueDate) : null,
            paymentNote: slab.paymentNote
          }
        });
      } else {
        // Create new slab
        await prisma.paymentSlab.create({
          data: {
            invoiceId: id,
            slabNumber: parseInt(slab.slabNumber),
            percentage: percentValue,
            amount: amountValue,
            dueDate: slab.dueDate ? new Date(slab.dueDate) : null,
            isPaid: false,
            paymentNote: slab.paymentNote
          }
        });
      }
    }

    const updated = await syncInvoiceTotals(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error overwriting slabs:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/invoices/:id/slabs/:slabId/pay
// @desc    Record payment on a specific slab
router.post('/invoices/:id/slabs/:slabId/pay', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { id, slabId } = req.params;
    const { paymentNote } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { slabs: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const slab = invoice.slabs.find(s => s.id === slabId);
    if (!slab) {
      return res.status(404).json({ message: 'Slab not found on this invoice' });
    }

    if (slab.isPaid) {
      return res.status(400).json({ message: 'This slab is already paid' });
    }

    // Mark slab as paid
    await prisma.paymentSlab.update({
      where: { id: slabId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentNote: paymentNote || slab.paymentNote
      }
    });

    const updated = await syncInvoiceTotals(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error paying slab:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/invoices/:id/slabs/add
// @desc    Add a next payment slab (auto calculates amount or percentage)
router.post('/invoices/:id/slabs/add', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, amount, dueDate, paymentNote } = req.body;

    if (percentage === undefined && amount === undefined) {
      return res.status(400).json({ message: 'Provide either percentage or amount' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { slabs: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const total = invoice.totalAmount;
    let pct = 0.0;
    let amt = 0.0;

    if (percentage !== undefined) {
      pct = parseFloat(percentage);
      amt = total * (pct / 100);
    } else {
      amt = parseFloat(amount);
      pct = (amt / total) * 100;
    }

    // Check if new slab exceeds outstanding percentage limit
    const currentPctSum = invoice.slabs.reduce((sum, s) => sum + s.percentage, 0);
    if (currentPctSum + pct > 100.01) {
      return res.status(400).json({ message: `Adding ${pct.toFixed(2)}% would exceed invoice limit of 100% (currently ${currentPctSum.toFixed(2)}%)` });
    }

    const nextSlabNum = invoice.slabs.length > 0 ? Math.max(...invoice.slabs.map(s => s.slabNumber)) + 1 : 1;

    await prisma.paymentSlab.create({
      data: {
        invoiceId: id,
        slabNumber: nextSlabNum,
        percentage: pct,
        amount: amt,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPaid: false,
        paymentNote
      }
    });

    const updated = await syncInvoiceTotals(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error adding slab:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/billing/invoices/:id/slabs/:slabId
// @desc    Delete an unpaid slab
router.delete('/invoices/:id/slabs/:slabId', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { id, slabId } = req.params;

    const slab = await prisma.paymentSlab.findUnique({
      where: { id: slabId }
    });

    if (!slab) {
      return res.status(404).json({ message: 'Slab not found' });
    }

    // Verify this slab actually belongs to the given invoice
    if (slab.invoiceId !== id) {
      return res.status(403).json({ message: 'Slab does not belong to this invoice' });
    }

    if (slab.isPaid) {
      return res.status(400).json({ message: 'Cannot delete a paid slab milestone' });
    }

    await prisma.paymentSlab.delete({
      where: { id: slabId }
    });

    const updated = await syncInvoiceTotals(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error deleting slab:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
