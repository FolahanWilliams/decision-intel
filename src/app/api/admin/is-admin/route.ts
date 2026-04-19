/**
 * GET /api/admin/is-admin
 *
 * Cheap boolean probe used by client-side UI to decide whether to render
 * admin-only affordances (e.g. the "View org-wide firehose" link inside
 * AuditLogInline). Returns `{ isAdmin: true }` when the caller's
 * Supabase user ID is in ADMIN_USER_IDS, `{ isAdmin: false }` otherwise.
 *
 * Does NOT 403 on non-admins — the point is to let the UI check status
 * without treating a negative answer as an error. Unauthenticated
 * callers still get 401 since there's nothing sensible to answer.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdminUserId } from '@/lib/utils/admin';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ isAdmin: isAdminUserId(user.id) });
}
