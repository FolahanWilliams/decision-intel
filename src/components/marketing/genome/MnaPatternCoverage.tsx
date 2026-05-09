/**
 * MnaPatternCoverage
 *
 * M&A workflow-native pattern coverage section on /bias-genome (locked
 * 2026-05-09). The three M&A toxic combinations (Synergy Mirage,
 * Conglomerate Fallacy, Winner's Curse) each get a dedicated column
 * surfacing the anchor cases tagged with that pattern from the
 * 143-case library. A Head of Corp Dev / PE Deal Partner landing on
 * the page sees: "here are 14 deals you've heard of, audited against
 * our 3 M&A patterns" — the procurement-grade authority signal that
 * converts a sceptical reader into a discovery call.
 *
 * Data flow: filters ALL_CASES by toxicCombinations.includes(pattern)
 * directly. No genome-shape change needed — the existing toxicPatterns
 * caseExamples is capped at 3 entries, this component shows the full
 * coverage list per pattern.
 */
import Link from 'next/link';
import { ALL_CASES, getSlugForCase } from '@/lib/data/case-studies';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  // M&A pattern colours — match ToxicNetworkGraph PATTERN_COLORS
  // (locked 2026-05-09 alongside the marketing cascade ship).
  violet: '#8B5CF6', // Synergy Mirage
  cyan: '#0891B2', // Conglomerate Fallacy
  rose: '#BE123C', // Winner's Curse
};

interface PatternMeta {
  name: string;
  shortLabel: string;
  mechanism: string;
  color: string;
  bias1: string;
  bias2: string;
}

const PATTERNS: PatternMeta[] = [
  {
    name: 'Synergy Mirage',
    shortLabel: 'Synergies without mechanism, owner, or 90-day milestone',
    mechanism:
      'Fires when projected synergies lack a NAMED OPERATIONAL MECHANISM, NAMED ACCOUNTABLE EXECUTIVE, and MEASURABLE 90-DAY MILESTONE. Per BCG integration best-practices, 70-90% of acquisitions miss projected synergies for exactly this gap.',
    color: C.violet,
    bias1: 'Overconfidence',
    bias2: 'Planning Fallacy',
  },
  {
    name: 'Conglomerate Fallacy',
    shortLabel: 'Far-adjacency without parenting thesis',
    mechanism:
      'Fires when an acquisition is justified primarily by target growth and brand halo, with no answer to Porter’s "why us as the best parent" question. Anchor failures: AOL-Time Warner, Daimler-Chrysler, Bed Bath & Beyond + Container Store.',
    color: C.cyan,
    bias1: 'Illusion of Validity',
    bias2: 'Halo Effect',
  },
  {
    name: "Winner's Curse",
    shortLabel: 'Auction-dynamic anchoring above intrinsic value',
    mechanism:
      'Fires on competitive-process language ("strategic necessity", "preempting competitor B", "we cannot let X get this asset") combined with monetaryStakes=high + timePressure=true. The deal-fever signal that pushed WeWork’s S-1 valuation and the post-2010 SPAC wave above defensible levels.',
    color: C.rose,
    bias1: 'Anchoring',
    bias2: 'Overconfidence',
  },
];

interface CaseEntry {
  company: string;
  year: number;
  slug: string;
  industry: string;
}

function casesForPattern(patternName: string): CaseEntry[] {
  return ALL_CASES.filter(c => c.toxicCombinations.includes(patternName))
    .sort((a, b) => b.year - a.year)
    .map(c => ({
      company: c.company,
      year: c.year,
      slug: getSlugForCase(c),
      industry: c.industry,
    }));
}

export function MnaPatternCoverage() {
  const coverage = PATTERNS.map(p => ({ ...p, cases: casesForPattern(p.name) }));
  const totalUniqueCases = new Set(
    coverage.flatMap(p => p.cases.map(c => c.slug))
  ).size;

  return (
    <section style={{ padding: '64px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.green,
            marginBottom: 12,
          }}
        >
          M&A workflow-native coverage · {totalUniqueCases} anchor cases
        </div>
        <h2
          style={{
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
            marginBottom: 12,
            color: C.slate900,
          }}
        >
          The three M&A patterns we audit for, with their anchor cases.
        </h2>
        <p
          style={{
            fontSize: 14.5,
            color: C.slate500,
            margin: 0,
            marginBottom: 28,
            maxWidth: 820,
            lineHeight: 1.6,
          }}
        >
          McKinsey + KPMG track 70-90% of acquisitions missing their projected synergies. The
          patterns that drive most of those failures are nameable, repeatable, and detectable
          before the IC vote. Each column below shows the named pattern, its mechanism, and every
          deal in our 143-case library tagged with it.
        </p>

        {/* Procurement stat strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
            padding: '20px 24px',
            background: C.slate100,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
          }}
        >
          <Stat value="70-90%" label="of M&A misses synergy projections" sub="McKinsey + KPMG" />
          <Stat
            value="9 types"
            label="of M&A artefacts recognised"
            sub="CIM · IC memo · QofE · synergy model · integration plan · term sheet · model · DD · counsel review"
          />
          <Stat
            value="5 toxic combos"
            label="fire on M&A workflows"
            sub="3 M&A-specific (Synergy Mirage / Conglomerate Fallacy / Winner&rsquo;s Curse) + Sunk Ship + Yes Committee"
          />
          <Stat
            value="EU AI Act"
            label="Art. 14 record-keeping"
            sub={'Aug 2026 enforcement — DPR maps onto Art. 14 by design'}
          />
        </div>

        {/* 3-column pattern coverage */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
          className="mna-pattern-grid"
        >
          {coverage.map(p => (
            <PatternColumn key={p.name} pattern={p} />
          ))}
        </div>

        {/* Forward-looking note */}
        <p
          style={{
            fontSize: 12.5,
            color: C.slate500,
            margin: '24px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.55,
            maxWidth: 820,
          }}
        >
          Coverage grows as the 143-case library expands. New patterns and anchors land in lockstep
          across the audit pipeline, the DPR, and this page. When a pattern&rsquo;s case count
          shows fewer entries than you expect, that&rsquo;s a tagging gap, not a detection gap
          &mdash; the engine catches the pattern; the library is still being annotated.
        </p>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .mna-pattern-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function PatternColumn({
  pattern,
}: {
  pattern: PatternMeta & { cases: CaseEntry[] };
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `4px solid ${pattern.color}`,
        borderRadius: 12,
        padding: '22px 22px 18px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h3
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: C.slate900,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {pattern.name}
        </h3>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: pattern.color,
            background: `${pattern.color}15`,
            padding: '2px 10px',
            borderRadius: 999,
            border: `1px solid ${pattern.color}40`,
          }}
        >
          {pattern.cases.length} {pattern.cases.length === 1 ? 'case' : 'cases'}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate400,
          marginBottom: 10,
        }}
      >
        {pattern.bias1} × {pattern.bias2}
      </div>
      <p
        style={{
          fontSize: 13.5,
          color: C.slate600,
          margin: 0,
          marginBottom: 14,
          lineHeight: 1.55,
        }}
      >
        {pattern.shortLabel}
      </p>
      <p
        style={{
          fontSize: 12.5,
          color: C.slate500,
          margin: 0,
          marginBottom: 16,
          lineHeight: 1.55,
        }}
      >
        {pattern.mechanism}
      </p>

      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 8,
          paddingTop: 12,
          borderTop: `1px solid ${C.slate100}`,
        }}
      >
        Tagged cases · sorted recent first
      </div>
      {pattern.cases.length === 0 ? (
        <p style={{ fontSize: 12.5, color: C.slate400, margin: 0, fontStyle: 'italic' }}>
          No cases tagged yet. Detection still fires; library annotation pending.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {pattern.cases.map(c => (
            <li key={c.slug} style={{ marginBottom: 4 }}>
              <Link
                href={`/case-studies/${c.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '6px 8px',
                  margin: '0 -8px',
                  fontSize: 13,
                  color: C.slate700,
                  textDecoration: 'none',
                  borderRadius: 6,
                }}
                className="mna-case-link"
              >
                <span style={{ fontWeight: 600 }}>{c.company}</span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: C.slate400,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {c.year}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .mna-case-link:hover {
          background: ${C.slate100};
          color: ${pattern.color} !important;
        }
      `}</style>
    </div>
  );
}

function Stat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: C.slate900,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.slate700, fontWeight: 600, lineHeight: 1.4 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.slate500, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
      )}
    </div>
  );
}
