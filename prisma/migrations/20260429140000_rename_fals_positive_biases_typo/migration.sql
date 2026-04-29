-- Rename DecisionOutcome.falsPositiveBiases (typo, missing 'e') to
-- falsePositiveBiases. RENAME COLUMN is atomic and preserves data;
-- Prisma's default schema-drift behaviour would have generated a
-- DROP + ADD which would lose every existing row's array contents.
--
-- Application code MUST be deployed lock-step with this migration.
-- All 30 caller sites are updated in the same commit (A5 lock
-- 2026-04-29 batch).
ALTER TABLE "DecisionOutcome" RENAME COLUMN "falsPositiveBiases" TO "falsePositiveBiases";
