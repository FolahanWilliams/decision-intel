/**
 * POST /api/vohra-pmf/respond
 *
 * Records a user's Vohra PMF survey response. The "very disappointed"
 * answer feeds the Phase 1 graduation gate (≥40% on HXC cohort = pass).
 *
 * Rate-limited 5/hr/user — defends against accidental double-submission
 * if the modal stalls on slow networks.
 */

import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { submitVohraResponse } from '@/lib/learning/vohra-pmf';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('VohraPmfRespond');

const ALLOWED_VERY_DISAPPOINTED = new Set([
  'very_disappointed',
  'somewhat_disappointed',
  'not_disappointed',
]);

interface SubmitBody {
  surveyId?: string;
  veryDisappointed?: string;
  hxcType?: string;
  mainBenefit?: string;
  improvement?: string;
  referralWillingness?: number;
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const limit = await checkRateLimit(auth.userId, 'vohra-respond', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    failMode: 'closed',
  });
  if (!limit.success) {
    return apiError({ error: 'Too many submissions; try again later', status: 429 });
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.surveyId || typeof body.surveyId !== 'string') {
    return apiError({ error: 'surveyId required', status: 400 });
  }
  if (!body.veryDisappointed || !ALLOWED_VERY_DISAPPOINTED.has(body.veryDisappointed)) {
    return apiError({
      error:
        'veryDisappointed must be one of: very_disappointed | somewhat_disappointed | not_disappointed',
      status: 400,
    });
  }
  const referral = body.referralWillingness;
  if (referral !== undefined && referral !== null) {
    if (typeof referral !== 'number' || referral < 0 || referral > 10 || !Number.isFinite(referral)) {
      return apiError({ error: 'referralWillingness must be a number 0-10', status: 400 });
    }
  }

  try {
    const result = await submitVohraResponse(auth.userId, body.surveyId, {
      veryDisappointed: body.veryDisappointed as
        | 'very_disappointed'
        | 'somewhat_disappointed'
        | 'not_disappointed',
      hxcType: typeof body.hxcType === 'string' ? body.hxcType : undefined,
      mainBenefit: typeof body.mainBenefit === 'string' ? body.mainBenefit : undefined,
      improvement: typeof body.improvement === 'string' ? body.improvement : undefined,
      referralWillingness: typeof referral === 'number' ? referral : undefined,
    });
    return apiSuccess({ data: { id: result.id } });
  } catch (err) {
    log.warn('submit failed:', err);
    return apiError({ error: 'Submission failed', status: 500 });
  }
}
