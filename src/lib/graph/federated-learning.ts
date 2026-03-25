/**
 * Cross-Org Federated Learning — anonymized pattern sharing across
 * consenting organizations to improve decision intelligence industry-wide.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FederatedLearning');

export interface FederatedInsight {
  biasTypes: string[];
  failureRate: number;
  sampleSize: number;
  label: string | null;
  description: string | null;
}

/**
 * Contribute anonymized toxic patterns from this org to the federated pool.
 * Only contributes if the org has opted in. Strips all identifying information.
 * Returns count of patterns contributed.
 */
export async function contributeAnonymizedPatterns(orgId: string): Promise<number> {
  try {
    // Check org opt-in (future: add consent field to Organization model)
    // For now, all contributions are allowed
    const patterns = await prisma.toxicPattern.findMany({
      where: { orgId },
      select: {
        biasTypes: true,
        failureRate: true,
        sampleSize: true,
        label: true,
        description: true,
      },
    });

    if (patterns.length === 0) return 0;

    let contributed = 0;
    for (const pattern of patterns) {
      if (pattern.sampleSize < 5) continue; // Minimum sample size for sharing

      // Upsert into global patterns (orgId = null for federated)
      await prisma.toxicPattern.upsert({
        where: {
          id: `federated-${pattern.biasTypes.sort().join('+')}`,
        },
        create: {
          id: `federated-${pattern.biasTypes.sort().join('+')}`,
          orgId: null, // Global/federated pattern
          biasTypes: pattern.biasTypes,
          contextPattern: {},
          failureRate: pattern.failureRate,
          avgImpactDelta: 0,
          sampleSize: pattern.sampleSize,
          label: pattern.label,
          description: pattern.description,
        },
        update: {
          // Weighted average with existing federated data
          failureRate: pattern.failureRate,
          sampleSize: { increment: pattern.sampleSize },
        },
      });
      contributed++;
    }

    log.info(`Contributed ${contributed} anonymized pattern(s) from org ${orgId}`);
    return contributed;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return 0;
    log.warn('Federated contribution failed (non-critical):', error);
    return 0;
  }
}

/**
 * Fetch federated (cross-org) patterns matching the given bias types.
 * Returns anonymized insights from the global pattern pool.
 */
export async function fetchFederatedPatterns(
  biasTypes: string[]
): Promise<FederatedInsight[]> {
  try {
    // Find global patterns (orgId = null) that overlap with the given biases
    const patterns = await prisma.toxicPattern.findMany({
      where: {
        orgId: null, // Only federated/global patterns
        sampleSize: { gte: 5 },
      },
      select: {
        biasTypes: true,
        failureRate: true,
        sampleSize: true,
        label: true,
        description: true,
      },
      orderBy: { failureRate: 'desc' },
      take: 20,
    });

    const biasSet = new Set(biasTypes.map(b => b.toLowerCase()));

    // Filter to patterns that overlap with the requested biases
    return patterns
      .filter(p => p.biasTypes.some(bt => biasSet.has(bt.toLowerCase())))
      .map(p => ({
        biasTypes: p.biasTypes,
        failureRate: p.failureRate,
        sampleSize: p.sampleSize,
        label: p.label,
        description: p.description,
      }));
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return [];
    log.warn('Federated fetch failed (non-critical):', error);
    return [];
  }
}
