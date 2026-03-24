'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OutcomeGateInfo {
  pendingCount: number;
  pendingAnalysisIds: string[];
  message: string;
}

// ─── Outcome Gate Banner (soft gate) ────────────────────────────────────────

interface OutcomeGateBannerProps {
  pendingCount: number;
  pendingAnalysisIds: string[];
  onDismiss?: () => void;
}

/**
 * Dismissible banner shown when users have 3-4 pending outcomes (soft gate).
 * Encourages outcome reporting without blocking analysis.
 */
export function OutcomeGateBanner({
  pendingCount,
  pendingAnalysisIds,
  onDismiss,
}: OutcomeGateBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        padding: '12px 16px',
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <Clock size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {pendingCount} analyses awaiting outcomes.
        </span>{' '}
        Reporting outcomes improves your calibration accuracy and unlocks personalized bias
        detection.
        {pendingAnalysisIds.length > 0 && (
          <span style={{ marginLeft: '8px' }}>
            <Link
              href={`/documents/${pendingAnalysisIds[0]}`}
              style={{
                color: '#fbbf24',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Report now
            </Link>
          </span>
        )}
      </div>
      {onDismiss && (
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
            padding: '4px',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
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

/**
 * Blocking modal shown when users have 5+ pending outcomes (hard gate).
 * Users must report at least one outcome before they can run new analyses.
 */
export function OutcomeGateModal({ gateInfo, onClose, onOutcomeSubmitted }: OutcomeGateModalProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const handleQuickSubmit = useCallback(async () => {
    if (!selectedAnalysis || !outcome) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: selectedAnalysis,
          outcome,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onOutcomeSubmitted?.();
      }
    } catch {
      // Silent fail — user can navigate to the full page
    } finally {
      setSubmitting(false);
    }
  }, [selectedAnalysis, outcome, onOutcomeSubmitted]);

  const OUTCOME_OPTIONS = [
    { value: 'success', label: 'Success', color: '#22c55e', icon: CheckCircle },
    { value: 'partial_success', label: 'Partial', color: '#f59e0b', icon: Clock },
    { value: 'failure', label: 'Failed', color: '#ef4444', icon: AlertTriangle },
    { value: 'too_early', label: 'Too Early', color: '#a1a1aa', icon: Clock },
  ] as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '16px',
          background: 'var(--bg-secondary, #1a1a2e)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          overflow: 'hidden',
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
                  {gateInfo.pendingAnalysisIds.slice(0, 5).map((id, i) => (
                    <button
                      key={id}
                      onClick={() => setSelectedAnalysis(id)}
                      style={{
                        padding: '10px 14px',
                        background:
                          selectedAnalysis === id
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${selectedAnalysis === id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Analysis #{i + 1}
                      </span>
                      <Link
                        href={`/documents/${id}`}
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-muted)', fontSize: '11px' }}
                      >
                        View <ArrowRight size={10} style={{ display: 'inline' }} />
                      </Link>
                    </button>
                  ))}
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
                    <div
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
                              background: isSelected ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isSelected ? opt.color + '50' : 'rgba(255,255,255,0.08)'}`,
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
                        Submit & Unlock Analysis
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
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  For detailed reporting with bias verification and lessons learned,{' '}
                  <Link
                    href={`/documents/${gateInfo.pendingAnalysisIds[0] || ''}`}
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
    </div>
  );
}
