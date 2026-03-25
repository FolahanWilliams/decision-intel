-- CreateTable
CREATE TABLE "CausalDAG" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nodes" TEXT[],
    "edges" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'constraint_based',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CausalDAG_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CausalDAG_orgId_key" ON "CausalDAG"("orgId");

-- CreateIndex
CREATE INDEX "CausalDAG_orgId_idx" ON "CausalDAG"("orgId");
