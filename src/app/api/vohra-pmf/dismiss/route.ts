/**
 * POST /api/vohra-pmf/dismiss
 *
 * Defers a pending Vohra PMF survey. Increments dismissedCount; on the 4th
 * dismissal, the modal can no longer be dismissed (the v3.5 lock criterion
 * requires forced delivery to maintain HXC sample size).
 */

import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { dismissPendingSurvey } from '@/lib/learning/vohra-pmf';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('VohraPmfDismiss');

interface DismissBody {
  surveyId?: string;
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: DismissBody;
  try {
    body = (await request.json()) as DismissBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }
  if (!body.surveyId || typeof body.surveyId !== 'string') {
    return apiError({ error: 'surveyId required', status: 400 });
  }

  try {
    const result = await dismissPendingSurvey(auth.userId, body.surveyId);
    return apiSuccess({ data: result });
  } catch (err) {
    log.warn('dismiss failed:', err);
    return apiError({ error: 'Dismiss failed', status: 500 });
  }
}
