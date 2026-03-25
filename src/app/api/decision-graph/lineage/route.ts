/**
 * GET /api/decision-graph/lineage?orgId=...&from=...&to=...&format=json|csv
 * Returns decision lineage export for compliance and audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateLineageExport, lineageToCSV } from '@/lib/reports/lineage-export';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('LineageAPI');

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
  const format = searchParams.get('format') || 'json';

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  // Default date range: last 90 days
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();
  const from = searchParams.get('from')
    ? new Date(searchParams.get('from')!)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    const records = await generateLineageExport(orgId, { from, to });

    if (format === 'csv') {
      const csv = lineageToCSV(records);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="decision-lineage-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ records, count: records.length, dateRange: { from, to } });
  } catch (error) {
    log.error('Lineage export failed:', error);
    return NextResponse.json({ error: 'Failed to generate lineage export' }, { status: 500 });
  }
}
