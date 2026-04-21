-- Design Partner Applications — inbound applications to the 5-seat
-- design-partner cohort (see prisma/schema.prisma :: DesignPartnerApplication
-- and src/app/(marketing)/design-partner/). Status transitions will be
-- managed via the Founder Hub in a follow-up PR.

CREATE TABLE "DesignPartnerApplication" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "linkedInUrl" TEXT,
  "industry" TEXT NOT NULL,
  "teamSize" TEXT NOT NULL,
  "memoCadence" TEXT,
  "currentStack" TEXT,
  "whyNow" TEXT NOT NULL,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'applied',
  "founderNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "callScheduledAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DesignPartnerApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DesignPartnerApplication_status_idx"
  ON "DesignPartnerApplication" ("status");

CREATE INDEX "DesignPartnerApplication_submittedAt_idx"
  ON "DesignPartnerApplication" ("submittedAt");

CREATE INDEX "DesignPartnerApplication_email_idx"
  ON "DesignPartnerApplication" ("email");
