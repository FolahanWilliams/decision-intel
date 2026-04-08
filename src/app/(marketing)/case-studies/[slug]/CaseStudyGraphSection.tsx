'use client';

import { CaseStudyBiasGraph } from '@/components/marketing/CaseStudyBiasGraph';

interface Props {
  biases: string[];
  primaryBias: string;
  toxicCombinations: string[];
  company: string;
}

export function CaseStudyGraphSection({ biases, primaryBias, toxicCombinations, company }: Props) {
  if (biases.length < 2) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h3
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#16A34A',
            marginBottom: 4,
          }}
        >
          Decision Intel Analysis
        </h3>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          {company} Cognitive Bias Web
        </p>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Interactive visualization — hover to explore bias relationships
          {toxicCombinations.length > 0 && (
            <> &middot; {toxicCombinations.length} toxic combination{toxicCombinations.length !== 1 ? 's' : ''} detected</>
          )}
        </p>
      </div>

      <CaseStudyBiasGraph
        biases={biases}
        primaryBias={primaryBias}
        toxicCombinations={toxicCombinations}
        size={360}
      />

      {toxicCombinations.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {toxicCombinations.map(tc => (
            <span
              key={tc}
              style={{
                padding: '4px 12px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              }}
            >
              {tc}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
