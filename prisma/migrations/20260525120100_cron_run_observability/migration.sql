-- Cron-run observability ledger (locked 2026-05-25, maintenance audit)
--
-- One row per (cron-route × dispatch-invocation). Wraps every sub-route
-- call in the dispatcher so per-route success/failure/duration is
-- persisted, not just visible in Vercel stdout logs.
--
-- Closes the single-point-of-failure observability gap: until this
-- migration, a dispatcher timeout meant a week of dark crons with no
-- way to detect or quantify the gap. Now surface at /api/admin/cron-health.

CREATE TABLE "CronRun" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "httpStatus" INTEGER,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronRun_route_startedAt_idx" ON "CronRun"("route", "startedAt");
CREATE INDEX "CronRun_startedAt_idx" ON "CronRun"("startedAt");
CREATE INDEX "CronRun_status_startedAt_idx" ON "CronRun"("status", "startedAt");
