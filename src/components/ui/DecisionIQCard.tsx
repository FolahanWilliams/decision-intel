'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useDecisionIQ } from '@/hooks/useDecisionIQ';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const GRADE_COLORS: Record<string, string> = {
  A: '#34d399',
  B: '#38bdf8',
  C: '#fbbf24',
  D: '#fb923c',
  F: '#f87171',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  outcomeTrackingRate: 'Outcome Tracking',
  biasAccuracy: 'Bias Accuracy',
  qualityTrend: 'Quality Trend',
  nudgeResponsiveness: 'Nudge Response',
  dissentHealth: 'Dissent Health',
  priorSubmissionRate: 'Prior Capture',
};

export function DecisionIQCard() {
  const { diq, isLoading } = useDecisionIQ();
  const [showTooltip, setShowTooltip] = useState(false);

  if (isLoading || !diq) {
    return (
      <div className="stat-card liquid-glass-premium" style={{ position: 'relative' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div
            className="stat-card-icon"
            style={{
              background: 'var(--bg-card-hover)',
              color: 'var(--text-secondary)',
              marginBottom: 0,
            }}
          >
            <Brain size={18} />
          </div>
        </div>
        <div
          className="stat-card-value"
          style={{ color: 'var(--text-muted)', fontSize: '1.75rem' }}
        >
          &mdash;
        </div>
        <div className="stat-card-label">Decision IQ</div>
      </div>
    );
  }

  const gradeColor = GRADE_COLORS[diq.grade] || '#A1A1AA';
  const hasTrend = diq.trend.length >= 2;
  const hasPeerBenchmark = diq.peerBenchmark != null;

  return (
    <div
      className="stat-card liquid-glass-premium"
      style={{ position: 'relative', cursor: diq.breakdown ? 'pointer' : 'default' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Top row: icon + grade badge + sparkline */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-sm">
          <div
            className="stat-card-icon"
            style={{
              background: 'var(--bg-card-hover)',
              color: 'var(--text-secondary)',
              marginBottom: 0,
            }}
          >
            <Brain size={18} />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              padding: '2px 8px',
              borderRadius: '6px',
              background: `${gradeColor}20`,
              color: gradeColor,
              border: `1px solid ${gradeColor}40`,
            }}
          >
            {diq.grade}
          </span>
        </div>
        {hasTrend && <SparklineChart data={diq.trend} color={gradeColor} width={64} height={24} />}
      </div>

      {/* Score */}
      <div className="stat-card-value" style={{ color: 'var(--text-highlight)' }}>
        <AnimatedNumber value={diq.score} duration={900} />
      </div>

      {/* Label + peer comparison */}
      <div className="stat-card-label">
        Decision IQ
        {hasPeerBenchmark && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            Peers: {diq.peerBenchmark}
          </span>
        )}
      </div>

      {/* Hover tooltip with breakdown */}
      {showTooltip && diq.breakdown && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            background: 'rgba(15, 15, 20, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              letterSpacing: '0.03em',
            }}
          >
            IQ Breakdown
          </div>
          {Object.entries(diq.breakdown).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between"
              style={{ marginBottom: '4px' }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {BREAKDOWN_LABELS[key] || key}
              </span>
              <div className="flex items-center gap-xs">
                <div
                  style={{
                    width: '48px',
                    height: '4px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, value)}%`,
                      height: '100%',
                      background: gradeColor,
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    minWidth: '24px',
                    textAlign: 'right',
                  }}
                >
                  {Math.round(value)}
                </span>
              </div>
            </div>
          ))}

          {diq.accuracyImprovement && diq.accuracyImprovement.improvementPct !== 0 && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--bg-elevated)',
                fontSize: '10px',
                color: diq.accuracyImprovement.improvementPct > 0 ? '#34d399' : '#f87171',
              }}
            >
              Accuracy {diq.accuracyImprovement.improvementPct > 0 ? '+' : ''}
              {diq.accuracyImprovement.improvementPct.toFixed(1)}% since early outcomes
            </div>
          )}

          {/* Arrow pointer */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'rgba(15, 15, 20, 0.95)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
            }}
          />
        </div>
      )}
    </div>
  );
}
