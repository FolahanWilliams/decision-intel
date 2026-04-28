'use client';

/**
 * R2FDecompositionCard — makes the Recognition-Rigor Framework visible on
 * the document-detail page. Two columns: Kahneman's rigor (debiasing) on
 * the left, Klein's recognition (expertise amplification) on the right,
 * arbitrated into a single output. Names the IP, gives a CSO a screenshot
 * they can paste into a board slide.
 *
 * Not a data viz — a positioning surface. The numbers shown (bias count,
 * noise score) come off the analysis row; the node labels are fixed per
 * the R²F lock in CLAUDE.md (biasDetective / noiseJudge / statisticalJury
 * on the Kahneman side; rpdRecognition / forgottenQuestions / preMortem
 * on the Klein side; metaJudge as arbiter).
 */

import { Scale, Compass, ArrowRight } from 'lucide-react';
import { R2FBadge } from '@/components/ui/R2FBadge';

interface R2FDecompositionCardProps {
  overallScore: number;
  noiseScore?: number;
  biasCount: number;
}

const KAHNEMAN_SIDE = [
  { label: 'Bias Detective', note: '30+ bias scan across the memo' },
  { label: 'Noise Judge', note: 'Within-memo consistency check' },
  {
    label: 'Ensemble Sampling',
    note: 'Base-rate and reference-class pull · multi-model consensus',
  },
];

const KLEIN_SIDE = [
  { label: 'Recognition-Primed Decision', note: 'Pattern-match to known playbooks' },
  { label: 'Forgotten Questions', note: 'What the memo doesn’t ask' },
  { label: 'Pre-mortem', note: 'Why this fails, told from the future' },
];

export function R2FDecompositionCard({
  overallScore,
  noiseScore,
  biasCount,
}: R2FDecompositionCardProps) {
  return (
    <section
      aria-labelledby="r2f-decomp-heading"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: '20px 22px',
        marginBottom: 'var(--space-xl, 24px)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <R2FBadge size="sm" />
          </div>
          <h3
            id="r2f-decomp-heading"
            style={{
              fontSize: 'var(--fs-lg, 20px)',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            How this memo was audited
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--fs-xs, 13px)',
              color: 'var(--text-secondary)',
              maxWidth: 620,
            }}
          >
            Kahneman’s debiasing tradition and Klein’s Recognition-Primed Decision framework run
            side-by-side, arbitrated into one score. The 2009 Kahneman–Klein paper is the canonical
            citation.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexShrink: 0,
          }}
        >
          <ScoreStat label="DQI" value={String(overallScore)} accent />
          <ScoreStat label="Biases" value={String(biasCount)} />
          {typeof noiseScore === 'number' && <ScoreStat label="Noise" value={`${noiseScore}%`} />}
        </div>
      </header>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        <SideColumn
          icon={<Scale size={14} strokeWidth={2.25} aria-hidden />}
          eyebrow="Kahneman"
          title="Intuition protected"
          subtitle="Rigor · System 2 debiasing"
          items={KAHNEMAN_SIDE}
          tone="amber"
        />

        {/* Arbiter spine */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}
          aria-hidden
        >
          <div
            style={{
              width: 1,
              flex: 1,
              background: 'var(--border-color)',
              minHeight: 24,
            }}
          />
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              padding: '4px 8px',
              background: 'rgba(22, 163, 74, 0.08)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              borderRadius: 'var(--radius-full, 9999px)',
              whiteSpace: 'nowrap',
              marginTop: 6,
              marginBottom: 6,
            }}
          >
            metaJudge
          </div>
          <div
            style={{
              width: 1,
              flex: 1,
              background: 'var(--border-color)',
              minHeight: 24,
            }}
          />
        </div>

        <SideColumn
          icon={<Compass size={14} strokeWidth={2.25} aria-hidden />}
          eyebrow="Klein"
          title="Intuition amplified"
          subtitle="Recognition · expert pattern-match"
          items={KLEIN_SIDE}
          tone="blue"
        />
      </div>

      <footer
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--fs-2xs, 12px)',
          color: 'var(--text-muted)',
        }}
      >
        <ArrowRight size={12} strokeWidth={2.25} aria-hidden />
        <span>
          Every bias and every counterfactual in this memo traces to one of these six stages.
        </span>
      </footer>
    </section>
  );
}

function ScoreStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: accent ? 'var(--accent-primary)' : 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SideColumn({
  icon,
  eyebrow,
  title,
  subtitle,
  items,
  tone,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Array<{ label: string; note: string }>;
  tone: 'amber' | 'blue';
}) {
  const accent = tone === 'amber' ? 'rgba(217, 119, 6, 0.85)' : 'rgba(37, 99, 235, 0.85)';
  const accentSoft = tone === 'amber' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(37, 99, 235, 0.08)';
  return (
    <div
      style={{
        background: 'var(--bg-elevated, #fff)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '14px 14px 12px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: accent,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {icon}
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-base, 16px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-2xs, 12px)',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        {subtitle}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.map(it => (
          <li
            key={it.label}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '7px 9px',
              background: accentSoft,
              borderRadius: 'var(--radius-md, 8px)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accent,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--fs-sm, 14px)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {it.label}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-2xs, 12px)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                {it.note}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
