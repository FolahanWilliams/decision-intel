-- AlterTable: Add success case study fields to CaseStudy model
ALTER TABLE "CaseStudy" ADD COLUMN "impactDirection" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN "impactScore" INTEGER;
ALTER TABLE "CaseStudy" ADD COLUMN "estimatedImpact" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN "biasesManaged" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CaseStudy" ADD COLUMN "mitigationFactors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CaseStudy" ADD COLUMN "beneficialPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CaseStudy" ADD COLUMN "survivorshipBiasRisk" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN "source" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN "decisionContext" TEXT;

-- CreateIndex
CREATE INDEX "CaseStudy_outcome_idx" ON "CaseStudy"("outcome");
