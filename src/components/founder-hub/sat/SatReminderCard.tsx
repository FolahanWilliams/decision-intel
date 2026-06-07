'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Flame, Brain, ArrowRight } from 'lucide-react';
import { localToday, type SatErrorEntry, type SatSession, type SatSettings } from './sat-types';
import { computeStreak, daysUntil, isDueForReview } from './sat-calibration';
import { SAT_GOAL, SAT_TEST_DATE_DEFAULTS } from './sat-content';

interface Props {
  /** Navigate to the SAT Prep tab. */
  onOpen: () => void;
  founderPass?: string;
}

/**
 * Cross-surface daily SAT reminder for the Start Here landing — the consistency
 * nudge where the founder lands every day. Self-fetches (reads the public
 * founder-pass like the campaign cockpit). Self-hides on load failure.
 *
 * Frames the prompt as a Gollwitzer implementation intention ("if it's evening,
 * then your 30-min block") — roughly doubles follow-through vs a bare reminder.
 */
export function SatReminderCard({ onOpen, founderPass }: Props) {
  const pass = founderPass ?? process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': pass }),
    [pass]
  );
  const today = useMemo(() => localToday(), []);

  const [sessions, setSessions] = useState<SatSession[]>([]);
  const [errors, setErrors] = useState<SatErrorEntry[]>([]);
  const [settings, setSettings] = useState<SatSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sRes, eRes, setRes] = await Promise.all([
          fetch('/api/founder-os/sat/sessions?days=120', { cache: 'no-store', headers }),
          fetch('/api/founder-os/sat/error-log?days=120', { cache: 'no-store', headers }),
          fetch('/api/founder-os/sat/settings', { cache: 'no-store', headers }),
        ]);
        const [sBody, eBody, setBody] = await Promise.all([
          sRes.json().catch(() => null),
          eRes.json().catch(() => null),
          setRes.json().catch(() => null),
        ]);
        if (!alive) return;
        setSessions((sBody?.data?.sessions as SatSession[]) ?? []);
        setErrors((eBody?.data?.entries as SatErrorEntry[]) ?? []);
        setSettings((setBody?.data?.settings as SatSettings | null) ?? null);
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [headers]);

  const streak = useMemo(() => computeStreak(sessions, today), [sessions, today]);
  const dueReview = useMemo(() => errors.filter(e => isDueForReview(e)).length, [errors]);
  const todayDone = sessions.find(s => s.date === today)?.completed ?? false;
  const targetDate = settings?.targetTestDate ?? SAT_TEST_DATE_DEFAULTS.target;
  const dTarget = daysUntil(targetDate, today);

  if (!loaded || failed) return null;

  const urgent = dTarget >= 0 && dTarget <= 21;

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${todayDone ? 'var(--success)' : urgent ? 'var(--error)' : 'var(--accent-primary)'}`,
        cursor: 'pointer',
      }}
    >
      <GraduationCap size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
          {todayDone
            ? `SAT block done today — streak ${streak.current}d 🔥`
            : `If it's evening, then your ${SAT_GOAL.dailyMinutes}-min SAT block.`}
        </div>
        <div
          style={{
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            marginTop: 2,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <Flame size={11} style={{ verticalAlign: '-1px' }} /> {streak.current}d streak
          </span>
          {dueReview > 0 && (
            <span>
              <Brain size={11} style={{ verticalAlign: '-1px' }} /> {dueReview} due for review
            </span>
          )}
          {dTarget >= 0 && (
            <span>
              T-{dTarget} to the {SAT_GOAL.targetMonth} target
            </span>
          )}
        </div>
      </div>
      <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
}
