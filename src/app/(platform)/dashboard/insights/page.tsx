'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInsights } from '@/hooks/useInsights';
import { DecisionRadar } from '@/components/visualizations/DecisionRadar';
import { BiasTreemap } from '@/components/visualizations/BiasTreemap';
import { SwotQuadrant } from '@/components/visualizations/SwotQuadrant';
import { FactVerificationBar } from '@/components/visualizations/FactVerificationBar';
import { SentimentGauge } from '@/components/visualizations/SentimentGauge';
import { ComplianceGrid } from '@/components/visualizations/ComplianceGrid';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
    ScatterChart, Scatter, CartesianGrid, ZAxis, LabelList, ReferenceArea,
    AreaChart, Area,
} from 'recharts';
import {
    Brain, Activity, ShieldCheck, AlertTriangle, RefreshCw, BarChart3,
    Terminal, Cpu, Zap, TrendingUp,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/* ── Reusable sub-components ─────────────────────────────────── */

function SectionLabel({ children, index }: { children: string; index: number }) {
    return (
        <div
            className="animate-slide-up"
            style={{
                animationDelay: `${index * 0.08}s`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--spacing-md)',
                marginTop: index > 0 ? 'var(--spacing-xl)' : undefined,
            }}
        >
            <span style={{
                color: 'var(--accent-primary)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                fontFamily: 'JetBrains Mono, monospace',
            }}>
                [{String(index).padStart(2, '0')}]
            </span>
            <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
            }}>
                {children}
            </span>
            <div style={{
                flex: 1,
                height: '1px',
                background: 'linear-gradient(to right, var(--border-color), transparent)',
            }} />
        </div>
    );
}

function StatCard({ label, value, icon, color, suffix, delay, trend }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    suffix?: string;
    delay: number;
    trend?: number;
}) {
    return (
        <div
            className="card card-glow scanline-overlay animate-slide-up"
            style={{ animationDelay: `${delay}s`, overflow: 'hidden' }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                opacity: 0.6,
            }} />
            <div className="card-body" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: '14px 18px',
            }}>
                <div style={{
                    width: 36,
                    height: 36,
                    border: `1px solid ${color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    background: `${color}08`,
                }}>
                    {icon}
                </div>
                <div>
                    <div className="data-value" style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color,
                        lineHeight: 1,
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        {value}
                        {suffix && (
                            <span style={{ fontSize: '11px', opacity: 0.5, marginLeft: '2px' }}>
                                {suffix}
                            </span>
                        )}
                    </div>
                    <div style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                    }}>
                        {label}
                    </div>
                    {trend !== undefined && trend !== 0 && (
                        <div style={{
                            fontSize: '9px',
                            color: trend > 0 ? 'var(--success)' : 'var(--error)',
                            fontFamily: 'JetBrains Mono, monospace',
                            marginTop: '2px',
                            letterSpacing: '0.05em',
                        }}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} pts this period
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}>
            {/* Header skeleton */}
            <div style={{ marginBottom: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 320, height: 12 }} />
            </div>
            {/* Stat cards skeleton */}
            <div className="grid grid-4 gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="card">
                        <div className="card-body" style={{ padding: '14px 18px' }}>
                            <div className="flex items-center gap-md">
                                <div className="skeleton" style={{ width: 36, height: 36 }} />
                                <div>
                                    <div className="skeleton" style={{ width: 60, height: 22, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ width: 90, height: 10 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Chart skeletons */}
            <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {[0, 1].map(i => (
                    <div key={i} className="card">
                        <div className="card-header">
                            <div className="skeleton" style={{ width: 160, height: 14 }} />
                        </div>
                        <div className="card-body" style={{ height: 280 }}>
                            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-3 gap-md">
                {[0, 1, 2].map(i => (
                    <div key={i} className="card">
                        <div className="card-header">
                            <div className="skeleton" style={{ width: 120, height: 14 }} />
                        </div>
                        <div className="card-body" style={{ height: 200 }}>
                            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Score distribution helpers ───────────────────────────────── */
const getScoreBucketColor = (range: string) => {
    const start = parseInt(range);
    if (start >= 80) return '#30d158';
    if (start >= 60) return '#ffd60a';
    if (start >= 40) return '#ff9f0a';
    return '#ff453a';
};

/* ── Main Page ────────────────────────────────────────────────── */

export default function InsightsPage() {
    const { insights, isLoading, error, mutate } = useInsights();
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (isLoading) return <LoadingSkeleton />;

    // Error state
    if (error) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ borderColor: 'var(--error)' }}>
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <AlertTriangle size={32} style={{ color: 'var(--error)', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--error)', marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                            ERR::INSIGHTS_FETCH_FAILED
                        </p>
                        <button className="btn btn-primary" onClick={() => mutate()}>
                            <RefreshCw size={12} /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!insights || insights.empty) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: '4px', border: 'none', padding: 0 }}>Visual Insights</h1>
                    </div>
                </div>
                <div className="card pixel-grid">
                    <div className="card-body flex flex-col items-center" style={{ padding: 'var(--spacing-2xl) var(--spacing-xl)', textAlign: 'center' }}>
                        <Terminal size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>AWAITING DATA INPUT</h3>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            maxWidth: '360px',
                            lineHeight: 1.7,
                            fontFamily: 'JetBrains Mono, monospace',
                        }}>
                            No analyses detected. Upload and scan documents to populate cross-document intelligence visualizations.
                        </p>
                        <div style={{
                            marginTop: '20px',
                            fontSize: '10px',
                            color: 'var(--accent-primary)',
                            letterSpacing: '0.1em',
                        }}>
                            {'>'} <span className="terminal-cursor">RUN ANALYSIS TO BEGIN</span>
                        </div>
                        <Link
                            href="/dashboard"
                            className="btn btn-primary"
                            style={{ marginTop: '16px', fontSize: '11px' }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Stat cards
    const statCards = [
        {
            label: 'Decision Quality',
            value: insights.radar.quality,
            icon: <Brain size={16} />,
            color: insights.radar.quality >= 70 ? 'var(--success)' : insights.radar.quality >= 50 ? 'var(--warning)' : 'var(--error)',
            suffix: '/100',
            trend: insights.trendDelta,
        },
        {
            label: 'Noise Index',
            value: 100 - insights.radar.consistency,
            icon: <Activity size={16} />,
            color: insights.radar.consistency >= 70 ? 'var(--success)' : 'var(--warning)',
            suffix: '/100',
        },
        {
            label: 'Biases Detected',
            value: insights.totalBiases,
            icon: <AlertTriangle size={16} />,
            color: insights.totalBiases > 10 ? 'var(--error)' : insights.totalBiases > 5 ? 'var(--warning)' : 'var(--success)',
        },
        {
            label: 'Analyses Completed',
            value: insights.totalAnalyses,
            icon: <Cpu size={16} />,
            color: 'var(--accent-primary)',
        },
    ];

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)', maxWidth: '100%' }}>
            {/* ── Header ──────────────────────────────────────── */}
            <div
                className="animate-slide-up"
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-xl)',
                    paddingBottom: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--border-color)',
                }}
            >
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                    }}>
                        <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
                        <h1 style={{ fontSize: '1.25rem', border: 'none', padding: 0, margin: 0 }}>
                            Visual Insights
                        </h1>
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        CROSS-DOCUMENT INTELLIGENCE
                        <span style={{ color: 'var(--accent-primary)', marginLeft: '8px' }}>
                            ● {insights.totalAnalyses} ANALYSES LOADED
                        </span>
                    </div>
                </div>
                <button
                    className="btn btn-secondary"
                    disabled={isRefreshing}
                    onClick={async () => {
                        setIsRefreshing(true);
                        try { await mutate(); } finally { setIsRefreshing(false); }
                    }}
                    style={{ fontSize: '10px' }}
                >
                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
                </button>
            </div>

            {/* ── [01] OVERVIEW ────────────────────────────────── */}
            <SectionLabel index={1}>OVERVIEW</SectionLabel>
            <div className="grid grid-4 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {statCards.map((card, i) => (
                    <StatCard key={i} {...card} delay={0.1 + i * 0.06} />
                ))}
            </div>

            {/* ── [02] PERFORMANCE TRAJECTORY ─────────────────── */}
            <SectionLabel index={2}>PERFORMANCE TRAJECTORY</SectionLabel>
            <div className="animate-slide-up card card-glow" style={{ animationDelay: '0.28s', marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-header flex items-center justify-between">
                    <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                        <TrendingUp size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
                        QUALITY &amp; NOISE OVER TIME
                    </h3>
                    {insights.trendDelta !== 0 && (
                        <div style={{
                            fontSize: '10px',
                            fontFamily: 'JetBrains Mono, monospace',
                            padding: '2px 8px',
                            border: `1px solid ${insights.trendDelta >= 0 ? 'var(--success)' : 'var(--error)'}40`,
                            color: insights.trendDelta >= 0 ? 'var(--success)' : 'var(--error)',
                            background: `${insights.trendDelta >= 0 ? 'var(--success)' : 'var(--error)'}08`,
                        }}>
                            {insights.trendDelta >= 0 ? '↑' : '↓'} {Math.abs(insights.trendDelta)} pts TREND
                        </div>
                    )}
                </div>
                {insights.weeklyTrend.length > 1 ? (
                    <>
                        <div className="card-body" style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={insights.weeklyTrend}>
                                    <defs>
                                        <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="noiseGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--error)" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="var(--error)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="week"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false} tickLine={false}
                                        width={28}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0',
                                            fontSize: '11px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                        formatter={(value: number | undefined, name: string | undefined) => [
                                            `${value ?? 0}`,
                                            name === 'avgScore' ? 'Quality' : 'Noise'
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avgScore"
                                        stroke="var(--success)"
                                        strokeWidth={1.5}
                                        fill="url(#qualityGrad)"
                                        dot={false}
                                        activeDot={{ r: 3, fill: 'var(--success)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avgNoise"
                                        stroke="var(--error)"
                                        strokeWidth={1.5}
                                        fill="url(#noiseGrad)"
                                        dot={false}
                                        activeDot={{ r: 3, fill: 'var(--error)' }}
                                        strokeDasharray="4 4"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{
                            padding: '6px 16px 10px',
                            fontSize: '9px',
                            color: 'var(--text-muted)',
                            fontFamily: 'JetBrains Mono, monospace',
                            display: 'flex',
                            gap: '16px',
                            borderTop: '1px solid var(--border-color)',
                        }}>
                            <span><span style={{ color: 'var(--success)' }}>—</span> Quality Score</span>
                            <span><span style={{ color: 'var(--error)' }}>- -</span> Noise Level</span>
                            <span style={{ marginLeft: 'auto' }}>
                                {insights.weeklyTrend.reduce((s, w) => s + w.count, 0)} analyses in period
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="card-body flex items-center justify-center" style={{ height: 120 }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            NOT ENOUGH DATA — run more analyses to see trajectory
                        </p>
                    </div>
                )}
            </div>

            {/* ── [03] DECISION HEALTH ────────────────────────── */}
            <SectionLabel index={3}>DECISION HEALTH</SectionLabel>
            <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="animate-slide-up card-glow" style={{ animationDelay: '0.3s' }}>
                    <ErrorBoundary sectionName="Decision Radar">
                        <DecisionRadar data={insights.radar} />
                    </ErrorBoundary>
                </div>
                <div className="animate-slide-up card-glow" style={{ animationDelay: '0.36s' }}>
                    <ErrorBoundary sectionName="Bias Treemap">
                        <BiasTreemap data={insights.biasTreemap} severityMap={insights.biasSeverity} />
                    </ErrorBoundary>
                </div>
            </div>

            {/* ── [04] ANALYSIS MATRIX ────────────────────────── */}
            <SectionLabel index={4}>ANALYSIS MATRIX</SectionLabel>
            <div className="grid grid-3 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="animate-slide-up card-glow" style={{ animationDelay: '0.42s' }}>
                    <ErrorBoundary sectionName="SWOT Quadrant">
                        <SwotQuadrant data={insights.swot} />
                    </ErrorBoundary>
                </div>
                <div className="animate-slide-up card-glow" style={{ animationDelay: '0.48s' }}>
                    <ErrorBoundary sectionName="Fact Verification">
                        <FactVerificationBar data={insights.factVerification} />
                    </ErrorBoundary>
                </div>
                <div className="animate-slide-up card-glow" style={{ animationDelay: '0.54s' }}>
                    <ErrorBoundary sectionName="Sentiment Gauge">
                        <SentimentGauge score={insights.sentiment.score} label={insights.sentiment.label} />
                    </ErrorBoundary>
                </div>
            </div>

            {/* ── [05] DISTRIBUTIONS ──────────────────────────── */}
            <SectionLabel index={5}>DISTRIBUTIONS</SectionLabel>
            <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {/* Score Distribution Histogram */}
                <ErrorBoundary sectionName="Score Distribution">
                    <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.6s' }}>
                        <div className="card-header">
                            <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                                <BarChart3 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
                                SCORE DISTRIBUTION
                            </h3>
                        </div>
                        <div className="card-body" style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insights.scoreDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="range"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0',
                                            fontSize: '11px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                        formatter={(value: number | undefined) => [`${value ?? 0} analyses`, 'Count']}
                                    />
                                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                        {insights.scoreDistribution.map((entry, i) => (
                                            <Cell key={i} fill={getScoreBucketColor(entry.range)} fillOpacity={0.75} />
                                        ))}
                                        <LabelList
                                            dataKey="count"
                                            position="top"
                                            style={{
                                                fill: 'var(--text-muted)',
                                                fontSize: 9,
                                                fontFamily: 'JetBrains Mono, monospace',
                                            }}
                                            formatter={(v) => Number(v) > 0 ? String(v) : ''}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Noise vs Quality Scatter */}
                <ErrorBoundary sectionName="Noise vs Quality">
                    <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.66s' }}>
                        <div className="card-header">
                            <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                                <Activity size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-secondary)' }} />
                                NOISE vs QUALITY CORRELATION
                            </h3>
                        </div>
                        <div className="card-body" style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="overallScore"
                                        type="number"
                                        domain={[0, 100]}
                                        name="Quality"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false}
                                        label={{ value: 'Quality ▸', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 9 }}
                                    />
                                    <YAxis
                                        dataKey="noiseScore"
                                        type="number"
                                        domain={[0, 100]}
                                        name="Noise"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false}
                                        label={{ value: '▴ Noise', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }}
                                    />
                                    <ZAxis range={[50, 140]} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0',
                                            fontSize: '11px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                        formatter={(value: number | undefined, name: string | undefined) => [
                                            `${value ?? 0}`,
                                            name === 'overallScore' ? 'Quality' : 'Noise'
                                        ]}
                                    />
                                    <ReferenceArea
                                        x1={70} x2={100} y1={0} y2={30}
                                        fill="var(--success)"
                                        fillOpacity={0.06}
                                        stroke="var(--success)"
                                        strokeOpacity={0.2}
                                        strokeDasharray="4 4"
                                        label={{
                                            value: 'TARGET ZONE',
                                            position: 'insideTopRight',
                                            fill: 'var(--success)',
                                            fontSize: 8,
                                            fontFamily: 'JetBrains Mono, monospace',
                                            opacity: 0.6,
                                        }}
                                    />
                                    <Scatter
                                        data={insights.scatterData}
                                        fill="var(--accent-secondary)"
                                        fillOpacity={0.7}
                                        stroke="var(--accent-secondary)"
                                        strokeWidth={1}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{
                            padding: '6px 16px 10px',
                            fontSize: '9px',
                            color: 'var(--text-muted)',
                            fontFamily: 'JetBrains Mono, monospace',
                            display: 'flex',
                            gap: '16px',
                            borderTop: '1px solid var(--border-color)',
                        }}>
                            <span>
                                <span style={{ color: 'var(--accent-secondary)' }}>●</span> = one analysis
                            </span>
                            <span style={{ color: 'var(--success)', opacity: 0.7 }}>■ target zone (high quality, low noise)</span>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>

            {/* ── [06] RISK SIGNALS ────────────────────────────── */}
            <SectionLabel index={6}>RISK SIGNALS</SectionLabel>
            <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>

                {/* Logical Fallacy Frequency */}
                <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.64s' }}>
                    <div className="card-header">
                        <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--warning)' }} />
                            LOGIC FALLACY FREQUENCY
                        </h3>
                    </div>
                    {insights.fallacyFrequency.length > 0 ? (
                        <div className="card-body" style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={insights.fallacyFrequency}
                                    layout="vertical"
                                    margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false} tickLine={false} allowDecimals={false}
                                    />
                                    <YAxis
                                        type="category" dataKey="name" width={120}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + '…' : v}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0', fontSize: '11px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                        formatter={(value: number | undefined) => [`${value ?? 0} occurrences`, 'Count']}
                                    />
                                    <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                                        {insights.fallacyFrequency.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    entry.severity === 'high' || entry.severity === 'critical'
                                                        ? 'var(--error)'
                                                        : entry.severity === 'medium'
                                                        ? 'var(--warning)'
                                                        : 'var(--accent-secondary)'
                                                }
                                                fillOpacity={0.7}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="card-body flex items-center justify-center" style={{ height: 260 }}>
                            <p style={{ fontSize: '11px', color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>
                                ✓ NO FALLACIES DETECTED
                            </p>
                        </div>
                    )}
                </div>

                {/* Pre-Mortem Failure Scenarios */}
                <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.7s' }}>
                    <div className="card-header">
                        <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--error)' }} />
                            TOP FAILURE SCENARIOS
                        </h3>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            from pre-mortem analysis
                        </span>
                    </div>
                    <div className="card-body" style={{ padding: 'var(--spacing-sm)', height: 260, overflowY: 'auto' }}>
                        {insights.topFailureScenarios.length > 0 ? (
                            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                {insights.topFailureScenarios.map((item, i) => (
                                    <li key={i} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        marginBottom: '4px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            fontFamily: 'JetBrains Mono, monospace',
                                            color: 'var(--error)',
                                            minWidth: '18px',
                                            lineHeight: 1.6,
                                        }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {item.text.length > 120 ? item.text.slice(0, 117) + '…' : item.text}
                                            </div>
                                            {item.count > 1 && (
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                                                    flagged in {item.count} analyses
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    NO PRE-MORTEM DATA
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── [07] BOARDROOM CONSENSUS ─────────────────────── */}
            <SectionLabel index={7}>BOARDROOM CONSENSUS</SectionLabel>
            <div className="grid grid-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>

                {/* Decision Twin Vote Distribution */}
                <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.76s' }}>
                    <div className="card-header flex items-center justify-between">
                        <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                            <Brain size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
                            DECISION TWIN VOTES
                        </h3>
                        {insights.decisionTwinVotes.total > 0 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                {insights.decisionTwinVotes.total} total votes
                            </span>
                        )}
                    </div>
                    {insights.decisionTwinVotes.total > 0 ? (
                        <>
                            <div className="card-body" style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { label: 'APPROVE', count: insights.decisionTwinVotes.approve },
                                        { label: 'REVISE', count: insights.decisionTwinVotes.revise },
                                        { label: 'REJECT', count: insights.decisionTwinVotes.reject },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                            axisLine={false} tickLine={false} allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '0', fontSize: '11px',
                                                fontFamily: 'JetBrains Mono, monospace',
                                            }}
                                            formatter={(value: number | undefined) => [`${value ?? 0} votes`, 'Count']}
                                        />
                                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                            {['#30d158', '#ffd60a', '#ff453a'].map((fill, i) => (
                                                <Cell key={i} fill={fill} fillOpacity={0.75} />
                                            ))}
                                            <LabelList
                                                dataKey="count"
                                                position="top"
                                                style={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                                                formatter={(v) => Number(v) > 0 ? String(v) : ''}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{
                                padding: '6px 16px 10px',
                                fontSize: '9px',
                                color: 'var(--text-muted)',
                                fontFamily: 'JetBrains Mono, monospace',
                                borderTop: '1px solid var(--border-color)',
                            }}>
                                Simulated votes from Fiscal Conservative · Aggressive Growth · Compliance Guard personas
                            </div>
                        </>
                    ) : (
                        <div className="card-body flex items-center justify-center" style={{ height: 200 }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>NO SIMULATION DATA</p>
                        </div>
                    )}
                </div>

                {/* Cognitive Blind Spots */}
                <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.82s' }}>
                    <div className="card-header flex items-center justify-between">
                        <h3 style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                            <Activity size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--warning)' }} />
                            COGNITIVE BLIND SPOTS
                        </h3>
                        {insights.avgBlindSpotGap > 0 && (
                            <div style={{
                                fontSize: '10px',
                                fontFamily: 'JetBrains Mono, monospace',
                                color: insights.avgBlindSpotGap < 50 ? 'var(--error)' : insights.avgBlindSpotGap < 80 ? 'var(--warning)' : 'var(--success)',
                            }}>
                                {insights.avgBlindSpotGap}/100 diversity
                            </div>
                        )}
                    </div>
                    <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
                        {insights.avgBlindSpotGap > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    avg cognitive diversity score
                                </div>
                                <div style={{ height: '4px', background: 'var(--bg-secondary)', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, top: 0, height: '100%',
                                        width: `${insights.avgBlindSpotGap}%`,
                                        background: insights.avgBlindSpotGap < 50 ? 'var(--error)' : insights.avgBlindSpotGap < 80 ? 'var(--warning)' : 'var(--success)',
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '3px' }}>
                                    {insights.avgBlindSpotGap < 50 ? 'Tunnel Vision Detected' : insights.avgBlindSpotGap < 80 ? 'Moderate Perspective Diversity' : 'Balanced Perspectives'}
                                </div>
                            </div>
                        )}
                        {insights.topBlindSpots.length > 0 ? (
                            <>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    most common blind spots
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {insights.topBlindSpots.map((spot, i) => (
                                        <span key={i} style={{
                                            fontSize: '10px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            padding: '3px 8px',
                                            border: '1px solid rgba(255,214,10,0.3)',
                                            color: 'var(--warning)',
                                            background: 'rgba(255,214,10,0.06)',
                                        }}>
                                            {spot}
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                NO BLIND SPOT DATA
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── [08] COMPLIANCE ──────────────────────────────── */}
            <SectionLabel index={8}>COMPLIANCE</SectionLabel>
            <div className="animate-slide-up card-glow" style={{ animationDelay: '0.72s' }}>
                <ErrorBoundary sectionName="Compliance Grid">
                    <ComplianceGrid data={insights.complianceGrid} />
                </ErrorBoundary>
            </div>

            {/* ── Footer timestamp ────────────────────────────── */}
            <div style={{
                marginTop: 'var(--spacing-xl)',
                textAlign: 'center',
                fontSize: '9px',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                fontFamily: 'JetBrains Mono, monospace',
            }}>
                LAST REFRESH: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>│</span>
                <ShieldCheck size={10} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--success)' }} />
                {' '}SYSTEM NOMINAL
            </div>
        </div>
    );
}
