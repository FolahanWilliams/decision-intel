'use client';

import { useState } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface SwotQuadrantProps {
  data: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

const QUADRANTS = [
  {
    key: 'strengths',
    label: 'Strengths',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.06)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    icon: '💪',
  },
  {
    key: 'weaknesses',
    label: 'Weaknesses',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    icon: '⚠️',
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.06)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: '🚀',
  },
  {
    key: 'threats',
    label: 'Threats',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.06)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    icon: '🔥',
  },
] as const;

export function SwotQuadrant({ data }: SwotQuadrantProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const isEmpty =
    !data.strengths.length &&
    !data.weaknesses.length &&
    !data.opportunities.length &&
    !data.threats.length;

  if (isEmpty) {
    return (
      <div className="card card-glow h-full">
        <div className="card-header">
          <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
            SWOT Analysis
            <InfoTooltip text="Strengths, Weaknesses, Opportunities, and Threats identified in the document. Helps evaluate the strategic position of the decision." />
          </h3>
        </div>
        <div className="card-body flex items-center justify-center" style={{ minHeight: 280 }}>
          <p className="text-muted text-sm">No SWOT data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
          SWOT Analysis
          <InfoTooltip text="Strengths, Weaknesses, Opportunities, and Threats identified in the document. Helps evaluate the strategic position of the decision." />
        </h3>
      </div>
      <div className="card-body" style={{ padding: 'var(--spacing-sm)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          {QUADRANTS.map(q => {
            const items = data[q.key as keyof typeof data] || [];
            const isExpanded = expandedKey === q.key;
            const visibleItems = isExpanded ? items : items.slice(0, 4);
            return (
              <div
                key={q.key}
                style={{
                  background: q.bg,
                  border: `1px solid ${q.borderColor}`,
                  padding: '14px',
                  minHeight: '130px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: q.color,
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{q.icon}</span>
                  {q.label}
                  <span style={{ opacity: 0.6, fontWeight: 400 }}>({items.length})</span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                  }}
                >
                  {visibleItems.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '3px',
                        paddingLeft: '12px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: q.color,
                          opacity: 0.6,
                        }}
                      >
                        ›
                      </span>
                      {item.length > 60 ? item.slice(0, 57) + '…' : item}
                    </li>
                  ))}
                  {items.length > 4 && (
                    <li
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedKey(isExpanded ? null : q.key)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedKey(isExpanded ? null : q.key);
                        }
                      }}
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-primary)',
                        paddingLeft: '12px',
                        marginTop: '4px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {isExpanded ? '↑ show less' : `+${items.length - 4} more`}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
