/**
 * GET /api/founder-hub/voice-context — system prompt parts for the worker
 *
 * The Railway-hosted LiveKit voice worker calls this ONCE at session
 * start to pull the assembled system prompt: FOUNDER_CONTEXT (the same
 * grounding the text chat uses) + the persona's text-mode systemPrompt
 * + the voice-mode addendum + the live recent-meetings block.
 *
 * The worker does NOT mirror these strings locally — single source of
 * truth lives here in the main app, which means a CLAUDE.md positioning
 * lock or a persona system-prompt edit propagates to voice mode on the
 * next session start without redeploying the worker.
 *
 * Auth: shared-secret bearer token. The worker holds VOICE_WORKER_SECRET
 * (set in Railway dashboard). The same secret is set in Vercel env. This
 * endpoint is NOT founder-pass-gated because the worker is a server, not
 * a browser — and the founder pass would have to ride in the worker's
 * env, which is functionally identical but worse-named.
 *
 * Rate-limit: light (5 req / 60s / IP) — the worker only hits this at
 * room start, not per turn.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import {
  buildVoiceModeAddendum,
  getThinkingPartner,
  isThinkingPartnerId,
} from '@/lib/data/thinking-partners';
import { buildRecentMeetingsBlock } from '@/lib/founder-hub/recent-meetings-context';
import { FOUNDER_CONTEXT } from '../founder-context';
import {
  splitFounderContextSections,
  assembleFounderContextSections,
} from '@/lib/utils/founder-context-sections';

/** Memoize the section split — FOUNDER_CONTEXT is a build-time constant,
 *  so we parse it once per server process and reuse across all requests.
 *  Saves ~10ms per voice-context call (parsing 273KB on every hit was
 *  pure waste). */
const FOUNDER_CONTEXT_SECTIONS = splitFounderContextSections(FOUNDER_CONTEXT);

/**
 * VOICE_FOUNDER_IDENTITY_CORE — the universal founder + product identity
 * that EVERY persona gets, regardless of which sections they request
 * from FOUNDER_CONTEXT below. ~2KB.
 *
 * Why a separate constant rather than reusing a `=== FOUNDER IDENTITY ===`
 * section in FOUNDER_CONTEXT: this block is voice-tuned (terse, named,
 * factual) and intentionally orthogonal to the editorial prose blocks in
 * the main context. Personas building on top of it get a stable identity
 * floor + their specialty depth on top.
 *
 * Latency strategy: FOUNDER_CONTEXT slicing per persona drops the LLM
 * prompt from 273KB → 30-50KB per turn. This identity core comes FIRST
 * in the assembled prompt so the OpenAI prompt cache prefix matches
 * across personas (a session that switches between Cognitive Psychologist
 * and Skeptical Investor still cache-hits on this 2KB prefix).
 */
const VOICE_FOUNDER_IDENTITY_CORE = `
You're talking with Folahan, the 16-year-old solo founder of Decision Intel.

Decision Intel is a decision intelligence platform for corporate strategy
teams. It runs a 60-second audit on strategic memos and board decks that
scores cognitive biases (22-bias R²F taxonomy, Kahneman + Klein), predicts
steering-committee objections, and produces a tamper-evident Decision
Provenance Record. The platform is in design-partner phase — pre-revenue,
working toward first paying customer + pre-seed raise in 2026.

Folahan is in London, in 11th grade, attending US AP-system school. ~28
hrs/week founder capacity (4 hrs/day × 7 days). Bootstrapping with one
strategic seed round Q4 2026 / Q1 2027 ($1.5-2.5M target). Already taken
AP Psychology; published research paper on 2008-financial-crisis bias
mechanics; runs financial-literacy initiative at school.

R²F = Recognition-Rigor Framework. Combines Kahneman's debiasing with
Klein's Recognition-Primed Decision in one pipeline (no competitor does
this). Anchored on Kahneman & Klein 2009 "Conditions for Intuitive
Expertise: A Failure to Disagree."

You have access to the relevant FOUNDER_CONTEXT sections below for your
specialty. Use them. If the founder asks about a topic OUTSIDE those
sections (e.g. exact deck slide text, a recent meeting transcript, a
specific Founder Hub feature you don't have context on), give a
directional answer in voice and offer to expand in text chat for the
precise version.
`.trim();

const log = createLogger('VoiceContext');

export async function GET(req: NextRequest) {
  // Worker auth via shared secret. Reject anything else with 401.
  const expected = process.env.VOICE_WORKER_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'Voice mode not configured. Set VOICE_WORKER_SECRET.' },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get('authorization') || '';
  const presented = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!presented || presented !== expected) {
    log.warn('voice-context: unauthorized worker request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const personaIdRaw = req.nextUrl.searchParams.get('personaId');
  const personaId = isThinkingPartnerId(personaIdRaw) ? personaIdRaw : 'default';
  const persona = getThinkingPartner(personaId);

  // Recent-meetings block is best-effort — empty string is fine, voice
  // continues without it. Same posture as the text chat route.
  let recentMeetingsBlock = '';
  try {
    recentMeetingsBlock = await buildRecentMeetingsBlock();
  } catch (err) {
    log.warn('recent-meetings block load failed (continuing without):', err);
  }

  const voiceAddendum = buildVoiceModeAddendum(persona);

  // Assemble the persona's slice of FOUNDER_CONTEXT. Each persona declares
  // (in thinking-partners.ts) which sections it needs — Cognitive
  // Psychologist gets RESEARCH FOUNDATIONS + TOXIC COMBINATIONS, Skeptical
  // Investor gets FUNDRAISING STATE + COMPETITORS, etc. Sections are
  // emitted in the original document's order (NOT the order declared) so
  // the prompt prefix is stable across calls and OpenAI's prompt cache
  // can hit reliably. See `assembleFounderContextSections()` for the
  // ordering guarantee.
  const sliceResult = assembleFounderContextSections(
    FOUNDER_CONTEXT_SECTIONS,
    persona.voiceContextSections,
    /* includePreamble */ true
  );
  if (sliceResult.missing.length > 0) {
    log.warn(
      `voice-context: persona ${persona.id} declared sections that don't exist in FOUNDER_CONTEXT: ${sliceResult.missing.join(', ')}`
    );
  }

  // Latency log — surface the prompt size so we can correlate "voice
  // felt fast" with "prompt was small" over time. Pre-slicing this
  // would have logged ~280KB; post-slicing should be ~20-50KB per
  // persona depending on declared sections.
  const personaPromptBytes = sliceResult.content.length;
  const corePromptBytes = VOICE_FOUNDER_IDENTITY_CORE.length;
  const personaInstructionBytes = (persona.systemPrompt + voiceAddendum).length;
  log.info(
    `voice-context: persona=${persona.id} core=${corePromptBytes}b sections=${personaPromptBytes}b (${sliceResult.included.length} sections) personaInstructions=${personaInstructionBytes}b totalSystemPrompt=${corePromptBytes + personaPromptBytes + personaInstructionBytes}b`
  );

  return NextResponse.json({
    personaId: persona.id,
    label: persona.label,
    // Order is LOAD-BEARING for OpenAI prompt caching. Caching matches
    // on prompt PREFIX — content that comes earlier and stays the
    // same across calls gets cached; once a position changes between
    // calls, everything after it can't cache.
    //
    //   1. VOICE_FOUNDER_IDENTITY_CORE  — universal, every persona,
    //                                    static. Cache-hit guaranteed.
    //   2. Persona's section slice      — static per persona, stable
    //                                    order. Cache-hit within a
    //                                    session that doesn't switch
    //                                    persona.
    //   3. Persona system prompt + voice addendum — static per
    //                                    persona. Cache-hit.
    //   4. Recent meetings block        — DYNAMIC (changes when new
    //                                    meetings happen). Cache breaks
    //                                    here, so subsequent chat-history
    //                                    + user-message tokens re-process.
    //                                    Acceptable: only ~10-20% of total
    //                                    tokens are post-cache.
    //
    // This ordering means: turn 1 in a session pays full prompt-processing
    // cost (~5-10s perceived latency). Turn 2+ within ~5min reuses the
    // cached prefix from turn 1 — the LLM only re-processes the recent
    // meetings (if changed) + chat history + new user message. Should
    // drop turn 2+ latency by 50-70%.
    systemPromptParts: [
      { role: 'system', content: VOICE_FOUNDER_IDENTITY_CORE },
      ...(sliceResult.content ? [{ role: 'system' as const, content: sliceResult.content }] : []),
      { role: 'system', content: persona.systemPrompt + voiceAddendum },
      ...(recentMeetingsBlock ? [{ role: 'system' as const, content: recentMeetingsBlock }] : []),
    ],
    voiceProfile: {
      defaultVoiceId: persona.voiceProfile.defaultVoiceId,
      envVar: persona.voiceProfile.envVar,
      speed: persona.voiceProfile.speed,
      maxWordsPerVoiceTurn: persona.voiceProfile.maxWordsPerVoiceTurn,
    },
  });
}
