'use client';

import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { Download, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';

interface TrendDataPoint {
    date: string;
    score: number;
    noise: number;
    volume: number;
}

interface BiasDataPoint {
    name: string;
    value: number;
}

interface TrendsStats {
    totalAnalyses: number;
    avgScore: number;
    highScore: number;
    lowScore: number;
    latestScore: number;
    avgNoise: number;
    totalBiases: number;
    trend: number;
}

interface TrendsData {
    trendData: TrendDataPoint[];
    biasDistribution: BiasDataPoint[];
    stats: TrendsStats;
    range: string;
    startDate: string;
    endDate: string;
}

interface MarketAnalysis {
    summary: string;
    impactAssessment: Array<{ category: string; status: string; details: string }>;
    searchSources: string[];
}

export default function TrendsPage() {
    const [timeRange, setTimeRange] = useState('1M');
    const [data, setData] = useState<TrendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const analyzeMarket = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/trends/analyze', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setMarketAnalysis(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    const fetchTrends = async (range: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/trends?range=${range}`);
            if (!response.ok) {
                throw new Error('Failed to fetch trends');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load trends');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends(timeRange);
    }, [timeRange]);

    const handleRangeChange = (range: string) => {
        setTimeRange(range);
    };

    const handleExport = () => {
        if (!data) return;
        const csvContent = [
            ['Date', 'Score', 'Noise', 'Volume'].join(','),
            ...data.trendData.map(d => [d.date, d.score, d.noise, d.volume].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trends-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Empty state
    const EmptyState = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-2xl)',
            textAlign: 'center'
        }}>
            <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }} />
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Analysis Data Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px' }}>
                Upload and analyze documents to see historical trends. Your decision quality scores,
                noise levels, and bias patterns will appear here over time.
            </p>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)', maxWidth: '100%' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', border: 'none', padding: 0 }}>Historical Analysis</h1>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                        Decision Quality Trends & Patterns
                        {data && data.stats.totalAnalyses > 0 && (
                            <span style={{ marginLeft: '8px', color: 'var(--accent-primary)' }}>
                                ({data.stats.totalAnalyses} analyses)
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-sm">
                    {['1W', '1M', '3M', 'YTD', 'ALL'].map(range => (
                        <button
                            key={range}
                            onClick={() => handleRangeChange(range)}
                            className={`btn ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ minWidth: '40px' }}
                            disabled={loading}
                        >
                            {range}
                        </button>
                    ))}
                    <button
                        className="btn btn-secondary ml-md"
                        onClick={handleExport}
                        disabled={!data || data.trendData.length === 0}
                    >
                        <Download size={14} />
                        EXPORT DATA
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="card mb-xl">
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                        <RefreshCw size={24} className="spin" style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ marginLeft: '12px' }}>Loading trends...</span>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="card mb-xl" style={{ borderColor: 'var(--error)' }}>
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <p style={{ color: 'var(--error)' }}>{error}</p>
                        <button className="btn btn-primary mt-md" onClick={() => fetchTrends(timeRange)}>
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && data && data.trendData.length === 0 && (
                <div className="card mb-xl">
                    <EmptyState />
                </div>
            )}

            {/* AI Market Analyst (New Feature) */}
            {data && data.stats.totalAnalyses > 0 && (
                <div className="card mb-xl animate-fade-in" style={{ borderColor: 'var(--accent-secondary)' }}>
                    <div className="card-header flex justify-between items-center" style={{ background: 'rgba(66, 133, 244, 0.05)' }}>
                        <div>
                            <h3 className="flex items-center gap-sm" style={{ color: 'var(--accent-secondary)' }}>
                                <TrendingUp size={16} /> AI MARKET ANALYST (LIVE)
                            </h3>
                            <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                                Real-time Grounding via Google Search
                            </p>
                        </div>
                        {!marketAnalysis && (
                            <button
                                onClick={analyzeMarket}
                                disabled={analyzing}
                                className="btn btn-primary"
                                style={{ background: 'var(--accent-secondary)', borderColor: 'var(--accent-secondary)' }}
                            >
                                {analyzing ? <RefreshCw className="spin" size={14} /> : <TrendingUp size={14} />}
                                {analyzing ? 'SCANNING MARKET...' : 'ANALYZE ACTIVE SECTORS'}
                            </button>
                        )}
                    </div>

                    {marketAnalysis && (
                        <div className="card-body">
                            <div className="mb-lg">
                                <h4 className="text-sm font-bold mb-sm text-white">EXECUTIVE BRIEFING</h4>
                                <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{marketAnalysis.summary}</p>
                            </div>

                            <div className="grid grid-3 gap-md mb-lg">
                                {marketAnalysis.impactAssessment?.map((impact, i) => (
                                    <div key={i} style={{
                                        padding: '12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: `3px solid ${impact.status === 'High' ? 'var(--error)' : impact.status === 'Medium' ? 'var(--warning)' : 'var(--success)'}`
                                    }}>
                                        <div className="flex justify-between mb-xs">
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{impact.category}</span>
                                            <span className={`badge ${impact.status === 'High' ? 'badge-critical' : 'badge-secondary'}`} style={{ fontSize: '9px' }}>{impact.status} impact</span>
                                        </div>
                                        <p style={{ fontSize: '12px', fontWeight: 500 }}>{impact.details}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Sources */}
                            {marketAnalysis.searchSources?.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Verified Sources:
                                    </div>
                                    <div className="flex flex-wrap gap-sm">
                                        {marketAnalysis.searchSources.map((source, i) => (
                                            <a key={i} href={source} target="_blank" rel="noopener noreferrer"
                                                className="badge hover:opacity-80"
                                                style={{
                                                    textDecoration: 'none',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '10px',
                                                    maxWidth: '250px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                {new URL(source).hostname}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Data View */}
            {!loading && !error && data && data.trendData.length > 0 && (
                <>
                    {/* Main Chart - "Stock" Style */}
                    <div className="card mb-xl">
                        <div className="card-header flex justify-between">
                            <div className="flex items-center gap-md">
                                <h3 style={{ color: 'var(--accent-primary)' }}>DQ-IDX (Decision Quality Index)</h3>
                                <span className={`badge ${data.stats.trend >= 0 ? 'badge-complete' : 'badge-error'}`}>
                                    {data.stats.trend >= 0 ? (
                                        <><TrendingUp size={12} /> +{data.stats.trend}%</>
                                    ) : (
                                        <><TrendingDown size={12} /> {data.stats.trend}%</>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-lg text-sm text-muted">
                                <span>O: {data.trendData[0]?.score || 0}</span>
                                <span>H: {data.stats.highScore}</span>
                                <span>L: {data.stats.lowScore}</span>
                                <span>C: {data.stats.latestScore}</span>
                            </div>
                        </div>
                        <div className="card-body" style={{ height: 400, padding: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => str.slice(5)}
                                        stroke="var(--text-muted)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-muted)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 0,
                                            fontFamily: 'JetBrains Mono'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        formatter={(value, name) => {
                                            if (name === 'score') return [`${value}`, 'DQ Score'];
                                            return [value, name];
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="var(--accent-primary)"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-4 mb-xl gap-md">
                        <div className="card">
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                    {data.stats.avgScore}
                                </div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Avg Score
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                                    {data.stats.avgNoise}%
                                </div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Avg Noise
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--error)' }}>
                                    {data.stats.totalBiases}
                                </div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Total Biases
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>
                                    {data.stats.totalAnalyses}
                                </div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Analyses
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-2">
                        {/* Noise Volatility */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Noise Volatility</h3>
                            </div>
                            <div className="card-body" style={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip
                                            cursor={{ stroke: '#333' }}
                                            contentStyle={{ background: '#000', border: '1px solid #333' }}
                                            labelFormatter={(label) => `Date: ${label}`}
                                            formatter={(value) => [`${value}%`, 'Noise Level']}
                                        />
                                        <Line
                                            type="step"
                                            dataKey="noise"
                                            stroke="var(--accent-secondary)"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bias Distribution */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Bias Frequency Distribution</h3>
                            </div>
                            <div className="card-body" style={{ height: 250 }}>
                                {data.biasDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.biasDistribution} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={120}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: '#000', border: '1px solid #333' }}
                                                formatter={(value) => [`${value} occurrences`, 'Count']}
                                            />
                                            <Bar dataKey="value" fill="var(--error)" barSize={16}>
                                                {data.biasDistribution.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        No biases detected in this period
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Volume Chart */}
                    <div className="card mt-xl">
                        <div className="card-header">
                            <h3>Analysis Volume</h3>
                        </div>
                        <div className="card-body" style={{ height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.trendData}>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => str.slice(5)}
                                        stroke="var(--text-muted)"
                                        fontSize={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: '#000', border: '1px solid #333' }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        formatter={(value) => [`${value} documents`, 'Analyzed']}
                                    />
                                    <Bar dataKey="volume" fill="var(--accent-tertiary)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
