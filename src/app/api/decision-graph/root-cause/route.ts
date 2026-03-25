/**
 * GET /api/decision-graph/root-cause?analysisId=...&orgId=...
 * Returns root cause attribution for a decision's outcome.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { attributeRootCauses } from '@/lib/graph/root-cause';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get('analysisId');
  const orgId = searchParams.get('orgId');

  if (!analysisId || !orgId) {
    return NextResponse.json({ error: 'analysisId and orgId are required' }, { status: 400 });
  }

  const attributions = await attributeRootCauses(analysisId, orgId);
  return NextResponse.json({ attributions });
}
