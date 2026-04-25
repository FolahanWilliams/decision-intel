/**
 * Decision Package · cross-reference run + read (4.4 deep).
 *
 * Mirror of the deal-level cross-reference endpoint, scoped to a
 * package. Reuses `runCrossReferenceAgent` so the LLM call is identical
 * and the persisted shape is interchangeable.
 *
 * GET  — most recent DecisionPackageCrossReference run, or null.
 * POST — kicks off a new run, persists, returns it.
 *
 * RBAC: package access via the package resolver; member docs filtered
 * through the doc-RBAC resolver so a private member doc never leaks
 * into the LLM input set for a teammate's run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getDocumentContent } from '@/lib/utils/encryption';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';
import {
  runCrossReferenceAgent,
  type CrossRefInputDoc,
} from '@/lib/agents/cross-reference';
import { recomputePackageMetrics } from '@/lib/scoring/package-aggregation';
import { logAudit } from '@/lib/audit';

const log = createLogger('DecisionPackageCrossRef');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: packageId } = await params;

    const pkg = await resolvePackageAccess(packageId, user.id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const latest = await prisma.decisionPackageCrossReference
      .findFirst({
        where: { packageId },
        orderBy: { runAt: 'desc' },
      })
      .catch(() => null);

    return NextResponse.json({ run: latest ?? null });
  } catch (err) {
    log.error('GET failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: packageId } = await params;

    // Same rate cap as deal cross-ref: 20/hr/user (raised 2026-04-25
    // from 5/hr per Marcus's audit catch). The LLM call is the same
    // shape and cost; sharing a single bucket would also be fine.
    const rate = await checkRateLimit(user.id, 'decision-package-cross-reference', {
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

    const pkg = await resolvePackageAccess(packageId, user.id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Pull member docs that the caller can read AND that have an analysis.
    const docFilter = await buildDocumentAccessFilter(user.id);
    const members = await prisma.decisionPackageDocument.findMany({
      where: {
        packageId,
        document: docFilter.where,
      },
      select: {
        documentId: true,
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

    const inputDocs: CrossRefInputDoc[] = members
      .map(m => {
        const latest = m.document.analyses[0];
        if (!latest) return null;
        const content = getDocumentContent(
          m.document as Parameters<typeof getDocumentContent>[0]
        );
        if (!content || content.trim().length < 200) return null;
        return {
          documentId: m.document.id,
          documentName: m.document.filename,
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
            'Cross-reference needs at least two analyzed documents in this package. Add more docs and run their audits first.',
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

      run = await prisma.decisionPackageCrossReference.create({
        data: {
          packageId,
          documentSnapshot: output.documentSnapshot as unknown as Prisma.InputJsonValue,
          findings: output as unknown as Prisma.InputJsonValue,
          conflictCount,
          highSeverityCount,
          status: 'complete',
        },
      });

      await recomputePackageMetrics(packageId);

      await logAudit({
        action: 'DECISION_PACKAGE_CROSS_REFERENCE_RUN',
        resource: 'decision_package',
        resourceId: packageId,
        details: { conflictCount, highSeverityCount, docCount: inputDocs.length },
      });
    } catch (agentErr) {
      log.error(
        'cross-reference agent failed:',
        agentErr instanceof Error ? agentErr.message : String(agentErr)
      );
      run = await prisma.decisionPackageCrossReference
        .create({
          data: {
            packageId,
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
  } catch (err) {
    log.error('POST failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
