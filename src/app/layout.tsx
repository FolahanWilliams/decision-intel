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
import { ThemeProvider } from "@/components/theme-provider";

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
          colorPrimary: '#f59e0b',
          colorBackground: '#10101c',
          colorText: '#e2e8f0',
          colorInputBackground: '#161625',
          colorInputText: '#e2e8f0',
          borderRadius: '12px',
        }
      }}
    >
      <html lang="en">
        <body className="antialiased min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
