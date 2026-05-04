-- GTM v3.5 RATIFIED 2026-05-04 — micro-deliberation outcome event schema.
-- Closes Cloverpop's data-advantage attack vector by enabling fast-feedback
-- (days-out) Brier calibration in addition to the slow macro-outcome
-- (years-out) feedback loop on DecisionOutcome. Each Analysis can produce
-- many MicroDeliberationOutcome rows (one per predicted reaction
-- confirmed/refuted in the IC discussion or board review).

CREATE TABLE "MicroDeliberationOutcome" (
  "id" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orgId" TEXT,
  "eventType" TEXT NOT NULL,
  "targetBiasId" TEXT,
  "predictedReaction" TEXT NOT NULL,
  "actualReaction" TEXT,
  "confirmed" BOOLEAN,
  "predictedConfidence" DOUBLE PRECISION,
  "happenedAt" TIMESTAMP(3),
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  CONSTRAINT "MicroDeliberationOutcome_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MicroDeliberationOutcome_analysisId_idx" ON "MicroDeliberationOutcome"("analysisId");
CREATE INDEX "MicroDeliberationOutcome_userId_idx" ON "MicroDeliberationOutcome"("userId");
CREATE INDEX "MicroDeliberationOutcome_orgId_idx" ON "MicroDeliberationOutcome"("orgId");
CREATE INDEX "MicroDeliberationOutcome_userId_capturedAt_idx" ON "MicroDeliberationOutcome"("userId", "capturedAt");
CREATE INDEX "MicroDeliberationOutcome_orgId_capturedAt_idx" ON "MicroDeliberationOutcome"("orgId", "capturedAt");
CREATE INDEX "MicroDeliberationOutcome_orgId_eventType_confirmed_idx" ON "MicroDeliberationOutcome"("orgId", "eventType", "confirmed");

ALTER TABLE "MicroDeliberationOutcome"
  ADD CONSTRAINT "MicroDeliberationOutcome_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
