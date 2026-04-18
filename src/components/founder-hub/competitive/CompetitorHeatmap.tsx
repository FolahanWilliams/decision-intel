'use client';

import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
  CAPABILITY_MATRIX,
  COMPETITOR_HEADERS,
  CELL_COLOR,
  CELL_LABEL,
  type CapabilityRow,
  type CellValue,
} from '@/lib/data/competitive-positioning';

const CELL_ICON: Record<CellValue, React.ReactNode> = {
  yes: <CheckCircle size={11} />,
  partial: <AlertTriangle size={11} />,
  no: <XCircle size={11} />,
};

export function CompetitorHeatmap() {
  // Pre-compute per-competitor scores so buyers can see tallies at a glance.
  const scores = useMemo(() => {
    const out: Record<string, { yes: number; partial: number; no: number }> = {};
    COMPETITOR_HEADERS.forEach(h => {
      out[h.key] = { yes: 0, partial: 0, no: 0 };
    });
    CAPABILITY_MATRIX.forEach(row => {
      COMPETITOR_HEADERS.forEach(h => {
        const val = row[h.key as keyof CapabilityRow] as CellValue;
        out[h.key][val] += 1;
      });
    });
    return out;
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflowX: 'auto',
      }}
    >
      <div style={{ minWidth: 760 }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px repeat(5, 1fr)',
            borderBottom: '2px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Capability
          </div>
          {COMPETITOR_HEADERS.map(h => (
            <div
              key={h.key}
              style={{
                padding: '8px 10px',
                borderLeft: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: h.color,
                  lineHeight: 1.15,
                }}
              >
                {h.label}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  display: 'flex',
                  gap: 4,
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: CELL_COLOR.yes, fontWeight: 700 }}>
                  {scores[h.key].yes}
                </span>
                <span>·</span>
                <span style={{ color: CELL_COLOR.partial, fontWeight: 700 }}>
                  {scores[h.key].partial}
                </span>
                <span>·</span>
                <span style={{ color: CELL_COLOR.no, fontWeight: 700 }}>{scores[h.key].no}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {CAPABILITY_MATRIX.map((row, rowIdx) => (
          <div
            key={row.capability}
            style={{
              display: 'grid',
              gridTemplateColumns: '220px repeat(5, 1fr)',
              borderBottom:
                rowIdx === CAPABILITY_MATRIX.length - 1 ? 'none' : '1px solid var(--border-color)',
              background: rowIdx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {row.capability}
            </div>
            {COMPETITOR_HEADERS.map(h => {
              const val = row[h.key as keyof CapabilityRow] as CellValue;
              const color = CELL_COLOR[val];
              return (
                <div
                  key={h.key}
                  style={{
                    padding: 8,
                    borderLeft: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: `${color}15`,
                      color,
                      fontSize: 10,
                      fontWeight: 700,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {CELL_ICON[val]}
                    {CELL_LABEL[val]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
