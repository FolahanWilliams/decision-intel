/**
 * Cross-Framework Bias-to-Regulation Mapping
 *
 * Aggregates the bias-to-regulation intersection across ALL registered
 * frameworks. This is the proprietary intersection that requires BOTH
 * legal expertise AND behavioral science expertise — the unique dataset
 * no competitor has built.
 */

import { getAllFrameworks } from './regulatory-graph';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossFrameworkRisk {
  biasType: string;
  totalFrameworksAffected: number;
  frameworks: Array<{
    frameworkId: string;
    frameworkName: string;
    provisions: Array<{
      provisionId: string;
      title: string;
      riskWeight: number;
      mechanism: string;
    }>;
  }>;
  aggregateRiskScore: number;
  regulatoryHotspot: boolean;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Get the cross-framework regulatory risk for a specific bias type.
 * Shows which provisions across all frameworks are affected by this bias.
 */
export function getCrossFrameworkRisk(biasType: string): CrossFrameworkRisk {
  const frameworks = getAllFrameworks();
  const affectedFrameworks: CrossFrameworkRisk['frameworks'] = [];

  for (const fw of frameworks) {
    const relevantMappings = fw.biasMappings.filter(m => m.biasType === biasType);

    if (relevantMappings.length > 0) {
      affectedFrameworks.push({
        frameworkId: fw.id,
        frameworkName: fw.name,
        provisions: relevantMappings.map(m => {
          const provision = fw.provisions.find(p => p.id === m.provisionId);
          return {
            provisionId: m.provisionId,
            title: provision?.title ?? m.provisionId,
            riskWeight: m.riskWeight,
            mechanism: m.mechanism,
          };
        }),
      });
    }
  }

  // Aggregate risk score: weighted by number of frameworks and max risk weights
  const totalProvisions = affectedFrameworks.reduce((sum, fw) => sum + fw.provisions.length, 0);
  const maxWeights = affectedFrameworks.map(fw =>
    Math.max(...fw.provisions.map(p => p.riskWeight))
  );
  const avgMaxWeight =
    maxWeights.length > 0 ? maxWeights.reduce((s, w) => s + w, 0) / maxWeights.length : 0;

  const aggregateRiskScore = Math.round(
    Math.min(100, affectedFrameworks.length * 15 + totalProvisions * 5 + avgMaxWeight * 30)
  );

  return {
    biasType,
    totalFrameworksAffected: affectedFrameworks.length,
    frameworks: affectedFrameworks,
    aggregateRiskScore,
    regulatoryHotspot: affectedFrameworks.length >= 3,
  };
}

/**
 * Get all biases that are regulatory hotspots (affect 3+ frameworks).
 * Sorted by aggregate risk score descending.
 */
export function getRegulatoryHotspots(): CrossFrameworkRisk[] {
  const allBiasTypes = getAllUniqueBiasTypes();
  const risks = allBiasTypes.map(getCrossFrameworkRisk);

  return risks
    .filter(r => r.regulatoryHotspot)
    .sort((a, b) => b.aggregateRiskScore - a.aggregateRiskScore);
}

/**
 * Get coverage statistics: how many provisions each framework has mapped.
 */
export function getFrameworkCoverage(): Record<string, number> {
  const frameworks = getAllFrameworks();
  const coverage: Record<string, number> = {};

  for (const fw of frameworks) {
    const uniqueBiases = new Set(fw.biasMappings.map(m => m.biasType));
    coverage[fw.id] = uniqueBiases.size;
  }

  return coverage;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllUniqueBiasTypes(): string[] {
  const frameworks = getAllFrameworks();
  const biasTypes = new Set<string>();

  for (const fw of frameworks) {
    for (const mapping of fw.biasMappings) {
      biasTypes.add(mapping.biasType);
    }
  }

  return [...biasTypes].sort();
}
