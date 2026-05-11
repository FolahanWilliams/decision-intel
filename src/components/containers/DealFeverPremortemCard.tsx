'use client';

/**
 * DealFeverPremortemCard — Kyle-Price-overlay Deal Fever pre-mortem
 * (N1 ship 2026-05-11).
 *
 * Mounted on /dashboard/decisions/[id] when container.kind ===
 * 'acquisition' AND there's at least one analyzed document. Fires the
 * 3-brutal-questions pre-mortem on user click (NOT auto on mount —
 * cost discipline + the act of clicking surfaces the "I'm consciously
 * inviting dissent" moment for the corp dev professional).
 *
 * Vocabulary discipline: this is NOT "the always-on red team" (banned
 * 2026-05-11). It's "the antagonist that costs no political capital"
 * per POSITIONING_POLITICAL_CAPITAL_LINE. The card eyebrow + body copy
 * reinforce that framing.
 */

import { useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  Swords,
  Loader2,
  AlertCircle,
  FileText,
  Target,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface PremortemQuestion {
  pattern: 'deal_fever' | 'winners_curse' | 'synergy_mirage';
  question: string;
  evidence: string;
  demand: string;
}

interface PremortemResponse {
  questions: PremortemQuestion[];
  anchorSource: string;
  generatedFor: string;
  generatedAt: string;
  fromCache?: boolean;
}

const PATTERN_LABELS: Record<PremortemQuestion['pattern'], string> = {
  deal_fever: 'Deal Fever / Escalation',
  winners_curse: "Winner's Curse",
  synergy_mirage: 'Synergy Mirage',
};

const PATTERN_ICONS: Record<PremortemQuestion['pattern'], typeof TrendingDown> = {
  deal_fever: TrendingDown,
  winners_curse: Target,
  synergy_mirage: Sparkles,
};

const PATTERN_COLORS: Record<PremortemQuestion['pattern'], string> = {
  deal_fever: 'var(--error)',
  winners_curse: 'var(--severity-high)',
  synergy_mirage: 'var(--warning)',
};

export interface DealFeverPremortemCardProps {
  containerId: string;
  containerName: string;
}

export function DealFeverPremortemCard({
  containerId,
  containerName,
}: DealFeverPremortemCardProps) {
  const [response, setResponse] = useState<PremortemResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fire = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decisions/${containerId}/deal-fever-premortem`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to run Deal Fever pre-mortem');
      }
      const data = (await res.json()) as PremortemResponse;
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run pre-mortem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccentCard
      accent="danger"
      title={
        <>
          <Swords size={16} style={{ color: 'var(--error)' }} />
          <span>Deal Fever pre-mortem — the antagonist that costs no political capital</span>
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
        Anchored on Kyle Price&rsquo;s observation (Roblox Head of Corp Dev, M&amp;A Science
        podcast): &ldquo;There&rsquo;s no cure for Deal Fever. The only countermeasure is a red team
        exercise &mdash; somebody pitches the case for why this is a horrible idea.&rdquo; Decision
        Intel runs that pitch FOR you, before the IC memo can hide what the deal sponsor
        doesn&rsquo;t want to see. Same dissent, zero political capital spent.
      </p>

      {!response && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Fires 3 brutal questions targeting the three deadliest M&amp;A failure patterns: Deal
            Fever / Escalation of Commitment, Winner&rsquo;s Curse, Synergy Mirage. Each question
            cites a specific claim in the memo and demands a number, mechanism, or named owner from
            the sponsor.
          </span>
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            margin: '0 0 12px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {!response && (
        <button
          type="button"
          onClick={fire}
          disabled={loading}
          style={{
            padding: '10px 16px',
            background: loading ? 'var(--bg-elevated)' : 'var(--error)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            color: loading ? 'var(--text-muted)' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
          {loading ? 'Running pre-mortem…' : `Run Deal Fever pre-mortem on ${containerName}`}
        </button>
      )}

      {response && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
              padding: '6px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <FileText size={12} />
            <span>
              Audited on <strong>{response.generatedFor}</strong>
              {response.fromCache ? ' · cached' : ''}
            </span>
          </div>
          {response.questions.map((q, i) => {
            const Icon = PATTERN_ICONS[q.pattern];
            const color = PATTERN_COLORS[q.pattern];
            return (
              <div
                key={i}
                style={{
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Icon size={14} style={{ color }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color,
                    }}
                  >
                    Q{i + 1} · {PATTERN_LABELS[q.pattern]}
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {q.question}
                </p>
                {q.evidence && (
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    Memo cited: &ldquo;
                    {q.evidence.length > 240 ? q.evidence.slice(0, 237) + '…' : q.evidence}
                    &rdquo;
                  </p>
                )}
                {q.demand && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: 'var(--text-secondary)' }}>
                      Sponsor must produce:
                    </strong>{' '}
                    {q.demand}
                  </p>
                )}
              </div>
            );
          })}
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            Anchor source: {response.anchorSource}. The pre-mortem caches for 24h — refresh by
            running it again tomorrow.
          </p>
        </div>
      )}
    </AccentCard>
  );
}
