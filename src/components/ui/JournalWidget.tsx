'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Mail,
  Calendar,
  MessageSquare,
  ArrowRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  source: string;
  title: string;
  extractedDecisions: string[];
  status: string;
  scheduledAt?: string;
  createdAt: string;
  linkedDecisionId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ElementType> = {
  email_forward: Mail,
  calendar_webhook: Calendar,
  slack_digest: MessageSquare,
  manual: BookOpen,
};

const SOURCE_LABELS: Record<string, string> = {
  email_forward: 'Email',
  calendar_webhook: 'Calendar',
  slack_digest: 'Slack',
  manual: 'Manual',
};

export function JournalWidget() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal?status=pending&limit=10');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleConvert = useCallback(async (entryId: string, decisionStatement: string) => {
    setConverting(entryId);
    try {
      const res = await fetch(`/api/journal/${entryId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionStatement }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => (e.id === entryId ? { ...e, status: 'processed' } : e)));
      }
    } catch {
      setError('Failed to convert entry');
    } finally {
      setConverting(null);
    }
  }, []);

  const handleDismiss = useCallback(async (entryId: string) => {
    try {
      await fetch(`/api/journal/${entryId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismiss: true }),
      });
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch {
      setError('Failed to dismiss entry');
    }
  }, []);

  if (loading) return null;
  if (error) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>{error}</div>
    );
  }
  if (entries.length === 0) return null;

  const pendingEntries = entries.filter(e => e.status === 'pending');
  if (pendingEntries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1px solid rgba(251, 191, 36, 0.15)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(251, 191, 36, 0.03)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(251, 191, 36, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <BookOpen size={16} style={{ color: '#fbbf24' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Decision Journal
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '1px',
            }}
          >
            {pendingEntries.length} captured decision{pendingEntries.length !== 1 ? 's' : ''}{' '}
            awaiting review
          </span>
        </div>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <AnimatePresence>
          {pendingEntries.map(entry => {
            const Icon = SOURCE_ICONS[entry.source] || BookOpen;
            const sourceLabel = SOURCE_LABELS[entry.source] || entry.source;
            const isConverting = converting === entry.id;
            const isProcessed = entry.status === 'processed';

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Icon
                    size={14}
                    style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {entry.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        via {sourceLabel}
                      </span>
                    </div>

                    {entry.extractedDecisions.length > 0 && (
                      <div
                        style={{
                          marginTop: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {entry.extractedDecisions.slice(0, 3).map((decision, i) => (
                          <div
                            key={i}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span
                              style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}
                            >
                              {decision.length > 80 ? decision.slice(0, 80) + '...' : decision}
                            </span>
                            {!isProcessed && (
                              <button
                                onClick={() => handleConvert(entry.id, decision)}
                                disabled={isConverting}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  border: '1px solid rgba(34, 197, 94, 0.2)',
                                  borderRadius: '4px',
                                  color: '#22c55e',
                                  cursor: isConverting ? 'wait' : 'pointer',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                {isConverting ? (
                                  <Loader2 size={8} className="animate-spin" />
                                ) : (
                                  <ArrowRight size={8} />
                                )}
                                Audit
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isProcessed && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                        }}
                      >
                        <CheckCircle size={10} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '10px', color: '#22c55e' }}>
                          Converted to decision audit
                        </span>
                      </div>
                    )}
                  </div>

                  {!isProcessed && entry.extractedDecisions.length === 0 && (
                    <button
                      onClick={() => handleDismiss(entry.id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
