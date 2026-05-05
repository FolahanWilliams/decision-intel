/**
 * LifecycleTimeline — horizontal viz of decision lifecycle.
 *
 * Stages:
 *   1. Audited       (always done — analysis exists)
 *   2. Decided       (human-decision logged via cognitive-audits flow)
 *   3. Outcome logged (DecisionOutcome row exists)
 *   4. Calibration applied (recalibratedDqi populated)
 *
 * Visual: 4 stages connected by a line, each rendered as a node. Active
 * stage = severity-low (green); past stages = filled grey-700; future
 * stages = empty grey-300. Below each node: stage label + sub-label.
 *
 * The viz is the wow-moment for "compounds quarter over quarter" — the
 * buyer sees the loop visually, not just hears the claim.
 */

import { CheckCircle, Circle, Clock } from 'lucide-react';

export type LifecycleStage = 'audited' | 'decided' | 'outcome' | 'calibrated';

export interface LifecycleTimelineProps {
  current: LifecycleStage;
  /** Date strings for sub-labels (ISO or pre-formatted). */
  auditedAt?: string | null;
  decidedAt?: string | null;
  outcomeAt?: string | null;
  calibratedAt?: string | null;
  /** Optional outcome-due hint when current=decided and outcomeDueAt is set. */
  outcomeDueAt?: string | null;
}

const STAGES: Array<{ key: LifecycleStage; label: string; sub: string }> = [
  { key: 'audited', label: 'Audited', sub: 'analysis complete' },
  { key: 'decided', label: 'Decided', sub: 'committee reviewed' },
  { key: 'outcome', label: 'Outcome logged', sub: 'reality compared' },
  { key: 'calibrated', label: 'Calibrated', sub: 'platform learned' },
];

export function LifecycleTimeline({
  current,
  auditedAt,
  decidedAt,
  outcomeAt,
  calibratedAt,
  outcomeDueAt,
}: LifecycleTimelineProps) {
  const currentIdx = STAGES.findIndex(s => s.key === current);

  const subLabels: Record<LifecycleStage, string | undefined | null> = {
    audited: formatShort(auditedAt),
    decided: formatShort(decidedAt),
    outcome: formatShort(outcomeAt),
    calibrated: formatShort(calibratedAt),
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 18 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Decision lifecycle
        </span>
        {outcomeDueAt && current === 'decided' && (
          <span
            style={{
              marginLeft: 12,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--severity-medium)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Clock size={12} /> outcome due {formatShort(outcomeDueAt)}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        {/* Connecting line under nodes */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            height: 2,
            background: 'var(--border-color)',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - ${(currentIdx / (STAGES.length - 1)) * 28}px)`,
            height: 2,
            background: 'var(--severity-low)',
            zIndex: 1,
            transition: 'width 0.3s ease',
          }}
        />

        {STAGES.map((stage, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          const nodeColor = isCurrent
            ? 'var(--severity-low)'
            : isPast
              ? 'var(--text-secondary)'
              : 'var(--border-color)';
          const labelColor = isFuture ? 'var(--text-muted)' : 'var(--text-primary)';

          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: 'var(--bg-card)',
                  border: `2px solid ${nodeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: nodeColor,
                  marginBottom: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                {isPast || isCurrent ? <CheckCircle size={14} /> : <Circle size={10} />}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: labelColor,
                  textAlign: 'center',
                  marginBottom: 2,
                }}
              >
                {stage.label}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  letterSpacing: '0.02em',
                }}
              >
                {subLabels[stage.key] ?? stage.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatShort(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
