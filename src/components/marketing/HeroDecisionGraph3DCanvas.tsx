'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  GraphCanvas,
  type GraphCanvasRef,
  type GraphNode,
  type GraphEdge,
  type NodeRendererProps,
  type InternalGraphNode,
  type Theme,
  useSelection,
} from 'reagraph';
import {
  SlowOrbit,
  ResetViewButton,
  useEdgeNarrativeReveal,
  withNarrativeTheme,
} from '@/components/visualizations/reagraph-helpers';

// ─── Shared types (exported so parent can access .data) ──────────────────────

export interface NodeDetail {
  title: string;
  severity?: string;
  excerpt: string;
  insight: string;
}

export interface NodeData {
  type: 'decision' | 'bias' | 'outcome';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  detail: NodeDetail;
}

// ─── Color palette ───────────────────────────────────────────────────────────

const BIAS_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
} as const;

function getNodeColor(data: NodeData): string {
  if (data.type === 'decision') return '#60A5FA';
  if (data.type === 'outcome') return '#A78BFA';
  return BIAS_COLORS[data.severity ?? 'medium'];
}

// ─── Static graph data (WeWork S-1 case study) ───────────────────────────────

const NODES: GraphNode[] = [
  // ─── Decisions (the calls WeWork leadership made) ──────────────────────────
  {
    id: 'ipo_decision',
    label: 'IPO at $47B',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'IPO at $47B Valuation',
        excerpt:
          'WeWork filed its S-1 in August 2019 seeking a $47B public market valuation — despite losing $1.9B on $1.8B in revenue.',
        insight:
          'Decision Intel flags: Revenue-to-loss ratio of 0.95x with no path to profitability documented in the filing. Valuation anchored entirely to SoftBank\u2019s private round, not public market comparables.',
      },
    } satisfies NodeData,
  },
  {
    id: 'governance',
    label: 'Governance Structure',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'Governance Structure',
        excerpt:
          'CEO Adam Neumann held supervoting shares (20 votes each), personally leased buildings back to WeWork, and trademarked "We" — then charged the company $5.9M for the rights.',
        insight:
          'Decision Intel flags: 3 simultaneous self-dealing conflicts. Zero independent board oversight on related-party transactions. Governance risk score: Critical.',
      },
    } satisfies NodeData,
  },
  {
    id: 'unit_economics',
    label: 'Community Adj. EBITDA',
    size: 8,
    data: {
      type: 'decision',
      detail: {
        title: 'Unit Economics Model',
        excerpt:
          'WeWork\'s S-1 introduced "Community Adjusted EBITDA" — excluding rent, marketing, G&A, and construction. Actual GAAP losses: $1.9B in 2018, accelerating.',
        insight:
          'Decision Intel flags: Non-standard financial metric designed to obscure losses. When a company invents its own profitability measure, the framing bias is structural.',
      },
    } satisfies NodeData,
  },
  {
    id: 'softbank_reliance',
    label: 'SoftBank Dependence',
    size: 7,
    data: {
      type: 'decision',
      detail: {
        title: 'Reliance on SoftBank Capital',
        excerpt:
          'Between 2017 and 2019, SoftBank and its Vision Fund poured $10.65B into WeWork, becoming both majority investor and sole price-setter across 4 consecutive rounds.',
        insight:
          'Decision Intel flags: Single-investor dependency creates valuation without discovery. Private rounds anchored at $20B \u2192 $45B \u2192 $47B with no independent market input.',
      },
    } satisfies NodeData,
  },
  {
    id: 'adjacency_bets',
    label: 'WeGrow + WeLive',
    size: 6.5,
    data: {
      type: 'decision',
      detail: {
        title: 'Unrelated Adjacency Expansion',
        excerpt:
          'While bleeding cash on the core business, WeWork launched WeGrow (a $42K/yr private school run by Neumann\'s wife), WeLive (co-living), and acquired Meetup for $200M and Flatiron School for $50M.',
        insight:
          'Decision Intel flags: Scope sprawl while unprofitable. Each adjacency consumed capital and management attention with no clear synergy to core office-leasing economics.',
      },
    } satisfies NodeData,
  },
  {
    id: 'self_dealing',
    label: '"We" Trademark Sale',
    size: 6.5,
    data: {
      type: 'decision',
      detail: {
        title: 'Self-Dealing Trademark Transaction',
        excerpt:
          'Neumann personally trademarked "We" and sold the rights to WeWork for $5.9M in stock as part of the IPO name change to "The We Company" \u2014 then reversed it after public backlash.',
        insight:
          'Decision Intel flags: Founder extracting personal rent from the company he controls. A pattern auditors classify as elevated fraud risk even when legal.',
      },
    } satisfies NodeData,
  },

  // ─── Biases (the cognitive gaps Decision Intel would have flagged) ─────────
  {
    id: 'overconfidence',
    label: 'Overconfidence',
    size: 7,
    data: {
      type: 'bias',
      severity: 'critical',
      detail: {
        title: 'Overconfidence Bias',
        severity: 'Critical',
        excerpt:
          '"We are a community company\u2026 We dedicate this to the energy of we \u2014 greater than any one of us, but inside each of us." \u2014 WeWork S-1 preamble.',
        insight:
          'Spiritual language in an SEC filing signals detachment from financial reality. The S-1 mentioned "community" 150+ times but contained no credible path to profitability.',
      },
    } satisfies NodeData,
  },
  {
    id: 'authority',
    label: 'Authority Bias',
    size: 7,
    data: {
      type: 'bias',
      severity: 'critical',
      detail: {
        title: 'Authority Bias',
        severity: 'Critical',
        excerpt:
          'SoftBank\'s $18.5B backing created an aura of inevitability. Board members and investors deferred to Neumann\'s vision without challenging unit economics.',
        insight:
          'SoftBank\'s outsized investment anchored the entire market on a single investor\'s thesis. No independent valuation challenged the $47B figure until the S-1 went public.',
      },
    } satisfies NodeData,
  },
  {
    id: 'halo_effect',
    label: 'Halo Effect',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Halo Effect',
        severity: 'High',
        excerpt:
          'Neumann\'s charisma, celebrity endorsements, and "tech disruptor" narrative masked a traditional real estate subletting business with negative unit economics.',
        insight:
          'The company was classified as a tech company (high multiple) rather than real estate (low multiple). This framing inflated valuation by 5\u201310x versus comparable REITs.',
      },
    } satisfies NodeData,
  },
  {
    id: 'anchoring',
    label: 'Anchoring',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Anchoring Bias',
        severity: 'High',
        excerpt:
          'The $47B valuation was anchored to SoftBank\'s January 2019 funding round. No DCF model or comparable analysis supported the figure in the S-1.',
        insight:
          'Private market valuations set by a single dominant investor are not market prices. Public market investors rejected the anchor immediately \u2014 valuation fell 83% before IPO was pulled.',
      },
    } satisfies NodeData,
  },
  {
    id: 'groupthink',
    label: 'Groupthink',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Groupthink',
        severity: 'High',
        excerpt:
          'The board included Neumann\'s allies and SoftBank representatives. No independent director raised concerns about self-dealing or losses until after the S-1 backlash.',
        insight:
          'Zero documented dissent in board minutes prior to filing. When 100% of a board agrees on a $47B valuation for a money-losing company, that\'s a groupthink signal, not consensus.',
      },
    } satisfies NodeData,
  },
  {
    id: 'sunk_cost',
    label: 'Sunk Cost',
    size: 6,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Sunk Cost Fallacy',
        severity: 'High',
        excerpt:
          'SoftBank\'s $10.65B already committed shaped every subsequent decision. Pulling support would have forced a write-down; doubling down preserved the paper valuation \u2014 temporarily.',
        insight:
          'Decision Intel flags: When prior capital becomes the reason to deploy more capital, Softbank\u2019s \u201crescue round\u201d was economically inevitable but strategically catastrophic.',
      },
    } satisfies NodeData,
  },
  {
    id: 'escalation',
    label: 'Escalation of Commitment',
    size: 6,
    data: {
      type: 'bias',
      severity: 'high',
      detail: {
        title: 'Escalation of Commitment',
        severity: 'High',
        excerpt:
          'After the IPO failure, SoftBank deployed an additional $9.5B in a rescue package \u2014 including a $1.7B exit payout to Neumann \u2014 rather than accept the loss.',
        insight:
          'Decision Intel flags: The rescue package was less about WeWork\'s fundamentals than about protecting SoftBank\'s existing book value and Vision Fund marketing narrative.',
      },
    } satisfies NodeData,
  },
  {
    id: 'narrative_fallacy',
    label: 'Narrative Fallacy',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'medium',
      detail: {
        title: 'Narrative Fallacy',
        severity: 'Medium',
        excerpt:
          'The "elevate the world\'s consciousness" mission was repeated by investors, analysts, and press as if it were a business model, not a slogan.',
        insight:
          'A compelling story about transformation replaced rigorous analysis about margins. When the narrative outperforms the spreadsheet, that\u2019s always a bias signal.',
      },
    } satisfies NodeData,
  },
  {
    id: 'planning_fallacy',
    label: 'Planning Fallacy',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'medium',
      detail: {
        title: 'Planning Fallacy',
        severity: 'Medium',
        excerpt:
          'S-1 projections assumed continued 100%+ revenue growth and path-to-profitability by 2023. Actual: revenue growth decelerated sharply post-COVID; true profitability still not achieved by 2024.',
        insight:
          'Decision Intel flags: Linear extrapolation of peak-growth metrics in a capital-hungry cyclical business. Every long-lease commitment became a liability when demand softened.',
      },
    } satisfies NodeData,
  },
  {
    id: 'self_serving',
    label: 'Self-Serving Bias',
    size: 5.5,
    data: {
      type: 'bias',
      severity: 'medium',
      detail: {
        title: 'Self-Serving Bias',
        severity: 'Medium',
        excerpt:
          'Neumann attributed growth to his "consciousness" vision and losses to macro conditions \u2014 never to the unit-economics structure or his own capital allocation choices.',
        insight:
          'Success internalized, failure externalized. This asymmetry appears in 87% of the strategic memos Decision Intel has audited from organizations that later suffered major write-downs.',
      },
    } satisfies NodeData,
  },

  // ─── Outcomes (what actually happened) ─────────────────────────────────────
  {
    id: 'ipo_pulled',
    label: 'IPO Pulled',
    size: 6.5,
    data: {
      type: 'outcome',
      detail: {
        title: 'IPO Withdrawn (Sept 30, 2019)',
        excerpt:
          'Six weeks after the S-1 filed, WeWork pulled the IPO. Proposed valuation had collapsed from $47B to $8B in that window \u2014 the fastest private-to-public repricing in recent memory.',
        insight:
          'Every bias flagged above was detectable from the S-1 alone \u2014 before a single public share was sold. The public market just did in six weeks what the board should have done in six months.',
      },
    } satisfies NodeData,
  },
  {
    id: 'neumann_ousted',
    label: 'Neumann Ousted',
    size: 6,
    data: {
      type: 'outcome',
      detail: {
        title: 'Neumann Removed as CEO',
        excerpt:
          'Adam Neumann stepped down as CEO on Sept 24, 2019, then fully departed with a controversial exit package: ~$1.7B in cash, stock buyout, and consulting fees.',
        insight:
          'The "good governance" reversal came only after public-market scrutiny forced it. A Decision Intel audit would have surfaced the governance risks 18 months earlier, when they were cheap to fix.',
      },
    } satisfies NodeData,
  },
  {
    id: 'softbank_writedown',
    label: 'SoftBank $10B Write-Down',
    size: 6.5,
    data: {
      type: 'outcome',
      detail: {
        title: 'SoftBank Vision Fund $10B+ Write-Down',
        excerpt:
          'By late 2020, SoftBank had written down its WeWork stake by more than $10B. The Vision Fund reported its largest-ever quarterly loss, largely attributed to WeWork exposure.',
        insight:
          'A $10B loss tracks to a sequence of documented board-meeting decisions. Each decision, individually, was defensible. In aggregate, they were a catastrophe \u2014 which is exactly what the Knowledge Graph surfaces.',
      },
    } satisfies NodeData,
  },
  {
    id: 'valuation_collapse',
    label: '$39B Destroyed',
    size: 7.5,
    data: {
      type: 'outcome',
      detail: {
        title: '$39B Valuation Destruction',
        excerpt:
          'Within 6 weeks of the S-1 filing, WeWork\'s valuation dropped from $47B to $8B. By its 2021 SPAC merger, market cap was $9B; by 2023, WeWork filed for Chapter 11 bankruptcy.',
        insight:
          'This is what unaudited decision-making costs. Every bias flagged here was detectable from the S-1 document alone \u2014 before a single public share was sold.',
      },
    } satisfies NodeData,
  },
  {
    id: 'echo_chamber',
    label: 'Echo Chamber',
    size: 6,
    data: {
      type: 'outcome',
      detail: {
        title: 'Echo Chamber Pattern',
        excerpt:
          'Groupthink + Authority Bias created a closed feedback loop. SoftBank\'s conviction reinforced the board\'s confidence, which reinforced Neumann\'s vision, which reinforced SoftBank.',
        insight:
          'Toxic combination: When the largest investor, the board, and the CEO all validate each other without external challenge, the probability of catastrophic failure increases 4.2x.',
      },
    } satisfies NodeData,
  },
  {
    id: 'bankruptcy',
    label: 'Chapter 11 (2023)',
    size: 6.5,
    data: {
      type: 'outcome',
      detail: {
        title: 'Chapter 11 Bankruptcy Filing',
        excerpt:
          'WeWork filed for bankruptcy protection on November 6, 2023, listing $15B+ in assets and $18.6B in debt. Lease obligations \u2014 the core business model \u2014 exceeded revenue generation capacity.',
        insight:
          'The long-lease / short-sublease mismatch was a structural risk documented in the S-1 and every subsequent 10-K. No audit flagged it as existential. Decision Intel would have.',
      },
    } satisfies NodeData,
  },
];

const EDGES: GraphEdge[] = [
  // ─── Decision \u2192 bias (dashed, gray) ────────────────────────────────────────
  { id: 'e1', source: 'ipo_decision', target: 'overconfidence', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e2', source: 'ipo_decision', target: 'anchoring', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e3', source: 'ipo_decision', target: 'authority', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e4', source: 'governance', target: 'authority', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e5', source: 'governance', target: 'groupthink', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e6', source: 'unit_economics', target: 'overconfidence', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e7', source: 'unit_economics', target: 'halo_effect', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e14', source: 'unit_economics', target: 'narrative_fallacy', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e15', source: 'softbank_reliance', target: 'anchoring', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e16', source: 'softbank_reliance', target: 'sunk_cost', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e17', source: 'softbank_reliance', target: 'authority', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e18', source: 'adjacency_bets', target: 'overconfidence', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e19', source: 'adjacency_bets', target: 'planning_fallacy', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e20', source: 'self_dealing', target: 'self_serving', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e21', source: 'self_dealing', target: 'groupthink', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e22', source: 'governance', target: 'self_serving', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },
  { id: 'e23', source: 'ipo_decision', target: 'narrative_fallacy', fill: '#CBD5E1', dashed: true, arrowPlacement: 'end' },

  // ─── Toxic bias combinations (solid red, labeled) ──────────────────────────
  { id: 'e8', source: 'groupthink', target: 'authority', fill: '#DC2626', size: 2.5, label: 'Echo Chamber', arrowPlacement: 'end' },
  { id: 'e9', source: 'overconfidence', target: 'halo_effect', fill: '#DC2626', size: 2.5, label: 'Optimism Trap', arrowPlacement: 'end' },
  { id: 'e24', source: 'sunk_cost', target: 'escalation', fill: '#DC2626', size: 2.5, label: 'Doubling Down', arrowPlacement: 'end' },
  { id: 'e25', source: 'narrative_fallacy', target: 'halo_effect', fill: '#DC2626', size: 2.5, label: 'Story Over Signal', arrowPlacement: 'end' },

  // ─── Bias \u2192 outcome (purple, causal) ─────────────────────────────────────
  { id: 'e10', source: 'overconfidence', target: 'valuation_collapse', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e11', source: 'anchoring', target: 'valuation_collapse', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e12', source: 'authority', target: 'echo_chamber', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e13', source: 'groupthink', target: 'echo_chamber', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e26', source: 'halo_effect', target: 'ipo_pulled', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e27', source: 'groupthink', target: 'neumann_ousted', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e28', source: 'escalation', target: 'softbank_writedown', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e29', source: 'sunk_cost', target: 'softbank_writedown', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },
  { id: 'e30', source: 'planning_fallacy', target: 'bankruptcy', fill: '#7C3AED', size: 2, arrowPlacement: 'end' },

  // ─── Outcome \u2192 outcome (cascade chain) ─────────────────────────────────────
  { id: 'e31', source: 'ipo_pulled', target: 'neumann_ousted', fill: '#A78BFA', size: 1.5, arrowPlacement: 'end' },
  { id: 'e32', source: 'neumann_ousted', target: 'softbank_writedown', fill: '#A78BFA', size: 1.5, arrowPlacement: 'end' },
  { id: 'e33', source: 'softbank_writedown', target: 'valuation_collapse', fill: '#A78BFA', size: 1.5, arrowPlacement: 'end' },
  { id: 'e34', source: 'valuation_collapse', target: 'bankruptcy', fill: '#A78BFA', size: 1.5, arrowPlacement: 'end' },
];

// ─── Graph theme (deep-space dark) ──────────────────────────────────────────

const GRAPH_THEME: Theme = {
  canvas: {
    background: '#FFFFFF',
    fog: null,
  },
  node: {
    fill: '#94A3B8',
    activeFill: '#475569',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.35,
    label: {
      color: '#475569',
      activeColor: '#0F172A',
      stroke: '#FFFFFF',
      strokeWidth: 4,
    },
  },
  ring: {
    fill: '#16A34A',
    activeFill: '#22C55E',
  },
  edge: {
    fill: '#CBD5E1',
    activeFill: '#64748B',
    opacity: 0.9,
    selectedOpacity: 1,
    inactiveOpacity: 0.18,
    label: {
      color: '#64748B',
      activeColor: '#0F172A',
    },
  },
  arrow: {
    fill: '#94A3B8',
    activeFill: '#475569',
  },
  lasso: {
    background: 'rgba(22,163,74,0.08)',
    border: '#16A34A',
  },
};

// ─── Pulsing halo (applied to primary/critical node) ─────────────────────────

function PulsingHalo({
  size,
  color,
  shape,
}: {
  size: number;
  color: string;
  shape: 'octahedron' | 'dodecahedron';
}) {
  const ref = useRef<Mesh | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const s = 1.45 + Math.sin(t * 2.2) * 0.18;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.14 + Math.sin(t * 2.2) * 0.08;
  });
  return (
    <mesh ref={ref}>
      {shape === 'octahedron' ? (
        <octahedronGeometry args={[size, 0]} />
      ) : (
        <dodecahedronGeometry args={[size, 0]} />
      )}
      <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ─── Custom node renderer (inlined — no React component wrapper) ─────────────

// ─── Canvas component (loaded via dynamic — no SSR) ──────────────────────────

export interface HeroDecisionGraph3DCanvasProps {
  onNodeSelect: (node: GraphNode | null) => void;
}

export default function HeroDecisionGraph3DCanvas({
  onNodeSelect,
}: HeroDecisionGraph3DCanvasProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  // Force-directed 3D layout needs several ticks before node positions stabilize.
  // With 20+ nodes, iterations take longer — retry through 4s so whichever call
  // lands after the layout has produced visible coords frames the camera.
  useEffect(() => {
    const delays = [250, 700, 1300, 2000, 2800, 3800];
    const timers = delays.map(ms =>
      setTimeout(() => {
        graphRef.current?.fitNodesInView(undefined, { animated: false });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const nodeIds = useMemo(() => NODES.map(n => n.id), []);
  const edgeIds = useMemo(() => EDGES.map(e => e.id), []);
  // Narrative groups: decisions→biases (gaps), toxic combos (compounds),
  // bias→outcome + cascade (cost). Pausing between each makes the reveal
  // read as reasoning unfolding instead of one continuous sweep.
  const edgeGroups = useMemo<string[][]>(() => {
    const decisionToBias: string[] = [];
    const toxicCombos: string[] = [];
    const outcomes: string[] = [];
    for (const e of EDGES) {
      if (e.fill === '#DC2626') toxicCombos.push(e.id);
      else if (e.fill === '#7C3AED' || e.fill === '#A78BFA') outcomes.push(e.id);
      else decisionToBias.push(e.id);
    }
    return [decisionToBias, toxicCombos, outcomes];
  }, []);
  const { narrativeActives, isRevealing, currentGroup } = useEdgeNarrativeReveal({
    nodeIds,
    edgeIds,
    edgeGroups,
    storageKey: 'di-graph-narrative:hero-decision',
  });
  const narrativeTheme = useMemo(() => withNarrativeTheme(GRAPH_THEME), []);

  const {
    selections,
    actives,
    toggleSelection,
    onCanvasClick,
    onNodePointerOver,
    onNodePointerOut,
  } = useSelection({
    ref: graphRef,
    nodes: NODES,
    edges: EDGES,
    type: 'single',
    pathHoverType: 'all',
    focusOnSelect: false,
    onSelection: ids => {
      const found = ids.length > 0 ? (NODES.find(n => n.id === ids[0]) ?? null) : null;
      onNodeSelect(found);
    },
  });

  const onNodeClick = useCallback(
    (node: InternalGraphNode) => {
      const wasSelected = selections.includes(node.id);
      toggleSelection(node.id);
      if (!wasSelected) {
        graphRef.current?.centerGraph([node.id]);
      }
    },
    [selections, toggleSelection],
  );

  const renderNode = useCallback(({ node, size, opacity, active, selected }: NodeRendererProps) => {
    const data = node.data as NodeData | undefined;
    const o = opacity ?? 1;
    const emissiveFallback = selected ? 0.4 : active ? 0.25 : 0.12;
    if (!data?.type) {
      return (
        <mesh>
          <sphereGeometry args={[size, 10, 8]} />
          <meshPhongMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={emissiveFallback} shininess={80} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
      );
    }

    const col = getNodeColor(data);
    const emissive = emissiveFallback;
    const isPrimary = data.type === 'bias' && data.severity === 'critical';

    // Decision → dodecahedron (12-face crystal)
    if (data.type === 'decision') {
      return (
        <group>
          <mesh>
            <dodecahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {selected && (
            <mesh>
              <dodecahedronGeometry args={[size * 1.55, 0]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.1} />
            </mesh>
          )}
        </group>
      );
    }

    // Bias → octahedron (8-face spike)
    if (data.type === 'bias') {
      return (
        <group>
          <mesh>
            <octahedronGeometry args={[size, 0]} />
            <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
          </mesh>
          {(active || selected) && (
            <mesh>
              <octahedronGeometry args={[size * 1.65, 0]} />
              <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.07} />
            </mesh>
          )}
          {isPrimary && !selected && <PulsingHalo size={size} color={col} shape="octahedron" />}
        </group>
      );
    }

    // Outcome → cylinder
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[size * 0.82, size * 0.82, size * 2.2, 8]} />
          <meshPhongMaterial color={col} emissive={col} emissiveIntensity={emissive} shininess={90} specular="#FFFFFF" side={DoubleSide} transparent opacity={o} />
        </mesh>
        {selected && (
          <mesh>
            <cylinderGeometry args={[size * 1.3, size * 1.3, size * 2.6, 8]} />
            <meshPhongMaterial color={col} side={DoubleSide} transparent opacity={0.1} />
          </mesh>
        )}
      </group>
    );
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GraphCanvas
        ref={graphRef}
        nodes={NODES}
        edges={EDGES}
        layoutType="forceDirected3d"
        cameraMode="rotate"
        animated={false}
        theme={isRevealing ? narrativeTheme : GRAPH_THEME}
        renderNode={renderNode}
        selections={selections}
        actives={isRevealing && narrativeActives ? narrativeActives : actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        onNodePointerOver={onNodePointerOver}
        onNodePointerOut={onNodePointerOut}
        labelType={isRevealing && currentGroup === 1 ? 'all' : 'nodes'}
        edgeLabelPosition="natural"
        draggable
        defaultNodeSize={7}
        minDistance={400}
        maxDistance={8000}
      >
        {/* Lighting rig — tuned for white background: neutral key + soft fill */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[15, 15, 10]} intensity={1.2} />
        <directionalLight position={[-10, -8, -5]} intensity={0.4} color="#FFFFFF" />
        <pointLight position={[0, 20, 5]} intensity={0.6} color="#FFFFFF" />
        <SlowOrbit graphRef={graphRef} startDelayMs={isRevealing ? 6500 : 1500} />
      </GraphCanvas>
      <ResetViewButton graphRef={graphRef} />
    </div>
  );
}
