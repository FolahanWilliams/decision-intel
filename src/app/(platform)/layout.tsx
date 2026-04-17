import Sidebar from '@/components/ui/Sidebar';
import Ticker from '@/components/ui/Ticker';
import {
  AnalysisProgressProvider,
  AnalysisProgressFloat,
} from '@/components/ui/AnalysisProgressBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { NewDecisionModal } from '@/components/ui/NewDecisionModal';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { UsageMeter } from '@/components/billing/UsageMeter';
import { NotificationBell } from '@/components/ui/NotificationCenter';
import { OnboardingTourProvider } from '@/components/onboarding/OnboardingTour';
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingTourProvider>
      <AnalysisProgressProvider>
        <AuthGuard />
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <Ticker />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />
          <main
            id="main-content"
            tabIndex={-1}
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              transition: 'color 0.3s, background 0.3s',
            }}
          >
            <div
              className="platform-content"
              style={{
                width: '100%',
                maxWidth: 'min(96%, 1760px)',
                margin: '0 auto',
                paddingLeft: 'clamp(16px, 1.6vw, 40px)',
                paddingRight: 'clamp(16px, 1.6vw, 40px)',
              }}
            >
              <div
                className="platform-header-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 14,
                  marginBottom: 16,
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <span className="usage-meter-label">This month</span>
                <span id="onborda-usage-meter" style={{ display: 'inline-flex' }}>
                  <UsageMeter />
                </span>
                <NotificationBell />
              </div>
              {children}
            </div>
          </main>
        </div>
        <AnalysisProgressFloat />
        <CommandPalette />
        <NewDecisionModal />
      </AnalysisProgressProvider>
    </OnboardingTourProvider>
  );
}
