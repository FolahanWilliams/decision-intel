-- Audit Defense Packet — per-audit signed, hashed artifact the CSO's
-- General Counsel can hand to the audit committee, SEC, or plaintiff's
-- counsel if a strategic decision is ever challenged. Stores metadata +
-- hashes only; never prompt content, never toxic-combination weights,
-- never per-org causal edges. See prisma/schema.prisma :: AuditDefensePacket
-- and src/lib/reports/audit-defense-packet-generator.ts for the reader.

CREATE TABLE "AuditDefensePacket" (
  "id" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orgId" TEXT,
  "promptFingerprint" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "modelLineage" JSONB NOT NULL,
  "judgeVariance" JSONB NOT NULL,
  "citations" JSONB NOT NULL,
  "regulatoryMapping" JSONB NOT NULL,
  "pipelineLineage" JSONB NOT NULL,
  "tsaSignature" TEXT,
  "reviewerSignatures" JSONB,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuditDefensePacket_pkey" PRIMARY KEY ("id")
);

-- One packet per audit. Cascade so deleting the audit drops the packet.
CREATE UNIQUE INDEX "AuditDefensePacket_analysisId_key"
  ON "AuditDefensePacket" ("analysisId");

CREATE INDEX "AuditDefensePacket_userId_idx"
  ON "AuditDefensePacket" ("userId");

CREATE INDEX "AuditDefensePacket_orgId_idx"
  ON "AuditDefensePacket" ("orgId");

CREATE INDEX "AuditDefensePacket_documentId_idx"
  ON "AuditDefensePacket" ("documentId");

CREATE INDEX "AuditDefensePacket_generatedAt_idx"
  ON "AuditDefensePacket" ("generatedAt");

ALTER TABLE "AuditDefensePacket"
  ADD CONSTRAINT "AuditDefensePacket_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
