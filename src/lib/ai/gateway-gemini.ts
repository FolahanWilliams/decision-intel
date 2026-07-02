/**
 * Gateway-routed Gemini — the Google-billing migration (locked 2026-07-02).
 *
 * WHY THIS EXISTS. The founder's direct Google Cloud billing account went
 * into dunning-deny (403 on every generativelanguage.googleapis.com call —
 * a sibling project ran up £150+ and the account was closed). Every direct
 * Gemini call in the platform is therefore routed through the Vercel AI
 * Gateway instead: one bill (Vercel), same Google models, AND — verified
 * against the gateway model list + Vercel docs 2026-07-02 — the gateway
 * supports BOTH of the capabilities that previously kept these calls on
 * the direct SDK:
 *
 *   1. Google Search grounding: pass `google.tools.googleSearch({})` from
 *      @ai-sdk/google as a tool on a `google/...` gateway model
 *      (https://vercel.com/docs/ai-gateway/models-and-providers/web-search).
 *      Source URLs come back on `result.sources`.
 *   2. Embeddings: `google/gemini-embedding-001` is served by the gateway —
 *      the SAME model the pgvector store was built with, so stored vectors
 *      remain valid (no re-embedding).
 *
 * ROUTING RULE. `isGatewayGeminiEnabled()` is the single switch every
 * consumer checks: ON when AI_GATEWAY_API_KEY is set (the default posture),
 * OFF when PIPELINE_GATEWAY_GEMINI=off (forces the legacy direct SDK,
 * which then requires GOOGLE_API_KEY — the escape hatch if the gateway
 * ever misbehaves). Model names are mapped native → gateway id here and
 * ONLY here (e.g. `gemini-3-flash-preview` → `google/gemini-3-flash`).
 *
 * Consumers: the pipeline hub (nodes.ts createModelInstance shim), the
 * gemini provider (providers/gemini.ts), rag/embeddings.ts, and the leaf
 * surfaces (quick-score, human-audit, copilot, decision-brief,
 * outcome-inference, marketContextEnricher, macroContext, scholarSearch,
 * rpd-simulator, trends). meetings/transcribe.ts (audio parts) stays on
 * the legacy SDK — a recorded boundary, see CLAUDE.md.
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GatewayGemini');

/**
 * Native Gemini SDK model name → AI Gateway model id.
 * Verified against the gateway /v1/models list 2026-07-02.
 * `gemini-3-flash-preview` graduated on the gateway to `gemini-3-flash`.
 */
const NATIVE_TO_GATEWAY: Record<string, string> = {
  'gemini-3-flash-preview': 'google/gemini-3-flash',
  'gemini-3-flash': 'google/gemini-3-flash',
  'gemini-3.1-flash-lite': 'google/gemini-3.1-flash-lite',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
};

export function mapGeminiToGateway(nativeName: string): string {
  if (nativeName.includes('/')) return nativeName; // already a gateway id
  return NATIVE_TO_GATEWAY[nativeName] ?? `google/${nativeName.replace(/-preview$/, '')}`;
}

/**
 * The single routing switch. ON by default whenever the gateway key is
 * present; PIPELINE_GATEWAY_GEMINI=off reverts every consumer to the
 * legacy direct-Google SDK in one env change (which then needs a working
 * GOOGLE_API_KEY billing account).
 */
export function isGatewayGeminiEnabled(): boolean {
  const flag = (process.env.PIPELINE_GATEWAY_GEMINI || '').trim().toLowerCase();
  if (flag === 'off') return false;
  return !!(process.env.AI_GATEWAY_API_KEY || '').trim();
}

/** String-literal safety settings for providerOptions.google — mirrors the
 *  legacy SDK's relaxed (BLOCK_NONE, the pipeline default: filings contain
 *  sensitive language) and standard tiers. */
const SAFETY_RELAXED = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];
const SAFETY_STANDARD = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

export interface GatewayGeminiOptions {
  /** Native SDK name OR gateway id — mapped via mapGeminiToGateway. */
  model?: string;
  /** Attach Google Search grounding (the gateway supports it — see header). */
  grounded?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  safetyLevel?: 'relaxed' | 'standard';
}

export interface GatewayGeminiResult {
  text: string;
  /** The resolved gateway model id. */
  model: string;
  /** Source URLs from provider-executed Google Search (empty when
   *  ungrounded or when the model didn't search). */
  sources: string[];
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * One Gemini text generation through the AI Gateway. No retry/timeout here —
 * callers keep their existing resilience wrappers (withRetry/withTimeout/
 * circuit breakers), exactly as they wrapped the legacy SDK call.
 *
 * JSON output: the gateway path does NOT set responseMimeType (the legacy
 * SDK's JSON-mime). Every consumer's prompt already demands JSON explicitly
 * and every consumer parses via a fence-tolerant parseJSON — the same
 * contract the frontier Anthropic paths (runModelCall) shipped on.
 */
export async function gatewayGeminiGenerate(
  prompt: string,
  options: GatewayGeminiOptions = {}
): Promise<GatewayGeminiResult> {
  const { generateText } = await import('ai');
  const model = mapGeminiToGateway(options.model ?? 'gemini-3-flash-preview');

  let tools: Record<string, unknown> | undefined;
  if (options.grounded) {
    const { google } = await import('@ai-sdk/google');
    tools = { google_search: google.tools.googleSearch({}) };
  }

  const result = await generateText({
    model,
    prompt,
    maxOutputTokens: options.maxOutputTokens ?? 16384,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(tools ? { tools: tools as never } : {}),
    providerOptions: {
      google: {
        safetySettings: options.safetyLevel === 'standard' ? SAFETY_STANDARD : SAFETY_RELAXED,
      } as never,
    },
  });

  const sources = (result.sources ?? [])
    .map(s => (s as { url?: string }).url)
    .filter((u): u is string => typeof u === 'string');

  log.debug(
    `Gateway Gemini (${model}${options.grounded ? ' +search' : ''}): ` +
      `${result.text.length} chars, ${sources.length} sources`
  );

  return {
    text: result.text,
    model,
    sources,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
}

/**
 * The native-SDK impersonation shim — `{ generateContent(parts) }` returning
 * `{ response: { text(), candidates[0].groundingMetadata.groundingChunks } }`.
 * Lets any surface built on `GoogleGenerativeAI.getGenerativeModel(...)`
 * switch to the gateway with a one-line branch: string parts are joined
 * with double newlines; grounded search sources are reconstructed into
 * the groundingChunks shape so extractSearchSources-style readers keep
 * working. Consumers cast to their local GenerativeModel type — every
 * migrated call site uses ONLY `.generateContent` (verified 2026-07-02).
 */
export interface GatewayShimResponse {
  response: {
    text: () => string;
    candidates: Array<{
      groundingMetadata: { groundingChunks: Array<{ web: { uri: string } }> };
    }>;
  };
}

export function gatewayGeminiModelShim(options: GatewayGeminiOptions = {}): {
  generateContent: (parts: unknown) => Promise<GatewayShimResponse>;
} {
  return {
    generateContent: async (parts: unknown): Promise<GatewayShimResponse> => {
      const list = Array.isArray(parts) ? parts : [parts];
      const prompt = list
        .map(p => (typeof p === 'string' ? p : ''))
        .filter(Boolean)
        .join('\n\n');
      const res = await gatewayGeminiGenerate(prompt, options);
      return {
        response: {
          text: () => res.text,
          candidates: [
            {
              groundingMetadata: {
                groundingChunks: res.sources.map(u => ({ web: { uri: u } })),
              },
            },
          ],
        },
      };
    },
  };
}

/** The embedding model the pgvector store was built with — identical id on
 *  the gateway, so vectors stay in the same space. */
export const GATEWAY_EMBEDDING_MODEL = 'google/gemini-embedding-001';

/**
 * Embed texts through the AI Gateway with the SAME model + task type +
 * dimensionality the legacy direct path used (gemini-embedding-001,
 * RETRIEVAL_DOCUMENT, 1536 dims). Uses the gateway's OpenAI-compatible
 * /v1/embeddings REST endpoint (not @ai-sdk/gateway — its embedding-model
 * spec version is ahead of the installed `ai` package). EMPIRICALLY
 * VERIFIED 2026-07-02 against the live gateway: `dimensions: 1536` on
 * google/gemini-embedding-001 returns exactly 1536 dims, HTTP 200.
 * Callers validate the returned dimension (their existing 1536 guard) —
 * a mismatch throws there, never silently pollutes the vector store.
 */
export async function gatewayGeminiEmbed(
  texts: string[],
  opts: { outputDimensionality: number; taskType?: string }
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = (process.env.AI_GATEWAY_API_KEY || '').trim();
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');
  const res = await fetch('https://ai-gateway.vercel.sh/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GATEWAY_EMBEDDING_MODEL,
      input: texts,
      dimensions: opts.outputDimensionality,
      providerOptions: {
        google: {
          outputDimensionality: opts.outputDimensionality,
          taskType: opts.taskType ?? 'RETRIEVAL_DOCUMENT',
        },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => ''); // canonical body-parse for the error diagnostic
    throw new Error(`Gateway embeddings HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const payload = (await res.json()) as {
    data?: Array<{ index?: number; embedding?: number[] }>;
  };
  const data = payload.data ?? [];
  // The OpenAI-compat shape carries an index per item — sort defensively so
  // vectors can never be misaligned with their input texts.
  const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return ordered.map(d => d.embedding ?? []);
}
