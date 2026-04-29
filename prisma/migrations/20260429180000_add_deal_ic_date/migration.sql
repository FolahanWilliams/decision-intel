-- Add Deal.icDate (expected Investment Committee review date). Nullable
-- because deals in screening / portfolio / exited stages don't have a
-- scheduled IC review. Powers (a) the kanban card IC-date tile, (b) the
-- IC Readiness gate's countdown chip, (c) future "IC this week" deal
-- pipeline filters.
ALTER TABLE "Deal" ADD COLUMN "icDate" TIMESTAMP(3);
