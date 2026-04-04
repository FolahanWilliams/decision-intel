'use client';

import { formatBiasName } from '@/lib/utils/labels';

interface Scenario {
  biasRemoved: string;
  historicalSampleSize: number;
  successRateWithBias: number;
  successRateWithoutBias: number;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

interface CounterfactualData {
  scenarios: Scenario[];
  aggregateImprovement: number;
  weightedImprovement: number;
}

export function CounterfactualScenarios({
  counterfactuals,
}: {
  counterfactuals: CounterfactualData;
}) {
  if (counterfactuals.scenarios.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Not enough historical data to compute counterfactual scenarios.
      </p>
    );
  }

  // Sort by expected improvement descending
  const sorted = [...counterfactuals.scenarios].sort(
    (a, b) => b.expectedImprovement - a.expectedImprovement
  );

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {sorted.map((scenario, idx) => (
          <div
            key={idx}
            style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--liquid-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Remove {formatBiasName(scenario.biasRemoved)}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                n={scenario.historicalSampleSize}
              </span>
            </div>

            {/* Improvement indicator */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: scenario.expectedImprovement > 0 ? '#22c55e' : 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              +{(scenario.expectedImprovement * 100).toFixed(1)}%
            </div>

            {/* Success rate comparison */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  With bias
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ef4444',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {(scenario.successRateWithBias * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>&rarr;</div>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Without bias
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#22c55e',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {(scenario.successRateWithoutBias * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  flex: 1,
                  height: '3px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '2px',
                }}
              >
                <div
                  style={{
                    width: `${scenario.confidence * 100}%`,
                    height: '100%',
                    background:
                      scenario.confidence > 0.7
                        ? '#22c55e'
                        : scenario.confidence > 0.4
                          ? '#eab308'
                          : '#ef4444',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {(scenario.confidence * 100).toFixed(0)}% conf
              </span>
            </div>

            {/* Monetary impact */}
            {scenario.estimatedMonetaryImpact != null && scenario.estimatedMonetaryImpact > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#22c55e',
                  fontWeight: 500,
                }}
              >
                Est. impact: {scenario.currency === 'USD' ? '$' : scenario.currency}
                {scenario.estimatedMonetaryImpact.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Aggregate */}
      {counterfactuals.aggregateImprovement > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            If all biases removed (confidence-weighted)
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#22c55e',
            }}
          >
            +{(counterfactuals.weightedImprovement * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

