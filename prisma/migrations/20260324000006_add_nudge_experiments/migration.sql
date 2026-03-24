CREATE TABLE "NudgeExperiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nudgeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "variants" JSONB NOT NULL,
    "trafficSplit" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NudgeExperiment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Nudge" ADD COLUMN "experimentId" TEXT;
ALTER TABLE "Nudge" ADD COLUMN "variantId" TEXT;

CREATE INDEX "NudgeExperiment_nudgeType_idx" ON "NudgeExperiment"("nudgeType");
CREATE INDEX "NudgeExperiment_status_idx" ON "NudgeExperiment"("status");
CREATE INDEX "Nudge_experimentId_idx" ON "Nudge"("experimentId");
