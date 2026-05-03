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
import { FOUNDER_CONTEXT } from '../founder-context';
import {
  buildVoiceModeAddendum,
  getThinkingPartner,
  isThinkingPartnerId,
} from '@/lib/data/thinking-partners';
import { buildRecentMeetingsBlock } from '@/lib/founder-hub/recent-meetings-context';

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

  return NextResponse.json({
    personaId: persona.id,
    label: persona.label,
    systemPromptParts: [
      // Order matters — same order the text chat assembles, plus the
      // voice addendum stitched onto the persona's systemPrompt.
      { role: 'system', content: FOUNDER_CONTEXT },
      { role: 'system', content: persona.systemPrompt + voiceAddendum },
      ...(recentMeetingsBlock
        ? [{ role: 'system' as const, content: recentMeetingsBlock }]
        : []),
    ],
    voiceProfile: {
      defaultVoiceId: persona.voiceProfile.defaultVoiceId,
      envVar: persona.voiceProfile.envVar,
      speed: persona.voiceProfile.speed,
      maxWordsPerVoiceTurn: persona.voiceProfile.maxWordsPerVoiceTurn,
    },
  });
}
