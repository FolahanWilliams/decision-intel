// Consolidated intellectual foundations for Decision Intel.
// Replaces the two legacy tabs (MethodologiesAndPrinciples + PlaybookAndResearch).
//
// Every entry ties a thinker or framework to (a) its origin, (b) why it
// matters for DI, and (c) the shipped file or planned roadmap item that
// implements it. Organized by category + ring layer so the Intellectual
// Constellation viz can lay them out radially.

import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';

// Derived — "30+ bias taxonomy" + "20×20 interaction matrix" are stale
// post-M-1 (2026-05-13: matrix is MATRIX_DIMENSION×MATRIX_DIMENSION;
// "30+" deprecated per CR-3). Investor technical-DD surface; never
// hardcode the count here.
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

export type ThinkerCategory =
  | 'cognitive'
  | 'structuring'
  | 'communication'
  | 'gtm'
  | 'strategy'
  | 'moat';

export type RingLayer = 1 | 2 | 3 | 4;

export interface Thinker {
  id: string;
  name: string;
  shortName: string; // for constellation labels
  origin: string;
  summary: string;
  why: string;
  surface: string;
  shipped: boolean;
  category: ThinkerCategory;
  ring: RingLayer;
  year: number; // publication year of the seminal work
}

// ─── Lineage: the edges between thinkers (who built on / argued with whom) ──
// Keyed by source thinker id; each edge points to the EARLIER / underlying idea.
// This is what turns the constellation from a star-field into a map of ideas.
export type LineageKind =
  | 'builds_on' // extends or descends from
  | 'synthesizes' // reconciles two traditions into one
  | 'adversarial' // the documented public disagreement (Kahneman ↔ Klein)
  | 'measures' // makes the prior idea testable
  | 'mechanizes'; // turns the by-hand technique into a machine

export interface LineageEdge {
  to: string; // target thinker id (the idea this one draws on)
  kind: LineageKind;
  note: string; // one line: what the relationship actually is
}

export const LINEAGE_KIND_META: Record<LineageKind, { label: string; verb: string }> = {
  builds_on: { label: 'Builds on', verb: 'extends' },
  synthesizes: { label: 'Synthesizes', verb: 'reconciles' },
  adversarial: { label: 'Adversarial collaboration', verb: 'argued with' },
  measures: { label: 'Makes testable', verb: 'measures' },
  mechanizes: { label: 'Mechanizes', verb: 'automates' },
};

// ─── Per-node depth: the quote, the mechanism, and the room-tested rebuttal ──
// Authored for the defensibility SPINE (cognitive + IC tradecraft + moat).
// The detail card renders these only when present, so softer GTM nodes keep
// their existing origin/summary/why without padded filler.
export interface ThinkerDepth {
  quote: string; // the seminal line
  quoteSource: string; // attribution
  mechanism: string; // the precise thing Decision Intel operationalizes
  objection: string; // the skeptic's challenge, steelmanned
  rebuttal: string; // how you answer it in the room
}

// ─── The guided path: the ~7 nodes that, in order, ARE the argument for DI ──
export interface ArgumentBeat {
  id: string; // thinker id
  step: number; // 1..N order
  title: string; // the beat in three words
  beat: string; // the narrative line for this step
}

export const CATEGORY_META: Record<ThinkerCategory, { label: string; color: string; bg: string }> =
  {
    cognitive: {
      label: 'Cognitive & decision science',
      color: '#16A34A',
      bg: 'rgba(22, 163, 74, 0.14)',
    },
    structuring: {
      label: 'Decision structuring',
      color: '#0EA5E9',
      bg: 'rgba(14, 165, 233, 0.14)',
    },
    communication: {
      label: 'Communication & persuasion',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.14)',
    },
    gtm: {
      label: 'Go-to-market & sales',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.14)',
    },
    strategy: {
      label: 'Strategy',
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.14)',
    },
    moat: {
      label: 'Moat theory',
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.14)',
    },
  };

export const THINKERS: Thinker[] = [
  // ─── Ring 1: Cognitive & decision science foundations ──────────────
  {
    id: 'kahneman-sibony-noise',
    name: 'Daniel Kahneman & Olivier Sibony — Noise',
    shortName: 'Kahneman · Sibony',
    origin:
      'Noise: A Flaw in Human Judgment (2021). Insurance underwriter study: 55% variance where execs expected 10%.',
    summary:
      'Noise is unwanted variability in judgments that should be identical. Decision hygiene (structured, independent, aggregated judgment) cuts noise without requiring domain expertise.',
    why: 'Theoretical backbone of the triple-judge scoring engine and the NoiseTax component of DQI. Reframes the sales pitch from "avoid bias" to "measure and reduce decision variance."',
    surface: 'src/lib/scoring/noise-decomposition.ts, NoiseTaxCard.tsx, triple-judge pipeline',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 2021,
  },
  {
    id: 'klein-rpd',
    name: 'Gary Klein — Recognition-Primed Decision (RPD)',
    shortName: 'Klein · RPD',
    origin:
      'Sources of Power (1998). Research on firefighters, nurses, and NICU clinicians: experts pattern-match, they do not enumerate options.',
    summary:
      'Experts recognize situations from prior experience and mentally simulate how the chosen course will play out. Pre-mortem and narrative simulation are standard RPD tools.',
    why: 'DI sits at the intersection of structured debiasing (Kahneman) and expert intuition amplification (Klein). The RPD tab surfaces recognition cues from historical cases.',
    surface:
      'src/app/(platform)/documents/[id]/tabs/OverviewTab.tsx (Pattern Recognition collapsible), PreMortemScenarioCards.tsx, /api/rpd-simulator',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 1998,
  },
  {
    id: 'tversky-kahneman-s1s2',
    name: 'Tversky & Kahneman — System 1/System 2',
    shortName: 'Tversky · Kahneman',
    origin:
      'Judgment under Uncertainty (1974), Thinking Fast and Slow (2011). Catalogued the heuristics and biases that drive systematic error.',
    summary:
      'Fast, automatic System 1 judgment is easily hijacked by anchoring, availability, representativeness, loss aversion, and confirmation. System 2 is capable of correction but lazy.',
    why: `The ${BIAS_COUNT}-bias taxonomy the platform detects is a direct inheritance from this research program. Every bias card traces back to a specific paper here.`,
    surface:
      'Bias taxonomy across the detection pipeline, compound scoring engine, src/lib/constants/bias-education.ts',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 1974,
  },
  {
    id: 'tetlock-superforecasting',
    name: 'Philip Tetlock — Superforecasting',
    shortName: 'Tetlock',
    origin:
      'Expert Political Judgment (2005) and Superforecasting (2015). IARPA forecasting tournaments.',
    summary:
      'Hybrid human-machine forecasters beat both pure AI and pure humans. Calibration is trainable. Brier scores measure how well stated probabilities match outcomes.',
    why: 'Validates the whole product architecture (AI augmenting expert judgment rather than replacing it) and grounds the calibration dashboard and its Bronze-to-Platinum tiers.',
    surface: 'CalibrationContent.tsx, personal calibration dashboard, Brier-score tracking',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 2015,
  },
  {
    id: 'annie-duke-bets',
    name: 'Annie Duke — Probabilistic decision-making',
    shortName: 'Duke',
    origin: 'Thinking in Bets (2018), How to Decide (2020). Former professional poker player.',
    summary:
      'Distinguishes decision quality from outcome quality (resulting bias). Pre-commitment and decision architecture beat willpower for debiasing.',
    why: 'Validates the nudge system and outcome reporting loop. The distinction between decision quality and outcome is the core framing of the DQI.',
    surface: 'Nudge system, outcome reporting, resulting-bias callouts',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 2018,
  },
  {
    id: 'bayes',
    name: 'Thomas Bayes — Bayesian epistemology',
    shortName: 'Bayes',
    origin:
      'An Essay towards solving a Problem in the Doctrine of Chances (1763). Applied to decision theory by Savage, Jeffreys, and Jaynes.',
    summary:
      'Rational belief update combines a prior with likelihood of new evidence. Blind priors captured before new evidence arrives create a clean audit trail for belief change.',
    why: 'Grounds the DecisionPriorCapture feature and the blind-prior collection inside Decision Rooms. The whole calibration story depends on capturing priors cleanly.',
    surface:
      'src/lib/scoring/bayesian-priors.ts, DecisionPriorCapture.tsx, Decision Rooms blind priors',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 1763,
  },
  {
    id: 'meehl-clinical-statistical',
    name: 'Paul Meehl — Clinical vs Statistical Prediction',
    shortName: 'Meehl',
    origin:
      'Clinical versus Statistical Prediction (1954). Reviewed ~20 studies; simple actuarial formulas matched or beat trained clinicians. Replicated for sixty years (Grove et al. 2000).',
    summary:
      'A mechanical rule, even a crude one, equals or beats expert clinical judgment in study after study. The advantage comes from consistency: the formula never has a bad day.',
    why: 'The uncomfortable premise the DQI rests on. A transparent, consistent scoring model beats inconsistent expert gut — which is the only reason a decision-quality SCORE is defensible at all.',
    surface: 'DQI composite scoring engine (mechanical, consistent, reproducible)',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 1954,
  },
  {
    id: 'dawes-improper-linear',
    name: 'Robyn Dawes — The Robust Beauty of Improper Linear Models',
    shortName: 'Dawes',
    origin:
      'The Robust Beauty of Improper Linear Models in Decision Making (American Psychologist, 1979).',
    summary:
      'Even models with arbitrary or equal weights outperform expert judgment. The gain comes from consistency, not from perfectly tuned weights — so the weights barely need to be "right."',
    why: 'Defends the DQI against "your weights are arbitrary." Dawes’ finding: it does not matter much — consistently applying ANY reasonable weighting is the edge.',
    surface: 'DQI weighting model + the held-out distribution check that proves stability',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 1979,
  },
  {
    id: 'dietvorst-algorithm-aversion',
    name: 'Berkeley Dietvorst — Algorithm Aversion',
    shortName: 'Dietvorst',
    origin:
      'Algorithm Aversion (2015) and Overcoming Algorithm Aversion (2016), Wharton, J. Exp. Psychol.: General.',
    summary:
      'People abandon a model the moment they see it err, even when it beats them. The fix: let them adjust it slightly. A model they can tune is a model they will actually use.',
    why: 'Explains the "false precision" objection AND its cure. User-adjustable DQI weights are not a feature — they are the documented antidote to algorithm aversion.',
    surface: 'User-adjustable DQI weights (the Dietvorst 2016 fix), DqiWeightOverride',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 2015,
  },
  {
    id: 'ferrucci',
    name: 'David Ferrucci — Watson & Elemental Cognition',
    shortName: 'Ferrucci',
    origin:
      'Led IBM Watson (2011 Jeopardy! win); founded Elemental Cognition (2015). Hybrid neuro-symbolic systems that reason over evidence and expose the trail.',
    summary:
      'A machine earns trust only when it shows its evidence and its confidence, not just an answer. Ferrucci’s arc runs from answer-machines to reasoning-machines a human can audit.',
    why: 'The endpoint of the Tetlock hybrid thesis. The machine does not replace the analyst — it makes fifty-year-old tradecraft instant AND shows the evidence trail. Exactly what the metaJudge + Decision Provenance Record do.',
    surface:
      'metaJudge final-verdict node, Decision Provenance Record (evidence + confidence trail)',
    shipped: true,
    category: 'cognitive',
    ring: 1,
    year: 2011,
  },

  // ─── Ring 2: Decision structuring frameworks ─────────────────────
  {
    id: 'pre-mortem',
    name: 'Pre-mortem',
    shortName: 'Pre-mortem',
    origin: 'Gary Klein, Performing a Project Premortem (HBR 2007).',
    summary:
      'Imagine the decision has failed catastrophically a year from now. Write the story of why. Surfaces concerns that direct optimism suppresses.',
    why: 'One of the highest-ROI debiasing interventions in the literature. Pre-Mortem Scenario Cards is a direct implementation.',
    surface: 'PreMortemScenarioCards.tsx, RPD tab',
    shipped: true,
    category: 'structuring',
    ring: 2,
    year: 2007,
  },
  {
    id: 'reference-class',
    name: 'Reference Class Forecasting / Outside View',
    shortName: 'Reference Class',
    origin: 'Bent Flyvbjerg and Daniel Kahneman, multiple papers on megaproject forecasting.',
    summary:
      'Instead of forecasting from project-specific details (inside view), look at the base rate of comparable projects (outside view). Humans wildly over-rely on the inside view.',
    why: 'For a CSO reviewing a strategic memo, the single most persuasive number is the historical base rate of comparable decisions.',
    surface:
      'src/lib/data/reference-class-forecasting.ts, OutsideViewCard.tsx, document Overview tab',
    shipped: true,
    category: 'structuring',
    ring: 2,
    year: 2009,
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortName: 'Inversion',
    origin:
      'Charlie Munger, Poor Charlie\u2019s Almanack. Adapted from Carl Jacobi: invert, always invert.',
    summary:
      'Solve the problem backward. Instead of asking how to succeed, ask what guarantees failure, then avoid those paths.',
    why: 'Pairs naturally with pre-mortem as a standalone prompt. Cheap to ship and immediately differentiating in demos.',
    surface: 'Roadmap: Inversion prompt inside Decision Rooms',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 2005,
  },
  {
    id: 'red-team',
    name: 'Red Team / 10th Man Rule',
    shortName: 'Red Team',
    origin:
      'RAND Corporation and Israeli military intelligence after the 1973 Yom Kippur surprise.',
    summary:
      'If nine people agree, the tenth must argue the contrarian position no matter how implausible. Institutionalised dissent.',
    why: 'Complements blind priors. Makes structured dissent a first-class product primitive.',
    surface: 'Roadmap: Red Team role in Decision Rooms with a forced-dissent prompt',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1973,
  },
  {
    id: 'heuer-sats',
    name: 'Richards Heuer — Psychology of Intelligence Analysis & SATs',
    shortName: 'Heuer · SATs',
    origin:
      'Psychology of Intelligence Analysis (CIA, 1999); Structured Analytic Techniques (Heuer & Pherson, 2010). Brought Tversky–Kahneman into the intelligence community.',
    summary:
      'Analysis of Competing Hypotheses, Key Assumptions Check, devil’s advocacy, pre-mortem, red team — a documented suite the CIA runs BY HAND because the manual version is slow, political, and expensive.',
    why: 'The provenance that answers "is this just a GPT wrapper?" Decision Intel automates fifty years of intelligence-community tradecraft. The substance is Structured Analytic Techniques, made instant.',
    surface: 'Pre-mortem cards, Red Team role, reference-class — the shipped + roadmap SAT suite',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1999,
  },
  {
    id: 'ulysses-contracts',
    name: 'Ulysses Contracts / pre-commitment',
    shortName: 'Ulysses',
    origin: 'Thomas Schelling, Jon Elster, Richard Thaler.',
    summary:
      'Lock yourself into a future action while your judgment is clear so your later, biased self cannot defect. Odysseus tying himself to the mast.',
    why: 'Natural fit for the Decision Frame defaultAction field: lock at frame time, reveal only after evidence review, then measure drift.',
    surface: 'Roadmap: pre-commit defaultAction at frame time, reveal at review',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1979,
  },
  {
    id: 'second-order',
    name: 'Second-Order Thinking',
    shortName: '2nd-Order',
    origin: 'Howard Marks, Oaktree memos.',
    summary:
      '"And then what?" Chain out the consequences of the consequences. First-order thinking stops at the obvious move.',
    why: 'Fits the Counterfactual panel as an additional prompt: after the model suggests an action, force a second-order chain.',
    surface: 'Roadmap: second-order prompt inside the Counterfactual panel',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 2011,
  },
  {
    id: 'ooda',
    name: 'OODA Loop',
    shortName: 'OODA',
    origin: 'John Boyd, US Air Force strategist.',
    summary:
      'Observe, Orient, Decide, Act. Decision tempo under uncertainty. Whoever cycles faster with correct orientation wins.',
    why: 'Frames Decision Intel as a tool that speeds OODA cycles for executive committees. A useful sales metaphor for military-trained buyers.',
    surface: 'Roadmap: OODA framing in Sales Toolkit for operator buyers',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1976,
  },
  {
    id: 'cynefin',
    name: 'Cynefin Framework',
    shortName: 'Cynefin',
    origin: 'Dave Snowden, IBM Research.',
    summary:
      'Classifies a situation as simple, complicated, complex, or chaotic. Each class demands a different decision approach.',
    why: 'Could route analyses to different playbooks automatically. Complicated M&A needs different tooling than a complex organisational decision.',
    surface: 'Roadmap: Cynefin-based routing in the analysis pipeline',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1999,
  },
  {
    id: 'wisdom-crowds',
    name: 'Wisdom of Crowds',
    shortName: 'Wisdom',
    origin: 'James Surowiecki (2004), synthesising Condorcet and Galton.',
    summary:
      'Four conditions (diversity, independence, decentralisation, aggregation) make group judgment outperform any individual expert. Violate any one and the crowd becomes a mob.',
    why: 'Theoretical grounding for blind priors in Decision Rooms. Worth citing in marketing so buyers see peer-reviewed backing.',
    surface: 'Roadmap: Wisdom-of-Crowds citation on Decision Rooms marketing page',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 2004,
  },
  {
    id: 'bezos-doors',
    name: 'Bezos One-Way / Two-Way Doors',
    shortName: 'Two-Way Doors',
    origin: 'Jeff Bezos, Amazon 2015 shareholder letter.',
    summary:
      'Classify decisions as reversible (two-way doors, move fast) versus irreversible (one-way doors, deliberate carefully). Most decisions are two-way but teams treat them as one-way.',
    why: 'A reversibility tag on the Decision Frame would let the product scale rigour of analysis to the stakes. High-signal UX feature.',
    surface: 'Roadmap: reversibility tag on DecisionFrame, scaled analysis depth',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 2015,
  },
  {
    id: 'dq-chain',
    name: 'Decision Quality Chain (Howard & Matheson)',
    shortName: 'DQ Chain',
    origin: 'Ron Howard and Jim Matheson, Strategic Decisions Group.',
    summary:
      'Six-element chain: appropriate frame, creative alternatives, meaningful information, clear values, logical reasoning, commitment to action. A decision is only as strong as its weakest link.',
    why: 'Spine of a DQ Scorecard that complements the DQI. Existing DQI scores the document; DQ Scorecard would score the process.',
    surface: 'Roadmap: DQ Scorecard companion to DQI',
    shipped: false,
    category: 'structuring',
    ring: 2,
    year: 1988,
  },

  // ─── Ring 3: Communication, persuasion, GTM ──────────────────────
  {
    id: 'voss-tactical-empathy',
    name: 'Chris Voss — Tactical Empathy',
    shortName: 'Voss',
    origin:
      'Never Split the Difference (2016). Former FBI lead international kidnapping negotiator.',
    summary:
      'Labelling, mirroring, calibrated questions, and accusation audits lower the other side\u2019s defences so they can hear you. Emotion first, logic second.',
    why: 'Content Studio already cites this. Critical for selling a product that implies the buyer\u2019s current process is biased, without putting them on the defensive.',
    surface: 'src/app/api/founder-hub/content/route.ts TACTICAL_EMPATHY_INSTRUCTION',
    shipped: true,
    category: 'communication',
    ring: 3,
    year: 2016,
  },
  {
    id: 'minto-pyramid',
    name: 'Barbara Minto — Pyramid Principle (BLUF)',
    shortName: 'Minto',
    origin: 'The Pyramid Principle (1978). McKinsey consulting method.',
    summary:
      'Lead with the conclusion. Support it with two to three arguments. Detail each argument. Mirrors how busy executives consume information.',
    why: 'Already the content structure standard. Also the recommended structure for every AI-generated pitch and memo the platform produces.',
    surface: 'src/app/api/founder-hub/content/route.ts MINTO_INSTRUCTION',
    shipped: true,
    category: 'communication',
    ring: 3,
    year: 1978,
  },
  {
    id: 'storybrand',
    name: 'Donald Miller — StoryBrand',
    shortName: 'StoryBrand',
    origin: 'Building a StoryBrand (2017).',
    summary:
      'The customer is the hero, not the brand. The brand is the guide. Seven-part framework (character, problem, guide, plan, call to action, success, failure).',
    why: 'Would tighten landing page copy and onboarding flow. Currently the product is positioned as the hero of the story.',
    surface: 'Roadmap: StoryBrand rewrite of the landing page and onboarding',
    shipped: false,
    category: 'communication',
    ring: 3,
    year: 2017,
  },
  {
    id: 'hooked',
    name: 'Nir Eyal — Hooked Model',
    shortName: 'Hooked',
    origin: 'Hooked (2014).',
    summary:
      'Trigger then action then variable reward then investment. Builds habit loops that survive without ongoing motivation.',
    why: 'Frames the calibration gamification loop (Bronze-to-Platinum tiers). Each reported outcome is an investment that feeds the next variable reward.',
    surface: 'Roadmap: formalise Hooked loop in the calibration UI copy',
    shipped: false,
    category: 'communication',
    ring: 3,
    year: 2014,
  },
  {
    id: 'jtbd',
    name: 'Christensen & Moesta — Jobs-to-be-Done',
    shortName: 'JTBD',
    origin: 'Competing Against Luck (2016). Originated in Christensen\u2019s disruption research.',
    summary:
      'Customers hire products to do a job in their life. The job is stable even as demographics, technologies, and competitors change. Focus on the job, not the customer.',
    why: 'The right job for Decision Intel: "help me trust the memo before it goes to the board." That one sentence anchors landing-page positioning and discovery calls.',
    surface: 'Roadmap: JTBD statement on landing page, sales discovery script',
    shipped: false,
    category: 'gtm',
    ring: 3,
    year: 2016,
  },
  {
    id: 'crossing-chasm',
    name: 'Geoffrey Moore — Crossing the Chasm',
    shortName: 'Chasm',
    origin: 'Crossing the Chasm (1991).',
    summary:
      'Early markets (innovators, early adopters) require radically different GTM motions than mainstream markets (early majority). Most startups die in the chasm between them.',
    why: 'Corporate strategy and M&A is the beachhead. PE/VC and broader financial services is the chasm. Explicit framing prevents premature horizontal expansion.',
    surface: 'Roadmap: beachhead strategy doc in Sales Toolkit',
    shipped: false,
    category: 'gtm',
    ring: 3,
    year: 1991,
  },
  {
    id: 'challenger-sale',
    name: 'Dixon & Adamson — The Challenger Sale',
    shortName: 'Challenger',
    origin: 'The Challenger Sale (2011), CEB (now Gartner) research on 6,000+ reps.',
    summary:
      'Top sales performers teach customers something counterintuitive about their own business, tailor the message, take control. Relationship builders are the worst performers in complex B2B.',
    why: 'Decision Intel is literally a Challenger product. It teaches buyers their current process is biased and noisy in measurable ways. Most natural sales motion to adopt.',
    surface: 'Sales Toolkit tab, Challenger Sale playbook card (Teach / Tailor / Take Control)',
    shipped: true,
    category: 'gtm',
    ring: 3,
    year: 2011,
  },
  {
    id: 'spin-selling',
    name: 'Neil Rackham — SPIN Selling',
    shortName: 'SPIN',
    origin: 'SPIN Selling (1988). Huthwaite research on 35,000+ sales calls.',
    summary:
      'Situation, Problem, Implication, Need-payoff. Large-ticket sales won by asking a specific sequence of discovery questions that make the buyer articulate their own pain.',
    why: 'Ready-made discovery call structure. The Implication stage is where noise and bias data becomes a sharp argument.',
    surface: 'Sales Toolkit tab, SPIN discovery script card',
    shipped: true,
    category: 'gtm',
    ring: 3,
    year: 1988,
  },
  {
    id: 'meddpicc',
    name: 'Dick Dunkel — MEDDPICC',
    shortName: 'MEDDPICC',
    origin: 'MEDDIC originated at PTC (1996), extended by Dick Dunkel and Andy Whyte.',
    summary:
      'Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion, Competition. Enterprise deal qualification checklist.',
    why: 'Any enterprise deal above $50k should be scored on these eight dimensions weekly. Keeps the pipeline honest and surfaces dying deals early.',
    surface: 'Sales Toolkit tab, MEDDPICC Qualification Checklist card',
    shipped: true,
    category: 'gtm',
    ring: 3,
    year: 1996,
  },
  {
    id: 'mom-test',
    name: 'Rob Fitzpatrick — The Mom Test',
    shortName: 'Mom Test',
    origin: 'The Mom Test (2013).',
    summary:
      'Customer interviews should talk about the prospect\u2019s life and problems, not about your idea. Even your mom cannot lie about specific past behaviours.',
    why: 'Prevents the classic failure mode of interpreting polite "that sounds cool" as demand. Should be standard practice for every user interview.',
    surface: 'Roadmap: Mom Test script in the user research playbook',
    shipped: false,
    category: 'gtm',
    ring: 3,
    year: 2013,
  },
  {
    id: 'value-prop-canvas',
    name: 'Alex Osterwalder — Value Proposition Canvas',
    shortName: 'VPC',
    origin: 'Value Proposition Design (2014).',
    summary:
      'Map customer jobs, pains, and gains to products, pain relievers, and gain creators. Forces explicit fit between offer and customer.',
    why: 'Complements JTBD. A filled-in canvas for the CSO persona is a useful internal artifact and a sales collateral piece.',
    surface: 'Roadmap: filled Value Proposition Canvas per target persona',
    shipped: false,
    category: 'gtm',
    ring: 3,
    year: 2014,
  },
  {
    id: 'hormozi-offers',
    name: 'Alex Hormozi — $100M Offers value equation',
    shortName: 'Hormozi',
    origin: '$100M Offers (2021).',
    summary:
      'Perceived value equals (dream outcome × perceived likelihood of achievement) ÷ (time delay × effort and sacrifice). Maximise the numerator, minimise the denominator.',
    why: 'Useful pricing-page lens. Dream outcome (avoid a £50M bad deal) and perceived likelihood (historical calibration data) are both high; time-to-result is sub-60 seconds. The equation sells itself.',
    surface: 'Roadmap: value-equation framing on pricing page and trial CTA',
    shipped: false,
    category: 'gtm',
    ring: 3,
    year: 2021,
  },

  // ─── Ring 4: Strategy & Moat ─────────────────────────────────────
  {
    id: 'blue-ocean',
    name: 'Kim & Mauborgne — Blue Ocean Strategy',
    shortName: 'Blue Ocean',
    origin: 'Blue Ocean Strategy (2005), INSEAD.',
    summary:
      'Compete in uncontested market space by simultaneously pursuing differentiation and low cost. The Value Curve plots competing offerings across buyer attributes.',
    why: 'The DQI is the value-curve primitive. No competitor scores decision quality on a 0-to-100 composite. Plotting this in an analyst deck is immediately differentiating.',
    surface: 'Roadmap: Value Curve diagram in Strategy and Positioning tab',
    shipped: false,
    category: 'strategy',
    ring: 4,
    year: 2005,
  },
  {
    id: 'rumelt-strategy',
    name: 'Richard Rumelt — Good Strategy Bad Strategy',
    shortName: 'Rumelt',
    origin: 'Good Strategy Bad Strategy (2011).',
    summary:
      'The kernel of strategy is diagnosis, guiding policy, and coherent actions. Most "strategy" is actually wishful goals with no diagnosis.',
    why: 'Apply to the founder\u2019s quarterly strategy reviews. Also a meta-lens for evaluating the strategy documents the platform audits.',
    surface: 'Roadmap: kernel-of-strategy template for internal founder reviews',
    shipped: false,
    category: 'strategy',
    ring: 4,
    year: 2011,
  },
  {
    id: 'category-design',
    name: 'Christopher Lochhead — Category Design',
    shortName: 'Lochhead',
    origin: 'Play Bigger (2016), Niche Down (2018).',
    summary:
      'Frame it, name it, claim it. Category kings take 76% of category economics. Winning a category beats winning a product competition.',
    why: 'Already cited in the Playbook. DQI is the category primitive. Should be reinforced across every marketing surface.',
    surface: 'Category Position tab, marketing site',
    shipped: true,
    category: 'strategy',
    ring: 4,
    year: 2016,
  },
  {
    id: 'helmer-7-powers',
    name: 'Hamilton Helmer — 7 Powers',
    shortName: '7 Powers',
    origin: '7 Powers: The Foundations of Business Strategy (2016).',
    summary:
      'Seven and only seven sources of durable competitive advantage: Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power.',
    why: 'Backbone of the Moat Strength table in Competitive Positioning. Calibrated behavioural data moat maps to Cornered Resource + Process Power.',
    surface: 'Competitive Positioning tab Moat Strength table',
    shipped: true,
    category: 'moat',
    ring: 4,
    year: 2016,
  },
  {
    id: 'thiel-zero-to-one',
    name: 'Peter Thiel — Zero to One',
    shortName: 'Thiel',
    origin: 'Zero to One (2014).',
    summary:
      'Contrarian truth: what important truth do very few people agree with you on? Monopoly is the goal, competition is for losers. Last-mover advantage in a new category.',
    why: 'The contrarian truth for DI: executive teams think their decisions are rational, they are actually riddled with measurable noise and bias nobody audits.',
    surface: 'Founder Context and pitch narrative',
    shipped: true,
    category: 'strategy',
    ring: 4,
    year: 2014,
  },
  {
    id: 'strebulaev-vc',
    name: 'Ilya Strebulaev — VC Decision Science',
    shortName: 'Strebulaev',
    origin: 'Stanford GSB research on venture capital decision making.',
    summary:
      'Nine principles of VC decision making. Consensus-seeking committees have LOWER success rates. Home runs drive returns. Reframe from defensive (avoid mistakes) to offensive (swing with confidence).',
    why: 'Validates blind-prior Decision Rooms and reshapes the pitch. Unanimous-consensus toxic pattern is a direct Strebulaev citation.',
    surface: 'Strebulaev Principles section, Decision Rooms, consensus scoring',
    shipped: true,
    category: 'strategy',
    ring: 4,
    year: 2024,
  },
  {
    id: 'porter-five-forces',
    name: 'Michael Porter — Five Forces',
    shortName: 'Porter',
    origin: 'Competitive Strategy (1980), Harvard Business School.',
    summary:
      'Industry profitability is determined by supplier power, buyer power, threat of substitutes, threat of new entrants, and rivalry among existing competitors.',
    why: 'Complements 7 Powers for traditional MBA-trained buyers who still think in Five Forces. Useful translation layer, not a replacement.',
    surface: 'Roadmap: Five Forces diagram for Competitive Positioning tab',
    shipped: false,
    category: 'moat',
    ring: 4,
    year: 1980,
  },
  {
    id: 'aggregation-theory',
    name: 'Ben Thompson — Aggregation Theory',
    shortName: 'Aggregation',
    origin: 'Stratechery, multiple essays since 2015.',
    summary:
      'In the internet era, value accrues to whoever aggregates demand, not whoever controls supply. The moat is the user relationship + data network effects, not the underlying technology.',
    why: 'The behavioural-data flywheel is a true moat in an age of commodity LLMs. The model is not the moat — calibrated outcome data is.',
    surface: 'Roadmap: Aggregation Theory moat essay in marketing surfaces',
    shipped: false,
    category: 'moat',
    ring: 4,
    year: 2015,
  },
];

// ─── LINEAGE: directed edges, source id → the ideas it draws on ───────────
// Each edge points BACKWARD to the underlying / earlier idea. This is the
// graph the constellation draws when a node is selected.
export const LINEAGE: Record<string, LineageEdge[]> = {
  'kahneman-sibony-noise': [
    {
      to: 'tversky-kahneman-s1s2',
      kind: 'builds_on',
      note: 'Kahneman’s later program — from biased judgment to variable judgment.',
    },
  ],
  'klein-rpd': [
    {
      to: 'tversky-kahneman-s1s2',
      kind: 'adversarial',
      note: 'The 2009 Kahneman–Klein adversarial collaboration: naturalistic expertise vs heuristics-and-biases, reconciled into “audit, don’t replace.”',
    },
  ],
  'annie-duke-bets': [
    {
      to: 'tversky-kahneman-s1s2',
      kind: 'builds_on',
      note: 'Resulting bias = confusing outcome quality with decision quality.',
    },
  ],
  'tetlock-superforecasting': [
    {
      to: 'bayes',
      kind: 'measures',
      note: 'Brier scores make calibration a Bayesian, testable number.',
    },
    {
      to: 'klein-rpd',
      kind: 'synthesizes',
      note: 'Hybrid human-machine beats either alone — Kahneman’s rigor × Klein’s recognition.',
    },
  ],
  'dawes-improper-linear': [
    {
      to: 'meehl-clinical-statistical',
      kind: 'builds_on',
      note: 'Improper (even equal) weights still beat clinicians — consistency is the edge.',
    },
  ],
  'dietvorst-algorithm-aversion': [
    {
      to: 'dawes-improper-linear',
      kind: 'builds_on',
      note: 'Why people reject the Meehl–Dawes finding — and the fix: let them tune the model.',
    },
  ],
  ferrucci: [
    {
      to: 'tetlock-superforecasting',
      kind: 'mechanizes',
      note: 'The machine endpoint of the hybrid thesis — instant, and it shows its evidence.',
    },
    {
      to: 'meehl-clinical-statistical',
      kind: 'builds_on',
      note: 'A mechanical model that explains its reasoning trail.',
    },
  ],
  'heuer-sats': [
    {
      to: 'tversky-kahneman-s1s2',
      kind: 'builds_on',
      note: 'Heuer brought heuristics-and-biases into CIA tradecraft.',
    },
  ],
  'pre-mortem': [
    { to: 'klein-rpd', kind: 'builds_on', note: 'Klein’s prospective-hindsight tool.' },
    {
      to: 'heuer-sats',
      kind: 'builds_on',
      note: 'Adopted into the Structured Analytic Techniques suite.',
    },
  ],
  'red-team': [
    {
      to: 'heuer-sats',
      kind: 'builds_on',
      note: 'Institutionalised dissent — a core Structured Analytic Technique.',
    },
  ],
  'reference-class': [
    {
      to: 'tversky-kahneman-s1s2',
      kind: 'builds_on',
      note: 'The outside view corrects base-rate neglect.',
    },
    { to: 'heuer-sats', kind: 'builds_on', note: 'A standard analytic technique.' },
  ],
  'strebulaev-vc': [
    {
      to: 'wisdom-crowds',
      kind: 'builds_on',
      note: 'Independence beats consensus — the diversity condition, applied to VC.',
    },
  ],
  'category-design': [
    {
      to: 'thiel-zero-to-one',
      kind: 'builds_on',
      note: 'The contrarian truth becomes a new category.',
    },
  ],
  'aggregation-theory': [
    {
      to: 'helmer-7-powers',
      kind: 'builds_on',
      note: 'Data network effects = Cornered Resource + Process Power.',
    },
  ],
};

// ─── PER-NODE DEPTH: the quote, the mechanism, and the room-tested rebuttal ──
// Authored for the defensibility spine. Softer GTM nodes intentionally omitted
// (their origin/summary/why already carry them) — no padded filler.
export const THINKER_DEPTH: Record<string, ThinkerDepth> = {
  'tversky-kahneman-s1s2': {
    quote:
      '“The confidence people have in their beliefs is not a measure of the quality of the evidence.”',
    quoteSource: 'Kahneman, Thinking, Fast and Slow (2011)',
    mechanism:
      'The bias taxonomy detected across the pipeline maps each flag to a specific paper in this program — anchoring, availability, representativeness, loss aversion, confirmation.',
    objection: '“My team are experienced operators, not undergrads in a lab experiment.”',
    rebuttal:
      'These effects replicate hardest in exactly the high-stakes, low-feedback settings executives work in. Expertise narrows some biases and widens others — overconfidence, the inside view. The audit names which.',
  },
  'kahneman-sibony-noise': {
    quote: '“Wherever there is judgment, there is noise — and usually more of it than you think.”',
    quoteSource: 'Kahneman, Sibony & Sunstein, Noise (2021)',
    mechanism:
      'The triple-judge engine measures decision variance directly; the NoiseTax component of the DQI is the scalar.',
    objection: '“Noise is academic — show me it costs real money.”',
    rebuttal:
      'The book’s own underwriter study found 55% variance where executives expected 10%. On a £50M decision, that spread IS the money. We measure it per memo, not as a slogan.',
  },
  'klein-rpd': {
    quote:
      '“Experts size up a situation and recognize a workable course of action — they do not compare a list of options.”',
    quoteSource: 'Klein, Sources of Power (1998)',
    mechanism:
      'The Pattern Recognition surface mines historical analog cases so the audit AMPLIFIES expert recognition instead of overriding it. This is Klein’s half of R²F.',
    objection: '“So you admit intuition works — then why audit it?”',
    rebuttal:
      'Klein and Kahneman settled this together in 2009: intuition is trustworthy only in high-validity, fast-feedback environments. Strategic M&A is the opposite. The audit tells you which regime you are in.',
  },
  'tetlock-superforecasting': {
    quote:
      '“The strongest predictor of rising into the superforecaster ranks is perpetual beta — the degree to which one updates beliefs.”',
    quoteSource: 'Tetlock & Gardner, Superforecasting (2015)',
    mechanism:
      'Brier-scored calibration on logged decisions; the personal calibration dashboard and its Bronze→Platinum tiers. The hybrid human-machine setup the IARPA tournaments proved best IS the product architecture.',
    objection: '“You can’t Brier-score a one-off strategic call — there is no tournament.”',
    rebuttal:
      'You score the flag, not the forecast: did the reasoning-risk we named materialise? Logged over many decisions, that calibrates. We never claim to predict the price.',
  },
  'annie-duke-bets': {
    quote: '“The quality of a decision and the quality of its outcome are two different things.”',
    quoteSource: 'Duke, Thinking in Bets (2018)',
    mechanism:
      'The DQI scores the decision, not the result; resulting-bias callouts + the outcome-reporting loop keep the two separate, so a good process that got unlucky is still scored well.',
    objection: '“Founders are paid on outcomes, not process scores.”',
    rebuttal:
      'Exactly why you need the split. Over many decisions, process quality is the only thing you control; outcomes regress to it. The score is the leading indicator the P&L lags.',
  },
  bayes: {
    quote:
      '“Update the prior with the likelihood of the evidence — belief should move only as far as the evidence warrants.”',
    quoteSource: 'Bayes (1763), formalised by Laplace, Jeffreys, Jaynes',
    mechanism:
      'Blind priors captured in Decision Rooms BEFORE evidence arrives create a clean audit trail of belief change — the bayesian-priors engine scores the update.',
    objection: '“Nobody actually computes Bayes in a board meeting.”',
    rebuttal:
      'You do not have to. Capturing the prior cleanly and measuring how far it moved is the whole value — it surfaces anchoring and motivated updating without anyone touching a formula.',
  },
  'meehl-clinical-statistical': {
    quote:
      '“There is no controversy in social science that shows so large a body of qualitatively diverse studies coming out so uniformly… as the comparison of clinical and actuarial prediction.”',
    quoteSource: 'Meehl (1986), reflecting on his 1954 monograph',
    mechanism:
      'The DQI composite IS the actuarial model: a fixed, transparent rule applied identically to every memo. Mechanical by design — the source of the edge, not a limitation.',
    objection: '“A formula can’t capture strategic nuance the way a seasoned CSO can.”',
    rebuttal:
      'Sixty years of replication say the seasoned judge loses to the formula — because the human is inconsistent, not because the formula is smart. The model never has a bad morning. We do not remove the CSO; we give them the consistent baseline.',
  },
  'dawes-improper-linear': {
    quote: '“The whole trick is to know what variables to look at and then to know how to add.”',
    quoteSource: 'Dawes, The Robust Beauty of Improper Linear Models (1979)',
    mechanism:
      'The DQI weights are defensible precisely because Dawes proved exact weights barely matter; the held-out distribution check shows the score is stable across reasonable weightings.',
    objection: '“Your weights are arbitrary, so the score is arbitrary.”',
    rebuttal:
      'Dawes’ result is that improper — even equal — weights still beat experts. Arbitrary-but-consistent is the point. And per Dietvorst, you can tune them yourself; the ranking barely moves.',
  },
  'dietvorst-algorithm-aversion': {
    quote:
      '“People are more willing to use an imperfect algorithm if they can adjust it, even just a little.”',
    quoteSource: 'Dietvorst, Simmons & Massey, Overcoming Algorithm Aversion (2016)',
    mechanism:
      'User-adjustable DQI weights (DqiWeightOverride). The slider is the literal Dietvorst fix — give the expert a little control and they keep using the model that beats them.',
    objection: '“If I can change the weights, what is the model even for?”',
    rebuttal:
      'The model anchors you to a consistent baseline; your adjustment is bounded and logged. You get the consistency edge of the formula AND the engagement that stops you abandoning it the first time it surprises you.',
  },
  ferrucci: {
    quote:
      '“The goal isn’t a system that answers — it’s a system that reasons, and can show you why.”',
    quoteSource: 'Ferrucci, on Elemental Cognition’s thesis',
    mechanism:
      'The metaJudge final verdict + the Decision Provenance Record: a machine verdict carrying its evidence quotes, confidence, and reasoning trail — auditable, not a black box.',
    objection: '“This is just an LLM with a clever prompt — a wrapper.”',
    rebuttal:
      'A wrapper returns an opinion. This returns a calibrated, evidence-cited, tamper-evident record built on a documented 50-year technique. The defensibility is the provenance + the calibration data, not the model call.',
  },
  'heuer-sats': {
    quote:
      '“Analysts should be self-conscious about their reasoning process… and the techniques that can improve it.”',
    quoteSource: 'Heuer, Psychology of Intelligence Analysis (CIA, 1999)',
    mechanism:
      'Pre-mortem, competing hypotheses, key-assumptions check and red team are SATs Heuer codified; DI automates the suite (pre-mortem shipped, ACH/red-team on the roadmap).',
    objection: '“Strategy isn’t spycraft — why should an IC technique apply to my deal?”',
    rebuttal:
      'The CIA adopted these BECAUSE the analysts were brilliant and still wrong — the same failure mode as a smart deal team. The techniques are domain-general debiasing. We did not invent them; we made them instant.',
  },
  'pre-mortem': {
    quote:
      '“Imagine we are a year into the future. We implemented the plan as it now exists. The outcome was a disaster. Write a brief history of that disaster.”',
    quoteSource: 'Klein, Performing a Project Premortem (HBR, 2007)',
    mechanism:
      'Pre-Mortem Scenario Cards generate the prospective-hindsight failure narrative directly from the memo’s flagged risks.',
    objection: '“We already do a risks slide.”',
    rebuttal:
      'A risks slide asks “what could go wrong?” — optimism suppresses the honest answer. Prospective hindsight (“it already failed; write why”) reliably surfaces more, and franker, failure causes. Different question, different output.',
  },
  'red-team': {
    quote:
      '“If nine men agree, the role of the tenth is to disagree, no matter how improbable his reasoning.”',
    quoteSource: 'The 10th Man rule, Israeli military intelligence (post-1973)',
    mechanism:
      'A forced-dissent Red Team role in Decision Rooms makes structured disagreement a first-class primitive — the system absorbs the political cost of being the contrarian.',
    objection: '“My team will say they already challenge each other.”',
    rebuttal:
      'Voluntarily, the contrarian pays a political tax and usually stays quiet. Strebulaev’s data shows consensus committees underperform. Assigning dissent to the system, not a person, is the unlock.',
  },
  'reference-class': {
    quote:
      '“The single most important piece of advice for improving a forecast is to take the outside view.”',
    quoteSource: 'Kahneman & Tversky; Flyvbjerg, on reference-class forecasting',
    mechanism:
      'The Outside View card surfaces the base rate of comparable historical decisions from the case library, against the memo’s inside-view projection.',
    objection: '“This deal is genuinely different from the comparables.”',
    rebuttal:
      'Everyone’s deal is. The inside-view feeling of uniqueness is exactly the bias reference-class forecasting corrects. We show the base rate; you argue, on the record, why you beat it.',
  },
  'helmer-7-powers': {
    quote:
      '“A Power is a condition that creates the potential for persistent differential returns.”',
    quoteSource: 'Helmer, 7 Powers (2016)',
    mechanism:
      'The Moat Strength table maps DI’s calibrated behavioural data to Cornered Resource + Process Power — the two of Helmer’s seven that a commodity-LLM era leaves standing.',
    objection: '“With GPT-N, anyone rebuilds your audit in a weekend.”',
    rebuttal:
      'They rebuild the prompt, not the moat. The asset is the accumulating decision→outcome dataset (Cornered Resource) and the workflow embeddedness (Process Power) — neither of which a weekend buys.',
  },
  'aggregation-theory': {
    quote:
      '“Value accrues to whoever aggregates demand and owns the data it generates, not whoever controls supply.”',
    quoteSource: 'Ben Thompson, Stratechery (Aggregation Theory)',
    mechanism:
      'Every logged decision + outcome feeds the per-org calibration data — a network effect that compounds with use and cannot be copied from outside.',
    objection: '“You have no data yet, so you have no moat yet.”',
    rebuttal:
      'Correct, and we say so. The moat is downstream of traction — which is precisely why the plan is to get embedded and earn the calibration data, not to claim a moat we have not built.',
  },
  'category-design': {
    quote:
      '“Category kings capture the majority of the category’s economics. Win the category, not the product.”',
    quoteSource: 'Ramadan, Peterson, Lochhead & Maney, Play Bigger (2016)',
    mechanism:
      'The DQI is the category primitive — a 0–100 decision-quality score nobody else publishes; reinforced as “the reasoning audit platform” across every surface.',
    objection: '“Inventing a category is just marketing — buyers want a tool that works.”',
    rebuttal:
      'The category is pole position, not the moat — we are clear on that. But the buyer who has language for the problem (“unaudited reasoning”) buys faster. The category sells; the calibration data defends.',
  },
  'strebulaev-vc': {
    quote:
      '“The best venture investors are not consensus seekers. Unanimous approval is a warning sign, not a green light.”',
    quoteSource: 'Strebulaev & Dmitriev, The Venture Mindset (2024)',
    mechanism:
      'Blind-prior Decision Rooms + consensus scoring flag the unanimous-approval toxic pattern directly — independence before discussion, Strebulaev’s exact prescription.',
    objection: '“Disagreement just slows the committee down.”',
    rebuttal:
      'Strebulaev’s data: consensus committees have LOWER hit rates. The cost is not speed, it is correlated error. Capturing independent priors before the room converges is the cheapest fix there is.',
  },
  'thiel-zero-to-one': {
    quote: '“What important truth do very few people agree with you on?”',
    quoteSource: 'Thiel, Zero to One (2014)',
    mechanism:
      'The contrarian truth grounds the pitch narrative: executive teams believe their decisions are rational; they are riddled with measurable noise and bias nobody audits.',
    objection: '“If the truth is real, why hasn’t a bigger player taken it?”',
    rebuttal:
      'Incumbents are structurally conflicted or sell the opposite — confidence, not doubt. Last-mover advantage in a category no one else wants to name is the Thiel play.',
  },
};

// ─── THE ARGUMENT: the 7 nodes that, in order, ARE the case for Decision Intel.
// "Walk the argument" steps through these — disease → fix → synthesis →
// provenance → measurement → machine → moat.
export const ARGUMENT_PATH: ArgumentBeat[] = [
  {
    id: 'tversky-kahneman-s1s2',
    step: 1,
    title: 'The disease',
    beat: 'Start with the disease. Human judgment is not occasionally wrong — it is systematically, predictably wrong, in ways that repeat across every executive committee.',
  },
  {
    id: 'meehl-clinical-statistical',
    step: 2,
    title: 'The uncomfortable cure',
    beat: 'The cure, proven since 1954: a simple, consistent mechanical model beats expert gut — which is the only reason a decision-quality SCORE can exist at all.',
  },
  {
    id: 'klein-rpd',
    step: 3,
    title: 'The synthesis',
    beat: 'But experts hold real, pattern-matched intuition. So the move is not to replace judgment. The synthesis — Kahneman’s rigor × Klein’s recognition — is to audit it.',
  },
  {
    id: 'heuer-sats',
    step: 4,
    title: 'The provenance',
    beat: 'This is not novel — it is provenance. The CIA has run these exact techniques by hand for fifty years: pre-mortem, competing hypotheses, red team. Slow, political, expensive.',
  },
  {
    id: 'tetlock-superforecasting',
    step: 5,
    title: 'The measurement',
    beat: 'And it is testable. Calibration and Brier scores prove whether the audit actually improves outcomes. Hybrid human-machine beats either alone.',
  },
  {
    id: 'ferrucci',
    step: 6,
    title: 'The machine',
    beat: 'The machine makes the fifty-year-old tradecraft instant — and shows its evidence trail. That is Decision Intel: automated Structured Analytic Techniques you can audit.',
  },
  {
    id: 'aggregation-theory',
    step: 7,
    title: 'The moat',
    beat: 'The model is a commodity. The moat is the calibrated outcome data that compounds with every decision logged — a cornered resource no wrapper can copy.',
  },
];

// ─── Strebulaev's 9 principles (VC Decision Science) ──────────────
// Kept as first-class data because each has rich product/startup/actions content.

export interface StrebulaevPrinciple {
  num: number;
  principle: string;
  summary: string;
  product: string;
  startup: string;
  actions: string[];
  color: string;
}

export const STREBULAEV_PRINCIPLES: StrebulaevPrinciple[] = [
  {
    num: 1,
    principle: 'Home runs matter, strikeouts don\u2019t',
    summary:
      'Only 1 in 20 VC investments hits a home run, but a single winner returns 100x. Failure tolerance is structural, not emotional.',
    product:
      'Reframe from defensive to offensive. DQI doesn\u2019t just help avoid bad decisions — it gives committee members permission to swing big because they\u2019ve stress-tested the thesis.',
    startup:
      'Go all-in on the enterprise strategy beachhead. Don\u2019t build 6 features for 4 markets. Your home run is one flagship customer that becomes a case study.',
    actions: [
      'Rewrite landing hero from "avoid mistakes" to "decide with confidence"',
      'Focus pilot outreach on 5 target organisations, not 50',
    ],
    color: '#22c55e',
  },
  {
    num: 2,
    principle: 'Agree to disagree',
    summary:
      'VC firms pursuing consensus have LOWER IPO rates. The best firms let a single partner with conviction push a deal through. Microsoft M12 has an anti-veto rule.',
    product:
      'Committee Decision Rooms with blind prior collection are a direct implementation. Cite Strebulaev in marketing. Consensus scoring quantifies when agreement is genuine vs. groupthink.',
    startup:
      'When building your advisory board, don\u2019t surround yourself with people who agree with you. Productive disagreement correlates with better outcomes.',
    actions: [
      'Add Strebulaev citation to Committee Rooms UI + marketing',
      'Create a "Dissent Quality" metric in consensus scoring',
      'Blog post: "Why your IC\u2019s consensus is killing returns"',
    ],
    color: '#3b82f6',
  },
  {
    num: 3,
    principle: 'Get outside your four walls',
    summary:
      'VCs maintain 2–3x larger, more diverse LinkedIn networks than corporate executives. Insularity kills innovation.',
    product:
      'Slack integration puts DI inside the daily workflow where decisions are discussed — not as a standalone app. Cross-department edge type in the knowledge graph detects organisational silos.',
    startup:
      'Be embedded in your target communities. Strategy conferences, M&A events, risk management circles. Don\u2019t sell from the outside — be part of the ecosystem.',
    actions: [
      'Attend 2 industry conferences per quarter',
      'Launch a "Decision Quality" newsletter for enterprise leaders',
      'Build a Slack community for decision-makers',
    ],
    color: '#f59e0b',
  },
  {
    num: 4,
    principle: 'The jockey vs. the horse',
    summary:
      'The most important investment factor is team quality, not business model. The "jockey" matters more than the "horse" in most cases.',
    product:
      'Management Halo Effect is already detected. Go deeper: build a Jockey/Horse Balance Score — flag when a memo is 80% team pedigree / 20% fundamentals.',
    startup: `Your codebase IS your jockey credibility: causal learning service, ${BIAS_COUNT}-bias taxonomy, ${MATRIX_DIMENSION}×${MATRIX_DIMENSION} interaction matrix. In technical DD, depth signals you\u2019re the right founder.`,
    actions: [
      'Add Jockey/Horse Balance Score to bias detection',
      'Track ratio of team vs. fundamentals language in memos',
      'Prepare "why me" narrative for investor conversations',
    ],
    color: '#ef4444',
  },
  {
    num: 5,
    principle: 'The prepared mind',
    summary:
      '"Chance favours only the prepared mind" (Pasteur). Jensen Huang spends 2–3 hours daily studying emerging tech. The best operators recognize opportunities instantly because they\u2019ve studied deeply.',
    product:
      'Boardroom Simulation IS a prepared-mind tool. You\u2019re giving members a pre-briefing on which biases historically damaged similar decisions. Lean into the framing: you\u2019re preparing decision-makers, not auditing documents.',
    startup:
      'Spend 30 min daily reading industry news, academic papers, competitor updates. Your Intelligence Hub RSS feeds should be your own morning briefing too.',
    actions: [
      'Rename "Pre-Meeting Bias Briefing" to "Prepared Mind Briefing"',
      'Add a "Prepare for Meeting" CTA before committee meetings',
      'Subscribe to 3 industry newsletters personally',
    ],
    color: '#8b5cf6',
  },
  {
    num: 6,
    principle: 'Fast lane, then slow lane',
    summary:
      'VCs filter rapidly first ("why NOT invest?" to eliminate red flags), then switch to deep 120-hour due diligence for serious prospects.',
    product:
      'BUILD: Quick Scan mode — a fast 30-second bias check that flags top 2–3 red flags before committing to the full 12-node pipeline (4 minutes). Mirrors how operators actually work.',
    startup:
      'Apply to your own sales process. Qualify leads fast: "Do you have a decision committee? Do you review strategic memos before major decisions?" If no to either, move on.',
    actions: [
      'Build Quick Scan feature (top priority — Strebulaev-backed)',
      'Add 2-question lead qualification before demos',
      'Create a "Red Flag Preview" that runs before full analysis',
    ],
    color: '#22c55e',
  },
  {
    num: 7,
    principle: 'Double down and quit',
    summary:
      'VCs combat escalation of commitment structurally: require multiple investors for follow-ons, bring in arm\u2019s-length co-investors, require partner consensus on follow-ons.',
    product:
      'BUILD: Longitudinal bias tracking. Don\u2019t just analyse individual memos — track how bias patterns change over the life of a decision. Does confirmation bias increase from screening to follow-on? Unique, hard-to-replicate feature.',
    startup:
      'Apply to your own features. Some features you shipped won\u2019t get traction. Be willing to kill them rather than doubling down. Measure usage monthly.',
    actions: [
      'Build decision-level longitudinal bias tracking',
      'Compare bias severity across decision stages',
      'Set up monthly feature usage analytics',
    ],
    color: '#3b82f6',
  },
  {
    num: 8,
    principle: 'Sharing the pie (incentive alignment)',
    summary:
      'VCs invented vesting schedules in the 1970s. The principle: align incentives across contributors to prevent short-term behaviour.',
    product:
      'Carry incentive distortion is already detected. Go deeper: detect when memo enthusiasm correlates with the deal\u2019s impact on a specific partner\u2019s carry economics. Track advocacy intensity near fund deadlines.',
    startup:
      'When you hire your first team members, offer meaningful equity. Aligned incentives outperform salary-heavy compensation in startups.',
    actions: [
      'Enhance carry incentive detection with fund-timeline awareness',
      'Detect deployment pressure signals ("need to put capital to work")',
      'Design equity plan for first 3 hires',
    ],
    color: '#f59e0b',
  },
  {
    num: 9,
    principle: 'VC-backed companies shape the economy',
    summary:
      '50% of US IPOs over 50 years were VC-backed. 75% of large public companies. VC-backed companies spend 92¢ of every R&D dollar. When committees make biased decisions, the ripple effects go far beyond the fund.',
    product:
      'Highest-level pitch narrative: "Decision Intel doesn\u2019t just protect organisational outcomes — it improves decision-making across the economy." When a biased committee kills a good initiative, innovation is lost.',
    startup:
      'This framing elevates you from SaaS tool vendor to mission-driven company. Investors respond to mission, not just TAM.',
    actions: [
      'Add this framing to pitch deck\u2019s "Why this matters" slide',
      'Use in PR: "improving how capital flows to innovation"',
      'Blog: "The hidden cost of committee bias on the innovation economy"',
    ],
    color: '#ef4444',
  },
];

// ─── Supplementary research library (podcasts, long-form essays) ──

export interface LibraryEntry {
  id: string;
  title: string;
  source: string;
  type: string;
  link: string;
  insight: string;
  product: string;
  startup: string;
  actions: string[];
  category: 'vc' | 'foundations' | 'category' | 'gtm' | 'strategy' | 'moat';
  color: string;
}

export const LIBRARY_CATEGORY_META: Record<
  LibraryEntry['category'],
  { label: string; color: string }
> = {
  vc: { label: 'VC Decision Science', color: '#16A34A' },
  foundations: { label: 'Decision Science Foundations', color: '#F59E0B' },
  category: { label: 'Category Creation', color: '#EF4444' },
  gtm: { label: 'GTM & Sales', color: '#3B82F6' },
  strategy: { label: 'Founder Strategy', color: '#8B5CF6' },
  moat: { label: 'Moat Theory', color: '#06B6D4' },
};

export const RESEARCH_LIBRARY: LibraryEntry[] = [
  {
    id: 'kahneman-clearer',
    title: 'Daniel Kahneman: Beyond cognitive biases — reducing noise',
    source: 'ClearerThinking Podcast',
    type: 'Podcast',
    link: 'https://podcast.clearerthinking.org/episode/072/',
    insight:
      'Insurance underwriter study: executives expected 10% variability between judges. Actual: 55%. One underwriter prices at $9,500, another at $16,700 on the identical case. Noise is at least as damaging as bias, and organisations almost never measure it.',
    product:
      'Triple-judge noise scoring is a direct implementation of this methodology. Use the 10% vs 55% stat in every sales conversation — it\u2019s the "holy shit" moment.',
    startup:
      'Offer a free "noise audit" of a team\u2019s last 5 strategic documents as top-of-funnel hook. Let them see the problem before pitching the solution.',
    actions: [
      'Use 10% vs 55% stat in opening of every demo',
      'Build free noise audit landing page',
      'Create a 1-pager: "How much noise is in your decisions?"',
    ],
    category: 'foundations',
    color: '#F59E0B',
  },
  {
    id: 'sibony-grooves',
    title: 'Olivier Sibony: "Decision Hygiene" framework',
    source: 'Behavioral Grooves + Euronews',
    type: 'Podcast / Interview',
    link: 'https://behavioralgrooves.com/episode/noise-with-olivier-sibony/',
    insight:
      'Kahneman\u2019s co-author on Noise, former McKinsey partner. Framework: checklists, pre-mortems, structured independent assessments, and noise audits. Noise audits should be the starting point — orgs need to see how bad the problem is before buying a solution.',
    product:
      'Sibony\u2019s framework \u2014 checklists, pre-mortems, structured independent assessments, noise audits \u2014 is the closest academic anchor for what DI does. We cite Sibony as a research foundation; we do NOT adopt his "decision hygiene" term as our category language (BANNED_VOCABULARY in src/lib/constants/icp.ts: borrowing it cedes our category vocabulary to a more famous author). Position DI as "reasoning layer / R\u00b2F / pre-decision audit", quote Sibony as the academic ancestor.',
    startup:
      'His "noise audit first" approach suggests a sales motion: offer a free noise audit of 5 strategic documents. Let prospects SEE the problem before pitching the solution.',
    actions: [
      'Build free noise audit landing page as lead gen',
      'Cite Sibony as research foundation (not as DI category language)',
      'NEVER adopt "decision hygiene" as DI positioning \u2014 it is banned vocabulary per icp.ts',
    ],
    category: 'foundations',
    color: '#F59E0B',
  },
  {
    id: 'klein-decision-studio',
    title: 'Gary Klein: Naturalistic Decision Making',
    source: 'The Decision-Making Studio (Ep. 234)',
    type: 'Podcast',
    link: 'https://podcasts.apple.com/us/podcast/ep-234-dr-gary-klein/id1054744455?i=1000677192489',
    insight:
      'Klein invented the pre-mortem. He and Kahneman were "collaborative adversaries" — Kahneman trusts systematic processes, Klein trusts expert intuition. The tension between them is the exact tension DI navigates.',
    product:
      'RPD framework is shipped: recognition cues, narrative pre-mortems, RPD simulator, personal calibration dashboard. Dual-framework positioning is live — sceptical leaders see their intuition amplified, not overridden.',
    startup:
      'When leaders push back with "we trust our judgment," don\u2019t argue. Say: "We do too. Klein proved expert intuition is powerful. Our RPD framework surfaces the cues an expert with 10+ similar decisions would notice."',
    actions: [
      'Use Kahneman–Klein dual framework in sales: "suppress bias AND amplify intuition"',
      'Demo the RPD tab as the second wow-moment after Boardroom Simulation',
    ],
    category: 'foundations',
    color: '#F59E0B',
  },
  {
    id: 'duke-greenberg',
    title: 'Annie Duke & Spencer Greenberg: Decision education',
    source: 'Decision Education Podcast (Sep 2025)',
    type: 'Podcast',
    link: 'https://www.annieduke.com/the-decision-education-podcast-with-guest-spencer-greenberg/',
    insight:
      'Knowing the name of a bias doesn\u2019t help you overcome it. Awareness alone is nearly useless. What works: pre-commitment contracts, structured decision processes, and Bayesian updating.',
    product:
      'Validates the nudge system and decision architecture (blind priors, pre-mortems) over simple bias reports. Real value isn\u2019t detecting biases — it\u2019s interventions that make it harder to ACT on bias.',
    startup:
      'Don\u2019t oversell bias detection in demos. Lead with architecture: "We don\u2019t just tell you about your biases — we make it structurally harder to act on them."',
    actions: [
      'Reframe marketing: "detection + intervention"',
      'Emphasize nudge system and blind priors in demos',
      'Blog: "Why bias awareness doesn\u2019t work (and what does)"',
    ],
    category: 'foundations',
    color: '#F59E0B',
  },
  {
    id: 'tetlock-80k',
    title: 'Philip Tetlock: "Hybrid Mind" — human + AI forecasting',
    source: '80,000 Hours Podcast (Oct 2025)',
    type: 'Podcast',
    link: 'https://80000hours.org/podcast/episodes/prof-tetlock-predicting-the-future/',
    insight:
      'Human-machine hybrids beat both pure AI and pure human judgment in forecasting tournaments. 40 years of data: process matters more than talent — superforecasters aren\u2019t smarter, they follow better processes.',
    product:
      'DI IS a human-machine hybrid: AI detects biases and measures noise, humans make the final call. Tetlock gives you the language: "Process beats talent. Our platform ensures your team follows the process that produces better outcomes."',
    startup:
      '"Process beats talent" in one sentence IS your value proposition. Use Tetlock\u2019s authority to back the claim.',
    actions: [
      'Add Tetlock citation to product philosophy page',
      'Use "process beats talent" in pitch decks',
      'Reference Hybrid Mind tournament results in technical DD',
    ],
    category: 'foundations',
    color: '#F59E0B',
  },
  {
    id: 'lochhead-lenny',
    title: 'Christopher Lochhead: "How to become a category pirate"',
    source: 'Lenny\u2019s Podcast',
    type: 'Podcast / Newsletter',
    link: 'https://www.lennysnewsletter.com/p/how-to-become-a-category-pirate-christopher',
    insight:
      'The company that creates a category captures 2/3 of the market value. Framework: "Frame it, name it, claim it." The "better trap" — competing on being better within an existing category — is death.',
    product:
      'You\u2019re not building a "better CRM" or a "better DD tool." You\u2019re creating the category of Decision Quality. DQI should become the term CSOs use like IRR and MOIC.',
    startup:
      'Frame the problem (strategic decisions are riddled with undetected bias and noise), name the solution (Decision Quality Index), claim the category (Decision Intel is the decision quality platform for corporate strategy).',
    actions: [
      'Make DQI the centerpiece term in all marketing',
      'Write a "Category Point of View" document (Lochhead framework)',
      'PR strategy: get DQI mentioned in strategy/PE trade publications',
    ],
    category: 'category',
    color: '#EF4444',
  },
  {
    id: 'zhou-affinity',
    title: 'Ray Zhou (Affinity): From college dropout to SaaS leader',
    source: 'Platform Builders Podcast',
    type: 'Podcast',
    link: 'https://www.heavybit.com/library/podcasts/platform-builders/ep-4-building-affinity-from-college-dropout-to-saas-leader-with-ray-zhou',
    insight:
      'Built Affinity into a late-eight-figure CRM for PE/VC. Three lessons: (1) hundreds of problem-first conversations before building features, (2) founder-led onboarding for every early customer, (3) focus on problems closest to core business.',
    product:
      'Decision quality is core, not tangential. That\u2019s your moat vs. "AI assistant" tools that summarise documents — those are tangential, yours is fundamental.',
    startup:
      'Personally onboard every pilot customer. Conduct 50+ discovery calls focused on "how does your team actually make major decisions?" — not "let me show you features."',
    actions: [
      'Target 50 discovery calls before next feature sprint',
      'Personally onboard every pilot — no self-serve yet',
      'Document every onboarding as a playbook',
      'Ask: "Walk me through your last major decision"',
    ],
    category: 'gtm',
    color: '#3B82F6',
  },
  {
    id: 'thiel-investors-pod',
    title: 'Peter Thiel: Zero to One — contrarian truths',
    source: 'The Investors Podcast (MI383)',
    type: 'Podcast Deep Dive',
    link: 'https://www.theinvestorspodcast.com/millennial-investing/zero-to-one-lessons-from-peter-thiel-w-shawn-omalley/',
    insight:
      'Contrarian question: "What important truth do very few people agree with you on?" Monopoly framework: dominate a small niche, then expand in concentric circles. Sales and distribution matter as much as product.',
    product:
      'Contrarian truth: "Executive teams think their decisions are rational, but they\u2019re riddled with measurable cognitive noise and bias nobody audits." Monopoly niche: enterprise decision quality. Concentric expansion: M&A/Strategy → PE/VC → FinServ → horizontal.',
    startup:
      'The best 12-node pipeline means nothing if you can\u2019t get it in front of decision-makers. Distribution matters as much as the product. Conferences, Slack communities, thought leadership, referral loops are your channels.',
    actions: [
      'Write down your contrarian truth and use it in every pitch',
      'Map your concentric expansion circles',
      'Allocate 50% of time to distribution, not just product',
      'Build referral incentive for pilot customers',
    ],
    category: 'strategy',
    color: '#8B5CF6',
  },
  {
    id: 'thompson-aggregation',
    title: 'Ben Thompson: Aggregation Theory and the behavioural-data moat',
    source: 'Stratechery',
    type: 'Long-form essay series',
    link: 'https://stratechery.com/aggregation-theory/',
    insight:
      'In commodity-LLM markets the model is not the moat — the calibrated outcome data is. Aggregation Theory: value accrues to whoever owns the demand-side user relationship + the feedback loop that feeds it. The 18-month corpus of org-calibrated causal weights, nudge acceptance rates, outcome-gate resolutions, and calibration scores is the supplier-modularization layer.',
    product:
      'Every product surface must write back to the dataset: Outcome Gate, nudge acceptance, calibration deltas, toxic pattern false-positive rates, org-specific causal weights. Anything that just calls Gemini without feeding the loop is a commodity feature.',
    startup:
      'Investor pitch reframe: "The model is replaceable. The behavioural dataset is not. We are the aggregator between decision-makers and calibrated outcomes." Every commodity LLM release makes the moat deeper, not shallower.',
    actions: [
      'Add an Aggregation Theory slide to investor deck',
      'Audit every product surface for write-back to the behavioural dataset',
      'Lead founder essays with "the model is replaceable, the data is not"',
      'Cross-link Aggregation Theory entry in Methodologies tab',
    ],
    category: 'moat',
    color: '#06B6D4',
  },
];

// ─── The Noise moment (for NoiseMomentViz) ────────────────────────

export const NOISE_MOMENT = {
  source:
    'Kahneman, Sibony, Sunstein — Noise (2021). Based on Kahneman\u2019s insurance underwriter study.',
  expectedVariance: 10, // % — what execs expected before the study
  actualVariance: 55, // % — what the study found
  example: {
    low: 9500,
    high: 16700,
    unit: '$',
    framing: 'Two underwriters. Identical case file. 76% price delta.',
  },
  implication:
    'Noise is at least as damaging as bias, and organisations almost never measure it. The first question in every sales call: "How do you measure the variance in your decision process today?"',
};

// ─── Dual framework (Kahneman ↔ Klein) ────────────────────────────

export const DUAL_FRAMEWORK = {
  kahneman: {
    pole: 'Structured debiasing',
    book: 'Thinking, Fast and Slow (2011); Noise (2021)',
    thesis:
      'Human judgment is systematically flawed. Structured processes beat intuition at scale.',
    diProduct: [
      `${BIAS_COUNT}-bias taxonomy detection`,
      'Triple-judge noise decomposition',
      'Structured DQI components',
      'Blind priors in Decision Rooms',
    ],
  },
  klein: {
    pole: 'Expert intuition amplification',
    book: 'Sources of Power (1998); Performing a Project Premortem (HBR 2007)',
    thesis:
      'Experts pattern-match from prior experience. Good tools surface cues and simulate outcomes.',
    diProduct: [
      'RPD tab surfacing recognition cues',
      'Pre-mortem scenario cards',
      'Narrative simulation of decisions',
      'Historical-case recognition priming',
    ],
  },
  synthesis: {
    title: 'The DI synthesis',
    body: 'Decision Intel does not pick a side. The 12-node pipeline suppresses bias and noise (Kahneman) while the RPD tab surfaces the pattern-recognition cues an expert with 10+ comparable decisions would notice (Klein). Their 2009 joint paper "Conditions for Intuitive Expertise: A Failure to Disagree" is the product thesis.',
  },
};

// ─── Decision Quality Chain (Howard & Matheson) ────────────────────

export interface DQChainLink {
  num: number;
  label: string;
  question: string;
  diCoverage: string;
  shipped: boolean;
}

export const DQ_CHAIN: DQChainLink[] = [
  {
    num: 1,
    label: 'Appropriate frame',
    question: 'Are we solving the right problem?',
    diCoverage:
      'Frame Audit node in the 12-node pipeline. Detects scope-creep, over-abstraction, premature narrowing.',
    shipped: true,
  },
  {
    num: 2,
    label: 'Creative alternatives',
    question: 'Have we considered enough options?',
    diCoverage:
      'Alternatives node scores option diversity. Counterfactual engine synthesises what-if branches.',
    shipped: true,
  },
  {
    num: 3,
    label: 'Meaningful information',
    question: 'Is the evidence reliable and relevant?',
    diCoverage:
      'Evidence audit checks for cherry-picking, survivorship bias, and source coverage. Reference-class base rates surfaced.',
    shipped: true,
  },
  {
    num: 4,
    label: 'Clear values',
    question: 'Are trade-offs explicit?',
    diCoverage:
      'Trade-off detection flags buried values. Stakeholder map surfaces conflicting priorities.',
    shipped: true,
  },
  {
    num: 5,
    label: 'Logical reasoning',
    question: 'Does the reasoning hold?',
    diCoverage: `The ${BIAS_COUNT}-bias taxonomy + ${MATRIX_DIMENSION}×${MATRIX_DIMENSION} interaction matrix. Toxic combinations detected. Causal vs. correlational claims classified.`,
    shipped: true,
  },
  {
    num: 6,
    label: 'Commitment to action',
    question: 'Will the decision actually be executed?',
    diCoverage:
      'Outcome loop closes here. Outcome inference + bias genome + nudge acceptance feed causal weights quarter after quarter.',
    shipped: true,
  },
];

// ─── Decision Hygiene quadrants (Sibony) ──────────────────────────

export interface HygieneQuadrant {
  title: string;
  description: string;
  diFeature: string;
  shipped: boolean;
}

export const HYGIENE_QUADRANTS: HygieneQuadrant[] = [
  {
    title: 'Checklists',
    description:
      'Structured rubrics that force complete coverage. Reduce omission errors and free up working memory.',
    diFeature:
      '12-node pipeline executes a fixed rubric on every document. No memo ships without coverage.',
    shipped: true,
  },
  {
    title: 'Pre-mortems',
    description:
      'Imagine the decision has failed. Write the story of why. Surfaces concerns optimism suppresses.',
    diFeature: 'PreMortemScenarioCards.tsx + RPD tab. Pre-mortem agent is one of the 12 nodes.',
    shipped: true,
  },
  {
    title: 'Structured independent assessment',
    description:
      'Multiple judges score in isolation, then aggregate. Wisdom of Crowds conditions enforced.',
    diFeature:
      'Triple-judge pipeline. Blind priors in Decision Rooms. Consensus quality scored, not just agreement.',
    shipped: true,
  },
  {
    title: 'Noise audits',
    description:
      'Measure variance in judgments that should be identical. The diagnostic step before any debiasing intervention.',
    diFeature: 'NoiseTax component of DQI. Triple-judge decomposition. Noise score on every audit.',
    shipped: true,
  },
];

// ─── Methodology timeline (1763 → 2026) ───────────────────────────

export interface TimelineMilestone {
  year: number;
  label: string;
  thinker: string;
  significance: string;
  category: ThinkerCategory;
}

export const TIMELINE: TimelineMilestone[] = [
  {
    year: 1763,
    label: 'Bayes\u2019 theorem',
    thinker: 'Thomas Bayes',
    significance: 'Rational belief update: prior × likelihood.',
    category: 'cognitive',
  },
  {
    year: 1973,
    label: '10th Man Rule',
    thinker: 'IDF / RAND',
    significance: 'Institutionalised dissent after Yom Kippur surprise.',
    category: 'structuring',
  },
  {
    year: 1974,
    label: 'Heuristics & Biases',
    thinker: 'Tversky & Kahneman',
    significance: 'The research program that named 30+ systematic errors.',
    category: 'cognitive',
  },
  {
    year: 1976,
    label: 'OODA Loop',
    thinker: 'John Boyd',
    significance: 'Decision tempo under uncertainty. Whoever cycles faster wins.',
    category: 'structuring',
  },
  {
    year: 1978,
    label: 'Pyramid Principle',
    thinker: 'Barbara Minto',
    significance: 'Lead with the conclusion. BLUF becomes the global consulting standard.',
    category: 'communication',
  },
  {
    year: 1980,
    label: 'Five Forces',
    thinker: 'Michael Porter',
    significance: 'Industry structure as the determinant of profitability.',
    category: 'moat',
  },
  {
    year: 1988,
    label: 'SPIN Selling',
    thinker: 'Neil Rackham',
    significance: 'Large-ticket sales won by discovery question sequence.',
    category: 'gtm',
  },
  {
    year: 1988,
    label: 'DQ Chain',
    thinker: 'Howard & Matheson',
    significance: 'Six-link chain: frame → alternatives → info → values → reasoning → commitment.',
    category: 'structuring',
  },
  {
    year: 1991,
    label: 'Crossing the Chasm',
    thinker: 'Geoffrey Moore',
    significance: 'Early markets vs. mainstream — most startups die between them.',
    category: 'gtm',
  },
  {
    year: 1996,
    label: 'MEDDIC',
    thinker: 'PTC (later Dunkel)',
    significance: 'Enterprise deal qualification checklist.',
    category: 'gtm',
  },
  {
    year: 1998,
    label: 'Sources of Power',
    thinker: 'Gary Klein',
    significance: 'Recognition-Primed Decision: experts pattern-match, they don\u2019t enumerate.',
    category: 'cognitive',
  },
  {
    year: 2004,
    label: 'Wisdom of Crowds',
    thinker: 'James Surowiecki',
    significance: 'Four conditions for group judgment to outperform experts.',
    category: 'structuring',
  },
  {
    year: 2005,
    label: 'Expert Political Judgment',
    thinker: 'Philip Tetlock',
    significance: 'Most "expert" forecasts are no better than chance. Calibration is trainable.',
    category: 'cognitive',
  },
  {
    year: 2005,
    label: 'Blue Ocean Strategy',
    thinker: 'Kim & Mauborgne',
    significance: 'Compete in uncontested markets via Value Curve differentiation.',
    category: 'strategy',
  },
  {
    year: 2007,
    label: 'Pre-mortem (HBR)',
    thinker: 'Gary Klein',
    significance: 'Imagine the decision has failed. Write why. Highest-ROI debiasing.',
    category: 'structuring',
  },
  {
    year: 2011,
    label: 'Thinking, Fast and Slow',
    thinker: 'Daniel Kahneman',
    significance: 'System 1/System 2. The popular synthesis of 40 years of bias research.',
    category: 'cognitive',
  },
  {
    year: 2011,
    label: 'The Challenger Sale',
    thinker: 'Dixon & Adamson',
    significance: 'Top performers teach, tailor, take control. Relationship builders are worst.',
    category: 'gtm',
  },
  {
    year: 2014,
    label: 'Zero to One',
    thinker: 'Peter Thiel',
    significance: 'Monopoly + contrarian truth. Last-mover advantage in a new category.',
    category: 'strategy',
  },
  {
    year: 2015,
    label: 'Superforecasting',
    thinker: 'Philip Tetlock',
    significance: 'Hybrid human + AI forecasting beats pure either.',
    category: 'cognitive',
  },
  {
    year: 2015,
    label: 'Aggregation Theory',
    thinker: 'Ben Thompson',
    significance: 'Value accrues to demand aggregators, not supply controllers.',
    category: 'moat',
  },
  {
    year: 2016,
    label: '7 Powers',
    thinker: 'Hamilton Helmer',
    significance: 'Seven (and only seven) sources of durable competitive advantage.',
    category: 'moat',
  },
  {
    year: 2016,
    label: 'Never Split the Difference',
    thinker: 'Chris Voss',
    significance: 'Tactical empathy: emotion first, logic second.',
    category: 'communication',
  },
  {
    year: 2016,
    label: 'Jobs-to-be-Done',
    thinker: 'Christensen & Moesta',
    significance: 'Customers hire products for a job. The job is stable; demographics are not.',
    category: 'gtm',
  },
  {
    year: 2018,
    label: 'Thinking in Bets',
    thinker: 'Annie Duke',
    significance: 'Decision quality ≠ outcome quality. The resulting bias named.',
    category: 'cognitive',
  },
  {
    year: 2021,
    label: 'Noise',
    thinker: 'Kahneman, Sibony, Sunstein',
    significance: 'Variance in identical judgments. 55% where 10% was expected.',
    category: 'cognitive',
  },
  {
    year: 2024,
    label: 'VC Decision Science',
    thinker: 'Ilya Strebulaev',
    significance: 'Nine principles. Consensus-seeking committees underperform.',
    category: 'strategy',
  },
  {
    year: 2026,
    label: 'Decision Intel',
    thinker: '—',
    significance:
      'The Decision Knowledge Graph: the synthesis of 260 years of decision science, shipped.',
    category: 'cognitive',
  },
];

// ─── Connecting thread + takeaways + founder notes ────────────────

export const CONNECTING_THREAD =
  'Every thinker in this constellation is saying the same thing from a different angle: human decision-making is systematically flawed in measurable ways, process beats intuition at scale, the organisations willing to audit their own judgment will outperform those that don\u2019t, and the company that creates the language for this problem will own the market. That company is Decision Intel. DQI is that language.';

export const TAKEAWAYS = [
  {
    action: 'Reframe pitch from defensive to offensive',
    detail:
      '"Decide with confidence" — not "avoid mistakes." The best teams don\u2019t want a safety net, they want a decision-quality amplifier.',
  },
  {
    action: 'Cite Strebulaev in marketing',
    detail:
      'Stanford GSB credibility for blind priors and Decision Rooms. "Stanford research shows consensus-seeking committees underperform."',
  },
  {
    action: 'Build Quick Scan mode',
    detail:
      'Fast lane / slow lane. 30-second red-flag scan before 4-minute full analysis. Matches actual decision workflow and reduces friction.',
  },
  {
    action: 'Build longitudinal bias tracking',
    detail:
      'Track bias drift across decision lifecycle. Follow-on memos should be MORE critical than initial — is it? Nobody else will build this.',
  },
];

export const FOUNDER_NOTES = [
  {
    headline: 'Your deepest moat is time-to-data, not features.',
    detail: 'Frame the first 6 months as a calibration investment.',
  },
  {
    headline: 'The Outcome Gate is controversial AND valuable.',
    detail: 'Show calibration improvement to make feedback feel rewarding, not punitive.',
  },
  {
    headline: 'Consider an external-facing "Decision Score."',
    detail: 'Like a credit score for organisational decision quality. Creates a new category.',
  },
  {
    headline: 'Sell the Bias Genome to investors.',
    detail:
      'World\u2019s first dataset of which cognitive biases predict failure, by industry and decision type.',
  },
  {
    headline: 'The counterfactual engine is underexposed.',
    detail:
      'Get it into the UI and the sales deck — it\u2019s the ROI story that closes enterprise deals.',
  },
];

export const SALES_PERSONAS = [
  {
    persona: 'Strategy Leaders',
    hook: '"How do you measure decision quality today?"',
    pitch:
      'Show DQI scoring across their last 10 major decisions. Highlight the ones with low scores that later underperformed.',
    close: 'Free pilot: upload 3 recent strategic documents and see the scores.',
  },
  {
    persona: 'M&A / Decision Owners',
    hook: '"When was the last time someone challenged the core thesis?"',
    pitch:
      'Demo the Boardroom Simulation on their own document. The "Risk Officer" persona usually surfaces something nobody raised.',
    close: 'Let them see their own blind spots in real time.',
  },
  {
    persona: 'Risk / Compliance',
    hook: '"How do you document decision rationale for stakeholder reporting?"',
    pitch:
      'Show the compliance mapping + audit trail. Regulatory requirements are a real pain point for regulated organisations.',
    close:
      'Compliance is the "vitamin" that gets you in the door; bias detection is the "painkiller" that keeps them.',
  },
  {
    persona: 'Board / Stakeholders',
    hook: '"Do your reports pass the survivorship-bias test?"',
    pitch:
      'Upload a sample board report — the platform flags selective reporting, framing effects, and cherry-picked metrics.',
    close: 'Position as decision transparency tool for the entire organisation.',
  },
];

export const KEY_TALKING_POINTS = [
  {
    point: 'ROI is immediate',
    detail:
      'A single avoided bad decision saves £50M–£500M. The platform pays for itself after one corrected thesis.',
  },
  {
    point: 'Not a replacement — an augmentation',
    detail:
      'We don\u2019t tell you what to decide. We show you what you might be missing. Like a spell-checker for cognitive biases.',
  },
  {
    point: 'Gets smarter with you',
    detail:
      'After 50 decisions, we know which biases actually cost YOUR org money. No competitor replicates 18 months of your calibration data.',
  },
  {
    point: 'Sell to the committee, not the individual',
    detail:
      'Slack integration + cognitive audit of team decisions is the B2B killer feature. Individual bias detection is nice-to-have; team auditing is must-have.',
  },
  {
    point: 'The toxic combinations are viral',
    detail:
      '"The Echo Chamber", "The Sunk Ship" — memorable, tweetable. Consider publishing a "Taxonomy of Bad Decisions" for thought leadership.',
  },
  {
    point: 'Counterfactual is the ROI story',
    detail:
      '"If you\u2019d removed anchoring from your last 20 decisions, success rate would have been 14% higher — that\u2019s £2.3M in avoided losses."',
  },
];
