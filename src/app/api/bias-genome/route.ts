/**
 * GET /api/bias-genome — Returns cross-org Bias Genome benchmarks
 * plus the authenticated user's org-specific bias prevalence for comparison.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { computeBiasGenome } from '@/lib/learning/bias-genome';

const log = createLogger('BiasGenomeAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org via team membership
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });

    // Compute cross-org genome (works even without org membership)
    const genome = await computeBiasGenome();

    // Compute org-specific bias prevalence for comparison
    let orgStats: Array<{ biasType: string; prevalence: number; count: number }> = [];

    if (membership?.orgId) {
      try {
        const orgAnalyses = await prisma.analysis.findMany({
          where: { document: { userId: { in: await getOrgUserIds(membership.orgId) } } },
          select: {
            biases: { select: { biasType: true } },
          },
        });

        if (orgAnalyses.length > 0) {
          const biasCounts = new Map<string, number>();
          for (const analysis of orgAnalyses) {
            const types = new Set(analysis.biases.map(b => b.biasType));
            for (const t of types) {
              biasCounts.set(t, (biasCounts.get(t) ?? 0) + 1);
            }
          }

          orgStats = Array.from(biasCounts.entries()).map(([biasType, count]) => ({
            biasType,
            prevalence: Number(((count / orgAnalyses.length) * 100).toFixed(1)),
            count,
          }));
        }
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== 'P2021' && code !== 'P2022') {
          log.error('Failed to compute org stats:', error instanceof Error ? error.message : String(error));
        }
      }
    }

    return NextResponse.json(
      { genome, orgStats },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    log.error(
      'Failed to fetch bias genome:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Helper: get all user IDs belonging to an org */
async function getOrgUserIds(orgId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { orgId },
    select: { userId: true },
  });
  return members.map(m => m.userId);
}
