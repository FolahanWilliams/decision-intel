/**
 * GET /api/decision-graph/attribution?analysisId=xxx
 *
 * Returns multi-touch attribution data for a given analysis,
 * showing which prior analyses contributed to its outcome.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AttributionAPI');

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisId = req.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    try {
      // Fetch attribution paths where this analysis is the outcome
      const attributions = await prisma.decisionAttribution.findMany({
        where: { outcomeAnalysisId: analysisId },
        orderBy: { contributionPct: 'desc' },
      });

      if (attributions.length === 0) {
        // Also check if this analysis is a SOURCE (contributed to other outcomes)
        const asSource = await prisma.decisionAttribution.findMany({
          where: { sourceAnalysisId: analysisId },
          orderBy: { contributionPct: 'desc' },
        });

        if (asSource.length > 0) {
          // Enrich with outcome analysis details
          const outcomeIds = asSource.map(a => a.outcomeAnalysisId);
          const outcomeAnalyses = await prisma.analysis.findMany({
            where: { id: { in: outcomeIds } },
            select: {
              id: true,
              overallScore: true,
              document: { select: { filename: true } },
              outcome: { select: { outcome: true } },
            },
          });

          const analysisMap = new Map(outcomeAnalyses.map(a => [a.id, a]));

          return NextResponse.json({
            direction: 'contributed_to',
            attributions: asSource.map(a => {
              const target = analysisMap.get(a.outcomeAnalysisId);
              return {
                ...a,
                targetFilename: target?.document?.filename ?? 'Unknown',
                targetScore: target?.overallScore ?? null,
                targetOutcome: target?.outcome?.outcome ?? null,
              };
            }),
          });
        }

        return NextResponse.json({ direction: 'none', attributions: [] });
      }

      // Enrich with source analysis details
      const sourceIds = attributions.map(a => a.sourceAnalysisId);
      const sourceAnalyses = await prisma.analysis.findMany({
        where: { id: { in: sourceIds } },
        select: {
          id: true,
          overallScore: true,
          document: { select: { filename: true } },
          biases: {
            select: { biasType: true, severity: true },
            take: 5,
          },
        },
      });

      const analysisMap = new Map(sourceAnalyses.map(a => [a.id, a]));

      return NextResponse.json({
        direction: 'influenced_by',
        attributions: attributions.map(a => {
          const source = analysisMap.get(a.sourceAnalysisId);
          return {
            ...a,
            sourceFilename: source?.document?.filename ?? 'Unknown',
            sourceScore: source?.overallScore ?? null,
            sourceBiases: source?.biases?.map(b => b.biasType) ?? [],
          };
        }),
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: DecisionAttribution table not yet migrated');
        return NextResponse.json({ direction: 'none', attributions: [] });
      }
      throw error;
    }
  } catch (error) {
    log.error('Attribution API error:', error);
    return NextResponse.json({ error: 'Failed to fetch attribution data' }, { status: 500 });
  }
}
