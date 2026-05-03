/**
 * Loads the per-session system prompt parts from the main app at session
 * start. Single source of truth for FOUNDER_CONTEXT + persona system
 * prompt lives in the Next.js app — this loader keeps the worker thin.
 */

import { config } from './config.js';

export interface VoiceContextResponse {
  personaId: string;
  label: string;
  systemPromptParts: Array<{ role: 'system'; content: string }>;
  voiceProfile: {
    defaultVoiceId: string;
    envVar: string;
    speed: number;
    maxWordsPerVoiceTurn: number;
  };
}

export async function loadVoiceContext(personaId: string): Promise<VoiceContextResponse> {
  const url = `${config.mainApp.url}/api/founder-hub/voice-context?personaId=${encodeURIComponent(personaId)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.mainApp.workerSecret}`,
    },
  });

  // Pull text first so we can log a useful body preview on either branch
  // (status-error or JSON-parse-error). This prevents the "Unexpected
  // token '<'" crash class — the body is HTML (Vercel deployment
  // protection page, wrong-host landing page, Next not-found HTML) and
  // we need to surface what we actually received, not a stack trace from
  // JSON.parse with no context.
  const contentType = res.headers.get('content-type') || '<no-content-type>';
  const rawBody = await res.text();

  if (!res.ok) {
    throw new Error(
      `[voice-worker] /voice-context fetch failed: ${res.status} ${res.statusText} ` +
        `url=${url} content-type=${contentType} bodyPreview=${rawBody.slice(0, 200)}`
    );
  }

  // Detect HTML-instead-of-JSON before JSON.parse throws an opaque
  // SyntaxError. Vercel deployment protection returns 200 OK with an
  // HTML auth prompt page; misconfigured MAIN_APP_URL pointing at a
  // landing page returns 200 OK with marketing HTML; either way the
  // useful diagnostic is the URL + content-type + body preview.
  const bodyTrimmed = rawBody.trimStart();
  if (bodyTrimmed.startsWith('<')) {
    throw new Error(
      `[voice-worker] /voice-context returned HTML, expected JSON. ` +
        `MAIN_APP_URL likely points at a Vercel preview with deployment protection, ` +
        `a wrong host, or an unauthenticated page. ` +
        `url=${url} status=${res.status} content-type=${contentType} bodyPreview=${rawBody.slice(0, 250)}`
    );
  }

  let data: VoiceContextResponse;
  try {
    data = JSON.parse(rawBody) as VoiceContextResponse;
  } catch (parseErr) {
    throw new Error(
      `[voice-worker] /voice-context body did not parse as JSON: ${(parseErr as Error).message} ` +
        `url=${url} content-type=${contentType} bodyPreview=${rawBody.slice(0, 200)}`
    );
  }

  if (!Array.isArray(data.systemPromptParts) || data.systemPromptParts.length === 0) {
    throw new Error('[voice-worker] /voice-context returned empty systemPromptParts');
  }
  return data;
}

/**
 * Resolve the Cartesia voice UUID at session start. Reads the persona's
 * env-var override first, falls back to the stock default returned by
 * the main app. Lets the founder swap voices in Railway dashboard
 * without a redeploy.
 */
export function resolveVoiceId(profile: VoiceContextResponse['voiceProfile']): string {
  const override = process.env[profile.envVar];
  if (override && override.trim() !== '') return override.trim();
  return profile.defaultVoiceId;
}
