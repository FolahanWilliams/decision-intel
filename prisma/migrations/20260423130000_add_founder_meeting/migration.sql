-- Founder Hub meeting log. See prisma/schema.prisma :: FounderMeeting.

CREATE TABLE "FounderMeeting" (
  "id" TEXT NOT NULL,
  "meetingType" TEXT NOT NULL,
  "prospectName" TEXT,
  "prospectRole" TEXT,
  "prospectCompany" TEXT,
  "linkedInInfo" TEXT NOT NULL,
  "meetingContext" TEXT NOT NULL,
  "founderAsk" TEXT NOT NULL,
  "prepPlan" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "happenedAt" TIMESTAMP(3),
  "notes" TEXT,
  "learnings" TEXT,
  "nextSteps" TEXT,
  "outcome" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prep',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderMeeting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FounderMeeting_status_scheduledAt_idx"
  ON "FounderMeeting"("status", "scheduledAt");

CREATE INDEX "FounderMeeting_happenedAt_idx"
  ON "FounderMeeting"("happenedAt");

CREATE INDEX "FounderMeeting_createdAt_idx"
  ON "FounderMeeting"("createdAt");
