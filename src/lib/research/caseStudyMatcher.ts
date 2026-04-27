/**
 * Case Study Matcher
 *
 * Matches detected bias patterns against the unified case study database
 * (both failures and successes) to surface historical parallels.
 *
 * Uses normalized bias name comparison, context similarity scoring,
 * and returns both failure warnings and success exemplars.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { ALL_CASES, isFailureOutcome, isSuccessOutcome } from '@/lib/data/case-studies';
import type { CaseStudy } from '@/lib/data/case-studies';

const log = createLogger('CaseStudyMatcher');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CaseStudyMatch {
  company: string;
  title: string;
  year: number | null;
  summary: string;
  biasTypes: string[];
  outcome: string;
  lessons: string;
  industry: string | null;
  /** Whether this is a failure or success parallel */
  outcomeDirection: 'failure' | 'success';
  /** Match relevance score (higher = more relevant) */
  matchScore: number;
  /** Which biases matched */
  matchedBiases: string[];
  /** Estimated impact (if available) */
  estimatedImpact?: string;
}

// ─── Bias Name Normalization ────────────────────────────────────────────────
// Unifies bias names across systems: 'authority' → 'authority_bias',
// 'sunk_cost' → 'sunk_cost_fallacy', etc.

const BIAS_ALIASES: Record<string, string> = {
  authority: 'authority_bias',
  anchoring: 'anchoring_bias',
  overconfidence: 'overconfidence_bias',
  confirmation: 'confirmation_bias',
  sunk_cost: 'sunk_cost_fallacy',
  status_quo: 'status_quo_bias',
  loss_aversion: 'loss_aversion',
  groupthink: 'groupthink',
  bandwagon: 'bandwagon_effect',
  framing: 'framing_effect',
  recency: 'recency_bias',
  selective_perception: 'selective_perception',
  cognitive_misering: 'cognitive_misering',
  halo_effect: 'halo_effect',
  planning_fallacy: 'planning_fallacy',
  gamblers_fallacy: 'gamblers_fallacy',
  availability_heuristic: 'availability_heuristic',
};

/**
 * Normalize a bias type string to the canonical form used in case studies.
 */
export function normalizeBiasType(bias: string): string {
  const lower = bias.toLowerCase().trim().replace(/\s+/g, '_');
  return BIAS_ALIASES[lower] ?? lower;
}

/**
 * Check if two bias type strings refer to the same bias (with normalization).
 */
function biasesMatch(a: string, b: string): boolean {
  return normalizeBiasType(a) === normalizeBiasType(b);
}

// ─── Case Study to Match Format ─────────────────────────────────────────────

function caseToMatch(c: CaseStudy, matchScore: number, matchedBiases: string[]): CaseStudyMatch {
  return {
    company: c.company,
    title: c.title,
    year: c.year,
    summary: c.summary,
    biasTypes: c.biasesPresent,
    outcome: c.outcome,
    lessons: c.lessonsLearned.join(' '),
    industry: c.industry,
    outcomeDirection: isFailureOutcome(c.outcome) ? 'failure' : 'success',
    matchScore,
    matchedBiases,
    estimatedImpact: c.estimatedImpact,
  };
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Seed all unified case studies into the DB if not already present.
 * Called lazily on first match request.
 */
let seeded = false;
async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  const count = await prisma.caseStudy.count();
  if (count >= ALL_CASES.length) {
    seeded = true;
    return;
  }

  log.info(`Seeding case study database with ${ALL_CASES.length} unified cases...`);
  for (const cs of ALL_CASES) {
    try {
      await prisma.caseStudy.upsert({
        where: { id: cs.id },
        update: {
          company: cs.company,
          title: cs.title,
          year: cs.year,
          summary: cs.summary,
          biasTypes: cs.biasesPresent,
          outcome: cs.outcome,
          lessons: cs.lessonsLearned.join('\n'),
          industry: cs.industry,
        },
        create: {
          id: cs.id,
          company: cs.company,
          title: cs.title,
          year: cs.year,
          summary: cs.summary,
          biasTypes: cs.biasesPresent,
          outcome: cs.outcome,
          lessons: cs.lessonsLearned.join('\n'),
          industry: cs.industry,
        },
      });
    } catch (err) {
      // Upsert may fail on concurrent seed attempts — log and continue per CLAUDE.md fire-and-forget discipline.
      log.warn(`caseStudy upsert failed for ${cs.id} (continuing):`, err);
    }
  }
  seeded = true;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Find case studies that match the detected bias types.
 * Returns both failure warnings and success exemplars.
 *
 * Scoring:
 * - Bias overlap (normalized): +2 per matching bias
 * - Industry match: +1.5
 * - Divergent outcome (success when biases detected): +1 bonus (more educational)
 * - Context similarity: +0.5 per matching context factor
 *
 * @param detectedBiases Array of bias type strings found in the document
 * @param industry Optional industry to prioritize sector-relevant cases
 * @param limit Max results to return
 */
export async function matchCaseStudies(
  detectedBiases: string[],
  industry?: string,
  limit: number = 5
): Promise<CaseStudyMatch[]> {
  await ensureSeeded();

  if (detectedBiases.length === 0) return [];

  const normalizedInput = detectedBiases.map(normalizeBiasType);

  // Score all cases from the unified database against detected biases
  const scored: CaseStudyMatch[] = [];

  for (const cs of ALL_CASES) {
    const matchedBiases: string[] = [];

    for (const caseBias of cs.biasesPresent) {
      if (normalizedInput.some(inputBias => biasesMatch(inputBias, caseBias))) {
        matchedBiases.push(caseBias);
      }
    }

    if (matchedBiases.length === 0) continue;

    // Compute score
    let score = matchedBiases.length * 2;

    // Industry bonus
    if (industry && cs.industry.toLowerCase() === industry.toLowerCase()) {
      score += 1.5;
    }

    // Divergent outcome bonus: success cases with same biases are more educational
    if (isSuccessOutcome(cs.outcome)) {
      score += 1;
    }

    // Overlap ratio bonus: reward cases where a higher fraction of their biases match
    const overlapRatio = matchedBiases.length / cs.biasesPresent.length;
    score += overlapRatio;

    scored.push(caseToMatch(cs, Math.round(score * 10) / 10, matchedBiases));
  }

  // Sort by score (descending), then by year (most recent first)
  scored.sort((a, b) => b.matchScore - a.matchScore || (b.year || 0) - (a.year || 0));

  // Ensure mix of failure and success if available
  const failures = scored.filter(s => s.outcomeDirection === 'failure');
  const successes = scored.filter(s => s.outcomeDirection === 'success');

  // Return top results, ensuring at least 1 success if available
  if (successes.length > 0 && failures.length > 0 && limit >= 3) {
    const topFailures = failures.slice(0, Math.ceil(limit * 0.6));
    const topSuccesses = successes.slice(0, Math.floor(limit * 0.4) || 1);
    const mixed = [...topFailures, ...topSuccesses];
    mixed.sort((a, b) => b.matchScore - a.matchScore);
    return mixed.slice(0, limit);
  }

  return scored.slice(0, limit);
}

/**
 * Match case studies from the in-memory database directly (no DB required).
 * Useful for scoring contexts where Prisma may not be available.
 */
export function matchCaseStudiesSync(
  detectedBiases: string[],
  industry?: string,
  limit: number = 5
): CaseStudyMatch[] {
  if (detectedBiases.length === 0) return [];

  const normalizedInput = detectedBiases.map(normalizeBiasType);
  const scored: CaseStudyMatch[] = [];

  for (const cs of ALL_CASES) {
    const matchedBiases: string[] = [];
    for (const caseBias of cs.biasesPresent) {
      if (normalizedInput.some(inputBias => biasesMatch(inputBias, caseBias))) {
        matchedBiases.push(caseBias);
      }
    }
    if (matchedBiases.length === 0) continue;

    let score = matchedBiases.length * 2;
    if (industry && cs.industry.toLowerCase() === industry.toLowerCase()) score += 1.5;
    if (isSuccessOutcome(cs.outcome)) score += 1;
    score += matchedBiases.length / cs.biasesPresent.length;

    scored.push(caseToMatch(cs, Math.round(score * 10) / 10, matchedBiases));
  }

  scored.sort((a, b) => b.matchScore - a.matchScore || (b.year || 0) - (a.year || 0));
  return scored.slice(0, limit);
}
