/**
 * Bias Genome — Seed Dataset
 *
 * Pure functions that compute public-facing genome statistics from the
 * 33 curated case studies in `src/lib/data/case-studies/`. No database
 * access. No LLM calls. Fully deterministic and build-time-safe.
 *
 * This is the *seed* genome — published before real customer data is
 * available. As consenting orgs report outcomes, the live genome at
 * `/api/intelligence/bias-genome` will supplement and eventually
 * supersede these numbers. Every number here is traceable to the
 * underlying case-study records.
 */

import {
  ALL_CASES,
  isFailureOutcome,
  type CaseStudy,
  type Industry,
} from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BiasGenomeEntry {
  /** Bias key (snake_case), e.g. "confirmation_bias" */
  biasType: string;
  /** Human label, e.g. "Confirmation Bias" */
  label: string;
  /** Stable taxonomy ID (DI-B-001 …) — null if not in the published taxonomy */
  taxonomyId: string | null;
  /** # of cases (out of sampleTotal) in which this bias appears */
  sampleSize: number;
  /** Prevalence 0–1 — sampleSize / totalCases */
  prevalence: number;
  /** Failure rate when this bias is present, 0–1 */
  failureRate: number;
  /** (bias failure rate) / (baseline failure rate). 1.0 = no lift.
   *  > 1.0 = bias is associated with more failures than baseline.
   *  null when sampleSize < 3 (insufficient data). */
  failureLift: number | null;
  /** Mean impactScore (0–100) across failure cases with this bias. null if none. */
  avgFailureImpact: number | null;
  /** Most common toxic combination containing this bias (or null) */
  topToxicPattern: string | null;
  /** Industry where this bias shows up most often */
  topIndustry: Industry | null;
  /** Difficulty label from bias education, or null if untagged */
  difficulty: 'easy' | 'moderate' | 'hard' | null;
  /** Short 1-line insight derived from the data */
  insight: string;
}

export interface ToxicPatternEntry {
  name: string;
  description: string;
  biases: [string, string]; // the two biases in the pair (canonical)
  caseCount: number;
  caseExamples: Array<{ slug: string; company: string; year: number }>;
}

export interface BiasGenomeResult {
  meta: {
    totalCases: number;
    failureCases: number;
    successCases: number;
    baselineFailureRate: number;
    industriesCovered: Industry[];
    computedAt: string;
    dataSource: 'seed-case-studies';
  };
  entries: BiasGenomeEntry[];
  headline: {
    mostDangerous: BiasGenomeEntry | null;
    mostPrevalent: BiasGenomeEntry | null;
    mostCostly: BiasGenomeEntry | null;
    mostUnderestimated: BiasGenomeEntry | null;
  };
  toxicPatterns: ToxicPatternEntry[];
}

// ─── Toxic pair reference (mirrors CaseStudyBiasGraph.tsx) ─────────────────

const TOXIC_PAIR_DEFS: Record<string, { biases: [string, string]; description: string }> = {
  'Echo Chamber': {
    biases: ['confirmation_bias', 'groupthink'],
    description:
      'Confirmation bias amplified by unchallenged consensus. Teams hear what they already believe.',
  },
  'Sunk Ship': {
    biases: ['sunk_cost_fallacy', 'confirmation_bias'],
    description:
      "Past investment justifies continued commitment — the 'we're too deep to stop' pattern.",
  },
  'Blind Sprint': {
    biases: ['overconfidence_bias', 'planning_fallacy'],
    description: 'Overconfidence meets systematic underestimation of time and complexity.',
  },
  'Yes Committee': {
    biases: ['groupthink', 'authority_bias'],
    description:
      'Deference to authority suppresses dissent; decisions ratified rather than debated.',
  },
  'Optimism Trap': {
    biases: ['anchoring_bias', 'overconfidence_bias'],
    description:
      'Favorable initial estimates become reference points; downside scenarios are discounted.',
  },
  'Status Quo Lock': {
    biases: ['status_quo_bias', 'loss_aversion'],
    description: 'The fear of loss from any change outweighs the documented cost of inaction.',
  },
  'Doubling Down': {
    biases: ['sunk_cost_fallacy', 'loss_aversion'],
    description: 'Escalating commitment to a losing course to avoid realizing the loss.',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ Bias$/, ' Bias');
}

/** Convert bias-education keys to snake_case (types use both 'overconfidence' and 'overconfidence_bias') */
function normalizeBiasKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '_');
}

function getTaxonomyId(biasType: string): string | null {
  const normalized = normalizeBiasKey(biasType) as keyof typeof BIAS_EDUCATION;
  const entry = BIAS_EDUCATION[normalized];
  return entry?.taxonomyId ?? null;
}

function getDifficulty(biasType: string): 'easy' | 'moderate' | 'hard' | null {
  const normalized = normalizeBiasKey(biasType) as keyof typeof BIAS_EDUCATION;
  const entry = BIAS_EDUCATION[normalized];
  return entry?.difficulty ?? null;
}

// ─── Computation ───────────────────────────────────────────────────────────

export function computeGenomeFromSeed(): BiasGenomeResult {
  const totalCases = ALL_CASES.length;
  const failureCases = ALL_CASES.filter(c => isFailureOutcome(c.outcome));
  const successCases = totalCases - failureCases.length;
  const baselineFailureRate = failureCases.length / totalCases;

  // Count every bias appearance (one per case, dedupe intra-case via Set)
  const byBias = new Map<
    string,
    {
      cases: CaseStudy[];
      failures: CaseStudy[];
      toxicCooccurrence: Map<string, number>;
      industryCounts: Map<Industry, number>;
    }
  >();

  for (const c of ALL_CASES) {
    const isFailure = isFailureOutcome(c.outcome);
    const uniqueBiases = new Set(c.biasesPresent.map(normalizeBiasKey));

    for (const bias of uniqueBiases) {
      let bucket = byBias.get(bias);
      if (!bucket) {
        bucket = {
          cases: [],
          failures: [],
          toxicCooccurrence: new Map(),
          industryCounts: new Map(),
        };
        byBias.set(bias, bucket);
      }
      bucket.cases.push(c);
      if (isFailure) bucket.failures.push(c);
      bucket.industryCounts.set(c.industry, (bucket.industryCounts.get(c.industry) ?? 0) + 1);
      for (const pattern of c.toxicCombinations) {
        const def = TOXIC_PAIR_DEFS[pattern];
        if (def && (def.biases[0] === bias || def.biases[1] === bias)) {
          bucket.toxicCooccurrence.set(pattern, (bucket.toxicCooccurrence.get(pattern) ?? 0) + 1);
        }
      }
    }
  }

  const entries: BiasGenomeEntry[] = [];
  for (const [biasType, bucket] of byBias.entries()) {
    const sampleSize = bucket.cases.length;
    const failureRate = sampleSize > 0 ? bucket.failures.length / sampleSize : 0;
    const failureLift = sampleSize >= 3 ? failureRate / baselineFailureRate : null;

    const impacts = bucket.failures
      .map(c => c.impactScore)
      .filter((n): n is number => typeof n === 'number' && n > 0);
    const avgFailureImpact =
      impacts.length > 0 ? Math.round(impacts.reduce((a, b) => a + b, 0) / impacts.length) : null;

    let topToxicPattern: string | null = null;
    if (bucket.toxicCooccurrence.size > 0) {
      topToxicPattern = [...bucket.toxicCooccurrence.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    let topIndustry: Industry | null = null;
    if (bucket.industryCounts.size > 0) {
      topIndustry = [...bucket.industryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    const label = humanize(biasType);
    const taxonomyId = getTaxonomyId(biasType);
    const difficulty = getDifficulty(biasType);

    const insight = buildInsight({
      label,
      sampleSize,
      failureLift,
      topIndustry,
      topToxicPattern,
    });

    entries.push({
      biasType,
      label,
      taxonomyId,
      sampleSize,
      prevalence: sampleSize / totalCases,
      failureRate,
      failureLift,
      avgFailureImpact,
      topToxicPattern,
      topIndustry,
      difficulty,
      insight,
    });
  }

  // Sort by failureLift desc (nulls last), then sampleSize desc
  entries.sort((a, b) => {
    if (a.failureLift == null && b.failureLift == null) {
      return b.sampleSize - a.sampleSize;
    }
    if (a.failureLift == null) return 1;
    if (b.failureLift == null) return -1;
    return b.failureLift - a.failureLift;
  });

  // Headlines (only from entries with n>=5 to stay honest)
  const reliable = entries.filter(e => e.sampleSize >= 5);
  const mostDangerous =
    reliable
      .filter(e => e.failureLift != null)
      .sort((a, b) => (b.failureLift ?? 0) - (a.failureLift ?? 0))[0] ?? null;
  const mostPrevalent = [...entries].sort((a, b) => b.sampleSize - a.sampleSize)[0] ?? null;
  const mostCostly =
    reliable
      .filter(e => e.avgFailureImpact != null)
      .sort((a, b) => (b.avgFailureImpact ?? 0) - (a.avgFailureImpact ?? 0))[0] ?? null;
  // "Underestimated": lower prevalence but high lift (n>=3, prevalence<20%)
  const mostUnderestimated =
    entries
      .filter(e => e.failureLift != null && e.sampleSize >= 3 && e.prevalence < 0.2)
      .sort((a, b) => (b.failureLift ?? 0) - (a.failureLift ?? 0))[0] ?? null;

  // Toxic pattern summaries
  const toxicPatterns: ToxicPatternEntry[] = [];
  for (const [name, def] of Object.entries(TOXIC_PAIR_DEFS)) {
    const examples = ALL_CASES.filter(c => c.toxicCombinations.includes(name))
      .sort((a, b) => a.year - b.year)
      .slice(0, 3);
    toxicPatterns.push({
      name,
      description: def.description,
      biases: def.biases,
      caseCount: ALL_CASES.filter(c => c.toxicCombinations.includes(name)).length,
      caseExamples: examples.map(c => ({
        slug: slugFor(c),
        company: c.company,
        year: c.year,
      })),
    });
  }
  toxicPatterns.sort((a, b) => b.caseCount - a.caseCount);

  const industriesCovered = Array.from(
    new Set(ALL_CASES.map(c => c.industry))
  ).sort() as Industry[];

  return {
    meta: {
      totalCases,
      failureCases: failureCases.length,
      successCases,
      baselineFailureRate,
      industriesCovered,
      computedAt: new Date().toISOString().slice(0, 10),
      dataSource: 'seed-case-studies',
    },
    entries,
    headline: {
      mostDangerous,
      mostPrevalent,
      mostCostly,
      mostUnderestimated,
    },
    toxicPatterns,
  };
}

/** Filter entries to only those present in a specific industry. Recomputes
 *  per-industry numbers on the fly so we can honestly report "n=X in this
 *  industry" next to every stat. */
export function filterGenomeByIndustry(industry: Industry): BiasGenomeEntry[] {
  const industryCases = ALL_CASES.filter(c => c.industry === industry);
  const totalInIndustry = industryCases.length;
  const failureInIndustry = industryCases.filter(c => isFailureOutcome(c.outcome)).length;
  const baseline = totalInIndustry > 0 ? failureInIndustry / totalInIndustry : 0;

  const byBias = new Map<string, { cases: CaseStudy[]; failures: CaseStudy[] }>();
  for (const c of industryCases) {
    const isFailure = isFailureOutcome(c.outcome);
    const uniqueBiases = new Set(c.biasesPresent.map(normalizeBiasKey));
    for (const bias of uniqueBiases) {
      let bucket = byBias.get(bias);
      if (!bucket) {
        bucket = { cases: [], failures: [] };
        byBias.set(bias, bucket);
      }
      bucket.cases.push(c);
      if (isFailure) bucket.failures.push(c);
    }
  }

  const out: BiasGenomeEntry[] = [];
  for (const [biasType, bucket] of byBias.entries()) {
    const sampleSize = bucket.cases.length;
    const failureRate = bucket.failures.length / sampleSize;
    const failureLift = sampleSize >= 2 && baseline > 0 ? failureRate / baseline : null;
    const label = humanize(biasType);
    const insight = buildInsight({
      label,
      sampleSize,
      failureLift,
      topIndustry: industry,
      topToxicPattern: null,
    });
    out.push({
      biasType,
      label,
      taxonomyId: getTaxonomyId(biasType),
      sampleSize,
      prevalence: totalInIndustry > 0 ? sampleSize / totalInIndustry : 0,
      failureRate,
      failureLift,
      avgFailureImpact: null,
      topToxicPattern: null,
      topIndustry: industry,
      difficulty: getDifficulty(biasType),
      insight,
    });
  }
  out.sort((a, b) => b.sampleSize - a.sampleSize);
  return out;
}

// ─── Internal ──────────────────────────────────────────────────────────────

// Keep in sync with `getSlugForCase` — avoid importing it here to keep this
// module purely synchronous and tree-shakable at build time.
function slugFor(c: CaseStudy): string {
  return c.company
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\s+&\s+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildInsight(args: {
  label: string;
  sampleSize: number;
  failureLift: number | null;
  topIndustry: Industry | null;
  topToxicPattern: string | null;
}): string {
  if (args.sampleSize < 3) {
    return `Observed in ${args.sampleSize} case${args.sampleSize === 1 ? '' : 's'} — sample too small for a directional claim.`;
  }
  if (args.failureLift == null) {
    return `Observed in ${args.sampleSize} cases across the dataset.`;
  }
  const liftPhrase =
    args.failureLift >= 1.4
      ? `${args.failureLift.toFixed(1)}x baseline failure rate`
      : args.failureLift >= 1.05
        ? `modest failure lift vs baseline`
        : `no clear failure signal`;
  const combo = args.topToxicPattern ? ` · often paired in ${args.topToxicPattern}` : '';
  return `${liftPhrase} · n=${args.sampleSize}${combo}`;
}
