'use client';

import { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { Calendar, Filter, Download } from 'lucide-react';

const mockTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    score: 65 + Math.random() * 25,
    noise: 30 + Math.random() * 20,
    volume: Math.floor(Math.random() * 15)
}));

const mockBiasDistribution = [
    { name: 'Sunk Cost', value: 24 },
    { name: 'Confirmation', value: 18 },
    { name: 'Anchoring', value: 12 },
    { name: 'Halo Effect', value: 9 },
    { name: 'Availability', value: 7 }
];

export default function TrendsPage() {
    const [timeRange, setTimeRange] = useState('1M');

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)', maxWidth: '100%' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-xl pb-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', border: 'none', padding: 0 }}>Historical Analysis</h1>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase' }}>Decision Quality Trends & Patterns</p>
                </div>
                <div className="flex items-center gap-sm">
                    {['1W', '1M', '3M', 'YTD', 'ALL'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`btn ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ minWidth: '40px' }}
                        >
                            {range}
                        </button>
                    ))}
                    <button className="btn btn-secondary ml-md">
                        <Download size={14} />
                        EXPORT DATA
                    </button>
                </div>
            </div>

            {/* Main Chart - "Stock" Style */}
            <div className="card mb-xl">
                <div className="card-header flex justify-between">
                    <div className="flex items-center gap-md">
                        <h3 style={{ color: 'var(--accent-primary)' }}>DQ-IDX (Decision Quality Index)</h3>
                        <span className="badge badge-complete">+4.2%</span>
                    </div>
                    <div className="flex items-center gap-lg text-sm text-muted">
                        <span>O: 78.2</span>
                        <span>H: 91.5</span>
                        <span>L: 66.4</span>
                        <span>C: 88.1</span>
                    </div>
                </div>
                <div className="card-body" style={{ height: 400, padding: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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

            <div className="grid grid-2">
                {/* Noise Volatility */}
                <div className="card">
                    <div className="card-header">
                        <h3>Noise Volatility</h3>
                    </div>
                    <div className="card-body" style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis dataKey="date" hide />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ stroke: '#333' }}
                                    contentStyle={{ background: '#000', border: '1px solid #333' }}
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
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockBiasDistribution} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Bar dataKey="value" fill="var(--error)" barSize={16}>
                                    {mockBiasDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
