-- CreateTable
CREATE TABLE "OutreachIntelBrief" (
    "id" TEXT NOT NULL,
    "briefDate" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "shortlist" JSONB,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachIntelBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachIntelBrief_briefDate_key" ON "OutreachIntelBrief"("briefDate");

-- CreateIndex
CREATE INDEX "OutreachIntelBrief_createdAt_idx" ON "OutreachIntelBrief"("createdAt");
