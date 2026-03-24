-- CreateTable
CREATE TABLE "DecisionEdge" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DecisionEdge_sourceType_sourceId_targetType_targetId_edgeType_key" ON "DecisionEdge"("sourceType", "sourceId", "targetType", "targetId", "edgeType");

-- CreateIndex
CREATE INDEX "DecisionEdge_orgId_idx" ON "DecisionEdge"("orgId");

-- CreateIndex
CREATE INDEX "DecisionEdge_sourceType_sourceId_idx" ON "DecisionEdge"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "DecisionEdge_targetType_targetId_idx" ON "DecisionEdge"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "DecisionEdge_edgeType_idx" ON "DecisionEdge"("edgeType");

-- CreateIndex
CREATE INDEX "DecisionEdge_strength_idx" ON "DecisionEdge"("strength");
