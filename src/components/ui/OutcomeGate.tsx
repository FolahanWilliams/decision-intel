'use client';

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSWRConfig } from 'swr';

const CalibrationScorecard = lazy(() => import('@/components/visualizations/CalibrationScorecard'));

// ─── Types ──────────────────────────────────────────────────────────────────

interface PendingAnalysisRefForGate {
  id: string;
  documentId: string;
  filename: string;
  decisionStatement: string | null;
  createdAt: string;
}

interface OutcomeGateInfo {
  pendingCount: number;
  pendingAnalysisIds: string[];
  /** D11 Phase 3 deep (2026-04-27): rich pending-analysis metadata for
   *  filename + decisionStatement + /documents/[id] deep-links. Optional —
   *  modal falls back to "Analysis #N" placeholders when undefined. */
  pendingAnalyses?: PendingAnalysisRefForGate[];
  message: string;
}

// ─── Outcome Gate Banner (soft gate) ────────────────────────────────────────

interface OutcomeGateBannerProps {
  pendingCount: number;
  pendingAnalysisIds: string[];
  onDismiss?: () => void;
  /**
   * Visual severity. `'soft'` (default) = gentle reminder for 3-4 pending;
   * `'hard'` = stronger amber/red treatment for 5+ pending. Both are
   * non-blocking and dismissible.
   */
  level?: 'soft' | 'hard';
}

/**
 * Dismissible banner shown when users have pending outcomes awaiting reports.
 * Encourages outcome reporting without ever blocking analysis. The `level`
 * prop controls visual severity for soft vs. hard reminder tiers.
 */
export function OutcomeGateBanner({
  pendingCount,
  pendingAnalysisIds,
  onDismiss,
  level = 'soft',
}: OutcomeGateBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isHard = level === 'hard';

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: isHard ? '1px solid rgba(239, 68, 68, 0.35)' : undefined,
        boxShadow: isHard ? '0 0 0 1px rgba(239, 68, 68, 0.15)' : undefined,
      }}
    >
      <Suspense
        fallback={
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 12 }}>
            <Clock size={16} style={{ color: isHard ? '#ef4444' : '#fbbf24' }} />
          </div>
        }
      >
        <CalibrationScorecard
          pendingCount={pendingCount}
          pendingAnalysisIds={pendingAnalysisIds}
          gateLevel={level}
          onReportOutcome={() => {
            window.location.href = '/dashboard?view=browse&status=complete';
          }}
        />
      </Suspense>
      {onDismiss && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px' }}>
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 12,
              padding: '4px 8px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Outcome Gate Modal (hard gate) ─────────────────────────────────────────

interface OutcomeGateModalProps {
  gateInfo: OutcomeGateInfo;
  onClose: () => void;
  onOutcomeSubmitted?: () => void;
}

interface DraftOutcomeForGate {
  id: string;
  analysisId: string;
  outcome: string;
  source: string;
  confidence: number;
  evidence: string[];
  /** Filename of the audited document — surfaced as the analysis row title
   *  when /api/analyze/stream's pendingAnalyses isn't populated (legacy). */
  analysisTitle?: string;
  /** DecisionFrame.decisionStatement when the document had a frame at
   *  ingest. Italicised subtitle on the analysis row. */
  decisionStatement?: string | null;
}

function formatDraftSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Outcome Gate hard-block modal. Surfaces when the user has hit the hard
 * threshold (5+ pending outcomes past 30 days old) AND their org has
 * `Organization.enforceOutcomeGate=true` (typically design-partner orgs).
 *
 * Re-activated 2026-04-26 alongside the API-level enforcement (Phase 1
 * shipped same day) — `/api/analyze/stream` returns HTTP 409 with code
 * `OUTCOME_GATE_BLOCKED`, useAnalysisStream catches it and surfaces the
 * gate state, dashboard renders this modal as a blocking surface until
 * the user logs an outcome.
 *
 * Phase 3 wiring (locked 2026-04-27): on mount the modal fetches
 * /api/outcomes/draft and pre-fills the outcome value when the selected
 * analysis has an auto-detected draft. The submit button switches between
 * "Confirm draft outcome" (PATCH /api/outcomes/draft action='confirm' —
 * one API call, server handles outcome creation + recalibration) and the
 * legacy "Submit & Unlock Analysis" (POST /api/outcomes) when the user
 * overrides the auto-detected value. Override path also dismisses the
 * stale draft fire-and-forget so it doesn't keep nagging.
 */
export function OutcomeGateModal({ gateInfo, onClose, onOutcomeSubmitted }: OutcomeGateModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useFocusTrap(panelRef, true);

  // Escape key as fallback close mechanism
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftOutcomeForGate[]>([]);

  // SWR mutate is global — used here to invalidate /api/outcomes/draft
  // after a confirm/dismiss so the DraftOutcomeBanner on the dashboard
  // refreshes immediately rather than waiting for its refresh interval.
  const { mutate: globalSwrMutate } = useSWRConfig();

  // The 4 outcome values OutcomeGateModal can submit. Drafts may carry
  // values outside this set (e.g. 'inconclusive' from outcome-inference);
  // if so we surface a hint so the user knows the draft exists but needs
  // a manual choice — never silently mismatch.
  const VALID_OUTCOME_VALUES = useMemo(
    () => new Set(['success', 'partial_success', 'failure', 'too_early']),
    []
  );

  // Phase 3: fetch auto-detected drafts so we can pre-fill the outcome
  // value when the user picks an analysis. Single fetch on mount; no deps.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/outcomes/draft')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        const list = (data.drafts ?? []) as DraftOutcomeForGate[];
        // Only keep drafts whose analysis is in the pending list — the gate
        // is about resolving THESE analyses, no point pre-filling for others.
        const pendingIds = new Set(gateInfo.pendingAnalysisIds);
        setDrafts(list.filter(d => pendingIds.has(d.analysisId)));
      })
      .catch(() => {
        /* drafts are a convenience; manual fallback still works */
      });
    return () => {
      cancelled = true;
    };
  }, [gateInfo.pendingAnalysisIds]);

  const draftsByAnalysisId = useMemo(() => {
    const map = new Map<string, DraftOutcomeForGate>();
    for (const d of drafts) map.set(d.analysisId, d);
    return map;
  }, [drafts]);

  const matchingDraft = selectedAnalysis ? draftsByAnalysisId.get(selectedAnalysis) ?? null : null;
  // Validation: only pre-fill when the draft's outcome is one of the 4 button
  // values. Outcome-inference can emit 'inconclusive' or other states the
  // modal doesn't render — surface those as a hint instead of silently
  // mismatching (caught in the 2026-04-27 category-grade depth audit).
  const draftOutcomeIsValid = !!matchingDraft && VALID_OUTCOME_VALUES.has(matchingDraft.outcome);
  // Confirm-path engages when the user picks an analysis WITH a draft, the
  // draft's outcome is in the valid set, and they haven't overridden the
  // auto-detected value. Any other state routes to manual /api/outcomes POST.
  const onConfirmPath =
    !!matchingDraft && draftOutcomeIsValid && outcome === matchingDraft.outcome;

  // When the user picks an analysis that has a matching draft with a VALID
  // outcome, pre-fill. If the draft has an invalid outcome (e.g.
  // 'inconclusive'), don't pre-fill — the user picks manually and we surface
  // a hint above the buttons. Re-runs whenever selectedAnalysis changes.
  useEffect(() => {
    if (selectedAnalysis && matchingDraft && draftOutcomeIsValid) {
      setOutcome(matchingDraft.outcome);
    } else {
      setOutcome('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnalysis]);

  const handleQuickSubmit = useCallback(async () => {
    if (!selectedAnalysis || !outcome) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let ok = false;
      if (onConfirmPath && matchingDraft) {
        // Confirm-path: server creates the DecisionOutcome, marks the
        // analysis status, and triggers recalibration in one transaction.
        const res = await fetch('/api/outcomes/draft', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftId: matchingDraft.id, action: 'confirm' }),
        });
        ok = res.ok;
      } else {
        // Override path: manual POST. If a draft existed for this analysis
        // but the user changed the outcome, dismiss the stale draft so it
        // stops appearing in the DraftOutcomeBanner.
        const res = await fetch('/api/outcomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId: selectedAnalysis,
            outcome,
          }),
        });
        ok = res.ok;
        if (ok && matchingDraft) {
          // Fire-and-forget; never block the success path on draft cleanup.
          fetch('/api/outcomes/draft', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftId: matchingDraft.id, action: 'dismiss' }),
          }).catch(() => {
            /* draft dismissal failure is non-critical */
          });
        }
      }
      if (ok) {
        setSubmitted(true);
        onOutcomeSubmitted?.();
        // Optimistic SWR refresh: any DraftOutcomeBanner / Draft consumer
        // using SWR keyed off /api/outcomes/draft picks up the change
        // immediately rather than waiting for the next refresh interval.
        // Same applies to /api/decision-dna which derives from outcomes.
        globalSwrMutate('/api/outcomes/draft');
        globalSwrMutate('/api/decision-dna');
        // Also refresh outcomes listing for any other consumer.
        globalSwrMutate('/api/outcomes');
      } else {
        setSubmitError('Failed to submit outcome. Please try again.');
      }
    } catch {
      setSubmitError('Failed to submit outcome. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedAnalysis, outcome, onConfirmPath, matchingDraft, onOutcomeSubmitted, globalSwrMutate]);

  const OUTCOME_OPTIONS = [
    { value: 'success', label: 'Success', color: '#22c55e', icon: CheckCircle },
    { value: 'partial_success', label: 'Partial', color: '#f59e0b', icon: Clock },
    { value: 'failure', label: 'Failed', color: '#ef4444', icon: AlertTriangle },
    { value: 'too_early', label: 'Too Early', color: '#a1a1aa', icon: Clock },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Outcome reporting required"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
      }}
    >
      {/* Overlay backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-secondary, #1a1a2e)',
          borderLeft: '1px solid rgba(239, 68, 68, 0.2)',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'rgba(239, 68, 68, 0.06)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Outcome Reporting Required
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              {gateInfo.pendingCount} analyses need outcome reports before new analyses
            </p>
          </div>
        </div>

        {/* Calibration Progress */}
        <div style={{ padding: '16px 24px 0' }}>
          <Suspense fallback={null}>
            <CalibrationScorecard
              pendingCount={gateInfo.pendingCount}
              pendingAnalysisIds={gateInfo.pendingAnalysisIds}
              gateLevel="hard"
              onReportOutcome={() => {
                // Scroll to analysis selection below
              }}
            />
          </Suspense>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              <CheckCircle size={40} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px',
                }}
              >
                Outcome reported!
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Your calibration data has been updated. You can now run new analyses.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue to Analysis
              </button>
            </motion.div>
          ) : (
            <>
              {submitError && (
                <div
                  role="alert"
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '12px',
                    color: '#f87171',
                  }}
                >
                  {submitError}
                </div>
              )}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  margin: '0 0 16px',
                  lineHeight: 1.6,
                }}
              >
                Every outcome you report makes future analyses more accurate for your organization.
                Report at least one outcome to unlock new analyses.
              </p>

              {/* Quick outcome report */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Select an analysis to report
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {gateInfo.pendingAnalysisIds.slice(0, 5).map((id, i) => {
                    const draft = draftsByAnalysisId.get(id);
                    // Rich pending-analysis metadata when /api/analyze/stream
                    // returns it. Falls back to "Analysis #N" + the draft's
                    // own analysisTitle when available, else generic label.
                    const richInfo = gateInfo.pendingAnalyses?.find(p => p.id === id);
                    const displayName = richInfo?.filename ?? draft?.analysisTitle ?? `Analysis #${i + 1}`;
                    const subtitle = richInfo?.decisionStatement ?? draft?.decisionStatement ?? null;
                    const documentId = richInfo?.documentId;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedAnalysis(id)}
                        style={{
                          padding: '10px 14px',
                          background:
                            selectedAnalysis === id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                          border: `1px solid ${selectedAnalysis === id ? 'var(--border-hover)' : 'var(--bg-card-hover)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minWidth: 0,
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                            }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                              }}
                              title={displayName}
                            >
                              {displayName}
                            </span>
                            {draft && (
                              <span
                                title={`Auto-detected from ${formatDraftSource(draft.source)} · ${(draft.confidence * 100).toFixed(0)}% confidence`}
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 999,
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  color: '#a5b4fc',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  flexShrink: 0,
                                }}
                              >
                                <Lightbulb size={9} />
                                Draft ready
                              </span>
                            )}
                          </span>
                          {subtitle && (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={subtitle}
                            >
                              &ldquo;{subtitle}&rdquo;
                            </span>
                          )}
                        </span>
                        {documentId ? (
                          <Link
                            href={`/documents/${documentId}`}
                            onClick={e => e.stopPropagation()}
                            target="_blank"
                            rel="noopener"
                            title="Open the full audit in a new tab"
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            View <ExternalLink size={10} />
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard?view=browse&status=complete"
                            onClick={e => e.stopPropagation()}
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            View <ArrowRight size={10} style={{ display: 'inline' }} />
                          </Link>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outcome selection */}
              <AnimatePresence>
                {selectedAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      What was the outcome?
                    </label>
                    {matchingDraft && (
                      <div
                        role="status"
                        style={{
                          marginBottom: 10,
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: draftOutcomeIsValid
                            ? 'rgba(99, 102, 241, 0.08)'
                            : 'rgba(245, 158, 11, 0.08)',
                          border: `1px solid ${draftOutcomeIsValid ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.25)'}`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <Lightbulb
                          size={13}
                          style={{
                            color: draftOutcomeIsValid ? '#a5b4fc' : '#fbbf24',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            Auto-detected from {formatDraftSource(matchingDraft.source)}
                          </span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                            ({(matchingDraft.confidence * 100).toFixed(0)}% confidence)
                          </span>
                          {matchingDraft.evidence.length > 0 && (
                            <div
                              style={{
                                marginTop: 4,
                                fontStyle: 'italic',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={matchingDraft.evidence[0]}
                            >
                              &ldquo;{matchingDraft.evidence[0].slice(0, 90)}
                              {matchingDraft.evidence[0].length > 90 ? '…' : ''}&rdquo;
                            </div>
                          )}
                          <div
                            style={{
                              color: draftOutcomeIsValid ? 'var(--text-muted)' : '#fbbf24',
                              marginTop: 4,
                              fontSize: 10,
                            }}
                          >
                            {draftOutcomeIsValid
                              ? 'Pre-filled below — confirm to log, or change to override.'
                              : `Detected outcome was "${matchingDraft.outcome.replace(/_/g, ' ')}" which doesn't match the four categories below. Pick one manually; the draft will be dismissed when you submit.`}
                          </div>
                        </div>
                      </div>
                    )}
                    <div
                      className="outcome-gate-options-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        marginBottom: '16px',
                      }}
                    >
                      {OUTCOME_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = outcome === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setOutcome(opt.value)}
                            style={{
                              padding: '10px 8px',
                              background: isSelected ? `${opt.color}15` : 'var(--bg-card)',
                              border: `1px solid ${isSelected ? opt.color + '50' : 'var(--bg-elevated)'}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Icon
                              size={16}
                              style={{ color: isSelected ? opt.color : 'var(--text-muted)' }}
                            />
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? opt.color : 'var(--text-secondary)',
                              }}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {outcome && (
                      <button
                        onClick={handleQuickSubmit}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'var(--accent-primary)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: submitting ? 'wait' : 'pointer',
                          opacity: submitting ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        {submitting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        {onConfirmPath ? 'Confirm draft outcome' : 'Submit & Unlock Analysis'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Link to full reporting */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--bg-card-hover)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  For detailed reporting with bias verification and lessons learned,{' '}
                  <Link
                    href="/dashboard?view=browse&status=complete"
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    visit the analysis page
                  </Link>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
      <style>{`
        @media (max-width: 520px) {
          .outcome-gate-options-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
