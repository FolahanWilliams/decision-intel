/**
 * GET /api/fingerprint — Returns OrgFingerprint for the authenticated user's org.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getOrgFingerprint } from '@/lib/learning/fingerprint-engine';

const log = createLogger('FingerprintAPI');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org via team membership
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });

    if (!membership?.orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const fingerprint = await getOrgFingerprint(membership.orgId);

    return NextResponse.json(fingerprint);
  } catch (error) {
    log.error(
      'Failed to fetch fingerprint:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
