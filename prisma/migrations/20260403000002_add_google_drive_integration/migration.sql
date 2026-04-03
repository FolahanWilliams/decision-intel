-- CreateTable
CREATE TABLE "GoogleDriveInstallation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "driveEmail" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "refreshTokenIv" TEXT NOT NULL,
    "refreshTokenTag" TEXT NOT NULL,
    "scopes" TEXT[],
    "monitoredFolders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "changesPageToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleDriveInstallation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleDriveInstallation_userId_key" ON "GoogleDriveInstallation"("userId");
CREATE INDEX "GoogleDriveInstallation_orgId_idx" ON "GoogleDriveInstallation"("orgId");
CREATE INDEX "GoogleDriveInstallation_status_idx" ON "GoogleDriveInstallation"("status");

-- Add source tracking to Document
ALTER TABLE "Document" ADD COLUMN "source" TEXT;
ALTER TABLE "Document" ADD COLUMN "sourceRef" TEXT;
CREATE INDEX "Document_source_sourceRef_idx" ON "Document"("source", "sourceRef");
