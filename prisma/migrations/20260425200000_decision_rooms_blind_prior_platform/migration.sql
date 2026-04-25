-- 4.1 deep — Pre-IC Blind-Prior platform on Decision Rooms.
-- Adds deadline + reveal timestamps to DecisionRoom, plus the new
-- DecisionRoomBlindPrior and DecisionRoomInvite tables.

-- ── DecisionRoom: deadline / reveal / outcome-frame fields ──────────
ALTER TABLE "DecisionRoom"
  ADD COLUMN IF NOT EXISTS "blindPriorDeadline"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "blindPriorRevealedAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "blindPriorOutcomeFrame" TEXT;

CREATE INDEX IF NOT EXISTS "DecisionRoom_blindPriorDeadline_idx"
  ON "DecisionRoom"("blindPriorDeadline");

-- ── DecisionRoomBlindPrior table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionRoomBlindPrior" (
  "id"                TEXT NOT NULL,
  "roomId"            TEXT NOT NULL,
  "respondentUserId"  TEXT,
  "respondentEmail"   TEXT,
  "respondentName"    TEXT,
  "confidencePercent" INTEGER NOT NULL,
  "topRisks"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "privateRationale"  TEXT,
  "shareRationale"    BOOLEAN NOT NULL DEFAULT false,
  "shareIdentity"     BOOLEAN NOT NULL DEFAULT false,
  "submittedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "brierScore"        DOUBLE PRECISION,
  "brierCategory"     TEXT,
  "brierCalculatedAt" TIMESTAMP(3),
  CONSTRAINT "DecisionRoomBlindPrior_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DecisionRoomBlindPrior_room_user_uniq"
  ON "DecisionRoomBlindPrior"("roomId", "respondentUserId")
  WHERE "respondentUserId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "DecisionRoomBlindPrior_room_email_uniq"
  ON "DecisionRoomBlindPrior"("roomId", "respondentEmail")
  WHERE "respondentEmail" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "DecisionRoomBlindPrior_roomId_idx"
  ON "DecisionRoomBlindPrior"("roomId");
CREATE INDEX IF NOT EXISTS "DecisionRoomBlindPrior_respondentUserId_idx"
  ON "DecisionRoomBlindPrior"("respondentUserId");
CREATE INDEX IF NOT EXISTS "DecisionRoomBlindPrior_respondentEmail_idx"
  ON "DecisionRoomBlindPrior"("respondentEmail");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionRoomBlindPrior_roomId_fkey'
  ) THEN
    ALTER TABLE "DecisionRoomBlindPrior"
      ADD CONSTRAINT "DecisionRoomBlindPrior_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "DecisionRoom"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── DecisionRoomInvite table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DecisionRoomInvite" (
  "id"              TEXT NOT NULL,
  "roomId"          TEXT NOT NULL,
  "userId"          TEXT,
  "email"           TEXT,
  "displayName"     TEXT,
  "role"            TEXT NOT NULL DEFAULT 'voter',
  "submissionToken" TEXT NOT NULL,
  "tokenExpiresAt"  TIMESTAMP(3) NOT NULL,
  "sentAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt"          TIMESTAMP(3),
  "remindedAt"      TIMESTAMP(3),
  CONSTRAINT "DecisionRoomInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DecisionRoomInvite_submissionToken_key"
  ON "DecisionRoomInvite"("submissionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "DecisionRoomInvite_room_user_uniq"
  ON "DecisionRoomInvite"("roomId", "userId")
  WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "DecisionRoomInvite_room_email_uniq"
  ON "DecisionRoomInvite"("roomId", "email")
  WHERE "email" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "DecisionRoomInvite_roomId_idx"
  ON "DecisionRoomInvite"("roomId");
CREATE INDEX IF NOT EXISTS "DecisionRoomInvite_submissionToken_idx"
  ON "DecisionRoomInvite"("submissionToken");
CREATE INDEX IF NOT EXISTS "DecisionRoomInvite_tokenExpiresAt_idx"
  ON "DecisionRoomInvite"("tokenExpiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionRoomInvite_roomId_fkey'
  ) THEN
    ALTER TABLE "DecisionRoomInvite"
      ADD CONSTRAINT "DecisionRoomInvite_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "DecisionRoom"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
