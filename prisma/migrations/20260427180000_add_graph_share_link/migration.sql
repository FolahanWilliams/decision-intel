-- A2 deep (locked 2026-04-27): Decision Knowledge Graph share link.
-- Stores a snapshot of the org's graph-network report at share-time so the
-- public viewer renders frozen-in-time data, not live (protects against
-- shared URLs leaking subsequent audits + lets the public route work
-- without auth context).

CREATE TABLE "GraphShareLink" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orgId" TEXT,
  "snapshot" JSONB NOT NULL,
  "sharerLabel" TEXT NOT NULL,
  "isRedacted" BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "password" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "lastViewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GraphShareLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GraphShareLink_token_key" ON "GraphShareLink"("token");
CREATE INDEX "GraphShareLink_userId_idx" ON "GraphShareLink"("userId");
CREATE INDEX "GraphShareLink_orgId_idx" ON "GraphShareLink"("orgId");
CREATE INDEX "GraphShareLink_token_idx" ON "GraphShareLink"("token");
CREATE INDEX "GraphShareLink_expiresAt_idx" ON "GraphShareLink"("expiresAt");
