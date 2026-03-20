/**
 * Admin Error Viewing Endpoint
 *
 * GET /api/admin/errors - View recent system errors (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { errorTracker } from '@/lib/utils/error-tracker';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminErrors');

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may want to implement proper role checking)
    // For now, we'll check if the user email is in an admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = user.email && adminEmails.includes(user.email);

    if (!isAdmin) {
      log.warn(`Non-admin user ${user.id} attempted to access error logs`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    return NextResponse.json(
      { error: 'Failed to fetch system errors' },
      { status: 500 }
    );
  }
}