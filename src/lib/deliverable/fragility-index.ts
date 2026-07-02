/**
 * Structural fragility index — the SECOND AXIS (locked 2026-07-02).
 *
 * The five-case blind calibration proved the DQI measures RISK DENSITY (how bold
 * / unvalidated a bet is), not outcome — which is why it over-flagged the winners
 * (Amazon's 1997 S-1 scored the same 32 as a failure). Boldness is not the
 * killer; every frontier bet is bold. The discriminator is FRAGILITY: given a
 * shock — and one always comes — does the structure CASCADE (avalanche) or
 * ABSORB it (a survivable slide)? That question is answerable BLIND, because the
 * snowpack (the structure) is in the memo even though the snowflake (the trigger
 * — execution, an exogenous event) is not.
 *
 * This index combines the fragility conditions (strategic-nodes: concentration,
 * irreversibility, leverage, no-diligence, key-person) with the resilience
 * markers (staging, reserves, exit triggers, optionality, diversification) into
 * ONE 0-100 axis, orthogonal to the DQI:
 *
 *   high DQI-risk + LOW fragility  = a survivable bold bet (Amazon: bold but
 *                                     reversible, staged, optionality-rich)
 *   high DQI-risk + HIGH fragility = the avalanche zone (Fermi: concentrated,
 *                                     irreversible, un-buffered)
 *
 * That 2×2 is the discrimination a single score cannot produce.
 *
 * HONESTY: this scores the STRUCTURE (snowpack), never the TRIGGER (snowflake).
 * It does not predict the outcome; it measures whether a shock would cascade. And
 * it is a DISPLAY axis — it does NOT feed the DQI. Making fragility a first-class
 * score is a founder-gated methodology change, calibrated against the winner
 * signature (a held-out parity run is required). Pure — no I/O, no LLM.
 */

import type { DetectedStrategicNode } from './strategic-nodes';
import type { DetectedResilienceMarker, ResilienceDimension } from './resilience-signature';
import { RESILIENCE_DIMENSIONS } from './resilience-signature';

export type FragilityBand = 'absorbing' | 'mixed' | 'fragile' | 'avalanche_zone';

export interface StructuralFragility {
  /** 0-100, higher = more fragile (a shock is more likely to cascade into a write-down). */
  index: number;
  band: FragilityBand;
  /** The fragility conditions present (from the strategic-nodes detector). */
  fragilityDrivers: DetectedStrategicNode[];
  /** The resilience structures present (from the resilience detector). */
  resilienceMarkers: DetectedResilienceMarker[];
  /** The resilience dimensions ABSENT — the specific staging / reserve / exit
   *  trigger a buyer could ADD to make a bold bet survivable. The actionable half. */
  missingResilience: ResilienceDimension[];
  /** One-line human summary for the cover. */
  headline: string;
}

// Fragility contribution per strategic-node existential weight (1-3).
const FRAGILITY_POINTS: Record<number, number> = { 3: 22, 2: 13, 1: 7 };
// Resilience offset per marker weight (a circuit-breaker absorbs more than a buffer).
const RESILIENCE_POINTS: Record<number, number> = { 3: 16, 2: 10, 1: 6 };
// A memo can't be more than ~fully fragile from conditions alone; resilience can
// pull a bold-but-structured memo well down (but not below the floor — a genuinely
// concentrated + irreversible structure stays fragile even with some buffers).
const FRAGILITY_BASE_CAP = 92;
const RESILIENCE_OFFSET_CAP = 58;

function bandFor(index: number): FragilityBand {
  if (index < 25) return 'absorbing';
  if (index < 50) return 'mixed';
  if (index < 75) return 'fragile';
  return 'avalanche_zone';
}

const BAND_HEADLINE: Record<FragilityBand, string> = {
  absorbing:
    'Structurally resilient — the memo shows the staging, reserves, or exits that absorb a shock.',
  mixed: 'Mixed — some shock-absorbing structure, but gaps a single trigger could still exploit.',
  fragile:
    'Structurally fragile — a shock has a clear path to cascade; the circuit-breakers are thin.',
  avalanche_zone:
    'Avalanche zone — concentrated, irreversible, and un-buffered; one trigger takes the whole structure.',
};

export const FRAGILITY_BAND_LABEL: Record<FragilityBand, string> = {
  absorbing: 'Absorbing',
  mixed: 'Mixed',
  fragile: 'Fragile',
  avalanche_zone: 'Avalanche zone',
};

/**
 * Combine the fragility conditions and the resilience markers into the 0-100
 * structural-fragility axis. Deterministic and principled (weighted conditions
 * minus weighted resilience) — NOT fit to any specific case; the weights encode
 * decision-science (a company-ender condition weighs 22, a circuit-breaker
 * absorbs 16), so the ORDERING (Fermi-shape fragile, staged-resilient-shape
 * absorbing) falls out of the structure, not a hand-tuned constant.
 */
export function computeStructuralFragility(
  fragilityNodes: DetectedStrategicNode[],
  resilienceMarkers: DetectedResilienceMarker[]
): StructuralFragility {
  const fragilityBase = Math.min(
    FRAGILITY_BASE_CAP,
    fragilityNodes.reduce((sum, n) => sum + (FRAGILITY_POINTS[n.weight] ?? 10), 0)
  );
  const resilienceOffset = Math.min(
    RESILIENCE_OFFSET_CAP,
    resilienceMarkers.reduce((sum, m) => sum + (RESILIENCE_POINTS[m.weight] ?? 8), 0)
  );
  const index = Math.max(0, Math.min(100, Math.round(fragilityBase - resilienceOffset)));
  const band = bandFor(index);
  const present = new Set(resilienceMarkers.map(m => m.id));
  const missingResilience = RESILIENCE_DIMENSIONS.filter(d => !present.has(d));
  return {
    index,
    band,
    fragilityDrivers: fragilityNodes,
    resilienceMarkers,
    missingResilience,
    headline: BAND_HEADLINE[band],
  };
}
