'use client';

import { useEffect, useState } from 'react';
import {
  Sword,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';

/**
 * Dr. Red Team card (M7.3 — user-invoked adversarial challenge).
 *
 * Renders on the analysis detail page below Act-on-this. Before the user
 * clicks, the card is a small invitation: "Get the dissent that nobody
 * in the room wants to deliver." After the user clicks "Challenge this
 * decision", it streams a structured Red Team response inline with:
 *   - Target claim (the single load-bearing assumption attacked)
 *   - Primary objection (2-3 sentences)
 *   - Secondary objections (1-2 each)
 *   - Structural questions the group must answer
 *   - Closing line (the one-sentence mic drop)
 * Plus thumbs up/down for feedback + prior-challenge history expander.
 *
 * The card intentionally does NOT auto-fire — part of the persona is
 * that the user actively requests the challenge, which creates a
 * psychological commitment to engage with it.
 */

interface RedTeamChallenge {
  id: string;
  targetClaim: string;
  primaryObjection: string;
  secondaryObjections: string[];
  structuralQuestions: string[];
  closingLine: string;
  usefulRating: number | null;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DrRedTeamCard({ analysisId }: { analysisId: string }) {
  const [history, setHistory] = useState<RedTeamChallenge[] | null>(null);
  const [current, setCurrent] = useState<RedTeamChallenge | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [ratingInFlight, setRatingInFlight] = useState<string | null>(null);

  // Load prior challenges on mount — if the user has asked Dr. Red Team
  // before, pre-populate the most recent challenge so they can re-read.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/red-team/challenge?analysisId=${analysisId}`);
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { challenges: RedTeamChallenge[] };
        if (cancelled) return;
        setHistory(data.challenges || []);
        if (data.challenges && data.challenges.length > 0) {
          setCurrent(data.challenges[0]);
        }
      } catch {
        // Silently ignore — the UI defaults to the pre-invocation state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  const handleChallenge = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/red-team/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      });

      if (res.status === 429) {
        setError('Rate limit reached — Dr. Red Team is tired. Try again in an hour.');
        return;
      }
      if (res.status === 503) {
        setError('Dr. Red Team is unavailable right now. The underlying model returned an error.');
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || `Request failed: ${res.status}`);
        return;
      }

      const data = (await res.json()) as { challenge: RedTeamChallenge };
      setCurrent(data.challenge);
      setHistory(prev => (prev ? [data.challenge, ...prev] : [data.challenge]));
    } catch {
      setError('Network error reaching Dr. Red Team.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRate = async (rating: -1 | 1) => {
    if (!current) return;
    setRatingInFlight(current.id);
    try {
      const res = await fetch(`/api/red-team/challenge/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usefulRating: current.usefulRating === rating ? 0 : rating,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { challenge: RedTeamChallenge };
        setCurrent(data.challenge);
        setHistory(prev =>
          prev ? prev.map(c => (c.id === data.challenge.id ? data.challenge : c)) : prev
        );
      }
    } finally {
      setRatingInFlight(null);
    }
  };

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(239, 68, 68, 0.25)',
        background:
          'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(120, 20, 20, 0.02) 100%)',
      }}
    >
      {/* Persona header */}
      <div
        className="card-header"
        style={{
          borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          padding: '12px var(--spacing-lg)',
        }}
      >
        <div className="flex items-center gap-sm">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sword size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Dr. Red Team</h3>
            <p
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              The dissent without the social cost. No ego, no relationships at stake.
            </p>
          </div>
          {history && history.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory(v => !v)}
              className="text-xs"
              style={{
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {history.length} prior challenge{history.length === 1 ? '' : 's'}
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
        {/* Pre-invocation state */}
        {!current && !generating && (
          <div style={{ textAlign: 'center', padding: '12px 8px' }}>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              Every senior partner has an objection they don&apos;t raise because the room would
              resent it. Dr. Red Team is the partner who doesn&apos;t care.
            </p>
            <button
              type="button"
              onClick={handleChallenge}
              disabled={generating}
              className="btn btn-primary btn-sm"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                background: '#dc2626',
                borderColor: '#dc2626',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sword size={12} />
              Challenge This Decision
            </button>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '20px 8px',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontStyle: 'italic',
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            Dr. Red Team is reading the decision&hellip;
          </div>
        )}

        {/* Error state */}
        {error && !generating && (
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 6,
              color: '#fca5a5',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {/* Rendered challenge */}
        {current && !generating && (
          <ChallengeContent
            challenge={current}
            rating={current.usefulRating}
            onRate={handleRate}
            isRating={ratingInFlight === current.id}
            onRechallenge={handleChallenge}
          />
        )}

        {/* Prior challenges accordion */}
        {showHistory && history && history.length > 1 && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Prior Challenges
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.slice(1).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCurrent(c)}
                  style={{
                    textAlign: 'left',
                    background:
                      current?.id === c.id
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: 8,
                    cursor: 'pointer',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div
                    className="flex items-center gap-xs"
                    style={{ marginBottom: 2, color: 'var(--text-muted)', fontSize: 9 }}
                  >
                    <Clock size={9} />
                    {relativeTime(c.createdAt)}
                  </div>
                  <div
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {c.targetClaim}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeContent({
  challenge,
  rating,
  onRate,
  isRating,
  onRechallenge,
}: {
  challenge: RedTeamChallenge;
  rating: number | null;
  onRate: (r: -1 | 1) => void;
  isRating: boolean;
  onRechallenge: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Target claim quote */}
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#f87171',
            marginBottom: 4,
          }}
        >
          Target Claim
        </div>
        <blockquote
          style={{
            margin: 0,
            padding: '8px 12px',
            borderLeft: '3px solid #dc2626',
            background: 'rgba(239, 68, 68, 0.04)',
            borderRadius: '0 4px 4px 0',
            fontSize: 12,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          &ldquo;{challenge.targetClaim}&rdquo;
        </blockquote>
      </div>

      {/* Primary objection */}
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#f87171',
            marginBottom: 4,
          }}
        >
          Primary Objection
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}
        >
          {challenge.primaryObjection}
        </div>
      </div>

      {/* Secondary objections */}
      {challenge.secondaryObjections.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#f87171',
              marginBottom: 4,
            }}
          >
            Also Consider
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {challenge.secondaryObjections.map((obj, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structural questions */}
      {challenge.structuralQuestions.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#f87171',
              marginBottom: 4,
            }}
          >
            Questions The Room Must Answer
          </div>
          <ol
            style={{
              margin: 0,
              paddingLeft: 16,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {challenge.structuralQuestions.map((q, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Closing line */}
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(120, 20, 20, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#fca5a5',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        &mdash; {challenge.closingLine}
      </div>

      {/* Feedback + rechallenge row */}
      <div
        className="flex items-center gap-sm"
        style={{
          paddingTop: 10,
          borderTop: '1px solid rgba(239, 68, 68, 0.12)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Was this useful?</span>
        <button
          type="button"
          onClick={() => onRate(1)}
          disabled={isRating}
          aria-label="Mark as useful"
          style={{
            border: '1px solid',
            borderColor: rating === 1 ? '#22c55e' : 'var(--border-color)',
            background: rating === 1 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
            color: rating === 1 ? '#4ade80' : 'var(--text-muted)',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: isRating ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
          }}
        >
          <ThumbsUp size={11} />
          Useful
        </button>
        <button
          type="button"
          onClick={() => onRate(-1)}
          disabled={isRating}
          aria-label="Mark as not useful"
          style={{
            border: '1px solid',
            borderColor: rating === -1 ? '#ef4444' : 'var(--border-color)',
            background: rating === -1 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: rating === -1 ? '#fca5a5' : 'var(--text-muted)',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: isRating ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
          }}
        >
          <ThumbsDown size={11} />
          Not useful
        </button>
        {rating === 1 && (
          <span
            className="flex items-center gap-xs"
            style={{ fontSize: 10, color: '#4ade80', fontStyle: 'italic' }}
          >
            <CheckCircle2 size={10} />
            Noted
          </span>
        )}
        <button
          type="button"
          onClick={onRechallenge}
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: '#dc2626',
            background: 'transparent',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Sword size={10} />
          Challenge Again
        </button>
      </div>
    </div>
  );
}
