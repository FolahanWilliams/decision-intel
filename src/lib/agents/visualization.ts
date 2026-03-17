import { GoogleGenAI } from '@google/genai';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Visualization');

// Lazy-init to avoid crashing at import time when GOOGLE_API_KEY is absent
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }
  return aiInstance;
}

// The Imagen 3 model (referred to as "Nano Banana 2" internally)
const NANO_BANANA_MODEL = 'imagen-3.0-generate-002';

// Guard: reject data URIs larger than 500 KB to avoid bloating the DB
const MAX_DATA_URI_BYTES = 500_000;

/** Sanitize user-derived text before embedding in an image prompt. */
function sanitizeForPrompt(text: string, maxLength = 200): string {
  return text
    .replace(/[^\w\s,.\-()]/g, '') // strip special chars
    .slice(0, maxLength)
    .trim();
}

/**
 * Call Google's image generation API and return a data URI.
 * Returns null (never throws) when generation is unavailable or fails.
 */
async function generateImage(prompt: string): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    log.warn('No GOOGLE_API_KEY found — skipping image generation');
    return null;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateImages({
      model: NANO_BANANA_MODEL,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) return null;

    const dataUri = `data:image/jpeg;base64,${base64Image}`;

    // Reject oversized images to protect DB storage
    if (Buffer.byteLength(dataUri, 'utf8') > MAX_DATA_URI_BYTES) {
      log.warn(
        `Generated image exceeds ${MAX_DATA_URI_BYTES} bytes — discarding to protect DB storage`
      );
      return null;
    }

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
 */
export async function generateBiasWeb(biases: BiasInput[]): Promise<string | null> {
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

  return generateImage(prompt);
}

interface PreMortemInput {
  failureScenarios?: Array<{ scenario?: string } | string>;
}

/**
 * Generates a "Pre-Mortem Topography" visualization based on failure scenarios.
 */
export async function generatePreMortemTopography(
  preMortem: PreMortemInput | null | undefined
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

  return generateImage(prompt);
}
