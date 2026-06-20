-- Document content dedup is PER-USER, not global.
--
-- The upload route dedups on { contentHash, userId }, but the DB carried a
-- GLOBAL `UNIQUE(contentHash)`. The mismatch meant: once any one account held
-- a file, every OTHER account's upload of the same file collided on the global
-- hash, fell to a fragile "create without hash" fallback, and silently failed
-- (no row, no redirect — the "upload bar appeared then nothing happened" bug,
-- e.g. the WeWork sample owned by a test account blocking the founder).
--
-- Drop the global unique; add a composite unique that matches the dedup query.
-- Applied to production out-of-band 2026-06-20 via Supabase; this file + the
-- _prisma_migrations bookkeeping row keep `prisma migrate deploy` consistent.

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_contentHash_key";
DROP INDEX IF EXISTS "Document_contentHash_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Document_userId_contentHash_key"
  ON "Document" ("userId", "contentHash");
