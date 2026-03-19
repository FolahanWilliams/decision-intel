import Sidebar from '@/components/ui/Sidebar';
import Ticker from '@/components/ui/Ticker';
import {
  AnalysisProgressProvider,
  AnalysisProgressFloat,
} from '@/components/ui/AnalysisProgressBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { LiquidGlassEffect } from '@/components/ui/LiquidGlassEffect';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalysisProgressProvider>
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <LiquidGlassEffect />
      <Ticker />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'transparent',
            color: 'var(--text-primary)',
            transition: 'color 0.3s',
          }}
        >
          {children}
        </main>
      </div>
      <AnalysisProgressFloat />
      <CommandPalette />
    </AnalysisProgressProvider>
  );
}
