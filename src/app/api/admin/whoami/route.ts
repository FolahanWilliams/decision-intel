/**
 * GET /api/admin/whoami — Bootstrap helper: returns the authenticated
 * user's Supabase user ID so the founder can copy it into
 * `ADMIN_USER_IDS` on Vercel (which unlocks the full-access enterprise
 * plan bypass in plan-limits.ts and /api/billing).
 *
 * Auth gate: `ADMIN_EMAILS` must include the caller's email. Once the
 * email allowlist is set, hit this route to retrieve the corresponding
 * user ID.
 */

import { NextResponse } from 'next/server';
import { verifyAdmin, ADMIN_DENIED, isAdminUserId } from '@/lib/utils/admin';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return ADMIN_DENIED;

  const alreadyGranted = isAdminUserId(admin.id);

  return NextResponse.json({
    userId: admin.id,
    email: admin.email,
    adminUserIdsConfigured: alreadyGranted,
    hint: alreadyGranted
      ? 'You already have the full-access enterprise bypass.'
      : `Copy this userId into ADMIN_USER_IDS on Vercel (comma-separated if adding others), then redeploy. Your plan will resolve to enterprise across billing and plan-limits.`,
  });
}
