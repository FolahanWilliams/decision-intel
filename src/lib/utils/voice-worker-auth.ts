/**
 * Shared bearer-auth helper for /api/founder-hub/voice-* endpoints
 * called by the LiveKit voice worker on Railway. Same pattern as the
 * /voice-context route — VOICE_WORKER_SECRET is set in BOTH the main
 * app's Vercel env and the worker's Railway env, and the worker
 * presents it as a Bearer token on every API call.
 *
 * Why a shared helper: the voice-tools endpoints (add_todo,
 * track_event, lookup_decision_log, etc.) all share the same auth
 * surface. DRY the check + the not-configured response shape so
 * adding a new tool endpoint is one fewer thing to remember.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface VoiceWorkerAuthOk {
  ok: true;
}

export interface VoiceWorkerAuthFail {
  ok: false;
  /** Pre-built NextResponse with the right status + JSON body —
   *  caller just `return result.response`. */
  response: NextResponse;
}

export type VoiceWorkerAuthResult = VoiceWorkerAuthOk | VoiceWorkerAuthFail;

/**
 * Verify the worker's Bearer token against VOICE_WORKER_SECRET.
 * Returns either ok or a fail with a ready-to-return NextResponse.
 */
export function verifyVoiceWorkerAuth(req: NextRequest): VoiceWorkerAuthResult {
  const expected = process.env.VOICE_WORKER_SECRET;
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Voice tools not configured. Set VOICE_WORKER_SECRET in env.' },
        { status: 503 }
      ),
    };
  }
  const authHeader = req.headers.get('authorization') || '';
  const presented = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!presented || presented !== expected) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true };
}
