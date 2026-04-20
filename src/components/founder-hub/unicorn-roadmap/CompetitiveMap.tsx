'use client';

import { motion } from 'framer-motion';
import { COMPETITORS } from './data';
import { SectionHeader } from './UnicornTimeline';

/**
 * CompetitiveMap — 2D scatter plotting breadth × depth. Decision Intel
 * sits alone in the top-right (deep causal reasoning × wide infra).
 * Intentionally abstract — breadth/depth are relative, not measured,
 * and the map is a positioning tool, not a benchmark.
 */
export function CompetitiveMap() {
  const W = 640;
  const H = 420;
  const pad = 60;

  const toX = (x: number) => pad + (x / 100) * (W - pad * 2);
  const toY = (y: number) => H - pad - (y / 100) * (H - pad * 2);

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
        eyebrow="The positioning map"
        title="Empty quadrant = your quadrant."
        subtitle="Breadth (narrow tool → infrastructure) × depth (correlation → causal reasoning). Decision Intel alone in the top-right."
      />
      <div style={{ padding: '24px 28px 32px', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 720, minWidth: 540, display: 'block' }}>
          {/* Grid lines */}
          {[25, 50, 75].map(v => (
            <g key={`grid-${v}`}>
              <line
                x1={toX(v)}
                y1={pad}
                x2={toX(v)}
                y2={H - pad}
                stroke="var(--border-primary)"
                strokeDasharray="3 4"
                opacity="0.5"
              />
              <line
                x1={pad}
                y1={toY(v)}
                x2={W - pad}
                y2={toY(v)}
                stroke="var(--border-primary)"
                strokeDasharray="3 4"
                opacity="0.5"
              />
            </g>
          ))}

          {/* Axes */}
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--text-muted)" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--text-muted)" strokeWidth="1" />

          {/* Axis labels */}
          <text x={W - pad} y={H - pad + 24} fontSize="10.5" fontWeight="800" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono, monospace)" letterSpacing="0.12em">
            BREADTH →
          </text>
          <text x={pad} y={H - pad + 24} fontSize="10.5" fontWeight="600" fill="var(--text-muted)" textAnchor="start" fontFamily="var(--font-mono, monospace)">
            narrow tool
          </text>
          <text x={W - pad} y={H - pad + 40} fontSize="10.5" fontWeight="600" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono, monospace)">
            infrastructure
          </text>

          <text
            x={pad - 42}
            y={pad - 8}
            fontSize="10.5"
            fontWeight="800"
            fill="var(--text-muted)"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.12em"
          >
            ↑ DEPTH
          </text>
          <text x={pad - 42} y={pad + 8} fontSize="10.5" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-mono, monospace)">
            causal
          </text>
          <text
            x={pad - 42}
            y={H - pad - 4}
            fontSize="10.5"
            fontWeight="600"
            fill="var(--text-muted)"
            fontFamily="var(--font-mono, monospace)"
          >
            correlation
          </text>

          {/* The empty quadrant highlight — where Decision Intel sits */}
          <rect
            x={toX(50)}
            y={toY(100)}
            width={toX(100) - toX(50)}
            height={toY(50) - toY(100)}
            fill="rgba(22,163,74,0.06)"
            stroke="rgba(22,163,74,0.25)"
            strokeDasharray="4 4"
          />
          <text
            x={toX(75)}
            y={toY(98) + 12}
            fontSize="9.5"
            fontWeight="800"
            fill="var(--accent-primary)"
            textAnchor="middle"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.14em"
          >
            REASONING INFRASTRUCTURE
          </text>

          {/* Competitors */}
          {COMPETITORS.map((c, i) => {
            const x = toX(c.x);
            const y = toY(c.y);
            const isUs = !!c.isUs;
            return (
              <motion.g
                key={c.id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {isUs && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="22"
                    fill="none"
                    stroke="rgba(22,163,74,0.45)"
                    strokeWidth="1.5"
                    animate={{ r: [18, 28, 18], opacity: [0.7, 0.15, 0.7] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isUs ? 10 : 7}
                  fill={isUs ? '#16A34A' : 'var(--text-muted)'}
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                />
                <text
                  x={x + 14}
                  y={y - 6}
                  fontSize="12"
                  fontWeight={isUs ? 800 : 600}
                  fill="var(--text-primary)"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="-0.01em"
                >
                  {c.name}
                </text>
                <text
                  x={x + 14}
                  y={y + 8}
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {c.note}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
