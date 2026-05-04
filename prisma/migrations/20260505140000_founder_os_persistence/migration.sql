-- GTM v3.5 §11 Founder Operating System persistence — 5 tables.
-- userId is a string reference to Supabase auth.users (no FK constraint
-- because Supabase manages auth in a separate schema). Multi-device sync
-- works because Supabase auth syncs the same user.id across phone + laptop.

CREATE TABLE "FounderOsCheckin" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "sfcZero" BOOLEAN NOT NULL,
  "deepWorkHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deepReadingMinutes" INTEGER NOT NULL DEFAULT 0,
  "exercise" BOOLEAN NOT NULL DEFAULT false,
  "meditation" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderOsCheckin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FounderOsCheckin_userId_date_key" ON "FounderOsCheckin"("userId", "date");
CREATE INDEX "FounderOsCheckin_userId_idx" ON "FounderOsCheckin"("userId");
CREATE INDEX "FounderOsCheckin_userId_date_idx" ON "FounderOsCheckin"("userId", "date");

CREATE TABLE "FounderOsContentLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "title" VARCHAR(500) NOT NULL,
  "source" TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "activeRecallSummary" TEXT NOT NULL,
  CONSTRAINT "FounderOsContentLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FounderOsContentLog_userId_idx" ON "FounderOsContentLog"("userId");
CREATE INDEX "FounderOsContentLog_userId_capturedAt_idx" ON "FounderOsContentLog"("userId", "capturedAt");

CREATE TABLE "FounderOsSkill" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quarter" TEXT NOT NULL,
  "skill" VARCHAR(500) NOT NULL,
  "whyItMatters" TEXT,
  "preAssessment" TEXT,
  "postAssessment" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderOsSkill_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FounderOsSkill_userId_idx" ON "FounderOsSkill"("userId");
CREATE INDEX "FounderOsSkill_userId_status_idx" ON "FounderOsSkill"("userId", "status");

CREATE TABLE "FounderOsWeeklyReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekStartDate" TEXT NOT NULL,
  "topLongForm" TEXT NOT NULL,
  "oneSkillNote" TEXT,
  "internalLocusReflection" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderOsWeeklyReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FounderOsWeeklyReview_userId_weekStartDate_key" ON "FounderOsWeeklyReview"("userId", "weekStartDate");
CREATE INDEX "FounderOsWeeklyReview_userId_idx" ON "FounderOsWeeklyReview"("userId");
CREATE INDEX "FounderOsWeeklyReview_userId_weekStartDate_idx" ON "FounderOsWeeklyReview"("userId", "weekStartDate");

CREATE TABLE "FounderOsCommitment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "title" VARCHAR(200),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FounderOsCommitment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FounderOsCommitment_userId_idx" ON "FounderOsCommitment"("userId");
CREATE INDEX "FounderOsCommitment_userId_createdAt_idx" ON "FounderOsCommitment"("userId", "createdAt");
