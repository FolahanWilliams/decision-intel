/**
 * Deal cross-reference run + read endpoint (3.1 deep).
 *
 * GET   — returns the most recent DealCrossReference run for the deal,
 *         or null when no run has happened yet.
 * POST  — kicks off a new cross-reference run, persists the result, and
 *         returns it. Owner / org-member access only; the agent's input
 *         set is filtered through the visibility resolver so a private
 *         doc on a team-visible deal is excluded from the run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getDocumentContent } from '@/lib/utils/encryption';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';
import { runCrossReferenceAgent, type CrossRefInputDoc } from '@/lib/agents/cross-reference';

const log = createLogger('DealCrossReference');

async function getOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch (err) {
    log.warn('getOrgId failed (returning null fallback):', err);
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getOrgId(user.id);
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
      select: { id: true },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const latest = await prisma.dealCrossReference
      .findFirst({
        where: { dealId },
        orderBy: { runAt: 'desc' },
      })
      .catch(() => null);

    return NextResponse.json({ run: latest ?? null });
  } catch (e) {
    log.error('GET cross-reference failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cap the run rate. Cross-ref is a Gemini call per attempt — we don't
    // want a button-mash to burn budget. 20/hr/user (raised 2026-04-25 from
    // 5/hr per Marcus's audit catch — IC-night iteration + auto-run on each
    // doc completion both push real users above 5/hr without the agent
    // becoming pathological).
    const rate = await checkRateLimit(user.id, 'deal-cross-reference', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
      failMode: 'closed',
    });
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many cross-reference runs in the last hour. Try again later.' },
        { status: 429 }
      );
    }

    const orgId = await getOrgId(user.id);
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
      select: { id: true },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // RBAC (3.5): the cross-ref agent reads decrypted memo content. Filter
    // the deal's documents through the visibility resolver so private
    // material is never included in the LLM input set for a teammate's run.
    const { where: docVisibilityWhere } = await buildDocumentAccessFilter(user.id);
    const documents = await prisma.document.findMany({
      where: {
        dealId,
        // Explicit AND so we layer the visibility OR cleanly on top of
        // dealId scoping.
        AND: docVisibilityWhere,
      },
      select: {
        id: true,
        filename: true,
        content: true,
        contentEncrypted: true,
        contentIv: true,
        contentTag: true,
        contentKeyVersion: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            overallScore: true,
            biases: { select: { biasType: true, severity: true }, take: 5 },
          },
        },
      },
    });

    const inputDocs: CrossRefInputDoc[] = documents
      .map(d => {
        const latest = d.analyses?.[0];
        if (!latest) return null;
        const content = getDocumentContent(d as Parameters<typeof getDocumentContent>[0]);
        if (!content || content.trim().length < 200) return null;
        return {
          documentId: d.id,
          documentName: d.filename,
          analysisId: latest.id,
          overallScore: latest.overallScore,
          content,
          topBiases: latest.biases.map(b => ({
            biasType: b.biasType,
            severity: b.severity ?? null,
          })),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (inputDocs.length < 2) {
      return NextResponse.json(
        {
          error:
            'Cross-reference needs at least two analyzed documents on this deal. Upload more docs and run their audits first.',
          analyzedDocCount: inputDocs.length,
        },
        { status: 400 }
      );
    }

    let run;
    try {
      const output = await runCrossReferenceAgent(inputDocs);
      const conflictCount = output.findings.length;
      const highSeverityCount = output.findings.filter(
        f => f.severity === 'critical' || f.severity === 'high'
      ).length;

      run = await prisma.dealCrossReference.create({
        data: {
          dealId,
          documentSnapshot: output.documentSnapshot as unknown as Prisma.InputJsonValue,
          findings: output as unknown as Prisma.InputJsonValue,
          conflictCount,
          highSeverityCount,
          status: 'complete',
        },
      });
    } catch (agentErr) {
      log.error(
        'cross-reference agent failed:',
        agentErr instanceof Error ? agentErr.message : String(agentErr)
      );
      run = await prisma.dealCrossReference
        .create({
          data: {
            dealId,
            documentSnapshot: inputDocs.map(d => ({
              documentId: d.documentId,
              documentName: d.documentName,
              analysisId: d.analysisId,
              overallScore: d.overallScore,
            })) as unknown as Prisma.InputJsonValue,
            findings: {
              findings: [],
              summary: 'Cross-reference run failed.',
            } as unknown as Prisma.InputJsonValue,
            conflictCount: 0,
            highSeverityCount: 0,
            status: 'error',
            errorMessage:
              agentErr instanceof Error ? agentErr.message.slice(0, 500) : 'unknown error',
          },
        })
        .catch(() => null);
      return NextResponse.json(
        {
          error:
            'Cross-reference run failed. The agent encountered an error; please try again in a moment.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ run }, { status: 201 });
  } catch (e) {
    log.error('POST cross-reference failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
