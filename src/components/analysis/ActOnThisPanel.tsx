'use client';

import { useMemo, useState } from 'react';
import { Play, Sparkles, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { suggestPlaybooksForBiases, type PlaybookSuggestion } from '@/lib/playbooks/suggest';
import type { BiasInstance } from '@/types';

/**
 * Act-on-this panel (M6.2 — Bias Detective → Playbooks pipeline).
 *
 * Renders the top 1–3 playbook suggestions for an analysis's bias
 * fingerprint with a primary "Run this Playbook" CTA per suggestion.
 * Clicking the CTA posts to /api/playbooks/invoke, which creates a
 * PlaybookInvocation row and schedules a 48h follow-up nudge.
 *
 * All suggestion computation is client-side (pure function over the
 * biases already on the Analysis). No backend fetch to render this panel.
 */

interface ActOnThisPanelProps {
  analysisId: string;
  biases: Pick<BiasInstance, 'biasType' | 'severity' | 'confidence'>[];
  documentType?: string | null;
  industry?: string | null;
}

export function ActOnThisPanel({
  analysisId,
  biases,
  documentType,
  industry,
}: ActOnThisPanelProps) {
  const suggestions = useMemo(
    () => suggestPlaybooksForBiases(biases, { documentType, industry }, 3),
    [biases, documentType, industry]
  );

  // Invocation state keyed by suggestion id
  const [invoking, setInvoking] = useState<string | null>(null);
  const [invoked, setInvoked] = useState<Record<string, string>>({}); // suggestionId → invocationId
  const [error, setError] = useState<string | null>(null);

  if (suggestions.length === 0) {
    return null;
  }

  const handleRun = async (suggestion: PlaybookSuggestion) => {
    setInvoking(suggestion.id);
    setError(null);
    try {
      const res = await fetch('/api/playbooks/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbookId: suggestion.id,
          analysisId,
          matchedToxicCombo: suggestion.matchedToxicCombo,
          source: 'suggestion',
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { invocation: { id: string } };
      setInvoked(prev => ({ ...prev, [suggestion.id]: data.invocation.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run playbook');
    } finally {
      setInvoking(null);
    }
  };

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(139, 92, 246, 0.2)',
        background:
          'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
      }}
    >
      <div
        className="card-header"
        style={{
          borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
          padding: '12px var(--spacing-lg)',
        }}
      >
        <div className="flex items-center gap-sm">
          <Sparkles size={16} style={{ color: '#a78bfa' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Act on This</h3>
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginLeft: 4,
            }}
          >
            Playbooks matched to this bias fingerprint
          </span>
        </div>
      </div>

      <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {suggestions.map((s, i) => {
            const isInvoking = invoking === s.id;
            const invocationId = invoked[s.id];
            const isInvoked = !!invocationId;
            const isPrimary = i === 0;

            return (
              <div
                key={s.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: isPrimary ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: isPrimary
                    ? '1px solid rgba(139, 92, 246, 0.25)'
                    : '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-sm" style={{ marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {s.playbook.name}
                      </span>
                      {s.matchedToxicCombo && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <AlertTriangle size={9} />
                          {s.matchedToxicCombo}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginLeft: 'auto',
                        }}
                      >
                        {s.overlapCount} bias match{s.overlapCount === 1 ? '' : 'es'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {s.rationale}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-sm"
                  style={{ marginTop: 10, justifyContent: 'flex-end' }}
                >
                  {isInvoked ? (
                    <div
                      className="flex items-center gap-xs"
                      style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}
                    >
                      <CheckCircle2 size={12} />
                      Running — we&apos;ll check in 48h
                    </div>
                  ) : (
                    <>
                      <a
                        href={
                          s.id.startsWith('builtin_')
                            ? `/dashboard/playbooks?preview=${s.id}`
                            : `/dashboard/playbooks/${s.id}`
                        }
                        className="text-xs"
                        style={{
                          color: 'var(--text-muted)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        Preview
                        <ChevronRight size={11} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRun(s)}
                        disabled={isInvoking}
                        className={
                          isPrimary ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'
                        }
                        style={{
                          fontSize: 11,
                          padding: '4px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isInvoking ? (
                          <>
                            <Loader2 size={11} className="animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            Run this Playbook
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              fontSize: 11,
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
