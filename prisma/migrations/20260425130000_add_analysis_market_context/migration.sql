-- 3.6 Market-context flag on bias detection.
-- Adds a JSON column on Analysis storing the auto-detected market context
-- (emerging_market | developed_market | cross_border | unknown), the
-- jurisdictions that drove the classification, and the CAGR ceiling the
-- bias detector used as the overconfidence trigger. Surfaces as a chip on
-- the analysis detail page.

ALTER TABLE "Analysis" ADD COLUMN IF NOT EXISTS "marketContextApplied" JSONB;
