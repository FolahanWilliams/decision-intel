'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SPRINTS, type SprintTask } from './data';
import { SectionHeader } from './UnicornTimeline';
import { usePersistedChecks } from './use-persisted-checks';

const STORAGE_KEY = 'di-unicorn-roadmap-sprint-checks';

const LANE_META: Record<
  SprintTask['lane'],
  { label: string; color: string }
> = {
  positioning: { label: 'Positioning', color: '#16A34A' },
  product: { label: 'Product', color: '#7C3AED' },
  pipeline: { label: 'Pipeline', color: '#0EA5E9' },
  content: { label: 'Content', color: '#F59E0B' },
  founder: { label: 'Founder', color: '#DB2777' },
};

const EFFORT_META: Record<SprintTask['effort'], { label: string; width: number }> = {
  S: { label: 'S', width: 4 },
  M: { label: 'M', width: 8 },
  L: { label: 'L', width: 14 },
};

export function SprintBoard() {
  const { checks, toggle } = usePersistedChecks(STORAGE_KEY);

  const weeks = useMemo(() => {
    const grouped = new Map<number, SprintTask[]>();
    for (const t of SPRINTS) {
      const arr = grouped.get(t.week) ?? [];
      arr.push(t);
      grouped.set(t.week, arr);
    }
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const totalDone = SPRINTS.filter(s => checks[s.id]).length;
  const totalPct = Math.round((totalDone / SPRINTS.length) * 100);

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <SectionHeader
        eyebrow="The 90-day sprint"
        title="Twelve weeks to Design Partner #1 + pre-seed-ready."
        subtitle={`${totalDone} / ${SPRINTS.length} complete · ${totalPct}% of the sprint shipped.`}
      />
      <div style={{ padding: '18px 22px 24px' }}>
        <ProgressBar pct={totalPct} />
        <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
          {weeks.map(([week, tasks]) => (
            <WeekRow
              key={week}
              week={week}
              tasks={tasks}
              checks={checks}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 8,
        borderRadius: 4,
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        border: '1px solid var(--border-primary)',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, #16A34A 0%, #22C55E 100%)',
        }}
      />
    </div>
  );
}

function WeekRow({
  week,
  tasks,
  checks,
  onToggle,
}: {
  week: number;
  tasks: SprintTask[];
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: 14,
        padding: 14,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          Week
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {week.toString().padStart(2, '0')}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {tasks.map(t => (
          <TaskRow
            key={t.id}
            task={t}
            done={!!checks[t.id]}
            onToggle={() => onToggle(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  done,
  onToggle,
}: {
  task: SprintTask;
  done: boolean;
  onToggle: () => void;
}) {
  const lane = LANE_META[task.lane];
  const effort = EFFORT_META[task.effort];
  return (
    <button
      onClick={onToggle}
      aria-pressed={done}
      style={{
        display: 'grid',
        gridTemplateColumns: '22px 1fr auto',
        gap: 12,
        alignItems: 'flex-start',
        textAlign: 'left',
        padding: 10,
        borderRadius: 8,
        background: done ? 'rgba(22,163,74,0.08)' : 'var(--bg-card)',
        border: `1px solid ${done ? 'rgba(22,163,74,0.35)' : 'var(--border-primary)'}`,
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: done ? 'var(--accent-primary)' : 'transparent',
          border: `1.5px solid ${done ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {done && <Check size={12} color="#fff" strokeWidth={3} />}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            textDecoration: done ? 'line-through' : 'none',
            textDecorationColor: 'var(--text-muted)',
            opacity: done ? 0.7 : 1,
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginTop: 3,
          }}
        >
          {task.detail}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            color: lane.color,
            background: `${lane.color}15`,
            border: `1px solid ${lane.color}30`,
            padding: '2px 7px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {lane.label}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.08em',
          }}
          title={`Effort: ${task.effort}`}
        >
          {effort.label} · {effort.width}h
        </span>
      </div>
    </button>
  );
}
