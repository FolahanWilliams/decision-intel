-- CreateTable
CREATE TABLE "DecisionBriefRecord" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "brief" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionBriefRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionBriefRecord_dealId_idx" ON "DecisionBriefRecord"("dealId");

-- CreateIndex
CREATE INDEX "DecisionBriefRecord_userId_idx" ON "DecisionBriefRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionBriefRecord_dealId_version_key" ON "DecisionBriefRecord"("dealId", "version");
