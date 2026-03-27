import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://decisionintel.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Decision Intel | Cognitive Bias Auditing Platform',
    template: '%s | Decision Intel',
  },
  description:
    'AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise, turning unstructured documents into actionable insights.',
  keywords: [
    'decision intelligence',
    'cognitive bias',
    'noise reduction',
    'AI analysis',
    'decision auditing',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Decision Intel',
    title: 'Decision Intel | Cognitive Bias Auditing Platform',
    description:
      'AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise.',
    url: siteUrl,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Decision Intel — Cognitive Bias Auditing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decision Intel | Cognitive Bias Auditing Platform',
    description:
      'AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

import { ToastProvider } from '@/components/ui/ToastContext';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/ui/NotificationCenter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReducedMotionProvider } from '@/components/ReducedMotionProvider';
import { DensityProvider } from '@/components/DensityProvider';
import { WebVitalsReporter } from '@/components/monitoring/WebVitalsReporter';
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans')}>
      <body className="antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
