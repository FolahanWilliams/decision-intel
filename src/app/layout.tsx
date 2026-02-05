import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Intel | Cognitive Bias Auditing Platform",
  description: "AI-powered decision intelligence platform that audits organizational decisions for cognitive bias and noise, turning unstructured documents into actionable insights.",
  keywords: ["decision intelligence", "cognitive bias", "noise reduction", "AI analysis", "decision auditing"],
};

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ToastProvider } from "@/components/ui/ToastContext";

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
        <body className="antialiased min-h-screen">
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
