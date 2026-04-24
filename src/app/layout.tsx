import type { Metadata } from 'next';
import './globals.css';

// Local font packages — no build-time network dependency on Google Fonts.
// See the top of globals.css for the @font-face sources. The CSS variables
// below are kept as-is so every existing class, style, and cn() call that
// references --font-inter / --font-display / --font-mono continues to work.
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';

// Inter variable covers 100-900. Instrument Serif is 400 regular + italic.
// JetBrains Mono variable covers 100-800. font-display: swap is set per-
// @font-face by @fontsource, so no CLS regression vs. next/font/google.
const fontClass = 'font-sans';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Decision Intel | The native reasoning layer for every boardroom strategic decision',
    template: '%s | Decision Intel',
  },
  description:
    'The native reasoning layer for every boardroom strategic decision. Audit the reasoning in every strategic memo, predict steering-committee objections before the meeting, and compound a living Decision Knowledge Graph quarter after quarter.',
  keywords: [
    'reasoning layer',
    'decision provenance record',
    'recognition-rigor framework',
    'corporate strategy',
    'strategic memo',
    'cognitive bias auditing',
    'decision quality index',
    'decision knowledge graph',
    'board deck review',
    'M&A decision auditing',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Decision Intel',
    title: 'Decision Intel | The native reasoning layer for every boardroom strategic decision',
    description:
      'The native reasoning layer for every boardroom strategic decision. Audit the reasoning in every strategic memo. See the questions the board will ask. Compound your team\u2019s judgment, quarter after quarter.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel | The native reasoning layer for every boardroom strategic decision',
    description:
      'The native reasoning layer for every boardroom strategic decision. Audit the reasoning in every strategic memo. See the questions the board will ask. Compound your team\u2019s judgment.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastProvider } from '@/components/ui/EnhancedToast';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/ui/NotificationCenter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReducedMotionProvider } from '@/components/ReducedMotionProvider';
import { DensityProvider } from '@/components/DensityProvider';
import { WebVitalsReporter } from '@/components/monitoring/WebVitalsReporter';
import { cn } from '@/lib/utils';
import { assertEnvValid } from '@/lib/env';

// Validate required environment variables at startup (skip during next build)
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  assertEnvValid();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(fontClass)}>
      <body className="antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DensityProvider>
            <ReducedMotionProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <ToastProvider>
                    <WebVitalsReporter />
                    {children}
                    <Analytics />
                    <SpeedInsights />
                  </ToastProvider>
                </TooltipProvider>
              </NotificationProvider>
            </ReducedMotionProvider>
          </DensityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
