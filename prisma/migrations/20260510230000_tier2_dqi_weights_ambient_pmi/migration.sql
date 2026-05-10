-- Tier 2 + PMI Path B (locked 2026-05-10 evening).
--
-- Driver: 2026-05-10 Deep Research paper #2 "Structural Failure Analysis of
-- Decision-Quality Interventions in Corporate Development and M&A" (150+
-- sources). Schema additions per:
--   - T2.1 (paper Ch 4 + Dietvorst 2016) — user-adjustable DQI weights
--   - T2.2 (paper Ch 12 condition #1 + Ch 6 ex-ante)  — ambient thesis capture
--   - PMI Path B (paper Ch 7 + Ch 11) — PMI signals as audit-loop closure,
--     NOT as a new product domain

-- ──────────────────────────────────────────────────────────────────────
-- PMI Path B: DecisionContainerOutcome.pmiSignals
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE "DecisionContainerOutcome"
  ADD COLUMN "pmiSignals" JSONB;

-- ──────────────────────────────────────────────────────────────────────
-- T2.2: ambient-capture consent on existing integrations
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE "SlackInstallation"
  ADD COLUMN "ambientCaptureEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ambientCaptureChannels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "GoogleDriveInstallation"
  ADD COLUMN "ambientCaptureEnabled" BOOLEAN NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────────────────────────────
-- T2.1: DqiWeightOverride — user/org adjustable DQI weights
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE "DqiWeightOverride" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "weights" JSONB NOT NULL,
    "weightsHash" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '2.3.0',
    "setByUserId" TEXT NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DqiWeightOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DqiWeightOverride_userId_key"
  ON "DqiWeightOverride"("userId");

CREATE UNIQUE INDEX "DqiWeightOverride_orgId_key"
  ON "DqiWeightOverride"("orgId");

CREATE INDEX "DqiWeightOverride_scope_idx"
  ON "DqiWeightOverride"("scope");

CREATE INDEX "DqiWeightOverride_setByUserId_idx"
  ON "DqiWeightOverride"("setByUserId");

CREATE INDEX "DqiWeightOverride_updatedAt_idx"
  ON "DqiWeightOverride"("updatedAt");

-- ──────────────────────────────────────────────────────────────────────
-- T2.2: AmbientThesisSignal — Slack/Drive/email thesis-formation events
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE "AmbientThesisSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "sourceParentRef" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extractedFields" JSONB NOT NULL,
    "excerpt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "containerId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbientThesisSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbientThesisSignal_source_sourceRef_key"
  ON "AmbientThesisSignal"("source", "sourceRef");

CREATE INDEX "AmbientThesisSignal_userId_status_idx"
  ON "AmbientThesisSignal"("userId", "status");

CREATE INDEX "AmbientThesisSignal_orgId_status_idx"
  ON "AmbientThesisSignal"("orgId", "status");

CREATE INDEX "AmbientThesisSignal_userId_detectedAt_idx"
  ON "AmbientThesisSignal"("userId", "detectedAt");

CREATE INDEX "AmbientThesisSignal_status_expiresAt_idx"
  ON "AmbientThesisSignal"("status", "expiresAt");
