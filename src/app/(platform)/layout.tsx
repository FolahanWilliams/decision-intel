import Sidebar from '@/components/ui/Sidebar';
import Ticker from '@/components/ui/Ticker';
import {
  AnalysisProgressProvider,
  AnalysisProgressFloat,
} from '@/components/ui/AnalysisProgressBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { NewDecisionModal } from '@/components/ui/NewDecisionModal';
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalysisProgressProvider>
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
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 32px 64px' }}>
            {children}
          </div>
        </main>
      </div>
      <AnalysisProgressFloat />
      <CommandPalette />
      <NewDecisionModal />
    </AnalysisProgressProvider>
  );
}
