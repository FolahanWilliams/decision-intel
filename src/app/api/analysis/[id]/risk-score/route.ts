import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { calculateRiskAdjustedScore } from '@/lib/learning/outcome-scoring';
import { createLogger } from '@/lib/utils/logger';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';

const log = createLogger('RiskScoreAPI');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: analysisId } = await params;

    // RBAC (3.5): visibility-aware access via the parent document.
    const access = await resolveAnalysisAccess(analysisId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Resolve org context for downstream calibration.
    const docMeta = await prisma.document.findUnique({
      where: { id: access.documentId },
      select: { orgId: true },
    });
    let orgId: string | null = docMeta?.orgId ?? null;
    if (!orgId) {
      const membership = await prisma.teamMember
        .findFirst({
          where: { userId: user.id },
          select: { orgId: true },
        })
        .catch(() => null);
      orgId = membership?.orgId ?? null;
    }

    const result = await calculateRiskAdjustedScore(analysisId, orgId);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Risk score calculation failed:', error);
    return NextResponse.json({ error: 'Failed to calculate risk score' }, { status: 500 });
  }
}
