-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'screening',
    "sector" TEXT,
    "ticketSize" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fundName" TEXT,
    "vintage" INTEGER,
    "targetCompany" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "exitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealOutcome" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "irr" DOUBLE PRECISION,
    "moic" DOUBLE PRECISION,
    "exitType" TEXT,
    "exitValue" DECIMAL(65,30),
    "holdPeriod" INTEGER,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealOutcome_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add documentType and dealId to Document
ALTER TABLE "Document" ADD COLUMN "documentType" TEXT;
ALTER TABLE "Document" ADD COLUMN "dealId" TEXT;

-- CreateIndex
CREATE INDEX "Deal_orgId_stage_idx" ON "Deal"("orgId", "stage");

-- CreateIndex
CREATE INDEX "Deal_orgId_status_idx" ON "Deal"("orgId", "status");

-- CreateIndex
CREATE INDEX "Deal_orgId_dealType_idx" ON "Deal"("orgId", "dealType");

-- CreateIndex
CREATE UNIQUE INDEX "DealOutcome_dealId_key" ON "DealOutcome"("dealId");

-- CreateIndex
CREATE INDEX "DealOutcome_dealId_idx" ON "DealOutcome"("dealId");

-- CreateIndex
CREATE INDEX "Document_dealId_idx" ON "Document"("dealId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealOutcome" ADD CONSTRAINT "DealOutcome_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
