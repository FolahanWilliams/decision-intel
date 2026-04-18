/**
 * POST /api/human-decisions/simulate
 *
 * What-If Simulator for Product B (cognitive audits).
 * Re-runs the human decision analyzer on modified text WITHOUT persisting.
 * Returns projected scores and biases for comparison with the original.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import type { HumanDecisionInput } from '@/types/human-audit';

const log = createLogger('HumanDecisionSimulate');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, '/api/human-decisions/simulate');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can simulate up to 5 times per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
          remaining: 0,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { content, source, decisionType } = body;
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { error: 'Content too long (max 100,000 characters)' },
        { status: 400 }
      );
    }

    // Build input matching the original decision's metadata
    const input: HumanDecisionInput = {
      source: source || 'manual',
      content,
      decisionType: decisionType || undefined,
    };

    // Run analysis without persisting (simulation mode)
    const result = await analyzeHumanDecision(input, { userId, decisionId: 'simulate' });

    // Fire-and-forget audit log
    logAudit({
      action: 'SIMULATE_COGNITIVE_AUDIT',
      resource: 'HumanDecision',
      details: {
        projectedScore: result.decisionQualityScore,
        biasCount: result.biasFindings.length,
      },
    }).catch(err => log.warn('logAudit SIMULATE_COGNITIVE_AUDIT failed:', err));

    log.info(
      `Simulation complete: score=${result.decisionQualityScore}, biases=${result.biasFindings.length}`
    );

    return NextResponse.json({
      decisionQualityScore: result.decisionQualityScore,
      noiseScore: result.noiseScore,
      biasFindings: result.biasFindings,
      summary: result.summary,
      swotAnalysis: result.swotAnalysis,
      sentimentScore: result.sentimentScore,
    });
  } catch (error) {
    log.error('Simulation error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
