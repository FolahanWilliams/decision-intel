/**
 * Decision Intel — Public Pipeline Node Manifest
 *
 * Public-safe descriptions of the 12 LangGraph nodes that make up the
 * analysis pipeline. The order and names mirror the canonical wiring in
 * `src/lib/agents/graph.ts` exactly. Descriptions deliberately explain
 * the *what* and *why* without revealing prompts, weights, or model tier
 * assignments.
 *
 * Consumed by the /how-it-works marketing page. If the canonical graph
 * changes (nodes added/removed/reordered), update this file to match.
 */

export type PipelineZone = 'preprocessing' | 'analysis' | 'synthesis';

export interface PipelineNode {
  /** Stable ID. Matches the node key in graph.ts. */
  id: string;
  zone: PipelineZone;
  /** Human-readable label for the node chip */
  label: string;
  /** Short 1-liner that fits inside the chip */
  tagline: string;
  /** Lucide icon name used to render the node */
  iconName:
    | 'Shield'
    | 'Layers'
    | 'Radar'
    | 'Brain'
    | 'Scale'
    | 'CheckCircle2'
    | 'Microscope'
    | 'Users'
    | 'Eye'
    | 'HelpCircle'
    | 'Gavel'
    | 'Calculator';
  /** What this node does — public-safe, 1 paragraph */
  purpose: string;
  /** What it emits into the downstream state */
  output: string;
  /** Academic or regulatory anchor that backs the node's approach */
  academicAnchor: string;
}

export const PIPELINE_NODES: PipelineNode[] = [
  // ─── Preprocessing (sequential) ────────────────────────────────────
  {
    id: 'gdprAnonymizer',
    zone: 'preprocessing',
    label: 'GDPR Anonymizer',
    tagline: 'PII redacted before any LLM sees the memo.',
    iconName: 'Shield',
    purpose:
      'Scans the raw document for personally identifiable information and redacts it before the analysis stack begins. This is the first node — not an afterthought — because the platform operates under the principle that customer data is never raw input to a third-party model. If anonymization fails for any reason, the pipeline short-circuits to the risk scorer without running analysis.',
    output:
      'A cleaned document with structured redaction markers, plus an anonymization status flag.',
    academicAnchor:
      'GDPR Art. 5(1)(c) data minimisation — treated as a hard prerequisite, not a postprocessing step.',
  },
  {
    id: 'structurer',
    zone: 'preprocessing',
    label: 'Data Structurer',
    tagline: 'Parses sections, speakers, and decision framing.',
    iconName: 'Layers',
    purpose:
      'Turns unstructured text — memos, minutes, emails, transcripts — into a structured object that downstream analysis nodes can reason over: sections, bullet points, speakers, claims, numbers. Decision framing (stated objective, success/failure criteria, decision owner) is extracted here if present.',
    output: 'A structured content tree with sections, speakers, and a decision framing block.',
    academicAnchor: 'Minto Pyramid Principle — structured reasoning requires structured input.',
  },
  {
    id: 'intelligenceGatherer',
    zone: 'preprocessing',
    label: 'Intelligence Gatherer',
    tagline: 'Extracts topic, industry, and retrieves prior context.',
    iconName: 'Radar',
    purpose:
      'Identifies the topic and industry, retrieves relevant organization-level context (prior analyses, similar decisions, active projects), and assembles the shared context object that all seven parallel analysis nodes will read from. This is what turns a single-document audit into a graph-aware decision-intelligence audit.',
    output:
      'Shared intelligence context: topic, industry, prior related decisions, sector benchmarks.',
    academicAnchor:
      'Retrieval-augmented reasoning — grounds every downstream judgement in organization history.',
  },

  // ─── Analysis (parallel fan-out) ───────────────────────────────────
  {
    id: 'biasDetective',
    zone: 'analysis',
    label: 'Bias Detective',
    tagline: 'Detects 30+ cognitive biases with severity and excerpts.',
    iconName: 'Brain',
    purpose:
      'Runs the published DI-B-001 through DI-B-020 taxonomy plus 11 strategy-specific biases against the structured memo. Every detection comes back with an excerpt, a severity level, and a confidence score — never a bare label.',
    output:
      'A list of bias instances: { biasType, severity, confidence, excerpt, explanation, suggestion }.',
    academicAnchor:
      'Kahneman & Tversky, Heuristics and Biases (1974); plus investment-specific extensions from Strebulaev.',
  },
  {
    id: 'noiseJudge',
    zone: 'analysis',
    label: 'Noise Judge',
    tagline: 'Three independent judges, measure the variance.',
    iconName: 'Scale',
    purpose:
      'Runs the same memo through three independent scoring passes with different temperature and role-priming. We then measure the inter-judge variance directly. Low variance means the reasoning is stable under rewording; high variance means the memo is saying something the judges read differently — a reliability signal orthogonal to bias.',
    output: 'A noise score, the raw three judge scores, and mean / stdDev / variance statistics.',
    academicAnchor: 'Kahneman, Sibony & Sunstein — Noise (2021).',
  },
  {
    id: 'verificationNode',
    zone: 'analysis',
    label: 'Verification',
    tagline: 'Fact-checks claims and maps compliance exposure.',
    iconName: 'CheckCircle2',
    purpose:
      'Extracts quantitative and factual claims and verifies them against grounded search. In parallel, maps the memo against seven regulatory frameworks (FCA Consumer Duty, SOX, Basel III, EU AI Act, SEC Reg D, GDPR, and an internal framework) for exposure that the author may not have flagged.',
    output:
      'Verification verdicts (VERIFIED / CONTRADICTED / UNVERIFIABLE) and a compliance exposure report.',
    academicAnchor: 'Grounded LLM reasoning with search + structured regulatory ontology.',
  },
  {
    id: 'deepAnalysisNode',
    zone: 'analysis',
    label: 'Deep Analysis',
    tagline: 'Linguistic, logical, and strategic stress tests.',
    iconName: 'Microscope',
    purpose:
      'Logical-fallacy detection, strategic reasoning stress-testing (SWOT, Porter, Helmer), and cognitive-diversity scoring. This is the slow, careful pass — catching bad logic and weak strategic framing that a fast bias scan would miss.',
    output: 'Logical fallacy list, SWOT synthesis, cognitive diversity metrics.',
    academicAnchor:
      'Helmer, 7 Powers; Porter, Five Forces; classical informal-logic fallacy literature.',
  },
  {
    id: 'simulationNode',
    zone: 'analysis',
    label: 'Simulation',
    tagline: 'Five steering-committee personas debate the memo.',
    iconName: 'Users',
    purpose:
      'Runs the memo past five role-primed personas (skeptical CFO, ambitious CEO, conservative board chair, operator, compliance officer). Each casts a vote with a rationale. Dissent is tracked explicitly. The simulation surfaces objections the author is most likely to hear in the real room.',
    output:
      'An overall verdict, individual twin votes (APPROVE / REJECT / REVISE), and a dissent count.',
    academicAnchor: 'Janis, Groupthink (1972) — dissent design as bias remediation.',
  },
  {
    id: 'rpdRecognitionNode',
    zone: 'analysis',
    label: 'RPD Recognition',
    tagline: 'Pattern-matches against a historical decision library.',
    iconName: 'Eye',
    purpose:
      "Recognition-Primed Decision pattern matching against 135 curated historical cases across eleven industries. When the memo's situation resembles a prior decision with a known outcome, we surface the resemblance and the outcome — so the author can weigh their own path against history.",
    output: 'Pattern matches with confidence, historical outcome, and narrative war stories.',
    academicAnchor:
      'Gary Klein — Sources of Power (1998); Flyvbjerg on reference-class forecasting.',
  },
  {
    id: 'forgottenQuestionsNode',
    zone: 'analysis',
    label: 'Forgotten Questions',
    tagline: 'Surfaces the questions the memo avoided asking.',
    iconName: 'HelpCircle',
    purpose:
      'Generates the questions a rigorous reviewer would ask that the memo does not address. These are unknown-unknowns: the blind spots — usually the most dangerous material in any board deck.',
    output: 'A ranked list of forgotten questions with the domain each one opens up.',
    academicAnchor: 'Tetlock, Superforecasting — the discipline of asking what you are not asking.',
  },

  // ─── Synthesis (sequential) ────────────────────────────────────────
  {
    id: 'metaJudgeNode',
    zone: 'synthesis',
    label: 'Meta Judge',
    tagline: 'Reconciles the seven parallel signals.',
    iconName: 'Gavel',
    purpose:
      'Takes the outputs from all seven parallel analysis nodes and synthesises them into a single executive-level narrative — where they agree, where they disagree, and what the highest-conviction findings are. This is the highest-leverage node in the pipeline, so it runs on our most capable model.',
    output: 'A reconciled executive summary, meta verdict, and a confidence-ranked findings list.',
    academicAnchor:
      'Tetlock & Gardner — aggregation of diverse judgement outperforms any single-model output.',
  },
  {
    id: 'riskScorer',
    zone: 'synthesis',
    label: 'Risk Scorer',
    tagline: 'Computes the final DQI — deterministic math.',
    iconName: 'Calculator',
    purpose:
      'Compound scoring with the 20x20 bias-interaction matrix, context amplifiers (monetary stakes, dissent absent, time pressure), false-positive damping, and org-specific calibration. This is a deterministic math pass — no LLM — so the same inputs always produce the same DQI.',
    output:
      'The Decision Quality Index (0–100, A–F grade), toxic combination flags, and a calibrated report.',
    academicAnchor:
      "Bayesian decision theory + Pearl's do-calculus for counterfactual projections.",
  },
];

export const ZONES: Record<PipelineZone, { label: string; description: string }> = {
  preprocessing: {
    label: 'Preprocessing',
    description: 'Sequential — every memo gets redacted, structured, and contextualized first.',
  },
  analysis: {
    label: 'Analysis',
    description:
      'Parallel fan-out — seven specialized agents reason over the same shared context simultaneously.',
  },
  synthesis: {
    label: 'Synthesis',
    description: 'Sequential — reconcile the seven signals, then score deterministically.',
  },
};
