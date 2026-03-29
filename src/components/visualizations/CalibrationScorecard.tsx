'use client';

import { useEffect, useState } from 'react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('CalibrationScorecard');

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalibrationLevel {
  name: string;
  minOutcomes: number;
  minAccuracy: number;
  color: string;
}

const LEVELS: CalibrationLevel[] = [
  { name: 'Bronze', minOutcomes: 0, minAccuracy: 0, color: '#CD7F32' },
  { name: 'Silver', minOutcomes: 5, minAccuracy: 50, color: '#C0C0C0' },
  { name: 'Gold', minOutcomes: 15, minAccuracy: 60, color: '#FFD700' },
  { name: 'Platinum', minOutcomes: 30, minAccuracy: 70, color: '#E5E4E2' },
];

function getCurrentLevel(outcomes: number, accuracy: number): CalibrationLevel {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (outcomes >= l.minOutcomes && accuracy >= l.minAccuracy) {
      level = l;
    }
  }
  return level;
}

function getNextLevel(current: CalibrationLevel): CalibrationLevel | null {
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface CalibrationScorecardProps {
  pendingCount: number;
  pendingAnalysisIds?: string[];
  gateLevel: 'none' | 'soft' | 'hard';
  onReportOutcome?: (analysisId: string) => void;
  orgId?: string;
  timeRange?: string;
}

export default function CalibrationScorecard({
  pendingCount,
  gateLevel,
  onReportOutcome,
  orgId,
  timeRange = 'all',
}: CalibrationScorecardProps) {
  const [stats, setStats] = useState<{
    decisionsTracked: number;
    accuracyRate: number;
    biasDetectionAccuracy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ timeRange: timeRange || 'all' });
    if (orgId) params.set('orgId', orgId);

    fetch(`/api/outcomes/dashboard?${params}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.kpis) {
          setStats({
            decisionsTracked: json.kpis.decisionsTracked,
            accuracyRate: json.kpis.accuracyRate,
            biasDetectionAccuracy: json.kpis.biasDetectionAccuracy,
          });
        }
      })
      .catch(err => log.warn('Failed to fetch calibration stats:', err))
      .finally(() => setLoading(false));
  }, [orgId, timeRange]);

  const outcomes = stats?.decisionsTracked ?? 0;
  const accuracy = stats?.accuracyRate ?? 0;
  const biasAccuracy = stats?.biasDetectionAccuracy ?? 0;
  const currentLevel = getCurrentLevel(outcomes, accuracy);
  const nextLevel = getNextLevel(currentLevel);

  // Progress toward next level
  let progressPct = 100;
  let outcomesNeeded = 0;
  let progressMessage = 'Maximum calibration level reached.';

  if (nextLevel) {
    const outcomesRemaining = Math.max(0, nextLevel.minOutcomes - outcomes);
    const accuracyMet = accuracy >= nextLevel.minAccuracy;
    outcomesNeeded = outcomesRemaining;
    progressPct = Math.min(100, Math.round((outcomes / nextLevel.minOutcomes) * 100));

    if (outcomesRemaining > 0 && accuracyMet) {
      progressMessage = `${outcomesRemaining} more outcome${outcomesRemaining !== 1 ? 's' : ''} to reach ${nextLevel.name}.`;
    } else if (outcomesRemaining > 0) {
      progressMessage = `${outcomesRemaining} more outcome${outcomesRemaining !== 1 ? 's' : ''} and ${nextLevel.minAccuracy}%+ accuracy to unlock ${nextLevel.name}.`;
    } else {
      progressMessage = `Reach ${nextLevel.minAccuracy}% accuracy to unlock ${nextLevel.name}.`;
    }
  }

  const isBlocking = gateLevel === 'hard';

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: 'var(--bg-secondary, #111)',
        border: `1px solid ${isBlocking ? 'var(--color-warning, #eab308)' : 'var(--border-primary, #222)'}`,
      }}
    >
      {/* Header with level badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
            Calibration Level
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)', marginTop: 2 }}>
            Each outcome makes your AI smarter
          </div>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: `${currentLevel.color}20`,
            border: `1px solid ${currentLevel.color}40`,
            color: currentLevel.color,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.5px',
          }}
        >
          {currentLevel.name}
        </div>
      </div>

      {/* Progress bar */}
      {nextLevel && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--bg-tertiary, #1a1a1a)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #b4b4bc)', marginTop: 6 }}>
            {progressMessage}
          </div>
        </div>
      )}

      {/* Stats grid */}
      {!loading && stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {outcomes}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
              outcomes reported
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success, #22c55e)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
              decision accuracy
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {biasAccuracy}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
              bias detection accuracy
            </div>
          </div>
        </div>
      )}

      {/* Pending CTA */}
      {pendingCount > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: isBlocking ? 'rgba(234, 179, 8, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${isBlocking ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-primary, #fff)', fontWeight: 500 }}>
            {isBlocking
              ? `Report ${pendingCount - 4} outcome${pendingCount - 4 !== 1 ? 's' : ''} to unlock new analyses`
              : `${pendingCount} decision${pendingCount !== 1 ? 's' : ''} awaiting outcomes`}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary, #b4b4bc)',
              marginTop: 4,
            }}
          >
            {outcomesNeeded > 0
              ? `Just ${Math.min(pendingCount, outcomesNeeded)} more to reach ${nextLevel?.name ?? 'next level'}.`
              : 'Keep reporting to maintain your calibration level.'}
          </div>
          {onReportOutcome && (
            <button
              onClick={() => onReportOutcome('')}
              style={{
                marginTop: 8,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: isBlocking
                  ? 'var(--color-warning, #eab308)'
                  : 'var(--color-accent, #3b82f6)',
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Report Outcomes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
