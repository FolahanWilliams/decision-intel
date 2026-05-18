-- Wedge conversion ledger (locked 2026-05-18). GTM v3.5 Phase-1 motion
-- mandate: "track conversion religiously — DMs sent, replies, audit
-- booked, audit completed, conversion." The instrument that turns the
-- month-4 kill checkpoint (<5 paid = halt-and-pivot) from a cliff into
-- a steerable dashboard. Founder-only surface; soft link to
-- OutreachArtifact (no FK by design — decoupled + schema-drift-tolerant).

-- CreateTable
CREATE TABLE "WedgeProspect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "persona" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'linkedin_dm',
    "stage" TEXT NOT NULL DEFAULT 'dm_sent',
    "anchorCaseSlug" TEXT,
    "artifactId" TEXT,
    "notes" TEXT,
    "lostReason" TEXT,
    "dmSentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "auditBookedAt" TIMESTAMP(3),
    "auditCompletedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WedgeProspect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WedgeProspect_userId_stage_idx" ON "WedgeProspect"("userId", "stage");

-- CreateIndex
CREATE INDEX "WedgeProspect_userId_updatedAt_idx" ON "WedgeProspect"("userId", "updatedAt");
