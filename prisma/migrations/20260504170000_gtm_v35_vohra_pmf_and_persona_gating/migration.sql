-- GTM v3.5 (RATIFIED 2026-05-04): Vohra PMF survey + Phase 1 buyer-class-continuous persona gating.
-- Adds 3 fields to UserSettings + creates VohraPMFResponse table.
-- Allowed phase1Persona values: 'fractional_cso' | 'midmarket_corp_dev' | 'smaller_fund_gp' | 'pe_backed_founder' | 'other'.

ALTER TABLE "UserSettings"
  ADD COLUMN "phase1Persona" TEXT,
  ADD COLUMN "phase1PersonaRoleDetail" TEXT,
  ADD COLUMN "phase1HxcEligible" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "VohraPMFResponse" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "veryDisappointed" TEXT,
  "hxcType" TEXT,
  "mainBenefit" TEXT,
  "improvement" TEXT,
  "referralWillingness" INTEGER,
  "phase1PersonaAtTime" TEXT,
  "hxcEligibleAtTime" BOOLEAN NOT NULL DEFAULT false,
  "auditCountAtTrigger" INTEGER NOT NULL DEFAULT 0,
  "daysSinceSignup" INTEGER NOT NULL DEFAULT 0,
  "triggerReason" TEXT NOT NULL DEFAULT 'audits_complete_2_in_14d',
  "dismissedCount" INTEGER NOT NULL DEFAULT 0,
  "lastDismissedAt" TIMESTAMP(3),
  CONSTRAINT "VohraPMFResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VohraPMFResponse_userId_idx" ON "VohraPMFResponse"("userId");
CREATE INDEX "VohraPMFResponse_triggeredAt_idx" ON "VohraPMFResponse"("triggeredAt");
CREATE INDEX "VohraPMFResponse_hxcEligibleAtTime_idx" ON "VohraPMFResponse"("hxcEligibleAtTime");
CREATE INDEX "VohraPMFResponse_completedAt_idx" ON "VohraPMFResponse"("completedAt");
