-- M&A cascade hard-layer ship (locked 2026-05-09).
-- Two additive columns. No data backfill needed — both fields default to NULL
-- for legacy rows and are populated by new writes going forward. Existing
-- code paths fall through to legacy behaviour when the field is null
-- (Document.parsedStructuredData → inline-marker text extraction;
-- ToxicCombination.severity → derive from toxicScore at runtime).

-- Document.parsedStructuredData — type-aware structured parser output.
-- Replaces the inline-marker text round-trip in Document.content for
-- downstream DPR / aggregation / pipeline consumers. Generic JSON shape so
-- future parsers (qofe, integration_plan) reuse the same column.
ALTER TABLE "Document"
ADD COLUMN "parsedStructuredData" JSONB;

-- ToxicCombination.severity — first-class severity band for queryable
-- filtering. Derived from toxicScore + contextFactors at creation time.
-- Bands: 'critical' (toxicScore ≥ 80) | 'high' (≥ 60) | 'medium' (≥ 40)
-- | 'low' (< 40).
ALTER TABLE "ToxicCombination"
ADD COLUMN "severity" TEXT;

-- Index on (severity) so queries like "deals with critical toxic combinations
-- this quarter" run fast at scale. Sparse index — null severities (legacy
-- rows) are excluded.
CREATE INDEX "ToxicCombination_severity_idx"
ON "ToxicCombination" ("severity")
WHERE "severity" IS NOT NULL;
