-- 3.6 deep — owner-supplied override on the auto-detected market context.
-- When the auto-detector misfires (Lagos-based fund investing pan-African,
-- ambiguous cross-border memo, etc.) the document owner can flip the
-- context manually. The chip + structural-assumptions panel both prefer
-- this value when present.

ALTER TABLE "Analysis"
  ADD COLUMN IF NOT EXISTS "marketContextOverride" JSONB;
