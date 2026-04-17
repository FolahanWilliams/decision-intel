'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { GraphNode } from 'reagraph';
import type { NodeData } from './HeroDecisionGraph3DCanvas';

// ─── Lazy-load the WebGL canvas (no SSR — WebGL is client-only) ──────────────

const Graph3DCanvas = dynamic(() => import('./HeroDecisionGraph3DCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 460,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #E2E8F0',
          borderTopColor: '#16A34A',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: 12, color: '#64748B', letterSpacing: '0.5px' }}>
        Rendering graph...
      </span>
    </div>
  ),
});

// ─── Detail panel (shown when a node is selected) ────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  decision: 'Decision',
  bias: 'Cognitive Bias',
  outcome: 'Outcome',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#EAB308',
  Low: '#84CC16',
};

const TYPE_COLORS: Record<string, string> = {
  decision: '#60A5FA',
  bias: '#EF4444',
  outcome: '#A78BFA',
};

function DetailPanel({ data, onClose }: { data: NodeData; onClose: () => void }) {
  const accentColor =
    data.type === 'bias' && data.detail.severity
      ? (SEVERITY_COLORS[data.detail.severity] ?? '#EF4444')
      : (TYPE_COLORS[data.type] ?? '#64748B');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 18px' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: accentColor,
                background: accentColor + '18',
                padding: '2px 7px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {TYPE_LABELS[data.type]}
              {data.detail.severity ? ` · ${data.detail.severity}` : ''}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
              {data.detail.title}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#94A3B8',
              padding: '0 2px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Excerpt */}
        <p
          style={{
            fontSize: 12.5,
            color: '#475569',
            lineHeight: 1.6,
            margin: '0 0 10px',
            borderLeft: `2px solid ${accentColor}40`,
            paddingLeft: 10,
          }}
        >
          {data.detail.excerpt}
        </p>

        {/* Platform insight */}
        <div
          style={{
            fontSize: 12,
            color: '#0F172A',
            lineHeight: 1.55,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#16A34A',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              marginBottom: 4,
            }}
          >
            Platform Analysis
          </span>
          {data.detail.insight}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, color: '#94A3B8' }}>
        Drag · Scroll to zoom · Click to explore
      </span>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {/* Decision shape hint */}
        <LegendItem color="#60A5FA" label="Decision" shape="dodecahedron" />
        <LegendItem color="#EF4444" label="Bias" shape="octahedron" />
        <LegendItem color="#A78BFA" label="Outcome" shape="cylinder" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 18, height: 2, background: '#DC2626', borderRadius: 1 }} />
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Toxic</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  shape,
}: {
  color: string;
  label: string;
  shape: 'dodecahedron' | 'octahedron' | 'cylinder';
}) {
  // Small SVG icon approximating each 3D shape
  const icons: Record<typeof shape, React.ReactNode> = {
    dodecahedron: (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <polygon points="5,1 9,3.5 9,7.5 5,9 1,7.5 1,3.5" fill={color} />
      </svg>
    ),
    octahedron: (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <polygon points="5,1 9,5 5,9 1,5" fill={color} />
      </svg>
    ),
    cylinder: (
      <svg width="8" height="10" viewBox="0 0 8 10">
        <rect x="1" y="2" width="6" height="6" rx="1" fill={color} />
        <ellipse cx="4" cy="2" rx="3" ry="1" fill={color} />
      </svg>
    ),
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {icons[shape]}
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function HeroDecisionGraph() {
  const [selectedData, setSelectedData] = useState<NodeData | null>(null);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedData(node ? (node.data as NodeData) : null);
  }, []);

  return (
    <>
      {/* Spin animation for the loading state */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '14px 16px 12px',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
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
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#16A34A',
                  background: 'rgba(22, 163, 74, 0.10)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                Sample output
              </span>
              <span
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#7C3AED',
                }}
              >
                3D Decision Knowledge Graph
              </span>
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: '#475569',
                lineHeight: 1.45,
              }}
            >
              <span style={{ fontWeight: 600, color: '#0F172A' }}>11 pre-decision biases</span>{' '}
              Decision Intel would have flagged in{' '}
              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                WeWork&rsquo;s S-1 (Aug 2019)
              </span>{' '}
              &mdash; before{' '}
              <span style={{ fontWeight: 600, color: '#DC2626' }}>$39B was destroyed</span>. Click
              any node to explore.
            </div>
          </div>

          {/* 3D Canvas */}
          <div style={{ height: 460, position: 'relative' }}>
            <Graph3DCanvas onNodeSelect={handleNodeSelect} />
            {/* Subtle analytical grid overlay */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage:
                  'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 80%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Legend */}
          <Legend />

          {/* Detail panel — slides open below legend */}
          <AnimatePresence>
            {selectedData && (
              <DetailPanel data={selectedData} onClose={() => setSelectedData(null)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
