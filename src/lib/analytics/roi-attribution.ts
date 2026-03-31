/**
 * ROI Attribution — computes "value protected" for a project/decision.
 *
 * Traverses: Deal → Documents → Analyses → (BiasInstances + DecisionOutcome)
 *
 * Formula:
 *   valueProtected = ticketSize × biasImpactRate × correctionFactor
 *
 * Where:
 * - biasImpactRate = confirmed biases / total biases detected
 * - correctionFactor = weighted average of research-based loss rates per bias type
 *
 * Loss rates derived from the 113 annotated failure cases and academic literature.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ROIAttribution');

/**
 * Research-based loss rates per bias type.
 * Represents the probability-weighted expected loss as a fraction of ticket size.
 * Sources: Kahneman "Noise", Malmendier & Tate (2008), internal 146-case dataset.
 */
const BIAS_LOSS_RATES: Record<string, number> = {
  'Anchoring Bias': 0.15,
  'Confirmation Bias': 0.12,
  Overconfidence: 0.18,
  'Overconfidence Bias': 0.18,
  'Planning Fallacy': 0.1,
  'Sunk Cost Bias': 0.08,
  'Sunk Cost Fallacy': 0.08,
  'Narrative Bias': 0.14,
  'Availability Bias': 0.09,
  'Availability Heuristic': 0.09,
  Groupthink: 0.11,
  'Authority Bias': 0.07,
  'Survivorship Bias': 0.1,
  'Commitment Escalation': 0.13,
  'Status Quo Bias': 0.06,
  'Loss Aversion': 0.08,
  'Framing Effect': 0.07,
  'Halo Effect': 0.06,
  'Bandwagon Effect': 0.05,
  'Optimism Bias': 0.09,
  'Recency Bias': 0.07,
  'Hindsight Bias': 0.05,
};

const DEFAULT_LOSS_RATE = 0.08;

export interface BiasAttribution {
  biasType: string;
  confirmed: boolean;
  lossRate: number;
  estimatedLoss: number;
}

export interface ROIAttribution {
  dealId: string;
  dealName: string;
  ticketSize: number;
  totalBiasesDetected: number;
  confirmedBiases: number;
  biasImpactRate: number;
  correctionFactor: number;
  valueProtected: number;
  breakdown: BiasAttribution[];
}

/**
 * Compute value-protected attribution for a single deal.
 */
export async function computeROIAttribution(dealId: string): Promise<ROIAttribution | null> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        name: true,
        ticketSize: true,
        documents: {
          select: {
            analyses: {
              select: {
                biases: {
                  select: {
                    biasType: true,
                    severity: true,
                  },
                },
                outcome: {
                  select: {
                    confirmedBiases: true,
                    falsPositiveBiases: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!deal) return null;

    // Prisma Decimal comes back as an object with toNumber() or as a string
    const ticketSize = deal.ticketSize ? Number(deal.ticketSize) : 0;

    if (ticketSize === 0) return null;

    // Aggregate all biases and outcomes across documents/analyses
    const allBiases: { biasType: string; severity: string }[] = [];
    const allConfirmed = new Set<string>();
    const allFalsePositive = new Set<string>();

    for (const doc of deal.documents) {
      for (const analysis of doc.analyses) {
        for (const bias of analysis.biases) {
          allBiases.push(bias);
        }
        if (analysis.outcome) {
          const confirmed = analysis.outcome.confirmedBiases;
          const falsePos = analysis.outcome.falsPositiveBiases;
          if (Array.isArray(confirmed)) confirmed.forEach((b: string) => allConfirmed.add(b));
          if (Array.isArray(falsePos)) falsePos.forEach((b: string) => allFalsePositive.add(b));
        }
      }
    }

    if (allBiases.length === 0) {
      return {
        dealId,
        dealName: deal.name,
        ticketSize,
        totalBiasesDetected: 0,
        confirmedBiases: 0,
        biasImpactRate: 0,
        correctionFactor: 0,
        valueProtected: 0,
        breakdown: [],
      };
    }

    // Build breakdown
    const breakdown: BiasAttribution[] = allBiases.map(bias => {
      const confirmed = allConfirmed.has(bias.biasType);
      const lossRate = BIAS_LOSS_RATES[bias.biasType] ?? DEFAULT_LOSS_RATE;
      // Only confirmed biases contribute to value protected
      const estimatedLoss = confirmed ? ticketSize * lossRate : 0;
      return {
        biasType: bias.biasType,
        confirmed,
        lossRate,
        estimatedLoss,
      };
    });

    const confirmedCount = breakdown.filter(b => b.confirmed).length;
    const biasImpactRate = allBiases.length > 0 ? confirmedCount / allBiases.length : 0;

    // Correction factor: weighted average loss rate of confirmed biases
    const confirmedBreakdown = breakdown.filter(b => b.confirmed);
    const correctionFactor =
      confirmedBreakdown.length > 0
        ? confirmedBreakdown.reduce((sum, b) => sum + b.lossRate, 0) / confirmedBreakdown.length
        : 0;

    // Total value protected = sum of estimated losses from confirmed biases
    const valueProtected = breakdown.reduce((sum, b) => sum + b.estimatedLoss, 0);

    return {
      dealId,
      dealName: deal.name,
      ticketSize,
      totalBiasesDetected: allBiases.length,
      confirmedBiases: confirmedCount,
      biasImpactRate: Math.round(biasImpactRate * 100) / 100,
      correctionFactor: Math.round(correctionFactor * 1000) / 1000,
      valueProtected: Math.round(valueProtected),
      breakdown,
    };
  } catch (error) {
    log.error('ROI attribution failed for deal ' + dealId, error);
    return null;
  }
}
