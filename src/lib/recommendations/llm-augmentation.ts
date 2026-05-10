/**
 * Constellation Next Move — LLM augmentation layer.
 *
 * Locked 2026-05-10. Wraps the rule-based engine output with three
 * targeted enhancements paid for by the sub-cent deepseek-v4-flash
 * call (per the 2026-05-10 model-choice analysis):
 *
 *   1. semanticAssumptionMatching — re-runs the shared_assumption
 *      detector with semantic similarity. Catches "stable through
 *      2027" + "pre-IMF cycle holds" + "macro stable next 18m" all
 *      mapping to one underlying belief. The rule-based detector
 *      catches exact-match + filler-trim only.
 *
 *   2. enhancedWhyTrace — replaces the rule-built whyTrace string
 *      with persona-tuned procurement-grade prose. Same factual
 *      content, sharper language.
 *
 *   3. assumptionLabelRewrite — when the rule-based assumption
 *      label is the raw decisionFrame text (e.g. on a thesis
 *      cascade), rewrites to a canonical short-form assumption
 *      ("WAEMU debt-cycle stable through 2027").
 *
 * Discipline: this layer is OPTIONAL. The recommendations API
 * surface should fall back to the pure-rule output if (a) the
 * gateway is unreachable, (b) the LLM call times out, (c) the
 * Vercel Runtime Cache hit is fresh enough that no fresh LLM call
 * is needed. The rule-based output ALWAYS works.
 *
 * The intelligent-antagonist UI pattern (paper Ch 8) is what makes
 * the LLM call defensible: the user articulates THEIR priority
 * BEFORE seeing the algo's output. The LLM-enhanced wording is
 * compared against the user's prior, not consumed as truth.
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/gateway-models';
import { trackApiUsage } from '@/lib/utils/cost-tracker';
import { createLogger } from '@/lib/utils/logger';
import type { CrossDecisionPattern, NextMoveRecommendation } from './recommendation-types';
import { NEXT_MOVE_CATEGORIES } from './next-move-categories';

const log = createLogger('NextMoveLLM');

// ─── Prompts ───────────────────────────────────────────────────────

/**
 * System prompt for the augmentation layer. Frames the LLM as a
 * procurement-grade reasoning auditor, not a marketing writer. The
 * paper's anti-jargon discipline applies — banned phrases per
 * `BANNED_VOCABULARY` are excluded from the system prompt's
 * coaching examples, and the model is instructed to mirror the
 * persona's native compliance vocabulary.
 */
const AUGMENTATION_SYSTEM_PROMPT = `You are the reasoning-audit layer of Decision Intel — a procurement-grade decision-quality platform that audits the reasoning behind high-stakes corporate-development, M&A, and venture-capital decisions.

Your job on this call is to enhance pre-computed rule-based recommendations with persona-tuned prose. You do NOT invent recommendations or change rankings. You sharpen wording.

Voice rules:
- Procurement-grade. Cite-dense. Honest about limitations.
- Never use marketing-speak ("revolutionary", "game-changer", "AI-powered", "decision intelligence platform", "decision hygiene", "boardroom strategic decision").
- Mirror the persona's native compliance vocabulary (FCA / ISO 31000 / IIA Three Lines for GC; thesis fidelity / style drift for LP; sponsor mandate / synergy realization for PE-CSO; PMI retrospective / synergy operational for corp dev).
- Reference papers + frameworks by name when relevant (Kahneman & Klein 2009, Lovallo & Sibony Behavioral Strategy, Klein & Mitchell 1995 prospective hindsight, Bessemer Anti-Portfolio, Strategy Stack Theory).
- Be brief. Procurement readers will not read past 3 sentences.

Output format:
- Return strict JSON matching the requested schema.
- No prose outside the JSON.
- No markdown formatting inside string values.`;

// ─── Semantic-similarity assumption matching ───────────────────────

interface SemanticMatchInput {
  assumptions: Array<{ containerId: string; assumption: string }>;
}

interface SemanticMatchResult {
  groups: Array<{
    canonicalLabel: string;
    containerIds: string[];
    confidence: number;
  }>;
}

/**
 * Semantic-similarity grouping over structural assumptions across
 * containers. Catches "WAEMU debt cycle stable through 2027" +
 * "macro environment holds through next IMF article IV" +
 * "sovereign-rating stable through current cycle" as one group.
 *
 * Returns the rule-based input unchanged when the LLM call fails
 * or the input is too small to benefit (<3 assumptions).
 */
export async function semanticAssumptionMatching(
  input: SemanticMatchInput
): Promise<SemanticMatchResult> {
  if (input.assumptions.length < 3) {
    return { groups: [] };
  }

  const prompt = `You are grouping structural assumptions extracted from active strategic-decision artefacts. Each assumption is one belief the dependent decision rests on (a macro variable, regulatory regime, currency cycle, technological assumption, etc.).

Group assumptions that reference the SAME underlying belief, even when worded differently. "WAEMU debt cycle stable through 2027" and "sovereign-rating stable through current IMF cycle" should group together — they reference the same macro variable.

Only return groups with ≥3 distinct containerIds — singleton + pair-wise matches are not load-bearing for the cross-decision pattern detection.

Input:
${input.assumptions
  .map((a, i) => `[${i}] container=${a.containerId}: "${a.assumption}"`)
  .join('\n')}

Return strict JSON:
{
  "groups": [
    {
      "canonicalLabel": "<= 80 char canonical phrasing of the underlying belief",
      "containerIds": ["..."],
      "confidence": 0.0-1.0
    }
  ]
}

If no group has ≥3 containerIds, return {"groups":[]}.`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_RECOMMENDATIONS,
      system: AUGMENTATION_SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: 1024,
    });

    trackApiUsage({
      provider: 'gateway',
      operation: 'recommendations.semantic_assumption_matching',
      tokens: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
      metadata: { model: result.model, latencyMs: result.latencyMs },
    });

    const parsed = parseJsonStrict<SemanticMatchResult>(result.text);
    if (!parsed || !Array.isArray(parsed.groups)) {
      log.warn('semanticAssumptionMatching: malformed JSON; falling back to empty result');
      return { groups: [] };
    }
    return parsed;
  } catch (err) {
    log.warn('semanticAssumptionMatching failed; falling back to empty result:', err);
    return { groups: [] };
  }
}

// ─── Why-trace enhancement ─────────────────────────────────────────

interface EnhancedWhyTraceInput {
  recommendation: NextMoveRecommendation;
  persona: 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';
}

/**
 * Replaces the rule-built whyTrace with persona-tuned prose. Same
 * factual content (signals, weighting math, paper anchor) but
 * sharper language tailored to the reader.
 *
 * Returns the input recommendation's existing whyTrace unchanged
 * when the LLM call fails — never silently introduces fabricated
 * reasoning.
 */
export async function enhanceWhyTrace(input: EnhancedWhyTraceInput): Promise<string> {
  const { recommendation: rec, persona } = input;
  const cat = NEXT_MOVE_CATEGORIES[rec.categoryId];

  const prompt = `Rewrite this rule-based recommendation trace as procurement-grade prose for the ${persona.toUpperCase()} persona.

Original trace:
"${rec.whyTrace}"

Recommendation context:
- Category: ${cat.label} (${cat.description})
- Container: ${rec.containerName} (${rec.containerKind})
- Severity: ${rec.severity}
- Validity class: ${rec.validityClass}
- Final score: ${rec.finalScore}
- Score breakdown: base ${rec.scoreBreakdown.baseSeverityScore} × validity ${rec.scoreBreakdown.validityUrgencyMultiplier.toFixed(2)} × time-pressure ${rec.scoreBreakdown.timePressureMultiplier.toFixed(2)} × cross-decision ${rec.scoreBreakdown.crossDecisionMultiplier.toFixed(2)}
- Paper anchor: ${cat.paperAnchor}
- Trigger signal: ${cat.triggerSignal}

Persona vocabulary:
${personaVocabulary(persona)}

Write 3 sentences:
1. Name the trigger signal in the persona's native language.
2. Explain the weighting math in plain numbers.
3. Cite the paper anchor explicitly.

Return strict JSON: {"whyTrace": "<3 sentences>"}`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_RECOMMENDATIONS,
      system: AUGMENTATION_SYSTEM_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 512,
    });

    trackApiUsage({
      provider: 'gateway',
      operation: 'recommendations.enhance_why_trace',
      tokens: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
      metadata: { model: result.model, latencyMs: result.latencyMs },
    });

    const parsed = parseJsonStrict<{ whyTrace: string }>(result.text);
    if (!parsed?.whyTrace || typeof parsed.whyTrace !== 'string') {
      return rec.whyTrace;
    }
    return parsed.whyTrace;
  } catch (err) {
    log.warn('enhanceWhyTrace failed; falling back to rule-based trace:', err);
    return rec.whyTrace;
  }
}

// ─── Assumption-label rewrite (thesis cascade canonicalization) ───

/**
 * When a thesis_cascade pattern surfaces with a long decisionFrame
 * as the assumption label, rewrite to a ≤ 80-char canonical phrasing
 * the strip can render cleanly.
 *
 * Falls back to the input pattern unchanged when the LLM call fails.
 */
export async function canonicalizeAssumptionLabel(pattern: CrossDecisionPattern): Promise<string> {
  if (pattern.assumptionLabel.length <= 80) return pattern.assumptionLabel;

  const prompt = `Rewrite this strategic assumption as a ≤ 80 character canonical phrasing the constellation strip can render. Keep the load-bearing macro variable; drop filler words.

Input: "${pattern.assumptionLabel}"

Return strict JSON: {"label": "<= 80 chars"}`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_RECOMMENDATIONS,
      system: AUGMENTATION_SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: 256,
    });

    trackApiUsage({
      provider: 'gateway',
      operation: 'recommendations.canonicalize_assumption',
      tokens: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
      metadata: { model: result.model, latencyMs: result.latencyMs },
    });

    const parsed = parseJsonStrict<{ label: string }>(result.text);
    if (!parsed?.label || typeof parsed.label !== 'string') {
      return pattern.assumptionLabel;
    }
    return parsed.label.slice(0, 120);
  } catch (err) {
    log.warn('canonicalizeAssumptionLabel failed; falling back to raw label:', err);
    return pattern.assumptionLabel;
  }
}

// ─── User-priority intent extraction ───────────────────────────────

interface UserPriorityIntentResult {
  containerId: string | null;
  confidence: number;
}

/**
 * Maps the user-typed priority text to a containerId from the active
 * set. Used by the intelligent-antagonist UI to compute divergence
 * between the user's named priority and the algo's top pick.
 *
 * Returns { containerId: null } when the user-priority doesn't map
 * cleanly to a single container — divergence math handles null
 * gracefully.
 */
export async function extractUserPriorityIntent(input: {
  userText: string;
  candidates: Array<{ id: string; name: string; decisionFrame: string | null }>;
}): Promise<UserPriorityIntentResult> {
  if (input.candidates.length === 0) {
    return { containerId: null, confidence: 0 };
  }

  const prompt = `The user is naming the highest-priority decision in their pipeline before being shown algorithmic recommendations.

User text: "${input.userText}"

Candidate containers:
${input.candidates
  .map(
    c =>
      `- id=${c.id} · name="${c.name}"${c.decisionFrame ? ` · frame="${c.decisionFrame.slice(0, 80)}"` : ''}`
  )
  .join('\n')}

Map the user text to ONE candidate id, or return null if the text doesn't clearly reference any specific candidate (too generic, contradicts every candidate, names something not in the list).

Return strict JSON: {"containerId": "<id>" or null, "confidence": 0.0-1.0}`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_RECOMMENDATIONS,
      system: AUGMENTATION_SYSTEM_PROMPT,
      temperature: 0.1,
      maxOutputTokens: 256,
    });

    trackApiUsage({
      provider: 'gateway',
      operation: 'recommendations.user_priority_intent',
      tokens: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
      metadata: { model: result.model, latencyMs: result.latencyMs },
    });

    const parsed = parseJsonStrict<UserPriorityIntentResult>(result.text);
    if (!parsed) return { containerId: null, confidence: 0 };
    return {
      containerId: parsed.containerId ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
  } catch (err) {
    log.warn('extractUserPriorityIntent failed:', err);
    return { containerId: null, confidence: 0 };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function personaVocabulary(persona: 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other'): string {
  switch (persona) {
    case 'cso':
      return '- Audit-committee Q&A, ISO 31000, IIA Three Lines, FCA guidance, residual-risk documentation, regulatory enforcement defense.';
    case 'ma':
      return '- IC review, PMI retrospective, synergy realization vs forecast, integration cost vs forecast, customer-churn during integration, BCG/McKinsey M&A failure literature.';
    case 'bizops':
      return '- Sponsor mandate, LPA investment-discipline clauses, board pack, deployment of capital, Brier-scored calibration improvement, NACD director guidance.';
    case 'pe_vc':
      return '- LP letter, thesis fidelity, style drift, sourcing-funnel rigor, Brier-scored intermediate proxies (because terminal IRR is 5-10 yr away), Tetlock-anchored calibration.';
    case 'other':
      return '- Plain procurement language. No persona-specific compliance vocabulary.';
  }
}

function parseJsonStrict<T>(text: string): T | null {
  try {
    // Extract first JSON object — tolerant of surrounding whitespace,
    // BUT the system prompt explicitly forbids prose around the JSON,
    // so a strict object-extract is the right discipline.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
