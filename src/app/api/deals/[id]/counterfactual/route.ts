/**
 * Deal-level counterfactual aggregation (P2 capability ship — Marcus's
 * audit ask: "If we resolve all 5 cross-ref conflicts and the top-3
 * biases, IRR moves from 21% to 27%, +£N protected.").
 *
 * GET /api/deals/[id]/counterfactual
 *
 * Aggregates per-analysis counterfactuals across every analyzed
 * document in the deal. Returns:
 *   - dealAggregateImprovement: weighted-average expected improvement
 *     across all analyses (in DQI points, the same axis the panel
 *     already shows)
 *   - dealAggregateMonetaryImpact: sum of estimated monetary impacts
 *     where the underlying scenario has one (null otherwise)
 *   - topScenarios: the 3 highest-impact bias-removal scenarios deal-wide
 *   - perAnalysis: per-document weightedImprovement so callers can
 *     show a sparkline
 *
 * Auth: visibility-filtered through buildDocumentAccessFilter so the
 * counterfactual respects per-document RBAC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { computeCounterfactuals } from '@/lib/analysis/counterfactual';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';

const log = createLogger('DealCounterfactual');

interface DealCounterfactualScenario {
  biasRemoved: string;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
  documentCount: number;
}

interface DealCounterfactualPerAnalysis {
  analysisId: string;
  documentId: string;
  documentName: string;
  weightedImprovement: number;
  scenarioCount: number;
}

interface DealCounterfactualResponse {
  dealId: string;
  analyzedDocCount: number;
  /**
   * Equal-weighted mean of per-analysis weightedImprovement across the
   * deal's analyzed docs. Same units as CounterfactualPanel
   * (DQI-points equivalent improvement).
   */
  dealAggregateImprovement: number;
  /**
   * Sum of estimatedMonetaryImpact across the top scenario per analysis.
   * Null when no scenario in the deal has a monetary estimate.
   */
  dealAggregateMonetaryImpact: number | null;
  currency: string;
  /** The 3 highest-impact scenarios deal-wide. */
  topScenarios: DealCounterfactualScenario[];
  perAnalysis: DealCounterfactualPerAnalysis[];
  dataAsOf: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: dealId } = await params;

    let deal: { id: string; orgId: string | null } | null = null;
    try {
      deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { id: true, orgId: true },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json({ error: 'Deal model not migrated' }, { status: 503 });
      }
      throw err;
    }
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Visibility-filter the per-document fetch — same shape as cross-ref
    // so a private doc on a team-visible deal doesn't leak through the
    // counterfactual aggregate either.
    const accessFilter = await buildDocumentAccessFilter(user.id);

    const docs = await prisma.document.findMany({
      where: {
        AND: [{ dealId }, { deletedAt: null }, accessFilter.where],
      },
      select: {
        id: true,
        filename: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });

    const analysesToScore = docs
      .filter(d => d.analyses.length > 0)
      .map(d => ({
        documentId: d.id,
        documentName: d.filename,
        analysisId: d.analyses[0].id,
      }));

    if (analysesToScore.length === 0) {
      const empty: DealCounterfactualResponse = {
        dealId,
        analyzedDocCount: 0,
        dealAggregateImprovement: 0,
        dealAggregateMonetaryImpact: null,
        currency: 'USD',
        topScenarios: [],
        perAnalysis: [],
        dataAsOf: new Date().toISOString(),
      };
      return NextResponse.json(empty);
    }

    // Fan-out per-analysis counterfactual computation in parallel. The
    // computation is cached at the orgId+bias-type level inside
    // computeCounterfactuals — a deal with 5 docs that share 3 bias
    // types only triggers ~3 actual queries.
    const results = await Promise.all(
      analysesToScore.map(a =>
        computeCounterfactuals(a.analysisId, deal.orgId).catch(err => {
          log.warn(
            `counterfactual fetch failed for analysis ${a.analysisId}:`,
            err instanceof Error ? err.message : String(err)
          );
          return null;
        })
      )
    );

    // Aggregate.
    let weightedSum = 0;
    let weightedCount = 0;
    const scenarioBuckets = new Map<
      string,
      {
        biasRemoved: string;
        improvements: number[];
        confidences: number[];
        monetaryImpacts: Array<number | null>;
        currency: string;
        documents: Set<string>;
      }
    >();
    let totalMonetary = 0;
    let monetaryCount = 0;
    let detectedCurrency = 'USD';
    const perAnalysis: DealCounterfactualPerAnalysis[] = [];

    for (let i = 0; i < analysesToScore.length; i++) {
      const a = analysesToScore[i];
      const r = results[i];
      if (!r) continue;
      perAnalysis.push({
        analysisId: a.analysisId,
        documentId: a.documentId,
        documentName: a.documentName,
        weightedImprovement: r.weightedImprovement,
        scenarioCount: r.scenarios.length,
      });
      if (r.scenarios.length === 0) continue;
      weightedSum += r.weightedImprovement;
      weightedCount += 1;
      // Roll up the top scenario's monetary impact (per-analysis) into
      // the deal-level estimate. Sum-not-average so the language
      // "combined improvement" is honest.
      const topByImpact = [...r.scenarios].sort(
        (s1, s2) => s2.expectedImprovement - s1.expectedImprovement
      )[0];
      if (topByImpact?.estimatedMonetaryImpact != null) {
        totalMonetary += topByImpact.estimatedMonetaryImpact;
        monetaryCount += 1;
        if (topByImpact.currency) detectedCurrency = topByImpact.currency;
      }
      for (const s of r.scenarios) {
        const key = s.biasRemoved.toLowerCase();
        const existing = scenarioBuckets.get(key);
        if (existing) {
          existing.improvements.push(s.expectedImprovement);
          existing.confidences.push(s.confidence);
          existing.monetaryImpacts.push(s.estimatedMonetaryImpact);
          existing.documents.add(a.documentId);
        } else {
          scenarioBuckets.set(key, {
            biasRemoved: s.biasRemoved,
            improvements: [s.expectedImprovement],
            confidences: [s.confidence],
            monetaryImpacts: [s.estimatedMonetaryImpact],
            currency: s.currency,
            documents: new Set([a.documentId]),
          });
        }
      }
    }

    const topScenarios: DealCounterfactualScenario[] = Array.from(scenarioBuckets.values())
      .map(b => {
        const avgImprovement = b.improvements.reduce((a, x) => a + x, 0) / b.improvements.length;
        const avgConfidence = b.confidences.reduce((a, x) => a + x, 0) / b.confidences.length;
        const totalImpact = b.monetaryImpacts
          .filter((x): x is number => typeof x === 'number')
          .reduce((a, x) => a + x, 0);
        return {
          biasRemoved: b.biasRemoved,
          expectedImprovement: avgImprovement,
          confidence: avgConfidence,
          estimatedMonetaryImpact: totalImpact > 0 ? totalImpact : null,
          currency: b.currency,
          documentCount: b.documents.size,
        };
      })
      .sort((s1, s2) => s2.expectedImprovement - s1.expectedImprovement)
      .slice(0, 3);

    const response: DealCounterfactualResponse = {
      dealId,
      analyzedDocCount: weightedCount,
      dealAggregateImprovement: weightedCount > 0 ? weightedSum / weightedCount : 0,
      dealAggregateMonetaryImpact: monetaryCount > 0 ? totalMonetary : null,
      currency: detectedCurrency,
      topScenarios,
      perAnalysis,
      dataAsOf: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    log.error(
      'GET /api/deals/[id]/counterfactual failed:',
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
