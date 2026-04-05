/**
 * Decision Triage API
 *
 * GET /api/triage?orgId=...&limit=5 — Get top N decisions needing attention
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { triageDecisions } from '@/lib/learning/decision-triage';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('TriageAPI');

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
  const parsedLimit = parseInt(searchParams.get('limit') || '5', 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const result = await triageDecisions(orgId, Math.min(limit, 20));
    return NextResponse.json(result);
  } catch (error) {
    log.error('Failed to triage decisions:', error);
    return NextResponse.json({ error: 'Failed to triage decisions' }, { status: 500 });
  }
}
