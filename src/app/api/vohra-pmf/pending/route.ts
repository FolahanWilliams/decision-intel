/**
 * GET /api/vohra-pmf/pending
 *
 * Returns the authenticated user's currently pending Vohra PMF survey, or
 * `{ pending: null }` if none. Used by the in-app modal mounted on the
 * platform layout — fires on every dashboard load until the user submits
 * or hits 3 dismissals.
 */

import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { getPendingSurvey } from '@/lib/learning/vohra-pmf';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('VohraPmfPending');

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  try {
    const pending = await getPendingSurvey(auth.userId);
    return apiSuccess({
      data: {
        pending: pending
          ? {
              id: pending.id,
              triggeredAt: pending.triggeredAt.toISOString(),
              dismissedCount: pending.dismissedCount,
              forceShow: pending.forceShow,
            }
          : null,
      },
    });
  } catch (err) {
    log.warn('pending lookup failed:', err);
    return apiSuccess({ data: { pending: null } });
  }
}
