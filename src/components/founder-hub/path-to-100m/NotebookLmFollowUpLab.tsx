'use client';

import { useState } from 'react';
import { Copy, Check, BookOpen } from 'lucide-react';
import { NOTEBOOKLM_FOLLOW_UPS, type NotebookLmFollowUp } from './data';

const PRIORITY_COLOR: Record<NotebookLmFollowUp['priority'], string> = {
  now: '#DC2626',
  soon: '#D97706',
  later: '#0EA5E9',
};

const CATEGORY_LABEL: Record<NotebookLmFollowUp['category'], string> = {
  positioning: 'Positioning',
  investor: 'Investor',
  channel: 'Channel partnership',
  compliance: 'Compliance + procurement',
  failure_modes: 'Failure modes + competitive',
  gtm: 'GTM + sales',
};

export function NotebookLmFollowUpLab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (q: NotebookLmFollowUp) => {
    try {
      await navigator.clipboard.writeText(q.question);
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // clipboard rejection · acceptable per fire-and-forget exception (UI affordance only)
    }
  };

  const grouped = (['now', 'soon', 'later'] as const).map(p => ({
    priority: p,
    items: NOTEBOOKLM_FOLLOW_UPS.filter(q => q.priority === p),
  }));

  return (
    <div>
      <div
        style={{
          padding: 12,
          background: 'rgba(124,58,237,0.06)',
          border: '1px dashed rgba(124,58,237,0.30)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#7C3AED' }}>How to use:</strong> Click any question to copy. Paste
        into NotebookLM master KB ({' '}
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>
          notebook id 809f5104
        </span>{' '}
        per the saved reference). Run the query, harvest the synthesis, then update the
        corresponding section of <code style={{ fontSize: 11 }}>data.ts</code> in this same Founder
        Hub. The 10 questions below are scoped so each one returns directly-actionable synthesis
        within ~2 minutes of NotebookLM time.
      </div>

      {grouped.map(({ priority, items }) => {
        if (items.length === 0) return null;
        const accent = PRIORITY_COLOR[priority];
        return (
          <div key={priority} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: accent,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BookOpen size={12} /> Priority: {priority} · {items.length} questions
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(q => {
                const isCopied = copiedId === q.id;
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: 14,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${accent}`,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          {CATEGORY_LABEL[q.category]}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            lineHeight: 1.55,
                            fontStyle: 'italic',
                          }}
                        >
                          {q.question}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy(q)}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isCopied ? '#16A34A' : 'var(--border-color)'}`,
                          background: isCopied ? 'rgba(22,163,74,0.10)' : 'var(--bg-secondary)',
                          color: isCopied ? '#16A34A' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="nblm-grid" style={{ marginTop: 10 }}>
                      <div>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          Why ask
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          {q.whyAsk}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#16A34A',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 4,
                          }}
                        >
                          Expected output
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          {q.expectedOutput}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <style>{`
        .nblm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 700px) {
          .nblm-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
