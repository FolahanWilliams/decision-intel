'use client';

/**
 * Faith OS — the Foundations layer of the Founder Hub (2026-05-28).
 *
 * Faith woven UNDER the operating platform: daily verse, the agency-surrender
 * spine, a tracked daily spiritual checkin (prayer + scripture, co-owning the
 * Founder OS checkin row), two reading plans with progress + reflections, an
 * ACTS prayer + reflection journal with an answered-prayer record, the
 * success-psychology↔scripture map, the 6-pillar scripture anchors, faith-and-
 * work theology, founders-of-faith narratives, a Sabbath rhythm, and the
 * anti-prosperity guardrail.
 *
 * Persistence: Supabase via /api/founder-os/* (dual-gated by founder pass +
 * user.id). The daily checkin row is co-owned with the Founder OS tab — both
 * surfaces load the full row and send all fields, so neither clobbers the
 * other's disciplines. Sabbath is a lightweight per-week localStorage rhythm.
 *
 * Styling: CSS variables (light-theme), AccentCard for stacked cards,
 * mobile-responsive single-column below 800px.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Flame,
  Hand,
  Heart,
  Layers,
  Link2,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { BibleVersePill } from '@/components/founder-hub/founder-os/sections';
import {
  READING_PLANS,
  PRAYER_FRAMEWORK,
  DAILY_THREE_PRINCIPLES,
  DAILY_THREE_COMMIT,
  DAILY_THREE_RITUAL,
  WHY_THREE,
  CASCADE_FRAME,
  EVENING_REFLECTION,
  type PrayerMovement,
} from '@/components/founder-hub/faith-os/content';
import {
  summarizeDailyThree,
  computeDisciplineExecutionCorrelation,
  shiftIsoDate,
  type DailyGoalLite,
  type DailyThreeSummary,
  type CheckinLite,
  type ExecutionCorrelation,
} from '@/components/founder-hub/faith-os/daily-three';
import {
  weekKeyFor,
  quarterKeyFor,
  periodLabel,
  periodSlotsLeft,
  isActivePeriodStatus,
  PERIOD_GOAL_MAX,
} from '@/components/founder-hub/faith-os/period-goals';
import {
  AgencySurrenderSpine,
  AntiProsperityGuardrail,
  FaithAndWorkSection,
  FoundersOfFaithSection,
  PillarAnchorsSection,
  SabbathCard,
  SuccessScriptureMap,
} from '@/components/founder-hub/faith-os/sections';
import { computeFaithProgress } from '@/components/founder-hub/faith-os/progress';
import {
  FaithStatStrip,
  DisciplineHeatmap,
  ActsBalanceBars,
  AnsweredPrayerRing,
  ReadingProgressBars,
  CadenceSparkline,
  RecurringScriptureChips,
  FaithVizStyles,
} from '@/components/founder-hub/faith-os/visualizations';

// ─── types ──────────────────────────────────────────────────────────────

interface Checkin {
  date: string;
  sfcZero: boolean;
  deepWorkHours: number;
  deepReadingMinutes: number;
  exercise: boolean;
  meditation: boolean;
  prayer: boolean;
  scripture: boolean;
  notes: string | null;
}

interface ReadingProgressRow {
  planId: string;
  reference: string;
  reflection: string | null;
  completedAt: string;
}

interface JournalEntry {
  id: string;
  kind: string;
  title: string | null;
  body: string;
  scriptureRef: string | null;
  answered: boolean;
  answeredNote: string | null;
  answeredAt: string | null;
  createdAt: string;
}

type DailyGoalStatus = 'open' | 'done' | 'carried' | 'released';

interface DailyGoal {
  id: string;
  date: string;
  text: string;
  rank: number;
  isHighlight: boolean;
  intention: string | null;
  scheduledFor: string | null;
  linkedPeriodGoalId: string | null;
  status: DailyGoalStatus;
  committed: boolean;
  completedAt: string | null;
  createdAt: string;
}

type GoalPeriod = 'week' | 'quarter';

interface PeriodGoal {
  id: string;
  period: GoalPeriod;
  periodKey: string;
  text: string;
  rank: number;
  status: DailyGoalStatus;
  committed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface DailyReflection {
  date: string;
  moved: string | null;
  blocked: string | null;
}

type DailyGoalPatch = Partial<
  Pick<
    DailyGoal,
    | 'status'
    | 'text'
    | 'intention'
    | 'isHighlight'
    | 'committed'
    | 'scheduledFor'
    | 'linkedPeriodGoalId'
  >
>;

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

// ─── date helpers (client-only, captured once) ──────────────────────────

function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SABBATH_KEY = 'di-faith-os-sabbath-week';

// ─── main tab ─────────────────────────────────────────────────────────────

interface FaithOSTabProps {
  founderPass: string;
}

export function FaithOSTab({ founderPass }: FaithOSTabProps) {
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': founderPass }),
    [founderPass]
  );

  // Captured once on first client render (react-hooks/purity safe).
  const [today] = useState(() => (typeof window === 'undefined' ? '' : todayLocalISO()));
  const [proverbsToday] = useState(() => {
    if (typeof window === 'undefined') return 'Proverbs 1';
    return `Proverbs ${Math.min(new Date().getDate(), 31)}`;
  });

  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [progress, setProgress] = useState<ReadingProgressRow[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [periodGoals, setPeriodGoals] = useState<PeriodGoal[]>([]);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [savingDiscipline, setSavingDiscipline] = useState<'prayer' | 'scripture' | null>(null);

  const weekKey = useMemo(() => (today ? weekKeyFor(today) : ''), [today]);
  const quarterKey = useMemo(() => (today ? quarterKeyFor(today) : ''), [today]);

  const [sabbathTaken, setSabbathTaken] = useState(false);

  // ── load ── (180-day checkin window powers the discipline heatmap + streaks)
  const fetchAll = useCallback(async () => {
    try {
      const [cRes, pRes, jRes, gRes, pgRes, rfRes] = await Promise.all([
        fetch('/api/founder-os/checkins?days=180', { cache: 'no-store', headers }),
        fetch('/api/founder-os/reading-progress', { cache: 'no-store', headers }),
        fetch('/api/founder-os/prayer-journal?limit=200', { cache: 'no-store', headers }),
        fetch('/api/founder-os/daily-goals?days=60', { cache: 'no-store', headers }),
        fetch('/api/founder-os/period-goals', { cache: 'no-store', headers }),
        fetch('/api/founder-os/daily-reflections?days=60', { cache: 'no-store', headers }),
      ]);
      const cJson = (await cRes.json().catch(() => null)) as ApiEnvelope<{
        checkins: Checkin[];
      }> | null;
      const pJson = (await pRes.json().catch(() => null)) as ApiEnvelope<{
        progress: ReadingProgressRow[];
      }> | null;
      const jJson = (await jRes.json().catch(() => null)) as ApiEnvelope<{
        entries: JournalEntry[];
      }> | null;
      const gJson = (await gRes.json().catch(() => null)) as ApiEnvelope<{
        goals: DailyGoal[];
      }> | null;
      const pgJson = (await pgRes.json().catch(() => null)) as ApiEnvelope<{
        goals: PeriodGoal[];
      }> | null;
      const rfJson = (await rfRes.json().catch(() => null)) as ApiEnvelope<{
        reflections: DailyReflection[];
      }> | null;
      const allCheckins = cJson?.data?.checkins ?? [];
      setCheckins(allCheckins);
      setCheckin(allCheckins.find(c => c.date === today) ?? null);
      setProgress(pJson?.data?.progress ?? []);
      setJournal(jJson?.data?.entries ?? []);
      setGoals(gJson?.data?.goals ?? []);
      setPeriodGoals(pgJson?.data?.goals ?? []);
      setReflection(rfJson?.data?.reflections?.find(r => r.date === today) ?? null);
    } catch {
      // @schema-drift-tolerant — render the static surfaces even if the API is cold.
    }
  }, [headers, today]);

  // Pure progress computation across journal + reading reflections + checkins.
  const faithProgress = useMemo(
    () =>
      computeFaithProgress(
        journal.map(e => ({
          kind: e.kind,
          scriptureRef: e.scriptureRef,
          answered: e.answered,
          createdAt: e.createdAt,
        })),
        progress.map(p => ({
          planId: p.planId,
          reference: p.reference,
          reflection: p.reflection,
          completedAt: p.completedAt,
        })),
        checkins.map(c => ({
          date: c.date,
          prayer: c.prayer ?? false,
          scripture: c.scripture ?? false,
        })),
        today || todayLocalISO()
      ),
    [journal, progress, checkins, today]
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    try {
      setSabbathTaken(localStorage.getItem(SABBATH_KEY) === weekStartISO());
    } catch {
      // localStorage unavailable — Sabbath toggle degrades to non-persistent.
    }
  }, []);

  // ── daily spiritual checkin (co-owns the Founder OS row) ──
  const toggleDiscipline = useCallback(
    async (field: 'prayer' | 'scripture') => {
      if (!today) return;
      setSavingDiscipline(field);
      // Merge with the current row so the cognitive disciplines (sfcZero,
      // deepWork, etc.) are preserved — both surfaces carry all fields.
      const base: Checkin = checkin ?? {
        date: today,
        sfcZero: false,
        deepWorkHours: 0,
        deepReadingMinutes: 0,
        exercise: false,
        meditation: false,
        prayer: false,
        scripture: false,
        notes: null,
      };
      const next = { ...base, [field]: !base[field] };
      setCheckin(next); // optimistic
      try {
        const res = await fetch('/api/founder-os/checkins', {
          method: 'POST',
          headers,
          body: JSON.stringify(next),
        });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          checkin: Checkin;
        }> | null;
        if (json?.data?.checkin) setCheckin(json.data.checkin);
      } catch {
        void fetchAll(); // reconcile on failure
      } finally {
        setSavingDiscipline(null);
      }
    },
    [checkin, headers, today, fetchAll]
  );

  // ── reading progress ──
  const progressKey = useCallback(
    (planId: string, reference: string) => `${planId}::${reference}`,
    []
  );
  const progressMap = useMemo(() => {
    const m = new Map<string, ReadingProgressRow>();
    for (const row of progress) m.set(`${row.planId}::${row.reference}`, row);
    return m;
  }, [progress]);

  const markRead = useCallback(
    async (planId: string, reference: string, reflection: string) => {
      // optimistic
      setProgress(prev => {
        const without = prev.filter(r => !(r.planId === planId && r.reference === reference));
        return [
          {
            planId,
            reference,
            reflection: reflection || null,
            completedAt: new Date().toISOString(),
          },
          ...without,
        ];
      });
      try {
        await fetch('/api/founder-os/reading-progress', {
          method: 'POST',
          headers,
          body: JSON.stringify({ planId, reference, reflection }),
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const unmarkRead = useCallback(
    async (planId: string, reference: string) => {
      setProgress(prev => prev.filter(r => !(r.planId === planId && r.reference === reference)));
      try {
        await fetch(
          `/api/founder-os/reading-progress?planId=${encodeURIComponent(planId)}&reference=${encodeURIComponent(reference)}`,
          { method: 'DELETE', headers }
        );
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  // ── journal ──
  const addJournalEntry = useCallback(
    async (kind: string, body: string, scriptureRef: string) => {
      try {
        const res = await fetch('/api/founder-os/prayer-journal', {
          method: 'POST',
          headers,
          body: JSON.stringify({ kind, body, scriptureRef: scriptureRef || undefined }),
        });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          entry: JournalEntry;
        }> | null;
        if (json?.data?.entry) setJournal(prev => [json.data!.entry, ...prev]);
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const toggleAnswered = useCallback(
    async (id: string, answered: boolean) => {
      setJournal(prev => prev.map(e => (e.id === id ? { ...e, answered } : e)));
      try {
        await fetch('/api/founder-os/prayer-journal', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ id, answered }),
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setJournal(prev => prev.filter(e => e.id !== id));
      try {
        await fetch(`/api/founder-os/prayer-journal?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  // ── today's three (daily-priority goals) ──
  const addGoal = useCallback(
    async (text: string, intention: string, isHighlight: boolean) => {
      if (!today || !text.trim()) return;
      try {
        const res = await fetch('/api/founder-os/daily-goals', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            date: today,
            text: text.trim(),
            intention: intention.trim() || undefined,
            isHighlight,
          }),
        });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          goal: DailyGoal;
        }> | null;
        if (json?.data?.goal) {
          const created = json.data.goal;
          setGoals(prev => {
            // One Highlight per day — demote the others locally to match the server.
            const base = isHighlight
              ? prev.map(g => (g.date === today ? { ...g, isHighlight: false } : g))
              : prev;
            return [...base, created];
          });
        } else {
          void fetchAll(); // cap hit or transient — reconcile
        }
      } catch {
        void fetchAll();
      }
    },
    [headers, today, fetchAll]
  );

  const updateGoal = useCallback(
    async (id: string, patch: DailyGoalPatch) => {
      setGoals(prev => {
        const target = prev.find(g => g.id === id);
        if (!target) return prev;
        return prev.map(g => {
          if (g.id === id) {
            const next: DailyGoal = { ...g, ...patch };
            if (patch.status === 'done') next.completedAt = new Date().toISOString();
            else if (patch.status) next.completedAt = null;
            return next;
          }
          // One Highlight per day — demote the day's other highlight locally.
          if (patch.isHighlight === true && g.date === target.date) {
            return { ...g, isHighlight: false };
          }
          return g;
        });
      });
      try {
        await fetch('/api/founder-os/daily-goals', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ id, ...patch }),
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      try {
        await fetch(`/api/founder-os/daily-goals?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const commitTodayGoals = useCallback(async () => {
    const todays = goals.filter(
      g => g.date === today && (g.status === 'open' || g.status === 'done') && !g.committed
    );
    if (todays.length === 0) return;
    setGoals(prev =>
      prev.map(g =>
        g.date === today && (g.status === 'open' || g.status === 'done')
          ? { ...g, committed: true }
          : g
      )
    );
    try {
      await Promise.all(
        todays.map(g =>
          fetch('/api/founder-os/daily-goals', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ id: g.id, committed: true }),
          })
        )
      );
    } catch {
      void fetchAll();
    }
  }, [goals, today, headers, fetchAll]);

  const todayGoals = useMemo(
    () => goals.filter(g => g.date === today).sort((a, b) => a.rank - b.rank),
    [goals, today]
  );

  const dailyThree = useMemo<DailyThreeSummary>(
    () =>
      summarizeDailyThree(
        goals.map(
          (g): DailyGoalLite => ({
            date: g.date,
            status: g.status,
            isHighlight: g.isHighlight,
            committed: g.committed,
          })
        ),
        today || todayLocalISO()
      ),
    [goals, today]
  );

  const executionCorrelation = useMemo<ExecutionCorrelation>(
    () =>
      computeDisciplineExecutionCorrelation(
        goals.map(
          (g): DailyGoalLite => ({
            date: g.date,
            status: g.status,
            isHighlight: g.isHighlight,
            committed: g.committed,
          })
        ),
        checkins.map((c): CheckinLite => ({ date: c.date, sfcZero: c.sfcZero })),
        today || todayLocalISO()
      ),
    [goals, checkins, today]
  );

  // ── cascade: weekly + quarterly period goals ──
  const weekGoals = useMemo(
    () =>
      periodGoals
        .filter(g => g.period === 'week' && g.periodKey === weekKey)
        .sort((a, b) => a.rank - b.rank),
    [periodGoals, weekKey]
  );
  const quarterGoals = useMemo(
    () =>
      periodGoals
        .filter(g => g.period === 'quarter' && g.periodKey === quarterKey)
        .sort((a, b) => a.rank - b.rank),
    [periodGoals, quarterKey]
  );

  const addPeriodGoal = useCallback(
    async (period: GoalPeriod, periodKey: string, text: string) => {
      if (!text.trim() || !periodKey) return;
      try {
        const res = await fetch('/api/founder-os/period-goals', {
          method: 'POST',
          headers,
          body: JSON.stringify({ period, periodKey, text: text.trim() }),
        });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          goal: PeriodGoal;
        }> | null;
        if (json?.data?.goal) setPeriodGoals(prev => [...prev, json.data!.goal]);
        else void fetchAll();
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const updatePeriodGoal = useCallback(
    async (id: string, patch: Partial<Pick<PeriodGoal, 'status' | 'text' | 'committed'>>) => {
      setPeriodGoals(prev =>
        prev.map(g => {
          if (g.id !== id) return g;
          const next: PeriodGoal = { ...g, ...patch };
          if (patch.status === 'done') next.completedAt = new Date().toISOString();
          else if (patch.status) next.completedAt = null;
          return next;
        })
      );
      try {
        await fetch('/api/founder-os/period-goals', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ id, ...patch }),
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  const deletePeriodGoal = useCallback(
    async (id: string) => {
      setPeriodGoals(prev => prev.filter(g => g.id !== id));
      // Unlink any daily goals that pointed at it (local; server keeps the soft id).
      setGoals(prev =>
        prev.map(g => (g.linkedPeriodGoalId === id ? { ...g, linkedPeriodGoalId: null } : g))
      );
      try {
        await fetch(`/api/founder-os/period-goals?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, fetchAll]
  );

  // ── evening reflection ──
  const saveReflection = useCallback(
    async (moved: string, blocked: string) => {
      if (!today) return;
      setReflection({ date: today, moved: moved.trim() || null, blocked: blocked.trim() || null });
      try {
        await fetch('/api/founder-os/daily-reflections', {
          method: 'POST',
          headers,
          body: JSON.stringify({ date: today, moved, blocked }),
        });
      } catch {
        void fetchAll();
      }
    },
    [headers, today, fetchAll]
  );

  // ── carry a goal forward to tomorrow ──
  const carryToTomorrow = useCallback(
    async (goal: DailyGoal) => {
      if (!today) return;
      const tomorrow = shiftIsoDate(today, 1);
      try {
        const res = await fetch('/api/founder-os/daily-goals', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            date: tomorrow,
            text: goal.text,
            intention: goal.intention ?? undefined,
            linkedPeriodGoalId: goal.linkedPeriodGoalId ?? undefined,
          }),
        });
        if (res.ok) await updateGoal(goal.id, { status: 'carried' });
        void fetchAll(); // pick up tomorrow's row / reconcile if tomorrow was at cap
      } catch {
        void fetchAll();
      }
    },
    [headers, today, updateGoal, fetchAll]
  );

  const toggleSabbath = useCallback(() => {
    const next = !sabbathTaken;
    setSabbathTaken(next);
    try {
      if (next) localStorage.setItem(SABBATH_KEY, weekStartISO());
      else localStorage.removeItem(SABBATH_KEY);
    } catch {
      // non-persistent fallback
    }
  }, [sabbathTaken]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="faith-os-root">
        {/* Hero */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              marginBottom: 6,
            }}
          >
            Foundations · Faith OS
          </div>
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: 'var(--fs-page-h1-platform, clamp(28px, 2.2vw, 40px))',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            Build on the rock.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            The foundation the whole platform is built on. Plan hard, hold the result with open
            hands — your worth is settled before the quarter starts, which is the one thing no
            competitor can copy. Devotion + the wisdom to operate by, in one place.
          </p>
        </div>

        <BibleVersePill />

        <AgencySurrenderSpine />

        {/* Daily spiritual checkin */}
        <DailySpiritualCheckin
          prayer={checkin?.prayer ?? false}
          scripture={checkin?.scripture ?? false}
          saving={savingDiscipline}
          onToggle={toggleDiscipline}
        />

        {/* The cascade — quarter rocks + weekly intentions above today's three */}
        <CascadeSection
          quarterGoals={quarterGoals}
          weekGoals={weekGoals}
          quarterKey={quarterKey}
          weekKey={weekKey}
          onAdd={addPeriodGoal}
          onUpdate={updatePeriodGoal}
          onDelete={deletePeriodGoal}
        />

        {/* Today's Three — daily-priority goal setting */}
        <DailyThreeSection
          todayGoals={todayGoals}
          summary={dailyThree}
          weekGoals={weekGoals}
          correlation={executionCorrelation}
          reflection={reflection}
          onAdd={addGoal}
          onUpdate={updateGoal}
          onDelete={deleteGoal}
          onCommitAll={commitTodayGoals}
          onCarry={carryToTomorrow}
          onSaveReflection={saveReflection}
        />

        {/* Reading plans */}
        <section>
          <div style={sectionHeadingRow}>
            <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
            <h3 style={sectionHeadingText}>Reading plans</h3>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {READING_PLANS.map(plan => (
              <ReadingPlanCard
                key={plan.id}
                planId={plan.id}
                title={plan.title}
                subtitle={plan.subtitle}
                description={plan.description}
                entries={plan.entries}
                highlightReference={plan.id === 'proverbs' ? proverbsToday : null}
                progressMap={progressMap}
                progressKey={progressKey}
                onMarkRead={markRead}
                onUnmark={unmarkRead}
              />
            ))}
          </div>
        </section>

        {/* Prayer + reflection journal */}
        <PrayerJournalSection
          entries={journal}
          onAdd={addJournalEntry}
          onToggleAnswered={toggleAnswered}
          onDelete={deleteEntry}
        />

        {/* Progress & patterns — dynamic vizs over the journal + reflections */}
        <ProgressAndPatterns progress={faithProgress} />

        {/* Reflection companion — AI synthesis ACROSS journals + reflections */}
        <FaithCompanion headers={headers} />

        {/* Frameworks + theology + anchors */}
        <SuccessScriptureMap />
        <PillarAnchorsSection />
        <FaithAndWorkSection />
        <FoundersOfFaithSection />
        <SabbathCard takenThisWeek={sabbathTaken} onToggle={toggleSabbath} />
        <AntiProsperityGuardrail />
      </div>

      <style>{`
        @media (max-width: 800px) {
          .faith-os-discipline-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

// ─── progress & patterns (dynamic vizs) ─────────────────────────────────

function ProgressAndPatterns({ progress }: { progress: ReturnType<typeof computeFaithProgress> }) {
  const readingDone = progress.readingCompletion.reduce((s, r) => s + r.done, 0);
  const hasDiscipline = progress.disciplineDays.some(d => d.level > 0);
  const empty = progress.totalEntries === 0 && readingDone === 0 && !hasDiscipline;

  return (
    <section>
      <div style={sectionHeadingRow}>
        <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>Progress &amp; patterns</h3>
      </div>
      <FaithVizStyles />
      {empty ? (
        <AccentCard accent="muted" title={null}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your patterns appear here as you go — the prayer + scripture heatmap, where your prayers
            land, the prayers you&apos;ve seen answered, reading progress, and the scripture you
            keep returning to. Log a prayer, mark a passage read, or check in above to begin.
          </p>
        </AccentCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FaithStatStrip progress={progress} />
          <AccentCard accent="info" title={null}>
            <DisciplineHeatmap days={progress.disciplineDays} />
          </AccentCard>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <AccentCard accent="primary" title={null}>
              <ActsBalanceBars distribution={progress.actsDistribution} />
            </AccentCard>
            <AccentCard accent="success" title={null}>
              <AnsweredPrayerRing
                answered={progress.answeredCount}
                total={progress.supplicationCount}
              />
            </AccentCard>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <AccentCard accent="info" title={null}>
              <ReadingProgressBars completion={progress.readingCompletion} />
            </AccentCard>
            <AccentCard accent="muted" title={null}>
              <CadenceSparkline cadence={progress.cadence} />
            </AccentCard>
          </div>
          {progress.recurringScripture.length > 0 && (
            <AccentCard accent="info" title={null}>
              <RecurringScriptureChips recurring={progress.recurringScripture} />
            </AccentCard>
          )}
        </div>
      )}
    </section>
  );
}

// ─── reflection companion (AI synthesis across journals + reflections) ──

interface CompanionTheme {
  theme: string;
  evidence: string;
}
interface CompanionSynthesis {
  openingLine: string;
  themes: CompanionTheme[];
  recurringScripture: string[];
  answeredReflection: string | null;
  encouragement: string;
  suggestedFocus: string;
  scriptureForYou: { ref: string; text: string } | null;
}

function FaithCompanion({ headers }: { headers: Record<string, string> }) {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<CompanionSynthesis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-os/faith-companion', { method: 'POST', headers });
      const json = (await res.json().catch(() => null)) as ApiEnvelope<{
        source: string;
        synthesis: CompanionSynthesis;
      }> | null;
      if (json?.data?.synthesis) {
        setSynthesis(json.data.synthesis);
        setSource(json.data.source ?? null);
      } else {
        setError('The companion is unavailable right now. Try again in a moment.');
      }
    } catch {
      setError('The companion is unavailable right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  return (
    <section>
      <div style={sectionHeadingRow}>
        <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>Reflection companion</h3>
      </div>
      <AccentCard accent="primary" title={null}>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          It reads across your prayer journal and your scripture reflections and shows you the
          threads you wouldn&apos;t see yourself — recurring themes, the scripture you keep
          returning to, and the prayers you&apos;ve seen answered. It never promises outcomes; it
          helps you remember who held you.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          style={{ ...smallBtn('primary'), opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <Loader2
                size={14}
                className="faith-spin"
                style={{ verticalAlign: '-3px', marginRight: 6 }}
              />
              Reflecting…
            </>
          ) : (
            <>
              <Sparkles size={14} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              {synthesis ? 'Reflect again' : 'Reflect across my journals'}
            </>
          )}
        </button>

        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--error)' }}>{error}</p>
        )}

        {synthesis && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14.5,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              {synthesis.openingLine}
            </p>

            {synthesis.themes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {synthesis.themes.map((t, i) => (
                  <div
                    key={i}
                    style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: 12 }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.theme}
                    </div>
                    {t.evidence && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.55,
                          marginTop: 2,
                        }}
                      >
                        {t.evidence}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {synthesis.recurringScripture.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {synthesis.recurringScripture.map(ref => (
                  <span
                    key={ref}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--info)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)',
                      background: 'color-mix(in srgb, var(--info) 6%, transparent)',
                    }}
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}

            {synthesis.answeredReflection && (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'color-mix(in srgb, var(--success) 6%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--success) 22%, transparent)',
                }}
              >
                <Check
                  size={14}
                  style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--success)' }}
                />
                {synthesis.answeredReflection}
              </div>
            )}

            {synthesis.encouragement && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {synthesis.encouragement}
              </p>
            )}

            {synthesis.suggestedFocus && (
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Bring before God next: </strong>
                {synthesis.suggestedFocus}
              </div>
            )}

            {synthesis.scriptureForYou && (
              <blockquote
                style={{
                  margin: 0,
                  padding: '10px 14px',
                  borderLeft: '3px solid color-mix(in srgb, var(--info) 45%, transparent)',
                  background: 'color-mix(in srgb, var(--info) 4%, transparent)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                  }}
                >
                  &ldquo;{synthesis.scriptureForYou.text}&rdquo;
                </p>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--info)',
                  }}
                >
                  {synthesis.scriptureForYou.ref}
                </div>
              </blockquote>
            )}

            {(source === 'fallback' || source === 'empty') && (
              <p
                style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}
              >
                Plain tally (AI companion offline). The threads sharpen once it&apos;s connected.
              </p>
            )}
          </div>
        )}
      </AccentCard>
      <style>{`
        .faith-spin { animation: faith-spin 0.8s linear infinite; }
        @keyframes faith-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .faith-spin { animation: none; } }
      `}</style>
    </section>
  );
}

// ─── daily spiritual checkin ────────────────────────────────────────────

function DailySpiritualCheckin({
  prayer,
  scripture,
  saving,
  onToggle,
}: {
  prayer: boolean;
  scripture: boolean;
  saving: 'prayer' | 'scripture' | null;
  onToggle: (field: 'prayer' | 'scripture') => void;
}) {
  return (
    <AccentCard accent="primary" title="Today's spiritual checkin">
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Tracked alongside your cognitive pillars in the Founder OS streak. Faith in your operating
        loop, not beside it.
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        className="faith-os-discipline-row"
      >
        <DisciplineToggle
          icon={<Heart size={18} />}
          label="Prayer"
          sublabel="Spent deliberate time in prayer"
          active={prayer}
          busy={saving === 'prayer'}
          onClick={() => onToggle('prayer')}
        />
        <DisciplineToggle
          icon={<BookOpen size={18} />}
          label="Scripture"
          sublabel="Read scripture / engaged the plan"
          active={scripture}
          busy={saving === 'scripture'}
          onClick={() => onToggle('scripture')}
        />
      </div>
    </AccentCard>
  );
}

function DisciplineToggle({
  icon,
  label,
  sublabel,
  active,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${active ? 'color-mix(in srgb, var(--accent-primary) 45%, transparent)' : 'var(--border-color)'}`,
        background: active
          ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))'
          : 'var(--bg-card)',
        cursor: busy ? 'wait' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <span
        style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex' }}
      >
        {active ? <CheckCircle2 size={18} /> : icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{sublabel}</span>
      </span>
    </button>
  );
}

// ─── reading plan card ──────────────────────────────────────────────────

function ReadingPlanCard({
  planId,
  title,
  subtitle,
  description,
  entries,
  highlightReference,
  progressMap,
  progressKey,
  onMarkRead,
  onUnmark,
}: {
  planId: string;
  title: string;
  subtitle: string;
  description: string;
  entries: ReadonlyArray<{ reference: string; hook: string }>;
  highlightReference: string | null;
  progressMap: Map<string, ReadingProgressRow>;
  progressKey: (planId: string, reference: string) => string;
  onMarkRead: (planId: string, reference: string, reflection: string) => void;
  onUnmark: (planId: string, reference: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(highlightReference);
  const doneCount = entries.filter(e => progressMap.has(progressKey(planId, e.reference))).length;

  return (
    <AccentCard accent="info" title={null}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: 'var(--fs-md, 18px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h4>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)' }}>
          {doneCount} / {entries.length} read
        </div>
      </div>
      <p
        style={{
          margin: '8px 0 12px',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(entry => {
          const row = progressMap.get(progressKey(planId, entry.reference));
          const isDone = !!row;
          const isHighlight = entry.reference === highlightReference;
          const isOpen = expanded === entry.reference;
          return (
            <div
              key={entry.reference}
              style={{
                border: `1px solid ${isHighlight ? 'color-mix(in srgb, var(--accent-primary) 40%, transparent)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                background: isHighlight
                  ? 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-card))'
                  : 'var(--bg-card)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
                <button
                  type="button"
                  onClick={() =>
                    isDone
                      ? onUnmark(planId, entry.reference)
                      : onMarkRead(planId, entry.reference, '')
                  }
                  aria-label={isDone ? 'Mark unread' : 'Mark read'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: 0,
                    color: isDone ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : entry.reference)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                  }}
                  aria-expanded={isOpen}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {entry.reference}
                    </span>
                    {isHighlight && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        Today
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    {entry.hook}
                  </span>
                </button>
                <ChevronDown
                  size={15}
                  style={{
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.18s ease',
                  }}
                />
              </div>
              {isOpen && (
                <div style={{ padding: '0 12px 12px 38px' }}>
                  <ReflectionEditor
                    initial={row?.reflection ?? ''}
                    onSave={reflection => onMarkRead(planId, entry.reference, reflection)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AccentCard>
  );
}

function ReflectionEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <textarea
        value={text}
        onChange={e => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="A line from memory — what landed, what it means for this week (optional). Marks the passage read."
        rows={2}
        style={textareaStyle}
      />
      <button
        type="button"
        onClick={() => {
          onSave(text);
          setSaved(true);
        }}
        style={smallBtn('primary')}
      >
        {saved ? (
          <>
            <Check size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Saved &amp; marked read
          </>
        ) : (
          'Save reflection + mark read'
        )}
      </button>
    </div>
  );
}

// ─── prayer + reflection journal ────────────────────────────────────────

const KIND_META: Record<string, { label: string; color: string }> = {
  adoration: { label: 'Adoration', color: 'var(--accent-primary)' },
  confession: { label: 'Confession', color: 'var(--warning)' },
  thanksgiving: { label: 'Thanksgiving', color: 'var(--success)' },
  supplication: { label: 'Supplication', color: 'var(--info)' },
  reflection: { label: 'Reflection', color: 'var(--text-muted)' },
};

function PrayerJournalSection({
  entries,
  onAdd,
  onToggleAnswered,
  onDelete,
}: {
  entries: JournalEntry[];
  onAdd: (kind: string, body: string, scriptureRef: string) => void;
  onToggleAnswered: (id: string, answered: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [kind, setKind] = useState<string>('supplication');
  const [body, setBody] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [showFramework, setShowFramework] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const activeMovement: PrayerMovement | undefined = PRAYER_FRAMEWORK.find(m => m.kind === kind);

  return (
    <section>
      <div style={sectionHeadingRow}>
        <Heart size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>Prayer &amp; reflection journal</h3>
      </div>

      <AccentCard accent="primary" title={null}>
        {/* ACTS framework toggle */}
        <button
          type="button"
          onClick={() => setShowFramework(s => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--accent-primary)',
            fontSize: 12.5,
            fontWeight: 700,
            marginBottom: showFramework ? 10 : 12,
          }}
        >
          <Sun size={14} />
          The ACTS framework {showFramework ? '— hide' : '— how to pray through this'}
          <ChevronDown
            size={14}
            style={{
              transform: showFramework ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease',
            }}
          />
        </button>
        {showFramework && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            {PRAYER_FRAMEWORK.map(m => (
              <div key={m.kind} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    color: KIND_META[m.kind].color,
                    border: `1.5px solid ${KIND_META[m.kind].color}`,
                  }}
                >
                  {m.letter}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {m.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Composer */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {PRAYER_FRAMEWORK.map(m => (
            <button
              key={m.kind}
              type="button"
              onClick={() => setKind(m.kind)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                border: `1px solid ${kind === m.kind ? KIND_META[m.kind].color : 'var(--border-color)'}`,
                background:
                  kind === m.kind
                    ? `color-mix(in srgb, ${KIND_META[m.kind].color} 12%, transparent)`
                    : 'var(--bg-card)',
                color: kind === m.kind ? KIND_META[m.kind].color : 'var(--text-secondary)',
              }}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setKind('reflection')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              border: `1px solid ${kind === 'reflection' ? KIND_META.reflection.color : 'var(--border-color)'}`,
              background:
                kind === 'reflection'
                  ? 'color-mix(in srgb, var(--text-muted) 12%, transparent)'
                  : 'var(--bg-card)',
              color: kind === 'reflection' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Reflection
          </button>
        </div>

        {activeMovement && activeMovement.prompts.length > 0 && (
          <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
            {activeMovement.prompts.map(p => (
              <li key={p} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {p}
              </li>
            ))}
          </ul>
        )}

        <input
          type="text"
          value={scriptureRef}
          onChange={e => setScriptureRef(e.target.value)}
          placeholder="Anchor verse (optional) — e.g. Proverbs 3:5-6"
          style={{ ...textareaStyle, minHeight: 'auto', height: 36, marginBottom: 8 }}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={
            kind === 'supplication'
              ? 'What are you asking for? You can mark it answered later.'
              : 'Write it out…'
          }
          rows={3}
          style={textareaStyle}
        />
        <button
          type="button"
          disabled={!body.trim()}
          onClick={() => {
            if (!body.trim()) return;
            onAdd(kind, body.trim(), scriptureRef.trim());
            setBody('');
            setScriptureRef('');
          }}
          style={{ ...smallBtn('primary'), opacity: body.trim() ? 1 : 0.5 }}
        >
          <Plus size={14} style={{ verticalAlign: '-3px', marginRight: 4 }} />
          Add to journal
        </button>
      </AccentCard>

      {/* Entries */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {entries.map(e => {
            const meta = KIND_META[e.kind] ?? KIND_META.reflection;
            return (
              <div
                key={e.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${meta.color}`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    {e.scriptureRef && (
                      <span style={{ fontSize: 11.5, color: 'var(--info)', fontWeight: 600 }}>
                        {e.scriptureRef}
                      </span>
                    )}
                    {e.answered && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--success)',
                        }}
                      >
                        ✓ Answered
                      </span>
                    )}
                  </div>
                  {confirmingDelete === e.id ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => onDelete(e.id)}
                        style={smallBtn('danger')}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(null)}
                        style={smallBtn('muted')}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(e.id)}
                      aria-label="Delete entry"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        padding: 2,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {e.body}
                </p>
                {e.kind === 'supplication' && (
                  <button
                    type="button"
                    onClick={() => onToggleAnswered(e.id, !e.answered)}
                    style={{ ...smallBtn(e.answered ? 'muted' : 'success'), marginTop: 8 }}
                  >
                    {e.answered ? 'Mark unanswered' : 'Mark answered'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── today's three (daily-priority goals) ───────────────────────────────

const GOAL_STATUS_META: Record<DailyGoalStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--text-muted)' },
  done: { label: 'Done', color: 'var(--success)' },
  carried: { label: 'Carried', color: 'var(--warning)' },
  released: { label: 'Released', color: 'var(--info)' },
};

function DailyThreeSection({
  todayGoals,
  summary,
  weekGoals,
  correlation,
  reflection,
  onAdd,
  onUpdate,
  onDelete,
  onCommitAll,
  onCarry,
  onSaveReflection,
}: {
  todayGoals: DailyGoal[];
  summary: DailyThreeSummary;
  weekGoals: PeriodGoal[];
  correlation: ExecutionCorrelation;
  reflection: DailyReflection | null;
  onAdd: (text: string, intention: string, isHighlight: boolean) => void;
  onUpdate: (id: string, patch: DailyGoalPatch) => void;
  onDelete: (id: string) => void;
  onCommitAll: () => void;
  onCarry: (goal: DailyGoal) => void;
  onSaveReflection: (moved: string, blocked: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const activeGoals = todayGoals.filter(g => g.status === 'open' || g.status === 'done');
  const closedGoals = todayGoals.filter(g => g.status === 'carried' || g.status === 'released');
  const hasActive = activeGoals.length > 0;
  const highlightTaken = activeGoals.some(g => g.isHighlight);

  return (
    <section>
      <div style={sectionHeadingRow}>
        <Target size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>Today&apos;s three</h3>
      </div>

      <AccentCard accent="primary" title={null}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          The (at most) three priorities that would make today a win. Three is the cap, not a
          shortfall — the science and the scripture point the same way: plan with clarity, hold the
          result with open hands.
        </p>
        <button
          type="button"
          onClick={() => setShowWhy(s => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--accent-primary)',
            fontSize: 12.5,
            fontWeight: 700,
            marginBottom: 14,
          }}
          aria-expanded={showWhy}
        >
          <Sparkles size={13} />
          {showWhy ? 'Why three? — hide' : 'Why three? — the research + the frame'}
          <ChevronDown
            size={14}
            style={{
              transform: showWhy ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease',
            }}
          />
        </button>
        {showWhy && <WhyThreePanel />}

        {/* the three slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeGoals.map((g, i) => (
            <GoalRow
              key={g.id}
              goal={g}
              slot={i + 1}
              weekGoals={weekGoals}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCarry={onCarry}
            />
          ))}

          {summary.slotsLeft > 0 ? (
            <AddGoalForm
              slot={activeGoals.length + 1}
              allowHighlight={!highlightTaken}
              onAdd={onAdd}
            />
          ) : (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                lineHeight: 1.5,
              }}
            >
              Three set. A fourth waits for tomorrow — that is the point. Finish, carry, or release
              one to open a slot.
            </div>
          )}
        </div>

        {/* commit to the Lord (Prov 16:3) */}
        {hasActive &&
          (summary.todayCommitted ? (
            <div
              style={{
                marginTop: 14,
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 22%, transparent)',
              }}
            >
              <Hand
                size={14}
                style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--accent-primary)' }}
              />
              Committed today. &ldquo;Commit your work to the LORD, and your plans will be
              established.&rdquo;{' '}
              <span style={{ color: 'var(--info)', fontWeight: 600 }}>Proverbs 16:3</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onCommitAll}
              style={{ ...smallBtn('primary'), marginTop: 14 }}
            >
              <Hand size={14} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Commit today&apos;s three to the Lord
            </button>
          ))}

        {/* carried / released, kept honest in a quiet list */}
        {closedGoals.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              Carried &amp; released
            </div>
            {closedGoals.map(g => (
              <ClosedGoalRow key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </AccentCard>

      {/* evening reflection — the 60-second close */}
      <div style={{ marginTop: 14 }}>
        <EveningReflectionCard reflection={reflection} onSave={onSaveReflection} />
      </div>

      {/* stats + 30-day heatmap + discipline→execution correlation */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DailyThreeStatStrip summary={summary} />
        <DisciplineExecutionTile correlation={correlation} />
        <AccentCard accent="info" title={null}>
          <DailyThreeHeatmap perDay={summary.perDay} />
        </AccentCard>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .daily-three-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function GoalRow({
  goal,
  slot,
  weekGoals,
  onUpdate,
  onDelete,
  onCarry,
}: {
  goal: DailyGoal;
  slot: number;
  weekGoals: PeriodGoal[];
  onUpdate: (id: string, patch: DailyGoalPatch) => void;
  onDelete: (id: string) => void;
  onCarry: (goal: DailyGoal) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  const [intention, setIntention] = useState(goal.intention ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState(goal.scheduledFor ?? '');
  const done = goal.status === 'done';
  const linkedWeek = weekGoals.find(w => w.id === goal.linkedPeriodGoalId) ?? null;

  return (
    <div
      style={{
        border: `1px solid ${goal.isHighlight ? 'color-mix(in srgb, var(--accent-primary) 40%, transparent)' : 'var(--border-color)'}`,
        borderLeft: `3px solid ${goal.isHighlight ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        background: goal.isHighlight
          ? 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-card))'
          : 'var(--bg-card)',
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          type="button"
          onClick={() => onUpdate(goal.id, { status: done ? 'open' : 'done' })}
          aria-label={done ? 'Mark not done' : 'Mark done'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginTop: 1,
            display: 'flex',
            color: done ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <>
              <input
                type="text"
                value={text}
                maxLength={280}
                onChange={e => setText(e.target.value)}
                style={{ ...textareaStyle, height: 34, minHeight: 'auto', marginBottom: 6 }}
              />
              <input
                type="text"
                value={intention}
                maxLength={400}
                onChange={e => setIntention(e.target.value)}
                placeholder="If-then plan (optional) — e.g. If it's 9am, then I draft the synergy section first."
                style={{ ...textareaStyle, height: 34, minHeight: 'auto' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (text.trim()) onUpdate(goal.id, { text: text.trim(), intention });
                    setEditing(false);
                  }}
                  style={smallBtn('primary')}
                >
                  <Check size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText(goal.text);
                    setIntention(goal.intention ?? '');
                    setEditing(false);
                  }}
                  style={smallBtn('muted')}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                  }}
                >
                  #{slot}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: done ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}
                >
                  {goal.text}
                </span>
                {goal.isHighlight && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--accent-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Star size={11} style={{ fill: 'var(--accent-primary)' }} /> Highlight
                  </span>
                )}
                {goal.committed && (
                  <Hand
                    size={12}
                    style={{ color: 'var(--accent-primary)' }}
                    aria-label="Committed"
                  />
                )}
              </div>
              {goal.intention && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginTop: 3,
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--info)' }}>If-then · </span>
                  {goal.intention}
                </div>
              )}
              {(linkedWeek || goal.scheduledFor) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {linkedWeek && (
                    <span style={metaChip('info')}>
                      <Link2 size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                      Serves: {linkedWeek.text}
                    </span>
                  )}
                  {goal.scheduledFor && (
                    <span style={metaChip('muted')}>
                      <Clock size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />
                      {goal.scheduledFor}
                    </span>
                  )}
                </div>
              )}
              {/* actions */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <GoalAction
                  icon={<Star size={12} />}
                  label={goal.isHighlight ? 'Unstar' : 'Highlight'}
                  active={goal.isHighlight}
                  onClick={() => onUpdate(goal.id, { isHighlight: !goal.isHighlight })}
                />
                <GoalAction
                  icon={<Pencil size={12} />}
                  label="Edit"
                  onClick={() => setEditing(true)}
                />
                <GoalAction
                  icon={<ArrowRight size={12} />}
                  label="Carry to tomorrow"
                  onClick={() => onCarry(goal)}
                />
                <GoalAction
                  icon={<Hand size={12} />}
                  label="Release"
                  onClick={() => onUpdate(goal.id, { status: 'released' })}
                />
                {confirmingDelete ? (
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onDelete(goal.id)}
                      style={tinyBtn('danger')}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      style={tinyBtn('muted')}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <GoalAction
                    icon={<Trash2 size={12} />}
                    label="Delete"
                    onClick={() => setConfirmingDelete(true)}
                  />
                )}
              </div>
              {/* cascade link + Highlight time-block */}
              {(weekGoals.length > 0 || goal.isHighlight) && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  {weekGoals.length > 0 && (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Link2 size={11} /> Serves
                      <select
                        value={goal.linkedPeriodGoalId ?? ''}
                        onChange={e =>
                          onUpdate(goal.id, { linkedPeriodGoalId: e.target.value || null })
                        }
                        style={selectStyle}
                      >
                        <option value="">— nothing yet</option>
                        {weekGoals.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.text.slice(0, 60)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {goal.isHighlight &&
                    (editingSchedule ? (
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          value={scheduleDraft}
                          maxLength={120}
                          placeholder="when? e.g. 9:00-10:30"
                          autoFocus
                          onChange={e => setScheduleDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              onUpdate(goal.id, { scheduledFor: scheduleDraft || null });
                              setEditingSchedule(false);
                            }
                          }}
                          style={{
                            ...textareaStyle,
                            height: 28,
                            minHeight: 'auto',
                            width: 160,
                            padding: '4px 8px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdate(goal.id, { scheduledFor: scheduleDraft || null });
                            setEditingSchedule(false);
                          }}
                          style={tinyBtn('primary')}
                        >
                          Set
                        </button>
                      </span>
                    ) : (
                      <GoalAction
                        icon={<Clock size={12} />}
                        label={goal.scheduledFor ? 'Reschedule' : 'Block a time'}
                        onClick={() => {
                          setScheduleDraft(goal.scheduledFor ?? '');
                          setEditingSchedule(true);
                        }}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small read-only chip used in goal rows (linked-goal / schedule). */
function metaChip(tone: 'info' | 'muted'): React.CSSProperties {
  const color = tone === 'info' ? 'var(--info)' : 'var(--text-muted)';
  return {
    fontSize: 11,
    fontWeight: 600,
    color,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
    background: `color-mix(in srgb, ${color} 7%, transparent)`,
  };
}

const selectStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 6px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  maxWidth: 220,
};

function GoalAction({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11.5,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        border: `1px solid ${active ? 'color-mix(in srgb, var(--accent-primary) 40%, transparent)' : 'var(--border-color)'}`,
        background: active
          ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
          : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ClosedGoalRow({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: DailyGoal;
  onUpdate: (
    id: string,
    patch: Partial<Pick<DailyGoal, 'status' | 'text' | 'intention' | 'isHighlight' | 'committed'>>
  ) => void;
  onDelete: (id: string) => void;
}) {
  const meta = GOAL_STATUS_META[goal.status];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        color: 'var(--text-muted)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}
    >
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: meta.color,
          flexShrink: 0,
        }}
      >
        {meta.label}
      </span>
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>{goal.text}</span>
      <button
        type="button"
        onClick={() => onUpdate(goal.id, { status: 'open' })}
        style={tinyBtn('muted')}
        title="Reopen"
      >
        Reopen
      </button>
      <button
        type="button"
        onClick={() => onDelete(goal.id)}
        aria-label="Delete"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          padding: 2,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function AddGoalForm({
  slot,
  allowHighlight,
  onAdd,
}: {
  slot: number;
  allowHighlight: boolean;
  onAdd: (text: string, intention: string, isHighlight: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [intention, setIntention] = useState('');
  const [showIntention, setShowIntention] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), intention, highlight && allowHighlight);
    setText('');
    setIntention('');
    setShowIntention(false);
    setHighlight(false);
  };

  return (
    <div
      style={{
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        background: 'var(--bg-card)',
      }}
    >
      <input
        type="text"
        value={text}
        maxLength={280}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={`Priority #${slot} — make it specific and finishable`}
        style={{ ...textareaStyle, height: 36, minHeight: 'auto' }}
      />
      {showIntention && (
        <input
          type="text"
          value={intention}
          maxLength={400}
          onChange={e => setIntention(e.target.value)}
          placeholder="If {when/where}, then I will {action} — e.g. If it's 9am, then I draft the deck first"
          style={{ ...textareaStyle, height: 36, minHeight: 'auto', marginTop: 6 }}
        />
      )}
      <div
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}
      >
        <button
          type="button"
          disabled={!text.trim()}
          onClick={submit}
          style={{ ...smallBtn('primary'), marginTop: 0, opacity: text.trim() ? 1 : 0.5 }}
        >
          <Plus size={14} style={{ verticalAlign: '-3px', marginRight: 4 }} />
          Add priority
        </button>
        {!showIntention && (
          <button type="button" onClick={() => setShowIntention(true)} style={tinyBtn('muted')}>
            + If-then plan
          </button>
        )}
        {allowHighlight && (
          <button
            type="button"
            onClick={() => setHighlight(h => !h)}
            style={tinyBtn(highlight ? 'primary' : 'muted')}
          >
            <Star
              size={12}
              style={{
                verticalAlign: '-2px',
                marginRight: 3,
                fill: highlight ? 'var(--accent-primary)' : 'none',
              }}
            />
            {highlight ? 'Highlight' : 'Make Highlight'}
          </button>
        )}
      </div>
    </div>
  );
}

function DailyThreeStatStrip({ summary }: { summary: DailyThreeSummary }) {
  const tiles = [
    {
      icon: <Flame size={16} />,
      value: `${summary.currentStreak}`,
      label: summary.currentStreak === 1 ? 'day streak' : 'day streak',
      sub: 'days you showed up',
      accent: 'var(--accent-primary)',
    },
    {
      icon: <CheckCircle2 size={16} />,
      value: `${Math.round(summary.completionRate * 100)}%`,
      label: 'completed',
      sub: 'last 30 days',
      accent: 'var(--success)',
    },
    {
      icon: <Star size={16} />,
      value: summary.highlightDays > 0 ? `${Math.round(summary.highlightHitRate * 100)}%` : '—',
      label: 'Highlight hit',
      sub: `${summary.highlightDays} day${summary.highlightDays === 1 ? '' : 's'} set one`,
      accent: 'var(--info)',
    },
  ];
  return (
    <div
      className="daily-three-stats"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
    >
      {tiles.map((t, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${t.accent}`,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.accent }}>
            {t.icon}
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t.value}
            </span>
          </div>
          <div
            style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}
          >
            {t.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

function DailyThreeHeatmap({ perDay }: { perDay: DailyThreeSummary['perDay'] }) {
  const anyData = perDay.some(d => d.set > 0);
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        Last 30 days
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {perDay.map(d => {
          const ratio = d.set > 0 ? d.done / d.set : 0;
          const pct = d.set === 0 ? 0 : 16 + Math.round(ratio * 64);
          return (
            <div
              key={d.date}
              title={`${d.date} — ${d.done}/${d.set} done${d.hasHighlight ? (d.highlightDone ? ' · Highlight hit' : ' · Highlight set') : ''}`}
              style={{
                width: 15,
                height: 15,
                borderRadius: 4,
                background:
                  d.set === 0
                    ? 'var(--bg-secondary)'
                    : `color-mix(in srgb, var(--accent-primary) ${pct}%, transparent)`,
                border:
                  d.set === 0
                    ? '1px solid var(--border-color)'
                    : d.highlightDone
                      ? '1px solid var(--accent-primary)'
                      : '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                boxShadow: d.highlightDone
                  ? '0 0 0 1px color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                  : 'none',
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
        {anyData
          ? 'Each square is a day; fuller green = more of the three completed. A ring marks a day the Highlight landed.'
          : 'Set today’s three to start the record. The streak rewards showing up, not perfection.'}
      </div>
    </div>
  );
}

function WhyThreePanel() {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <div
          style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}
        >
          {WHY_THREE.headline}
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {WHY_THREE.body}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DAILY_THREE_PRINCIPLES.map(p => (
          <div
            key={p.id}
            style={{
              borderLeft: '3px solid color-mix(in srgb, var(--accent-primary) 45%, transparent)',
              paddingLeft: 12,
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {p.principle}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.source}</div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginTop: 4,
              }}
            >
              {p.coreIdea}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginTop: 4,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                In practice ·{' '}
              </span>
              {p.inPractice}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginTop: 4,
                paddingTop: 4,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--info)' }}>{p.scriptureRef} · </span>
              <span style={{ fontStyle: 'italic' }}>{p.faithFrame}</span>
            </div>
          </div>
        ))}
      </div>

      {/* the commit/release spine */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          {DAILY_THREE_COMMIT.title}
        </div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {DAILY_THREE_COMMIT.body}
        </p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          {DAILY_THREE_COMMIT.releaseNote}
        </p>
      </div>

      {/* the ritual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DAILY_THREE_RITUAL.map(r => (
          <div key={r.when} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-primary)',
                flexShrink: 0,
                width: 130,
              }}
            >
              {r.when}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {r.step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── the cascade (weekly + quarterly period goals) ──────────────────────

function CascadeSection({
  quarterGoals,
  weekGoals,
  quarterKey,
  weekKey,
  onAdd,
  onUpdate,
  onDelete,
}: {
  quarterGoals: PeriodGoal[];
  weekGoals: PeriodGoal[];
  quarterKey: string;
  weekKey: string;
  onAdd: (period: GoalPeriod, periodKey: string, text: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<PeriodGoal, 'status' | 'text' | 'committed'>>) => void;
  onDelete: (id: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <section>
      <div style={sectionHeadingRow}>
        <Layers size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>The cascade</h3>
      </div>
      <AccentCard accent="info" title={null}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {CASCADE_FRAME.headline} Today&apos;s three should move the week; the week should move the
          quarter.
        </p>
        <button
          type="button"
          onClick={() => setShowWhy(s => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--info)',
            fontSize: 12.5,
            fontWeight: 700,
            marginBottom: 14,
          }}
          aria-expanded={showWhy}
        >
          Why the cascade?
          <ChevronDown
            size={14}
            style={{
              transform: showWhy ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease',
            }}
          />
        </button>
        {showWhy && (
          <div
            style={{
              marginBottom: 14,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p
              style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              {CASCADE_FRAME.body}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--info)' }}>
                {CASCADE_FRAME.scriptureRef} ·{' '}
              </span>
              <span style={{ fontStyle: 'italic' }}>{CASCADE_FRAME.faithFrame}</span>
            </p>
          </div>
        )}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
          className="cascade-grid"
        >
          <PeriodGoalsBlock
            period="quarter"
            periodKey={quarterKey}
            label={periodLabel('quarter', quarterKey)}
            tagline="The few rocks for the quarter"
            goals={quarterGoals}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          <PeriodGoalsBlock
            period="week"
            periodKey={weekKey}
            label={periodLabel('week', weekKey)}
            tagline="This week — serving the rocks"
            goals={weekGoals}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </AccentCard>
      <style>{`
        @media (max-width: 800px) {
          .cascade-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function PeriodGoalsBlock({
  period,
  periodKey,
  label,
  tagline,
  goals,
  onAdd,
  onUpdate,
  onDelete,
}: {
  period: GoalPeriod;
  periodKey: string;
  label: string;
  tagline: string;
  goals: PeriodGoal[];
  onAdd: (period: GoalPeriod, periodKey: string, text: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<PeriodGoal, 'status' | 'text' | 'committed'>>) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const active = goals.filter(g => isActivePeriodStatus(g.status));
  const slotsLeft = periodSlotsLeft(goals.map(g => ({ status: g.status })));

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tagline}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)' }}>
          {active.length} / {PERIOD_GOAL_MAX}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {active.map(g => (
          <PeriodGoalRow key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
        {slotsLeft > 0 ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <input
              type="text"
              value={draft}
              maxLength={280}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && draft.trim()) {
                  onAdd(period, periodKey, draft.trim());
                  setDraft('');
                }
              }}
              placeholder={
                period === 'quarter' ? 'A rock for the quarter…' : 'An intention for the week…'
              }
              style={{ ...textareaStyle, height: 32, minHeight: 'auto', flex: 1 }}
            />
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => {
                if (!draft.trim()) return;
                onAdd(period, periodKey, draft.trim());
                setDraft('');
              }}
              style={{ ...tinyBtn('info'), opacity: draft.trim() ? 1 : 0.5 }}
            >
              <Plus size={12} style={{ verticalAlign: '-2px' }} />
            </button>
          </div>
        ) : (
          <div
            style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}
          >
            Three set — the few rocks stay few.
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodGoalRow({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: PeriodGoal;
  onUpdate: (id: string, patch: Partial<Pick<PeriodGoal, 'status' | 'text' | 'committed'>>) => void;
  onDelete: (id: string) => void;
}) {
  const done = goal.status === 'done';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <button
        type="button"
        onClick={() => onUpdate(goal.id, { status: done ? 'open' : 'done' })}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginTop: 1,
          display: 'flex',
          color: done ? 'var(--success)' : 'var(--text-muted)',
        }}
      >
        {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontWeight: 600,
          color: done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}
      >
        {goal.text}
      </span>
      <button
        type="button"
        onClick={() => onDelete(goal.id)}
        aria-label="Delete"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          padding: 1,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── evening reflection ──────────────────────────────────────────────────

function EveningReflectionCard({
  reflection,
  onSave,
}: {
  reflection: DailyReflection | null;
  onSave: (moved: string, blocked: string) => void;
}) {
  const [moved, setMoved] = useState(reflection?.moved ?? '');
  const [blocked, setBlocked] = useState(reflection?.blocked ?? '');
  const [saved, setSaved] = useState(false);

  // Seed the editable fields when the server row arrives, without clobbering
  // in-progress typing (the `|| prev` guard). React's "adjust state during
  // render when a prop changes" pattern — the sanctioned alternative to a
  // setState-in-effect (react.dev/learn/you-might-not-need-an-effect). Fires
  // only when the reflection identity changes (load, or save → new object),
  // so there is no render loop.
  const [seededFrom, setSeededFrom] = useState(reflection);
  if (reflection !== seededFrom) {
    setSeededFrom(reflection);
    if (reflection) {
      setMoved(m => m || reflection.moved || '');
      setBlocked(b => b || reflection.blocked || '');
    }
  }

  return (
    <AccentCard accent="muted" title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Moon size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
          {EVENING_REFLECTION.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          · {EVENING_REFLECTION.subtitle}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 3 }}>
            {EVENING_REFLECTION.movedLabel}
          </div>
          <textarea
            value={moved}
            maxLength={2000}
            onChange={e => {
              setMoved(e.target.value);
              setSaved(false);
            }}
            placeholder={EVENING_REFLECTION.movedPlaceholder}
            rows={2}
            style={textareaStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 3 }}>
            {EVENING_REFLECTION.blockedLabel}
          </div>
          <textarea
            value={blocked}
            maxLength={2000}
            onChange={e => {
              setBlocked(e.target.value);
              setSaved(false);
            }}
            placeholder={EVENING_REFLECTION.blockedPlaceholder}
            rows={2}
            style={textareaStyle}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          onSave(moved, blocked);
          setSaved(true);
        }}
        disabled={!moved.trim() && !blocked.trim()}
        style={{ ...smallBtn('primary'), opacity: moved.trim() || blocked.trim() ? 1 : 0.5 }}
      >
        {saved ? (
          <>
            <Check size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Saved
          </>
        ) : (
          'Save the close'
        )}
      </button>
      <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        <span style={{ fontWeight: 700, color: 'var(--info)' }}>
          {EVENING_REFLECTION.scriptureRef} ·{' '}
        </span>
        {EVENING_REFLECTION.note}
      </p>
    </AccentCard>
  );
}

// ─── discipline → execution correlation ──────────────────────────────────

function DisciplineExecutionTile({ correlation }: { correlation: ExecutionCorrelation }) {
  if (!correlation.hasSignal) {
    return (
      <AccentCard accent="muted" title={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <TrendingUp size={15} style={{ color: 'var(--text-muted)' }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            Discipline → execution
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Once you&apos;ve logged a few SFC-zero days and a few non-zero days (each with the
          day&apos;s three set), this shows whether cutting short-form content tracks with finishing
          more of them — your own base rate, not a claim. Keep going.
        </p>
      </AccentCard>
    );
  }
  const z = Math.round(correlation.sfcZeroCompletion * 100);
  const o = Math.round(correlation.otherCompletion * 100);
  const deltaPts = Math.round(correlation.delta * 100);
  const positive = deltaPts >= 0;
  return (
    <AccentCard accent={positive ? 'success' : 'warning'} title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <TrendingUp
          size={15}
          style={{ color: positive ? 'var(--success)' : 'var(--warning)' }}
          aria-hidden
        />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
          Discipline → execution
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <CorrelationStat label="On SFC-zero days" pct={z} accent="var(--success)" />
        <CorrelationStat label="On other days" pct={o} accent="var(--text-muted)" />
      </div>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        On the days you cut short-form content you complete <strong>{z}%</strong> of your three, vs{' '}
        <strong>{o}%</strong> otherwise — a {Math.abs(deltaPts)}-point {positive ? 'lift' : 'drop'}.
      </p>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        {correlation.sfcZeroDays} zero-day{correlation.sfcZeroDays === 1 ? '' : 's'} ·{' '}
        {correlation.otherDays} other day{correlation.otherDays === 1 ? '' : 's'} · last 30
      </div>
    </AccentCard>
  );
}

function CorrelationStat({ label, pct, accent }: { label: string; pct: number; accent: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{pct}%</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: 'var(--bg-secondary)',
          marginTop: 5,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: accent }} />
      </div>
    </div>
  );
}

// ─── shared styles ──────────────────────────────────────────────────────

const sectionHeadingRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
};

const sectionHeadingText: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--fs-md, 18px)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
  lineHeight: 1.5,
  resize: 'vertical',
  boxSizing: 'border-box',
};

function smallBtn(tone: 'primary' | 'success' | 'danger' | 'muted'): React.CSSProperties {
  const color =
    tone === 'primary'
      ? 'var(--accent-primary)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'danger'
          ? 'var(--error)'
          : 'var(--text-muted)';
  return {
    marginTop: 8,
    fontSize: 12.5,
    fontWeight: 700,
    padding: '7px 14px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
    background: `color-mix(in srgb, ${color} 10%, transparent)`,
    color,
  };
}

/** Compact inline button (no top margin) for goal-row + add-form actions. */
function tinyBtn(tone: 'primary' | 'success' | 'danger' | 'muted' | 'info'): React.CSSProperties {
  const color =
    tone === 'primary'
      ? 'var(--accent-primary)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'danger'
          ? 'var(--error)'
          : tone === 'info'
            ? 'var(--info)'
            : 'var(--text-muted)';
  return {
    fontSize: 11.5,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
    background: `color-mix(in srgb, ${color} 10%, transparent)`,
    color,
  };
}
