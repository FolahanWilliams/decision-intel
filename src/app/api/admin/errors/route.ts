/**
 * Admin Error Viewing Endpoint
 *
 * GET /api/admin/errors - View recent system errors (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorTracker } from '@/lib/utils/error-tracker';
import { createLogger } from '@/lib/utils/logger';
import { verifyAdmin, ADMIN_DENIED } from '@/lib/utils/admin';

const log = createLogger('AdminErrors');

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return ADMIN_DENIED;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Fetch recent errors
    const errors = await errorTracker.getRecentErrors(Math.min(limit, 100));

    return NextResponse.json({
      errors,
      count: errors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Failed to fetch system errors:', error);
    return NextResponse.json({ error: 'Failed to fetch system errors' }, { status: 500 });
  }
}
