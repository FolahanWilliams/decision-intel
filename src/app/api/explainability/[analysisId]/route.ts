/**
 * Explainability API — Aggregates all explainability data for an analysis
 *
 * Returns: DQI breakdown, compound scoring, counterfactuals, root causes,
 * bias interactions, biological signals, org baseline, and noise decomposition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { computeDQI } from '@/lib/scoring/dqi';
import { classifyValidity } from '@/lib/learning/validity-classifier';
import { computeCounterfactuals } from '@/lib/analysis/counterfactual';
import { attributeRootCauses } from '@/lib/graph/root-cause';
import { INTERACTION_MATRIX, type InteractionEntry } from '@/lib/ontology/interaction-matrix';
import { BIAS_RELATIONSHIPS, type BiasRelationship } from '@/lib/ontology/bias-graph';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ExplainabilityAPI');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { analysisId } = await params;

  try {
    // 1. Fetch analysis with biases, outcome, document
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: true,
        outcome: true,
        document: {
          select: { userId: true, orgId: true, content: true, documentType: true },
        },
        toxicCombinations: true,
        prior: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Verify ownership
    if (analysis.document.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgId = analysis.document.orgId || auth.userId!;

    // 2. Compute DQI (synchronous, no DB calls)
    const dqi = computeDQI({
      biases: analysis.biases.map(b => ({
        type: b.biasType,
        severity: b.severity as 'low' | 'medium' | 'high' | 'critical',
        confidence: b.confidence ?? 0.7,
      })),
      noiseStats: {
        mean: (analysis.noiseStats as Record<string, number> | null)?.mean ?? analysis.noiseScore,
        stdDev: (analysis.noiseStats as Record<string, number> | null)?.stdDev ?? 0,
        judgeCount: (analysis.noiseStats as Record<string, number> | null)?.judgeCount ?? 3,
      },
      factCheck: {
        totalClaims: (analysis.factCheck as Record<string, number> | null)?.totalClaims ?? 0,
        verifiedClaims: (analysis.factCheck as Record<string, number> | null)?.verifiedClaims ?? 0,
        contradictedClaims:
          (analysis.factCheck as Record<string, number> | null)?.contradictedClaims ?? 0,
        score: (analysis.factCheck as Record<string, number> | null)?.score ?? 50,
      },
      process: {
        dissentPresent: false,
        priorSubmitted: !!analysis.prior,
        outcomeTracked: !!analysis.outcome,
        participantCount: analysis.speakers?.length || 1,
        documentLength: analysis.document.content?.split(/\s+/).length || 0,
      },
      compliance: (() => {
        const comp = analysis.compliance as { riskScore?: number; regulations?: unknown[] } | null;
        return {
          riskScore: comp?.riskScore ?? 0,
          frameworksChecked: comp?.regulations?.length ?? 0,
          violationsFound: 0,
        };
      })(),
      // Validity-aware DQI shift (Kahneman & Klein 2009, locked 2026-04-30).
      // Reads persisted validityClass from judgeOutputs first; falls
      // back to live compute for legacy analyses.
      validityClass:
        ((analysis.judgeOutputs as { validityClassification?: { validityClass?: string } } | null)
          ?.validityClassification?.validityClass as
          | 'high'
          | 'medium'
          | 'low'
          | 'zero'
          | undefined) ??
        classifyValidity({
          documentType:
            (analysis.document as unknown as { documentType?: string | null })?.documentType ??
            null,
          industry: null,
        }).validityClass,
    });

    // 3. Run counterfactuals and root causes in parallel
    const [counterfactuals, rootCauses] = await Promise.all([
      computeCounterfactuals(analysisId, orgId),
      attributeRootCauses(analysisId, orgId),
    ]);

    // 4. Extract bias interactions for detected biases
    const detectedBiasTypes = analysis.biases.map(b => b.biasType);
    const biasInteractions: Array<{
      from: string;
      to: string;
      weight: number;
      direction: string;
      confidence: string;
      mechanism?: string;
      citation?: string;
    }> = [];

    for (let i = 0; i < detectedBiasTypes.length; i++) {
      for (let j = 0; j < detectedBiasTypes.length; j++) {
        if (i === j) continue;
        const a = detectedBiasTypes[i];
        const b = detectedBiasTypes[j];
        const entry: InteractionEntry | undefined = INTERACTION_MATRIX[a]?.[b];
        if (entry && entry.direction !== 'neutral') {
          // Find mechanism from BIAS_RELATIONSHIPS
          const rel: BiasRelationship | undefined = BIAS_RELATIONSHIPS.find(
            r => r.from === a && r.to === b
          );
          biasInteractions.push({
            from: a,
            to: b,
            weight: entry.weight,
            direction: entry.direction,
            confidence: entry.confidence,
            mechanism: rel?.mechanism,
            citation: rel?.citation,
          });
        }
      }
    }

    // 5. Extract biological signals from compound scoring adjustments
    const compoundScoring = analysis.cognitiveAnalysis as {
      compoundScoring?: {
        adjustments?: Array<{ source: string; description: string; delta: number }>;
        calibratedScore?: number;
        rawScore?: number;
        biasScores?: Array<{
          biasType: string;
          rawSeverity: number;
          compoundSeverity: number;
          interactionMultiplier: number;
          contextMultiplier: number;
          contributingInteractions: string[];
        }>;
        compoundMultiplier?: number;
        contextAdjustment?: number;
      };
    } | null;

    const adjustments = compoundScoring?.compoundScoring?.adjustments || [];
    const biologicalSignals = [
      {
        type: 'winner_effect' as const,
        detected: adjustments.some(a => a.source.toLowerCase().includes('winner')),
        indicators: adjustments
          .filter(a => a.source.toLowerCase().includes('winner'))
          .map(a => a.description),
        delta: adjustments
          .filter(a => a.source.toLowerCase().includes('winner'))
          .reduce((sum, a) => sum + a.delta, 0),
      },
      {
        type: 'cortisol' as const,
        detected: adjustments.some(
          a =>
            a.source.toLowerCase().includes('cortisol') || a.source.toLowerCase().includes('stress')
        ),
        indicators: adjustments
          .filter(
            a =>
              a.source.toLowerCase().includes('cortisol') ||
              a.source.toLowerCase().includes('stress')
          )
          .map(a => a.description),
        delta: adjustments
          .filter(
            a =>
              a.source.toLowerCase().includes('cortisol') ||
              a.source.toLowerCase().includes('stress')
          )
          .reduce((sum, a) => sum + a.delta, 0),
      },
    ];

    // 6. Fetch org baseline for comparison
    let orgBaseline = { avgScore: 0, biasFrequency: 0, noiseAvg: 0, totalDecisions: 0 };
    try {
      const orgAnalyses = await prisma.analysis.findMany({
        where: {
          document: { orgId },
        },
        select: { overallScore: true, noiseScore: true },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      if (orgAnalyses.length > 0) {
        orgBaseline = {
          avgScore: orgAnalyses.reduce((s, a) => s + a.overallScore, 0) / orgAnalyses.length,
          biasFrequency: 0, // computed below
          noiseAvg: orgAnalyses.reduce((s, a) => s + a.noiseScore, 0) / orgAnalyses.length,
          totalDecisions: orgAnalyses.length,
        };

        const biasCount = await prisma.biasInstance.count({
          where: {
            analysis: { document: { orgId } },
          },
        });
        orgBaseline.biasFrequency = orgAnalyses.length > 0 ? biasCount / orgAnalyses.length : 0;
      }
    } catch (e) {
      log.warn('Failed to compute org baseline', e);
    }

    // 7. Build attribution waterfall from adjustments
    const waterfall = [
      { label: 'Base Score', value: 100, cumulative: 100 },
      ...adjustments.map(adj => ({
        label: adj.source,
        value: adj.delta,
        cumulative: 0, // computed on client
      })),
      {
        label: 'Final Score',
        value: analysis.overallScore,
        cumulative: analysis.overallScore,
      },
    ];

    // Compute cumulative values
    let running = 100;
    for (let i = 1; i < waterfall.length - 1; i++) {
      running += waterfall[i].value;
      waterfall[i].cumulative = running;
    }

    return NextResponse.json({
      analysisId,
      overallScore: analysis.overallScore,
      noiseScore: analysis.noiseScore,
      biases: analysis.biases.map(b => ({
        type: b.biasType,
        severity: b.severity,
        confidence: b.confidence,
        excerpt: b.excerpt,
        explanation: b.explanation,
        suggestion: b.suggestion,
      })),
      dqi,
      compoundScoring: compoundScoring?.compoundScoring || null,
      waterfall,
      counterfactuals,
      rootCauses,
      biasInteractions,
      biologicalSignals,
      orgBaseline,
      toxicCombinations: analysis.toxicCombinations.map(tc => ({
        id: tc.id,
        patternLabel: tc.patternLabel,
        biasTypes: tc.biasTypes,
        toxicScore: tc.toxicScore,
        mitigationNotes: tc.mitigationNotes,
      })),
    });
  } catch (error) {
    log.error('Explainability API error', error);
    return NextResponse.json({ error: 'Failed to compute explainability data' }, { status: 500 });
  }
}
