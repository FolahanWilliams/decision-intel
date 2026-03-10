'use client';

import { ExternalLink, Newspaper, BookOpen, Database, Landmark, AlertTriangle } from 'lucide-react';
import type { IntelligenceContextSummary } from '@/types';

interface IntelligenceTabProps {
    intelligenceContext?: IntelligenceContextSummary;
}

export function IntelligenceTab({ intelligenceContext }: IntelligenceTabProps) {
    if (!intelligenceContext) {
        return (
            <div className="card">
                <div className="text-center p-8 text-muted">
                    <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No intelligence context available for this analysis.</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                        This document may have been analyzed before the intelligence layer was enabled.
                    </p>
                </div>
            </div>
        );
    }

    const ctx = intelligenceContext;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Summary Stats */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-sm)' }}>
                <MiniStat icon={<Newspaper size={16} />} label="News Articles" value={ctx.newsCount} color="var(--accent-primary)" />
                <MiniStat icon={<BookOpen size={16} />} label="Research Papers" value={ctx.researchCount} color="#9C27B0" />
                <MiniStat icon={<Database size={16} />} label="Case Studies" value={ctx.caseStudyCount} color="#4CAF50" />
                <MiniStat icon={<Landmark size={16} />} label="Benchmarks" value={ctx.industryBenchmarkCount} color="#2196F3" />
            </div>

            {/* Macro Summary */}
            {ctx.macroSummary && ctx.macroSummary !== 'Macro data temporarily unavailable.' && (
                <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                        Macro Environment
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {ctx.macroSummary}
                    </p>
                </div>
            )}

            {/* Top News */}
            {ctx.topNews && ctx.topNews.length > 0 && (
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                        <Newspaper size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        News Referenced During Analysis
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ctx.topNews.map((n, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '20px', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <a
                                        href={n.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
                                    >
                                        {n.title}
                                        <ExternalLink size={10} style={{ marginLeft: '4px', opacity: 0.4, display: 'inline' }} />
                                    </a>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {n.source}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Case Studies */}
            {ctx.topCaseStudies && ctx.topCaseStudies.length > 0 && (
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                        <Database size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Historical Parallels Matched
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {ctx.topCaseStudies.map((c, i) => (
                            <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                                        {c.company}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', padding: '2px 6px', borderRadius: '2px',
                                        background: c.outcome.toLowerCase().includes('fail') ? 'rgba(255,82,82,0.1)' : 'rgba(76,175,80,0.1)',
                                        color: c.outcome.toLowerCase().includes('fail') ? 'var(--error)' : 'var(--success)',
                                        fontWeight: 600,
                                    }}>
                                        {c.outcome}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {c.biasTypes.map(b => (
                                        <span key={b} style={{
                                            fontSize: '10px', padding: '1px 5px', borderRadius: '2px',
                                            border: '1px solid var(--border-color)', color: 'var(--text-muted)',
                                        }}>
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                Context assembled {new Date(ctx.assembledAt).toLocaleString()}
            </div>
        </div>
    );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color, flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {value}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </div>
            </div>
        </div>
    );
}
