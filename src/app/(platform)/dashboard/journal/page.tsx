'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Mail,
  Calendar,
  Edit,
  MessageSquare,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';

// ─── Types ──────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  source: string;
  title: string;
  content?: string;
  extractedDecisions: string[];
  status: string;
  scheduledAt?: string;
  createdAt: string;
  linkedDecisionId?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

type SourceFilter = 'all' | 'email_forward' | 'calendar_webhook' | 'manual' | 'slack_digest';
type StatusFilter = 'all' | 'pending' | 'converted' | 'dismissed';

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'email_forward', label: 'Email' },
  { key: 'calendar_webhook', label: 'Calendar' },
  { key: 'manual', label: 'Manual' },
  { key: 'slack_digest', label: 'Slack' },
];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'converted', label: 'Converted' },
  { key: 'dismissed', label: 'Dismissed' },
];

const SOURCE_ICONS: Record<string, React.ElementType> = {
  email_forward: Mail,
  calendar_webhook: Calendar,
  manual: Edit,
  slack_digest: MessageSquare,
};

const STATUS_BADGE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  pending: {
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.2)',
    color: 'var(--warning)',
  },
  converted: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.2)',
    color: 'var(--success)',
  },
  processed: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.2)',
    color: 'var(--success)',
  },
  dismissed: {
    bg: 'rgba(161, 161, 170, 0.1)',
    border: 'rgba(161, 161, 170, 0.2)',
    color: 'var(--text-tertiary)',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [converting, setConverting] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (statusFilter !== 'all') {
        // Map 'converted' to 'processed' to match API
        const apiStatus = statusFilter === 'converted' ? 'processed' : statusFilter;
        params.set('status', apiStatus);
      }
      const res = await fetch(`/api/journal?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setPagination(data.pagination || null);
      }
    } catch {
      setError('Failed to load journal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleConvert = useCallback(async (entryId: string) => {
    setConverting(entryId);
    try {
      const res = await fetch(`/api/journal/${entryId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => (e.id === entryId ? { ...e, status: 'processed' } : e)));
      }
    } catch {
      setError('Failed to load journal entries. Please try again.');
    } finally {
      setConverting(null);
    }
  }, []);

  const handleNewEntry = useCallback(async () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual',
          title: newEntryTitle.trim(),
          content: newEntryContent.trim(),
        }),
      });
      if (res.ok) {
        setNewEntryTitle('');
        setNewEntryContent('');
        setShowNewEntry(false);
        fetchEntries();
      }
    } catch {
      setError('Failed to load journal entries. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [newEntryTitle, newEntryContent, fetchEntries]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ErrorBoundary sectionName="Decision Journal">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <BookOpen className="h-6 w-6" style={{ color: 'var(--warning)' }} />
              Decision Journal
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Capture, review, and convert decisions from across your workflow.
              {pagination && (
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                  {pagination.total} total entries
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: showNewEntry ? 'rgba(251, 191, 36, 0.15)' : 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            New Entry
          </button>
        </div>

        {/* New Entry Form */}
        <AnimatePresence>
          {showNewEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '24px' }}
            >
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(251, 191, 36, 0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Edit size={14} style={{ color: 'var(--warning)' }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Manual Journal Entry
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Entry title..."
                  value={newEntryTitle}
                  onChange={e => setNewEntryTitle(e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <textarea
                  placeholder="Describe the decision or context..."
                  value={newEntryContent}
                  onChange={e => setNewEntryContent(e.target.value)}
                  rows={3}
                  className="w-full mb-3 px-3 py-2 rounded-lg text-sm resize-none"
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--bg-elevated)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewEntry}
                    disabled={submitting || !newEntryTitle.trim() || !newEntryContent.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: 'var(--warning)',
                      cursor:
                        submitting || !newEntryTitle.trim() || !newEntryContent.trim()
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        submitting || !newEntryTitle.trim() || !newEntryContent.trim() ? 0.5 : 1,
                    }}
                  >
                    {submitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    {submitting ? 'Saving...' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {SOURCE_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setSourceFilter(filter.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background:
                  sourceFilter === filter.key ? 'var(--border-color)' : 'rgba(255, 255, 255, 0.04)',
                border:
                  sourceFilter === filter.key
                    ? '1px solid var(--border-hover)'
                    : '1px solid var(--bg-card-hover)',
                color: sourceFilter === filter.key ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Status Tabs */}
        <div
          className="flex items-center gap-0 mb-6 rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--bg-elevated)', width: 'fit-content' }}
        >
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: statusFilter === tab.key ? 'var(--bg-active)' : 'transparent',
                color: statusFilter === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRight: '1px solid var(--bg-card-hover)',
                cursor: 'pointer',
                border: 'none',
                borderLeft: tab.key !== 'all' ? '1px solid var(--bg-card-hover)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--spacing-md)',
              fontSize: '13px',
              color: 'var(--error)',
            }}
            className="flex items-center gap-sm"
          >
            <AlertTriangle size={14} />
            {error}
            <button
              onClick={() => {
                setError(null);
                fetchEntries();
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Timeline List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading journal entries...
            </span>
          </div>
        ) : entries.length === 0 ? (
          <EnhancedEmptyState
            type="generic"
            title="No journal entries found"
            description="Create a manual entry or connect email/calendar/Slack integrations."
            showBrief
            briefContext="journal"
          />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-[19px] top-0 bottom-0 w-px"
              style={{ background: 'var(--bg-card-hover)' }}
            />

            <AnimatePresence>
              {entries.map(entry => {
                const Icon = SOURCE_ICONS[entry.source] || BookOpen;
                const badgeStyle = STATUS_BADGE_STYLES[entry.status] || STATUS_BADGE_STYLES.pending;
                const isConverting = converting === entry.id;
                const isPending = entry.status === 'pending';
                const statusLabel = entry.status === 'processed' ? 'converted' : entry.status;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative flex gap-4 pb-6"
                  >
                    {/* Timeline dot */}
                    <div
                      className="relative z-10 flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--bg-card-hover)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>

                    {/* Entry card */}
                    <div
                      className="flex-1 rounded-xl p-4"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--bg-card-hover)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {entry.title}
                            </span>
                            {entry.extractedDecisions.length > 0 && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                {entry.extractedDecisions.length} decision
                                {entry.extractedDecisions.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                              style={{
                                background: badgeStyle.bg,
                                border: `1px solid ${badgeStyle.border}`,
                                color: badgeStyle.color,
                              }}
                            >
                              {statusLabel}
                            </span>
                            <span
                              className="flex items-center gap-1 text-[10px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Clock size={10} />
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Convert button */}
                        {isPending && (
                          <button
                            onClick={() => handleConvert(entry.id)}
                            disabled={isConverting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors"
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.2)',
                              color: 'var(--success)',
                              cursor: isConverting ? 'wait' : 'pointer',
                            }}
                          >
                            {isConverting ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ArrowRight size={12} />
                            )}
                            Convert
                          </button>
                        )}

                        {entry.status === 'processed' && (
                          <CheckCircle
                            size={16}
                            style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}
                          />
                        )}

                        {entry.status === 'dismissed' && (
                          <XCircle
                            size={16}
                            style={{
                              color: 'var(--text-tertiary)',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          />
                        )}
                      </div>

                      {/* Extracted decisions preview */}
                      {entry.extractedDecisions.length > 0 && (
                        <div
                          className="mt-3 pt-3 space-y-1"
                          style={{ borderTop: '1px solid var(--bg-card-hover)' }}
                        >
                          {entry.extractedDecisions.slice(0, 3).map((decision, i) => (
                            <p
                              key={i}
                              className="text-xs truncate"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {decision}
                            </p>
                          ))}
                          {entry.extractedDecisions.length > 3 && (
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              +{entry.extractedDecisions.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
