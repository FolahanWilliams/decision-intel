-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
