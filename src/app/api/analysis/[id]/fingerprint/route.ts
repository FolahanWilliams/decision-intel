import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AnalysisFingerprintRoute');

// GET /api/analysis/:id/fingerprint
//   Lightweight summary used by the VersionDeltaCard. Returns just the
//   delta-relevant fields: id, overallScore, noiseScore, biases[type+severity].
//   Avoids pulling the full Analysis object (which is ~50KB+ once you
//   include compliance, sentiment, simulation, etc.).
//
// Auth mirrors /api/analysis/[id]/risk-score: ownership OR same-org.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    const { id } = await params;
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        id: true,
        overallScore: true,
        noiseScore: true,
        biases: { select: { biasType: true, severity: true } },
        document: {
          select: { userId: true, orgId: true, deletedAt: true },
        },
      },
    });
    if (!analysis || analysis.document.deletedAt) {
      return apiError({ error: 'Not found', status: 404 });
    }

    let hasAccess = analysis.document.userId === user.id;
    if (!hasAccess && analysis.document.orgId) {
      const m = await prisma.teamMember
        .findFirst({
          where: { userId: user.id, orgId: analysis.document.orgId },
          select: { id: true },
        })
        .catch(() => null);
      hasAccess = !!m;
    }
    if (!hasAccess) return apiError({ error: 'Forbidden', status: 403 });

    return NextResponse.json({
      id: analysis.id,
      overallScore: analysis.overallScore,
      noiseScore: analysis.noiseScore,
      biases: analysis.biases,
    });
  } catch (err) {
    log.error('analysis fingerprint GET failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
