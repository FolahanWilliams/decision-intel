-- Faith OS "Today's Three" daily-priority goals (2026-06-01)
-- Additive only: a new table, no changes to any existing table. Zero-risk,
-- schema-drift tolerant by construction — no backfill, no destructive change.
-- The cap of three goals per day is enforced in the API, not the schema, so
-- carry/release/reorder stay flexible.

CREATE TABLE "FounderOsDailyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "text" VARCHAR(280) NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "intention" VARCHAR(400),
    "status" TEXT NOT NULL DEFAULT 'open',
    "committed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsDailyGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FounderOsDailyGoal_userId_idx" ON "FounderOsDailyGoal"("userId");
CREATE INDEX "FounderOsDailyGoal_userId_date_idx" ON "FounderOsDailyGoal"("userId", "date");
