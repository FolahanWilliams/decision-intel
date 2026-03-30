import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { calculateRiskAdjustedScore } from '@/lib/learning/outcome-scoring';
import { createLogger } from '@/lib/utils/logger';

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

    // Verify analysis exists and user has access
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        document: {
          select: { userId: true, orgId: true },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Check access: user owns the document or is in the same org
    const docUserId = analysis.document.userId;
    const docOrgId = analysis.document.orgId;
    let hasAccess = docUserId === user.id;

    if (!hasAccess && docOrgId) {
      const membership = await prisma.teamMember
        .findFirst({
          where: { userId: user.id, orgId: docOrgId },
          select: { id: true },
        })
        .catch(() => null);
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve org context
    let orgId: string | null = docOrgId;
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
