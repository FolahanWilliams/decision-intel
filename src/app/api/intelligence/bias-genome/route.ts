import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeBiasGenome } from '@/lib/learning/bias-genome';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';

const log = createLogger('BiasGenomeRoute');

/**
 * GET /api/intelligence/bias-genome
 *
 * Returns the cross-organization Bias Genome benchmark data.
 * Requires authentication. Response is cached for 1 hour.
 *
 * Rate limiting: This endpoint should be rate-limited to ~10 req/min
 * per user in production (not implemented here — apply via middleware
 * or the RateLimit model).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await computeBiasGenome();

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('Schema drift in bias-genome route');
      return NextResponse.json({
        totalOrgs: 0,
        totalDecisions: 0,
        genome: [],
        computedAt: new Date().toISOString(),
        _drifted: true,
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to fetch Bias Genome:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
