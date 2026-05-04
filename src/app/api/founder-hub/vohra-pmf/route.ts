/**
 * GET /api/founder-hub/vohra-pmf
 *
 * Returns the GTM v3.5 Phase 1 PMF metrics dashboard data — % "very
 * disappointed" on the HXC cohort, persona breakdown, graduation-gate
 * status, kill-threshold status. Surfaced in the Founder Hub Phase 1
 * dashboard tile.
 *
 * Founder-pass gated — same auth pattern as the rest of /api/founder-hub.
 */

import { NextResponse } from 'next/server';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { computeHxcCohortMetrics } from '@/lib/learning/vohra-pmf';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('VohraPmfDashboard');

export const dynamic = 'force-dynamic';

const FOUNDER_PASS_HEADER = 'x-founder-pass';

export async function GET(request: Request) {
  const auth = verifyFounderPass(request.headers.get(FOUNDER_PASS_HEADER));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason === 'not_configured' ? 'Founder pass not configured' : 'Unauthorized' },
      { status: auth.reason === 'not_configured' ? 503 : 401 }
    );
  }

  const url = new URL(request.url);
  const windowDays = Math.min(
    Math.max(parseInt(url.searchParams.get('windowDays') ?? '90', 10) || 90, 7),
    365
  );

  try {
    const metrics = await computeHxcCohortMetrics(windowDays);
    return NextResponse.json(metrics);
  } catch (err) {
    log.error('failed to compute HXC metrics:', err);
    return NextResponse.json({ error: 'Failed to compute HXC metrics' }, { status: 500 });
  }
}
