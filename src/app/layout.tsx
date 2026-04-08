import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
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
    default: 'Decision Intel | Cognitive Bias Auditing Platform',
    template: '%s | Decision Intel',
  },
  description:
    'AI-powered decision performance platform that audits M&A deal theses and IC memos for cognitive bias and decision noise, protecting investment outcomes.',
  keywords: [
    'decision intelligence',
    'cognitive bias',
    'M&A due diligence',
    'investment committee',
    'PE bias detection',
    'decision auditing',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Decision Intel',
    title: 'Decision Intel | Cognitive Bias Auditing Platform',
    description:
      'AI-powered decision performance platform for M&A and investment teams. Audit deal theses for cognitive bias and noise.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel | Cognitive Bias Auditing Platform',
    description:
      'AI-powered decision performance platform for M&A and investment teams. Audit deal theses for cognitive bias and noise.',
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
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, 'font-sans')}>
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
