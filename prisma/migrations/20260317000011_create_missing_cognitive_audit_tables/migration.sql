-- CreateTable
CREATE TABLE "HumanDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "channel" TEXT,
    "decisionType" TEXT,
    "participants" TEXT[],
    "content" TEXT NOT NULL,
    "contentHash" TEXT,
    "linkedAnalysisId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveAudit" (
    "id" TEXT NOT NULL,
    "humanDecisionId" TEXT NOT NULL,
    "decisionQualityScore" DOUBLE PRECISION NOT NULL,
    "noiseScore" DOUBLE PRECISION NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "biasFindings" JSONB,
    "noiseStats" JSONB,
    "complianceResult" JSONB,
    "preMortem" JSONB,
    "logicalAnalysis" JSONB,
    "swotAnalysis" JSONB,
    "sentimentDetail" JSONB,
    "teamConsensusFlag" BOOLEAN NOT NULL DEFAULT false,
    "dissenterCount" INTEGER NOT NULL DEFAULT 0,
    "biasWebImageUrl" TEXT,
    "preMortemImageUrl" TEXT,
    "summary" TEXT NOT NULL,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HumanDecision_contentHash_key" ON "HumanDecision"("contentHash");
CREATE INDEX "HumanDecision_userId_idx" ON "HumanDecision"("userId");
CREATE INDEX "HumanDecision_orgId_idx" ON "HumanDecision"("orgId");
CREATE INDEX "HumanDecision_source_idx" ON "HumanDecision"("source");
CREATE INDEX "HumanDecision_channel_idx" ON "HumanDecision"("channel");
CREATE INDEX "HumanDecision_createdAt_idx" ON "HumanDecision"("createdAt");
CREATE INDEX "HumanDecision_contentHash_idx" ON "HumanDecision"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "CognitiveAudit_humanDecisionId_key" ON "CognitiveAudit"("humanDecisionId");
CREATE INDEX "CognitiveAudit_humanDecisionId_idx" ON "CognitiveAudit"("humanDecisionId");
CREATE INDEX "CognitiveAudit_createdAt_idx" ON "CognitiveAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "CognitiveAudit" ADD CONSTRAINT "CognitiveAudit_humanDecisionId_fkey" FOREIGN KEY ("humanDecisionId") REFERENCES "HumanDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_humanDecisionId_fkey" FOREIGN KEY ("humanDecisionId") REFERENCES "HumanDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
