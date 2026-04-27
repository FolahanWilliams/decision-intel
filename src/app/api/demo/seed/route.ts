/**
 * POST /api/demo/seed
 *
 * Populates the authenticated user's workspace with synthetic sample
 * analyses, biases, outcomes, and decision-graph edges (M4 — Cold-Start
 * Fix). All seeded rows carry `isSample: true` and can be removed in one
 * click via POST /api/demo/clear-samples.
 *
 * Idempotent — safe to call multiple times. If any sample documents
 * already exist in scope, returns `{ seeded: 0, skipped: true }`.
 *
 * Scope: seeds at the user's org level when they belong to a team,
 * otherwise at their personal scope.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { seedDemoAnalyses } from '@/lib/demo/seed-for-org';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('DemoSeedRoute');

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

    // Rate limit: seeding is cheap but we still want to cap abuse
    const rl = await checkRateLimit(user.id, '/api/demo/seed', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const orgId = await resolveOrgId(user.id);
    const result = await seedDemoAnalyses(orgId, user.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    // Schema drift — isSample column may not be migrated yet
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Seed skipped: schema drift (isSample column not migrated)');
      return NextResponse.json(
        { seeded: 0, skipped: true, reason: 'schema-pending-migration' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('Seed failed:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
