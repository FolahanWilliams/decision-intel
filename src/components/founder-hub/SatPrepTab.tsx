'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dumbbell, FileText, BarChart3, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SatDailyTraining } from './sat/SatDailyTraining';
import { SatTestLog } from './sat/SatTestLog';
import { SatProgressCalibration } from './sat/SatProgressCalibration';
import { SatVocabBank } from './sat/SatVocabBank';
import { localToday } from './sat/sat-types';
import { SAT_GOAL } from './sat/sat-content';
import type { SatErrorEntry, SatSession, SatTest, SatVocab } from './sat/sat-types';

interface Props {
  founderPass: string;
}

type View = 'daily' | 'testlog' | 'progress' | 'vocab';

const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'daily', label: 'Daily Training', icon: <Dumbbell size={15} /> },
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && VIEWS.some(v => v.id === saved)) setView(saved as View);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [eRes, sRes, tRes, vRes] = await Promise.all([
        fetch('/api/founder-os/sat/error-log?days=200', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/sessions?days=200', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/tests', { cache: 'no-store', headers }),
        fetch('/api/founder-os/sat/vocab', { cache: 'no-store', headers }),
      ]);
      const [eBody, sBody, tBody, vBody] = await Promise.all([
        eRes.json().catch(() => null),
        sRes.json().catch(() => null),
        tRes.json().catch(() => null),
        vRes.json().catch(() => null),
      ]);
      setErrors((eBody?.data?.entries as SatErrorEntry[]) ?? []);
      setSessions((sBody?.data?.sessions as SatSession[]) ?? []);
      setTests((tBody?.data?.tests as SatTest[]) ?? []);
      setVocab((vBody?.data?.cards as SatVocab[]) ?? []);
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
