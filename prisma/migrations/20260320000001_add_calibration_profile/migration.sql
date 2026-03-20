-- CreateTable
CREATE TABLE "CalibrationProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "profileType" TEXT NOT NULL,
    "calibrationData" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "lastCalibratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationProfile_orgId_userId_profileType_key" ON "CalibrationProfile"("orgId", "userId", "profileType");

-- CreateIndex
CREATE INDEX "CalibrationProfile_orgId_idx" ON "CalibrationProfile"("orgId");

-- CreateIndex
CREATE INDEX "CalibrationProfile_userId_idx" ON "CalibrationProfile"("userId");

-- CreateIndex
CREATE INDEX "CalibrationProfile_profileType_idx" ON "CalibrationProfile"("profileType");
