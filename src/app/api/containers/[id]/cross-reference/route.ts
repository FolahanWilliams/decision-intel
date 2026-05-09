/**
 * /api/containers/[id]/cross-reference — manual cross-doc conflict run.
 *
 * Runs `runCrossReferenceAgent` over the latest analyses on every member
 * doc in the container and persists a DecisionContainerCrossReference
 * row. The auto-trigger on /api/analyze/stream uses the same path with
 * a 30-min cooldown; this manual endpoint bypasses the cooldown via a
 * per-user 20/hr rate limiter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { runCrossReferenceAgent } from '@/lib/agents/cross-reference';
import { getDocumentContent } from '@/lib/utils/encryption';
import { recomputeContainerMetrics } from '@/lib/scoring/container-aggregation';

const log = createLogger('ContainerCrossReferenceRoute');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await checkRateLimit(user.id, '/api/containers/cross-reference');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    const orgId = await prisma.teamMember
      .findFirst({ where: { userId: user.id }, select: { orgId: true } })
      .then(m => m?.orgId ?? null)
      .catch(() => null);

    const container = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: { id: true },
    });
    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const memberDocs = await prisma.decisionContainerDocument.findMany({
      where: { containerId: id, document: { deletedAt: null } },
      select: {
        document: {
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
        },
      },
    });

    const inputs = memberDocs
      .map(m => {
        const analysis = m.document.analyses[0];
        if (!analysis) return null;
        const content = getDocumentContent(m.document as Parameters<typeof getDocumentContent>[0]);
        if (!content || content.trim().length < 200) return null;
        return {
          documentId: m.document.id,
          documentName: m.document.filename,
          analysisId: analysis.id,
          overallScore: analysis.overallScore,
          content,
          topBiases: analysis.biases.map(b => ({
            biasType: b.biasType,
            severity: b.severity ?? null,
          })),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (inputs.length < 2) {
      return NextResponse.json(
        { error: 'Cross-reference requires at least 2 analyzed documents in the container' },
        { status: 400 }
      );
    }

    const output = await runCrossReferenceAgent(inputs);
    const conflictCount = output.findings.length;
    const highSeverityCount = output.findings.filter(
      f => f.severity === 'critical' || f.severity === 'high'
    ).length;

    const created = await prisma.decisionContainerCrossReference.create({
      data: {
        containerId: id,
        documentSnapshot: output.documentSnapshot as unknown as Prisma.InputJsonValue,
        findings: output as unknown as Prisma.InputJsonValue,
        conflictCount,
        highSeverityCount,
        status: 'complete',
      },
    });

    await recomputeContainerMetrics(id).catch(err =>
      log.warn(`Cross-ref recompute failed (non-fatal): ${String(err)}`)
    );

    await logAudit({
      action: 'CONTAINER_CROSS_REFERENCE_RUN',
      resource: 'decision_container',
      resourceId: id,
      details: { conflictCount, highSeverityCount, runId: created.id },
    }).catch(err => log.warn('Cross-ref audit log failed:', err));

    return NextResponse.json({
      ok: true,
      runId: created.id,
      conflictCount,
      highSeverityCount,
      findings: output.findings,
    });
  } catch (error) {
    log.error('POST /api/containers/[id]/cross-reference failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

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
      select: { id: true },
    });
    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const runs = await prisma.decisionContainerCrossReference.findMany({
      where: { containerId: id },
      orderBy: { runAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      runs: runs.map(r => ({
        id: r.id,
        runAt: r.runAt.toISOString(),
        modelVersion: r.modelVersion,
        conflictCount: r.conflictCount,
        highSeverityCount: r.highSeverityCount,
        status: r.status,
        errorMessage: r.errorMessage,
      })),
    });
  } catch (error) {
    log.error('GET /api/containers/[id]/cross-reference failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
