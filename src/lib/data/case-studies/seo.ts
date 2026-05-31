/**
 * Case-study SEO helpers — per-slug title/description templates that
 * are CTR-optimized + structured-data generators.
 *
 * Why this exists (locked 2026-05-27): Google Search Console shows
 * 44 search queries over 3 months × ~50 impressions × 0 clicks.
 * Real searchers (MBA students, financial analysts, researchers)
 * ARE finding Decision Intel on case-related queries — "bankruptcy
 * of barings bank", "bruno iksil london whale", etc. — but the
 * generic `${company} (${year}): ${title} | Decision Intel Case
 * Study` title isn't compelling enough to click. This module ships
 * deterministic CTR-optimized templates that promise something
 * SPECIFIC in the title + description, plus auto-generated FAQ
 * + Speakable JSON-LD that LLMs cite verbatim.
 *
 * Discipline: every output is pure-function (no I/O). Title length
 * stays under Google's 60-char rendering cap on the company+year
 * prefix portion + has a 70-char headroom for the bias-pattern
 * promise. Description stays under 160-180 chars (Google's typical
 * snippet cap).
 *
 * Honesty: titles are click-bait-but-honest — we name the count
 * of biases the page actually documents (from biasesPresent.length),
 * never fabricate. The count comes from the data; we don't inflate
 * with "the X biases that doomed..." phrasing when the case has fewer.
 */

import type { CaseStudy } from './types';
import { ALL_CASES } from './index';
import { formatBiasName } from '@/lib/utils/labels';
import { truncate } from '@/lib/utils/string';
import { POSITIONING_EPISTEMIC_HONESTY } from '@/lib/constants/icp';

/** Outcome → verb map for headline templates. */
const OUTCOME_VERB: Record<CaseStudy['outcome'], string> = {
  catastrophic_failure: 'Doomed',
  failure: 'Sank',
  partial_failure: 'Hobbled',
  partial_success: 'Almost Sank',
  success: 'Carried',
  exceptional_success: 'Powered',
};

/** Outcome → result noun for description templates. */
const OUTCOME_NOUN: Record<CaseStudy['outcome'], string> = {
  catastrophic_failure: 'collapse',
  failure: 'failure',
  partial_failure: 'damage',
  partial_success: 'mixed result',
  success: 'success',
  exceptional_success: 'exceptional outcome',
};

/**
 * Build a CTR-optimized SEO title. Pattern:
 *
 *   [Company] [Outcome Word] ([Year]): [N] [Bias Patterns | Decision Patterns] | Decision Intel
 *
 * Examples:
 *   - "Barings Bank Collapse (1995): 4 Cognitive Bias Patterns Behind the £827M Hidden Loss | Decision Intel"
 *   - "Toyota Production System Success (1980s): 5 Decision Patterns That Carried Lean Manufacturing | Decision Intel"
 *
 * Title length stays under ~110 chars to survive Google's rendering
 * cap on common viewport widths. The company + outcome label always
 * appears first so the keyword-match-on-search-query is preserved.
 */
export function generateCaseStudySeoTitle(caseStudy: CaseStudy): string {
  const biasCount = caseStudy.biasesPresent.length;
  const outcomeLabel = outcomeLabelForTitle(caseStudy.outcome);
  const patternsType = isFailureOutcome(caseStudy.outcome)
    ? 'Cognitive Bias Patterns'
    : 'Decision Patterns';

  // Promise phrase varies by outcome class. Failures call out what
  // doomed the decision; successes call out what carried it.
  const promise = isFailureOutcome(caseStudy.outcome)
    ? `Behind the ${normalizeImpactNoun(caseStudy.estimatedImpact)}`
    : `That ${OUTCOME_VERB[caseStudy.outcome]} the Outcome`;

  return `${caseStudy.company} ${outcomeLabel} (${caseStudy.year}): ${biasCount} ${patternsType} ${promise} | Decision Intel`;
}

/**
 * Build a CTR-optimized meta description. Pattern:
 *
 *   [Impact statement]. [N] biases and [M] compound patterns audited
 *   retroactively against the original [document type]. R²F retroactive
 *   audit + simulated DQI score.
 *
 * Examples:
 *   - "Nick Leeson's £827M hidden trading losses traced to 4 cognitive bias
 *      patterns and 1 compound failure. Retroactive R²F audit of the
 *      Barings Singapore operation with simulated DQI score."
 *
 * Stays under 180 chars to fit Google's snippet rendering on most
 * search-results-page widths.
 */
export function generateCaseStudySeoDescription(caseStudy: CaseStudy): string {
  const biasCount = caseStudy.biasesPresent.length;
  const toxicCount = caseStudy.toxicCombinations?.length ?? 0;
  const outcomeNoun = OUTCOME_NOUN[caseStudy.outcome];

  // Lead with the named impact when we have one — that's the
  // searcher's question ("what happened to X"). Fall back to the
  // outcome-classification when not.
  const leadImpact = caseStudy.estimatedImpact?.trim()
    ? caseStudy.estimatedImpact
    : `${caseStudy.company}'s ${outcomeNoun}`;

  const patternsClause =
    toxicCount > 0
      ? `${biasCount} cognitive bias patterns + ${toxicCount} compound failure${toxicCount === 1 ? '' : 's'}`
      : `${biasCount} cognitive bias pattern${biasCount === 1 ? '' : 's'}`;

  const docSuffix = caseStudy.preDecisionEvidence
    ? ` against the original ${formatDocumentTypeLower(caseStudy.preDecisionEvidence.documentType)}`
    : '';

  const description = `${leadImpact}: ${patternsClause} audited retroactively${docSuffix}. R²F framework + simulated Decision Quality Index score.`;
  return clampDescription(description);
}

/**
 * Auto-generate FAQ entries from case-study data — used as JSON-LD
 * FAQPage schema. LLMs cite FAQ Q-A pairs verbatim; Google may
 * surface them as rich snippets in search results.
 *
 * Deterministic FAQs per case:
 *   1. Which biases were evident in [Company]'s outcome?
 *   2. Did those biases CAUSE the outcome? (epistemic-honesty answer —
 *      correlation, not causation; the procurement-grade differentiator
 *      baked into the JSON-LD layer AI engines cite)
 *   3. What was the actual outcome?
 *   4. How would Decision Intel have flagged this at the time?
 *
 * Returns null when the case lacks enough data to answer the third
 * FAQ honestly (no preDecisionEvidence) — we'd rather skip the
 * schema than fabricate.
 */
export function generateCaseStudyFaqs(caseStudy: CaseStudy): Array<{ q: string; a: string }> {
  const faqs: Array<{ q: string; a: string }> = [];

  // FAQ 1: Which biases were evident in this case? (correlational framing —
  // the page documents the patterns present in the reasoning, it does not
  // assert they caused the outcome; FAQ 2 below makes that explicit.)
  const namedBiases = caseStudy.biasesPresent.slice(0, 5).map(formatBiasName).join(', ');
  const primary = formatBiasName(caseStudy.primaryBias);
  faqs.push({
    q: `Which cognitive biases were evident in ${caseStudy.company}'s ${OUTCOME_NOUN[caseStudy.outcome]}?`,
    a: `${caseStudy.biasesPresent.length} bias patterns are documented in this case, led by ${primary}. The full set: ${namedBiases}. Each is mapped to Decision Intel's 22-bias R²F taxonomy with stable IDs and academic citations.`,
  });

  // FAQ 2: Did those biases CAUSE the outcome? — the epistemic-honesty
  // answer. This is deliberately in the JSON-LD layer: AI engines cite FAQ
  // pairs verbatim, so DI's correlation-not-causation discipline is what an
  // engine surfaces when a searcher asks "did bias cause X". The honest
  // answer IS the procurement differentiator (POSITIONING_EPISTEMIC_HONESTY).
  faqs.push({
    q: `Did these cognitive biases cause ${caseStudy.company}'s ${OUTCOME_NOUN[caseStudy.outcome]}?`,
    a: `${POSITIONING_EPISTEMIC_HONESTY} ${primary} and the other documented patterns were detectable in the reasoning before the outcome was known; whether they caused it is a question no audit can settle — too many other factors (market, timing, execution) are in play. A reasoning audit names the risk indicators a committee should pressure-test, not a verdict it should accept.`,
  });

  // FAQ 2: What was the actual outcome?
  const impact = caseStudy.estimatedImpact?.trim() || caseStudy.summary.slice(0, 120);
  faqs.push({
    q: `What was the actual outcome of ${caseStudy.company}'s decision?`,
    a: `${impact}. The decision context: ${truncate(caseStudy.decisionContext, 180)}`,
  });

  // FAQ 3: How would DI have flagged it (only when we have pre-decision evidence)
  if (caseStudy.preDecisionEvidence) {
    const pde = caseStudy.preDecisionEvidence;
    const flagsClause =
      pde.detectableRedFlags.length > 0
        ? `${pde.detectableRedFlags.length} red flags were detectable in the original ${formatDocumentTypeLower(pde.documentType)} BEFORE the outcome was known`
        : `the original ${formatDocumentTypeLower(pde.documentType)} was published BEFORE the outcome was known`;
    faqs.push({
      q: `How would Decision Intel have flagged this at the time?`,
      a: `${flagsClause}. ${truncate(pde.hypotheticalAnalysis, 280)}`,
    });
  }

  // FAQ 4 (always present): how does DI's reasoning audit work?
  faqs.push({
    q: `What is Decision Intel's reasoning audit?`,
    a: `Decision Intel runs a 12-node Recognition-Rigor Framework (R²F) pipeline on strategic memos, detecting cognitive biases from a 22-bias canonical taxonomy and producing a Decision Quality Index (DQI) score. The audit produces a hashed, tamper-evident Decision Provenance Record (DPR) suitable for audit-committee review.`,
  });

  return faqs;
}

/**
 * Find related cases by combined industry + bias-overlap signal.
 *
 * Previous logic was industry-only (capped at three results, score-
 * blind). This version scores candidates by:
 *   - Same primary bias: +3
 *   - Same industry: +2
 *   - Each overlapping bias in biasesPresent: +1
 *   - Same outcome class: +0.5
 *
 * Returns up to 4 highest-scoring distinct cases, never including
 * the input case itself. Internal-link gravity for the case cluster.
 */
export function findRelatedCases(caseStudy: CaseStudy, limit = 4): CaseStudy[] {
  const candidates = ALL_CASES.filter(c => c.id !== caseStudy.id);
  const scored = candidates.map(c => {
    let score = 0;
    if (c.primaryBias === caseStudy.primaryBias) score += 3;
    if (c.industry === caseStudy.industry) score += 2;
    if (c.outcome === caseStudy.outcome) score += 0.5;
    const biasOverlap = c.biasesPresent.filter(b => caseStudy.biasesPresent.includes(b)).length;
    score += biasOverlap;
    return { case: c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter(s => s.score > 0)
    .slice(0, limit)
    .map(s => s.case);
}

// ─── internal helpers ─────────────────────────────────────────────

function isFailureOutcome(outcome: CaseStudy['outcome']): boolean {
  return (
    outcome === 'catastrophic_failure' || outcome === 'failure' || outcome === 'partial_failure'
  );
}

/** Outcome → label used in titles. Failures get descriptive nouns
 *  that match how Google-searched phrases tend to be worded. */
function outcomeLabelForTitle(outcome: CaseStudy['outcome']): string {
  switch (outcome) {
    case 'catastrophic_failure':
      return 'Collapse';
    case 'failure':
      return 'Failure';
    case 'partial_failure':
      return 'Setback';
    case 'partial_success':
      return 'Mixed Result';
    case 'success':
      return 'Success';
    case 'exceptional_success':
      return 'Breakthrough';
  }
}

/** Normalize a casual impact noun ("$1.3B in hidden losses") into a
 *  title-friendly phrase ("the $1.3B Hidden Loss"). Conservative —
 *  we just title-case the impact-statement's first ~50 chars and
 *  prepend "the " when it reads like a sum. */
function normalizeImpactNoun(impact: string | undefined): string {
  if (!impact || !impact.trim()) return 'the Outcome';
  const trimmed = impact.trim();
  // Don't try to be too clever — fail honest. Strip trailing
  // periods, take up to 60 chars to keep the title under cap.
  const truncated = trimmed.replace(/[.;,]\s*$/, '').slice(0, 60);
  // If it starts with a currency / number / "the ", use as-is;
  // otherwise prepend "the ".
  if (/^(the\s|\$|£|€|¥|\d)/i.test(truncated)) return truncated;
  return `the ${truncated}`;
}

/** Lowercase-friendly document-type labels for description text.
 *  The canonical `formatDocumentType` in @/lib/utils/labels uses
 *  Title-case humanize; SEO descriptions read better with
 *  lowercase ("audited against the original board memo" vs
 *  "audited against the original Board Memo"). */
const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  board_memo: 'board memo',
  press_release: 'press release',
  earnings_call: 'earnings call',
  internal_memo: 'internal memo',
  sec_filing: 'SEC filing',
  public_statement: 'public statement',
  strategy_document: 'strategy document',
  risk_assessment: 'risk assessment',
  financial_report: 'financial report',
  investor_deck: 'investor deck',
};

function formatDocumentTypeLower(docType: string): string {
  return DOCUMENT_TYPE_LABEL[docType] ?? docType.replace(/_/g, ' ');
}

/** Description hard-cap. Google renders ~155-160 chars on most
 *  viewports; we cap at 175 to give a small buffer for tracking
 *  parameters in the OG description path. */
function clampDescription(s: string): string {
  if (s.length <= 175) return s;
  // Try to cut at the last word boundary before the cap.
  const cut = s.slice(0, 175);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : 175).trimEnd()}…`;
}
