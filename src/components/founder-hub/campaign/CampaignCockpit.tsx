'use client';

/**
 * The Build — campaign cockpit (2026-06-01). Founder-private; mounted at the
 * top of Start Here as the daily landing. Self-fetches /api/founder-os/campaign
 * (reads the public founder-pass env var, the same source the hub page uses).
 *
 * Renders: level (Scripture builder arc) + XP progress + the level's operating
 * principle, the Proverb-of-the-day (Bible as a business manual), today's +
 * this week's quests, the campaign milestones (boss-fights), and badges.
 *
 * XP is inputs-only by construction (the engine guarantees it) — this surface
 * never frames outcomes as the reward; faithfulness is.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Flame,
  Target,
  Mountain,
  Trophy,
  Lock,
  BookOpen,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import type { CampaignState, QuestState, MilestoneState } from './campaign-engine';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CampaignCockpit({ founderPass }: { founderPass?: string }) {
  const pass = founderPass ?? process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': pass }),
    [pass]
  );
  const [today] = useState(() => (typeof window === 'undefined' ? '' : todayIso()));
  const [state, setState] = useState<CampaignState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!today) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/founder-os/campaign?today=${today}`, {
          cache: 'no-store',
          headers,
        });
        const json = (await res.json().catch(() => null)) as ApiEnvelope<{
          campaign: CampaignState;
        }> | null;
        if (alive && json?.data?.campaign) setState(json.data.campaign);
      } catch {
        // degrade silently — the rest of Start Here still renders.
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [headers, today]);

  if (!loaded) {
    return (
      <AccentCard accent="primary" title={null}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your campaign…</div>
      </AccentCard>
    );
  }
  if (!state) return null;

  const { arc, nextArc, levelProgress, xpIntoLevel, xpForNextLevel, dailyClear } = state;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={sectionHeadingRow}>
        <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <h3 style={sectionHeadingText}>The Build</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· build on the rock</span>
      </div>

      {/* Level hero */}
      <AccentCard accent="primary" title={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-lg)',
              background: 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={22} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Level {arc.level} · {state.totalXp.toLocaleString()} XP
            </div>
            <div
              style={{
                fontSize: 'var(--fs-md, 18px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              {arc.name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{arc.season}</div>
          </div>
        </div>

        {/* XP progress to next arc */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 8,
              borderRadius: 5,
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(levelProgress * 100)}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            {nextArc
              ? `${xpForNextLevel ? xpForNextLevel - xpIntoLevel : 0} XP to ${nextArc.name} — ${nextArc.season.toLowerCase()}`
              : 'Final arc — finish the race, keep the faith.'}
          </div>
        </div>

        {/* The level's operating principle (Bible as business manual) */}
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 18%, transparent)',
          }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
            {arc.principle}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)', marginTop: 4 }}>
            {arc.scriptureRef}
          </div>
        </div>
      </AccentCard>

      {/* Principle of the day — the Bible as a business manual */}
      <AccentCard accent="info" title={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <BookOpen size={15} style={{ color: 'var(--info)' }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            Operating principle
          </span>
          <span style={{ fontSize: 11, color: 'var(--info)', fontWeight: 600 }}>
            {state.principle.scriptureRef}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          &ldquo;{state.principle.text}&rdquo;
        </p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--info)' }}>At work · </span>
          {state.principle.application}
        </p>
      </AccentCard>

      {/* Quests */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        className="campaign-quest-grid"
      >
        <AccentCard accent={dailyClear ? 'success' : 'primary'} title={null}>
          <QuestColumn
            icon={<Target size={15} />}
            title="Today's quests"
            quests={state.dailyQuests}
            footer={
              dailyClear
                ? `Daily clear — +${state.dailyXpEarned} XP. Well done, faithful.`
                : `+${state.dailyXpEarned} XP today so far`
            }
          />
        </AccentCard>
        <AccentCard accent="info" title={null}>
          <QuestColumn icon={<Target size={15} />} title="This week" quests={state.weeklyQuests} />
        </AccentCard>
      </div>

      {/* Campaign milestones — the boss-fights */}
      <AccentCard accent="warning" title={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Mountain size={15} style={{ color: 'var(--warning)' }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            The campaign
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· the real gates</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.milestones.map(m => (
            <MilestoneRow key={m.id} m={m} />
          ))}
        </div>
      </AccentCard>

      {/* Badges */}
      <AccentCard accent="muted" title={null}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Trophy size={15} style={{ color: 'var(--accent-primary)' }} aria-hidden />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            Badges
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            · {state.unlockedBadgeCount}/{state.badges.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.badges.map(b => (
            <span
              key={b.id}
              title={`${b.how} · ${b.scriptureRef}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${b.unlocked ? 'color-mix(in srgb, var(--accent-primary) 38%, transparent)' : 'var(--border-color)'}`,
                background: b.unlocked
                  ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                  : 'var(--bg-secondary)',
                color: b.unlocked ? 'var(--accent-primary)' : 'var(--text-muted)',
                opacity: b.unlocked ? 1 : 0.6,
              }}
            >
              {b.unlocked ? <Trophy size={11} /> : <Lock size={11} />}
              {b.label}
            </span>
          ))}
        </div>
      </AccentCard>

      <style>{`
        @media (max-width: 800px) {
          .campaign-quest-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function QuestColumn({
  icon,
  title,
  quests,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  quests: QuestState[];
  footer?: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color: 'var(--accent-primary)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {quests.map(q => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {q.done ? (
              <CheckCircle2
                size={15}
                style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}
              />
            ) : (
              <Circle
                size={15}
                style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}
              />
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 12.5,
                  color: q.done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: q.done ? 'line-through' : 'none',
                  lineHeight: 1.4,
                }}
              >
                {q.label}
                {q.target !== undefined && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                    {' '}
                    {q.progress ?? 0}/{q.target}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 6 }}>
                +{q.xp} · {q.scriptureRef}
              </span>
            </span>
          </div>
        ))}
      </div>
      {footer && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--success)', marginTop: 10 }}>
          {footer}
        </div>
      )}
    </>
  );
}

function MilestoneRow({ m }: { m: MilestoneState }) {
  const pct = m.target > 0 ? Math.round((m.current / m.target) * 100) : 0;
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {m.done && (
            <CheckCircle2
              size={13}
              style={{ verticalAlign: '-2px', marginRight: 4, color: 'var(--success)' }}
            />
          )}
          {m.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: m.done ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {m.current}/{m.target} {m.unit}
        </span>
      </div>
      <div
        style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '2px 0 5px' }}
      >
        {m.detail} <span style={{ color: 'var(--info)', fontWeight: 600 }}>{m.scriptureRef}</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 4,
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: m.done ? 'var(--success)' : 'var(--warning)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

const sectionHeadingRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const sectionHeadingText: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--fs-md, 18px)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};
