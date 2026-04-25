-- 4.4 deep — Decision Package: a named bundle of related documents
-- that constitutes a single strategic decision. Generalises the
-- "deal as the atomic decision unit" claim to non-deal contexts.

-- ── DecisionPackage table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionPackage" (
  "id"                          TEXT NOT NULL,
  "orgId"                       TEXT,
  "ownerUserId"                 TEXT NOT NULL,
  "name"                        TEXT NOT NULL,
  "decisionFrame"               TEXT,
  "status"                      TEXT NOT NULL DEFAULT 'drafting',
  "decidedAt"                   TIMESTAMP(3),
  "compositeDqi"                DOUBLE PRECISION,
  "compositeGrade"              TEXT,
  "documentCount"               INTEGER NOT NULL DEFAULT 0,
  "analyzedDocCount"            INTEGER NOT NULL DEFAULT 0,
  "recurringBiasCount"          INTEGER NOT NULL DEFAULT 0,
  "conflictCount"               INTEGER NOT NULL DEFAULT 0,
  "highSeverityConflictCount"   INTEGER NOT NULL DEFAULT 0,
  "visibility"                  TEXT NOT NULL DEFAULT 'team',
  "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DecisionPackage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DecisionPackage_orgId_idx" ON "DecisionPackage"("orgId");
CREATE INDEX IF NOT EXISTS "DecisionPackage_ownerUserId_idx" ON "DecisionPackage"("ownerUserId");
CREATE INDEX IF NOT EXISTS "DecisionPackage_status_idx" ON "DecisionPackage"("status");
CREATE INDEX IF NOT EXISTS "DecisionPackage_orgId_status_idx" ON "DecisionPackage"("orgId", "status");
CREATE INDEX IF NOT EXISTS "DecisionPackage_orgId_updatedAt_idx" ON "DecisionPackage"("orgId", "updatedAt");

-- ── DecisionPackageDocument join table ───────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionPackageDocument" (
  "id"          TEXT NOT NULL,
  "packageId"   TEXT NOT NULL,
  "documentId"  TEXT NOT NULL,
  "role"        TEXT,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "addedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionPackageDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DecisionPackageDocument_packageId_documentId_key"
  ON "DecisionPackageDocument"("packageId", "documentId");
CREATE INDEX IF NOT EXISTS "DecisionPackageDocument_packageId_position_idx"
  ON "DecisionPackageDocument"("packageId", "position");
CREATE INDEX IF NOT EXISTS "DecisionPackageDocument_documentId_idx"
  ON "DecisionPackageDocument"("documentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionPackageDocument_packageId_fkey'
  ) THEN
    ALTER TABLE "DecisionPackageDocument"
      ADD CONSTRAINT "DecisionPackageDocument_packageId_fkey"
      FOREIGN KEY ("packageId") REFERENCES "DecisionPackage"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionPackageDocument_documentId_fkey'
  ) THEN
    ALTER TABLE "DecisionPackageDocument"
      ADD CONSTRAINT "DecisionPackageDocument_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── DecisionPackageCrossReference table ──────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionPackageCrossReference" (
  "id"                TEXT NOT NULL,
  "packageId"         TEXT NOT NULL,
  "runAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modelVersion"      TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
  "documentSnapshot"  JSONB NOT NULL,
  "findings"          JSONB NOT NULL,
  "conflictCount"     INTEGER NOT NULL DEFAULT 0,
  "highSeverityCount" INTEGER NOT NULL DEFAULT 0,
  "status"            TEXT NOT NULL DEFAULT 'complete',
  "errorMessage"      TEXT,
  CONSTRAINT "DecisionPackageCrossReference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DecisionPackageCrossReference_packageId_runAt_idx"
  ON "DecisionPackageCrossReference"("packageId", "runAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionPackageCrossReference_packageId_fkey'
  ) THEN
    ALTER TABLE "DecisionPackageCrossReference"
      ADD CONSTRAINT "DecisionPackageCrossReference_packageId_fkey"
      FOREIGN KEY ("packageId") REFERENCES "DecisionPackage"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── DecisionPackageOutcome table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionPackageOutcome" (
  "id"               TEXT NOT NULL,
  "packageId"        TEXT NOT NULL,
  "summary"          TEXT NOT NULL,
  "realisedDqi"      DOUBLE PRECISION,
  "brierScore"       DOUBLE PRECISION,
  "reportedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reportedByUserId" TEXT NOT NULL,
  CONSTRAINT "DecisionPackageOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DecisionPackageOutcome_packageId_key"
  ON "DecisionPackageOutcome"("packageId");
CREATE INDEX IF NOT EXISTS "DecisionPackageOutcome_packageId_idx"
  ON "DecisionPackageOutcome"("packageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionPackageOutcome_packageId_fkey'
  ) THEN
    ALTER TABLE "DecisionPackageOutcome"
      ADD CONSTRAINT "DecisionPackageOutcome_packageId_fkey"
      FOREIGN KEY ("packageId") REFERENCES "DecisionPackage"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
