'use client';

interface Props {
  currentScore: number;
  currentNoise: number;
  currentBiasCount: number;
  orgBaseline: {
    avgScore: number;
    biasFrequency: number;
    noiseAvg: number;
    totalDecisions: number;
  };
}

export function HistoricalComparison({
  currentScore,
  currentNoise,
  currentBiasCount,
  orgBaseline,
}: Props) {
  const comparisons = [
    {
      label: 'Overall Score',
      current: currentScore,
      baseline: orgBaseline.avgScore,
      format: (v: number) => Math.round(v).toString(),
      higherIsBetter: true,
    },
    {
      label: 'Noise Score',
      current: currentNoise,
      baseline: orgBaseline.noiseAvg,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: false,
    },
    {
      label: 'Biases Detected',
      current: currentBiasCount,
      baseline: orgBaseline.biasFrequency,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {comparisons.map(comp => {
        const diff = comp.current - comp.baseline;
        const isBetter = comp.higherIsBetter ? diff > 0 : diff < 0;
        const isWorse = comp.higherIsBetter ? diff < 0 : diff > 0;
        const diffColor = isBetter ? '#22c55e' : isWorse ? '#ef4444' : 'var(--text-muted)';

        // Calculate bar widths (normalize to max of current vs baseline)
        const maxVal = Math.max(comp.current, comp.baseline, 1);
        const currentPct = (comp.current / maxVal) * 100;
        const baselinePct = (comp.baseline / maxVal) * 100;

        return (
          <div key={comp.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{comp.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: diffColor,
                }}
              >
                {diff >= 0 ? '+' : ''}{comp.format(diff)} vs org avg
              </span>
            </div>

            {/* This decision */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '60px' }}>This</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}>
                <div
                  style={{
                    width: `${currentPct}%`,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '3px',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', width: '40px', textAlign: 'right' }}>
                {comp.format(comp.current)}
              </span>
            </div>

            {/* Org baseline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '60px' }}>Org avg</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}>
                <div
                  style={{
                    width: `${baselinePct}%`,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderRadius: '3px',
                    borderRight: '2px solid rgba(255,255,255,0.3)',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', width: '40px', textAlign: 'right' }}>
                {comp.format(comp.baseline)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
