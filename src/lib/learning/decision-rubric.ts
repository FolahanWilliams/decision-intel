/**
 * Decision Rubric Structure — R²F paper-application #4 (locked
 * 2026-05-07, Tier-1 ship #2 of the wedge-batch-4 R²F sprint).
 *
 * Anchored in Robyn Dawes' 1979 American Psychologist paper "The Robust
 * Beauty of Improper Linear Models in Decision Making" — one of the
 * most-cited and most-counter-intuitive findings in decision research.
 * Dawes showed that a SIMPLE LINEAR COMBINATION of relevant features —
 * each criterion weighted equally, OR weighted with random coefficients
 * — consistently outperforms expert judgment on prediction tasks.
 *
 * The expert's intuition adds NOISE, not signal. The structured rubric
 * outperforms the structured rubric + expert override. Dawes' finding
 * has been replicated across 50+ years of decision research (graduate-
 * student selection, parole decisions, medical diagnoses, mental-health
 * intake, financial-planning recommendations).
 *
 * The actionable consequence for strategic memos: the most reliable
 * memos are STRUCTURED — they identify decision criteria, weight them
 * (even equally), and evaluate options against the criteria. The least
 * reliable memos are NARRATIVE-ONLY — they argue for a foregone
 * conclusion through narrative coherence (which the bias detective
 * already flags as illusion_of_validity / DI-B-021).
 *
 * The Decision Rubric Structure detector closes this loop on the audit
 * surface. It scans the bias detective's flagged excerpts for rubric
 * markers (numbered criteria, weighted criteria, comparison tables,
 * options vs. criteria language) AND for narrative-only signals (the
 * existing illusion_of_validity / inside_view_dominance / narrative
 * fallacy hits). The verdict tells a procurement reader, in one
 * sentence, whether the memo follows Dawes' robust pattern or
 * structurally invites the inside-view error.
 *
 * Verdict bands:
 *
 *   explicit_rubric        — multiple structural markers detected:
 *                            numbered criteria + weights + comparison.
 *                            The memo follows Dawes' robust pattern.
 *
 *   partial_criteria       — some structural signal (criteria listed
 *                            without weights, or options compared
 *                            without criteria framework) but not the
 *                            full rubric pattern. Mixed.
 *
 *   narrative_dominant     — predominantly narrative argument with
 *                            confidence-language bias hits but no
 *                            structural counter-signal. Inside-view
 *                            error pattern likely.
 *
 *   narrative_only         — narrative-only with multiple confidence-
 *                            language bias hits at high severity. The
 *                            canonical Dawes-failure pattern.
 *
 *   cannot_assess          — insufficient signal in the supplied
 *                            excerpts to discriminate. Honest fallback.
 *
 * Pure function — no LLM call, no I/O. Deterministic for the same input.
 * Operates on bias-detective output (excerpts + bias types + severity)
 * which already flows through the DPR + insights data path. No new
 * pipeline integration required.
 *
 * Wires through three surfaces (mirroring the established pattern):
 *   (a) /api/analysis/[id]/insights — extends AnalysisInsightsResponse
 *       with `decisionRubric` so the document-detail UI can render it
 *       as a 6th SignalBlock.
 *   (b) DPR cover R²F strip set — renders as a §4.8 strip below
 *       Fractionation of Expertise.
 *   (c) PaperApplicationsCard — surfaces the verdict on the live audit
 *       page with the same band as the DPR cover (no drift).
 *
 * Locked: 2026-05-07.
 */

export type DecisionRubricVerdict =
  | 'explicit_rubric'
  | 'partial_criteria'
  | 'narrative_dominant'
  | 'narrative_only'
  | 'cannot_assess';

export interface DecisionRubric {
  verdict: DecisionRubricVerdict;
  /** 0-1 score for structural-rubric signals detected in scanned excerpts. */
  structureScore: number;
  /** 0-1 score for narrative-coherence signals (severity-weighted bias
   *  hits on illusion_of_validity / inside_view_dominance + structural
   *  absence). */
  narrativeScore: number;
  /** Specific structural markers detected (deduplicated). */
  structuralMarkers: string[];
  /** Specific narrative bias hits that contributed (deduplicated). */
  narrativeTriggers: string[];
  /** Procurement-grade single-sentence note. */
  note: string;
}

interface BiasInput {
  biasType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Optional verbatim excerpt the bias detective flagged. The detector
   *  scans these for structural markers — when no excerpts are present,
   *  the verdict falls back to bias-signal-only inference. */
  excerpt?: string | null;
}

interface ComputeInput {
  biases: BiasInput[];
  /** Optional document summary — additional text to scan for rubric
   *  markers. analysis.summary is the natural source. */
  summary?: string | null;
}

/** Patterns that signal rubric structure. Each match contributes to the
 *  structureScore; multiple distinct matches compound (capped at 1.0). */
const RUBRIC_PATTERNS: Array<{ pattern: RegExp; marker: string; weight: number }> = [
  // Numbered or bulleted criteria lists with multiple items
  {
    pattern: /(?:criteria|criterion)\s*(?::|—|–)\s*(?:\n\s*[-•*\d]|\b\d+[.)])/i,
    marker: 'criteria_list_marker',
    weight: 0.25,
  },
  // Explicit weights ("30% weight" / "weight 0.3" / "weighted at 30%")
  {
    pattern: /\bweight(?:ed)?\b.{0,20}\b(?:\d+\s*%|0?\.\d+)/i,
    marker: 'weighted_criteria',
    weight: 0.3,
  },
  // Decision matrix / scoring table language
  {
    pattern:
      /\b(?:decision\s+matrix|scoring\s+(?:table|matrix|rubric)|evaluat(?:ion|ed)\s+matrix)\b/i,
    marker: 'decision_matrix',
    weight: 0.25,
  },
  // "Scored each option" / "rated alternatives" language
  {
    pattern: /\b(?:scored|rated|ranked)\s+(?:each|every|all)?\s*(?:option|alternative|candidate)/i,
    marker: 'scored_alternatives',
    weight: 0.2,
  },
  // "Evaluated against the following criteria"
  {
    pattern:
      /\b(?:evaluated|assessed|measured)\s+against\s+(?:the\s+)?(?:following|these)\s+criteria/i,
    marker: 'criteria_evaluation_phrase',
    weight: 0.2,
  },
  // Multiple "Option A/B/C" or "Option 1/2/3" references in close proximity
  // Uses [\s\S] in lieu of `s` regex flag for ES2017 compatibility.
  {
    pattern: /\boption\s+(?:a|b|c|d|1|2|3|4)\b[\s\S]*?\boption\s+(?:a|b|c|d|1|2|3|4)\b/i,
    marker: 'multi_option_comparison',
    weight: 0.2,
  },
  // Trade-off / tradeoff structured language
  {
    pattern: /\btrade[-\s]?offs?\s*(?::|—|–|\()/i,
    marker: 'tradeoff_structure',
    weight: 0.15,
  },
];

/** Confidence-language biases that signal narrative-only argument. The
 *  same biases that drive the Calibrated Rejection detector — but here
 *  we read them as evidence of structural absence rather than as
 *  rhetorical confidence. */
const NARRATIVE_BIAS_WEIGHTS: Record<string, number> = {
  illusion_of_validity: 0.35, // DI-B-021 — narrative coherence creating false confidence
  inside_view_dominance: 0.3, // DI-B-022 — projecting from inside narrative without comparables
  narrative_fallacy: 0.3,
  confirmation_bias: 0.15, // narrative-supporting evidence selection
  halo_effect: 0.1,
};

const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical: 1.0,
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

/** Compute the decision-rubric verdict.
 *
 *  Algorithm:
 *    1. Concatenate scannable text — every bias.excerpt that exists,
 *       plus the optional summary. Scan against RUBRIC_PATTERNS and
 *       sum match weights → structureScore ∈ [0, 1].
 *    2. Sum severity-weighted hits on confidence-language biases →
 *       narrativeScore ∈ [0, 1].
 *    3. Compare the two and map to a verdict band.
 *
 *  Pure function — same input → same output. */
export function computeDecisionRubric(input: ComputeInput): DecisionRubric {
  const scannableSegments: string[] = [];
  for (const b of input.biases) {
    if (b.excerpt && b.excerpt.trim().length > 0) {
      scannableSegments.push(b.excerpt);
    }
  }
  if (input.summary && input.summary.trim().length > 0) {
    scannableSegments.push(input.summary);
  }
  const haystack = scannableSegments.join('\n\n');

  // Structural markers
  const structuralMarkers: string[] = [];
  let structure = 0;
  if (haystack.length > 0) {
    for (const { pattern, marker, weight } of RUBRIC_PATTERNS) {
      if (pattern.test(haystack)) {
        structuralMarkers.push(marker);
        structure += weight;
      }
    }
  }
  structure = Math.min(1.0, structure);

  // Narrative triggers
  const narrativeTriggers: string[] = [];
  let narrative = 0;
  for (const b of input.biases) {
    const weight = NARRATIVE_BIAS_WEIGHTS[b.biasType];
    if (!weight) continue;
    const sevMult = SEVERITY_MULTIPLIER[b.severity] ?? 0;
    narrative += weight * sevMult;
    narrativeTriggers.push(`${b.biasType} (${b.severity})`);
  }
  narrative = Math.min(1.0, narrative);

  // Verdict band selection. The two scores are NOT mutually exclusive —
  // a memo can have both rubric structure AND confidence-language hits.
  // The verdict reflects which signal dominates.
  let verdict: DecisionRubricVerdict;
  if (haystack.length === 0 && input.biases.length === 0) {
    verdict = 'cannot_assess';
  } else if (structure >= 0.5 && structure - narrative >= 0.15) {
    verdict = 'explicit_rubric';
  } else if (structure >= 0.3 && narrative < 0.5) {
    verdict = 'partial_criteria';
  } else if (narrative >= 0.6 && structure < 0.2) {
    verdict = 'narrative_only';
  } else if (narrative >= 0.3) {
    verdict = 'narrative_dominant';
  } else if (structure < 0.2 && narrative < 0.3) {
    // Low signal on both axes — honest fallback rather than guessing
    verdict = 'cannot_assess';
  } else {
    verdict = 'partial_criteria';
  }

  return {
    verdict,
    structureScore: round2(structure),
    narrativeScore: round2(narrative),
    structuralMarkers,
    narrativeTriggers,
    note: buildNote(verdict, structure, narrative, structuralMarkers, narrativeTriggers),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildNote(
  verdict: DecisionRubricVerdict,
  structure: number,
  narrative: number,
  markers: string[],
  triggers: string[]
): string {
  switch (verdict) {
    case 'explicit_rubric': {
      const markerLabel = markers.slice(0, 3).join(', ');
      return `Memo follows Dawes' (1979) robust pattern — explicit decision criteria with structured comparison (${markerLabel || 'multiple structural markers'}). Per "The Robust Beauty of Improper Linear Models," this structure outperforms intuitive expert override on prediction tasks; the memo's reasoning is more reliable than narrative-coherent alternatives. Structure score ${structure.toFixed(2)} · narrative score ${narrative.toFixed(2)}.`;
    }
    case 'partial_criteria':
      return `Memo carries some structural decision-rubric markers (${markers.length} detected) but the rubric is incomplete — criteria listed without weights, or options compared without an explicit criteria framework. Per Dawes (1979), partial structure helps but the full robust pattern requires (a) explicit criteria, (b) weights (even equal), (c) systematic option-vs-criterion evaluation. Strengthen the missing elements before audit-committee submission. Structure ${structure.toFixed(2)} · narrative ${narrative.toFixed(2)}.`;
    case 'narrative_dominant': {
      const triggerLabel = triggers.slice(0, 2).join(', ');
      return `Memo reads as narrative-dominant rather than rubric-structured (${triggerLabel || 'confidence-language signals detected'}). Per Dawes (1979), narrative coherence is NOT a substitute for structured criteria-vs-options evaluation; experts who override the rubric add noise, not signal. Recommend reformatting around explicit criteria + weights + option scoring before the steering committee reads it. Structure ${structure.toFixed(2)} · narrative ${narrative.toFixed(2)}.`;
    }
    case 'narrative_only': {
      const triggerLabel = triggers.slice(0, 3).join(', ');
      return `Procurement-blocker class: memo follows the canonical Dawes-failure pattern — narrative-only argument with multiple confidence-language bias hits (${triggerLabel}) and no structural counter-signal. Per "The Robust Beauty of Improper Linear Models" (Dawes 1979), this is precisely the structure that DECREASES prediction accuracy relative to a simple equal-weight rubric. Recommend reformatting the memo around explicit criteria before committee submission. Structure ${structure.toFixed(2)} · narrative ${narrative.toFixed(2)}.`;
    }
    case 'cannot_assess':
      return 'Decision rubric structure cannot be assessed — insufficient signal in the available excerpts. The detector requires either (a) bias-detective excerpts with text content, OR (b) confidence-language bias hits, to produce a verdict.';
  }
}

/** Surface a one-word band label for the DPR strip + UI eyebrow. */
export function decisionRubricVerdictLabel(verdict: DecisionRubricVerdict): string {
  switch (verdict) {
    case 'explicit_rubric':
      return 'Explicit rubric';
    case 'partial_criteria':
      return 'Partial criteria';
    case 'narrative_dominant':
      return 'Narrative-dominant';
    case 'narrative_only':
      return 'Narrative-only';
    case 'cannot_assess':
      return 'Cannot assess';
  }
}
