/**
 * Prompt Registry with Versioning
 *
 * This module provides a centralized registry for all prompts used in the application.
 * It tracks prompt versions, detects changes, and stores them in the database.
 */

import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PromptRegistry');

/**
 * Calculate SHA-256 hash of prompt content
 */
function hashPrompt(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Register or update a prompt in the database
 */
export async function registerPrompt(
  name: string,
  content: string
): Promise<{ id: string; version: number; isNew: boolean }> {
  const hash = hashPrompt(content);

  // Check if the prompt already exists
  const existingPrompt = await prisma.promptVersion.findFirst({
    where: { name, isActive: true },
    orderBy: { version: 'desc' },
  });

  // If the prompt exists and hasn't changed, return existing
  if (existingPrompt && existingPrompt.hash === hash) {
    return { id: existingPrompt.id, version: existingPrompt.version, isNew: false };
  }

  // Deactivate old versions
  if (existingPrompt) {
    await prisma.promptVersion.updateMany({
      where: { name, isActive: true },
      data: { isActive: false },
    });
  }

  // Create new version
  const nextVersion = existingPrompt ? existingPrompt.version + 1 : 1;
  const newPrompt = await prisma.promptVersion.create({
    data: {
      name,
      version: nextVersion,
      hash,
      content,
      isActive: true,
    },
  });

  log.info(`Registered prompt ${name} v${nextVersion} (hash: ${hash.slice(0, 8)}...)`);
  return { id: newPrompt.id, version: nextVersion, isNew: true };
}

/**
 * Get active prompt by name
 */
export async function getActivePrompt(name: string): Promise<string | null> {
  const prompt = await prisma.promptVersion.findFirst({
    where: { name, isActive: true },
    orderBy: { version: 'desc' },
  });

  return prompt?.content || null;
}

/**
 * Get prompt version history
 */
export async function getPromptHistory(name: string) {
  return prisma.promptVersion.findMany({
    where: { name },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      hash: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Registry of all prompts used in the application
 * These will be automatically registered on first use
 */
export const PROMPTS = {
  BIAS_DETECTIVE: `
You are a cognitive bias detective analyzing decision-making content.
Identify specific cognitive biases present in the text.
For each bias, provide:
1. The type of bias (e.g., confirmation bias, anchoring bias)
2. Severity level (low/medium/high/critical)
3. Exact excerpt demonstrating the bias
4. Clear explanation of how this bias manifests
5. Actionable suggestion to mitigate it
6. Confidence score (0-1)
Format as JSON array with these exact fields.
`,

  SIMULATION_SUPER: `
You are simulating virtual advisors for decision analysis.
Create diverse perspectives from different backgrounds:
- Strategic Advisor (big picture, long-term)
- Financial Analyst (numbers, ROI, risk)
- Customer Advocate (user needs, market fit)
- Operations Expert (execution, scalability)
- Devil's Advocate (challenges, risks)
Each advisor should provide unique insights and recommendations.
Format as structured JSON with advisor perspectives.
`,

  PRE_MORTEM_ANALYSIS: `
Conduct a pre-mortem analysis assuming this decision has failed.
Identify:
1. Potential failure scenarios (at least 5)
2. Likelihood of each scenario (low/medium/high)
3. Early warning signs to watch for
4. Mitigation strategies for each risk
5. Critical assumptions that could be wrong
Format as structured JSON for systematic risk assessment.
`,

  SWOT_ANALYZER: `
Perform a comprehensive SWOT analysis:
- Strengths: Internal advantages and capabilities
- Weaknesses: Internal limitations and gaps
- Opportunities: External positive factors
- Threats: External risks and challenges
Be specific and actionable. Format as JSON with arrays for each category.
`,

  NOISE_AUDITOR: `
Assess decision consistency and noise factors:
1. Identify areas of inconsistency or randomness
2. Detect emotional or temporal influences
3. Flag contradictions in reasoning
4. Measure confidence variability
5. Suggest standardization opportunities
Return noise score (0-100) and detailed findings as JSON.
`,

  SENTIMENT_ANALYZER: `
Analyze emotional tone and sentiment:
1. Overall sentiment (positive/negative/neutral)
2. Emotional intensity (0-1)
3. Key emotional indicators in text
4. Sentiment progression through document
5. Impact of emotion on decision quality
Format as JSON with sentiment metrics.
`,

  FACT_CHECKER: `
Verify factual claims and logical consistency:
1. Identify specific claims requiring verification
2. Flag unsupported assertions
3. Detect logical fallacies
4. Check internal consistency
5. Suggest fact-checking priorities
Return verification score and findings as JSON.
`,

  COMPLIANCE_CHECKER: `
Assess regulatory and compliance considerations:
1. Relevant regulations or standards
2. Compliance risks identified
3. Documentation requirements
4. Audit trail considerations
5. Recommended compliance actions
Format as JSON with compliance assessment.
`,
};

/**
 * Initialize prompt registry on startup
 * This ensures all prompts are versioned and tracked
 */
export async function initializePromptRegistry() {
  const promptEntries = Object.entries(PROMPTS);

  for (const [name, content] of promptEntries) {
    try {
      const result = await registerPrompt(name, content.trim());
      if (result.isNew) {
        log.info(`Initialized prompt ${name} v${result.version}`);
      }
    } catch (error) {
      log.error(`Failed to register prompt ${name}:`, error);
    }
  }

  log.info(`Prompt registry initialized with ${promptEntries.length} prompts`);
}

/**
 * Get prompt with automatic registration
 * This ensures prompts are always versioned before use
 */
export async function getPrompt(name: keyof typeof PROMPTS): Promise<string> {
  const content = PROMPTS[name];
  if (!content) {
    throw new Error(`Prompt ${name} not found in registry`);
  }

  // Register if needed
  await registerPrompt(name, content.trim());

  // Return the content (could also fetch from DB for audit trail)
  return content.trim();
}

/**
 * Compare prompt versions for drift detection
 */
export async function detectPromptDrift(): Promise<{
  drifted: string[];
  total: number;
}> {
  const drifted: string[] = [];

  for (const [name, content] of Object.entries(PROMPTS)) {
    const dbPrompt = await getActivePrompt(name);
    if (dbPrompt && dbPrompt !== content.trim()) {
      drifted.push(name);
    }
  }

  return {
    drifted,
    total: Object.keys(PROMPTS).length,
  };
}