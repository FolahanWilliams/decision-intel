/**
 * Decision Quality Chain (Howard & Matheson)
 *
 * A process-quality companion to DQI. Where DQI scores the output of a
 * decision (bias load, noise, evidence), the DQ Chain scores the *process*
 * itself against the six elements from the Stanford Strategic Decisions
 * Group framework:
 *
 *   1. Frame             — is the decision framed correctly and scoped?
 *   2. Alternatives      — have meaningful, creative alternatives been generated?
 *   3. Information       — is the evidence reliable and sufficient?
 *   4. Values            — are the criteria and trade-offs explicit?
 *   5. Reasoning         — is the logical chain from evidence to choice sound?
 *   6. Commitment        — is there a concrete action and ownership?
 *
 * Chain principle: the chain is only as strong as its weakest link. Chain
 * score = minimum of the six element scores. A decision with five 90s and
 * one 20 scores 20, because the 20 will sink it in practice.
 *
 * Pure, deterministic function over fields that already exist on an
 * AnalysisResult. No external calls.
 */

import type {
  LogicalAnalysisResult,
  SwotAnalysisResult,
  CognitiveAnalysisResult,
} from '@/types';

export type DQChainElementId =
  | 'frame'
  | 'alternatives'
  | 'information'
  | 'values'
  | 'reasoning'
  | 'commitment';

export interface DQChainElement {
  id: DQChainElementId;
  label: string;
  score: number; // 0-100
  rationale: string;
  inputs: string[];
}

export interface DQChainResult {
  elements: DQChainElement[];
  chainScore: number;
  weakestLink: DQChainElementId;
  summary: string;
}

export interface DQChainInput {
  logicalAnalysis?: LogicalAnalysisResult;
  swotAnalysis?: SwotAnalysisResult;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  factCheck?: {
    totalClaims: number;
    verifiedClaims: number;
    contradictedClaims: number;
    score: number;
  };
  noiseStdDev?: number;
  biasCount?: number;
  hasDecisionFrame?: boolean;
  hasOwner?: boolean;
  hasDefaultAction?: boolean;
  preMortemCount?: number;
}

const LABELS: Record<DQChainElementId, string> = {
  frame: 'Frame',
  alternatives: 'Alternatives',
  information: 'Information',
  values: 'Values',
  reasoning: 'Reasoning',
  commitment: 'Commitment',
};

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function scoreFrame(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 50; // default if nothing to go on
  const hasFrame = !!input.hasDecisionFrame;
  if (hasFrame) {
    score += 25;
    inputs.push('explicit decision frame present on document');
  } else {
    inputs.push('no explicit decision frame captured');
  }
  const logicScore = input.logicalAnalysis?.score;
  if (typeof logicScore === 'number') {
    // High logic score implies the argument is well-framed; pull toward it.
    score = Math.round((score + logicScore) / 2);
    inputs.push(`logical analysis score ${logicScore}`);
  }
  const conclusion = input.logicalAnalysis?.conclusion;
  if (conclusion && conclusion.length > 20) {
    score += 10;
    inputs.push('explicit conclusion extracted from text');
  }
  return {
    id: 'frame',
    label: LABELS.frame,
    score: clamp(score),
    rationale: hasFrame
      ? 'Decision frame and conclusion are explicit, which is the strongest signal of a well-scoped decision.'
      : 'No explicit frame on the document. Scope, constraints, and success criteria are inferred rather than stated.',
    inputs,
  };
}

function scoreAlternatives(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 30;
  const swot = input.swotAnalysis;
  if (swot) {
    const breadth =
      (swot.strengths?.length || 0) +
      (swot.weaknesses?.length || 0) +
      (swot.opportunities?.length || 0) +
      (swot.threats?.length || 0);
    score += Math.min(40, breadth * 4);
    inputs.push(`SWOT breadth of ${breadth} items`);
  } else {
    inputs.push('no SWOT analysis available');
  }
  const counter = input.cognitiveAnalysis?.counterArguments?.length || 0;
  if (counter > 0) {
    score += Math.min(30, counter * 10);
    inputs.push(`${counter} explicit counter-arguments`);
  }
  return {
    id: 'alternatives',
    label: LABELS.alternatives,
    score: clamp(score),
    rationale:
      counter > 0
        ? 'Counter-arguments and SWOT show meaningful alternatives were considered, not just the recommended path.'
        : 'Few or no alternatives surfaced. Classic single-path recommendation is the most common failure mode at this stage.',
    inputs,
  };
}

function scoreInformation(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 50;
  const fc = input.factCheck;
  if (fc && fc.totalClaims > 0) {
    score = fc.score;
    inputs.push(
      `fact-check: ${fc.verifiedClaims}/${fc.totalClaims} verified, ${fc.contradictedClaims} contradicted`
    );
  } else {
    inputs.push('no verifiable claims detected');
  }
  const blindSpots = input.cognitiveAnalysis?.blindSpots?.length || 0;
  if (blindSpots > 0) {
    score -= Math.min(25, blindSpots * 5);
    inputs.push(`${blindSpots} blind spots flagged`);
  }
  return {
    id: 'information',
    label: LABELS.information,
    score: clamp(score),
    rationale:
      fc && fc.totalClaims > 0
        ? 'Information quality reflects the fact-check verification rate penalised by unaddressed blind spots.'
        : 'Information quality is uncertain because no verifiable claims were detected in the document.',
    inputs,
  };
}

function scoreValues(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 40;
  const strategicAdvice =
    input.logicalAnalysis?.institutionalMemory?.strategicAdvice ||
    input.swotAnalysis?.strategicAdvice;
  if (strategicAdvice && strategicAdvice.length > 30) {
    score += 25;
    inputs.push('strategic advice / criteria present');
  }
  const hasDefault = !!input.hasDefaultAction;
  if (hasDefault) {
    score += 20;
    inputs.push('default action captured on frame');
  }
  const assumptions = input.logicalAnalysis?.assumptions?.length || 0;
  if (assumptions > 0) {
    score += Math.min(15, assumptions * 5);
    inputs.push(`${assumptions} assumptions made explicit`);
  }
  return {
    id: 'values',
    label: LABELS.values,
    score: clamp(score),
    rationale:
      hasDefault || strategicAdvice
        ? 'Values and criteria are articulated via explicit strategic advice or a captured default action.'
        : 'Values are implicit. No articulated trade-offs or success criteria make it hard to know what counts as a good outcome.',
    inputs,
  };
}

function scoreReasoning(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 80;
  const logicScore = input.logicalAnalysis?.score;
  if (typeof logicScore === 'number') {
    score = Math.round((score + logicScore) / 2);
    inputs.push(`logical fallacy score ${logicScore}`);
  }
  const biasCount = input.biasCount ?? 0;
  if (biasCount > 0) {
    score -= Math.min(65, biasCount * 4);
    inputs.push(`${biasCount} cognitive biases detected`);
  }
  const noise = input.noiseStdDev ?? 0;
  if (noise > 0) {
    score -= Math.min(25, noise * 3);
    inputs.push(`judge noise stdDev ${noise.toFixed(2)}`);
  }
  return {
    id: 'reasoning',
    label: LABELS.reasoning,
    score: clamp(score),
    rationale:
      biasCount > 3
        ? 'Reasoning is the weakest link when multiple biases and high judge noise compound on top of each other.'
        : 'Reasoning reflects the inverse of detected bias load and noise, softened by the logical fallacy score.',
    inputs,
  };
}

function scoreCommitment(input: DQChainInput): DQChainElement {
  const inputs: string[] = [];
  let score = 30;
  if (input.hasOwner) {
    score += 30;
    inputs.push('owner assigned');
  }
  if (input.hasDefaultAction) {
    score += 25;
    inputs.push('default action locked');
  }
  if ((input.preMortemCount ?? 0) > 0) {
    score += 15;
    inputs.push(`${input.preMortemCount} pre-mortem scenarios prepared`);
  }
  return {
    id: 'commitment',
    label: LABELS.commitment,
    score: clamp(score),
    rationale:
      input.hasOwner && input.hasDefaultAction
        ? 'Commitment is concrete: the action is locked in and an owner is accountable.'
        : 'Commitment is soft. Without a named owner and a locked default action, the decision degrades to a discussion.',
    inputs,
  };
}

export function computeDQChain(input: DQChainInput): DQChainResult {
  const elements: DQChainElement[] = [
    scoreFrame(input),
    scoreAlternatives(input),
    scoreInformation(input),
    scoreValues(input),
    scoreReasoning(input),
    scoreCommitment(input),
  ];
  let weakest = elements[0];
  for (const e of elements) {
    if (e.score < weakest.score) weakest = e;
  }
  const chainScore = weakest.score;
  const summary =
    chainScore >= 75
      ? `Strong chain across all six elements. Weakest link is ${weakest.label} at ${weakest.score}.`
      : chainScore >= 50
        ? `Chain is bottlenecked by ${weakest.label} (${weakest.score}). Fix this link before the decision is committed.`
        : `Chain is critically weak at ${weakest.label} (${weakest.score}). The rest of the chain cannot compensate.`;
  return {
    elements,
    chainScore,
    weakestLink: weakest.id,
    summary,
  };
}
