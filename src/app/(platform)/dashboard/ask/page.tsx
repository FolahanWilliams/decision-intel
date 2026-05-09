'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { CopilotPageContent } from '@/components/copilot/CopilotPageContent';

/**
 * AI Copilot — chat-first decision surface.
 *
 * Phase E refactor 2026-05-09 evening: dropped the slogan-style
 * "Your AI advisory team" header + dual-CTA empty state. The page is
 * now an IDE-style chat panel — no header chrome, no intermediate
 * prompt-input mode. The CopilotPageContent owns its own header strip
 * (sits inside the layout so the sidebar list + chat shell render with
 * a single source of header truth, not two stacked headers).
 *
 * Legacy routes (/dashboard/ai-assistant, /dashboard/chat,
 * /dashboard/copilot) all redirect here via next.config.ts.
 */
export default function AskPage() {
  return (
    <ErrorBoundary sectionName="AI Copilot">
      <Suspense fallback={<PageSkeleton />}>
        <div
          style={{
            height: 'calc(100vh - 44px)',
            overflow: 'hidden',
          }}
        >
          <CopilotPageContent />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
