/**
 * GET /api/decision-graph/report?orgId=...&timeRange=90&narrative=true
 * Returns a full graph network analysis report with optional AI narrative.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateGraphReport } from '@/lib/reports/graph-report';
import { generateGraphNarrative } from '@/lib/reports/graph-narrative';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GraphReportAPI');

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
  const timeRange = parseInt(searchParams.get('timeRange') || '90', 10);
  const includeNarrative = searchParams.get('narrative') !== 'false';

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const report = await generateGraphReport(orgId, user.id, timeRange);

    let narrative: string | null = null;
    if (includeNarrative) {
      try {
        narrative = await generateGraphNarrative(report);
      } catch (err) {
        log.warn('Narrative generation failed (non-critical):', err);
      }
    }

    return NextResponse.json({ report, narrative });
  } catch (error) {
    log.error('Graph report generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
