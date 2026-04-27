/**
 * GET /api/demo/status
 *
 * Returns the current state of sample vs. real data in the authenticated
 * user's scope. The client uses this to decide which CTA to show:
 *
 *   - `realCount === 0 && sampleCount === 0` → "Populate with sample data"
 *   - `realCount > 0 && sampleCount > 0` → "You still have sample data — remove?"
 *   - `realCount >= CLEAR_THRESHOLD && sampleCount > 0` → "Ready to remove samples"
 *   - otherwise → no CTA
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DemoStatusRoute');

/** Real-analysis count at which "ready to remove samples" CTA appears.
    Kept module-private — Next.js route.ts files reject any export that
    isn't an HTTP method or recognized metadata ("dynamic", "revalidate"...). */
const CLEAR_THRESHOLD = 5;

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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrgId(user.id);
    const scopeFilter = orgId ? { orgId } : { userId: user.id, orgId: null };

    try {
      const [sampleCount, realCount] = await Promise.all([
        prisma.document.count({ where: { isSample: true, ...scopeFilter } }),
        prisma.document.count({ where: { isSample: false, ...scopeFilter } }),
      ]);

      return NextResponse.json({
        sampleCount,
        realCount,
        hasSamples: sampleCount > 0,
        canClear: sampleCount > 0 && realCount >= CLEAR_THRESHOLD,
        shouldOfferSeed: sampleCount === 0 && realCount === 0,
        clearThreshold: CLEAR_THRESHOLD,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        // isSample column not migrated yet — degrade gracefully
        return NextResponse.json({
          sampleCount: 0,
          realCount: 0,
          hasSamples: false,
          canClear: false,
          shouldOfferSeed: false,
          clearThreshold: CLEAR_THRESHOLD,
        });
      }
      throw e;
    }
  } catch (error) {
    log.error('Demo status failed:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
