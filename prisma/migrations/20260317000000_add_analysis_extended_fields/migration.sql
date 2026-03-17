-- Add missing Analysis columns that exist in schema.prisma but were never migrated.
-- These columns caused P2022 errors on every analysis write and trends/insights read.

ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "noiseBenchmarks" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "intelligenceContext" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "metaVerdict" TEXT;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "biasWebImageUrl" TEXT;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "preMortemImageUrl" TEXT;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "preMortemRating" INTEGER;
