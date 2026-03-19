'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  GitCompareArrows,
  Settings,
  ClipboardList,
  Upload,
  Keyboard,
  X,
  FileText,
  BookOpen,
  BrainCircuit,
  Bell,
  Video,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  rightHint?: string;
}

interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
  { keys: ['↑', '↓'], description: 'Navigate items' },
  { keys: ['↵'], description: 'Select item / confirm' },
  { keys: ['Esc'], description: 'Close dialog' },
  { keys: ['>', 'query'], description: 'Search actions only' },
  { keys: ['/', 'query'], description: 'Search pages only' },
  { keys: ['@', 'query'], description: 'Search documents' },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  complete: <CheckCircle size={12} style={{ color: 'var(--success)' }} />,
  analyzing: <Loader2 size={12} style={{ color: 'var(--text-secondary)' }} />,
  error: <AlertTriangle size={12} style={{ color: 'var(--error)' }} />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Only fetch documents when palette is open
  const { documents } = useDocuments(false, 1, 8);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  // Build recent documents group
  const recentDocItems: CommandItem[] = useMemo(() => {
    if (!documents?.length) return [];
    return documents.slice(0, 5).map(doc => {
      return {
        id: `doc-${doc.id}`,
        label: doc.filename,
        description: doc.score != null ? `Score: ${Math.round(doc.score)}` : doc.status,
        icon: STATUS_ICONS[doc.status] || <FileText size={14} />,
        action: () => navigate(`/documents/${doc.id}`),
        keywords: [doc.filename.toLowerCase(), doc.status],
        rightHint:
          doc.status === 'complete' && doc.score != null
            ? `${Math.round(doc.score)}/100`
            : undefined,
      };
    });
  }, [documents, navigate]);

  // Navigation commands
  const navCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Home overview',
        icon: <LayoutDashboard size={16} />,
        action: () => navigate('/dashboard'),
        keywords: ['home', 'main'],
      },
      {
        id: 'documents',
        label: 'Documents',
        description: 'All uploaded files',
        icon: <FileText size={16} />,
        action: () => navigate('/'),
        keywords: ['files', 'uploads'],
      },
      {
        id: 'insights',
        label: 'Insights & Trends',
        description: 'Charts and bias breakdowns',
        icon: <BarChart3 size={16} />,
        action: () => navigate('/dashboard/insights'),
        keywords: ['charts', 'visualizations', 'trends'],
      },
      {
        id: 'search',
        label: 'Semantic Search',
        description: 'Search across documents',
        icon: <Search size={16} />,
        action: () => navigate('/dashboard/search'),
        keywords: ['find', 'query'],
      },
      {
        id: 'compare',
        label: 'Compare',
        description: 'Side-by-side comparison',
        icon: <GitCompareArrows size={16} />,
        action: () => navigate('/dashboard/compare'),
        keywords: ['diff', 'side by side'],
      },
      {
        id: 'chat',
        label: 'Second Brain Chat',
        description: 'Ask questions about your documents',
        icon: <MessageSquare size={16} />,
        action: () => navigate('/dashboard/chat'),
        keywords: ['ask', 'question', 'rag', 'ai'],
      },
      {
        id: 'bias-library',
        label: 'Bias Library',
        description: 'Learn about cognitive biases',
        icon: <BookOpen size={16} />,
        action: () => navigate('/dashboard/bias-library'),
        keywords: ['education', 'learn', 'bias', 'debiasing'],
      },
      {
        id: 'cognitive-audits',
        label: 'Cognitive Audits',
        description: 'Audit human decisions',
        icon: <BrainCircuit size={16} />,
        action: () => navigate('/dashboard/cognitive-audits'),
        keywords: ['human', 'audit'],
      },
      {
        id: 'meetings',
        label: 'Meetings',
        description: 'Meeting recordings & transcripts',
        icon: <Video size={16} />,
        action: () => navigate('/dashboard/meetings'),
        keywords: ['recording', 'transcript'],
      },
      {
        id: 'nudges',
        label: 'Nudges',
        description: 'Decision coaching alerts',
        icon: <Bell size={16} />,
        action: () => navigate('/dashboard/nudges'),
        keywords: ['coaching', 'alerts', 'intervention'],
      },
      {
        id: 'audit-log',
        label: 'Audit Log',
        description: 'Activity log',
        icon: <ClipboardList size={16} />,
        action: () => navigate('/dashboard/audit-log'),
        keywords: ['activity', 'log'],
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'User preferences',
        icon: <Settings size={16} />,
        action: () => navigate('/dashboard/settings'),
        keywords: ['preferences', 'config'],
      },
    ],
    [navigate]
  );

  // Action commands
  const actionCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'upload',
        label: 'Upload Document',
        description: 'Upload a new file for analysis',
        icon: <Upload size={16} />,
        action: () => {
          navigate('/dashboard');
          setTimeout(() => document.getElementById('file-input')?.click(), 300);
        },
        keywords: ['new', 'add', 'file'],
      },
      {
        id: 'new-chat',
        label: 'New Chat Session',
        description: 'Start a fresh conversation',
        icon: <Zap size={16} />,
        action: () => {
          navigate('/dashboard/chat');
        },
        keywords: ['conversation', 'new', 'start'],
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all shortcuts',
        icon: <Keyboard size={16} />,
        action: () => {
          setOpen(false);
          setShowShortcuts(true);
        },
        keywords: ['keys', 'help', 'hotkeys'],
      },
    ],
    [navigate]
  );

  // Build groups with filtering
  const { groups, flatItems } = useMemo(() => {
    const rawQuery = query.trim();
    let searchMode: 'all' | 'actions' | 'pages' | 'documents' = 'all';
    let q = rawQuery.toLowerCase();

    // Prefix-based filtering
    if (q.startsWith('>')) {
      searchMode = 'actions';
      q = q.slice(1).trim();
    } else if (q.startsWith('/')) {
      searchMode = 'pages';
      q = q.slice(1).trim();
    } else if (q.startsWith('@')) {
      searchMode = 'documents';
      q = q.slice(1).trim();
    }

    const matchesQuery = (item: CommandItem) => {
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some(k => k.includes(q))
      );
    };

    const result: CommandGroup[] = [];

    // Recent Documents group
    if (searchMode === 'all' || searchMode === 'documents') {
      const filtered = recentDocItems.filter(matchesQuery);
      if (filtered.length > 0) {
        result.push({ id: 'recent', label: 'Recent Documents', items: filtered });
      }
    }

    // Navigation group
    if (searchMode === 'all' || searchMode === 'pages') {
      const filtered = navCommands.filter(matchesQuery);
      if (filtered.length > 0) {
        result.push({ id: 'navigation', label: 'Navigation', items: filtered });
      }
    }

    // Actions group
    if (searchMode === 'all' || searchMode === 'actions') {
      const filtered = actionCommands.filter(matchesQuery);
      if (filtered.length > 0) {
        result.push({ id: 'actions', label: 'Actions', items: filtered });
      }
    }

    const flat = result.flatMap(g => g.items);
    return { groups: result, flatItems: flat };
  }, [query, recentDocItems, navCommands, actionCommands]);

  // Clamp selectedIndex
  const clampedIndex = flatItems.length > 0 ? Math.min(selectedIndex, flatItems.length - 1) : 0;

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) {
            setQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
      }
      // Ctrl+Shift+P as alternative
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) {
            setQuery('>');
            setSelectedIndex(0);
          }
          return !prev;
        });
      }
      if (e.shiftKey && e.key === '?' && !open) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false);
        else if (open) setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showShortcuts]);

  // Focus input when opened
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    // Find the actual item element by data attribute
    const items = listRef.current.querySelectorAll('[data-cmd-item]');
    const item = items[clampedIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [clampedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatItems[clampedIndex]) {
        e.preventDefault();
        flatItems[clampedIndex].action();
      }
    },
    [flatItems, clampedIndex]
  );

  if (!open && !showShortcuts) return null;

  // Keyboard shortcuts help modal
  if (showShortcuts) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center"
        style={{ paddingTop: '20vh' }}
      >
        <div
          className="fixed inset-0 bg-black/60"
          onClick={() => setShowShortcuts(false)}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="relative w-full max-w-sm mx-4 animate-slide-up"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-sm">
              <Keyboard size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Keyboard Shortcuts</span>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              aria-label="Close shortcuts"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {SHORTCUTS.map(shortcut => (
              <div
                key={shortcut.description}
                className="flex items-center justify-between"
                style={{ padding: '8px var(--spacing-md)', fontSize: '13px' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map(key => (
                    <kbd
                      key={key}
                      style={{
                        padding: '2px 8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'inherit',
                        color: 'var(--text-primary)',
                        minWidth: 24,
                        textAlign: 'center' as const,
                      }}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Track cumulative index for flat item mapping
  let itemIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '18vh' }}
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
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-sm"
          style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, actions, documents...  (> actions, / pages, @ docs)"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
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
          <kbd
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Grouped results */}
        <div
          ref={listRef}
          role="listbox"
          style={{ maxHeight: 380, overflowY: 'auto', padding: '4px 0' }}
        >
          {flatItems.length === 0 ? (
            <div
              style={{
                padding: 'var(--spacing-lg)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            groups.map(group => {
              const groupItems = group.items.map(cmd => {
                const idx = itemIndex++;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    data-cmd-item
                    aria-selected={idx === clampedIndex}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      width: 'calc(100% - 8px)',
                      padding: '8px var(--spacing-md)',
                      margin: '1px 4px',
                      background: idx === clampedIndex ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      textAlign: 'left' as const,
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        color: idx === clampedIndex ? 'var(--text-highlight)' : 'var(--text-muted)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {cmd.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>{cmd.label}</span>
                      {cmd.description && (
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            marginLeft: 8,
                            fontSize: '12px',
                          }}
                        >
                          {cmd.description}
                        </span>
                      )}
                    </div>
                    {cmd.rightHint && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--success)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {cmd.rightHint}
                      </span>
                    )}
                    {idx === clampedIndex && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        ↵
                      </span>
                    )}
                  </button>
                );
              });

              return (
                <div key={group.id}>
                  <div
                    style={{
                      padding: '8px var(--spacing-md) 4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.label}
                  </div>
                  {groupItems}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '8px var(--spacing-md)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 'var(--spacing-md)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <span>
            <kbd
              style={{
                padding: '1px 4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              ↑↓
            </kbd>{' '}
            navigate
          </span>
          <span>
            <kbd
              style={{
                padding: '1px 4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              ↵
            </kbd>{' '}
            select
          </span>
          <span>
            <kbd
              style={{
                padding: '1px 4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              &gt;
            </kbd>{' '}
            actions
          </span>
          <span>
            <kbd
              style={{
                padding: '1px 4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              @
            </kbd>{' '}
            documents
          </span>
          <span>
            <kbd
              style={{
                padding: '1px 4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              /
            </kbd>{' '}
            pages
          </span>
        </div>
      </div>
    </div>
  );
}
