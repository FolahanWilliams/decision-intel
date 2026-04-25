'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  BrainCircuit,
  TrendingUp,
  BarChart3,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import { emptyStateCopy } from '@/lib/onboarding/role-empty-states';
import { useHumanDecisions, type HumanDecisionSummary } from '@/hooks/useHumanDecisions';
import {
  SOURCE_ICONS as AUDIT_SOURCE_ICONS,
  SOURCE_LABELS as AUDIT_SOURCE_LABELS,
  getQualityLevel,
  getBiasArray,
} from '@/lib/constants/human-audit';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('DecisionLog');

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

type SourceFilter = 'all' | 'journal' | 'audits';
type StatusFilter = 'all' | 'pending' | 'completed' | 'dismissed';

// ─── Constants ──────────────────────────────────────────────────────────────

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'journal', label: 'Journal' },
  { key: 'audits', label: 'Audits' },
];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'dismissed', label: 'Dismissed' },
];

const JOURNAL_SOURCE_ICONS: Record<string, LucideIcon> = {
  email_forward: Mail,
  calendar_webhook: Calendar,
  manual: Edit,
  slack_digest: MessageSquare,
};

const JOURNAL_SOURCE_LABELS: Record<string, string> = {
  email_forward: 'Email',
  calendar_webhook: 'Calendar',
  manual: 'Manual',
  slack_digest: 'Slack',
};

const STATUS_BADGE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  pending: {
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.2)',
    color: 'var(--warning)',
  },
  completed: {
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

// ─── Unified Row Model ─────────────────────────────────────────────────────

type UnifiedRow =
  | { kind: 'journal'; createdAt: string; entry: JournalEntry }
  | { kind: 'audit'; createdAt: string; decision: HumanDecisionSummary };

function normalizeJournalStatus(s: string): StatusFilter {
  if (s === 'processed' || s === 'converted') return 'completed';
  if (s === 'dismissed') return 'dismissed';
  return 'pending';
}

function normalizeAuditStatus(d: HumanDecisionSummary): StatusFilter {
  if (d.status === 'pending') return 'pending';
  if (d.cognitiveAudit) return 'completed';
  return 'pending';
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Summary Cards (from AuditsPageContent, simplified) ────────────────────

function AuditSummaryCards({ decisions }: { decisions: HumanDecisionSummary[] }) {
  const audited = decisions.filter(d => d.cognitiveAudit !== null);
  if (audited.length === 0) return null;

  let totalScore = 0;
  let highRisk = 0;
  let totalBiases = 0;
  audited.forEach(d => {
    const audit = d.cognitiveAudit;
    if (!audit) return;
    totalScore += audit.decisionQualityScore;
    if (audit.decisionQualityScore < 40) highRisk++;
    totalBiases += getBiasArray(audit.biasFindings).length;
  });
  const avgQuality = Math.round(totalScore / audited.length);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm font-medium">Total Audited</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {audited.length}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm font-medium">Avg Quality</div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color:
                avgQuality >= 70
                  ? 'var(--success)'
                  : avgQuality >= 40
                    ? 'var(--warning)'
                    : 'var(--error)',
            }}
          >
            {avgQuality}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm font-medium">High Risk</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--error)' }}>{highRisk}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center p-md">
          <div className="text-xs text-muted mb-sm font-medium">Biases Detected</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
            {totalBiases}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Row ──────────────────────────────────────────────────────────

function JournalRow({
  entry,
  onConvert,
  isConverting,
}: {
  entry: JournalEntry;
  onConvert: (id: string) => void;
  isConverting: boolean;
}) {
  const Icon = JOURNAL_SOURCE_ICONS[entry.source] || BookOpen;
  const normalizedStatus = normalizeJournalStatus(entry.status);
  const badgeStyle = STATUS_BADGE_STYLES[normalizedStatus] || STATUS_BADGE_STYLES.pending;
  const sourceLabel = JOURNAL_SOURCE_LABELS[entry.source] || entry.source;

  return (
    <div
      className="flex gap-md items-start p-lg"
      style={{ borderBottom: '1px solid var(--border-color)' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-card-hover)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-sm" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '60ch',
            }}
          >
            {entry.title}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}
          >
            {sourceLabel}
          </span>
          {entry.extractedDecisions.length > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-secondary)',
              }}
            >
              {entry.extractedDecisions.length} decision
              {entry.extractedDecisions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-md" style={{ fontSize: 11 }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: badgeStyle.bg,
              border: `1px solid ${badgeStyle.border}`,
              color: badgeStyle.color,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {normalizedStatus}
          </span>
          <span className="flex items-center gap-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={11} />
            {formatFullDate(entry.createdAt)}
          </span>
        </div>
        {entry.extractedDecisions.length > 0 && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {entry.extractedDecisions.slice(0, 2).map((d, i) => (
              <p
                key={i}
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                • {d}
              </p>
            ))}
            {entry.extractedDecisions.length > 2 && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                +{entry.extractedDecisions.length - 2} more
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-sm" style={{ flexShrink: 0 }}>
        {normalizedStatus === 'pending' && (
          <button
            onClick={() => onConvert(entry.id)}
            disabled={isConverting}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
          >
            {isConverting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ArrowRight size={12} />
            )}
            Convert
          </button>
        )}
        {normalizedStatus === 'completed' && (
          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
        )}
        {normalizedStatus === 'dismissed' && (
          <XCircle size={16} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>
    </div>
  );
}

// ─── Audit Row ────────────────────────────────────────────────────────────

function AuditRow({
  decision,
  onDelete,
}: {
  decision: HumanDecisionSummary;
  onDelete: (d: HumanDecisionSummary) => void;
}) {
  const audit = decision.cognitiveAudit;
  const quality = audit ? getQualityLevel(audit.decisionQualityScore) : null;
  const biases = audit ? getBiasArray(audit.biasFindings) : [];
  const SourceIcon = AUDIT_SOURCE_ICONS[decision.source] || BrainCircuit;
  const sourceLabel = AUDIT_SOURCE_LABELS[decision.source] || decision.source;

  return (
    <div
      className="flex gap-md items-center p-lg"
      style={{ borderBottom: '1px solid var(--border-color)' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-full)',
          background: quality?.bg ?? 'var(--bg-card-hover)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SourceIcon size={16} style={{ color: quality?.color ?? 'var(--text-secondary)' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-sm" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {sourceLabel}
            {decision.channel && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                {' '}
                — {decision.channel}
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(22, 163, 74, 0.08)',
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}
          >
            Audit
          </span>
          {decision.decisionType && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-secondary)',
              }}
            >
              {decision.decisionType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-md" style={{ fontSize: 11 }}>
          {quality ? (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: quality.bg,
                border: `1px solid ${quality.color}33`,
                color: quality.color,
                fontWeight: 600,
              }}
            >
              {quality.label}
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              ANALYZING
            </span>
          )}
          <span className="flex items-center gap-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={11} />
            {formatFullDate(decision.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-md" style={{ flexShrink: 0 }}>
        {audit && (
          <>
            <div className="text-center">
              <div className="text-xs text-muted">DQI</div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: quality?.color ?? 'var(--text-primary)',
                }}
              >
                {Math.round(audit.decisionQualityScore)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted">Biases</div>
              <div
                className="flex items-center justify-center gap-xs"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                <AlertTriangle
                  size={12}
                  style={{
                    color: biases.length > 0 ? 'var(--warning)' : 'var(--text-muted)',
                  }}
                />
                {biases.length}
              </div>
            </div>
          </>
        )}
        <Link
          href={`/dashboard/cognitive-audits/${decision.id}`}
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          View <ArrowRight size={12} />
        </Link>
        <button
          onClick={() => onDelete(decision)}
          className="btn btn-ghost"
          style={{ padding: 6, color: 'var(--text-muted)' }}
          title="Delete audit"
          aria-label="Delete audit"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DecisionLogPage() {
  const role = useOnboardingRole();
  const logCopy = emptyStateCopy('decision-log', role);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  // Audit state
  const { decisions, mutate: mutateAudits, isLoading: auditsLoading } = useHumanDecisions(1, 50);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // New entry form
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: '', label: '' });
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch journal ──────────────────────────────────────────────────

  const fetchJournal = useCallback(async () => {
    setJournalLoading(true);
    try {
      const res = await fetch('/api/journal?limit=50');
      if (res.ok) {
        const data = await res.json();
        setJournalEntries(data.entries || []);
      }
    } catch (err) {
      log.error('Failed to load journal entries:', err);
      setError('Failed to load journal entries.');
    } finally {
      setJournalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  // ─── Actions ────────────────────────────────────────────────────────

  const handleConvert = useCallback(async (entryId: string) => {
    setConverting(entryId);
    try {
      const res = await fetch(`/api/journal/${entryId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setJournalEntries(prev =>
          prev.map(e => (e.id === entryId ? { ...e, status: 'processed' } : e))
        );
      }
    } catch (err) {
      log.error('Convert failed:', err);
      setError('Failed to convert entry.');
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
        fetchJournal();
      }
    } catch (err) {
      log.error('New entry submit failed:', err);
      setError('Failed to save new entry.');
    } finally {
      setSubmitting(false);
    }
  }, [newEntryTitle, newEntryContent, fetchJournal]);

  const handleDeleteAudit = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/human-decisions/${deleteModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        await mutateAudits();
        setDeleteModal({ open: false, id: '', label: '' });
      }
    } catch (err) {
      log.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Unified + filtered list ────────────────────────────────────────

  const { visibleRows, journalCount, auditsCount } = useMemo(() => {
    const journalRows: UnifiedRow[] = journalEntries.map(entry => ({
      kind: 'journal' as const,
      createdAt: entry.createdAt,
      entry,
    }));
    const auditRows: UnifiedRow[] = decisions.map(decision => ({
      kind: 'audit' as const,
      createdAt: decision.createdAt,
      decision,
    }));

    const bySource =
      sourceFilter === 'journal'
        ? journalRows
        : sourceFilter === 'audits'
          ? auditRows
          : [...journalRows, ...auditRows];

    const byStatus = bySource.filter(row => {
      if (statusFilter === 'all') return true;
      if (row.kind === 'journal') {
        return normalizeJournalStatus(row.entry.status) === statusFilter;
      }
      return normalizeAuditStatus(row.decision) === statusFilter;
    });

    byStatus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      visibleRows: byStatus,
      journalCount: journalRows.length,
      auditsCount: auditRows.length,
    };
  }, [journalEntries, decisions, sourceFilter, statusFilter]);

  const loading = journalLoading && auditsLoading;
  const totalCount = journalCount + auditsCount;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <ErrorBoundary sectionName="Decision Log">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 style={{ margin: 0 }}>
              <span className="text-gradient">Decision Log</span>
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 640 }}>
              One feed for every decision — journal entries captured from your workflow alongside
              full cognitive audits. Convert, audit, or drill in from the same place.
              {totalCount > 0 && (
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                  · {totalCount} total
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowNewEntry(s => !s)}
              className={showNewEntry ? 'btn btn-secondary' : 'btn btn-primary'}
              style={{ gap: 6, fontSize: 13 }}
            >
              <Plus size={14} />
              New Entry
            </button>
            <Link
              href="/dashboard/cognitive-audits/submit"
              className="btn btn-secondary"
              style={{ gap: 6, fontSize: 13 }}
            >
              <BrainCircuit size={14} />
              Submit Audit
            </Link>
            <Link
              href="/dashboard/cognitive-audits/effectiveness"
              className="btn btn-ghost"
              style={{ gap: 6, fontSize: 13 }}
            >
              <TrendingUp size={14} />
              Effectiveness
            </Link>
          </div>
        </div>

        {/* New Entry Form */}
        <AnimatePresence>
          {showNewEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 20 }}
            >
              <div
                className="card"
                style={{
                  borderLeft: '3px solid var(--warning)',
                }}
              >
                <div className="card-body">
                  <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                    <Edit size={14} style={{ color: 'var(--warning)' }} />
                    <span className="section-heading" style={{ marginBottom: 0 }}>
                      Manual Journal Entry
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Entry title…"
                    value={newEntryTitle}
                    onChange={e => setNewEntryTitle(e.target.value)}
                    style={{
                      width: '100%',
                      marginBottom: 8,
                      padding: '10px 12px',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <textarea
                    placeholder="Describe the decision, meeting, or reasoning context…"
                    value={newEntryContent}
                    onChange={e => setNewEntryContent(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      marginBottom: 12,
                      padding: '10px 12px',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                  <div className="flex items-center justify-end gap-sm">
                    <button
                      onClick={() => setShowNewEntry(false)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNewEntry}
                      disabled={submitting || !newEntryTitle.trim() || !newEntryContent.trim()}
                      className="btn btn-primary"
                      style={{
                        fontSize: 12,
                        gap: 6,
                        opacity:
                          submitting || !newEntryTitle.trim() || !newEntryContent.trim() ? 0.5 : 1,
                      }}
                    >
                      {submitting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      {submitting ? 'Saving…' : 'Save Entry'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source filter chips */}
        <div className="flex items-center gap-sm" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          {SOURCE_FILTERS.map(f => {
            const count =
              f.key === 'all' ? totalCount : f.key === 'journal' ? journalCount : auditsCount;
            const active = sourceFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: active ? 'var(--border-color)' : 'var(--bg-card)',
                  border: `1px solid ${active ? 'var(--border-hover)' : 'var(--border-color)'}`,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
                <span
                  style={{
                    marginLeft: 6,
                    color: active ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    fontWeight: 500,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status segmented control */}
        <div
          className="flex items-center mb-lg"
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: 'fit-content',
            overflow: 'hidden',
          }}
        >
          {STATUS_TABS.map((t, idx) => {
            const active = statusFilter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  background: active ? 'var(--bg-active)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: idx !== 0 ? '1px solid var(--border-color)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Audit summary cards when Audits filter active */}
        {sourceFilter === 'audits' && <AuditSummaryCards decisions={decisions} />}

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: 13,
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={14} />
            {error}
            <button
              onClick={() => {
                setError(null);
                fetchJournal();
                mutateAudits();
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ padding: 'var(--spacing-2xl)' }}
          >
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Loading…
            </span>
          </div>
        ) : visibleRows.length === 0 ? (
          <EnhancedEmptyState
            type="generic"
            title={
              sourceFilter === 'all'
                ? logCopy.title
                : sourceFilter === 'audits'
                  ? 'No cognitive audits yet'
                  : 'No journal entries yet'
            }
            description={
              sourceFilter === 'audits'
                ? 'Audit a human decision — submit a memo, meeting transcript, or Slack excerpt to start building your log.'
                : sourceFilter === 'journal'
                  ? 'Log a journal entry, connect email/calendar/Slack, or submit a decision for audit.'
                  : logCopy.description
            }
            showBrief
            briefContext="journal"
          />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <BarChart3 size={16} />
                {sourceFilter === 'all'
                  ? 'Decision Feed'
                  : sourceFilter === 'journal'
                    ? 'Journal Entries'
                    : 'Cognitive Audits'}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    marginLeft: 6,
                  }}
                >
                  {visibleRows.length}
                </span>
              </h3>
            </div>
            <div>
              {visibleRows.map((row, idx) => {
                const isLast = idx === visibleRows.length - 1;
                const rowContent =
                  row.kind === 'journal' ? (
                    <JournalRow
                      entry={row.entry}
                      onConvert={handleConvert}
                      isConverting={converting === row.entry.id}
                    />
                  ) : (
                    <AuditRow
                      decision={row.decision}
                      onDelete={d =>
                        setDeleteModal({
                          open: true,
                          id: d.id,
                          label: `${AUDIT_SOURCE_LABELS[d.source] || d.source}${
                            d.channel ? ` — ${d.channel}` : ''
                          }`,
                        })
                      }
                    />
                  );
                return (
                  <div
                    key={row.kind === 'journal' ? `j-${row.entry.id}` : `a-${row.decision.id}`}
                    style={{
                      borderBottom: isLast ? 'none' : undefined,
                    }}
                  >
                    {rowContent}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteModal.open && (
          <div className="modal-backdrop" style={{ zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: 420, width: '90%' }}>
              <div className="card-header">
                <h3 className="flex items-center gap-sm">
                  <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
                  Delete Audit
                </h3>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Delete <strong>{deleteModal.label}</strong>? This removes the decision, its
                  cognitive audit, and all nudges.
                </p>
                <div className="flex items-center justify-end gap-sm">
                  <button
                    onClick={() => setDeleteModal({ open: false, id: '', label: '' })}
                    className="btn btn-ghost"
                    disabled={deleting}
                    style={{ fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAudit}
                    disabled={deleting}
                    className="btn"
                    style={{
                      fontSize: 12,
                      background: 'var(--error)',
                      color: '#fff',
                      gap: 6,
                    }}
                  >
                    {deleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
