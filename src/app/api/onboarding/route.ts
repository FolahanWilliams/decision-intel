import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';
import { isHxcEligible, phase1PersonaToOnboardingRole } from '@/lib/constants/icp';

const log = createLogger('OnboardingRoute');

const ROLE_VALUES = ['cso', 'ma', 'bizops', 'pe_vc', 'other'] as const;

// GTM v3.5 — Phase 1 buyer-class-continuous persona COHORT tagging (not an
// access gate). 'other' gets FULL platform access with the generic overview;
// it is tagged phase1HxcEligible=false so it is EXCLUDED from the Vohra
// graduation-gate cohort (signal integrity), NOT from the platform. The four
// continuous personas are HXC-eligible. Access != cohort.
const PHASE_1_PERSONA_VALUES = [
  'fractional_cso',
  'midmarket_corp_dev',
  'smaller_fund_gp',
  'pe_backed_founder',
  'other',
] as const;

const DEFAULTS = {
  onboardingCompleted: false,
  onboardingStep: 0,
  onboardingRole: null as string | null,
  onboardingTourSeen: false,
  phase1Persona: null as string | null,
  phase1PersonaRoleDetail: null as string | null,
  phase1HxcEligible: false,
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
          phase1Persona: true,
          phase1PersonaRoleDetail: true,
          phase1HxcEligible: true,
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
  // GTM v3.5 Phase 1 persona gating. phase1HxcEligible is COMPUTED server-side
  // from phase1Persona — never trust a client-supplied eligibility flag.
  phase1Persona: z.enum(PHASE_1_PERSONA_VALUES).optional(),
  phase1PersonaRoleDetail: z.string().max(200).optional(),
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

    // Server-side derive phase1HxcEligible from phase1Persona so the client
    // can never lie about eligibility. The Vohra HXC cohort filter depends
    // on this field; client-tampering would distort the PMF metric.
    //
    // Also auto-derive onboardingRole from phase1Persona when both are not
    // supplied together. The merged WelcomeModal (2026-05-11) writes phase1Persona
    // as the canonical signal; the downstream cascade (OnboardingTour, sample
    // bundles, role-empty-states) reads onboardingRole. Auto-derivation keeps
    // the two in sync without forcing the client to compute the mapping.
    // Explicit onboardingRole in the same PATCH wins (preserves backwards-
    // compat with the legacy WelcomeModal flow which writes onboardingRole
    // directly).
    const writeData: Record<string, unknown> = { ...data };
    if (typeof data.phase1Persona === 'string') {
      writeData.phase1HxcEligible = isHxcEligible(data.phase1Persona);
      if (!data.onboardingRole) {
        writeData.onboardingRole = phase1PersonaToOnboardingRole(
          data.phase1Persona as Parameters<typeof phase1PersonaToOnboardingRole>[0]
        );
      }
    }

    try {
      const updated = await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...writeData },
        update: writeData,
        select: {
          onboardingCompleted: true,
          onboardingStep: true,
          onboardingRole: true,
          onboardingTourSeen: true,
          phase1Persona: true,
          phase1PersonaRoleDetail: true,
          phase1HxcEligible: true,
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
