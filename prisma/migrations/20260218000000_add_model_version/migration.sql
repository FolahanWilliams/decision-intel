-- Add modelVersion column to Analysis table
-- This column tracks which Gemini model version produced the analysis

ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "modelVersion" TEXT;
