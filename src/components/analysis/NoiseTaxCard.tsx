'use client';

import { useState } from 'react';
import { DollarSign, Info } from 'lucide-react';

interface NoiseTaxCardProps {
  overallScore: number;
  noiseScore: number;
  biasCount: number;
}

export function NoiseTaxCard({ overallScore, noiseScore, biasCount }: NoiseTaxCardProps) {
  const [decisionValue, setDecisionValue] = useState(1_000_000);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Noise tax calculation based on Kahneman's Noise research
  // noiseScore is 0-100 where higher = noisier
  const noiseTaxRate = (noiseScore / 100) * 0.15;
  const biasAmplifier = 1 + biasCount * 0.02;
  const improvementRoom = (100 - overallScore) / 100;
  const projectedSavings = Math.round(
    decisionValue * noiseTaxRate * biasAmplifier * improvementRoom
  );

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const presetValues = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

  return (
    <div
      className="card animate-fade-in"
      style={{
        border: '1px solid rgba(99, 102, 241, 0.15)',
        background: 'rgba(99, 102, 241, 0.03)',
      }}
    >
      <div
        className="card-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <h4
          style={{
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            margin: 0,
          }}
        >
          <DollarSign size={14} style={{ color: '#6366f1' }} />
          Noise Tax Estimate
        </h4>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 2,
          }}
          aria-label="Toggle methodology breakdown"
        >
          <Info size={13} />
        </button>
      </div>
      <div className="card-body" style={{ padding: '12px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: projectedSavings > 0 ? '#6366f1' : '#34d399',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {formatCurrency(projectedSavings)}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            projected recoverable noise tax
          </p>
        </div>

        {/* Decision value selector */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            Avg. decision value
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {presetValues.map(v => (
              <button
                key={v}
                onClick={() => setDecisionValue(v)}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  borderRadius: 4,
                  border: `1px solid ${decisionValue === v ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  background: decisionValue === v ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: decisionValue === v ? '#6366f1' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: decisionValue === v ? 600 : 400,
                }}
              >
                {formatCurrency(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        {showBreakdown && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 10,
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Noise tax rate</span>
              <span>{(noiseTaxRate * 100).toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bias amplifier ({biasCount} biases)</span>
              <span>{biasAmplifier.toFixed(2)}x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Improvement potential</span>
              <span>{(improvementRoom * 100).toFixed(0)}%</span>
            </div>
            <p style={{ fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
              Based on Kahneman, Sibony &amp; Sunstein&apos;s &quot;Noise&quot; research showing
              decision noise costs organizations 15%+ in preventable errors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
