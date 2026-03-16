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
 */
export function generateNudges(context: NudgeTriggerContext): NudgeDefinition[] {
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

  // Escalate critical nudges from Slack decisions to Slack delivery
  if (decision.source === 'slack' && decision.channel) {
    for (const nudge of nudges) {
      if (nudge.severity === 'critical') {
        nudge.channel = 'slack';
      }
    }
  }

  log.info(`Generated ${nudges.length} nudge(s) for decision`);
  return nudges;
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
  const riskTerms = /\b(risk|fail|concern|worry|downside|worst.?case|what.?if)\b/i;
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
