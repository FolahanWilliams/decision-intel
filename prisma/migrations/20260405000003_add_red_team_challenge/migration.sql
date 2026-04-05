-- M7 — Dr. Red Team Persona
-- New RedTeamChallenge model for user-invoked adversarial challenges
-- against analyses or decision rooms.

CREATE TABLE "RedTeamChallenge" (
  "id"                  TEXT        NOT NULL,
  "userId"              TEXT        NOT NULL,
  "orgId"               TEXT,
  "analysisId"          TEXT,
  "decisionRoomId"      TEXT,
  "targetClaim"         TEXT        NOT NULL,
  "primaryObjection"    TEXT        NOT NULL,
  "secondaryObjections" TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  "structuralQuestions" TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  "closingLine"         TEXT        NOT NULL,
  "usefulRating"        INTEGER,
  "notes"               TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RedTeamChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RedTeamChallenge_userId_idx"          ON "RedTeamChallenge"("userId");
CREATE INDEX "RedTeamChallenge_orgId_idx"           ON "RedTeamChallenge"("orgId");
CREATE INDEX "RedTeamChallenge_analysisId_idx"      ON "RedTeamChallenge"("analysisId");
CREATE INDEX "RedTeamChallenge_decisionRoomId_idx"  ON "RedTeamChallenge"("decisionRoomId");
CREATE INDEX "RedTeamChallenge_orgId_createdAt_idx" ON "RedTeamChallenge"("orgId", "createdAt");
