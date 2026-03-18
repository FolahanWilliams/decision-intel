import { GoogleGenAI } from '@google/genai';
import { createLogger } from '@/lib/utils/logger';
import { uploadVisualization } from '@/lib/utils/visualization-storage';

const log = createLogger('Visualization');

// Lazy-init to avoid crashing at import time when GOOGLE_API_KEY is absent
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }
  return aiInstance;
}

// Nano Banana 2 — Gemini 3.1 Flash Image Preview (multi-modal generative model)
const NANO_BANANA_2_MODEL = 'gemini-3.1-flash-image-preview';

// Guard: reject images larger than 5 MB (raw bytes, not base64)
const MAX_IMAGE_BYTES = 5_000_000;

/** Sanitize user-derived text before embedding in an image prompt. */
function sanitizeForPrompt(text: string, maxLength = 200): string {
  return text
    .replace(/[^\w\s,.\-()]/g, '') // strip special chars
    .slice(0, maxLength)
    .trim();
}

/**
 * Call Nano Banana 2 (Gemini 3.1 Flash Image) to generate an image,
 * upload to Supabase Storage, and return the public URL.
 * Falls back to a data URI if storage upload fails.
 * Returns null (never throws) when generation is unavailable or fails.
 */
async function generateImage(
  prompt: string,
  entityType: 'analysis' | 'audit',
  entityId: string,
  imageName: string
): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    log.warn('No GOOGLE_API_KEY found — skipping image generation');
    return null;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: NANO_BANANA_2_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    });

    // Extract inline image data from the Gemini response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      log.warn('Nano Banana 2 returned no parts in response');
      return null;
    }

    const part = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    const base64Image = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType ?? 'image/png';
    if (!base64Image) {
      log.warn(
        `Nano Banana 2 returned ${parts.length} part(s) but none contained image data. ` +
          `Part types: ${parts.map(p => (p.inlineData ? `inlineData(${p.inlineData.mimeType})` : p.text ? 'text' : 'unknown')).join(', ')}`
      );
      return null;
    }

    // Reject oversized images
    const rawBytes = Buffer.byteLength(base64Image, 'base64');
    if (rawBytes > MAX_IMAGE_BYTES) {
      log.warn(`Generated image exceeds ${MAX_IMAGE_BYTES} bytes — discarding`);
      return null;
    }

    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Upload to Supabase Storage; fall back to data URI if upload fails
    const publicUrl = await uploadVisualization(dataUri, entityType, entityId, imageName);
    if (publicUrl) {
      return publicUrl;
    }

    // Fallback: return data URI (legacy behavior) if storage unavailable
    log.warn('Storage upload failed — falling back to data URI');
    return dataUri;
  } catch (error) {
    log.error('Image generation failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

interface BiasInput {
  biasType: string;
  severity?: string;
}

/**
 * Generates an abstract "Bias Web" visualization based on the detected biases.
 * @param entityType - 'analysis' for document analyses, 'audit' for human-decision audits
 * @param entityId - The ID of the analysis or audit record (used as storage path)
 */
export async function generateBiasWeb(
  biases: BiasInput[],
  entityType: 'analysis' | 'audit' = 'analysis',
  entityId: string = 'unknown'
): Promise<string | null> {
  if (!biases || biases.length === 0) {
    return null;
  }

  const biasNames = sanitizeForPrompt(biases.map(b => b.biasType).join(', '));
  const hasCritical = biases.some(b => b.severity?.toLowerCase() === 'critical');
  const accentColor = hasCritical ? 'red' : 'cyan';

  const prompt = `Clean, minimal flat 2D network diagram on a solid dark (#111827) background. \
${biases.length} labeled circular nodes arranged in a radial layout, each node labeled with a bias name. \
Nodes connected by thin straight lines showing relationships. \
Node sizes vary by importance — larger nodes for more severe biases. \
Use ${accentColor} as the accent color for nodes and lines, with white text labels. \
Biases: ${biasNames}. \
Style: simple infographic, clean sans-serif typography, no 3D effects, no gradients, no decorative elements. \
The diagram should be immediately readable and look like a professional data visualization.`;

  return generateImage(prompt, entityType, entityId, 'bias-web');
}

interface PreMortemInput {
  failureScenarios?: Array<{ scenario?: string } | string>;
}

/**
 * Generates a "Pre-Mortem Topography" visualization based on failure scenarios.
 * @param entityType - 'analysis' for document analyses, 'audit' for human-decision audits
 * @param entityId - The ID of the analysis or audit record (used as storage path)
 */
export async function generatePreMortemTopography(
  preMortem: PreMortemInput | null | undefined,
  entityType: 'analysis' | 'audit' = 'analysis',
  entityId: string = 'unknown'
): Promise<string | null> {
  if (!preMortem?.failureScenarios || preMortem.failureScenarios.length === 0) {
    return null;
  }

  // failureScenarios may be objects with a .scenario field or plain strings
  const scenarios = sanitizeForPrompt(
    preMortem.failureScenarios
      .map(s => (typeof s === 'string' ? s : (s.scenario ?? '')))
      .filter(Boolean)
      .join('. ')
  );

  if (!scenarios) return null;

  const scenarioCount = preMortem.failureScenarios.length;

  const prompt = `Clean, minimal flat 2D risk map on a solid dark (#111827) background. \
A simple horizontal timeline or flow diagram showing ${scenarioCount} potential failure points as labeled markers. \
Each failure point is a colored circle or diamond on the timeline, with a short text label below it. \
Use a red-to-amber color gradient to indicate risk severity (red = highest risk). \
Risks shown: ${scenarios}. \
Style: simple infographic, clean sans-serif typography, no 3D effects, no photorealism, no decorative elements. \
The diagram should be immediately readable and look like a professional risk assessment chart.`;

  return generateImage(prompt, entityType, entityId, 'pre-mortem');
}
