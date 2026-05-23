// backend/src/routes/billing.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/billing/invoices
// @desc    Get all invoices
router.get('/invoices', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'FINANCE'), async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/invoices
// @desc    Create a new invoice
router.post('/invoices', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { clientId, amount, gstSlabId, dueDate } = req.body;

    if (!clientId || !amount || !gstSlabId) {
      return res.status(400).json({ message: 'Client ID, base amount, and GST slab are required' });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const gstSlab = await prisma.gSTSlab.findUnique({ where: { id: gstSlabId } });
    if (!gstSlab) {
      return res.status(404).json({ message: 'GST slab not found' });
    }

    // Auto-generate invoice number: INV-YYYY-MM-XXXX
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

    // GST calculations
    const baseAmount = parseFloat(amount);
    const gstRate = gstSlab.rate;
    const gstAmount = baseAmount * (gstRate / 100);
    const totalAmount = baseAmount + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        amount: baseAmount,
        gstType: gstSlab.type,
        gstRate,
        gstAmount,
        totalAmount,
        status: 'DRAFT',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        client: true
      }
    });

    return res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/billing/invoices/:id
// @desc    Get invoice details + payments
router.get('/invoices/:id', verifyToken, requireRoles('SUPER_ADMIN', 'MANAGER', 'FINANCE'), async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true, phone: true, email: true }
        },
        payments: true
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

// @route   POST /api/billing/invoices/:id/pay
// @desc    Record a payment slab
router.post('/invoices/:id/pay', verifyToken, requireRoles('SUPER_ADMIN', 'FINANCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, slabNumber, notes } = req.body;

    if (!amount || !slabNumber) {
      return res.status(400).json({ message: 'Amount and slab number are required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const paymentAmount = parseFloat(amount);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: paymentAmount,
        slabNumber: parseInt(slabNumber),
        notes
      }
    });

    // Update invoice status
    const allPayments = await prisma.payment.findMany({
      where: { invoiceId: id }
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    let status = 'DRAFT';
    if (totalPaid >= invoice.totalAmount) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIALLY_PAID';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { payments: true }
    });

    // Sync split-mapping commitment target if this client had an active commitment window
    // (We'll check if the client has a commitment record and log or update it)
    
    return res.json({ payment, invoice: updatedInvoice });
  } catch (error) {
    console.error('Error logging payment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/billing/gst-slabs
// @desc    Get all active GST slabs
router.get('/gst-slabs', verifyToken, async (req, res) => {
  try {
    const slabs = await prisma.gSTSlab.findMany({
      where: { isActive: true },
      orderBy: { rate: 'asc' }
    });
    return res.json(slabs);
  } catch (error) {
    console.error('Error fetching GST slabs:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/gst-slabs
// @desc    Create GST Slab
router.post('/gst-slabs', verifyToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { label, rate, type } = req.body;
    if (!label || rate === undefined || !type) {
      return res.status(400).json({ message: 'Label, rate, and type are required' });
    }

    const slab = await prisma.gSTSlab.create({
      data: { label, rate: parseFloat(rate), type, isActive: true }
    });
    return res.status(201).json(slab);
  } catch (error) {
    console.error('Error creating GST slab:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/billing/gst-slabs/:id
// @desc    Update GST Slab status
router.put('/gst-slabs/:id', verifyToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { label, rate, type, isActive } = req.body;

    const slab = await prisma.gSTSlab.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return res.json(slab);
  } catch (error) {
    console.error('Error updating GST slab:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
