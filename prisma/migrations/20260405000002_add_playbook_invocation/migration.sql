-- M6 — Bias Detective → Playbooks → Nudges pipeline
-- Adds PlaybookInvocation model for tracking when users run playbooks in
-- response to bias detections, and adds Nudge.analysisId so nudges sourced
-- from the analysis completion path can link back to their Analysis.

-- PlaybookInvocation table
CREATE TABLE "PlaybookInvocation" (
  "id"                  TEXT        NOT NULL,
  "userId"              TEXT        NOT NULL,
  "orgId"               TEXT,
  "analysisId"          TEXT,
  "humanDecisionId"     TEXT,
  "playbookId"          TEXT        NOT NULL,
  "playbookName"        TEXT        NOT NULL,
  "playbookCategory"    TEXT,
  "matchedToxicCombo"   TEXT,
  "source"              TEXT        NOT NULL DEFAULT 'suggestion',
  "status"              TEXT        NOT NULL DEFAULT 'started',
  "startedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"         TIMESTAMP(3),
  "effectivenessRating" INTEGER,
  "notes"               TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlaybookInvocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaybookInvocation_userId_idx"           ON "PlaybookInvocation"("userId");
CREATE INDEX "PlaybookInvocation_orgId_idx"            ON "PlaybookInvocation"("orgId");
CREATE INDEX "PlaybookInvocation_analysisId_idx"       ON "PlaybookInvocation"("analysisId");
CREATE INDEX "PlaybookInvocation_humanDecisionId_idx"  ON "PlaybookInvocation"("humanDecisionId");
CREATE INDEX "PlaybookInvocation_playbookId_idx"       ON "PlaybookInvocation"("playbookId");
CREATE INDEX "PlaybookInvocation_playbookCategory_idx" ON "PlaybookInvocation"("playbookCategory");
CREATE INDEX "PlaybookInvocation_status_idx"           ON "PlaybookInvocation"("status");
CREATE INDEX "PlaybookInvocation_orgId_startedAt_idx"  ON "PlaybookInvocation"("orgId", "startedAt");

-- Nudge.analysisId: links nudges to their source Analysis (M6.4)
ALTER TABLE "Nudge" ADD COLUMN "analysisId" TEXT;
CREATE INDEX "Nudge_analysisId_idx" ON "Nudge"("analysisId");
