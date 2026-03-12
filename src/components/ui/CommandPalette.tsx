'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, LayoutDashboard, BarChart3, ShieldAlert,
    Globe, MessageSquare, GitCompareArrows, Settings, ClipboardList,
    Activity, Upload,
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
    keywords?: string[];
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const navigate = useCallback((path: string) => {
        setOpen(false);
        router.push(path);
    }, [router]);

    const commands: CommandItem[] = useMemo(() => [
        { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: <LayoutDashboard size={16} />, action: () => navigate('/dashboard'), keywords: ['home', 'main'] },
        { id: 'upload', label: 'Upload Document', description: 'Upload a new file for analysis', icon: <Upload size={16} />, action: () => { navigate('/dashboard'); setTimeout(() => document.getElementById('file-input')?.click(), 300); }, keywords: ['new', 'add', 'file'] },
        { id: 'trends', label: 'Historical Trends', description: 'Score trends over time', icon: <Activity size={16} />, action: () => navigate('/dashboard/trends'), keywords: ['history', 'chart'] },
        { id: 'insights', label: 'Visual Insights', description: 'Charts and bias breakdowns', icon: <BarChart3 size={16} />, action: () => navigate('/dashboard/insights'), keywords: ['charts', 'visualizations'] },
        { id: 'risk', label: 'Risk Audits', description: 'Compliance and risk reports', icon: <ShieldAlert size={16} />, action: () => navigate('/dashboard/risk-audits'), keywords: ['compliance', 'audit'] },
        { id: 'intelligence', label: 'Intelligence', description: 'External news and market signals', icon: <Globe size={16} />, action: () => navigate('/dashboard/intelligence'), keywords: ['news', 'market', 'external'] },
        { id: 'search', label: 'Semantic Search', description: 'Search across documents', icon: <Search size={16} />, action: () => navigate('/dashboard/search'), keywords: ['find', 'query'] },
        { id: 'compare', label: 'Compare', description: 'Side-by-side document comparison', icon: <GitCompareArrows size={16} />, action: () => navigate('/dashboard/compare'), keywords: ['diff', 'side by side'] },
        { id: 'chat', label: 'Chat', description: 'Ask questions about your documents', icon: <MessageSquare size={16} />, action: () => navigate('/dashboard/chat'), keywords: ['ask', 'question', 'rag'] },
        { id: 'audit-log', label: 'Audit Log', description: 'Activity log', icon: <ClipboardList size={16} />, action: () => navigate('/dashboard/audit-log'), keywords: ['activity', 'log'] },
        { id: 'settings', label: 'Settings', description: 'User preferences', icon: <Settings size={16} />, action: () => navigate('/dashboard/settings'), keywords: ['preferences', 'config'] },
    ], [navigate]);

    const filtered = useMemo(() => {
        if (!query) return commands;
        const q = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.description?.toLowerCase().includes(q) ||
            cmd.keywords?.some(k => k.includes(q))
        );
    }, [commands, query]);

    // Reset selection when filter changes
    useEffect(() => { setSelectedIndex(0); }, [filtered.length]);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Scroll selected item into view
    useEffect(() => {
        if (!listRef.current) return;
        const item = listRef.current.children[selectedIndex] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            e.preventDefault();
            filtered[selectedIndex].action();
        }
    }, [filtered, selectedIndex]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center"
            style={{ paddingTop: '20vh' }}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60"
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Palette */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="relative w-full max-w-lg mx-4 animate-slide-up"
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                }}
            >
                {/* Search input */}
                <div className="flex items-center gap-sm" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, actions..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                        }}
                    />
                    <kbd style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                    }}>
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div
                    ref={listRef}
                    role="listbox"
                    style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}
                >
                    {filtered.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No results for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        filtered.map((cmd, idx) => (
                            <button
                                key={cmd.id}
                                role="option"
                                aria-selected={idx === selectedIndex}
                                onClick={() => cmd.action()}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-md)',
                                    width: '100%',
                                    padding: '10px var(--spacing-md)',
                                    background: idx === selectedIndex ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                }}
                            >
                                <span style={{ color: idx === selectedIndex ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                                    {cmd.icon}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: 500 }}>{cmd.label}</span>
                                    {cmd.description && (
                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '12px' }}>
                                            {cmd.description}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div style={{
                    padding: '8px var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                }}>
                    <span><kbd style={{ padding: '1px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>↑↓</kbd> navigate</span>
                    <span><kbd style={{ padding: '1px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>↵</kbd> select</span>
                    <span><kbd style={{ padding: '1px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>esc</kbd> close</span>
                </div>
            </div>
        </div>
    );
}
