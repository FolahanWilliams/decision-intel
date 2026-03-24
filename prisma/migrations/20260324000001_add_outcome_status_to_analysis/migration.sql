-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN "outcomeStatus" TEXT NOT NULL DEFAULT 'pending_outcome';
ALTER TABLE "Analysis" ADD COLUMN "outcomeDueAt" TIMESTAMP(3);

-- CreateIndex (for cron queries on overdue outcomes)
CREATE INDEX "Analysis_outcomeStatus_outcomeDueAt_idx" ON "Analysis"("outcomeStatus", "outcomeDueAt");
