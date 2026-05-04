'use client';

/**
 * GTM v3.5 §11 Founder Operating System (RATIFIED 2026-05-05).
 *
 * The cognitive-discipline surface that supports the Phase 1 motion. v3.5's
 * GTM strategy assumes a solo founder running 5-10 personalised LinkedIn DMs/
 * week + 2 London events/month + Vohra survey discipline + Sankore engagement
 * + outcome capture sustainably for 6 years. That motion is only physically
 * possible with the cognitive hardware to support it.
 *
 * The asymmetric arbitrage: as the cognitive baseline of peers actively falls
 * (Reverse Flynn Effect, prefrontal cortex suppression from short-form video,
 * executive functioning erosion in Gen Z), an individual who refuses
 * algorithmic pacification builds a near-insurmountable competitive
 * advantage WITHOUT having to outwork anyone — they just have to refuse to
 * crash. This is the strongest tailwind v3.5 has and it costs the founder
 * nothing except discipline.
 *
 * The tab is checked once daily — first thing, before LinkedIn, before the
 * dashboard, before email. Daily checkin + SFC-zero streak counter +
 * weekly review prompt + long-form content log + skill acquisition tracker.
 *
 * Persistence: localStorage for now (single-user surface, no backend cost,
 * survives across sessions). Migrating to Prisma is a follow-up if the
 * founder wants permanent records or wants to expose anonymised cohort
 * stats to other founders later.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Shield,
  BookOpen,
  Brain,
  Cpu,
  Activity,
  Target,
  Flame,
  TrendingUp,
  Plus,
  Check,
  X,
  CalendarDays,
} from 'lucide-react';

const STORAGE_KEYS = {
  CHECKINS: 'di-founder-os-checkins-v1',
  CONTENT_LOG: 'di-founder-os-content-log-v1',
  SKILL_TRACKER: 'di-founder-os-skill-tracker-v1',
  WEEKLY_REVIEWS: 'di-founder-os-weekly-reviews-v1',
};

interface DailyCheckin {
  date: string; // YYYY-MM-DD
  sfcZero: boolean;
  deepWorkHours: number;
  deepReadingMinutes: number;
  exercise: boolean;
  meditation: boolean;
  notes?: string;
}

interface ContentLogItem {
  id: string;
  date: string;
  title: string;
  source: string; // YouTube, book, paper, podcast
  durationMin: number;
  activeRecallSummary: string;
}

interface SkillItem {
  id: string;
  quarter: string; // e.g., "Q3 2026"
  skill: string;
  whyItMatters: string;
  preAssessment: string;
  postAssessment?: string;
  status: 'planned' | 'in_progress' | 'complete';
}

interface WeeklyReviewItem {
  id: string;
  weekStartDate: string;
  topLongForm: string; // 3 best long-form pieces
  oneSkillNote: string;
  internalLocusReflection: string;
}

const PILLARS = [
  {
    id: 'neuro',
    icon: Shield,
    title: 'Pillar 1 — Neurobiological Protection',
    rule: 'Zero short-form content. Period.',
    why: 'Algorithmic SFV (TikTok / Reels / Shorts) suppresses prefrontal cortex activity, downregulates executive function, and wires the brain to reject sustained focus — the exact cognitive substrate Phase 1 motion requires. Treat like alcohol for an alcoholic, not sugar for a non-diabetic.',
  },
  {
    id: 'longform',
    icon: BookOpen,
    title: 'Pillar 2 — Long-Form Information Diet',
    rule: '30-minute minimum. Primary sources preferred.',
    why: 'YouTube interviews 30+ min only. Daily deep reading 30-60 min from books, papers, long-form articles — never social or news feeds. Primary sources (Kahneman, Klein, Roger Martin, Dalio) over derivative content. Rule: if it can be tweeted, it isn\'t the source you should be reading.',
  },
  {
    id: 'recall',
    icon: Brain,
    title: 'Pillar 3 — Active Recall + Elaborative Encoding',
    rule: 'Pause + retrieve + connect. Abandon passive consumption.',
    why: 'After every long-form session: explain the core concept aloud OR write it from memory. Connect new insights to existing knowledge or future business decisions. Progressive summarisation: bullet → highlight → distil. The mental strain of retrieval IS the neural-architecture-building exercise.',
  },
  {
    id: 'orchestrate',
    icon: Cpu,
    title: 'Pillar 4 — AI Orchestration (NOT Cognitive Offloading)',
    rule: 'Direct AI; do not query it. Build neural architecture first.',
    why: 'Treat AI as a system to direct, not an oracle. Build foundational neural architecture FIRST, then leverage AI as the multiplier on top. Avoid AI summarisation for foundational learning — the cognitive shortcut steals the architecture-building exercise. The skill is orchestration + auditing, not prompt-engineering.',
  },
  {
    id: 'distress',
    icon: Activity,
    title: 'Pillar 5 — Distress Tolerance + Emotional Regulation',
    rule: 'Daily exercise. Daily mindfulness. Absorb rejection without fragmenting.',
    why: 'Chronic anxiety + panic actively consume working memory, reducing cognitive bandwidth available for complex reasoning under pressure. Phase 1 motion involves rejection (DMs ignored, audits booked then no-show, prospects who stall); the OS must absorb that without fragmenting.',
  },
  {
    id: 'agency',
    icon: Target,
    title: 'Pillar 6 — Internal Locus of Control + High-Agency Framing',
    rule: 'Reject victimhood. Frame challenges as strategic problems.',
    why: 'The macro-environment is undeniably chaotic and structurally flawed. Personal capacity to adapt, learn, and exert discipline remains entirely within control. Weekly "what\'s within my control" review. The framing IS the neurological re-anchor.',
  },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent — localStorage quota / private mode
  }
}

function computeSfcZeroStreak(checkins: DailyCheckin[]): number {
  if (checkins.length === 0) return 0;
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cursor = new Date(todayISO());
  for (const c of sorted) {
    const cursorISO = cursor.toISOString().slice(0, 10);
    if (c.date !== cursorISO) {
      // Allow today to not be filled yet — if we're checking and today's
      // entry doesn't exist, fall back to yesterday as the start.
      if (c.date === new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10) && streak === 0) {
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }
    if (c.sfcZero) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FounderOSTab() {
  const [hydrated, setHydrated] = useState(false);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [contentLog, setContentLog] = useState<ContentLogItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [reviews, setReviews] = useState<WeeklyReviewItem[]>([]);

  // Today's checkin draft
  const [todayDraft, setTodayDraft] = useState<DailyCheckin>({
    date: todayISO(),
    sfcZero: true,
    deepWorkHours: 0,
    deepReadingMinutes: 0,
    exercise: false,
    meditation: false,
    notes: '',
  });

  // Add-content form
  const [contentForm, setContentForm] = useState<Partial<ContentLogItem>>({
    title: '',
    source: 'YouTube',
    durationMin: 30,
    activeRecallSummary: '',
  });
  const [showContentForm, setShowContentForm] = useState(false);

  // Add-skill form
  const [skillForm, setSkillForm] = useState<Partial<SkillItem>>({
    quarter: '',
    skill: '',
    whyItMatters: '',
    preAssessment: '',
    status: 'planned',
  });
  const [showSkillForm, setShowSkillForm] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setCheckins(loadJSON<DailyCheckin[]>(STORAGE_KEYS.CHECKINS, []));
    setContentLog(loadJSON<ContentLogItem[]>(STORAGE_KEYS.CONTENT_LOG, []));
    setSkills(loadJSON<SkillItem[]>(STORAGE_KEYS.SKILL_TRACKER, []));
    setReviews(loadJSON<WeeklyReviewItem[]>(STORAGE_KEYS.WEEKLY_REVIEWS, []));
    setHydrated(true);
  }, []);

  // Pre-load today's existing checkin if any
  useEffect(() => {
    if (!hydrated) return;
    const existing = checkins.find(c => c.date === todayISO());
    if (existing) setTodayDraft(existing);
  }, [hydrated, checkins]);

  const sfcStreak = useMemo(() => computeSfcZeroStreak(checkins), [checkins]);
  const totalCheckins = checkins.length;
  const sfcZeroDays = checkins.filter(c => c.sfcZero).length;
  const adherencePct = totalCheckins === 0 ? 0 : Math.round((sfcZeroDays / totalCheckins) * 100);

  const handleSaveCheckin = useCallback(() => {
    const next = [...checkins.filter(c => c.date !== todayDraft.date), todayDraft];
    setCheckins(next);
    saveJSON(STORAGE_KEYS.CHECKINS, next);
  }, [checkins, todayDraft]);

  const handleAddContent = useCallback(() => {
    if (!contentForm.title?.trim() || !contentForm.activeRecallSummary?.trim()) return;
    const item: ContentLogItem = {
      id: genId(),
      date: todayISO(),
      title: contentForm.title.trim(),
      source: contentForm.source || 'YouTube',
      durationMin: Number(contentForm.durationMin) || 30,
      activeRecallSummary: contentForm.activeRecallSummary.trim(),
    };
    const next = [item, ...contentLog].slice(0, 200);
    setContentLog(next);
    saveJSON(STORAGE_KEYS.CONTENT_LOG, next);
    setContentForm({ title: '', source: 'YouTube', durationMin: 30, activeRecallSummary: '' });
    setShowContentForm(false);
  }, [contentForm, contentLog]);

  const handleAddSkill = useCallback(() => {
    if (!skillForm.skill?.trim() || !skillForm.quarter?.trim()) return;
    const item: SkillItem = {
      id: genId(),
      quarter: skillForm.quarter.trim(),
      skill: skillForm.skill.trim(),
      whyItMatters: skillForm.whyItMatters?.trim() || '',
      preAssessment: skillForm.preAssessment?.trim() || '',
      status: (skillForm.status as SkillItem['status']) || 'planned',
    };
    const next = [item, ...skills];
    setSkills(next);
    saveJSON(STORAGE_KEYS.SKILL_TRACKER, next);
    setSkillForm({ quarter: '', skill: '', whyItMatters: '', preAssessment: '', status: 'planned' });
    setShowSkillForm(false);
  }, [skillForm, skills]);

  const updateSkillStatus = useCallback(
    (id: string, status: SkillItem['status']) => {
      const next = skills.map(s => (s.id === id ? { ...s, status } : s));
      setSkills(next);
      saveJSON(STORAGE_KEYS.SKILL_TRACKER, next);
    },
    [skills]
  );

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Founder OS…
      </div>
    );
  }

  return (
    <div>
      {/* HERO */}
      <div
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 1%, transparent) 100%)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent-primary)',
            marginBottom: 6,
          }}
        >
          GTM v3.5 §11 Founder Operating System · RATIFIED 2026-05-05
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          The cognitive infrastructure that makes the GTM strategy executable.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            margin: '8px 0 0',
            lineHeight: 1.55,
            maxWidth: 760,
          }}
        >
          v3.5 assumes a solo founder running 5-10 personalised LinkedIn DMs/week + 2 London
          events/month + Vohra survey discipline + Sankore engagement + outcome capture
          sustainably for 6 years. That motion is only physically possible with the cognitive
          hardware to support it. The asymmetric arbitrage: as the baseline of your peers actively
          falls, your gap widens daily without you having to run faster — you just have to refuse
          to crash. Check this tab once daily, first thing, before LinkedIn or email.
        </p>
      </div>

      {/* STREAK + TODAY CHECKIN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr',
          gap: 16,
          marginBottom: 20,
        }}
        className="founder-os-grid"
      >
        {/* SFC streak card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${sfcStreak >= 7 ? 'var(--accent-primary)' : sfcStreak >= 3 ? 'var(--warning)' : 'var(--text-muted)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame
              size={18}
              style={{
                color:
                  sfcStreak >= 7
                    ? 'var(--accent-primary)'
                    : sfcStreak >= 3
                      ? 'var(--warning)'
                      : 'var(--text-muted)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              SFC-zero streak
            </span>
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1,
            }}
          >
            {sfcStreak}
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                fontFamily: 'inherit',
                fontWeight: 600,
                marginLeft: 6,
              }}
            >
              day{sfcStreak === 1 ? '' : 's'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {totalCheckins === 0
              ? 'Log today\'s checkin to start the streak.'
              : `${sfcZeroDays} of ${totalCheckins} days SFC-free (${adherencePct}% lifetime adherence)`}
          </div>
          {sfcStreak >= 30 && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent-primary)',
                background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                marginTop: 4,
              }}
            >
              Dopaminergic baseline reset territory · keep going
            </div>
          )}
        </div>

        {/* Today's checkin */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Today&apos;s checkin · {todayISO()}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Five questions, thirty seconds.
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSaveCheckin}
              style={{
                padding: '8px 16px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save checkin
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* SFC = 0 today */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: todayDraft.sfcZero
                  ? 'color-mix(in srgb, var(--success) 8%, transparent)'
                  : 'color-mix(in srgb, var(--error) 8%, transparent)',
                border: `1px solid ${todayDraft.sfcZero ? 'var(--success)' : 'var(--error)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={todayDraft.sfcZero}
                onChange={e => setTodayDraft({ ...todayDraft, sfcZero: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  SFC = 0 today {todayDraft.sfcZero ? '✓' : '× — break logged'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Zero TikTok / Reels / YouTube Shorts. Long-form 30+ min only.
                </div>
              </div>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Deep work hours
                </span>
                <input
                  type="number"
                  min={0}
                  max={16}
                  step={0.5}
                  value={todayDraft.deepWorkHours}
                  onChange={e =>
                    setTodayDraft({ ...todayDraft, deepWorkHours: Number(e.target.value) })
                  }
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Deep reading minutes
                </span>
                <input
                  type="number"
                  min={0}
                  max={300}
                  step={5}
                  value={todayDraft.deepReadingMinutes}
                  onChange={e =>
                    setTodayDraft({ ...todayDraft, deepReadingMinutes: Number(e.target.value) })
                  }
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={todayDraft.exercise}
                  onChange={e => setTodayDraft({ ...todayDraft, exercise: e.target.checked })}
                />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                  Exercise
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={todayDraft.meditation}
                  onChange={e => setTodayDraft({ ...todayDraft, meditation: e.target.checked })}
                />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                  Meditation
                </span>
              </label>
            </div>

            <textarea
              value={todayDraft.notes ?? ''}
              onChange={e => setTodayDraft({ ...todayDraft, notes: e.target.value.slice(0, 1000) })}
              placeholder="Anything to capture from today (optional). One sentence about what surprised you, what you learned, or what fragmented you."
              rows={2}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>

      {/* SIX PILLARS */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginBottom: 10,
          marginTop: 24,
        }}
      >
        The six pillars (locked v3.5 §11)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {PILLARS.map(p => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {p.title}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {p.rule}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {p.why}
              </div>
            </div>
          );
        })}
      </div>

      {/* LONG-FORM CONTENT LOG */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Long-form content log
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Active recall encoded · {contentLog.length} pieces
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowContentForm(s => !s)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: showContentForm ? 'var(--bg-card)' : 'var(--accent-primary)',
            color: showContentForm ? 'var(--text-primary)' : '#fff',
            border: showContentForm
              ? '1px solid var(--border-color)'
              : '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showContentForm ? <X size={14} /> : <Plus size={14} />}{' '}
          {showContentForm ? 'Cancel' : 'Log piece'}
        </button>
      </div>

      {showContentForm && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: 10,
            }}
          >
            <input
              type="text"
              placeholder="Title (e.g. 'Lex Fridman × Yann LeCun on World Models')"
              value={contentForm.title ?? ''}
              onChange={e => setContentForm({ ...contentForm, title: e.target.value.slice(0, 200) })}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
            <select
              value={contentForm.source}
              onChange={e => setContentForm({ ...contentForm, source: e.target.value })}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              <option>YouTube</option>
              <option>Book</option>
              <option>Paper</option>
              <option>Podcast</option>
              <option>Long-form article</option>
              <option>Other</option>
            </select>
            <input
              type="number"
              min={30}
              max={600}
              step={5}
              placeholder="Duration (min)"
              value={contentForm.durationMin ?? 30}
              onChange={e => setContentForm({ ...contentForm, durationMin: Number(e.target.value) })}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
          </div>
          <textarea
            value={contentForm.activeRecallSummary ?? ''}
            onChange={e =>
              setContentForm({ ...contentForm, activeRecallSummary: e.target.value.slice(0, 2000) })
            }
            placeholder="Active recall summary — write 2-4 sentences from MEMORY. Don't peek at notes. The retrieval IS the encoding."
            rows={3}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddContent}
              disabled={
                !contentForm.title?.trim() || !contentForm.activeRecallSummary?.trim()
              }
              style={{
                padding: '8px 18px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity:
                  !contentForm.title?.trim() || !contentForm.activeRecallSummary?.trim()
                    ? 0.6
                    : 1,
              }}
            >
              Save piece
            </button>
          </div>
        </div>
      )}

      {contentLog.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contentLog.slice(0, 20).map(item => (
            <div
              key={item.id}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.source} · {item.durationMin}min · {item.date}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.activeRecallSummary}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKILL ACQUISITION TRACKER */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Skill acquisition tracker
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            One irreplaceable skill per quarter · {skills.length} on track
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowSkillForm(s => !s)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: showSkillForm ? 'var(--bg-card)' : 'var(--accent-primary)',
            color: showSkillForm ? 'var(--text-primary)' : '#fff',
            border: showSkillForm
              ? '1px solid var(--border-color)'
              : '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showSkillForm ? <X size={14} /> : <Plus size={14} />}{' '}
          {showSkillForm ? 'Cancel' : 'Add skill'}
        </button>
      </div>

      {showSkillForm && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <input
              type="text"
              placeholder="Quarter (e.g. Q3 2026)"
              value={skillForm.quarter ?? ''}
              onChange={e => setSkillForm({ ...skillForm, quarter: e.target.value.slice(0, 20) })}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
            <input
              type="text"
              placeholder="Skill (e.g. Causal inference + counterfactual reasoning)"
              value={skillForm.skill ?? ''}
              onChange={e => setSkillForm({ ...skillForm, skill: e.target.value.slice(0, 200) })}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
          </div>
          <textarea
            placeholder="Why it matters (connect to v3.5 phase / customer want / specific buyer-class persona)"
            value={skillForm.whyItMatters ?? ''}
            onChange={e =>
              setSkillForm({ ...skillForm, whyItMatters: e.target.value.slice(0, 800) })
            }
            rows={2}
            style={{
              padding: '8px 10px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <textarea
            placeholder="Pre-assessment — current state, what you can / can't do today"
            value={skillForm.preAssessment ?? ''}
            onChange={e =>
              setSkillForm({ ...skillForm, preAssessment: e.target.value.slice(0, 800) })
            }
            rows={2}
            style={{
              padding: '8px 10px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!skillForm.skill?.trim() || !skillForm.quarter?.trim()}
              style={{
                padding: '8px 18px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !skillForm.skill?.trim() || !skillForm.quarter?.trim() ? 0.6 : 1,
              }}
            >
              Save skill
            </button>
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {skills.map(skill => (
            <div
              key={skill.id}
              style={{
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${skill.status === 'complete' ? 'var(--accent-primary)' : skill.status === 'in_progress' ? 'var(--warning)' : 'var(--text-muted)'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  {skill.quarter}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {skill.skill}
                </span>
                <select
                  value={skill.status}
                  onChange={e =>
                    updateSkillStatus(skill.id, e.target.value as SkillItem['status'])
                  }
                  style={{
                    marginLeft: 'auto',
                    padding: '3px 8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              {skill.whyItMatters && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Why:</strong> {skill.whyItMatters}
                </div>
              )}
              {skill.preAssessment && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Pre:</strong>{' '}
                  {skill.preAssessment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* WEEKLY REVIEW PROMPT */}
      <div
        style={{
          marginTop: 28,
          padding: '20px 22px',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 5%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 0%, transparent) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <CalendarDays size={16} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Weekly review · every Sunday
          </span>
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Three questions, twenty minutes.
        </h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          <li>
            What were your top 3 long-form pieces this week? Write a 2-sentence active-recall
            summary of each from memory.
          </li>
          <li>
            Skill acquisition: one note on what you learned, where you got stuck, what new
            primary source you need next.
          </li>
          <li>
            Internal locus: one reflection on what was outside your control this week, what was
            inside, and where did you conflate the two?
          </li>
        </ol>
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          {reviews.length === 0
            ? 'No weekly reviews logged yet. Block 20 minutes Sunday evening; the review compounds across years.'
            : `${reviews.length} weekly review${reviews.length === 1 ? '' : 's'} logged. Continue.`}
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '14px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Why this is in v3.5 § 11:</strong> The
        Founder OS is not productivity advice. It&apos;s the cognitive infrastructure that turns
        v3.5 from a document into an executable plan. A v3.5 plan with no OS is a roadmap with no
        driver. When v3.5 is reviewed, the OS gets reviewed alongside. Data lives in your browser
        (localStorage) — single-user surface, no backend cost. Migration to Prisma is a follow-up
        if permanent records or multi-device sync becomes useful.
      </div>

      {/* Reduce two-column streak/checkin grid to single column on narrow viewports */}
      <style jsx>{`
        @media (max-width: 800px) {
          .founder-os-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Reference unused icons to satisfy the static-components rule and keep the
// imports honest — they're available for future skill-icon mappings.
void TrendingUp;
void Check;
