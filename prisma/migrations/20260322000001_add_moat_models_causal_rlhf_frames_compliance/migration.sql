-- Moat 1: Causal AI Layer — CausalEdge
CREATE TABLE "CausalEdge" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "fromVar" TEXT NOT NULL,
    "toVar" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CausalEdge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CausalEdge_orgId_fromVar_toVar_key" ON "CausalEdge"("orgId", "fromVar", "toVar");
CREATE INDEX "CausalEdge_orgId_idx" ON "CausalEdge"("orgId");

-- Moat 3: Structured RLHF — DecisionPrior
CREATE TABLE "DecisionPrior" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultAction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceToChange" TEXT,
    "postAnalysisAction" TEXT,
    "beliefDelta" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionPrior_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionPrior_analysisId_key" ON "DecisionPrior"("analysisId");
CREATE INDEX "DecisionPrior_userId_idx" ON "DecisionPrior"("userId");

ALTER TABLE "DecisionPrior" ADD CONSTRAINT "DecisionPrior_analysisId_fkey"
    FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Moat 4: Outcomes-First Workflow — DecisionFrame
CREATE TABLE "DecisionFrame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "decisionStatement" TEXT NOT NULL,
    "defaultAction" TEXT NOT NULL,
    "successCriteria" TEXT[],
    "failureCriteria" TEXT[],
    "stakeholders" TEXT[],
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionFrame_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionFrame_documentId_key" ON "DecisionFrame"("documentId");
CREATE INDEX "DecisionFrame_userId_idx" ON "DecisionFrame"("userId");
CREATE INDEX "DecisionFrame_orgId_idx" ON "DecisionFrame"("orgId");

ALTER TABLE "DecisionFrame" ADD CONSTRAINT "DecisionFrame_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Moat 5: Deep Vertical Integration — ComplianceAssessment
CREATE TABLE "ComplianceAssessment" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "outcomeScores" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "remediationPlan" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceAssessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComplianceAssessment_analysisId_idx" ON "ComplianceAssessment"("analysisId");
CREATE INDEX "ComplianceAssessment_framework_idx" ON "ComplianceAssessment"("framework");
CREATE INDEX "ComplianceAssessment_riskLevel_idx" ON "ComplianceAssessment"("riskLevel");

ALTER TABLE "ComplianceAssessment" ADD CONSTRAINT "ComplianceAssessment_analysisId_fkey"
    FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
