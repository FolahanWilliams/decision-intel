/**
 * POST /api/audit/action-titles — LLM-augmented action-title generation
 * for the universal AuditDeliverable. Locked 2026-05-20.
 *
 * Architecture decision (from the 2026-05-20 build debate):
 *   - LLM scope is NARROW: only the 6 action titles per audit (cover +
 *     5 MECE buckets). Everything else in the deliverable is rendered
 *     directly from typed AnalysisResult fields.
 *   - Deterministic templates ALWAYS produce a valid title (see
 *     actionTitleTemplates.ts). The LLM call augments them with
 *     variation. On any failure — schema mismatch, banned vocab,
 *     count drift, network error — we fall back silently to the
 *     deterministic output.
 *   - Validation contract (validateActionTitle): ≤15 words, contains
 *     a digit (count or metric anchor), no banned vocabulary, count
 *     numbers match the real data.
 *
 * Model: deepseek/deepseek-v4-flash via Vercel AI Gateway. Per-call
 * cost ≈ $0.001 with 5K-token output budget. Vercel Gateway dashboard
 * tracks the spend.
 *
 * Rate limits:
 *   - Per-IP: 12 calls / minute (one per audit reasonable burst)
 *   - Global: 200 / hour to cap budget
 *
 * Authentication: open endpoint (the /demo flow needs anonymous
 * access). When the caller is authenticated, we honor it; when
 * anonymous, we still serve with stricter rate limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { extractIp } from '@/lib/utils/request';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/gateway-models';
import { validateActionTitle } from '@/lib/deliverable/actionTitleTemplates';
import { buildAuditDeliverable } from '@/lib/deliverable/buildAuditDeliverable';
import type { AnalysisResult } from '@/types';
import type { AuditDeliverable } from '@/lib/deliverable/types';

const log = createLogger('AuditActionTitles');

export const maxDuration = 30;

// ──────────────────────────────────────────────────────────────────────
// Request / response types
// ──────────────────────────────────────────────────────────────────────

interface ActionTitleRequest {
  result: AnalysisResult;
  documentId: string;
  analysisId: string | null;
  ticket?: {
    amount: number;
    currency: 'USD' | 'GBP' | 'EUR';
  };
}

interface ActionTitleResponse {
  cover: string;
  reasoningRisks: string;
  stressTest: string;
  historicalAnalogs: string;
  counterfactuals: string;
  provenance: string;
  /** Which titles came from the LLM vs the deterministic fallback.
   *  Useful for telemetry — if the fallback rate exceeds 50% we know
   *  the LLM is misfiring and should be re-prompted or replaced. */
  source: {
    cover: 'llm' | 'template';
    reasoningRisks: 'llm' | 'template';
    stressTest: 'llm' | 'template';
    historicalAnalogs: 'llm' | 'template';
    counterfactuals: 'llm' | 'template';
    provenance: 'llm' | 'template';
  };
}

// ──────────────────────────────────────────────────────────────────────
// LLM prompt construction
// ──────────────────────────────────────────────────────────────────────

function buildPrompt(deliverable: AuditDeliverable): string {
  const r = deliverable.source.analysisResult;
  const counts = deliverable.reasoningRisks.counts;
  const totalRisks = counts.critical + counts.high + counts.medium + counts.low;
  const verdict = deliverable.stressTest.overallVerdict ?? 'PENDING';
  const projectedLift = Math.round(
    deliverable.counterfactuals.bestCaseDqi - deliverable.counterfactuals.currentDqi
  );

  // Top-3 bias labels (for the LLM to potentially name)
  const topBiases = deliverable.reasoningRisks.findings
    .slice(0, 3)
    .map(f => f.label)
    .join(', ');

  const topPatterns = deliverable.reasoningRisks.findings
    .filter(f => f.kind === 'compound_pattern')
    .slice(0, 2)
    .map(f => f.label)
    .join(', ');

  const topDissenter = deliverable.stressTest.objections.find(
    o => o.kind === 'boardroom' && (o.vote === 'REJECT' || o.vote === 'REVISE')
  );

  return `You are writing 6 action titles for a procurement-grade audit deliverable.

RULES (every title must follow ALL of these):
1. Maximum 15 words.
2. Active sentence with a subject, verb, and conclusion (not a topic header).
3. Contains at least one specific count, metric, or named finding from the data below.
4. NEVER use banned phrases: "decision hygiene", "decision intelligence platform", "boardroom strategic decision", "always-on red team", "digital red team", "AI decision tool", "AI-powered decision platform", "native reasoning layer", "bad strategic decisions".
5. NEVER fabricate counts — use only the numbers given below.
6. Procurement-grade tone — no marketing fluff, no exclamation points.

AUDIT DATA:
- DQI score: ${Math.round(r.overallScore)}/100 (grade ${deliverable.cover.dqi.grade})
- Total reasoning risks: ${totalRisks} (${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low)
- Compound failure patterns: ${counts.namedPatterns}${topPatterns ? ` (${topPatterns})` : ''}
- Top biases (severity-sorted): ${topBiases || 'none'}
- Boardroom verdict: ${verdict} (${deliverable.stressTest.counts.approve} approve, ${deliverable.stressTest.counts.reject} reject, ${deliverable.stressTest.counts.revise} revise, ${deliverable.stressTest.counts.redTeam} red-team)
- Top dissenting reviewer: ${topDissenter ? `${topDissenter.persona} (${topDissenter.role}) — ${topDissenter.objection?.slice(0, 80)}` : 'none'}
- Forgotten questions: ${deliverable.historicalAnalogs.forgottenQuestions.length}${deliverable.historicalAnalogs.analogsUsed[0] ? ` (top analog: ${deliverable.historicalAnalogs.analogsUsed[0]})` : ''}
- Projected DQI lift if top mitigation applied: +${projectedLift} points (current ${Math.round(deliverable.counterfactuals.currentDqi)} → best case ${Math.round(deliverable.counterfactuals.bestCaseDqi)})
- Methodology: v${deliverable.provenance.methodologyVersion} · ${deliverable.provenance.pipelineNodeCount}-node pipeline · ${deliverable.provenance.calibrationBaseline.sampleSize}-case corpus · Brier ${deliverable.provenance.calibrationBaseline.meanBrier.toFixed(2)}

Write 6 action titles, ONE per line, in this exact order:
1. COVER (the executive summary's strongest sentence)
2. REASONING RISKS (what the audit found)
3. STRESS TEST (how the room will react)
4. HISTORICAL ANALOGS (what the comparables say)
5. COUNTERFACTUALS (what to fix)
6. PROVENANCE (how we know)

Output ONLY the 6 titles, one per line, no numbering, no labels, no explanations.`;
}

// ──────────────────────────────────────────────────────────────────────
// LLM output parsing + validation
// ──────────────────────────────────────────────────────────────────────

function parseLLMResponse(text: string): string[] {
  // Strip code fences if the model wrapped output
  const cleaned = text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim();
  // Lines, with leading numbers/dashes/bullets stripped
  return cleaned
    .split('\n')
    .map(line => line.replace(/^\s*(?:[\d]+[.)]|\*|-|•|–)\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Body parse
  // canonical req.json() body-parse exception class
  const body = (await req.json().catch(() => null)) as ActionTitleRequest | null;
  if (!body?.result || !body.documentId) {
    return apiError({
      error: 'Missing required fields: result, documentId.',
      status: 400,
    });
  }

  // 2. Rate limit (per-IP + global)
  const ip = extractIp(req);
  const ipLimit = await checkRateLimit(`audit-titles-ip:${ip}`, '/api/audit/action-titles', {
    windowMs: 60_000,
    maxRequests: 12,
    failMode: 'closed',
  });
  if (!ipLimit.success) {
    return apiError({
      error: 'Rate limit exceeded. Try again shortly.',
      status: 429,
    });
  }
  const globalLimit = await checkRateLimit('audit-titles-global', '/api/audit/action-titles', {
    windowMs: 60 * 60_000,
    maxRequests: 200,
    failMode: 'closed',
  });
  if (!globalLimit.success) {
    return apiError({
      error: 'Action-title generation at capacity for this hour. Falling back to templates.',
      status: 503,
    });
  }

  // 3. Compose the deterministic deliverable FIRST. This is the
  //    fallback source for every title. We do not even need to make
  //    an LLM call if the data is empty.
  const deliverable = buildAuditDeliverable(body.result, {
    documentId: body.documentId,
    analysisId: body.analysisId,
    ticket: body.ticket,
  });

  // 4. Try the LLM augmentation; fall back to templates on any failure
  const fallback: ActionTitleResponse = {
    cover: deliverable.cover.actionTitle,
    reasoningRisks: deliverable.reasoningRisks.actionTitle,
    stressTest: deliverable.stressTest.actionTitle,
    historicalAnalogs: deliverable.historicalAnalogs.actionTitle,
    counterfactuals: deliverable.counterfactuals.actionTitle,
    provenance: deliverable.provenance.actionTitle,
    source: {
      cover: 'template',
      reasoningRisks: 'template',
      stressTest: 'template',
      historicalAnalogs: 'template',
      counterfactuals: 'template',
      provenance: 'template',
    },
  };

  // Skip LLM call when AI_GATEWAY_API_KEY is absent (local dev without
  // the key configured) — fall back to templates cleanly.
  if (!process.env.AI_GATEWAY_API_KEY) {
    log.info('AI_GATEWAY_API_KEY missing; serving deterministic templates only.');
    return NextResponse.json(fallback);
  }

  let llmTitles: string[] = [];
  try {
    const prompt = buildPrompt(deliverable);
    const llm = await generateText(prompt, {
      model: MODEL_RECOMMENDATIONS,
      maxOutputTokens: 512,
      temperature: 0.5,
    });
    llmTitles = parseLLMResponse(llm.text);
  } catch (err) {
    // canonical fire-and-forget LLM-failure exception class — fall back
    // to deterministic templates without breaking the audit.
    log.warn('LLM action-title generation failed; falling back to templates.', err);
    return NextResponse.json(fallback);
  }

  // 5. Per-title validation + selective fallback
  const expectedCounts = {
    biasCount:
      deliverable.reasoningRisks.counts.critical +
      deliverable.reasoningRisks.counts.high +
      deliverable.reasoningRisks.counts.medium +
      deliverable.reasoningRisks.counts.low,
    namedPatternCount: deliverable.reasoningRisks.counts.namedPatterns,
    forgottenQuestionCount: deliverable.historicalAnalogs.forgottenQuestions.length,
  };

  const validated: ActionTitleResponse = { ...fallback };
  const bucketKeys: Array<keyof Omit<ActionTitleResponse, 'source'>> = [
    'cover',
    'reasoningRisks',
    'stressTest',
    'historicalAnalogs',
    'counterfactuals',
    'provenance',
  ];

  for (let i = 0; i < bucketKeys.length; i++) {
    const key = bucketKeys[i];
    const candidate = llmTitles[i];
    if (!candidate) continue; // keep template
    const v = validateActionTitle(candidate, { expectedCounts });
    if (v.ok) {
      validated[key] = candidate;
      validated.source[key] = 'llm';
    } else {
      log.warn(`LLM title rejected for ${key}: ${v.reason} — "${candidate}"`);
    }
  }

  return NextResponse.json(validated);
}
