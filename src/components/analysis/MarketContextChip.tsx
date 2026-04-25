'use client';

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface Props {
  marketContextApplied: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
  };
}

const CONTEXT_LABEL: Record<Props['marketContextApplied']['context'], string> = {
  emerging_market: 'Emerging-market priors',
  developed_market: 'Developed-market priors',
  cross_border: 'Cross-border priors',
  unknown: 'Default priors',
};

const CONTEXT_HEX: Record<Props['marketContextApplied']['context'], string> = {
  emerging_market: '#16A34A',
  developed_market: '#2563EB',
  cross_border: '#7C3AED',
  unknown: '#64748B',
};

/**
 * Surfaces "we applied X-market priors because Nigeria + Kenya were detected"
 * so the reader can see exactly which growth-rate ceiling drove the bias
 * detector's overconfidence trigger. Defaults to collapsed chip; expands to
 * full rationale on click.
 */
export function MarketContextChip({ marketContextApplied }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Don't render the chip when context is unknown — the detector ran with
  // defaults, no jurisdiction-specific prior was applied, no signal to show.
  if (marketContextApplied.context === 'unknown') return null;

  const colour = CONTEXT_HEX[marketContextApplied.context];
  const label = CONTEXT_LABEL[marketContextApplied.context];
  const allCountries = [
    ...marketContextApplied.emergingMarketCountries,
    ...marketContextApplied.developedMarketCountries,
  ];
  const summary =
    allCountries.length === 0
      ? 'priors applied'
      : `${allCountries.slice(0, 3).join(', ')}${allCountries.length > 3 ? ` +${allCountries.length - 3} more` : ''}`;

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${colour}33`,
        borderLeft: `3px solid ${colour}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => setExpanded(prev => !prev)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
        aria-expanded={expanded}
      >
        <Globe size={16} style={{ color: colour, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {label}{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              · {summary}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 1,
            }}
          >
            Overconfidence trigger: ~{marketContextApplied.cagrCeiling}% CAGR ceiling
          </div>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
      {expanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 8 }}>{marketContextApplied.rationale}</div>
          {(marketContextApplied.emergingMarketCountries.length > 0 ||
            marketContextApplied.developedMarketCountries.length > 0) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {marketContextApplied.emergingMarketCountries.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>EM:</strong>{' '}
                  {marketContextApplied.emergingMarketCountries.join(', ')}
                </div>
              )}
              {marketContextApplied.developedMarketCountries.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>DM:</strong>{' '}
                  {marketContextApplied.developedMarketCountries.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
