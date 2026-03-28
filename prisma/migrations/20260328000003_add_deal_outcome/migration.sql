-- CreateTable
CREATE TABLE "DealOutcome" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "irr" DOUBLE PRECISION,
    "moic" DOUBLE PRECISION,
    "exitType" TEXT,
    "exitValue" DECIMAL(65,30),
    "holdPeriod" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealOutcome_dealId_key" ON "DealOutcome"("dealId");

-- AddForeignKey
ALTER TABLE "DealOutcome" ADD CONSTRAINT "DealOutcome_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
