'use client';

import { TrendingUp, TrendingDown, Activity, Lock } from 'lucide-react';
import type { CalibrationInsight } from '@/types';

/**
 * Dual-score chip (M10 — visible flywheel).
 *
 * Renders either:
 *   1. The calibrated vs static score delta (when sampleSize >= 5), or
 *   2. A gamified unlock hint (when sampleSize < 5)
 *
 * Designed to sit directly under the primary overall-score display on the
 * document detail page. Compact, information-dense, and read-only — this
 * chip IS the moat made visible. A competitor running the same pipeline
 * without the calibration flywheel simply can't render this because they
 * don't have the outcome data to compute it.
 */
export function CalibrationChip({ calibration }: { calibration: CalibrationInsight }) {
  const isUnlocked = calibration.sampleSize >= calibration.unlockThreshold;

  if (!isUnlocked) {
    return <LockedCalibrationHint calibration={calibration} />;
  }

  const delta = calibration.calibrationDelta;
  const isRisker = delta < 0;
  const isNoticeable = Math.abs(delta) >= 1;
  const deltaColor = isNoticeable
    ? isRisker
      ? '#f87171' // red — calibration made this look riskier
      : '#4ade80' // green — calibration made this look safer
    : 'var(--text-muted)';

  const DeltaIcon = isRisker ? TrendingDown : TrendingUp;

  return (
    <div
      style={{
        marginTop: 6,
        padding: '8px 10px',
        background: 'rgba(59, 130, 246, 0.04)',
        border: '1px solid rgba(59, 130, 246, 0.18)',
        borderRadius: 6,
        maxWidth: 320,
      }}
    >
      <div className="flex items-center gap-xs" style={{ marginBottom: 3 }}>
        <Activity size={11} style={{ color: '#60a5fa' }} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#60a5fa',
          }}
        >
          Your Org Calibration
        </span>
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          {calibration.sampleSize} outcomes
        </span>
      </div>
      <div className="flex items-center gap-sm" style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Baseline {calibration.staticOverallScore}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {calibration.calibratedOverallScore}
        </div>
        {isNoticeable && (
          <div
            className="flex items-center gap-xs"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: deltaColor,
              marginLeft: 4,
            }}
          >
            <DeltaIcon size={10} />
            {delta > 0 ? '+' : ''}
            {delta}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}
      >
        {calibration.headline}
      </div>
    </div>
  );
}

function LockedCalibrationHint({ calibration }: { calibration: CalibrationInsight }) {
  const remaining = calibration.unlockThreshold - calibration.sampleSize;
  const progress = (calibration.sampleSize / calibration.unlockThreshold) * 100;

  return (
    <div
      style={{
        marginTop: 6,
        padding: '8px 10px',
        background: 'rgba(113, 113, 122, 0.06)',
        border: '1px dashed rgba(113, 113, 122, 0.3)',
        borderRadius: 6,
        maxWidth: 320,
      }}
    >
      <div className="flex items-center gap-xs" style={{ marginBottom: 4 }}>
        <Lock size={11} style={{ color: 'var(--text-muted)' }} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted)',
          }}
        >
          Calibrated Score Locked
        </span>
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          marginBottom: 6,
        }}
      >
        {calibration.headline}
      </div>
      <div
        style={{
          height: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#60a5fa',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          marginTop: 3,
          textAlign: 'right',
        }}
      >
        {calibration.sampleSize} / {calibration.unlockThreshold} outcomes — {remaining} to go
      </div>
    </div>
  );
}
