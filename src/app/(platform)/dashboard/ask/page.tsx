'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, MessageSquare } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { CopilotPageContent } from '@/components/copilot/CopilotPageContent';
import { ChatPageContent } from '@/components/chat/ChatPageContent';

/**
 * Ask — Unified AI Surface (M3.1)
 *
 * Replaces the previous /dashboard/ai-assistant tab page with a single
 * "Ask" surface that hosts both modes (Decision Copilot + Document Chat)
 * under one canonical URL and one shared chrome.
 *
 * Scope decision: the two underlying flows (CopilotPageContent /
 * ChatPageContent) have genuinely different backends, data models, and
 * interaction patterns. A full component merge would require migrating
 * both Prisma tables and risk losing user sessions. Instead, M3.1
 * unifies the CHROME (header, mode switcher, persistent context strip)
 * and delegates the body to the existing components. Users see one
 * surface; the two backends keep their session data intact.
 *
 * Legacy routes (/dashboard/ai-assistant, /dashboard/chat,
 * /dashboard/copilot) 307-redirect to /dashboard/ask via next.config.ts.
 */

type AskMode = 'copilot' | 'chat';

const MODE_META: Record<
  AskMode,
  { label: string; tagline: string; icon: typeof Sparkles }
> = {
  copilot: {
    label: 'Decision Copilot',
    tagline: 'Structured sessions — frame, challenge, resolve to a DQI score',
    icon: Sparkles,
  },
  chat: {
    label: 'Document Chat',
    tagline: 'Ask questions against a pinned document, with source citations',
    icon: MessageSquare,
  },
};

function AskSurfaceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get('mode');
  const mode: AskMode = raw === 'chat' ? 'chat' : 'copilot';
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  // Preserve any extra query params (e.g. ?prompt=... from command palette)
  // across mode switches so deep links still work.
  const switchMode = (next: AskMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', next);
    router.replace(`/dashboard/ask?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 44px)',
      }}
    >
      {/* Unified header — replaces the bare TabBar from the old
          /dashboard/ai-assistant. Single title, mode tagline, and
          pill-style mode switcher. */}
      <div
        style={{
          padding: '14px 20px 10px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          background:
            'linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
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
              <Icon size={18} style={{ color: '#a78bfa' }} />
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
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    marginLeft: 8,
                  }}
                >
                  · {meta.label}
                </span>
              </h1>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0',
                  lineHeight: 1.4,
                }}
              >
                {meta.tagline}
              </p>
            </div>
          </div>

          {/* Mode switcher — pill style. Distinct visual from the old
              TabBar so users notice the new surface. */}
          <div
            role="tablist"
            aria-label="Ask mode"
            style={{
              display: 'inline-flex',
              padding: 3,
              borderRadius: 999,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            {(Object.keys(MODE_META) as AskMode[]).map(m => {
              const isActive = m === mode;
              const MIcon = MODE_META[m].icon;
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchMode(m)}
                  style={{
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s',
                  }}
                >
                  <MIcon size={12} />
                  {MODE_META[m].label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Delegated body — the existing component trees stay intact.
          Zero session loss, zero backend changes. */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {mode === 'copilot' ? <CopilotPageContent /> : <ChatPageContent />}
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
