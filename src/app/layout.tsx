import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

// Editorial serif used on marketing H1/H2 only. One font, Regular + Italic.
// Registers as `--font-display` — applied via the .marketing-display utility
// (see globals.css) or inline `fontFamily: 'var(--font-display)'`. Inter
// stays the workhorse for body + every platform surface so the app does not
// shift under users' feet.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Decision Intel | Decision Intelligence for Corporate Strategy',
    template: '%s | Decision Intel',
  },
  description:
    'Audit the reasoning in every strategic memo, predict steering-committee objections before the meeting, and turn every high-stakes call your team makes into a living Decision Knowledge Graph.',
  keywords: [
    'decision intelligence',
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
    title: 'Decision Intel | Decision Intelligence for Corporate Strategy',
    description:
      'Audit the reasoning in every strategic memo. See the questions the board will ask. Compound your team\u2019s judgment, quarter over quarter.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel | Decision Intelligence for Corporate Strategy',
    description:
      'Audit the reasoning in every strategic memo. See the questions the board will ask. Compound your team\u2019s judgment.',
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
    <html
      lang="en"
      className={cn(
        inter.variable,
        instrumentSerif.variable,
        jetbrainsMono.variable,
        'font-sans'
      )}
    >
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
