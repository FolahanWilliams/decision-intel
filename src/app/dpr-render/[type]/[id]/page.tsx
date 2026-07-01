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
 *   type = document → Supabase-auth + ownership check; [id] = analysisId
 *   type = package  → Supabase-auth + ownership check; [id] = packageId
 *   type = deal     → Supabase-auth + ownership check; [id] = dealId
 *
 * Auth model (Phase 4): the API consumer routes (/api/documents/[id]/...,
 * /api/decision-packages/[id]/..., /api/deals/[id]/...) do their own auth
 * + ownership check, then forward the user's Supabase auth cookies to the
 * Puppeteer headless browser (via renderDprPdf({authCookieHeader})). The
 * headless browser arrives at this route already authenticated, and the
 * Supabase server client below verifies ownership a SECOND time as
 * defense-in-depth — same access bar as the API route enforces.
 *
 * Search-param `?clientSafe=1` enables Client-Safe Export Mode (entity
 * names + person names + amounts replaced with placeholders) so the
 * artefact can be shared with an LP, regulator, or assurance partner
 * without leaking competitive intelligence.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import {
  buildSampleDprData,
  buildDangoteDprData,
  SAMPLE_FINDINGS_AUGMENT,
  DANGOTE_FINDINGS_AUGMENT,
} from '@/lib/reports/sample-dpr';
import { assembleProvenanceRecordData } from '@/lib/reports/provenance-record-data';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { composeEvidentiaryStandardFingerprint } from '@/lib/reports/evidentiary-standard';
import { DprPageOneCover } from '@/components/dpr/pages/DprPageOneCover';
import { DprPageTwoMethodology } from '@/components/dpr/pages/DprPageTwoMethodology';
import { DprPageThreeR2fStrips } from '@/components/dpr/pages/DprPageThreeR2fStrips';
import { DprPageFindings } from '@/components/dpr/pages/DprPageFindings';
import {
  DprPageStructuralAssumptions,
  SAMPLE_STRUCTURAL_ASSUMPTIONS,
  type DprStructuralAssumption,
} from '@/components/dpr/pages/DprPageStructuralAssumptions';
import { DprPageRegulatoryCrosswalk } from '@/components/dpr/pages/DprPageRegulatoryCrosswalk';
import { DprPageEngagementAppendix } from '@/components/dpr/pages/DprPageEngagementAppendix';
import { deriveDprFindings } from '@/lib/reports/dpr-findings';
import type { ProvenanceRecordData } from '@/lib/reports/provenance-record-data';

const log = createLogger('DprRenderRoute');

const VALID_TYPES = ['specimen', 'document', 'package', 'deal'] as const;
type DprType = (typeof VALID_TYPES)[number];

export default async function DprRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await params;
  const search = await searchParams;
  const type = resolved.type as DprType;
  const id = resolved.id;
  const clientSafe = search.clientSafe === '1';

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const data = await loadDprData(type, id);
  if (!data) {
    notFound();
  }

  const recordId = formatRecordId(data);
  // "How to verify this record" points at the public DPR explainer, which
  // documents the SHA-256 hash-comparison method. The prior per-record
  // `/verify/{recordId}` URL pointed at a route that does not exist — it 404'd
  // for crawlers AND humans (2026-06-15 Ahrefs audit). The record's own
  // fingerprint stays visible in the integrity-fingerprint rows on the cover;
  // a real per-record `/verify` endpoint is a separate, founder-gated build.
  // Canonical www domain avoids the apex→www redirect the same audit flagged.
  const verifyUrl = 'https://www.decision-intel.com/decision-provenance';
  const classification = computeClassification(type, clientSafe);
  const auditTimestamp = data.generatedAt.toISOString();

  // Phase 4: real audits populate findingsAugment in the data assembler;
  // specimens use the hand-curated SAMPLE_FINDINGS_AUGMENT. Both reach
  // the deriver via the same path so the visual rendering is identical.
  const augment =
    type === 'specimen'
      ? id === 'dangote'
        ? DANGOTE_FINDINGS_AUGMENT
        : SAMPLE_FINDINGS_AUGMENT
      : (data.findingsAugment ?? {});
  const findings = deriveDprFindings(data, augment);

  // Specimens get the curated 4-determinant Dalio set; real audits read
  // from the StructuralAssumption table (populated by the structural-
  // assumptions endpoint when the audit ran). Page hides itself silently
  // when no assumptions are on file.
  const structuralAssumptions =
    type === 'specimen'
      ? SAMPLE_STRUCTURAL_ASSUMPTIONS
      : type === 'document'
        ? await loadStructuralAssumptionsForDpr(id)
        : [];

  // Engagement appendix surfaces only for Phase 1 HXC fractional CSOs
  // when their audit is on a container with a non-null targetCompany.
  // The data assembler does the persona + data gating; here we just check
  // whether the field is populated.
  const renderEngagementAppendix = data.engagementAppendix != null;

  // Total physical pages: 6 baseline (cover, methodology, R²F strips,
  // findings, structural assumptions when present, regulatory crosswalk),
  // plus 1 when the engagement appendix renders. The Structural
  // Assumptions page is conditional but counted in baseline because
  // specimens always include it; per-document audits skip it silently
  // when StructuralAssumption rows are absent. Conditional page count
  // matches what the cover declares.
  const totalPages = 6 + (renderEngagementAppendix ? 1 : 0);

  // Defensibility Vector #4 (locked 2026-05-18) — compose the scattered
  // cryptographic pieces into ONE citable evidentiary-standard token a
  // GC pins their EU AI Act Art 14 / Basel III ICAAP audit trail to.
  // Pure + deterministic; surfaces existing persisted values, recomputes
  // no score. schemaVersion is the raw number here (e.g. 2 → `s2`), not
  // the `${n}.1.0` display string the cover renders for the schema row.
  const evidentiaryStandard = composeEvidentiaryStandardFingerprint({
    methodologyVersion: METHODOLOGY_VERSION,
    inputHash: data.inputHash,
    promptFingerprint: data.promptFingerprint,
    weightsHash: data.weightsResolution?.hash,
    schemaVersion: data.schemaVersion,
  });

  return (
    <>
      <DprPageOneCover
        title={titleForData(data, type)}
        subtitle={subtitleForData(data, type)}
        recordId={recordId}
        auditTimestamp={auditTimestamp}
        inputHash={data.inputHash}
        promptFingerprint={data.promptFingerprint}
        schemaVersion={`${data.schemaVersion}.1.0`}
        pipelineVersion={pipelineVersionFromLineage(data)}
        methodologyVersion={METHODOLOGY_VERSION}
        weightsResolution={data.weightsResolution}
        evidentiaryStandardToken={evidentiaryStandard.token}
        verifyUrl={verifyUrl}
        classification={classification}
        totalPages={totalPages}
        footerTitle="Decision Provenance Record"
        documentIdentity={buildDocumentIdentity(data, type, id)}
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
        clientSafe={clientSafe}
        strategicExposure={data.strategicExposure}
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
      {renderEngagementAppendix && data.engagementAppendix && (
        <DprPageEngagementAppendix
          appendix={data.engagementAppendix}
          pageNumber={7}
          totalPages={totalPages}
          classification={classification}
          auditTimestamp={auditTimestamp}
        />
      )}
    </>
  );
}

async function loadDprData(type: DprType, id: string): Promise<ProvenanceRecordData | null> {
  if (type === 'specimen') {
    if (id === 'dangote') {
      return buildDangoteDprData();
    }
    if (id === 'wework' || id === 'heliograph') {
      return buildSampleDprData();
    }
    return null;
  }

  // Authenticated paths — Supabase auth + ownership check before we
  // assemble the data. Defense-in-depth: the API route that called
  // Puppeteer already did this check, but a direct hit on /dpr-render
  // (e.g. someone bookmarked the URL) MUST re-verify.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    log.warn(`Unauthenticated /dpr-render/${type}/${id} request — returning notFound.`);
    return null;
  }

  try {
    if (type === 'document') {
      // [id] is analysisId (the API consumer resolves documentId →
      // analysisId before forwarding to /dpr-render).
      const analysis = await prisma.analysis.findUnique({
        where: { id },
        select: {
          id: true,
          document: { select: { userId: true, orgId: true } },
        },
      });
      if (!analysis) return null;
      // Ownership: user must own the document OR be in its org.
      const userOwns = analysis.document.userId === user.id;
      const userInOrg = analysis.document.orgId
        ? await userIsInOrg(user.id, analysis.document.orgId)
        : false;
      if (!userOwns && !userInOrg) {
        log.warn(`User ${user.id} not authorised on analysis ${id}.`);
        return null;
      }
      return assembleProvenanceRecordData(id);
    }

    if (type === 'package' || type === 'deal' || type === 'container') {
      // Container-rooted DPR (replaces legacy deal/package paths) is
      // rebuilt in Phase 2 of the DecisionContainer refactor with a
      // mode-aware assembler. Until that lands, document-rooted DPRs
      // are the supported procurement-grade output.
      log.warn(`DPR type ${type} pending Phase 2 container-aware assembler`);
      return null;
    }
  } catch (err) {
    log.error(`Failed to load DPR data for ${type}/${id}:`, err);
    return null;
  }

  return null;
}

async function userIsInOrg(userId: string, orgId: string): Promise<boolean> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId, orgId },
      select: { id: true },
    });
    return Boolean(m);
  } catch {
    return false;
  }
}

function computeClassification(
  type: DprType,
  clientSafe: boolean
): 'sample' | 'specimen' | 'confidential' | 'client-safe-export' {
  if (clientSafe) return 'client-safe-export';
  if (type === 'specimen') return 'specimen';
  return 'confidential';
}

function titleForData(data: ProvenanceRecordData, type: DprType): string {
  if (type === 'specimen') {
    if (data.meta.filename.startsWith('PanAfrican')) {
      return 'Audit of a Pan-African industrial market-entry plan';
    }
    return 'Audit of a private-market growth-company prospectus';
  }
  // Container-rooted DPR (deal/package/container) titles re-land in
  // Phase 2 of the DecisionContainer refactor with a mode-aware
  // assembler. Falls through to the document-level filename title.
  const filename = data.meta.filename ?? 'Strategic decision audit';
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function subtitleForData(data: ProvenanceRecordData, type: DprType): string {
  if (type === 'specimen') {
    if (data.meta.filename.startsWith('PanAfrican')) {
      return 'Anonymised from a 2014 Pan-African cement-manufacturing capacity-extension plan. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.';
    }
    return 'Anonymised from a 2019 Form S-1 that was withdrawn 33 days after filing. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.';
  }
  // Container-rooted DPR subtitles (deal/package/container) re-land in
  // Phase 2 alongside the mode-aware assembler.
  const firstSentence = data.meta.summary?.split('. ')[0] ?? '';
  return `${firstSentence}. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.`;
}

function formatRecordId(data: ProvenanceRecordData): string {
  const ts = data.generatedAt.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const shortHash = data.inputHash.slice(0, 8);
  return `dpr_${ts}_${shortHash}`;
}

function pipelineVersionFromLineage(data: ProvenanceRecordData): string {
  const nodes = Object.keys(data.modelLineage.nodes ?? {});
  return `di-pipeline · ${nodes.length} nodes · v2.1.0`;
}

/**
 * Build the Document Identity panel data for the cover. Reads from the
 * validity classification signals (which carry document type / industry /
 * decision horizon) and overrides per-specimen with the right scope
 * label so a procurement reader can tell at-a-glance which decision
 * shape was audited.
 */
function buildDocumentIdentity(
  data: ProvenanceRecordData,
  type: DprType,
  id: string
): {
  documentType: string | null;
  industry: string | null;
  decisionHorizon: string | null;
  geographicScope: string | null;
} {
  const signals = data.validityClassification?.signals ?? {
    documentType: null,
    industry: null,
    decisionHorizon: null,
  };

  // Specimen-specific overrides — the validity classifier's signals on
  // sample data are intentionally generic; the cover should render the
  // narrative-specific scope so a procurement reader instantly sees
  // "Pan-African industrial expansion" vs. "DACH market entry."
  if (type === 'specimen') {
    if (id === 'dangote') {
      return {
        documentType: 'Strategic memo',
        industry: 'Manufacturing · Cement',
        decisionHorizon: '36 months',
        geographicScope: 'Pan-African (8 markets)',
      };
    }
    return {
      documentType: 'Strategic memo',
      industry: 'Real estate',
      decisionHorizon: '18 months',
      geographicScope: 'DACH market entry',
    };
  }

  // Real audit — use what the validity classifier surfaced. Geographic
  // scope isn't in the classifier signals today; falls through as null.
  return {
    documentType: signals.documentType,
    industry: signals.industry,
    decisionHorizon: signals.decisionHorizon,
    geographicScope: null,
  };
}

/* ────────────────────────────────────────────────────────────── */
/*       Structural assumptions persistence loader (DPR)          */
/* ────────────────────────────────────────────────────────────── */

/**
 * Maps the rich 18-determinant persisted shape onto the DPR's 4-macro
 * Dalio decomposition (debt cycle / governance / productivity / currency).
 * For each DPR macro, picks the highest-severity assumption from the
 * matching persisted determinants — so the page surfaces the worst
 * audit-committee-relevant gap per macro, not the chronological first
 * one. Determinants outside the four macros are ignored at the DPR
 * surface (the live in-app StructuralAssumptionsPanel renders the full
 * 18-determinant set; the DPR is the leave-behind summary).
 */
async function loadStructuralAssumptionsForDpr(
  analysisId: string
): Promise<DprStructuralAssumption[]> {
  let rows: Array<{
    determinantId: string;
    assumption: string;
    evidenceFromMemo: string | null;
    hardeningQuestion: string | null;
    severity: string;
    defensibility: string;
  }>;
  try {
    rows = await prisma.structuralAssumption.findMany({
      where: { analysisId },
      orderBy: { generatedAt: 'desc' },
      select: {
        determinantId: true,
        assumption: true,
        evidenceFromMemo: true,
        hardeningQuestion: true,
        severity: true,
        defensibility: true,
      },
    });
  } catch (err) {
    log.warn(
      `loadStructuralAssumptionsForDpr(${analysisId}) — table read failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
  if (rows.length === 0) return [];

  // Macro mapping — 18 determinants → 4 DPR macros. Determinants not
  // in this map are intentionally dropped at the DPR surface.
  const MACRO_MAP: Record<string, DprStructuralAssumption['determinant']> = {
    debt_cycle: 'debt_cycle',
    currency_cycle: 'currency',
    productivity: 'productivity',
    governance: 'governance',
    // Sensible secondary mappings for richer audits:
    cost_competitiveness: 'productivity',
    economic_output: 'productivity',
    civility: 'governance',
    wealth_gaps: 'governance',
    reserve_currency_status: 'currency',
    markets_financial_center: 'currency',
  };

  const SEVERITY_RANK: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Group by macro and pick highest-severity per group.
  const byMacro: Record<string, (typeof rows)[number]> = {};
  for (const row of rows) {
    const macro = MACRO_MAP[row.determinantId];
    if (!macro) continue;
    const existing = byMacro[macro];
    if (!existing || (SEVERITY_RANK[row.severity] ?? 0) > (SEVERITY_RANK[existing.severity] ?? 0)) {
      byMacro[macro] = row;
    }
  }

  const out: DprStructuralAssumption[] = [];
  for (const macro of ['debt_cycle', 'governance', 'productivity', 'currency'] as const) {
    const row = byMacro[macro];
    if (!row) continue;
    const severity = (
      ['critical', 'high', 'medium', 'low'].includes(row.severity) ? row.severity : 'medium'
    ) as DprStructuralAssumption['severity'];

    out.push({
      determinant: macro,
      implicitAssumption: row.assumption,
      // The persisted shape has `evidenceFromMemo` (the memo's quoted
      // claim) and `defensibility` (well_supported / unsupported / etc.).
      // The DPR's "outsideViewAnchor" is the independent-data reading
      // that EARNS the severity band. We synthesize it from defensibility
      // + evidenceFromMemo so the section surfaces a defensible band
      // even when the audit didn't author a verbatim outside-view
      // sentence.
      outsideViewAnchor: synthesiseOutsideView(row.defensibility, row.evidenceFromMemo),
      reviewerQuestion:
        row.hardeningQuestion ??
        'What independent base-rate evidence would change the defensibility band on this determinant?',
      severity,
    });
  }
  return out;
}

function synthesiseOutsideView(defensibility: string, memoEvidence: string | null): string {
  const band = defensibility.toLowerCase();
  if (band === 'contradicted') {
    return memoEvidence
      ? `Outside-view reading contradicts the memo's claim. Memo evidence on file: "${memoEvidence}"`
      : "Outside-view reading contradicts the memo's implicit assumption.";
  }
  if (band === 'unsupported') {
    return memoEvidence
      ? `Outside-view reading does not support the memo's claim. Memo evidence on file: "${memoEvidence}"`
      : "Outside-view reading does not support the memo's implicit assumption — base-rate evidence missing.";
  }
  if (band === 'partially_supported') {
    return memoEvidence
      ? `Outside-view reading partially supports the memo. Memo evidence on file: "${memoEvidence}"`
      : 'Outside-view reading partially supports the assumption — material caveats apply.';
  }
  return memoEvidence
    ? `Outside-view reading aligns with the memo. Memo evidence on file: "${memoEvidence}"`
    : "Outside-view reading aligns with the memo's implicit assumption.";
}
