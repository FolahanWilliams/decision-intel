'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Target,
  Radar,
  MessageSquare,
  Shield,
  Zap,
  Crosshair,
  Brain,
  Plug,
  Library,
  Lightbulb,
  GraduationCap,
  Map,
  Rocket,
  Sparkles,
  Compass,
} from 'lucide-react';

// ─── Study-plan data ─────────────────────────────────────────────
// A 2-day walkthrough of every Founder Hub tab organised into 4 sessions.
// Designed so you finish Day 2 with the entire hub in your head and
// outreach as the only remaining to-do.

interface TabLink {
  tabId: string;
  label: string;
  icon: React.ReactNode;
  minutes: number;
  why: string;
}

interface StudySession {
  num: 1 | 2 | 3 | 4;
  title: string;
  slot: string;
  color: string;
  bg: string;
  goal: string;
  tabs: TabLink[];
}

const SESSIONS: StudySession[] = [
  {
    num: 1,
    title: 'Foundation — what you actually built',
    slot: 'Day 1 · Morning',
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.14)',
    goal: 'You can explain the 12-node pipeline, why DQI exists, and the 260-year intellectual genealogy in under 2 minutes, without notes.',
    tabs: [
      {
        tabId: 'overview',
        label: 'Product Overview',
        icon: <Rocket size={14} />,
        minutes: 15,
        why: 'The product vision — Decision Knowledge Graph as foundation, four moments, locked vocabulary. Start here.',
      },
      {
        tabId: 'product_deep',
        label: 'Pipeline & Scoring',
        icon: <Brain size={14} />,
        minutes: 30,
        why: '12-node LangGraph pipeline, scoring engine with toxic combinations, and DQI methodology. The technical core.',
      },
      {
        tabId: 'research',
        label: 'Research & Foundations',
        icon: <BookOpen size={14} />,
        minutes: 45,
        why: 'Every thinker and paper that shaped the product. Start with the Noise moment — that 55% stat is your Monday sales line.',
      },
    ],
  },
  {
    num: 2,
    title: 'Position — how you differ from incumbents',
    slot: 'Day 1 · Afternoon',
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.14)',
    goal: 'You know where each of the 5 DI incumbents sits, the 3 gaps you close with shipped evidence, and the moat narrative cold.',
    tabs: [
      {
        tabId: 'category_position',
        label: 'Category Position',
        icon: <Radar size={14} />,
        minutes: 20,
        why: 'DI landscape map. Three gaps (causal / outcome loop / governance) anchored to actual shipped files.',
      },
      {
        tabId: 'positioning',
        label: 'Competitive Positioning',
        icon: <Shield size={14} />,
        minutes: 25,
        why: 'Cloverpop comparison, 5 moat layers, capability matrix, 8 investor Q&As, and the common objection rebuttals.',
      },
      {
        tabId: 'positioning_copilot',
        label: 'Positioning Copilot',
        icon: <Compass size={14} />,
        minutes: 45,
        why: 'Sharp\u2019s brand spine, market thesis, strategic compass, pitch deck, plus 7 bonus positioning frameworks.',
      },
      {
        tabId: 'sales',
        label: 'Sales Toolkit',
        icon: <MessageSquare size={14} />,
        minutes: 30,
        why: 'Challenger Sale, SPIN, MEDDPICC, demo flow, and audience-specific pitches. Tactical sales layer.',
      },
    ],
  },
  {
    num: 3,
    title: 'Execution — this week\u2019s outreach motion',
    slot: 'Day 2 · Morning',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.14)',
    goal: 'You have 5\u201310 Monday-morning outreach drafts queued and you know exactly which pattern to listen for on the first discovery call.',
    tabs: [
      {
        tabId: 'outreach_cmd',
        label: 'Outreach Command Center',
        icon: <Zap size={14} />,
        minutes: 40,
        why: 'This-week priority, buyer personas, industry atlas, channel matrix, contact pipeline, discovery call companion, pattern dashboard, templates, POC kit, deal-closer docs.',
      },
      {
        tabId: 'outreach',
        label: 'Outreach & Meetings',
        icon: <Crosshair size={14} />,
        minutes: 20,
        why: 'Prospect pipeline, weekly brief, meeting prep, stakeholder notes.',
      },
      {
        tabId: 'content',
        label: 'Content Studio',
        icon: <Zap size={14} />,
        minutes: 15,
        why: 'LinkedIn post generator, case study analyzer, voice config. The content flywheel.',
      },
    ],
  },
  {
    num: 4,
    title: 'Intelligence & personal — the flywheel + your path',
    slot: 'Day 2 · Afternoon',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.14)',
    goal: 'You understand the outcome flywheel, know which of the 135 cases to cite in pitches, and you\u2019ve committed to bootstrap vs. VC with explicit gates.',
    tabs: [
      {
        tabId: 'case_library',
        label: 'Case Library',
        icon: <Library size={14} />,
        minutes: 20,
        why: '135 historical decisions, bias interaction matrix, Decision Alpha leaderboard. Pick 3 to cite.',
      },
      {
        tabId: 'data_ecosystem',
        label: 'Data Ecosystem',
        icon: <Plug size={14} />,
        minutes: 15,
        why: 'Integrations (Slack, Drive, email, webhooks) + live stats. The flywheel inputs and outputs.',
      },
      {
        tabId: 'forecast',
        label: '12-Month Forecast',
        icon: <Map size={14} />,
        minutes: 20,
        why: 'Bootstrap vs. VC lanes, 4 quarters, milestone drill-down. Pick a lane.',
      },
      {
        tabId: 'founder_tips',
        label: 'Founder Tips',
        icon: <Lightbulb size={14} />,
        minutes: 10,
        why: 'Playbook notes, session learnings, honest self-reflection.',
      },
      {
        tabId: 'founder_school',
        label: 'Founder School',
        icon: <GraduationCap size={14} />,
        minutes: 25,
        why: '58 lessons across 8 tracks. Sample one or two that match your current bottleneck.',
      },
    ],
  },
];

const STORAGE_KEY = 'di-study-plan-progress-v1';

interface Progress {
  completedTabs: string[];
}

function loadProgress(): Progress {
  if (typeof window === 'undefined') return { completedTabs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedTabs: [] };
    const parsed = JSON.parse(raw) as { completedTabs?: string[] };
    return { completedTabs: Array.isArray(parsed.completedTabs) ? parsed.completedTabs : [] };
  } catch {
    return { completedTabs: [] };
  }
}

function saveProgress(p: Progress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota/private mode — silent */
  }
}

// ─── Flow SVG layout ────────────────────────────────────────────────
const FLOW_W = 1000;
const FLOW_H = 220;
const NODE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 120, y: 140 },
  { x: 380, y: 70 },
  { x: 620, y: 140 },
  { x: 880, y: 70 },
];
const NODE_R = 38;

interface Props {
  onNavigateToTab: (tabId: string) => void;
}

export function StartHereTab({ onNavigateToTab }: Props) {
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setCompletedTabs(new Set(p.completedTabs));
    setHydrated(true);
  }, []);

  const toggleTab = useCallback((tabId: string) => {
    setCompletedTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      saveProgress({ completedTabs: Array.from(next) });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCompletedTabs(new Set());
    saveProgress({ completedTabs: [] });
  }, []);

  const totals = useMemo(() => {
    const totalTabs = SESSIONS.reduce((a, s) => a + s.tabs.length, 0);
    const totalDone = SESSIONS.reduce(
      (a, s) => a + s.tabs.filter(t => completedTabs.has(t.tabId)).length,
      0
    );
    const totalMinutes = SESSIONS.reduce(
      (a, s) => a + s.tabs.reduce((b, t) => b + t.minutes, 0),
      0
    );
    const doneMinutes = SESSIONS.reduce(
      (a, s) =>
        a + s.tabs.filter(t => completedTabs.has(t.tabId)).reduce((b, t) => b + t.minutes, 0),
      0
    );
    return { totalTabs, totalDone, totalMinutes, doneMinutes };
  }, [completedTabs]);

  const overallPct = totals.totalTabs === 0 ? 0 : totals.totalDone / totals.totalTabs;

  function sessionProgress(s: StudySession): number {
    if (s.tabs.length === 0) return 0;
    return s.tabs.filter(t => completedTabs.has(t.tabId)).length / s.tabs.length;
  }

  function scrollToSession(num: number) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`study-session-${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      {renderHero(totals, overallPct, reset)}
      {renderFlow(sessionProgress, scrollToSession)}
      {SESSIONS.map(s => (
        <SessionCard
          key={s.num}
          session={s}
          completedTabs={completedTabs}
          onToggleTab={toggleTab}
          onNavigateToTab={onNavigateToTab}
          hydrated={hydrated}
        />
      ))}
      {renderNextAction(overallPct)}
    </div>
  );
}

// ─── Hero with progress ring ─────────────────────────────────────

function renderHero(
  totals: { totalTabs: number; totalDone: number; totalMinutes: number; doneMinutes: number },
  overallPct: number,
  reset: () => void
) {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(139,92,246,0.08))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        Start Here
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Your Founder Hub, in 2 days.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 12,
          lineHeight: 1.55,
          maxWidth: 760,
        }}
      >
        Four focused sessions, 15 tabs, ~{Math.round((totals.totalMinutes / 60) * 10) / 10} hours.
        Designed so you finish Day 2 with everything in your head and nothing on the to-do list
        except outreach. Tick tabs as you read them — progress saves automatically.
      </p>

      {/* Progress bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx={32}
              cy={32}
              r={27}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={5}
            />
            <circle
              cx={32}
              cy={32}
              r={27}
              fill="none"
              stroke="#16A34A"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 27}
              strokeDashoffset={2 * Math.PI * 27 * (1 - overallPct)}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#16A34A',
            }}
          >
            {Math.round(overallPct * 100)}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {totals.totalDone} of {totals.totalTabs} tabs complete
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {totals.doneMinutes} of {totals.totalMinutes} minutes studied
          </div>
        </div>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 4px)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={11} /> Reset progress
        </button>
      </div>
    </div>
  );
}

// ─── Flow visualization (S-curve with 4 nodes) ───────────────────

function renderFlow(
  sessionProgress: (s: StudySession) => number,
  scrollToSession: (num: number) => void
) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>The path</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          Four sessions flow into each other. Click any stop to jump to its session card below.
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${FLOW_W} ${FLOW_H}`}
          style={{ width: '100%', minWidth: 720, height: 'auto', display: 'block' }}
          role="img"
          aria-label="Study plan flow"
        >
          {/* Connecting path — S-curve through the 4 nodes */}
          <path
            d={`M ${NODE_POSITIONS[0].x},${NODE_POSITIONS[0].y}
                C ${(NODE_POSITIONS[0].x + NODE_POSITIONS[1].x) / 2},${NODE_POSITIONS[0].y}
                  ${(NODE_POSITIONS[0].x + NODE_POSITIONS[1].x) / 2},${NODE_POSITIONS[1].y}
                  ${NODE_POSITIONS[1].x},${NODE_POSITIONS[1].y}
                C ${(NODE_POSITIONS[1].x + NODE_POSITIONS[2].x) / 2},${NODE_POSITIONS[1].y}
                  ${(NODE_POSITIONS[1].x + NODE_POSITIONS[2].x) / 2},${NODE_POSITIONS[2].y}
                  ${NODE_POSITIONS[2].x},${NODE_POSITIONS[2].y}
                C ${(NODE_POSITIONS[2].x + NODE_POSITIONS[3].x) / 2},${NODE_POSITIONS[2].y}
                  ${(NODE_POSITIONS[2].x + NODE_POSITIONS[3].x) / 2},${NODE_POSITIONS[3].y}
                  ${NODE_POSITIONS[3].x},${NODE_POSITIONS[3].y}`}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="2 8"
          />

          {/* Start label */}
          <text
            x={NODE_POSITIONS[0].x - NODE_R - 10}
            y={NODE_POSITIONS[0].y + 4}
            textAnchor="end"
            fontSize={11}
            fontWeight={700}
            fill="var(--text-muted)"
          >
            START
          </text>

          {/* Finish label */}
          <text
            x={NODE_POSITIONS[3].x + NODE_R + 10}
            y={NODE_POSITIONS[3].y + 4}
            textAnchor="start"
            fontSize={11}
            fontWeight={700}
            fill="var(--text-muted)"
          >
            OUTREACH
          </text>

          {/* Session nodes */}
          {SESSIONS.map((s, i) => {
            const pos = NODE_POSITIONS[i];
            const p = sessionProgress(s);
            const isDone = p >= 1;
            const isStarted = p > 0 && p < 1;
            return (
              <g
                key={s.num}
                style={{ cursor: 'pointer' }}
                onClick={() => scrollToSession(s.num)}
                role="button"
                aria-label={`Session ${s.num}: ${s.title}`}
              >
                {/* Outer ring (progress) */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth={4}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * NODE_R}
                  strokeDashoffset={2 * Math.PI * NODE_R * (1 - p)}
                  transform={`rotate(-90 ${pos.x} ${pos.y})`}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
                {/* Inner filled circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R - 8}
                  fill={isDone ? s.color : s.bg}
                  stroke={s.color}
                  strokeWidth={1.5}
                />
                {/* Pulsing halo for in-progress */}
                {isStarted && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + 6}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeOpacity={0.4}
                  >
                    <animate
                      attributeName="r"
                      values={`${NODE_R + 6};${NODE_R + 12};${NODE_R + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.4;0.1;0.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {/* Session number or checkmark */}
                {isDone ? (
                  <g transform={`translate(${pos.x - 7} ${pos.y - 7})`}>
                    <path
                      d="M 2 7 L 6 11 L 14 3"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ) : (
                  <text
                    x={pos.x}
                    y={pos.y + 6}
                    textAnchor="middle"
                    fontSize={20}
                    fontWeight={800}
                    fill={s.color}
                  >
                    {s.num}
                  </text>
                )}
                {/* Label below node */}
                <text
                  x={pos.x}
                  y={pos.y + NODE_R + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={s.color}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  {s.slot}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + NODE_R + 32}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-primary)"
                >
                  {(s.title.split(' — ')[0] ?? s.title).slice(0, 22)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

// ─── Session card ────────────────────────────────────────────────

function SessionCard({
  session,
  completedTabs,
  onToggleTab,
  onNavigateToTab,
  hydrated,
}: {
  session: StudySession;
  completedTabs: Set<string>;
  onToggleTab: (tabId: string) => void;
  onNavigateToTab: (tabId: string) => void;
  hydrated: boolean;
}) {
  const doneCount = session.tabs.filter(t => completedTabs.has(t.tabId)).length;
  const isComplete = doneCount === session.tabs.length;
  const totalMinutes = session.tabs.reduce((a, t) => a + t.minutes, 0);

  return (
    <section
      id={`study-session-${session.num}`}
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${session.color}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
        scrollMarginTop: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: session.bg,
            color: session.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {isComplete ? <CheckCircle2 size={22} /> : session.num}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: session.color,
                padding: '3px 8px',
                background: session.bg,
                borderRadius: 4,
              }}
            >
              {session.slot}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={10} /> {totalMinutes} min
            </span>
            {hydrated && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                · {doneCount}/{session.tabs.length} read
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {session.title}
          </h3>
        </div>
      </div>

      {/* Learning goal */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${session.color}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <Target size={12} style={{ color: session.color }} />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: session.color,
            }}
          >
            Learning goal
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {session.goal}
        </div>
      </div>

      {/* Tab list */}
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {session.tabs.map((tab, i) => {
          const isDone = completedTabs.has(tab.tabId);
          return (
            <li
              key={tab.tabId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                background: isDone ? session.bg : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Tick button */}
              <button
                onClick={() => onToggleTab(tab.tabId)}
                aria-label={`Mark ${tab.label} as ${isDone ? 'unread' : 'read'}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: isDone ? session.color : 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                }}
              >
                {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>

              {/* Number + icon + name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: session.bg,
                      color: session.color,
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      color: session.color,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      textDecorationColor: session.color,
                    }}
                  >
                    {tab.label}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginLeft: 'auto',
                    }}
                  >
                    <Clock size={10} /> {tab.minutes} min
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: 8,
                  }}
                >
                  {tab.why}
                </div>
                <button
                  onClick={() => onNavigateToTab(tab.tabId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#fff',
                    background: session.color,
                    border: 'none',
                    borderRadius: 'var(--radius-sm, 4px)',
                    cursor: 'pointer',
                  }}
                >
                  Open tab <ArrowRight size={11} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Next action ─────────────────────────────────────────────────

function renderNextAction(overallPct: number) {
  const isComplete = overallPct >= 1;
  return (
    <section
      style={{
        padding: 18,
        background: isComplete
          ? 'linear-gradient(135deg, rgba(22,163,74,0.14), rgba(22,163,74,0.06))'
          : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: isComplete ? '3px solid #16A34A' : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isComplete ? <Sparkles size={16} /> : <ArrowRight size={16} />}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            {isComplete ? 'All four sessions complete.' : 'When you finish all four sessions:'}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginTop: 6,
            }}
          >
            Your next action is Monday-morning outreach — 5 to 10 messages from the Outreach Command
            Center templates, sent before noon. Nothing else. Everything in the hub only matters if
            a CSO replies.
          </div>
          {isComplete && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
              }}
            >
              <strong style={{ color: '#16A34A' }}>Well done.</strong> You now have 260 years of
              decision science, 37 thinkers, 5 incumbents, 3 market gaps, 9 Strebulaev principles,
              and 135 historical cases loaded in context. The only thing that converts this into
              revenue is a reply — go send the messages.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
