/**
 * R2FDeepDive consumer data — current 3 pillars + 5 NotebookLM
 * moat-deepening levers. Split out from monolithic data.ts at F2 lock
 * 2026-04-29.
 *
 * Source synthesis: 2026-04-27 R²F-quality + intellectual-moats pass
 * (Mercier & Sperber argumentative reasoning, Environmental Validity
 * weighting, Decision Framing Gate, provisional patents, institutional
 * academic credentials).
 */

export type R2FCurrentPillar = {
  id: string;
  side: 'kahneman' | 'klein' | 'arbitration';
  label: string;
  pipelineNodes: string[];
  whatItDoes: string;
  whyItMatters: string;
};

export const R2F_CURRENT: R2FCurrentPillar[] = [
  {
    id: 'kahneman_rigor',
    side: 'kahneman',
    label: 'Kahneman side · Rigor (System 2 debiasing)',
    pipelineNodes: ['biasDetective', 'noiseJudge', 'statisticalJury'],
    whatItDoes:
      'Identifies overconfidence, anchoring, sunk-cost, base-rate neglect, framing effects · measures cross-judge variance · catches systemic noise · scores severity using weighted ensemble-sampling consensus across 3 independent samplers (renamed from "statistical jury" 2026-04-28 per brutal-critique synthesis).',
    whyItMatters:
      'Suppresses bias before the recommendation reaches the room. The DQI weight on Kahneman-side outputs proves the analyst was not the only sceptic — a multi-judge audit was already on the side of rigor.',
  },
  {
    id: 'klein_recognition',
    side: 'klein',
    label: 'Klein side · Recognition (System 1 pattern matching)',
    pipelineNodes: ['rpdRecognition', 'forgottenQuestions', 'preMortem'],
    whatItDoes:
      'Surfaces historical analogues from the 143-case library · runs narrative "war story" pre-mortems · pattern-matches the deal thesis against prior failures and successes · raises the questions the analyst forgot to ask.',
    whyItMatters:
      'Amplifies the expert intuition that earned the recommendation a seat at the table in the first place. The Klein side IS the message that lands with senior buyers: "your 20 years of pattern recognition is your sharpest asset; we just protect it from occasional blind spots."',
  },
  {
    id: 'meta_arbitration',
    side: 'arbitration',
    label: 'Arbitration · Meta-Judge (the synthesis)',
    pipelineNodes: ['metaJudge'],
    whatItDoes:
      'Arbitrates Kahneman-side rigor signals against Klein-side recognition signals · resolves contradictions deterministically · produces the final mathematical Decision Quality Index (DQI) and the Decision Provenance Record (DPR) artefact.',
    whyItMatters:
      'This is the academic synthesis no competitor (Cloverpop, Aera, IBM watsonx, Palantir) has built. The metaJudge node uses the highest-tier Pro-level model (gemini-2.5-pro) per CLAUDE.md model policy — the only Pro-tier surface in the entire pipeline. Reasoning quality at the synthesis seat matters more than cost.',
  },
];

export type R2FMoatLever = {
  id: string;
  rank: number;
  title: string;
  source: string;
  shortPitch: string;
  whatToBuild: string;
  howItDeepensMoat: string;
  estimatedEffort: 'small' | 'medium' | 'large';
  estimatedCost: string;
  shipBy: string;
};

export const R2F_MOAT_LEVERS: R2FMoatLever[] = [
  {
    id: 'mercier_sperber',
    rank: 1,
    title: 'Add Mercier & Sperber Argumentative Theory of Reason as a third pillar',
    source:
      'Mercier & Sperber, "The Enigma of Reason" (Harvard 2017) + the Interactionist Account of Reason — humans are biased + lazy producing their own reasons but unbiased + demanding evaluating others.',
    shortPitch:
      'Stop selling "bias detection." Start selling "algorithmic adversarial evaluation."',
    whatToBuild:
      'Upgrade the Dr. Red Team / pre-mortem nodes into a multi-agent debate. Pit agents against each other (pre-mortem actively attacks RPD recognition; biasDetective challenges noise-judge severity scoring; statisticalJury voters disagree before the metaJudge resolves). The metaJudge becomes the adversarial referee, not the silent synthesizer.',
    howItDeepensMoat:
      'Replicates the exact adversarial pressure Mercier & Sperber proved is necessary for optimal reasoning. A solo-evaluator AI inherits the same belief-dependent biases as humans; a multi-agent adversarial pipeline does not. Competitors using a single GPT-4 call cannot replicate this without re-architecting their pipeline.',
    estimatedEffort: 'large',
    estimatedCost: '6-10 weeks engineering + ~£0.15-0.25 added per audit (additional Gemini calls)',
    shipBy: 'Q3 2026 — paired with the next DPR-vocabulary lock',
  },
  {
    id: 'environmental_validity',
    rank: 2,
    title: 'Add Environmental Validity weighting to the DQI',
    source:
      'Kahneman & Klein 2009 paper "Conditions for Intuitive Expertise: a failure to disagree" — the entire reconciliation hinges on environmental validity (high-validity environments → trust intuition; low-validity → distrust intuition).',
    shortPitch:
      'Prove to F500 CSOs that DI knows when to trust expertise versus when to override it.',
    whatToBuild:
      'Introduce an Environmental Validity Score node at the start of the pipeline. Operational logistics memo (high-validity, stable patterns, fast feedback) → up-weight Klein-side. M&A market-entry thesis (low-validity, slow feedback, weak base-rates) → up-weight Kahneman-side. The DQI weights become dynamic per memo type, not static.',
    howItDeepensMoat:
      'Static weights are easy to clone. Dynamic environmental-validity weighting is a research-backed feature that requires understanding the 2009 paper at depth. Competitors will try to copy after we publish, but by then we own the academic vocabulary AND the implementation.',
    estimatedEffort: 'medium',
    estimatedCost:
      '3-4 weeks engineering + minimal added cost (single classification call per memo)',
    shipBy: 'Q2 2026 — ship before Q3 DPR vocabulary refresh',
  },
  {
    id: 'decision_framing_gate',
    rank: 3,
    title: 'Decision Framing Gate · solve the Problem of Relevance',
    source:
      'Kahneman WYSIATI (What You See Is All There Is) + the Frame Problem in cognitive science — how we frame the decision determines the outcome.',
    shortPitch:
      'Stop "upload PDF and click analyze." Force the user to define the decision frame before the audit runs.',
    whatToBuild:
      'A mandatory pre-audit gate that captures: (a) primary goal of the decision · (b) alternatives considered + rejected · (c) the decision-prior (what does the analyst already believe will happen) · (d) the success criterion + observation date. The pipeline then runs framing-blindness detection against the captured prior.',
    howItDeepensMoat:
      'Targets the SETUP of the decision, not just the output. Anti-patterns ("you considered only one alternative", "you did not name a decision-prior", "your success criterion is unfalsifiable") are entirely new findings no competitor surfaces today.',
    estimatedEffort: 'medium',
    estimatedCost: '4-6 weeks engineering + UI work for the framing gate',
    shipBy: 'Q3 2026 — paired with onboarding refactor',
  },
  {
    id: 'provisional_patents',
    rank: 4,
    title: 'File two provisional patents · Statistical Jury Method + Outcome-Linked Decision Twin',
    source:
      'NotebookLM intellectual-moats synthesis 2026-04-27 — recommends provisional patents at ~£3K-8K each before scaling.',
    shortPitch:
      'Legally fortify the methodologies before IBM, Palantir, or a leaner competitor reverse-engineers from public artefacts.',
    whatToBuild:
      'Patent 1 — Statistical Jury Method: weighted bias-severity voting where multiple independent LLM judges vote and severity is calibrated against organisational outcome history. Patent 2 — Outcome-Linked Decision Twin: simulation engine that generates counterfactuals, logs outcomes, retrains causal edges based on whether simulated dissent was accurate.',
    howItDeepensMoat:
      'Provisional patents create a 12-month priority window that can be converted to non-provisional patents once funded. They also become legitimacy artefacts in pre-seed conversations and procurement reviews — a 16-year-old founder with two provisional US patents reads as institutional grade.',
    estimatedEffort: 'small',
    estimatedCost: '£6-16K (two filings × £3-8K each, IP attorney fees)',
    shipBy: 'Q2 2026 — file before pre-seed close so the patents survive the round',
  },
  {
    id: 'institutional_credentials',
    rank: 5,
    title: 'Stack institutional academic credentials',
    source:
      'NotebookLM intellectual-moats synthesis 2026-04-27 — recommends Behavioral Finance (Duke), PE & VC (Bocconi), AI-Powered Decision Intelligence / LangGraph (DeepLearning.AI).',
    shortPitch:
      'Surround Decision Intel with undeniable intellectual authority. Force investors and CSOs to see an applied behavioral scientist, not a 16-year-old hacker.',
    whatToBuild:
      'Complete: (a) Duke Behavioral Finance — for capital-markets vocabulary and anchoring + loss-aversion math · (b) Bocconi PE & VC — for fund-buyer terminology and diligence structures · (c) DeepLearning.AI Decision Intelligence + LangGraph — for the multi-agent architecture credentials.',
    howItDeepensMoat:
      'Credentialism is a procurement signal. F500 GCs, audit-committee chairs, and pre-seed VCs all weight institutional certifications more than they admit. Pair with the 2008 paper as the foundation, and the credential-stack reads as a rigorous applied-research career, not a side project.',
    estimatedEffort: 'small',
    estimatedCost: '£200-1500 per certification + 6-12 weeks of evening time per certification',
    shipBy: 'Rolling — first credential complete Q3 2026',
  },
];

// =========================================================================
// SECTION 5 · CATEGORY DEFINITION (THE WHAT + THE WHY)
// =========================================================================
