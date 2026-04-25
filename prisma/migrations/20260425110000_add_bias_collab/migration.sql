-- Bias-level collaboration: threaded comments + assignable tasks scoped per
-- BiasInstance. Both tables denormalise `orgId` for fast "everything my org
-- has on any bias" listings without a four-join path.
--
-- See prisma/schema.prisma models BiasComment + BiasTask for field-level
-- documentation.

CREATE TABLE "BiasComment" (
    "id"               TEXT NOT NULL,
    "biasInstanceId"   TEXT NOT NULL,
    "authorUserId"     TEXT NOT NULL,
    "orgId"            TEXT,
    "body"             TEXT NOT NULL,
    "parentCommentId"  TEXT,
    "mentions"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "resolvedAt"       TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiasComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BiasComment_biasInstanceId_idx"  ON "BiasComment"("biasInstanceId");
CREATE INDEX "BiasComment_orgId_idx"           ON "BiasComment"("orgId");
CREATE INDEX "BiasComment_authorUserId_idx"    ON "BiasComment"("authorUserId");
CREATE INDEX "BiasComment_parentCommentId_idx" ON "BiasComment"("parentCommentId");

ALTER TABLE "BiasComment"
    ADD CONSTRAINT "BiasComment_biasInstanceId_fkey"
    FOREIGN KEY ("biasInstanceId") REFERENCES "BiasInstance"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiasComment"
    ADD CONSTRAINT "BiasComment_parentCommentId_fkey"
    FOREIGN KEY ("parentCommentId") REFERENCES "BiasComment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE "BiasTask" (
    "id"              TEXT NOT NULL,
    "biasInstanceId"  TEXT NOT NULL,
    "orgId"           TEXT,
    "assigneeUserId"  TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'open',
    "title"           TEXT NOT NULL,
    "description"     TEXT,
    "dueAt"           TIMESTAMP(3),
    "resolvedAt"      TIMESTAMP(3),
    "resolutionNote"  TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiasTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BiasTask_biasInstanceId_idx"           ON "BiasTask"("biasInstanceId");
CREATE INDEX "BiasTask_orgId_idx"                    ON "BiasTask"("orgId");
CREATE INDEX "BiasTask_assigneeUserId_status_idx"    ON "BiasTask"("assigneeUserId", "status");
CREATE INDEX "BiasTask_createdByUserId_idx"          ON "BiasTask"("createdByUserId");

ALTER TABLE "BiasTask"
    ADD CONSTRAINT "BiasTask_biasInstanceId_fkey"
    FOREIGN KEY ("biasInstanceId") REFERENCES "BiasInstance"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
