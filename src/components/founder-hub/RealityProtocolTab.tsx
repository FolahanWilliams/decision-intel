'use client';

/**
 * 66-Day Protocol tab — the founder-private "choose reality" check-in tracker.
 *
 * Two ~15-second check-ins a day grow a tree to full bloom at day 66. The
 * immersive sky+tree hero (RealityTree) is a self-contained illustration; the
 * surrounding cards use platform tokens so the surface sits cleanly inside the
 * light-theme Founder Hub.
 *
 * LOAD-BEARING (mirrors content.ts + tree-growth.ts): one morning question,
 * one night mark, no extra inputs, no in-app AI. A slip is logged honestly and
 * NEVER resets the tree. Friction is the enemy — the check-in must stay fast.
 *
 * Founder-scoped: persists to /api/founder-os/reality-checkin via the
 * x-founder-pass header (same pattern as every other founder-os surface).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Sunrise,
  Moon,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Anchor,
  LineChart,
  NotebookPen,
  CalendarDays,
  Telescope,
} from 'lucide-react';
import {
  MORNING_QUESTION,
  MORNING_PLACEHOLDER,
  KEYSTONES,
  ANTI_GOAL,
  SLIP_REFRAME,
  RESEARCH_NOTE,
  PROTOCOL_START_ISO,
  DIAGNOSIS_REFRAME,
  INSANITY_QUOTE,
  CONSTRUCTION_SWAPS,
  URGE_PROTOCOL,
  IDENTITY_FRAME,
  CHOICE_TRIAD,
  PERSON_CONTRAST,
  PROTOCOL_SCOPE,
  REPLACEMENT_PRINCIPLE,
  ANCHOR_VERSES,
  ENERGY_SURPLUS,
  DISCHARGE_FIRST,
  DISCHARGE_NOTE,
  ACCOUNTABILITY,
  REFLECTION_FACTORS,
  REFLECTION_SCALE_MAX,
  REFLECTION_INTRO,
  REFLECTION_NOTE_PROMPT,
  REFLECTION_TOMORROW_PROMPT,
  REFLECTION_TREND_NOTE,
  type ReflectionFactor,
} from './reality-protocol/content';
import {
  computeProtocolState,
  checkinsForDay,
  selectVerse,
  finishIso,
  todayIso,
  type CheckinKind,
} from './reality-protocol/tree-growth';
import {
  summarizeReflections,
  correlateFactorWithOutcome,
  sparklinePath,
  type ReflectionLite,
  type ReflectionFactorId,
} from './reality-protocol/reflection-trends';
import type { SynthesisResult } from './reality-protocol/synthesis';
import { RealityTree, skyInfoFor, REALITY_GOLD } from './reality-protocol/RealityTree';
import { LoopViz } from './reality-protocol/LoopViz';
import { TrajectoryViz } from './reality-protocol/TrajectoryViz';

interface RealityCheckinRow {
  id?: string;
  date: string;
  kind: CheckinKind;
  escapePlan?: string | null;
  stayedOnTrack?: boolean | null;
  note?: string | null;
  verseRef?: string | null;
}

interface RealityReflectionRow extends ReflectionLite {
  id?: string;
  note?: string | null;
  tomorrow?: string | null;
}

/** The in-progress evening reflection (factor ratings keyed by id + the two
 *  free-text fields). All optional — the reflection is never required. */
interface ReflectionDraft {
  mind: number | null;
  energy: number | null;
  intention: number | null;
  note: string;
  tomorrow: string;
}

const EMPTY_REFLECTION_DRAFT: ReflectionDraft = {
  mind: null,
  energy: null,
  intention: null,
  note: '',
  tomorrow: '',
};

const REFLECTION_FACTOR_IDS: ReadonlyArray<ReflectionFactorId> = REFLECTION_FACTORS.map(f => f.id);

/** Short "14 Jun" style label without colliding with the canonical formatDate
 *  util (canonical-imports lint). Pure, local. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** A small KJV anchor verse under a section — the word kept close, part by part
 *  (Ps 119:11). Verse text is the SSOT in content.ts `ANCHOR_VERSES`. */
function ScriptureAnchor({ verse }: { verse: { ref: string; text: string } }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        &ldquo;{verse.text}&rdquo;
      </div>
      <div style={{ fontSize: 11, color: REALITY_GOLD, marginTop: 4, letterSpacing: 0.3 }}>
        {verse.ref}
      </div>
    </div>
  );
}

export function RealityProtocolTab({ founderPass }: { founderPass: string }) {
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<RealityCheckinRow[]>([]);
  const [reflections, setReflections] = useState<RealityReflectionRow[]>([]);
  const [today] = useState(() => todayIso());
  const [sky] = useState(() => skyInfoFor(new Date().getHours()));
  // The day the check-in / reflection writes to. Defaults to today; a bounded
  // date picker lets the founder backfill an earlier in-window day (e.g. day 1
  // logged the morning after). Everything keys by (userId, date) already, so
  // backdating is purely this UI state — the tree + hero stay ambient on today.
  const [activeDate, setActiveDate] = useState(() => todayIso());
  const isBackfill = activeDate !== today;

  const [morningOpen, setMorningOpen] = useState(false);
  const [editingMorning, setEditingMorning] = useState(false);
  const [planText, setPlanText] = useState('');
  const [nightOpen, setNightOpen] = useState(false);
  const [editingNight, setEditingNight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [showUrge, setShowUrge] = useState(false);

  // evening reflection (optional; separate from the fast marks; never feeds the tree)
  const [reflectOpen, setReflectOpen] = useState(false);
  const [editingReflect, setEditingReflect] = useState(false);
  const [reflectDraft, setReflectDraft] = useState<ReflectionDraft>(EMPTY_REFLECTION_DRAFT);
  const [savingReflect, setSavingReflect] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

  // on-demand synthesis — the retrospective AI pass over the whole journey.
  // Never the urge-moment chatbot (banned); reads the accumulated corpus only.
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);
  const [synthResult, setSynthResult] = useState<SynthesisResult | null>(null);
  const [synthTooEarly, setSynthTooEarly] = useState<{ daysLogged: number; needed: number } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const headers = { 'x-founder-pass': founderPass };
      try {
        const [cRes, rRes] = await Promise.all([
          fetch('/api/founder-os/reality-checkin?days=90', { headers }),
          fetch('/api/founder-os/reality-reflection?days=90', { headers }),
        ]);
        if (cRes.ok) {
          const json = await cRes.json();
          if (active && Array.isArray(json?.data?.checkins)) {
            setCheckins(json.data.checkins as RealityCheckinRow[]);
          }
        }
        if (rRes.ok) {
          const json = await rRes.json();
          if (active && Array.isArray(json?.data?.reflections)) {
            setReflections(json.data.reflections as RealityReflectionRow[]);
          }
        }
      } catch {
        // Both endpoints fail soft to []; a network error leaves the seed state.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [founderPass]);

  const firePulse = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 850);
  }, []);

  const saveCheckin = useCallback(
    async (payload: {
      kind: CheckinKind;
      escapePlan?: string;
      stayedOnTrack?: boolean;
      verseRef?: string;
    }): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/api/founder-os/reality-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
          body: JSON.stringify({ date: activeDate, ...payload }),
        });
        if (!res.ok) throw new Error('save failed');
        const json = await res.json();
        const saved = json?.data?.checkin as RealityCheckinRow | undefined;
        if (saved) {
          setCheckins(prev => [
            ...prev.filter(c => !(c.date === saved.date && c.kind === saved.kind)),
            saved,
          ]);
          firePulse();
        }
        return true;
      } catch {
        setError('Could not save. Check your connection and try again.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [founderPass, activeDate, firePulse]
  );

  const saveReflection = useCallback(async (): Promise<boolean> => {
    setSavingReflect(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-os/reality-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({
          date: activeDate,
          mind: reflectDraft.mind,
          energy: reflectDraft.energy,
          intention: reflectDraft.intention,
          note: reflectDraft.note.trim() || undefined,
          tomorrow: reflectDraft.tomorrow.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const json = await res.json();
      const saved = json?.data?.reflection as RealityReflectionRow | undefined;
      if (saved) {
        setReflections(prev => [...prev.filter(x => x.date !== saved.date), saved]);
        setReflectOpen(false);
        setEditingReflect(false);
      }
      return true;
    } catch {
      setError('Could not save your reflection. Try again.');
      return false;
    } finally {
      setSavingReflect(false);
    }
  }, [founderPass, activeDate, reflectDraft]);

  const resetAll = useCallback(async () => {
    setError(null);
    try {
      // Reset both the tree (check-ins) and the optional reflection log.
      const [cRes, rRes] = await Promise.all([
        fetch('/api/founder-os/reality-checkin?all=1', {
          method: 'DELETE',
          headers: { 'x-founder-pass': founderPass },
        }),
        fetch('/api/founder-os/reality-reflection?all=1', {
          method: 'DELETE',
          headers: { 'x-founder-pass': founderPass },
        }),
      ]);
      if (!cRes.ok || !rRes.ok) throw new Error('reset failed');
      setCheckins([]);
      setReflections([]);
      setConfirmReset(false);
      setPlanText('');
      setMorningOpen(false);
      setNightOpen(false);
      setReflectDraft(EMPTY_REFLECTION_DRAFT);
      setReflectOpen(false);
    } catch {
      setError('Could not reset. Try again.');
    }
  }, [founderPass]);

  const state = computeProtocolState(checkins);
  // dayRec / the marks below are for the ACTIVE day (today, unless backfilling).
  const dayRec = checkinsForDay(checkins, activeDate);
  const morningDone = Boolean(dayRec.morning);
  const nightDone = Boolean(dayRec.night);
  const slippedToday = nightDone && dayRec.night?.stayedOnTrack === false;

  // evening reflection — optional, never feeds `state`/the tree above
  const activeReflection = reflections.find(r => r.date === activeDate);
  const reflectionDone = Boolean(
    activeReflection &&
    (activeReflection.mind != null ||
      activeReflection.energy != null ||
      activeReflection.intention != null ||
      activeReflection.note ||
      activeReflection.tomorrow)
  );
  const trends = summarizeReflections(reflections, REFLECTION_FACTOR_IDS);
  const hasTrendData = trends.some(t => t.count > 0);

  const openReflectEditor = () => {
    setReflectDraft({
      mind: activeReflection?.mind ?? null,
      energy: activeReflection?.energy ?? null,
      intention: activeReflection?.intention ?? null,
      note: activeReflection?.note ?? '',
      tomorrow: activeReflection?.tomorrow ?? '',
    });
    setEditingReflect(true);
    setReflectOpen(true);
  };

  const verse = selectVerse({
    dateIso: activeDate,
    kind: nightDone ? 'night' : 'morning',
    slipped: slippedToday,
  });

  const doMorning = async () => {
    const mVerse = selectVerse({ dateIso: activeDate, kind: 'morning' });
    const ok = await saveCheckin({
      kind: 'morning',
      escapePlan: planText.trim() || undefined,
      verseRef: mVerse.ref,
    });
    if (ok) {
      setMorningOpen(false);
      setEditingMorning(false);
    }
  };

  const doNight = async (stayedOnTrack: boolean) => {
    const nVerse = selectVerse({ dateIso: activeDate, kind: 'night', slipped: !stayedOnTrack });
    const ok = await saveCheckin({ kind: 'night', stayedOnTrack, verseRef: nVerse.ref });
    if (ok) {
      setNightOpen(false);
      setEditingNight(false);
    }
  };

  // Switch the day the marks/reflection write to. Close every open editor and
  // clear drafts so stale today-state can't leak onto the backfilled day.
  const selectActiveDate = (iso: string) => {
    if (!iso || iso < PROTOCOL_START_ISO || iso > today) return;
    setActiveDate(iso);
    setMorningOpen(false);
    setEditingMorning(false);
    setNightOpen(false);
    setEditingNight(false);
    setReflectOpen(false);
    setEditingReflect(false);
    setPlanText('');
    setReflectDraft(EMPTY_REFLECTION_DRAFT);
    setError(null);
  };

  const runSynthesis = useCallback(
    async (capstone: boolean) => {
      setSynthLoading(true);
      setSynthError(null);
      setSynthTooEarly(null);
      try {
        const res = await fetch('/api/founder-os/reality-synthesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
          body: JSON.stringify({ capstone }),
        });
        const json = await res.json().catch(() => null);
        // canonical res.json() body-parse exception — null below surfaces the error.
        if (!res.ok || !json?.data) {
          setSynthError(json?.error ?? 'Could not synthesize right now. Try again in a minute.');
          return;
        }
        const data = json.data as
          | { status: 'too_early'; daysLogged: number; needed: number }
          | { status: 'ok'; synthesis: SynthesisResult };
        if (data.status === 'too_early') {
          setSynthTooEarly({ daysLogged: data.daysLogged, needed: data.needed });
          setSynthResult(null);
          return;
        }
        setSynthResult(data.synthesis);
      } catch {
        setSynthError('Could not synthesize right now. Try again in a minute.');
      } finally {
        setSynthLoading(false);
      }
    },
    [founderPass]
  );

  // ── styles (platform tokens) ──────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 18,
  };
  const primaryBtn: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '13px 16px',
    fontSize: 15,
    fontWeight: 600,
    cursor: saving ? 'wait' : 'pointer',
    background: 'var(--accent-primary)',
    color: '#fff',
    opacity: saving ? 0.7 : 1,
  };
  const neutralBtn: React.CSSProperties = {
    ...primaryBtn,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  };
  const doneBox: React.CSSProperties = {
    ...cardStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
  };
  const changeLink: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    padding: 0,
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
        Loading your tree…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sprout size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2
              style={{
                fontSize: 'var(--fs-lg, 20px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              66-Day Protocol
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Choose reality. Build the person.
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {sky.label}
        </div>
      </div>

      {/* urge-moment entry — prominent + calm, the first thing reachable when
          you visit to resist. Default collapsed so the daily ritual stays
          clean; one tap opens the full System-2 read. */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowUrge(v => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-color))',
            background: 'color-mix(in srgb, var(--accent-primary) 7%, var(--bg-card))',
            color: 'var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Anchor size={16} />
          Feeling the urge right now? Read this first
          {showUrge ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {showUrge && (
          <div
            style={{ ...cardStyle, marginTop: 10, borderLeft: '3px solid var(--accent-primary)' }}
          >
            {/* opener — permission to pause */}
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
            >
              {URGE_PROTOCOL.opener}
            </div>

            {/* move first — physical discharge before any thinking. At peak
                charge System 1 is driving; burn it down with the body first. */}
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                Move first
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {URGE_PROTOCOL.moveFirst}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {DISCHARGE_FIRST.map(d => (
                  <span
                    key={d}
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 999,
                      padding: '4px 11px',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* HALT — check the setup before negotiating with the urge */}
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {URGE_PROTOCOL.halt}
            </div>

            {/* audit questions — pull System 2 online */}
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 4,
                }}
              >
                Ask yourself, honestly
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Answering these pulls your slow, deliberate mind (System 2) back online — which is
                usually all it takes.
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {URGE_PROTOCOL.questions.map((q, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{ flexShrink: 0, fontWeight: 700, color: 'var(--accent-primary)' }}
                    >
                      {i + 1}.
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* truths that hold under pressure */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                What is actually true
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {URGE_PROTOCOL.truths.map((t, i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {t.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* close — the one action */}
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
            >
              {URGE_PROTOCOL.close}
            </div>

            {/* slip note — the AVE reframe if already mid-slip */}
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              {URGE_PROTOCOL.slipNote}
            </div>

            <ScriptureAnchor verse={ANCHOR_VERSES.urge} />
          </div>
        )}
      </div>

      {/* tree hero */}
      <RealityTree
        progress={state.progress}
        totalCheckins={state.totalCheckins}
        sky={sky}
        dayNumber={state.dayNumber}
        stageLabel={state.stageLabel}
        pulse={pulse}
      />

      {/* progress bar */}
      <div
        style={{
          height: 5,
          background: 'var(--bg-elevated)',
          borderRadius: 99,
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${state.progress * 100}%`,
            background: state.bloom ? 'var(--success)' : REALITY_GOLD,
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 7,
        }}
      >
        <span>{state.totalCheckins} check-ins</span>
        <span>
          {state.cleanCount} on track · {state.slipCount} slips logged
        </span>
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          marginTop: 6,
          letterSpacing: 0.2,
        }}
      >
        Began {shortDate(PROTOCOL_START_ISO)} → blooms ≈ {shortDate(finishIso())}
      </div>

      {/* standing principle — the change/inputs reframe (resonates) */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 14,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        &ldquo;{INSANITY_QUOTE.text}&rdquo;
        <span
          style={{
            display: 'block',
            fontFamily: 'inherit',
            fontStyle: 'normal',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          — {INSANITY_QUOTE.attribution}
        </span>
      </div>

      {/* verse */}
      <div style={{ ...cardStyle, marginTop: 18 }}>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 16.5,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        >
          &ldquo;{verse.text}&rdquo;
        </div>
        <div style={{ fontSize: 12.5, color: REALITY_GOLD, marginTop: 10, letterSpacing: 0.4 }}>
          {verse.ref}
        </div>
      </div>

      {/* day selector — backfill an earlier in-window day (e.g. day 1 logged late) */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <label
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CalendarDays size={14} style={{ color: 'var(--text-muted)' }} />
          Logging for
          <input
            type="date"
            value={activeDate}
            min={PROTOCOL_START_ISO}
            max={today}
            onChange={e => selectActiveDate(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </label>
        {isBackfill && (
          <button
            onClick={() => selectActiveDate(today)}
            style={{
              fontSize: 12,
              color: 'var(--accent-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Back to today
          </button>
        )}
      </div>
      {isBackfill && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Backfilling{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{shortDate(activeDate)}</strong>. Marks
          and the reflection save to that day; the tree and verse stay on today.
        </div>
      )}

      {/* check-ins */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* morning */}
        {morningOpen || editingMorning ? (
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 14.5,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {MORNING_QUESTION}
            </div>
            <input
              value={planText}
              onChange={e => setPlanText(e.target.value)}
              placeholder={MORNING_PLACEHOLDER}
              onKeyDown={e => {
                if (e.key === 'Enter') void doMorning();
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: 14,
                outline: 'none',
                marginBottom: 10,
              }}
            />
            <div className="reality-night-actions" style={{ display: 'flex', gap: 10 }}>
              <button style={primaryBtn} onClick={() => void doMorning()} disabled={saving}>
                Save and take the verse
              </button>
              {editingMorning && (
                <button
                  style={neutralBtn}
                  onClick={() => {
                    setEditingMorning(false);
                    setPlanText('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : morningDone ? (
          <div style={doneBox}>
            <Check size={16} style={{ color: 'var(--success)' }} /> Morning check-in done
            <button
              style={changeLink}
              onClick={() => {
                setPlanText(dayRec.morning?.escapePlan ?? '');
                setEditingMorning(true);
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <button style={primaryBtn} onClick={() => setMorningOpen(true)}>
            <Sunrise size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />
            Morning check-in
          </button>
        )}

        {/* night */}
        {nightOpen || editingNight ? (
          <div style={cardStyle}>
            {dayRec.morning?.escapePlan ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                This morning you planned:{' '}
                <span style={{ color: 'var(--text-primary)' }}>{dayRec.morning.escapePlan}</span>
              </div>
            ) : null}
            <div className="reality-night-actions" style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...primaryBtn, background: 'var(--success)' }}
                onClick={() => void doNight(true)}
                disabled={saving}
              >
                Stayed on track
              </button>
              <button style={neutralBtn} onClick={() => void doNight(false)} disabled={saving}>
                I slipped
              </button>
            </div>
            {editingNight && (
              <button
                style={{ ...changeLink, marginTop: 12 }}
                onClick={() => setEditingNight(false)}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        ) : nightDone ? (
          <div style={doneBox}>
            <Check size={16} style={{ color: 'var(--success)' }} /> Night check-in done
            {dayRec.night?.stayedOnTrack === true
              ? ' · stayed on track'
              : dayRec.night?.stayedOnTrack === false
                ? ' · logged honestly'
                : ''}
            <button style={changeLink} onClick={() => setEditingNight(true)}>
              Change
            </button>
          </div>
        ) : (
          <button style={neutralBtn} onClick={() => setNightOpen(true)}>
            <Moon size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />
            Night check-in
          </button>
        )}
      </div>

      {/* mobile: stack the side-by-side action pairs on a narrow phone */}
      <style>{`
        @media (max-width: 420px) {
          .reality-night-actions { flex-direction: column; }
        }
      `}</style>

      {error && (
        <div style={{ fontSize: 12.5, color: 'var(--error)', marginTop: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* slip reframe */}
      {slippedToday && (
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'color-mix(in srgb, var(--warning) 8%, var(--bg-card))',
            border: '1px solid color-mix(in srgb, var(--warning) 30%, var(--border-color))',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {SLIP_REFRAME}
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 13.5,
              color: REALITY_GOLD,
              marginTop: 8,
            }}
          >
            &ldquo;A just man falleth seven times, and riseth up again.&rdquo; — Proverbs 24:16
          </div>
        </div>
      )}

      {/* evening reflection — OPTIONAL, separate from the fast marks above, and
          it NEVER feeds the tree. Here so progress is visible: watch the mind
          grow over 66 days. Default collapsed so the daily ritual stays clean. */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => {
            if (reflectOpen) {
              setReflectOpen(false);
              setEditingReflect(false);
            } else {
              openReflectEditor();
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '11px 14px',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <NotebookPen size={15} style={{ color: 'var(--accent-primary)' }} />
          Evening reflection
          <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>
            · optional
          </span>
          {reflectionDone && !reflectOpen && (
            <Check size={14} style={{ color: 'var(--success)', marginLeft: 2 }} />
          )}
          <span style={{ marginLeft: 'auto' }}>
            {reflectOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        </button>

        {reflectOpen && (
          <div style={{ ...cardStyle, marginTop: 10 }}>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginBottom: 14,
              }}
            >
              {REFLECTION_INTRO}
            </div>

            {/* the factor ratings — descriptive 1-10, never a grade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {REFLECTION_FACTORS.map((f: ReflectionFactor) => {
                const current = reflectDraft[f.id];
                return (
                  <div key={f.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}
                      >
                        {f.label}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{f.help}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {Array.from({ length: REFLECTION_SCALE_MAX }, (_, i) => i + 1).map(v => {
                        const active = current === v;
                        return (
                          <button
                            key={v}
                            onClick={() =>
                              setReflectDraft(d => ({ ...d, [f.id]: d[f.id] === v ? null : v }))
                            }
                            aria-label={`${f.label} ${v} of ${REFLECTION_SCALE_MAX}`}
                            style={{
                              flex: 1,
                              padding: '9px 0',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              color: active ? '#fff' : 'var(--text-muted)',
                              border: `1px solid ${
                                active ? 'var(--accent-primary)' : 'var(--border-color)'
                              }`,
                            }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}
                    >
                      <span>{f.low}</span>
                      <span>{f.high}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* the honest note + the if-then for tomorrow */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {REFLECTION_NOTE_PROMPT}
              </div>
              <textarea
                value={reflectDraft.note}
                onChange={e => setReflectDraft(d => ({ ...d, note: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {REFLECTION_TOMORROW_PROMPT}
              </div>
              <input
                value={reflectDraft.tomorrow}
                onChange={e => setReflectDraft(d => ({ ...d, tomorrow: e.target.value }))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: 13.5,
                  outline: 'none',
                }}
              />
            </div>

            <div
              className="reality-night-actions"
              style={{ display: 'flex', gap: 10, marginTop: 14 }}
            >
              <button
                style={primaryBtn}
                onClick={() => void saveReflection()}
                disabled={savingReflect}
              >
                {reflectionDone ? 'Update reflection' : 'Save reflection'}
              </button>
              <button
                style={neutralBtn}
                onClick={() => {
                  setReflectOpen(false);
                  setEditingReflect(false);
                }}
                disabled={savingReflect}
              >
                {editingReflect ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* your evolution — the read-only trend view (deterministic, never an AI
          coach). The payoff: see the arc of your own mind over the 66 days. */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => setShowTrend(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {showTrend ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <LineChart size={14} style={{ color: 'var(--accent-primary)' }} />
          Your evolution
        </button>

        {showTrend && (
          <div style={{ ...cardStyle, marginTop: 10 }}>
            {!hasTrendData ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Log a few evening reflections and your arc shows up here — a line per factor, so you
                can watch your mind grow over the 66 days.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {trends.map(t => {
                    const factor = REFLECTION_FACTORS.find(f => f.id === t.id);
                    if (!factor) return null;
                    const values = t.series.map(p => p.value);
                    const path = sparklinePath(values, 220, 36, REFLECTION_SCALE_MAX);
                    const corr = correlateFactorWithOutcome(reflections, checkins, t.id);
                    const up = t.delta != null && t.delta > 0.05;
                    const down = t.delta != null && t.delta < -0.05;
                    return (
                      <div key={t.id}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {factor.label}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {t.average != null ? `avg ${t.average.toFixed(1)}` : '—'}
                            {t.delta != null && (up || down) ? (
                              <span
                                style={{
                                  marginLeft: 8,
                                  color: up ? 'var(--success)' : 'var(--text-muted)',
                                  fontWeight: 700,
                                }}
                              >
                                {up ? '▲' : '▼'} {Math.abs(t.delta).toFixed(1)}
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <svg
                          width="100%"
                          viewBox="0 0 220 36"
                          preserveAspectRatio="none"
                          style={{ marginTop: 6, display: 'block', overflow: 'visible' }}
                          aria-hidden="true"
                        >
                          <line
                            x1="0"
                            y1="35"
                            x2="220"
                            y2="35"
                            stroke="var(--border-color)"
                            strokeWidth="1"
                          />
                          {path && (
                            <path
                              d={path}
                              fill="none"
                              stroke={REALITY_GOLD}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                        {corr && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: 'var(--text-muted)',
                              marginTop: 6,
                              lineHeight: 1.5,
                            }}
                          >
                            On high-{factor.label.toLowerCase()} days you stayed on track{' '}
                            {Math.round(corr.highRate * 100)}% of the time, vs{' '}
                            {Math.round(corr.lowRate * 100)}% on low days (n={corr.highN}/
                            {corr.lowN}).
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* the scannable run of your own words, newest first */}
                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Recent reflections
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...reflections]
                      .filter(r => r.note || r.tomorrow)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 7)
                      .map(r => (
                        <div
                          key={r.date}
                          style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 10 }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {shortDate(r.date)}
                          </div>
                          {r.note && (
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                                marginTop: 2,
                              }}
                            >
                              {r.note}
                            </div>
                          )}
                          {r.tomorrow && (
                            <div
                              style={{
                                fontSize: 12.5,
                                color: 'var(--text-primary)',
                                lineHeight: 1.5,
                                marginTop: 3,
                              }}
                            >
                              → {r.tomorrow}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {REFLECTION_TREND_NOTE}
            </div>
          </div>
        )}
      </div>

      {/* synthesis — the retrospective AI pass over the whole journey. On-demand,
          reads only your own logged words, never the urge-moment chatbot. */}
      <div style={{ ...cardStyle, marginTop: 24, borderLeft: `3px solid ${REALITY_GOLD}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: REALITY_GOLD,
          }}
        >
          <Telescope size={15} />
          {state.bloom ? 'Your 66-day arc' : 'Synthesize the journey'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          {state.bloom
            ? 'Sixty-six days are in. Read the whole arc back: where you started, what actually moved the needle, and the one thing to carry forward.'
            : 'When you have enough days logged, read your own reflections back as patterns — what the data says, in your words, plus one thing worth trying next. It only ever reads what you wrote.'}
        </div>

        <button
          onClick={() => void runSynthesis(state.bloom)}
          disabled={synthLoading}
          style={{
            marginTop: 14,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '11px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: synthLoading ? 'wait' : 'pointer',
            background: 'var(--accent-primary)',
            color: '#fff',
            opacity: synthLoading ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Telescope size={15} />
          {synthLoading
            ? 'Reading your journey…'
            : synthResult
              ? 'Synthesize again'
              : state.bloom
                ? 'Read my 66-day arc'
                : 'Synthesize my journey so far'}
        </button>

        {synthError && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12.5,
              color: 'var(--error)',
              lineHeight: 1.5,
            }}
          >
            {synthError}
          </div>
        )}

        {synthTooEarly && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Not yet — there&rsquo;s a floor so the patterns are real, not noise. You&rsquo;ve logged
            a reflection on{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{synthTooEarly.daysLogged}</strong> day
            {synthTooEarly.daysLogged === 1 ? '' : 's'}; come back at{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{synthTooEarly.needed}</strong>. Keep
            logging the evening reflection above.
          </div>
        )}

        {synthResult && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* the arc — the one-paragraph through-line, set apart */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                paddingLeft: 14,
                borderLeft: `2px solid ${REALITY_GOLD}`,
              }}
            >
              {synthResult.arc}
            </div>

            {/* the patterns — what the data says, in your words */}
            {synthResult.patterns.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {synthResult.patterns.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* the one nudge — exactly one forward move, drawn from your own pattern */}
            <div
              style={{
                background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                One thing to try
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {synthResult.nudge.observation}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                {synthResult.nudge.action}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* the context — diagnosis, the loop, the plan. Open by default (it's the
          "everything you might need" depth); the daily check-in is above it, so
          this never slows the ritual. Collapse it once it's internalised. */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setShowContext(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {showContext ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          The diagnosis, the loop &amp; the plan
        </button>
        {showContext && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* what this actually is */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-primary)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                What this actually is
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {DIAGNOSIS_REFRAME}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.diagnosis} />
            </div>

            {/* the two-week wall — the energy surplus reframe (forge, not sink) */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-primary)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                {ENERGY_SURPLUS.title}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ENERGY_SURPLUS.body}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}
              >
                {ENERGY_SURPLUS.reframe}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.energy} />
            </div>

            {/* the two commitments — porn to zero + social media ≤ 30 min/day */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                The two commitments
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {PROTOCOL_SCOPE}
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    background: 'color-mix(in srgb, var(--accent-primary) 9%, var(--bg-card))',
                    border:
                      '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
                    borderRadius: 999,
                    padding: '5px 12px',
                  }}
                >
                  The escape → zero
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    background: 'color-mix(in srgb, var(--accent-primary) 9%, var(--bg-card))',
                    border:
                      '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
                    borderRadius: 999,
                    padding: '5px 12px',
                  }}
                >
                  Social media → ≤ 30 min / day
                </span>
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.commitments} />
            </div>

            {/* the loop (dynamic viz) */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                The loop you are breaking
              </div>
              <LoopViz />
              <ScriptureAnchor verse={ANCHOR_VERSES.loop} />
            </div>

            {/* what you are really building — identity construction */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-primary)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                What you are really building
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {IDENTITY_FRAME}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.identity} />

              {/* the choice triad — each day is a vote */}
              <div
                style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}
                aria-label="Each day is a choice"
              >
                {CHOICE_TRIAD.map(row => (
                  <div key={row.build} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {row.build}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
                    <span
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {row.escape}
                    </span>
                  </div>
                ))}
              </div>

              {/* the Prince & the King — dynamic divergence */}
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: 10,
                  }}
                >
                  The Prince &amp; the King
                </div>
                <TrajectoryViz />
                <ScriptureAnchor verse={ANCHOR_VERSES.trajectory} />
              </div>

              {/* Person A vs Person B — reward becoming the person */}
              <div
                className="reality-night-actions"
                style={{ marginTop: 18, display: 'flex', gap: 10 }}
              >
                {[PERSON_CONTRAST.a, PERSON_CONTRAST.b].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {p.label}
                    </div>
                    <div
                      style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
                      {p.body}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  fontWeight: 500,
                }}
              >
                {PERSON_CONTRAST.verdict}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.person} />
            </div>

            {/* the four keystones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                The four keystones
              </div>
              {KEYSTONES.map((k, i) => (
                <div key={i} style={cardStyle}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {i + 1}. {k.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {k.body}
                  </div>
                  <ScriptureAnchor verse={k.verse} />
                </div>
              ))}
            </div>

            {/* accountability — the one thing the tree cannot do (won in the
                light, with one person, not in isolation) */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-primary)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                {ACCOUNTABILITY.title}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ACCOUNTABILITY.body}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.accountability} />
            </div>

            {/* replace the time — the rewiring mechanism (the King's inputs) */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                Replace the time — build the King
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {REPLACEMENT_PRINCIPLE}
              </div>

              {/* first, discharge — physical reset before the forge */}
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  First, discharge
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {DISCHARGE_NOTE}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {DISCHARGE_FIRST.map(d => (
                    <span
                      key={d}
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 999,
                        padding: '4px 11px',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: '14px 0 10px',
                }}
              >
                Then forge — pre-decide one each morning, and reach for it once the charge is down.
                These are the King&apos;s inputs:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONSTRUCTION_SWAPS.map(s => (
                  <span
                    key={s}
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 999,
                      padding: '5px 12px',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.replacement} />
            </div>

            {/* the anti-goal */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--text-muted)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                The anti-goal
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {ANTI_GOAL}
              </div>
              <ScriptureAnchor verse={ANCHOR_VERSES.antiGoal} />
            </div>

            {/* what the evidence says */}
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {RESEARCH_NOTE}
            </div>

            {/* why scripture anchors every part — the founder's reason */}
            <div
              style={{
                marginTop: 6,
                textAlign: 'center',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-card))',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                }}
              >
                &ldquo;{ANCHOR_VERSES.word.text}&rdquo;
              </div>
              <div
                style={{ fontSize: 11.5, color: REALITY_GOLD, marginTop: 6, letterSpacing: 0.3 }}
              >
                {ANCHOR_VERSES.word.ref}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                That is why a verse anchors every part above — the word kept close, to guard you in
                the moment.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* reset footer */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        {confirmReset ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Start over and clear all progress?{' '}
            <button
              onClick={() => void resetAll()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Yes, reset
            </button>
            {'  ·  '}
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
