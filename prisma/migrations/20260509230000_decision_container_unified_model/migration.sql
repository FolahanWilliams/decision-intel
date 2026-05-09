-- DecisionContainer unified model migration (locked 2026-05-09 evening)
--
-- Replaces the prior split between `Deal` (M&A-coded) and `DecisionPackage`
-- (generic-coded) with one `DecisionContainer` model + three workflow modes
-- via the `kind` discriminator ('investment' | 'acquisition' | 'strategic').
-- See src/lib/data/decision-container-modes.ts for the SSOT.
--
-- Per founder confirmation 2026-05-09 (no production users yet): clean
-- drop+create, no data backfill. The migration is forward-only.

-- ─── Drop dependent legacy tables (FK-aware order) ───────────────────────

DROP TABLE IF EXISTS "DealAuditPurchase" CASCADE;
DROP TABLE IF EXISTS "DealCrossReference" CASCADE;
DROP TABLE IF EXISTS "DealOutcome" CASCADE;
DROP TABLE IF EXISTS "DecisionPackageCrossReference" CASCADE;
DROP TABLE IF EXISTS "DecisionPackageOutcome" CASCADE;
DROP TABLE IF EXISTS "DecisionPackageDocument" CASCADE;

-- ─── Drop legacy parents ────────────────────────────────────────────────

DROP TABLE IF EXISTS "Deal" CASCADE;
DROP TABLE IF EXISTS "DecisionPackage" CASCADE;

-- ─── Document.dealId removal ────────────────────────────────────────────

-- Drop the legacy direct-FK column. Containers attach to documents via
-- the new DecisionContainerDocument join table.
DROP INDEX IF EXISTS "Document_dealId_idx";
ALTER TABLE "Document" DROP COLUMN IF EXISTS "dealId";

-- ─── DecisionBriefRecord rename: dealId → containerId ──────────────────

-- Free string ref (no FK relation). Rename column + indexes.
DROP INDEX IF EXISTS "DecisionBriefRecord_dealId_version_key";
DROP INDEX IF EXISTS "DecisionBriefRecord_dealId_idx";
ALTER TABLE "DecisionBriefRecord" RENAME COLUMN "dealId" TO "containerId";
CREATE UNIQUE INDEX "DecisionBriefRecord_containerId_version_key"
  ON "DecisionBriefRecord"("containerId", "version");
CREATE INDEX "DecisionBriefRecord_containerId_idx"
  ON "DecisionBriefRecord"("containerId");

-- ─── DecisionContainer ──────────────────────────────────────────────────

CREATE TABLE "DecisionContainer" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decisionFrame" TEXT,
    "stageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "visibility" TEXT NOT NULL DEFAULT 'team',
    "decidedAt" TIMESTAMP(3),
    "committeeDate" TIMESTAMP(3),
    "fundName" TEXT,
    "vintage" INTEGER,
    "dealType" TEXT,
    "ticketSize" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "targetCompany" TEXT,
    "sector" TEXT,
    "exitDate" TIMESTAMP(3),
    "compositeDqi" DOUBLE PRECISION,
    "compositeGrade" TEXT,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "analyzedDocCount" INTEGER NOT NULL DEFAULT 0,
    "recurringBiasCount" INTEGER NOT NULL DEFAULT 0,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "highSeverityConflictCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DecisionContainer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DecisionContainer_orgId_idx" ON "DecisionContainer"("orgId");
CREATE INDEX "DecisionContainer_ownerUserId_idx" ON "DecisionContainer"("ownerUserId");
CREATE INDEX "DecisionContainer_orgId_kind_idx" ON "DecisionContainer"("orgId", "kind");
CREATE INDEX "DecisionContainer_orgId_stageId_idx" ON "DecisionContainer"("orgId", "stageId");
CREATE INDEX "DecisionContainer_orgId_status_idx" ON "DecisionContainer"("orgId", "status");
CREATE INDEX "DecisionContainer_orgId_kind_status_idx" ON "DecisionContainer"("orgId", "kind", "status");
CREATE INDEX "DecisionContainer_orgId_updatedAt_idx" ON "DecisionContainer"("orgId", "updatedAt");
CREATE INDEX "DecisionContainer_committeeDate_idx" ON "DecisionContainer"("committeeDate");

-- ─── DecisionContainerDocument (join table) ─────────────────────────────

CREATE TABLE "DecisionContainerDocument" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "role" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DecisionContainerDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionContainerDocument_containerId_documentId_key"
  ON "DecisionContainerDocument"("containerId", "documentId");
CREATE INDEX "DecisionContainerDocument_containerId_position_idx"
  ON "DecisionContainerDocument"("containerId", "position");
CREATE INDEX "DecisionContainerDocument_documentId_idx"
  ON "DecisionContainerDocument"("documentId");

ALTER TABLE "DecisionContainerDocument"
  ADD CONSTRAINT "DecisionContainerDocument_containerId_fkey"
  FOREIGN KEY ("containerId") REFERENCES "DecisionContainer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DecisionContainerDocument"
  ADD CONSTRAINT "DecisionContainerDocument_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── DecisionContainerCrossReference ────────────────────────────────────

CREATE TABLE "DecisionContainerCrossReference" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelVersion" TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
    "documentSnapshot" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "highSeverityCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "errorMessage" TEXT,
    CONSTRAINT "DecisionContainerCrossReference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DecisionContainerCrossReference_containerId_runAt_idx"
  ON "DecisionContainerCrossReference"("containerId", "runAt");

ALTER TABLE "DecisionContainerCrossReference"
  ADD CONSTRAINT "DecisionContainerCrossReference_containerId_fkey"
  FOREIGN KEY ("containerId") REFERENCES "DecisionContainer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── DecisionContainerOutcome ───────────────────────────────────────────

CREATE TABLE "DecisionContainerOutcome" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "realisedDqi" DOUBLE PRECISION,
    "brierScore" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedByUserId" TEXT NOT NULL,
    CONSTRAINT "DecisionContainerOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionContainerOutcome_containerId_key"
  ON "DecisionContainerOutcome"("containerId");
CREATE INDEX "DecisionContainerOutcome_containerId_idx"
  ON "DecisionContainerOutcome"("containerId");

ALTER TABLE "DecisionContainerOutcome"
  ADD CONSTRAINT "DecisionContainerOutcome_containerId_fkey"
  FOREIGN KEY ("containerId") REFERENCES "DecisionContainer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── DecisionContainerAuditPurchase ─────────────────────────────────────

CREATE TABLE "DecisionContainerAuditPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "containerId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ticketSize" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DecisionContainerAuditPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionContainerAuditPurchase_stripePaymentId_key"
  ON "DecisionContainerAuditPurchase"("stripePaymentId");
CREATE INDEX "DecisionContainerAuditPurchase_userId_idx"
  ON "DecisionContainerAuditPurchase"("userId");
CREATE INDEX "DecisionContainerAuditPurchase_containerId_idx"
  ON "DecisionContainerAuditPurchase"("containerId");
CREATE INDEX "DecisionContainerAuditPurchase_orgId_idx"
  ON "DecisionContainerAuditPurchase"("orgId");

ALTER TABLE "DecisionContainerAuditPurchase"
  ADD CONSTRAINT "DecisionContainerAuditPurchase_containerId_fkey"
  FOREIGN KEY ("containerId") REFERENCES "DecisionContainer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
