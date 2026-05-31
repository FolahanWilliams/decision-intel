/**
 * UseCaseContent — single-workflow section renderer.
 *
 * Used by:
 *   - /use (hub) — loops over USE_CASES, renders all 6 in sequence
 *   - /use/[slug] — renders the matched one only
 *
 * Mirrors the ComparisonContent shape (locked 2026-05-27) so the two
 * shadow-link page families share a visual rhythm and a maintenance
 * pattern. Relating-case cross-links use the case-study slug helpers
 * + filter unresolvable slugs gracefully so a typo in USE_CASES never
 * breaks the render.
 */

import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import type { UseCase } from '@/lib/data/use-cases';
import { getCaseBySlug, getSlugForCase } from '@/lib/data/case-studies/slugs';

const C = {
  white: '#FFFFFF',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
};

interface Props {
  useCase: UseCase;
  /** Optional `id` for hub-page anchor links. */
  sectionId?: string;
  /** Optional background color override (hub alternates slate50/white). */
  background?: string;
}

export function UseCaseContent({ useCase: u, sectionId, background }: Props) {
  // Resolve related case studies — silently drop any unresolvable slugs so
  // the section renders cleanly even if the SSOT list drifts from reality.
  const relatedCases = u.relatedCaseSlugs
    .map(slug => {
      const c = getCaseBySlug(slug);
      if (!c) return null;
      return { slug: getSlugForCase(c) ?? slug, study: c };
    })
    .filter(
      (entry): entry is { slug: string; study: NonNullable<ReturnType<typeof getCaseBySlug>> } =>
        entry !== null
    );

  return (
    <section
      id={sectionId}
      style={{
        padding: '56px 24px 56px',
        background: background ?? C.white,
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 12,
            color: C.green,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {u.eyebrow}
        </div>
        <h2
          style={{
            fontSize: 'clamp(22px, 2.6vw, 32px)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: 0,
            color: C.slate900,
            letterSpacing: '-0.01em',
          }}
        >
          {u.oneLiner}
        </h2>

        {/* SCQA 4-line strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginTop: 28,
            marginBottom: 32,
          }}
        >
          {[
            { eyebrow: 'Situation', body: u.scqa.situation },
            { eyebrow: 'Complication', body: u.scqa.complication },
            { eyebrow: 'Question', body: u.scqa.question },
            { eyebrow: 'Answer', body: u.scqa.answer },
          ].map(cell => (
            <div
              key={cell.eyebrow}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                padding: '16px 18px',
                borderTop:
                  cell.eyebrow === 'Answer' ? `3px solid ${C.green}` : `3px solid ${C.slate500}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: cell.eyebrow === 'Answer' ? C.green : C.slate500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {cell.eyebrow}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: C.slate700, margin: 0 }}>
                {cell.body}
              </p>
            </div>
          ))}
        </div>

        {/* How it works — 5-step canonical flow */}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.slate500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '32px 0 16px',
          }}
        >
          How it works
        </h3>
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
        >
          {u.steps.map((step, si) => (
            <div
              key={step.n}
              style={{
                display: 'flex',
                gap: 16,
                padding: '16px 20px',
                borderBottom: si === u.steps.length - 1 ? 'none' : `1px solid ${C.slate100}`,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: C.greenSoft,
                  color: C.green,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.n}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: C.slate900,
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: C.slate700, margin: 0 }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Why this matters body */}
        <div
          style={{
            marginTop: 32,
            padding: '20px 22px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderLeft: `3px solid ${C.green}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.green,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Why this matters
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700, margin: 0 }}>
            {u.whyItMatters}
          </p>
        </div>

        {/* Related case studies */}
        {relatedCases.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.slate500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: '0 0 16px',
              }}
            >
              Related from the {}
              <span style={{ color: C.slate700 }}>case library</span>
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {relatedCases.map(rc => (
                <Link
                  key={rc.slug}
                  href={`/case-studies/${rc.slug}`}
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: C.slate900,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.slate500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    <BookOpen size={11} />
                    {rc.study.company}
                    <ChevronRight size={11} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                    {rc.study.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {u.faq.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.slate500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: '0 0 16px',
              }}
            >
              FAQ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {u.faq.map((item, fi) => (
                <div
                  key={fi}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.slate900,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.q}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary CTA — single, anchored to the workflow */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link
            href="/demo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: C.green,
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            {u.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
