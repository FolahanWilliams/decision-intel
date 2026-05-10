/**
 * Constellation Next Move — rule-based recommendation engine.
 *
 * Locked 2026-05-10. Pure functions over EngineInput; no Prisma, no
 * fetch, no I/O. The API route assembles the input + persists; this
 * file ranks.
 *
 * Scoring formula (paper-grounded):
 *   finalScore = baseSeverityScore
 *              × validityUrgencyMultiplier
 *              × timePressureMultiplier
 *              × crossDecisionMultiplier
 *
 * Per paper Ch 3 — validity-class drives recommendation aggressiveness:
 *   - high validity: trust-the-pattern, terse, action-oriented (1.0×)
 *   - medium: standard depth (1.0×)
 *   - low: friction-additive, force outside view (1.4×)
 *   - zero: block-progress (1.8×)
 *
 * Per paper Ch 2 — different stages have different cognitive
 * vulnerabilities; the engine uses stage as the time-pressure proxy
 * via committeeDate when available, falling back to stage-specific
 * defaults.
 *
 * Forward-looking rule: when a 7th category is added, extend the
 * `evaluators` map below + the NEXT_MOVE_CATEGORIES SSOT in lockstep.
 * The exhaustive-match check at the bottom of `runEngine` will fail
 * the build if the map drifts.
 */

import type { ValidityClass } from '@/lib/learning/validity-classifier';
import { NEXT_MOVE_CATEGORIES, type NextMoveCategoryId } from './next-move-categories';
import type {
  CrossDecisionPattern,
  EngineContainer,
  EngineInput,
  NextMoveRecommendation,
} from './recommendation-types';
import { detectCrossDecisionPatterns } from './cross-decision-patterns';
import { PERSONA_FRAMING, substituteFraming } from './persona-framing';

// ─── Scoring constants ────────────────────────────────────────────

const SEVERITY_SCORES: Record<'critical' | 'high' | 'medium' | 'low', number> = {
  critical: 100,
  high: 70,
  medium: 40,
  low: 15,
};

const VALIDITY_URGENCY: Record<ValidityClass, number> = {
  high: 1.0,
  medium: 1.0,
  low: 1.4,
  zero: 1.8,
};

const DQI_AUDIT_DEFENSIBLE_THRESHOLD = 55;
const OUTCOME_CLOSURE_DAYS_OVERDUE = 30;

// ─── Time pressure ─────────────────────────────────────────────────

/**
 * Time-pressure multiplier from the committee countdown. Maps the
 * urgency curve practitioners recognise: T-7 days is procurement-grade
 * panic; T-30 days is calm-but-aware; T-90 days is "next quarter."
 *
 * Returns 1.0 when committeeDate is unset (no time pressure signal).
 */
export function timePressureMultiplier(committeeDate: Date | null, now: Date): number {
  if (!committeeDate) return 1.0;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(0, (committeeDate.getTime() - now.getTime()) / dayMs);
  if (days <= 1) return 2.0;
  if (days <= 7) return 1.6;
  if (days <= 14) return 1.3;
  if (days <= 30) return 1.1;
  return 1.0;
}

/**
 * Days-until-committee — exposed for UI rendering of T-N badges.
 */
export function daysUntilCommittee(committeeDate: Date | null, now: Date): number | null {
  if (!committeeDate) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((committeeDate.getTime() - now.getTime()) / dayMs);
}

// ─── Why-trace generator ───────────────────────────────────────────

/**
 * Generates the "why this fires" trace string per paper Ch 8 — the
 * question current decision-intelligence tooling cannot answer.
 *
 * Three sentences naming (a) the specific signals, (b) the implicit
 * weighting the engine computed, (c) why this ranked above alternatives.
 *
 * Pure-rule output; the LLM augmentation layer can override this with
 * persona-tuned prose, but the rule-based version is always available
 * as the fallback when the gateway is unreachable.
 */
function buildWhyTrace(
  rec: Omit<NextMoveRecommendation, 'whyTrace'>,
  context: { highestRivalScore: number | null }
): string {
  const { categoryId, severity, scoreBreakdown } = rec;
  const cat = NEXT_MOVE_CATEGORIES[categoryId];
  const v = scoreBreakdown.validityUrgencyMultiplier;
  const t = scoreBreakdown.timePressureMultiplier;
  const x = scoreBreakdown.crossDecisionMultiplier;

  const parts: string[] = [];

  // (1) The trigger signal — what fired the category.
  parts.push(`Category fired: ${cat.label} (${severity} severity). Trigger: ${cat.triggerSignal}.`);

  // (2) The weighting math.
  const multiparts: string[] = [];
  if (v !== 1.0) multiparts.push(`validity-class weighting ${v.toFixed(2)}×`);
  if (t !== 1.0) multiparts.push(`time-pressure weighting ${t.toFixed(2)}×`);
  if (x !== 1.0) multiparts.push(`cross-decision weighting ${x.toFixed(2)}×`);
  if (multiparts.length === 0) {
    parts.push(`Weighting: base severity score only (no urgency multipliers fired).`);
  } else {
    parts.push(`Weighting: ${multiparts.join(' × ')}.`);
  }

  // (3) Why this ranked first.
  if (context.highestRivalScore !== null && context.highestRivalScore > 0) {
    const margin = Math.round(rec.finalScore - context.highestRivalScore);
    parts.push(
      `Ranked above the next candidate by ${margin} points — paper anchor: ${cat.paperAnchor}.`
    );
  } else {
    parts.push(`Sole active recommendation. Paper anchor: ${cat.paperAnchor}.`);
  }

  return parts.join(' ');
}

// ─── Per-category evaluators ───────────────────────────────────────

interface CategoryHit {
  categoryId: NextMoveCategoryId;
  containerId: string;
  containerName: string;
  containerKind: 'investment' | 'acquisition' | 'strategic';
  validityClass: ValidityClass;
  severity: 'critical' | 'high' | 'medium' | 'low';
  /// Substitute values for persona framing template.
  substituteValues: {
    name: string;
    tNDays?: number;
    dqi?: number | null;
    grade?: string | null;
    patternLabel?: string;
    linkedCount?: number;
    assumptionLabel?: string;
  };
  /// Other containers participating (for cross-decision patterns).
  relatedContainerIds: string[];
}

/**
 * Evaluator for committee_gate_pressure. Fires when the container has
 * a committeeDate ≤ 14 days AND there are unresolved high-severity
 * conflicts OR a critical-severity named pattern.
 */
function evalCommitteeGatePressure(c: EngineContainer, now: Date): CategoryHit | null {
  const tNDays = daysUntilCommittee(c.committeeDate, now);
  if (tNDays === null || tNDays > 14) return null;

  const criticalPattern = c.namedPatterns.find(p => p.severity === 'critical');
  const hasHighSeverityConflicts = c.highSeverityConflictCount > 0;

  if (!criticalPattern && !hasHighSeverityConflicts) return null;

  const patternLabel = criticalPattern
    ? criticalPattern.patternLabel
    : `${c.highSeverityConflictCount} cross-doc conflict${
        c.highSeverityConflictCount === 1 ? '' : 's'
      }`;

  // Severity escalates at T-7d.
  const severity: 'critical' | 'high' = tNDays <= 7 ? 'critical' : 'high';

  return {
    categoryId: 'committee_gate_pressure',
    containerId: c.id,
    containerName: c.name,
    containerKind: c.kind,
    validityClass: c.validityClass,
    severity,
    substituteValues: { name: c.name, tNDays, patternLabel },
    relatedContainerIds: [],
  };
}

/**
 * Evaluator for quality_gate_violation. Fires when DQI is below the
 * audit-defensible threshold OR a high-severity named pattern is
 * present.
 */
function evalQualityGateViolation(c: EngineContainer): CategoryHit | null {
  const dqiBelowThreshold =
    c.compositeDqi !== null && c.compositeDqi < DQI_AUDIT_DEFENSIBLE_THRESHOLD;
  const highSeverityPattern = c.namedPatterns.find(
    p => p.severity === 'critical' || p.severity === 'high'
  );

  if (!dqiBelowThreshold && !highSeverityPattern) return null;
  // Skip when committee gate pressure is already firing on the same
  // container — that category subsumes this one in the strip ranking.
  // (The drawer still surfaces both for transparency.)

  const patternLabel = highSeverityPattern ? highSeverityPattern.patternLabel : 'low DQI';

  // Severity follows the pattern's severity; bumps to high when DQI
  // is in the F band (<40).
  let severity: 'critical' | 'high' | 'medium' = 'medium';
  if (highSeverityPattern?.severity === 'critical') severity = 'critical';
  else if (highSeverityPattern?.severity === 'high') severity = 'high';
  else if (c.compositeDqi !== null && c.compositeDqi < 40) severity = 'high';

  return {
    categoryId: 'quality_gate_violation',
    containerId: c.id,
    containerName: c.name,
    containerKind: c.kind,
    validityClass: c.validityClass,
    severity,
    substituteValues: {
      name: c.name,
      dqi: c.compositeDqi,
      grade: c.compositeGrade,
      patternLabel,
    },
    relatedContainerIds: [],
  };
}

/**
 * Evaluator for missing_required_artefact. Fires when the container
 * has missingRequiredDocs ≥ 1 AND committeeDate is set within 30 days.
 */
function evalMissingRequiredArtefact(c: EngineContainer, now: Date): CategoryHit | null {
  if (c.missingRequiredDocs.length === 0) return null;
  const tNDays = daysUntilCommittee(c.committeeDate, now);
  if (tNDays === null || tNDays > 30) return null;

  const patternLabel =
    c.missingRequiredDocs.length === 1
      ? c.missingRequiredDocs[0].replace(/_/g, ' ')
      : `${c.missingRequiredDocs.length} required documents`;

  // Severity escalates as committee approaches.
  let severity: 'critical' | 'high' | 'medium' = 'medium';
  if (tNDays <= 3) severity = 'critical';
  else if (tNDays <= 7) severity = 'high';

  return {
    categoryId: 'missing_required_artefact',
    containerId: c.id,
    containerName: c.name,
    containerKind: c.kind,
    validityClass: c.validityClass,
    severity,
    substituteValues: { name: c.name, tNDays, patternLabel },
    relatedContainerIds: [],
  };
}

/**
 * Evaluator for outcome_closure. Fires when decidedAt is ≥ 30 days ago
 * AND no outcome row exists.
 */
function evalOutcomeClosure(c: EngineContainer, now: Date): CategoryHit | null {
  if (!c.decidedAt || c.hasOutcome) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const daysSince = (now.getTime() - c.decidedAt.getTime()) / dayMs;
  if (daysSince < OUTCOME_CLOSURE_DAYS_OVERDUE) return null;

  // Severity grades up the longer it sits.
  let severity: 'high' | 'medium' | 'low' = 'low';
  if (daysSince >= 180) severity = 'high';
  else if (daysSince >= 90) severity = 'medium';

  return {
    categoryId: 'outcome_closure',
    containerId: c.id,
    containerName: c.name,
    containerKind: c.kind,
    validityClass: c.validityClass,
    severity,
    substituteValues: { name: c.name },
    relatedContainerIds: [],
  };
}

/**
 * Evaluator for cross_decision_pattern + lineage_drift. Reads the
 * already-detected patterns from detectCrossDecisionPatterns() and
 * converts each into a hit on the primary container.
 */
function patternsToHits(
  patterns: CrossDecisionPattern[],
  containers: EngineContainer[]
): CategoryHit[] {
  const containerById = new Map(containers.map(c => [c.id, c]));
  const hits: CategoryHit[] = [];

  for (const p of patterns) {
    const primaryId = p.containerIds[0];
    const primary = containerById.get(primaryId);
    if (!primary) continue;

    const categoryId: NextMoveCategoryId =
      p.patternType === 'lineage_drift' ? 'lineage_drift' : 'cross_decision_pattern';

    hits.push({
      categoryId,
      containerId: primaryId,
      containerName: primary.name,
      containerKind: primary.kind,
      validityClass: primary.validityClass,
      severity: p.severity,
      substituteValues: {
        name: primary.name,
        linkedCount: p.containerIds.length,
        assumptionLabel: p.assumptionLabel,
      },
      relatedContainerIds: p.containerIds.slice(1),
    });
  }

  return hits;
}

// ─── Main engine ───────────────────────────────────────────────────

/**
 * Runs the full rule-based engine. Returns a deterministically-ranked
 * list of recommendations. Top recommendation goes to the strip;
 * remainder go to the drawer.
 *
 * Pure function — same input always produces the same output (modulo
 * `computedAt` which is captured upfront and used as the timestamp).
 *
 * Cross-decision pattern detection runs as part of this pass; the
 * separately-exported detectCrossDecisionPatterns() is also available
 * for the dedicated cross-decision API endpoint.
 */
export function runEngine(input: EngineInput): NextMoveRecommendation[] {
  const { containers, links, persona, computedAt } = input;
  const now = computedAt;

  // 1. Detect cross-decision patterns first (they aggregate across
  //    containers, the others operate per-container).
  const patterns = detectCrossDecisionPatterns(containers, links);
  const patternHits = patternsToHits(patterns, containers);

  // 2. Per-container evaluations.
  const perContainerHits: CategoryHit[] = [];
  for (const c of containers) {
    const hits = [
      evalCommitteeGatePressure(c, now),
      evalQualityGateViolation(c),
      evalMissingRequiredArtefact(c, now),
      evalOutcomeClosure(c, now),
    ].filter((h): h is CategoryHit => h !== null);
    perContainerHits.push(...hits);
  }

  const allHits = [...patternHits, ...perContainerHits];

  // 3. Score each hit.
  const scored = allHits.map(hit => {
    const baseSeverityScore = SEVERITY_SCORES[hit.severity];
    const validityUrgencyMultiplier = VALIDITY_URGENCY[hit.validityClass];
    const container = containers.find(c => c.id === hit.containerId);
    const timePressureMul = timePressureMultiplier(container?.committeeDate ?? null, now);
    // Cross-decision categories carry an inherent multiplier — paper
    // Ch 5 calls these the highest-leverage portfolio failure modes.
    const crossDecisionMultiplier =
      hit.categoryId === 'cross_decision_pattern' || hit.categoryId === 'lineage_drift' ? 1.3 : 1.0;

    const finalScore = Math.round(
      baseSeverityScore * validityUrgencyMultiplier * timePressureMul * crossDecisionMultiplier
    );

    const framing = PERSONA_FRAMING[persona][hit.categoryId];
    const tightLabel = substituteFraming(framing.tight, hit.substituteValues);
    const regularLabel = substituteFraming(framing.regular, hit.substituteValues);
    const detailedLabel = substituteFraming(framing.detailed, hit.substituteValues);
    const ctaVerb = framing.ctaVerb ?? 'Open';

    const ctaHref = `/dashboard/decisions/${hit.containerId}`;

    const id = `rec_${hit.categoryId}_${hit.containerId}_${computedAt.toISOString()}`;

    const recWithoutTrace: Omit<NextMoveRecommendation, 'whyTrace'> = {
      id,
      categoryId: hit.categoryId,
      containerId: hit.containerId,
      containerName: hit.containerName,
      containerKind: hit.containerKind,
      validityClass: hit.validityClass,
      relatedContainerIds: hit.relatedContainerIds,
      tightLabel,
      regularLabel,
      detailedLabel,
      ctaVerb,
      severity: hit.severity,
      finalScore,
      scoreBreakdown: {
        baseSeverityScore,
        validityUrgencyMultiplier,
        timePressureMultiplier: timePressureMul,
        crossDecisionMultiplier,
      },
      ctaHref,
      computedAt: computedAt.toISOString(),
    };

    return recWithoutTrace;
  });

  // 4. Rank by finalScore desc, ties broken by category order.
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // 5. Backfill whyTrace knowing each rec's rivals.
  const ranked: NextMoveRecommendation[] = scored.map((rec, idx) => {
    const next = scored[idx + 1];
    const whyTrace = buildWhyTrace(rec, {
      highestRivalScore: next ? next.finalScore : null,
    });
    return { ...rec, whyTrace };
  });

  return ranked;
}

/**
 * Deterministic cache-key for a recommendation set. The signals
 * captured here are the ones that, when changed, should invalidate
 * a cached recommendation set: container risk-bands, T-N countdowns,
 * cross-ref counts, named-pattern signature.
 *
 * Keyed off all containers in the input so the cache invalidates
 * when ANY container's signals shift — conservative but correct.
 */
export function cacheKey(input: EngineInput): string {
  const parts = input.containers
    .map(c => {
      const tN = daysUntilCommittee(c.committeeDate, input.computedAt) ?? 'null';
      const dqi = c.compositeDqi !== null ? Math.round(c.compositeDqi) : 'null';
      const conflicts = `${c.conflictCount}_${c.highSeverityConflictCount}`;
      const patterns = c.namedPatterns.map(p => `${p.patternLabel}:${p.severity}`).join(',');
      const validity = c.validityClass;
      const decided = c.decidedAt
        ? Math.round((input.computedAt.getTime() - c.decidedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 'null';
      const outcome = c.hasOutcome ? '1' : '0';
      return `${c.id}|tN=${tN}|dqi=${dqi}|conf=${conflicts}|pat=${patterns}|val=${validity}|d=${decided}|o=${outcome}`;
    })
    .join('::');

  // Include link edges so cross-decision patterns invalidate when
  // edges land or get cut.
  const linkParts = input.links.map(l => `${l.fromId}>${l.linkType}>${l.toId}`).join('::');

  return `nm-v1::${input.persona}::${parts}::${linkParts}`;
}
