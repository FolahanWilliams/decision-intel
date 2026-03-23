/**
 * FCA Consumer Duty Assessment Engine (Moat 5)
 *
 * Deep vertical integration for financial services compliance.
 * Maps analysis findings to FCA Consumer Duty's 4 outcome categories:
 *   1. Products & Services
 *   2. Price & Value
 *   3. Consumer Understanding
 *   4. Consumer Support
 *
 * This is defensible because:
 * - FCA Consumer Duty (2023) is new; incumbents haven't built deep tooling
 * - Compliance reports embedded in audit trails create regulatory switching costs
 * - Domain-specific scoring requires specialized knowledge competitors lack
 */

import { createLogger } from '@/lib/utils/logger';
import type { AnalysisResult } from '@/types';

const log = createLogger('FCAConsumerDuty');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FCAOutcomeScore {
  category: 'products_services' | 'price_value' | 'consumer_understanding' | 'consumer_support';
  score: number; // 0-100
  findings: FCAFinding[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FCAFinding {
  rule: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  biasTypes: string[];
  remediation: string;
}

export interface FCAAssessmentResult {
  framework: 'FCA_CONSUMER_DUTY';
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  overallScore: number;
  outcomeScores: Record<string, number>;
  outcomes: FCAOutcomeScore[];
  findings: FCAFinding[];
  remediationPlan: RemediationStep[];
  summary: string;
}

export interface RemediationStep {
  priority: 'immediate' | 'short_term' | 'medium_term';
  action: string;
  outcome: string;
  deadline: string;
}

// ─── Bias-to-FCA Outcome Mapping ────────────────────────────────────────────

const BIAS_FCA_MAPPING: Record<string, string[]> = {
  // Biases affecting product suitability assessments
  confirmation_bias: ['products_services', 'consumer_understanding'],
  anchoring_bias: ['price_value', 'products_services'],
  availability_bias: ['products_services', 'consumer_understanding'],
  // Biases affecting fair value assessments
  sunk_cost_fallacy: ['price_value'],
  framing_effect: ['price_value', 'consumer_understanding'],
  status_quo_bias: ['products_services', 'consumer_support'],
  // Biases affecting clear communication
  curse_of_knowledge: ['consumer_understanding'],
  ambiguity_effect: ['consumer_understanding'],
  overconfidence_bias: ['consumer_understanding', 'products_services'],
  // Biases affecting support quality
  groupthink: ['consumer_support', 'products_services'],
  authority_bias: ['consumer_support'],
  bandwagon_effect: ['consumer_support', 'consumer_understanding'],
  survivorship_bias: ['products_services', 'price_value'],
  hindsight_bias: ['consumer_understanding'],
  optimism_bias: ['price_value', 'products_services'],
};

// ─── FCA Enforcement Pattern Database ───────────────────────────────────────

const FCA_ENFORCEMENT_PATTERNS = [
  {
    pattern: 'high_risk_product_without_adequate_assessment',
    description: 'Product decision lacks adequate suitability assessment',
    triggerBiases: ['confirmation_bias', 'overconfidence_bias', 'availability_bias'],
    minBiasCount: 2,
    severity: 'high' as const,
    fcaRef: 'PRIN 2A.2 — Products and services outcome',
  },
  {
    pattern: 'price_value_not_evidenced',
    description: 'Price/value proposition not evidenced or anchored to irrelevant comparators',
    triggerBiases: ['anchoring_bias', 'framing_effect', 'sunk_cost_fallacy'],
    minBiasCount: 1,
    severity: 'high' as const,
    fcaRef: 'PRIN 2A.3 — Price and value outcome',
  },
  {
    pattern: 'unclear_communication',
    description: 'Communication assumes knowledge consumers may not have',
    triggerBiases: ['curse_of_knowledge', 'ambiguity_effect', 'overconfidence_bias'],
    minBiasCount: 1,
    severity: 'medium' as const,
    fcaRef: 'PRIN 2A.4 — Consumer understanding outcome',
  },
  {
    pattern: 'groupthink_in_governance',
    description: 'Decision shows signs of groupthink without adequate challenge',
    triggerBiases: ['groupthink', 'authority_bias', 'bandwagon_effect'],
    minBiasCount: 2,
    severity: 'critical' as const,
    fcaRef: 'PRIN 2A.5 — Consumer support outcome + SYSC governance',
  },
  {
    pattern: 'retrospective_rationalization',
    description: 'Decision rationale appears to be post-hoc justification',
    triggerBiases: ['hindsight_bias', 'survivorship_bias', 'confirmation_bias'],
    minBiasCount: 2,
    severity: 'high' as const,
    fcaRef: 'PRIN 2A.1 — Cross-cutting: act in good faith',
  },
];

// ─── Assessment Engine ──────────────────────────────────────────────────────

/**
 * Run a full FCA Consumer Duty assessment against analysis results.
 *
 * Maps detected biases and compliance findings to the four FCA outcomes,
 * scores each outcome, and generates a remediation plan.
 */
export function assessFCAConsumerDuty(analysis: AnalysisResult): FCAAssessmentResult {
  const biases = analysis.biases || [];
  const compliance = analysis.compliance;

  // Initialize outcome scores
  const outcomeAccumulators: Record<string, { penalties: number; findings: FCAFinding[] }> = {
    products_services: { penalties: 0, findings: [] },
    price_value: { penalties: 0, findings: [] },
    consumer_understanding: { penalties: 0, findings: [] },
    consumer_support: { penalties: 0, findings: [] },
  };

  // Step 1: Map biases to FCA outcomes
  const biasTypeSet = new Set(biases.map(b => b.biasType.toLowerCase().replace(/\s+/g, '_')));

  for (const bias of biases) {
    const normalizedType = bias.biasType.toLowerCase().replace(/\s+/g, '_');
    const affectedOutcomes = BIAS_FCA_MAPPING[normalizedType] || [];
    const severityPenalty = getSeverityPenalty(bias.severity);

    for (const outcome of affectedOutcomes) {
      if (outcomeAccumulators[outcome]) {
        outcomeAccumulators[outcome].penalties += severityPenalty;
      }
    }
  }

  // Step 2: Check enforcement patterns
  const allFindings: FCAFinding[] = [];

  for (const pattern of FCA_ENFORCEMENT_PATTERNS) {
    const matchingBiases = pattern.triggerBiases.filter(b => biasTypeSet.has(b));
    if (matchingBiases.length >= pattern.minBiasCount) {
      const finding: FCAFinding = {
        rule: pattern.fcaRef,
        description: pattern.description,
        severity: pattern.severity,
        biasTypes: matchingBiases,
        remediation: generateRemediation(pattern.pattern, matchingBiases),
      };

      allFindings.push(finding);

      // Add finding to relevant outcome categories
      const affectedCategories = new Set<string>();
      for (const bias of matchingBiases) {
        for (const cat of BIAS_FCA_MAPPING[bias] || []) {
          affectedCategories.add(cat);
        }
      }
      for (const cat of affectedCategories) {
        if (outcomeAccumulators[cat]) {
          outcomeAccumulators[cat].findings.push(finding);
          outcomeAccumulators[cat].penalties += getSeverityPenalty(pattern.severity) * 1.5;
        }
      }
    }
  }

  // Step 3: Factor in existing compliance findings
  if (compliance) {
    const compliancePenalty = (compliance.riskScore / 100) * 20;
    outcomeAccumulators.products_services.penalties += compliancePenalty * 0.3;
    outcomeAccumulators.consumer_understanding.penalties += compliancePenalty * 0.3;
    outcomeAccumulators.price_value.penalties += compliancePenalty * 0.2;
    outcomeAccumulators.consumer_support.penalties += compliancePenalty * 0.2;
  }

  // Step 4: Calculate final scores
  const outcomes: FCAOutcomeScore[] = Object.entries(outcomeAccumulators).map(
    ([category, data]) => {
      const score = Math.max(0, Math.min(100, Math.round(100 - data.penalties)));
      return {
        category: category as FCAOutcomeScore['category'],
        score,
        findings: data.findings,
        riskLevel: scoreToRiskLevel(score),
      };
    }
  );

  const outcomeScores: Record<string, number> = {};
  for (const o of outcomes) {
    outcomeScores[o.category] = o.score;
  }

  const overallScore = Math.round(outcomes.reduce((sum, o) => sum + o.score, 0) / outcomes.length);
  const overallRiskLevel = scoreToRiskLevel(overallScore);

  // Step 5: Generate remediation plan
  const remediationPlan = generateRemediationPlan(allFindings, outcomes);

  const summary = buildSummary(overallScore, overallRiskLevel, outcomes, allFindings);

  log.info(
    `FCA Consumer Duty assessment: overall=${overallScore} (${overallRiskLevel}), ` +
      `findings=${allFindings.length}, biases=${biases.length}`
  );

  return {
    framework: 'FCA_CONSUMER_DUTY',
    overallRiskLevel,
    overallScore,
    outcomeScores,
    outcomes,
    findings: allFindings,
    remediationPlan,
    summary,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSeverityPenalty(severity: string): number {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 25;
    case 'high':
      return 15;
    case 'medium':
      return 8;
    case 'low':
      return 3;
    default:
      return 5;
  }
}

function scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function generateRemediation(pattern: string, matchingBiases: string[]): string {
  const biasNames = matchingBiases.map(b => b.replace(/_/g, ' ')).join(', ');

  switch (pattern) {
    case 'high_risk_product_without_adequate_assessment':
      return `Conduct independent product suitability review. Address detected biases (${biasNames}) by introducing external challenge mechanisms and structured decision frameworks.`;
    case 'price_value_not_evidenced':
      return `Document price/value evidence trail. Address ${biasNames} by using pre-registered evaluation criteria and independent benchmarking.`;
    case 'unclear_communication':
      return `Review consumer-facing materials for clarity. Test comprehension with representative consumer groups. Address ${biasNames} in communication review process.`;
    case 'groupthink_in_governance':
      return `Introduce mandatory dissent protocols in governance. Appoint a devil's advocate for this decision category. Address ${biasNames} through structured challenge sessions.`;
    case 'retrospective_rationalization':
      return `Implement pre-commitment decision logs. Record decision rationale before outcomes are known. Address ${biasNames} through prospective decision framing.`;
    default:
      return `Review and address detected cognitive biases: ${biasNames}.`;
  }
}

function generateRemediationPlan(
  findings: FCAFinding[],
  outcomes: FCAOutcomeScore[]
): RemediationStep[] {
  const steps: RemediationStep[] = [];

  // Critical findings = immediate action
  const criticalFindings = findings.filter(f => f.severity === 'critical');
  for (const f of criticalFindings) {
    steps.push({
      priority: 'immediate',
      action: f.remediation,
      outcome: `Address ${f.rule} compliance gap`,
      deadline: '48 hours',
    });
  }

  // High-risk outcomes = short-term remediation
  const highRiskOutcomes = outcomes.filter(
    o => o.riskLevel === 'high' || o.riskLevel === 'critical'
  );
  for (const o of highRiskOutcomes) {
    steps.push({
      priority: 'short_term',
      action: `Review and strengthen ${o.category.replace(/_/g, ' ')} controls. Score: ${o.score}/100.`,
      outcome: `Improve ${o.category.replace(/_/g, ' ')} outcome to at least 60/100`,
      deadline: '2 weeks',
    });
  }

  // High severity findings = short-term
  const highFindings = findings.filter(f => f.severity === 'high');
  for (const f of highFindings) {
    steps.push({
      priority: 'short_term',
      action: f.remediation,
      outcome: `Address ${f.rule} compliance gap`,
      deadline: '1 week',
    });
  }

  // Medium findings = medium-term
  const mediumFindings = findings.filter(f => f.severity === 'medium');
  for (const f of mediumFindings) {
    steps.push({
      priority: 'medium_term',
      action: f.remediation,
      outcome: `Strengthen compliance posture for ${f.rule}`,
      deadline: '30 days',
    });
  }

  return steps;
}

function buildSummary(
  overallScore: number,
  riskLevel: string,
  outcomes: FCAOutcomeScore[],
  findings: FCAFinding[]
): string {
  const worstOutcome = outcomes.reduce((worst, o) => (o.score < worst.score ? o : worst));
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  let summary = `FCA Consumer Duty Assessment: Overall score ${overallScore}/100 (${riskLevel} risk). `;

  if (criticalCount > 0) {
    summary += `${criticalCount} critical finding(s) require immediate attention. `;
  }
  if (highCount > 0) {
    summary += `${highCount} high-severity finding(s) identified. `;
  }

  summary += `Weakest outcome: ${worstOutcome.category.replace(/_/g, ' ')} (${worstOutcome.score}/100). `;
  summary += `${findings.length} total regulatory findings across ${outcomes.filter(o => o.findings.length > 0).length} outcome categories.`;

  return summary;
}
