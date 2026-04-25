-- Soft-delete + retention support for Document.
-- `deletedAt` is the soft-delete stamp. The /api/cron/enforce-retention cron
-- soft-deletes rows past their tier's retention window, then hard-deletes
-- (cascade + storage cleanup) after a 30-day grace.

ALTER TABLE "Document" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN "deletionReason" TEXT;

CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");
