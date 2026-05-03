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

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `[voice-worker] /voice-context fetch failed: ${res.status} ${res.statusText} — ${errBody.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as VoiceContextResponse;
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
