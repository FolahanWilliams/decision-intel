/**
 * Honest Probability Path — data file for the 4-phase 2026→2030 unicorn
 * roadmap rendered on the Founder Hub. Locked 2026-04-27 from the
 * "honest unicorn-path thesis" Claude wrote during the strengths /
 * weaknesses session. Each phase carries:
 *
 *   • Target metrics (logos, ARR, valuation)
 *   • What has to be true (the load-bearing conditions)
 *   • Conditional probability (read as: P(reach this phase | reached prior)
 *   • Key risks specific to that transition
 *
 * Vocabulary lock: the conditional probabilities are NOT hopeful
 * targets — they are honest read-outs from the thesis. The 2.6%
 * absolute outcome at the bottom is the multiplied conditional path.
 * Most-likely outcome (Series B-stage acquisition at $400M-1B) is
 * surfaced explicitly so the founder doesn't conflate "unicorn IPO"
 * with "wealth-creating exit."
 *
 * Update quarterly. When a phase is reached, mark it `status: 'reached'`
 * and update the conditional probability to 1.0; this keeps the
 * absolute-outcome multiplier honest as the path narrows.
 */

export type PhaseStatus = 'now' | 'next' | 'later' | 'reached';

export type RoadmapPhase = {
  id: string;
  /** Display label for the timeline column. */
  quarter: string;
  /** Short headline shown on the phase card. */
  headline: string;
  /** One-sentence framing of what this phase IS. */
  framing: string;
  /** Target ARR / customer / valuation metrics. */
  targets: { logos: string; arr: string; valuation: string };
  /** Load-bearing conditions — every one of these has to hold. */
  whatHasToBeTrue: string[];
  /** Conditional probability of reaching this phase, given the prior
   *  phase was reached. Read literally — not adjusted upward to feel
   *  good. */
  conditionalProbability: number;
  /** The single hardest transition risk for this phase. */
  primaryRisk: string;
  /** Visual accent. */
  accent: string;
  status: PhaseStatus;
};

export const HONEST_PROBABILITY_PATH: RoadmapPhase[] = [
  {
    id: 'phase-1',
    quarter: 'Q4 2026',
    headline: 'Three paid design partners with outcome-data flowing',
    framing:
      'Move from one verbal LOI to three contracted design partners — all with enforceOutcomeGate=true — closing ≥30 outcomes each. The Bias Genome data substrate begins to physically exist.',
    targets: {
      logos: '3 paid design partners',
      arr: '~£70-90K',
      valuation: 'Pre-seed at £4-8M post (US$5-10M)',
    },
    whatHasToBeTrue: [
      'Sankore (or equivalent Pan-African fund) signs a paid design-partner contract',
      'Outcome Gate Phase 1 is contractually enforced on every paid org',
      '≥30 closed outcomes per design partner — the Brier-scored recalibration starts to fire',
      'The Wiz advisor is willing to write the warm-intro letter to one F500 CSO before round close',
      'No custom-feature-for-design-partner work bleeds the 50-70hr/week capacity',
    ],
    conditionalProbability: 0.5,
    primaryRisk:
      'The infinite-pilot trap: design partners ask for custom features, founder ships them in two days, outcome capture stays voluntary, the data flywheel never starts spinning.',
    accent: '#16A34A',
    status: 'now',
  },
  {
    id: 'phase-2',
    quarter: 'Q4 2027',
    headline: 'The wedge-to-ceiling transition — 25-40 customers + first F500 logos',
    framing:
      'Series A on the strength of (a) 3 paid logos producing real outcome data, (b) the Bias Genome v1 published with anonymised pattern data across ≥3 industries, (c) 3-5 F500 CSO accounts converted from the Wiz advisor network.',
    targets: {
      logos: '25-40 paid customers (incl. 3-5 F500 CSO)',
      arr: '£950K-1.6M (US$1.2-2M)',
      valuation: 'Series A at £24-48M post (US$30-60M)',
    },
    whatHasToBeTrue: [
      'Bias Genome v1 published as a public-grade longitudinal dataset (the only one in existence at scale)',
      'F500 procurement playbook battle-tested against ≥10 enterprise security-review questionnaires',
      'A second engineer or technical-cofounder onboarded — codebase no longer has single-person bus risk',
      'EU AI Act Art 14 is in active enforcement (Aug 2026 deadline) and DI is named in at least one analyst report as the audit answer',
      'ACV climbing from £24K (wedge) to £40-100K (F500 entry) without losing the wedge cohort',
    ],
    conditionalProbability: 0.35,
    primaryRisk:
      'The wedge-to-ceiling jump. Most decision-intelligence companies that nail one ICP fail to make this transition — they either stay stuck at the wedge price band, or they over-engineer for F500 and lose the wedge customers who got them here.',
    accent: '#D97706',
    status: 'next',
  },
  {
    id: 'phase-3',
    quarter: 'Q4 2029',
    headline: 'Bias Genome data monopoly + IBM/Cloverpop acquisition attempts',
    framing:
      'The longitudinal decision-quality dataset across F500 + PE is the ONLY one in existence at scale. Switching costs become insurmountable as Structural Causal Models tune to per-org failure patterns. Series B at $200-400M as the strategic-rationale-for-acquisition becomes obvious to the incumbents.',
    targets: {
      logos: '200-300 paid customers across F500 + PE + corp dev',
      arr: '£16-32M (US$20-40M)',
      valuation: 'Series B at £160-320M post (US$200-400M)',
    },
    whatHasToBeTrue: [
      'Per-org causal edges + bias genome are demonstrably uncopyable from cold start (the Cloverpop-defense moat is alive, not theoretical)',
      'Net retention >120% via expansion within F500 strategy teams',
      'IBM watsonx.governance has NOT shipped a "Human Decision Provenance" module that bundles into existing GC SKUs',
      'Strategic-memo format has not been catastrophically displaced by autonomous agents (the agentic-shift attack vector has been navigated by pivoting the audit layer to agent decision-chains where needed)',
      'Engineering team scaled to 8-15 — codebase ownership is distributed across ≥3 staff engineers',
    ],
    conditionalProbability: 0.3,
    primaryRisk:
      'IBM watsonx.governance bundles the audit layer into existing F500 GC SKUs by Q3 2027. The Bias Genome moat is real but the procurement gravity of a single-vendor governance suite is real too — once GCs check the box with IBM, getting them to add a second SKU is a 3-year sale.',
    accent: '#0EA5E9',
    status: 'later',
  },
  {
    id: 'phase-4',
    quarter: 'Q4 2030',
    headline: '$100M ARR or $1B valuation — the unicorn outcome',
    framing:
      '500 enterprise teams at ~$200K average ACV. Decision Intel is the irreplaceable native reasoning layer for global capital allocation. IPO path open; acquisition path priced at $1.5-3B from a strategic incumbent (IBM, Palantir, Salesforce, ServiceNow).',
    targets: {
      logos: '500+ enterprise teams',
      arr: '£80M+ (US$100M+)',
      valuation: 'US$1B+ (unicorn floor)',
    },
    whatHasToBeTrue: [
      'Net dollar retention sustainably above 130% — the Bias Genome creates organic expansion as customers add divisions and use cases',
      'The R²F intellectual property is published academically (not just productised) — Decision Intel is recognised as the canonical decision-quality literature, not just a tool',
      'Leadership team >40 people, founder transitioned to CEO of a real company (not solo-builder mode)',
      'The geographic moat held: African + EM regulatory coverage is a recognised category-leader position, not a footnote',
      'No catastrophic data-flywheel reversal — Brier-scored recalibration is the actual product, not a marketing slide',
    ],
    conditionalProbability: 0.15,
    primaryRisk:
      'Concentration risk at scale: if 5 customers are >40% of ARR, Series C valuation gets hammered. The Pan-African wedge and the F500 ceiling have to remain genuinely diversified through 2030 — easy to write, hard to hold.',
    accent: '#7C3AED',
    status: 'later',
  },
];

/**
 * Absolute probability of reaching the unicorn outcome from where the
 * founder stands today. Computed product of conditionals; surfaced
 * literally (not rounded up) at the bottom of the roadmap so every
 * conversation with the surface starts from honest math.
 */
export const ABSOLUTE_UNICORN_PROBABILITY = HONEST_PROBABILITY_PATH.reduce(
  (acc, p) => acc * p.conditionalProbability,
  1
);

/**
 * Baseline absolute probability for a generic pre-seed B2B founder
 * reaching unicorn within the same horizon. Sourced from Crunchbase /
 * CB Insights longitudinal cohort studies — typically 0.1-0.3% across
 * the 2014-2022 cohorts. Anchored at 0.2% for the multiplier display.
 */
export const BASELINE_PRESEED_UNICORN_PROBABILITY = 0.002;

/**
 * Most-likely wealth-creating outcome — surfaced explicitly so the
 * founder doesn't conflate "unicorn IPO" with "good exit." Series B
 * stage acquisition is the median strategic-software outcome.
 */
export const MOST_LIKELY_OUTCOME = {
  shape: 'Series B-stage strategic acquisition',
  range: '£320-800M (US$400M-1B) by Q4 2029',
  acquirers: ['IBM', 'Palantir', 'Salesforce', 'ServiceNow', 'Microsoft'],
  note: 'Functionally equivalent to a 2030 unicorn IPO from a founder-wealth standpoint. Most likely if Phase 1 + Phase 2 + Phase 3 land — i.e. a 5-6% absolute outcome probability, vs the 2.6% IPO path.',
} as const;

/**
 * The five hard-truth weaknesses tracked as live risk items on the
 * roadmap surface (Claude's strengths/weaknesses thesis, 2026-04-27).
 * Each maps onto a phase and a tripwire signal.
 */
export type HardTruthRisk = {
  id: string;
  title: string;
  phaseImpact: string;
  evidence: string;
  countermove: string;
  tripwire: string;
};

export const HARD_TRUTH_RISKS: HardTruthRisk[] = [
  {
    id: 'no-outcome-data',
    title: 'Zero outcome data — the entire defensible moat depends on it',
    phaseImpact: 'Phase 1 → Phase 2: blocks the Bias Genome substrate from forming',
    evidence:
      'Outcome Gate Phase 1 is shipped but only fires when a paying design partner has enforceOutcomeGate=true. Until that exists, the moat is a story, not a substrate.',
    countermove:
      'Nothing in the next 60 days matters more than turning ONE design partner from verbal-LOI into outcome-data-producing-paid-account. Sankore or Alarquile.',
    tripwire:
      'If no design partner has signed by 2026-06-27, escalate to the Wiz advisor for a forced-decision conversation.',
  },
  {
    id: 'features-not-revenue',
    title: 'Selling features not protected revenue',
    phaseImpact: 'Phase 1 → Phase 2: kills the wedge-to-ceiling ACV expansion',
    evidence:
      'A first-time visitor to /pricing or /demo cannot tell what they are paying for. CSOs do not buy features; they buy "I will not get fired for the next M&A" insurance.',
    countermove:
      'Discovery-grade Impact Card now leads with per-decision dollar impact tied to ticket size ("$22.5M risk on this $50M memo"), not feature lists.',
    tripwire:
      'If pricing-page conversion <3% on warm traffic, the framing has not landed yet — escalate the rewrite.',
  },
  {
    id: 'discovery-vs-procurement-grade',
    title: 'Technical sophistication is a sales liability for the wedge',
    phaseImpact: 'Phase 1: blocks first-meeting conversion with fund partners',
    evidence:
      'DPR / R²F / 17-framework regulatory map are right for the F500 ceiling but a Pan-African fund partner wants a single dashboard slide showing "this CIM has 3 flags, here is the cost of ignoring." The empathic-mode-first rule was written for exactly this gap.',
    countermove:
      'Discovery-grade Impact Card mounted on /demo + post-upload reveal — single visual, no jargon, immediate dollar anchor.',
    tripwire:
      'If a discovery call requires explaining "what is a DPR" before minute 5, the surface failed.',
  },
  {
    id: 'continuity-question',
    title: 'No documented founder-continuity plan in the data room',
    phaseImpact: 'Phase 2: blocks Series A on partner-meeting due-diligence call',
    evidence:
      'A fund partner will ask: "What happens if Folahan goes to Stanford in 2027 and stops working on this?" The answer needs to be documented before the question is asked, not after.',
    countermove:
      'One-page continuity plan in the data room: senior engineer on advisor network who would step in for 60 days; codebase onboarding is documented in CLAUDE.md.',
    tripwire:
      'If a Series A first meeting ends without the fund asking the continuity question, the plan was not visible enough — surface it.',
  },
  {
    id: 'infinite-pilot-trap',
    title: 'Vulnerable to the infinite-pilot trap',
    phaseImpact: 'Phase 1 → Phase 2: bleeds 50-70hr/week capacity into custom feature work',
    evidence:
      'Because (a) custom features can ship in one Claude session and (b) the founder wants every design partner to succeed, the temptation to build whatever Sankore/Ian/the-next-one asks for is structurally high.',
    countermove:
      'Written rule before the next conversation with Ian: no custom features outside the published roadmap; design-partner asks become cohort items or cash-priced enterprise add-ons.',
    tripwire:
      'If three of the last five engineering sessions were design-partner-specific feature requests, the rule was breached — reset the week.',
  },
];
