'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dumbbell, FileText, BarChart3, BookOpen, Brain, CalendarClock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SatDailyTraining } from './sat/SatDailyTraining';
import { SatTestLog } from './sat/SatTestLog';
import { SatProgressCalibration } from './sat/SatProgressCalibration';
import { SatVocabBank } from './sat/SatVocabBank';
import { SatReview } from './sat/SatReview';
import { localToday } from './sat/sat-types';
import { SAT_GOAL, SAT_TEST_DATE_DEFAULTS } from './sat/sat-content';
import { daysUntil, isDueForReview } from './sat/sat-calibration';
import type { SatErrorEntry, SatSession, SatTest, SatVocab, SatSettings } from './sat/sat-types';

interface Props {
  founderPass: string;
}

type View = 'daily' | 'review' | 'testlog' | 'progress' | 'vocab';

const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'daily', label: 'Daily Training', icon: <Dumbbell size={15} /> },
  { id: 'review', label: 'Review', icon: <Brain size={15} /> },
  { id: 'testlog', label: 'Official Test Log', icon: <FileText size={15} /> },
  { id: 'progress', label: 'Progress & Calibration', icon: <BarChart3 size={15} /> },
  { id: 'vocab', label: 'Vocab Bank', icon: <BookOpen size={15} /> },
];

const STORAGE_KEY = 'di-sat-prep-view';

export function SatPrepTab({ founderPass }: Props) {
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': founderPass }),
    [founderPass]
  );
  const today = useMemo(() => localToday(), []);

  const [view, setView] = useState<View>('daily');
  const [errors, setErrors] = useState<SatErrorEntry[]>([]);
  const [sessions, setSessions] = useState<SatSession[]>([]);
  const [tests, setTests] = useState<SatTest[]>([]);
  const [vocab, setVocab] = useState<SatVocab[]>([]);
  const [settings, setSettings] = useState<SatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDates, setEditingDates] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && VIEWS.some(v => v.id === saved)) setView(saved as View);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [eRes, sRes, tRes, vRes, setRes] = await Promise.all([
        fetch('/api/founder-os/sat/error-log?days=200', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/sessions?days=200', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/tests', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/vocab', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/settings', { cache: 'no-store', headers }),
      ]);
      const [eBody, sBody, tBody, vBody, setBody] = await Promise.all([
        eRes.json().catch(() => null),
        sRes.json().catch(() => null),
        tRes.json().catch(() => null),
        vRes.json().catch(() => null),
        setRes.json().catch(() => null),
      ]);
      setErrors((eBody?.data?.entries as SatErrorEntry[]) ?? []);
      setSessions((sBody?.data?.sessions as SatSession[]) ?? []);
      setTests((tBody?.data?.tests as SatTest[]) ?? []);
      setVocab((vBody?.data?.cards as SatVocab[]) ?? []);
      setSettings((setBody?.data?.settings as SatSettings | null) ?? null);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function selectView(v: View) {
    setView(v);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, v);
  }

  const dueVocab = useMemo(
    () => vocab.filter(c => !c.nextDue || new Date(c.nextDue) <= new Date()),
    [vocab]
  );
  const dueReviewCount = useMemo(() => errors.filter(e => isDueForReview(e)).length, [errors]);

  const benchmarkDate = settings?.benchmarkTestDate ?? SAT_TEST_DATE_DEFAULTS.benchmark;
  const targetDate = settings?.targetTestDate ?? SAT_TEST_DATE_DEFAULTS.target;
  const dTarget = daysUntil(targetDate, today);
  const dBenchmark = daysUntil(benchmarkDate, today);

  async function saveDates(benchmark: string, target: string) {
    setSettings({ benchmarkTestDate: benchmark || null, targetTestDate: target || null });
    setEditingDates(false);
    await fetch('/api/founder-os/sat/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        benchmarkTestDate: benchmark || null,
        targetTestDate: target || null,
      }),
    }).catch(() => {
      /* best-effort; reconciled on the next fetch */
    });
    fetchAll();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2
          style={{
            fontSize: 'var(--fs-page-h1-platform)',
            letterSpacing: '-0.03em',
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          SAT Prep
        </h2>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          {SAT_GOAL.baselinePsat} PSAT → {SAT_GOAL.targetTotal} target · {SAT_GOAL.dailyMinutes}{' '}
          min/day · official tests + targeted drills + the calibration loop. The lesson-teacher-free
          system.
        </p>
      </div>

      {/* Countdown strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          padding: '10px 14px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${dTarget >= 0 && dTarget <= 21 ? 'var(--error)' : 'var(--accent-primary)'}`,
        }}
      >
        <CalendarClock size={16} style={{ color: 'var(--accent-primary)' }} />
        {!editingDates ? (
          <>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
              <strong>T-{dBenchmark >= 0 ? dBenchmark : '–'}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}
                to the {SAT_GOAL.benchmarkMonth} benchmark
              </span>
              {'   ·   '}
              <strong>T-{dTarget >= 0 ? dTarget : '–'}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}
                to the {SAT_GOAL.targetMonth} target
              </span>
            </span>
            <button
              onClick={() => setEditingDates(true)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 'var(--fs-2xs)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              edit dates
            </button>
          </>
        ) : (
          <DateEditor
            benchmark={benchmarkDate}
            target={targetDate}
            onSave={saveDates}
            onCancel={() => setEditingDates(false)}
          />
        )}
      </div>

      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 10,
        }}
      >
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => selectView(v.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              borderColor: view === v.id ? 'var(--accent-primary)' : 'var(--border-color)',
              background:
                view === v.id
                  ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                  : 'transparent',
              color: view === v.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: 'var(--fs-sm)',
              fontWeight: view === v.id ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {v.icon}
            {v.label}
            {v.id === 'review' && dueReviewCount > 0 && (
              <span
                style={{
                  fontSize: 'var(--fs-3xs)',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                }}
              >
                {dueReviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Loading…</p>
      ) : (
        <ErrorBoundary sectionName="SAT Prep view">
          {view === 'daily' && (
            <SatDailyTraining
              headers={headers}
              today={today}
              errors={errors}
              sessions={sessions}
              dueVocab={dueVocab}
              onChanged={fetchAll}
            />
          )}
          {view === 'review' && (
            <SatReview headers={headers} errors={errors} onChanged={fetchAll} />
          )}
          {view === 'testlog' && (
            <SatTestLog headers={headers} today={today} tests={tests} onChanged={fetchAll} />
          )}
          {view === 'progress' && (
            <SatProgressCalibration
              errors={errors}
              sessions={sessions}
              tests={tests}
              today={today}
            />
          )}
          {view === 'vocab' && (
            <SatVocabBank headers={headers} vocab={vocab} onChanged={fetchAll} />
          )}
        </ErrorBoundary>
      )}
    </div>
  );
}

function DateEditor({
  benchmark,
  target,
  onSave,
  onCancel,
}: {
  benchmark: string;
  target: string;
  onSave: (benchmark: string, target: string) => void;
  onCancel: () => void;
}) {
  const [b, setB] = useState(benchmark);
  const [t, setT] = useState(target);
  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--fs-2xs)',
  };
  const btn: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--accent-primary)',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontSize: 'var(--fs-2xs)',
    cursor: 'pointer',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
        Benchmark{' '}
        <input type="date" value={b} onChange={e => setB(e.target.value)} style={inputStyle} />
      </label>
      <label style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
        Target{' '}
        <input type="date" value={t} onChange={e => setT(e.target.value)} style={inputStyle} />
      </label>
      <button onClick={() => onSave(b, t)} style={btn}>
        Save
      </button>
      <button
        onClick={onCancel}
        style={{
          ...btn,
          background: 'transparent',
          color: 'var(--text-muted)',
          borderColor: 'var(--border-color)',
        }}
      >
        Cancel
      </button>
    </div>
  );
}
