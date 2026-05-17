# Decision Intel — Voice Worker

LiveKit Agents Node worker that runs the voice mode for the Decision
Intel Founder Hub. Lives in a separate Node app deployed to Railway,
NOT bundled with the Vercel main app.

## What it does

On every new LiveKit room: reads `personaId` from room metadata, fetches
`FOUNDER_CONTEXT` + the persona's system prompt + the voice-mode
addendum + recent meetings from the main app's `/api/founder-hub/voice-context`
endpoint, then runs the voice loop:

```
Browser ── WebRTC audio ── LiveKit Cloud ── this worker ── Deepgram (STT)
                                                       ── Grok 4.3 (Vercel AI Gateway, OpenAI-compat)
                                                       ── Cartesia Sonic-2 (TTS)
                                                       ── back to LiveKit ── back to browser
```

Single source of truth for personas + system prompts lives in the main
app at `src/lib/data/thinking-partners.ts`. The worker is intentionally
thin — it loads context per session rather than mirroring strings, so a
positioning lock or persona prompt edit propagates without redeploying
the worker.

## Stack

| Layer       | Provider                       | Cost                         |
| ----------- | ------------------------------ | ---------------------------- |
| Transport   | LiveKit Cloud                  | Free tier covers single user |
| STT         | Deepgram Nova-3                | ~$0.35 / hour                |
| LLM         | Grok 4.3 via Vercel AI Gateway | ~$0.50-1.50 / hour           |
| TTS         | Cartesia Sonic-2               | ~$0.50-1 / hour              |
| Worker host | Railway                        | $5/mo                        |

Realistic monthly spend at 1.5–2 hours/day: **$80-180/mo**.

## Local dev

```bash
# 1. Install
cd voice-worker
npm install

# 2. Configure
cp .env.example .env
# Fill in LIVEKIT_*, DEEPGRAM_API_KEY, AI_GATEWAY_API_KEY,
# CARTESIA_API_KEY, MAIN_APP_URL, VOICE_WORKER_SECRET (any random
# 32-byte hex string — same value goes in Vercel env)

# 3. Run
npm run dev
```

The `dev` script runs `tsx watch src/agent.ts dev` — `dev` is a LiveKit
Agents CLI subcommand that connects to LiveKit Cloud and starts
listening for room dispatches. Once running, open the Founder Hub in the
browser, click the mic toggle on the chat widget, and the worker should
be dispatched into the room within a second or two.

## Railway deployment

1. Sign in at https://railway.app and create a new project from this
   `voice-worker/` directory (Railway auto-detects Node + uses the
   `start` script).
2. Set environment variables in the Railway dashboard (copy the keys
   from `.env.example`, paste production values).
3. **Important**: also set `VOICE_WORKER_SECRET` to the **same value**
   in Vercel env so the main app's `/api/founder-hub/voice-context`
   endpoint accepts the worker's bearer auth.
4. Deploy. Railway will run `npm run build` then `npm start`. Watch the
   first deploy logs to confirm:
   - `[voice-worker]` startup line with no missing-env errors
   - LiveKit registration confirmation (worker connected to LK Cloud)
5. Test from the browser:
   - Open `/dashboard/founder-hub`
   - Click the mic toggle on the chat widget
   - Speak: "Hi, who am I talking to?"
   - Expect a persona-appropriate response with the configured voice

## What you get to test on first deploy (and what to watch for)

The non-voice scaffolding is type-checked and behaviour-verified through
unit tests on the main app. The actual voice pipeline is not testable
without live LiveKit + Deepgram + Cartesia + Grok credentials, so:

- **Confirm**: worker registers with LiveKit, room dispatch fires, audio
  flows in both directions, persona greeting plays.
- **Watch for**: the LiveKit Agents Node API has been evolving (we're
  pinned to `0.7.x`). If the import surface or `VoicePipelineAgent`
  constructor drifts, the fix is usually a small change in `agent.ts`
  imports + signatures. The persona-loading + system-prompt assembly is
  stable.
- **Watch for**: Cartesia stock voice IDs occasionally rotate. If a
  persona greets with an unexpected voice or 404s, swap to a fresh UUID
  from your Cartesia dashboard via the matching `CARTESIA_VOICE_*` env
  var (no redeploy needed).

## Architecture choices (link to CLAUDE.md context)

- **Why a separate worker, not Vercel serverless?** LiveKit Agents wants
  a long-running process to register with LiveKit Cloud. Vercel
  serverless edge functions don't fit that pattern. Railway $5/mo is the
  smallest-ops path that preserves the existing chat architecture.
- **Why call `/voice-context` instead of mirroring prompts here?** The
  main app evolves daily — `FOUNDER_CONTEXT` updates, persona prompts
  tighten, voice profiles tune. Fetching at session start means the
  worker never goes stale; deploying a new prompt is a Vercel deploy,
  not a Railway redeploy.
- **Why not OpenAI Realtime API?** Locks voice mode to GPT-4o, loses
  Grok 4.3 + the existing grounding context. The whole point of the
  Thinking Partners is depth anchored on `FOUNDER_CONTEXT` + persona
  system prompts; Realtime would defeat the moat.

## Cost guardrails

| Guard                  | Where                                                        |
| ---------------------- | ------------------------------------------------------------ |
| Per-session 30-min cap | JWT TTL (token endpoint) + worker `setTimeout`               |
| Per-turn word cap      | Voice mode addendum (per-persona, in `thinking-partners.ts`) |
| Citation shortening    | Voice mode addendum                                          |
| Spend dashboard        | DEFERRED — Prisma model needed; founder approval first       |
| Monthly kill switch    | DEFERRED — admin setting needed                              |

In-memory per-session metrics log to stdout in JSON (grep
`[voice-worker:end]` in Railway logs to see per-session cost
projections).
