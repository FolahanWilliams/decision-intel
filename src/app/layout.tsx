import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Decision Intel | Cognitive Bias Auditing Platform',
  description:
    'AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise, turning unstructured documents into actionable insights.',
  keywords: [
    'decision intelligence',
    'cognitive bias',
    'noise reduction',
    'AI analysis',
    'decision auditing',
  ],
};

import { ToastProvider } from '@/components/ui/ToastContext';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/ui/NotificationCenter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          <NotificationProvider>
            <TooltipProvider>
              <ToastProvider>{children}</ToastProvider>
            </TooltipProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
