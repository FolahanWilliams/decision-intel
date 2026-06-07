'use client';

import { useMemo, useState } from 'react';
import { Brain, Sparkles, Archive } from 'lucide-react';
import { SAT_SKILL_BY_ID, SAT_REVIEW_DAILY_TARGET } from './sat-content';
import { isDueForReview } from './sat-calibration';
import type { SatErrorEntry } from './sat-types';

interface Props {
  headers: Record<string, string>;
  errors: SatErrorEntry[];
  onChanged: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const QUALITY = [
  { q: 1, label: 'Again', tone: 'var(--error)' },
  { q: 3, label: 'Hard', tone: 'var(--warning)' },
  { q: 4, label: 'Good', tone: 'var(--info)' },
  { q: 5, label: 'Easy', tone: 'var(--success)' },
];

export function SatReview({ headers, errors, onChanged }: Props) {
  const due = useMemo(
    () => errors.filter(e => isDueForReview(e)).slice(0, SAT_REVIEW_DAILY_TARGET),
    [errors]
  );
  const card = due[0] ?? null;

  const [revealed, setRevealed] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setRevealed(false);
    setExplanation(null);
    setExplaining(false);
  }

  async function grade(q: number) {
    if (!card) return;
    setBusy(true);
    await fetch('/api/founder-os/sat/error-log', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: card.id, reviewQuality: q }),
    }).catch(() => {
      /* best-effort; reconciled on refetch */
    });
    reset();
    setBusy(false);
    onChanged();
  }

  async function retire() {
    if (!card) return;
    setBusy(true);
    await fetch('/api/founder-os/sat/error-log', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: card.id, reviewArchived: true }),
    }).catch(() => {
      /* best-effort */
    });
    reset();
    setBusy(false);
    onChanged();
  }

  async function explain() {
    if (!card) return;
    setExplaining(true);
    try {
      const res = await fetch('/api/founder-os/sat/explain', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: card.id }),
      });
      const body = await res.json().catch(() => null);
      setExplanation(body?.data?.explanation ?? 'Could not generate an explanation.');
    } catch {
      setExplanation('Could not generate an explanation.');
    } finally {
      setExplaining(false);
    }
  }

  if (!card) {
    return (
      <div style={{ ...cardStyle, borderTop: '3px solid var(--success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Brain size={16} style={{ color: 'var(--success)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Nothing due for review</strong>
        </div>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Every miss you log becomes a spaced-review card here — recall the concept before the
          answer shows (retrieval beats re-reading). Log some misses in Daily Training or the Test
          Log, and they&rsquo;ll surface here on the right schedule.
        </p>
      </div>
    );
  }

  const skillLabel = SAT_SKILL_BY_ID[card.skill]?.label ?? card.skill;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...cardStyle, borderTop: '3px solid var(--accent-primary)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{due.length} due for review</strong>
          </div>
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
            {card.totalReviews} prior {card.totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
          {skillLabel}
        </div>
        <p style={{ fontSize: 'var(--fs-md)', color: 'var(--text-primary)', margin: '0 0 12px' }}>
          Recall the concept + the trap on this one before you reveal it.
        </p>

        {!revealed ? (
          <button onClick={() => setRevealed(true)} style={primaryBtn}>
            Reveal what I logged
          </button>
        ) : (
          <>
            {card.note ? (
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  margin: '0 0 10px',
                }}
              >
                {card.note}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-muted)',
                  margin: '0 0 10px',
                }}
              >
                (No question text logged — recall the skill generally.)
              </p>
            )}

            {explanation ? (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {explanation}
                </p>
              </div>
            ) : (
              <button
                onClick={explain}
                disabled={explaining}
                style={{ ...secondaryBtn, marginBottom: 10 }}
              >
                <Sparkles size={13} /> {explaining ? 'Thinking…' : 'Explain this miss'}
              </button>
            )}

            <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
              How well did you recall it?
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUALITY.map(x => (
                <button
                  key={x.q}
                  onClick={() => grade(x.q)}
                  disabled={busy}
                  style={{ ...secondaryBtn, borderColor: x.tone, color: x.tone }}
                >
                  {x.label}
                </button>
              ))}
              <button
                onClick={retire}
                disabled={busy}
                style={{ ...secondaryBtn, marginLeft: 'auto' }}
                title="Retire from review"
              >
                <Archive size={13} /> Retire
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--accent-primary)',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
