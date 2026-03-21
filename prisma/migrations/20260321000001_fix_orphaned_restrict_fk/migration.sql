-- Fix: Drop orphaned HumanDecisionAudit table and its RESTRICT FK to Document.
-- Migration 20260317000010 created HumanDecisionAudit with ON DELETE RESTRICT,
-- but migration 20260317000011 replaced it with HumanDecision + CognitiveAudit
-- without dropping the old table. The leftover RESTRICT FK prevents document
-- deletion when any HumanDecisionAudit rows reference the document.

-- First drop the Nudge → HumanDecisionAudit FK (also RESTRICT)
ALTER TABLE "Nudge" DROP CONSTRAINT IF EXISTS "Nudge_humanDecisionId_fkey";

-- Drop the HumanDecisionAudit → Document FK (the RESTRICT blocker)
ALTER TABLE "HumanDecisionAudit" DROP CONSTRAINT IF EXISTS "HumanDecisionAudit_documentId_fkey";

-- Drop the orphaned table entirely (no longer in Prisma schema)
DROP TABLE IF EXISTS "HumanDecisionAudit";
