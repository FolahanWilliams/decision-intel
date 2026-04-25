import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('OnboardingRoute');

const ROLE_VALUES = ['cso', 'ma', 'bizops', 'pe_vc', 'other'] as const;

const DEFAULTS = {
  onboardingCompleted: false,
  onboardingStep: 0,
  onboardingRole: null as string | null,
  onboardingTourSeen: false,
  hasContent: false,
};

/**
 * GET /api/onboarding
 * Returns onboarding state for the authenticated user.
 *
 * `hasContent` (added 2026-04-25) tells the OnboardingTour auto-launch
 * whether the user already has documents or human-decisions. Adaeze's
 * persona-audit catch: a user who lands on /dashboard via deep-link or
 * post-upload redirect should NOT see the spotlight tour fire on top of
 * their own data — the tour assumes empty state. The flag is true if
 * the user owns ≥1 non-deleted document OR ≥1 human-decision row.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const settings = await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
        select: {
          onboardingCompleted: true,
          onboardingStep: true,
          onboardingRole: true,
          onboardingTourSeen: true,
        },
      });

      // Cheap content presence check — count one row from each table
      // and short-circuit with `findFirst`. Schema-drift tolerant.
      let hasContent = false;
      try {
        const [doc, dec] = await Promise.all([
          prisma.document.findFirst({
            where: { userId: user.id, deletedAt: null },
            select: { id: true },
          }),
          prisma.humanDecision
            .findFirst({
              where: { userId: user.id },
              select: { id: true },
            })
            .catch(() => null),
        ]);
        hasContent = Boolean(doc || dec);
      } catch (presenceErr) {
        const code = (presenceErr as { code?: string })?.code;
        if (code !== 'P2021' && code !== 'P2022') {
          log.warn(
            'hasContent presence check failed:',
            presenceErr instanceof Error ? presenceErr.message : String(presenceErr)
          );
        }
      }

      return NextResponse.json({ ...settings, hasContent });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Onboarding columns not yet migrated, returning defaults');
        return NextResponse.json(DEFAULTS);
      }
      throw e;
    }
  } catch (error) {
    log.error('GET /api/onboarding failed:', error);
    return NextResponse.json(DEFAULTS);
  }
}

const PatchSchema = z.object({
  onboardingCompleted: z.boolean().optional(),
  onboardingStep: z.number().int().min(0).max(10).optional(),
  onboardingRole: z.enum(ROLE_VALUES).optional(),
  onboardingTourSeen: z.boolean().optional(),
});

/**
 * PATCH /api/onboarding
 * Updates onboarding state for the authenticated user.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    try {
      const updated = await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
        select: {
          onboardingCompleted: true,
          onboardingStep: true,
          onboardingRole: true,
          onboardingTourSeen: true,
        },
      });

      return NextResponse.json(updated);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Onboarding columns not yet migrated, skipping update');
        return NextResponse.json(DEFAULTS);
      }
      throw e;
    }
  } catch (error) {
    log.error('PATCH /api/onboarding failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
