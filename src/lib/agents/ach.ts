/**
 * ACH — Analysis of Competing Hypotheses (Heuer / CIA), locked 2026-07-02.
 *
 * The concrete, buyer-facing operationalization of the #1 recurring critical:
 * inside-view dominance + confirmation (DI-B-021 illusion_of_validity, DI-B-022
 * inside_view_dominance). ACH does NOT test the memo's thesis. It generates the
 * strongest bear case, then shows how much of the memo's own "support" is
 * NON-DIAGNOSTIC — equally true whether the thesis is right or wrong. The
 * load-bearing Heuer move: evidence consistent with EVERY hypothesis has zero
 * diagnostic value, even though it feels supportive. That is the confirmation
 * theater the engine exposes.
 *
 * Buyer takeaway: "the reasoning never argued against itself. Here is the case
 * it never confronted, and the tests that would have settled it."
 *
 * ADDITIVE + DISPLAY-ONLY (v1): no DQI / scoring / methodology change — same
 * posture as the bow-tie. The headline `nonDiagnosticShare` is DERIVED
 * deterministically from the evidence tags here (not an LLM-claimed number), so
 * the scalar the buyer feels is computed, not trusted. Blind-mode compatible:
 * pure reasoning over the document's own content, no retrieval — the most
 * blind-proof detector in the pipeline.
 *
 * HONESTY (load-bearing): a PROCESS observation, never a verdict on the thesis.
 * "The evidence is equally consistent with both outcomes" — never "your thesis
 * is wrong / your team missed this." Universal + ego-safe: every advocacy memo
 * has this, because it argues FOR the decision rather than testing it against
 * its strongest rival. Correlational, never "this will fail."
 */

export type AchDiagnosticity = 'supports_thesis_only' | 'supports_bear_only' | 'non_diagnostic';

export interface AchEvidenceItem {
  /** The memo's supporting point, paraphrased or verbatim. */
  claim: string;
  diagnosticity: AchDiagnosticity;
  /** One line: why it does or does not discriminate the thesis from the bear case. */
  note: string;
}

export interface AchResult {
  /** The memo's own claim (bull case), one line. */
  thesis: string;
  /** The strongest bear case a skeptic argues, one to two lines. */
  competingHypothesis: string;
  /** The memo's key supporting claims, classified. */
  evidence: AchEvidenceItem[];
  /** 0-1: fraction of the memo's support that does not discriminate. DERIVED
   *  from `evidence` (not trusted from the LLM) so the headline is deterministic. */
  nonDiagnosticShare: number;
  /** The evidence that WOULD settle it, that the memo lacks (Heuer's diagnostic gap). */
  missingDiagnosticTests: string[];
  /** Conditions that must hold for the thesis to beat the bear case. */
  whatWouldHaveToBeTrue: string[];
  /** Heuer step 8: signals it is going the other way. */
  watchItems?: string[];
}

const VALID_DIAGNOSTICITY: ReadonlySet<string> = new Set([
  'supports_thesis_only',
  'supports_bear_only',
  'non_diagnostic',
]);

/**
 * Derive the headline share deterministically from the classified evidence:
 * the fraction tagged `non_diagnostic`. Returns 0 for an empty list (no evidence
 * to judge → no confirmation-theater claim). This is the number the buyer feels,
 * and it is COMPUTED, never an LLM-claimed scalar.
 */
export function computeNonDiagnosticShare(evidence: readonly AchEvidenceItem[]): number {
  if (evidence.length === 0) return 0;
  const nonDiagnostic = evidence.filter(e => e.diagnosticity === 'non_diagnostic').length;
  return nonDiagnostic / evidence.length;
}

/**
 * Defensive parse of the LLM's structured output → an AchResult, or null when
 * the payload is unusable (malformed / missing thesis or bear case / no
 * classifiable evidence). Total: never throws. `nonDiagnosticShare` is always
 * RECOMPUTED from the parsed evidence (the LLM's own number, if any, is ignored).
 */
export function parseAchResult(raw: unknown): AchResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const thesis = typeof o.thesis === 'string' ? o.thesis.trim() : '';
  const competingHypothesis =
    typeof o.competingHypothesis === 'string' ? o.competingHypothesis.trim() : '';
  // The two hypotheses are load-bearing — without a thesis AND a bear case there
  // is no competing-hypotheses analysis to render.
  if (thesis.length < 3 || competingHypothesis.length < 3) return null;

  const rawEvidence = Array.isArray(o.evidence) ? o.evidence : [];
  const evidence: AchEvidenceItem[] = [];
  for (const item of rawEvidence) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const claim = typeof e.claim === 'string' ? e.claim.trim() : '';
    const diagnosticity = typeof e.diagnosticity === 'string' ? e.diagnosticity : '';
    if (claim.length < 3 || !VALID_DIAGNOSTICITY.has(diagnosticity)) continue;
    evidence.push({
      claim,
      diagnosticity: diagnosticity as AchDiagnosticity,
      note: typeof e.note === 'string' ? e.note.trim() : '',
    });
  }
  // No classifiable evidence → nothing to show. (The thesis/bear alone isn't a finding.)
  if (evidence.length === 0) return null;

  const cleanStrings = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map(x => x.trim())
      : [];

  return {
    thesis,
    competingHypothesis,
    evidence,
    nonDiagnosticShare: computeNonDiagnosticShare(evidence),
    missingDiagnosticTests: cleanStrings(o.missingDiagnosticTests),
    whatWouldHaveToBeTrue: cleanStrings(o.whatWouldHaveToBeTrue),
    ...(cleanStrings(o.watchItems).length > 0 ? { watchItems: cleanStrings(o.watchItems) } : {}),
  };
}

/**
 * The ACH prompt. One structured call: generate the strongest INDEPENDENT bear
 * case (not anchored to the memo's framing), then classify each key supporting
 * claim as diagnostic (discriminates) or non-diagnostic (confirmation theater).
 * The honesty guardrails are IN the prompt so the output stays ego-safe +
 * correlational by construction.
 */
export function buildAchPrompt(structuredContent: string, asOfNote?: string): string {
  return `You are a structured intelligence analyst running Analysis of Competing Hypotheses (Heuer, CIA) on a strategic / deal document. Your job is NOT to decide whether the thesis is right. Your job is to expose how much of the memo's OWN supporting evidence is NON-DIAGNOSTIC — equally true whether the thesis succeeds or fails — which is the signature of a case built by confirmation rather than by testing.

${asOfNote ? `${asOfNote}\n\n` : ''}THE ONE RULE (Heuer): evidence CONSISTENT WITH EVERY hypothesis has ZERO diagnostic value, even though it feels supportive. Rank by fewest inconsistencies, never by most support.

Steps:
1. State the memo's THESIS (its bull case) in one line, in the memo's own terms.
2. Generate the SINGLE STRONGEST BEAR CASE independently — the case a sharp, un-conflicted skeptic would argue. Do NOT anchor it to the memo's framing; construct the strongest opposing hypothesis on the merits.
3. Extract the memo's KEY SUPPORTING CLAIMS (the evidence it leans on). For each, classify diagnosticity:
   - "supports_thesis_only": discriminates IN FAVOUR of the thesis (true under the thesis, false/unlikely under the bear case).
   - "supports_bear_only": actually cuts toward the bear case.
   - "non_diagnostic": equally consistent with BOTH outcomes (TAM/market-growth narratives, mission/vision language, "operational rigor", momentum, past performance in a rising market — these feel supportive but do not discriminate).
   For each, a one-line note on WHY it does or does not discriminate.
4. List the MISSING DIAGNOSTIC TESTS: the specific evidence that WOULD have settled thesis-vs-bear, that the memo does not contain (e.g. signed take-or-pay contracts, contribution margin per mature unit, performance under a flat market, a defined kill-trigger). Their ABSENCE is the tell.
5. List WHAT WOULD HAVE TO BE TRUE for the thesis to beat the bear case.
6. Optionally, WATCH ITEMS: early signals it is going the other way.

HONESTY (mandatory): This is a PROCESS observation, never a verdict. NEVER say the thesis is wrong, the team was careless, or "you missed this." ALWAYS frame non-diagnostic evidence as "equally consistent with both outcomes" and as a UNIVERSAL property of building a case from inside the thesis. It is correlational (a reasoning-risk indicator), never a prediction of failure.

Return ONLY valid JSON, no prose, no code fences:
{
  "thesis": "…",
  "competingHypothesis": "…",
  "evidence": [{ "claim": "…", "diagnosticity": "supports_thesis_only|supports_bear_only|non_diagnostic", "note": "…" }],
  "missingDiagnosticTests": ["…"],
  "whatWouldHaveToBeTrue": ["…"],
  "watchItems": ["…"]
}

THE DOCUMENT:
${structuredContent}`;
}
