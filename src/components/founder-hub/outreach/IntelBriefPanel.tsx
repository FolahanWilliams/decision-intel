'use client';

/**
 * IntelBriefPanel — the nightly corp-dev / M&A Outreach Intelligence
 * Brief, rendered at the top of the Outreach Hub Pipeline section.
 *
 * Read-only. The brief is written by /api/cron/outreach-intel and read
 * here via /api/founder-hub/outreach/intel-brief. Founder-facing intel
 * to anchor the week's 5-10 personalised DMs — NOT an autonomous
 * outbound surface. Every signal is pattern-level (no named-person
 * accusation) so it stays ego-safe when it later seeds the 1-pager.
 */

import { useCallback, useEffect, useState } from 'react';
import { Radar, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';

interface IntelItem {
  headline: string;
  whyItMatters: string;
  sector: string;
  biasAngle: string;
  sourceTitle: string;
  sourceLink: string;
}

interface BriefData {
  briefDate: string;
  summary: string;
  items: IntelItem[];
  articleCount: number;
  generatedAt: string;
}

interface Props {
  founderPass: string;
}

export function IntelBriefPanel({ founderPass }: Props) {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/outreach/intel-brief', {
        headers: { 'x-founder-pass': founderPass },
      });
      const json = await res.json().catch(() => null); // req body parse — canonical fire-and-forget exception
      if (!res.ok) throw new Error(json?.error || 'Failed to load the intel brief');
      setBrief((json?.data as BriefData | null) ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the intel brief');
    } finally {
      setLoading(false);
    }
  }, [founderPass]);

  useEffect(() => {
    if (founderPass) load();
  }, [founderPass, load]);

  return (
    <AccentCard
      accent="info"
      style={{ marginBottom: 16 }}
      title={
        <>
          <Radar size={16} style={{ color: 'var(--accent-secondary, #6366f1)' }} />
          <span>Corp-dev / M&amp;A intel — last night&rsquo;s scan</span>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh intel brief"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              fontSize: 'var(--fs-2xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : undefined} />
            Refresh
          </button>
        </>
      }
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}
      >
        The week&rsquo;s anchor for personalised 1:1 outreach. Pattern-level signal only — pair it
        with a public case in the prospect&rsquo;s sector when you reach out; never their own deal.
      </p>

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 0',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-muted)',
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          Loading the latest brief…
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--error)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && !brief && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)',
            background: 'var(--bg-secondary)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          The nightly scan runs after the intelligence sync each day. The first corp-dev / M&amp;A
          brief lands here tomorrow morning.
        </div>
      )}

      {!loading && !error && brief && (
        <div>
          <div
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: brief.items.length > 0 ? 12 : 0,
            }}
          >
            {brief.summary}
          </div>

          {brief.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {brief.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderLeft: '3px solid var(--accent-secondary, #6366f1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--accent-secondary, #6366f1)',
                        background: 'rgba(99, 102, 241, 0.10)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.sector}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.headline}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.whyItMatters}
                  </p>
                  {item.biasAngle && (
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}
                    >
                      Pattern lens: {item.biasAngle}
                    </p>
                  )}
                  {item.sourceLink && (
                    <a
                      href={item.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--accent-secondary, #6366f1)',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={11} />
                      {item.sourceTitle}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              fontSize: 'var(--fs-3xs)',
              color: 'var(--text-muted)',
            }}
          >
            Brief {brief.briefDate} · {brief.articleCount} corp-dev / M&amp;A items scanned
          </div>
        </div>
      )}
    </AccentCard>
  );
}
