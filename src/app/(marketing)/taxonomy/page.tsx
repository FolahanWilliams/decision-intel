import type { Metadata } from 'next';
import { BIAS_EDUCATION, type BiasEducationContent } from '@/lib/constants/bias-education';

export const metadata: Metadata = {
  title: 'Cognitive Bias Taxonomy | Decision Intel',
  description:
    'The Decision Intel Bias Taxonomy: 20 cognitive biases with stable identifiers (DI-B-001 through DI-B-020), academic citations, and detection methodology. Cite these IDs in research, audits, and compliance documents.',
  openGraph: {
    title: 'Cognitive Bias Taxonomy | Decision Intel',
    description:
      '20 cognitive biases with stable, citeable identifiers. Academic grounding for every bias detected by the Decision Intel platform.',
  },
};

function formatBiasName(key: string): string {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'rgba(22,163,74,0.12)', text: '#16a34a' },
  moderate: { bg: 'rgba(217,119,6,0.12)', text: '#d97706' },
  hard: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
};

function BiasCard({ biasKey, bias }: { biasKey: string; bias: BiasEducationContent }) {
  const diffColor = DIFFICULTY_COLORS[bias.difficulty] || DIFFICULTY_COLORS.moderate;

  return (
    <div
      id={bias.taxonomyId}
      style={{
        padding: 24,
        borderRadius: 'var(--radius-xl, 16px)',
        background: 'var(--bg-card, rgba(0,0,0,0.01))',
        border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--accent-primary, #16a34a)',
              background: 'rgba(22,163,74,0.1)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid rgba(22,163,74,0.2)',
            }}
          >
            {bias.taxonomyId}
          </span>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)',
              margin: 0,
            }}
          >
            {formatBiasName(biasKey)}
          </h3>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: diffColor.bg,
            color: diffColor.text,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {bias.difficulty}
        </span>
      </div>

      {/* Real-world example */}
      <div
        style={{
          padding: 16,
          borderRadius: 'var(--radius-lg, 12px)',
          background: 'var(--bg-tertiary, #f3f4f6)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 6,
          }}
        >
          Case Study{bias.realWorldExample.company ? ` | ${bias.realWorldExample.company}` : ''}
          {bias.realWorldExample.year ? ` (${bias.realWorldExample.year})` : ''}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary, #0f172a)',
            marginBottom: 6,
          }}
        >
          {bias.realWorldExample.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #475569)', lineHeight: 1.6 }}>
          {bias.realWorldExample.description}
        </div>
      </div>

      {/* Quick tip */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary, #475569)',
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Quick Tip:</strong>{' '}
        {bias.quickTip}
      </div>

      {/* Debiasing techniques */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: 8,
          }}
        >
          Detection & Debiasing
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {bias.debiasingTechniques.map(technique => (
            <span
              key={technique}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full, 9999px)',
                background: 'var(--bg-secondary, #f9fafb)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
                color: 'var(--text-secondary, #475569)',
              }}
            >
              {technique}
            </span>
          ))}
        </div>
      </div>

      {/* Academic reference */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted, #94a3b8)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          borderTop: '1px solid var(--border-color, rgba(0,0,0,0.1))',
          paddingTop: 12,
        }}
      >
        {bias.academicReference.citation}
        {bias.academicReference.doi && (
          <>
            {' '}
            <a
              href={`https://doi.org/${bias.academicReference.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-primary, #16a34a)', textDecoration: 'none' }}
            >
              DOI
            </a>
          </>
        )}
        {!bias.academicReference.doi && bias.academicReference.url && (
          <>
            {' '}
            <a
              href={bias.academicReference.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-primary, #16a34a)', textDecoration: 'none' }}
            >
              Source
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function TaxonomyPage() {
  const biasEntries = Object.entries(BIAS_EDUCATION) as Array<[string, BiasEducationContent]>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--accent-primary, #16a34a)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 12,
          }}
        >
          Decision Intel Taxonomy
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            color: 'var(--text-primary, #0f172a)',
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Cognitive Bias Taxonomy
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary, #475569)',
            lineHeight: 1.7,
            maxWidth: 640,
          }}
        >
          20 cognitive biases with stable, citeable identifiers (DI-B-001 through DI-B-020). Each
          bias includes academic grounding, real-world case studies, and debiasing techniques. These
          IDs are permanent and can be referenced in research, compliance audits, and regulatory
          filings.
        </p>
      </div>

      {/* Quick reference table */}
      <div
        style={{
          padding: 20,
          borderRadius: 'var(--radius-xl, 16px)',
          background: 'var(--bg-card, rgba(0,0,0,0.01))',
          border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-primary, #0f172a)',
            marginBottom: 12,
          }}
        >
          Quick Reference
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 6,
          }}
        >
          {biasEntries.map(([key, bias]) => (
            <a
              key={key}
              href={`#${bias.taxonomyId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: 13,
                color: 'var(--text-secondary, #475569)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent-primary, #16a34a)',
                  flexShrink: 0,
                }}
              >
                {bias.taxonomyId}
              </span>
              {formatBiasName(key)}
            </a>
          ))}
        </div>
      </div>

      {/* Bias cards */}
      {biasEntries.map(([key, bias]) => (
        <BiasCard key={key} biasKey={key} bias={bias} />
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: 48,
          padding: 20,
          borderRadius: 'var(--radius-xl, 16px)',
          background: 'var(--bg-tertiary, #f3f4f6)',
          border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.6 }}>
          Taxonomy IDs are permanent and will never change. Cite as: &quot;Decision Intel Bias
          Taxonomy, {new Date().getFullYear()}. [DI-B-XXX].&quot;
        </p>
      </div>
    </div>
  );
}
