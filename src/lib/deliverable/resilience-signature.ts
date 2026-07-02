/**
 * Resilience signature — the MISSING HALF of the structural engine (locked 2026-07-02).
 *
 * The fragility detectors in strategic-nodes.ts only PENALIZE — they name the
 * structural conditions that turn a shock into a write-down (concentration,
 * irreversibility, no reserves, no kill-switch). But the five-case blind
 * calibration proved the gap: every bold bet — Amazon and Fermi alike — fires
 * those, because boldness IS high risk density. What separates the avalanche
 * from the survivable slide is not the boldness; it is whether the STRUCTURE
 * absorbs the shock or cascades. This module detects the RESILIENCE side: the
 * staging, reversibility, reserves, optionality, kill-switches, diversification,
 * and disconfirmation loops that make a bold bet survivable — the structures the
 * engine never credited (Amazon was bold AND reversible/staged/optionality-rich;
 * Fermi was bold AND concentrated/irreversible/un-buffered).
 *
 * The honest boundary (the snowflake vs the snowpack): we do NOT detect the
 * trigger (execution, an exogenous shock — that is not in the memo). We detect
 * the SNOWPACK — the structural properties, visible in the document, that decide
 * whether a trigger cascades. Reversibility, staging, reserves, and optionality
 * are structurally visible; execution quality is not, and we never claim it.
 *
 * Pure — no I/O, no LLM, no scoring impact. Display-only (feeds the structural-
 * fragility index, a SECOND AXIS alongside the DQI, not the DQI itself).
 */

import { evidenceSnippet } from './strategic-nodes';

/** The canonical resilience dimensions — the mirror of the fragility conditions.
 *  Each is a structurally-visible property that absorbs a shock. */
export type ResilienceDimension =
  | 'staging'
  | 'reversibility'
  | 'exit_trigger'
  | 'reserves'
  | 'optionality'
  | 'diversification'
  | 'disconfirmation'
  | 'capital_access';

export interface ResilienceMarkerDef {
  id: ResilienceDimension;
  label: string;
  /** What shock this structure ABSORBS — the mirror of a fragility node's `amplifies`. */
  absorbs: string;
  /** Weight (1-3) — how much of a shock this absorbs. 3 = a primary circuit-breaker. */
  weight?: number;
  /** Detection patterns (bounded — precision-first, like the fragility detector). */
  signals: RegExp[];
}

export interface DetectedResilienceMarker {
  id: ResilienceDimension;
  label: string;
  absorbs: string;
  /** Weight (1-3) — drives the circuit-breaker-first ordering. */
  weight: number;
  /** The matched phrase, for provenance. */
  evidence: string;
}

export const RESILIENCE_MARKERS: ResilienceMarkerDef[] = [
  {
    id: 'staging',
    label: 'Staged / gated commitment',
    weight: 3,
    absorbs:
      'Capital released in tranches against milestones means a validation miss stops the next check — the loss is bounded to the stage, not the whole bet.',
    signals: [
      /\b(staged|phased|tranch\w+|milestone[-\s]?(based|gated|driven)|gated (funding|commitment|release|capital)|step[-\s]?wise|incremental (commitment|investment|rollout)|stage[-\s]?gate|pilot (before|then) (scal|roll)\w+)\b/i,
      /\b(release|commit|deploy|fund)\w*\b.{0,30}\b(in (stages|tranches|phases)|upon (milestones|validation|proof))\b/i,
    ],
  },
  {
    id: 'reversibility',
    label: 'Reversible / two-way door',
    weight: 3,
    absorbs:
      'A decision that can be unwound converts a catastrophic bet into a test — you exit before the loss compounds.',
    signals: [
      /\b(reversible|two[-\s]way door|can (be )?(unwound|reversed|rolled back)|unwind\w*|opt[-\s]?out|wind[-\s]?down option|test market|trial (period|run|market)|reversible commitment|can exit)\b/i,
    ],
  },
  {
    id: 'exit_trigger',
    label: 'Pre-defined exit / kill trigger',
    weight: 3,
    absorbs:
      'A named condition to abandon means someone is empowered to stop the cascade before it runs — the circuit-breaker the fragile structure lacks.',
    signals: [
      /\b(exit (trigger|criteri\w+|condition|ramp)|kill (criteri\w+|switch|condition)|stop[-\s]?loss|walk[-\s]?away (price|point|number)|off[-\s]?ramp|predefined trigger|circuit[-\s]?breaker|go\/no[-\s]?go)\b/i,
      /\babandon\w*\b.{0,20}\bif\b/i,
    ],
  },
  {
    id: 'reserves',
    label: 'Reserves / slack against the tail',
    weight: 2,
    absorbs:
      'A funded downside case and a buffer means the tail event is survivable — the shock hits the reserve, not the going-concern.',
    signals: [
      /\b(reserve\w*|contingency (fund|reserve|budget|plan)|capital (cushion|buffer|reserve)|margin of safety|downside (case )?(funded|reserved|provisioned)|rainy[-\s]?day|cushion|buffer|runway of)\b/i,
    ],
  },
  {
    id: 'optionality',
    label: 'Optionality / not bet-the-farm',
    weight: 2,
    absorbs:
      'A structure that creates options rather than one irreversible bet turns a downside into a pivot — upside from slack, not from leverage.',
    signals: [
      /\b(optionality|real option\w*|option to (expand|abandon|defer|scale|pivot)|call option on|adjacen\w+ (expansion|market|opportunit)|platform for|creates? options|preserv\w+ optionality)\b/i,
    ],
  },
  {
    id: 'diversification',
    label: 'Diversified / no single point of failure',
    weight: 2,
    absorbs:
      'Revenue, customers, or counterparties spread across many means one exit is a dent, not a collapse — the mirror of single-point concentration.',
    signals: [
      /\b(diversif\w+|no single (customer|tenant|counterparty|client|point of failure|source)|portfolio of (customers|tenants|assets|revenue|products)|multiple (independent )?(customers|tenants|revenue streams|counterparties|suppliers)|balanced (book|portfolio)|spread across (multiple|many))\b/i,
    ],
  },
  {
    id: 'disconfirmation',
    label: 'Disconfirmation / pre-mortem loop',
    weight: 2,
    absorbs:
      'A mechanism to detect being wrong — a pre-mortem, a red team, a leading indicator — means the error surfaces early, while it is still cheap to correct.',
    signals: [
      /\b(pre[-\s]?mortem|red[-\s]?team\w*|disconfirm\w+|what would prove (us|this|it) wrong|falsif\w+|kill the (idea|thesis|deal)|leading indicator\w*|early[-\s]warning (signal|indicator)|stage[-\s]?gate review|devil'?s advocate|steel[-\s]?man\w*)\b/i,
    ],
  },
  {
    id: 'capital_access',
    label: 'Capital access / can fund the downturn',
    weight: 1,
    absorbs:
      'The ability to raise or self-fund through a downturn means a liquidity shock is a bad quarter, not insolvency — the buffer leverage removes.',
    signals: [
      /\b(strong balance sheet|access to capital|cash reserves|can raise (capital|additional)|self[-\s]?funded|profitab\w+|positive (cash flow|free cash flow|operating cash)|well[-\s]?capitali\w+|ample liquidity|undrawn (facility|credit|revolver))\b/i,
    ],
  },
];

const SCAN_CAP = 200_000;
const MAX_MARKERS = 8;

/**
 * Detect the structural RESILIENCE markers present in a document. Pure, no I/O.
 * Precision-first (same discipline as the fragility detector); dedups by id;
 * caps at MAX_MARKERS, circuit-breakers first. Returns [] on empty input.
 */
export function detectResilienceMarkers(content: string): DetectedResilienceMarker[] {
  if (!content) return [];
  // Normalize whitespace so the bounded `.{0,N}` gaps span real line breaks.
  const text = content.slice(0, SCAN_CAP).replace(/\s+/g, ' ');
  const found = new Map<ResilienceDimension, DetectedResilienceMarker>();
  for (const def of RESILIENCE_MARKERS) {
    for (const re of def.signals) {
      const m = text.match(re);
      if (m && m.index != null) {
        found.set(def.id, {
          id: def.id,
          label: def.label,
          absorbs: def.absorbs,
          weight: def.weight ?? 2,
          evidence: evidenceSnippet(text, m.index, m[0].length),
        });
        break;
      }
    }
  }
  // Weight DESC — the primary circuit-breakers (staging, reversibility, exit) lead.
  return [...found.values()].sort((a, b) => b.weight - a.weight).slice(0, MAX_MARKERS);
}

/** The full canonical dimension list — used to compute what resilience is ABSENT
 *  (the actionable "add a staging / reserve / exit trigger to make it survivable"). */
export const RESILIENCE_DIMENSIONS: ResilienceDimension[] = RESILIENCE_MARKERS.map(m => m.id);

export const RESILIENCE_DIMENSION_LABEL: Record<ResilienceDimension, string> = Object.fromEntries(
  RESILIENCE_MARKERS.map(m => [m.id, m.label])
) as Record<ResilienceDimension, string>;
