import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, FileText } from 'lucide-react';
import { MarketingNav, BRAND_COLORS as C } from '@/components/marketing/MarketingNav';
import { SAMPLE_BUNDLES_BY_SLUG, SAMPLE_BUNDLES, ROLE_LABEL } from '@/lib/data/sample-bundles';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SAMPLE_BUNDLES.map(b => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = SAMPLE_BUNDLES_BY_SLUG[slug];
  if (!bundle) {
    return { title: 'Sample memo · Decision Intel' };
  }
  return {
    title: `${bundle.title} · Sample memo · Decision Intel`,
    description: bundle.summary,
    openGraph: {
      title: `${bundle.title} · Decision Intel sample`,
      description: bundle.summary,
      type: 'article',
    },
  };
}

export default async function SamplePage({ params }: Props) {
  const { slug } = await params;
  const bundle = SAMPLE_BUNDLES_BY_SLUG[slug];
  if (!bundle) notFound();

  const otherSamples = SAMPLE_BUNDLES.filter(b => b.slug !== bundle.slug && b.role === bundle.role);
  const memoBlocks = bundle.content.split('\n\n');

  return (
    <main style={{ background: C.white, minHeight: '100vh', color: C.slate900 }}>
      <MarketingNav />

      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '64px 24px 96px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.green,
            marginBottom: 12,
          }}
        >
          Sample memo · {ROLE_LABEL[bundle.role]}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: C.slate900,
            letterSpacing: '-0.01em',
          }}
        >
          {bundle.title}
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 17,
            color: C.slate500,
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          {bundle.summary}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 22,
            alignItems: 'center',
          }}
        >
          <Link
            href={`/demo?sample=${encodeURIComponent(bundle.slug)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              background: C.green,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Run the audit on this memo <ArrowRight size={13} />
          </Link>
          {bundle.regulatoryTag && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(59,130,246,0.1)',
                color: '#1d4ed8',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              Regulatory overlay · {bundle.regulatoryTag}
            </span>
          )}
          {bundle.marketContext === 'emerging_market' && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(168,85,247,0.1)',
                color: '#7c3aed',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              Emerging-market priors
            </span>
          )}
          {bundle.marketContext === 'cross_border' && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(234,179,8,0.12)',
                color: '#a16207',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              Cross-border governance
            </span>
          )}
        </div>

        {/* Expected audit shape */}
        <section
          style={{
            marginTop: 36,
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: 22,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 8,
            }}
          >
            What the audit surfaces
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'baseline',
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.slate900 }}>
                {bundle.expectedDqi}
              </div>
              <div style={{ fontSize: 12, color: C.slate500, fontWeight: 600 }}>Plausible DQI</div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.slate500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Biases the audit catches
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bundle.expectedBiases.map(b => (
                  <span
                    key={b}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: C.white,
                      border: `1px solid ${C.slate200}`,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.slate900,
                      textTransform: 'capitalize',
                    }}
                  >
                    {b.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Memo body */}
        <section style={{ marginTop: 36 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 10,
            }}
          >
            <FileText size={12} /> Memo body · paste-ready
          </div>
          <article
            style={{
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '32px clamp(20px, 4vw, 36px)',
              background: C.white,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              fontSize: 15,
              lineHeight: 1.7,
              color: C.slate900,
            }}
          >
            {memoBlocks.map((block, idx) => {
              if (block.startsWith('# ')) {
                return (
                  <h2
                    key={idx}
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      margin: '0 0 18px',
                      color: C.slate900,
                    }}
                  >
                    {block.replace(/^#\s+/, '')}
                  </h2>
                );
              }
              if (block.startsWith('## ')) {
                return (
                  <h3
                    key={idx}
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: '24px 0 10px',
                      color: C.slate900,
                    }}
                  >
                    {block.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (block.startsWith('| ')) {
                return (
                  <pre
                    key={idx}
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 13,
                      background: C.slate50,
                      padding: 14,
                      borderRadius: 8,
                      overflowX: 'auto',
                      lineHeight: 1.5,
                      margin: '8px 0',
                    }}
                  >
                    {block}
                  </pre>
                );
              }
              if (block.startsWith('- ')) {
                const items = block.split('\n').map(line => line.replace(/^-\s*/, ''));
                return (
                  <ul key={idx} style={{ margin: '8px 0', paddingLeft: 22 }}>
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} style={{ margin: '0 0 14px' }}>
                  {block}
                </p>
              );
            })}
          </article>
        </section>

        {/* Cross-link to siblings */}
        {otherSamples.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.slate900,
                marginBottom: 14,
              }}
            >
              Other {ROLE_LABEL[bundle.role]} samples
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {otherSamples.map(o => (
                <Link
                  key={o.slug}
                  href={`/case-studies/sample/${o.slug}`}
                  style={{
                    display: 'block',
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${C.slate200}`,
                    textDecoration: 'none',
                    color: C.slate900,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.slate500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {ROLE_LABEL[o.role]}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: C.slate500, marginTop: 6, lineHeight: 1.4 }}>
                    {o.summary}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
