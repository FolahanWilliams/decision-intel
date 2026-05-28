-- Faith OS (2026-05-28)
-- Additive only: extends the daily checkin with two faith-discipline booleans
-- (default false so every pre-Faith-OS row reads as "not logged"), and adds
-- the prayer/reflection journal + reading-plan progress tables. Schema-drift
-- tolerant by construction — no backfill, no destructive change.

-- 1. Faith disciplines on the daily checkin
ALTER TABLE "FounderOsCheckin" ADD COLUMN "prayer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FounderOsCheckin" ADD COLUMN "scripture" BOOLEAN NOT NULL DEFAULT false;

-- 2. Prayer + reflection journal
CREATE TABLE "FounderOsPrayerJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'reflection',
    "title" VARCHAR(300),
    "body" TEXT NOT NULL,
    "scriptureRef" VARCHAR(120),
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "answeredNote" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsPrayerJournal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FounderOsPrayerJournal_userId_idx" ON "FounderOsPrayerJournal"("userId");
CREATE INDEX "FounderOsPrayerJournal_userId_kind_idx" ON "FounderOsPrayerJournal"("userId", "kind");
CREATE INDEX "FounderOsPrayerJournal_userId_createdAt_idx" ON "FounderOsPrayerJournal"("userId", "createdAt");

-- 3. Reading-plan progress (idempotent per user+plan+reference)
CREATE TABLE "FounderOsReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "reference" VARCHAR(120) NOT NULL,
    "reflection" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FounderOsReadingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FounderOsReadingProgress_userId_planId_reference_key" ON "FounderOsReadingProgress"("userId", "planId", "reference");
CREATE INDEX "FounderOsReadingProgress_userId_idx" ON "FounderOsReadingProgress"("userId");
CREATE INDEX "FounderOsReadingProgress_userId_planId_idx" ON "FounderOsReadingProgress"("userId", "planId");
