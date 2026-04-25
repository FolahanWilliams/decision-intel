-- Weeks 1-4 deep — schema additions across DPR, Dalio persistence,
-- retention legal-hold + warnings, versioning labels, per-org retention.

-- 1.1 deep — granular per-judge outputs persisted on Analysis so the DPR
-- can show actual judge variance rather than just the meta verdict.
ALTER TABLE "Analysis"
  ADD COLUMN IF NOT EXISTS "judgeOutputs" JSONB;

-- 1.3a deep — persisted Dalio structural-assumptions findings.
CREATE TABLE IF NOT EXISTS "StructuralAssumption" (
  "id"                TEXT NOT NULL,
  "analysisId"        TEXT NOT NULL,
  "determinantId"     TEXT NOT NULL,
  "determinantLabel"  TEXT,
  "category"          TEXT,
  "assumption"        TEXT NOT NULL,
  "defensibility"     TEXT NOT NULL,
  "severity"          TEXT NOT NULL,
  "evidenceFromMemo"  TEXT,
  "hardeningQuestion" TEXT,
  "framework"         TEXT NOT NULL DEFAULT 'dalio-18-determinants',
  "generatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "marketContext"     TEXT,
  CONSTRAINT "StructuralAssumption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StructuralAssumption_analysisId_idx"
  ON "StructuralAssumption"("analysisId");
CREATE INDEX IF NOT EXISTS "StructuralAssumption_determinantId_idx"
  ON "StructuralAssumption"("determinantId");
CREATE INDEX IF NOT EXISTS "StructuralAssumption_severity_idx"
  ON "StructuralAssumption"("severity");
CREATE INDEX IF NOT EXISTS "StructuralAssumption_defensibility_idx"
  ON "StructuralAssumption"("defensibility");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StructuralAssumption_analysisId_fkey'
  ) THEN
    ALTER TABLE "StructuralAssumption"
      ADD CONSTRAINT "StructuralAssumption_analysisId_fkey"
      FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 2.1 deep — legal hold + retention warning + per-org retention override.
CREATE TABLE IF NOT EXISTS "LegalHold" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT,
  "reason"       TEXT NOT NULL,
  "holdUntil"    TIMESTAMP(3),
  "grantedById"  TEXT NOT NULL,
  "releasedAt"   TIMESTAMP(3),
  "releasedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalHold_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalHold_orgId_idx" ON "LegalHold"("orgId");
CREATE INDEX IF NOT EXISTS "LegalHold_releasedAt_idx" ON "LegalHold"("releasedAt");

ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "deletionWarningSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalHoldId" TEXT,
  ADD COLUMN IF NOT EXISTS "versionLabel" TEXT;

CREATE INDEX IF NOT EXISTS "Document_deletionWarningSentAt_idx"
  ON "Document"("deletionWarningSentAt");
CREATE INDEX IF NOT EXISTS "Document_legalHoldId_idx"
  ON "Document"("legalHoldId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Document_legalHoldId_fkey'
  ) THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_legalHoldId_fkey"
      FOREIGN KEY ("legalHoldId") REFERENCES "LegalHold"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "retentionDaysOverride" INTEGER;
