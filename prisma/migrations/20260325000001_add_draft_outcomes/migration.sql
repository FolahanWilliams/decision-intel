-- CreateTable
CREATE TABLE "DraftOutcome" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT[],
    "matchedCriteria" TEXT[],
    "source" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DraftOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DraftOutcome_analysisId_idx" ON "DraftOutcome"("analysisId");

-- CreateIndex
CREATE INDEX "DraftOutcome_status_idx" ON "DraftOutcome"("status");

-- AddForeignKey
ALTER TABLE "DraftOutcome" ADD CONSTRAINT "DraftOutcome_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
