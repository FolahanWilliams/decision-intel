/**
 * Investment Vertical — Specialized Prompts for PE/VC Investment Committees
 *
 * When the system detects investment-related document types (ic_memo, cim,
 * pitch_deck, term_sheet, due_diligence, lp_report) or deal types (buyout,
 * growth_equity, venture, etc.), these specialized system prompts are
 * injected into the bias detective, noise judge, and simulation nodes
 * to improve detection accuracy for PE/VC/HF contexts.
 */

// ─── Document Types ──────────────────────────────────────────────────────────

export const INVESTMENT_DOCUMENT_TYPES = [
  'ic_memo',
  'cim',
  'pitch_deck',
  'term_sheet',
  'due_diligence',
  'lp_report',
] as const;

export type InvestmentDocumentType = (typeof INVESTMENT_DOCUMENT_TYPES)[number];

// ─── Core Investment Prompts ─────────────────────────────────────────────────

export const INVESTMENT_BIAS_DETECTIVE_PROMPT = `You are analyzing an investment decision document for a PE/VC investment committee. Focus on investment-specific cognitive biases that destroy fund returns:

1. **Anchoring to Entry Price** — Is the decision anchored to the original investment thesis or entry valuation rather than current fundamentals? Watch for comparisons to "initial underwriting" or "original model."
2. **Confirmation Bias in Thesis Validation** — Is the analysis selectively seeking evidence that confirms the existing investment thesis while ignoring contradictory signals? Are bull-case scenarios presented with more detail than bear cases?
3. **Sunk Cost in Portfolio Holds** — Is the recommendation to hold or double down driven by the amount already invested rather than forward-looking returns? Watch for "we've already invested $Xm" reasoning.
4. **Survivorship Bias** — Is the analysis comparing only to successful exits/deals while ignoring the base rate of failures in this sector or strategy?
5. **Herd Behavior** — Is the thesis following market consensus or peer fund positioning without independent analysis? Watch for "other funds are bidding" or "market consensus is..."
6. **Disposition Effect** — Is there pressure to realize gains too early on winners or hold losses too long hoping for recovery?
7. **Overconfidence in Projections** — Are revenue/growth projections unrealistically precise or optimistic given comparable base rates? Watch for hockey-stick growth without justification.
8. **Narrative Fallacy** — Is a compelling founder story or management narrative overriding quantitative analysis? Watch for extensive qualitative praise with thin financial backing.
9. **Winner's Curse** — In a competitive auction, is the bid driven by fear of losing the deal rather than intrinsic value? Watch for language about "competitive process" or "pre-empting."
10. **Management Halo Effect** — Is an impressive management team causing overlooked operational or market risks? Watch for "world-class team" used to justify stretched valuations.
11. **Carry Incentive Distortion** — Is the analysis influenced by the incentive to deploy capital (and earn carry) rather than optimal return maximization? Watch for pressure to "put money to work."

When detecting biases, always reference specific monetary figures, multiples, valuations, or projections from the document to ground your findings. Quote the exact text.`;

export const INVESTMENT_NOISE_JUDGE_PROMPT = `You are evaluating decision noise in an investment context for a PE/VC investment committee. Assess:

1. **Valuation Noise** — Would different analysts arrive at materially different valuations (>20% spread) from the same data? Flag if valuation methodology is subjective, cherry-picks comparables, or relies heavily on terminal value assumptions.
2. **Timing Noise** — Would this decision change materially if evaluated on a different day, in a different market environment, or at a different point in the fund cycle? Flag if the thesis depends on current market conditions that could shift.
3. **Framing Noise** — Is the investment framed as an opportunity (upside focus) vs a risk management decision (downside focus)? Would reframing change the conclusion? Check if bull case gets more airtime than bear case.
4. **Committee Noise** — If presented to a different investment committee, would the outcome likely differ? Flag where individual partner preferences, relationships, or sector biases dominate.
5. **Comparable Selection Noise** — Would different comparable company/transaction selections materially change the valuation? Flag if the comp set appears cherry-picked.

Express noise as a percentage (0-100%). Investment decisions below 30% noise are well-structured; above 60% suggests the decision is driven more by judgment variability than by the underlying fundamentals.`;

// ─── Deal-Stage-Specific Bias Overlays ───────────────────────────────────────

export const STAGE_BIAS_OVERLAYS: Record<string, string> = {
  screening: `DEAL STAGE: SCREENING / INITIAL REVIEW
Focus especially on:
- THESIS ANCHORING: Is the initial investment thesis being formed on limited information and then defended?
- FIRST IMPRESSION BIAS: Is the presentation quality or founder charisma distorting early-stage evaluation?
- AVAILABILITY HEURISTIC: Is the deal being compared to a recent successful exit rather than base rates?
- HERD BEHAVIOR: Is interest driven by "other funds looking at this" rather than independent analysis?
Flag if the screening decision is being made with insufficient data but high confidence.`,

  due_diligence: `DEAL STAGE: DUE DILIGENCE
Focus especially on:
- CONFIRMATION BIAS IN DD FINDINGS: Is the DD process selectively validating the thesis rather than stress-testing it? Are red flags being explained away?
- SUNK COST: Has the DD spend or partner time invested created momentum bias toward proceeding?
- SELECTIVE PERCEPTION: Are positive DD findings highlighted while negative findings are buried in appendices?
- VENDOR DD BIAS: Are third-party reports (management consultants, market studies) uncritically accepted despite being commissioned by the sell-side?
Flag if DD appears to be a rubber-stamping exercise rather than a genuine investigation.`,

  ic_review: `DEAL STAGE: INVESTMENT COMMITTEE REVIEW
Focus especially on:
- GROUPTHINK: Is the IC converging on a decision without genuine debate? Watch for unanimous support without recorded dissent.
- AUTHORITY BIAS: Is the deal sponsor's conviction dominating the committee's independent judgment?
- SOCIAL PRESSURE: Are junior IC members deferring to senior partners rather than voicing concerns?
- CARRY INCENTIVE DISTORTION: Is pressure to deploy capital influencing the vote more than deal quality?
- PRESENTATION BIAS: Is the quality of the IC memo or presentation influencing the decision more than the underlying fundamentals?
Flag if IC process appears to lack genuine adversarial review.`,

  closing: `DEAL STAGE: CLOSING / FINAL EXECUTION
Focus especially on:
- WINNER'S CURSE: In competitive processes, is the final bid driven by fear of losing rather than value?
- ESCALATION OF COMMITMENT: Have the team and IC invested too much time to walk away despite new negative information?
- ANCHORING TO SIGNED TERMS: Are final adjustments being evaluated against the signed LOI rather than intrinsic value?
Flag if there are new material findings being minimized to "close the deal."`,

  portfolio: `DEAL STAGE: PORTFOLIO MANAGEMENT
Focus especially on:
- SUNK COST FALLACY: Is the recommendation to provide follow-on capital driven by protecting the existing investment?
- DISPOSITION EFFECT: Is there a desire to exit winners too early or hold losers too long?
- ESCALATION OF COMMITMENT: Are additional resources being poured into underperforming investments without a clear turnaround thesis?
- STATUS QUO BIAS: Is "hold" being recommended by default rather than actively evaluated against exit or follow-on?
Flag if portfolio decisions are being driven by the original investment thesis rather than current fundamentals.`,

  exited: `DEAL STAGE: POST-EXIT / RETROSPECTIVE
Focus especially on:
- HINDSIGHT BIAS: Is the team claiming the outcome was predictable when it wasn't?
- OUTCOME BIAS: Is the quality of the decision being judged solely by the outcome rather than the process?
- SURVIVORSHIP BIAS: Is the team only reviewing successful exits and ignoring write-offs?
- ATTRIBUTION ERROR: Is success being attributed to skill and failure to external factors?
Flag if the retrospective is not being used as a genuine learning exercise.`,
};

// ─── Document-Type-Specific Analysis Focus ───────────────────────────────────

export const DOC_TYPE_OVERLAYS: Record<string, string> = {
  ic_memo: `DOCUMENT TYPE: INVESTMENT COMMITTEE MEMO
This is an IC memo arguing for or against a deal. This is the most critical document in the PE/VC decision process. Scrutinize with maximum rigor:
- Is the recommendation supported by the evidence, or does the narrative outrun the data?
- Are bear-case scenarios given equal analytical depth as the bull case?
- Are the key assumptions (growth rate, margins, exit multiple, hold period) justified with evidence?
- Is there a clear "reasons to pass" section that is taken seriously?
- Are risks presented as manageable without evidence of mitigation plans?`,

  cim: `DOCUMENT TYPE: CONFIDENTIAL INFORMATION MEMORANDUM (CIM)
This is a sell-side CIM prepared by the target company or their advisors. It is inherently biased toward presenting the company favorably. Evaluate with skepticism:
- Are management's projections anchored to best-case assumptions?
- Is the competitive landscape presented favorably or incompletely?
- Are customer concentration risks, key-person dependencies, or market headwinds downplayed?
- Are "adjusted" EBITDA or non-GAAP metrics inflating true profitability?
- Is the company narrative using SURVIVORSHIP BIAS by only highlighting successful case studies?`,

  pitch_deck: `DOCUMENT TYPE: FOUNDER / MANAGEMENT PITCH DECK
This is a pitch deck from a founder or management team seeking investment. Watch for:
- NARRATIVE FALLACY: Is a compelling founder story overriding quantitative analysis?
- FOUNDER OPTIMISM BIAS: Are projections unrealistically optimistic without comparable evidence?
- FRAMING EFFECT: Is the opportunity framed entirely as upside without adequate risk discussion?
- SOCIAL PROOF BIAS: Are logos of other investors or customers used as substitutes for fundamental analysis?
- TAM DELUSION: Is the total addressable market inflated with top-down estimates that ignore real adoption barriers?`,

  term_sheet: `DOCUMENT TYPE: TERM SHEET / LOI
This is a term sheet or letter of intent. Focus on:
- ANCHORING TO HEADLINE VALUATION: Is the discussion focused on pre-money valuation while ignoring dilutive provisions, liquidation preferences, or ratchets?
- FRAMING EFFECT: Are "standard" terms accepted without analysis of their actual economic impact?
- COMPLEXITY AVERSION: Are complex protective provisions being glossed over because they seem "standard"?
- WINNER'S CURSE: In competitive situations, are terms being accepted under time pressure?`,

  due_diligence: `DOCUMENT TYPE: DUE DILIGENCE REPORT
This is a due diligence report. Be alert to:
- CONFIRMATION BIAS: Are vendor-selected findings reinforcing the investment thesis?
- SELECTIVE REPORTING: Are positive findings prominently placed while risks are buried?
- SCOPE LIMITATIONS: Are important areas excluded from the DD scope?
- ANCHORING: Are DD findings being compared to management representations rather than independent benchmarks?`,

  lp_report: `DOCUMENT TYPE: LIMITED PARTNER REPORT
This is an LP report or fund update. Watch for:
- SURVIVORSHIP BIAS: Are only successful portfolio companies highlighted while underperformers are minimized?
- SELECTIVE REPORTING: Are unrealized valuations used to inflate portfolio performance (mark-to-model vs mark-to-market)?
- FRAMING EFFECT: Is performance presented using the most favorable metric (gross vs net IRR, since inception vs recent period)?
- HINDSIGHT BIAS: Are past decisions being presented as more deliberate than they were?`,
};

// ─── PE-Specific Boardroom Personas for Simulation ───────────────────────────

export const PE_BOARDROOM_PERSONAS = [
  {
    name: 'Managing Partner',
    role: 'GP / Fund Leader',
    focus: 'Fund returns, LP obligations, and portfolio construction',
    values: 'Fiduciary duty to LPs, risk-adjusted returns, capital preservation',
    bias: 'carry incentive — may favor deploying capital over passing',
    riskTolerance: 'moderate',
  },
  {
    name: 'Operating Partner',
    role: 'Value Creation Lead',
    focus: 'Post-acquisition execution feasibility and operational upside',
    values: 'Operational excellence, realistic execution plans, team quality',
    bias: 'operational optimism — may overestimate ability to fix problems post-close',
    riskTolerance: 'moderate',
  },
  {
    name: 'LP Advisory Committee Rep',
    role: 'Limited Partner Representative',
    focus: 'Portfolio diversification, downside protection, and governance',
    values: 'Capital preservation, diversification, transparency, alignment of interests',
    bias: 'loss aversion — may overweight downside scenarios',
    riskTolerance: 'low',
  },
  {
    name: 'Sector Specialist',
    role: 'Industry Expert',
    focus: 'Market dynamics, competitive positioning, and sector trends',
    values: 'Deep domain expertise, market timing, competitive moats',
    bias: 'expertise overconfidence — may dismiss risks outside their domain',
    riskTolerance: 'moderate',
  },
  {
    name: 'Risk Committee Chair',
    role: 'Chief Risk Officer',
    focus: 'Concentration risk, portfolio correlation, and worst-case scenarios',
    values: 'Stress-testing, tail risk analysis, capital structure discipline',
    bias: 'catastrophizing — may overweight unlikely but severe scenarios',
    riskTolerance: 'low',
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Check if a document type is an investment document */
export function isInvestmentDocument(documentType?: string): boolean {
  if (!documentType) return false;
  return INVESTMENT_DOCUMENT_TYPES.includes(documentType as InvestmentDocumentType);
}

/** Check if a decision type is investment-related (legacy support) */
export function isInvestmentDecision(decisionType?: string): boolean {
  return ['capital_allocation', 'investment_thesis', 'portfolio_exit', 'm_and_a'].includes(
    decisionType ?? ''
  );
}

/** Build the full investment bias overlay combining doc type + deal stage */
export function buildInvestmentBiasOverlay(
  documentType?: string,
  dealStage?: string
): string | null {
  const parts: string[] = [];

  // Always include the core investment bias prompt for investment documents
  if (isInvestmentDocument(documentType)) {
    parts.push(INVESTMENT_BIAS_DETECTIVE_PROMPT);
  }

  // Add document-type-specific overlay
  if (documentType && DOC_TYPE_OVERLAYS[documentType]) {
    parts.push(DOC_TYPE_OVERLAYS[documentType]);
  }

  // Add deal-stage-specific overlay
  if (dealStage && STAGE_BIAS_OVERLAYS[dealStage]) {
    parts.push(STAGE_BIAS_OVERLAYS[dealStage]);
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/** Build the investment noise overlay */
export function buildInvestmentNoiseOverlay(documentType?: string): string | null {
  if (!isInvestmentDocument(documentType)) return null;
  return INVESTMENT_NOISE_JUDGE_PROMPT;
}

/** Get PE-specific simulation prompt suffix for investment documents */
export function getInvestmentPromptSuffix(decisionType?: string): {
  biasPrompt: string;
  noisePrompt: string;
} | null {
  if (!isInvestmentDecision(decisionType)) return null;
  return {
    biasPrompt: INVESTMENT_BIAS_DETECTIVE_PROMPT,
    noisePrompt: INVESTMENT_NOISE_JUDGE_PROMPT,
  };
}
