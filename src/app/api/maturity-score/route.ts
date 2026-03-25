/**
 * Decision Maturity Score API
 *
 * GET /api/maturity-score?orgId=... — Compute org decision maturity score
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeMaturityScore } from '@/lib/learning/maturity-score';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MaturityScoreAPI');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const result = await computeMaturityScore(orgId);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Failed to compute maturity score:', error);
    return NextResponse.json({ error: 'Failed to compute maturity score' }, { status: 500 });
  }
}
