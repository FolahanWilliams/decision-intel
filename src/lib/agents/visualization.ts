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

// Nano Banana 2 — Gemini 3.1 Flash Image (multi-modal generative model)
const NANO_BANANA_2_MODEL = 'gemini-3.1-flash-preview-image';

// Guard: reject images larger than 2 MB (raw bytes, not base64)
const MAX_IMAGE_BYTES = 2_000_000;

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
        responseModalities: ['IMAGE'],
      },
    });

    // Extract inline image data from the Gemini response
    const part = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith('image/')
    );
    const base64Image = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType ?? 'image/png';
    if (!base64Image) return null;

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
  const colorScheme = hasCritical ? 'crimson and deep purple' : 'electric blue and cyan';

  const prompt = `A highly abstract, futuristic glowing 3D network diagram representing a "Bias Web". \
The web consists of interconnected nodes of varying sizes shining brightly against a very dark, premium stylized background. \
The color scheme features ${colorScheme} hues. The lines connecting the nodes are laser-like. \
This represents the complex intersection of cognitive biases: ${biasNames}. \
Cyberpunk aesthetic, glassmorphism, 8k resolution, highly detailed, functional data art.`;

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

  const prompt = `A conceptual, metaphorical 3D landscape representing a "Pre-Mortem Topography" of a project's potential failure points. \
The landscape should look like an architectural scale model made of premium materials like dark glass, brushed steel, and glowing neon accents. \
Show structural stress points, subtle cracks in a foundation, or a bridge spanning a chasm with warning holograms. \
The metaphorical landscape represents these risks: ${scenarios}. \
Corporate strategy aesthetic, moody lighting, highly detailed, cinematic composition.`;

  return generateImage(prompt, entityType, entityId, 'pre-mortem');
}
