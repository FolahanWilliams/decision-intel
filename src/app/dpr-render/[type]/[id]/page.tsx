/**
 * DPR rendering route — server component, renders the McKinsey-grade
 * Decision Provenance Record as HTML.
 *
 * Locked 2026-05-05. Single source of truth for every DPR surface — server-
 * side Puppeteer hits this URL to produce PDFs, the client-side Export DPR
 * button opens this URL in a new tab and triggers window.print(), and the
 * build-time sample script renders specimen URLs to the public/ directory.
 *
 * URL shape: /dpr-render/[type]/[id]
 *   type = specimen → public, no auth (rate-limited at the API layer)
 *   type = document → Supabase-auth + ownership check (Phase 4)
 *   type = package  → Supabase-auth + ownership check (Phase 4)
 *   type = deal     → Supabase-auth + ownership check (Phase 4)
 *
 * Phase 1: page 1 (cover + integrity).
 * Phase 2: page 2 (methodology) + page 3 (R²F strips).
 * Phase 3: page 4 (per-bias findings) + page 5 (Dalio structural assumptions)
 *          + page 6 (regulatory crosswalk).
 * Phase 4 will wire the document/package/deal types + retire legacy generator.
 */

import { notFound } from 'next/navigation';
import { buildSampleDprData, SAMPLE_FINDINGS_AUGMENT } from '@/lib/reports/sample-dpr';
import { DprPageOneCover } from '@/components/dpr/pages/DprPageOneCover';
import { DprPageTwoMethodology } from '@/components/dpr/pages/DprPageTwoMethodology';
import { DprPageThreeR2fStrips } from '@/components/dpr/pages/DprPageThreeR2fStrips';
import { DprPageFindings } from '@/components/dpr/pages/DprPageFindings';
import {
  DprPageStructuralAssumptions,
  SAMPLE_STRUCTURAL_ASSUMPTIONS,
} from '@/components/dpr/pages/DprPageStructuralAssumptions';
import { DprPageRegulatoryCrosswalk } from '@/components/dpr/pages/DprPageRegulatoryCrosswalk';
import { deriveDprFindings } from '@/lib/reports/dpr-findings';
import type { ProvenanceRecordData } from '@/lib/reports/provenance-record-data';

const VALID_TYPES = ['specimen', 'document', 'package', 'deal'] as const;
type DprType = (typeof VALID_TYPES)[number];

export default async function DprRenderPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const resolved = await params;
  const type = resolved.type as DprType;
  const id = resolved.id;

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const data = await loadDprData(type, id);
  if (!data) {
    notFound();
  }

  const recordId = formatRecordId(data);
  const verifyUrl = `https://decision-intel.com/verify/${recordId}`;
  const classification = type === 'specimen' ? 'specimen' : 'confidential';
  const auditTimestamp = data.generatedAt.toISOString();

  // Phase 3: derive findings from canonical data + per-bias augmentation.
  // Specimens get hand-curated evidence + mitigations; real audits will
  // populate from analysis.biases in Phase 4.
  const augment = type === 'specimen' ? SAMPLE_FINDINGS_AUGMENT : {};
  const findings = deriveDprFindings(data, augment);

  // Phase 3: Dalio structural assumptions. Specimens use the curated
  // 4-determinant set; real audits will read Analysis.structuralAssumptions
  // JSON in Phase 4.
  const structuralAssumptions =
    type === 'specimen' ? SAMPLE_STRUCTURAL_ASSUMPTIONS : [];

  const totalPages = 6; // Phase 3 — 6 logical pages, but Puppeteer's @page
  // counter renders the actual physical sheet count regardless.

  return (
    <>
      <DprPageOneCover
        title={titleForData(data)}
        subtitle={subtitleForData(data)}
        recordId={recordId}
        auditTimestamp={auditTimestamp}
        inputHash={data.inputHash}
        promptFingerprint={data.promptFingerprint}
        schemaVersion={`${data.schemaVersion}.1.0`}
        pipelineVersion={pipelineVersionFromLineage(data)}
        verifyUrl={verifyUrl}
        classification={classification}
        totalPages={totalPages}
        footerTitle="Decision Provenance Record"
      />
      <DprPageTwoMethodology
        judgeVariance={data.judgeVariance}
        modelLineage={data.modelLineage}
        pageNumber={2}
        totalPages={totalPages}
        classification={classification}
        auditTimestamp={auditTimestamp}
      />
      <DprPageThreeR2fStrips
        data={data}
        pageNumber={3}
        totalPages={totalPages}
        classification={classification}
        auditTimestamp={auditTimestamp}
      />
      <DprPageFindings
        findings={findings}
        pageNumber={4}
        totalPages={totalPages}
        classification={classification}
        auditTimestamp={auditTimestamp}
      />
      {structuralAssumptions.length > 0 && (
        <DprPageStructuralAssumptions
          assumptions={structuralAssumptions}
          pageNumber={5}
          totalPages={totalPages}
          classification={classification}
          auditTimestamp={auditTimestamp}
        />
      )}
      <DprPageRegulatoryCrosswalk
        data={data}
        pageNumber={6}
        totalPages={totalPages}
        classification={classification}
        auditTimestamp={auditTimestamp}
      />
    </>
  );
}

async function loadDprData(type: DprType, id: string): Promise<ProvenanceRecordData | null> {
  if (type === 'specimen') {
    if (id !== 'wework' && id !== 'heliograph') {
      return null;
    }
    return buildSampleDprData();
  }
  // Phase 4: document / package / deal paths land here with full auth +
  // ownership checks routed through assembleProvenanceRecordData*.
  return null;
}

function titleForData(data: ProvenanceRecordData): string {
  if (data.userId === 'specimen') {
    return 'Audit of a private-market growth-company prospectus';
  }
  const filename = data.meta.filename ?? 'Strategic decision audit';
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function subtitleForData(data: ProvenanceRecordData): string {
  if (data.userId === 'specimen') {
    return 'Anonymised from a 2019 Form S-1 that was withdrawn 33 days after filing. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.';
  }
  const firstSentence = data.meta.summary?.split('. ')[0] ?? '';
  return `${firstSentence}. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.`;
}

function formatRecordId(data: ProvenanceRecordData): string {
  const ts = data.generatedAt
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 12);
  const shortHash = data.inputHash.slice(0, 8);
  return `dpr_${ts}_${shortHash}`;
}

function pipelineVersionFromLineage(data: ProvenanceRecordData): string {
  const nodes = Object.keys(data.modelLineage.nodes ?? {});
  return `di-pipeline · ${nodes.length} nodes · v2.1.0`;
}
