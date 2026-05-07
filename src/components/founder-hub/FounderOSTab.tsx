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
 * Persistence: Supabase via /api/founder-os/* routes. Dual-gated by founder
 * pass (founder hub access) + Supabase user.id (per-user data partition).
 * Multi-device sync via the same Supabase user across phone + laptop.
 *
 * The tab composes:
 *   - BibleVersePill — daily-rotating verse anchor at the top
 *   - Hero card — strategic framing
 *   - SFC streak counter + today's checkin
 *   - 91-day discipline heatmap
 *   - 6-axis pillar adherence radar + 30-day cognitive trend chart
 *   - Compound-math callout (asymmetric arbitrage)
 *   - Six pillars cards
 *   - Long-form content log
 *   - Skill acquisition tracker + skill timeline visualization
 *   - WhySfcSection — research + sabotage tables (read when unmotivated)
 *   - CommitmentRecord — the physical record
 *   - Weekly review prompt
 *
 * Mobile-first responsive: collapses to single column below 800px so the
 * tab is fully usable on phone.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Flame, Plus, X, CalendarDays, RefreshCw } from 'lucide-react';
import {
  StreakHeatmap,
  CognitiveTrendChart,
  PillarAdherenceRadar,
  CompoundMathCallout,
  SkillTimeline,
  type CheckinRecord,
} from '@/components/founder-hub/founder-os/visualizations';
import {
  BibleVersePill,
  CommitmentRecord,
  BuildInPublicSection,
} from '@/components/founder-hub/founder-os/sections';
import {
  InteractivePillars,
  type PillarAdherenceData,
} from '@/components/founder-hub/founder-os/InteractivePillars';
import { InteractiveSfcMatrix } from '@/components/founder-hub/founder-os/InteractiveSfcMatrix';
import { EventPrepCard } from '@/components/founder-hub/founder-os/EventPrepCard';
import { LifestyleFreezeCard } from '@/components/founder-hub/founder-os/LifestyleFreezeCard';

interface DailyCheckin {
  id: string;
  date: string;
  sfcZero: boolean;
  deepWorkHours: number;
  deepReadingMinutes: number;
  exercise: boolean;
  meditation: boolean;
  notes: string | null;
}

interface ContentLogItem {
  id: string;
  capturedAt: string;
  title: string;
  source: string;
  durationMin: number;
  activeRecallSummary: string;
}

interface SkillItem {
  id: string;
  quarter: string;
  skill: string;
  whyItMatters: string | null;
  preAssessment: string | null;
  postAssessment: string | null;
  status: 'planned' | 'in_progress' | 'complete';
}

interface WeeklyReviewItem {
  id: string;
  weekStartDate: string;
  topLongForm: string;
  oneSkillNote: string | null;
  internalLocusReflection: string;
  createdAt: string;
}

function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDateISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeSfcZeroStreak(checkins: DailyCheckin[]): number {
  if (checkins.length === 0) return 0;
  const map = new Map(checkins.map(c => [c.date, c]));
  let streak = 0;
  let cursor = todayLocalISO();
  // Today might not be filled yet — check today first; if not present
  // OR present-with-sfc-zero, walk backward.
  for (let i = 0; i < 400; i++) {
    const c = map.get(cursor);
    if (!c) {
      // First gap stops the streak unless it's today and today wasn't logged yet.
      if (i === 0) {
        cursor = shiftDateISO(cursor, -1);
        continue;
      }
      break;
    }
    if (c.sfcZero) {
      streak += 1;
      cursor = shiftDateISO(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

function getFounderPass(): string {
  return process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

export function FounderOSTab() {
  const [hydrated, setHydrated] = useState(false);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [contentLog, setContentLog] = useState<ContentLogItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [reviews, setReviews] = useState<WeeklyReviewItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Today's draft
  const [todayDraft, setTodayDraft] = useState<Omit<DailyCheckin, 'id'>>({
    date: todayLocalISO(),
    sfcZero: true,
    deepWorkHours: 0,
    deepReadingMinutes: 0,
    exercise: false,
    meditation: false,
    notes: '',
  });

  // Forms
  const [contentForm, setContentForm] = useState({
    title: '',
    source: 'YouTube',
    durationMin: 30,
    activeRecallSummary: '',
  });
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [skillForm, setSkillForm] = useState({
    quarter: '',
    skill: '',
    whyItMatters: '',
    preAssessment: '',
  });
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    topLongForm: '',
    oneSkillNote: '',
    internalLocusReflection: '',
  });
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Save-status indicator for daily checkin
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': getFounderPass() }),
    []
  );

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cRes, lRes, sRes, wRes] = await Promise.all([
        fetch('/api/founder-os/checkins?days=180', { cache: 'no-store', headers }),
        fetch('/api/founder-os/content-log?limit=50', { cache: 'no-store', headers }),
        fetch('/api/founder-os/skills', { cache: 'no-store', headers }),
        fetch('/api/founder-os/weekly-reviews?limit=12', { cache: 'no-store', headers }),
      ]);
      if (cRes.ok) {
        const j = (await cRes.json()) as ApiEnvelope<{ checkins: DailyCheckin[] }>;
        setCheckins(j.data?.checkins ?? []);
      }
      if (lRes.ok) {
        const j = (await lRes.json()) as ApiEnvelope<{ items: ContentLogItem[] }>;
        setContentLog(j.data?.items ?? []);
      }
      if (sRes.ok) {
        const j = (await sRes.json()) as ApiEnvelope<{ skills: SkillItem[] }>;
        setSkills(j.data?.skills ?? []);
      }
      if (wRes.ok) {
        const j = (await wRes.json()) as ApiEnvelope<{ reviews: WeeklyReviewItem[] }>;
        setReviews(j.data?.reviews ?? []);
      }
    } catch (_err1) {
      // Silent — empty state acceptable; banners show below if relevant
      void _err1;
    } finally {
      setRefreshing(false);
      setHydrated(true);
    }
  }, [headers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Pre-load today's existing checkin if any
  useEffect(() => {
    if (!hydrated) return;
    const existing = checkins.find(c => c.date === todayLocalISO());
    if (existing) {
      setTodayDraft({
        date: existing.date,
        sfcZero: existing.sfcZero,
        deepWorkHours: existing.deepWorkHours,
        deepReadingMinutes: existing.deepReadingMinutes,
        exercise: existing.exercise,
        meditation: existing.meditation,
        notes: existing.notes ?? '',
      });
    }
  }, [hydrated, checkins]);

  const sfcStreak = useMemo(() => computeSfcZeroStreak(checkins), [checkins]);
  const totalCheckins = checkins.length;
  const sfcZeroDays = checkins.filter(c => c.sfcZero).length;
  const adherencePct = totalCheckins === 0 ? 0 : Math.round((sfcZeroDays / totalCheckins) * 100);

  const totalDeepWorkHours = useMemo(
    () => checkins.reduce((s, c) => s + c.deepWorkHours, 0),
    [checkins]
  );
  const totalReadingMinutes = useMemo(
    () => checkins.reduce((s, c) => s + c.deepReadingMinutes, 0),
    [checkins]
  );

  // Long-form pieces in last 30 days
  const longFormLast30 = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return contentLog.filter(c => new Date(c.capturedAt) >= cutoff).length;
  }, [contentLog]);

  const skillsActive = useMemo(() => skills.filter(s => s.status !== 'planned').length, [skills]);

  // Weekly reviews in last 4 weeks
  const reviewsLast4w = useMemo(() => {
    const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    return reviews.filter(r => new Date(r.createdAt) >= cutoff).length;
  }, [reviews]);

  // Compute pillar adherence data for InteractivePillars (same logic as PillarAdherenceRadar).
  const pillarAdherence = useMemo((): PillarAdherenceData => {
    const today = todayLocalISO();
    const cutoff = shiftDateISO(today, -29);
    const last30 = checkins.filter(c => c.date >= cutoff && c.date <= today);
    const sfcZeroPct = last30.length === 0 ? 0 : last30.filter(c => c.sfcZero).length / 30;
    const longFormPct = Math.min(longFormLast30 / 8, 1);
    const activeRecallPct = longFormPct;
    const orchestrationPct = Math.min(skillsActive / 2, 1);
    const distressPct =
      last30.length === 0 ? 0 : last30.filter(c => c.exercise || c.meditation).length / 30;
    const locusPct = Math.min(reviewsLast4w / 4, 1);
    return {
      neuro: sfcZeroPct,
      longform: longFormPct,
      recall: activeRecallPct,
      orchestrate: orchestrationPct,
      distress: distressPct,
      agency: locusPct,
    };
  }, [checkins, longFormLast30, skillsActive, reviewsLast4w]);

  const handleSaveCheckin = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/founder-os/checkins', {
        method: 'POST',
        headers,
        body: JSON.stringify(todayDraft),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? 'Save failed');
      }
      setSaveStatus('saved');
      await fetchAll();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [headers, todayDraft, fetchAll]);

  const handleAddContent = useCallback(async () => {
    if (!contentForm.title.trim() || !contentForm.activeRecallSummary.trim()) {
      setContentError('Title + active-recall summary required.');
      return;
    }
    setContentError(null);
    try {
      const res = await fetch('/api/founder-os/content-log', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: contentForm.title.trim(),
          source: contentForm.source,
          durationMin: Number(contentForm.durationMin) || 30,
          activeRecallSummary: contentForm.activeRecallSummary.trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setContentError(j?.error ?? 'Save failed');
        return;
      }
      setContentForm({ title: '', source: 'YouTube', durationMin: 30, activeRecallSummary: '' });
      setShowContentForm(false);
      await fetchAll();
    } catch (e) {
      setContentError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [contentForm, headers, fetchAll]);

  const handleAddSkill = useCallback(async () => {
    if (!skillForm.skill.trim() || !skillForm.quarter.trim()) {
      setSkillError('Skill + quarter required.');
      return;
    }
    setSkillError(null);
    try {
      const res = await fetch('/api/founder-os/skills', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quarter: skillForm.quarter.trim(),
          skill: skillForm.skill.trim(),
          whyItMatters: skillForm.whyItMatters.trim() || undefined,
          preAssessment: skillForm.preAssessment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setSkillError(j?.error ?? 'Save failed');
        return;
      }
      setSkillForm({ quarter: '', skill: '', whyItMatters: '', preAssessment: '' });
      setShowSkillForm(false);
      await fetchAll();
    } catch (e) {
      setSkillError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [skillForm, headers, fetchAll]);

  const updateSkillStatus = useCallback(
    async (id: string, status: SkillItem['status']) => {
      try {
        await fetch(`/api/founder-os/skills?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status }),
        });
        await fetchAll();
      } catch (_err2) {
        // silent
        void _err2;
      }
    },
    [headers, fetchAll]
  );

  const handleSaveReview = useCallback(async () => {
    if (!reviewForm.topLongForm.trim() || !reviewForm.internalLocusReflection.trim()) {
      setReviewError('Top long-form + internal locus reflection required.');
      return;
    }
    setReviewError(null);
    try {
      // Use today as week-start for simplicity; the API uniques on userId+weekStartDate.
      const weekStartDate = todayLocalISO();
      const res = await fetch('/api/founder-os/weekly-reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          weekStartDate,
          topLongForm: reviewForm.topLongForm.trim(),
          oneSkillNote: reviewForm.oneSkillNote.trim() || undefined,
          internalLocusReflection: reviewForm.internalLocusReflection.trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setReviewError(j?.error ?? 'Save failed');
        return;
      }
      setReviewForm({ topLongForm: '', oneSkillNote: '', internalLocusReflection: '' });
      setShowReviewForm(false);
      await fetchAll();
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [reviewForm, headers, fetchAll]);

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Founder OS…
      </div>
    );
  }

  // Map checkins to the visualization shape (drop the id, keep fields).
  const checkinRecords: CheckinRecord[] = checkins.map(c => ({
    date: c.date,
    sfcZero: c.sfcZero,
    deepWorkHours: c.deepWorkHours,
    deepReadingMinutes: c.deepReadingMinutes,
    exercise: c.exercise,
    meditation: c.meditation,
  }));

  return (
    <div className="founder-os-tab">
      {/* DAILY VERSE PILL */}
      <BibleVersePill />

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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
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
              GTM v3.5 §11 Founder Operating System · synced across phone + laptop
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              The cognitive infrastructure that makes the GTM strategy executable.
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                margin: '8px 0 0',
                lineHeight: 1.55,
                maxWidth: 760,
              }}
            >
              v3.5 assumes a solo founder running 5-10 personalised LinkedIn DMs/week + 2 London
              events/month + Vohra survey discipline + Sankore engagement + outcome capture
              sustainably for 6 years. That motion is only physically possible with the cognitive
              hardware to support it. The asymmetric arbitrage: as the baseline of your peers
              actively falls, your gap widens daily without you having to run faster. Check this tab
              once daily, first thing, before LinkedIn or email.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: refreshing ? 'wait' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
            aria-label="Refresh OS data"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* EVENT PREP — Phase 1 wedge calendar (deep nightly audit Section 9.1, locked 2026-05-05) */}
      <EventPrepCard />

      {/* STREAK + TODAY CHECKIN */}
      <div
        className="founder-os-streak-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
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
                fontWeight: 600,
                marginLeft: 6,
              }}
            >
              day{sfcStreak === 1 ? '' : 's'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {totalCheckins === 0
              ? "Log today's checkin to start the streak."
              : `${sfcZeroDays} of ${totalCheckins} days SFC-free (${adherencePct}% lifetime)`}
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
              Dopaminergic baseline reset · keep going
            </div>
          )}
        </div>

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
                Today&apos;s checkin · {todayLocalISO()}
              </div>
              <h3
                style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}
              >
                Five questions, thirty seconds.
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSaveCheckin}
              disabled={saveStatus === 'saving'}
              style={{
                padding: '8px 16px',
                background:
                  saveStatus === 'saved'
                    ? 'var(--success)'
                    : saveStatus === 'error'
                      ? 'var(--error)'
                      : 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
            >
              {saveStatus === 'saving'
                ? 'Saving…'
                : saveStatus === 'saved'
                  ? '✓ Saved'
                  : saveStatus === 'error'
                    ? 'Try again'
                    : 'Save checkin'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              placeholder="Anything to capture (optional). One sentence about what surprised you, what you learned, or what fragmented you."
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

      {/* COMPOUND MATH CALLOUT */}
      <div style={{ marginBottom: 20 }}>
        <CompoundMathCallout
          sfcZeroDays={sfcZeroDays}
          totalDeepWorkHours={totalDeepWorkHours}
          totalReadingMinutes={totalReadingMinutes}
        />
      </div>

      {/* HEATMAP */}
      <div style={{ marginBottom: 20 }}>
        <StreakHeatmap checkins={checkinRecords} />
      </div>

      {/* RADAR + TREND CHART */}
      <div
        className="founder-os-charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.4fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <PillarAdherenceRadar
          checkins={checkinRecords}
          longFormPiecesLast30Days={longFormLast30}
          skillsInProgressOrComplete={skillsActive}
          weeklyReviewsLast4Weeks={reviewsLast4w}
        />
        <CognitiveTrendChart checkins={checkinRecords} />
      </div>

      {/* SIX PILLARS — Interactive System Map */}
      <InteractivePillars adherence={pillarAdherence} />

      {/* CONTENT LOG */}
      <div
        style={{
          marginTop: 8,
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <input
              type="text"
              placeholder="Title (e.g. 'Lex Fridman × Yann LeCun on World Models')"
              value={contentForm.title}
              onChange={e =>
                setContentForm({ ...contentForm, title: e.target.value.slice(0, 500) })
              }
              style={inputStyle}
            />
            <select
              value={contentForm.source}
              onChange={e => setContentForm({ ...contentForm, source: e.target.value })}
              style={inputStyle}
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
              min={1}
              max={1000}
              step={5}
              placeholder="Duration (min)"
              value={contentForm.durationMin}
              onChange={e =>
                setContentForm({ ...contentForm, durationMin: Number(e.target.value) })
              }
              style={inputStyle}
            />
          </div>
          <textarea
            value={contentForm.activeRecallSummary}
            onChange={e =>
              setContentForm({ ...contentForm, activeRecallSummary: e.target.value.slice(0, 4000) })
            }
            placeholder="Active recall summary — write 2-4 sentences from MEMORY. Don't peek at notes. The retrieval IS the encoding."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {contentError && <ErrorBanner text={contentError} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddContent}
              disabled={!contentForm.title.trim() || !contentForm.activeRecallSummary.trim()}
              style={primaryBtnStyle}
            >
              Save piece
            </button>
          </div>
        </div>
      )}

      {contentLog.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contentLog.slice(0, 12).map(item => (
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
                  {item.source} · {item.durationMin}min ·{' '}
                  {new Date(item.capturedAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.activeRecallSummary}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKILL TIMELINE */}
      <div style={{ marginTop: 28 }}>
        <SkillTimeline skills={skills} />
      </div>

      {/* SKILL TRACKER FORMS */}
      <div
        style={{
          marginTop: 16,
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
              value={skillForm.quarter}
              onChange={e => setSkillForm({ ...skillForm, quarter: e.target.value.slice(0, 20) })}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Skill (e.g. Causal inference + counterfactual reasoning)"
              value={skillForm.skill}
              onChange={e => setSkillForm({ ...skillForm, skill: e.target.value.slice(0, 500) })}
              style={inputStyle}
            />
          </div>
          <textarea
            placeholder="Why it matters — connect to v3.5 phase / customer want / specific buyer-class persona"
            value={skillForm.whyItMatters}
            onChange={e =>
              setSkillForm({ ...skillForm, whyItMatters: e.target.value.slice(0, 2000) })
            }
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <textarea
            placeholder="Pre-assessment — current state, what you can / can't do today"
            value={skillForm.preAssessment}
            onChange={e =>
              setSkillForm({ ...skillForm, preAssessment: e.target.value.slice(0, 2000) })
            }
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {skillError && <ErrorBanner text={skillError} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!skillForm.skill.trim() || !skillForm.quarter.trim()}
              style={primaryBtnStyle}
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
                  onChange={e => updateSkillStatus(skill.id, e.target.value as SkillItem['status'])}
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
                  <strong style={{ color: 'var(--text-primary)' }}>Why:</strong>{' '}
                  {skill.whyItMatters}
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

      {/* WEEKLY REVIEW */}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Three questions, twenty minutes.
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {reviews.length === 0
                ? 'No weekly reviews logged yet. Block 20 minutes Sunday evening.'
                : `${reviews.length} weekly review${reviews.length === 1 ? '' : 's'} logged.`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewForm(s => !s)}
            style={{
              padding: '8px 14px',
              background: showReviewForm ? 'var(--bg-card)' : 'var(--accent-primary)',
              color: showReviewForm ? 'var(--text-primary)' : '#fff',
              border: showReviewForm
                ? '1px solid var(--border-color)'
                : '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showReviewForm ? 'Cancel' : "Write this week's review"}
          </button>
        </div>

        {showReviewForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <textarea
              placeholder="1. Top 3 long-form pieces this week + 2-sentence active-recall summary of each (from memory)"
              value={reviewForm.topLongForm}
              onChange={e =>
                setReviewForm({ ...reviewForm, topLongForm: e.target.value.slice(0, 4000) })
              }
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <textarea
              placeholder="2. Skill acquisition note (optional) — what you learned, what got you stuck, what primary source you need next"
              value={reviewForm.oneSkillNote}
              onChange={e =>
                setReviewForm({ ...reviewForm, oneSkillNote: e.target.value.slice(0, 2000) })
              }
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <textarea
              placeholder="3. Internal locus reflection — what was outside your control this week, what was inside, where did you conflate the two"
              value={reviewForm.internalLocusReflection}
              onChange={e =>
                setReviewForm({
                  ...reviewForm,
                  internalLocusReflection: e.target.value.slice(0, 4000),
                })
              }
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {reviewError && <ErrorBanner text={reviewError} />}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={
                  !reviewForm.topLongForm.trim() || !reviewForm.internalLocusReflection.trim()
                }
                style={primaryBtnStyle}
              >
                Save weekly review
              </button>
            </div>
          </div>
        )}

        {reviews.length > 0 && !showReviewForm && (
          <details style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Re-read recent reviews</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {reviews.slice(0, 6).map(r => (
                <div
                  key={r.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      marginBottom: 6,
                    }}
                  >
                    Week of {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      marginBottom: 6,
                    }}
                  >
                    <strong>Top long-form:</strong> {r.topLongForm}
                  </div>
                  {r.oneSkillNote && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        marginBottom: 6,
                      }}
                    >
                      <strong>Skill note:</strong> {r.oneSkillNote}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <strong>Internal locus:</strong> {r.internalLocusReflection}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* COMMITMENT RECORD */}
      <CommitmentRecord />

      {/* LIFESTYLE FREEZE — Sharran principle 5 weaponised as investor-narrative
          anchor. Sits between CommitmentRecord (the physical commitment) and
          BuildInPublicSection (the public posture) per the founder-OS rhythm.
          Item locked 2026-05-07 from master KB Q2 synthesis. */}
      <LifestyleFreezeCard />

      {/* BUILD-IN-PUBLIC PROTOCOL — the SFC ↔ audience-building paradox dissolved */}
      <BuildInPublicSection />

      {/* WHY SFC IS BAD + SABOTAGE TABLES — Interactive Threat Matrix */}
      <InteractiveSfcMatrix />

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
        <strong style={{ color: 'var(--text-primary)' }}>Sync:</strong> Data persists to Supabase
        and follows your Supabase auth across phone + laptop. Daily checkin, content log, skill
        tracker, weekly reviews, and personal commitments all survive across devices and across
        browser-cache clears. Open this tab on phone first thing in the morning to log SFC=0; the
        laptop view tonight shows the same data.
      </div>

      {/* Mobile-first responsive — collapse the two-column grids on narrow viewports */}
      <style jsx>{`
        @media (max-width: 800px) {
          :global(.founder-os-streak-grid),
          :global(.founder-os-charts-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 13,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  background: 'var(--accent-primary)',
  color: '#fff',
  border: '1px solid var(--accent-primary)',
  borderRadius: 'var(--radius-full)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

function ErrorBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'color-mix(in srgb, var(--error) 10%, transparent)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--error)',
        fontSize: 12,
      }}
    >
      {text}
    </div>
  );
}
