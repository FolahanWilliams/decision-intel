'use client';

import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { CopilotPageContent } from '@/components/copilot/CopilotPageContent';

/**
 * Ask — Unified AI Surface
 *
 * Single "Ask" surface combining structured decision sessions (Copilot agents)
 * with document Q&A (pinned document RAG with source citations). Users see one
 * unified AI advisory team instead of two separate modes.
 *
 * Legacy routes (/dashboard/ai-assistant, /dashboard/chat,
 * /dashboard/copilot, ?mode=chat) all render this same surface.
 */

function AskSurfaceInner() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 44px)',
      }}
    >
      {/* Header — compact (sits above a scrolling chat surface) but now on
          the brand green palette instead of the previous blue/purple mix. */}
      <div
        style={{
          padding: '16px 24px 14px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(22, 163, 74, 0.10)',
              border: '1px solid rgba(22, 163, 74, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
              }}
            >
              Ask
            </h1>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '2px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              Your AI advisory team — structured decisions, document Q&amp;A, and source citations
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <CopilotPageContent />
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <ErrorBoundary sectionName="Ask">
      <Suspense fallback={<PageSkeleton />}>
        <AskSurfaceInner />
      </Suspense>
    </ErrorBoundary>
  );
}
