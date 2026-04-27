/**
 * Nudge Engine — Choice Architecture for Enterprise Decisions
 *
 * Implements Thaler's Nudge Theory: small, contextual interventions that
 * redirect decisions without removing freedom. Nudges feel like a coach,
 * not a surveillance system.
 *
 * Design principles:
 * - Anonymous by default (individual profiles are private)
 * - Opt-in escalation
 * - Context-aware timing (never interrupt during active incidents)
 * - Gamification without shame (celebrates growth, doesn't punish error)
 */

import { createLogger } from '@/lib/utils/logger';
import type { NudgeDefinition, NudgeTriggerContext, NudgeSeverity } from '@/types/human-audit';
import type { BiasDetectionResult } from '@/types';
import type { NudgeThresholdCalibration } from '@/lib/learning/feedback-loop';
import { prisma } from '@/lib/prisma';

const log = createLogger('NudgeEngine');

/**
 * Evaluate a completed cognitive audit and generate any applicable nudges.
 *
 * Nudges are generated based on:
 * 1. Detected cognitive biases and their severity
 * 2. Team consensus patterns (groupthink detection)
 * 3. Historical consistency (noise measurement)
 * 4. Decision stakes (high-stakes decisions get pre-mortem triggers)
 * 5. Base rate divergence (escalation rates vs. historical norms)
 *
 * When calibration data is provided, nudge types that users consistently
 * mark as unhelpful are suppressed (behavioral data flywheel).
 */
export async function generateNudges(
  context: NudgeTriggerContext,
  calibration?: NudgeThresholdCalibration | null
): Promise<NudgeDefinition[]> {
  const nudges: NudgeDefinition[] = [];
  const { auditResult, decision, history } = context;

  // 1. Anchor Alert — repeated same-severity assessments
  const anchorNudge = checkAnchorPattern(auditResult.biasFindings, history);
  if (anchorNudge) nudges.push(anchorNudge);

  // 2. Dissent Prompt — unanimous agreement without deliberation
  const dissentNudge = checkConsensusTrap(auditResult);
  if (dissentNudge) nudges.push(dissentNudge);

  // 3. Base Rate Reminder — escalation rate diverges from historical norm
  const baseRateNudge = checkBaseRateDivergence(history);
  if (baseRateNudge) nudges.push(baseRateNudge);

  // 4. Pre-Mortem Trigger — high-stakes decision with no risk discussion
  const preMortemNudge = checkPreMortemNeed(context);
  if (preMortemNudge) nudges.push(preMortemNudge);

  // 5. Noise Check — inconsistent responses to similar incidents
  const noiseNudge = checkNoiseLevel(auditResult);
  if (noiseNudge) nudges.push(noiseNudge);

  // 6. Shallow Verification — cognitive misering detected
  const shallowNudge = checkCognitiveMisering(context);
  if (shallowNudge) nudges.push(shallowNudge);

  // 7. Toxic Combination — compound risk from co-occurring biases + context
  const toxicNudge = checkToxicCombination(auditResult);
  if (toxicNudge) nudges.push(toxicNudge);

  // 8. Graph Pattern Warning — decision shares bias patterns with recent failures in the graph
  const graphNudge = await checkGraphPattern(context);
  if (graphNudge) nudges.push(graphNudge);

  // 9. Committee Prior Gap — linked decision room has incomplete submissions
  const committeeNudge = await checkCommitteePriorGap(context);
  if (committeeNudge) nudges.push(committeeNudge);

  // Escalate critical nudges from Slack decisions to Slack delivery
  if (decision.source === 'slack' && decision.channel) {
    for (const nudge of nudges) {
      if (nudge.severity === 'critical') {
        nudge.channel = 'slack';
      }
    }
  }

  // Apply calibration: suppress nudge types users consistently find unhelpful
  const filteredNudges = calibration
    ? nudges.filter(nudge => {
        const threshold = calibration.thresholds[nudge.nudgeType];
        if (threshold?.suppressed) {
          log.info(
            `Suppressing ${nudge.nudgeType} nudge (helpfulRate=${threshold.helpfulRate}, n=${threshold.sampleSize})`
          );
          return false;
        }
        return true;
      })
    : nudges;

  // A/B test variant selection — apply experiment variants to generated nudges
  try {
    const { selectVariant } = await import('./ab-testing');
    for (let i = 0; i < filteredNudges.length; i++) {
      const assignment = await selectVariant(
        filteredNudges[i].nudgeType,
        ((context.decision as unknown as Record<string, unknown>)?.userId as string) || ''
      );
      if (assignment) {
        filteredNudges[i] = {
          ...filteredNudges[i],
          message: assignment.variant.template
            .replace('{original}', filteredNudges[i].message)
            .replace('{trigger}', filteredNudges[i].triggerReason),
          severity: (assignment.variant.severity || filteredNudges[i].severity) as NudgeSeverity,
          experimentId: assignment.experimentId,
          variantId: assignment.variant.id,
        };
      }
    }
  } catch (err) {
    log.warn('A/B variant selection failed (using default nudges):', err);
  }

  log.info(
    `Generated ${filteredNudges.length} nudge(s) for decision (${nudges.length - filteredNudges.length} suppressed by calibration)`
  );
  return filteredNudges;
}

// ─── Nudge Detectors ─────────────────────────────────────────────────────────

function checkAnchorPattern(
  biases: BiasDetectionResult[],
  history?: NudgeTriggerContext['history']
): NudgeDefinition | null {
  // Check if anchoring bias was detected with high confidence
  const anchoringBias = biases.find(
    b =>
      b.biasType.toLowerCase().includes('anchoring') &&
      (b.severity === 'high' || b.severity === 'critical')
  );

  if (!anchoringBias) return null;

  // Additional signal: repeated same-severity patterns in history
  const hasSamePattern =
    history?.lastNSeverities &&
    history.lastNSeverities.length >= 3 &&
    new Set(history.lastNSeverities).size === 1;

  const count = history?.lastNSeverities?.length ?? 0;

  return {
    nudgeType: 'anchor_alert',
    triggerReason: hasSamePattern
      ? `${count} consecutive incidents assessed at the same severity. Anchoring Bias detected with ${anchoringBias.severity} severity.`
      : `Anchoring Bias detected: "${anchoringBias.excerpt}"`,
    message: hasSamePattern
      ? `You've assessed ${count} consecutive incidents with the same severity as the first. Consider reassessing independently.`
      : `The first data point may be anchoring subsequent analysis. ${anchoringBias.suggestion}`,
    severity: anchoringBias.severity === 'critical' ? 'warning' : 'info',
    channel: 'dashboard',
  };
}

function checkConsensusTrap(
  auditResult: NudgeTriggerContext['auditResult']
): NudgeDefinition | null {
  if (!auditResult.teamConsensusFlag) return null;

  // Groupthink detection: unanimous agreement + groupthink bias found
  const groupthinkDetected = auditResult.biasFindings.some(b =>
    b.biasType.toLowerCase().includes('groupthink')
  );

  const severity: NudgeSeverity =
    groupthinkDetected && auditResult.dissenterCount === 0 ? 'warning' : 'info';

  return {
    nudgeType: 'dissent_prompt',
    triggerReason: `Unanimous agreement detected with ${auditResult.dissenterCount} dissenters. ${groupthinkDetected ? 'Groupthink bias also identified in the conversation.' : ''}`,
    message:
      "Unanimous agreement detected in under 30 seconds. Consider assigning a Devil's Advocate role to challenge assumptions before finalizing.",
    severity,
    channel: 'dashboard',
  };
}

function checkBaseRateDivergence(history?: NudgeTriggerContext['history']): NudgeDefinition | null {
  if (!history?.historicalBaseRate || !history?.recentEscalationRate) return null;

  const divergence = Math.abs(history.recentEscalationRate - history.historicalBaseRate);

  // Only nudge if escalation rate is significantly higher than base rate
  if (divergence < 15 || history.recentEscalationRate <= history.historicalBaseRate) {
    return null;
  }

  return {
    nudgeType: 'base_rate_reminder',
    triggerReason: `Current escalation rate (${history.recentEscalationRate}%) diverges significantly from historical base rate (${history.historicalBaseRate}%).`,
    message: `Historical base rate for this alert type: ${history.historicalBaseRate}% true positive. Your current escalation rate: ${history.recentEscalationRate}%. Consider whether recent events are biasing your judgment.`,
    severity: divergence > 30 ? 'warning' : 'info',
    channel: 'dashboard',
  };
}

function checkPreMortemNeed(context: NudgeTriggerContext): NudgeDefinition | null {
  const { decision, auditResult } = context;

  // Only trigger for high-stakes decision types
  const highStakesTypes = ['strategic', 'vendor_eval', 'approval'];
  if (decision.decisionType && !highStakesTypes.includes(decision.decisionType)) {
    return null;
  }

  // Low quality score + no pre-mortem discussion detected
  if (auditResult.decisionQualityScore > 60) return null;

  // Check if risk/failure language is absent from the content
  const riskTerms = /\b(risk|fail|concern|worry|downside|worst[- ]?case|what[- ]?if)\b/i;
  const hasRiskDiscussion = riskTerms.test(decision.content);

  if (hasRiskDiscussion) return null;

  return {
    nudgeType: 'pre_mortem_trigger',
    triggerReason: `High-stakes ${decision.decisionType || 'decision'} with quality score ${auditResult.decisionQualityScore}/100 and no risk discussion detected.`,
    message:
      'Before finalizing, consider: What would have to be true for this decision to fail catastrophically? No risk discussion was detected in the conversation.',
    severity: 'warning',
    channel: 'dashboard',
  };
}

function checkNoiseLevel(auditResult: NudgeTriggerContext['auditResult']): NudgeDefinition | null {
  if (!auditResult.noiseStats) return null;

  const { stdDev } = auditResult.noiseStats;

  // High noise = inconsistent decision quality
  if (stdDev < 15) return null;

  const consistencyScore = Math.max(0, Math.round(100 - stdDev * 4));

  return {
    nudgeType: 'noise_check',
    triggerReason: `Decision consistency score: ${consistencyScore}/100 (stdDev: ${stdDev}). Independent judges assessed this decision very differently.`,
    message: `Alert consistency score: ${consistencyScore}/100. This decision would likely receive different treatment from different reviewers. Consider establishing clearer criteria.`,
    severity: consistencyScore < 30 ? 'critical' : 'warning',
    channel: 'dashboard',
  };
}

function checkCognitiveMisering(context: NudgeTriggerContext): NudgeDefinition | null {
  const { auditResult, decision } = context;

  // Check if cognitive misering was explicitly detected by the bias detective
  const miseringBias = auditResult.biasFindings.find(
    b =>
      b.biasType.toLowerCase().includes('cognitive miser') ||
      b.biasType.toLowerCase().includes('misering')
  );

  // Also flag when a high-stakes decision has a short content length relative to its complexity
  // (indicator of shallow analysis — the decision was made too quickly with too little reasoning)
  const highStakesTypes = ['strategic', 'vendor_eval', 'approval'];
  const isHighStakes = decision.decisionType && highStakesTypes.includes(decision.decisionType);
  const wordCount = decision.content.split(/\s+/).length;
  const shallowHighStakes =
    isHighStakes && wordCount < 100 && auditResult.decisionQualityScore < 50;

  if (!miseringBias && !shallowHighStakes) return null;

  const severity: NudgeSeverity =
    miseringBias?.severity === 'critical' ||
    (shallowHighStakes && auditResult.decisionQualityScore < 30)
      ? 'critical'
      : 'warning';

  const reason = miseringBias
    ? `Cognitive Misering detected: "${miseringBias.excerpt}"`
    : `High-stakes ${decision.decisionType} decision with only ${wordCount} words of reasoning and quality score ${auditResult.decisionQualityScore}/100.`;

  return {
    nudgeType: 'shallow_verification',
    triggerReason: reason,
    message:
      'This decision shows signs of shallow analysis relative to its stakes. Before finalizing, verify key assumptions against the available evidence rather than accepting the first plausible conclusion.',
    severity,
    channel: 'dashboard',
  };
}

function checkToxicCombination(
  auditResult: NudgeTriggerContext['auditResult']
): NudgeDefinition | null {
  const biases = auditResult.biasFindings;
  if (biases.length < 2) return null;

  const biasTypes = biases.map(b => b.biasType.toLowerCase());
  const biasSet = new Set(biasTypes);

  // Check known toxic pairs inline (no async DB call — nudge engine is synchronous)
  const toxicPairs: Array<{
    biases: string[];
    label: string;
    contextCheck: () => boolean;
  }> = [
    {
      biases: ['groupthink', 'confirmation_bias'],
      label: 'The Echo Chamber',
      contextCheck: () => auditResult.dissenterCount === 0,
    },
    {
      biases: ['sunk_cost_fallacy', 'anchoring'],
      label: 'The Sunk Ship',
      contextCheck: () => true,
    },
    {
      biases: ['overconfidence_bias', 'confirmation_bias'],
      label: 'The Optimism Trap',
      contextCheck: () => true,
    },
    {
      biases: ['groupthink', 'authority_bias'],
      label: 'The Yes Committee',
      contextCheck: () => auditResult.teamConsensusFlag,
    },
  ];

  for (const pair of toxicPairs) {
    const allPresent = pair.biases.every(b => biasSet.has(b));
    if (!allPresent || !pair.contextCheck()) continue;

    const severities = pair.biases.map(
      bt => biases.find(b => b.biasType.toLowerCase() === bt)?.severity ?? 'low'
    );
    const hasCritical = severities.includes('critical') || severities.includes('high');

    return {
      nudgeType: 'toxic_combination',
      triggerReason: `Toxic combination "${pair.label}" detected: ${pair.biases.join(' + ')}. These biases compound each other's effect on decision quality.`,
      message: `Compound risk alert — "${pair.label}": ${pair.biases.join(' + ')} detected together. This bias combination historically correlates with significantly worse outcomes. Consider pausing to address each bias independently before proceeding.`,
      severity: hasCritical ? 'critical' : 'warning',
      channel: 'dashboard',
    };
  }

  // Generic check: 3+ high/critical biases = toxic regardless of type
  const severeCount = biases.filter(b => b.severity === 'high' || b.severity === 'critical').length;

  if (severeCount >= 3) {
    return {
      nudgeType: 'toxic_combination',
      triggerReason: `${severeCount} high/critical biases detected simultaneously: ${biases
        .filter(b => b.severity === 'high' || b.severity === 'critical')
        .map(b => b.biasType)
        .join(', ')}`,
      message: `Compound risk alert: ${severeCount} severe biases active simultaneously. Multiple high-severity biases compounding on each other substantially increase decision risk. Consider structured de-biasing before proceeding.`,
      severity: 'critical',
      channel: 'dashboard',
    };
  }

  return null;
}

// ─── Graph Pattern Nudge ──────────────────────────────────────────────────────

async function checkGraphPattern(context: NudgeTriggerContext): Promise<NudgeDefinition | null> {
  try {
    const decision = context.decision as unknown as Record<string, unknown>;
    const decisionId = decision?.id as string | undefined;
    const orgId = decision?.orgId as string | undefined;
    if (!decisionId || !orgId) return null;

    // Find edges connecting this decision to other nodes
    const edges = await prisma.decisionEdge.findMany({
      where: {
        orgId,
        OR: [{ sourceId: decisionId }, { targetId: decisionId }],
        edgeType: { in: ['shared_bias', 'escalated_from', 'similar_to'] },
      },
      select: { sourceId: true, targetId: true, edgeType: true, strength: true },
      take: 20,
    });

    if (edges.length < 1) return null;

    // 1-hop neighbors
    const hop1Ids = edges.map(e => (e.sourceId === decisionId ? e.targetId : e.sourceId));

    // 2-hop neighbors (expand the search radius)
    const hop2Edges = await prisma.decisionEdge.findMany({
      where: {
        orgId,
        OR: [{ sourceId: { in: hop1Ids } }, { targetId: { in: hop1Ids } }],
      },
      select: { sourceId: true, targetId: true, edgeType: true },
      take: 50,
    });

    const allConnectedIds = new Set(hop1Ids);
    for (const e of hop2Edges) {
      allConnectedIds.add(e.sourceId);
      allConnectedIds.add(e.targetId);
    }
    allConnectedIds.delete(decisionId);

    const failedOutcomes = await prisma.decisionOutcome.count({
      where: {
        analysisId: { in: [...allConnectedIds] },
        outcome: { in: ['failure', 'negative', 'poor'] },
      },
    });

    if (failedOutcomes === 0) return null;

    const failRate = failedOutcomes / allConnectedIds.size;
    const biasEdges = edges.filter(e => e.edgeType === 'shared_bias').length;
    const escalationEdges = edges.filter(e => e.edgeType === 'escalated_from').length;

    if (failRate < 0.3 && biasEdges < 2 && escalationEdges === 0) return null;

    const reasons: string[] = [];
    if (biasEdges > 0) reasons.push(`${biasEdges} shared bias pattern(s)`);
    if (escalationEdges > 0) reasons.push(`${escalationEdges} escalation chain(s)`);
    reasons.push(`${failedOutcomes} failed decision(s) within 2 hops`);

    return {
      nudgeType: 'graph_pattern_warning',
      triggerReason: reasons.join(', ') + ' in the knowledge graph.',
      message: `Graph analysis detected a concerning pattern: ${failedOutcomes} connected decision(s) within 2 hops ended in failure. ${escalationEdges > 0 ? 'This decision is part of an escalation chain. ' : ''}Review past outcomes before proceeding.`,
      severity: failRate >= 0.5 || escalationEdges > 0 ? 'critical' : 'warning',
      channel: 'dashboard',
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return null;
    log.warn('Graph pattern check failed (non-critical):', error);
    return null;
  }
}

/**
 * Standalone graph-nudge generator for document analyses.
 * Called from the post-analysis hook (after edge inference) to generate
 * graph-pattern nudges for analyses that aren't HumanDecisions.
 */
export async function checkGraphNudgesForAnalysis(
  analysisId: string,
  orgId: string | null
): Promise<number> {
  if (!orgId) return 0;

  try {
    const edges = await prisma.decisionEdge.findMany({
      where: {
        orgId,
        OR: [{ sourceId: analysisId }, { targetId: analysisId }],
        edgeType: { in: ['shared_bias', 'similar_to'] },
      },
      select: { sourceId: true, targetId: true, edgeType: true, strength: true },
      take: 20,
    });

    if (edges.length < 2) return 0;

    const connectedIds = edges.map(e => (e.sourceId === analysisId ? e.targetId : e.sourceId));

    const failedOutcomes = await prisma.decisionOutcome.count({
      where: {
        analysisId: { in: connectedIds },
        outcome: { in: ['failure', 'negative', 'poor'] },
      },
    });

    if (failedOutcomes === 0) return 0;

    const biasEdges = edges.filter(e => e.edgeType === 'shared_bias').length;
    if (biasEdges < 2) return 0;

    // Create nudge record directly (no HumanDecision pipeline)
    await prisma.nudge.create({
      data: {
        nudgeType: 'graph_pattern_warning',
        message: `Graph analysis: ${failedOutcomes} connected decision(s) with shared bias patterns ended in failure. This analysis shares ${biasEdges} bias pattern(s) with them.`,
        severity: failedOutcomes >= 2 ? 'critical' : 'warning',
        triggerReason: `Analysis ${analysisId} shares bias patterns with ${failedOutcomes} failed decision(s).`,
        channel: 'dashboard',
        // Link to a HumanDecision if one exists for this analysis, otherwise use a placeholder
        humanDecisionId: analysisId,
      },
    });

    return 1;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return 0;
    log.warn('Graph nudge check for analysis failed (non-critical):', error);
    return 0;
  }
}

// ─── 9. Committee Prior Gap ────────────────────────────────────────────────

/**
 * Detect when a decision is linked to a DecisionRoom where not all
 * committee members have submitted their blind priors.
 */
async function checkCommitteePriorGap(
  context: NudgeTriggerContext
): Promise<NudgeDefinition | null> {
  try {
    // Find open rooms linked to this decision's analysis
    const sourceRef = context.decision.sourceRef;
    if (!sourceRef) return null;

    const rooms = await prisma.decisionRoom.findMany({
      where: {
        status: 'open',
        OR: [{ analysisId: sourceRef }, { documentId: sourceRef }],
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            participants: true,
            blindPriors: true,
          },
        },
      },
      take: 1,
    });

    if (rooms.length === 0) return null;

    const room = rooms[0];
    const total = room._count.participants;
    const submitted = room._count.blindPriors;

    if (total <= 0 || submitted >= total) return null;

    const missing = total - submitted;
    const submissionRate = submitted / total;

    const severity: NudgeSeverity = submissionRate < 0.5 ? 'warning' : 'info';

    return {
      nudgeType: 'pre_decision_coaching',
      triggerReason: `Committee room "${room.title}": ${missing} of ${total} members haven't submitted priors`,
      message: `${missing} of ${total} committee members haven't submitted their blind priors yet for "${room.title}". Collect all perspectives before discussion to reduce groupthink.`,
      severity,
      channel: 'dashboard',
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return null;
    log.debug('Committee prior gap check skipped:', error);
    return null;
  }
}
