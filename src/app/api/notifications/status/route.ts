import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isEmailConfigured } from '@/lib/notifications/email';

/**
 * GET /api/notifications/status
 * Returns whether email delivery is configured (authenticated only).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ emailConfigured: isEmailConfigured() });
}
