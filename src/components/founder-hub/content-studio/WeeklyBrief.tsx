'use client';

import { useState, useCallback } from 'react';
import { Calendar, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import type { PostBrief } from '@/app/api/founder-hub/content/weekly-brief/route';

const PILLAR_COLORS: Record<string, string> = {
  decision_science: '#7C3AED',
  founder_journey: '#0A66C2',
  enterprise_ai: '#16A34A',
  market_insight: '#D97706',
  social_proof: '#0891B2',
};

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: '#0A66C2',
  'Twitter/X': '#000000',
  Newsletter: '#7C3AED',
  Blog: '#16A34A',
};

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface WeeklyBriefProps {
  founderPass: string;
  onDraft: (contentType: string, topic: string) => void;
}

export function WeeklyBrief({ founderPass, onDraft }: WeeklyBriefProps) {
  const [briefs, setBriefs] = useState<PostBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/content/weekly-brief', {
        headers: { 'x-founder-pass': founderPass },
      });
      if (!res.ok) throw new Error('Failed to generate brief');
      const json = await res.json();
      // Sort by canonical day order
      const sorted = (json.data?.briefs ?? []).sort(
        (a: PostBrief, b: PostBrief) =>
          DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
      );
      setBriefs(sorted);
      setGenerated(true);
    } catch {
      setError('Could not generate the brief. Check your connection and try again.');
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Weekly Content Brief
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
            5 posts · 5 pillars · ready to draft
          </span>
        </div>
        <button
          onClick={generate}
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
          ) : generated ? (
            <RefreshCw size={12} />
          ) : (
            <Calendar size={12} />
          )}
          {loading ? 'Generating...' : generated ? 'Regenerate week' : "Plan this week's posts"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && !generated && (
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Generate a full week of content — one post per brand pillar, ready to draft and post.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'decision_science', label: 'Decision Science' },
              { key: 'founder_journey', label: 'Founder Journey' },
              { key: 'enterprise_ai', label: 'Enterprise AI' },
              { key: 'market_insight', label: 'Market Insights' },
              { key: 'social_proof', label: 'Social Proof' },
            ].map(p => (
              <span
                key={p.key}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  color: PILLAR_COLORS[p.key],
                  background: `${PILLAR_COLORS[p.key]}15`,
                  border: `1px solid ${PILLAR_COLORS[p.key]}30`,
                }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brief cards */}
      {generated && briefs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {briefs.map(brief => {
            const pillarColor = PILLAR_COLORS[brief.pillar] ?? 'var(--accent-primary)';
            const platformColor = PLATFORM_COLORS[brief.platform] ?? 'var(--accent-primary)';
            return (
              <div
                key={brief.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${pillarColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}
              >
                {/* Day + badges row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {brief.day}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: pillarColor,
                      background: `${pillarColor}15`,
                      border: `1px solid ${pillarColor}30`,
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}>
                      {brief.pillarLabel}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: platformColor,
                      background: `${platformColor}15`,
                      border: `1px solid ${platformColor}30`,
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}>
                      {brief.platform}
                    </span>
                  </div>
                  <button
                    onClick={() => onDraft(brief.contentType, brief.hook)}
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
                    }}
                  >
                    Draft this <ArrowRight size={11} />
                  </button>
                </div>

                {/* Headline */}
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {brief.headline}
                </p>

                {/* Angle */}
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {brief.angle}
                </p>

                {/* Hook */}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 8px 0', borderTop: '1px solid var(--border-color)', paddingTop: 8, lineHeight: 1.5 }}>
                  &ldquo;{brief.hook}&rdquo;
                </p>

                {/* Key points */}
                <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
                  {brief.keyPoints.map((pt, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.45 }}>
                      {pt}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {brief.cta && (
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                    <span style={{ fontWeight: 700 }}>CTA: </span>{brief.cta}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
