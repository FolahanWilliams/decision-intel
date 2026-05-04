/**
 * POST /api/founder-hub/voice-token — mint a LiveKit access token
 *
 * The founder hits this endpoint when toggling voice mode on. We:
 *   1. Create a fresh LiveKit room with persona metadata so the worker
 *      knows which Thinking Partner lens to load on join.
 *   2. Mint a join JWT scoped to that room with audio publish/subscribe
 *      and data-channel publish (for live captions / interruption events).
 *   3. Return everything the browser needs: token, room name, LiveKit
 *      WebSocket URL, persona id, hard session timeout.
 *
 * Auth: founder-pass via `x-founder-pass` header. Same gate as the text
 * chat — voice mode is single-user, founder-only for now.
 *
 * Hard session timeout (30 min) is encoded in the token as `ttl` and
 * surfaced in the response so the client can show the warning at 25 min
 * + auto-disconnect at 30. Worker-side enforcement is independent (the
 * worker's session timeout is set in the agent loop).
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { isThinkingPartnerId, type ThinkingPartnerId } from '@/lib/data/thinking-partners';

const log = createLogger('VoiceToken');

/** Hard session cap shared by the JWT TTL, the worker, and the client UI.
 *  30 min is a deliberate pacing constraint — voice sessions longer than
 *  that consume disproportionate cost and rarely produce sharper thinking
 *  than the first 30 min. The 25-min warning is surfaced client-side. */
const SESSION_HARD_TIMEOUT_SECONDS = 30 * 60;
const SESSION_WARNING_SECONDS = 25 * 60;

/** Identity used in the LiveKit token. Single-user product for now;
 *  the founder is always the participant. If/when multi-user voice
 *  ships, swap this for the authenticated user's id. */
const FOUNDER_IDENTITY = 'founder';

interface RequestBody {
  personaId?: unknown;
  /** Recent text-chat messages (last ~10) the client wants the voice
   *  agent to seed its conversation context with. Cross-session memory
   *  continuity — without this every voice session starts cold. Each
   *  message: { role: 'user' | 'assistant', content: string }. */
  recentChatMessages?: unknown;
}

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Validate + clamp the recent chat history payload. Caps total bytes
 *  at 12KB so room metadata (LiveKit limit ~16KB) doesn't overflow. */
function sanitizeChatHistory(raw: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const MAX_BYTES = 12_000;
  const MAX_MESSAGES = 12;
  const sanitized: ChatHistoryMessage[] = [];
  let totalBytes = 0;
  // Walk newest-first so oldest get dropped if we hit the cap (more
  // recent context is more valuable for memory continuity).
  for (let i = raw.length - 1; i >= 0 && sanitized.length < MAX_MESSAGES; i--) {
    const item = raw[i];
    if (typeof item !== 'object' || item === null) continue;
    const msg = item as Record<string, unknown>;
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;
    if (typeof msg.content !== 'string' || msg.content.trim() === '') continue;
    // Truncate very long messages to keep budget
    const content = msg.content.slice(0, 2000);
    const bytes = content.length + 20; // overhead for role + JSON
    if (totalBytes + bytes > MAX_BYTES) break;
    totalBytes += bytes;
    sanitized.unshift({ role: msg.role, content });
  }
  return sanitized;
}

export async function POST(req: NextRequest) {
  // Auth — same founder-pass gate as the text chat.
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized' },
      { status: auth.reason === 'not_configured' ? 503 : 401 }
    );
  }

  // Required env. Unset means voice mode is not provisioned in this
  // environment yet — return 503 cleanly so the client can disable the
  // toggle rather than throwing a runtime crash.
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Voice mode not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.' },
      { status: 503 }
    );
  }

  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    // Empty body is fine — defaults to the 'default' persona.
  }

  const personaId: ThinkingPartnerId = isThinkingPartnerId(body.personaId)
    ? body.personaId
    : 'default';

  // Memory continuity: serialize last ~10 chat messages into room
  // metadata so the worker can seed the AgentSession's chatCtx with
  // them. Without this every voice session starts cold; with it the
  // founder can pick up exactly where the last text-chat conversation
  // left off and have it continue in voice. Capped at 12KB (LiveKit
  // metadata limit ~16KB; rest of metadata + JSON overhead < 4KB).
  const recentChatMessages = sanitizeChatHistory(body.recentChatMessages);

  // Unique room name per session. `founder-voice-{personaId}-{timestamp}-{rand}`
  // gives the worker a clean room scope and survives client retries
  // without collision. Random suffix prevents brute-force room joining.
  const rand = Math.random().toString(36).slice(2, 10);
  const roomName = `founder-voice-${personaId}-${Date.now()}-${rand}`;

  try {
    // Create the room with persona metadata. The worker reads room.metadata
    // on join to select the right Cartesia voice + system prompt. Empty-
    // timeout 60s means LiveKit garbage-collects the room if no one connects
    // within a minute (e.g. mic permission denied client-side).
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    await roomService.createRoom({
      name: roomName,
      metadata: JSON.stringify({
        personaId,
        createdAt: Date.now(),
        // Optional cross-session memory: last ~10 text-chat turns
        // the worker should seed the AgentSession with. Empty array
        // means "fresh session, no memory" (greeting will be generic).
        recentChatMessages,
      }),
      emptyTimeout: 60,
      maxParticipants: 2, // founder + agent
    });

    log.info(
      `voice-token: minted token for personaId=${personaId} memorySeedCount=${recentChatMessages.length}`
    );

    const at = new AccessToken(apiKey, apiSecret, {
      identity: FOUNDER_IDENTITY,
      name: 'Founder',
      ttl: SESSION_HARD_TIMEOUT_SECONDS,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      roomName,
      livekitUrl,
      personaId,
      sessionTimeoutSeconds: SESSION_HARD_TIMEOUT_SECONDS,
      sessionWarningSeconds: SESSION_WARNING_SECONDS,
    });
  } catch (err) {
    log.error('voice-token mint failed:', err);
    return NextResponse.json(
      { error: 'Failed to provision voice session. Please retry.' },
      { status: 500 }
    );
  }
}
