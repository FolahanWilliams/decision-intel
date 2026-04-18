'use client';

import { CLOVERPOP_COMPARISON, CATEGORY_CONTRAST } from '@/lib/data/competitive-positioning';

export function CloverpopComparisonGrid() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 1fr',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          Dimension
        </div>
        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            fontWeight: 800,
            color: CATEGORY_CONTRAST.cloverpop.accent,
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {CATEGORY_CONTRAST.cloverpop.label}
        </div>
        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            fontWeight: 800,
            color: CATEGORY_CONTRAST.decisionIntel.accent,
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {CATEGORY_CONTRAST.decisionIntel.label}
        </div>
      </div>

      {/* Rows */}
      {CLOVERPOP_COMPARISON.map((row, i) => (
        <div
          key={row.dimension}
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 1fr',
            borderBottom:
              i === CLOVERPOP_COMPARISON.length - 1 ? 'none' : '1px solid var(--border-color)',
            background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.dimension}
          </div>
          <div
            style={{
              padding: '10px 12px',
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {row.cloverpop}
          </div>
          <div
            style={{
              padding: '10px 12px',
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              borderLeft: `1px solid ${CATEGORY_CONTRAST.decisionIntel.accent}30`,
              background: 'rgba(22,163,74,0.04)',
            }}
          >
            {row.decisionIntel}
          </div>
        </div>
      ))}
    </div>
  );
}
