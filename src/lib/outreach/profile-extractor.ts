import { generateWithFallback } from '@/lib/ai/model-router';
import { createLogger } from '@/lib/utils/logger';
import type { ExtractedProfile } from './types';

const log = createLogger('ProfileExtractor');

const EXTRACTION_PROMPT = `You are extracting structured data from a LinkedIn profile for a founder's outreach workflow. Return JSON only — no markdown fences, no prose.

The founder runs Decision Intel, a cognitive bias auditing platform for corporate strategy and M&A teams. The founder's ICP is:
- Corporate development / M&A leaders at public companies or PE-backed mid-market
- Strategy directors / VPs at F1000 companies
- Investment committees at PE/VC firms
- Any decision-maker who reviews board memos, strategy proposals, or investment theses

Extract these fields from the profile text and return a single JSON object:
{
  "name": string | null,
  "role": string | null,
  "company": string | null,
  "location": string | null,
  "tenure": string | null,
  "recentTopics": string[],
  "inferredPriorities": string[],
  "potentialObjections": string[],
  "icpFit": "high" | "medium" | "low" | "unknown",
  "icpFitReason": string
}

Rules:
- "recentTopics": up to 5 themes the person writes or posts about (e.g., "M&A integration", "board governance", "tech due diligence"). Empty array if unclear.
- "inferredPriorities": up to 4 things this person likely cares about given their role (e.g., "reducing deal execution risk", "signaling process rigor to LPs"). Be specific, not generic.
- "potentialObjections": up to 3 objections they'd likely raise about a bias-auditing tool (e.g., "We already do pre-mortems", "AI tools feel like a trust risk for confidential deals"). Concrete.
- "icpFit": "high" if role directly matches ICP, "medium" if adjacent (e.g., product strategy at a non-F1000), "low" if clearly outside (e.g., junior IC, unrelated industry), "unknown" if text is too sparse.
- "icpFitReason": one sentence explaining the icpFit value.

PROFILE TEXT:
===
{{PROFILE_TEXT}}
===`;

export async function extractProfile(rawText: string): Promise<ExtractedProfile> {
  const prompt = EXTRACTION_PROMPT.replace('{{PROFILE_TEXT}}', rawText.slice(0, 10_000));

  const result = await generateWithFallback(prompt, {
    maxTokens: 1200,
    temperature: 0.2,
  });

  const cleaned = stripJsonFences(result.text);
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeProfile(parsed);
  } catch (err) {
    log.error('Failed to parse profile extraction JSON', { cleaned, err });
    return {
      name: null,
      role: null,
      company: null,
      location: null,
      tenure: null,
      recentTopics: [],
      inferredPriorities: [],
      potentialObjections: [],
      icpFit: 'unknown',
      icpFitReason: 'Extraction failed — profile text may be too sparse.',
    };
  }
}

function stripJsonFences(text: string): string {
  const withoutFences = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return withoutFences;
  return withoutFences.slice(firstBrace, lastBrace + 1);
}

function normalizeProfile(raw: unknown): ExtractedProfile {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const asString = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, 280) : null;
  const asStringArray = (v: unknown, cap: number): string[] =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map(x => x.trim().slice(0, 280))
          .slice(0, cap)
      : [];
  const icpFitRaw = asString(obj.icpFit);
  const icpFit: ExtractedProfile['icpFit'] =
    icpFitRaw === 'high' || icpFitRaw === 'medium' || icpFitRaw === 'low' ? icpFitRaw : 'unknown';

  return {
    name: asString(obj.name),
    role: asString(obj.role),
    company: asString(obj.company),
    location: asString(obj.location),
    tenure: asString(obj.tenure),
    recentTopics: asStringArray(obj.recentTopics, 5),
    inferredPriorities: asStringArray(obj.inferredPriorities, 4),
    potentialObjections: asStringArray(obj.potentialObjections, 3),
    icpFit,
    icpFitReason: asString(obj.icpFitReason) ?? 'No explanation provided by extraction.',
  };
}
