/**
 * Argument Builder — the Claim → Evidence → Counterargument → Rebuttal reasoning
 * drill (the one MindForge principle worth porting), folded into the Sparring
 * Room. Pure SSOT + logic (no I/O, no JSX, unit-tested).
 *
 * Why it's here and not its own gym: the founder's highest-leverage use of the
 * 4-part scaffold is investor-Q&A / pitch defence, which already lives in the
 * Sparring Room (same grader infra, same "rehearse under pressure" framing). It
 * trains structured reasoning — state a claim, evidence it, STEELMAN the best
 * objection, then rebut without dodging — which is exactly what a Series-A
 * diligence room and a skeptical CSO demand.
 *
 * The grade is LLM-produced (Grok via the gateway) with a deterministic mock
 * fallback; this module owns the categories, the 4-part scaffold, the rubric,
 * the result shape, the readiness check, and the mock.
 */

export const ARGUMENT_CATEGORIES = [
  {
    id: 'investor_objection',
    label: 'Investor objection',
    blurb: 'Defend against a Series-A-grade pushback.',
  },
  {
    id: 'moat_defense',
    label: 'Moat / “just a wrapper”',
    blurb: 'Defend the defensibility thesis.',
  },
  {
    id: 'category_claim',
    label: 'Category claim',
    blurb: 'Defend the reasoning-audit-platform positioning.',
  },
  {
    id: 'strategic_decision',
    label: 'Strategic decision',
    blurb: 'Defend a GTM or product call you made.',
  },
  {
    id: 'bring_your_own',
    label: 'Bring your own',
    blurb: 'Paste a claim you actually need to defend.',
  },
] as const;

export type ArgumentCategory = (typeof ARGUMENT_CATEGORIES)[number]['id'];

export const ARGUMENT_CATEGORY_IDS = ARGUMENT_CATEGORIES.map(c => c.id) as ArgumentCategory[];

export function isArgumentCategory(v: unknown): v is ArgumentCategory {
  return typeof v === 'string' && ARGUMENT_CATEGORY_IDS.includes(v as ArgumentCategory);
}

/** The 4-part scaffold — the load-bearing structure of a defensible argument. */
export const ARGUMENT_PARTS = [
  { key: 'claim', label: 'Claim', hint: 'The position you are defending — one crisp sentence.' },
  { key: 'evidence', label: 'Evidence', hint: 'Your strongest support — specific, not hand-wave.' },
  {
    key: 'counterargument',
    label: 'Counterargument',
    hint: 'STEELMAN the best objection — the strongest version, not a strawman.',
  },
  {
    key: 'rebuttal',
    label: 'Rebuttal',
    hint: 'Answer the counter head-on — concede what is true, then show why the claim still holds.',
  },
] as const;

export type ArgumentPartKey = (typeof ARGUMENT_PARTS)[number]['key'];

/** Scoring rubric — four 1-5 sub-scores the grader returns. */
export const ARGUMENT_RUBRIC = [
  { key: 'clarity', label: 'Clarity', blurb: 'Is the claim crisp and unambiguous?' },
  { key: 'logic', label: 'Logic', blurb: 'Does evidence actually support the claim?' },
  { key: 'evidence', label: 'Evidence', blurb: 'Is the support specific and credible?' },
  { key: 'rebuttal', label: 'Rebuttal strength', blurb: 'Does the rebuttal beat a real steelman?' },
] as const;

export type ArgumentRubricKey = (typeof ARGUMENT_RUBRIC)[number]['key'];
export const ARGUMENT_RUBRIC_KEYS = ARGUMENT_RUBRIC.map(r => r.key) as ArgumentRubricKey[];

export interface ArgumentInput {
  claim: string;
  evidence: string;
  counterargument: string;
  rebuttal: string;
}

export interface ArgumentResult {
  /** 0-100 overall. */
  overall: number;
  /** Each rubric dimension, 1-5. */
  subScores: Record<ArgumentRubricKey, number>;
  strengths: string[];
  improvements: string[];
  /** An expert-level rewrite of the strongest version of the argument. */
  modelAnswer: string;
  /** Whether the counterargument was a genuine steelman (the most common failure). */
  steelmanVerdict: 'steelman' | 'weak' | 'strawman';
  steelmanNote: string;
}

/** Seed claims per category — used as the mock "generate" output and as fallbacks. */
export const ARGUMENT_SEED_CLAIMS: Record<ArgumentCategory, string[]> = {
  investor_objection: [
    'Defend: a 16-year-old solo founder is an asset, not a risk, for this company.',
    'Defend: you can reach a first paying design partner without a GTM co-founder.',
  ],
  moat_defense: [
    'Defend: Decision Intel is more than a GPT wrapper, even though the audit engine is replicable.',
    'Defend: the moat is the accumulating decision→outcome record, not the prompt pipeline.',
  ],
  category_claim: [
    'Defend: "the reasoning audit platform" is an ownable category, not a feature.',
    'Defend: auditing reasoning is distinct from auditing data (BI) or models (model-risk tools).',
  ],
  strategic_decision: [
    'Defend: the four-persona wedge at £249/mo is the right Phase-1 motion over chasing enterprise.',
    'Defend: Sankore as an embedded design-partner is worth more than its monthly revenue.',
  ],
  bring_your_own: ['(Type the claim you need to defend.)'],
};

/** Pure: which parts are still empty. An argument is gradeable only when all four
 *  are filled (the scaffold is the point — a missing part is the lesson). */
export function argumentReadiness(input: Partial<ArgumentInput>): {
  complete: boolean;
  missing: ArgumentPartKey[];
} {
  const missing = ARGUMENT_PARTS.map(p => p.key).filter(k => !String(input[k] ?? '').trim());
  return { complete: missing.length === 0, missing };
}

function clampScore(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/** Coerce a raw LLM grade object into a safe ArgumentResult (never throws). */
export function normalizeArgumentResult(raw: unknown): ArgumentResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawSub = (r.subScores ?? {}) as Record<string, unknown>;
  const subScores = {} as Record<ArgumentRubricKey, number>;
  for (const k of ARGUMENT_RUBRIC_KEYS) subScores[k] = clampScore(rawSub[k], 1, 5, 3);
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  const verdict =
    r.steelmanVerdict === 'steelman' || r.steelmanVerdict === 'strawman'
      ? r.steelmanVerdict
      : 'weak';
  return {
    overall: clampScore(r.overall, 0, 100, 60),
    subScores,
    strengths: list(r.strengths),
    improvements: list(r.improvements),
    modelAnswer: typeof r.modelAnswer === 'string' ? r.modelAnswer.slice(0, 4000) : '',
    steelmanVerdict: verdict,
    steelmanNote: typeof r.steelmanNote === 'string' ? r.steelmanNote.slice(0, 600) : '',
  };
}

/** Deterministic mock (no API key) — honest placeholder, not a fake grade. */
export function mockArgumentResult(input: ArgumentInput): ArgumentResult {
  const counterLen = input.counterargument.trim().length;
  const steelmanVerdict = counterLen < 40 ? 'weak' : 'steelman';
  return {
    overall: 0,
    subScores: { clarity: 3, logic: 3, evidence: 3, rebuttal: 3 },
    strengths: ['All four parts present — the scaffold is complete.'],
    improvements: [
      'AI grading is unavailable in this environment (no API key) — set AI_GATEWAY_API_KEY for a real score.',
    ],
    modelAnswer: '',
    steelmanVerdict,
    steelmanNote:
      counterLen < 40
        ? 'Your counterargument is short — steelman it harder before relying on this drill.'
        : 'Counterargument has substance; configure the key for a graded rebuttal.',
  };
}
