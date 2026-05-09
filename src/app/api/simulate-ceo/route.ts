import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { parseJSON } from '@/lib/utils/json';
import { extractIp } from '@/lib/utils/request';
import { NAMED_PATTERNS } from '@/lib/learning/toxic-combinations';

const log = createLogger('SimulateCeo');

// Public standalone CEO-simulation endpoint. A visitor pastes a memo +
// a one-line CEO profile, gets back three questions the CEO is most
// likely to ask. No login, no gate. Anonymous surface.
//
// This is a LinkedIn-viral artifact — "I paid $29 to find out what my
// CEO would ask about this memo" — shipped as free with rate limits so
// the footprint of the full Decision Intel product gets broader
// discovery. A future commit gates it behind a $29 one-off Stripe
// product once first-party billing is set up.

const MAX_MEMO_LENGTH = 8000;
const MAX_PROFILE_LENGTH = 400;

const SYSTEM_PROMPT = `You are simulating the most likely questions a specific
CEO will ask about a strategic memo. You will be given the memo and a one-line
profile describing the CEO's style, background, and what they care about.

Return exactly THREE questions the CEO is statistically most likely to ask in
the first 10 minutes of the meeting. The questions should:

1. Be specific enough that the memo's author immediately sees what they missed.
2. Be phrased the way this CEO actually speaks (match the profile tone).
3. Surface real weaknesses in the memo — hedged claims, missing numbers,
   assumption chains that don't close, unnamed risks, unvalidated markets.
4. Not be generic ("What's the risk?") — each question should reveal a gap
   specific to the memo.

Return ONLY valid JSON (no markdown, no prose):
{
  "questions": [
    {
      "question": "string — how the CEO actually asks it",
      "gap": "string — one sentence: what the memo missed that prompted this question",
      "severity": "low" | "medium" | "high"
    },
    { ... },
    { ... }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const ip = extractIp(req);
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Anonymous abuse-protection: 3 simulations per IP per 24h (free tier).
    // Budget guard at ~$0.05/call * 3/day/IP is fine.
    const rate = await checkRateLimit(`ip:${ipHash}`, 'simulate-ceo', {
      windowMs: 24 * 60 * 60 * 1000,
      maxRequests: 3,
      failMode: 'closed',
    });
    if (!rate.success) {
      return apiError({
        error:
          'You have used the free CEO simulator for today. Come back tomorrow — or upload the memo to the full audit for the complete boardroom simulation.',
        status: 429,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      memo?: string;
      ceoProfile?: string;
      // Optional: caller-supplied list of named patterns already detected
      // on this memo (e.g. ['The Synergy Mirage', "The Winner's Curse"]).
      // When present, the CEO simulation biases its questions toward
      // exposing the named failure modes — turning the teaser from a
      // generic memo audit into a deal-specific one. Authenticated
      // callers (e.g. the SimulateCeoTab on /documents/[id]) can pass
      // analysis.toxicCombinations.map(tc => tc.patternLabel) to enrich.
      // Locked 2026-05-09 evening — cascade-depth audit ship #6.
      firedPatterns?: string[];
    } | null;
    if (!body?.memo || typeof body.memo !== 'string') {
      return apiError({ error: 'memo (string) is required', status: 400 });
    }
    if (!body?.ceoProfile || typeof body.ceoProfile !== 'string') {
      return apiError({
        error:
          'ceoProfile (string) is required — one line describing the CEO (role, tenure, style, what they care about)',
        status: 400,
      });
    }
    const memo = body.memo.trim();
    const profile = body.ceoProfile.trim();
    if (memo.length < 200) {
      return apiError({
        error: 'memo too short — give us at least 200 characters',
        status: 400,
      });
    }
    if (memo.length > MAX_MEMO_LENGTH) {
      return apiError({
        error: `memo too long — cap is ${MAX_MEMO_LENGTH} characters`,
        status: 400,
      });
    }
    if (profile.length > MAX_PROFILE_LENGTH) {
      return apiError({
        error: `ceoProfile too long — cap is ${MAX_PROFILE_LENGTH} characters`,
        status: 400,
      });
    }

    // When the caller passes detected patterns, look them up in the
    // canonical NAMED_PATTERNS catalogue and inject the descriptions
    // into the prompt. Skips silently if no patterns match (defensive
    // against typos / stale labels).
    const firedPatternLabels = Array.isArray(body.firedPatterns)
      ? body.firedPatterns.filter((s): s is string => typeof s === 'string')
      : [];
    const matchedPatterns = firedPatternLabels
      .map(label => NAMED_PATTERNS.find(p => p.label === label))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 5);

    const patternBlock =
      matchedPatterns.length > 0
        ? `

DETECTED FAILURE PATTERNS:
The audit pipeline already flagged the following named compound failure patterns
on this memo. Bias your questions toward exposing the specific gaps these
patterns name — the CEO is more likely to ask about a documented failure mode
than a generic concern.

${matchedPatterns
  .map(p => `- ${p.label}: ${p.description}`)
  .join('\n')}
`
        : '';

    const prompt = `${SYSTEM_PROMPT}

CEO PROFILE:
${profile}
${patternBlock}
MEMO:
<memo>
${memo}
</memo>

Three questions, JSON only.`;

    // Phase 2 lock 2026-05-02: Gateway-routed Gemini Flash Lite for the
    // 3-question CEO-simulation teaser — cheap, single-shot, no grounding.
    const result = await generateText(prompt, {
      model: MODEL_CHEAP,
      temperature: 0.35,
      maxOutputTokens: 900,
    });

    const parsed = parseJSON(result.text) as {
      questions?: Array<{
        question?: string;
        gap?: string;
        severity?: string;
      }>;
    } | null;
    const raw = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const questions = raw
      .slice(0, 3)
      .map(q => {
        const sev = String(q.severity ?? '').toLowerCase();
        return {
          question: String(q.question ?? '').trim(),
          gap: String(q.gap ?? '').trim(),
          severity: (sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low') as
            | 'low'
            | 'medium'
            | 'high',
        };
      })
      .filter(q => q.question.length > 0);

    if (questions.length === 0) {
      return apiError({
        error: 'Could not generate questions for this memo. Try again.',
        status: 502,
      });
    }

    log.info('simulate-ceo success', {
      ipHash,
      questionCount: questions.length,
      memoLength: memo.length,
      patternsApplied: matchedPatterns.length,
    });

    return apiSuccess({
      data: {
        questions,
        // Surface which patterns shaped the prompt so a caller can show
        // "biased toward [Synergy Mirage, Winner's Curse]" attribution
        // in the UI. Empty array when no firedPatterns supplied OR when
        // none of the supplied labels matched the catalogue.
        patternsApplied: matchedPatterns.map(p => p.label),
        disclaimer:
          'CEO simulation is a single-persona teaser. The full 12-node pipeline runs five primed boardroom personas (CEO, CFO, GC, domain lead, dissenting director) and attaches the evidence to a Decision Provenance Record.',
      },
    });
  } catch (err) {
    log.error('simulate-ceo failed', err as Error);
    return apiError({ error: 'CEO simulation failed', status: 500 });
  }
}
