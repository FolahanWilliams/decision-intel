import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isAdminUserId } from '@/lib/utils/admin';

/**
 * Server-side access gate for the ENTIRE Founder Hub segment — the hub
 * page and every nested brief (design-partners / Sankore, and the
 * Accountability Sprint / warm-intro briefs rendered inside the page).
 *
 * WHY THIS EXISTS (locked 2026-06-01). The hub page (page.tsx) is a
 * `'use client'` component protected ONLY by:
 *   (a) Supabase platform auth — i.e. ANY logged-in user, and
 *   (b) a CLIENT-SIDE password compared against NEXT_PUBLIC_FOUNDER_HUB_PASS,
 *       which is inlined into the JS bundle shipped to every browser.
 * That is not real access control. Any authenticated user could reach
 * /dashboard/founder-hub, read the pass out of the bundle (or bypass the
 * client React gate entirely), and view founder-only content — positioning
 * strategy, prospect briefs, the mentor brief, exit math. This layout adds
 * the missing SERVER-SIDE check so non-founders never get the page rendered
 * (and the lazy tab chunks are never requested for them).
 *
 * SAFE-BY-DEFAULT — it must never lock the founder out of their own hub.
 * `isAdminUserId` returns false when ADMIN_USER_IDS is unset, so a naive
 * gate would 404 EVERYONE (including the founder) until the env var is
 * configured. Instead we only HARD-gate once the allowlist actually exists;
 * if it is not configured we fall through to the existing client password
 * gate (current behaviour preserved). To ACTIVATE the hard gate: set
 * ADMIN_USER_IDS in Vercel (bootstrap — set ADMIN_EMAILS, deploy, hit
 * /api/admin/whoami while logged in for your Supabase UUID, paste it in).
 *
 * The client password gate in page.tsx stays as defense-in-depth (e.g. a
 * shared/borrowed logged-in session on the founder's own machine).
 *
 * NOTE on residual exposure: Next.js client chunks are inherently
 * inspectable, so true zero-leak of founder-hub content would require
 * server-only rendering (a larger rearchitecture). For the current stage
 * this route gate — non-founders get redirected and the page + its dynamic
 * chunks are never served to them — is the proportionate fix.
 */
export default async function FounderHubLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login?next=/dashboard/founder-hub');
  }

  const adminListConfigured =
    (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean).length > 0;

  // Hard server gate — only when the allowlist is configured, so we never
  // lock the founder out before they've set ADMIN_USER_IDS.
  if (adminListConfigured && !isAdminUserId(user.id)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
