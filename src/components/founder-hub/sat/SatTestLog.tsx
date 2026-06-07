'use client';

import { useState } from 'react';
import { Trash2, FileText, Crosshair } from 'lucide-react';
import { SAT_TEST_SOURCES, SAT_SECTIONS, skillsForSection, type SatSection } from './sat-content';
import type { SatTest } from './sat-types';

interface Props {
  headers: Record<string, string>;
  today: string;
  tests: SatTest[];
  onChanged: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  width: '100%',
};

export function SatTestLog({ headers, today, tests, onChanged }: Props) {
  const [date, setDate] = useState(today);
  const [source, setSource] = useState<string>('bluebook');
  const [section, setSection] = useState<string>('full');
  const [rwScore, setRw] = useState('');
  const [mathScore, setMath] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMin, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Real-test miss capture — tap a skill per missed question so weak-area
  // ranking + the Brier loop are built on REAL questions, not AI drills.
  const [missSection, setMissSection] = useState<SatSection>('math');
  const [missTally, setMissTally] = useState<Record<string, number>>({});

  async function addMiss(skill: string) {
    setMissTally(t => ({ ...t, [skill]: (t[skill] ?? 0) + 1 }));
    await fetch('/api/founder-os/sat/error-log', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date,
        section: missSection,
        skill,
        wasCorrect: false,
        source: 'official_test',
      }),
    }).catch(() => {
      /* best-effort; reconciled on the next fetch */
    });
    onChanged();
  }

  async function submit() {
    setErr(null);
    if (!rwScore && !mathScore) {
      setErr('Enter at least one section score.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/founder-os/sat/tests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date,
          source,
          section,
          rwScore: rwScore ? Number(rwScore) : null,
          mathScore: mathScore ? Number(mathScore) : null,
          durationMin: durationMin ? Number(durationMin) : null,
          notes: notes || null,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || 'Failed to log test');
      setRw('');
      setMath('');
      setNotes('');
      setDuration('');
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to log test');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/founder-os/sat/tests?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    }).catch(() => {
      /* best-effort */
    });
    onChanged();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...cardStyle, borderTop: '3px solid var(--info)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <FileText size={16} style={{ color: 'var(--info)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Log an official test</strong>
        </div>
        <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Bluebook / Khan / released / real-SAT scores only — these are the single source of your
          projected score. (In-app drills never count here; they&rsquo;re off-distribution.)
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
          }}
        >
          <label style={labelStyle}>
            Date
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Source
            <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
              {SAT_TEST_SOURCES.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Section(s)
            <select value={section} onChange={e => setSection(e.target.value)} style={inputStyle}>
              <option value="full">Full test</option>
              <option value="rw">R&amp;W only</option>
              <option value="math">Math only</option>
            </select>
          </label>
          <label style={labelStyle}>
            R&amp;W score (200-800)
            <input
              type="number"
              value={rwScore}
              onChange={e => setRw(e.target.value)}
              style={inputStyle}
              placeholder="—"
            />
          </label>
          <label style={labelStyle}>
            Math score (200-800)
            <input
              type="number"
              value={mathScore}
              onChange={e => setMath(e.target.value)}
              style={inputStyle}
              placeholder="—"
            />
          </label>
          <label style={labelStyle}>
            Duration (min)
            <input
              type="number"
              value={durationMin}
              onChange={e => setDuration(e.target.value)}
              style={inputStyle}
              placeholder="—"
            />
          </label>
        </div>
        <label style={{ ...labelStyle, marginTop: 10 }}>
          Notes (what went wrong, pacing, sections that slipped)
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        {err && (
          <p style={{ color: 'var(--error)', fontSize: 'var(--fs-2xs)', marginTop: 8 }}>{err}</p>
        )}
        <button onClick={submit} disabled={saving} style={primaryBtn}>
          {saving ? 'Saving…' : 'Log test'}
        </button>
      </div>

      {/* Real-test miss capture */}
      <div style={{ ...cardStyle, borderTop: '3px solid var(--warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Crosshair size={16} style={{ color: 'var(--warning)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Log this test&rsquo;s misses</strong>
        </div>
        <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Tap a skill once per missed question (for the {date} sitting). This is the gold — your
          weak-area map + calibration get built on REAL questions, and each becomes a spaced-review
          card. Add a confidence/root-cause later in the error log if you want.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {Object.values(SAT_SECTIONS).map(s => (
            <button
              key={s.id}
              onClick={() => setMissSection(s.id)}
              style={{
                ...chipBtn,
                ...(missSection === s.id
                  ? { background: 'var(--warning)', color: '#fff', borderColor: 'var(--warning)' }
                  : {}),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {skillsForSection(missSection).map(sk => (
            <button key={sk.id} onClick={() => addMiss(sk.id)} style={chipBtn} title="Add a miss">
              {sk.label}
              {missTally[sk.id] ? (
                <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
                  {' '}
                  +{missTally[sk.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)' }}>
          Logged tests ({tests.length})
        </strong>
        {tests.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginTop: 8 }}>
            No tests logged yet. Your first Bluebook diagnostic goes here — it produces the
            R&amp;W↔Math split the whole plan targets.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {tests.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                  <strong>{t.totalScore ?? t.rwScore ?? t.mathScore ?? '—'}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-2xs)' }}>
                    {' '}
                    · {t.rwScore != null ? `R&W ${t.rwScore}` : ''}
                    {t.rwScore != null && t.mathScore != null ? ' / ' : ''}
                    {t.mathScore != null ? `Math ${t.mathScore}` : ''} · {t.source} · {t.date}
                  </span>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                  aria-label="Delete test"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 'var(--fs-2xs)',
  color: 'var(--text-muted)',
};
const primaryBtn: React.CSSProperties = {
  marginTop: 12,
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--info)',
  background: 'var(--info)',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};
const chipBtn: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-2xs)',
  cursor: 'pointer',
};
