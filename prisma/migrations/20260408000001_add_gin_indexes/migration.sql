-- GIN indexes for frequently queried JSONB columns on the Analysis table.
-- These accelerate JSON containment queries (@>, ?, ?|, ?& operators)
-- used by compliance checks, cognitive analysis filters, and fact-check lookups.
--
-- Note: Cannot use CREATE INDEX CONCURRENTLY inside a transaction.
-- If applying via prisma migrate deploy, Prisma wraps in a transaction —
-- use `prisma db execute` or Supabase SQL editor for non-blocking creation.

CREATE INDEX IF NOT EXISTS "Analysis_compliance_gin" ON "Analysis" USING GIN ("compliance" jsonb_path_ops);
CREATE INDEX IF NOT EXISTS "Analysis_factCheck_gin" ON "Analysis" USING GIN ("factCheck" jsonb_path_ops);
CREATE INDEX IF NOT EXISTS "Analysis_cognitiveAnalysis_gin" ON "Analysis" USING GIN ("cognitiveAnalysis" jsonb_path_ops);
