'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnbordaProvider, Onborda, useOnborda } from 'onborda';
import type { Step, CardComponentProps } from 'onborda';
import { Upload, BarChart3, Gauge, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const TOUR_TRIGGER_KEY = 'decision-intel-launch-tour';

const TOUR_STEPS: Step[] = [
  {
    icon: <Upload size={18} />,
    title: 'Drop in your strategic memo',
    content: (
      <>
        Start here. Upload a strategic memo, board deck, or market-entry recommendation —
        PDF, DOCX, or PPTX (speaker notes included). The 60-second audit starts the moment it lands.
      </>
    ),
    selector: '#onborda-upload',
    side: 'bottom',
    showControls: true,
    pointerPadding: 12,
    pointerRadius: 12,
  },
  {
    icon: <Gauge size={18} />,
    title: 'Your audit usage, at a glance',
    content: (
      <>
        Every audit counts against your monthly plan. Free tier gets 4 audits/month — this
        pill shows how many are left and warns you before you hit the cap.
      </>
    ),
    selector: '#onborda-usage-meter',
    side: 'bottom-right',
    showControls: true,
    pointerPadding: 8,
    pointerRadius: 999,
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Analytics + your Decision Graph',
    content: (
      <>
        Analytics surfaces Decision Quality Index across quarters, repeat biases by theme, and
        the Decision Knowledge Graph — every audited memo joins it, so today&apos;s decision
        inherits yesterday&apos;s lessons. This is where compounding shows up.
      </>
    ),
    selector: '#onborda-nav-analytics',
    side: 'right',
    showControls: true,
    pointerPadding: 6,
    pointerRadius: 10,
  },
];

function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
}: CardComponentProps) {
  const { closeOnborda } = useOnborda();

  const handleFinish = () => {
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingTourSeen: true }),
    }).catch(() => {});
    closeOnborda();
  };

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <div
      style={{
        // NB: intentionally NOT using var(--bg-card) — that token is
        // rgba(0,0,0,0.01) in light theme, which makes the tour card
        // unreadable over Onborda's dimmed shadow. Solid white instead.
        background: '#FFFFFF',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderTop: '3px solid var(--accent-primary, #16A34A)',
        borderRadius: 12,
        padding: 20,
        maxWidth: 360,
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.28)',
        color: 'var(--text-primary, #0F172A)',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif",
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
function TourLauncher() {
  const { startOnborda } = useOnborda();
  const router = useRouter();

  useEffect(() => {
    const trigger = (delay = 300) => {
      // Ensure we're on the dashboard so the tour targets exist
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
        router.push('/dashboard');
      }
      setTimeout(() => {
        startOnborda('dashboard-tour');
        localStorage.removeItem(TOUR_TRIGGER_KEY);
      }, delay);
    };

    if (localStorage.getItem(TOUR_TRIGGER_KEY) === 'pending') {
      trigger(600);
    }

    const handleLaunch = () => trigger(300);
    window.addEventListener('di:launch-tour', handleLaunch);

    // Auto-launch for first-login users who bypassed the WelcomeModal.
    // Fire only when we can see the upload zone selector — protects against
    // running on sub-routes like /dashboard/settings where the target is
    // missing and Onborda would render against nothing.
    const maybeAutoLaunch = () => {
      if (typeof window === 'undefined') return;
      if (!window.location.pathname.startsWith('/dashboard')) return;
      if (window.location.pathname !== '/dashboard') return;
      if (!document.getElementById('onborda-upload')) return;
      if (localStorage.getItem('decision-intel-checklist-dismissed') === 'true') return;
      if (localStorage.getItem('decision-intel-tour-autolaunched') === 'true') return;
      fetch('/api/onboarding')
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((data: { onboardingTourSeen?: boolean }) => {
          if (data.onboardingTourSeen) return;
          localStorage.setItem('decision-intel-tour-autolaunched', 'true');
          trigger(900);
        })
        .catch(() => {
          // no-op: without auth or onboarding data we skip auto-launch.
        });
    };
    // Delay one frame so the dashboard has time to render the upload zone
    // before we query for it.
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
        steps={[{ tour: 'dashboard-tour', steps: TOUR_STEPS }]}
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
