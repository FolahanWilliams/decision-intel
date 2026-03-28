'use client';

interface Adjustment {
  source: string;
  description: string;
  delta: number;
}

export function ContextFactorImpact({ adjustments }: { adjustments: Adjustment[] }) {
  // Filter to context-related adjustments (exclude biological signals which have their own section)
  const contextAdjustments = adjustments.filter(
    a =>
      !a.source.toLowerCase().includes('winner') &&
      !a.source.toLowerCase().includes('cortisol') &&
      !a.source.toLowerCase().includes('stress')
  );

  if (contextAdjustments.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        No context adjustments were applied to this analysis.
      </p>
    );
  }

  const maxAbsDelta = Math.max(...contextAdjustments.map(a => Math.abs(a.delta)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {contextAdjustments.map((adj, idx) => {
        const isPositive = adj.delta >= 0;
        const barWidth = (Math.abs(adj.delta) / maxAbsDelta) * 100;

        return (
          <div key={idx}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatSource(adj.source)}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: isPositive ? '#22c55e' : '#ef4444',
                }}
              >
                {isPositive ? '+' : ''}
                {adj.delta.toFixed(1)}
              </span>
            </div>

            {/* Bidirectional bar */}
            <div style={{ display: 'flex', height: '8px', gap: 0 }}>
              {/* Negative side */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                {!isPositive && (
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: 'rgba(239, 68, 68, 0.5)',
                      borderRadius: '4px 0 0 4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                )}
              </div>
              {/* Center line */}
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
              {/* Positive side */}
              <div style={{ flex: 1 }}>
                {isPositive && (
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: 'rgba(34, 197, 94, 0.5)',
                      borderRadius: '0 4px 4px 0',
                      transition: 'width 0.4s ease',
                    }}
                  />
                )}
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {adj.description}
            </p>
          </div>
        );
      })}

      {/* Net impact */}
      <div
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Net Context Impact
        </span>
        <span
          style={{
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: contextAdjustments.reduce((s, a) => s + a.delta, 0) >= 0 ? '#22c55e' : '#ef4444',
          }}
        >
          {contextAdjustments.reduce((s, a) => s + a.delta, 0) >= 0 ? '+' : ''}
          {contextAdjustments.reduce((s, a) => s + a.delta, 0).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
