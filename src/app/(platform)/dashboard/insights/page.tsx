'use client';

import { useInsights } from '@/hooks/useInsights';
import { DecisionRadar } from '@/components/visualizations/DecisionRadar';
import { BiasTreemap } from '@/components/visualizations/BiasTreemap';
import { SwotQuadrant } from '@/components/visualizations/SwotQuadrant';
import { FactVerificationBar } from '@/components/visualizations/FactVerificationBar';
import { SentimentGauge } from '@/components/visualizations/SentimentGauge';
import { ComplianceGrid } from '@/components/visualizations/ComplianceGrid';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
    ScatterChart, Scatter, CartesianGrid, ZAxis,
} from 'recharts';
import { Brain, Activity, ShieldCheck, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

export default function InsightsPage() {
    const { insights, isLoading, error, mutate } = useInsights();

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', border: 'none', padding: 0 }}>Visual Insights</h1>
                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Cross-Document Decision Intelligence, At A Glance
                        </p>
                    </div>
                </div>
                <div className="grid grid-4 gap-md mb-xl">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card" style={{ height: 100 }}>
                            <div className="card-body flex items-center justify-center">
                                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-2 gap-md mb-xl">
                    {[1, 2].map(i => (
                        <div key={i} className="card" style={{ height: 380 }}>
                            <div className="card-body flex items-center justify-center">
                                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ borderColor: 'var(--error)' }}>
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <AlertTriangle size={32} style={{ color: 'var(--error)', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--error)', marginBottom: '12px' }}>Failed to load insights</p>
                        <button className="btn btn-primary" onClick={() => mutate()}>Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!insights || insights.empty) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', border: 'none', padding: 0 }}>Visual Insights</h1>
                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Cross-Document Decision Intelligence, At A Glance
                        </p>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body flex flex-col items-center justify-center" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                        <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ marginBottom: '8px' }}>No Analysis Data Yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px' }}>
                            Upload and analyze documents to see cross-document visual insights.
                            Your decision quality, bias patterns, and compliance data will appear here.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Stat cards data
    const statCards = [
        {
            label: 'Decision Quality',
            value: insights.radar.quality,
            icon: <Brain size={18} />,
            color: insights.radar.quality >= 70 ? 'var(--success)' : insights.radar.quality >= 50 ? 'var(--warning)' : 'var(--error)',
        },
        {
            label: 'Noise Index',
            value: 100 - insights.radar.consistency,
            icon: <Activity size={18} />,
            color: insights.radar.consistency >= 70 ? 'var(--success)' : 'var(--warning)',
        },
        {
            label: 'Biases Detected',
            value: insights.totalBiases,
            icon: <AlertTriangle size={18} />,
            color: insights.totalBiases > 10 ? 'var(--error)' : insights.totalBiases > 5 ? 'var(--warning)' : 'var(--success)',
            isCount: true,
        },
        {
            label: 'Analyses Run',
            value: insights.totalAnalyses,
            icon: <ShieldCheck size={18} />,
            color: 'var(--accent-primary)',
            isCount: true,
        },
    ];

    // Score distribution colors
    const getScoreBucketColor = (range: string) => {
        const start = parseInt(range);
        if (start >= 80) return '#22c55e';
        if (start >= 60) return '#eab308';
        if (start >= 40) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)', maxWidth: '100%' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', border: 'none', padding: 0 }}>Visual Insights</h1>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Cross-Document Decision Intelligence, At A Glance
                        <span style={{ marginLeft: '8px', color: 'var(--accent-primary)' }}>
                            ({insights.totalAnalyses} analyses)
                        </span>
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => mutate()}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Row 1: Stat Cards */}
            <div className="grid grid-4 gap-md mb-xl">
                {statCards.map((card, i) => (
                    <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="card-body" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: '16px 20px',
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: `${card.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: card.color,
                            }}>
                                {card.icon}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: card.color,
                                    lineHeight: 1,
                                }}>
                                    {card.value}{!card.isCount && <span style={{ fontSize: '14px', opacity: 0.6 }}>/100</span>}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                }}>
                                    {card.label}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: Radar + Treemap */}
            <div className="grid grid-2 gap-md mb-xl">
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <DecisionRadar data={insights.radar} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
                    <BiasTreemap data={insights.biasTreemap} severityMap={insights.biasSeverity} />
                </div>
            </div>

            {/* Row 3: SWOT + Fact Verification + Sentiment */}
            <div className="grid grid-3 gap-md mb-xl">
                <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <SwotQuadrant data={insights.swot} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
                    <FactVerificationBar data={insights.factVerification} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <SentimentGauge score={insights.sentiment.score} label={insights.sentiment.label} />
                </div>
            </div>

            {/* Row 4: Score Distribution + Noise vs Quality Scatter */}
            <div className="grid grid-2 gap-md mb-xl">
                {/* Score Distribution Histogram */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.45s' }}>
                    <div className="card-header">
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Score Distribution
                        </h3>
                    </div>
                    <div className="card-body" style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={insights.scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="range"
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: number | undefined) => [`${value ?? 0} analyses`, 'Count']}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {insights.scoreDistribution.map((entry, i) => (
                                        <Cell key={i} fill={getScoreBucketColor(entry.range)} fillOpacity={0.7} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Noise vs Quality Scatter */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="card-header">
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Noise vs Quality
                        </h3>
                    </div>
                    <div className="card-body" style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="overallScore"
                                    type="number"
                                    domain={[0, 100]}
                                    name="Quality"
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                    axisLine={false}
                                    label={{ value: 'Quality Score', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 10 }}
                                />
                                <YAxis
                                    dataKey="noiseScore"
                                    type="number"
                                    domain={[0, 100]}
                                    name="Noise"
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                    axisLine={false}
                                    label={{ value: 'Noise Score', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }}
                                />
                                <ZAxis range={[40, 120]} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: number | undefined, name: string | undefined) => [
                                        `${value ?? 0}`,
                                        name === 'overallScore' ? 'Quality' : 'Noise'
                                    ]}
                                />
                                <Scatter
                                    data={insights.scatterData}
                                    fill="var(--accent-primary)"
                                    fillOpacity={0.6}
                                    stroke="var(--accent-primary)"
                                    strokeWidth={1}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 5: Compliance Grid */}
            <div className="animate-fade-in" style={{ animationDelay: '0.55s' }}>
                <ComplianceGrid data={insights.complianceGrid} />
            </div>
        </div>
    );
}
