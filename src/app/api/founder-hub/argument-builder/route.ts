/**
 * POST /api/founder-hub/argument-builder
 *
 * The Claim → Evidence → Counterargument → Rebuttal reasoning drill in the
 * Sparring Room. Two actions:
 *   { action: 'generate', category }            → { claim }   (a debatable claim to defend)
 *   { action: 'grade', input, claim, category } → ArgumentResult (0-100 + 4 sub-scores +
 *                                                  strengths/improvements + steelman verdict
 *                                                  + an expert model answer)
 *
 * Auth: founder-only (x-founder-pass). Model: Grok 4.3 via the AI Gateway
 * (founder-hub surface, single-user). Mock fallback when AI_GATEWAY_API_KEY
 * is missing. Pure logic + the result shape live in
 * [argument-builder.ts]; this route is the I/O + the LLM call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import {
  ARGUMENT_RUBRIC,
  ARGUMENT_SEED_CLAIMS,
  argumentReadiness,
  isArgumentCategory,
  mockArgumentResult,
  normalizeArgumentResult,
  type ArgumentCategory,
  type ArgumentInput,
} from '@/components/founder-hub/sparring/argument-builder';

const log = createLogger('ArgumentBuilder');

export const dynamic = 'force-dynamic';

function hasKey(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = match ? match[1] : text;
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(jsonText.slice(start, end + 1));
}

function seedClaim(category: ArgumentCategory): string {
  const seeds = ARGUMENT_SEED_CLAIMS[category] ?? ARGUMENT_SEED_CLAIMS.investor_objection;
  return seeds[0];
}

const CATEGORY_PROMPT: Record<ArgumentCategory, string> = {
  investor_objection:
    'a sharp Series-A-grade investor objection the founder (16, solo, pre-revenue, decision-intelligence startup) must defend against',
  moat_defense:
    'a defensibility / "isn\'t this just a GPT wrapper" challenge to Decision Intel that the founder must answer',
  category_claim:
    'a challenge to the "reasoning audit platform" category claim that the founder must defend',
  strategic_decision:
    "a challenge to one of the founder's GTM/product calls (e.g. the four-persona £249 wedge, Sankore as a design partner) that he must defend",
  bring_your_own: '',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyFounderPass(req.headers.get('x-founder-pass'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    action?: string;
    category?: string;
    claim?: string;
    input?: Partial<ArgumentInput>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const category: ArgumentCategory = isArgumentCategory(body.category)
    ? body.category
    : 'investor_objection';

  // ── generate a claim to defend ───────────────────────────────────
  if (body.action === 'generate') {
    if (category === 'bring_your_own') {
      return NextResponse.json({ claim: '' });
    }
    if (!hasKey()) return NextResponse.json({ claim: seedClaim(category) });
    const prompt = `Generate ONE debatable claim for a founder to defend in a reasoning drill. It should be ${CATEGORY_PROMPT[category]}. Make it specific and genuinely contestable (a real position with a real opposing view), one sentence, phrased as "Defend: ...". Return ONLY JSON: {"claim":""}`;
    try {
      const { text } = await generateText(prompt, { model: MODEL_FOUNDER_HUB, temperature: 0.7 });
      const parsed = extractJSON(text) as { claim?: string };
      const claim =
        typeof parsed.claim === 'string' && parsed.claim.trim() ? parsed.claim.trim() : '';
      return NextResponse.json({ claim: claim || seedClaim(category) });
    } catch (err) {
      log.warn('generate failed:', err);
      return NextResponse.json({ claim: seedClaim(category) });
    }
  }

  // ── grade a 4-part argument ──────────────────────────────────────
  const input: ArgumentInput = {
    claim: String(body.input?.claim ?? body.claim ?? '')
      .trim()
      .slice(0, 2000),
    evidence: String(body.input?.evidence ?? '')
      .trim()
      .slice(0, 2000),
    counterargument: String(body.input?.counterargument ?? '')
      .trim()
      .slice(0, 2000),
    rebuttal: String(body.input?.rebuttal ?? '')
      .trim()
      .slice(0, 2000),
  };
  const readiness = argumentReadiness(input);
  if (!readiness.complete) {
    return NextResponse.json(
      { error: `Fill all four parts first — missing: ${readiness.missing.join(', ')}.` },
      { status: 400 }
    );
  }

  if (!hasKey()) return NextResponse.json(mockArgumentResult(input));

  const rubric = ARGUMENT_RUBRIC.map(r => `- ${r.key} (${r.label}): ${r.blurb}`).join('\n');
  const prompt = `You are a rigorous reasoning coach grading a founder's argument, built on the Claim → Evidence → Counterargument → Rebuttal scaffold. Be demanding but fair, like a Series-A diligence partner. The single most common failure is a WEAK counterargument (a strawman the author can easily knock down) — judge whether the counterargument is a genuine STEELMAN of the strongest opposing case.

ARGUMENT:
Claim: ${input.claim}
Evidence: ${input.evidence}
Counterargument (their steelman attempt): ${input.counterargument}
Rebuttal: ${input.rebuttal}

Score each rubric dimension 1-5:
${rubric}

Also: give an overall 0-100, 2-4 concrete strengths, 2-4 concrete improvements, a steelman verdict ('steelman' | 'weak' | 'strawman') with a one-sentence note, and a modelAnswer — an expert-level rewrite of the STRONGEST version of this argument (all four parts, tight).

Return ONLY valid JSON:
{"overall":0,"subScores":{"clarity":0,"logic":0,"evidence":0,"rebuttal":0},"strengths":[],"improvements":[],"steelmanVerdict":"","steelmanNote":"","modelAnswer":""}`;

  try {
    const { text } = await generateText(prompt, {
      model: MODEL_FOUNDER_HUB,
      maxOutputTokens: 2000,
      temperature: 0.3,
    });
    return NextResponse.json(normalizeArgumentResult(extractJSON(text)));
  } catch (err) {
    log.warn('grade failed:', err);
    return NextResponse.json(
      { error: 'Could not grade the argument — try again.' },
      { status: 502 }
    );
  }
}
