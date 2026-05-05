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
import {
  assembleProvenanceRecordData,
  assembleProvenanceRecordDataForPackage,
  assembleProvenanceRecordDataForDeal,
} from '@/lib/reports/provenance-record-data';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
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
  const verifyUrl = `https://decision-intel.com/verify/${recordId}`;
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
  // Analysis.structuralAssumptions JSON when populated by the structural-
  // assumptions endpoint (today rendered live in the app, persistence
  // landing in a follow-up commit). Empty array hides the page silently.
  const structuralAssumptions = type === 'specimen' ? SAMPLE_STRUCTURAL_ASSUMPTIONS : [];

  const totalPages = 6;

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

    if (type === 'package') {
      const pkg = await resolvePackageAccess(id, user.id);
      if (!pkg) return null;
      return assembleProvenanceRecordDataForPackage(id);
    }

    if (type === 'deal') {
      // Deal access: must belong to the same org as the user.
      const orgId = await getUserOrgId(user.id);
      const deal = await prisma.deal.findFirst({
        where: { id, orgId: orgId || user.id },
        select: { id: true },
      });
      if (!deal) return null;
      return assembleProvenanceRecordDataForDeal(id);
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

async function getUserOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
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
  // Deal-rooted DPR: lead with the deal name.
  if (type === 'deal' && data.dealContext?.dealName) {
    return data.dealContext.dealName;
  }
  // Package-rooted DPR: lead with the package name.
  if (type === 'package' && data.packageContext?.packageName) {
    return data.packageContext.packageName;
  }
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
  if (type === 'deal' && data.dealContext) {
    const ctx = data.dealContext;
    const parts = [
      ctx.dealType ? prettyCase(ctx.dealType) : null,
      ctx.sector ? prettyCase(ctx.sector) : null,
      ctx.fundName,
      ctx.targetCompany,
      ctx.compositeDqi != null ? `Composite DQI ${Math.round(ctx.compositeDqi)}/100` : null,
    ].filter(Boolean);
    return `${parts.join(' · ')}. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.`;
  }
  if (type === 'package' && data.packageContext) {
    const ctx = data.packageContext;
    const parts = [
      ctx.decisionFrame,
      ctx.compositeDqi != null ? `Composite DQI ${Math.round(ctx.compositeDqi)}/100` : null,
      `${ctx.members.length} member${ctx.members.length === 1 ? '' : 's'}`,
    ].filter(Boolean);
    return `${parts.join(' · ')}. Independently re-verifiable hashed evidence record produced by the Decision Intel pipeline.`;
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

function prettyCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
