import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Flame, Coins, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { computeGenomeFromSeed } from '@/lib/data/bias-genome-seed';
import { CaseStudyNav } from '../case-studies/CaseStudyNav';
import { HeadlineStatCard } from '@/components/marketing/genome/HeadlineStatCard';
import { ToxicComboCard } from '@/components/marketing/genome/ToxicComboCard';
import { BiasGenomeClient } from './BiasGenomeClient';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

export const metadata: Metadata = {
  title: 'The Bias Genome — Which Cognitive Biases Predict Strategic Failure | Decision Intel',
  description:
    "A public map of which cognitive biases predict which kinds of strategic failure, by industry. Seed dataset of real decisions. Updated quarterly as consenting orgs opt in.",
  alternates: { canonical: `${siteUrl}/bias-genome` },
  openGraph: {
    title: 'The Bias Genome — Which Biases Predict Which Failures',
    description:
      'A quarterly public genome of bias → failure correlations across industries. Computed from real case studies. Cite freely.',
    url: `${siteUrl}/bias-genome`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Bias Genome',
    description: 'A public map of bias-to-failure correlations. Updated quarterly.',
  },
};

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#F59E0B',
};

export default function BiasGenomePage() {
  const genome = computeGenomeFromSeed();
  const { meta, headline, toxicPatterns } = genome;

  return (
    <div style={{ background: C.slate50, color: C.slate900, minHeight: '100vh' }}>
      <CaseStudyNav />

      {/* HERO ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 24px 40px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 20,
            }}
          >
            The Bias Genome · Quarterly
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 18,
              color: C.slate900,
              maxWidth: 960,
            }}
          >
            Which cognitive biases predict
            <br />
            which kinds of strategic failure
            <span style={{ color: C.green }}>.</span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 19px)',
              lineHeight: 1.55,
              color: C.slate600,
              maxWidth: 760,
              margin: 0,
              marginBottom: 10,
            }}
          >
            A public map drawn from {meta.totalCases} real strategic decisions —{' '}
            {meta.failureCases} failures and {meta.successCases} successes — across{' '}
            {meta.industriesCovered.length} industries. Methodology open. Data cite-able.
            Refreshed as consenting customer orgs opt in.
          </p>
          <p
            style={{
              fontSize: 13,
              color: C.slate400,
              margin: 0,
            }}
          >
            Baseline failure rate in this dataset: {Math.round(meta.baselineFailureRate * 100)}%. Every
            &ldquo;failure lift&rdquo; below is multiplied against this baseline.
          </p>

          {/* Meta strip */}
          <div
            style={{
              display: 'flex',
              gap: 28,
              flexWrap: 'wrap',
              marginTop: 40,
              paddingTop: 24,
              borderTop: `1px solid ${C.slate200}`,
            }}
          >
            <Pill label="Named biases" value="20" sublabel="DI-B-001 → DI-B-020" />
            <Pill label="Case studies" value={String(meta.totalCases)} sublabel="hand-curated" />
            <Pill
              label="Industries"
              value={String(meta.industriesCovered.length)}
              sublabel="with meaningful coverage"
            />
            <Pill label="Data source" value="Seed" sublabel="live on customer opt-in" />
            <Pill label="Refreshed" value={meta.computedAt} sublabel="ISO date" />
          </div>
        </div>
      </section>

      {/* HEADLINE STATS ─────────────────────────────────────────── */}
      <section style={{ padding: '48px 24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {headline.mostDangerous && (
              <HeadlineStatCard
                eyebrow="Most dangerous"
                value={
                  headline.mostDangerous.failureLift
                    ? `${headline.mostDangerous.failureLift.toFixed(1)}x`
                    : '—'
                }
                label={headline.mostDangerous.label}
                taxonomyId={headline.mostDangerous.taxonomyId}
                supportingLine={`Failure lift vs baseline · n=${headline.mostDangerous.sampleSize}`}
                tone="danger"
                icon={AlertTriangle}
              />
            )}
            {headline.mostPrevalent && (
              <HeadlineStatCard
                eyebrow="Most prevalent"
                value={`${Math.round(headline.mostPrevalent.prevalence * 100)}%`}
                label={headline.mostPrevalent.label}
                taxonomyId={headline.mostPrevalent.taxonomyId}
                supportingLine={`Appears in ${headline.mostPrevalent.sampleSize} of ${meta.totalCases} cases`}
                tone="warning"
                icon={Flame}
              />
            )}
            {headline.mostCostly && (
              <HeadlineStatCard
                eyebrow="Most costly when uncaught"
                value={
                  headline.mostCostly.avgFailureImpact != null
                    ? String(headline.mostCostly.avgFailureImpact)
                    : '—'
                }
                label={headline.mostCostly.label}
                taxonomyId={headline.mostCostly.taxonomyId}
                supportingLine={`Avg impact score across failures · n=${headline.mostCostly.sampleSize}`}
                tone="danger"
                icon={Coins}
              />
            )}
            {headline.mostUnderestimated && (
              <HeadlineStatCard
                eyebrow="Most underestimated"
                value={
                  headline.mostUnderestimated.failureLift
                    ? `${headline.mostUnderestimated.failureLift.toFixed(1)}x`
                    : '—'
                }
                label={headline.mostUnderestimated.label}
                taxonomyId={headline.mostUnderestimated.taxonomyId}
                supportingLine={`Low prevalence (${Math.round(headline.mostUnderestimated.prevalence * 100)}%) but outsized failure lift`}
                tone="warning"
                icon={EyeOff}
              />
            )}
          </div>
        </div>
      </section>

      {/* LEADERBOARD ─────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 8,
              color: C.slate900,
            }}
          >
            The leaderboard.
          </h2>
          <p
            style={{
              fontSize: 14.5,
              color: C.slate500,
              margin: 0,
              marginBottom: 24,
              maxWidth: 680,
            }}
          >
            Sorted by failure lift — how much more often a decision fails when this bias is
            present, relative to the baseline. Filter by industry to narrow the slice.
          </p>
          <BiasGenomeClient genome={genome} />
        </div>
      </section>

      {/* TOXIC COMBINATIONS ──────────────────────────────────────── */}
      <section style={{ padding: '64px 24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 8,
              color: C.slate900,
            }}
          >
            Toxic combinations.
          </h2>
          <p
            style={{
              fontSize: 14.5,
              color: C.slate500,
              margin: 0,
              marginBottom: 28,
              maxWidth: 680,
            }}
          >
            Named patterns where two biases compound. Detection in live memos is 8x worse than
            either bias alone — the product category our toxic-combination engine was built for.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {toxicPatterns.map(p => (
              <ToxicComboCard key={p.name} pattern={p} />
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY ─────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '28px 32px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: C.slate400,
                marginBottom: 12,
              }}
            >
              Method · How this dataset is built
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.slate600, lineHeight: 1.75 }}>
              <li>
                Each case is a real, documented strategic decision drawn from SEC filings, NTSB
                reports, FDA actions, post-mortems, or academic case studies.
              </li>
              <li>
                Biases are assigned per-case by applying the Decision Intel taxonomy (DI-B-001 →
                DI-B-020). Every named bias links to peer-reviewed academic sources at{' '}
                <Link href="/taxonomy" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
                  /taxonomy
                </Link>
                .
              </li>
              <li>
                Failure lift = failure rate among cases with this bias ÷ baseline failure rate
                across the full dataset ({Math.round(meta.baselineFailureRate * 100)}%).
              </li>
              <li>
                <strong>Sample-size gate:</strong> headline rankings require n ≥ 5. Rows with n &lt; 3
                are shown dimmed with a ⚠ — they are directional only.
              </li>
              <li>
                <strong>Honest selection bias:</strong> famous strategic failures dominate the
                public record. Industries with small coverage (aerospace, entertainment) should be
                read as signal, not statistic.
              </li>
              <li>
                As consenting customer orgs opt into anonymized outcome sharing (see{' '}
                <em>Settings → Privacy</em> when logged in), their data supplements this seed. The
                live genome endpoint at{' '}
                <code style={{ fontSize: 12, background: C.slate100, padding: '1px 6px', borderRadius: 4 }}>
                  /api/intelligence/bias-genome
                </code>{' '}
                will take over once n ≥ 3 consenting orgs have reported outcomes.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px 80px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              background: C.navy,
              color: C.white,
              borderRadius: 20,
              padding: '44px 44px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 28,
              alignItems: 'center',
            }}
            className="genome-cta"
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: C.green,
                  marginBottom: 10,
                }}
              >
                Want to see this on your own memo?
              </div>
              <h3
                style={{
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  marginBottom: 8,
                  color: C.white,
                }}
              >
                Run your next strategic memo through the same taxonomy.
              </h3>
              <p style={{ fontSize: 14.5, color: C.slate300, margin: 0, maxWidth: 640 }}>
                Upload takes 60 seconds. Your data stays yours — anonymized aggregation is opt-in.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: C.green,
                  color: C.white,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Audit your memo <ArrowRight size={14} />
              </Link>
              <Link
                href="/taxonomy"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  color: C.white,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <BookOpen size={14} /> See the full taxonomy
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: 11,
              color: C.slate400,
              flexWrap: 'wrap',
            }}
          >
            <span>Seed snapshot · {meta.computedAt}</span>
            <span>·</span>
            <span>
              Live updates begin when ≥ 3 customer orgs have opted into anonymized outcome sharing.
            </span>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 720px) {
          .genome-cta {
            grid-template-columns: 1fr !important;
            padding: 28px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

function Pill({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: C.slate900,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: C.slate500, marginTop: 4 }}>{sublabel}</div>
      )}
    </div>
  );
}
