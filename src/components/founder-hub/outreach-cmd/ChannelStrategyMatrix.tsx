'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { OUTREACH_CHANNELS, type OutreachChannel } from '@/lib/data/outreach';

const GRID_SIZE = 440;
const MARGIN = 40;
const PLOT_SIZE = GRID_SIZE - MARGIN * 2;

function coordFor(ch: OutreachChannel): { x: number; y: number } {
  // Effort on X (left=low, right=high). Quality on Y (bottom=low, top=high).
  const x = MARGIN + ((ch.effortScore - 1) / 9) * PLOT_SIZE;
  const y = MARGIN + ((10 - ch.qualityScore) / 9) * PLOT_SIZE;
  return { x, y };
}

export function ChannelStrategyMatrix() {
  const [activeId, setActiveId] = useState<string>(OUTREACH_CHANNELS[0].id);
  const active = OUTREACH_CHANNELS.find(c => c.id === activeId)!;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(440px, 480px) 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
        }}
      >
        <svg
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Outreach channel effort vs. quality matrix"
        >
          {/* Quadrant backgrounds */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={PLOT_SIZE / 2}
            height={PLOT_SIZE / 2}
            fill="rgba(22,163,74,0.05)"
          />
          <rect
            x={MARGIN + PLOT_SIZE / 2}
            y={MARGIN}
            width={PLOT_SIZE / 2}
            height={PLOT_SIZE / 2}
            fill="rgba(245,158,11,0.05)"
          />
          <rect
            x={MARGIN}
            y={MARGIN + PLOT_SIZE / 2}
            width={PLOT_SIZE / 2}
            height={PLOT_SIZE / 2}
            fill="rgba(100,116,139,0.05)"
          />
          <rect
            x={MARGIN + PLOT_SIZE / 2}
            y={MARGIN + PLOT_SIZE / 2}
            width={PLOT_SIZE / 2}
            height={PLOT_SIZE / 2}
            fill="rgba(239,68,68,0.05)"
          />

          {/* Quadrant crosshair */}
          <line
            x1={MARGIN + PLOT_SIZE / 2}
            y1={MARGIN}
            x2={MARGIN + PLOT_SIZE / 2}
            y2={MARGIN + PLOT_SIZE}
            stroke="var(--border-color)"
            strokeDasharray="3 3"
          />
          <line
            x1={MARGIN}
            y1={MARGIN + PLOT_SIZE / 2}
            x2={MARGIN + PLOT_SIZE}
            y2={MARGIN + PLOT_SIZE / 2}
            stroke="var(--border-color)"
            strokeDasharray="3 3"
          />

          {/* Border */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={PLOT_SIZE}
            height={PLOT_SIZE}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={1}
          />

          {/* Quadrant labels */}
          <text
            x={MARGIN + 8}
            y={MARGIN + 16}
            fontSize="9"
            fontWeight="700"
            fill="#16A34A"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Run this first
          </text>
          <text
            x={MARGIN + PLOT_SIZE - 8}
            y={MARGIN + 16}
            fontSize="9"
            fontWeight="700"
            fill="#F59E0B"
            textAnchor="end"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            High effort, worth it
          </text>
          <text
            x={MARGIN + 8}
            y={MARGIN + PLOT_SIZE - 8}
            fontSize="9"
            fontWeight="700"
            fill="#64748B"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Volume plays
          </text>
          <text
            x={MARGIN + PLOT_SIZE - 8}
            y={MARGIN + PLOT_SIZE - 8}
            fontSize="9"
            fontWeight="700"
            fill="#EF4444"
            textAnchor="end"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Skip unless necessary
          </text>

          {/* Axis labels */}
          <text
            x={GRID_SIZE / 2}
            y={GRID_SIZE - 10}
            fontSize="10"
            fontWeight="700"
            fill="var(--text-muted)"
            textAnchor="middle"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Effort per contact →
          </text>
          <text
            transform={`translate(14 ${GRID_SIZE / 2}) rotate(-90)`}
            fontSize="10"
            fontWeight="700"
            fill="var(--text-muted)"
            textAnchor="middle"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Response quality →
          </text>

          {/* Data points */}
          {OUTREACH_CHANNELS.map((ch, i) => {
            const { x, y } = coordFor(ch);
            const isActive = ch.id === activeId;
            return (
              <motion.g
                key={ch.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.08, type: 'spring', damping: 14 }}
                onClick={() => setActiveId(ch.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 18 : 14}
                  fill={ch.color}
                  fillOpacity={isActive ? 0.25 : 0.15}
                  stroke={ch.color}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <circle cx={x} cy={y} r={isActive ? 6 : 4} fill={ch.color} />
                <text
                  x={x}
                  y={y - (isActive ? 24 : 20)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={isActive ? ch.color : 'var(--text-primary)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {ch.name.split(' ').slice(0, 2).join(' ')}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${active.color}`,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Radio size={14} style={{ color: active.color }} />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: active.color,
            }}
          >
            Channel
          </div>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          {active.name}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}
        >
          {active.description}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <ScoreBlock
            label="Effort per call"
            value={active.effortScore}
            max={10}
            color={active.color}
            invert
          />
          <ScoreBlock
            label="Response quality"
            value={active.qualityScore}
            max={10}
            color={active.color}
          />
        </div>

        <MetaRow label="Volume" body={active.volume} color={active.color} />
        <div style={{ height: 6 }} />
        <MetaRow label="Best for" body={active.bestFor} color={active.color} />
      </div>
    </div>
  );
}

function ScoreBlock({
  label,
  value,
  max,
  color,
  invert = false,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  invert?: boolean;
}) {
  const pct = (value / max) * 100;
  return (
    <div
      style={{
        padding: 10,
        background: 'var(--bg-secondary)',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {max}</div>
      </div>
      <div
        style={{
          height: 4,
          marginTop: 6,
          background: 'var(--bg-primary)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: invert
              ? value <= 3
                ? '#16A34A'
                : value <= 6
                  ? '#F59E0B'
                  : '#EF4444'
              : color,
          }}
        />
      </div>
    </div>
  );
}

function MetaRow({ label, body, color }: { label: string; body: string; color: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
