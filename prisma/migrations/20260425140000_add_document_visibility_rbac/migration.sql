-- 3.5 Document-level RBAC.
-- Adds a `visibility` column on Document plus a DocumentAccess table for
-- the `specific` visibility mode (explicit user allowlist).
--
-- Defaulting `visibility = 'team'` preserves pre-3.5 behaviour: orgId-match
-- continues to grant access to teammates. Owners can switch to 'private' or
-- 'specific' from the share modal on the document detail page.
--
-- DocumentAccess.userId is NOT a foreign key because user IDs originate in
-- Supabase auth.users, which sits outside the Prisma-managed schema.

ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'team';

CREATE TABLE IF NOT EXISTS "DocumentAccess" (
  "id"          TEXT NOT NULL,
  "documentId"  TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "permission"  TEXT NOT NULL DEFAULT 'read',
  "grantedById" TEXT NOT NULL,
  "grantedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentAccess_documentId_userId_key"
  ON "DocumentAccess"("documentId", "userId");

CREATE INDEX IF NOT EXISTS "DocumentAccess_userId_idx"
  ON "DocumentAccess"("userId");

CREATE INDEX IF NOT EXISTS "DocumentAccess_documentId_idx"
  ON "DocumentAccess"("documentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentAccess_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentAccess"
      ADD CONSTRAINT "DocumentAccess_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
