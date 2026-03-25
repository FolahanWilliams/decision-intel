/**
 * GET /api/decision-graph/recommendations?analysisId=...&orgId=...
 * Returns decision recommendations based on graph intelligence.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateRecommendations } from '@/lib/graph/recommendations';

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

  const recommendations = await generateRecommendations(analysisId, orgId);
  return NextResponse.json({ recommendations });
}
