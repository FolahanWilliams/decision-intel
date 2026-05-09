'use client';

import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { CopilotPageContent } from '@/components/copilot/CopilotPageContent';

/**
 * AI Copilot — Your AI advisory team.
 *
 * Composer-first chat surface. The Phase E sweep (2026-05-09 evening)
 * removed the dual-CTA pattern + the intermediate prompt-input mode.
 * The "Your AI advisory team" header was restored 2026-05-09 evening
 * follow-up because it grounds the surface — the founder's framing of
 * what these agents ARE — but the buttons + card layout below were
 * rebuilt for visual clarity (top color accents, fixed-width session
 * rail, ungrouped picker cards).
 */
export default function AskPage() {
  return (
    <ErrorBoundary sectionName="AI Copilot">
      <Suspense fallback={<PageSkeleton />}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 44px)',
            overflow: 'hidden',
          }}
        >
          {/* Page header — Sparkles eyebrow + display H1 + capability
              line. INTENTIONALLY DEVIATES from the platform .page-header
              token because the chat panel below needs vertical pixels —
              treat /ask like an IDE chat surface, not /dashboard/analytics. */}
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
                  Structured decisions · document Q&amp;A with citations · cross-portfolio pattern
                  recall.
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <CopilotPageContent />
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
