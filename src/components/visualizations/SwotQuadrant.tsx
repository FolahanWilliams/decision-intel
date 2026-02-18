'use client';

import { useState } from 'react';

interface SwotQuadrantProps {
    data: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
}

const QUADRANTS = [
    { key: 'strengths', label: 'Strengths', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.3)', icon: '💪' },
    { key: 'weaknesses', label: 'Weaknesses', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', icon: '⚠️' },
    { key: 'opportunities', label: 'Opportunities', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)', icon: '🚀' },
    { key: 'threats', label: 'Threats', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.3)', icon: '🔥' },
] as const;

export function SwotQuadrant({ data }: SwotQuadrantProps) {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const isEmpty = !data.strengths.length && !data.weaknesses.length && !data.opportunities.length && !data.threats.length;

    if (isEmpty) {
        return (
            <div className="card card-glow h-full">
                <div className="card-header">
                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        SWOT Analysis
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
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SWOT Analysis
                </h3>
            </div>
            <div className="card-body" style={{ padding: 'var(--spacing-sm)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                }}>
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
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '12px',
                                    minHeight: '130px',
                                }}
                            >
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: q.color,
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <span>{q.icon}</span>
                                    {q.label}
                                    <span style={{ opacity: 0.6, fontWeight: 400 }}>({items.length})</span>
                                </div>
                                <ul style={{
                                    margin: 0,
                                    padding: 0,
                                    listStyle: 'none',
                                }}>
                                    {visibleItems.map((item, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.5,
                                                marginBottom: '3px',
                                                paddingLeft: '10px',
                                                position: 'relative',
                                            }}
                                        >
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                color: q.color,
                                                opacity: 0.6,
                                            }}>›</span>
                                            {item.length > 60 ? item.slice(0, 57) + '…' : item}
                                        </li>
                                    ))}
                                    {items.length > 4 && (
                                        <li
                                            onClick={() => setExpandedKey(isExpanded ? null : q.key)}
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--accent-primary)',
                                                paddingLeft: '10px',
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
