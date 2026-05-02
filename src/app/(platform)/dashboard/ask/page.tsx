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
      {/* Header — compact (sits above a scrolling chat surface) on the
          brand green palette. INTENTIONALLY DEVIATES from the platform
          .page-header / .text-gradient / .page-subtitle pattern because
          the chat area below needs every vertical pixel — a 28-40px H1
          plus page-subtitle would compress the conversation surface. If
          a future sweep flags this as drift, it's not: the surface is an
          always-open chat, not a canvas. Treat /ask like an IDE chat
          panel, not like /dashboard/analytics. */}
      <div
        style={{
          padding: '20px 32px 18px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              AI Copilot
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
                fontSize: 'clamp(22px, 2.4vw, 28px)',
                fontWeight: 400,
                lineHeight: 1.15,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
              }}
            >
              Your AI advisory team.
            </h1>
            <p
              style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              Structured decisions · document Q&amp;A · source citations
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
