import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

/** Bottom CTA for the demo — pushes prospects from a historical
 *  reconstruction to running their own memo. */
export function DemoCta({ company }: { company: string }) {
  return (
    <section
      style={{
        marginTop: 48,
        marginBottom: 40,
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #064E3B 100%)',
        borderRadius: 20,
        padding: '40px 32px',
        color: '#FFFFFF',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.28)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#16A34A',
          marginBottom: 12,
        }}
      >
        <Sparkles size={12} />
        Your memo, not {company}&apos;s
      </div>
      <h2
        style={{
          fontSize: 'clamp(22px, 4vw, 32px)',
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: 10,
        }}
      >
        Audit your own strategic memo in under 60 seconds.
      </h2>
      <p
        style={{
          fontSize: 'clamp(13px, 2vw, 15px)',
          color: '#CBD5E1',
          maxWidth: 520,
          margin: '0 auto 24px',
          lineHeight: 1.55,
        }}
      >
        Same bias framework, same pre-decision-evidence discipline. Drop in your strategic memo or
        board deck, get the DQI grade, flagged biases, predicted CEO questions, and counterfactual
        back before your next meeting.
      </p>
      <div
        style={{
          display: 'inline-flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#16A34A',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            padding: '12px 22px',
            borderRadius: 999,
            textDecoration: 'none',
            boxShadow: '0 4px 18px rgba(22, 163, 74, 0.35)',
          }}
        >
          Start free audit
          <ArrowRight size={15} />
        </Link>
        <Link
          href="/case-studies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 22px',
            borderRadius: 999,
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.16)',
          }}
        >
          See more demos
        </Link>
      </div>
    </section>
  );
}
