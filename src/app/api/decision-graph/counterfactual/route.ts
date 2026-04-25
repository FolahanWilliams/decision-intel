/**
 * POST /api/decision-graph/counterfactual
 * Returns counterfactual path analysis for a decision node in the knowledge graph.
 * Accepts { decisionId: string } in body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  computeCounterfactualPaths,
  generateCounterfactualNarrative,
} from '@/lib/graph/counterfactual';
import { createLogger } from '@/lib/utils/logger';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';

const log = createLogger('DecisionGraphCounterfactualAPI');

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { decisionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { decisionId } = body;

  if (!decisionId) {
    return NextResponse.json({ error: 'decisionId is required' }, { status: 400 });
  }

  try {
    // Fetch the target analysis and its document to verify ownership
    let analysis: {
      id: string;
      overallScore: number;
      documentId: string;
      summary: string;
    } | null = null;

    try {
      analysis = await prisma.analysis.findUnique({
        where: { id: decisionId },
        select: { id: true, overallScore: true, documentId: true, summary: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift fetching Analysis — table not available');
        return NextResponse.json(
          { error: 'Counterfactual analysis not available' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!analysis) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // RBAC (3.5): visibility-aware via the parent document.
    const access = await resolveAnalysisAccess(decisionId, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    let document: { orgId: string | null } | null = null;
    try {
      document = await prisma.document.findUnique({
        where: { id: analysis.documentId },
        select: { orgId: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'Counterfactual analysis not available' },
          { status: 503 }
        );
      }
      throw error;
    }

    const orgId = document?.orgId ?? null;

    // Fetch the decision outcome for this analysis
    let outcome: { outcome: string } | null = null;
    try {
      outcome = await prisma.decisionOutcome.findUnique({
        where: { analysisId: decisionId },
        select: { outcome: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift fetching DecisionOutcome');
        return NextResponse.json({ paths: [], narrative: null });
      }
      throw error;
    }

    // Build graph nodes and edges for counterfactual analysis
    let edges: {
      sourceType: string;
      sourceId: string;
      targetType: string;
      targetId: string;
      edgeType: string;
      strength: number;
    }[] = [];

    try {
      edges = await prisma.decisionEdge.findMany({
        where: orgId ? { orgId } : {},
        select: {
          sourceType: true,
          sourceId: true,
          targetType: true,
          targetId: true,
          edgeType: true,
          strength: true,
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift fetching DecisionEdge');
        return NextResponse.json({ paths: [], narrative: null });
      }
      throw error;
    }

    // Collect all analysis IDs referenced by edges
    const analysisIds = new Set<string>();
    analysisIds.add(decisionId);
    for (const e of edges) {
      if (e.sourceType === 'analysis') analysisIds.add(e.sourceId);
      if (e.targetType === 'analysis') analysisIds.add(e.targetId);
    }

    // Fetch analyses for node data
    let analyses: { id: string; overallScore: number; summary: string }[] = [];
    try {
      analyses = await prisma.analysis.findMany({
        where: { id: { in: [...analysisIds] } },
        select: { id: true, overallScore: true, summary: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json({ paths: [], narrative: null });
      }
      throw error;
    }

    // Fetch outcomes for these analyses
    let outcomes: { analysisId: string; outcome: string }[] = [];
    try {
      outcomes = await prisma.decisionOutcome.findMany({
        where: { analysisId: { in: [...analysisIds] } },
        select: { analysisId: true, outcome: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.debug('Schema drift fetching outcomes for counterfactual');
        outcomes = [];
      }
    }

    const outcomeMap = new Map(outcomes.map(o => [o.analysisId, o.outcome]));

    // Build CFNode array
    const nodes = analyses.map(a => ({
      id: a.id,
      type: 'analysis',
      label: a.summary.slice(0, 80),
      score: a.overallScore,
      outcome: outcomeMap.get(a.id),
    }));

    // Build CFEdge array
    const cfEdges = edges.map(e => ({
      source: e.sourceId,
      target: e.targetId,
      edgeType: e.edgeType,
      strength: e.strength,
    }));

    const paths = computeCounterfactualPaths(nodes, cfEdges, decisionId);

    const targetLabel = analysis.summary.slice(0, 80);
    const targetOutcome = outcome?.outcome ?? 'unknown';
    const narrative = generateCounterfactualNarrative(targetLabel, targetOutcome, paths);

    return NextResponse.json({ paths, narrative });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Schema drift in counterfactual graph API — returning empty result');
      return NextResponse.json({ paths: [], narrative: null });
    }

    log.error('Counterfactual graph API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute counterfactual analysis' },
      { status: 500 }
    );
  }
}
