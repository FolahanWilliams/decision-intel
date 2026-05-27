/**
 * CaseStudyWorkflowStrip — connects the educational case-study surface
 * to the workflow tool surface (/use/[slug]).
 *
 * Closes the funnel-gap between "learning from history" and "running
 * the audit on my own decision." A reader landing on a case study via
 * GSC search ("bankruptcy of barings bank") gets the historical post-
 * mortem, then sees the explicit bridge: "you can audit your own
 * decisions through these workflows."
 *
 * Picks 3 contextually-relevant workflows based on the case study's
 * outcome class + toxic combinations. Strategic-memo-audit is the
 * universal default (broadest applicability); the other 2 are chosen
 * by case shape.
 */

import Link from 'next/link';
import { ArrowRight, Workflow } from 'lucide-react';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import { getUseCaseBySlug } from '@/lib/data/use-cases';
import { BRAND_COLORS as C } from '@/components/marketing/MarketingNav';

const M_AND_A_PATTERN_LABELS = ['Synergy Mirage', 'Conglomerate Fallacy', "Winner's Curse"];

/** Heuristic: which 3 workflows does this case study most directly
 *  illustrate? Always includes strategic-memo-audit as the universal
 *  default; the other 2 vary by case shape. */
function pickWorkflows(caseStudy: CaseStudy) {
  const slugs: string[] = ['strategic-memo-audit'];

  const hasMnaPattern = (caseStudy.toxicCombinations ?? []).some(t =>
    M_AND_A_PATTERN_LABELS.some(label => t.includes(label))
  );

  const isFinancial = caseStudy.industry === 'financial_services';
  const isFailure =
    caseStudy.outcome === 'catastrophic_failure' ||
    caseStudy.outcome === 'failure' ||
    caseStudy.outcome === 'partial_failure';

  if (hasMnaPattern) {
    slugs.push('m-and-a-bias-audit', 'ic-memo-pre-vote-audit');
  } else if (isFinancial && isFailure) {
    slugs.push('fund-investment-thesis-audit', 'decision-pre-mortem');
  } else if (isFailure) {
    slugs.push('decision-pre-mortem', 'board-deck-pre-presentation-audit');
  } else {
    // Success or partial — emphasize the prospective workflows
    slugs.push('decision-pre-mortem', 'board-deck-pre-presentation-audit');
  }

  // Resolve + dedup + cap at 3. Silent-drop unresolvable slugs so a
  // future workflow rename doesn't break the render.
  const seen = new Set<string>();
  return slugs
    .filter(s => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .map(s => getUseCaseBySlug(s))
    .filter((u): u is NonNullable<ReturnType<typeof getUseCaseBySlug>> => u != null)
    .slice(0, 3);
}

interface Props {
  caseStudy: CaseStudy;
}

export function CaseStudyWorkflowStrip({ caseStudy }: Props) {
  const workflows = pickWorkflows(caseStudy);
  if (workflows.length === 0) return null;

  return (
    <section
      style={{
        marginBottom: 40,
        padding: '24px 24px 28px',
        background: C.slate50,
        border: `1px solid #E2E8F0`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          background: 'rgba(22, 163, 74, 0.08)',
          color: C.green,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderRadius: 999,
          marginBottom: 14,
        }}
      >
        <Workflow size={12} />
        Audit your own decision
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.navy,
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
        }}
      >
        Workflows that fire on decisions like {caseStudy.company}&rsquo;s
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: '#475569', margin: '0 0 18px' }}>
        The same Recognition-Rigor Framework that documents this case audits memos in the same shape
        — before the outcome forces the lesson.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {workflows.map(u => (
          <Link
            key={u.slug}
            href={`/use/${u.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 16px',
              background: '#FFFFFF',
              border: `1px solid #E2E8F0`,
              borderTop: `3px solid ${C.green}`,
              borderRadius: 8,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {u.eyebrow}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
              {u.workflow}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: '#64748B',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 10,
                flex: 1,
              }}
            >
              {u.oneLiner}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: C.green,
              }}
            >
              {u.ctaLabel}
              <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#64748B' }}>
        See{' '}
        <Link href="/use" style={{ color: C.green, fontWeight: 600 }}>
          all 6 workflows
        </Link>{' '}
        for the full audit-tool surface.
      </div>
    </section>
  );
}
