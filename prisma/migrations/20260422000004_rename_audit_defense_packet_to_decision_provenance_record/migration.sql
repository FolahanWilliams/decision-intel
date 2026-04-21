-- Rename AuditDefensePacket → DecisionProvenanceRecord (2026-04-22).
-- Reason: "Provenance" maps to EU AI Act Article 14 (record-keeping),
-- SEC AI disclosure, and Basel III ICAAP documentation. "Defense" was
-- reactive ("something went wrong and we're defending"); "Provenance"
-- is the record AI-augmented decision-making is always supposed to
-- produce, independent of whether anyone asks for it.

ALTER TABLE "AuditDefensePacket" RENAME TO "DecisionProvenanceRecord";

-- Rename the primary key constraint to match the new table name.
ALTER TABLE "DecisionProvenanceRecord"
  RENAME CONSTRAINT "AuditDefensePacket_pkey" TO "DecisionProvenanceRecord_pkey";

-- Rename the foreign key so Prisma's introspection stays consistent.
ALTER TABLE "DecisionProvenanceRecord"
  RENAME CONSTRAINT "AuditDefensePacket_analysisId_fkey" TO "DecisionProvenanceRecord_analysisId_fkey";

-- Rename indexes so new migrations don't collide on the old names.
ALTER INDEX "AuditDefensePacket_analysisId_key"
  RENAME TO "DecisionProvenanceRecord_analysisId_key";

ALTER INDEX "AuditDefensePacket_userId_idx"
  RENAME TO "DecisionProvenanceRecord_userId_idx";

ALTER INDEX "AuditDefensePacket_orgId_idx"
  RENAME TO "DecisionProvenanceRecord_orgId_idx";

ALTER INDEX "AuditDefensePacket_documentId_idx"
  RENAME TO "DecisionProvenanceRecord_documentId_idx";

ALTER INDEX "AuditDefensePacket_generatedAt_idx"
  RENAME TO "DecisionProvenanceRecord_generatedAt_idx";
