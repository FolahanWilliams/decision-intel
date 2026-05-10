-- Constellation Next Move + Pre-Artefact Priors Capture + Anti-Portfolio
-- + Cultural-Pairing Risk Capture (locked 2026-05-10).
--
-- Driver: 2026-05-10 Deep Research paper "Reasoning In High-Stakes
-- Corporate Development, M&A, and Venture Capital Decisions" (150+ sources).
-- Schema additions per paper Ch 1 (priors), Ch 4 (Anti-Portfolio /
-- Bessemer model), Ch 8 (intelligent antagonist priority capture), Ch 10
-- (cultural-pairing risk for cross-border M&A).

-- ──────────────────────────────────────────────────────────────────────
-- DecisionContainer extensions: priors + culturalPairingRisk
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE "DecisionContainer"
  ADD COLUMN "priors" JSONB,
  ADD COLUMN "culturalPairingRisk" JSONB;

-- ──────────────────────────────────────────────────────────────────────
-- ConstellationPriorityCapture — intelligent antagonist (paper Ch 8)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE "ConstellationPriorityCapture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userPriorityText" TEXT NOT NULL,
    "userPriorityContainerId" TEXT,
    "algoTopContainerId" TEXT,
    "algoTopReason" TEXT,
    "divergenceScore" DOUBLE PRECISION,

    CONSTRAINT "ConstellationPriorityCapture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConstellationPriorityCapture_userId_idx"
  ON "ConstellationPriorityCapture"("userId");

CREATE INDEX "ConstellationPriorityCapture_orgId_idx"
  ON "ConstellationPriorityCapture"("orgId");

CREATE INDEX "ConstellationPriorityCapture_userId_capturedAt_idx"
  ON "ConstellationPriorityCapture"("userId", "capturedAt");

-- ──────────────────────────────────────────────────────────────────────
-- RejectedDecision — Anti-Portfolio (paper Ch 4 / Bessemer model)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE "RejectedDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "decisionFrame" TEXT,
    "kind" TEXT NOT NULL,
    "sector" TEXT,
    "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectionReason" TEXT NOT NULL,
    "passedToCompetitor" BOOLEAN NOT NULL DEFAULT false,
    "competitorName" TEXT,
    "eventualOutcome" JSONB,
    "eventualOutcomeAttributedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RejectedDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RejectedDecision_userId_idx" ON "RejectedDecision"("userId");
CREATE INDEX "RejectedDecision_orgId_idx" ON "RejectedDecision"("orgId");
CREATE INDEX "RejectedDecision_userId_rejectedAt_idx"
  ON "RejectedDecision"("userId", "rejectedAt");
CREATE INDEX "RejectedDecision_kind_idx" ON "RejectedDecision"("kind");
CREATE INDEX "RejectedDecision_sector_idx" ON "RejectedDecision"("sector");
