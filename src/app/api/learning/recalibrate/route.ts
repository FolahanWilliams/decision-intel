/**
 * Recalibration API — Behavioral Data Flywheel
 *
 * POST /api/learning/recalibrate — Trigger recalibration for an org
 * GET  /api/learning/recalibrate — View current calibration profiles
 *
 * Recalibrates bias severity weights, nudge thresholds, and twin accuracy
 * from historical outcome data and user feedback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { runFullRecalibration } from '@/lib/learning/feedback-loop';

const log = createLogger('RecalibrationAPI');

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine org context
    const body = await req.json().catch(() => ({}));
    const requestedOrgId = body.orgId;

    let orgId: string | null = null;

    if (requestedOrgId) {
      // Verify user belongs to this org
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId: requestedOrgId },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
      }
      orgId = requestedOrgId;
    } else {
      // Try to find user's org
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
      });
      orgId = membership?.orgId ?? null;
    }

    const results = await runFullRecalibration(orgId);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId,
        action: 'calibration.recalibrate',
        resource: 'calibration',
        details: {
          biasSeverity: results.biasSeverity,
          nudgeThresholds: results.nudgeThresholds,
          twinWeights: results.twinWeights,
        },
      },
    });

    log.info(`Recalibration triggered by user ${user.id} for ${orgId || 'global'}`);

    return NextResponse.json({
      message: 'Recalibration complete',
      results,
    });
  } catch (error) {
    log.error('Recalibration API failed:', error);
    return NextResponse.json({ error: 'Recalibration failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's org
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
    });
    const orgId = membership?.orgId ?? null;

    // Fetch all calibration profiles for this org/user
    let profiles: Array<{
      id: string;
      profileType: string;
      orgId: string | null;
      userId: string | null;
      sampleSize: number;
      lastCalibratedAt: Date;
      calibrationData: unknown;
    }> = [];
    try {
      profiles = await prisma.calibrationProfile.findMany({
        where: {
          OR: [
            { orgId: orgId ?? undefined },
            { userId: user.id },
            { orgId: '', userId: '' }, // Global profiles
          ],
        },
        orderBy: { lastCalibratedAt: 'desc' },
      });
    } catch {
      // Schema drift — table may not exist
      profiles = [];
    }

    return NextResponse.json({
      profiles: profiles.map(p => ({
        id: p.id,
        profileType: p.profileType,
        orgId: p.orgId,
        sampleSize: p.sampleSize,
        lastCalibratedAt: p.lastCalibratedAt,
        calibrationData: p.calibrationData,
      })),
    });
  } catch (error) {
    log.error('Failed to fetch calibration profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
