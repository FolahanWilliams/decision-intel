-- Design Partner rich profile + contacts support.
-- See prisma/schema.prisma :: DesignPartnerApplication / PartnerContact.
--
-- 1. Add slotOrder + richProfile to DesignPartnerApplication so the
--    5-seat cohort view can place partners into slots and render a
--    structured per-partner briefing.
-- 2. Create PartnerContact table so the founder can track specific
--    people at each partner plus their generated meeting-prep plans.

ALTER TABLE "DesignPartnerApplication"
  ADD COLUMN "slotOrder" INTEGER,
  ADD COLUMN "richProfile" JSONB;

CREATE INDEX "DesignPartnerApplication_slotOrder_idx"
  ON "DesignPartnerApplication"("slotOrder");

CREATE TABLE "PartnerContact" (
  "id" TEXT NOT NULL,
  "partnerAppId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "linkedInUrl" TEXT,
  "linkedInInfo" TEXT NOT NULL,
  "meetingContext" TEXT,
  "founderAsk" TEXT,
  "generatedPrep" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnerContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerContact_partnerAppId_idx" ON "PartnerContact"("partnerAppId");
CREATE INDEX "PartnerContact_createdAt_idx" ON "PartnerContact"("createdAt");

ALTER TABLE "PartnerContact"
  ADD CONSTRAINT "PartnerContact_partnerAppId_fkey"
  FOREIGN KEY ("partnerAppId")
  REFERENCES "DesignPartnerApplication"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
