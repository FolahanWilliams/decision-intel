/**
 * GET /api/decision-graph/risk-state
 * Returns the organization's overall decision-making risk level.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeOrgRiskState } from '@/lib/graph/risk-state';

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

  const riskState = await computeOrgRiskState(orgId);
  return NextResponse.json(riskState);
}
