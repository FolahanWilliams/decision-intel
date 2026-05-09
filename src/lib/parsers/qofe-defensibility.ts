/**
 * QofE (Quality of Earnings) Defensibility Scorer (locked 2026-05-09 evening,
 * M&A hard-layer extension — qofe parser ship).
 *
 * Pure-function scoring over QofE report text. Detects the canonical
 * adjusted-EBITDA inflation patterns Big-4 + boutique transaction-advisory
 * firms warn buyers about, anchored in BCG diligence frameworks + Bain
 * "Adjusted EBITDA Reality Check" research:
 *
 *   1. RECURRING "ONE-TIME" — items labeled "non-recurring" that show up
 *      across 3+ consecutive years inflate adjusted EBITDA structurally.
 *      Sell-side bias: optimise for the highest-defensible adjustment.
 *   2. OWNER-COMP FULL ADD-BACK — adding back owner salary at full rate
 *      inflates EBITDA, but the buyer must hire a market-rate replacement.
 *      Defensible add-back is the ABOVE-MARKET portion only.
 *   3. SPECULATIVE RUN-RATE — "post-period cost savings already implemented"
 *      or "post-period customer wins" without documented evidence (signed
 *      contracts, executed cancellations, dated headcount changes).
 *   4. CHERRY-PICKED WC PEG — working-capital normalization to a favourable
 *      period without baseline-window disclosure.
 *   5. CUSTOMER CONCENTRATION UNDISCLOSED — top-1/top-5 customer share,
 *      revenue dependency, key-account churn risk all required disclosures.
 *   6. SELL-SIDE COMMISSION SIGNAL — sell-side QofE has structural bias
 *      toward higher adjusted EBITDA. Buy-side QofE is more defensible
 *      but still subject to confirmation bias when the buyer wants the
 *      deal to close.
 *
 * Mirrors the synergy-defensibility.ts structural pattern: per-flag
 * scorer + portfolio aggregator. Deterministic, no LLM call.
 *
 * Used by:
 *   - src/lib/parsers/qofe-parser.ts (called over the full QofE text body)
 *   - src/lib/utils/file-parser.ts (embeds the structured assessment inline
 *     in the text content for qofe uploads under the canonical
 *     "STRUCTURED QOFE — PARSED PRE-AUDIT" marker, mirroring the synergy
 *     model pattern, so the structurer + biasDetective see the assessment
 *     without a new audit-graph state field)
 *   - src/lib/agents/nodes.ts:synergyValidationNode peer (qofe equivalent
 *     can be wired identically when documentType === 'qofe' and structured
 *     data is present)
 */

export type QofeRedFlagId =
  | 'recurring_one_time'
  | 'owner_comp_full_add_back'
  | 'speculative_run_rate'
  | 'cherry_picked_wc'
  | 'customer_concentration_undisclosed'
  | 'sell_side_commission_signal';

export type QofeSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface QofeRedFlag {
  id: QofeRedFlagId;
  label: string;
  /** Severity assigned to this individual flag based on signal density. */
  severity: QofeSeverity;
  /** 1-line procurement-grade verdict naming the specific risk. */
  verdict: string;
  /** Canonical phrase counts that drove the detection (for transparency / DPR display). */
  matchedPhrases: string[];
}

export interface QofeAssessment {
  /** All red flags detected with severity. Empty array = clean QofE. */
  redFlags: QofeRedFlag[];
  /** Distribution across severity bands. */
  severityCounts: Record<QofeSeverity, number>;
  /** Heuristic adjusted-EBITDA inflation signal (0-1) — density of
   *  adjustment language relative to total content. */
  adjEbitdaInflationSignal: number;
  /** Whether the QofE appears to be sell-side commissioned (from signal
   *  language). null = unknown — defaults to "treat with skepticism" but
   *  doesn't fire a red flag on its own. */
  commissionedBy: 'sell_side' | 'buy_side' | null;
  /** Portfolio-level severity band (max severity across all flags). */
  portfolioSeverity: QofeSeverity;
  /** Procurement-grade single-line summary. */
  summary: string;
}

interface PhraseRule {
  id: QofeRedFlagId;
  label: string;
  /** Patterns that, when they co-occur, indicate the flag should fire. */
  triggers: RegExp[];
  /** Required minimum trigger count before firing. */
  minTriggers: number;
  /** Severity escalation per trigger over the minimum. */
  severityLadder: QofeSeverity[];
  buildVerdict: (matchCount: number) => string;
}

// ─── Detection rules ──────────────────────────────────────────────────────────

const RULES: PhraseRule[] = [
  {
    id: 'recurring_one_time',
    label: 'Recurring "one-time" adjustments',
    triggers: [
      /\bone[\s-]?time\b/gi,
      /\bnon[\s-]?recurring\b/gi,
      /\bunusual\b/gi,
    ],
    // The flag fires when "one-time" / "non-recurring" language appears
    // alongside multi-year context — but heuristically we only require
    // multiple instances of the language since QofE that uses these terms
    // 5+ times typically has a recurring-add-back problem.
    minTriggers: 5,
    severityLadder: ['medium', 'high', 'critical'],
    buildVerdict: count =>
      `${count} one-time / non-recurring labels in the QofE. When this language appears 5+ times, the add-backs are structurally recurring — the buyer should isolate which "one-time" items repeat across 2-3+ years and re-classify them as run-rate operating expense.`,
  },
  {
    id: 'owner_comp_full_add_back',
    label: 'Owner-compensation full add-back',
    triggers: [
      /\bowner[\s-]?(?:salary|compensation|comp|bonus|distribution)/gi,
      /\bfounder[\s-]?(?:salary|compensation|comp)/gi,
      /\brelated[\s-]?party\b/gi,
    ],
    minTriggers: 1,
    severityLadder: ['medium', 'high', 'critical'],
    buildVerdict: count =>
      `${count} owner-/founder-/related-party-compensation references. The defensible add-back is the ABOVE-MARKET PORTION only — the buyer must hire a market-rate replacement, which is a real cost. If the QofE adds back the FULL owner comp, the adjusted EBITDA is materially overstated.`,
  },
  {
    id: 'speculative_run_rate',
    label: 'Speculative run-rate adjustments',
    triggers: [
      /\bpro[\s-]?forma\b/gi,
      /\brun[\s-]?rate\b/gi,
      /\bannualize[d]?\b/gi,
      /\bgo[\s-]?forward\b/gi,
    ],
    minTriggers: 2,
    severityLadder: ['low', 'medium', 'high'],
    buildVerdict: count =>
      `${count} pro-forma / run-rate / annualized adjustment references. Each must be backed by documented evidence (signed contracts, executed cancellations, dated headcount changes) — without those anchors, the adjustments are speculative.`,
  },
  {
    id: 'cherry_picked_wc',
    label: 'Working-capital normalization',
    triggers: [
      /\bworking[\s-]?capital\b/gi,
      /\bnet[\s-]?working[\s-]?capital\b/gi,
      /\bNWC\b/g,
      /\bWC peg\b/gi,
    ],
    minTriggers: 2,
    severityLadder: ['low', 'medium', 'high'],
    buildVerdict: count =>
      `${count} working-capital / NWC peg references. Cherry-picked WC normalization to a favourable period inflates apparent earnings; the QofE should disclose the baseline window (typically trailing 12 months) the peg derives from, with month-by-month backing.`,
  },
  {
    id: 'customer_concentration_undisclosed',
    label: 'Customer concentration disclosure',
    // INVERTED rule: we look for ABSENCE of customer-concentration language.
    // If a QofE doesn't mention customers, top-N share, key-account, or
    // concentration risk, that's itself a red flag — top-1/top-5 customer
    // share is required disclosure for any acquirer's decision.
    triggers: [
      /\btop[\s-]?(?:[125]|five|one|ten)[\s-]?(?:customer|client|account)/gi,
      /\bcustomer[\s-]?concentration\b/gi,
      /\bkey[\s-]?(?:customer|account)\b/gi,
      /\brevenue[\s-]?dependency\b/gi,
    ],
    // Inverted minTriggers — the flag fires when count is BELOW this
    // threshold, not above. Handled in scoreQofeAssessment via inversion.
    minTriggers: 1,
    severityLadder: ['high'], // single severity — undisclosed is undisclosed
    buildVerdict: count =>
      count === 0
        ? 'No customer-concentration disclosure detected in the QofE. Top-1 / top-5 customer share is required for any acquirer evaluating revenue dependency. The omission itself is the red flag.'
        : `${count} customer-concentration references — disclosure shape appears present.`,
  },
  {
    id: 'sell_side_commission_signal',
    label: 'Sell-side commission signal',
    triggers: [
      /\bsell[\s-]?side\b/gi,
      /\bvendor[\s-]?(?:DD|due[\s-]?diligence)\b/gi,
      /\bprepared[\s-]?for\s+(?:the[\s-]?)?(?:seller|target|company)/gi,
      /\bcommissioned[\s-]?by[\s-]?(?:the[\s-]?)?(?:seller|target|management)/gi,
    ],
    minTriggers: 1,
    severityLadder: ['medium'], // single severity — signal, not a smoking gun
    buildVerdict: count =>
      `${count} sell-side commission signals. A sell-side QofE has structural bias toward higher adjusted EBITDA — the buyer should commission their own buy-side QofE to stress-test material adjustments.`,
  },
];

// ─── EBITDA inflation signal (heuristic content density) ─────────────────────

const ADJ_EBITDA_LANGUAGE = [
  /\badjusted[\s-]?EBITDA\b/gi,
  /\bnormalized[\s-]?EBITDA\b/gi,
  /\bnormalised[\s-]?EBITDA\b/gi,
  /\bquality[\s-]?of[\s-]?earnings\b/gi,
];

function countQofeLanguageMatches(text: string): number {
  let total = 0;
  for (const pattern of ADJ_EBITDA_LANGUAGE) {
    const matches = text.match(pattern);
    total += matches ? matches.length : 0;
  }
  return total;
}

function computeAdjEbitdaInflationSignal(text: string): number {
  if (!text || text.length === 0) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;
  const totalMatches = countQofeLanguageMatches(text);
  // Normalise: 1 match per ~50 words = signal of 1.0 (saturation).
  // Most strategic memos have <1 match per 1000 words; a real QofE
  // hits the saturation band quickly.
  const signal = Math.min(1, (totalMatches * 50) / wordCount);
  return Number(signal.toFixed(3));
}

// ─── Severity computation ────────────────────────────────────────────────────

function severityFromCount(
  rule: PhraseRule,
  matchCount: number,
  inverted: boolean
): QofeSeverity | null {
  if (inverted) {
    // Customer-concentration rule fires when count is BELOW minTriggers.
    if (matchCount >= rule.minTriggers) return null; // disclosed → no flag
    // Always 'high' severity — undisclosed is undisclosed.
    return rule.severityLadder[0];
  }
  if (matchCount < rule.minTriggers) return null;
  // Severity escalates with match count over the minimum.
  const overflow = matchCount - rule.minTriggers;
  const idx = Math.min(overflow, rule.severityLadder.length - 1);
  return rule.severityLadder[idx];
}

// ─── Public scorer ───────────────────────────────────────────────────────────

export function scoreQofeAssessment(qofeText: string): QofeAssessment {
  const flags: QofeRedFlag[] = [];

  // The inverted customer-concentration rule only fires when the text
  // ACTUALLY looks like a QofE — otherwise any non-QofE memo that
  // mentions "Quality of Earnings" once would false-fire the "no
  // concentration disclosure" flag. Two-gate check: (a) raw count of
  // QofE-vocabulary hits (must be ≥3 distinct mentions, not just one
  // incidental reference), AND (b) the resulting density signal.
  const qofeLanguageCount = countQofeLanguageMatches(qofeText);
  const qofeShapeSignal = computeAdjEbitdaInflationSignal(qofeText);
  const looksLikeQofe = qofeLanguageCount >= 3 && qofeShapeSignal >= 0.05;

  for (const rule of RULES) {
    const isInverted = rule.id === 'customer_concentration_undisclosed';
    let totalMatches = 0;
    const matchedPhrases: string[] = [];
    for (const trigger of rule.triggers) {
      const matches = qofeText.match(trigger);
      if (matches) {
        totalMatches += matches.length;
        // Capture up to 3 sample matches per trigger for transparency.
        matchedPhrases.push(...matches.slice(0, 3));
      }
    }
    // Inverted rule guard: skip the "concentration not disclosed" flag
    // when the text doesn't have QofE shape AND no other QofE flags have
    // fired yet. A non-QofE memo that incidentally mentions "Quality of
    // Earnings" once should not trip this rule.
    if (isInverted && !looksLikeQofe && flags.length < 2) continue;

    const severity = severityFromCount(rule, totalMatches, isInverted);
    if (severity === null) continue;
    flags.push({
      id: rule.id,
      label: rule.label,
      severity,
      verdict: rule.buildVerdict(totalMatches),
      matchedPhrases: matchedPhrases.slice(0, 6),
    });
  }

  const severityCounts: Record<QofeSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const f of flags) severityCounts[f.severity] += 1;

  // Portfolio severity = max across all flags.
  let portfolioSeverity: QofeSeverity = 'low';
  if (severityCounts.critical > 0) portfolioSeverity = 'critical';
  else if (severityCounts.high > 0) portfolioSeverity = 'high';
  else if (severityCounts.medium > 0) portfolioSeverity = 'medium';

  // Commissioned-by detection.
  const sellSideMatch =
    /\b(?:sell[\s-]?side|vendor[\s-]?DD|prepared[\s-]?for[\s-]?(?:the[\s-]?)?(?:seller|target))/i.test(
      qofeText
    );
  const buySideMatch =
    /\b(?:buy[\s-]?side|prepared[\s-]?for[\s-]?(?:the[\s-]?)?(?:buyer|acquirer|investor))/i.test(
      qofeText
    );
  let commissionedBy: 'sell_side' | 'buy_side' | null = null;
  if (sellSideMatch && !buySideMatch) commissionedBy = 'sell_side';
  else if (buySideMatch && !sellSideMatch) commissionedBy = 'buy_side';

  const adjEbitdaInflationSignal = computeAdjEbitdaInflationSignal(qofeText);

  // Procurement-grade summary.
  let summary: string;
  if (flags.length === 0) {
    summary = `No QofE red flags detected. Adjusted-EBITDA language density ${(adjEbitdaInflationSignal * 100).toFixed(0)}% — well-structured QofE; apply standard buyer-side scrutiny.`;
  } else {
    const flagSummary = `${flags.length} flags · ${severityCounts.critical} critical · ${severityCounts.high} high · ${severityCounts.medium} medium · ${severityCounts.low} low`;
    summary = `${flagSummary}. Portfolio severity: ${portfolioSeverity}. ${
      commissionedBy === 'sell_side'
        ? 'Sell-side commissioned — apply Seller-Halo Filter throughout.'
        : commissionedBy === 'buy_side'
          ? 'Buy-side commissioned — defensible baseline.'
          : 'Commission signal unknown — treat with buyer-side skepticism.'
    }`;
  }

  return {
    redFlags: flags,
    severityCounts,
    adjEbitdaInflationSignal,
    commissionedBy,
    portfolioSeverity,
    summary,
  };
}
