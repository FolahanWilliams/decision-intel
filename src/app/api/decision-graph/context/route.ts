/**
 * GET /api/decision-graph/context?text=...&orgId=...
 * Returns pre-decision context: related decisions, patterns, risk signals.
 * Called during decision frame capture for proactive intelligence.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { graphGuidedSearch } from '@/lib/rag/graph-guided-search';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DecisionContext');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const orgId = searchParams.get('orgId');
  const contextAnalysisId = searchParams.get('contextAnalysisId');

  if (!text || !orgId) {
    return NextResponse.json({ error: 'text and orgId are required' }, { status: 400 });
  }

  // Limit text length
  const safeText = text.slice(0, 5000);

  try {
    const results = await graphGuidedSearch(
      safeText,
      contextAnalysisId || null,
      user.id,
      orgId,
      5
    );

    // Summarize risk signals
    const failures = results.filter(r => r.outcome?.result === 'failure');
    const successes = results.filter(r => r.outcome?.result === 'success');

    const riskSignals: string[] = [];
    if (failures.length >= 2) {
      riskSignals.push(`${failures.length} similar past decisions resulted in failure`);
    }
    if (results.some(r => r.graphDistance === 1)) {
      riskSignals.push('Directly connected to existing decisions in the graph');
    }

    return NextResponse.json({
      relatedDecisions: results,
      riskSignals,
      summary: {
        totalRelated: results.length,
        successCount: successes.length,
        failureCount: failures.length,
        avgSimilarity: results.length > 0
          ? Math.round(results.reduce((s, r) => s + r.semanticScore, 0) / results.length * 100)
          : 0,
      },
    });
  } catch (error) {
    log.error('Decision context failed:', error);
    return NextResponse.json({
      relatedDecisions: [],
      riskSignals: [],
      summary: { totalRelated: 0, successCount: 0, failureCount: 0, avgSimilarity: 0 },
    });
  }
}
