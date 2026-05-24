// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database v2.0...');

  // Clean existing data in order of dependency
  await prisma.target.deleteMany();
  await prisma.handoff.deleteMany();
  await prisma.commitment.deleteMany();
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.paymentSlab.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123@', 10);

  // 1. Seed Users
  const admin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@thevertical.ai', password: passwordHash, role: 'SUPER_ADMIN' }
  });

  const manager = await prisma.user.create({
    data: { name: 'Raj Manager', email: 'manager@thevertical.ai', password: passwordHash, role: 'MANAGER' }
  });

  const finance = await prisma.user.create({
    data: { name: 'Finance User', email: 'finance@thevertical.ai', password: passwordHash, role: 'FINANCE' }
  });

  const am = await prisma.user.create({
    data: { name: 'Deepa Nair', email: 'am@thevertical.ai', password: passwordHash, role: 'ACCOUNT_MANAGER' }
  });

  const arun = await prisma.user.create({
    data: { name: 'Arun Kumar', email: 'arun@thevertical.ai', password: passwordHash, role: 'TEAM_LEADER' }
  });

  const anand = await prisma.user.create({
    data: { name: 'Anand Rao', email: 'anand@thevertical.ai', password: passwordHash, role: 'TEAM_LEADER' }
  });

  const ravi = await prisma.user.create({
    data: { name: 'Ravi Sharma', email: 'ravi@thevertical.ai', password: passwordHash, role: 'SALES_EXEC', teamLeaderId: arun.id }
  });

  const sneha = await prisma.user.create({
    data: { name: 'Sneha Patel', email: 'sneha@thevertical.ai', password: passwordHash, role: 'SALES_EXEC', teamLeaderId: arun.id }
  });

  const karan = await prisma.user.create({
    data: { name: 'Karan Mehta', email: 'karan@thevertical.ai', password: passwordHash, role: 'SALES_EXEC', teamLeaderId: anand.id }
  });

  const priya = await prisma.user.create({
    data: { name: 'Priya Singh', email: 'priya@thevertical.ai', password: passwordHash, role: 'SALES_EXEC', teamLeaderId: anand.id }
  });

  console.log('Seeded 10 Users.');

  // 2. Seed 10 Leads
  const lead1 = await prisma.lead.create({
    data: { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', source: 'Website', stage: 'NEW', assignedToId: ravi.id }
  });
  const lead2 = await prisma.lead.create({
    data: { name: 'Meena Iyer', phone: '9876543211', email: 'meena@example.com', source: 'Referral', stage: 'INTERESTED', assignedToId: sneha.id }
  });
  const lead3 = await prisma.lead.create({
    data: { name: 'Suresh Reddy', phone: '9876543212', email: 'suresh@example.com', source: 'LinkedIn', stage: 'PROPOSAL_SHARED', assignedToId: assignmentFilter(karan.id) }
  });
  const lead4 = await prisma.lead.create({
    data: { name: 'Anjali Verma', phone: '9876543213', email: 'anjali@example.com', source: 'Cold Call', stage: 'PAYMENT_COMPLETED', assignedToId: priya.id }
  });
  const lead5 = await prisma.lead.create({
    data: { name: 'Vikram Nair', phone: '9876543214', email: 'vikram@example.com', source: 'Website', stage: 'RNR_DNP', assignedToId: sneha.id }
  });
  const lead6 = await prisma.lead.create({
    data: { name: 'Pooja Sharma', phone: '9876543215', email: 'pooja@example.com', source: 'Referral', stage: 'INTERESTED', assignedToId: ravi.id }
  });
  const lead7 = await prisma.lead.create({
    data: { name: 'Amit Gupta', phone: '9876543216', email: 'amit@example.com', source: 'LinkedIn', stage: 'NOT_INTERESTED', assignedToId: assignmentFilter(karan.id) }
  });
  const lead8 = await prisma.lead.create({
    data: { name: 'Sunita Das', phone: '9876543217', email: 'sunita@example.com', source: 'Website', stage: 'NEW', assignedToId: priya.id }
  });
  const lead9 = await prisma.lead.create({
    data: { name: 'Ravi Pillai', phone: '9876543218', email: 'ravipillai@example.com', source: 'Cold Call', stage: 'PROPOSAL_SHARED', assignedToId: ravi.id }
  });
  const lead10 = await prisma.lead.create({
    data: { name: 'Kavya Menon', phone: '9876543219', email: 'kavya@example.com', source: 'Referral', stage: 'PAYMENT_COMPLETED', assignedToId: sneha.id }
  });

  console.log('Seeded 10 Leads.');

  // Helper for conditional assignments
  function assignmentFilter(id) { return id; }

  // 3. Seed Client Accounts (from PAYMENT_COMPLETED leads: lead4, lead10)
  const client1 = await prisma.client.create({
    data: {
      leadId: lead4.id,
      companyName: 'StepsStone Promoters Pvt Ltd',
      contactName: 'Anjali Verma',
      phone: lead4.phone,
      email: lead4.email || 'anjali@example.com',
      state: 'Tamil Nadu',
      amcStartDate: new Date(),
      amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  const client2 = await prisma.client.create({
    data: {
      leadId: lead10.id,
      companyName: 'Bright Future Edu Tech',
      contactName: 'Kavya Menon',
      phone: lead10.phone,
      email: lead10.email || 'kavya@example.com',
      state: 'Karnataka',
      amcStartDate: new Date(),
      amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  console.log('Seeded 2 Clients.');

  // 4. Seed Invoice and payment slabs for client1 (StepsStone)
  const invAmount = 140400;
  const gstRate = 18;
  const gstAmt = invAmount * (gstRate / 100);
  const totalAmt = invAmount + gstAmt;

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-05-0001',
      clientId: client1.id,
      baseAmount: invAmount,
      gstRate,
      gstAmount: gstAmt,
      totalAmount: totalAmt,
      paidAmount: totalAmt * 0.5,
      outstandingAmount: totalAmt * 0.5,
      status: 'PARTIALLY_PAID',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      notes: 'Initial deal billing'
    }
  });

  await prisma.paymentSlab.create({
    data: {
      invoiceId: invoice1.id,
      slabNumber: 1,
      percentage: 50.0,
      amount: totalAmt * 0.5,
      isPaid: true,
      paidAt: new Date(),
      paymentNote: 'Upfront slab payment'
    }
  });

  await prisma.paymentSlab.create({
    data: {
      invoiceId: invoice1.id,
      slabNumber: 2,
      percentage: 50.0,
      amount: totalAmt * 0.5,
      isPaid: false,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      paymentNote: 'Post-onboarding slab'
    }
  });

  console.log('Seeded Invoice & Slabs.');

  // 5. Seed Proposal for StepsStone
  const proposal = await prisma.proposal.create({
    data: {
      proposalNumber: 'PROP-2026-05-0001',
      clientId: client1.id,
      clientName: 'StepsStone Promoters Pvt Ltd',
      validityDays: 15,
      oneTimeTotal: 91000.0,
      monthlyTotal: 4400.0,
      consumptionTotal: 45000.0,
      subtotal: invAmount,
      gstRate,
      gstAmount: gstAmt,
      grandTotal: totalAmt,
      status: 'ACCEPTED',
      notes: 'Standard enterprise package'
    }
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposal.id, sortOrder: 1, component: 'AI Voice Agent (One-Time)', description: 'Core Voice Engine setup', qty: 2, costPerUnit: 45000, totalAmount: 90000, billingType: 'ONE_TIME' },
      { proposalId: proposal.id, sortOrder: 2, component: 'Additional Agent (One-Time)', description: 'Extra voice agent keys', qty: 0, costPerUnit: 25000, totalAmount: 0, billingType: 'ONE_TIME' },
      { proposalId: proposal.id, sortOrder: 3, component: 'Per Concurrent Channel/Month', description: 'Concurrent trunks', qty: 4, costPerUnit: 1100, totalAmount: 4400, billingType: 'MONTHLY' },
      { proposalId: proposal.id, sortOrder: 4, component: 'SIM Cost (One-Time)', description: 'Sim integration fee', qty: 2, costPerUnit: 500, totalAmount: 1000, billingType: 'ONE_TIME' },
      { proposalId: proposal.id, sortOrder: 5, component: 'Minute Consumption', description: 'Pre-paid talk-time package', qty: 15000, costPerUnit: 3, totalAmount: 45000, billingType: 'CONSUMPTION' }
    ]
  });

  console.log('Seeded Proposal.');

  // 6. Seed Commitment & Handoff
  const now = new Date();
  await prisma.commitment.create({
    data: {
      clientId: client1.id,
      agentCount: 5,
      talkTimeTarget: 120, // mins per day
      revenueCommitment: 200000.0,
      windowStart: now,
      windowEnd: new Date(new Date().setDate(now.getDate() + 60)),
      actualTalkTime: 180,
      actualRevenue: totalAmt * 0.5
    }
  });

  await prisma.handoff.create({
    data: {
      clientId: client1.id,
      accountManagerId: am.id,
      status: 'IN_PROGRESS',
      meetingDone: true,
      introMailSent: true,
      onboardingDone: false,
      activationDone: false,
      slaDeadline: new Date(new Date().setDate(now.getDate() + 2)), // 48h
      onboardingDeadline: new Date(new Date().setDate(now.getDate() + 5)) // 5d
    }
  });

  console.log('Seeded Commitments & Handoffs.');

  // 7. Seed Targets
  await prisma.target.create({
    data: {
      assignedToId: ravi.id,
      assignedById: arun.id,
      month: '2026-05',
      callTarget: 50,
      talkTimeTarget: 600, // mins
      revenueTarget: 200000.0,
      leadTarget: 8
    }
  });

  console.log('Seeded Targets.');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
