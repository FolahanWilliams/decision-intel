-- RUN THIS IN SUPABASE SQL EDITOR TO FIX PRODUCTION

-- 1. Add missing JSONB columns for Agents
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "structuredContent" TEXT;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "noiseStats" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "factCheck" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "compliance" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "preMortem" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "sentiment" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "cognitiveAnalysis" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "simulation" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "institutionalMemory" JSONB;
ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "speakers" TEXT[];

-- 2. Update Embedding Dimensions (Safe Mode)
-- Note: Changing vector dimensions usually requires checking existing data.
-- This command attempts to update it to 3072.
ALTER TABLE "DecisionEmbedding" ALTER COLUMN embedding TYPE vector(3072);
