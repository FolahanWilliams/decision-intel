/**
 * Public API — GET /api/v1/dqi?analysisId=xxx
 *
 * Returns the Decision Quality Index (DQI) for a given analysis.
 * The DQI is a single 0-100 score with component breakdown, letter grade,
 * and actionable improvement recommendations.
 *
 * Auth: API key (Bearer di_live_xxx) — requires "read:analyses" scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, type ValidateError } from '@/lib/api/auth';
import { computeDQI, generateDQIBadge, type DQIInput } from '@/lib/scoring/dqi';
import { BIAS_NODES } from '@/lib/ontology/bias-graph';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DQIRoute');

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      const err = authResult as ValidateError;
      return NextResponse.json({ error: err.error }, { status: err.status, headers: err.headers });
    }
    const { context } = authResult;

    // ── Scope check ────────────────────────────────────────────────────
    if (!context.scopes.includes('read:analyses')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires read:analyses scope.' },
        { status: 403 }
      );
    }

    // ── Parse params ────────────────────────────────────────────────────
    const analysisId = request.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing required parameter: analysisId' },
        { status: 400 }
      );
    }

    // ── Fetch analysis ──────────────────────────────────────────────────
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        document: { userId: context.userId },
      },
      select: {
        id: true,
        overallScore: true,
        biases: true,
        noiseStats: true,
        factCheck: true,
        compliance: true,
        simulation: true,
        document: {
          select: {
            content: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // ── Build DQI input ─────────────────────────────────────────────────
    const biasesRaw = analysis.biases as Array<{
      type?: string;
      severity?: string;
      confidence?: number;
    }> | null;

    const noiseRaw = analysis.noiseStats as {
      mean?: number;
      stdDev?: number;
      scores?: number[];
    } | null;

    const factCheckRaw = analysis.factCheck as {
      score?: number;
      verifications?: Array<{ verdict?: string }>;
    } | null;

    const complianceRaw = analysis.compliance as {
      riskScore?: number;
      regulations?: Array<unknown>;
      regulatoryGraph?: {
        frameworksChecked?: string[];
        totalFindings?: number;
        highestRisk?: string;
        findings?: Array<unknown>;
      };
    } | null;

    const simulationRaw = analysis.simulation as {
      twins?: Array<{ vote?: string }>;
    } | null;

    // Count fact-check results
    const verifications = factCheckRaw?.verifications ?? [];
    const verifiedClaims = verifications.filter(v => v?.verdict === 'VERIFIED').length;
    const contradictedClaims = verifications.filter(v => v?.verdict === 'CONTRADICTED').length;

    // Check for dissent in simulation
    const twins = simulationRaw?.twins ?? [];
    const dissentPresent = twins.some(t => t?.vote === 'REJECT' || t?.vote === 'REVISE');

    // Check for decision prior
    let priorSubmitted = false;
    try {
      const priorCount = await prisma.decisionPrior.count({
        where: { analysisId: analysis.id },
      });
      priorSubmitted = priorCount > 0;
    } catch {
      // DecisionPrior table may not exist (schema drift)
    }

    // Check for outcome tracking
    let outcomeTracked = false;
    try {
      const outcomeCount = await prisma.decisionOutcome.count({
        where: { analysisId: analysis.id },
      });
      outcomeTracked = outcomeCount > 0;
    } catch {
      // DecisionOutcome table may not exist
    }

    const documentContent = (analysis.document?.content as string) ?? '';
    const wordCount = documentContent.split(/\s+/).filter(Boolean).length;

    const dqiInput: DQIInput = {
      biases: (biasesRaw ?? []).map(b => ({
        type: b.type ?? 'unknown',
        severity: (b.severity as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
        confidence: b.confidence ?? 0.5,
      })),
      noiseStats: {
        mean: noiseRaw?.mean ?? analysis.overallScore ?? 50,
        stdDev: noiseRaw?.stdDev ?? 0,
        judgeCount: noiseRaw?.scores?.length ?? 1,
      },
      factCheck: {
        totalClaims: verifications.length,
        verifiedClaims,
        contradictedClaims,
        score: factCheckRaw?.score ?? 70,
      },
      process: {
        dissentPresent,
        priorSubmitted,
        outcomeTracked,
        participantCount: twins.length,
        documentLength: wordCount,
        system1Ratio: (() => {
          const biasTypes = (biasesRaw ?? []).map(
            (b: { type?: string }) => b.type ?? ''
          );
          if (biasTypes.length === 0) return undefined;
          const system1Count = biasTypes.filter((t: string) => {
            const node = BIAS_NODES.find(n => n.id === t);
            return node?.cognitiveSystem === 'system1';
          }).length;
          return system1Count / biasTypes.length;
        })(),
      },
      compliance: {
        riskScore: complianceRaw?.riskScore ?? 0,
        frameworksChecked:
          complianceRaw?.regulatoryGraph?.frameworksChecked?.length ??
          complianceRaw?.regulations?.length ??
          0,
        violationsFound:
          complianceRaw?.regulatoryGraph?.totalFindings ?? complianceRaw?.regulations?.length ?? 0,
      },
    };

    // ── Wire compound scoring into DQI ──────────────────────────────────
    const compoundData = (
      complianceRaw as { compoundScoring?: { calibratedScore?: number } } | null
    )?.compoundScoring;
    if (compoundData?.calibratedScore !== undefined) {
      dqiInput.compoundScore = compoundData.calibratedScore;
    }

    // ── Compute DQI ─────────────────────────────────────────────────────
    const dqi = computeDQI(dqiInput);
    const badge = generateDQIBadge(dqi);

    // ── Check format preference ─────────────────────────────────────────
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'badge') {
      return NextResponse.json({ badge });
    }

    return NextResponse.json({
      analysisId,
      dqi,
      badge,
    });
  } catch (error) {
    log.error('DQI computation failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
