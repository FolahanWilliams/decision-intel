/**
 * GET /api/decision-graph/benchmarks?orgId=...
 * Returns org benchmarks compared against peer data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeOrgBenchmarks } from '@/lib/graph/benchmarking';

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

  const benchmarks = await computeOrgBenchmarks(orgId);
  return NextResponse.json({ benchmarks });
}
