-- Outcome Gate enforcement flag on Organization.
-- Locked 2026-04-26 — closes the "outcome-gate avoidance" structural failure
-- mode identified by NotebookLM strategic synthesis Q6 pre-mortem.
-- When TRUE, the /api/analyze/stream POST returns HTTP 409 with code
-- 'OUTCOME_GATE_BLOCKED' if the user has 5+ pending outcome reports past
-- 30 days old. Default FALSE preserves existing behaviour for free /
-- individual / non-design-partner accounts.
ALTER TABLE "Organization" ADD COLUMN "enforceOutcomeGate" BOOLEAN NOT NULL DEFAULT false;
