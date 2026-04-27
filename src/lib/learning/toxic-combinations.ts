/**
 * Toxic Combination Detection — Wiz-Inspired Decision Risk Prioritizer
 *
 * Detects when multiple individually-benign biases co-occur with contextual
 * risk factors (time pressure, monetary stakes, absent dissent) to create
 * compound decision risk. Surfaces only the top ~5% of risky decisions,
 * eliminating "alert fatigue" — exactly how Wiz prioritizes cloud security.
 *
 * This is the deepest differentiator: competitors can flag individual biases,
 * but they cannot replicate org-calibrated compound risk scoring trained on
 * your actual decision outcomes.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { DEFAULT_BIAS_SEVERITY_WEIGHTS } from './constants';
import { computeSeedWeights, getSeedInteractionWeights } from '@/lib/data/seed-weights';
import {
  detectBeneficialPatterns,
  getBeneficialDampingFactor,
  type BeneficialPatternResult,
  type BeneficialContext,
} from './beneficial-patterns';

const log = createLogger('ToxicCombinations');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContextFactors {
  monetaryStakes: 'unknown' | 'low' | 'medium' | 'high' | 'very_high';
  dissentAbsent: boolean;
  timePressure: boolean;
  unanimousConsensus: boolean;
  participantCount: number;
  confidenceSpread: number | null; // from BlindPrior (narrow = anchoring risk)
  /** Whether the process actively encouraged dissent (from decision room data) */
  dissentEncouraged: boolean;
  /** Whether external advisors were involved */
  externalAdvisors: boolean;
  /** Whether an iterative decision process was used */
  iterativeProcess: boolean;
}

export interface ToxicComboResult {
  biasTypes: string[];
  contextFactors: ContextFactors;
  toxicScore: number;
  patternLabel: string | null;
  patternDescription: string | null;
  historicalFailRate: number | null;
  sampleSize: number;
  /** Auto-generated mitigation steps for this combination */
  mitigationPlaybook?: import('./toxic-mitigation').MitigationPlaybook;
  /** Estimated financial risk = ticketSize * historicalFailRate (if deal linked) */
  estimatedRiskAmount?: number;
  /** The deal's ticket size at time of detection */
  dealTicketSize?: number;
}

export interface DetectionResult {
  analysisId: string;
  combinations: ToxicComboResult[];
  threshold: number;
  flaggedCount: number;
  beneficialPatterns: BeneficialPatternResult[];
  beneficialDampingApplied: number;
}

// ─── Named Toxic Patterns (Built-In) ───────────────────────────────────────

interface NamedPattern {
  label: string;
  description: string;
  biasTypes: string[]; // all must be present
  contextRequired: Partial<ContextFactors>;
  baseScore: number; // 0-100 starting score before calibration
}

const NAMED_PATTERNS: NamedPattern[] = [
  {
    label: 'The Echo Chamber',
    description:
      'Groupthink + confirmation bias with no dissenting voices creates a self-reinforcing belief loop where challenging evidence is dismissed.',
    biasTypes: ['groupthink', 'confirmation_bias'],
    contextRequired: { dissentAbsent: true },
    baseScore: 85,
  },
  {
    label: 'The Sunk Ship',
    description:
      'Sunk cost fallacy + anchoring bias with high monetary stakes leads to doubling down on failing strategies because of prior investment.',
    biasTypes: ['sunk_cost_fallacy', 'anchoring_bias'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 80,
  },
  {
    label: 'The Blind Sprint',
    description:
      'Time pressure + availability heuristic + overconfidence leads to fast decisions based on easily recalled (but not necessarily relevant) information.',
    biasTypes: ['availability_heuristic', 'overconfidence_bias'],
    contextRequired: { timePressure: true },
    baseScore: 75,
  },
  {
    label: 'The Yes Committee',
    description:
      'Authority bias + groupthink with unanimous consensus means the most senior voice dominates and no one challenges the decision.',
    biasTypes: ['groupthink', 'authority_bias'],
    contextRequired: { unanimousConsensus: true },
    baseScore: 82,
  },
  {
    label: 'The Optimism Trap',
    description:
      'Overconfidence + confirmation bias + high stakes: decision-makers selectively gather supporting evidence while being overly confident in a high-stakes bet.',
    biasTypes: ['overconfidence_bias', 'confirmation_bias'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 78,
  },
  {
    label: 'The Status Quo Lock',
    description:
      'Status quo bias + anchoring + absent dissent: the team defaults to "how we\'ve always done it" with nobody pushing for change.',
    biasTypes: ['status_quo_bias', 'anchoring_bias'],
    contextRequired: { dissentAbsent: true },
    baseScore: 70,
  },
  {
    label: 'The Recency Spiral',
    description:
      'Recency bias + availability heuristic under time pressure: recent events disproportionately drive urgent decisions.',
    biasTypes: ['recency_bias', 'availability_heuristic'],
    contextRequired: { timePressure: true },
    baseScore: 72,
  },
  {
    label: 'The Golden Child',
    description:
      'Halo effect + confirmation bias + authority bias: a charismatic leader or prestigious brand creates an aura that blinds the team to red flags.',
    biasTypes: ['halo_effect', 'confirmation_bias', 'authority_bias'],
    contextRequired: {},
    baseScore: 82,
  },
  {
    label: 'The Doubling Down',
    description:
      "Gambler's fallacy + overconfidence + sunk cost: the belief that losses must reverse leads to escalating commitment on a losing position.",
    biasTypes: ['gamblers_fallacy', 'overconfidence_bias', 'sunk_cost_fallacy'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 85,
  },
  {
    label: 'The Deadline Panic',
    description:
      'Zeigarnik effect + planning fallacy under time pressure: incomplete-task anxiety compresses timelines and drives rushed decisions to achieve closure.',
    biasTypes: ['zeigarnik_effect', 'planning_fallacy'],
    contextRequired: { timePressure: true },
    baseScore: 78,
  },
];

// ─── Core Detection ─────────────────────────────────────────────────────────

/**
 * Detect toxic combinations for a completed analysis.
 *
 * 1. Fetches analysis biases + decision context (frame, audit, blind priors)
 * 2. Generates bias pairs/triples and checks against named + learned patterns
 * 3. Applies context amplifiers from decision metadata
 * 4. Applies org-specific calibration from CausalEdge weights
 * 5. Returns scored combinations sorted by toxicScore desc
 */
export async function detectToxicCombinations(
  analysisId: string,
  orgId: string | null
): Promise<DetectionResult> {
  try {
    // Fetch analysis with biases
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: true,
        document: {
          include: { decisionFrame: true },
        },
      },
    });

    if (!analysis || analysis.biases.length < 2) {
      return {
        analysisId,
        combinations: [],
        threshold: 50,
        flaggedCount: 0,
        beneficialPatterns: [],
        beneficialDampingApplied: 1.0,
      };
    }

    const biasTypes = analysis.biases.map(b => b.biasType.toLowerCase());
    const biasSet = new Set(biasTypes);

    // Gather context factors
    const context = await gatherContextFactors(analysisId, analysis, orgId);

    // Score against named patterns
    const combinations: ToxicComboResult[] = [];

    for (const pattern of NAMED_PATTERNS) {
      const matchingBiases = pattern.biasTypes.filter(bt => biasSet.has(bt));
      if (matchingBiases.length < pattern.biasTypes.length) continue;

      // Check context requirements
      if (!matchesContext(pattern.contextRequired, context)) continue;

      const calibratedScore = await calibrateScore(
        pattern.baseScore,
        pattern.biasTypes,
        context,
        orgId
      );

      combinations.push({
        biasTypes: pattern.biasTypes,
        contextFactors: context,
        toxicScore: calibratedScore,
        patternLabel: pattern.label,
        patternDescription: pattern.description,
        historicalFailRate: null, // populated by learned patterns
        sampleSize: 0,
      });
    }

    // Score against learned patterns (org-specific + global)
    const learnedPatterns = await prisma.toxicPattern.findMany({
      where: {
        OR: [{ orgId }, { orgId: null }],
      },
      orderBy: { failureRate: 'desc' },
    });

    for (const pattern of learnedPatterns) {
      const matchingBiases = pattern.biasTypes.filter(bt => biasSet.has(bt));
      if (matchingBiases.length < pattern.biasTypes.length) continue;

      // Check if this learned pattern's context matches
      const contextPattern = pattern.contextPattern as Partial<ContextFactors>;
      if (!matchesContext(contextPattern, context)) continue;

      // Don't duplicate named patterns
      const biasKey = [...pattern.biasTypes].sort().join('+');
      const isDuplicate = combinations.some(c => [...c.biasTypes].sort().join('+') === biasKey);
      if (isDuplicate) {
        // Enrich the existing combo with learned failure rate
        const existing = combinations.find(c => [...c.biasTypes].sort().join('+') === biasKey);
        if (existing) {
          existing.historicalFailRate = pattern.failureRate;
          existing.sampleSize = pattern.sampleSize;
          // Boost score if historical data confirms danger
          if (pattern.failureRate > 0.5) {
            existing.toxicScore = Math.min(100, existing.toxicScore * 1.15);
          }
        }
        continue;
      }

      // Convert failure rate to score (0-100)
      const baseScore = pattern.failureRate * 100;
      const calibratedScore = await calibrateScore(baseScore, pattern.biasTypes, context, orgId);

      combinations.push({
        biasTypes: pattern.biasTypes,
        contextFactors: context,
        toxicScore: calibratedScore,
        patternLabel: pattern.label,
        patternDescription: pattern.description,
        historicalFailRate: pattern.failureRate,
        sampleSize: pattern.sampleSize,
      });
    }

    // Fallback: If no learned patterns exist, use seed weights from failure case database
    if (learnedPatterns.length === 0) {
      try {
        const seedWeights = computeSeedWeights();
        const seedInteractions = getSeedInteractionWeights();

        for (const seed of seedWeights) {
          // Check if any bias pair from this seed pattern matches current biases
          const topPairs = Object.entries(seed.biasCooccurrence)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

          for (const [pairKey] of topPairs) {
            const [biasA, biasB] = pairKey.split('::');
            if (biasSet.has(biasA) && biasSet.has(biasB)) {
              const biasKey = [biasA, biasB].sort().join('+');
              const isDuplicate = combinations.some(
                c => [...c.biasTypes].sort().join('+') === biasKey
              );
              if (isDuplicate) continue;

              const interactionWeight = seedInteractions[pairKey] ?? 0.1;
              const baseScore = Math.min(85, seed.avgImpactScore * interactionWeight * 1.5);
              const calibratedScore = await calibrateScore(
                baseScore,
                [biasA, biasB],
                context,
                orgId
              );

              if (calibratedScore >= 35) {
                combinations.push({
                  biasTypes: [biasA, biasB],
                  contextFactors: context,
                  toxicScore: calibratedScore,
                  patternLabel: `${seed.patternLabel} (historical)`,
                  patternDescription: `Historical failure pattern "${seed.patternLabel}" — this bias combination appeared in ${seed.sampleSize} documented failure cases with avg impact ${seed.avgImpactScore}/100.`,
                  historicalFailRate: seed.baseFailureRate,
                  sampleSize: seed.sampleSize,
                });
              }
            }
          }
        }
      } catch (seedErr) {
        log.debug('Seed weights unavailable:', seedErr);
      }
    }

    // Generate ad-hoc pairs for biases not covered by patterns
    const coveredBiases = new Set(combinations.flatMap(c => c.biasTypes));
    const uncoveredBiases = biasTypes.filter(bt => !coveredBiases.has(bt));

    if (uncoveredBiases.length >= 2) {
      const pairs = generatePairs(uncoveredBiases);
      for (const pair of pairs) {
        const severitySum = pair.reduce((sum, bt) => {
          const bias = analysis.biases.find(b => b.biasType.toLowerCase() === bt);
          return sum + (DEFAULT_BIAS_SEVERITY_WEIGHTS[bias?.severity ?? 'low'] ?? 5);
        }, 0);

        const contextMultiplier = computeContextAmplifier(context);
        const adHocScore = Math.min(100, (severitySum / 60) * 50 * contextMultiplier);

        if (adHocScore >= 40) {
          combinations.push({
            biasTypes: pair,
            contextFactors: context,
            toxicScore: await calibrateScore(adHocScore, pair, context, orgId),
            patternLabel: null,
            patternDescription: null,
            historicalFailRate: null,
            sampleSize: 0,
          });
        }
      }
    }

    // Sort by score descending
    combinations.sort((a, b) => b.toxicScore - a.toxicScore);

    // Get adaptive threshold
    const threshold = await getOrgToxicThreshold(orgId);

    // Detect beneficial patterns from success case database
    const biasTypeStrings = biasTypes;
    const beneficialContext: Partial<BeneficialContext> = {
      dissentEncouraged: context.dissentEncouraged,
      externalAdvisors: context.externalAdvisors,
      iterativeProcess: context.iterativeProcess,
    };
    const beneficialResults = detectBeneficialPatterns(biasTypeStrings, beneficialContext);
    const dampingFactor = getBeneficialDampingFactor(beneficialResults);

    // Apply beneficial damping to toxic scores
    if (dampingFactor < 1.0) {
      for (const combo of combinations) {
        combo.toxicScore = Math.round(combo.toxicScore * dampingFactor);
      }
      combinations.sort((a, b) => b.toxicScore - a.toxicScore);
    }

    // Persist flagged combinations
    const flagged = combinations.filter(c => c.toxicScore >= threshold);
    if (flagged.length > 0) {
      await persistToxicCombinations(analysisId, orgId, flagged);
    }

    // Enrich flagged combinations with mitigation playbooks
    const { generateMitigationPlaybook } = await import('./toxic-mitigation');
    for (const combo of flagged) {
      combo.mitigationPlaybook = generateMitigationPlaybook(
        combo.patternLabel,
        combo.biasTypes,
        combo.contextFactors
      );
    }

    // Enrich with dollar impact estimation if deal is linked
    try {
      const dealLink = await prisma.document.findUnique({
        where: { id: analysis.documentId },
        select: { dealId: true, deal: { select: { ticketSize: true } } },
      });
      if (dealLink?.deal?.ticketSize) {
        const ticketSize = Number(dealLink.deal.ticketSize);
        for (const combo of flagged) {
          combo.dealTicketSize = ticketSize;
          if (combo.historicalFailRate != null && combo.historicalFailRate > 0) {
            combo.estimatedRiskAmount = Math.round(ticketSize * combo.historicalFailRate);
          }
        }
      }
    } catch {
      // Schema-drift tolerance per CLAUDE.md fire-and-forget exceptions — deal table may not exist in older deployments.
    }

    return {
      analysisId,
      combinations: flagged,
      threshold,
      flaggedCount: flagged.length,
      beneficialPatterns: beneficialResults,
      beneficialDampingApplied: dampingFactor,
    };
  } catch (error) {
    log.error('Failed to detect toxic combinations:', error);
    return {
      analysisId,
      combinations: [],
      threshold: 50,
      flaggedCount: 0,
      beneficialPatterns: [],
      beneficialDampingApplied: 1.0,
    };
  }
}

// ─── Context Gathering ──────────────────────────────────────────────────────

interface AnalysisWithRelations {
  id: string;
  documentId?: string;
  overallScore: number;
  outcomeDueAt: Date | null;
  document: {
    decisionFrame: {
      monetaryValue: unknown;
      stakeholders: string[];
    } | null;
  };
}

async function gatherContextFactors(
  analysisId: string,
  analysis: AnalysisWithRelations,
  _orgId: string | null
): Promise<ContextFactors> {
  const frame = analysis.document?.decisionFrame;

  // Monetary stakes
  let monetaryStakes: ContextFactors['monetaryStakes'] = 'unknown';
  if (frame?.monetaryValue != null) {
    const value = Number(frame.monetaryValue);
    if (value >= 1_000_000) monetaryStakes = 'very_high';
    else if (value >= 100_000) monetaryStakes = 'high';
    else if (value >= 10_000) monetaryStakes = 'medium';
    else monetaryStakes = 'low';
  }

  // Check for dissent and consensus from cognitive audits / decision rooms
  let dissentAbsent = false;
  let unanimousConsensus = false;
  let participantCount = frame?.stakeholders?.length ?? 0;
  let confidenceSpread: number | null = null;

  // Check decision rooms for blind priors
  try {
    const rooms = await prisma.decisionRoom.findMany({
      where: { analysisId },
      include: { blindPriors: true },
    });

    if (rooms.length > 0) {
      const room = rooms[0];
      const priors = room.blindPriors;
      if (priors.length > 0) {
        participantCount = Math.max(participantCount, priors.length);
        const confidences = priors.map(p => p.confidence);
        const maxConf = Math.max(...confidences);
        const minConf = Math.min(...confidences);
        confidenceSpread = maxConf - minConf;

        // Check action diversity
        const uniqueActions = new Set(priors.map(p => p.defaultAction.toLowerCase().trim()));
        unanimousConsensus = uniqueActions.size === 1 && priors.length >= 3;
      }
    }
  } catch {
    // Decision rooms data unavailable — continue with defaults
  }

  // Check cognitive audits for dissent
  try {
    const audits = await prisma.cognitiveAudit.findMany({
      where: {
        humanDecision: { linkedAnalysisId: analysisId },
      },
      select: { teamConsensusFlag: true, dissenterCount: true },
    });

    if (audits.length > 0) {
      dissentAbsent = audits.every(a => a.dissenterCount === 0);
      unanimousConsensus = unanimousConsensus || audits.some(a => a.teamConsensusFlag);
    }
  } catch {
    // Cognitive audit data unavailable — continue with defaults
  }

  // Time pressure: outcome due within 7 days or decision made very recently
  const timePressure =
    analysis.outcomeDueAt != null &&
    analysis.outcomeDueAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  // Beneficial context: dissent encouraged, external advisors, iterative process
  let dissentEncouraged = false;
  let externalAdvisors = false;
  let iterativeProcess = false;

  try {
    // Dissent encouraged: dissent was present AND decision completed (not suppressed)
    const rooms = await prisma.decisionRoom.findMany({
      where: { analysisId },
      include: { blindPriors: true },
    });
    if (rooms.length > 0) {
      const room = rooms[0];
      const priors = room.blindPriors;
      if (priors.length >= 3) {
        const uniqueActions = new Set(priors.map(p => p.defaultAction.toLowerCase().trim()));
        // Dissent encouraged = multiple viewpoints AND room completed
        dissentEncouraged = uniqueActions.size > 1 && room.status === 'completed';
      }
    }
  } catch {
    // Decision room data unavailable
  }

  try {
    // External advisors: check stakeholders for external roles
    const stakeholders = frame?.stakeholders ?? [];
    const externalIndicators = ['external', 'advisor', 'consultant', 'board', 'independent'];
    externalAdvisors = stakeholders.some(s =>
      externalIndicators.some(ind => s.toLowerCase().includes(ind))
    );

    // Also check if multiple distinct stakeholders participated (>6 suggests broad input)
    if (!externalAdvisors && stakeholders.length > 6) {
      externalAdvisors = true;
    }
  } catch {
    // External advisor data unavailable
  }

  try {
    // Iterative process: multiple analysis versions exist for the same document
    const analysisCount = await prisma.analysis.count({
      where: {
        documentId: (analysis as { documentId?: string }).documentId,
      },
    });
    iterativeProcess = analysisCount > 1;
  } catch {
    // Iteration data unavailable
  }

  return {
    monetaryStakes,
    dissentAbsent,
    timePressure,
    unanimousConsensus,
    participantCount,
    confidenceSpread,
    dissentEncouraged,
    externalAdvisors,
    iterativeProcess,
  };
}

// ─── Scoring ────────────────────────────────────────────────────────────────

function matchesContext(required: Partial<ContextFactors>, actual: ContextFactors): boolean {
  if (required.dissentAbsent && !actual.dissentAbsent) return false;
  if (required.unanimousConsensus && !actual.unanimousConsensus) return false;
  if (required.timePressure && !actual.timePressure) return false;
  if (required.monetaryStakes) {
    const stakeOrder = ['unknown', 'low', 'medium', 'high', 'very_high'];
    const requiredIdx = stakeOrder.indexOf(required.monetaryStakes);
    const actualIdx = stakeOrder.indexOf(actual.monetaryStakes);
    if (actualIdx < requiredIdx) return false;
  }
  return true;
}

function computeContextAmplifier(context: ContextFactors): number {
  let amplifier = 1.0;

  // Monetary stakes amplifier
  const stakeMultipliers: Record<string, number> = {
    unknown: 1.0,
    low: 1.0,
    medium: 1.2,
    high: 1.5,
    very_high: 2.0,
  };
  amplifier *= stakeMultipliers[context.monetaryStakes] ?? 1.0;

  // Absent dissent amplifier
  if (context.dissentAbsent) amplifier *= 1.3;

  // Unanimous consensus amplifier
  if (context.unanimousConsensus) amplifier *= 1.2;

  // Time pressure amplifier
  if (context.timePressure) amplifier *= 1.25;

  // Few participants amplifier (< 3 people = higher risk)
  if (context.participantCount > 0 && context.participantCount < 3) {
    amplifier *= 1.15;
  }

  // Narrow confidence spread (anchoring risk)
  if (context.confidenceSpread != null && context.confidenceSpread < 10) {
    amplifier *= 1.1;
  }

  // Cap at 3.0 to prevent extreme inflation
  return Math.min(3.0, amplifier);
}

/**
 * Apply org-specific calibration using CausalEdge weights.
 * If a bias has a high danger multiplier in this org, boost the toxic score.
 */
async function calibrateScore(
  baseScore: number,
  biasTypes: string[],
  context: ContextFactors,
  orgId: string | null
): Promise<number> {
  const contextMultiplier = computeContextAmplifier(context);
  let calibratedScore = baseScore * contextMultiplier;

  if (orgId) {
    try {
      const causalEdges = await prisma.causalEdge.findMany({
        where: {
          orgId,
          fromVar: { in: biasTypes },
          toVar: 'outcome',
        },
      });

      if (causalEdges.length > 0) {
        // Average danger from causal weights (negative strength = danger)
        const avgStrength =
          causalEdges.reduce((sum, e) => sum + e.strength, 0) / causalEdges.length;

        // Negative strength means bias correlates with poor outcomes
        // Scale: -1 (very dangerous) to +1 (actually helpful)
        // Convert to multiplier: 0.7 (helpful bias) to 1.5 (dangerous bias)
        const causalMultiplier = 1.0 + -avgStrength * 0.5;
        const clampedMultiplier = Math.max(0.7, Math.min(1.5, causalMultiplier));
        calibratedScore *= clampedMultiplier;
      }
    } catch {
      // CausalEdge data unavailable — use base score
    }
  }

  return Math.min(100, Math.round(calibratedScore * 10) / 10);
}

// ─── Threshold ──────────────────────────────────────────────────────────────

/**
 * Compute adaptive threshold for an org (95th percentile of recent toxicScores).
 * Falls back to 50 if insufficient data.
 */
export async function getOrgToxicThreshold(orgId: string | null): Promise<number> {
  const DEFAULT_THRESHOLD = 50;

  try {
    const recentCombos = await prisma.toxicCombination.findMany({
      where: {
        orgId: orgId ?? undefined,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: { toxicScore: true },
      orderBy: { toxicScore: 'asc' },
    });

    if (recentCombos.length < 10) return DEFAULT_THRESHOLD;

    // 95th percentile
    const idx = Math.floor(recentCombos.length * 0.95);
    return recentCombos[idx]?.toxicScore ?? DEFAULT_THRESHOLD;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}

// ─── Pattern Learning ───────────────────────────────────────────────────────

/**
 * Learn toxic patterns from historical outcome data.
 * Runs as a cron job to discover which bias combinations correlate with failures.
 *
 * Algorithm:
 * 1. Query all outcomes with biases for the org
 * 2. For each pair/triple of co-occurring biases, compute failure rate
 * 3. Filter for statistical significance (min 5 samples)
 * 4. Upsert ToxicPattern records
 */
export async function learnToxicPatterns(orgId: string): Promise<number> {
  try {
    // Fetch all outcomes with their analysis biases
    const outcomes = await prisma.decisionOutcome.findMany({
      where: { orgId },
      include: {
        analysis: {
          include: { biases: true },
        },
      },
    });

    if (outcomes.length < 10) {
      log.info(
        `Insufficient outcome data for org ${orgId} (${outcomes.length} outcomes, need 10+)`
      );
      return 0;
    }

    // Build co-occurrence stats
    const pairStats = new Map<
      string,
      { failures: number; successes: number; impactDeltas: number[] }
    >();

    // Compute time-weighted baseline success rate (consistent with per-pair temporal decay)
    let weightedSuccesses = 0;
    let totalWeight = 0;
    for (const o of outcomes) {
      const ageMs = Date.now() - new Date(o.reportedAt).getTime();
      const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
      const w = Math.exp(-0.05 * ageMonths);
      if (o.outcome === 'success') weightedSuccesses += w;
      totalWeight += w;
    }
    const baselineSuccessRate = totalWeight > 0 ? weightedSuccesses / totalWeight : 0;

    for (const outcome of outcomes) {
      const biasTypes: string[] = [
        ...new Set(
          outcome.analysis.biases.map((b: { biasType: string }) => b.biasType.toLowerCase())
        ),
      ] as string[];
      if (biasTypes.length < 2) continue;

      // Temporal decay: recent outcomes carry more weight (half-life ~14 months)
      const ageMs = Date.now() - new Date(outcome.reportedAt).getTime();
      const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
      const decayWeight = Math.exp(-0.05 * ageMonths);

      const pairs = generatePairs(biasTypes);
      const isFailure = outcome.outcome === 'failure';
      const isSuccess = outcome.outcome === 'success';

      for (const pair of pairs) {
        const key = pair.sort().join('+');
        const stats = pairStats.get(key) ?? { failures: 0, successes: 0, impactDeltas: [] };

        if (isFailure) {
          stats.failures += decayWeight;
          if (outcome.impactScore != null) {
            stats.impactDeltas.push(outcome.impactScore * decayWeight);
          }
        } else if (isSuccess) {
          stats.successes += decayWeight;
        }

        pairStats.set(key, stats);
      }
    }

    // Also build triple combination stats (B4: multi-bias interaction discovery)
    const tripleStats = new Map<
      string,
      { failures: number; successes: number; impactDeltas: number[] }
    >();

    for (const outcome of outcomes) {
      const tripleBiasTypes: string[] = [
        ...new Set(
          outcome.analysis.biases.map((b: { biasType: string }) => b.biasType.toLowerCase())
        ),
      ] as string[];
      if (tripleBiasTypes.length < 3) continue;

      // Temporal decay (same as pair stats)
      const tripleAgeMs = Date.now() - new Date(outcome.reportedAt).getTime();
      const tripleAgeMonths = tripleAgeMs / (1000 * 60 * 60 * 24 * 30.44);
      const tripleDecayWeight = Math.exp(-0.05 * tripleAgeMonths);

      const triples = generateTriples(tripleBiasTypes);
      const isFailure = outcome.outcome === 'failure';
      const isSuccess = outcome.outcome === 'success';

      for (const triple of triples) {
        const key = triple.sort().join('+');
        const stats = tripleStats.get(key) ?? { failures: 0, successes: 0, impactDeltas: [] };
        if (isFailure) {
          stats.failures += tripleDecayWeight;
          if (outcome.impactScore != null)
            stats.impactDeltas.push(outcome.impactScore * tripleDecayWeight);
        } else if (isSuccess) {
          stats.successes += tripleDecayWeight;
        }
        tripleStats.set(key, stats);
      }
    }

    // Filter for significant patterns and upsert (pairs + triples)
    let patternsCreated = 0;

    // Helper to upsert a pattern
    const upsertPattern = async (
      key: string,
      stats: { failures: number; successes: number; impactDeltas: number[] },
      combinationSize: number
    ) => {
      const total = stats.failures + stats.successes;
      if (total < (combinationSize === 3 ? 3 : 5)) return; // Lower threshold for triples

      const failureRate = stats.failures / total;
      const falsePositiveRate = stats.successes / total;

      // Skip patterns that don't perform worse than baseline
      if (failureRate <= baselineSuccessRate) return;

      const avgImpactDelta =
        stats.impactDeltas.length > 0
          ? stats.impactDeltas.reduce((s, v) => s + v, 0) / stats.impactDeltas.length
          : 0;

      const biasTypes = key.split('+');

      // Find if this matches a named pattern for labeling
      const namedMatch = NAMED_PATTERNS.find(
        np =>
          np.biasTypes.every(bt => biasTypes.includes(bt)) &&
          biasTypes.every(bt => np.biasTypes.includes(bt))
      );

      // B3: Apply false positive damping — if >30% of flagged patterns
      // ended up succeeding, reduce the pattern's effective score
      let adjustedFailureRate = failureRate;
      if (falsePositiveRate > 0.3) {
        adjustedFailureRate *= 1.0 - (falsePositiveRate - 0.3) * 0.5;
      }

      try {
        await prisma.toxicPattern.upsert({
          where: {
            id: `${orgId}-${key}`,
          },
          create: {
            id: `${orgId}-${key}`,
            orgId,
            biasTypes,
            contextPattern: {
              combinationSize,
              falsePositiveRate: Number(falsePositiveRate.toFixed(3)),
            },
            failureRate: Number(adjustedFailureRate.toFixed(3)),
            avgImpactDelta: Number(avgImpactDelta.toFixed(1)),
            sampleSize: total,
            label: namedMatch?.label ?? null,
            description:
              namedMatch?.description ??
              `Bias combination ${key} has a ${(adjustedFailureRate * 100).toFixed(0)}% failure rate in your organization${falsePositiveRate > 0.3 ? ` (adjusted for ${(falsePositiveRate * 100).toFixed(0)}% false positive rate)` : ''}.`,
          },
          update: {
            failureRate: Number(adjustedFailureRate.toFixed(3)),
            avgImpactDelta: Number(avgImpactDelta.toFixed(1)),
            sampleSize: total,
            contextPattern: {
              combinationSize,
              falsePositiveRate: Number(falsePositiveRate.toFixed(3)),
            },
          },
        });
        patternsCreated++;
      } catch (upsertError) {
        log.warn(`Failed to upsert pattern ${key}:`, upsertError);
      }
    };

    // Process pair patterns
    for (const [key, stats] of pairStats.entries()) {
      await upsertPattern(key, stats, 2);
    }

    // Process triple patterns (B4)
    for (const [key, stats] of tripleStats.entries()) {
      await upsertPattern(key, stats, 3);
    }

    log.info(`Learned ${patternsCreated} toxic patterns (pairs + triples) for org ${orgId}`);
    return patternsCreated;
  } catch (error) {
    log.error('Failed to learn toxic patterns:', error);
    return 0;
  }
}

// ─── Persistence ────────────────────────────────────────────────────────────

async function persistToxicCombinations(
  analysisId: string,
  orgId: string | null,
  combinations: ToxicComboResult[]
): Promise<void> {
  try {
    await prisma.toxicCombination.createMany({
      data: combinations.map(c => ({
        orgId,
        analysisId,
        biasTypes: c.biasTypes,
        contextFactors: JSON.parse(JSON.stringify(c.contextFactors)) as Prisma.InputJsonValue,
        toxicScore: c.toxicScore,
        historicalFailRate: c.historicalFailRate,
        sampleSize: c.sampleSize,
        patternLabel: c.patternLabel,
        status: 'active',
      })),
    });
  } catch (error) {
    log.error('Failed to persist toxic combinations:', error);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate all unique pairs from an array */
function generatePairs(items: string[]): string[][] {
  const pairs: string[][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

/** Generate all unique triples from an array */
function generateTriples(items: string[]): string[][] {
  const triples: string[][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      for (let k = j + 1; k < items.length; k++) {
        triples.push([items[i], items[j], items[k]]);
      }
    }
  }
  return triples;
}
