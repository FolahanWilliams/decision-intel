import { AuditState } from './types';
import { parseJSON } from '../utils/json';
import {
  AnalysisResult,
  BiasDetectionResult,
  NoiseBenchmark,
  CausalIntelligenceResult,
  RecognitionCuesResult,
  ForgottenQuestionsResult,
} from '../../types';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  type Tool,
} from '@google/generative-ai';
import {
  buildEnrichedBiasPrompt,
  NOISE_JUDGE_FRAMES,
  STRUCTURER_PROMPT,
  INTELLIGENCE_EXTRACTION_PROMPT,
  GDPR_ANONYMIZER_PROMPT,
  buildBiasResearchPrompt,
  buildNoiseBenchmarkPrompt,
  buildFactCheckRefinementPrompt,
  buildMetaJudgePrompt,
  buildRpdRecognitionPrompt,
  buildForgottenQuestionsPrompt,
  buildMarketContextBlock,
} from './prompts';
import { detectMarketContext, GROWTH_RATE_PRIORS } from '../constants/market-context';
import { searchSimilarDocuments, searchSimilarWithOutcomes } from '../rag/embeddings';
import { prisma } from '../prisma';
import { executeDataRequests, DataRequest } from '../tools/financial';
import { getRequiredEnvVar, getOptionalEnvVar } from '../env';
import {
  isGatewayGeminiEnabled,
  gatewayGeminiModelShim,
  mapGeminiToGateway,
} from '../ai/gateway-gemini';
import { buildStrategicConditionsPromptBlock } from '../deliverable/strategic-nodes';
import { MODEL_FRONTIER_REASONING, MODEL_STRONG_REASONING } from '../ai/gateway-models';
import { withRetry, smartTruncate, batchProcess, withCircuitBreaker } from '../utils/resilience';
import { getCachedBiasInsight, cacheBiasInsight } from '../utils/cache';
import { createLogger } from '../utils/logger';
import { assembleContext, formatContextForPrompt } from '../intelligence/contextBuilder';
import {
  assembleCrossDocumentContext,
  formatCrossDocContextForPrompt,
} from '../rag/cross-document-context';
import { normalizeBiasType } from '../utils/bias-normalize';
import { gradeFromScore } from '../utils/grade';
import { formatBiasName } from '../utils/labels';
import { distillForAudit } from './content-distiller';
import {
  isInvestmentDocument,
  buildInvestmentBiasOverlay,
  buildInvestmentNoiseOverlay,
  PE_BOARDROOM_PERSONAS,
} from '../prompts/investment-vertical';
import { computeDQChain } from '../scoring/dq-chain';

// ============================================================
// CONSTANTS
// ============================================================

const log = createLogger('Agents');

// Severity levels for bias detection - use these instead of hardcoded strings
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================

type SafetyLevel = 'relaxed' | 'standard';

interface ModelOptions {
  grounded?: boolean;
  /**
   * 'relaxed' — BLOCK_NONE. Required for bias detection, compliance checking,
   *   and other nodes that must analyse potentially harmful content in documents.
   * 'standard' — BLOCK_MEDIUM_AND_ABOVE. Suitable for simulation/creative nodes.
   */
  safetyLevel?: SafetyLevel;
  /** Override temperature (default: SDK default ~1.0). Use 0.3 for deterministic scoring. */
  temperature?: number;
  /** Override model name (for multi-model jury). Defaults to GEMINI_MODEL_NAME env var. */
  modelName?: string;
  /**
   * Force `responseMimeType: 'application/json'`. Defaults to `true` (every
   * legacy caller is byte-identical). Set `false` for nodes whose prompt asks
   * for prose AND/OR that are `grounded` on gemini-2.5-pro: that model returns
   * `400 — Tool use with a response mime type: 'application/json' is
   * unsupported` when grounding + JSON-mime are combined. The metaJudge is
   * both (its prompt literally ends "Return ONLY the text of the verdict. No
   * JSON." and it consumes `.text()` raw), so it MUST pass `false`.
   */
  jsonResponse?: boolean;
}

function createModelInstance(options: ModelOptions = {}): GenerativeModel {
  // GATEWAY-FIRST (locked 2026-07-02 — the Google-billing migration).
  // When the Vercel AI Gateway key is present, EVERY pipeline Gemini call
  // routes through the gateway (one bill, same models, grounding + safety
  // settings preserved — see src/lib/ai/gateway-gemini.ts header). The
  // shim impersonates the native SDK's generateContent contract so all
  // call sites (including extractSearchSources' groundingMetadata read)
  // work unchanged. PIPELINE_GATEWAY_GEMINI=off reverts to the legacy
  // direct SDK below, which then requires a working GOOGLE_API_KEY.
  if (isGatewayGeminiEnabled()) {
    return createGatewayGeminiShim(options);
  }

  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName =
    options.modelName || getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

  const safetySettings =
    options.safetyLevel === 'standard'
      ? [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ]
      : [
          // Relaxed: needed to analyse documents containing sensitive language
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ];

  const tools = options.grounded ? [{ googleSearch: {} } as Tool] : undefined;

  // Observability guard for the bug CLASS that killed the metaJudge on every
  // audit: grounding + responseMimeType:'application/json' is the fragile
  // combination — gemini-2.5-pro rejects it outright (400), and the Flash
  // grounded nodes (verification / simulation / benchmarks) only work today
  // because Flash currently tolerates it. If Gemini tightens Flash the way it
  // tightened 2.5-pro, this warn is the early signal in the logs BEFORE the
  // whole grounded layer goes dark. Pure logging — zero behavior change.
  if (tools && options.jsonResponse !== false) {
    log.warn(
      `[ModelInstance] FRAGILE COMBO: grounded + JSON-mime on ${modelName}. ` +
        `This is the metaJudge P0 bug class — if this model starts 400ing ` +
        `"Tool use with a response mime type is unsupported", the fix is ` +
        `jsonResponse:false on its getter + tolerant text-parse on its consumer.`
    );
  }

  return genAI.getGenerativeModel({
    model: modelName,
    ...(tools ? { tools } : {}),
    generationConfig: {
      // JSON-mime is the default, but it is INCOMPATIBLE with grounding on
      // gemini-2.5-pro (400 Bad Request). Callers whose prompt wants prose
      // (e.g. metaJudge) pass jsonResponse:false. Default true keeps every
      // legacy caller byte-identical.
      ...(options.jsonResponse === false ? {} : { responseMimeType: 'application/json' }),
      maxOutputTokens: 16384,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
    safetySettings,
  });
}

/**
 * Gateway shim — impersonates the native SDK's generateContent contract
 * (`{ response: { text(), candidates[].groundingMetadata } }`) on top of a
 * gateway-routed call, so every pipeline call site works unchanged:
 *   - string parts are joined with double newlines (same logical message
 *    the native SDK receives via array-of-parts);
 *   - grounded instances attach google_search through the gateway and
 *    source URLs are reconstructed into groundingChunks so
 *    extractSearchSources keeps working;
 *   - no responseMimeType (the gateway path returns plain text; every
 *    consumer's prompt demands JSON and parses fence-tolerantly — the
 *    same contract the frontier Anthropic paths run on).
 * Only `.generateContent` exists on the shim; nodes.ts call sites use
 * nothing else (verified 2026-07-02), hence the narrow cast.
 */
function createGatewayGeminiShim(options: ModelOptions): GenerativeModel {
  const nativeName =
    options.modelName || getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
  return gatewayGeminiModelShim({
    model: nativeName,
    grounded: options.grounded === true,
    temperature: options.temperature,
    safetyLevel: options.safetyLevel === 'standard' ? 'standard' : 'relaxed',
  }) as unknown as GenerativeModel;
}

// Lazy singletons
let cheapModelInstance: GenerativeModel | null = null;
let proStandardSafetyGroundedInstance: GenerativeModel | null = null;
let groundedModelInstance: GenerativeModel | null = null;
let standardSafetyGroundedInstance: GenerativeModel | null = null;

/**
 * Cheaper model for mechanical / low-judgment nodes (anonymization, structuring,
 * topic extraction). Defaults to gemini-3.1-flash-lite — half the per-token cost
 * of the main model with marginal quality loss on these task shapes. Override
 * with GEMINI_MODEL_CHEAP env var.
 */
function getCheapModel(): GenerativeModel {
  if (!cheapModelInstance) {
    cheapModelInstance = createModelInstance({
      safetyLevel: 'relaxed',
      modelName: getOptionalEnvVar('GEMINI_MODEL_CHEAP', 'gemini-3.1-flash-lite'),
    });
  }
  return cheapModelInstance;
}

/**
 * The metaJudge's LEGACY fallback model — only fires when the frontier
 * tier is unavailable (no AI_GATEWAY_API_KEY or PIPELINE_FRONTIER_MODELS=off);
 * the default metaJudge is Opus 4.8 via resolveFrontierModel. GEMINI-2.5-PRO
 * RETIRED 2026-07-02 (founder: "quite a bad model — Gemini 3 Flash is better
 * in pretty much every way") — the fallback now defaults to the same Flash
 * tier as the rest of the legacy pipeline. Override with GEMINI_MODEL_PRO.
 */
function getProStandardSafetyGroundedModel(): GenerativeModel {
  if (!proStandardSafetyGroundedInstance) {
    proStandardSafetyGroundedInstance = createModelInstance({
      grounded: true,
      safetyLevel: 'standard',
      modelName: getOptionalEnvVar('GEMINI_MODEL_PRO', 'gemini-3-flash-preview'),
      // metaJudge prompt ends "Return ONLY the text of the verdict. No JSON."
      // and the node consumes .text() raw — keep prose mode (also avoids the
      // grounding + JSON-mime fragile combo, the old metaJudge P0 bug class).
      jsonResponse: false,
    });
  }
  return proStandardSafetyGroundedInstance;
}

function getGroundedModel(): GenerativeModel {
  if (!groundedModelInstance) {
    groundedModelInstance = createModelInstance({ grounded: true, safetyLevel: 'relaxed' });
  }
  return groundedModelInstance;
}

/** Model with standard safety filters — used for simulation/creative nodes. */
function getStandardSafetyGroundedModel(): GenerativeModel {
  if (!standardSafetyGroundedInstance) {
    standardSafetyGroundedInstance = createModelInstance({
      grounded: true,
      safetyLevel: 'standard',
    });
  }
  return standardSafetyGroundedInstance;
}

/**
 * Heuristic: treat any model name with a `<provider>/<model>` shape as
 * a Vercel-AI-Gateway-routed call. Native Gemini names like
 * `gemini-3-flash-preview` use the GoogleGenerativeAI SDK directly.
 * Same convention as `src/lib/ai/providers/gateway.ts`.
 */
function isGatewayModel(name: string): boolean {
  return /^[a-z][a-z0-9_-]*\//i.test(name);
}

/**
 * Unified cross-provider model call — routes by model name. Returns a
 * normalised `{ text }` shape regardless of underlying provider so
 * consumers (noise jury, frontier-tier reasoning nodes) stay single-path.
 *
 * Locked 2026-05-06 (cross-model jury ship) as `runJudgeCall`; generalized
 * 2026-07-02 (frontier model-tier upgrade) to serve the reasoning nodes
 * (metaJudge / forgottenQuestions / deepAnalysis / simulation / rpd) when
 * they resolve to a gateway-routed Anthropic model.
 *
 * Each provider routes through its own circuit breaker (`gemini` vs
 * `gateway`) so an outage on one side doesn't poison the other arm.
 * The gateway path carries the SAME retry envelope as the Gemini path
 * (withRetry 2×, 1s base / 10s max) so a transient gateway blip doesn't
 * degrade a whole node that Gemini would have retried through.
 */
async function runModelCall(
  modelName: string,
  prompts: string[],
  options: { temperature?: number; timeoutMs?: number; jsonResponse?: boolean } = {}
): Promise<{ text: string; modelName: string }> {
  const temperature = options.temperature ?? 0.3;

  if (isGatewayModel(modelName)) {
    // Lazy-import the gateway provider so the pipeline bundle stays
    // lean when the env doesn't enable cross-model arms.
    const { generateText } = await import('@/lib/ai/providers/gateway');
    // The gateway expects a single string prompt. Callers pass
    // `[basePrompt, contentBlock, suffix]` arrays; join with
    // double-newline separators so the gateway sees the same logical
    // message Gemini receives via array-of-parts.
    const combinedPrompt = prompts.join('\n\n');
    // Anthropic 4.7+ models (Opus 4.8, Sonnet 5) REJECT the temperature
    // parameter with a 400 — sampling params were removed from that API
    // generation. Omit it entirely for anthropic/* models; prompting is
    // the steering mechanism there. (Grok/Gemini gateway models still
    // accept it.)
    const isAnthropic = modelName.startsWith('anthropic/');
    // Frontier reasoning models are slower than Flash — default their
    // per-call ceiling to 150s (vs the 90s LLM_TIMEOUT_MS) so a long
    // Opus verdict isn't killed mid-generation, while still failing
    // fast enough that the node fallback fires inside the route budget.
    const timeoutMs = options.timeoutMs ?? (isAnthropic ? 150000 : LLM_TIMEOUT_MS);
    const result = await withCircuitBreaker('gateway', () =>
      withRetry(
        () =>
          withTimeout(
            generateText(combinedPrompt, {
              model: modelName,
              ...(isAnthropic ? {} : { temperature }),
              // Gateway's default 16384 matches Gemini's maxOutputTokens —
              // keep cap aligned so JSON outputs from both arms have the
              // same truncation tolerance.
              maxOutputTokens: 16384,
            }),
            timeoutMs
          ),
        2,
        1000,
        10000
      )
    );
    return { text: result.text, modelName: result.model };
  }

  // Native Gemini path — uses the existing createModelByName +
  // withGeminiResilience wrapper for parity with the legacy 3-Gemini
  // jury. jsonResponse:false is honoured for prose consumers (metaJudge).
  const model = createModelByName(modelName, {
    temperature,
    jsonResponse: options.jsonResponse,
  });
  const result = await withGeminiResilience(() =>
    withTimeout(model.generateContent(prompts), options.timeoutMs ?? LLM_TIMEOUT_MS)
  );
  const text = result.response?.text ? result.response.text() : '';
  return { text, modelName };
}

/**
 * Create a model by explicit name — used for multi-model noise jury.
 * Not cached (each call creates a new instance) since model names vary.
 */
function createModelByName(
  name: string,
  options?: { temperature?: number; jsonResponse?: boolean }
): GenerativeModel {
  return createModelInstance({
    safetyLevel: 'relaxed',
    modelName: name,
    temperature: options?.temperature,
    jsonResponse: options?.jsonResponse,
  });
}

/**
 * Parse NOISE_JURY_MODELS env var for multi-model noise jury configuration.
 * Format: comma-separated model names, e.g. "gemini-3-flash-preview,gemini-2.5-pro,gemini-3.1-flash-lite"
 * Returns empty array if not set (falls back to default single-model jury).
 */
/**
 * Default cross-model jury — 2 model families across 3 frames
 * (locked 2026-07-02, frontier model-tier upgrade; supersedes the
 * 2026-05-06 Grok arm — founder-dropped: "Grok is not that good"):
 *   [0] analyst_skeptical     → gemini-3-flash-preview (Google, native)
 *   [1] regulator_hostile     → anthropic/claude-opus-4-8 (via AI Gateway)
 *   [2] contrarian_strategist → anthropic/claude-sonnet-5 (via AI Gateway)
 *
 * Opus 4.8 fires on regulator_hostile because that's the single most
 * load-bearing frame (the hostile-GC rubric that catches what a friendly
 * read misses) — it gets the smartest model. Sonnet 5 takes the
 * contrarian-strategist frame. The Gemini arm stays for architectural
 * diversity + graceful degradation: a gateway outage degrades to a
 * 1-valid-judge fallback (aggregator handles it), a Gemini outage leaves
 * 2 Anthropic arms. Anthropic arms receive NO temperature param (4.7+
 * models 400 on it — see runModelCall). Override via NOISE_JURY_MODELS
 * env var (comma-separated 3-model list, e.g. the legacy
 * "gemini-3-flash-preview,xai/grok-4.3,gemini-3-flash-preview").
 */
const DEFAULT_NOISE_JURY_MODELS = [
  'gemini-3-flash-preview',
  MODEL_FRONTIER_REASONING,
  MODEL_STRONG_REASONING,
] as const;

function getNoiseJuryModels(): string[] {
  const envVal = getOptionalEnvVar('NOISE_JURY_MODELS', '');
  if (!envVal) return [...DEFAULT_NOISE_JURY_MODELS];
  return envVal
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// ============================================================
// FRONTIER MODEL TIERS (locked 2026-07-02 — founder-approved pipeline change)
// ============================================================
//
// The founder's model ranking, applied where each tier earns its cost:
// cheap Gemini for mechanical extraction, Gemini-grounded for live
// fact-checking (grounding is load-bearing there and the Anthropic route
// can't do Google Search), and Anthropic frontier models for the
// buyer-facing REASONING — the structural flaws, why they're credible,
// and the mitigations. That reasoning is the product's deliverable.
//
//   metaJudge          → Opus 4.8   (final verdict + ranking — highest single-call leverage)
//   forgottenQuestions → Opus 4.8   (the Fermi killers: the "I didn't think to ask that" content)
//   deepAnalysis       → Sonnet 5   (SWOT / pre-mortem / counter-arguments)
//   simulation         → Sonnet 5   (boardroom persona objections)
//   rpdRecognition     → Sonnet 5   (Klein recognition cues)
//   biasDetective      → '' legacy  (grounded Gemini DEFAULT — its prompt fact-checks via
//                                    Google Search; env-overridable for a founder A/B)
//
// Resolution order (per node):
//   1. Per-node env override (PIPELINE_MODEL_<NODE>) — set to a gateway
//      model string ('anthropic/claude-sonnet-5'), a native Gemini name,
//      or the literal 'legacy' to force that node onto its original
//      Gemini getter.
//   2. Global kill switch: PIPELINE_FRONTIER_MODELS=off → EVERY node
//      reverts to its legacy Gemini path (byte-identical to the
//      pre-2026-07-02 pipeline). This is the one-env-var rollback.
//   3. The defaults above.
//
// Trade recorded honestly: frontier-routed nodes lose the in-call
// googleSearch tool (the AI Gateway doesn't expose Gemini grounding, and
// Anthropic models search differently). They RETAIN the injected grounded
// context (market enricher, intelligence gatherer, RAG, case analogs),
// and the dedicated verificationNode stays Gemini-grounded downstream.
// Reasoning depth is what these nodes are for; the grounded nodes keep
// the fact-checking.

type FrontierNodeKey =
  | 'metaJudge'
  | 'forgottenQuestions'
  | 'deepAnalysis'
  | 'simulation'
  | 'rpdRecognition'
  | 'biasDetective';

const FRONTIER_NODE_DEFAULTS: Record<FrontierNodeKey, string> = {
  metaJudge: MODEL_FRONTIER_REASONING,
  forgottenQuestions: MODEL_FRONTIER_REASONING,
  deepAnalysis: MODEL_STRONG_REASONING,
  simulation: MODEL_STRONG_REASONING,
  rpdRecognition: MODEL_STRONG_REASONING,
  // Empty = legacy grounded Gemini. The bias detective's prompt instructs
  // live Google-Search verification of claims; routing it to an ungrounded
  // model makes that instruction unfollowable. Set PIPELINE_MODEL_BIAS_DETECTIVE
  // to A/B Opus here — the frontier branch swaps the search instruction for
  // an honest assess-against-provided-context one.
  biasDetective: '',
};

const FRONTIER_NODE_ENV: Record<FrontierNodeKey, string> = {
  metaJudge: 'PIPELINE_MODEL_META_JUDGE',
  forgottenQuestions: 'PIPELINE_MODEL_FORGOTTEN_QUESTIONS',
  deepAnalysis: 'PIPELINE_MODEL_DEEP_ANALYSIS',
  simulation: 'PIPELINE_MODEL_SIMULATION',
  rpdRecognition: 'PIPELINE_MODEL_RPD_RECOGNITION',
  biasDetective: 'PIPELINE_MODEL_BIAS_DETECTIVE',
};

/**
 * Resolve which model a frontier-tier node should run on.
 * Returns a model name (gateway or native) to route through
 * `runModelCall`, or null → the node uses its legacy Gemini path.
 */
function resolveFrontierModel(key: FrontierNodeKey): string | null {
  const override = getOptionalEnvVar(FRONTIER_NODE_ENV[key], '').trim();
  if (override) return override.toLowerCase() === 'legacy' ? null : override;
  if (getOptionalEnvVar('PIPELINE_FRONTIER_MODELS', 'on').trim().toLowerCase() === 'off') {
    return null;
  }
  const resolved = FRONTIER_NODE_DEFAULTS[key] || null;
  // Fail-safe: gateway-routed defaults require AI_GATEWAY_API_KEY. Without
  // it every frontier call would throw at the env check and degrade the
  // node to its error fallback — strictly worse than the legacy Gemini
  // path. Fall back to legacy automatically (local dev / CI / vitest run
  // without the key). An EXPLICIT env override above is honoured as-is so
  // a misconfigured override fails loudly rather than silently downgrading.
  if (resolved && isGatewayModel(resolved) && !process.env.AI_GATEWAY_API_KEY) {
    return null;
  }
  return resolved;
}

/**
 * Build the ACTUAL per-node model lineage for THIS run's environment — the
 * honest answer to "which models produced this audit?". It reuses the exact
 * resolvers the pipeline itself uses (`resolveFrontierModel` + the gateway
 * mapping + `getNoiseJuryModels`), so it cannot drift from what actually ran:
 * the frontier reasoning nodes report Opus 4.8 / Sonnet 5 when frontier is on,
 * and fall back to gateway-mapped Gemini exactly as the nodes do (frontier off,
 * no gateway key, or a per-node PIPELINE_MODEL_* override). Persisted into
 * judgeOutputs so the DPR reproducibility page declares the truth instead of a
 * hardcoded all-Gemini constant. Pure — reads env only, no I/O.
 */
export function buildRuntimeModelLineage(): Record<
  string,
  { model: string; temperature: number; topP: number }
> {
  const gw = isGatewayGeminiEnabled();
  // Map a native Gemini name to its gateway id when the gateway is on; pass a
  // frontier / already-gateway id through untouched.
  const m = (name: string): string =>
    gw && !name.includes('/') && name.startsWith('gemini') ? mapGeminiToGateway(name) : name;
  // A frontier node's real model, or its legacy grounded-Gemini fallback.
  const frontierOr = (key: FrontierNodeKey, legacy: string): string =>
    resolveFrontierModel(key) ?? m(legacy);
  // The noise jury runs across model families (Flash + Opus + Sonnet by
  // default); report the set so the page can't claim a single Gemini judge.
  const jury = getNoiseJuryModels()
    .map(x => m(x))
    .join(' + ');
  return {
    gdprAnonymizer: { model: m('gemini-3.1-flash-lite'), temperature: 0.0, topP: 0.95 },
    dataStructurer: { model: m('gemini-3.1-flash-lite'), temperature: 0.0, topP: 0.95 },
    intelligenceGatherer: { model: m('gemini-3.1-flash-lite'), temperature: 0.2, topP: 0.95 },
    biasDetective: {
      model: frontierOr('biasDetective', 'gemini-3-flash-preview'),
      temperature: 0.2,
      topP: 0.95,
    },
    noiseJudge: { model: jury, temperature: 0.4, topP: 0.95 },
    statisticalJury: { model: m('gemini-3-flash-preview'), temperature: 0.3, topP: 0.95 },
    verification: { model: m('gemini-3-flash-preview'), temperature: 0.1, topP: 0.95 },
    deepAnalysis: {
      model: frontierOr('deepAnalysis', 'gemini-3-flash-preview'),
      temperature: 0.3,
      topP: 0.95,
    },
    simulation: {
      model: frontierOr('simulation', 'gemini-3-flash-preview'),
      temperature: 0.5,
      topP: 0.95,
    },
    rpdRecognition: {
      model: frontierOr('rpdRecognition', 'gemini-3-flash-preview'),
      temperature: 0.25,
      topP: 0.95,
    },
    forgottenQuestions: {
      model: frontierOr('forgottenQuestions', 'gemini-3-flash-preview'),
      temperature: 0.35,
      topP: 0.95,
    },
    metaJudge: {
      model: frontierOr('metaJudge', 'gemini-3-flash-preview'),
      temperature: 0.15,
      topP: 0.95,
    },
    riskScorer: { model: 'deterministic', temperature: 0.0, topP: 1.0 },
  };
}

// ============================================================
// BLIND RETRO MODE (locked 2026-07-02)
// ============================================================
//
// When state.blindMode is true (PIPELINE_BLIND_MODE=on), every LIVE-data
// channel is disabled so a retro on a historical filing cannot be
// contaminated by post-filing data via retrieval: the market enricher +
// news + macro + live benchmarks are gated in contextBuilder; Google-
// Search grounding is disabled on the grounded nodes here; the Finnhub
// financial fetch + benchmark verification are skipped; and the
// discipline block below is appended to every reasoning prompt.
//
// HONESTY BOUNDARY: model training memory cannot be switched off. The
// defensible claim is "live retrieval disabled + every finding cites the
// document's own language" — never "the model could not have known."
// The undeniable proof path is forward-looking: audit CURRENT filings,
// hash-stamp them in the DPR, let outcomes arrive later.

const BLIND_RETRO_DISCIPLINE = `

=== BLIND RETRO DISCIPLINE (live retrieval is DISABLED for this audit) ===
Assess this document strictly AS OF ITS OWN DATE:
- Derive EVERY finding from the document's own language, the provided context blocks, and general pre-existing knowledge of decision-making patterns and historical analogs.
- If you recognize the company or transaction, DO NOT use any knowledge of events, prices, announcements, or outcomes that postdate the document. Never hint at "what happened next."
- Never claim to have verified a claim externally. Mark externally-unverifiable claims as unverified rather than assuming them true or false.
- Structural risks must be justified by the document's own disclosures (concentration, capital structure, governance, valuation basis), not by hindsight.`;

// Ungrounded Gemini variants for blind mode — identical config to their
// grounded siblings minus the googleSearch tool. Lazy singletons like the rest.
let ungroundedRelaxedInstance: GenerativeModel | null = null;
function getUngroundedRelaxedModel(): GenerativeModel {
  if (!ungroundedRelaxedInstance) {
    ungroundedRelaxedInstance = createModelInstance({ safetyLevel: 'relaxed' });
  }
  return ungroundedRelaxedInstance;
}
let ungroundedStandardInstance: GenerativeModel | null = null;
function getUngroundedStandardModel(): GenerativeModel {
  if (!ungroundedStandardInstance) {
    ungroundedStandardInstance = createModelInstance({ safetyLevel: 'standard' });
  }
  return ungroundedStandardInstance;
}

// ============================================================
// SHARED UTILITIES
// ============================================================

// Timeout wrapper for LLM calls to prevent hanging
const LLM_TIMEOUT_MS = 90000; // 90 seconds - increased for complex analysis

async function withTimeout<T>(promise: Promise<T>, ms: number = LLM_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Text truncation to prevent timeouts on large documents. Raised 25K → 50K
// (2026-06-30) so filings / long memos get ~10 pages audited instead of ~5.
// ONLY affects docs over 25K chars — a normal memo is under this and passes
// through smartTruncate unchanged, so the standard-memo DQI distribution is
// byte-identical (the held-out dqi-distribution-check uses sub-25K synthetic
// memos). Bounded by the per-node Gemini cost + the 300s function timeout
// across ~17 calls; for the deepest filing audit, paste just the relevant
// section (risk factors / MD&A) so the first 50K is pure reasoning.
const MAX_INPUT_CHARS = 50000; // ~12K tokens

function truncateText(text: string): string {
  return smartTruncate(text, MAX_INPUT_CHARS);
}

/**
 * Wrapper that routes all Gemini LLM calls through the circuit breaker + retry.
 * If Gemini has had 5+ consecutive failures, calls are rejected immediately
 * for 60s instead of piling up timeouts.
 */
async function withGeminiResilience<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  return withCircuitBreaker('gemini', () => withRetry(fn, retries, baseDelay, maxDelay));
}

/**
 * Extract verified search source URLs from Gemini grounding metadata.
 * Consolidates the duplicated metadata extraction pattern used by multiple nodes.
 */
function extractSearchSources(response: {
  candidates?: Array<{
    groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string } }> };
  }>;
}): string[] {
  const metadata = response.candidates?.[0]?.groundingMetadata;
  return (
    metadata?.groundingChunks
      ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
      .filter((u: unknown): u is string => typeof u === 'string') || []
  );
}

/**
 * Wrap external (untrusted) data in clearly delimited XML blocks before
 * embedding it in an LLM prompt. This reduces the surface area for prompt
 * injection by making it unambiguous where external data starts and ends.
 *
 * XML special characters are escaped so that crafted data cannot break out
 * of the delimiter tags (e.g. a value of "</external_data>inject..." would
 * otherwise prematurely close the block).
 */
function sanitizeForPrompt(data: unknown, label: string = 'external_data'): string {
  const json = JSON.stringify(data, null, 2)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  return `<${label}>\n${json}\n</${label}>`;
}

/** Validate ticker symbols to prevent injection via crafted ticker strings. */
function isValidTicker(ticker: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(ticker.toUpperCase());
}

/** Strip control characters and cap length to prevent prompt injection via company names. */
function sanitizeCompanyName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return (
    name
      .replace(/[\n\r\t\x00-\x1f]/g, ' ')
      .trim()
      .slice(0, 200) || undefined
  );
}

// ============================================================
// NODES
// ============================================================

export async function structurerNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Only use anonymized content. If structuredContent is empty the
  // graph routing guard should have prevented us from reaching this node.
  if (!state.structuredContent) {
    throw new Error(
      'structurerNode: structuredContent is empty — anonymization may have been bypassed'
    );
  }
  const content = state.structuredContent;

  try {
    log.info('Running document structuring...');

    const result = await withGeminiResilience(() =>
      withTimeout(
        getCheapModel().generateContent([
          STRUCTURER_PROMPT,
          `<input_text>\n${content}\n</input_text>`,
        ])
      )
    );

    const responseText = result.response?.text ? result.response.text() : '';
    const data = parseJSON(responseText);

    if (data?.structuredContent) {
      log.info(`Structuring complete. Identified ${data.speakers?.length || 0} speakers.`);
      return {
        structuredContent: data.structuredContent,
        speakers: data.speakers || [],
      };
    }
  } catch (e) {
    log.error('Structurer node failed:', e instanceof Error ? e.message : String(e));
  }

  // Fallback: return content as-is
  return {
    structuredContent: content,
    speakers: [],
  };
}

// ============================================================
// INTELLIGENCE GATHERING NODE
// Runs after structurer, before analysis nodes. Extracts topics
// and industry from structured content, then assembles external
// intelligence context for all downstream nodes.
// ============================================================

export async function intelligenceNode(state: AuditState): Promise<Partial<AuditState>> {
  try {
    log.info('Gathering web intelligence context...');
    const content = truncateText(state.structuredContent || '');

    // Quick extraction: ask Gemini to identify topics, industry, and companies
    const extractionResult = await withGeminiResilience(
      () =>
        withTimeout(
          getCheapModel().generateContent([
            INTELLIGENCE_EXTRACTION_PROMPT,
            `<input_text>\n${content.slice(0, 8000)}\n</input_text>`,
          ]),
          30000
        ),
      2,
      1000,
      5000
    );

    const extractionText = extractionResult.response?.text
      ? extractionResult.response.text()
      : '{}';
    const extracted = parseJSON(extractionText) || {};

    const topics: string[] = Array.isArray(extracted.topics) ? extracted.topics : [];
    const industry: string | undefined =
      typeof extracted.industry === 'string' ? extracted.industry : undefined;
    const companies: string[] = Array.isArray(extracted.companies) ? extracted.companies : [];
    const biasKeywords: string[] = Array.isArray(extracted.biasKeywords)
      ? extracted.biasKeywords
      : [];

    // Assemble intelligence context from all sources
    const intelligenceContext = await assembleContext({
      biasTypes: biasKeywords,
      industry,
      topics,
      companies,
      // Blind retro mode: live sources (news / macro / benchmarks / market
      // enricher) are skipped inside assembleContext; static analogs stay.
      blind: state.blindMode === true,
    });

    log.info(
      `Intelligence gathered: news=${intelligenceContext.meta.sources.newsCount}, ` +
        `research=${intelligenceContext.meta.sources.researchCount}, ` +
        `cases=${intelligenceContext.meta.sources.caseStudyCount}, ` +
        `macro=${intelligenceContext.meta.sources.macroIndicators}, ` +
        `marketSignals=${intelligenceContext.meta.sources.marketSignals}`
    );

    // Assemble cross-document RAG context (non-blocking)
    let crossDocContext;
    try {
      crossDocContext = await assembleCrossDocumentContext(
        state.documentId,
        content,
        state.userId,
        5
      );
      log.info(
        `Cross-doc context: ${crossDocContext.sectionCount} sections, ${crossDocContext.documentCount} documents`
      );
    } catch (e) {
      log.warn('Cross-doc context failed (non-fatal):', e instanceof Error ? e.message : String(e));
    }

    return { intelligenceContext, crossDocContext };
  } catch (e) {
    log.warn('Intelligence node failed (non-fatal):', e instanceof Error ? e.message : String(e));
    return {}; // Omit the key entirely so downstream nodes don't receive undefined
  }
}

export async function biasDetectiveNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  // Graph routing should prevent reaching this node, but guard anyway.
  if (state.anonymizationStatus !== 'success') {
    log.warn('biasDetective: anonymization not confirmed — skipping to protect PII');
    return { biasAnalysis: [] };
  }

  try {
    // SECURITY: Never fall back to originalContent — only use anonymized content
    const content = truncateText(state.structuredContent || '');

    // Inject intelligence context if available
    const intelContext = state.intelligenceContext
      ? formatContextForPrompt(state.intelligenceContext)
      : '';
    const intelPrompt = intelContext
      ? `\n\nEXTERNAL INTELLIGENCE CONTEXT (use to validate claims and identify biases):\n${sanitizeForPrompt(intelContext, 'intelligence_context')}`
      : '';

    // Inject cross-document context if available
    const crossDocBlock = state.crossDocContext
      ? formatCrossDocContextForPrompt(state.crossDocContext)
      : '';
    const crossDocPrompt = crossDocBlock
      ? `\n\nCROSS-DOCUMENT CONTEXT (similar documents in this user's portfolio — check for recurring bias patterns):\n${sanitizeForPrompt(crossDocBlock, 'cross_doc_context')}`
      : '';

    // Detect industry for enriched prompt (non-blocking)
    let detectedIndustry: string | undefined;
    try {
      const { detectIndustry } = await import('@/lib/ontology/industry-profiles');
      detectedIndustry = detectIndustry(content) ?? undefined;
      if (detectedIndustry) {
        log.info(`Industry detected: ${detectedIndustry}`);
      }
    } catch {
      // Industry detection is optional enrichment
    }

    // Build prompt with ontology context (compound interactions + industry biases)
    let biasPrompt = buildEnrichedBiasPrompt(detectedIndustry);

    // Corporate Strategy / M&A Vertical: Append strategy-specific bias detection overlay
    const investmentOverlay = buildInvestmentBiasOverlay(state.documentType, state.dealStage);
    if (investmentOverlay) {
      biasPrompt += `\n\n--- STRATEGIC DECISION CONTEXT ---\n${investmentOverlay}`;
      log.info(
        `Using investment-specific bias detection (docType=${state.documentType}, stage=${state.dealStage || 'unknown'})`
      );
    }

    // Market-context priors — adjusts the overconfidence trigger so an EM
    // memo's 35%+ CAGR claim is not auto-flagged the same way a DM memo's
    // 35%+ CAGR claim is. Detection is mention-based + deterministic, no
    // LLM call. When `unknown`, buildMarketContextBlock returns '' so the
    // detector falls through to its default behaviour.
    const marketContextDetection = detectMarketContext(content);
    const marketContextBlock = buildMarketContextBlock(marketContextDetection);
    if (marketContextBlock) {
      biasPrompt += marketContextBlock;
      log.info(
        `Market context applied: ${marketContextDetection.context} (EM=[${marketContextDetection.emergingMarketCountries.join(',')}], DM=[${marketContextDetection.developedMarketCountries.join(',')}], confidence=${marketContextDetection.confidence.toFixed(2)})`
      );
    }

    // Frontier tier (2026-07-02): the bias detective DEFAULTS to the legacy
    // grounded Gemini path — its live Google-Search fact-check is load-bearing
    // (the 2026-06-09 caching lock names it). PIPELINE_MODEL_BIAS_DETECTIVE is
    // the founder A/B lever; when set to an ungrounded frontier model, the
    // search instruction is swapped for an honest assess-against-context one
    // (an instruction the model can't follow invites fabricated "I searched").
    const frontierBiasModel = resolveFrontierModel('biasDetective');
    const bdBlind = state.blindMode === true;
    const bdBlindBlock = bdBlind ? BLIND_RETRO_DISCIPLINE : '';
    const bdNoSearchInstruction = `IMPORTANT: Assess factual claims against the provided intelligence and cross-document context. You have NO live search access — never claim to have verified a claim externally; mark externally-unverifiable claims as unverified rather than assuming them true or false.${intelPrompt}${crossDocPrompt}`;
    let response: string;
    if (frontierBiasModel) {
      const frontier = await runModelCall(frontierBiasModel, [
        biasPrompt + bdBlindBlock,
        `Text to Analyze: \n<input_text>\n${content} \n </input_text>`,
        bdNoSearchInstruction,
      ]);
      response = frontier.text;
    } else {
      // Grounded Gemini for primary detection with circuit breaker + retry.
      // BLIND MODE: ungrounded variant + the no-search instruction — a live
      // search on a retro's claims finds the outcome (contamination).
      const bdModel = bdBlind ? getUngroundedRelaxedModel() : getGroundedModel();
      const result = await withGeminiResilience(
        () =>
          withTimeout(
            bdModel.generateContent([
              biasPrompt + bdBlindBlock,
              `Text to Analyze: \n<input_text>\n${content} \n </input_text>`,
              bdBlind
                ? bdNoSearchInstruction
                : `CRITICAL: If the document mentions modern events, public figures, or statistical claims, verify their accuracy using Google Search BEFORE flagging them as biased or unbiased.${intelPrompt}${crossDocPrompt}`,
            ])
          ),
        2, // 2 retries
        1000, // 1 second base delay
        10000 // 10 second max delay
      );
      response = result.response?.text ? result.response.text() : '';
    }
    const data = parseJSON(response);
    const biases = data?.biases || [];

    // Educational Insight (Dynamic Retrieval) with caching
    // For HIGH/CRITICAL biases, fetch scientific context
    const severeBiases = biases.filter(
      (b: BiasDetectionResult) =>
        (b.severity === SEVERITY_LEVELS.HIGH || b.severity === SEVERITY_LEVELS.CRITICAL) &&
        b.biasType
    );

    if (severeBiases.length > 0) {
      log.info(`Fetching educational insights for ${severeBiases.length} severe biases...`);

      // Process insights with concurrency control and caching
      await batchProcess(
        severeBiases.slice(0, 3),
        async (bias: BiasDetectionResult) => {
          // Check cache first
          const cachedInsight = await getCachedBiasInsight(bias.biasType, state.orgId);
          if (cachedInsight) {
            log.debug(`Cache hit for bias insight: ${bias.biasType}`);
            bias.researchInsight = JSON.parse(cachedInsight);
            return;
          }

          try {
            const searchResult = await withGeminiResilience(
              () =>
                withTimeout(
                  getGroundedModel().generateContent([
                    buildBiasResearchPrompt(bias.biasType || ''),
                    `Bias: ${bias.biasType}`,
                  ]),
                  30000
                ), // 30 second timeout for insights
              2, // 2 retries
              1000,
              5000
            );

            const insightText = searchResult.response?.text ? searchResult.response.text() : '';
            const insightData = parseJSON(insightText);

            // Extract Source
            const searchSources = searchResult.response
              ? extractSearchSources(searchResult.response)
              : [];
            const searchSource = searchSources[0];

            if (insightData) {
              const researchInsight = {
                ...insightData,
                sourceUrl: insightData.sourceUrl || searchSource || '',
              };
              bias.researchInsight = researchInsight;

              // Cache the insight for future use
              await cacheBiasInsight(bias.biasType, JSON.stringify(researchInsight), state.orgId);
            }
          } catch (e) {
            log.error(`Failed to fetch insight for ${bias.biasType}`, e);
          }
        },
        2 // Process 2 at a time to avoid rate limits
      );
    }

    return { biasAnalysis: biases, marketContext: marketContextDetection };
  } catch (e) {
    log.error('Bias Detective failed:', e instanceof Error ? e.message : String(e));
    // Degraded-node honesty (2026-07-02): an errored detector must be
    // DISTINGUISHABLE from a genuinely clean pass. Two blind runs shipped
    // "0 bias findings" while every Gemini call 403'd on billing — the
    // empty default read as clean. The ledger entry lets every surface
    // (deliverable headline, cover SCQA, clean-audit panel) say
    // "detection unavailable" instead of "nothing found".
    return { biasAnalysis: [], degradedNodes: ['biasDetective'] };
  }
}

export async function noiseJudgeNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  if (state.anonymizationStatus !== 'success') {
    log.warn('noiseJudge: anonymization not confirmed — skipping to protect PII');
    return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
  }

  // SECURITY: Never fall back to originalContent — only use anonymized content
  const content = truncateText(state.structuredContent || '');

  try {
    // Inject macro/industry context for better benchmark comparison
    const macroContext = state.intelligenceContext?.macro?.summary || '';
    const benchmarkContext =
      state.intelligenceContext?.industryBenchmarks
        ?.slice(0, 4)
        .map(b => `${b.metric}: ${b.value} (${b.source})`)
        .join('; ') || '';
    const contextSuffix =
      macroContext || benchmarkContext
        ? `\n\nEXTERNAL BENCHMARKS FOR COMPARISON:\n${macroContext ? `Macro: ${macroContext}\n` : ''}${benchmarkContext ? `Industry: ${benchmarkContext}` : ''}`
        : '';

    // Corporate Strategy / M&A Vertical: build the investment overlay once and
    // append it to each frame prompt, so all 3 frames score against the same
    // strategic-decision context but through different professional lenses.
    const investmentNoiseOverlay = buildInvestmentNoiseOverlay(state.documentType);
    if (investmentNoiseOverlay) {
      log.info(`Using investment-specific noise evaluation (docType=${state.documentType})`);
    }
    const composeFramePrompt = (basePrompt: string): string =>
      investmentNoiseOverlay
        ? `${basePrompt}\n\n--- STRATEGIC DECISION CONTEXT ---\n${investmentNoiseOverlay}`
        : basePrompt;

    // Cross-model noise jury (locked 2026-05-06): three orthogonal
    // sources of variance —
    //   • stochastic (random seed appended to each call)
    //   • architectural (Gemini + Grok, different model families)
    //   • framing (analyst_skeptical / regulator_hostile /
    //     contrarian_strategist per NOISE_JUDGE_FRAMES)
    //
    // The model assignment lives in DEFAULT_NOISE_JURY_MODELS; override
    // via NOISE_JURY_MODELS env var (comma-separated 3-model list).
    // Each frame routes through the right circuit breaker (`gemini`
    // for native Gemini calls, `gateway` for Vercel-AI-Gateway-routed
    // models like Grok) so a single-provider outage doesn't poison
    // the cross-model arm.
    const juryModels = getNoiseJuryModels();
    log.info(
      `Cross-model noise jury: ${juryModels.join(' / ')} × ${NOISE_JUDGE_FRAMES.map(f => f.id).join(' · ')}`
    );

    // Parallel judges. Each frame fires on its assigned model — same
    // 0-100 scoring rubric, same JSON output shape, different
    // professional lens AND different model family. Temperature 0.3
    // for deterministic scoring; random seed still injects stochastic
    // variance even at low temperature.
    const promises = [0, 1, 2].map(i => {
      const frame = NOISE_JUDGE_FRAMES[i];
      const framedPrompt = composeFramePrompt(frame.prompt);
      const modelName =
        juryModels[i] ?? juryModels[juryModels.length - 1] ?? 'gemini-3-flash-preview';
      return runModelCall(
        modelName,
        [
          framedPrompt + (state.blindMode ? BLIND_RETRO_DISCIPLINE : ''),
          `Decision Text to Rate:\n<input_text>\n${content}\n</input_text>${contextSuffix}`,
          `\n(Frame: ${frame.label}; Random Seed: ${Math.random()})`,
        ],
        // temperature is honoured on Gemini/Grok arms; runModelCall strips
        // it for anthropic/* (4.7+ models 400 on sampling params).
        { temperature: 0.3 }
      );
    });

    const settled = await Promise.allSettled(promises);

    let extractedBenchmarks: NoiseBenchmark[] = [];
    const scores = settled.map((r, i) => {
      if (r.status === 'rejected') {
        log.warn(
          `Noise judge failed (frame=${NOISE_JUDGE_FRAMES[i].id}, model=${juryModels[i] ?? 'fallback'}):`,
          r.reason instanceof Error ? r.reason.message : String(r.reason)
        );
        return 0;
      }
      const data = parseJSON(r.value.text);
      // Capture benchmarks from the first successful judge
      if (data?.benchmarks?.length > 0 && extractedBenchmarks.length === 0) {
        extractedBenchmarks = data.benchmarks;
      }
      return typeof data?.score === 'number' ? data.score : 0;
    });

    // Calculate Stats
    const validScores = scores.filter(s => typeof s === 'number' && isFinite(s) && s > 0);

    if (validScores.length < 2) {
      log.warn(
        `Noise scoring: only ${validScores.length}/3 judges returned valid scores — insufficient for reliable measurement`
      );
      const fallbackScore = validScores.length === 1 ? validScores[0] : 50;
      // Pad to 3 elements so downstream consumers get a consistent array shape
      const paddedScores = [...validScores, ...Array(3 - validScores.length).fill(fallbackScore)];
      return {
        noiseScores: paddedScores,
        noiseStats: { mean: Number(fallbackScore.toFixed(1)), stdDev: 0, variance: 0 },
        noiseBenchmarks: [],
      };
    }

    const mean =
      validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
    const variance =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validScores.length
        : 0;
    const stdDev = Math.sqrt(variance);

    // Dynamic Retrieval: Verify Benchmarks if found.
    // BLIND MODE: skipped — benchmark verification is a live Google search
    // on the document's own metrics (finds current-day data on a retro).
    let noiseBenchmarks = [];
    if (extractedBenchmarks.length > 0 && state.blindMode !== true) {
      log.info(`Verifying ${extractedBenchmarks.length} benchmarks with Google Search...`);
      const benchmarkResult = await withGeminiResilience(() =>
        withTimeout(
          getGroundedModel().generateContent([
            buildNoiseBenchmarkPrompt(sanitizeForPrompt(extractedBenchmarks, 'internal_metrics')),
            `Context: Global Market`,
          ]),
          30000
        )
      );

      const benchmarkText = benchmarkResult.response.text();
      noiseBenchmarks = parseJSON(benchmarkText) || [];

      // Add sources from metadata
      const searchSources = extractSearchSources(benchmarkResult.response);

      noiseBenchmarks = noiseBenchmarks.map((b: NoiseBenchmark, i: number) => ({
        ...b,
        // Guard against empty searchSources: modulo by 0 produces NaN.
        sourceUrl:
          b.sourceUrl ||
          (searchSources.length > 0 ? searchSources[i % searchSources.length] : undefined),
      }));
    }

    return {
      noiseScores: validScores,
      noiseStats: {
        mean: Number(mean.toFixed(1)),
        stdDev: Number(stdDev.toFixed(1)),
        variance: Number(variance.toFixed(1)),
      },
      noiseBenchmarks,
    };
  } catch (e) {
    log.error('Noise Judges failed', e);
    return { noiseScores: [], noiseStats: { mean: 0, stdDev: 0, variance: 0 } };
  }
}

/**
 * Deterministic PII pre-redaction — regex-based first pass before LLM anonymization.
 * Catches structured PII patterns (emails, SSNs, phone numbers, credit cards, IPs)
 * that LLMs sometimes miss. Defense-in-depth: regex for structure, LLM for context.
 */
function preRedactPII(text: string): { redacted: string; count: number } {
  let count = 0;
  let result = text;
  // Email addresses
  result = result.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    () => `[EMAIL_${++count}]`
  );
  // SSN (US format: XXX-XX-XXXX)
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, () => `[SSN_${++count}]`);
  // Credit card numbers (4 groups of 4 digits)
  result = result.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, () => `[CC_${++count}]`);
  // Phone numbers (US/UK/international formats)
  result = result.replace(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    () => `[PHONE_${++count}]`
  );
  // IP addresses
  result = result.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, () => `[IP_${++count}]`);
  return { redacted: result, count };
}

export async function gdprAnonymizerNode(state: AuditState): Promise<Partial<AuditState>> {
  // DISTILL-TO-REASONING (2026-06-30) — the first thing the pipeline does. For
  // a strategic memo (within budget) this is a no-op. For a real filing / CIM
  // (1.5M chars), it reduces the document to its most reasoning-dense content
  // (risk factors / MD&A / strategy) and sets aside the cover page, financial
  // tables, and exhibits — so the audit reads the REASONING, not the first 50K
  // of boilerplate. distillationNote is threaded to the summary so the user
  // sees what was set aside.
  const distillation = distillForAudit(state.originalContent || '', MAX_INPUT_CHARS);
  const content = distillation.content;
  const distillationNote = distillation.note;

  // Phase 1: Deterministic regex pre-redaction (catches structured PII —
  // emails / phones / IPs). Always runs, regardless of LLM outcome.
  const { redacted: preRedacted, count: preRedactCount } = preRedactPII(content || '');
  if (preRedactCount > 0) {
    log.info(`Pre-redacted ${preRedactCount} structured PII patterns before LLM anonymization`);
  }

  // Truncate to fit LLM context window — same limit as other nodes.
  // The regex pre-redaction already ran on the full text above.
  const truncated = truncateText(preRedacted);
  if (preRedacted.length > MAX_INPUT_CHARS) {
    log.info(
      `GDPR Anonymizer: truncated input from ${preRedacted.length} to ${MAX_INPUT_CHARS} chars`
    );
  }

  log.info('Running GDPR Anonymization...');

  try {
    // Phase 2: LLM-based contextual anonymization (catches names, addresses in narrative)
    const result = await withGeminiResilience(() =>
      withTimeout(
        getCheapModel().generateContent([
          GDPR_ANONYMIZER_PROMPT,
          `Text to anonymize:\n${truncated}`,
        ])
      )
    );

    const responseText = result.response?.text ? result.response.text() : '';
    const data = parseJSON(responseText);

    if (data?.structuredContent) {
      // SECURITY: Validate that the anonymizer actually redacted content.
      // If the LLM echoes back the original text without redacting, accept
      // the regex-pre-redaction (already ran above) — corporate / public
      // documents (SEC filings, analyst reports) often contain no PII
      // beyond what regex catches.
      const redactionCount = Array.isArray(data.redactions) ? data.redactions.length : 0;

      // TRUNCATION GUARD (2026-06-30): the anonymizer LLM sometimes returns
      // only the FIRST section of a long document — a 178K-char S-1 collapsed
      // to ~1K chars (just the cover page), so every downstream node audited
      // the cover and the DQI defaulted to 0. If the LLM's structuredContent
      // is materially shorter than the regex-redacted input it was handed, the
      // LLM truncated its output; prefer the full regex-redacted text (which
      // already has structured PII stripped — the same trade-off as the
      // LLM-failure fallback below). Legitimate anonymization is ~95-105% of
      // input length, so the 0.6 floor only fires on genuine truncation.
      const llmStructured = String(data.structuredContent);
      const llmTruncated = llmStructured.length < truncated.length * 0.6;
      const structuredContent = llmTruncated ? truncated : llmStructured;
      if (llmTruncated) {
        log.warn(
          `GDPR Anonymizer LLM truncated its output (${llmStructured.length} chars from a ${truncated.length}-char input) — using the full regex-redacted text so the audit sees the whole document, not just the cover page.`
        );
      } else {
        log.info(
          `GDPR Anonymization complete. LLM redacted ${redactionCount} PII instances (${preRedactCount} via regex).`
        );
      }
      return {
        anonymizationStatus: 'success',
        structuredContent,
        speakers: [],
        distillationNote,
      };
    }

    log.warn(
      'GDPR Anonymizer returned invalid response shape — falling back to regex-only redaction'
    );
  } catch (e) {
    log.warn(
      'GDPR Anonymizer LLM call failed — falling back to regex-only redaction:',
      e instanceof Error ? e.message : String(e)
    );
  }

  // Graceful degradation (fix locked 2026-05-01): when the LLM contextual
  // anonymization step fails (malformed JSON, timeout, content-policy block,
  // or transient network), DO NOT abort the entire audit. Fall through to
  // the regex pre-redacted content as the structured content.
  //
  // Trade-off: regex catches structured PII (emails / phones / IPs) but NOT
  // contextual names in narrative. For most strategic memos / SEC filings /
  // public corporate docs this is fine — the founder's airbnb test was an
  // S-1 filing with zero personal PII concerns; the prior fail-closed
  // behaviour produced "Analysis aborted: GDPR anonymization failed" with
  // grade F, which was an unusable UX for the dominant document class.
  //
  // For documents that DO contain unstructured contextual PII (e.g. an
  // internal HR memo), the regex pre-redaction still strips structured PII;
  // the LLM-grade contextual layer is the only one missing. Acceptable
  // residual risk, logged so frequent-failure-mode investigation is
  // possible. If this becomes a persistent problem, add a retry with a
  // tighter "return ONLY the redacted text, no JSON wrapper" prompt before
  // falling through.
  log.info(
    `GDPR Anonymization fallback path: using regex-only redaction (${preRedactCount} structured patterns redacted). LLM-grade contextual redaction unavailable for this audit.`
  );
  return {
    anonymizationStatus: 'success',
    structuredContent: preRedacted,
    speakers: [],
    distillationNote,
  };
}

// ============================================================
// VERIFICATION SUPER-NODE (factChecker + complianceMapper)
// ============================================================

export async function verificationNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  if (state.anonymizationStatus !== 'success') {
    log.warn('verificationNode: anonymization not confirmed — skipping to protect PII');
    return {
      factCheckResult: {
        status: 'error',
        score: 0,
        flags: ['Skipped: anonymization not confirmed'],
        verifications: [],
        searchSources: [],
      },
      compliance: {
        status: 'FAIL',
        riskScore: 100,
        summary: 'Skipped: anonymization not confirmed.',
        regulations: [],
        searchQueries: [],
      },
    };
  }

  // SECURITY: Never fall back to originalContent — only use anonymized content
  const content = truncateText(state.structuredContent || '');

  try {
    log.info('Running combined Fact Check + Compliance verification...');

    // Import super-prompt
    const { VERIFICATION_SUPER_PROMPT } = await import('./prompts');

    // Execute RAG query to pull internal company wiki/knowledge context
    let internalKnowledgeContext = '';
    if (state.userId) {
      try {
        log.info('Executing RAG query for internal knowledge...');
        const similarDocs = await searchSimilarDocuments(content, state.userId, 3);
        if (similarDocs && similarDocs.length > 0) {
          // SECURITY: Sanitize RAG results to prevent prompt injection from stored documents
          internalKnowledgeContext =
            `\n\nINTERNAL COMPANY KNOWLEDGE (cross-reference claims against these precedents):\n` +
            sanitizeForPrompt(
              similarDocs.map((doc, i) => ({ document: i + 1, excerpt: doc.content })),
              'internal_knowledge'
            );
        }
      } catch (ragError) {
        log.warn(
          `Failed to execute RAG query: ${ragError instanceof Error ? ragError.message : String(ragError)}`
        );
      }
    }

    // Inject news context for better fact-checking
    const newsContext =
      state.intelligenceContext?.news
        ?.slice(0, 5)
        .map(n => `- [${n.source}] ${n.title}`)
        .join('\n') || '';
    const verificationIntelPrompt = newsContext
      ? `\n\nRECENT RELEVANT NEWS (cross-reference claims against these):\n${sanitizeForPrompt(newsContext, 'recent_news')}`
      : '';

    // Inject cross-document context for cross-referencing
    const crossDocBlock = state.crossDocContext
      ? formatCrossDocContextForPrompt(state.crossDocContext)
      : '';
    const crossDocVerifyPrompt = crossDocBlock
      ? `\n\nCROSS-DOCUMENT CONTEXT (related documents — cross-reference claims):\n${sanitizeForPrompt(crossDocBlock, 'cross_doc_context')}`
      : '';

    // Synthesize additional context
    const additionalContext = `${internalKnowledgeContext}${verificationIntelPrompt}${crossDocVerifyPrompt}`;

    // Single LLM call for both fact-check and compliance. BLIND MODE:
    // ungrounded + the discipline block — external claim verification on a
    // retro finds the outcome; the compliance half (document-vs-regulation
    // reasoning) and internal-consistency checks remain valid ungrounded.
    // Ungrounded verifications honestly come back UNVERIFIABLE.
    const verBlind = state.blindMode === true;
    const verModel = verBlind ? getUngroundedRelaxedModel() : getGroundedModel();
    const result = await withGeminiResilience(
      () =>
        withTimeout(
          verModel.generateContent([
            VERIFICATION_SUPER_PROMPT + (verBlind ? BLIND_RETRO_DISCIPLINE : ''),
            `Document to analyze:\n<input_text>\n${content}\n</input_text>${additionalContext}`,
          ]),
          90000 // 90 second timeout for combined verification
        ),
      2, // 2 retries
      1000,
      10000
    );

    const responseText = result.response?.text ? result.response.text() : '';
    const data = parseJSON(responseText);

    // Extract fact-check result
    const factCheckData = data?.factCheck;
    const companyName = sanitizeCompanyName(factCheckData?.primaryTopic);
    if (companyName) log.info(`Identified primary topic: ${companyName}`);

    // Fetch financial data if needed (preserves Finnhub integration)
    const dataRequests = factCheckData?.dataRequests || [];
    let fetchedData: Record<string, unknown> = {};
    // BLIND MODE: skip the Finnhub fetch — live financial data (current
    // prices/fundamentals) postdates a retro's filing date.
    if (dataRequests.length > 0 && !verBlind) {
      const validRequests: DataRequest[] = dataRequests
        .filter(
          (r: { ticker?: unknown }) =>
            r && r.ticker && typeof r.ticker === 'string' && isValidTicker(r.ticker)
        )
        .map((r: { ticker: string; dataType: string; reason: string; claimToVerify: string }) => ({
          ticker: r.ticker.toUpperCase(),
          dataType: r.dataType,
          reason: r.reason,
          claimToVerify: r.claimToVerify,
        }));

      const uniqueRequests = Array.from(
        new Map(validRequests.map(item => [item.ticker, item])).values()
      );
      if (uniqueRequests.length > 0) {
        fetchedData = await executeDataRequests(uniqueRequests);
      }
    }

    // If financial data was fetched, do a verification pass
    let enrichedFactCheck;
    if (Object.keys(fetchedData).length > 0 && factCheckData?.verifications?.length > 0) {
      log.info('Refining fact-check with Finnhub financial data...');
      const refinementResult = await withGeminiResilience(() =>
        withTimeout(
          getGroundedModel().generateContent([
            buildFactCheckRefinementPrompt(
              sanitizeForPrompt(factCheckData.verifications, 'verifications'),
              sanitizeForPrompt(fetchedData, 'financial_data')
            ),
            `Topic: ${sanitizeForPrompt(companyName, 'topic')}`,
          ]),
          45000
        )
      );

      const refinedText = refinementResult.response?.text ? refinementResult.response.text() : '';
      const refined = parseJSON(refinedText);

      if (refined?.verifications) {
        const searchSources = extractSearchSources(refinementResult.response);
        enrichedFactCheck = {
          status: 'success' as const,
          score:
            typeof refined.score === 'number'
              ? refined.score
              : typeof factCheckData.score === 'number'
                ? factCheckData.score
                : 50,
          summary: factCheckData.summary || 'Verification completed',
          verifications: refined.verifications.map((v: { sourceUrl?: string }, i: number) => ({
            ...v,
            sourceUrl:
              v.sourceUrl ||
              (searchSources.length > 0 ? searchSources[i % searchSources.length] : ''),
          })),
          primaryTopic: companyName,
          flags: [],
          searchSources,
        };
      }
    }

    // Fall back to the initial fact-check if no refinement was needed
    if (!enrichedFactCheck) {
      const searchSources = extractSearchSources(result.response);
      enrichedFactCheck = {
        status: 'success' as const,
        score: typeof factCheckData?.score === 'number' ? factCheckData.score : 50,
        summary: factCheckData?.summary || 'Verification completed',
        verifications: (factCheckData?.verifications || []).map(
          (v: { sourceUrl?: string }, i: number) => ({
            ...v,
            sourceUrl:
              v.sourceUrl ||
              (searchSources.length > 0 ? searchSources[i % searchSources.length] : ''),
          })
        ),
        primaryTopic: companyName,
        flags: [],
        searchSources,
      };
    }

    // Extract compliance result
    const complianceData = data?.compliance || {
      status: 'WARN',
      riskScore: 50,
      summary: 'Compliance data unavailable from combined analysis.',
      regulations: [],
      searchQueries: [],
    };

    // Enrich with structured regulatory graph assessment (non-blocking)
    try {
      const { assessCompliance } = await import('@/lib/compliance/regulatory-graph');
      const biasesForCompliance = (state.biasAnalysis || []).map(
        (b: { biasType?: string; severity?: string; confidence?: number }) => ({
          type: (b.biasType || '').toLowerCase().replace(/\s+/g, '_'),
          severity: (b.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          confidence: b.confidence || 0.5,
        })
      );

      if (biasesForCompliance.length > 0) {
        const regulatoryAssessments = assessCompliance(biasesForCompliance);
        if (regulatoryAssessments.length > 0) {
          // Merge regulatory graph triggered provisions into compliance data
          const graphRegulations = regulatoryAssessments.flatMap(a =>
            a.triggeredProvisions.map(tp => ({
              framework: a.framework.name,
              provision: tp.provision.title,
              riskWeight: tp.aggregateRiskWeight,
              mechanism: tp.explanation,
              biasTypes: tp.triggeringBiases,
            }))
          );

          complianceData.regulatoryGraph = {
            frameworksChecked: regulatoryAssessments.map(a => a.framework.name),
            totalFindings: graphRegulations.length,
            highestRisk: regulatoryAssessments.reduce(
              (max: number, a) => Math.max(max, a.overallRiskScore),
              0
            ),
            findings: graphRegulations.slice(0, 20), // top 20 findings
          };

          // Update risk score to incorporate regulatory graph
          const graphRiskScore = complianceData.regulatoryGraph.highestRisk;
          if (graphRiskScore > complianceData.riskScore) {
            complianceData.riskScore = Math.round((complianceData.riskScore + graphRiskScore) / 2);
          }

          log.info(
            `Regulatory graph: ${regulatoryAssessments.length} frameworks, ${graphRegulations.length} findings`
          );
        }
      }
    } catch (regError) {
      log.debug(
        'Regulatory graph enrichment unavailable: ' +
          (regError instanceof Error ? regError.message : String(regError))
      );
    }

    log.info(
      `Verification complete. Fact score: ${enrichedFactCheck.score}, Compliance: ${complianceData.status}`
    );

    return {
      factCheckResult: enrichedFactCheck,
      compliance: complianceData,
    };
  } catch (e) {
    log.error('Verification Node failed:', e instanceof Error ? e.message : String(e));
    return {
      factCheckResult: { status: 'error', score: 0, flags: ['Error: Verification Unavailable'] },
      compliance: {
        status: 'WARN',
        riskScore: 50,
        summary: 'Compliance check failed due to technical error.',
        regulations: [],
        searchQueries: [],
      },
      // Degraded-node honesty ledger (2026-07-02) — see biasDetective catch.
      degradedNodes: ['verification'],
    };
  }
}

// ============================================================
// DEEP ANALYSIS SUPER-NODE (linguistic + strategic + cognitiveDiversity)
// ============================================================

export async function deepAnalysisNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  if (state.anonymizationStatus !== 'success') {
    log.warn('deepAnalysisNode: anonymization not confirmed — skipping to protect PII');
    return {
      sentimentAnalysis: { score: 0, label: 'Neutral' },
      logicalAnalysis: { score: 100, fallacies: [] },
      swotAnalysis: undefined,
      preMortem: undefined,
      cognitiveAnalysis: undefined,
    };
  }

  // SECURITY: Never fall back to originalContent — only use anonymized content
  const content = truncateText(state.structuredContent || '');

  try {
    log.info(
      'Running deep multi-dimensional analysis (sentiment, logic, SWOT, cognitive diversity)...'
    );

    const { DEEP_ANALYSIS_SUPER_PROMPT } = await import('./prompts');

    // Inject case studies and research for better strategic analysis
    const caseContext =
      state.intelligenceContext?.caseStudies
        ?.slice(0, 3)
        .map(
          c =>
            `- ${c.company} (${c.year ?? 'n/a'}): ${c.outcome}. Biases: ${c.biasTypes.join(', ')}. Lesson: ${c.lessons.slice(0, 150)}`
        )
        .join('\n') || '';
    const deepIntelPrompt = caseContext
      ? `\n\nHISTORICAL CASE STUDIES (use as reference for SWOT, pre-mortem, and cognitive diversity):\n${sanitizeForPrompt(caseContext, 'case_studies')}`
      : '';

    // Inject cross-document context for strategic analysis
    const crossDocBlock = state.crossDocContext
      ? formatCrossDocContextForPrompt(state.crossDocContext)
      : '';
    const crossDocDeepPrompt = crossDocBlock
      ? `\n\nCROSS-DOCUMENT CONTEXT (related documents — use for comparative strategic analysis):\n${sanitizeForPrompt(crossDocBlock, 'cross_doc_context')}`
      : '';

    // Frontier tier (2026-07-02): the strategic deep-dive (SWOT, pre-mortem,
    // counter-arguments) is reasoning-dominant — Sonnet 5 by default.
    // Legacy grounded Gemini fallback keeps standard safety + live search.
    // On the frontier path there is no Gemini grounding metadata, so
    // counter-argument sourceUrls stay empty (the field is optional).
    const frontierDeepModel = resolveFrontierModel('deepAnalysis');
    let responseText: string;
    let searchSources: string[] = [];
    const deepBlindBlock = state.blindMode ? BLIND_RETRO_DISCIPLINE : '';
    // Structural-conditions injection (2026-07-02) — the red team + pre-mortem
    // interrogate the detected company-enders directly. '' when none detected.
    const deepStructuralBlock = buildStrategicConditionsPromptBlock(state.structuredContent || '');
    if (frontierDeepModel) {
      const frontier = await runModelCall(frontierDeepModel, [
        DEEP_ANALYSIS_SUPER_PROMPT + deepStructuralBlock + deepBlindBlock,
        `Text to analyze:\n<input_text>\n${content}\n</input_text>${deepIntelPrompt}${crossDocDeepPrompt}`,
      ]);
      responseText = frontier.text;
    } else {
      // Deep analysis (sentiment, logic, SWOT) does not need relaxed safety
      // settings — use standard safety to keep content moderation active.
      // BLIND MODE: ungrounded variant (no live search on a retro).
      const deepModel = state.blindMode
        ? getUngroundedStandardModel()
        : getStandardSafetyGroundedModel();
      const result = await withGeminiResilience(
        () =>
          withTimeout(
            deepModel.generateContent([
              DEEP_ANALYSIS_SUPER_PROMPT + deepStructuralBlock + deepBlindBlock,
              `Text to analyze:\n<input_text>\n${content}\n</input_text>${deepIntelPrompt}${crossDocDeepPrompt}`,
            ]),
            90000 // 90 second timeout
          ),
        2,
        1000,
        10000
      );
      responseText = result.response?.text ? result.response.text() : '';
      // Extract search sources for counter-arguments (Gemini grounding metadata)
      searchSources = extractSearchSources(result.response);
    }
    const data = parseJSON(responseText);

    // Enrich counter-arguments with search sources
    const cognitiveData = data?.cognitiveAnalysis;
    if (cognitiveData?.counterArguments) {
      cognitiveData.counterArguments = cognitiveData.counterArguments.map(
        (arg: { sourceUrl?: string }, index: number) => ({
          ...arg,
          sourceUrl:
            arg.sourceUrl ||
            (searchSources.length > 0 ? searchSources[index % searchSources.length] : undefined),
        })
      );
    }

    log.info(
      `Deep analysis complete. Sentiment: ${data?.sentiment?.label || 'N/A'}, Logic score: ${data?.logicalAnalysis?.score ?? 'N/A'}, BlindSpotGap: ${cognitiveData?.blindSpotGap ?? 'N/A'}`
    );

    // Extract narrative pre-mortem (Klein RPD war stories) from the preMortem output
    const preMortemData = data?.preMortem;
    const narrativePreMortem =
      preMortemData?.warStories && preMortemData.warStories.length > 0
        ? {
            failureScenarios: preMortemData.failureScenarios || [],
            preventiveMeasures: preMortemData.preventiveMeasures || [],
            warStories: preMortemData.warStories,
          }
        : undefined;

    return {
      sentimentAnalysis: data?.sentiment ?? { score: 0, label: 'Neutral' },
      logicalAnalysis: data?.logicalAnalysis ?? { score: 100, fallacies: [] },
      swotAnalysis: data?.swot,
      preMortem: preMortemData,
      cognitiveAnalysis: cognitiveData,
      narrativePreMortem,
    };
  } catch (e) {
    log.error('Deep Analysis Node failed:', e instanceof Error ? e.message : String(e));
    return {
      sentimentAnalysis: { score: 0, label: 'Neutral' },
      logicalAnalysis: { score: 100, fallacies: [] },
      swotAnalysis: undefined,
      preMortem: undefined,
      cognitiveAnalysis: undefined,
      narrativePreMortem: undefined,
    };
  }
}

// ============================================================
// SIMULATION SUPER-NODE (decisionTwin + memoryRecall)
// ============================================================

export async function simulationNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  if (state.anonymizationStatus !== 'success') {
    log.warn('simulationNode: anonymization not confirmed — skipping to protect PII');
    return { simulation: undefined, institutionalMemory: undefined };
  }

  // SECURITY: Never fall back to originalContent — only use anonymized content
  const content = truncateText(state.structuredContent || '');

  try {
    log.info('Running boardroom simulation with institutional memory...');

    const userId = state.userId || 'system';

    // Step 1: Fetch custom org personas (if user has configured them)
    let customPersonas: Array<{
      name: string;
      role: string;
      focus: string;
      values: string;
      bias: string;
      riskTolerance: string;
    }> = [];

    try {
      const dbPersonas = await prisma.boardroomPersona.findMany({
        where: {
          OR: [{ userId }, { orgId: userId }],
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        take: 5,
        select: {
          name: true,
          role: true,
          focus: true,
          values: true,
          bias: true,
          riskTolerance: true,
        },
      });

      if (dbPersonas.length > 0) {
        customPersonas = dbPersonas;
        log.info(`Using ${customPersonas.length} custom boardroom personas for simulation`);
      } else {
        log.info('No custom personas found — AI will generate document-specific personas');
      }
    } catch (personaErr) {
      // Schema drift — BoardroomPersona table may not exist yet
      const code = (personaErr as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('BoardroomPersona schema drift — AI will generate personas');
      } else {
        log.warn(
          'Custom persona lookup failed — AI will generate personas:',
          personaErr instanceof Error ? personaErr.message : String(personaErr)
        );
      }
    }

    // Step 2: RAG vector search WITH outcome data (self-improving loop)
    let similarDocs: unknown[] = [];
    let hasOutcomeData = false;

    try {
      const docsWithOutcomes = await searchSimilarWithOutcomes(content, userId, 3);
      similarDocs = docsWithOutcomes;
      hasOutcomeData = docsWithOutcomes.some(d => d.outcome != null);

      if (hasOutcomeData) {
        const outcomeCount = docsWithOutcomes.filter(d => d.outcome).length;
        log.info(
          `Found ${docsWithOutcomes.length} similar cases, ${outcomeCount} with verified outcomes (feedback loop active)`
        );
      } else {
        log.info(`Found ${docsWithOutcomes.length} similar past cases (no outcome data yet)`);
      }
    } catch (ragError) {
      log.warn(
        'RAG search failed, proceeding without institutional memory:',
        ragError instanceof Error ? ragError.message : String(ragError)
      );
    }

    // Step 3: Load causal driver rankings (Moat 1: Causal AI Layer)
    // Uses org-specific causal weights (from outcome data) to tell twins
    // which biases ACTUALLY matter for this org. Falls back to userId-based
    // lookup if orgId is unavailable.
    let causalDriverBrief = '';
    try {
      const { computeOrgCausalWeights, getCausalInsights, doCalculus } =
        await import('@/lib/learning/causal-learning');
      const effectiveOrgId = state.orgId || userId;
      const causalWeights = await computeOrgCausalWeights(effectiveOrgId);

      if (causalWeights.length > 0) {
        const topDangers = causalWeights
          .filter(w => w.dangerMultiplier >= 1.3 && w.sampleSize >= 3)
          .slice(0, 5);
        const topSafe = causalWeights
          .filter(w => w.dangerMultiplier <= 0.7 && w.sampleSize >= 3)
          .slice(-3);

        if (topDangers.length > 0 || topSafe.length > 0) {
          const dangerLines = topDangers.map(
            w =>
              `- ${w.biasType.replace(/_/g, ' ')}: ${w.dangerMultiplier}x danger (${w.failureCount} failures in ${w.sampleSize} decisions)`
          );
          const safeLines = topSafe.map(
            w =>
              `- ${w.biasType.replace(/_/g, ' ')}: mostly benign (${w.failureCount} failures in ${w.sampleSize} decisions)`
          );

          causalDriverBrief =
            "\n\nCAUSAL INTELLIGENCE (learned from this organization's actual decision outcomes):\n" +
            (dangerLines.length > 0
              ? 'HIGH-DANGER biases (focus your deliberation here):\n' +
                dangerLines.join('\n') +
                '\n'
              : '') +
            (safeLines.length > 0
              ? 'LOWER-RISK biases (de-prioritize in deliberation):\n' + safeLines.join('\n')
              : '');

          // If we have enough dangerous biases, run do-calculus to show twins
          // the projected impact of eliminating them
          if (topDangers.length >= 2) {
            try {
              const interventionResult = await doCalculus(effectiveOrgId, {
                remove: topDangers.slice(0, 3).map(w => w.biasType),
              });
              if (interventionResult && interventionResult.improvement > 0) {
                causalDriverBrief +=
                  `\n\nCAUSAL INTERVENTION ESTIMATE: Removing the top ${Math.min(3, topDangers.length)} dangerous biases would improve decision success rate by ~${Math.round(interventionResult.improvement * 100)}% ` +
                  `(from ${Math.round(interventionResult.baselineSuccessProbability * 100)}% → ${Math.round(interventionResult.successProbability * 100)}%), ` +
                  `confidence: ${Math.round(interventionResult.confidence * 100)}% (${interventionResult.method === 'scm_do_calculus' ? 'causal DAG' : 'correlation'}).`;
              }
            } catch {
              // do-calculus is best-effort — don't fail simulation for it
            }
          }

          // Add high-level causal insights
          const totalOutcomes = causalWeights.reduce((max, w) => Math.max(max, w.sampleSize), 0);
          const insights = getCausalInsights(causalWeights, totalOutcomes);
          const actionableInsights = insights.filter(
            i => (i.type === 'danger' || i.type === 'twin') && i.confidence >= 0.5
          );
          if (actionableInsights.length > 0) {
            causalDriverBrief +=
              '\n\nKEY CAUSAL INSIGHTS:\n' +
              actionableInsights.map(i => `- [${i.type.toUpperCase()}] ${i.message}`).join('\n');
          }

          log.info(
            `Causal drivers injected into simulation: ${topDangers.length} dangerous, ${topSafe.length} benign (org: ${effectiveOrgId})`
          );
        }
      }
    } catch {
      log.debug('Causal drivers unavailable for simulation — proceeding without');
    }

    // Step 4: Build dynamic prompt with custom personas + outcome awareness
    // Corporate Strategy / M&A Vertical: Use executive personas when no custom personas
    // are configured and the document is strategy/M&A-related
    if (customPersonas.length === 0 && isInvestmentDocument(state.documentType)) {
      customPersonas = PE_BOARDROOM_PERSONAS;
      log.info('Using corporate executive personas for strategy/M&A document simulation');
    }

    const { buildSimulationPrompt } = await import('./prompts');

    const dynamicPrompt = buildSimulationPrompt({
      customPersonas: customPersonas.length > 0 ? customPersonas : undefined,
      hasOutcomeData,
    });

    // Build intelligence brief for decision twins
    const intelBrief = state.intelligenceContext
      ? formatContextForPrompt(state.intelligenceContext)
      : '';
    const intelBlock =
      intelBrief && intelBrief !== 'No external intelligence context available.'
        ? `\n\nExternal Intelligence Brief:\n${sanitizeForPrompt(intelBrief, 'intelligence_brief')}`
        : '';

    // Cross-document context for simulation
    const crossDocSimBlock = state.crossDocContext
      ? formatCrossDocContextForPrompt(state.crossDocContext)
      : '';
    const crossDocSimPrompt = crossDocSimBlock
      ? `\n\nCROSS-DOCUMENT CONTEXT (related deals from portfolio — use for historical simulation grounding):\n${sanitizeForPrompt(crossDocSimBlock, 'cross_doc_context')}`
      : '';

    // Frontier tier (2026-07-02): boardroom persona objections are pure
    // reasoning/roleplay — Sonnet 5 by default; legacy grounded Gemini fallback.
    const frontierSimModel = resolveFrontierModel('simulation');
    const simPrompts = [
      dynamicPrompt + (state.blindMode ? BLIND_RETRO_DISCIPLINE : ''),
      `Proposal to Vote On:\n<input_text>\n${content}\n</input_text>`,
      `Similar Past Cases Found (via Vector Search):\n${sanitizeForPrompt(similarDocs, 'past_cases')}${intelBlock}${causalDriverBrief}${crossDocSimPrompt}`,
    ];
    let text: string;
    if (frontierSimModel) {
      const frontier = await runModelCall(frontierSimModel, simPrompts);
      text = frontier.text;
    } else {
      // BLIND MODE: ungrounded variant (no live search on a retro).
      const simModel = state.blindMode
        ? getUngroundedStandardModel()
        : getStandardSafetyGroundedModel();
      const result = await withGeminiResilience(
        () => withTimeout(simModel.generateContent(simPrompts), 90000),
        2,
        1000,
        10000
      );
      text = result.response?.text ? result.response.text() : '';
    }
    const data = parseJSON(text);

    log.info(
      `Simulation complete. Verdict: ${data?.simulation?.overallVerdict || 'N/A'}, Memory recall: ${data?.institutionalMemory?.recallScore ?? 'N/A'}, Outcome-informed: ${hasOutcomeData}`
    );

    return {
      simulation: data?.simulation,
      institutionalMemory: data?.institutionalMemory,
    };
  } catch (e) {
    log.error('Simulation Node failed:', e instanceof Error ? e.message : String(e));
    return {
      simulation: undefined,
      institutionalMemory: undefined,
    };
  }
}

// ============================================================
// RPD RECOGNITION NODE (Klein Pattern Recognition)
// ============================================================

export async function rpdRecognitionNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: Defense-in-depth — abort if anonymization didn't succeed.
  if (state.anonymizationStatus !== 'success') {
    log.warn('rpdRecognitionNode: anonymization not confirmed — skipping to protect PII');
    return { recognitionCues: undefined };
  }

  const content = truncateText(state.structuredContent || '');

  try {
    log.info('Running Klein RPD pattern recognition analysis...');

    const userId = state.userId || 'system';

    // Step 1: RAG vector search WITH outcome data for pattern matching
    let similarDocs: Awaited<ReturnType<typeof searchSimilarWithOutcomes>> = [];
    let hasOutcomeData = false;

    try {
      const docsWithOutcomes = await searchSimilarWithOutcomes(content, userId, 7);
      similarDocs = docsWithOutcomes;
      hasOutcomeData = docsWithOutcomes.some(d => d.outcome != null);

      log.info(
        `RPD: Found ${docsWithOutcomes.length} similar historical cases, ` +
          `${docsWithOutcomes.filter(d => d.outcome).length} with verified outcomes`
      );
    } catch (ragError) {
      log.warn(
        'RPD: RAG search failed, proceeding without historical cases:',
        ragError instanceof Error ? ragError.message : String(ragError)
      );
    }

    // Step 2: Build context from similar cases
    const historicalContext = similarDocs
      .map((doc, i) => {
        const outcomeStr = doc.outcome
          ? `\n  Outcome: ${doc.outcome.result}${doc.outcome.lessonsLearned ? ` — ${doc.outcome.lessonsLearned}` : ''}`
          : '';
        const biasStr =
          doc.biases.length > 0 ? `\n  Biases detected: ${doc.biases.join(', ')}` : '';
        return `Case ${i + 1}: "${doc.filename}" (similarity: ${(doc.similarity * 100).toFixed(0)}%)${biasStr}${outcomeStr}\n  Content excerpt: ${doc.content.slice(0, 500)}`;
      })
      .join('\n\n');

    // Step 3: Build intelligence context if available
    const intelBrief = state.intelligenceContext
      ? formatContextForPrompt(state.intelligenceContext)
      : '';
    const intelBlock =
      intelBrief && intelBrief !== 'No external intelligence context available.'
        ? `\n\nExternal Intelligence Brief:\n${intelBrief.slice(0, 2000)}`
        : '';

    // Step 4: Generate recognition cues via LLM
    const prompt = buildRpdRecognitionPrompt({
      hasOutcomeData,
      similarDealCount: similarDocs.length,
    });

    // Frontier tier (2026-07-02): Klein recognition cues are pattern-matching
    // over injected historical cases — Sonnet 5 by default; legacy Gemini fallback.
    const frontierRpdModel = resolveFrontierModel('rpdRecognition');
    const rpdPrompts = [
      prompt + (state.blindMode ? BLIND_RETRO_DISCIPLINE : ''),
      `Current Document Under Analysis:\n<input_text>\n${content}\n</input_text>`,
      `Historical Cases Found (via Vector Search):\n${historicalContext || 'No similar historical cases found.'}${intelBlock}`,
    ];
    let text: string;
    if (frontierRpdModel) {
      const frontier = await runModelCall(frontierRpdModel, rpdPrompts);
      text = frontier.text;
    } else {
      // BLIND MODE: ungrounded variant (no live search on a retro).
      const rpdModel = state.blindMode
        ? getUngroundedStandardModel()
        : getStandardSafetyGroundedModel();
      const result = await withGeminiResilience(
        () => withTimeout(rpdModel.generateContent(rpdPrompts), 90000),
        2,
        1000,
        10000
      );
      text = result.response?.text ? result.response.text() : '';
    }
    const data = parseJSON(text);

    const recognitionCues = data?.recognitionCues as RecognitionCuesResult | undefined;

    if (recognitionCues) {
      log.info(
        `RPD: Pattern recognition complete. ${recognitionCues.cues?.length || 0} cues identified, ` +
          `confidence: ${recognitionCues.confidenceLevel ?? 'N/A'}`
      );
    } else {
      log.warn('RPD: No recognition cues returned from LLM');
    }

    return { recognitionCues };
  } catch (e) {
    log.error('RPD Recognition Node failed:', e instanceof Error ? e.message : String(e));
    return { recognitionCues: undefined };
  }
}

// ============================================================
// FORGOTTEN QUESTIONS NODE — Unknown-Unknowns Surface
// ============================================================
// Compares the memo against its reference class of historical analogs
// and surfaces the critical questions the memo never asks but its
// closest analogs had to answer. This is the most legible
// "unknown unknowns" feature in the product.
export async function forgottenQuestionsNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: anonymization gate — same pattern as other content-touching nodes
  if (state.anonymizationStatus !== 'success') {
    log.warn('forgottenQuestionsNode: anonymization not confirmed — skipping');
    return { forgottenQuestions: undefined };
  }

  const content = truncateText(state.structuredContent || '');
  if (!content) {
    return { forgottenQuestions: undefined };
  }

  try {
    log.info('Running Forgotten Questions analysis...');

    // Step 1: Assemble reference class from curated case studies
    // Deferred import so cold analysis paths don't pay the cost.
    const { computeReferenceClass } = await import('../data/reference-class-forecasting');

    // Look up deal context if we have a dealId — mirrors the rpd node pattern.
    let sector: string | null = null;
    let ticketSize: number | null = null;
    if (state.containerId) {
      try {
        const container = await prisma.decisionContainer.findUnique({
          where: { id: state.containerId },
          select: { sector: true, ticketSize: true },
        });
        sector = container?.sector ?? null;
        ticketSize = container?.ticketSize != null ? Number(container.ticketSize) : null;
      } catch {
        // Non-fatal — fall back to global reference class
      }
    }

    const refClass = computeReferenceClass({ sector, ticketSize });

    // Use the most representative 6 analogs (3 failures + 3 successes when available)
    const analogs = [...refClass.topFailures.slice(0, 3), ...refClass.topSuccesses.slice(0, 3)];

    if (analogs.length === 0) {
      log.warn('ForgottenQuestions: no analogs in reference class');
      return { forgottenQuestions: undefined };
    }

    const analogSummaries = analogs
      .map((c, i) => {
        const lessons = (c.lessonsLearned || []).slice(0, 2).join(' ');
        const primary = c.primaryBias ? ` (primary bias: ${c.primaryBias})` : '';
        return `Analog ${i + 1}: ${c.company} — ${c.title} [${c.outcome}]${primary}
  Context: ${c.decisionContext.slice(0, 260)}
  Key lesson: ${lessons.slice(0, 260)}`;
      })
      .join('\n\n');

    const prompt = buildForgottenQuestionsPrompt({
      referenceClassLabel: refClass.label,
      analogSummaries,
      hasDealContext: sector != null || ticketSize != null,
    });

    // Frontier tier (2026-07-02): the Forgotten Questions are the audit's
    // deepest buyer-facing reasoning (the Fermi retro's real hits — the
    // AIG-collateral / Lehman-veto / Amazon-exit class of "I didn't think
    // to ask that"). Opus 4.8 by default; legacy grounded Gemini fallback.
    const frontierFqModel = resolveFrontierModel('forgottenQuestions');
    const fqBlindBlock = state.blindMode ? BLIND_RETRO_DISCIPLINE : '';
    // Structural-conditions injection (2026-07-02): the deterministic
    // company-ender detectors point the audit's strongest generative module
    // at exactly the concentration / valuation / key-person conditions.
    // Empty string when none detected — prompt byte-identical to before.
    const fqStructuralBlock = buildStrategicConditionsPromptBlock(state.structuredContent || '');
    let text: string;
    if (frontierFqModel) {
      const frontier = await runModelCall(frontierFqModel, [
        prompt + fqStructuralBlock + fqBlindBlock,
        `Memo under review:\n<memo>\n${content}\n</memo>`,
      ]);
      text = frontier.text;
    } else {
      // BLIND MODE: ungrounded variant (no live search on a retro).
      const fqModel = state.blindMode
        ? getUngroundedStandardModel()
        : getStandardSafetyGroundedModel();
      const result = await withGeminiResilience(
        () =>
          withTimeout(
            fqModel.generateContent([
              prompt + fqStructuralBlock + fqBlindBlock,
              `Memo under review:\n<memo>\n${content}\n</memo>`,
            ]),
            75000
          ),
        2,
        1000,
        10000
      );
      text = result.response?.text ? result.response.text() : '';
    }
    const data = parseJSON(text);
    const parsed = data?.forgottenQuestions as ForgottenQuestionsResult | undefined;

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      log.warn('ForgottenQuestions: LLM returned no grounded questions');
      return { forgottenQuestions: undefined };
    }

    // Clamp to the [3, 7] contract and normalise severities.
    const questions = parsed.questions.slice(0, 7).map(q => ({
      question: String(q.question || '').slice(0, 500),
      whyItMatters: String(q.whyItMatters || '').slice(0, 500),
      biasGuarded: String(q.biasGuarded || '').slice(0, 80),
      analogCompany: q.analogCompany ? String(q.analogCompany).slice(0, 120) : undefined,
      severity: (['low', 'medium', 'high', 'critical'] as const).includes(
        (q.severity as 'low' | 'medium' | 'high' | 'critical') ?? 'medium'
      )
        ? q.severity
        : ('medium' as const),
    }));

    const forgottenQuestions: ForgottenQuestionsResult = {
      questions,
      headline: parsed.headline ? String(parsed.headline).slice(0, 300) : undefined,
      analogsUsed: Array.isArray(parsed.analogsUsed)
        ? parsed.analogsUsed.map(String).slice(0, 10)
        : analogs.map(a => a.company).slice(0, 10),
      generatedAt: new Date().toISOString(),
    };

    log.info(
      `ForgottenQuestions: surfaced ${questions.length} gaps from ${analogs.length} analogs (${refClass.matchedBy})`
    );

    return { forgottenQuestions };
  } catch (e) {
    log.error('Forgotten Questions node failed:', e instanceof Error ? e.message : String(e));
    return { forgottenQuestions: undefined };
  }
}

// ============================================================
// META-JUDGE (Adversarial Debate Protocol)
// ============================================================

export async function metaJudgeNode(state: AuditState): Promise<Partial<AuditState>> {
  const content = truncateText(state.structuredContent || '');

  try {
    log.info('Running Adversarial Meta-Judge Debate Protocol...');

    const factVerifications = state.factCheckResult?.verifications || [];
    const failureScenarios = state.preMortem?.failureScenarios || [];
    const biasFindings = state.biasAnalysis || [];

    // If nothing to debate, return quickly
    if (failureScenarios.length === 0 && biasFindings.length === 0) {
      return {
        metaVerdict:
          'No significant adversarial points detected; proposal cleared baseline checks.',
      };
    }

    const metaJudgePrompt = buildMetaJudgePrompt(
      content,
      sanitizeForPrompt(failureScenarios, 'failure_scenarios'),
      sanitizeForPrompt({ factVerifications, biasFindings }, 'objective_findings')
    );

    // Frontier tier (2026-07-02): the final verdict is the highest-leverage
    // single call in the pipeline — Opus 4.8 by default. Prose output, so
    // the gateway path is parse-risk-free (consumer reads text raw).
    // Legacy fallback: grounded Gemini 3 Flash (jsonResponse:false; 2.5-pro retired 2026-07-02).
    const frontierMetaModel = resolveFrontierModel('metaJudge');
    // Structural-conditions injection (2026-07-02) — the final verdict must
    // weigh the detected company-enders explicitly, not just the upstream
    // module outputs. '' when none detected (prompt unchanged).
    const metaStructuralBlock = buildStrategicConditionsPromptBlock(state.structuredContent || '');
    const metaBlindPrompt = state.blindMode
      ? metaJudgePrompt + metaStructuralBlock + BLIND_RETRO_DISCIPLINE
      : metaJudgePrompt + metaStructuralBlock;
    let verdict: string;
    if (frontierMetaModel) {
      const frontier = await runModelCall(frontierMetaModel, [metaBlindPrompt], {
        jsonResponse: false,
      });
      verdict = frontier.text || 'Meta-Verdict could not be generated.';
    } else {
      // BLIND MODE: ungrounded pro variant (prose output, no live search).
      const metaModel = state.blindMode
        ? createModelInstance({
            safetyLevel: 'standard',
            modelName: getOptionalEnvVar('GEMINI_MODEL_PRO', 'gemini-2.5-pro'),
            jsonResponse: false,
          })
        : getProStandardSafetyGroundedModel();
      const result = await withGeminiResilience(
        () => withTimeout(metaModel.generateContent([metaBlindPrompt]), 60000),
        2,
        1000,
        10000
      );
      verdict = result.response?.text
        ? result.response.text()
        : 'Meta-Verdict could not be generated.';
    }
    log.info(`Meta-Judge complete (model=${frontierMetaModel ?? 'legacy-gemini-pro'}).`);

    return {
      metaVerdict: verdict,
    };
  } catch (e) {
    log.error('Meta Judge failed:', e instanceof Error ? e.message : String(e));
    return {
      metaVerdict: 'Debate Protocol failed due to timeout or error.',
    };
  }
}

// ============================================================
// RISK SCORER (unchanged — aggregates all state into final report)
// ============================================================

export async function riskScorerNode(state: AuditState): Promise<Partial<AuditState>> {
  // SECURITY: If GDPR anonymization failed, short-circuit with error report
  if (state.anonymizationStatus === 'failed') {
    log.warn('Anonymization failed — generating error report without analysing PII content');
    return {
      finalReport: {
        overallScore: 0,
        noiseScore: 0,
        summary:
          'Analysis aborted: GDPR anonymization failed. Document content was not processed to protect PII.',
        biases: [],
        noiseStats: { mean: 0, stdDev: 0, variance: 0 },
        factCheck: { score: 0, flags: ['Anonymization failure — fact check skipped'] },
        compliance: {
          status: 'FAIL',
          riskScore: 100,
          summary: 'Skipped due to anonymization failure.',
          regulations: [],
          searchQueries: [],
        },
        speakers: [],
      } satisfies AnalysisResult,
    };
  }

  // riskScorerNode refactored 2026-05-20 — orchestration only. Each step
  // lives as a typed helper in src/lib/scoring/risk-compiler.ts. The math
  // + fallback paths + default values are byte-identical to the prior
  // inline ~537-line implementation. The dqi-distribution-check.ts
  // regression suite is the parity gate (same scores before + after).
  const {
    loadSeverityWeights,
    loadCausalMultipliers,
    computeBiasDeductions,
    applyBayesianAdjustment,
    calculateNoisePenalty,
    calculateTrustPenalty,
    calculateLogicPenalty,
    calculateEchoChamberPenalty,
    calculateOutcomeFeedbackAdjustment,
    calculateAdversarialSignalPenalty,
    countCalibrationSamples,
    composeOverallScore,
    buildCalibrationInsight,
  } = await import('@/lib/scoring/risk-compiler');

  const effectiveOrgId = state.orgId || null;

  // Step 1 — load severity weights (calibrated or default fallback)
  const severityWeights = await loadSeverityWeights(effectiveOrgId, state.userId);

  // Step 2 — load causal danger multipliers (Moat 1: Causal AI Layer)
  const { multipliers: causalMultipliers, weightsForReport: causalWeightsForReport } =
    await loadCausalMultipliers(effectiveOrgId || state.userId || '');

  // Step 3 — compound bias deductions (calibrated headline + M10 baseline)
  const {
    biasDeductions: rawBiasDeductions,
    staticBiasDeductions,
    compoundScoreResult,
  } = await computeBiasDeductions({ state, severityWeights, causalMultipliers });

  // Step 4 — Bayesian prior adjustment (80/20 blend if a prior exists)
  const { adjustedBiasDeductions: biasDeductions, bayesianResult } = await applyBayesianAdjustment({
    state,
    biasDeductions: rawBiasDeductions,
  });

  // Step 5 — pure-math penalty components
  const noisePenalty = calculateNoisePenalty(state.noiseStats?.stdDev);
  const { trustPenalty } = calculateTrustPenalty(state.factCheckResult);
  const logicPenalty = calculateLogicPenalty(state.logicalAnalysis?.score);
  const diversityPenalty = calculateEchoChamberPenalty(state.cognitiveAnalysis?.blindSpotGap);

  // Step 6 — outcome feedback loop (cap 25, prisma-backed)
  const feedbackAdjustment = await calculateOutcomeFeedbackAdjustment(
    (state.biasAnalysis || []).map(b => b.biasType || '')
  );

  // Step 6c — adversarial-signal penalty (pipeline composer, 2026-07-02):
  // the score must hear the adversarial modules. Previously a memo with six
  // critical unanswered questions + a 0-approve boardroom scored identically
  // to one with none (the blind-Fermi 35 that deserved single digits —
  // co-work P0 #2). Capped 18 + per-signal caps; 0 on clean memos so every
  // prior clean-memo score is unchanged.
  const fqList = state.forgottenQuestions?.questions ?? [];
  const twinsList = state.simulation?.twins ?? [];
  const adversarialPenalty = calculateAdversarialSignalPenalty({
    criticalForgottenQuestions: fqList.filter(q => q?.severity === 'critical').length,
    highForgottenQuestions: fqList.filter(q => q?.severity === 'high').length,
    boardroomRejects: twinsList.filter(t => t?.vote === 'REJECT').length,
    redTeamObjections: (state.preMortem?.redTeam ?? []).length,
  });

  // Step 7 — compose overall + M10 static-baseline scores
  const overallScore = composeOverallScore({
    biasDeductions,
    noisePenalty,
    trustPenalty,
    logicPenalty,
    diversityPenalty,
    feedbackAdjustment,
    adversarialPenalty,
  });
  const staticOverallScore = composeOverallScore({
    biasDeductions: staticBiasDeductions,
    noisePenalty,
    trustPenalty,
    logicPenalty,
    diversityPenalty,
    feedbackAdjustment,
    adversarialPenalty,
  });

  log.info(
    `Scoring: Base(100) - Biases(${biasDeductions}) - Noise(${noisePenalty.toFixed(1)}) - Trust(${trustPenalty.toFixed(1)}) - Logic(${logicPenalty.toFixed(1)}) - Diversity(${diversityPenalty.toFixed(1)}) - Feedback(${feedbackAdjustment.toFixed(1)}) - Adversarial(${adversarialPenalty.toFixed(1)}) = ${overallScore} (static=${staticOverallScore}, Δ=${overallScore - staticOverallScore})`
  );

  // Step 8 — calibration insight (M10 flywheel surface)
  const calibrationSampleSize = await countCalibrationSamples(effectiveOrgId, state.userId);
  const calibrationInsight = buildCalibrationInsight({
    overallScore,
    staticOverallScore,
    causalWeightsForReport,
    sampleSize: calibrationSampleSize,
  });

  // Content-aware summary (2026-06-30) — replaces the bare template
  // "Audit complete. Detected N biases. Trust Score X%." which surfaced on the
  // Executive + Board views. Built deterministically from the real audit data
  // (DQI + grade + the highest-severity finding) so the one-line summary
  // actually says something about THIS decision.
  const summaryBiases = state.biasAnalysis || [];
  const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const topFinding = [...summaryBiases].sort(
    (a, b) =>
      (SEVERITY_RANK[(b.severity || 'low').toLowerCase()] || 0) -
      (SEVERITY_RANK[(a.severity || 'low').toLowerCase()] || 0)
  )[0];
  const grade = gradeFromScore(overallScore);
  const baseSummary =
    summaryBiases.length === 0
      ? `Clean audit — no reasoning risks flagged. DQI ${overallScore}/100 (grade ${grade}).`
      : `DQI ${overallScore}/100 (grade ${grade}). ${summaryBiases.length} reasoning ${summaryBiases.length === 1 ? 'risk' : 'risks'} flagged${topFinding?.biasType ? `, led by ${formatBiasName(topFinding.biasType)}` : ''}.`;
  // Surface the distillation when a large document was reduced to its reasoning.
  const summary = state.distillationNote ? `${baseSummary} ${state.distillationNote}` : baseSummary;

  return {
    finalReport: {
      overallScore,
      // Displayed noise metric. Rescaled 2026-06-30 (×10 → ×3): the ×10
      // multiplier clamped any jury stdDev ≥10 to 100, so "Avg Noise" sat
      // pinned near 100 (4/11 audits maxed). ×3 spreads it across a real range
      // (stdDev 28.5 → 86, 9.4 → 28, 2.4 → 7) without changing the DQI penalty
      // (that is the separately-recalibrated calculateNoisePenalty).
      noiseScore: Math.max(0, Math.min(100, Math.round((state.noiseStats?.stdDev || 0) * 3))),
      summary,
      structuredContent: state.structuredContent,
      biases: (state.biasAnalysis || []).map(b => ({
        ...b,
        biasType: normalizeBiasType(b.biasType),
        found: true,
      })),
      noiseStats: state.noiseStats,
      noiseBenchmarks: state.noiseBenchmarks,
      factCheck: state.factCheckResult ?? undefined,
      compliance: state.compliance || {
        status: 'WARN',
        riskScore: 50,
        summary: 'Compliance check unavailable.',
        regulations: [],
        searchQueries: [],
      },
      preMortem: state.preMortem,
      sentiment: state.sentimentAnalysis,
      logicalAnalysis: state.logicalAnalysis,
      swotAnalysis: state.swotAnalysis,
      cognitiveAnalysis: state.cognitiveAnalysis,
      simulation: state.simulation ?? undefined,
      institutionalMemory: state.institutionalMemory ?? undefined,
      metaVerdict: state.metaVerdict ?? undefined,
      speakers: state.speakers || [],
      intelligenceContext: state.intelligenceContext
        ? {
            newsCount: state.intelligenceContext.meta.sources.newsCount,
            researchCount: state.intelligenceContext.meta.sources.researchCount,
            caseStudyCount: state.intelligenceContext.meta.sources.caseStudyCount,
            macroSummary: state.intelligenceContext.macro?.summary || '',
            industryBenchmarkCount: state.intelligenceContext.meta.sources.industryBenchmarks,
            assembledAt: state.intelligenceContext.meta.assembledAt,
            topNews: state.intelligenceContext.news
              .slice(0, 3)
              .map(n => ({ title: n.title, source: n.source, link: n.link })),
            topCaseStudies: state.intelligenceContext.caseStudies
              .slice(0, 3)
              .map(c => ({ company: c.company, outcome: c.outcome, biasTypes: c.biasTypes })),
            marketSnapshot: state.intelligenceContext.marketSnapshot
              ? {
                  company: state.intelligenceContext.marketSnapshot.company,
                  summary: state.intelligenceContext.marketSnapshot.summary,
                  asOf: state.intelligenceContext.marketSnapshot.asOf,
                  signals: state.intelligenceContext.marketSnapshot.signals.slice(0, 6).map(s => ({
                    headline: s.headline,
                    detail: s.detail,
                    source: s.source,
                    date: s.date,
                  })),
                }
              : undefined,
          }
        : undefined,
      compoundScoring: compoundScoreResult
        ? {
            calibratedScore: compoundScoreResult.calibratedScore,
            compoundMultiplier: compoundScoreResult.compoundMultiplier,
            contextAdjustment: compoundScoreResult.contextAdjustment,
            confidenceDecay: compoundScoreResult.confidenceDecay,
            amplifyingInteractions: compoundScoreResult.biasScores
              .filter(b => b.interactionMultiplier > 1.05)
              .map(b => ({
                bias: b.biasType,
                multiplier: b.interactionMultiplier,
                interactions: b.contributingInteractions,
              })),
            adjustments: compoundScoreResult.adjustments,
          }
        : undefined,
      bayesianPriors: bayesianResult
        ? {
            adjustedScore: bayesianResult.adjustedScore,
            beliefDelta: bayesianResult.beliefDelta,
            informationGain: bayesianResult.informationGain,
            priorInfluence: bayesianResult.priorInfluence,
            biasAdjustments: bayesianResult.biasAdjustments,
          }
        : undefined,
      calibration: calibrationInsight,
      causalIntelligence: await buildCausalIntelligenceReport(
        effectiveOrgId || state.userId || '',
        causalWeightsForReport,
        (state.biasAnalysis || []).map((b: { biasType?: string }) =>
          (b.biasType || '').toLowerCase().replace(/\s+/g, '_')
        )
      ),
      recognitionCues: state.recognitionCues ?? undefined,
      narrativePreMortem: state.narrativePreMortem ?? undefined,
      forgottenQuestions: state.forgottenQuestions ?? undefined,
      marketContextApplied: state.marketContext
        ? {
            context: state.marketContext.context,
            emergingMarketCountries: state.marketContext.emergingMarketCountries,
            developedMarketCountries: state.marketContext.developedMarketCountries,
            cagrCeiling: GROWTH_RATE_PRIORS[state.marketContext.context].cagrCeiling,
            rationale: state.marketContext.rationale,
          }
        : undefined,
      dqChain: computeDQChain({
        logicalAnalysis: state.logicalAnalysis,
        swotAnalysis: state.swotAnalysis,
        cognitiveAnalysis: state.cognitiveAnalysis,
        factCheck: state.factCheckResult
          ? {
              totalClaims: state.factCheckResult.verifications?.length || 0,
              verifiedClaims: (state.factCheckResult.verifications || []).filter(
                v => v.verdict === 'VERIFIED'
              ).length,
              contradictedClaims: (state.factCheckResult.verifications || []).filter(
                v => v.verdict === 'CONTRADICTED'
              ).length,
              score: state.factCheckResult.score ?? 50,
            }
          : undefined,
        noiseStdDev: state.noiseStats?.stdDev,
        biasCount: (state.biasAnalysis || []).length,
        hasDecisionFrame: !!state.logicalAnalysis?.conclusion,
        hasOwner: false,
        hasDefaultAction: !!state.logicalAnalysis?.verdict,
        preMortemCount: state.preMortem?.failureScenarios?.length || 0,
      }),
    } satisfies AnalysisResult,
  };
}

// ============================================================
// CALIBRATION HEADLINE BUILDER (M10) — MOVED 2026-05-20
// ============================================================
//
// `buildCalibrationHeadline` now lives in src/lib/scoring/risk-compiler.ts
// (extracted alongside the rest of the riskScorerNode helpers in the
// 2026-05-20 refactor). Same math. Import from the canonical source if a
// future surface needs the headline string outside the audit pipeline.

// ============================================================
// CAUSAL INTELLIGENCE REPORT BUILDER
// ============================================================

async function buildCausalIntelligenceReport(
  orgId: string,
  causalWeights: Array<{
    biasType: string;
    dangerMultiplier: number;
    failureCount: number;
    successCount: number;
    sampleSize: number;
  }>,
  detectedBiasTypes: string[]
): Promise<CausalIntelligenceResult | undefined> {
  if (causalWeights.length === 0) return undefined;

  const topDangers = causalWeights
    .filter(w => w.dangerMultiplier >= 1.3 && w.sampleSize >= 3)
    .slice(0, 5)
    .map(w => ({
      biasType: w.biasType,
      dangerMultiplier: w.dangerMultiplier,
      failureCount: w.failureCount,
      sampleSize: w.sampleSize,
    }));

  const benignBiases = causalWeights
    .filter(w => w.dangerMultiplier <= 0.7 && w.sampleSize >= 3)
    .slice(0, 5)
    .map(w => ({
      biasType: w.biasType,
      dangerMultiplier: w.dangerMultiplier,
      sampleSize: w.sampleSize,
    }));

  const totalOutcomes = Math.max(...causalWeights.map(w => w.sampleSize), 0);
  const modelConfidence = Math.min(0.95, totalOutcomes / 50);

  // Run do-calculus for biases actually detected in this document
  let interventionEstimate: CausalIntelligenceResult['interventionEstimate'];
  const dangerousDetected = detectedBiasTypes.filter(bt =>
    topDangers.some(d => d.biasType.toLowerCase().replace(/\s+/g, '_') === bt)
  );

  if (dangerousDetected.length > 0) {
    try {
      const { doCalculus } = await import('@/lib/learning/causal-learning');
      const result = await doCalculus(orgId, { remove: dangerousDetected });
      if (result && result.improvement > 0) {
        interventionEstimate = {
          removedBiases: dangerousDetected,
          baselineSuccessRate: result.baselineSuccessProbability,
          projectedSuccessRate: result.successProbability,
          improvement: result.improvement,
          confidence: result.confidence,
          method: result.method,
        };
      }
    } catch {
      log.debug('do-calculus unavailable for report — skipping intervention estimate');
    }
  }

  return {
    topDangers,
    benignBiases,
    interventionEstimate,
    totalOutcomes,
    modelConfidence,
  };
}

// ============================================================================
// Synergy Validation Node (Proposal 4 · M&A hard-layer ship 2026-05-09)
// ============================================================================
//
// First-class deterministic pipeline node for synergy_model audits.
// Reads state.parsedStructuredData (set at audit-start time from
// Document.parsedStructuredData) and computes synergyDefensibility via
// pure-function summarisation. No LLM call — runs in milliseconds.
//
// Architectural value-add over the prior text-extraction path:
// (1) Deterministic — same input → same output, no LLM judgment in the
//     hot path. Procurement-defensible: an auditor asking "how does the
//     platform detect Synergy Mirage?" gets a code path that's reviewable
//     line-by-line, not a prompt that's interpretation-dependent.
// (2) First-class state — synergyDefensibility becomes a state field
//     downstream nodes (metaJudge especially) can consume alongside
//     their LLM signals. Future iterations can weight Synergy Mirage
//     detection more heavily when the deterministic node flags critical
//     claims.
// (3) Pipeline observability — pattern detection happens in a NAMED
//     PIPELINE NODE that shows up in the lineage on the DPR's pipeline
//     manifest, not buried inside biasDetective LLM output.
//
// Skips silently when documentType !== 'synergy_model' OR
// parsedStructuredData is null — returns no state mutation, downstream
// consumers see synergyDefensibility: null.
export async function synergyValidationNode(state: AuditState): Promise<Partial<AuditState>> {
  if (state.documentType !== 'synergy_model') {
    return {};
  }
  if (!state.parsedStructuredData) {
    log.debug('synergyValidationNode: no parsedStructuredData on state — skipping');
    return {};
  }
  try {
    const parserMod = await import('@/lib/parsers/synergy-model-parser');
    type ParsedShape = Parameters<typeof parserMod.summariseSynergyDefensibility>[0];
    const summary = parserMod.summariseSynergyDefensibility(
      state.parsedStructuredData as ParsedShape
    );
    if (!summary) {
      log.debug('synergyValidationNode: parsed structure has no synergy claims');
      return {};
    }
    log.info(
      `synergyValidationNode: ${summary.totalClaims} claims · fullyDefendedPct=${summary.fullyDefendedPct} · confidence=${summary.confidence}`
    );
    return {
      synergyDefensibility: summary,
    };
  } catch (err) {
    log.warn(`synergyValidationNode failed (non-fatal): ${String(err)}`);
    return {};
  }
}
