'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import {
  ALL_CASES,
  getDeepCases,
  getSlugForCase,
  isFailureOutcome,
  isSuccessOutcome,
  type CaseStudy,
} from '@/lib/data/case-studies';
import { trackEvent } from '@/lib/analytics/track';
import { formatIndustry, formatOutcome, formatBiasName } from '@/lib/utils/labels';

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
} as const;

function outcomeColor(outcome: CaseStudy['outcome']): { bg: string; fg: string } {
  if (isFailureOutcome(outcome)) return { bg: '#FEE2E2', fg: '#991B1B' };
  if (isSuccessOutcome(outcome)) return { bg: '#DCFCE7', fg: '#166534' };
  return { bg: '#FEF3C7', fg: '#92400E' };
}

/**
 * Rotating showcase of the flagship "deep" case studies — the ones with
 * hindsight-stripped pre-decision evidence. Renders on the landing page
 * between the stats bar and pricing, filling the credibility slot that
 * would otherwise hold customer logos.
 */
export function CaseStudyCarousel() {
  const featured = useMemo<CaseStudy[]>(() => {
    const deep = getDeepCases();
    if (deep.length >= 4) return deep.slice(0, 4);
    // Fallback: top up with the most impactful cases from ALL_CASES.
    const extras = [...ALL_CASES]
      .sort((a, b) => b.impactScore - a.impactScore)
      .filter(c => !deep.some(d => d.id === c.id))
      .slice(0, 4 - deep.length);
    return [...deep, ...extras];
  }, []);

  return (
    <section
      style={{
        background: C.white,
        borderBottom: `1px solid ${C.slate200}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Proof, not logos
            </p>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: C.slate900,
                margin: 0,
                marginBottom: 12,
                letterSpacing: '-0.01em',
                maxWidth: 720,
              }}
            >
              Real decisions, analyzed the same way we analyze yours.
            </h2>
            <p style={{ fontSize: 17, color: C.slate600, margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              We took the pre-decision memos from {featured.length} famous deals,
              stripped the hindsight, and ran them through our pipeline. Here&apos;s
              what we would have flagged.
            </p>
          </div>

          <Link
            href="/case-studies"
            onClick={() => trackEvent('case_study_carousel_see_all', {})}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: C.navy,
              textDecoration: 'none',
              border: `1px solid ${C.slate200}`,
              padding: '10px 16px',
              borderRadius: 8,
              background: C.white,
            }}
          >
            See all {ALL_CASES.length} cases
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {featured.map((c, i) => {
            const slug = getSlugForCase(c);
            const color = outcomeColor(c.outcome);
            const hasDeep = !!c.preDecisionEvidence;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  href={`/case-studies/${slug}`}
                  onClick={() =>
                    trackEvent('case_study_carousel_click', {
                      slug,
                      company: c.company,
                      position: i,
                    })
                  }
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 14,
                    padding: 22,
                    height: '100%',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        background: color.bg,
                        color: color.fg,
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {formatOutcome(c.outcome)}
                    </span>
                    {isFailureOutcome(c.outcome) ? (
                      <AlertTriangle size={12} color="#DC2626" />
                    ) : (
                      <CheckCircle size={12} color={C.green} />
                    )}
                    {hasDeep && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#EDE9FE',
                          color: '#5B21B6',
                          padding: '3px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                        }}
                      >
                        <Sparkles size={9} /> Deep
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: C.navy,
                      margin: 0,
                      marginBottom: 4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {c.company}
                  </h3>
                  <p style={{ fontSize: 12, color: C.slate500, margin: 0, marginBottom: 14 }}>
                    {c.year} &middot; {formatIndustry(c.industry)}
                  </p>

                  {c.primaryBias && (
                    <div style={{ fontSize: 12, color: C.slate600, marginBottom: 8 }}>
                      <strong style={{ color: C.slate900 }}>Flagged:</strong> {formatBiasName(c.primaryBias)}
                    </div>
                  )}

                  {c.lessonsLearned[0] && (
                    <p
                      style={{
                        fontSize: 13,
                        color: C.slate600,
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.lessonsLearned[0]}
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
