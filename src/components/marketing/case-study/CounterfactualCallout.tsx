import { Compass, TrendingUp } from 'lucide-react';
import type { CaseCounterfactual } from '@/lib/data/case-studies/types';

/** "What should have happened" callout — the single highest-value section
 *  for the platform pitch, because it's what the product actually outputs
 *  in live mode. */
export function CounterfactualCallout({ cf }: { cf: CaseCounterfactual }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#16A34A',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Compass size={12} />
        Counterfactual
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 20,
          letterSpacing: '-0.01em',
        }}
      >
        What a bias-adjusted process would have done
      </h2>

      <div
        style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1px solid #BBF7D0',
          borderLeft: '4px solid #16A34A',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#15803D',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Recommendation
          </div>
          <p
            style={{
              fontSize: 15,
              color: '#064E3B',
              lineHeight: 1.65,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {cf.recommendation}
          </p>
        </div>

        <div style={{ marginBottom: cf.estimatedOutcome ? 16 : 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#15803D',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Why it would have worked
          </div>
          <p style={{ fontSize: 14, color: '#065F46', lineHeight: 1.65, margin: 0 }}>
            {cf.rationale}
          </p>
        </div>

        {cf.estimatedOutcome && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'rgba(22, 163, 74, 0.08)',
              border: '1px dashed #86EFAC',
              borderRadius: 10,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <TrendingUp
              size={18}
              style={{ color: '#15803D', flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#15803D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                Estimated alternative outcome
              </div>
              <div style={{ fontSize: 13, color: '#064E3B', lineHeight: 1.6 }}>
                {cf.estimatedOutcome}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
