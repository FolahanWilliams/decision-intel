'use client';

import { useEffect, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BiasEntry {
  biasType: string;
  severity: string;
}

interface ToxicCombo {
  patternLabel: string;
  toxicScore: number;
  biasTypes: string[];
}

interface BriefingData {
  biases: BiasEntry[];
  toxicCombinations: ToxicCombo[];
  overallScore: number | null;
  noiseScore: number | null;
  historicalFailureRate: number | null;
}

// ─── Pre-Meeting Checklist ──────────────────────────────────────────────────

const PRE_MEETING_CHECKLIST = [
  { id: 'dissent', label: "Assign a formal dissenter / devil's advocate" },
  { id: 'premortem', label: 'Run a pre-mortem: "Assume this failed — why?"' },
  { id: 'baserate', label: 'Review base-rate data for this decision type' },
  { id: 'criteria', label: 'Confirm success/failure criteria before voting' },
  { id: 'blind', label: 'Collect blind priors before discussion begins' },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface BiasBriefingProps {
  analysisId: string;
  roomTitle?: string;
}

export default function BiasBriefing({ analysisId, roomTitle }: BiasBriefingProps) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/decision-graph/context?analysisId=${analysisId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json) {
          setData({
            biases: json.biases ?? [],
            toxicCombinations: json.toxicCombinations ?? [],
            overallScore: json.overallScore ?? null,
            noiseScore: json.noiseScore ?? null,
            historicalFailureRate: json.historicalFailureRate ?? null,
          });
        }
      })
      .catch(err => console.warn('Failed to fetch bias briefing:', err))
      .finally(() => setLoading(false));
  }, [analysisId]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <div
          style={{
            height: 200,
            borderRadius: 12,
            background: 'var(--bg-secondary, #111)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  if (!data) return null;

  const criticalBiases = data.biases.filter(
    b => b.severity === 'critical' || b.severity === 'high'
  );
  const hasToxic = data.toxicCombinations.length > 0;

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: 'var(--bg-secondary, #111)',
        border: '1px solid var(--border-primary, #222)',
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary, #fff)',
          marginBottom: 4,
        }}
      >
        Pre-Meeting Bias Briefing
      </h3>
      {roomTitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)', marginBottom: 16 }}>
          {roomTitle}
        </div>
      )}

      {/* Score summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {data.overallScore !== null && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background:
                data.overallScore >= 60 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${data.overallScore >= 60 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {data.overallScore}/100
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>Decision Score</div>
          </div>
        )}
        {data.noiseScore !== null && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {data.noiseScore}/100
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>Noise Score</div>
          </div>
        )}
        {data.historicalFailureRate !== null && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {Math.round(data.historicalFailureRate * 100)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
              Similar decision failure rate
            </div>
          </div>
        )}
      </div>

      {/* Critical biases */}
      {criticalBiases.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary, #fff)',
              marginBottom: 8,
            }}
          >
            Key Biases Detected ({criticalBiases.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {criticalBiases.map((b, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  background:
                    b.severity === 'critical'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(234, 179, 8, 0.12)',
                  color:
                    b.severity === 'critical'
                      ? 'var(--color-error, #ef4444)'
                      : 'var(--color-warning, #eab308)',
                  border: `1px solid ${b.severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                }}
              >
                {b.biasType.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toxic combinations */}
      {hasToxic && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-error, #ef4444)',
              marginBottom: 8,
            }}
          >
            Compound Risk Patterns
          </div>
          {data.toxicCombinations.map((combo, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                {combo.patternLabel} (Score: {Math.round(combo.toxicScore)})
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #b4b4bc)', marginTop: 2 }}>
                {combo.biasTypes.map(b => b.replace(/_/g, ' ')).join(' + ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-meeting checklist */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
          }}
        >
          Pre-Meeting Checklist
        </div>
        {PRE_MEETING_CHECKLIST.map(item => (
          <label
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              cursor: 'pointer',
              fontSize: 13,
              color: checkedItems.has(item.id)
                ? 'var(--text-muted, #71717a)'
                : 'var(--text-secondary, #b4b4bc)',
              textDecoration: checkedItems.has(item.id) ? 'line-through' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={checkedItems.has(item.id)}
              onChange={() => toggleCheck(item.id)}
              style={{ accentColor: 'var(--color-accent, #3b82f6)' }}
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
