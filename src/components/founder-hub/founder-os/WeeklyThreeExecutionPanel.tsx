'use client';

/**
 * Founder OS — "This week's three" execution panel (2026-06-01).
 *
 * Auto-pulls the week's Today's-Three execution into the Sunday weekly review,
 * so the loop closes in one place: completion + Highlight-hit + the 7-day strip
 * + delta vs last week + the week's intentions and whether they landed.
 *
 * Self-contained (fetches its own data) to keep the blast radius on the large
 * FounderOSTab to a single import + mount. Read-only — the founder edits the
 * goals themselves in Faith OS. Self-hides when there's nothing to show, so it
 * never clutters an empty review.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  summarizeWeek,
  shiftIsoDate,
  type DailyGoalLite,
} from '@/components/founder-hub/faith-os/daily-three';
import { weekStartIso, weekKeyFor } from '@/components/founder-hub/faith-os/period-goals';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

interface DailyGoalRaw {
  date: string;
  status: 'open' | 'done' | 'carried' | 'released';
  isHighlight: boolean;
  committed: boolean;
}

interface WeekIntention {
  id: string;
  text: string;
  status: 'open' | 'done' | 'carried' | 'released';
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklyThreeExecutionPanel({ founderPass }: { founderPass: string }) {
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': founderPass }),
    [founderPass]
  );
  const [today] = useState(() => (typeof window === 'undefined' ? '' : todayIso()));
  const [goals, setGoals] = useState<DailyGoalLite[]>([]);
  const [intentions, setIntentions] = useState<WeekIntention[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!today) return;
    try {
      const wk = weekKeyFor(today);
      const [gRes, pRes] = await Promise.all([
        fetch('/api/founder-os/daily-goals?days=21', { cache: 'no-store', headers }),
        fetch(`/api/founder-os/period-goals?period=week&key=${encodeURIComponent(wk)}`, {
          cache: 'no-store',
          headers,
        }),
      ]);
      const gJson = (await gRes.json().catch(() => null)) as ApiEnvelope<{
        goals: DailyGoalRaw[];
      }> | null;
      const pJson = (await pRes.json().catch(() => null)) as ApiEnvelope<{
        goals: WeekIntention[];
      }> | null;
      setGoals(
        (gJson?.data?.goals ?? []).map(g => ({
          date: g.date,
          status: g.status,
          isHighlight: g.isHighlight,
          committed: g.committed,
        }))
      );
      setIntentions(pJson?.data?.goals ?? []);
    } catch {
      // degrade silently — the review still works without the panel.
    } finally {
      setLoaded(true);
    }
  }, [headers, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const thisWeek = useMemo(
    () => (today ? summarizeWeek(goals, weekStartIso(today)) : null),
    [goals, today]
  );
  const lastWeek = useMemo(
    () => (today ? summarizeWeek(goals, shiftIsoDate(weekStartIso(today), -7)) : null),
    [goals, today]
  );

  if (!loaded || !thisWeek || !lastWeek) return null;

  const hasData = thisWeek.set > 0 || intentions.length > 0 || lastWeek.set > 0;
  if (!hasData) return null;

  const pct = Math.round(thisWeek.completionRate * 100);
  const deltaPts = Math.round((thisWeek.completionRate - lastWeek.completionRate) * 100);
  const showDelta = lastWeek.set > 0;
  const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <AccentCard accent="primary" title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Target size={16} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
          This week&apos;s three
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· execution, auto-pulled</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            {pct}%
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            completed ({thisWeek.done}/{thisWeek.set})
          </span>
        </div>
        {thisWeek.highlightDays > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Highlight hit {Math.round(thisWeek.highlightHitRate * 100)}% ({thisWeek.highlightHits}/
            {thisWeek.highlightDays})
          </span>
        )}
        {showDelta && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: deltaPts >= 0 ? 'var(--success)' : 'var(--warning)',
            }}
          >
            {deltaPts >= 0 ? '▲' : '▼'} {Math.abs(deltaPts)} pts vs last week
          </span>
        )}
      </div>

      {/* 7-day Sun→Sat strip */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {thisWeek.perDay.map((d, i) => {
          const ratio = d.set > 0 ? d.done / d.set : 0;
          const fill = d.set === 0 ? 0 : 16 + Math.round(ratio * 64);
          return (
            <div key={d.date} style={{ textAlign: 'center' }}>
              <div
                title={`${d.date} — ${d.done}/${d.set} done`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background:
                    d.set === 0
                      ? 'var(--bg-secondary)'
                      : `color-mix(in srgb, var(--accent-primary) ${fill}%, transparent)`,
                  border:
                    d.set === 0
                      ? '1px solid var(--border-color)'
                      : '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                }}
              />
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {DAY_LETTERS[i]}
              </div>
            </div>
          );
        })}
      </div>

      {/* the week's intentions + whether they landed */}
      {intentions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            The week&apos;s intentions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {intentions.map(it => {
              const done = it.status === 'done';
              return (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {done ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  ) : (
                    <Circle size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontSize: 12.5,
                      color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                      lineHeight: 1.4,
                    }}
                  >
                    {it.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p
        style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}
      >
        Carry what mattered but didn&apos;t land into next week&apos;s three. The streak is showing
        up, not perfection.
      </p>
    </AccentCard>
  );
}
