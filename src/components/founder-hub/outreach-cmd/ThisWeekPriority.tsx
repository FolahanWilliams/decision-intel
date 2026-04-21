'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Target, TrendingUp } from 'lucide-react';
import { TRACTION_PLAN, type WeekPlan } from '@/lib/data/outreach';

const STORAGE_KEY = 'outreach-cmd-priority-check';

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function findCurrentWeek(today: Date): WeekPlan {
  // Find the latest week whose startDate <= today
  const sorted = [...TRACTION_PLAN].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let current = sorted[0];
  for (const w of sorted) {
    if (new Date(w.startDate) <= today) current = w;
  }
  return current;
}

function loadChecks(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function ThisWeekPriority() {
  const [today, setToday] = useState<Date | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date + localStorage hydration
    setToday(new Date());
    setChecks(loadChecks());
  }, []);

  const week = useMemo<WeekPlan | null>(() => (today ? findCurrentWeek(today) : null), [today]);

  if (!today || !week) {
    return (
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        Loading week plan…
      </div>
    );
  }

  const weekStart = new Date(week.startDate);
  const dayIdx = Math.max(0, Math.min(6, daysBetween(weekStart, today)));
  const daysRemaining = 6 - dayIdx;

  const toggle = (key: string) => {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage quota — non-fatal
    }
  };

  const completed = week.keyActions.filter(a => checks[`${week.weekNumber}::${a}`]).length;
  const progressPct = Math.round((completed / week.keyActions.length) * 100);

  return (
    <div>
      {/* Week banner */}
      <div
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(245,158,11,0.04))',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Calendar size={14} style={{ color: '#16A34A' }} />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
            }}
          >
            {week.label} · Day {dayIdx + 1} of 7 · {daysRemaining} days remaining
          </div>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            lineHeight: 1.25,
          }}
        >
          {week.theme}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <Target size={12} style={{ color: '#16A34A' }} />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>Goal:</strong> {week.primaryGoal}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
              style={{
                height: '100%',
                background:
                  progressPct >= 80 ? '#16A34A' : progressPct >= 40 ? '#F59E0B' : '#0EA5E9',
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            {completed}/{week.keyActions.length}
          </span>
        </div>
      </div>

      {/* Key Actions checklist */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}
        >
          Key actions this week
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {week.keyActions.map(action => {
            const key = `${week.weekNumber}::${action}`;
            const done = !!checks[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  background: done ? 'rgba(22,163,74,0.06)' : 'var(--bg-secondary)',
                  border: done ? '1px solid rgba(22,163,74,0.3)' : '1px solid var(--border-color)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                }}
              >
                <div
                  style={{
                    color: done ? '#16A34A' : 'var(--text-muted)',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                    lineHeight: 1.5,
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {action}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deliverable */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <TrendingUp size={14} style={{ color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#16A34A' }}>End-of-week deliverable:</strong> {week.deliverable}
        </div>
      </div>

      {/* Week tabs preview */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
        }}
      >
        {TRACTION_PLAN.map(w => {
          const isCurrent = w.weekNumber === week.weekNumber;
          return (
            <div
              key={w.weekNumber}
              style={{
                flex: '0 0 auto',
                padding: '6px 10px',
                background: isCurrent ? '#16A34A' : 'var(--bg-card)',
                color: isCurrent ? '#fff' : 'var(--text-muted)',
                border: isCurrent ? '1px solid #16A34A' : '1px solid var(--border-color)',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {w.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
