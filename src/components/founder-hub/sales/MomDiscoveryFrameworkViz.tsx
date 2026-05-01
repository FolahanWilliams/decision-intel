'use client';

/**
 * MomDiscoveryFrameworkViz — interactive SVG flow visualization of the
 * v3.3 hybrid discovery + tailored-pitch motion (locked 2026-05-01).
 *
 * Renders the conversation arc as a 6-stage horizontal flow:
 *   Q1 (dread) → Q2 (surprise) → Q3 (past pay) → Q4 (intros) → PIVOT → PITCH
 *
 * Click any node to zoom into the stage detail (verbatim question OR
 * pivot sentence OR pitch-trigger picker). Hover highlights the
 * sequence — the visual reinforces "discovery FIRST through Q4, then
 * pivot, then tailored pitch" by colour + edge-weight.
 *
 * Source-of-truth: src/lib/data/discovery-pitch-toolkit.ts. When the
 * motion changes, edit the data file; the viz regenerates.
 *
 * Visual style mirrors AnatomyOfACallGraph (pure SVG + framer-motion;
 * respects prefers-reduced-motion).
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import {
  DISCOVERY_QUESTIONS,
  PITCH_TRIGGERS,
  type DiscoveryQuestion,
  type PitchTrigger,
} from '@/lib/data/discovery-pitch-toolkit';

const C = {
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.06)',
  greenBorder: 'rgba(22, 163, 74, 0.30)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  amberBorder: 'rgba(217, 119, 6, 0.30)',
  indigo: '#6366F1',
  indigoSoft: 'rgba(99, 102, 241, 0.06)',
  indigoBorder: 'rgba(99, 102, 241, 0.30)',
  slate: '#64748B',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate900: '#0F172A',
};

type StageId = 'q1' | 'q2' | 'q3' | 'q4' | 'pivot' | 'pitch';

interface Stage {
  id: StageId;
  label: string;
  shortLabel: string;
  /** 'discovery' | 'pivot' | 'pitch' — colour-encoded by phase. */
  phase: 'discovery' | 'pivot' | 'pitch';
}

const STAGES: Stage[] = [
  { id: 'q1', label: 'Q1 · Dread', shortLabel: 'Q1', phase: 'discovery' },
  { id: 'q2', label: 'Q2 · Surprise', shortLabel: 'Q2', phase: 'discovery' },
  { id: 'q3', label: 'Q3 · Past pay', shortLabel: 'Q3', phase: 'discovery' },
  { id: 'q4', label: 'Q4 · Intros', shortLabel: 'Q4', phase: 'discovery' },
  { id: 'pivot', label: 'Pivot sentence', shortLabel: 'Pivot', phase: 'pivot' },
  { id: 'pitch', label: 'Tailored pitch', shortLabel: 'Pitch', phase: 'pitch' },
];

const PIVOT_SENTENCE =
  'Based on what you said about [their pain in their words], I think I have something you should see.';

function phaseColor(phase: Stage['phase']): {
  fill: string;
  stroke: string;
  text: string;
} {
  if (phase === 'pivot')
    return { fill: C.amberSoft, stroke: C.amber, text: C.amber };
  if (phase === 'pitch')
    return { fill: C.indigoSoft, stroke: C.indigo, text: C.indigo };
  return { fill: C.greenSoft, stroke: C.green, text: C.green };
}

export function MomDiscoveryFrameworkViz() {
  const [activeStage, setActiveStage] = useState<StageId>('q1');
  const [activeTrigger, setActiveTrigger] = useState(0);
  const reduceMotion = useReducedMotion();

  const stage = STAGES.find(s => s.id === activeStage)!;
  const stageQuestion =
    activeStage === 'q1'
      ? DISCOVERY_QUESTIONS[0]
      : activeStage === 'q2'
        ? DISCOVERY_QUESTIONS[1]
        : activeStage === 'q3'
          ? DISCOVERY_QUESTIONS[2]
          : activeStage === 'q4'
            ? DISCOVERY_QUESTIONS[3]
            : null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${C.green}`,
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.green,
          marginBottom: 6,
        }}
      >
        Mom Discovery Test &middot; conversation flow
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        Discovery FIRST through Q4. Then pivot. Then pitch tailored to the signal.
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: '0 0 14px 0',
          lineHeight: 1.55,
        }}
      >
        Click any stage to zoom into the verbatim language. The green band is the
        Mom-Test-grade discovery you must complete before any pitch lands. The amber
        node is the non-negotiable pivot sentence. The indigo stage is where pitch
        happens, keyed off what they revealed.
      </p>

      {/* SVG flow diagram */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        <svg
          viewBox="0 0 720 140"
          width="100%"
          style={{
            minWidth: 640,
            display: 'block',
          }}
          aria-label="Mom Discovery Test conversation flow"
        >
          {/* Phase backgrounds */}
          <rect
            x="10"
            y="10"
            width="440"
            height="70"
            rx="10"
            fill={C.greenSoft}
            stroke={C.greenBorder}
            strokeWidth="1"
          />
          <rect
            x="470"
            y="10"
            width="100"
            height="70"
            rx="10"
            fill={C.amberSoft}
            stroke={C.amberBorder}
            strokeWidth="1"
          />
          <rect
            x="590"
            y="10"
            width="120"
            height="70"
            rx="10"
            fill={C.indigoSoft}
            stroke={C.indigoBorder}
            strokeWidth="1"
          />

          {/* Phase labels */}
          <text
            x="230"
            y="100"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={C.green}
            fontFamily="ui-sans-serif, system-ui"
            letterSpacing="1.2"
          >
            DISCOVERY · ALL FOUR, IN ORDER
          </text>
          <text
            x="520"
            y="100"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={C.amber}
            fontFamily="ui-sans-serif, system-ui"
            letterSpacing="1.2"
          >
            PIVOT
          </text>
          <text
            x="650"
            y="100"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={C.indigo}
            fontFamily="ui-sans-serif, system-ui"
            letterSpacing="1.2"
          >
            TAILORED PITCH
          </text>

          {/* Discovery Q nodes */}
          {[0, 1, 2, 3].map(i => {
            const cx = 70 + i * 110;
            const isActive = activeStage === STAGES[i].id;
            const colors = phaseColor('discovery');
            return (
              <g
                key={STAGES[i].id}
                onClick={() => setActiveStage(STAGES[i].id)}
                style={{ cursor: 'pointer' }}
              >
                <motion.circle
                  cx={cx}
                  cy={45}
                  r={isActive ? 26 : 22}
                  fill="white"
                  stroke={colors.stroke}
                  strokeWidth={isActive ? 3 : 2}
                  initial={false}
                  animate={
                    reduceMotion
                      ? undefined
                      : { r: isActive ? 26 : 22 }
                  }
                  transition={{ duration: 0.18 }}
                />
                <text
                  x={cx}
                  y={42}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={colors.text}
                  fontFamily="ui-sans-serif, system-ui"
                  pointerEvents="none"
                >
                  {STAGES[i].shortLabel}
                </text>
                <text
                  x={cx}
                  y={56}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={C.slate}
                  fontFamily="ui-sans-serif, system-ui"
                  pointerEvents="none"
                >
                  {STAGES[i].label.split('·')[1]?.trim() ?? ''}
                </text>
              </g>
            );
          })}

          {/* Pivot node */}
          <g
            onClick={() => setActiveStage('pivot')}
            style={{ cursor: 'pointer' }}
          >
            <motion.rect
              x={490}
              y={20}
              width={60}
              height={50}
              rx={8}
              fill="white"
              stroke={C.amber}
              strokeWidth={activeStage === 'pivot' ? 3 : 2}
              initial={false}
            />
            <text
              x={520}
              y={42}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill={C.amber}
              fontFamily="ui-sans-serif, system-ui"
              pointerEvents="none"
            >
              PIVOT
            </text>
            <text
              x={520}
              y={56}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={C.slate}
              fontFamily="ui-sans-serif, system-ui"
              pointerEvents="none"
            >
              after Q4
            </text>
          </g>

          {/* Pitch node */}
          <g
            onClick={() => setActiveStage('pitch')}
            style={{ cursor: 'pointer' }}
          >
            <motion.rect
              x={605}
              y={20}
              width={90}
              height={50}
              rx={8}
              fill="white"
              stroke={C.indigo}
              strokeWidth={activeStage === 'pitch' ? 3 : 2}
              initial={false}
            />
            <text
              x={650}
              y={42}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill={C.indigo}
              fontFamily="ui-sans-serif, system-ui"
              pointerEvents="none"
            >
              PITCH
            </text>
            <text
              x={650}
              y={56}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={C.slate}
              fontFamily="ui-sans-serif, system-ui"
              pointerEvents="none"
            >
              tailored
            </text>
          </g>

          {/* Edges between Q1-Q4 (intra-discovery) */}
          {[0, 1, 2].map(i => {
            const x1 = 70 + i * 110 + 22;
            const x2 = 70 + (i + 1) * 110 - 22;
            return (
              <line
                key={`edge-${i}`}
                x1={x1}
                y1={45}
                x2={x2}
                y2={45}
                stroke={C.green}
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Edge Q4 → Pivot */}
          <line
            x1={70 + 3 * 110 + 22}
            y1={45}
            x2={490}
            y2={45}
            stroke={C.amber}
            strokeWidth="2.5"
          />

          {/* Edge Pivot → Pitch */}
          <line
            x1={550}
            y1={45}
            x2={605}
            y2={45}
            stroke={C.indigo}
            strokeWidth="2.5"
          />

          {/* Arrow markers (simple inline triangles) */}
          <polygon points="488,40 488,50 494,45" fill={C.amber} />
          <polygon points="603,40 603,50 609,45" fill={C.indigo} />
        </svg>
      </div>

      {/* Down-arrow into the detail panel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '12px 0',
          color: phaseColor(stage.phase).text,
        }}
      >
        <ArrowDown size={16} />
      </div>

      {/* Active-stage detail panel */}
      <div
        style={{
          background:
            stage.phase === 'pivot'
              ? C.amberSoft
              : stage.phase === 'pitch'
                ? C.indigoSoft
                : C.greenSoft,
          border: `1px solid ${
            stage.phase === 'pivot'
              ? C.amberBorder
              : stage.phase === 'pitch'
                ? C.indigoBorder
                : C.greenBorder
          }`,
          borderRadius: 'var(--radius-sm)',
          padding: 14,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: phaseColor(stage.phase).text,
            marginBottom: 6,
          }}
        >
          {stage.label}
        </div>
        {stageQuestion && <DiscoveryQuestionDetail q={stageQuestion} />}
        {stage.id === 'pivot' && <PivotDetail />}
        {stage.id === 'pitch' && (
          <PitchDetail
            activeTrigger={activeTrigger}
            onSelectTrigger={setActiveTrigger}
          />
        )}
      </div>
    </div>
  );
}

// ─── Detail panels ────────────────────────────────────────────────

function DiscoveryQuestionDetail({ q }: { q: DiscoveryQuestion }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 8,
        }}
      >
        &ldquo;{q.question}&rdquo;
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 6,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Why this question:</strong> {q.why}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Watch for:</strong>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
          {q.watchFor.map(s => (
            <li key={s} style={{ marginBottom: 2 }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PivotDetail() {
  return (
    <div>
      <div
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          padding: '12px 14px',
          background: 'var(--bg-card)',
          border: `1px solid ${C.amberBorder}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 8,
        }}
      >
        &ldquo;{PIVOT_SENTENCE}&rdquo;
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        Non-negotiable. The sentence is the conversion from listener to advocate. Skip it
        and you relapse into generic pitching. Quote the buyer&rsquo;s exact words inside
        the [bracket] — that&rsquo;s the signal that you listened.
      </div>
    </div>
  );
}

function PitchDetail({
  activeTrigger,
  onSelectTrigger,
}: {
  activeTrigger: number;
  onSelectTrigger: (i: number) => void;
}) {
  const trigger: PitchTrigger = PITCH_TRIGGERS[activeTrigger];
  return (
    <div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          marginBottom: 8,
          lineHeight: 1.5,
        }}
      >
        Pitch is keyed to the signal — what they revealed in Q1-Q3. Pick the trigger that
        matches what you heard:
      </div>
      <select
        value={activeTrigger}
        onChange={e => onSelectTrigger(Number(e.target.value))}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: 12,
          background: 'var(--bg-card)',
          border: `1px solid ${C.indigoBorder}`,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          marginBottom: 10,
          cursor: 'pointer',
        }}
      >
        {PITCH_TRIGGERS.map((t, i) => (
          <option key={i} value={i}>
            If they revealed: &ldquo;{t.ifRevealed.slice(0, 80)}
            {t.ifRevealed.length > 80 ? '…' : ''}&rdquo;
          </option>
        ))}
      </select>
      <div
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: `1px solid ${C.indigoBorder}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 8,
        }}
      >
        &ldquo;{trigger.pitch}&rdquo;
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: '#DC2626' }}>Avoid:</strong> {trigger.avoid}
      </div>
    </div>
  );
}
