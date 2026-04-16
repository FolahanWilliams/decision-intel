import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#F59E0B',
};

const OUTCOME_LABEL: Record<string, string> = {
  catastrophic_failure: 'Catastrophic Failure',
  failure: 'Failure',
  partial_failure: 'Partial Failure',
  partial_success: 'Partial Success',
  success: 'Success',
  exceptional_success: 'Exceptional Success',
};

const OUTCOME_COLOR: Record<string, string> = {
  catastrophic_failure: C.red,
  failure: C.red,
  partial_failure: C.amber,
  partial_success: C.green,
  success: C.green,
  exceptional_success: C.green,
};

interface OutcomeRevealProps {
  company: string;
  outcome: string;
  yearRealized: number;
  yearsElapsed: number;
  estimatedImpact: string;
  summary: string;
  detailHref: string;
}

export function OutcomeReveal({
  company,
  outcome,
  yearRealized,
  yearsElapsed,
  estimatedImpact,
  summary,
  detailHref,
}: OutcomeRevealProps) {
  const label = OUTCOME_LABEL[outcome] ?? outcome;
  const color = OUTCOME_COLOR[outcome] ?? C.slate400;
  const trimmedSummary = summary.length > 300 ? summary.slice(0, 297).trimEnd() + '…' : summary;

  return (
    <section
      style={{
        background: C.navy,
        color: C.white,
        borderRadius: 20,
        padding: 0,
        overflow: 'hidden',
        border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      <div
        style={{
          padding: '32px 36px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'flex-start',
          gap: 28,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
        className="outcome-reveal-header"
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 999,
              background: `${color}22`,
              border: `1px solid ${color}55`,
              color,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}
          >
            What actually happened · {label}
          </div>
          <h3
            style={{
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
              color: C.white,
            }}
          >
            {company}, {yearRealized}.
          </h3>
          <p
            style={{
              marginTop: 10,
              fontSize: 20,
              fontWeight: 600,
              color,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            {estimatedImpact}
          </p>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            fontSize: 11,
            fontWeight: 600,
            color: C.slate300,
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={12} />
          {yearsElapsed === 0
            ? 'same year'
            : `${yearsElapsed} year${yearsElapsed === 1 ? '' : 's'} later`}
        </div>
      </div>

      <div
        style={{
          padding: '24px 36px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 24,
        }}
        className="outcome-reveal-body"
      >
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.65,
            color: C.slate300,
            margin: 0,
            maxWidth: 720,
          }}
        >
          {trimmedSummary}
        </p>
        <Link
          href={detailHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: C.green,
            color: C.white,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          See full forensics <ArrowRight size={14} />
        </Link>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .outcome-reveal-header,
          .outcome-reveal-body {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
