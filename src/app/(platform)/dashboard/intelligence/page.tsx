'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
    Newspaper, BookOpen, Landmark, RefreshCw, Clock, AlertTriangle,
    ExternalLink, Globe, Zap, Database, TrendingUp,
} from 'lucide-react';
import { useIntelligenceStatus } from '@/hooks/useIntelligence';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Section Label (matching insights page style) ────────────────────────────

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
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
            }}>
                {String(index).padStart(2, '0')}
            </span>
            <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
            }}>
                {children}
            </span>
            <div style={{
                flex: 1,
                height: '1px',
                background: 'linear-gradient(to right, var(--glass-border), transparent)',
            }} />
        </div>
    );
}

// ─── Freshness Badge ─────────────────────────────────────────────────────────

function FreshnessBadge({ freshness, hoursOld }: { freshness: string; hoursOld: number }) {
    const config = {
        fresh: { color: 'var(--success)', label: 'FRESH', icon: Zap },
        stale: { color: 'var(--warning)', label: 'STALE', icon: Clock },
        empty: { color: 'var(--error)', label: 'NO DATA', icon: AlertTriangle },
    }[freshness] || { color: 'var(--text-muted)', label: 'UNKNOWN', icon: Clock };

    const Icon = config.icon;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: config.color,
            background: `${config.color}12`,
            borderRadius: '9999px',
        }}>
            <Icon size={10} />
            {config.label}
            {freshness !== 'empty' && ` (${hoursOld < 1 ? '<1h' : `${Math.round(hoursOld)}h`} ago)`}
        </span>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, delay }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    delay: number;
}) {
    return (
        <div
            className="card card-glow animate-slide-up"
            style={{ animationDelay: `${delay}s`, overflow: 'hidden' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                <div style={{
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}15`, borderRadius: '8px', color,
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {value}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)',  }}>
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── News Article Card ───────────────────────────────────────────────────────

interface NewsArticle {
    id: string;
    title: string;
    link: string;
    source: string;
    feedCategory: string;
    description: string;
    publishedAt: string;
    relevanceScore: number;
    biasTypes: string[];
    extractedTopics: string[];
}

function ArticleCard({ article, delay }: { article: NewsArticle; delay: number }) {
    const categoryColors: Record<string, string> = {
        psychology: 'var(--accent-primary)',
        business: '#4CAF50',
        regulatory: '#FF5722',
        industry: '#2196F3',
        academic: '#9C27B0',
    };
    const catColor = categoryColors[article.feedCategory] || 'var(--text-muted)';

    return (
        <div
            className="card animate-slide-up"
            style={{ animationDelay: `${delay}s`, padding: '16px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px', lineHeight: 1.4 }}
                >
                    {article.title}
                    <ExternalLink size={12} style={{ marginLeft: '4px', opacity: 0.5, display: 'inline' }} />
                </a>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {article.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{
                    fontSize: '10px', padding: '2px 6px', borderRadius: '2px',
                    background: `${catColor}15`, color: catColor, fontWeight: 600,
                                    }}>
                    {article.feedCategory}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {article.source}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(article.publishedAt).toLocaleDateString()}
                </span>
                {article.biasTypes.slice(0, 3).map(b => (
                    <span key={b} style={{
                        fontSize: '10px', padding: '1px 5px', borderRadius: '2px',
                        border: '1px solid var(--border-color)', color: 'var(--text-muted)',
                    }}>
                        {b}
                    </span>
                ))}
                {article.relevanceScore > 0.7 && (
                    <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        HIGH RELEVANCE
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IntelligencePage() {
    const { status, isLoading: statusLoading, mutate: mutateStatus } = useIntelligenceStatus();
    const [syncing, setSyncing] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const newsUrl = `/api/intelligence/news?limit=30${categoryFilter ? `&category=${categoryFilter}` : ''}`;
    const { data: newsData, isLoading: newsLoading, mutate: mutateNews } = useSWR(newsUrl, fetcher);

    const articles: NewsArticle[] = newsData?.articles || [];

    const handleSync = useCallback(async () => {
        setSyncing(true);
        setSyncMessage(null);
        try {
            const res = await fetch('/api/news/sync', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setSyncMessage(`Synced ${data.feedsProcessed} feeds, ${data.articlesAdded} new articles in ${(data.durationMs / 1000).toFixed(1)}s`);
                mutateStatus();
                mutateNews();
            } else {
                setSyncMessage(`Sync failed: ${data.error || 'Unknown error'}`);
            }
        } catch {
            setSyncMessage('Sync failed: Network error');
        } finally {
            setSyncing(false);
        }
    }, [mutateStatus, mutateNews]);

    // Clear sync message after 10 seconds
    useEffect(() => {
        if (!syncMessage) return;
        const t = setTimeout(() => setSyncMessage(null), 10000);
        return () => clearTimeout(t);
    }, [syncMessage]);

    const categories = ['', 'psychology', 'business', 'regulatory', 'industry', 'academic'];

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            <Breadcrumbs items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Intelligence' },
            ]} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Intelligence Hub
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Real-time news, research, and market context powering your analysis pipeline.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {status && <FreshnessBadge freshness={status.freshness} hoursOld={status.hoursOld} />}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    >
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {syncMessage && (
                <div className="card" style={{
                    padding: '12px 16px', marginBottom: 'var(--spacing-lg)',
                    borderLeft: `3px solid ${syncMessage.includes('failed') ? 'var(--error)' : 'var(--success)'}`,
                    fontSize: '13px', color: 'var(--text-secondary)',
                }}>
                    {syncMessage}
                </div>
            )}

            {/* [01] Overview Stats */}
            <ErrorBoundary sectionName="Intelligence Overview">
                <SectionLabel index={1}>Overview</SectionLabel>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                    <StatCard
                        label="Active Articles"
                        value={statusLoading ? '...' : (status?.counts.articles ?? 0)}
                        icon={<Newspaper size={20} />}
                        color="var(--accent-primary)"
                        delay={0.1}
                    />
                    <StatCard
                        label="Research Papers"
                        value={statusLoading ? '...' : (status?.counts.research ?? 0)}
                        icon={<BookOpen size={20} />}
                        color="#9C27B0"
                        delay={0.15}
                    />
                    <StatCard
                        label="Case Studies"
                        value={statusLoading ? '...' : (status?.counts.caseStudies ?? 0)}
                        icon={<Database size={20} />}
                        color="#4CAF50"
                        delay={0.2}
                    />
                    <StatCard
                        label="Data Freshness"
                        value={statusLoading ? '...' : (
                            status?.hoursOld === Infinity ? 'N/A' :
                            status?.hoursOld !== undefined && status.hoursOld < 1 ? '<1h' : `${Math.round(status?.hoursOld ?? 0)}h`
                        )}
                        icon={<TrendingUp size={20} />}
                        color={status?.freshness === 'fresh' ? 'var(--success)' : status?.freshness === 'stale' ? 'var(--warning)' : 'var(--error)'}
                        delay={0.25}
                    />
                </div>
            </ErrorBoundary>

            {/* [02] News Feed */}
            <ErrorBoundary sectionName="News Feed">
                <SectionLabel index={2}>News &amp; Signals</SectionLabel>

                {/* Category filter bar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat || 'all'}
                            onClick={() => setCategoryFilter(cat)}
                            style={{
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: categoryFilter === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: categoryFilter === cat ? 'var(--bg-primary)' : 'var(--text-muted)',
                                border: `1px solid ${categoryFilter === cat ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                transition: 'all 0.1s',
                            }}
                        >
                            {cat || 'All'}
                        </button>
                    ))}
                </div>

                {newsLoading ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                        Loading articles...
                    </div>
                ) : articles.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <Newspaper size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
                            No intelligence data yet.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            Click &quot;Sync Now&quot; to fetch articles from curated RSS feeds.
                        </p>
                    </div>
                ) : (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-md)' }}>
                        {articles.map((article, i) => (
                            <ArticleCard key={article.id} article={article} delay={0.05 * i} />
                        ))}
                    </div>
                )}
            </ErrorBoundary>

            {/* [03] Macro Context */}
            <ErrorBoundary sectionName="Market Context">
                <SectionLabel index={3}>Market Context</SectionLabel>
                <MacroSection />
            </ErrorBoundary>
        </div>
    );
}

// ─── Macro Section (loads its own data) ──────────────────────────────────────

function MacroSection() {
    const [macro, setMacro] = useState<{ indicators: Array<{ name: string; value: string; period: string; source: string }>; summary: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMacro = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/intelligence/macro');
            if (!res.ok) throw new Error('Failed to fetch macro data');
            const data = await res.json();
            setMacro(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    if (!macro && !loading && !error) {
        return (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <Landmark size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                    Macro-economic indicators from FRED (Federal Reserve Economic Data).
                </p>
                <button onClick={loadMacro} className="btn btn-primary" style={{ fontSize: '12px' }}>
                    <Globe size={14} style={{ marginRight: '6px' }} />
                    Load Market Data
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                Fetching macro indicators...
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
                <button onClick={loadMacro} className="btn" style={{ fontSize: '12px' }}>Retry</button>
            </div>
        );
    }

    if (!macro) return null;

    return (
        <div>
            {macro.summary && (
                <div className="card" style={{ padding: '16px', marginBottom: 'var(--spacing-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{macro.summary}</p>
                </div>
            )}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-sm)' }}>
                {macro.indicators.map((ind, i) => (
                    <div
                        key={ind.name}
                        className="card animate-slide-up"
                        style={{ animationDelay: `${0.05 * i}s`, padding: '14px' }}
                    >
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>
                            {ind.name}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {ind.value}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {ind.period} · {ind.source}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
