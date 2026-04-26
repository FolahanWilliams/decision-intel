/**
 * Deal · Provenance Record (3.1 deep, added 2026-04-26 P1 #19).
 *
 * GET /api/deals/[id]/provenance-record — JSON summary by default;
 *     `?format=pdf` streams the procurement-grade PDF.
 *
 * Rationale (Marcus persona finding): a Deal is the atomic decision
 * unit for an M&A engagement — CIM + financial model + counsel memo +
 * IC deck. Per-document DPRs forced a GC at post-close inquiry to
 * reconcile four artefacts into one narrative. This route collapses
 * that into one signed PDF the audit committee can hand to a regulator
 * covering the full deal.
 *
 * RBAC: deal must belong to the same org as the requesting user. The
 * assembler reads document content hashes only — encrypted body never
 * leaves the database. Audit log entry written on every PDF export.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { assembleProvenanceRecordDataForDeal } from '@/lib/reports/provenance-record-data';
import { DecisionProvenanceRecordGenerator } from '@/lib/reports/decision-provenance-record-generator';
import { logAudit } from '@/lib/audit';
// TODO(notify): wire notifyExternalDprDownload from
// @/lib/notifications/dpr-share-alert here when Deal gains a creatorUserId
// field. Today Deal only carries orgId; "external share" can't be detected
// without knowing who originated the deal versus who's downloading the DPR.
// The document-scoped DPR route (src/app/api/documents/[id]/provenance-record)
// already covers ~80% of the signal because individual analyses ARE owned
// by the user who ran them.

const log = createLogger('DealProvenance');

async function getOrgId(userId: string): Promise<string | null> {
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: dealId } = await params;
    const format = request.nextUrl.searchParams.get('format') ?? 'json';
    const clientSafe = request.nextUrl.searchParams.get('clientSafe') === '1';

    const orgId = await getOrgId(user.id);
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
      select: { id: true, name: true },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const data = await assembleProvenanceRecordDataForDeal(dealId);

    if (format === 'pdf') {
      const generator = new DecisionProvenanceRecordGenerator();
      const pdf = generator.generate(data, { clientSafe });
      const bytes = pdf.output('arraybuffer');

      await logAudit({
        action: 'EXPORT_PDF',
        resource: 'deal_provenance',
        resourceId: dealId,
        details: {
          dealName: deal.name,
          memberCount: data.dealContext?.members.length ?? 0,
          compositeDqi: data.dealContext?.compositeDqi ?? null,
        },
      });

      return new NextResponse(bytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dpr-deal-${deal.name.replace(/[^a-z0-9-]/gi, '_').slice(0, 60)}.pdf"`,
        },
      });
    }

    // JSON summary path — used by the in-app preview / future client view.
    return NextResponse.json({
      ok: true,
      dealContext: data.dealContext,
      meta: data.meta,
      citations: data.citations,
      regulatoryMapping: data.regulatoryMapping,
      blindPriorAggregates: data.blindPriorAggregates,
      promptFingerprint: data.promptFingerprint,
      inputHash: data.inputHash,
      schemaVersion: data.schemaVersion,
      generatedAt: data.generatedAt.toISOString(),
    });
  } catch (err) {
    log.error('Deal provenance failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
