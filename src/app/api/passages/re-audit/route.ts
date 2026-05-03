import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { parseJSON } from '@/lib/utils/json';

const log = createLogger('PassageReAudit');

// Tight passage-level re-audit for the dashboard's inline "rewrite what we
// flagged" affordance. Deliberately NOT the full audit pipeline — that is
// reserved for documents and costs ~£0.40 per run. This endpoint runs a
// single focused Gemini call (~£0.02-0.05) against a short passage and
// returns a bias list so the user sees their change reflected in < 5
// seconds.
//
// The response also computes an `estimatedDqi` heuristic field (kept for
// API back-compat) — but as of the 2026-04-25 audit the UI deliberately
// surfaces the BIAS-COUNT delta instead of any numeric DQI proxy. A
// passage-level estimate can drift from the full-pipeline score, and a
// strategist who sees "B+ on the passage, C on the full memo" is the
// trust-collapse moment we'd rather not ship. Bias-count delta is a
// directionally honest signal and that's what the UI shows.

const MAX_PASSAGE_LENGTH = 6000; // ~1,500 tokens; keeps the Gemini call fast + cheap
const RATE_LIMIT_KEY_PREFIX = 'passage-reaudit';

type PassageBias = {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
};

type PassageAuditResult = {
  biases: PassageBias[];
  estimatedDqi: number;
  originalDqi?: number;
  delta?: number;
  disclaimer: string;
  passageLength: number;
};

const SEVERITY_WEIGHT: Record<PassageBias['severity'], number> = {
  low: 1,
  medium: 2,
  high: 3.5,
  critical: 5,
};

/**
 * Visual-proxy DQI derived from weighted bias load on the passage.
 * Baseline: 90 (clean passage). Each weighted bias point subtracts from
 * the baseline. Clamped to [20, 95].
 */
function estimateDqi(biases: PassageBias[]): number {
  const load = biases.reduce(
    (sum, b) => sum + (SEVERITY_WEIGHT[b.severity] ?? SEVERITY_WEIGHT.low),
    0
  );
  const raw = 90 - load * 4.5;
  return Math.max(20, Math.min(95, Math.round(raw)));
}

const SYSTEM_PROMPT = `You are Decision Intel, a decision-quality auditor.
You are analyzing a short passage that a strategy team is considering
rewriting. Flag every cognitive bias detectable in the passage. Be
concise — this is a passage-level check, not a full document audit.

Return ONLY valid JSON matching this shape (no markdown, no prose):
{
  "biases": [
    {
      "type": "string (snake_case bias name, e.g. confirmation_bias, anchoring_bias, sunk_cost_fallacy, optimism_bias, availability_heuristic, groupthink, planning_fallacy, overconfidence_bias, status_quo_bias, survivorship_bias, narrative_fallacy)",
      "severity": "low" | "medium" | "high" | "critical",
      "evidence": "string (one short quote from the passage showing the bias, max 120 chars)"
    }
  ]
}

If no biases are detectable, return { "biases": [] }. Do not fabricate
biases to pad the response. Three well-evidenced flags beat ten weak ones.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // Per-user rate limit: 20 passage re-audits per hour. Matches the
    // inline-edit "iterate on a passage" usage pattern without allowing
    // a scripted drain on the Gemini budget.
    const rate = await checkRateLimit(user.id, RATE_LIMIT_KEY_PREFIX, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
      failMode: 'closed',
    });
    if (!rate.success) {
      return apiError({
        error: 'Too many passage re-audits in the last hour. Wait a few minutes.',
        status: 429,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      passage?: string;
      originalAnalysisId?: string;
      originalOverallScore?: number;
    } | null;
    if (!body?.passage || typeof body.passage !== 'string') {
      return apiError({ error: 'passage (string) is required', status: 400 });
    }
    const passage = body.passage.trim();
    if (passage.length < 24) {
      return apiError({
        error: 'Passage too short — at least 24 characters needed',
        status: 400,
      });
    }
    if (passage.length > MAX_PASSAGE_LENGTH) {
      return apiError({
        error: `Passage too long — cap is ${MAX_PASSAGE_LENGTH} characters. Run a full document audit for longer passages.`,
        status: 400,
      });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nPASSAGE:\n<passage>\n${passage}\n</passage>`;
    // Phase 2 lock 2026-05-02: Gateway-routed Gemini Flash Lite for
    // passage-level bias classification — cheap-tier, no grounding
    // required (the pipeline metaJudge handles grounded calls in Phase 3).
    const result = await generateText(prompt, {
      model: MODEL_CHEAP,
      temperature: 0.2,
      maxOutputTokens: 800,
    });

    const parsed = parseJSON(result.text) as { biases?: PassageBias[] } | null;
    const rawBiases = Array.isArray(parsed?.biases) ? parsed.biases : [];
    // Normalise severities against our enum — LLM sometimes returns
    // capitalised or "moderate" / "severe".
    const biases: PassageBias[] = rawBiases
      .map(b => {
        const sev = String(b.severity ?? '').toLowerCase();
        const normalised: PassageBias['severity'] =
          sev === 'critical'
            ? 'critical'
            : sev === 'high' || sev === 'severe'
              ? 'high'
              : sev === 'medium' || sev === 'moderate'
                ? 'medium'
                : 'low';
        return {
          type: String(b.type || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_'),
          severity: normalised,
          evidence:
            typeof b.evidence === 'string' && b.evidence.trim().length > 0
              ? b.evidence.slice(0, 200)
              : undefined,
        };
      })
      .filter(b => b.type.length > 0);

    const estimatedDqi = estimateDqi(biases);
    const payload: PassageAuditResult = {
      biases,
      estimatedDqi,
      disclaimer:
        'Passage-level bias check, not a DQI score. Upload the revised memo for the canonical audit — the full pipeline weighs evidence, simulation, and structural assumptions in addition to bias load.',
      passageLength: passage.length,
    };
    if (typeof body.originalOverallScore === 'number') {
      payload.originalDqi = Math.round(body.originalOverallScore);
      payload.delta = estimatedDqi - payload.originalDqi;
    }

    return apiSuccess({ data: payload });
  } catch (err) {
    log.error('passage re-audit failed', err as Error);
    return apiError({ error: 'Passage re-audit failed', status: 500 });
  }
}
