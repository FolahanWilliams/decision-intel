-- 66-Day Protocol — the OPTIONAL evening reflection (2026-06-15).
-- Additive only: a new table, no changes to any existing table. Zero-risk,
-- schema-drift tolerant by construction — pre-migration the route fails soft
-- to an empty trend, and the tree never depended on it (the tree reads only
-- FounderOsRealityCheckin). The "never feeds the tree" invariant lives in the
-- app + the pure math, not the schema.

CREATE TABLE "FounderOsRealityReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mind" INTEGER,
    "energy" INTEGER,
    "intention" INTEGER,
    "note" TEXT,
    "tomorrow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsRealityReflection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FounderOsRealityReflection_userId_date_key" ON "FounderOsRealityReflection"("userId", "date");
CREATE INDEX "FounderOsRealityReflection_userId_idx" ON "FounderOsRealityReflection"("userId");
CREATE INDEX "FounderOsRealityReflection_userId_date_idx" ON "FounderOsRealityReflection"("userId", "date");
