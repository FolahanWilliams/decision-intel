import { NextResponse } from 'next/server';
import { isEmailConfigured } from '@/lib/notifications/email';

/**
 * GET /api/notifications/status
 * Returns whether email delivery is configured.
 */
export async function GET() {
  return NextResponse.json({ emailConfigured: isEmailConfigured() });
}
