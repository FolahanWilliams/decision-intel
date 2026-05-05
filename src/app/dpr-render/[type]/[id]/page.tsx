/**
 * DPR rendering route — server component, renders the McKinsey-grade
 * Decision Provenance Record as HTML.
 *
 * Locked 2026-05-05. This is the single source of truth for every DPR
 * surface — server-side Puppeteer hits this URL to produce PDFs, the
 * client-side Export DPR button opens this URL in a new tab and triggers
 * window.print(), and the build-time sample script (Phase 4) renders
 * specimen URLs to the public/ directory.
 *
 * URL shape: /dpr-render/[type]/[id]
 *   type = specimen → public, no auth (rate-limited at the API layer
 *                     when going through the Puppeteer endpoint)
 *   type = document → Supabase-auth + ownership check (Phase 4)
 *   type = package  → Supabase-auth + ownership check (Phase 4)
 *   type = deal     → Supabase-auth + ownership check (Phase 4)
 *
 * Phase 1 (this commit): renders the specimen path only. Phase 4 wires
 * the other three types + replaces the existing API consumers.
 */

import { notFound } from 'next/navigation';
import { buildSampleDprData } from '@/lib/reports/sample-dpr';
import { DprPageOneCover } from '@/components/dpr/pages/DprPageOneCover';
import type { ProvenanceRecordData } from '@/lib/reports/provenance-record-data';

const VALID_TYPES = ['specimen', 'document', 'package', 'deal'] as const;
type DprType = (typeof VALID_TYPES)[number];

const TOTAL_PAGES_PHASE_1 = 1;

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

  return (
    <DprPageOneCover
      title={titleForData(data)}
      subtitle={subtitleForData(data)}
      recordId={recordId}
      auditTimestamp={data.generatedAt.toISOString()}
      inputHash={data.inputHash}
      promptFingerprint={data.promptFingerprint}
      schemaVersion={`${data.schemaVersion}.1.0`}
      pipelineVersion={pipelineVersionFromLineage(data)}
      verifyUrl={verifyUrl}
      classification={type === 'specimen' ? 'specimen' : 'confidential'}
      totalPages={TOTAL_PAGES_PHASE_1}
      footerTitle="Decision Provenance Record"
    />
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
  // Specimen + procurement copy: lead with the audit, not the filename.
  // The filename is preserved as a secondary identifier in §1.
  if (data.userId === 'specimen') {
    return 'Audit of a private-market growth-company prospectus';
  }
  const filename = data.meta.filename ?? 'Strategic decision audit';
  // Strip extension, replace separators with spaces, split camelCase.
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
