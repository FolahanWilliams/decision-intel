/**
 * POST /api/demo/clear-samples
 *
 * Removes all `isSample: true` rows from the authenticated user's
 * workspace — documents, analyses, biases, outcomes, human decisions,
 * and decision-graph edges. Cascades handle the child rows automatically.
 *
 * Called when the user clicks the "Remove sample data" affordance on
 * the dashboard (appears once they have ≥5 real analyses, M4.3).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { clearSampleData } from '@/lib/demo/seed-for-org';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('DemoClearSamplesRoute');

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return membership?.orgId || null;
  } catch (err) {
    log.warn('resolveOrgId failed (returning null fallback):', err);
    return null;
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await checkRateLimit(user.id, '/api/demo/clear-samples', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const orgId = await resolveOrgId(user.id);
    const result = await clearSampleData(orgId, user.id);

    // Audit trail — destructive action
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          orgId: orgId || null,
          action: 'demo.clear_samples',
          resource: 'sample_data',
          resourceId: 'bulk',
          details: result,
        },
      });
    } catch (err) {
      // AuditLog write must never be silent per CLAUDE.md fire-and-forget discipline (security-sensitive action).
      log.warn('AuditLog write failed for demo.clear_samples:', err);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Clear skipped: schema drift (isSample column not migrated)');
      return NextResponse.json(
        { documentsDeleted: 0, humanDecisionsDeleted: 0, edgesDeleted: 0 },
        { status: 503 }
      );
    }
    log.error('Clear samples failed:', error);
    return NextResponse.json({ error: 'Clear failed' }, { status: 500 });
  }
}
