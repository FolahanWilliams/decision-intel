import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const ADMIN_DENIED = NextResponse.json({ error: 'Forbidden' }, { status: 403 });

/**
 * Verify the current user is an admin. Returns the user if authorized, or null.
 * Normalizes email comparison to prevent case/whitespace mismatches.
 */
export async function verifyAdmin(): Promise<{ id: string; email: string } | null> {
  const adminEmails = (process.env.ADMIN_EMAILS?.split(',') || [])
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) return null; // No admins configured

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  if (!adminEmails.includes(user.email.trim().toLowerCase())) return null;

  return { id: user.id, email: user.email };
}

/**
 * Synchronous admin check by Supabase user ID. Used by server code paths
 * that already have a userId (e.g. plan-limits.ts, billing APIs) to grant
 * full-access plan without hitting Supabase's admin API on every call.
 *
 * Configuration: set `ADMIN_USER_IDS` on Vercel to a comma-separated list
 * of Supabase user UUIDs. The founder can look up their own ID by hitting
 * `/api/admin/whoami` while logged in.
 *
 * Returns false if the env var isn't set or the userId isn't in the list.
 */
export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const ids = (process.env.ADMIN_USER_IDS?.split(',') || [])
    .map(id => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return false;
  return ids.includes(userId);
}

export { ADMIN_DENIED };
