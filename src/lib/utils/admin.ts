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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return null;
  if (!adminEmails.includes(user.email.trim().toLowerCase())) return null;

  return { id: user.id, email: user.email };
}

export { ADMIN_DENIED };
