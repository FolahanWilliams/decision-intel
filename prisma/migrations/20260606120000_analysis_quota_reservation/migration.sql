-- Short-lived monthly-analysis quota reservation (closes the concurrent
-- count-then-create cost race on the analysis pipeline). Additive table only —
-- zero risk to existing rows; pre-deploy code falls back to the legacy
-- non-atomic limit check (fail-open on schema drift) until this is applied.

-- CreateTable
CREATE TABLE "AnalysisReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisReservation_userId_createdAt_idx" ON "AnalysisReservation"("userId", "createdAt");
