'use client';

/**
 * R²F Detector Atlas — the 10 paper-application surface for /r2f-standard.
 *
 * Locked 2026-05-07 alongside the wedge-batch-4 sprint that completed
 * the Kahneman & Klein 2009 paper-application work to 10 of 10 detectors
 * shipped. Until this surface, each detector lived inside its own lock
 * entry in CLAUDE.md but never had a single canonical view a procurement
 * reader / advisor / investor could click through.
 *
 * Structure:
 *   - 10 detector cards in a responsive grid (5×2 desktop, 2×5 tablet,
 *     1×10 mobile). Each card is a clickable button.
 *   - Click any card → a detail panel opens inline below the grid:
 *     full description, academic citation, implementation file path,
 *     live surfaces it appears on, plus a per-detector mini-viz.
 *   - The mini-viz is a small SVG illustration unique to each detector;
 *     it surfaces the *shape* of the detector's signal (a ring for
 *     validity bands, a target for reference class, a gap meter for
 *     calibrated rejection, etc.) so a reader can visually distinguish
 *     the 10 detectors from each other.
 *
 * Vocabulary discipline: the detail-panel mini-vizs use the same band
 * labels as the live audit surfaces (PaperApplicationsCard) and DPR
 * strips. No drift between marketing surface and product surface.
 */

import { useState, type ReactElement } from 'react';
import {
  Telescope,
  History,
  Activity,
  Scale,
  Layers,
  ListChecks,
  Calculator,
  Lightbulb,
  Eye,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.30)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  blue: '#2563EB',
  blueSoft: 'rgba(37, 99, 235, 0.08)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.08)',
};

type DetectorSide = 'rigor' | 'recognition' | 'integration';

interface DetectorEntry {
  id: string;
  paperAppNumber: number;
  name: string;
  shortLabel: string;
  side: DetectorSide;
  icon: LucideIcon;
  summary: string;
  mechanism: string;
  citation: string;
  citationDoi?: string;
  /** ISO date the detector reached production. */
  shippedDate: string;
  /** Path(s) to the canonical implementation. */
  implementationFiles: string[];
  /** Where the detector surfaces in the product. */
  liveSurfaces: string[];
  /** Renderer for the per-detector mini-viz. */
  renderMiniViz: () => ReactElement;
}

// Side palette — colour each detector card by which side of the
// Kahneman × Klein synthesis it operationalises. Integration = both
// sides at once (calibrated rejection / algorithm aversion close the
// loop between rigor and recognition).
const SIDE_COLORS: Record<DetectorSide, { fg: string; bg: string; border: string; label: string }> =
  {
    rigor: { fg: C.blue, bg: C.blueSoft, border: 'rgba(37, 99, 235, 0.30)', label: 'Rigor' },
    recognition: {
      fg: C.green,
      bg: C.greenSoft,
      border: C.greenBorder,
      label: 'Recognition',
    },
    integration: {
      fg: C.amber,
      bg: C.amberSoft,
      border: 'rgba(217, 119, 6, 0.30)',
      label: 'Integration',
    },
  };

// ─── Mini-viz components ────────────────────────────────────────────

/** Bands ring — used by Validity Classifier (#2): 4 quadrants
 *  representing high / medium / low / zero validity environments. */
function ValidityRingViz() {
  const cx = 60;
  const cy = 60;
  const r = 44;
  const strokeWidth = 18;
  const segments = [
    { color: C.green, label: 'high' },
    { color: C.blue, label: 'med' },
    { color: C.amber, label: 'low' },
    { color: C.red, label: 'zero' },
  ];
  const circ = 2 * Math.PI * r;
  const segLen = circ / 4;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Validity bands ring">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segLen - 4} ${circ - segLen + 4}`}
            strokeDashoffset={-(segLen * i)}
            opacity={i === 0 ? 1 : 0.55}
          />
        ))}
      </g>
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={C.slate700}>
        4 bands
      </text>
    </svg>
  );
}

/** Reference-class target — concentric rings with dots representing
 *  historical analogs from the case library. */
function ReferenceClassTargetViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Reference class target">
      {[44, 32, 20, 8].map((r, i) => (
        <circle
          key={r}
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={C.slate300}
          strokeWidth={1}
          opacity={0.6 - i * 0.1}
        />
      ))}
      {/* Historical analog dots scattered around the target */}
      {[
        { x: 40, y: 50, color: C.red },
        { x: 75, y: 45, color: C.amber },
        { x: 80, y: 75, color: C.amber },
        { x: 50, y: 80, color: C.red },
        { x: 65, y: 60, color: C.green },
        { x: 35, y: 70, color: C.red },
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={3} fill={d.color} />
      ))}
      <text x={60} y={108} textAnchor="middle" fontSize={10} fill={C.slate500}>
        n={HISTORICAL_CASE_COUNT} cases
      </text>
    </svg>
  );
}

/** Feedback adequacy timeline — closed outcomes plotted across an 18mo
 *  recency window. */
function FeedbackTimelineViz() {
  const dots = [
    { x: 12, color: C.green },
    { x: 22, color: C.green },
    { x: 30, color: C.amber },
    { x: 42, color: C.green },
    { x: 55, color: C.green },
    { x: 64, color: C.amber },
    { x: 78, color: C.green },
    { x: 88, color: C.green },
    { x: 100, color: C.green },
  ];
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Feedback timeline">
      <line x1={10} y1={60} x2={110} y2={60} stroke={C.slate300} strokeWidth={1.5} />
      {dots.map((d, i) => (
        <g key={i}>
          <line
            x1={d.x}
            y1={60}
            x2={d.x}
            y2={50 - (i % 3) * 4}
            stroke={C.slate300}
            strokeWidth={1}
          />
          <circle cx={d.x} cy={50 - (i % 3) * 4} r={3.5} fill={d.color} />
        </g>
      ))}
      <text x={10} y={100} fontSize={10} fill={C.slate500}>
        18mo
      </text>
      <text x={88} y={100} fontSize={10} fill={C.slate500}>
        now
      </text>
    </svg>
  );
}

/** Calibration gap meter — rhetorical vs earned confidence side-by-side. */
function CalibrationGapViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Calibration gap">
      {/* Rhetorical bar — taller, red-ish */}
      <rect x={28} y={30} width={20} height={70} fill={C.red} opacity={0.7} rx={2} />
      <text x={38} y={20} textAnchor="middle" fontSize={9} fill={C.slate600}>
        rhetoric
      </text>
      <text x={38} y={114} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.slate700}>
        0.78
      </text>
      {/* Earned bar — shorter, green */}
      <rect x={72} y={70} width={20} height={30} fill={C.green} opacity={0.7} rx={2} />
      <text x={82} y={62} textAnchor="middle" fontSize={9} fill={C.slate600}>
        earned
      </text>
      <text x={82} y={114} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.slate700}>
        0.32
      </text>
      {/* Gap arrow */}
      <line
        x1={48}
        y1={50}
        x2={70}
        y2={50}
        stroke={C.amber}
        strokeWidth={2}
        markerEnd="url(#arr)"
      />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.amber} />
        </marker>
      </defs>
    </svg>
  );
}

/** Fractionation per-class chart — bar chart of expertise per decision class. */
function FractionationClassesViz() {
  const bars = [
    { label: 'M&A', value: 12, color: C.green },
    { label: 'Cap', value: 6, color: C.amber },
    { label: 'Mkt', value: 2, color: C.red },
    { label: 'LH', value: 1, color: C.red },
    { label: 'Ops', value: 8, color: C.green },
  ];
  const max = 14;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Fractionation per class">
      {bars.map((b, i) => {
        const x = 12 + i * 20;
        const h = (b.value / max) * 80;
        return (
          <g key={b.label}>
            <rect x={x} y={100 - h} width={14} height={h} fill={b.color} opacity={0.75} rx={1} />
            <text x={x + 7} y={114} textAnchor="middle" fontSize={8} fill={C.slate500}>
              {b.label}
            </text>
            <text
              x={x + 7}
              y={100 - h - 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill={C.slate700}
            >
              {b.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Decision rubric checklist — criteria + weights diagram. */
function RubricChecklistViz() {
  const rows = [
    { label: 'Criterion 1', weight: 30 },
    { label: 'Criterion 2', weight: 25 },
    { label: 'Criterion 3', weight: 25 },
    { label: 'Criterion 4', weight: 20 },
  ];
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Decision rubric checklist">
      {rows.map((r, i) => {
        const y = 16 + i * 22;
        return (
          <g key={r.label}>
            <rect x={8} y={y} width={10} height={10} fill={C.green} opacity={0.7} rx={2} />
            <text x={22} y={y + 8} fontSize={9} fill={C.slate600}>
              {r.label}
            </text>
            <rect
              x={68}
              y={y + 1}
              width={(r.weight / 35) * 36}
              height={8}
              fill={C.blue}
              opacity={0.55}
              rx={1}
            />
            <text x={108} y={y + 8} fontSize={9} fill={C.slate500} textAnchor="end">
              {r.weight}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Algorithm aversion fork — data path vs gut path. */
function AlgorithmAversionForkViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Algorithm aversion fork">
      {/* Stem */}
      <line x1={60} y1={20} x2={60} y2={50} stroke={C.slate400} strokeWidth={2} />
      {/* Data path (left, robust) */}
      <line x1={60} y1={50} x2={28} y2={88} stroke={C.green} strokeWidth={2.5} />
      <circle cx={28} cy={88} r={10} fill={C.greenSoft} stroke={C.green} strokeWidth={1.5} />
      <text x={28} y={92} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.green}>
        data
      </text>
      {/* Gut path (right, dismissive) */}
      <line
        x1={60}
        y1={50}
        x2={92}
        y2={88}
        stroke={C.red}
        strokeWidth={2.5}
        strokeDasharray="4 3"
      />
      <circle cx={92} cy={88} r={10} fill={C.redSoft} stroke={C.red} strokeWidth={1.5} />
      <text x={92} y={92} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.red}>
        gut
      </text>
      <text x={60} y={114} textAnchor="middle" fontSize={9} fill={C.slate500}>
        Dietvorst 2015
      </text>
    </svg>
  );
}

/** Illusion of validity — confidence vs evidence scatter. */
function IllusionScatterViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Confidence vs evidence">
      {/* Axes */}
      <line x1={20} y1={100} x2={108} y2={100} stroke={C.slate400} strokeWidth={1.5} />
      <line x1={20} y1={100} x2={20} y2={16} stroke={C.slate400} strokeWidth={1.5} />
      <text x={64} y={114} textAnchor="middle" fontSize={9} fill={C.slate500}>
        evidence →
      </text>
      <text
        x={10}
        y={56}
        textAnchor="middle"
        fontSize={9}
        fill={C.slate500}
        transform="rotate(-90 10 56)"
      >
        confidence ↑
      </text>
      {/* Diagonal target line — well-calibrated */}
      <line
        x1={20}
        y1={100}
        x2={108}
        y2={20}
        stroke={C.green}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* Scatter points — most well-calibrated, a few illusion-of-validity outliers */}
      {[
        { x: 35, y: 88 },
        { x: 50, y: 72 },
        { x: 65, y: 56 },
        { x: 80, y: 38 },
        { x: 95, y: 24 },
        { x: 30, y: 30, outlier: true },
        { x: 45, y: 22, outlier: true },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={p.outlier ? C.red : C.blue} opacity={0.8} />
      ))}
    </svg>
  );
}

/** Prospective hindsight calendar — now → 1 year forward. */
function ProspectiveHindsightViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Prospective hindsight">
      {/* Calendar grid */}
      <rect
        x={16}
        y={20}
        width={88}
        height={70}
        fill="none"
        stroke={C.slate300}
        strokeWidth={1}
        rx={4}
      />
      {[1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => (
          <rect
            key={`${row}-${col}`}
            x={20 + col * 22}
            y={28 + row * 18}
            width={18}
            height={14}
            fill={C.slate100}
            stroke={C.slate200}
            strokeWidth={0.5}
            rx={1}
          />
        ))
      )}
      {/* Disaster X marker on a cell */}
      <text x={60} y={56} fontSize={16} fontWeight={700} fill={C.red} textAnchor="middle">
        ✗
      </text>
      {/* Past-tense arrow back to now */}
      <line x1={66} y1={70} x2={36} y2={86} stroke={C.amber} strokeWidth={2} markerEnd="url(#pa)" />
      <defs>
        <marker id="pa" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.amber} />
        </marker>
      </defs>
      <text x={60} y={108} textAnchor="middle" fontSize={9} fill={C.slate500}>
        +1y → write history
      </text>
    </svg>
  );
}

/** Inside vs outside view comparison. */
function InsideOutsideViz() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Inside vs outside view">
      {/* Inside view bubble — narrative */}
      <ellipse
        cx={42}
        cy={40}
        rx={28}
        ry={16}
        fill={C.amberSoft}
        stroke={C.amber}
        strokeWidth={1.5}
      />
      <text x={42} y={36} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.amber}>
        Inside
      </text>
      <text x={42} y={48} textAnchor="middle" fontSize={8} fill={C.slate600}>
        narrative
      </text>
      {/* Outside view bubble — base rates */}
      <ellipse
        cx={78}
        cy={80}
        rx={28}
        ry={16}
        fill={C.greenSoft}
        stroke={C.green}
        strokeWidth={1.5}
      />
      <text x={78} y={76} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.green}>
        Outside
      </text>
      <text x={78} y={88} textAnchor="middle" fontSize={8} fill={C.slate600}>
        base rates
      </text>
      {/* Arrow showing the right direction */}
      <line
        x1={62}
        y1={56}
        x2={68}
        y2={66}
        stroke={C.slate500}
        strokeWidth={1.5}
        markerEnd="url(#io)"
      />
      <defs>
        <marker id="io" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 z" fill={C.slate500} />
        </marker>
      </defs>
    </svg>
  );
}

// ─── Detector data ──────────────────────────────────────────────────

const DETECTORS: DetectorEntry[] = [
  // #1
  {
    id: 'pa_1',
    paperAppNumber: 1,
    name: 'Fractionation of Expertise',
    shortLabel: 'Class-Specific Calibration',
    side: 'recognition',
    icon: Layers,
    summary:
      "Slices the author's outcome history per decision class. Catches the senior-expert / wrong-sub-domain failure pattern.",
    mechanism:
      "Pure-function lookup against the user's DecisionOutcome history grouped by decision class (M&A integration / capital deployment / market entry / long-horizon strategy / operations). Returns the detected class for THIS memo and contrasts this-class to other-class calibration. Closes the 'sparse FOR WHICH class?' gap that paper-application #6 (Feedback Adequacy) leaves ambiguous.",
    citation: 'Kahneman & Klein 2009 — "Conditions for Intuitive Expertise: A Failure to Disagree"',
    citationDoi: 'https://doi.org/10.1037/a0016755',
    shippedDate: '2026-05-07',
    implementationFiles: ['src/lib/learning/fractionation-of-expertise.ts'],
    liveSurfaces: ['DPR §4.7 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <FractionationClassesViz />,
  },
  // #2
  {
    id: 'pa_2',
    paperAppNumber: 2,
    name: 'Validity Classifier',
    shortLabel: 'Environment Validity',
    side: 'rigor',
    icon: Telescope,
    summary:
      'Classifies the decision environment into 4 validity bands and structurally reweighs the DQI engine accordingly.',
    mechanism:
      'Maps documentType + industry + decision-horizon onto high / medium / low / zero validity bands per the 2009 paper taxonomy. Returns weight-shift overrides that feed `computeEffectiveWeights`; in low-validity domains the DQI shifts toward historical alignment + bias load and away from evidence quality. Methodology version 2.1.0.',
    citation: 'Kahneman & Klein 2009 — first condition for trustworthy intuition',
    citationDoi: 'https://doi.org/10.1037/a0016755',
    shippedDate: '2026-04-30',
    implementationFiles: ['src/lib/learning/validity-classifier.ts', 'src/lib/scoring/dqi.ts'],
    liveSurfaces: [
      'DPR §4.1 strip',
      'PaperApplicationsCard SignalBlock',
      'DQI engine weight shift',
    ],
    renderMiniViz: () => <ValidityRingViz />,
  },
  // #3
  {
    id: 'pa_3',
    paperAppNumber: 3,
    name: 'Illusion of Validity',
    shortLabel: 'Confidence-by-Coherence',
    side: 'rigor',
    icon: Eye,
    summary:
      'First-class bias detector (DI-B-021) flagging narrative coherence creating false confidence — the central K&K 2009 mechanism.',
    mechanism:
      'Pipeline-grade bias detector wired through the bias detective prompt with rhetorical-certainty signal patterns ("we are certain", "guaranteed", "highly predictable"). Validity-aware severity scoring penalises confidence-language harder in low-validity domains. Compounds with overconfidence_bias / confirmation_bias / halo / authority into the toxic combination "Coherent Confidence."',
    citation: 'Kahneman & Klein 2009 — central finding',
    citationDoi: 'https://doi.org/10.1037/a0016755',
    shippedDate: '2026-04-30',
    implementationFiles: [
      'src/lib/constants/bias-education.ts (DI-B-021)',
      'src/lib/agents/prompts.ts (BIAS_DETECTIVE_PROMPT)',
    ],
    liveSurfaces: ['Bias detective pipeline', '/taxonomy DI-B-021', 'DPR bias cards'],
    renderMiniViz: () => <IllusionScatterViz />,
  },
  // #4
  {
    id: 'pa_4',
    paperAppNumber: 4,
    name: 'Improper Linear Models',
    shortLabel: 'Rubric Structure',
    side: 'rigor',
    icon: ListChecks,
    summary:
      "Detects whether the memo follows Dawes' robust rubric pattern (criteria + weights + comparison) or argues narrative coherence for a foregone conclusion.",
    mechanism:
      'Pure-function scan of bias-detective excerpts + summary text for structural rubric markers (numbered criteria, weighted criteria, decision matrix, scored alternatives, multi-option comparison) AND severity-weighted hits on narrative-coherence biases (illusion_of_validity / inside_view_dominance / narrative_fallacy). Verdict bands: explicit_rubric / partial_criteria / narrative_dominant / narrative_only.',
    citation: 'Dawes 1979 — "The Robust Beauty of Improper Linear Models in Decision Making"',
    citationDoi: 'https://doi.org/10.1037/0003-066X.34.7.571',
    shippedDate: '2026-05-07',
    implementationFiles: ['src/lib/learning/decision-rubric.ts'],
    liveSurfaces: ['DPR §4.8 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <RubricChecklistViz />,
  },
  // #5
  {
    id: 'pa_5',
    paperAppNumber: 5,
    name: 'Prospective Hindsight',
    shortLabel: 'Past-Tense Pre-Mortem',
    side: 'recognition',
    icon: Calendar,
    summary:
      'Forces the pre-mortem prompts into past-tense future-disaster framing — produces 25-30% more failure-cause insights than conditional voice.',
    mechanism:
      'Pre-mortem prompts at 3 sites in `prompts.ts` (STRATEGIC_ANALYSIS_PROMPT, DEEP_ANALYSIS_SUPER_PROMPT, buildNarrativePreMortemPrompt) enforce the EXACT framing: project ONE YEAR INTO THE FUTURE, the plan was implemented as written, the outcome was a TOTAL DISASTER, write the HISTORY of that disaster in past tense. NO conditional voice ("might", "could", "if") — the past-tense fait-accompli framing is the load-bearing instruction.',
    citation: 'Klein & Mitchell 1995 / Mitchell, Russo & Pennington 1989 — prospective hindsight',
    shippedDate: '2026-04-30',
    implementationFiles: ['src/lib/agents/prompts.ts (3 pre-mortem sites)'],
    liveSurfaces: ['Pipeline pre-mortem nodes', 'DPR pipeline lineage', 'Pre-mortem outputs'],
    renderMiniViz: () => <ProspectiveHindsightViz />,
  },
  // #6
  {
    id: 'pa_6',
    paperAppNumber: 6,
    name: 'Feedback Adequacy',
    shortLabel: 'Author Calibration',
    side: 'recognition',
    icon: Activity,
    summary:
      "Operationalises K&K 2009's second condition — has the author had enough closed-loop feedback for experience to carry calibrated weight?",
    mechanism:
      "Single Prisma query against the user's DecisionOutcome history with an 18-month recency window. Verdict bands tuned conservatively: ≥10 closed outcomes = adequate; 3-9 = sparse; <3 = cold_start; lookup error = unknown (transparent fallback). Optional domain-hint filter narrows the query when the documentType supplies a useful signal.",
    citation: 'Kahneman & Klein 2009 — second condition for trustworthy intuition',
    citationDoi: 'https://doi.org/10.1037/a0016755',
    shippedDate: '2026-04-30',
    implementationFiles: ['src/lib/learning/feedback-adequacy.ts'],
    liveSurfaces: ['DPR §4.3 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <FeedbackTimelineViz />,
  },
  // #7
  {
    id: 'pa_7',
    paperAppNumber: 7,
    name: 'Algorithm Aversion',
    shortLabel: 'Algorithm Trust',
    side: 'integration',
    icon: Calculator,
    summary:
      'Flags dismissive-of-quantitative language as a documented decision-making error rather than letting it pass as judgment. Counter-programs the most common buyer objection.',
    mechanism:
      'Pure-function regex scan of bias-detective excerpts + summary for ten language patterns dismissing quantitative analysis ("the numbers don\'t tell the whole story", "experience tells me", "art not science", "trust my gut"). Severity-weighted; compound bias hits (authority_bias / illusion_of_validity / inside_view_dominance / overconfidence at high+ severity) elevate the verdict band.',
    citation:
      'Dietvorst, Simmons & Massey 2015 — "Algorithm Aversion: People Erroneously Avoid Algorithms After Seeing Them Err" (J. Exp. Psychol. General)',
    citationDoi: 'https://doi.org/10.1037/xge0000033',
    shippedDate: '2026-05-07',
    implementationFiles: ['src/lib/learning/algorithm-aversion.ts'],
    liveSurfaces: ['DPR §4.9 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <AlgorithmAversionForkViz />,
  },
  // #8
  {
    id: 'pa_8',
    paperAppNumber: 8,
    name: 'Reference Class Forecasting',
    shortLabel: 'Outside View',
    side: 'rigor',
    icon: History,
    summary:
      'Pure-function similarity scoring against the 143-case library — surfaces top-5 historical analogs + matched-class baseline failure rate.',
    mechanism:
      'Combines Jaccard bias-overlap (60% weight) + binary industry match (25%) + monetary-stakes bonus (5%) → 0-1 similarity per case. Inclusion threshold 0.18; matched class size <3 returns "reference_class_too_small_to_judge" honestly rather than fabricating a forecast. Predicted outcome bands derive from the matched-class outcome distribution.',
    citation: 'Kahneman & Lovallo 2003 — "Delusions of Success" (HBR)',
    shippedDate: '2026-04-30',
    implementationFiles: ['src/lib/learning/reference-class-forecast.ts'],
    liveSurfaces: ['DPR §4.2 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <ReferenceClassTargetViz />,
  },
  // #9
  {
    id: 'pa_9',
    paperAppNumber: 9,
    name: 'Inside-View Dominance',
    shortLabel: 'Reference-Class Neglect',
    side: 'rigor',
    icon: Eye,
    summary:
      'First-class bias detector (DI-B-022) flagging "this case is special" / "the comparables don\'t apply" reasoning patterns.',
    mechanism:
      'Bias detective taxonomy item #22. Detects projections without grounded comparables, structurally novel reasoning that ignores the reference class. Compounds: + Planning Fallacy 1.6× / + Overconfidence 1.5× / + Illusion of Validity 1.4× / + Confirmation 1.3×. Anchors the toxic combination "Reference-Class Blindness."',
    citation: 'Kahneman & Lovallo 2003 — "Delusions of Success"',
    shippedDate: '2026-04-30',
    implementationFiles: [
      'src/lib/constants/bias-education.ts (DI-B-022)',
      'src/lib/agents/prompts.ts (BIAS_DETECTIVE_PROMPT)',
    ],
    liveSurfaces: ['Bias detective pipeline', '/taxonomy DI-B-022', 'DPR bias cards'],
    renderMiniViz: () => <InsideOutsideViz />,
  },
  // #10
  {
    id: 'pa_10',
    paperAppNumber: 10,
    name: 'Calibrated Rejection',
    shortLabel: 'Confidence Calibration',
    side: 'integration',
    icon: Scale,
    summary:
      "Closes the K&K 2009 loop — does this memo's confidence match the evidence its validity × feedback supports?",
    mechanism:
      'Pure-function combination of validity (paper-app #2) × feedback adequacy (paper-app #6) × bias-detective hits on confidence-language patterns (illusion_of_validity / overconfidence / authority / anchoring). rhetoricalConfidence = severity-weighted bias hits. earnedConfidence = validity_score × feedback_score. gap = max(0, rhetorical − earned). 5 verdict bands plus the audit-committee-readiness flag for materially-overconfident.',
    citation: 'Kahneman & Klein 2009 — closes both conditions',
    citationDoi: 'https://doi.org/10.1037/a0016755',
    shippedDate: '2026-05-07',
    implementationFiles: ['src/lib/learning/calibrated-rejection.ts'],
    liveSurfaces: ['DPR §4.4 strip', 'PaperApplicationsCard SignalBlock', 'Insights API'],
    renderMiniViz: () => <CalibrationGapViz />,
  },
];

// ─── Atlas component ────────────────────────────────────────────────

export function R2FDetectorAtlas() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = DETECTORS.find(d => d.id === activeId) ?? null;

  return (
    <section
      style={{
        background: C.slate50,
        borderTop: `1px solid ${C.slate200}`,
        borderBottom: `1px solid ${C.slate200}`,
        padding: '64px 0',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 36,
            textAlign: 'center',
            maxWidth: 760,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 12,
            }}
          >
            R²F DETECTOR ATLAS · 10 OF 10 SHIPPED
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 38px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: C.slate900,
              marginBottom: 14,
              lineHeight: 1.15,
            }}
          >
            Every detector. Every paper. Every line of code.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: C.slate600,
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            Each entry below is a procurement-grade signal anchored in a specific academic paper.
            The 10-paper sprint completed 2026-05-07 with the Calibrated Rejection lock; click any
            detector to inspect its mechanism, implementation file, and live product surfaces.
          </p>
        </div>

        {/* Grid of 10 detectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {DETECTORS.map(d => {
            const isActive = d.id === activeId;
            const sideStyle = SIDE_COLORS[d.side];
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveId(isActive ? null : d.id)}
                aria-expanded={isActive}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  gap: 8,
                  padding: 16,
                  background: isActive ? sideStyle.bg : C.white,
                  border: `1.5px solid ${isActive ? sideStyle.fg : C.slate200}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? '0 2px 12px rgba(15, 23, 42, 0.08)'
                    : '0 1px 3px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.18s ease',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = sideStyle.border;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = C.slate200;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
                  }
                }}
              >
                {/* Number badge top-left */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, monospace',
                    color: C.slate400,
                  }}
                >
                  #{String(d.paperAppNumber).padStart(2, '0')}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: sideStyle.bg,
                    border: `1px solid ${sideStyle.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: sideStyle.fg,
                  }}
                >
                  <Icon size={18} />
                </div>

                {/* Name */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.slate900,
                    lineHeight: 1.25,
                  }}
                >
                  {d.shortLabel}
                </div>

                {/* Sub-name */}
                <div
                  style={{
                    fontSize: 11,
                    color: C.slate500,
                    fontFamily: 'ui-monospace, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {d.name}
                </div>

                {/* Side label */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: sideStyle.fg,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 2,
                  }}
                >
                  {sideStyle.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel — opens inline below grid */}
        {active && <DetectorDetailPanel detector={active} onClose={() => setActiveId(null)} />}

        {!active && (
          <div
            style={{
              padding: '20px 24px',
              background: C.white,
              border: `1px dashed ${C.slate200}`,
              borderRadius: 10,
              fontSize: 14,
              color: C.slate500,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            <Lightbulb
              size={14}
              style={{ display: 'inline-block', marginRight: 6, verticalAlign: '-2px' }}
            />
            Click any detector above to see its mechanism, citation, implementation file, live
            product surfaces, and a per-detector mini-visualisation of the signal it produces.
          </div>
        )}
      </div>
    </section>
  );
}

function DetectorDetailPanel({
  detector,
  onClose,
}: {
  detector: DetectorEntry;
  onClose: () => void;
}) {
  const sideStyle = SIDE_COLORS[detector.side];
  const Icon = detector.icon;
  const shippedDateLabel = formatShippedDate(detector.shippedDate);
  return (
    <div
      style={{
        background: C.white,
        border: `1.5px solid ${sideStyle.border}`,
        borderRadius: 14,
        padding: 24,
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 160px',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Left column: text */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: sideStyle.bg,
                border: `1px solid ${sideStyle.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: sideStyle.fg,
              }}
            >
              <Icon size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, monospace',
                  color: C.slate500,
                  letterSpacing: '0.06em',
                }}
              >
                PAPER APPLICATION #{String(detector.paperAppNumber).padStart(2, '0')} ·{' '}
                {sideStyle.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.slate900, lineHeight: 1.2 }}>
                {detector.name}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.green,
                  background: C.greenSoft,
                  border: `1px solid ${C.greenBorder}`,
                  padding: '4px 10px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Shipped · {shippedDateLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 22,
                  color: C.slate400,
                  padding: '0 4px',
                  lineHeight: 1,
                }}
                aria-label="Close detector detail"
              >
                ×
              </button>
            </div>
          </div>

          <p style={{ fontSize: 16, color: C.slate700, lineHeight: 1.55, marginBottom: 16 }}>
            {detector.summary}
          </p>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.slate500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Mechanism
            </div>
            <p style={{ fontSize: 14, color: C.slate700, lineHeight: 1.55, margin: 0 }}>
              {detector.mechanism}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 8,
            }}
          >
            <DetailField label="Academic anchor">
              <span style={{ fontSize: 13, color: C.slate700 }}>{detector.citation}</span>
              {detector.citationDoi && (
                <a
                  href={detector.citationDoi}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block',
                    marginTop: 4,
                    fontSize: 11,
                    fontFamily: 'ui-monospace, monospace',
                    color: C.blue,
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                  }}
                >
                  {detector.citationDoi.replace(/^https?:\/\//, '')}
                </a>
              )}
            </DetailField>

            <DetailField label="Implementation">
              {detector.implementationFiles.map(f => (
                <div
                  key={f}
                  style={{
                    fontSize: 12,
                    fontFamily: 'ui-monospace, monospace',
                    color: C.slate700,
                    marginBottom: 2,
                    wordBreak: 'break-all',
                  }}
                >
                  {f}
                </div>
              ))}
            </DetailField>

            <DetailField label="Live surfaces">
              {detector.liveSurfaces.map(s => (
                <div key={s} style={{ fontSize: 13, color: C.slate700, marginBottom: 2 }}>
                  · {s}
                </div>
              ))}
            </DetailField>
          </div>
        </div>

        {/* Right column: per-detector mini-viz */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 16,
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.slate500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Signal shape
          </div>
          {detector.renderMiniViz()}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: C.slate500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function formatShippedDate(iso: string): string {
  // ISO 'YYYY-MM-DD' → 'MMM YYYY' for compact display in the badge.
  const [y, m] = iso.split('-');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthIdx = parseInt(m, 10) - 1;
  return `${monthNames[monthIdx] ?? m} ${y}`;
}
