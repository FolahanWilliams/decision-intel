/**
 * Regulatory Knowledge Graph Engine
 *
 * Core engine that maps cognitive biases to regulatory provisions across
 * multiple compliance frameworks. Provides cross-framework risk assessment
 * and identifies regulatory hotspots where bias patterns create compound risk.
 */

import { createLogger } from '@/lib/utils/logger';
import { getAllRegisteredFrameworks } from './frameworks';

const log = createLogger('RegulatoryGraph');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RegulatoryProvision {
  id: string;                    // e.g. 'fca_cd_outcome_1'
  framework: string;             // e.g. 'fca_consumer_duty'
  section: string;               // e.g. 'PRIN 2A.2'
  title: string;                 // e.g. 'Products and Services Outcome'
  description: string;           // detailed description
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];            // for document matching
}

export interface BiasRegulationMapping {
  biasType: string;              // BiasCategory
  provisionId: string;           // RegulatoryProvision.id
  riskWeight: number;            // 0-1: how strongly this bias violates this provision
  mechanism: string;             // HOW the bias creates regulatory risk
  example: string;               // concrete example of this violation
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  category: 'financial' | 'data_privacy' | 'safety' | 'ai_governance' | 'corporate_governance';
  provisions: RegulatoryProvision[];
  biasMappings: BiasRegulationMapping[];
  lastUpdated: string;
}

export interface RegulatoryAssessment {
  framework: RegulatoryFramework;
  overallRiskScore: number;      // 0-100
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggeredProvisions: Array<{
    provision: RegulatoryProvision;
    triggeringBiases: string[];
    aggregateRiskWeight: number;
    explanation: string;
  }>;
  remediationSteps: Array<{
    priority: 'immediate' | 'short_term' | 'medium_term';
    action: string;
    targetProvision: string;
  }>;
}

// ─── Severity Weights ───────────────────────────────────────────────────────

const SEVERITY_MULTIPLIERS: Record<string, number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

const CONFIDENCE_THRESHOLD = 0.3;

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get all registered regulatory frameworks.
 */
export function getAllFrameworks(): RegulatoryFramework[] {
  return getAllRegisteredFrameworks();
}

/**
 * Get a specific framework by ID.
 */
export function getFramework(id: string): RegulatoryFramework | undefined {
  return getAllRegisteredFrameworks().find(f => f.id === id);
}

/**
 * Assess compliance across one or more regulatory frameworks given a set
 * of detected biases. Returns a RegulatoryAssessment for each framework.
 *
 * Each detected bias is weighted by its severity, confidence, and the
 * risk weight defined in the framework's bias-to-provision mappings.
 */
export function assessCompliance(
  detectedBiases: Array<{ type: string; severity: string; confidence: number }>,
  frameworkIds?: string[]
): RegulatoryAssessment[] {
  const frameworks = getAllRegisteredFrameworks();
  const targetFrameworks = frameworkIds
    ? frameworks.filter(f => frameworkIds.includes(f.id))
    : frameworks;

  if (targetFrameworks.length === 0) {
    log.warn('No frameworks matched for assessment');
    return [];
  }

  // Filter biases above confidence threshold
  const qualifiedBiases = detectedBiases.filter(b => b.confidence >= CONFIDENCE_THRESHOLD);

  log.info(
    `Assessing ${qualifiedBiases.length} biases against ${targetFrameworks.length} framework(s)`
  );

  return targetFrameworks.map(framework => assessSingleFramework(framework, qualifiedBiases));
}

/**
 * Get all regulatory risks associated with a specific bias type across
 * every registered framework.
 */
export function getBiasRegulatoryRisk(
  biasType: string
): Array<{ framework: string; provision: string; riskWeight: number; mechanism: string }> {
  const results: Array<{
    framework: string;
    provision: string;
    riskWeight: number;
    mechanism: string;
  }> = [];

  for (const fw of getAllRegisteredFrameworks()) {
    const mappings = fw.biasMappings.filter(
      m => m.biasType === biasType
    );
    for (const mapping of mappings) {
      const provision = fw.provisions.find(p => p.id === mapping.provisionId);
      results.push({
        framework: fw.name,
        provision: provision?.title ?? mapping.provisionId,
        riskWeight: mapping.riskWeight,
        mechanism: mapping.mechanism,
      });
    }
  }

  return results;
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function assessSingleFramework(
  framework: RegulatoryFramework,
  biases: Array<{ type: string; severity: string; confidence: number }>
): RegulatoryAssessment {
  const biasTypeSet = new Set(biases.map(b => b.type));

  // Group mappings by provision
  const provisionHits = new Map<
    string,
    {
      provision: RegulatoryProvision;
      triggeringBiases: string[];
      totalWeight: number;
      explanations: string[];
    }
  >();

  for (const mapping of framework.biasMappings) {
    if (!biasTypeSet.has(mapping.biasType)) continue;

    const matchingBias = biases.find(b => b.type === mapping.biasType);
    if (!matchingBias) continue;

    const severityMult = SEVERITY_MULTIPLIERS[matchingBias.severity] ?? 0.5;
    const effectiveWeight = mapping.riskWeight * severityMult * matchingBias.confidence;

    if (!provisionHits.has(mapping.provisionId)) {
      const provision = framework.provisions.find(p => p.id === mapping.provisionId);
      if (!provision) continue;
      provisionHits.set(mapping.provisionId, {
        provision,
        triggeringBiases: [],
        totalWeight: 0,
        explanations: [],
      });
    }

    const hit = provisionHits.get(mapping.provisionId)!;
    hit.triggeringBiases.push(mapping.biasType);
    hit.totalWeight += effectiveWeight;
    hit.explanations.push(mapping.mechanism);
  }

  // Build triggered provisions array
  const triggeredProvisions = Array.from(provisionHits.values())
    .filter(hit => hit.totalWeight > 0)
    .map(hit => ({
      provision: hit.provision,
      triggeringBiases: hit.triggeringBiases,
      aggregateRiskWeight: Math.min(hit.totalWeight, 1),
      explanation: hit.explanations.join(' Additionally, '),
    }))
    .sort((a, b) => b.aggregateRiskWeight - a.aggregateRiskWeight);

  // Calculate overall risk score (0-100, higher = more risk)
  let overallRiskScore = 0;
  if (triggeredProvisions.length > 0) {
    const totalProvisions = framework.provisions.length;
    const coverageRatio = triggeredProvisions.length / totalProvisions;
    const avgWeight =
      triggeredProvisions.reduce((sum, tp) => sum + tp.aggregateRiskWeight, 0) /
      triggeredProvisions.length;

    // Risk score combines coverage breadth and depth
    overallRiskScore = Math.round(
      Math.min(100, (coverageRatio * 40 + avgWeight * 60) * (1 + coverageRatio * 0.5))
    );
  }

  const overallRiskLevel = riskScoreToLevel(overallRiskScore);

  // Generate remediation steps
  const remediationSteps = generateRemediationSteps(triggeredProvisions);

  log.info(
    `Framework ${framework.id}: risk=${overallRiskScore} (${overallRiskLevel}), ` +
      `triggered=${triggeredProvisions.length}/${framework.provisions.length} provisions`
  );

  return {
    framework,
    overallRiskScore,
    overallRiskLevel,
    triggeredProvisions,
    remediationSteps,
  };
}

function riskScoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function generateRemediationSteps(
  triggeredProvisions: RegulatoryAssessment['triggeredProvisions']
): RegulatoryAssessment['remediationSteps'] {
  const steps: RegulatoryAssessment['remediationSteps'] = [];

  for (const tp of triggeredProvisions) {
    const priority: 'immediate' | 'short_term' | 'medium_term' =
      tp.aggregateRiskWeight >= 0.7
        ? 'immediate'
        : tp.aggregateRiskWeight >= 0.4
          ? 'short_term'
          : 'medium_term';

    const biasNames = tp.triggeringBiases.map(b => b.replace(/_/g, ' ')).join(', ');

    steps.push({
      priority,
      action: `Address ${biasNames} affecting ${tp.provision.title}. ${tp.explanation}`,
      targetProvision: tp.provision.id,
    });
  }

  return steps.sort((a, b) => {
    const priorityOrder = { immediate: 0, short_term: 1, medium_term: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
