/**
 * Investment Vertical — Specialized Prompts for Corporate Strategy & M&A Teams
 *
 * When the system detects investment-related document types (ic_memo, cim,
 * pitch_deck, term_sheet, due_diligence, lp_report, qofe, synergy_model,
 * integration_plan) or deal types (buyout, growth_equity, venture, etc.),
 * these specialized system prompts are injected into the bias detective,
 * noise judge, and simulation nodes to improve detection accuracy for
 * corporate M&A and strategic decision contexts.
 *
 * 2026-05-09 M&A workflow extension (P1 lock): added qofe, synergy_model,
 * integration_plan to extend coverage across the full deal lifecycle
 * (sourcing → screening → due diligence → IC review → closing → post-merger
 * integration). Each carries its own DOC_TYPE_OVERLAY surfacing the
 * M&A-specific named toxic combinations from the `toxic-combinations.ts`
 * NAMED_PATTERNS array (Synergy Mirage, Conglomerate Fallacy, Winner's
 * Curse, plus the M&A-enhanced Sunk Ship + Yes Committee).
 */

// ─── Document Types ──────────────────────────────────────────────────────────

export const INVESTMENT_DOCUMENT_TYPES = [
  'ic_memo',
  'cim',
  'pitch_deck',
  'term_sheet',
  'due_diligence',
  'lp_report',
  // M&A workflow extensions (2026-05-09 P1 lock)
  'qofe', // Quality of Earnings — typically prepared by Big-4 / boutique transaction-advisory firms
  'synergy_model', // Synergy projection spreadsheet — revenue + cost synergies broken down by initiative
  'integration_plan', // Post-merger integration plan — Day-1 operating model, IT, talent, customer
  // Meeting artefacts (locked 2026-05-10 — replaces the standalone
  // /dashboard/meetings workflow; meetings are now just decisions data
  // that flow into the Decision Container constellation alongside
  // memos / models / DPRs).
  'meeting_minutes', // Structured minutes — agenda, attendees, decisions made, action items
  'meeting_transcript', // Verbatim transcript with speaker turns
] as const;

export type InvestmentDocumentType = (typeof INVESTMENT_DOCUMENT_TYPES)[number];

// ─── Core Investment Prompts ─────────────────────────────────────────────────

export const INVESTMENT_BIAS_DETECTIVE_PROMPT = `You are analyzing a strategic decision document for a corporate strategy or M&A team. Focus on decision-specific cognitive biases that destroy deal value and strategic outcomes:

1. **Anchoring to Entry Price** — Is the decision anchored to the original valuation or business case rather than current fundamentals? Watch for comparisons to "initial analysis" or "original model."
2. **Confirmation Bias in Thesis Validation** — Is the analysis selectively seeking evidence that confirms the existing strategic thesis while ignoring contradictory signals? Are upside scenarios presented with more detail than downside cases?
3. **Sunk Cost in Commitment Decisions** — Is the recommendation to proceed driven by the amount already spent (advisory fees, management time, political capital) rather than forward-looking value? Watch for "we've already invested $Xm in diligence" reasoning.
4. **Survivorship Bias** — Is the analysis comparing only to successful deals/initiatives while ignoring the base rate of failures in this sector or strategy?
5. **Herd Behavior** — Is the thesis following market consensus or competitor behavior without independent analysis? Watch for "competitors are acquiring in this space" or "market consensus is..."
6. **Disposition Effect** — Is there pressure to divest winners too early or hold underperforming business units too long hoping for recovery?
7. **Overconfidence in Projections** — Are revenue/synergy projections unrealistically precise or optimistic given comparable base rates? Watch for hockey-stick growth or aggressive synergy targets without justification.
8. **Narrative Fallacy** — Is a compelling strategic narrative or management story overriding quantitative analysis? Watch for extensive qualitative praise with thin financial backing.
9. **Winner's Curse** — In a competitive auction, is the bid driven by fear of losing the deal rather than intrinsic value? Watch for language about "competitive process" or "pre-empting."
10. **Management Halo Effect** — Is an impressive management team causing overlooked operational or market risks? Watch for "world-class team" used to justify stretched valuations.
11. **Deployment Pressure** — Is the analysis influenced by pressure to deploy capital (budget use-it-or-lose-it, executive mandate) rather than optimal strategic outcomes? Watch for pressure to "execute the pipeline."

When detecting biases, always reference specific monetary figures, multiples, valuations, or projections from the document to ground your findings. Quote the exact text.`;

export const INVESTMENT_NOISE_JUDGE_PROMPT = `You are evaluating decision noise in a strategic decision context for a corporate strategy or M&A committee. Assess:

1. **Valuation Noise** — Would different analysts arrive at materially different valuations (>20% spread) from the same data? Flag if valuation methodology is subjective, cherry-picks comparables, or relies heavily on terminal value assumptions.
2. **Timing Noise** — Would this decision change materially if evaluated on a different day, in a different market environment, or at a different point in the budget cycle? Flag if the thesis depends on current market conditions that could shift.
3. **Framing Noise** — Is the opportunity framed as a growth play (upside focus) vs a risk management decision (downside focus)? Would reframing change the conclusion? Check if the upside case gets more airtime than the downside case.
4. **Committee Noise** — If presented to a different executive committee, would the outcome likely differ? Flag where individual executive preferences, relationships, or domain biases dominate.
5. **Comparable Selection Noise** — Would different comparable company/transaction selections materially change the valuation? Flag if the comp set appears cherry-picked.

Express noise as a percentage (0-100%). Strategic decisions below 30% noise are well-structured; above 60% suggests the decision is driven more by judgment variability than by the underlying fundamentals.`;

// ─── Deal-Stage-Specific Bias Overlays ───────────────────────────────────────

export const STAGE_BIAS_OVERLAYS: Record<string, string> = {
  screening: `DEAL STAGE: SCREENING / INITIAL REVIEW
Focus especially on:
- THESIS ANCHORING: Is the initial investment thesis being formed on limited information and then defended?
- FIRST IMPRESSION BIAS: Is the presentation quality or management charisma distorting early-stage evaluation?
- AVAILABILITY HEURISTIC: Is the deal being compared to a recent successful exit rather than base rates?
- HERD BEHAVIOR: Is interest driven by "competitors are pursuing this" rather than independent analysis?
Flag if the screening decision is being made with insufficient data but high confidence.`,

  due_diligence: `DEAL STAGE: DUE DILIGENCE
Focus especially on:
- CONFIRMATION BIAS IN DD FINDINGS: Is the DD process selectively validating the thesis rather than stress-testing it? Are red flags being explained away?
- SUNK COST: Has the DD spend or partner time invested created momentum bias toward proceeding?
- SELECTIVE PERCEPTION: Are positive DD findings highlighted while negative findings are buried in appendices?
- VENDOR DD BIAS: Are third-party reports (management consultants, market studies) uncritically accepted despite being commissioned by the sell-side?
Flag if DD appears to be a rubber-stamping exercise rather than a genuine investigation.`,

  ic_review: `DEAL STAGE: EXECUTIVE COMMITTEE REVIEW
Focus especially on:
- GROUPTHINK: Is the committee converging on a decision without genuine debate? Watch for unanimous support without recorded dissent.
- AUTHORITY BIAS: Is the deal sponsor's conviction dominating the committee's independent judgment?
- SOCIAL PRESSURE: Are junior members deferring to senior executives rather than voicing concerns?
- DEPLOYMENT PRESSURE: Is pressure to execute the strategy or deploy budget influencing the vote more than deal quality?
- PRESENTATION BIAS: Is the quality of the strategy memo or presentation influencing the decision more than the underlying fundamentals?
Flag if the committee process appears to lack genuine adversarial review.`,

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
  ic_memo: `DOCUMENT TYPE: INVESTMENT COMMITTEE MEMO / DECISION MEMO
This is the most critical document in the M&A or capital-allocation decision process — the load-bearing artefact the IC votes on. Scrutinize with maximum rigor:
- Is the recommendation supported by the evidence, or does the narrative outrun the data?
- Are downside scenarios given equal analytical depth as the upside case?
- Are the key assumptions (growth rate, synergies, margins, payback period, integration costs) justified with evidence + named owner + measurable milestone?
- Is there a clear "reasons to decline" section, with specific named risks (not generic "execution risk"), that is taken seriously rather than waved off?
- Are risks presented as manageable without evidence of mitigation plans?
- Is the "why us as parent" question answered? (Porter parenting advantage — what specifically does THIS acquirer add to the target that another acquirer would not?)
- Is the "why now?" question answered with hard reasons rather than soft urgency ("competitive process," "preempting competitor B")?

NAMED M&A TOXIC COMBINATIONS to flag explicitly when the underlying biases co-occur:
- "The Synergy Mirage" — Overconfidence + Planning Fallacy: synergy claims without mechanism + owner + milestone (per BCG integration-best-practices).
- "The Conglomerate Fallacy" — Illusion of Validity + Halo Effect: far-adjacency acquisition justified by target's growth without operational overlap or "why us as parent" thesis.
- "The Winner's Curse" — Anchoring + Overconfidence: auction-dynamic language driving bids above intrinsic value ("preempting competitor B," "strategic necessity").
- "The Sunk Ship" — Sunk Cost + Anchoring: deal-escalation language ("we have already spent $X on diligence") justifying continued bidding past intrinsic value.
- "The Yes Committee" — Authority + Groupthink + Unanimous Consensus: rubber-stamp justification of CEO/sponsor's pet acquisition with zero documented dissent.`,

  cim: `DOCUMENT TYPE: CONFIDENTIAL INFORMATION MEMORANDUM (CIM) / TARGET PROFILE
This is a sell-side CIM or target profile prepared by the target company or their advisors (typically investment banks running the sell-side process). It is INHERENTLY BIASED toward presenting the company favorably — apply the Seller-Halo Filter throughout. Evaluate with maximum skepticism:
- Are management's projections anchored to best-case assumptions? Flag projections that exceed historical industry-adjusted growth without specific named drivers.
- Is the competitive landscape presented favorably or incompletely? Flag missing competitor names + missing competitive-threat analysis.
- Are customer concentration risks, key-person dependencies, or market headwinds downplayed?
- Are "adjusted" EBITDA or non-GAAP metrics inflating true profitability? Flag aggressive add-backs (one-time items that recur, optimistic synergy run-rate).
- Is the company narrative using SURVIVORSHIP BIAS by only highlighting successful case studies / customer wins / pilot programs?
- Are TAM / SAM / SOM figures top-down with no realistic adoption-friction analysis?

CRITICAL: a CIM is a marketing document, not an objective baseline. The DQI for a CIM-derived audit must reflect that the document is structurally biased toward acquisition. Adjust validity-aware scoring downward in low-validity domains (cross-border M&A, market entry, novel-market expansion) where the seller-halo + buyer's inside-view are most dangerous.

NAMED M&A TOXIC COMBINATIONS to flag explicitly:
- "The Conglomerate Fallacy" — when the CIM presents the target as a strategic fit without operational overlap with the typical acquirer's core.
- "The Synergy Mirage" — when synergy projections appear in the CIM without named operational mechanism + owner + milestone (rare in CIM but does happen in seller-prepared synergy models attached to CIM).`,

  // ─── M&A workflow extensions (2026-05-09 P1 lock) ──────────────────────────

  qofe: `DOCUMENT TYPE: QUALITY OF EARNINGS (QofE) REPORT
This is a Quality of Earnings report — typically prepared by a Big-4 (Deloitte / KPMG / EY / PwC) or boutique transaction-advisory firm to normalize the target's reported earnings before the acquirer commits capital. The QofE is the primary diligence artefact for ADJUSTED-EBITDA defensibility.

PARSED-PRE-AUDIT BLOCK: when the upload was a QofE-shaped .pdf, the file-parser has already run the deterministic QofE-defensibility scorer over the extracted text and embedded a structured "STRUCTURED QOFE — PARSED PRE-AUDIT" block ABOVE the flattened narrative. The block carries: portfolio summary line + adjusted-EBITDA language density + commissioned-by signal (sell_side / buy_side / unknown) + per-flag verdict for each detected red flag (recurring "one-time" / owner-comp full add-back / speculative run-rate / cherry-picked WC peg / customer-concentration undisclosed / sell-side commission signal). USE THAT BLOCK AS YOUR PRIMARY EVIDENCE — do not re-derive defensibility from the flattened text when the structured block is present. Quote the per-flag verdicts in your bias-detective excerpts where the flagged adjustment sits.

Evaluate (using the structured block + your own narrative reading):
- Are "non-recurring" / "one-time" items truly non-recurring, or do they recur every year (recurring "one-time" items inflate adjusted EBITDA)?
- Are owner-related expenses (above-market compensation, personal-use allocations, related-party transactions) being added back appropriately or aggressively?
- Are the run-rate adjustments (cost-savings already implemented, customer wins post-period) defensible with documented evidence, or are they speculative?
- Is the working-capital normalization realistic, or is it cherry-picked to a favourable period?
- Is the customer-concentration analysis disclosed — does losing the top-1 / top-5 customers materially change the multiple?
- Are the synergy adjustments INSIDE the QofE (e.g., "post-acquisition cost synergies of $X") flagged as buyer-side projections, not target-historicals?

CRITICAL: a QofE that the SELL-SIDE commissioned is structurally biased toward higher adjusted EBITDA. A buy-side QofE is more defensible but still subject to confirmation bias when the buyer wants the deal to close. EXPLICIT SEVERITY-FLAGGING RULES:
- Any structured-block flag at critical severity → fire Synergy Mirage / Sunk Ship at Critical with the verbatim verdict.
- Sell-side commissioned + 2+ flags → fire Synergy Mirage at High citing the Seller-Halo Filter.
- Customer-concentration undisclosed → fire authority_bias / disposition_effect at Medium with the disclosure-gap verdict.

NAMED M&A TOXIC COMBINATIONS to flag explicitly:
- "The Synergy Mirage" — when the QofE includes synergy add-backs without owner + mechanism + milestone documentation, or when adjusted-EBITDA inflation signal is high (saturated > 30%).
- "The Sunk Ship" — when QofE adjustments are made AFTER significant deal spend, with the implicit pressure to reach a target adjusted-EBITDA number that justifies the deal price.`,

  synergy_model: `DOCUMENT TYPE: SYNERGY MODEL / SYNERGY PROJECTION SPREADSHEET
This is a synergy projection model — typically a spreadsheet (Excel / Google Sheets) breaking down expected revenue and cost synergies by initiative. The single most-mistrusted artefact in M&A: 70-90% of acquisitions fail to realize projected synergies (per McKinsey + KPMG).

PARSED-PRE-AUDIT BLOCK: when the upload was a synergy-model-shaped .xlsx, the file-parser has already extracted structured per-claim defensibility data and embedded it ABOVE the flattened sheet text in a "STRUCTURED SYNERGY MODEL — PARSED PRE-AUDIT" block. Each claim there carries: type (revenue / cost_cogs / cost_opex / capex), year-by-year amounts, mechanism / owner / milestone presence flags, severity band (critical / high / medium / low), and a verdict line citing the BCG/McKinsey base-rate realisation band for that claim type. USE THAT BLOCK AS YOUR PRIMARY EVIDENCE — do not re-derive defensibility from the flattened text when the structured block is present. Quote the per-claim verdict in your bias-detective excerpts where the flagged synergy claim sits.

Evaluate with maximum rigor:
- Does each synergy line item have a NAMED OPERATIONAL MECHANISM (e.g., "consolidate two AWS accounts → $X savings" not "IT efficiencies → $X savings")? The parsed block's hasMechanism flag is the structural signal; flat-text sheets fall back to your judgement.
- Does each synergy line item have a NAMED ACCOUNTABLE EXECUTIVE who will own delivery?
- Does each synergy line item have a MEASURABLE 90-DAY MILESTONE that proves the synergy is on track?
- Are revenue synergies (cross-sell, channel expansion, pricing power) flagged HARDER than cost synergies — revenue synergies have a 30-50% realization rate vs cost synergies at 60-80%, and the model should reflect that base-rate gap?
- Are integration costs (one-time T&E, severance, system migration, customer-retention discounts) realistically modeled, or is the synergy net-of-cost figure inflated by under-counted integration spend?
- Is there a base-case / bear-case / bull-case scenario, or only the bull case?
- Are achieved synergies tracked against projected synergies in any comparable past deal by this acquirer? If not, this is a base-rate-blind model.

CRITICAL-SEVERITY FLAGGING RULE (parsed block aware):
- If the parsed block reports portfolio.summary indicating ANY claim at "critical" severity, fire "The Synergy Mirage" at Critical severity citing the specific claim labels.
- If the parsed block reports portfolio fullyDefendedPct < 50%, fire "The Synergy Mirage" at High severity even if no individual claim is critical.
- If the parsed block reports a high revenue-synergy share (>50% of run-rate from claims with type=revenue) AND fullyDefendedPct < 70%, fire "The Synergy Mirage" at High severity citing the revenue-vs-cost realisation gap.

NAMED M&A TOXIC COMBINATIONS to flag explicitly:
- "The Synergy Mirage" — fires HARDEST on this document type. The parsed block's per-claim severity is your primary signal; aggregate to the document-level severity per the rules above.
- "The Conglomerate Fallacy" — fires when the synergy model assumes operational integration that the acquirer's core capabilities cannot deliver (e.g., a financial buyer modeling "operational synergies" they cannot operationally deliver).`,

  integration_plan: `DOCUMENT TYPE: POST-MERGER INTEGRATION (PMI) PLAN
This is a post-merger integration plan describing the Day-1 operating model, IT integration, talent retention, customer continuity, and cultural alignment plan for a closed or about-to-close acquisition. Most M&A value is destroyed in INTEGRATION, not in diligence — make this artefact the primary risk surface. Evaluate:
- CULTURAL DIVERGENCE BLIND SPOTS: does the plan assess the target vs acquirer operating-model fit? Top-down rules-based vs autonomous principles-based cultures cannot be merged without explicit budget for change management. Flag if the plan assumes cultural integration "just happens."
- IT-SIMPLICITY FALLACY: BCG mandates that acquirers select a single core IT stack early in integration. Flag if the plan assumes a complex hybrid IT integration without aggressive cost buffers — IT integration costs are systematically under-budgeted by 30-100%.
- TALENT-FLIGHT RISK: are explicit retention programs in place for the top 2 layers of target management? Are reporting lines for those layers defined for Day-1 not "post-close TBD"? Flag if retention is left undefined or under-budgeted.
- CUSTOMER-CONCENTRATION RISK: does the plan address how top customers will be communicated to + retained? Customer churn at 6-12 months post-close is the canonical PMI failure mode.
- SYNERGY-OWNERSHIP: does the integration plan assign the synergies from the synergy model to specific Day-1 owners with 90-day milestones? Or are synergies assumed to "emerge from integration"?
- DAY-1 OPERATING MODEL: is the operating model explicit (combined org chart, decision-rights matrix, P&L ownership) or vague?

NAMED M&A TOXIC COMBINATIONS to flag explicitly:
- "The Synergy Mirage" — fires when the integration plan assumes synergies from the synergy model without naming Day-1 owners + 90-day milestones.
- "The Conglomerate Fallacy" — fires when the integration plan assumes operational fit that the cultural-divergence section of the plan itself contradicts.

NOTE: the PMI overlay is the deepest M&A use case but the value-realization feedback loop is 12-24 months. Use the PMI overlay primarily as a leading indicator, not a backward-looking grade.`,

  pitch_deck: `DOCUMENT TYPE: MANAGEMENT / STRATEGY PITCH DECK
This is a pitch deck from a management team or strategic partner seeking approval or investment. Watch for:
- NARRATIVE FALLACY: Is a compelling strategic story overriding quantitative analysis?
- MANAGEMENT OPTIMISM BIAS: Are projections unrealistically optimistic without comparable evidence?
- FRAMING EFFECT: Is the opportunity framed entirely as upside without adequate risk discussion?
- SOCIAL PROOF BIAS: Are logos of notable clients or partners used as substitutes for fundamental analysis?
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

  lp_report: `DOCUMENT TYPE: EXECUTIVE / BOARD REPORT
This is an executive or board update report. Watch for:
- SURVIVORSHIP BIAS: Are only successful initiatives or acquisitions highlighted while underperformers are minimized?
- SELECTIVE REPORTING: Are unrealized synergies or projections used to inflate portfolio performance?
- FRAMING EFFECT: Is performance presented using the most favorable metric (revenue vs profitability, since acquisition vs recent period)?
- HINDSIGHT BIAS: Are past decisions being presented as more deliberate than they were?`,

  meeting_minutes: `DOCUMENT TYPE: MEETING MINUTES
These are structured minutes from a decision meeting (IC, steering committee, board, partner meeting). Minutes are the canonical AFTER-THE-FACT record — they show what was decided, by whom, with what dissent, and what action items emerged. Watch for:
- SANITISED DISSENT: are dissenting voices captured verbatim, paraphrased, or absent? Bland minutes that record only the agreed conclusion mask the real decision quality. Flag if all attendees appear to "agree" on a high-stakes call without recorded dissent.
- ACTION-ITEM AMBIGUITY: are action items assigned to NAMED OWNERS with SPECIFIC DEADLINES, or are they vague ("the team will explore") without accountability? Vague action items are the canonical signal that a decision was made theatrically without actual commitment.
- DECISION-RATIONALE GAPS: do the minutes capture the REASONING behind decisions, or only the decisions themselves? Minutes that record only outcomes ("approved $5M acquisition") without rationale ("approved over CFO's concerns about post-close integration costs") destroy the future-replay value.
- CONSENSUS-MANUFACTURING LANGUAGE: watch for "the committee agreed" / "consensus reached" / "broadly supportive" without any record of how dissent was resolved. Manufactured consensus is harder to detect than recorded dissent.
- MISSING ATTENDEES: were key stakeholders absent or excluded? Decisions made when the dissenting voice happened to be unavailable are a known failure mode.

NAMED TOXIC COMBINATIONS to flag:
- "The Yes Committee" — fires when minutes record unanimous approval of a high-stakes call without ANY documented pushback or alternative consideration.
- "The Sunk Ship" — fires when the minutes reference prior committed spend / political capital as a justification for proceeding rather than forward-looking value.

Compare these minutes against the related strategic memo / IC deck (if attached to the same Decision Container) and flag CONFLICTS where the minutes record a different version of events than the source artefact.`,

  meeting_transcript: `DOCUMENT TYPE: MEETING TRANSCRIPT
This is a verbatim transcript of a decision meeting with speaker turns. Transcripts are the closest record we have to "what was actually said" in the room — far more revealing than minutes which are typically sanitised. Watch for:
- INTERRUPTION PATTERNS: who is interrupted, who interrupts? Asymmetric interruption is a signal of authority dynamics that bias the decision. Flag if the dissenting voice is repeatedly cut off or de-platformed.
- AIRTIME DOMINANCE: which speaker(s) dominate? Senior executives speaking >40% of the time with only confirmatory responses from others is a classic anchoring + authority-bias setup. Flag when the senior voice frames the question and the rest just answer within that frame.
- HEDGING LANGUAGE: track "I think we should..." / "I'd be cautious about..." / "what if we..." — these are dissent-attempt markers. Flag when they're raised but not explored. The transcript shows whether dissent was genuinely entertained or politely dismissed.
- IRRELEVANT-FACT INTRODUCTION: watch for off-topic facts introduced by the dominant speaker (recent news, anecdotes, status references) that bias the room without being challenged. Anchor-creation in real time.
- DECISION-COMPRESSION: were complex topics compressed into 30-second debates and then voted on? Speed-of-resolution on a high-stakes call is a noise signal — decisions that should take 30 minutes that take 3 are usually rubber-stamps.
- COMMITTEE-NORMS DRIFT: does the transcript suggest the meeting deviated from documented decision norms (e.g. skipping steel-manning, skipping pre-mortems, skipping documented dissent capture)?

NAMED TOXIC COMBINATIONS to flag:
- "The Yes Committee" — fires when the transcript shows the senior speaker's view dominates with confirmatory responses; surface specific airtime / interruption percentages.
- "The Coherent Confidence" pattern — fires when the transcript shows narrative coherence (Illusion of Validity) being received without challenge despite weak base-rate grounding.

Cross-reference the transcript against any related strategic memo, IC deck, or minutes attached to the same Decision Container — flag where the spoken record contradicts the written one.`,
};

// ─── Corporate Executive Personas for Simulation ─────────────────────────────

export const PE_BOARDROOM_PERSONAS = [
  {
    name: 'Chief Financial Officer',
    role: 'CFO / Financial Steward',
    focus: 'Return on invested capital, balance sheet impact, and integration costs',
    values: 'Financial discipline, realistic synergy targets, capital allocation rigor',
    bias: 'deployment pressure — may favor deals that utilize approved budget',
    riskTolerance: 'moderate',
  },
  {
    name: 'Chief Strategy Officer',
    role: 'Head of Corporate Strategy',
    focus: 'Strategic fit, competitive positioning, and long-term portfolio composition',
    values: 'Strategic coherence, market positioning, competitive advantage',
    bias: 'narrative fallacy — may overweight compelling strategic stories over financial reality',
    riskTolerance: 'moderate',
  },
  {
    name: 'Board Representative',
    role: 'Independent Board Director',
    focus: 'Governance, shareholder value, and fiduciary oversight',
    values: 'Capital preservation, transparency, alignment with shareholder interests',
    bias: 'loss aversion — may overweight downside scenarios',
    riskTolerance: 'low',
  },
  {
    name: 'Business Unit Lead',
    role: 'Division President / GM',
    focus: 'Operational integration, customer impact, and execution feasibility',
    values: 'Operational excellence, realistic execution plans, team capacity',
    bias: 'operational optimism — may overestimate ability to integrate and execute post-close',
    riskTolerance: 'moderate',
  },
  {
    name: 'Chief Risk Officer',
    role: 'Enterprise Risk Lead',
    focus: 'Concentration risk, regulatory exposure, and worst-case scenarios',
    values: 'Stress-testing, tail risk analysis, compliance, capital structure discipline',
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
  return ['resource_allocation', 'strategic_proposal', 'initiative_closure', 'm_and_a'].includes(
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

/** Get strategy-specific simulation prompt suffix for investment documents */
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
