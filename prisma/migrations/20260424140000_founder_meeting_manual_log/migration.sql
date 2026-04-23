-- FounderMeeting manual-log support.
-- See prisma/schema.prisma :: FounderMeeting.
--
-- Allow past meetings to be logged without generating a prep plan.
-- Every prep-only field becomes nullable; a new `source` column
-- distinguishes prep-flow rows from manual-log rows.

ALTER TABLE "FounderMeeting"
  ALTER COLUMN "linkedInInfo" DROP NOT NULL,
  ALTER COLUMN "meetingContext" DROP NOT NULL,
  ALTER COLUMN "founderAsk" DROP NOT NULL,
  ALTER COLUMN "prepPlan" DROP NOT NULL,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'prep';
