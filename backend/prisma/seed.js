// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database v3.0 (CEO v2 pipeline)...');

  // Clean existing data in order of dependency
  await prisma.task.deleteMany();
  await prisma.leadFile.deleteMany();
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
  await prisma.companyProfile.deleteMany();

  const passwordHash = await bcrypt.hash('Password123@', 10);

  // 1. Seed Company Profile (for Proposal Letterhead)
  await prisma.companyProfile.create({
    data: {
      companyName: 'TheVertical.ai',
      address: '4th Floor, Prestige Tower, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      gstNumber: '29ABCDE1234F1Z5',
      phone: '+91 98765 43210',
      email: 'sales@thevertical.ai',
      website: 'https://thevertical.ai',
    }
  });
  console.log('Seeded Company Profile.');

  // 2. Seed Users
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

  // 3. Seed 12 Leads using new v2 pipeline stages
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Rajesh Kumar', phone: '9876543210', personalEmail: 'rajesh@acmecorp.com',
      companyName: 'Acme Corp', companyEmail: 'info@acmecorp.com',
      linkedinUrl: 'https://linkedin.com/in/rajeshkumar', source: 'Website',
      stage: 'DISCOVERY_CALL', assignedToId: ravi.id,
      notes: 'Interested in AI voice agents for outbound sales calls.'
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Meena Iyer', phone: '9876543211', personalEmail: 'meena@brighttech.in',
      companyName: 'BrightTech Solutions', companyEmail: 'hello@brighttech.in',
      linkedinUrl: 'https://linkedin.com/in/meenaiyer', source: 'Referral',
      stage: 'DEMO', assignedToId: sneha.id,
      notes: 'Needs demo of the Maestro OS product. Connected via Anand Rao.'
    }
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Suresh Reddy', phone: '9876543212', personalEmail: 'suresh@globalventures.com',
      companyName: 'Global Ventures', companyEmail: 'contact@globalventures.com',
      source: 'LinkedIn', stage: 'PROPOSAL', assignedToId: karan.id,
      notes: 'Proposal sent for 10 concurrent agents.'
    }
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Anjali Verma', phone: '9876543213', personalEmail: 'anjali@stepstone.co',
      companyName: 'StepsStone Promoters Pvt Ltd', companyEmail: 'sales@stepstone.co',
      linkedinUrl: 'https://linkedin.com/in/anjaliverma',
      socialMediaUrl: 'https://instagram.com/anjali.stepstone',
      source: 'Cold Call', stage: 'WIN', assignedToId: priya.id,
      notes: 'Contract signed. Proceeding to client onboarding.'
    }
  });

  const lead5 = await prisma.lead.create({
    data: {
      name: 'Vikram Nair', phone: '9876543214', personalEmail: 'vikram@nexusllp.in',
      companyName: 'Nexus LLP', source: 'Website',
      stage: 'LOSS', lossReason: 'Price too high — went with a competitor',
      assignedToId: sneha.id
    }
  });

  const lead6 = await prisma.lead.create({
    data: {
      name: 'Pooja Sharma', phone: '9876543215', personalEmail: 'pooja@infratech.com',
      companyName: 'InfraTech Systems', companyEmail: 'bd@infratech.com',
      source: 'Referral', stage: 'NEGOTIATION', assignedToId: ravi.id,
      notes: 'Final negotiation on contract terms. Decision expected this week.'
    }
  });

  const lead7 = await prisma.lead.create({
    data: {
      name: 'Amit Gupta', phone: '9876543216', personalEmail: 'amit@futureworks.in',
      companyName: 'FutureWorks Inc', source: 'LinkedIn',
      stage: 'DISCOVERY_CALL', assignedToId: karan.id
    }
  });

  const lead8 = await prisma.lead.create({
    data: {
      name: 'Sunita Das', phone: '9876543217', personalEmail: 'sunita@skymedia.co',
      companyName: 'Sky Media', companyEmail: 'hello@skymedia.co',
      source: 'Website', stage: 'DEMO', assignedToId: priya.id,
      notes: 'Scheduled demo for Thursday 3pm.'
    }
  });

  const lead9 = await prisma.lead.create({
    data: {
      name: 'Ravi Pillai', phone: '9876543218', personalEmail: 'ravipillai@techwave.io',
      companyName: 'TechWave Solutions', companyEmail: 'info@techwave.io',
      linkedinUrl: 'https://linkedin.com/in/ravipillai',
      source: 'Cold Call', stage: 'PROPOSAL', assignedToId: ravi.id,
      notes: 'Shared proposal for 5-agent package. Awaiting sign-off.'
    }
  });

  const lead10 = await prisma.lead.create({
    data: {
      name: 'Kavya Menon', phone: '9876543219', personalEmail: 'kavya@brightfuture.edu',
      companyName: 'Bright Future Edu Tech', companyEmail: 'admin@brightfuture.edu',
      source: 'Referral', stage: 'WIN', assignedToId: sneha.id,
      notes: 'Won deal. Client ready for handoff.'
    }
  });

  const lead11 = await prisma.lead.create({
    data: {
      name: 'Harish Pillai', phone: '9876543220', personalEmail: 'harish@mobilink.net',
      companyName: 'MobiLink Networks', source: 'Website',
      stage: 'DISCOVERY_CALL', assignedToId: ravi.id
    }
  });

  const lead12 = await prisma.lead.create({
    data: {
      name: 'Deepa Krishnan', phone: '9876543221', personalEmail: 'deepa@ecomhub.in',
      companyName: 'EcomHub India', companyEmail: 'sales@ecomhub.in',
      socialMediaUrl: 'https://twitter.com/ecomhub_india',
      source: 'LinkedIn', stage: 'NEGOTIATION', assignedToId: karan.id,
      notes: 'Final pricing discussion. High-priority lead.'
    }
  });

  console.log('Seeded 12 Leads.');

  // 4. Seed Lead Activities (call logs, notes, stage changes)
  await prisma.leadActivity.createMany({
    data: [
      { leadId: lead1.id, userId: ravi.id, type: 'STAGE_CHANGE', description: 'Lead created in stage DISCOVERY_CALL' },
      { leadId: lead1.id, userId: ravi.id, type: 'CALL', meetingType: 'PHONE_CALL', description: 'Initial discovery call — discussed pain points with outbound sales', callDuration: 600 },
      { leadId: lead1.id, userId: ravi.id, type: 'NOTE', description: 'Client currently using Exotel. Looking for a smarter AI-driven solution.' },
      { leadId: lead2.id, userId: sneha.id, type: 'STAGE_CHANGE', description: 'DISCOVERY_CALL → DEMO' },
      { leadId: lead2.id, userId: sneha.id, type: 'CALL', meetingType: 'ONLINE_MEETING', description: 'Google Meet demo scheduled for 2pm. Showed live Maestro dashboard.', callDuration: 1800 },
      { leadId: lead3.id, userId: karan.id, type: 'STAGE_CHANGE', description: 'DEMO → PROPOSAL' },
      { leadId: lead3.id, userId: karan.id, type: 'NOTE', description: 'Proposal sent for 10 concurrent agent package at ₹4,50,000.' },
      { leadId: lead4.id, userId: priya.id, type: 'STAGE_CHANGE', description: 'NEGOTIATION → WIN 🎉' },
      { leadId: lead6.id, userId: ravi.id, type: 'CALL', meetingType: 'FACE_TO_FACE', description: 'Face-to-face meeting at client office. Discussed contract terms.', callDuration: 3600 },
    ]
  });

  console.log('Seeded Lead Activities.');

  // 5. Seed Clients (from WIN leads: lead4, lead10)
  const client1 = await prisma.client.create({
    data: {
      leadId: lead4.id,
      companyName: 'StepsStone Promoters Pvt Ltd',
      contactName: 'Anjali Verma',
      phone: lead4.phone,
      email: lead4.personalEmail || 'anjali@stepstone.co',
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
      email: lead10.personalEmail || 'kavya@brightfuture.edu',
      state: 'Karnataka',
      amcStartDate: new Date(),
      amcEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  console.log('Seeded 2 Clients.');

  // 6. Seed Invoice and payment slabs
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
      invoiceId: invoice1.id, slabNumber: 1, percentage: 50.0,
      amount: totalAmt * 0.5, isPaid: true, paidAt: new Date(),
      paymentNote: 'Upfront slab payment'
    }
  });

  await prisma.paymentSlab.create({
    data: {
      invoiceId: invoice1.id, slabNumber: 2, percentage: 50.0,
      amount: totalAmt * 0.5, isPaid: false,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      paymentNote: 'Post-onboarding slab'
    }
  });

  console.log('Seeded Invoice & Slabs.');

  // 7. Seed Proposal (with new letterhead data auto-pulled from CompanyProfile)
  const proposal = await prisma.proposal.create({
    data: {
      proposalNumber: 'PROP-2026-05-0001',
      clientId: client1.id,
      clientName: 'StepsStone Promoters Pvt Ltd',
      validityDays: 15,
      oneTimeTotal: 91000.0, monthlyTotal: 4400.0, consumptionTotal: 45000.0,
      subtotal: invAmount, gstRate, gstAmount: gstAmt, grandTotal: totalAmt,
      status: 'ACCEPTED', notes: 'Standard enterprise package'
    }
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposal.id, sortOrder: 1, component: 'AI Voice Agent (One-Time)', description: 'Core Voice Engine setup', qty: 2, costPerUnit: 45000, totalAmount: 90000, billingType: 'ONE_TIME' },
      { proposalId: proposal.id, sortOrder: 2, component: 'Per Concurrent Channel/Month', description: 'Concurrent trunks', qty: 4, costPerUnit: 1100, totalAmount: 4400, billingType: 'MONTHLY' },
      { proposalId: proposal.id, sortOrder: 3, component: 'SIM Cost (One-Time)', description: 'Sim integration fee', qty: 2, costPerUnit: 500, totalAmount: 1000, billingType: 'ONE_TIME' },
      { proposalId: proposal.id, sortOrder: 4, component: 'Minute Consumption', description: 'Pre-paid talk-time package', qty: 15000, costPerUnit: 3, totalAmount: 45000, billingType: 'CONSUMPTION' }
    ]
  });

  console.log('Seeded Proposal.');

  // 8. Seed Commitment & Handoff
  const now = new Date();
  await prisma.commitment.create({
    data: {
      clientId: client1.id, agentCount: 5, talkTimeTarget: 120,
      revenueCommitment: 200000.0,
      windowStart: now,
      windowEnd: new Date(new Date().setDate(now.getDate() + 60)),
      actualTalkTime: 180, actualRevenue: totalAmt * 0.5
    }
  });

  await prisma.handoff.create({
    data: {
      clientId: client1.id, accountManagerId: am.id, status: 'IN_PROGRESS',
      meetingDone: true, introMailSent: true, onboardingDone: false, activationDone: false,
      slaDeadline: new Date(new Date().setDate(now.getDate() + 2)),
      onboardingDeadline: new Date(new Date().setDate(now.getDate() + 5))
    }
  });

  console.log('Seeded Commitments & Handoffs.');

  // 9. Seed Demo Tasks (including one overdue)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.task.createMany({
    data: [
      {
        leadId: lead1.id, assignedToId: ravi.id,
        title: 'Send follow-up WhatsApp message', taskType: 'FOLLOW_UP',
        description: 'Check if client reviewed the product brochure sent yesterday.',
        dueDate: yesterday, isCompleted: false, isOverdue: true
      },
      {
        leadId: lead2.id, assignedToId: sneha.id,
        title: 'Confirm demo meeting time', taskType: 'MEETING',
        description: 'Confirm 2pm Google Meet link with Meena.',
        dueDate: now, isCompleted: false, isOverdue: false
      },
      {
        leadId: lead6.id, assignedToId: ravi.id,
        title: 'Share revised pricing', taskType: 'EMAIL',
        description: 'Send revised pricing document after 5% discount approval.',
        dueDate: tomorrow, isCompleted: false, isOverdue: false
      },
      {
        leadId: lead9.id, assignedToId: ravi.id,
        title: 'Follow up on proposal', taskType: 'CALL',
        description: 'Call Ravi Pillai to follow up on the proposal shared 3 days ago.',
        dueDate: nextWeek, isCompleted: false, isOverdue: false
      }
    ]
  });

  console.log('Seeded Demo Tasks.');

  // 10. Seed Targets
  await prisma.target.create({
    data: {
      assignedToId: ravi.id, assignedById: arun.id, month: '2026-05',
      callTarget: 50, talkTimeTarget: 600, revenueTarget: 200000.0, leadTarget: 8
    }
  });

  await prisma.target.create({
    data: {
      assignedToId: sneha.id, assignedById: arun.id, month: '2026-05',
      callTarget: 40, talkTimeTarget: 500, revenueTarget: 150000.0, leadTarget: 6
    }
  });

  console.log('Seeded Targets.');
  console.log('✅ Database seeding v3.0 complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
