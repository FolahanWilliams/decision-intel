/**
 * Algorithm Aversion — R²F paper-application #7 (locked 2026-05-07,
 * Tier-1 ship #3 of the wedge-batch-4 R²F sprint, completing the 10-paper
 * sprint to 10 of 10).
 *
 * Anchored in Dietvorst, Simmons & Massey (2015) "Algorithm Aversion:
 * People Erroneously Avoid Algorithms After Seeing Them Err" — Journal
 * of Experimental Psychology: General. Replicated across 5 experimental
 * conditions in the original paper and >15 follow-up studies through
 * 2023.
 *
 * The finding: humans are SYSTEMATICALLY MORE FORGIVING of human errors
 * than equivalent algorithm errors. After seeing a forecasting algorithm
 * err once, people prefer human judgment EVEN WHEN the algorithm is
 * statistically superior. Dietvorst et al. 2015 documented this as a
 * decision-making error pattern with the formal label "algorithm
 * aversion."
 *
 * The actionable consequence for strategic memos: when a memo dismisses
 * quantitative or systematic analysis in favor of narrative judgment
 * ("the numbers don't tell the whole story", "experience tells me",
 * "this is more art than science"), the memo is exhibiting a documented
 * cognitive bias — not exercising sophisticated qualitative judgment.
 * The DI audit should name the pattern with citation, not let it pass.
 *
 * Why this matters strategically: algorithm aversion is the SINGLE MOST
 * COMMON buyer objection to DI itself ("we don't want AI overriding our
 * CSO's judgment"). The detector counter-programs the objection — turns
 * it from a vague critique into an audited bias with a 2015 paper to
 * back it. Buyers who dismiss DI on algorithm-aversion grounds are
 * exhibiting the exact pattern DI detects.
 *
 * Verdict bands:
 *
 *   no_aversion_signal    — no dismissive-of-quantitative language
 *                           detected. The memo treats systematic
 *                           analysis on its merits.
 *
 *   mild_aversion         — 1-2 dismissive phrases at low/medium
 *                           severity. Worth surfacing but not blocking.
 *
 *   material_aversion     — 3+ dismissive phrases OR 2 at high severity
 *                           paired with authority-bias hits. The memo
 *                           is leaning on intuition over analysis in a
 *                           pattern Dietvorst et al. 2015 would name as
 *                           a documented error.
 *
 *   severe_aversion       — high-severity dismissive language across
 *                           multiple excerpts paired with
 *                           illusion_of_validity (DI-B-021) — the
 *                           classic "experienced operator overriding
 *                           the data" failure pattern.
 *
 *   cannot_assess         — insufficient signal in the supplied
 *                           excerpts to discriminate. Honest fallback.
 *
 * Pure function — no LLM call, no I/O. Deterministic for the same input.
 * Operates on bias-detective excerpts which already flow through the DPR
 * + insights data path. No new pipeline integration required.
 *
 * Wires through three surfaces (mirroring the established pattern):
 *   (a) /api/analysis/[id]/insights — extends AnalysisInsightsResponse
 *       with `algorithmAversion` so the document-detail UI can render
 *       it as a 7th SignalBlock.
 *   (b) DPR cover R²F strip set — renders as a §4.9 strip below
 *       Decision Rubric.
 *   (c) PaperApplicationsCard — surfaces the verdict on the live audit
 *       page with the same band as the DPR cover (no drift).
 *
 * Locked: 2026-05-07.
 */

export type AlgorithmAversionVerdict =
  | 'no_aversion_signal'
  | 'mild_aversion'
  | 'material_aversion'
  | 'severe_aversion'
  | 'cannot_assess';

export interface AlgorithmAversion {
  verdict: AlgorithmAversionVerdict;
  /** 0-1 scale of aversion-language detected, severity-weighted. */
  aversionScore: number;
  /** Number of distinct dismissive phrases matched in scanned text. */
  dismissivePhraseCount: number;
  /** Specific phrase classes that fired (e.g. 'gut_over_analysis',
   *  'art_not_science'). Surfaces in the DPR strip + UI tooltip. */
  patternsDetected: string[];
  /** Short verbatim snippets from the scanned text that triggered the
   *  detector. Capped at 3 for surface compactness. */
  flaggedSnippets: string[];
  /** Whether the bias detective also fired authority-bias or
   *  illusion_of_validity, which compound algorithm aversion in the
   *  Dietvorst et al. 2015 framing. */
  compoundBiasHits: string[];
  /** Procurement-grade single-sentence note. */
  note: string;
}

interface BiasInput {
  biasType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  excerpt?: string | null;
}

interface ComputeInput {
  biases: BiasInput[];
  /** Optional document summary — additional text to scan. */
  summary?: string | null;
}

/** Patterns that signal algorithm aversion. Each match contributes to
 *  the aversionScore. Tuned to catch the Dietvorst et al. 2015 mechanism
 *  without false-positives on legitimate qualitative reasoning. */
const AVERSION_PATTERNS: Array<{
  pattern: RegExp;
  patternClass: string;
  weight: number;
}> = [
  // "The numbers don't tell the whole story" / "data doesn't capture..."
  {
    pattern:
      /\b(?:numbers|data|spreadsheet|model|analysis|metrics)\s+(?:don'?t|do not|cannot|can'?t)\s+(?:tell|capture|show|reflect|account|measure)/i,
    patternClass: 'data_limitation_dismissal',
    weight: 0.3,
  },
  // "Experience tells me" / "my gut says" / "I trust my gut"
  {
    pattern:
      /\b(?:experience|gut|instinct|intuition)\s+(?:tells?|says?|told|whispers?)\s+(?:me|us)\b/i,
    patternClass: 'gut_over_analysis',
    weight: 0.25,
  },
  // "I trust my gut" / "trust the gut" / "go with my gut"
  {
    pattern: /\b(?:trust|go(?:ing)?\s+with|follow(?:ing)?)\s+(?:my|our|the)\s+(?:gut|instinct)/i,
    patternClass: 'gut_trust',
    weight: 0.3,
  },
  // "This is more art than science" / "art, not science"
  {
    pattern: /\b(?:more\s+art\s+than\s+science|art,?\s+not\s+science|art\s+vs\.?\s+science)/i,
    patternClass: 'art_not_science',
    weight: 0.35,
  },
  // "You can't capture this in a spreadsheet" / "no model can capture"
  {
    pattern:
      /\b(?:can'?t|cannot|no\s+model|no\s+algorithm|no\s+spreadsheet)\s+(?:capture|model|quantify|measure)/i,
    patternClass: 'capture_dismissal',
    weight: 0.3,
  },
  // "Quantitative analysis misses" / "qualitative truth"
  {
    pattern:
      /\b(?:quantitative|systematic|algorithmic|model[- ]based)\s+(?:analysis|approach)\s+(?:misses|fails|overlooks|ignores)/i,
    patternClass: 'quant_misses',
    weight: 0.3,
  },
  // "Despite what the data says" / "the data may say X but..."
  {
    pattern:
      /\b(?:despite|notwithstanding|regardless\s+of)\s+(?:what\s+)?(?:the\s+)?(?:data|numbers|model|analysis)\b/i,
    patternClass: 'data_overrule',
    weight: 0.25,
  },
  // "Pattern recognition over base rates"
  {
    pattern:
      /\bpattern\s+recognition\s+(?:over|beats|trumps|outweighs)\s+(?:base\s+rates?|statistics|data)/i,
    patternClass: 'pattern_over_base_rate',
    weight: 0.3,
  },
  // "We've seen this before" without external reference class
  {
    pattern: /\bwe(?:'ve|\s+have)\s+seen\s+this\s+(?:before|pattern|kind\s+of\s+thing)/i,
    patternClass: 'experience_pattern_claim',
    weight: 0.15,
  },
  // "Soft factors" / "intangibles" dismissal of quantification
  {
    pattern:
      /\b(?:soft\s+factors|intangibles?|qualitative\s+factors)\s+(?:dominate|outweigh|matter\s+more|trump)/i,
    patternClass: 'soft_factors_dominance',
    weight: 0.2,
  },
];

/** Biases that compound algorithm aversion. The 2015 paper notes that
 *  algorithm aversion is rarely a standalone error — it pairs with
 *  authority bias (the senior expert overrules the model), illusion of
 *  validity (narrative coherence beats data), and inside-view dominance
 *  (this case is special, the model doesn't apply). */
const COMPOUND_BIAS_TYPES = new Set([
  'authority_bias',
  'illusion_of_validity',
  'inside_view_dominance',
  'overconfidence_bias',
]);

const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical: 1.0,
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

/** Compute the algorithm-aversion verdict.
 *
 *  Algorithm:
 *    1. Concatenate scannable text — bias.excerpt across biases plus
 *       optional summary. Scan against AVERSION_PATTERNS; sum weighted
 *       matches → aversionScore ∈ [0, 1].
 *    2. Identify compound bias hits (authority / illusion_of_validity /
 *       inside_view / overconfidence) at high+ severity. Each compound
 *       hit elevates the verdict band by one notch (mild → material →
 *       severe).
 *    3. Map to verdict band.
 *
 *  Pure function — same input → same output. */
export function computeAlgorithmAversion(input: ComputeInput): AlgorithmAversion {
  const scannableSegments: Array<{ text: string; severity: string }> = [];
  for (const b of input.biases) {
    if (b.excerpt && b.excerpt.trim().length > 0) {
      scannableSegments.push({ text: b.excerpt, severity: b.severity });
    }
  }
  if (input.summary && input.summary.trim().length > 0) {
    scannableSegments.push({ text: input.summary, severity: 'medium' });
  }
  const haystack = scannableSegments.map(s => s.text).join('\n\n');

  // Pattern matches with severity weighting
  const patternsDetected: string[] = [];
  const flaggedSnippets: string[] = [];
  let aversion = 0;
  if (haystack.length > 0) {
    for (const { pattern, patternClass, weight } of AVERSION_PATTERNS) {
      const match = haystack.match(pattern);
      if (match) {
        patternsDetected.push(patternClass);
        // Find the segment that contained the match for severity weighting
        const matchingSegment = scannableSegments.find(s => pattern.test(s.text));
        const sev = matchingSegment?.severity ?? 'medium';
        const sevMult = SEVERITY_MULTIPLIER[sev] ?? 0.6;
        aversion += weight * sevMult;
        // Capture a short snippet for surface display (capped at 100 chars)
        const snippet = match[0].slice(0, 100);
        if (flaggedSnippets.length < 3 && !flaggedSnippets.includes(snippet)) {
          flaggedSnippets.push(snippet);
        }
      }
    }
  }
  aversion = Math.min(1.0, aversion);
  const dismissivePhraseCount = patternsDetected.length;

  // Compound bias hits — only count high+ severity (medium is too noisy)
  const compoundBiasHits: string[] = [];
  for (const b of input.biases) {
    if (
      COMPOUND_BIAS_TYPES.has(b.biasType) &&
      (b.severity === 'critical' || b.severity === 'high')
    ) {
      compoundBiasHits.push(`${b.biasType} (${b.severity})`);
    }
  }

  // Verdict band selection — base verdict from aversion score, then
  // elevated by compound bias hits.
  let verdict: AlgorithmAversionVerdict;
  if (haystack.length === 0) {
    verdict = 'cannot_assess';
  } else if (aversion >= 0.65 || (aversion >= 0.45 && compoundBiasHits.length >= 2)) {
    verdict = 'severe_aversion';
  } else if (aversion >= 0.4 || (aversion >= 0.25 && compoundBiasHits.length >= 1)) {
    verdict = 'material_aversion';
  } else if (aversion >= 0.15 || dismissivePhraseCount >= 1) {
    verdict = 'mild_aversion';
  } else {
    verdict = 'no_aversion_signal';
  }

  return {
    verdict,
    aversionScore: round2(aversion),
    dismissivePhraseCount,
    patternsDetected: Array.from(new Set(patternsDetected)),
    flaggedSnippets,
    compoundBiasHits,
    note: buildNote(
      verdict,
      aversion,
      dismissivePhraseCount,
      patternsDetected,
      compoundBiasHits,
      flaggedSnippets
    ),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildNote(
  verdict: AlgorithmAversionVerdict,
  score: number,
  count: number,
  patterns: string[],
  compoundHits: string[],
  snippets: string[]
): string {
  const compoundClause =
    compoundHits.length > 0
      ? ` Compounded by ${compoundHits.slice(0, 2).join(' + ')} bias hits — the canonical Dietvorst pattern of authority + narrative coherence overruling systematic analysis.`
      : '';
  switch (verdict) {
    case 'no_aversion_signal':
      return `No algorithm-aversion language detected — the memo treats quantitative + systematic analysis on its merits without dismissive framing. Per Dietvorst et al. (2015), this is the structurally robust posture; humans who override calibrated models add noise, not signal.${compoundClause}`;
    case 'mild_aversion': {
      const patternLabel = patterns.slice(0, 2).join(', ');
      return `Mild algorithm-aversion signal detected (${count} dismissive phrase${count === 1 ? '' : 's'} · ${patternLabel}). Per Dietvorst et al. (2015), even mild aversion language reflects a documented bias — humans systematically over-trust intuition relative to calibrated analysis. Surface but no audit-committee flag fires. Aversion score ${score.toFixed(2)}.${compoundClause}`;
    }
    case 'material_aversion': {
      const snippetLabel = snippets[0] ? `"${snippets[0].trim()}"` : '';
      return `Material algorithm-aversion pattern: ${count} dismissive phrases detected ${snippetLabel ? `(e.g. ${snippetLabel})` : ''}. Per Dietvorst, Simmons & Massey (2015) "Algorithm Aversion," this is a documented decision-making error — humans systematically over-trust their intuition after seeing a model err, even when the model remains statistically superior. The memo's reasoning leans on intuition over analysis in a pattern that reduces predictive accuracy. Aversion score ${score.toFixed(2)}.${compoundClause}`;
    }
    case 'severe_aversion': {
      const snippetLabel = snippets
        .slice(0, 2)
        .map(s => `"${s.trim()}"`)
        .join(' / ');
      return `Procurement-blocker class: severe algorithm-aversion pattern (${count} dismissive phrases · score ${score.toFixed(2)})${snippetLabel ? ` — flagged language: ${snippetLabel}` : ''}. Per Dietvorst et al. (2015), this is the canonical "experienced operator overruling the data" failure pattern; the more confidently the memo dismisses systematic analysis, the more vulnerable its conclusions are to the documented bias. Recommend reframing the memo's confidence around the systematic analysis it currently overrules.${compoundClause}`;
    }
    case 'cannot_assess':
      return 'Algorithm-aversion verdict cannot be assessed — no scannable text in the supplied bias excerpts.';
  }
}

/** Surface a one-word band label for the DPR strip + UI eyebrow. */
export function algorithmAversionVerdictLabel(verdict: AlgorithmAversionVerdict): string {
  switch (verdict) {
    case 'no_aversion_signal':
      return 'No aversion signal';
    case 'mild_aversion':
      return 'Mild aversion';
    case 'material_aversion':
      return 'Material aversion';
    case 'severe_aversion':
      return 'Severe aversion';
    case 'cannot_assess':
      return 'Cannot assess';
  }
}
