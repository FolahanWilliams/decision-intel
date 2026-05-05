/**
 * Hardening-question template library — indexed by bias type.
 *
 * Locked 2026-05-05 (Phase 3 of the DPR rebuild). Per master KB synthesis:
 * audit committees do not want passive findings; they want actionable
 * levers. Every flagged bias on the DPR must carry an "audit-committee-
 * ready hardening question a reviewer should be able to answer before
 * capital commitment" — a single, concrete, answerable question that
 * forces the memo author to anchor confidence against base rates,
 * reference classes, or external evidence.
 *
 * The library is template-based, NOT LLM-generated per audit (per CLAUDE.md
 * locked decision). Reasoning: (a) zero per-audit cost, (b) deterministic
 * output a procurement reviewer can audit independently, (c) consistent
 * vocabulary across audits the same firm reads quarter-over-quarter.
 *
 * Forward-looking rule: when a new bias is added to BIAS_EDUCATION
 * (DI-B-NNN), add the matching hardening question here in the same
 * commit. Falling back to GENERIC produces a usable but blunt question;
 * the per-bias version lands harder.
 */

export interface HardeningQuestion {
  /** The question itself — verbatim, as it renders on the DPR. */
  question: string;
  /**
   * Why this question matters — one sentence the procurement reader sees
   * below the question, anchoring it to academic / regulatory precedent.
   */
  rationale: string;
}

const GENERIC: HardeningQuestion = {
  question:
    'What is the explicit base-rate evidence the memo cites against this claim, and how does the recommendation change if that base-rate were drawn from an independent reference class?',
  rationale:
    'Per Kahneman & Lovallo (2003), the inside-view narrative ALWAYS feels more compelling than the outside-view base rate — but the base rate wins on average.',
};

const TABLE: Record<string, HardeningQuestion> = {
  confirmation_bias: {
    question:
      'Which two pieces of disconfirming evidence did the memo author actively seek out, and what would change in the recommendation if either turned out to be true?',
    rationale:
      'Per Nickerson (1998), confirmation bias is rarely visible to the author. The reviewer\'s discipline is to demand evidence the author would NOT have surfaced naturally.',
  },
  anchoring_bias: {
    question:
      'Which numeric anchor in the memo (TAM, valuation, break-even, comparable transaction) was selected first, and what does the analysis look like with three alternative anchors drawn from independent sources?',
    rationale:
      'Per Tversky & Kahneman (1974), the first anchor introduced into a discussion captures subsequent reasoning. The reviewer\'s discipline: re-anchor before deciding.',
  },
  sunk_cost_fallacy: {
    question:
      'If the prior investment in this option were zero, would the memo still recommend continuing? If not, which present-day cost is the recommendation actually defending?',
    rationale:
      'Per Arkes & Blumer (1985), the sunk-cost discipline is the present-value reset: every recommendation must defend itself on forward economics, not on capital already committed.',
  },
  overconfidence_bias: {
    question:
      'What is the explicit confidence interval around the headline projection, and what reference-class data was used to set the interval bounds?',
    rationale:
      'Per Kahneman & Tversky (1979), overconfidence is most dangerous when it is unstated. Forcing an explicit CI surfaces the gap between point estimate and reality.',
  },
  illusion_of_validity: {
    question:
      'Which specific feature of this case (industry, deal size, regulatory regime, market structure) makes the matched-class base rate inapplicable, and what evidence supports that exclusion?',
    rationale:
      'Per Kahneman & Klein (2009), narrative coherence creates false confidence. The reviewer\'s discipline is to force the memo to defend why the outside-view evidence does NOT apply.',
  },
  inside_view_dominance: {
    question:
      'List five comparable historical decisions of similar shape and the realised outcome of each. If the matched-class outcome distribution is unfavourable, what is the explicit basis for departing from it?',
    rationale:
      'Per Kahneman & Lovallo (2003), the inside view ignores reference-class data because the case "feels special." The hardening discipline forces the comparison the inside view skipped.',
  },
  narrative_fallacy: {
    question:
      'Strip the memo of every causal claim that uses "because", "drove", "led to", or "caused by" and re-state the recommendation. Does the conclusion still hold without the narrative scaffolding?',
    rationale:
      'Per Taleb (2007), the narrative fallacy lets coherent stories masquerade as evidence. The hardening discipline tests whether the recommendation survives without the story.',
  },
  authority_bias: {
    question:
      'Which independent verification of the cited authority (deal terms, audit findings, board minutes, regulator engagement) does the memo carry, and what changes if that verification is inconsistent with the authority\'s representation?',
    rationale:
      'Per Cialdini (1984) + Theranos / FTX cases, presence of a Tier-1 backer is not evidence of correctness. The reviewer\'s discipline is to demand independent verification.',
  },
  halo_effect: {
    question:
      'List three SPECIFIC weaknesses of the management team or deal structure that the memo could have surfaced but did not. If the author cannot identify any, what is the basis for the unqualified positive framing?',
    rationale:
      'Per Thorndike (1920) + Theranos investor decisions, positive signal on one dimension propagates to ALL dimensions unchallenged. The discipline is forced negative-symmetry.',
  },
  planning_fallacy: {
    question:
      'What is the realised-vs-planned ratio for the THREE most-recent comparable initiatives at this firm or in this industry, and what is the basis for assuming this initiative will out-perform that ratio?',
    rationale:
      'Per Kahneman & Tversky (1979) + Buehler et al. (1994) + Quibi case, planned timelines + budgets are systematically optimistic. Realised-vs-planned ratios are the discipline.',
  },
  optimism_bias: {
    question:
      'For each headline projection, what is the explicit downside scenario, the probability assigned to it, and the threshold at which the recommendation would reverse?',
    rationale:
      'Per Sharot (2011) + Boeing 737 MAX case, optimism bias underweights catastrophic-tail risk. Forcing explicit downside scenarios surfaces the asymmetric exposure.',
  },
  loss_aversion: {
    question:
      'Reframe the recommendation as a fresh allocation on current data — would the memo still recommend this position if the existing exposure were zero? If not, what part of the recommendation is defending sunk exposure?',
    rationale:
      'Per Kahneman & Tversky (1979) + LTCM case, loss aversion produces "double down" framing on positions that should be evaluated as fresh allocations.',
  },
  status_quo_bias: {
    question:
      'Which two structural changes in the market or operating environment over the past 24 months would justify deviating from the current strategy, and what evidence does the memo carry on each?',
    rationale:
      'Per Samuelson & Zeckhauser (1988) + Sears retail case, status quo bias defends legacy positions past the point where peers have pivoted. The discipline is forced exogenous-change analysis.',
  },
  availability_bias: {
    question:
      'Which recent high-salience event (M&A miss, regulatory enforcement, peer outcome) is the memo over-weighting in its base-rate analysis, and what is the actual long-run frequency of that event?',
    rationale:
      'Per Tversky & Kahneman (1973), recent vivid events distort base-rate perception. The hardening discipline pulls the analysis back to long-run frequency.',
  },
  groupthink: {
    question:
      'Which committee member voiced a dissenting view on this recommendation, what was their specific concern, and how does the memo address it? If no dissent was recorded, what is the explicit basis for assuming consensus is correctness?',
    rationale:
      'Per Janis (1972), absence of dissent is rarely evidence of correctness. The discipline is to record dissent or surface its absence.',
  },
};

export function getHardeningQuestion(biasType: string): HardeningQuestion {
  return TABLE[biasType] ?? GENERIC;
}
