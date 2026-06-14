-- 66-Day Protocol — founder-private "choose reality" check-in tracker (2026-06-14)
-- Additive only: a new table, no changes to any existing table. Zero-risk,
-- schema-drift tolerant by construction — pre-migration the route fails soft to
-- an empty tracker (the page renders a seed). The slip-never-resets invariant
-- lives in the API + the pure tree-growth math, not the schema.

CREATE TABLE "FounderOsRealityCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "escapePlan" TEXT,
    "stayedOnTrack" BOOLEAN,
    "note" TEXT,
    "verseRef" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsRealityCheckin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FounderOsRealityCheckin_userId_date_kind_key" ON "FounderOsRealityCheckin"("userId", "date", "kind");
CREATE INDEX "FounderOsRealityCheckin_userId_idx" ON "FounderOsRealityCheckin"("userId");
CREATE INDEX "FounderOsRealityCheckin_userId_date_idx" ON "FounderOsRealityCheckin"("userId", "date");
