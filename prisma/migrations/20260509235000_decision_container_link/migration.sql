-- Phase 3.5 — Decision Pipeline Constellation
-- Adds DecisionContainerLink table mapping cognitive lineage edges
-- between containers (precedes / spawned_from / depends_on / parent_of).
-- See container-link-types.ts SSOT.

CREATE TABLE "DecisionContainerLink" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "DecisionContainerLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionContainerLink_fromId_toId_linkType_key"
    ON "DecisionContainerLink"("fromId", "toId", "linkType");

CREATE INDEX "DecisionContainerLink_fromId_idx" ON "DecisionContainerLink"("fromId");
CREATE INDEX "DecisionContainerLink_toId_idx" ON "DecisionContainerLink"("toId");
CREATE INDEX "DecisionContainerLink_linkType_idx" ON "DecisionContainerLink"("linkType");

ALTER TABLE "DecisionContainerLink"
    ADD CONSTRAINT "DecisionContainerLink_fromId_fkey"
    FOREIGN KEY ("fromId") REFERENCES "DecisionContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DecisionContainerLink"
    ADD CONSTRAINT "DecisionContainerLink_toId_fkey"
    FOREIGN KEY ("toId") REFERENCES "DecisionContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
