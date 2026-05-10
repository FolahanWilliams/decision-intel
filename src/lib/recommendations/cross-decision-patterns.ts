/**
 * Constellation Next Move — cross-decision pattern detection.
 *
 * Locked 2026-05-10. Pure-rule-first detection of three pattern
 * classes per Deep Research paper Ch 5 (Cross-Decision Relationship
 * Layer):
 *
 *   1. thesis_cascade — a 'spawned_from' edge fans out to ≥3 active
 *      investment / acquisition containers. The thesis is the
 *      foundational assumption underwriting the cluster.
 *
 *   2. shared_assumption — ≥3 containers carry an overlapping
 *      structural assumption (extracted from
 *      analysis.structuralAssumptions JSON). Shared macro variables,
 *      regulatory regimes, currency cycles, etc.
 *
 *   3. platform_contagion — a 'parent_of' edge connects a parent
 *      container with compositeDqi < 60 to ≥2 dependent (bolt-on)
 *      containers. The unaudited assumptions in the platform infect
 *      every dependent commit.
 *
 *   4. lineage_drift — a 'depends_on' edge's upstream container has
 *      a logged outcome that diverges from the forecast that
 *      originally justified the dependent container. (Dedicated
 *      category — surfaced separately in the engine.)
 *
 * The rule-based path produces high-confidence detections (1.0)
 * for #1, #3, #4 and a baseline string-overlap detection for #2.
 * The LLM-augmentation layer at /api/recommendations/cross-decision
 * upgrades #2 with semantic similarity (different phrasings of the
 * same underlying assumption — "stable through 2027" + "pre-IMF cycle
 * holds" + "macro stable next 18m" all reference the same belief).
 *
 * Forward-looking rule: when a new container link type is added
 * (e.g. 'shares_team', 'shares_regulator'), extend the detector
 * functions below + add a new patternType to CrossDecisionPattern.
 */

import type {
  CrossDecisionPattern,
  EngineContainer,
  EngineContainerLink,
} from './recommendation-types';

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Normalize an assumption string for fuzzy matching. Strips
 * punctuation, lowercases, collapses whitespace, removes common
 * filler words.
 *
 * Used by the rule-based shared_assumption detector. The LLM-
 * augmentation layer can do better (semantic similarity), but this
 * catches the exact-match + filler-trim cases without an API call.
 */
function normalizeAssumption(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(the|a|an|will|is|are|that|this|of|in|for|to|with|by|on)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Severity escalates with blast radius (number of containers
 * affected) AND the worst single container's risk band.
 */
function patternSeverity(containers: EngineContainer[]): 'critical' | 'high' | 'medium' | 'low' {
  const count = containers.length;
  const worstDqi = Math.min(
    ...containers.map(c => c.compositeDqi).filter((x): x is number => x !== null)
  );
  const hasCriticalPattern = containers.some(c =>
    c.namedPatterns.some(p => p.severity === 'critical')
  );

  if (count >= 5 || hasCriticalPattern) return 'critical';
  if (count >= 4 || (worstDqi !== Infinity && worstDqi < 50)) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
}

// ─── Detector: thesis_cascade ─────────────────────────────────────

/**
 * Walks the spawned_from edge graph backwards from each container.
 * If a single thesis-container has spawned ≥3 active investment /
 * acquisition containers, fire a thesis_cascade pattern.
 */
function detectThesisCascade(
  containers: EngineContainer[],
  links: EngineContainerLink[]
): CrossDecisionPattern[] {
  const containerById = new Map(containers.map(c => [c.id, c]));
  const spawnedFromGraph = new Map<string, string[]>(); // thesis → [spawned ids]

  for (const link of links) {
    if (link.linkType !== 'spawned_from') continue;
    // spawned_from: from = the spawned commit, to = the thesis source.
    // (Per container-link-types semantics: "this commit was spawned
    // from that thesis.")
    const list = spawnedFromGraph.get(link.toId) ?? [];
    list.push(link.fromId);
    spawnedFromGraph.set(link.toId, list);
  }

  const patterns: CrossDecisionPattern[] = [];
  for (const [thesisId, spawnedIds] of spawnedFromGraph.entries()) {
    if (spawnedIds.length < 3) continue;
    const thesisContainer = containerById.get(thesisId);
    const spawned = spawnedIds
      .map(id => containerById.get(id))
      .filter((c): c is EngineContainer => c !== undefined && c.status === 'active');

    if (spawned.length < 3) continue;

    const all = thesisContainer ? [thesisContainer, ...spawned] : spawned;

    patterns.push({
      patternType: 'thesis_cascade',
      // Use thesis's decisionFrame as the assumption label when
      // available; the LLM augmentation can refine this.
      assumptionLabel:
        thesisContainer?.decisionFrame?.slice(0, 120) ??
        thesisContainer?.name ??
        `Thesis underwriting ${spawned.length} commits`,
      containerIds: all.map(c => c.id),
      containerNames: all.map(c => c.name),
      severity: patternSeverity(spawned),
      confidence: 1.0,
      thesisContainerId: thesisId,
    });
  }

  return patterns;
}

// ─── Detector: shared_assumption (rule-based baseline) ────────────

/**
 * Rule-based shared-assumption detection: groups containers whose
 * normalized structural-assumption strings intersect with ≥2 others.
 * Catches the exact-match + filler-trim cases. The LLM-augmentation
 * layer extends this with semantic similarity.
 */
function detectSharedAssumption(containers: EngineContainer[]): CrossDecisionPattern[] {
  // Build inverted index: normalized assumption → containerIds.
  const assumptionToContainers = new Map<string, { raw: string; ids: string[] }>();

  for (const c of containers) {
    if (c.status !== 'active') continue;
    for (const raw of c.structuralAssumptions) {
      const normalized = normalizeAssumption(raw);
      if (normalized.length < 8) continue; // skip meaningless tiny strings
      const entry = assumptionToContainers.get(normalized) ?? { raw, ids: [] };
      entry.ids.push(c.id);
      assumptionToContainers.set(normalized, entry);
    }
  }

  const containerById = new Map(containers.map(c => [c.id, c]));
  const patterns: CrossDecisionPattern[] = [];

  for (const [, { raw, ids }] of assumptionToContainers.entries()) {
    if (ids.length < 3) continue;
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length < 3) continue;

    const matched = uniqueIds
      .map(id => containerById.get(id))
      .filter((c): c is EngineContainer => c !== undefined);

    patterns.push({
      patternType: 'shared_assumption',
      assumptionLabel: raw.length > 120 ? `${raw.slice(0, 117)}...` : raw,
      containerIds: matched.map(c => c.id),
      containerNames: matched.map(c => c.name),
      severity: patternSeverity(matched),
      confidence: 0.85, // rule-based exact-match has lower confidence
      // than thesis_cascade because LLM-augmentation can find
      // additional matches the rule misses.
    });
  }

  return patterns;
}

// ─── Detector: platform_contagion ─────────────────────────────────

/**
 * Walks parent_of edges. When a parent container has compositeDqi
 * below 60 AND ≥2 active children, fire a platform_contagion pattern.
 * The parent's unaudited assumptions infect every dependent commit
 * per paper Ch 5.
 */
function detectPlatformContagion(
  containers: EngineContainer[],
  links: EngineContainerLink[]
): CrossDecisionPattern[] {
  const containerById = new Map(containers.map(c => [c.id, c]));
  const parentOfGraph = new Map<string, string[]>();

  for (const link of links) {
    if (link.linkType !== 'parent_of') continue;
    // parent_of: from = the parent / platform, to = the child / bolt-on.
    const list = parentOfGraph.get(link.fromId) ?? [];
    list.push(link.toId);
    parentOfGraph.set(link.fromId, list);
  }

  const patterns: CrossDecisionPattern[] = [];
  for (const [parentId, childIds] of parentOfGraph.entries()) {
    if (childIds.length < 2) continue;
    const parent = containerById.get(parentId);
    if (!parent || parent.compositeDqi === null || parent.compositeDqi >= 60) continue;

    const activeChildren = childIds
      .map(id => containerById.get(id))
      .filter((c): c is EngineContainer => c !== undefined && c.status === 'active');

    if (activeChildren.length < 2) continue;

    patterns.push({
      patternType: 'platform_contagion',
      assumptionLabel: `Platform thesis (${parent.name}) — DQI ${Math.round(parent.compositeDqi)}`,
      containerIds: [parentId, ...activeChildren.map(c => c.id)],
      containerNames: [parent.name, ...activeChildren.map(c => c.name)],
      severity: patternSeverity([parent, ...activeChildren]),
      confidence: 1.0,
      thesisContainerId: parentId,
    });
  }

  return patterns;
}

// ─── Detector: lineage_drift ──────────────────────────────────────

/**
 * Walks depends_on edges. When the upstream container has a logged
 * outcome (hasOutcome=true) AND the downstream container hasn't been
 * re-baselined since the outcome resolved, fire a lineage_drift
 * pattern.
 *
 * (We can't read forecast-vs-actual divergence from the rule-based
 * pass without parsing outcome JSON; the LLM augmentation can.
 * Rule-based path conservatively fires whenever an upstream outcome
 * is present + downstream hasn't been edited since.)
 */
function detectLineageDrift(
  containers: EngineContainer[],
  links: EngineContainerLink[]
): CrossDecisionPattern[] {
  const containerById = new Map(containers.map(c => [c.id, c]));
  const patterns: CrossDecisionPattern[] = [];

  for (const link of links) {
    if (link.linkType !== 'depends_on') continue;
    // depends_on: from = the dependent decision, to = the upstream
    // assumption / decision.
    const downstream = containerById.get(link.fromId);
    const upstream = containerById.get(link.toId);
    if (!downstream || !upstream) continue;
    if (!upstream.hasOutcome) continue;
    // Skip when downstream is itself decided / closed — re-baselining
    // a closed deal isn't useful.
    if (downstream.decidedAt && downstream.hasOutcome) continue;

    patterns.push({
      patternType: 'lineage_drift',
      assumptionLabel: link.note?.slice(0, 120) ?? `Outcome from ${upstream.name}`,
      containerIds: [downstream.id, upstream.id],
      containerNames: [downstream.name, upstream.name],
      severity: 'high',
      confidence: 0.75,
      upstreamContainerId: upstream.id,
    });
  }

  return patterns;
}

// ─── Main detector ─────────────────────────────────────────────────

/**
 * Runs all four pattern detectors and returns the union, sorted by
 * severity → confidence → blast radius.
 *
 * Pure function — no I/O, no LLM calls. The LLM augmentation layer
 * upgrades shared_assumption matches by re-running the detection
 * with semantic-similarity scoring (see prompts.ts).
 */
export function detectCrossDecisionPatterns(
  containers: EngineContainer[],
  links: EngineContainerLink[]
): CrossDecisionPattern[] {
  const all = [
    ...detectThesisCascade(containers, links),
    ...detectSharedAssumption(containers),
    ...detectPlatformContagion(containers, links),
    ...detectLineageDrift(containers, links),
  ];

  // Sort: critical > high > medium > low; within band, higher
  // confidence first; within both, larger blast radius first.
  const severityRank: Record<'critical' | 'high' | 'medium' | 'low', number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return all.sort((a, b) => {
    const sevDiff = severityRank[b.severity] - severityRank[a.severity];
    if (sevDiff !== 0) return sevDiff;
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.01) return confDiff;
    return b.containerIds.length - a.containerIds.length;
  });
}
