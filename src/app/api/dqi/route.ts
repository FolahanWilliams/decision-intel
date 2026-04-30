/**
 * Internal API — GET /api/dqi?analysisId=xxx
 *
 * Returns the Decision Quality Index (DQI) for a given analysis.
 * Uses Supabase session auth (for frontend use).
 * For external/API-key access, use /api/v1/dqi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { computeDQI, generateDQIBadge, type DQIInput } from '@/lib/scoring/dqi';
import { BIAS_NODES } from '@/lib/ontology/bias-graph';
import { createLogger } from '@/lib/utils/logger';
import { getDocumentContent } from '@/lib/utils/encryption';
import { classifyValidity } from '@/lib/learning/validity-classifier';

const log = createLogger('DQIInternalRoute');

export async function GET(request: NextRequest) {
  try {
    // ── Auth (Supabase session) ───────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse params ──────────────────────────────────────────────────
    const analysisId = request.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing required parameter: analysisId' },
        { status: 400 }
      );
    }

    // ── Fetch analysis ────────────────────────────────────────────────
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        document: { userId },
      },
      select: {
        id: true,
        overallScore: true,
        biases: true,
        noiseStats: true,
        factCheck: true,
        compliance: true,
        simulation: true,
        judgeOutputs: true,
        document: {
          select: {
            content: true,
            contentEncrypted: true,
            contentIv: true,
            contentTag: true,
            documentType: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // ── Build DQI input ───────────────────────────────────────────────
    const biasesRaw = analysis.biases as Array<{
      type?: string;
      biasType?: string;
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

    const documentContent = analysis.document
      ? getDocumentContent(analysis.document as Parameters<typeof getDocumentContent>[0])
      : '';
    const wordCount = documentContent.split(/\s+/).filter(Boolean).length;

    const dqiInput: DQIInput = {
      biases: (biasesRaw ?? []).map(b => ({
        type: b.biasType ?? b.type ?? 'unknown',
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
            (b: { biasType?: string; type?: string }) => b.biasType ?? b.type ?? ''
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

    // Wire compound scoring if available in compliance JSON
    const compoundData = (
      complianceRaw as { compoundScoring?: { calibratedScore?: number } } | null
    )?.compoundScoring;
    if (compoundData?.calibratedScore !== undefined) {
      dqiInput.compoundScore = compoundData.calibratedScore;
    }

    // Validity-aware DQI shift (Kahneman & Klein 2009 first-condition
    // operationalisation, locked 2026-04-30). Reads the persisted band
    // from judgeOutputs.validityClassification first (set at audit-
    // completion time); falls back to live compute for legacy
    // analyses. The persisted value is the source of truth — every
    // surface (DPR cover, document-detail UI, this DQI computation)
    // reads the SAME band the audit was originally scored against.
    const documentType =
      (analysis.document as unknown as { documentType?: string | null })?.documentType ?? null;
    const persistedValidity = (
      analysis.judgeOutputs as { validityClassification?: { validityClass?: string } } | null
    )?.validityClassification?.validityClass as
      | 'high'
      | 'medium'
      | 'low'
      | 'zero'
      | undefined;
    dqiInput.validityClass =
      persistedValidity ??
      classifyValidity({
        documentType,
        industry: null,
      }).validityClass;

    // ── Compute DQI ───────────────────────────────────────────────────
    const dqi = computeDQI(dqiInput);
    const badge = generateDQIBadge(dqi);

    return NextResponse.json(
      { analysisId, dqi, badge },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } }
    );
  } catch (error) {
    log.error('DQI computation failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
