import Link from 'next/link';
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getSlugForCase,
  isFailureOutcome,
  isSuccessOutcome,
  type CaseStudy,
} from '@/lib/data/case-studies';
import { formatIndustry } from '@/lib/utils/labels';

const C = {
  navy: '#0F172A',
  green: '#16A34A',
  slate200: '#E2E8F0',
  slate500: '#64748B',
} as const;

/** Featured Tier 2 case-study row — cases with full canonical depth.
 *  Surfaces the 14 (and growing) deep-analysis cases above the filter grid
 *  so readers see the flagship examples first. */
export function FeaturedDeepCases({ cases }: { cases: CaseStudy[] }) {
  if (!cases.length) return null;

  // Prefer variety: at most 6 cases, prioritize different pattern families.
  const seen = new Set<string>();
  const picked: CaseStudy[] = [];
  for (const c of cases) {
    const family = c.patternFamily ?? '—';
    if (!seen.has(family)) {
      seen.add(family);
      picked.push(c);
    }
    if (picked.length >= 6) break;
  }
  // Top up with remaining cases if fewer than 6 unique families.
  for (const c of cases) {
    if (picked.length >= 6) break;
    if (!picked.includes(c)) picked.push(c);
  }

  return (
    <section style={{ marginBottom: 56 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 6,
            }}
          >
            <Sparkles size={12} /> Canonical Depth
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              fontWeight: 800,
              color: C.navy,
              margin: 0,
              letterSpacing: '-0.015em',
            }}
          >
            Featured deep analyses
          </h2>
          <p style={{ fontSize: 13, color: C.slate500, margin: '6px 0 0', maxWidth: 560 }}>
            {cases.length} cases carry full Tier 2 depth — timelines of evidence, named stakeholders
            with their positions, counterfactuals, and primary-source citations.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {picked.map(c => {
          const slug = getSlugForCase(c);
          const failure = isFailureOutcome(c.outcome);
          const success = isSuccessOutcome(c.outcome);
          const markerColor = failure ? '#DC2626' : success ? C.green : '#F59E0B';
          const Icon = failure ? AlertTriangle : CheckCircle;
          return (
            <Link
              key={c.id}
              href={`/case-studies/${slug}`}
              className="hover-card"
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: '18px 18px 16px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent strip */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 0 auto 0',
                  height: 3,
                  background: `linear-gradient(90deg, ${markerColor} 0%, ${C.green} 100%)`,
                }}
              />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Icon size={14} style={{ color: markerColor }} />
                <span
                  style={{
                    fontSize: 11,
                    color: C.slate500,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {c.year}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginLeft: 'auto',
                  }}
                >
                  {formatIndustry(c.industry)}
                </span>
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.navy,
                  marginBottom: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                {c.company}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: C.slate500,
                  lineHeight: 1.5,
                  marginBottom: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {c.title}
              </div>

              {c.patternFamily && (
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 100%)',
                    color: '#5B21B6',
                    padding: '4px 10px',
                    borderRadius: 999,
                    marginBottom: 10,
                  }}
                >
                  {c.patternFamily}
                </div>
              )}

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.green,
                  marginTop: 4,
                }}
              >
                Read the full analysis
                <ArrowRight size={11} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
