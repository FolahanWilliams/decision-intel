-- Add contentHash column to Document for semantic caching / deduplication.
-- Uses IF NOT EXISTS so it is safe to re-run against a database that was
-- already partially migrated manually.
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "orgId"       TEXT;

-- Unique constraint (skip if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Document_contentHash_key'
  ) THEN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_contentHash_key" UNIQUE ("contentHash");
  END IF;
END $$;

-- Indexes for cache lookups and org-scoped queries
CREATE INDEX IF NOT EXISTS "Document_contentHash_idx" ON "Document"("contentHash");
CREATE INDEX IF NOT EXISTS "Document_updatedAt_idx"   ON "Document"("updatedAt");
