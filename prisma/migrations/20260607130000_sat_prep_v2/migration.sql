-- SAT Prep v2 — active error loop + settings (2026-06-07)
-- Additive only: SM-2 review columns + cached explanation on SatErrorLogEntry,
-- plus a SatSettings table for the test-date countdown. Zero-risk — existing
-- rows read the new columns as their defaults (nextDue NULL = not scheduled).

ALTER TABLE "SatErrorLogEntry" ADD COLUMN "explanation" TEXT;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "repetitions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "intervalDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "lastReviewed" TIMESTAMP(3);
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "nextDue" TIMESTAMP(3);
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "successfulReviews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SatErrorLogEntry" ADD COLUMN "reviewArchived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SatErrorLogEntry_userId_reviewArchived_nextDue_idx" ON "SatErrorLogEntry"("userId", "reviewArchived", "nextDue");

CREATE TABLE "SatSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "benchmarkTestDate" TEXT,
    "targetTestDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SatSettings_userId_key" ON "SatSettings"("userId");
