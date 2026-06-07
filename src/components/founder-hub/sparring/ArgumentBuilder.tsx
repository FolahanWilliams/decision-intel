'use client';

import { useEffect, useMemo, useState } from 'react';
import { Swords, Sparkles, Loader2, Check, X, ChevronDown } from 'lucide-react';
import {
  ARGUMENT_CATEGORIES,
  ARGUMENT_PARTS,
  ARGUMENT_RUBRIC,
  argumentReadiness,
  type ArgumentCategory,
  type ArgumentInput,
  type ArgumentResult,
} from './argument-builder';

interface Props {
  founderPass?: string;
}

const HISTORY_KEY = 'di-argument-builder-history-v1';

interface HistoryEntry {
  at: number;
  category: ArgumentCategory;
  overall: number;
}

const EMPTY: ArgumentInput = { claim: '', evidence: '', counterargument: '', rebuttal: '' };

const VERDICT_TONE: Record<string, { color: string; label: string }> = {
  steelman: { color: 'var(--success)', label: 'Genuine steelman' },
  weak: { color: 'var(--warning)', label: 'Weak counter' },
  strawman: { color: 'var(--error)', label: 'Strawman' },
};

export function ArgumentBuilder({ founderPass }: Props) {
  const pass = founderPass ?? process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': pass }),
    [pass]
  );

  const [category, setCategory] = useState<ArgumentCategory>('investor_objection');
  const [input, setInput] = useState<ArgumentInput>(EMPTY);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<ArgumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {
      // canonical fire-and-forget — localStorage read
    }
  }, []);

  const readiness = argumentReadiness(input);

  function setPart(key: keyof ArgumentInput, value: string) {
    setInput(prev => ({ ...prev, [key]: value }));
  }

  async function generateClaim() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/argument-builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', category }),
      });
      const body = await res.json().catch(() => null);
      if (body?.claim) setInput(prev => ({ ...prev, claim: body.claim }));
      else setError('Could not generate a claim — type your own.');
    } catch {
      setError('Network error generating a claim.');
    } finally {
      setGenerating(false);
    }
  }

  async function grade() {
    if (!readiness.complete) return;
    setGrading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/founder-hub/argument-builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'grade', category, input }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || body.error) {
        setError(body?.error || 'Could not grade — try again.');
        return;
      }
      const r = body as ArgumentResult;
      setResult(r);
      setShowModel(false);
      if (r.overall > 0) {
        const next = [{ at: Date.now(), category, overall: r.overall }, ...history].slice(0, 30);
        setHistory(next);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // canonical fire-and-forget — localStorage write
        }
      }
    } catch {
      setError('Network error grading the argument.');
    } finally {
      setGrading(false);
    }
  }

  function reset() {
    setInput(EMPTY);
    setResult(null);
    setError(null);
    setShowModel(false);
  }

  const recent = history.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Swords size={16} style={{ color: 'var(--accent-primary)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Argument Builder</strong>
          {recent.length > 0 && (
            <span
              style={{ marginLeft: 'auto', fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}
            >
              last {recent.length}:{' '}
              {recent
                .map(h => h.overall)
                .reverse()
                .join(' → ')}
            </span>
          )}
        </div>
        <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          State a claim, evidence it, <strong>steelman</strong> the best objection, then rebut it.
          The drill that wins investor-Q&amp;A: the grader is hardest on a weak counterargument.
        </p>

        {/* category */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {ARGUMENT_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id);
                setResult(null);
              }}
              title={c.blurb}
              style={category === c.id ? chipActive : chip}
            >
              {c.label}
            </button>
          ))}
        </div>

        {category !== 'bring_your_own' && (
          <button
            onClick={generateClaim}
            disabled={generating}
            style={{ ...secondaryBtn, marginBottom: 10 }}
          >
            {generating ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating…' : 'Generate a claim to defend'}
          </button>
        )}

        {/* 4-part scaffold */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ARGUMENT_PARTS.map(part => (
            <label key={part.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{ fontSize: 'var(--fs-2xs)', fontWeight: 600, color: 'var(--text-primary)' }}
              >
                {part.label}
              </span>
              <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
                {part.hint}
              </span>
              <textarea
                value={input[part.key]}
                onChange={e => setPart(part.key, e.target.value)}
                rows={part.key === 'claim' ? 2 : 3}
                style={textarea}
              />
            </label>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--error)', margin: '8px 0 0' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button onClick={grade} disabled={grading || !readiness.complete} style={primaryBtn}>
            {grading ? <Loader2 size={14} className="spin" /> : <Swords size={14} />}
            {grading ? 'Grading…' : 'Grade my argument'}
          </button>
          {!readiness.complete && (
            <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
              Fill all four parts ({readiness.missing.length} left).
            </span>
          )}
          {result && (
            <button onClick={reset} style={secondaryBtn}>
              New argument
            </button>
          )}
        </div>
      </div>

      {result && (
        <div style={{ ...card, borderTop: '3px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)' }}>
              {result.overall}
            </span>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>/ 100</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--fs-3xs)',
                fontWeight: 600,
                color: VERDICT_TONE[result.steelmanVerdict]?.color ?? 'var(--text-muted)',
                border: `1px solid ${VERDICT_TONE[result.steelmanVerdict]?.color ?? 'var(--border-color)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '2px 10px',
              }}
            >
              {VERDICT_TONE[result.steelmanVerdict]?.label ?? result.steelmanVerdict}
            </span>
          </div>

          {result.steelmanNote && (
            <p
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-secondary)',
                margin: '0 0 12px',
              }}
            >
              {result.steelmanNote}
            </p>
          )}

          {/* sub-scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {ARGUMENT_RUBRIC.map(dim => {
              const v = result.subScores[dim.key] ?? 0;
              return (
                <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 120,
                      fontSize: 'var(--fs-3xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {dim.label}
                  </span>
                  <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div
                        key={n}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: n <= v ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      width: 24,
                      textAlign: 'right',
                      fontSize: 'var(--fs-3xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {v}/5
                  </span>
                </div>
              );
            })}
          </div>

          {result.strengths.length > 0 && (
            <ResultList
              icon="check"
              title="What landed"
              items={result.strengths}
              color="var(--success)"
            />
          )}
          {result.improvements.length > 0 && (
            <ResultList
              icon="x"
              title="Sharpen"
              items={result.improvements}
              color="var(--warning)"
            />
          )}

          {result.modelAnswer && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowModel(s => !s)} style={secondaryBtn}>
                <ChevronDown
                  size={13}
                  style={{
                    transform: showModel ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
                {showModel ? 'Hide expert version' : 'See the expert version'}
              </button>
              {showModel && (
                <p
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    marginTop: 8,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {result.modelAnswer}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: di-ab-spin 0.9s linear infinite;
        }
        @keyframes di-ab-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function ResultList({
  icon,
  title,
  items,
  color,
}: {
  icon: 'check' | 'x';
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 'var(--fs-3xs)', fontWeight: 600, color, marginBottom: 3 }}>
        {title}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: 6,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-secondary)',
            }}
          >
            {icon === 'check' ? (
              <Check size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
            ) : (
              <X size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
            )}
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const textarea: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  lineHeight: 1.5,
  resize: 'vertical',
  fontFamily: 'inherit',
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
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
  gap: 6,
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
const chip: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-2xs)',
  cursor: 'pointer',
};
const chipActive: React.CSSProperties = {
  ...chip,
  background: 'var(--accent-primary)',
  color: '#fff',
  borderColor: 'var(--accent-primary)',
};
