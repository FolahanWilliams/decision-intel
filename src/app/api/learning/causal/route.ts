/**
 * Causal Insights API
 *
 * GET /api/learning/causal — Returns org-specific causal weights,
 * human-readable insights, and comparison to global baseline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getOrgCausalProfile, buildCausalDAG, doCalculus } from '@/lib/learning/causal-learning';

const log = createLogger('CausalAPI');

async function resolveOrgId(user: { id: string }): Promise<string | null> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    return membership?.orgId ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user);

    if (!orgId) {
      return NextResponse.json({
        profile: null,
        globalBaseline: null,
        _message:
          'Organization membership required for causal insights. Join or create an org first.',
      });
    }

    // Check for DAG-specific request
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');

    if (type === 'dag') {
      const dag = await buildCausalDAG(orgId);
      return NextResponse.json({
        dag,
        _message: dag
          ? `Causal DAG with ${dag.nodes.length} nodes and ${dag.edges.length} edges`
          : 'Insufficient outcome data for causal DAG construction (minimum 20 outcomes required)',
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
          take: 1000,
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

/**
 * POST /api/learning/causal — Run do-calculus interventional query
 *
 * Body: { remove: string[], add?: string[] }
 * Returns: InterventionResult with counterfactual success probability
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user);
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization membership required for interventional queries' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { remove, add } = body as { remove?: string[]; add?: string[] };

    if (!remove || !Array.isArray(remove) || remove.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include "remove" array of bias types to intervene on' },
        { status: 400 }
      );
    }

    const result = await doCalculus(orgId, { remove, add });

    if (!result) {
      return NextResponse.json({
        result: null,
        _message:
          'Insufficient outcome data for interventional analysis. Track more decision outcomes.',
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    log.error('Causal intervention API failed:', error);
    return NextResponse.json({ error: 'Failed to run intervention query' }, { status: 500 });
  }
}
