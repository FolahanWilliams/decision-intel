/**
 * Decision Pipeline Constellation — link types SSOT (locked 2026-05-09
 * evening, Phase 3.5 ship). Maps the four canonical edge types between
 * DecisionContainers. Edge model is COGNITIVE LINEAGE, not data lineage
 * (Palantir Foundry's trap per the master KB synthesis).
 *
 * Consumers:
 *   - prisma/schema.prisma                     — DecisionContainerLink.linkType validation
 *   - /api/containers/[id]/links/route.ts      — POST/DELETE links
 *   - /api/containers/constellation/route.ts   — list-all-edges read for the viz
 *   - components/constellation/*               — the longitudinal viz
 *
 * Forward-looking rule: when adding a 5th link type, every consumer
 * above updates in lockstep. The viz reads `LinkTypeMeta.color` so a
 * new type with a new color propagates automatically — never inline
 * hex in the viz.
 */
export const CONTAINER_LINK_TYPES = [
  'precedes',
  'spawned_from',
  'depends_on',
  'parent_of',
] as const;

export type ContainerLinkType = (typeof CONTAINER_LINK_TYPES)[number];

export interface LinkTypeMeta {
  id: ContainerLinkType;
  label: string;
  /** Plain-language explanation a CSO / GP would say in a meeting. */
  description: string;
  /** Verb that reads naturally in "A {verb} B" form. */
  fromLabel: string;
  /**
   * Procurement-grade workflow moment this edge captures. Drives the
   * empathy framing in the Add-Link picker.
   */
  workflowMoment: string;
  /**
   * Whether the edge is directional (default true). All four current
   * types are directional; left in the SSOT so a future symmetric
   * type can be modeled cleanly.
   */
  directional: boolean;
  /**
   * Visual style. Values are CSS-token-references — the viz reads via
   * `var(--severity-*)` / `var(--accent-*)`. Don't inline hex.
   */
  edgeColor: string;
  edgeStyle: 'solid' | 'dashed' | 'dotted';
}

export const CONTAINER_LINK_TYPE_META: Record<ContainerLinkType, LinkTypeMeta> = {
  precedes: {
    id: 'precedes',
    label: 'Precedes',
    description:
      'A came BEFORE B in the decision sequence. Used for escalation-of-commitment chains: capture how an early anchor shaped a later commit.',
    fromLabel: 'precedes',
    workflowMoment:
      'A deal you screened in Q2 anchored the IRR target for the deal you committed in Q4. The first decision shaped the second.',
    directional: true,
    edgeColor: 'var(--text-muted)',
    edgeStyle: 'solid',
  },
  spawned_from: {
    id: 'spawned_from',
    label: 'Spawned from',
    description:
      'B came FROM thesis A. The thesis-anchor edge. Master strategic frame → portfolio investment commits. The Cornerstone-magnetic edge — show 6 deals all spawned from one B2B-SaaS-EM thesis.',
    fromLabel: 'spawned from',
    workflowMoment:
      'You wrote a "B2B SaaS in Emerging Markets" thesis in 2026 H1. Six investment commits since then trace back to it. When the thesis breaks, every spawned commit is at risk.',
    directional: true,
    edgeColor: 'var(--accent-primary)',
    edgeStyle: 'solid',
  },
  depends_on: {
    id: 'depends_on',
    label: 'Depends on',
    description:
      'A rests on assumption B (Dalio structural determinant — debt cycle, governance regime, FX regime, trade share). Alert-ripple edge: if B breaks, every dependent A is at risk.',
    fromLabel: 'depends on',
    workflowMoment:
      'Four portfolio companies all depend on the "stable WAEMU debt cycle through 2027" assumption. When the assumption flips, you see four red edges fire at once.',
    directional: true,
    edgeColor: 'var(--severity-high)',
    edgeStyle: 'dashed',
  },
  parent_of: {
    id: 'parent_of',
    label: 'Parent of',
    description:
      'A is the strategic frame containing B as a sub-decision. Region rollout parent → market-by-market children. Or programmatic-acquisition strategy parent → individual add-on children.',
    fromLabel: 'parent of',
    workflowMoment:
      'A "DACH expansion 2026" strategic memo parents three add-on acquisitions in Germany. The parent is the macro decision; the children are tactics under it.',
    directional: true,
    edgeColor: 'var(--info)',
    edgeStyle: 'solid',
  },
};

export function getLinkTypeMeta(type: string): LinkTypeMeta | null {
  if ((CONTAINER_LINK_TYPES as readonly string[]).includes(type)) {
    return CONTAINER_LINK_TYPE_META[type as ContainerLinkType];
  }
  return null;
}

export function isValidLinkType(type: string): type is ContainerLinkType {
  return (CONTAINER_LINK_TYPES as readonly string[]).includes(type);
}
