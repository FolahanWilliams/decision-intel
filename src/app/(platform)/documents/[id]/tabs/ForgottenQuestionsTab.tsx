'use client';

import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, AlertTriangle, Shield, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trackEvent } from '@/lib/analytics/track';
import type { ForgottenQuestionsResult } from '@/types';

interface ForgottenQuestionsTabProps {
  forgottenQuestions?: ForgottenQuestionsResult;
  analysisId?: string;
}

// Canonical light-theme severity tokens (opacity suffixes preserved via
// color-mix %). Severity→intent unchanged: low=muted · medium=warning ·
// high=severity-high · critical=error.
const SEVERITY_STYLES: Record<
  'low' | 'medium' | 'high' | 'critical',
  { borderColor: string; badgeColor: string; badgeBg: string; label: string }
> = {
  low: {
    borderColor: 'color-mix(in srgb, var(--text-muted) 50%, transparent)',
    badgeColor: 'var(--text-muted)',
    badgeBg: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
    label: 'Low',
  },
  medium: {
    borderColor: 'color-mix(in srgb, var(--warning) 50%, transparent)',
    badgeColor: 'var(--warning)',
    badgeBg: 'color-mix(in srgb, var(--warning) 10%, transparent)',
    label: 'Medium',
  },
  high: {
    borderColor: 'color-mix(in srgb, var(--severity-high) 60%, transparent)',
    badgeColor: 'var(--severity-high)',
    badgeBg: 'color-mix(in srgb, var(--severity-high) 10%, transparent)',
    label: 'High',
  },
  critical: {
    borderColor: 'color-mix(in srgb, var(--error) 70%, transparent)',
    badgeColor: 'var(--error)',
    badgeBg: 'color-mix(in srgb, var(--error) 10%, transparent)',
    label: 'Critical',
  },
};

export function ForgottenQuestionsTab({
  forgottenQuestions,
  analysisId,
}: ForgottenQuestionsTabProps) {
  const [addressed, setAddressed] = useState<Set<number>>(new Set());

  const questions = useMemo(() => forgottenQuestions?.questions ?? [], [forgottenQuestions]);

  useEffect(() => {
    if (questions.length > 0 && analysisId) {
      trackEvent('forgotten_questions_viewed', {
        analysisId,
        questionCount: questions.length,
      });
    }
  }, [questions.length, analysisId]);

  if (!forgottenQuestions || questions.length === 0) {
    return (
      <ErrorBoundary sectionName="Forgotten Questions">
        <div className="card">
          <div className="card-body">
            <div className="text-center p-8 text-muted">
              No forgotten questions surfaced for this memo. Either this memo is unusually thorough
              relative to its reference class, or we did not find close enough historical analogs to
              compare against.
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const toggleAddressed = (i: number, question: string) => {
    setAddressed(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
        trackEvent('forgotten_question_addressed', {
          analysisId,
          index: i,
          question: question.slice(0, 120),
        });
      }
      return next;
    });
  };

  return (
    <ErrorBoundary sectionName="Forgotten Questions">
      <div className="flex flex-col gap-lg">
        <div className="card border-l-4 border-l-blue-500">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <HelpCircle size={22} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Questions this memo never asks
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Drawn from the gap between this memo and its closest historical analogs. Every
                  question below was answered &mdash; or fatally ignored &mdash; in a comparable
                  real decision. These are the unknown unknowns by construction.
                </p>
                {forgottenQuestions.headline && (
                  <p className="mt-3 text-sm text-foreground/90 italic leading-relaxed">
                    &ldquo;{forgottenQuestions.headline}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {forgottenQuestions.analogsUsed && forgottenQuestions.analogsUsed.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-2">
                <BookOpen size={12} />
                Reference analogs
              </h4>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {forgottenQuestions.analogsUsed.map((analog, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-1 bg-blue-500/5 text-blue-400 border border-blue-500/20"
                  >
                    {analog}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-md">
          {questions.map((q, i) => {
            const severity = (q.severity ?? 'medium') as 'low' | 'medium' | 'high' | 'critical';
            const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium;
            const isAddressed = addressed.has(i);

            return (
              <div
                key={i}
                className={`card border-l-4 ${isAddressed ? 'opacity-60' : ''}`}
                style={{ borderLeftColor: styles.borderColor }}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        style={{
                          color:
                            severity === 'critical' || severity === 'high'
                              ? 'var(--error)'
                              : severity === 'medium'
                                ? 'var(--warning)'
                                : 'var(--text-muted)',
                        }}
                      />
                      <span
                        className="text-[10px] px-1.5 py-0.5 font-medium uppercase tracking-wide"
                        style={{ color: styles.badgeColor, background: styles.badgeBg }}
                      >
                        {styles.label}
                      </span>
                      {q.biasGuarded && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 border flex items-center gap-1"
                          style={{
                            color: 'var(--accent-secondary)',
                            background:
                              'color-mix(in srgb, var(--accent-secondary) 10%, transparent)',
                            borderColor:
                              'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
                          }}
                        >
                          <Shield size={10} />
                          {q.biasGuarded}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleAddressed(i, q.question)}
                      className={`text-[11px] px-2 py-1 border transition-colors ${
                        isAddressed
                          ? ''
                          : 'border-border text-muted hover:text-foreground hover:border-foreground/30'
                      }`}
                      style={
                        isAddressed
                          ? {
                              background:
                                'color-mix(in srgb, var(--success) 10%, transparent)',
                              color: 'var(--success)',
                              borderColor:
                                'color-mix(in srgb, var(--success) 30%, transparent)',
                            }
                          : undefined
                      }
                      aria-pressed={isAddressed}
                    >
                      {isAddressed ? 'Addressed' : 'Mark addressed'}
                    </button>
                  </div>

                  <p
                    className={`text-sm font-semibold text-foreground mb-2 leading-snug ${
                      isAddressed ? 'line-through' : ''
                    }`}
                  >
                    {q.question}
                  </p>

                  <p className="text-xs text-muted leading-relaxed">{q.whyItMatters}</p>

                  {q.analogCompany && (
                    <p className="mt-2 text-[11px] text-muted">
                      <span className="font-medium text-foreground/70">Analog:</span>{' '}
                      {q.analogCompany}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ErrorBoundary>
  );
}
