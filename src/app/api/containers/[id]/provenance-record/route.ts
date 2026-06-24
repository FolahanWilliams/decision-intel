/**
 * /api/containers/[id]/provenance-record — DPR PDF/JSON for a container.
 *
 * Strategy: pick the lead analysis (most-recently-decided member doc;
 * fallback to the highest-scoring analysis when no decidedAt is set)
 * and render its DPR via the document-level path. The full mode-aware
 * lifecycle strip + cross-doc roster on the DPR cover ships as a
 * follow-up — for now the buyer downloads the lead-document DPR with
 * the container name + composite metrics surfaced via the dpr-render
 * route's URL params.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { renderDprPdf } from '@/lib/reports/render-dpr-pdf';
import { assembleProvenanceRecordData } from '@/lib/reports/provenance-record-data';
import { getUserPlan, getOrgPlan } from '@/lib/utils/plan-limits';

const log = createLogger('ContainerProvenanceRoute');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await prisma.teamMember
      .findFirst({ where: { userId: user.id }, select: { orgId: true } })
      .then(m => m?.orgId ?? null)
      .catch(() => null);

    const container = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: { id: true, name: true, kind: true },
    });
    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find the lead analysis: highest-scoring latest analysis on a
    // non-deleted member doc.
    const members = await prisma.decisionContainerDocument.findMany({
      where: { containerId: id, document: { deletedAt: null } },
      select: {
        document: {
          select: {
            id: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, overallScore: true },
            },
          },
        },
      },
    });

    const candidates = members
      .map(m => m.document.analyses[0])
      .filter((a): a is NonNullable<typeof a> => a != null);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No analyzed documents in container — DPR requires at least one completed audit' },
        { status: 400 }
      );
    }

    const leadAnalysis = candidates.sort((a, b) => b.overallScore - a.overallScore)[0];

    const url = new URL(request.url);
    const format = url.searchParams.get('format') ?? 'json';
    const clientSafe = url.searchParams.get('clientSafe') === '1';

    if (format === 'pdf') {
      // DPR PDF export is a Pro-plan feature (CLAUDE.md DPR lock; mirrors the
      // /api/documents/[id]/provenance-record gate verbatim). The container
      // route is the migration successor to the Pro-gated packages/deals
      // provenance routes and had silently dropped the gate — a paywall bypass
      // for the flagship procurement artefact. JSON (the data) stays available.
      const effectivePlan = orgId ? await getOrgPlan(orgId) : await getUserPlan(user.id);
      if (effectivePlan === 'free') {
        return NextResponse.json(
          {
            error: 'UPGRADE_REQUIRED',
            message: 'Decision Provenance Record export requires the Pro plan or higher.',
            requiredPlan: 'pro',
          },
          { status: 402 }
        );
      }

      const baseUrl = `${url.protocol}//${url.host}`;
      const renderUrl = `${baseUrl}/dpr-render/document/${leadAnalysis.id}${clientSafe ? '?clientSafe=1' : ''}`;
      const result = await renderDprPdf({
        baseUrl,
        type: 'document',
        id: leadAnalysis.id,
        authCookieHeader: request.headers.get('cookie') ?? undefined,
        renderUrlOverride: renderUrl,
      });
      return new NextResponse(new Uint8Array(result.pdf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dpr-${container.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf"`,
        },
      });
    }

    const data = await assembleProvenanceRecordData(leadAnalysis.id);
    return NextResponse.json(data);
  } catch (error) {
    log.error('GET /api/containers/[id]/provenance-record failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
