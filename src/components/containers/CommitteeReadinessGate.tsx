'use client';

/**
 * CommitteeReadinessGate — mode-aware readiness checklist for the
 * committee gate stage of any DecisionContainer. Replaces the deleted
 * IcReadinessGate with a kind-aware shell:
 *
 *   investment   → IC Review readiness
 *   acquisition  → Board / IC Review readiness
 *   strategic    → Decision Committee readiness
 *
 * Five gates. Gate 1 is ENFORCED server-side as of V5 (2026-05-16):
 * a container cannot move into the committee stage (or any
 * post-committee stage) until the required docs are attached — the
 * PATCH route rejects the transition via validateStageTransition.
 * Gates 2–5 remain advisory (surface the friction the committee will
 * see; they do not block):
 *   1. Required document types attached (per CONTAINER_MODES[kind]
 *      .requiredDocsForCommittee) — HARD GATE on stage entry
 *   2. All member docs analyzed
 *   3. Composite DQI ≥ 55 (D-band gate; same threshold as legacy)
 *   4. No critical M&A toxic combinations (named-pattern aggregation
 *      from container.aggregation.namedPatterns)
 *   5. Cross-doc cross-reference clean (no high-severity conflicts)
 */

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getContainerMode, type DecisionContainerKind } from '@/lib/data/decision-container-modes';
import type { ContainerDetail } from '@/types/containers';

interface CommitteeReadinessGateProps {
  container: ContainerDetail;
}

interface GateResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

function evaluateGates(container: ContainerDetail): GateResult[] {
  const mode = getContainerMode(container.kind as DecisionContainerKind);
  const required = new Set(mode.requiredDocsForCommittee);
  const docTypesPresent = new Set(
    container.documents.map(m => m.document.documentType).filter((d): d is string => d != null)
  );

  // Gate 1: required document types attached
  const missingDocs = Array.from(required).filter(t => !docTypesPresent.has(t));
  const gate1: GateResult = {
    id: 'required_docs',
    label: 'Required documents attached',
    passed: missingDocs.length === 0,
    detail:
      missingDocs.length === 0
        ? `All ${required.size} required types present`
        : `Missing: ${missingDocs.join(', ')}`,
  };

  // Gate 2: all member docs analyzed
  const unanalyzed = container.documentCount - container.analyzedDocCount;
  const gate2: GateResult = {
    id: 'all_analyzed',
    label: 'Every document analyzed',
    passed: container.documentCount > 0 && unanalyzed === 0,
    detail:
      container.documentCount === 0
        ? 'No documents in container yet'
        : unanalyzed === 0
          ? `${container.analyzedDocCount} of ${container.documentCount} analyzed`
          : `${unanalyzed} document${unanalyzed === 1 ? '' : 's'} pending audit`,
  };

  // Gate 3: composite DQI ≥ 55 (D-band)
  const gate3: GateResult = {
    id: 'composite_dqi',
    label: 'Composite DQI ≥ 55',
    passed: container.compositeDqi != null && container.compositeDqi >= 55,
    detail:
      container.compositeDqi == null
        ? 'No analyses yet — composite pending'
        : container.compositeDqi >= 55
          ? `Composite ${Math.round(container.compositeDqi)} (${container.compositeGrade ?? '—'})`
          : `Composite ${Math.round(container.compositeDqi)} below 55 — close gaps before committee`,
  };

  // Gate 4: no critical named patterns
  const criticalPatterns = container.aggregation.namedPatterns.filter(
    p => p.severity === 'critical'
  );
  const gate4: GateResult = {
    id: 'no_critical_patterns',
    label: 'No critical compound failure patterns',
    passed: criticalPatterns.length === 0,
    detail:
      criticalPatterns.length === 0
        ? 'No critical named patterns detected'
        : `${criticalPatterns.map(p => p.patternLabel).join(', ')} — review before committee`,
  };

  // Gate 5: no high-severity cross-doc conflicts
  const gate5: GateResult = {
    id: 'cross_ref_clean',
    label: 'Cross-doc cross-reference clean',
    passed: container.crossRefHighSeverityCount === 0,
    detail:
      container.crossRefConflictCount === 0
        ? 'No conflicts flagged'
        : container.crossRefHighSeverityCount === 0
          ? `${container.crossRefConflictCount} medium/low conflict${container.crossRefConflictCount === 1 ? '' : 's'}`
          : `${container.crossRefHighSeverityCount} high-severity conflict${container.crossRefHighSeverityCount === 1 ? '' : 's'} — resolve before committee`,
  };

  return [gate1, gate2, gate3, gate4, gate5];
}

function daysUntilCommittee(
  committeeDate: string | null
): { label: string; severity: 'critical' | 'high' | 'medium' | 'low' | null } | null {
  if (!committeeDate) return null;
  const d = new Date(committeeDate);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)} days past`, severity: 'critical' };
  if (days === 0) return { label: 'Today', severity: 'critical' };
  if (days <= 7) return { label: `T-${days} days`, severity: 'high' };
  if (days <= 30) return { label: `T-${days} days`, severity: 'medium' };
  return { label: `T-${days} days`, severity: null };
}

export function CommitteeReadinessGate({ container }: CommitteeReadinessGateProps) {
  const mode = getContainerMode(container.kind as DecisionContainerKind);
  const gates = evaluateGates(container);
  const passedCount = gates.filter(g => g.passed).length;
  const totalCount = gates.length;
  const aggregatePct = Math.round((passedCount / totalCount) * 100);
  const ready = passedCount === totalCount;
  const countdown = daysUntilCommittee(container.committeeDate);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--fs-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            {mode.committeeLabel} readiness
          </div>
          <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
            {passedCount}/{totalCount} gates passed{' '}
            <span
              style={{
                color: ready
                  ? 'var(--success)'
                  : passedCount >= 3
                    ? 'var(--warning)'
                    : 'var(--error)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              · {aggregatePct}%
            </span>
          </div>
        </div>
        {countdown && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background:
                countdown.severity === 'critical'
                  ? 'rgba(239, 68, 68, 0.10)'
                  : countdown.severity === 'high'
                    ? 'rgba(239, 68, 68, 0.06)'
                    : countdown.severity === 'medium'
                      ? 'rgba(245, 158, 11, 0.06)'
                      : 'var(--bg-secondary)',
              color:
                countdown.severity === 'critical'
                  ? 'var(--error)'
                  : countdown.severity === 'high'
                    ? 'var(--severity-high)'
                    : countdown.severity === 'medium'
                      ? 'var(--warning)'
                      : 'var(--text-secondary)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={12} />
            {countdown.label}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gates.map(g => (
          <div
            key={g.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: g.passed ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-secondary)',
              borderLeft: `3px solid ${g.passed ? 'var(--success)' : 'var(--warning)'}`,
            }}
          >
            {g.passed ? (
              <CheckCircle2
                size={14}
                style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}
              />
            ) : (
              <AlertCircle
                size={14}
                style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, marginBottom: 2 }}>
                {g.label}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                {g.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!ready && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
          }}
        >
          Required documents (gate 1) is a hard gate: the decision cannot enter the committee stage
          until they&apos;re attached. Gates 2&ndash;5 are advisory &mdash; they surface friction
          the committee will see; they don&apos;t block the decision.
        </div>
      )}
    </div>
  );
}
