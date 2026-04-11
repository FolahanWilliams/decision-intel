-- CreateTable
CREATE TABLE "OutreachArtifact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "contactName" TEXT,
    "contactTitle" TEXT,
    "contactCompany" TEXT,
    "sourceUrl" TEXT,
    "sourceText" TEXT,
    "extractedProfile" JSONB NOT NULL,
    "generatedMessage" TEXT NOT NULL,
    "talkingPoints" JSONB NOT NULL,
    "warmOpeners" JSONB NOT NULL,
    "intentCallouts" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachArtifact_userId_createdAt_idx" ON "OutreachArtifact"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachArtifact_userId_status_idx" ON "OutreachArtifact"("userId", "status");
