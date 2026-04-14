-- Add role + tour seen fields for Onborda-powered onboarding flow
ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "onboardingRole" TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingTourSeen" BOOLEAN NOT NULL DEFAULT false;
