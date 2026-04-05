-- Add isSample flag to the four root-level models that get populated by
-- /api/demo/seed (M4 — Cold-Start Fix). BiasInstance and DecisionOutcome
-- inherit their sample-ness transitively via ON DELETE CASCADE from Analysis.

-- Document
ALTER TABLE "Document" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Document_orgId_isSample_idx" ON "Document"("orgId", "isSample");

-- Analysis
ALTER TABLE "Analysis" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Analysis_isSample_idx" ON "Analysis"("isSample");

-- HumanDecision
ALTER TABLE "HumanDecision" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "HumanDecision_orgId_isSample_idx" ON "HumanDecision"("orgId", "isSample");

-- DecisionEdge
ALTER TABLE "DecisionEdge" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "DecisionEdge_orgId_isSample_idx" ON "DecisionEdge"("orgId", "isSample");
