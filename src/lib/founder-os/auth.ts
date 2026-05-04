/**
 * Founder OS dual-gate auth helper.
 *
 * Combines two checks:
 *   (1) verifyFounderPass — gates access to founder-hub surfaces (the same
 *       pattern as the rest of /api/founder-hub/*).
 *   (2) Supabase auth — extracts the authenticated user.id so the OS data
 *       is partitioned per-user (multi-device sync via the same user.id
 *       across phone + laptop + future).
 *
 * Both must succeed. Returns either { ok: true, userId } or an error
 * envelope the caller renders via apiError.
 */

import { createClient } from '@/utils/supabase/server';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

export interface FounderOsAuthResult {
  ok: boolean;
  userId?: string;
  error?: string;
  status?: number;
}

const FOUNDER_PASS_HEADER = 'x-founder-pass';

export async function authenticateFounderOs(request: Request): Promise<FounderOsAuthResult> {
  const passCheck = verifyFounderPass(request.headers.get(FOUNDER_PASS_HEADER));
  if (!passCheck.ok) {
    return {
      ok: false,
      error: passCheck.reason === 'not_configured' ? 'Founder pass not configured' : 'Unauthorized',
      status: passCheck.reason === 'not_configured' ? 503 : 401,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, error: 'Authentication required', status: 401 };
  }
  return { ok: true, userId: user.id };
}
