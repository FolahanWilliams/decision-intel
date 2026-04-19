-- Brier scoring — proper-scoring-rule calibration of DQI predictions
-- against confirmed outcomes. Populated on every outcome submission
-- after this migration lands; nullable so pre-existing rows stay valid
-- without a backfill. See src/lib/learning/brier-scoring.ts for the
-- compute + category mapping.

ALTER TABLE "DecisionOutcome"
  ADD COLUMN "brierScore" DOUBLE PRECISION,
  ADD COLUMN "brierCategory" TEXT;

-- Composite index for per-org trend queries (outcome flywheel page
-- groups by month + averages brierScore, the hot path).
CREATE INDEX "DecisionOutcome_orgId_brierScore_idx"
  ON "DecisionOutcome" ("orgId", "brierScore");
