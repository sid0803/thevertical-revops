-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamLeaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "company" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "callDuration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "state" TEXT,
    "amcStartDate" DATETIME,
    "amcEndDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "baseAmount" REAL NOT NULL,
    "gstRate" REAL NOT NULL,
    "gstAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "outstandingAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSlab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "slabNumber" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "paymentNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentSlab_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 15,
    "oneTimeTotal" REAL NOT NULL DEFAULT 0,
    "monthlyTotal" REAL NOT NULL DEFAULT 0,
    "consumptionTotal" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "gstRate" REAL NOT NULL,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "component" TEXT NOT NULL,
    "description" TEXT,
    "qty" REAL NOT NULL DEFAULT 1,
    "costPerUnit" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "billingType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "agentCount" INTEGER NOT NULL,
    "talkTimeTarget" INTEGER NOT NULL,
    "revenueCommitment" REAL NOT NULL,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowEnd" DATETIME NOT NULL,
    "actualTalkTime" INTEGER NOT NULL DEFAULT 0,
    "actualRevenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commitment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "accountManagerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "handoffDate" DATETIME,
    "meetingDone" BOOLEAN NOT NULL DEFAULT false,
    "introMailSent" BOOLEAN NOT NULL DEFAULT false,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "activationDone" BOOLEAN NOT NULL DEFAULT false,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "slaDeadline" DATETIME NOT NULL,
    "onboardingDeadline" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Handoff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Handoff_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "callTarget" INTEGER NOT NULL,
    "talkTimeTarget" INTEGER NOT NULL,
    "revenueTarget" REAL NOT NULL,
    "leadTarget" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Target_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Target_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_phone_key" ON "Lead"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_leadId_key" ON "Client"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_proposalNumber_key" ON "Proposal"("proposalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_clientId_key" ON "Commitment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Handoff_clientId_key" ON "Handoff"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Target_assignedToId_month_key" ON "Target"("assignedToId", "month");
