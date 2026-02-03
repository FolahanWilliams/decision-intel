'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    BarChart3, FileText, TrendingUp, AlertTriangle,
    RefreshCw, Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { UserButton } from "@clerk/nextjs";

interface Stats {
    overview: {
        totalDocuments: number;
        documentsAnalyzed: number;
        avgOverallScore: number;
        avgNoiseScore: number;
    };
    topBiases: Array<{ name: string; count: number }>;
    severityDistribution: Record<string, number>;
    recentDocuments: Array<{
        id: string;
        filename: string;
        status: string;
        uploadedAt: string;
        score?: number;
    }>;
}

const SEVERITY_COLORS = {
    low: '#30d158',
    medium: '#ffd60a',
    high: '#ff9f0a',
    critical: '#ff453a'
};

const CHART_COLORS = ['#ff9f0a', '#0a84ff', '#30d158', '#ffd60a', '#bf5af2'];

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card">
                    <div className="card-body flex flex-col items-center gap-md">
                        <AlertTriangle size={48} style={{ color: 'var(--error)' }} />
                        <p style={{ color: 'var(--error)' }}>{error}</p>
                        <button className="btn btn-primary" onClick={fetchStats}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const severityData = stats?.severityDistribution
        ? Object.entries(stats.severityDistribution).map(([severity, count]) => ({
            name: severity.charAt(0).toUpperCase() + severity.slice(1),
            value: count,
            color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
        }))
        : [];



    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)', maxWidth: '100%' }}>
            {/* Header */}
            <header className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Market Dashboard</h1>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase' }}>Decision Intelligence Overview</p>
                </div>
                <div className="flex items-center gap-md">
                    <button className="btn btn-secondary" onClick={fetchStats}>
                        <RefreshCw size={14} />
                        REFRESH DATA
                    </button>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </header>

            {/* Overview Cards */}
            <div className="grid grid-4 mb-xl">
                <div className="card animate-fade-in">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-md">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Documents Analyzed
                            </span>
                            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                            {stats?.overview.documentsAnalyzed || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            of {stats?.overview.totalDocuments || 0} total
                        </div>
                    </div>
                </div>

                <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-md">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Avg Decision Score
                            </span>
                            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                        </div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            color: (stats?.overview.avgOverallScore || 0) >= 70 ? 'var(--success)' :
                                (stats?.overview.avgOverallScore || 0) >= 40 ? 'var(--warning)' : 'var(--error)'
                        }}>
                            {stats?.overview.avgOverallScore || 0}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Target: 80%+
                        </div>
                    </div>
                </div>

                <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-md">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Avg Noise Score
                            </span>
                            <BarChart3 size={20} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            color: (stats?.overview.avgNoiseScore || 0) <= 30 ? 'var(--success)' :
                                (stats?.overview.avgNoiseScore || 0) <= 60 ? 'var(--warning)' : 'var(--error)'
                        }}>
                            {stats?.overview.avgNoiseScore || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Lower is better
                        </div>
                    </div>
                </div>

                <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-md">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Biases Found
                            </span>
                            <AlertTriangle size={20} style={{ color: 'var(--accent-secondary)' }} />
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                            {Object.values(stats?.severityDistribution || {}).reduce((a, b) => a + b, 0)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Across all documents
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-2 mb-xl">
                {/* Severity Distribution */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card-header">
                        <h3>Bias Severity Distribution</h3>
                    </div>
                    <div className="card-body" style={{ height: 300 }}>
                        {severityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                        labelStyle={{ color: 'var(--text-primary)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
                                No data yet
                            </div>
                        )}
                        <div className="flex justify-center gap-lg" style={{ marginTop: 'var(--spacing-md)' }}>
                            {severityData.map(item => (
                                <div key={item.name} className="flex items-center gap-sm">
                                    <div style={{ width: 12, height: 12, background: item.color }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Biases */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="card-header">
                        <h3>Most Common Biases</h3>
                    </div>
                    <div className="card-body" style={{ height: 300 }}>
                        {stats?.topBiases && stats.topBiases.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.topBiases} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={140}
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                        labelStyle={{ color: 'var(--text-primary)' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {stats.topBiases.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
                                No biases detected yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Documents */}
            <div className="card animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="card-header flex items-center justify-between">
                    <h3>Recent Documents</h3>
                    <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                        Upload New →
                    </Link>
                </div>
                <div className="card-body">
                    {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Document</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Uploaded</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentDocuments.map(doc => (
                                        <tr key={doc.id}>
                                            <td>
                                                <div className="flex items-center gap-md">
                                                    <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                                                    {doc.filename}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${doc.status}`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td>
                                                {doc.score !== undefined ? (
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
                                                    }}>
                                                        {Math.round(doc.score)}%
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Link href={`/documents/${doc.id}`} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                            <FileText size={48} />
                            <p>No documents uploaded yet</p>
                            <Link href="/" className="btn btn-primary">
                                Upload First Document
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
