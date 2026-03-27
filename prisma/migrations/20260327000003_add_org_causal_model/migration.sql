-- CreateTable
CREATE TABLE "OrgCausalModel" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "totalOutcomes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgCausalModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgCausalModel_orgId_key" ON "OrgCausalModel"("orgId");

-- CreateIndex
CREATE INDEX "OrgCausalModel_orgId_idx" ON "OrgCausalModel"("orgId");
