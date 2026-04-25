-- Document-level versioning + cross-document analysis delta link.
-- See prisma/schema.prisma Document.parentDocumentId / versionNumber and
-- Analysis.previousAnalysisId for field-level documentation.

ALTER TABLE "Document" ADD COLUMN "parentDocumentId" TEXT;
ALTER TABLE "Document" ADD COLUMN "versionNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Document"
    ADD CONSTRAINT "Document_parentDocumentId_fkey"
    FOREIGN KEY ("parentDocumentId") REFERENCES "Document"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Document_parentDocumentId_versionNumber_idx"
    ON "Document"("parentDocumentId", "versionNumber");


ALTER TABLE "Analysis" ADD COLUMN "previousAnalysisId" TEXT;

ALTER TABLE "Analysis"
    ADD CONSTRAINT "Analysis_previousAnalysisId_fkey"
    FOREIGN KEY ("previousAnalysisId") REFERENCES "Analysis"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Analysis_previousAnalysisId_idx" ON "Analysis"("previousAnalysisId");
