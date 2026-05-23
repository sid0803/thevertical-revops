// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data in order of dependency
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.commitment.deleteMany();
  await prisma.handoff.deleteMany();
  await prisma.client.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.gSTSlab.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const passwordHash = await bcrypt.hash('Password123@', 10);

  // 1. Seed Core Users (No team leaders first)
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@thevertical.ai',
      password: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const finance = await prisma.user.create({
    data: {
      name: 'Finance User',
      email: 'finance@thevertical.ai',
      password: passwordHash,
      role: 'FINANCE',
    },
  });

  const am = await prisma.user.create({
    data: {
      name: 'AM User',
      email: 'am@thevertical.ai',
      password: passwordHash,
      role: 'ACCOUNT_MANAGER',
    },
  });

  // 2. Seed Team Leaders
  const arun = await prisma.user.create({
    data: {
      name: 'Arun',
      email: 'arun@thevertical.ai',
      password: passwordHash,
      role: 'TEAM_LEADER',
    },
  });

  const anand = await prisma.user.create({
    data: {
      name: 'Anand',
      email: 'anand@thevertical.ai',
      password: passwordHash,
      role: 'TEAM_LEADER',
    },
  });

  // 3. Seed Sales Executives linked to Team Leaders
  const ravi = await prisma.user.create({
    data: {
      name: 'Ravi',
      email: 'ravi@thevertical.ai',
      password: passwordHash,
      role: 'SALES_EXEC',
      teamLeaderId: arun.id,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha',
      email: 'sneha@thevertical.ai',
      password: passwordHash,
      role: 'SALES_EXEC',
      teamLeaderId: arun.id,
    },
  });

  const karan = await prisma.user.create({
    data: {
      name: 'Karan',
      email: 'karan@thevertical.ai',
      password: passwordHash,
      role: 'SALES_EXEC',
      teamLeaderId: anand.id,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya',
      email: 'priya@thevertical.ai',
      password: passwordHash,
      role: 'SALES_EXEC',
      teamLeaderId: anand.id,
    },
  });

  console.log('Users seeded successfully!');

  // 4. Seed GST Slabs
  const slab5c = await prisma.gSTSlab.create({
    data: { label: 'GST 5% (CGST+SGST)', rate: 5.0, type: 'CGST_SGST', isActive: true },
  });
  const slab5i = await prisma.gSTSlab.create({
    data: { label: 'GST 5% (IGST)', rate: 5.0, type: 'IGST', isActive: true },
  });
  const slab12c = await prisma.gSTSlab.create({
    data: { label: 'GST 12% (CGST+SGST)', rate: 12.0, type: 'CGST_SGST', isActive: true },
  });
  const slab12i = await prisma.gSTSlab.create({
    data: { label: 'GST 12% (IGST)', rate: 12.0, type: 'IGST', isActive: true },
  });
  const slab18c = await prisma.gSTSlab.create({
    data: { label: 'GST 18% (CGST+SGST)', rate: 18.0, type: 'CGST_SGST', isActive: true },
  });
  const slab18i = await prisma.gSTSlab.create({
    data: { label: 'GST 18% (IGST)', rate: 18.0, type: 'IGST', isActive: true },
  });

  console.log('GST Slabs seeded successfully!');

  // 5. Seed Leads (10 Leads)
  const lead1 = await prisma.lead.create({
    data: {
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      source: 'Website',
      stage: 'NEW',
      assignedToId: ravi.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Jane Smith',
      phone: '9876543211',
      email: 'jane@example.com',
      source: 'Cold Call',
      stage: 'INTERESTED',
      assignedToId: sneha.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Acme Corp',
      phone: '9876543212',
      email: 'acme@example.com',
      source: 'Referral',
      stage: 'PROPOSAL_SHARED',
      assignedToId: karan.id,
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Globex Corp',
      phone: '9876543213',
      email: 'globex@example.com',
      source: 'Inbound',
      stage: 'PAYMENT_COMPLETED',
      assignedToId: priya.id,
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      name: 'Initech Inc',
      phone: '9876543214',
      email: 'initech@example.com',
      source: 'Website',
      stage: 'PAYMENT_COMPLETED',
      assignedToId: ravi.id,
    },
  });

  const lead6 = await prisma.lead.create({
    data: {
      name: 'Umbrella Corp',
      phone: '9876543215',
      email: 'umbrella@example.com',
      source: 'Cold Call',
      stage: 'RNR_DNP',
      assignedToId: sneha.id,
    },
  });

  const lead7 = await prisma.lead.create({
    data: {
      name: 'Hooli Inc',
      phone: '9876543216',
      email: 'hooli@example.com',
      source: 'Website',
      stage: 'NOT_INTERESTED',
      assignedToId: karan.id,
    },
  });

  const lead8 = await prisma.lead.create({
    data: {
      name: 'Veer Industries',
      phone: '9876543217',
      email: 'veer@example.com',
      source: 'Referral',
      stage: 'NEW',
      assignedToId: priya.id,
    },
  });

  const lead9 = await prisma.lead.create({
    data: {
      name: 'Sahu Retail',
      phone: '9876543218',
      email: 'sahu@example.com',
      source: 'Inbound',
      stage: 'INTERESTED',
      assignedToId: ravi.id,
    },
  });

  const lead10 = await prisma.lead.create({
    data: {
      name: 'Mittal Steel',
      phone: '9876543219',
      email: 'mittal@example.com',
      source: 'Website',
      stage: 'PROPOSAL_SHARED',
      assignedToId: sneha.id,
    },
  });

  console.log('Leads seeded successfully!');

  // 6. Seed Activities for Leads
  const now = new Date();
  await prisma.leadActivity.createMany({
    data: [
      { leadId: lead1.id, userId: ravi.id, type: 'STAGE_CHANGE', description: 'Lead created in stage NEW', createdAt: new Date(now - 86400000 * 3) },
      { leadId: lead2.id, userId: sneha.id, type: 'STAGE_CHANGE', description: 'Lead created in stage NEW', createdAt: new Date(now - 86400000 * 5) },
      { leadId: lead2.id, userId: sneha.id, type: 'STAGE_CHANGE', description: 'Stage changed from NEW to INTERESTED', createdAt: new Date(now - 86400000 * 4) },
      { leadId: lead2.id, userId: sneha.id, type: 'CALL', description: 'Follow-up call with customer about product specs', callDuration: 180, createdAt: new Date(now - 86400000 * 3) },
      { leadId: lead3.id, userId: karan.id, type: 'NOTE', description: 'Interested in enterprise license of 50 users.', createdAt: new Date(now - 86400000 * 2) },
      { leadId: lead3.id, userId: karan.id, type: 'STAGE_CHANGE', description: 'Stage changed to PROPOSAL_SHARED', createdAt: new Date(now - 86400000 * 1) },
      { leadId: lead4.id, userId: priya.id, type: 'STAGE_CHANGE', description: 'Stage changed to PAYMENT_COMPLETED', createdAt: new Date(now - 86400000 * 2) },
      { leadId: lead5.id, userId: ravi.id, type: 'STAGE_CHANGE', description: 'Stage changed to PAYMENT_COMPLETED', createdAt: new Date(now - 86400000 * 1) },
    ],
  });

  console.log('Activities seeded successfully!');

  // 7. Seed Clients (linked to PAYMENT_COMPLETED leads: Globex Corp and Initech Inc)
  const client1 = await prisma.client.create({
    data: {
      leadId: lead4.id,
      companyName: 'Globex Corp',
      contactName: 'Alice Johnson',
      phone: lead4.phone,
      email: lead4.email || 'globex@example.com',
      amcStartDate: new Date(),
      amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const client2 = await prisma.client.create({
    data: {
      leadId: lead5.id,
      companyName: 'Initech Inc',
      contactName: 'Peter Gibbons',
      phone: lead5.phone,
      email: lead5.email || 'initech@example.com',
      amcStartDate: new Date(),
      amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  console.log('Clients seeded successfully!');

  // 8. Seed Invoices and Payments
  // Invoice for Client 1 (Globex)
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-05-0001',
      clientId: client1.id,
      amount: 100000.0,
      gstType: 'CGST_SGST',
      gstRate: 18.0,
      gstAmount: 18000.0,
      totalAmount: 118000.0,
      status: 'PARTIALLY_PAID',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 50000.0,
      slabNumber: 1,
      notes: 'Initial payment milestone',
    },
  });

  // Invoice for Client 2 (Initech)
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-05-0002',
      clientId: client2.id,
      amount: 200000.0,
      gstType: 'IGST',
      gstRate: 18.0,
      gstAmount: 36000.0,
      totalAmount: 236000.0,
      status: 'PAID',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      amount: 236000.0,
      slabNumber: 1,
      notes: 'Full payment received',
    },
  });

  console.log('Invoices and Payments seeded successfully!');

  // 9. Seed Split Mapping: Handoffs and Commitments
  // Client 1 (Globex): Pending Handoff and active Commitment
  await prisma.handoff.create({
    data: {
      clientId: client1.id,
      accountManagerId: am.id,
      status: 'PENDING',
      introMailSent: true,
      meetingDone: false,
      onboardingDone: false,
      activationDone: false,
      slaBreached: false,
    },
  });

  await prisma.commitment.create({
    data: {
      clientId: client1.id,
      agentCount: 5,
      talkTimeTarget: 120, // 120 minutes/day
      revenueCommitment: 100000.0,
      windowStart: new Date(),
      windowEnd: new Date(new Date().setDate(new Date().getDate() + 60)),
      actualTalkTime: 0,
    },
  });

  // Client 2 (Initech): Completed Handoff and active Commitment
  await prisma.handoff.create({
    data: {
      clientId: client2.id,
      accountManagerId: am.id,
      status: 'COMPLETED',
      handoffDate: new Date(),
      introMailSent: true,
      meetingDone: true,
      onboardingDone: true,
      activationDone: true,
      slaBreached: false,
    },
  });

  await prisma.commitment.create({
    data: {
      clientId: client2.id,
      agentCount: 10,
      talkTimeTarget: 240, // 240 minutes/day
      revenueCommitment: 200000.0,
      windowStart: new Date(new Date().setDate(new Date().getDate() - 10)),
      windowEnd: new Date(new Date().setDate(new Date().getDate() + 50)),
      actualTalkTime: 1250, // minutes
    },
  });

  console.log('Split Mapping seeded successfully!');
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
