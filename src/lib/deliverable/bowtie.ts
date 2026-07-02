/**
 * Bow-tie analysis — the killer buyer visual (locked 2026-07-02).
 *
 * The process-safety standard (bow-tie barrier analysis, ISO 31000-adjacent) a
 * risk committee reads on sight: each existential THREAT → the TOP EVENT (the
 * decision fails) → CONSEQUENCE, with PREVENTION barriers (left — stop the
 * threat becoming the event) and MITIGATION barriers (right — the circuit-
 * breakers that limit the consequence once it fires). A memo with no barriers
 * on either side is fragile — which is exactly the "confronts nothing =
 * fragile" un-inversion, now expressed in the language a committee already
 * trusts, as a diagram instead of a paragraph.
 *
 * Built DETERMINISTICALLY from the shipped detectors: strategic-nodes = the
 * threats (the conditions in the document), resilience-signature = the barriers
 * (the mechanisms that absorb a shock). Pure, no LLM, DISPLAY-ONLY (no DQI /
 * scoring / methodology change) — same class as strategicExposure.
 *
 * Two grounded verdict lines the buyer asks for, both structural (no future
 * needed):
 *  - CONVEXITY (Taleb): is the payoff CONCAVE — does a shock cost MORE than a
 *    symmetric gain? Concentration + irreversibility with nothing to cap the
 *    downside manufacture that asymmetry. It is a structural property of the
 *    commitment, not a forecast.
 *  - COUPLING (Perrow): how many conditions sit between the threat and the
 *    consequence with no buffer — and whether ANY barrier interrupts the chain.
 *
 * Honesty (the snowpack, not the snowflake): threats are CONDITIONS correlated
 * with a failure archetype, never a claim they caused an outcome. "Present" /
 * "missing" barriers describe what the document contains; they never predict
 * the trigger (execution / an exogenous shock, which is not in the memo).
 */

import type { DetectedStrategicNode, StrategicNodeClass } from './strategic-nodes';
import type { DetectedResilienceMarker, ResilienceDimension } from './resilience-signature';

/** The canonical barriers a risk committee expects to see — their ABSENCE is
 *  the finding. The prevention (stops the threat becoming the event) vs
 *  mitigation (limits the consequence after) split IS the bow-tie's two sides.
 *  Kept to the load-bearing few so "missing" means something. */
const CANONICAL_PREVENTION: readonly { dim: ResilienceDimension; label: string }[] = [
  { dim: 'staging', label: 'Staged / gated commitment' },
  { dim: 'disconfirmation', label: 'Disconfirmation / pre-mortem' },
  { dim: 'diversification', label: 'Diversified exposure' },
];
const CANONICAL_MITIGATION: readonly { dim: ResilienceDimension; label: string }[] = [
  { dim: 'exit_trigger', label: 'Named kill-trigger' },
  { dim: 'reserves', label: 'Contingency reserve' },
  { dim: 'reversibility', label: 'Reversible / two-way door' },
];

/** The undesired central event a strategic decision's threats converge on. */
export const BOWTIE_TOP_EVENT = 'The committed capital is not recovered';

/** Bounded, precision-first signal that a threat manufactures a CONCAVE payoff
 *  (Taleb): concentration, irreversibility, leverage, all-in / up-front commit. */
const ASYMMETRY_DRIVER =
  /concentrat|single (anchor|tenant|customer|counterparty|point)|substantially all|irreversib|take-or-pay|committed .{0,40}before|no definitive|all-in|leverage|upfront|up-front|before any (lease|tenant|contract)/i;

export interface BowtieBarrier {
  dimension: ResilienceDimension;
  label: string;
  present: boolean;
  /** The detected evidence phrase when present. */
  evidence?: string;
}

export interface BowtieThreat {
  id: string;
  label: string;
  class: StrategicNodeClass;
  /** Why this condition drives toward the top event (the node's `amplifies`). */
  drivesToEvent: string;
  /** The suppression edge — what the condition hid from the deciders, if any. */
  conceals?: string;
}

export interface BowtieAnalysis {
  threats: BowtieThreat[];
  topEvent: string;
  /** One line naming the downside if the top event fires. */
  consequence: string;
  prevention: BowtieBarrier[];
  mitigation: BowtieBarrier[];
  /** Canonical barriers absent — the actionable headline ("N of 6 missing"). */
  missingBarrierCount: number;
  totalCanonicalBarriers: number;
  convexity: {
    verdict: 'concave' | 'buffered' | 'insufficient_signal';
    line: string;
  };
  coupling: {
    degree: 'tight' | 'loose' | 'single';
    interrupted: boolean;
    line: string;
  };
}

function buildBarrierRow(
  canonical: readonly { dim: ResilienceDimension; label: string }[],
  markers: readonly DetectedResilienceMarker[]
): BowtieBarrier[] {
  return canonical.map(({ dim, label }) => {
    const found = markers.find(m => m.id === dim);
    return found
      ? { dimension: dim, label, present: true, evidence: found.evidence }
      : { dimension: dim, label, present: false };
  });
}

/**
 * Pure. Returns null when there is no existential threat to anchor the bow-tie
 * (nothing to diagram). Otherwise structures the SHIPPED detector output as a
 * bow-tie + the convexity / coupling verdicts.
 */
export function buildBowtie(
  threatNodes: readonly DetectedStrategicNode[],
  markers: readonly DetectedResilienceMarker[]
): BowtieAnalysis | null {
  if (threatNodes.length === 0) return null;

  const threats: BowtieThreat[] = threatNodes.map(n => ({
    id: n.id,
    label: n.label,
    class: n.class,
    drivesToEvent: n.amplifies,
    ...(n.conceals ? { conceals: n.conceals } : {}),
  }));

  const prevention = buildBarrierRow(CANONICAL_PREVENTION, markers);
  const mitigation = buildBarrierRow(CANONICAL_MITIGATION, markers);
  const totalCanonicalBarriers = prevention.length + mitigation.length;
  const missingBarrierCount =
    prevention.filter(b => !b.present).length + mitigation.filter(b => !b.present).length;

  // Convexity — is the payoff concave? A threat that concentrates or
  // irreversibly commits, with NO mitigation barrier to cap the downside.
  const asymmetryThreat = threatNodes.find(n =>
    ASYMMETRY_DRIVER.test(`${n.label} ${n.amplifies} ${n.evidence}`)
  );
  const hasMitigation = mitigation.some(b => b.present);
  let convexity: BowtieAnalysis['convexity'];
  if (!asymmetryThreat) {
    convexity = {
      verdict: 'insufficient_signal',
      line: 'No concentration or irreversibility signal detected — the payoff asymmetry cannot be read from the document.',
    };
  } else if (hasMitigation) {
    convexity = {
      verdict: 'buffered',
      line: `${asymmetryThreat.label} concentrates the downside, but a mitigation barrier is on record — the shock is partly capped rather than fully concave.`,
    };
  } else {
    convexity = {
      verdict: 'concave',
      line: `Concave payoff: ${asymmetryThreat.label.toLowerCase()} makes a shock cost more than a symmetric gain, with no reserve, exit, or reversibility to cap it.`,
    };
  }

  // Coupling — how many conditions cascade with no buffer between them.
  const interrupted = hasMitigation;
  let coupling: BowtieAnalysis['coupling'];
  if (threats.length >= 3 && !interrupted) {
    coupling = {
      degree: 'tight',
      interrupted,
      line: `Tightly coupled: ${threats.length} structural conditions with no circuit-breaker between them — one failure cascades into the rest.`,
    };
  } else if (threats.length === 1) {
    coupling = {
      degree: 'single',
      interrupted,
      line: 'A single dominant condition — the risk is concentrated in one place rather than cascading.',
    };
  } else {
    coupling = {
      degree: 'loose',
      interrupted,
      line: interrupted
        ? `${threats.length} conditions, but a mitigation barrier interrupts the chain before the consequence.`
        : `${threats.length} conditions — coupled, but short of the tight-coupling threshold.`,
    };
  }

  return {
    threats,
    topEvent: BOWTIE_TOP_EVENT,
    consequence:
      'Capital written down or repriced; the thesis breaks after the commitment is irreversible.',
    prevention,
    mitigation,
    missingBarrierCount,
    totalCanonicalBarriers,
    convexity,
    coupling,
  };
}
