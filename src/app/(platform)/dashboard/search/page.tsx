'use client';

import { useState, useCallback } from 'react';
import { Search, FileText, Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastContext';

interface SearchResult {
    documentId: string;
    filename: string;
    similarity: number;
    score: number;
    biases: string[];
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { showToast } = useToast();

    const handleSearch = useCallback(async () => {
        const trimmed = query.trim();
        if (!trimmed) return;

        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: trimmed, limit: 10 }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Search failed');
            }

            const data = await res.json();
            setResults(data.results || []);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Search failed', 'error');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, showToast]);

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', maxWidth: 900 }}>
            <header className="mb-xl">
                <div className="flex items-center gap-md mb-sm">
                    <Search size={28} style={{ color: 'var(--accent-primary)' }} />
                    <h1>Semantic Search</h1>
                </div>
                <p className="text-muted">
                    Search across all your analysed documents using natural language. Results are ranked by semantic similarity.
                </p>
            </header>

            {/* Search input */}
            <div className="card mb-xl">
                <div className="card-body">
                    <div className="flex gap-sm">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            placeholder="e.g. &quot;decisions with high confirmation bias&quot; or &quot;failed risk assessments&quot;"
                            className="input flex-1"
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            className="btn btn-primary flex items-center gap-sm"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    <span className="ml-2 text-muted">Searching documents...</span>
                </div>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="card">
                    <div className="card-body flex flex-col items-center gap-md py-8">
                        <Search size={40} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-muted">No matching documents found. Try a different query.</p>
                    </div>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="flex flex-col gap-md">
                    <p className="text-sm text-muted">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                    {results.map((result, idx) => (
                        <Link
                            key={result.documentId}
                            href={`/documents/${result.documentId}`}
                            className="card animate-fade-in"
                            style={{
                                animationDelay: `${idx * 0.05}s`,
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'border-color 0.15s',
                            }}
                        >
                            <div className="card-body">
                                <div className="flex items-start justify-between gap-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-sm mb-sm">
                                            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>
                                                {result.filename || result.documentId}
                                            </span>
                                        </div>
                                        {result.biases.length > 0 && (
                                            <p className="text-sm text-muted" style={{ lineHeight: 1.5, marginBottom: '8px' }}>
                                                Biases: {result.biases.join(', ')}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-md text-xs">
                                            <span className="flex items-center gap-xs" style={{ color: 'var(--accent-secondary)' }}>
                                                <TrendingUp size={12} />
                                                {Math.round(result.similarity * 100)}% match
                                            </span>
                                            {typeof result.score === 'number' && result.score > 0 && (
                                                <span className="badge badge-secondary">
                                                    Score: {Math.round(result.score)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '4px' }} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Empty state before search */}
            {!searched && (
                <div className="card">
                    <div className="card-body flex flex-col items-center gap-md py-8">
                        <Search size={40} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-muted text-center" style={{ maxWidth: 400 }}>
                            Enter a natural language query to find similar documents, decisions, and patterns across your analysis history.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
