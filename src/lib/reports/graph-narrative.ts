/**
 * Graph Narrative Generator — uses Gemini to produce a plain-language
 * executive summary of the decision knowledge graph.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GraphNetworkReport } from './graph-report';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('GraphNarrative');

let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate a 3-5 paragraph executive narrative summarizing the
 * decision knowledge graph state, patterns, and recommendations.
 */
export async function generateGraphNarrative(report: GraphNetworkReport): Promise<string> {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an executive advisor analyzing an organization's decision-making intelligence graph. Generate a concise, actionable 3-5 paragraph narrative summary for senior leadership. Use a professional, direct tone. No bullet points — flowing prose only.

## Graph Data

**Network Size:** ${report.metrics.nodeCount} decisions tracked, ${report.metrics.edgeCount} relationships mapped, ${report.metrics.clusterCount} decision clusters identified.
**Network Density:** ${report.metrics.density} (${report.metrics.density > 0.1 ? 'well-connected' : report.metrics.density > 0.03 ? 'moderately connected' : 'sparsely connected'})
**Average Connections:** ${report.metrics.avgDegree} per decision
**Isolated Decisions:** ${report.metrics.isolatedNodes} (decisions with no connections to other decisions)

**Risk State:** ${report.riskState.overallRisk} (score: ${report.riskState.riskScore}/100, trend: ${report.riskState.trend})
${report.riskState.factors.length > 0 ? `Risk factors: ${report.riskState.factors.map(f => f.description).join('; ')}` : 'No significant risk factors.'}

**Anti-Patterns Detected:** ${report.antiPatterns.length}
${report.antiPatterns.map(p => `- ${p.patternType}: ${p.description} (severity: ${p.severity})`).join('\n')}

**Most Influential Decisions (by PageRank):**
${report.topNodes
  .slice(0, 5)
  .map(n => `- "${n.label}" (type: ${n.type}, score: ${n.score}, connections: ${n.degree})`)
  .join('\n')}

**Edge Type Distribution:**
${Object.entries(report.edgeTypeDistribution)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

**Cascade Risks (pending decisions at elevated risk):**
${report.cascadeRisks.length > 0 ? report.cascadeRisks.map(r => `- Risk score ${r.riskScore}: ${r.reason}`).join('\n') : 'No elevated cascade risks.'}

Write the narrative focusing on: (1) overall health of decision-making, (2) key patterns and risks, (3) specific actionable recommendations. Keep it under 400 words.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    log.error('Narrative generation failed:', error);
    return `Decision Intelligence Report: Your organization has tracked ${report.metrics.nodeCount} decisions with ${report.metrics.edgeCount} relationships across ${report.metrics.clusterCount} clusters. Overall risk level: ${report.riskState.overallRisk}. ${report.antiPatterns.length > 0 ? `${report.antiPatterns.length} anti-pattern(s) detected requiring attention.` : 'No critical anti-patterns detected.'} Detailed analysis requires AI narrative generation to be available.`;
  }
}
