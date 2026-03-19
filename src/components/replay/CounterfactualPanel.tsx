'use client';

import { useState, useMemo } from 'react';
import { Beaker, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { calculateCounterfactualScore, type ScoreOverrides, type ReplayStep } from '@/lib/replay/score-calculator';

interface CounterfactualPanelProps {
  analysis: AnalysisResult;
  step: ReplayStep;
  onClose: () => void;
}

export function CounterfactualPanel({ analysis, step, onClose }: CounterfactualPanelProps) {
  const [overrides, setOverrides] = useState<ScoreOverrides>({});

  const result = useMemo(
    () => calculateCounterfactualScore(analysis, overrides),
    [analysis, overrides]
  );

  const hasChanges = Object.values(overrides).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : typeof v === 'object' ? Object.keys(v).length > 0 : true)
  );

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        padding: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div className="flex items-center gap-sm">
          <Beaker size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>What-If Scenario</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          aria-label="Close counterfactual panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Bias removal — only for bias step */}
      {step.id === 'bias-detection' && analysis.biases.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Remove biases
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {analysis.biases.map((bias) => {
              const isRemoved = overrides.removeBiases?.includes(bias.biasType);
              return (
                <button
                  key={bias.biasType}
                  onClick={() => {
                    setOverrides((prev) => {
                      const current = prev.removeBiases || [];
                      return {
                        ...prev,
                        removeBiases: isRemoved
                          ? current.filter((b) => b !== bias.biasType)
                          : [...current, bias.biasType],
                      };
                    });
                  }}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: isRemoved ? '1px solid var(--success)' : '1px solid var(--border-color)',
                    background: isRemoved ? 'rgba(48, 209, 88, 0.1)' : 'transparent',
                    color: isRemoved ? 'var(--success)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textDecoration: isRemoved ? 'line-through' : 'none',
                  }}
                >
                  {bias.biasType}
                </button>
              );
            })}
            <button
              onClick={() => setOverrides((prev) => ({
                ...prev,
                removeBiases: analysis.biases.map((b) => b.biasType),
              }))}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                borderRadius: '12px',
                border: '1px solid var(--accent-primary)',
                background: 'rgba(99, 102, 241, 0.08)',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
              }}
            >
              Remove all
            </button>
          </div>
        </div>
      )}

      {/* Noise override — for noise step */}
      {step.id === 'noise-analysis' && (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Override noise score (current: {Math.round(analysis.noiseScore || 0)}%)
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, noiseScore: 0 }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: overrides.noiseScore === 0 ? '1px solid var(--success)' : '1px solid var(--border-color)',
                background: overrides.noiseScore === 0 ? 'rgba(48, 209, 88, 0.1)' : 'transparent',
                color: overrides.noiseScore === 0 ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Perfect (0%)
            </button>
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, noiseScore: (analysis.noiseScore || 30) * 2 }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Doubled
            </button>
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, noiseScore: undefined }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Fact check override */}
      {step.id === 'fact-check' && analysis.factCheck && (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Override fact-check score (current: {analysis.factCheck.score}/100)
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, factCheckScore: 100 }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: overrides.factCheckScore === 100 ? '1px solid var(--success)' : '1px solid var(--border-color)',
                background: overrides.factCheckScore === 100 ? 'rgba(48, 209, 88, 0.1)' : 'transparent',
                color: overrides.factCheckScore === 100 ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              All verified (100)
            </button>
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, factCheckScore: 0 }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              All contradicted (0)
            </button>
            <button
              onClick={() => setOverrides((prev) => ({ ...prev, factCheckScore: undefined }))}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Score projection */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          marginBottom: hasChanges ? 'var(--spacing-sm)' : 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ORIGINAL</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-secondary)' }}>
            {Math.round(analysis.overallScore)}
          </div>
        </div>
        <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PROJECTED</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: result.delta > 0 ? 'var(--success)' : result.delta < 0 ? 'var(--error)' : 'var(--text-secondary)',
            }}
          >
            {result.projectedScore}
          </div>
        </div>
        {hasChanges && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: result.delta > 0 ? 'rgba(48, 209, 88, 0.1)' : result.delta < 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
              color: result.delta > 0 ? 'var(--success)' : result.delta < 0 ? 'var(--error)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {result.delta > 0 ? <TrendingUp size={14} /> : result.delta < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {result.delta > 0 ? '+' : ''}{result.delta}
          </div>
        )}
      </div>

      {/* Explanation */}
      {hasChanges && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
          {result.explanation}
        </p>
      )}
    </div>
  );
}
