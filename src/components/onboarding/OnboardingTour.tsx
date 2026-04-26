'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnbordaProvider, Onborda, useOnborda } from 'onborda';
import type { Step, CardComponentProps } from 'onborda';
import {
  Upload,
  BarChart3,
  Gauge,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  GitCompare,
  Briefcase,
  Landmark,
  PenLine,
  Package,
  Vote,
} from 'lucide-react';

const TOUR_TRIGGER_KEY = 'decision-intel-launch-tour';

type TourRole = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

/**
 * Role-routed tour stops (4.2 deep). All four tours run on the dashboard
 * page so the selectors are guaranteed to exist — multi-page Onborda
 * tours are flaky when the target page changes during navigation, and a
 * single-page tour with role-tailored COPY converts better than a
 * route-bouncing tour that breaks on the first navigation. Each role's
 * final stop links to a deeper page (Reflect cluster, Deals, Decisions)
 * via the in-card Next button so the user lands on the right surface
 * the moment they finish.
 *
 * Selectors that exist on /dashboard today:
 *   #onborda-upload         — file-upload zone
 *   #onborda-usage-meter    — sidebar usage pill (UsageMeter)
 *   #onborda-nav-analytics  — sidebar Analytics nav item
 *
 * If we want to add new selectors for role-specific stops, we add IDs
 * via the Sidebar component (already done for nav-analytics). For now,
 * every tour uses the same three anchors with role-tailored copy.
 */
const SHARED_STOP_UPLOAD: Omit<Step, 'content' | 'icon' | 'title'> = {
  selector: '#onborda-upload',
  side: 'bottom',
  showControls: true,
  pointerPadding: 12,
  pointerRadius: 12,
};

const SHARED_STOP_USAGE: Omit<Step, 'content' | 'icon' | 'title'> = {
  selector: '#onborda-usage-meter',
  side: 'bottom-right',
  showControls: true,
  pointerPadding: 8,
  pointerRadius: 999,
};

const SHARED_STOP_ANALYTICS: Omit<Step, 'content' | 'icon' | 'title'> = {
  selector: '#onborda-nav-analytics',
  side: 'right',
  showControls: true,
  pointerPadding: 6,
  pointerRadius: 10,
};

const TOUR_STEPS_BY_ROLE: Record<TourRole, Step[]> = {
  cso: [
    {
      ...SHARED_STOP_UPLOAD,
      icon: <Upload size={18} />,
      title: 'Drop your strategic memo or board deck',
      content: (
        <>
          Upload a strategic memo, market-entry recommendation, or quarterly board deck. The audit
          surfaces 30+ cognitive biases with traceable excerpts and the questions a CEO or audit
          committee will surface — in 60 seconds.
        </>
      ),
    },
    {
      ...SHARED_STOP_USAGE,
      icon: <Gauge size={18} />,
      title: 'Your audit budget',
      content: (
        <>
          Every audit costs against your monthly plan. Strategy tier gets 250 audits/month
          (fair-use). The pill warns you before the cap so a quarter-end push doesn&apos;t get blocked.
        </>
      ),
    },
    {
      ...SHARED_STOP_ANALYTICS,
      icon: <ShieldCheck size={18} />,
      title: 'Decision Provenance + Outcome Flywheel',
      content: (
        <>
          Under Analytics: signed Decision Provenance Records (DPR) for every audit — the artefact
          your GC and audit committee receive — plus the Outcome Flywheel where you close the loop
          and watch Brier-calibrated DQI compound quarter over quarter.
        </>
      ),
    },
  ],
  ma: [
    {
      ...SHARED_STOP_UPLOAD,
      icon: <Upload size={18} />,
      title: 'Drop the IC memo, CIM, or model',
      content: (
        <>
          Upload the IC memo, CIM, or counsel review for a deal in flight. The audit catches the
          biases that sink committee votes — anchoring on synergies, sunk-cost on a year-long
          process, overconfidence on integration timelines.
        </>
      ),
    },
    {
      ...SHARED_STOP_USAGE,
      icon: <Briefcase size={18} />,
      title: 'Your audit budget per deal',
      content: (
        <>
          Strategy tier supports unlimited audits per active deal under fair-use; Enterprise adds
          per-deal billing for high-volume programs. The usage pill shows monthly draw against your
          plan.
        </>
      ),
    },
    {
      ...SHARED_STOP_ANALYTICS,
      icon: <GitCompare size={18} />,
      title: 'Cross-document review + Decisions',
      content: (
        <>
          When you upload more than one doc per deal, the cross-reference agent flags conflicts
          (&ldquo;CIM says 40% growth, model assumes 15%&rdquo;) and a composite Deal DQI lives on
          the Deals page. Decision Packages do the same for non-deal decisions.
        </>
      ),
    },
  ],
  bizops: [
    {
      ...SHARED_STOP_UPLOAD,
      icon: <Upload size={18} />,
      title: 'Drop your forecast or planning memo',
      content: (
        <>
          Upload a quarterly forecast, planning memo, or buy-vs-build recommendation. The audit
          flags the anchoring + overconfidence patterns that ship bad forecasts before they reach
          the steering committee.
        </>
      ),
    },
    {
      ...SHARED_STOP_USAGE,
      icon: <PenLine size={18} />,
      title: 'Decision Log feeds the audit',
      content: (
        <>
          Beyond uploads, your Decision Log captures every committed decision — manual entries,
          meeting transcripts, Slack threads. Each one feeds the same audit pipeline, so patterns
          across forecasts become visible instead of anecdotal.
        </>
      ),
    },
    {
      ...SHARED_STOP_ANALYTICS,
      icon: <Package size={18} />,
      title: 'Outcome Flywheel + Decision Packages',
      content: (
        <>
          Under Analytics: the Outcome Flywheel where you log realised outcomes and watch DQI
          recalibrate. Decision Packages in the Reflect cluster bundle related docs into a single
          decision-quality view — composite DQI, recurring biases, cross-doc conflicts.
        </>
      ),
    },
  ],
  pe_vc: [
    {
      ...SHARED_STOP_UPLOAD,
      icon: <Upload size={18} />,
      title: 'Drop the IC memo, source memo, or growth-round CIM',
      content: (
        <>
          Upload a pre-IC memo, source memo, growth-round CIM, or pre-commit review. The audit
          surfaces the patterns that kill fund returns — anchoring on a single comparable
          transaction, narrative-fallacy on regulatory tailwinds, planning-fallacy on integration
          timelines, survivorship bias on the peer set.
        </>
      ),
    },
    {
      ...SHARED_STOP_USAGE,
      icon: <Vote size={18} />,
      title: 'Pre-IC blind-prior voting',
      content: (
        <>
          Decision Rooms collect anonymous IC priors before the meeting and reveal aggregate
          confidence + top-3 risks at deadline. See the disagreement before the room collapses to
          consensus. Brier-calibrated participant scoring closes the loop after the outcome lands.
        </>
      ),
    },
    {
      ...SHARED_STOP_ANALYTICS,
      icon: <Landmark size={18} />,
      title: 'LP-grade Decision Provenance + cross-fund DQI',
      content: (
        <>
          Under Analytics: signed Decision Provenance Records on every audited deal, the Outcome
          Flywheel where realised exits recalibrate prior IC convictions, and Brier-calibrated DQI
          across the portfolio. The calibration data your LPs increasingly want to see in the
          annual report.
        </>
      ),
    },
  ],
  other: [
    {
      ...SHARED_STOP_UPLOAD,
      icon: <Upload size={18} />,
      title: 'Drop in your strategic memo',
      content: (
        <>
          Start here. Upload a strategic memo, board deck, or market-entry recommendation. The
          60-second audit starts the moment it lands.
        </>
      ),
    },
    {
      ...SHARED_STOP_USAGE,
      icon: <Gauge size={18} />,
      title: 'Your audit usage, at a glance',
      content: (
        <>
          Every audit counts against your monthly plan. Free tier gets 4 audits/month — this pill
          shows how many are left and warns you before you hit the cap.
        </>
      ),
    },
    {
      ...SHARED_STOP_ANALYTICS,
      icon: <BarChart3 size={18} />,
      title: 'Analytics + your Decision Graph',
      content: (
        <>
          Analytics surfaces Decision Quality Index across quarters, repeat biases by theme, and the
          Decision Knowledge Graph — every audited memo joins it, so today&apos;s decision inherits
          yesterday&apos;s lessons. This is where compounding shows up.
        </>
      ),
    },
  ],
};

const TOUR_NAME_BY_ROLE: Record<TourRole, string> = {
  cso: 'dashboard-tour-cso',
  ma: 'dashboard-tour-ma',
  bizops: 'dashboard-tour-bizops',
  pe_vc: 'dashboard-tour-pe-vc',
  other: 'dashboard-tour',
};

function TourCard({ step, currentStep, totalSteps, nextStep, prevStep }: CardComponentProps) {
  const { closeOnborda } = useOnborda();

  const handleFinish = () => {
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingTourSeen: true }),
    }).catch(err => console.warn('[OnboardingTour] mark tour-seen failed:', err));
    closeOnborda();
  };

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderTop: '3px solid var(--accent-primary, #16A34A)',
        borderRadius: 12,
        padding: 20,
        maxWidth: 360,
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
        color: 'var(--text-primary, #0F172A)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.12)',
              color: 'var(--accent-primary, #16A34A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {step.icon}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #94A3B8)',
            }}
          >
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>
        <button
          onClick={handleFinish}
          aria-label="Close tour"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #94A3B8)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
        }}
      >
        {step.title}
      </h3>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-secondary, #475569)',
          marginBottom: 14,
        }}
      >
        {step.content}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <button
          onClick={prevStep}
          disabled={isFirst}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: '7px 10px',
            background: 'transparent',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 8,
            color: 'var(--text-secondary, #475569)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.4 : 1,
          }}
        >
          <ArrowLeft size={13} />
          Back
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background:
                  i === currentStep
                    ? 'var(--accent-primary, #16A34A)'
                    : 'var(--border-color, #E2E8F0)',
                transition: 'width 0.2s',
              }}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={handleFinish}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 12px',
              background: 'var(--accent-primary, #16A34A)',
              border: '1px solid var(--accent-primary, #16A34A)',
              borderRadius: 8,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <Check size={13} />
            Finish
          </button>
        ) : (
          <button
            onClick={nextStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 12px',
              background: 'var(--accent-primary, #16A34A)',
              border: '1px solid var(--accent-primary, #16A34A)',
              borderRadius: 8,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            Next
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Triggers the Onborda dashboard tour in three cases:
 *   1. The WelcomeModal dispatches `di:launch-tour` after the user clicks
 *      "Launch tour" — the explicit opt-in path.
 *   2. A pending flag sits in localStorage (TOUR_TRIGGER_KEY) — covers the
 *      case where the user clicked the button but navigated before the tour
 *      could mount.
 *   3. Auto-launch for first-login users who land directly on the dashboard
 *      without having seen the tour. Requires:
 *        - we are ON /dashboard (so the selectors exist)
 *        - the server says onboardingTourSeen !== true
 *        - the user has not explicitly dismissed the checklist
 *      This catches users who skipped the Welcome modal entirely — previously
 *      they would never see the tour.
 */
function isTourRole(value: unknown): value is TourRole {
  return (
    value === 'cso' ||
    value === 'ma' ||
    value === 'bizops' ||
    value === 'pe_vc' ||
    value === 'other'
  );
}

function TourLauncher() {
  const { startOnborda } = useOnborda();
  const router = useRouter();

  useEffect(() => {
    // Re-fetch the role at trigger time (not at mount) so a fresh
    // PATCH from the WelcomeModal isn't lost to the role state. The
    // network call adds <50ms to launch which is well below the
    // already-existing setTimeout delay.
    const resolveRoleAndLaunch = async (delay = 300) => {
      let role: TourRole = 'other';
      try {
        const res = await fetch('/api/onboarding');
        if (res.ok) {
          const data = (await res.json()) as { onboardingRole?: string | null };
          if (isTourRole(data.onboardingRole)) role = data.onboardingRole;
        }
      } catch {
        /* fall back to 'other' tour */
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
        router.push('/dashboard');
      }
      setTimeout(() => {
        startOnborda(TOUR_NAME_BY_ROLE[role]);
        localStorage.removeItem(TOUR_TRIGGER_KEY);
      }, delay);
    };

    if (localStorage.getItem(TOUR_TRIGGER_KEY) === 'pending') {
      void resolveRoleAndLaunch(600);
    }

    const handleLaunch = () => {
      void resolveRoleAndLaunch(300);
    };
    window.addEventListener('di:launch-tour', handleLaunch);

    const maybeAutoLaunch = () => {
      if (typeof window === 'undefined') return;
      if (!window.location.pathname.startsWith('/dashboard')) return;
      if (window.location.pathname !== '/dashboard') return;
      if (!document.getElementById('onborda-upload')) return;
      if (localStorage.getItem('decision-intel-checklist-dismissed') === 'true') return;
      if (localStorage.getItem('decision-intel-tour-autolaunched') === 'true') return;
      fetch('/api/onboarding')
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((data: { onboardingTourSeen?: boolean; hasContent?: boolean }) => {
          if (data.onboardingTourSeen) return;
          // Adaeze's audit catch (2026-04-25): skip the spotlight tour when
          // the user already has any document or human-decision row. The
          // tour assumes an empty dashboard; firing it over the user's own
          // data is the failure mode where they "see things that don't
          // exist" and silently dismiss.
          if (data.hasContent) {
            localStorage.setItem('decision-intel-tour-autolaunched', 'true');
            return;
          }
          localStorage.setItem('decision-intel-tour-autolaunched', 'true');
          void resolveRoleAndLaunch(900);
        })
        .catch(() => {
          /* without auth we skip auto-launch */
        });
    };
    const autoLaunchTimer = setTimeout(maybeAutoLaunch, 400);

    return () => {
      window.removeEventListener('di:launch-tour', handleLaunch);
      clearTimeout(autoLaunchTimer);
    };
  }, [router, startOnborda]);

  return null;
}

export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={[
          { tour: 'dashboard-tour', steps: TOUR_STEPS_BY_ROLE.other },
          { tour: 'dashboard-tour-cso', steps: TOUR_STEPS_BY_ROLE.cso },
          { tour: 'dashboard-tour-ma', steps: TOUR_STEPS_BY_ROLE.ma },
          { tour: 'dashboard-tour-bizops', steps: TOUR_STEPS_BY_ROLE.bizops },
          { tour: 'dashboard-tour-pe-vc', steps: TOUR_STEPS_BY_ROLE.pe_vc },
        ]}
        shadowRgb="15, 23, 42"
        shadowOpacity="0.55"
        cardComponent={TourCard}
      >
        <TourLauncher />
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
