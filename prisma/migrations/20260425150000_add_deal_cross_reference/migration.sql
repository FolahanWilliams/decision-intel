-- 3.1 deep — Deal cross-document cross-reference.
-- Persists the agent's findings per Deal so the UI can render "the deal
-- as one decision" view (composite DQI + recurring biases + conflicts
-- between docs). One row per run; we keep history.

CREATE TABLE IF NOT EXISTS "DealCrossReference" (
  "id"               TEXT NOT NULL,
  "dealId"           TEXT NOT NULL,
  "runAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modelVersion"     TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
  "documentSnapshot" JSONB NOT NULL,
  "findings"         JSONB NOT NULL,
  "conflictCount"    INTEGER NOT NULL DEFAULT 0,
  "highSeverityCount" INTEGER NOT NULL DEFAULT 0,
  "status"           TEXT NOT NULL DEFAULT 'complete',
  "errorMessage"     TEXT,
  CONSTRAINT "DealCrossReference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DealCrossReference_dealId_runAt_idx"
  ON "DealCrossReference"("dealId", "runAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DealCrossReference_dealId_fkey'
  ) THEN
    ALTER TABLE "DealCrossReference"
      ADD CONSTRAINT "DealCrossReference_dealId_fkey"
      FOREIGN KEY ("dealId") REFERENCES "Deal"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
