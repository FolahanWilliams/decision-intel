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
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Heart,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { BibleVersePill } from '@/components/founder-hub/founder-os/sections';
import {
  READING_PLANS,
  PRAYER_FRAMEWORK,
  type PrayerMovement,
} from '@/components/founder-hub/faith-os/content';
import {
  AgencySurrenderSpine,
  AntiProsperityGuardrail,
  FaithAndWorkSection,
  FoundersOfFaithSection,
  PillarAnchorsSection,
  SabbathCard,
  SuccessScriptureMap,
} from '@/components/founder-hub/faith-os/sections';

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
  const [progress, setProgress] = useState<ReadingProgressRow[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [savingDiscipline, setSavingDiscipline] = useState<'prayer' | 'scripture' | null>(null);

  const [sabbathTaken, setSabbathTaken] = useState(false);

  // ── load ──
  const fetchAll = useCallback(async () => {
    try {
      const [cRes, pRes, jRes] = await Promise.all([
        fetch('/api/founder-os/checkins?days=2', { cache: 'no-store', headers }),
        fetch('/api/founder-os/reading-progress', { cache: 'no-store', headers }),
        fetch('/api/founder-os/prayer-journal?limit=200', { cache: 'no-store', headers }),
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
      const todayRow = (cJson?.data?.checkins ?? []).find(c => c.date === today) ?? null;
      setCheckin(todayRow);
      setProgress(pJson?.data?.progress ?? []);
      setJournal(jJson?.data?.entries ?? []);
    } catch {
      // @schema-drift-tolerant — render the static surfaces even if the API is cold.
    }
  }, [headers, today]);

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
