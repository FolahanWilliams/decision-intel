-- Adaptation #1 — Retroactive audit mode (locked 2026-05-21).
--
-- Additive migration. Adds two columns to DecisionContainer:
--   1. isRetroactive (Boolean, default false) — discriminator for the
--      retroactive workflow. Pre-2026-05-21 rows default to false and
--      behave as forward containers, no behavioural drift.
--   2. retroactiveMetadata (Json, nullable) — per-row metadata for
--      retroactive containers: when the original decision was made,
--      when the outcome became known, source provenance, optional
--      bulk-upload batch id, optional pairing confidence + method.
--
-- Why: compresses 12+ months of forward calibration into days of
-- retroactive backfill. The Sankore-killer feature.

ALTER TABLE "DecisionContainer"
  ADD COLUMN "isRetroactive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "retroactiveMetadata" JSONB;

-- Sparse index on isRetroactive — analytics queries (Bias Genome
-- attribution, calibration baselines) need to slice retroactive
-- vs forward containers; the partial index keeps the cost near zero
-- while the retroactive cohort is small.
CREATE INDEX "DecisionContainer_retroactive_idx"
  ON "DecisionContainer" ("orgId", "isRetroactive")
  WHERE "isRetroactive" = true;
