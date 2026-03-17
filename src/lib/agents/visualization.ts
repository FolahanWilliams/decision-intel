import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// The Nano Banana 2 model name in the Gemini API (fallback to expected string)
const NANO_BANANA_MODEL = 'imagen-3.0-generate-002'; // Defaulting to imagen-3, user refered to it as Nano Banana 2

/**
 * Interface with Google's Image Generation API to create a Cognitive Topography.
 */
async function generateImage(prompt: string): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("No GOOGLE_API_KEY found. Skipping image generation.");
    return null;
  }

  try {
    const response = await ai.models.generateImages({
        model: NANO_BANANA_MODEL,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      // The image is returned as a base64 string
      const base64Image = response.generatedImages[0].image?.imageBytes;
      if (!base64Image) return null;
      
      // In a real production app, we would upload this base64 string to a bucket (e.g. Supabase Storage)
      // and return the public URL. For now, we will return the data URI so it renders immediately.
      return `data:image/jpeg;base64,${base64Image}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image with Nano Banana 2:", error);
    return null;
  }
}

/**
 * Generates an abstract "Bias Web" visualization based on the detected biases.
 */
export async function generateBiasWeb(biases: any[]): Promise<string | null> {
    if (!biases || biases.length === 0) {
        return null;
    }

    // Extract names and severities to inform the visual
    const biasNames = biases.map(b => b.biasType).join(', ');
    const hasCritical = biases.some(b => b.severity?.toLowerCase() === 'critical');
    const colorScheme = hasCritical ? 'crimson and deep purple' : 'electric blue and cyan';

    const prompt = `A highly abstract, futuristic glowing 3D network diagram representing a "Bias Web". 
    The web consists of interconnected nodes of varying sizes shining brightly against a very dark, premium stylized background. 
    The color scheme features ${colorScheme} hues. The lines connecting the nodes are laser-like. 
    This represents the complex intersection of cognitive biases: ${biasNames}. 
    Cyberpunk aesthetic, glassmorphism, 8k resolution, highly detailed, functional data art.`;

    return generateImage(prompt);
}

/**
 * Generates a "Pre-Mortem Topography" visualization based on failure scenarios.
 */
export async function generatePreMortemTopography(preMortem: any): Promise<string | null> {
    if (!preMortem || !preMortem.failureScenarios || preMortem.failureScenarios.length === 0) {
        return null;
    }

    const scenarios = preMortem.failureScenarios.map((s: any) => s.scenario).join('. ');

    const prompt = `A conceptual, metaphorical 3D landscape representing a "Pre-Mortem Topography" of a project's potential failure points. 
    The landscape should look like an architectural scale model made of premium materials like dark glass, brushed steel, and glowing neon accents. 
    Show structural stress points, subtle cracks in a foundation, or a bridge spanning a chasm with warning holograms.
    The metaphorical landscape represents these risks: ${scenarios}. 
    Corporate strategy aesthetic, moody lighting, highly detailed, cinematic composition.`;

    return generateImage(prompt);
}
