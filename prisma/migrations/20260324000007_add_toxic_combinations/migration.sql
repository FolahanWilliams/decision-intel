-- CreateTable
CREATE TABLE "ToxicCombination" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "analysisId" TEXT,
    "biasTypes" TEXT[],
    "contextFactors" JSONB NOT NULL,
    "toxicScore" DOUBLE PRECISION NOT NULL,
    "historicalFailRate" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "patternLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "mitigationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToxicCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToxicPattern" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "biasTypes" TEXT[],
    "contextPattern" JSONB NOT NULL,
    "failureRate" DOUBLE PRECISION NOT NULL,
    "avgImpactDelta" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToxicPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToxicCombination_orgId_idx" ON "ToxicCombination"("orgId");

-- CreateIndex
CREATE INDEX "ToxicCombination_analysisId_idx" ON "ToxicCombination"("analysisId");

-- CreateIndex
CREATE INDEX "ToxicCombination_toxicScore_idx" ON "ToxicCombination"("toxicScore");

-- CreateIndex
CREATE INDEX "ToxicCombination_status_idx" ON "ToxicCombination"("status");

-- CreateIndex
CREATE INDEX "ToxicPattern_orgId_idx" ON "ToxicPattern"("orgId");

-- CreateIndex
CREATE INDEX "ToxicPattern_failureRate_idx" ON "ToxicPattern"("failureRate");

-- AddForeignKey
ALTER TABLE "ToxicCombination" ADD CONSTRAINT "ToxicCombination_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
