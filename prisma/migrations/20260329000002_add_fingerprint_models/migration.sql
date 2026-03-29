-- CreateTable
CREATE TABLE "ContextualBiasPattern" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "biasType" TEXT NOT NULL,
    "documentType" TEXT,
    "dealType" TEXT,
    "quarter" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL,
    "avgSeverity" DOUBLE PRECISION NOT NULL,
    "totalAnalyses" INTEGER NOT NULL,
    "prevalenceRate" DOUBLE PRECISION NOT NULL,
    "trend" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContextualBiasPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FingerprintWarning" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "warningType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "matchedPattern" JSONB NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FingerprintWarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContextualBiasPattern_orgId_idx" ON "ContextualBiasPattern"("orgId");

-- CreateIndex
CREATE INDEX "ContextualBiasPattern_orgId_quarter_idx" ON "ContextualBiasPattern"("orgId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "ContextualBiasPattern_orgId_biasType_documentType_dealType_quarter_key" ON "ContextualBiasPattern"("orgId", "biasType", "documentType", "dealType", "quarter");

-- CreateIndex
CREATE INDEX "FingerprintWarning_orgId_idx" ON "FingerprintWarning"("orgId");

-- CreateIndex
CREATE INDEX "FingerprintWarning_analysisId_idx" ON "FingerprintWarning"("analysisId");

-- AddForeignKey
ALTER TABLE "FingerprintWarning" ADD CONSTRAINT "FingerprintWarning_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
