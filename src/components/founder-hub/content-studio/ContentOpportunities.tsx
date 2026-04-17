'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import type { ContentOpportunity } from '@/app/api/founder-hub/content/opportunities/route';

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: '#0A66C2',
  'Twitter/X': '#000000',
  Newsletter: '#7C3AED',
  Blog: '#16A34A',
  'Case Study': '#D97706',
};

interface ContentOpportunitiesProps {
  founderPass: string;
  onDraft: (contentType: string, topic: string) => void;
}

export function ContentOpportunities({ founderPass, onDraft }: ContentOpportunitiesProps) {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/content/opportunities', {
        headers: { 'x-founder-pass': founderPass },
      });
      if (!res.ok) throw new Error('Failed to fetch opportunities');
      const data = await res.json();
      setOpportunities(data.data ?? []);
      setScanned(true);
    } catch {
      setError('Could not generate ideas. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [founderPass]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 16,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Content Ideas
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
            AI-scanned opportunities based on your product
          </span>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            background: loading ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
            border: 'none',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : scanned ? (
            <RefreshCw size={12} />
          ) : (
            <Sparkles size={12} />
          )}
          {loading ? 'Scanning…' : scanned ? 'Refresh ideas' : 'Scan for ideas'}
        </button>
      </div>

      {/* Error */}
      {error && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>}

      {/* Empty state */}
      {!loading && !error && !scanned && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Click scan to get 5 specific content ideas based on your product capabilities and
          positioning.
        </p>
      )}

      {/* Opportunities list */}
      {scanned && opportunities.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opportunities.map(opp => {
            const color = PLATFORM_COLORS[opp.platform] ?? 'var(--accent-primary)';
            return (
              <div
                key={opp.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Platform badge + title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        color,
                        background: `${color}18`,
                        border: `1px solid ${color}30`,
                        borderRadius: 4,
                        padding: '2px 7px',
                        marginBottom: 5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {opp.platform}
                    </span>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {opp.title}
                    </p>
                  </div>
                  <button
                    onClick={() => onDraft(opp.contentType, opp.hook)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Draft this <ArrowRight size={11} />
                  </button>
                </div>

                {/* Angle */}
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {opp.angle}
                </p>

                {/* Hook preview */}
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    margin: 0,
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 6,
                  }}
                >
                  &ldquo;{opp.hook}&rdquo;
                </p>

                {/* Why now */}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>Why now: </span>
                  {opp.whyNow}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
