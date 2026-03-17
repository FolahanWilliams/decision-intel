-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "sentiment" DOUBLE PRECISION,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biasTypes" TEXT[],
    "detectedEntities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceSync" (
    "id" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,

    CONSTRAINT "IntelligenceSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCache" (
    "id" TEXT NOT NULL,
    "doi" TEXT,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "authors" TEXT[],
    "journal" TEXT,
    "publishedAt" TIMESTAMP(3),
    "biasTypes" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "rawContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanDecisionAudit" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "processScore" DOUBLE PRECISION NOT NULL,
    "biasPresence" JSONB NOT NULL,
    "noiseVariance" DOUBLE PRECISION NOT NULL,
    "mapAlignment" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanDecisionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "orgId" TEXT,
    "humanDecisionId" TEXT NOT NULL,
    "nudgeType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamCognitiveProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "topBiases" TEXT[],
    "noiseScore" DOUBLE PRECISION NOT NULL,
    "diversityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamCognitiveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "notificationTypes" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");
CREATE INDEX "NewsArticle_relevanceScore_idx" ON "NewsArticle"("relevanceScore");
CREATE UNIQUE INDEX "ResearchCache_doi_key" ON "ResearchCache"("doi");
CREATE INDEX "ResearchCache_biasTypes_idx" ON "ResearchCache"("biasTypes");
CREATE INDEX "ResearchCache_expiresAt_idx" ON "ResearchCache"("expiresAt");
CREATE INDEX "Nudge_targetUserId_idx" ON "Nudge"("targetUserId");
CREATE INDEX "Nudge_orgId_idx" ON "Nudge"("orgId");
CREATE INDEX "Nudge_humanDecisionId_idx" ON "Nudge"("humanDecisionId");
CREATE INDEX "Nudge_nudgeType_idx" ON "Nudge"("nudgeType");
CREATE INDEX "Nudge_createdAt_idx" ON "Nudge"("createdAt");
CREATE UNIQUE INDEX "TeamCognitiveProfile_orgId_periodStart_periodEnd_key" ON "TeamCognitiveProfile"("orgId", "periodStart", "periodEnd");
CREATE INDEX "TeamCognitiveProfile_orgId_idx" ON "TeamCognitiveProfile"("orgId");
CREATE INDEX "TeamCognitiveProfile_periodStart_idx" ON "TeamCognitiveProfile"("periodStart");
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "HumanDecisionAudit" ADD CONSTRAINT "HumanDecisionAudit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_humanDecisionId_fkey" FOREIGN KEY ("humanDecisionId") REFERENCES "HumanDecisionAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
