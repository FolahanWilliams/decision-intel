-- V2 — mandatory pre-mortem dissent gate (locked 2026-05-16).
-- Additive nullable JSONB column on DecisionContainer holding the
-- sponsor's written defence to the Deal-Fever pre-mortem questions.
-- Required (acquisition-mode + analyzed docs) before an outcome can be
-- logged; flows into the DPR human-oversight record. Nullable so pre-V2
-- rows + non-acquisition containers are unaffected (schema-drift-tolerant).
ALTER TABLE "DecisionContainer"
  ADD COLUMN "premortemDefence" JSONB;
