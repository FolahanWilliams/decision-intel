import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Intel | Cognitive Bias Auditing Platform",
  description: "AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise, turning unstructured documents into actionable insights.",
  keywords: ["decision intelligence", "cognitive bias", "noise reduction", "AI analysis", "decision auditing"],
};

import {
  ClerkProvider,
} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ToastProvider } from "@/components/ui/ToastContext";
import Sidebar from "@/components/ui/Sidebar";
import Ticker from "@/components/ui/Ticker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ff9f0a',
          colorBackground: '#050505',
          colorText: '#e0e0e0',
          colorInputBackground: '#111111',
          colorInputText: '#e0e0e0'
        }
      }}
    >
      <html lang="en">
        <body style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <ToastProvider>
            <Ticker />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Sidebar />
              <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                {children}
              </main>
            </div>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
