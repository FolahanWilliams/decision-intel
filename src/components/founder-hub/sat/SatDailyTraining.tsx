'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Check, X, Target } from 'lucide-react';
import {
  SAT_SECTIONS,
  SAT_CONFIDENCE_LEVELS,
  SAT_ROOT_CAUSES,
  SAT_SKILL_BY_ID,
  skillsForSection,
  type SatSection,
} from './sat-content';
import { computeWeakAreas } from './sat-calibration';
import type { SatErrorEntry, SatSession, SatVocab, DrillQuestion } from './sat-types';

interface Props {
  headers: Record<string, string>;
  today: string;
  errors: SatErrorEntry[];
  sessions: SatSession[];
  dueVocab: SatVocab[];
  onChanged: () => void;
}

interface AnswerState {
  confidence: number | null;
  picked: number | null;
  entryId: string | null;
  rootCause: string | null;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};

export function SatDailyTraining({ headers, today, errors, sessions, dueVocab, onChanged }: Props) {
  const weakAreas = useMemo(() => computeWeakAreas(errors, 5), [errors]);
  const todaySession = sessions.find(s => s.date === today);

  const [section, setSection] = useState<SatSection>('math');
  const defaultSkill = useMemo(() => {
    const weakInSection = weakAreas.find(w => SAT_SKILL_BY_ID[w.skill]?.section === section);
    return weakInSection?.skill ?? skillsForSection(section)[0]?.id ?? '';
  }, [weakAreas, section]);
  const [skill, setSkill] = useState<string>('');
  const activeSkill = skill || defaultSkill;

  const [questions, setQuestions] = useState<DrillQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [loadingGen, setLoadingGen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoadingGen(true);
    setErr(null);
    setQuestions(null);
    setAnswers({});
    try {
      const res = await fetch('/api/founder-os/sat/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind: 'drill',
          section,
          skill: activeSkill,
          skillLabel: SAT_SKILL_BY_ID[activeSkill]?.label ?? 'general practice',
          count: 3,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data?.questions) {
        throw new Error(body?.error || 'Generation failed');
      }
      setQuestions(body.data.questions as DrillQuestion[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoadingGen(false);
    }
  }

  function setConfidence(i: number, c: number) {
    setAnswers(a => ({ ...a, [i]: { ...(a[i] ?? blankAnswer()), confidence: c } }));
  }

  async function pick(i: number, choiceIdx: number, q: DrillQuestion) {
    const cur = answers[i] ?? blankAnswer();
    if (cur.picked !== null || cur.confidence === null) return; // need confidence first; one pick
    const wasCorrect = choiceIdx === q.correctIndex;
    setAnswers(a => ({ ...a, [i]: { ...cur, picked: choiceIdx } }));

    // Log the attempt (calibration substrate) + increment the session.
    let entryId: string | null = null;
    try {
      const logRes = await fetch('/api/founder-os/sat/error-log', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          section,
          skill: activeSkill,
          wasCorrect,
          confidence: cur.confidence,
          source: 'daily_drill',
          note: q.prompt.slice(0, 500),
        }),
      });
      const lb = await logRes.json().catch(() => null);
      entryId = lb?.data?.entry?.id ?? null;
    } catch {
      /* non-fatal: the drill still works, the log row is best-effort */
    }
    setAnswers(a => ({ ...a, [i]: { ...(a[i] ?? cur), picked: choiceIdx, entryId } }));

    fetch('/api/founder-os/sat/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, attempted: 1, correct: wasCorrect ? 1 : 0 }),
    }).catch(() => {
      /* best-effort counter */
    });
  }

  async function tagRootCause(i: number, rootCause: string) {
    const cur = answers[i];
    if (!cur?.entryId) {
      setAnswers(a => ({ ...a, [i]: { ...(a[i] ?? blankAnswer()), rootCause } }));
      return;
    }
    setAnswers(a => ({ ...a, [i]: { ...cur, rootCause } }));
    fetch('/api/founder-os/sat/error-log', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: cur.entryId, rootCause }),
    }).catch(() => {
      /* best-effort */
    });
  }

  async function completeSession() {
    try {
      await fetch('/api/founder-os/sat/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: today, completed: true, focusSkills: [activeSkill] }),
      });
    } catch {
      /* best-effort */
    }
    onChanged();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Focus banner */}
      <div style={{ ...cardStyle, borderTop: '3px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Target size={16} style={{ color: 'var(--accent-primary)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Today&rsquo;s focus</strong>
        </div>
        {weakAreas.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', margin: 0 }}>
            No error data yet. Take a Bluebook diagnostic and log the misses, or just generate a
            drill below to start populating your weak-area map.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {weakAreas.map(w => {
              const sk = SAT_SKILL_BY_ID[w.skill];
              return (
                <span
                  key={w.skill}
                  title={`${w.wrong}/${w.attempted} missed`}
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                    color: 'var(--error)',
                    border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
                  }}
                >
                  {sk?.label ?? w.skill} · {Math.round(w.errorRate * 100)}%
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Drill controls */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
            }}
          >
            Section
            <select
              value={section}
              onChange={e => {
                setSection(e.target.value as SatSection);
                setSkill('');
              }}
              style={selectStyle}
            >
              {Object.values(SAT_SECTIONS).map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
            }}
          >
            Skill
            <select
              value={activeSkill}
              onChange={e => setSkill(e.target.value)}
              style={selectStyle}
            >
              {skillsForSection(section).map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={generate} disabled={loadingGen} style={primaryBtn}>
            <Sparkles size={14} />
            {loadingGen ? 'Generating…' : 'Generate 3 drills'}
          </button>
        </div>
        {err && (
          <p style={{ color: 'var(--error)', fontSize: 'var(--fs-2xs)', marginTop: 8 }}>{err}</p>
        )}
      </div>

      {/* Questions */}
      {questions?.map((q, i) => {
        const a = answers[i] ?? blankAnswer();
        const answered = a.picked !== null;
        const wasCorrect = answered && a.picked === q.correctIndex;
        return (
          <div key={i} style={cardStyle}>
            <p
              style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-sm)',
                whiteSpace: 'pre-wrap',
                marginTop: 0,
              }}
            >
              {q.prompt}
            </p>

            {!answered && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                  Before you answer — how sure are you?
                </span>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {SAT_CONFIDENCE_LEVELS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setConfidence(i, c.value)}
                      style={{
                        ...chipBtn,
                        ...(a.confidence === c.value
                          ? {
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              borderColor: 'var(--accent-primary)',
                            }
                          : {}),
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.choices.map((choice, ci) => {
                const isCorrect = ci === q.correctIndex;
                const isPicked = a.picked === ci;
                let bg = 'var(--bg-secondary)';
                let bc = 'var(--border-color)';
                if (answered && isCorrect) {
                  bg = 'color-mix(in srgb, var(--success) 12%, transparent)';
                  bc = 'var(--success)';
                } else if (answered && isPicked && !isCorrect) {
                  bg = 'color-mix(in srgb, var(--error) 12%, transparent)';
                  bc = 'var(--error)';
                }
                return (
                  <button
                    key={ci}
                    onClick={() => pick(i, ci, q)}
                    disabled={answered || a.confidence === null}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: bg,
                      border: `1px solid ${bc}`,
                      color: 'var(--text-primary)',
                      fontSize: 'var(--fs-sm)',
                      cursor: answered || a.confidence === null ? 'default' : 'pointer',
                      opacity: a.confidence === null && !answered ? 0.55 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {answered && isCorrect && (
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    )}
                    {answered && isPicked && !isCorrect && (
                      <X size={14} style={{ color: 'var(--error)' }} />
                    )}
                    {choice}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div style={{ marginTop: 10 }}>
                <p
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-secondary)',
                    margin: '0 0 6px',
                  }}
                >
                  {q.explanation}
                </p>
                {!wasCorrect && (
                  <div>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                      Why did you miss it?
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {SAT_ROOT_CAUSES.map(rc => (
                        <button
                          key={rc.id}
                          title={rc.fix}
                          onClick={() => tagRootCause(i, rc.id)}
                          style={{
                            ...chipBtn,
                            ...(a.rootCause === rc.id
                              ? {
                                  background: 'var(--warning)',
                                  color: '#fff',
                                  borderColor: 'var(--warning)',
                                }
                              : {}),
                          }}
                        >
                          {rc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Session footer */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          Today:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{todaySession?.attempted ?? 0}</strong>{' '}
          attempted ·{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{todaySession?.correct ?? 0}</strong>{' '}
          correct
          {dueVocab.length > 0 && ` · ${dueVocab.length} vocab due (Vocab Bank)`}
        </span>
        <button
          onClick={completeSession}
          disabled={todaySession?.completed}
          style={{ ...primaryBtn, opacity: todaySession?.completed ? 0.6 : 1 }}
        >
          {todaySession?.completed ? 'Session complete ✓' : 'Complete today’s session'}
        </button>
      </div>
    </div>
  );
}

function blankAnswer(): AnswerState {
  return { confidence: null, picked: null, entryId: null, rootCause: null };
}

const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--accent-primary)',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};
const chipBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-2xs)',
  cursor: 'pointer',
};
