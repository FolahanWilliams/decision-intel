/**
 * Causal Insights API
 *
 * GET /api/learning/causal — Returns org-specific causal weights,
 * human-readable insights, and comparison to global baseline.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getOrgCausalProfile } from '@/lib/learning/causal-learning';

const log = createLogger('CausalAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org context
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift
    }

    if (!orgId) {
      return NextResponse.json({
        profile: null,
        globalBaseline: null,
        _message:
          'Organization membership required for causal insights. Join or create an org first.',
      });
    }

    // Get org-specific causal profile
    const orgProfile = await getOrgCausalProfile(orgId);

    // Get global baseline for comparison
    let globalBaseline = null;
    try {
      const globalOutcomeCount = await prisma.decisionOutcome.count();
      if (globalOutcomeCount >= 10) {
        const globalOutcomes = await prisma.decisionOutcome.findMany({
          select: { outcome: true },
        });
        const globalFailureRate =
          globalOutcomes.filter(o => o.outcome === 'failure').length / globalOutcomes.length;

        globalBaseline = {
          totalOutcomes: globalOutcomeCount,
          failureRate: Number((globalFailureRate * 100).toFixed(1)),
        };
      }
    } catch {
      // Schema drift or query failure — non-critical
    }

    // Add comparison insights
    const comparisonInsights: string[] = [];
    if (globalBaseline && orgProfile.totalOutcomes >= 5) {
      const orgFailures = orgProfile.weights.reduce((sum, w) => sum + w.failureCount, 0);
      const orgTotal = orgProfile.weights.reduce((sum, w) => sum + w.sampleSize, 0);
      const orgFailureRate = orgTotal > 0 ? (orgFailures / orgTotal) * 100 : 0;

      if (orgFailureRate < globalBaseline.failureRate - 5) {
        comparisonInsights.push(
          `Your organization's decision failure rate (${orgFailureRate.toFixed(0)}%) is ${(globalBaseline.failureRate - orgFailureRate).toFixed(0)} percentage points below the platform average.`
        );
      } else if (orgFailureRate > globalBaseline.failureRate + 5) {
        comparisonInsights.push(
          `Your organization's decision failure rate (${orgFailureRate.toFixed(0)}%) is ${(orgFailureRate - globalBaseline.failureRate).toFixed(0)} percentage points above the platform average. Focus on the top causal biases below.`
        );
      }
    }

    return NextResponse.json({
      profile: orgProfile,
      globalBaseline,
      comparisonInsights,
    });
  } catch (error) {
    log.error('Causal API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch causal data' }, { status: 500 });
  }
}
