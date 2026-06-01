-- Faith OS "Today's Three" deepening — period-goal cascade + evening reflection (2026-06-01)
-- Additive only: two new tables + two nullable columns on FounderOsDailyGoal.
-- Zero-risk, schema-drift tolerant — pre-existing daily-goal rows read the new
-- columns as NULL (no cascade link, no time-block) and behave unchanged.

-- 1. Cascade link + Highlight time-block on the daily goal
ALTER TABLE "FounderOsDailyGoal" ADD COLUMN "scheduledFor" VARCHAR(120);
ALTER TABLE "FounderOsDailyGoal" ADD COLUMN "linkedPeriodGoalId" TEXT;

-- 2. Weekly + quarterly period goals (the cap of three enforced in the API)
CREATE TABLE "FounderOsPeriodGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "text" VARCHAR(280) NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "committed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsPeriodGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FounderOsPeriodGoal_userId_idx" ON "FounderOsPeriodGoal"("userId");
CREATE INDEX "FounderOsPeriodGoal_userId_period_periodKey_idx" ON "FounderOsPeriodGoal"("userId", "period", "periodKey");

-- 3. Per-day evening reflection (moved / blocked), idempotent per user+date
CREATE TABLE "FounderOsDailyReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "moved" TEXT,
    "blocked" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderOsDailyReflection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FounderOsDailyReflection_userId_date_key" ON "FounderOsDailyReflection"("userId", "date");
CREATE INDEX "FounderOsDailyReflection_userId_idx" ON "FounderOsDailyReflection"("userId");
CREATE INDEX "FounderOsDailyReflection_userId_date_idx" ON "FounderOsDailyReflection"("userId", "date");
