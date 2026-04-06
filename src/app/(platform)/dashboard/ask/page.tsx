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
      {/* Header */}
      <div
        style={{
          padding: '14px 20px 10px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background:
                'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Ask
            </h1>
            <p
              style={{
                fontSize: 11,
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
