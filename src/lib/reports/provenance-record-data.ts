/**
 * Decision Provenance Record — data assembler.
 *
 * Builds the hashed, tamper-evident metadata bundle that the Decision
 * Provenance Record PDF generator consumes. Also the shape persisted to
 * the DecisionProvenanceRecord table (see prisma/schema.prisma).
 *
 * Vocabulary discipline (locked 2026-04-26 after the persona audit
 * caught "signed, hashed" overclaim): the assembler emits SHA-256 input
 * hashes but does NOT produce a cryptographic signature against a
 * Decision Intel private key. Until that ships, every consumer of this
 * data should describe the artifact as "hashed + tamper-evident" — see
 * src/lib/constants/trust-copy.ts for the canonical strings.
 *
 * The name was chosen to map cleanly onto regulatory tailwinds already in
 * motion — EU AI Act Article 14 (record-keeping for high-risk AI systems),
 * SEC AI disclosure language, Basel III ICAAP documentation. "Provenance"
 * is a GC-native word. "Defense" was reactive; provenance is the record
 * AI-augmented decision-making is supposed to produce anyway.
 *
 * IP-PROTECTION RULES — do not break:
 *   1. Never serialize prompt content — only the SHA-256 fingerprint.
 *   2. Never serialize the 20×20 toxic-combination weight matrix.
 *   3. Never serialize per-org causal edges or learned bias genome values.
 *   4. Pipeline lineage stores node IDs + order only; per-node I/O
 *      hashing is deferred to record schema v2 (requires instrumentation
 *      changes in src/lib/agents/nodes.ts that land in a later PR).
 *
 * Honesty discipline: if a field can't be populated accurately for a
 * given audit, fall back to a well-commented "unavailable" marker that
 * reads defensibly to a GC ("Full per-judge outputs stored in internal
 * audit log; summary provided here.") — never invent data.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@/lib/prisma';
import { getBiasEducation } from '@/lib/constants/bias-education';
import { getCrossFrameworkRisk } from '@/lib/compliance/bias-regulation-map';
import { PIPELINE_NODES } from '@/lib/data/pipeline-nodes';
import { createLogger } from '@/lib/utils/logger';
import { formatBiasName as formatBiasLabel } from '@/lib/utils/labels';
import { aggregateBlindPriors, type BlindPriorRow } from '@/lib/learning/blind-prior-aggregate';
import { computeCounterfactuals } from '@/lib/analysis/counterfactual';
import { getOrgBrierStats, brierCategory } from '@/lib/learning/brier-scoring';
import { computePlatformCalibrationBaseline } from '@/lib/learning/platform-baseline';
import { getFeedbackAdequacy, type FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import {
  getReferenceClassForecast,
  type ReferenceClassForecast,
} from '@/lib/learning/reference-class-forecast';
import { classifyValidity, type ValidityClassification } from '@/lib/learning/validity-classifier';
import {
  extractSynergyDefensibilityFromContent,
  summariseSynergyDefensibility,
  type SynergyDefensibilitySummary,
  type ParsedSynergyModelData,
} from '@/lib/parsers/synergy-model-parser';
import {
  computeCalibratedRejection,
  type CalibratedRejection,
} from '@/lib/learning/calibrated-rejection';
import {
  getFractionationOfExpertise,
  type FractionationOfExpertise,
} from '@/lib/learning/fractionation-of-expertise';
import { computeDecisionRubric, type DecisionRubric } from '@/lib/learning/decision-rubric';
import {
  computeAlgorithmAversion,
  type AlgorithmAversion,
} from '@/lib/learning/algorithm-aversion';
import {
  getUserPlan,
  getOrgPlan,
  getRetentionDaysForUser,
  getRetentionDaysForOrg,
} from '@/lib/utils/plan-limits';

const log = createLogger('ProvenanceRecordData');

/**
 * Per-bias finding augmentation map — keyed by biasType, populated by the
 * data assembler from analysis.biases (excerpt + suggestion + severity +
 * confidence). The new HTML/CSS DPR render at /dpr-render reads this map
 * to populate the per-bias finding cards (Phase 3 visual). For specimens
 * the route uses SAMPLE_FINDINGS_AUGMENT; for real audits this field
 * carries the live data.
 *
 * Locked 2026-05-05 (Phase 4 of the DPR rebuild).
 */
export interface DprFindingsAugmentRow {
  evidenceQuote: string | null;
  mitigation: string | null;
  severityOverride?: 'critical' | 'high' | 'medium' | 'low';
  confidenceOverride?: number;
}

export interface ProvenanceRecordData {
  analysisId: string;
  documentId: string;
  userId: string;
  orgId: string | null;
  promptFingerprint: string;
  inputHash: string;
  modelLineage: ModelLineage;
  judgeVariance: JudgeVariance;
  citations: CitationEntry[];
  regulatoryMapping: RegulatoryEntry[];
  pipelineLineage: PipelineLineageEntry[];
  /**
   * Per-bias evidence + mitigation map populated from analysis.biases.
   * Phase 4 enables real-audit findings to render with verbatim memo
   * excerpts (BiasInstance.excerpt) + recommended mitigations
   * (BiasInstance.suggestion) on the new /dpr-render output. Null only
   * for legacy assembled data that pre-dates this field.
   */
  findingsAugment?: Record<string, DprFindingsAugmentRow>;
  /**
   * Pre-IC blind-prior aggregations attached to this analysis (4.1
   * deep). One entry per Decision Room that ran a blind-prior survey
   * before the decision was made. Empty array when no rooms had a
   * pre-IC survey — the DPR section then renders a one-line note.
   */
  blindPriorAggregates: BlindPriorRoomAggregate[];
  /**
   * Counterfactual ROI block (DPR v2, locked 2026-04-26 P2 #1 from
   * NotebookLM "highest-ROI DPR additions" synthesis). Top-3 bias
   * scenarios ranked by expected improvement, with sample-size + Wilson
   * confidence + monetary anchor disclosure. The PDF renders this on
   * page 1 below RECOMMENDED NEXT ACTION so the GC sees value-protected
   * before they read flagged risks. Null when no historical-outcome
   * data exists for the org (free-tier or first-audit cold start).
   */
  counterfactualImpact?: CounterfactualImpactSummary;
  /**
   * Human-in-the-loop / reviewer-decisions log (DPR v2, P2 #2). Captures
   * what the reviewer DID with the audit — which mitigations they
   * accepted, which flags they dismissed (with reason), any logged
   * dissent, and the final sign-off verdict. The exact human-oversight
   * record EU AI Act Art 14 + Basel III Pillar 2 ICAAP qualitative
   * documentation requires. Null until a reviewer has acted on the
   * audit; the cover renders an empty signature block in that case.
   */
  reviewerDecisions?: ReviewerDecisionLog;
  /**
   * Org calibration / Decision Debt strip (DPR v2, P2 #3). The
   * Cloverpop-defense field: shows the DQI in this audit was
   * recalibrated against THIS org's outcome history, not a generic
   * benchmark. Null on cold-start orgs with no closed outcomes.
   */
  orgCalibration?: OrgCalibrationSummary;
  /**
   * Feedback Adequacy block (locked 2026-04-30 — Kahneman & Klein
   * 2009 "second condition for trustworthy intuition"). Operationalises
   * the claim that experience-based intuition only carries weight when
   * the decision-maker has had repeated rapid feedback in the relevant
   * domain. Always populated — `verdict='cold_start'` is the explicit
   * "no track record" answer rather than an absent block. The PDF
   * generator renders this as a dedicated section on page 1 below
   * Org Calibration.
   */
  feedbackAdequacy?: FeedbackAdequacy;
  /**
   * Reference-Class Forecast block (locked 2026-04-30 — Kahneman &
   * Lovallo 2003 "Delusions of Success" + Kahneman & Klein 2009
   * outside-view operationalisation). Always populated on per-analysis
   * DPRs — pure-function similarity scoring against the 143-case
   * library, no LLM call. Surfaces the matched-class baseline failure
   * rate + top-5 analogs so the procurement reader can compare the
   * memo's inside-view confidence against the outside-view base rate.
   * The cold-start posture (`predictedOutcomeBand='reference_class_too_small_to_judge'`)
   * is honest — structurally novel decisions get a cold-start note
   * rather than a fabricated forecast.
   */
  referenceClassForecast?: ReferenceClassForecast;
  /**
   * Validity Classification block (locked 2026-04-30 — Kahneman &
   * Klein 2009 first condition for trustworthy intuition). Records
   * which validity band the audit was scored under (high / medium /
   * low / zero) and the rationale; the DQI engine applies a
   * structural weight shift in low- and zero-validity environments
   * (methodology version 2.1.0). The DPR renders a validity strip on
   * page 1 + the methodology version on the cover so a procurement
   * reader can see whether the score in front of them was computed
   * with the validity shift applied.
   */
  validityClassification?: ValidityClassification;
  /**
   * Calibrated Rejection of Subjective Confidence (R²F paper-app #10,
   * Item 3 lock 2026-05-07). Pure-function combination of validity +
   * feedback adequacy + bias-detective hits on confidence-language
   * patterns. Renders as a 4th first-class strip on the DPR cover
   * answering Margaret-class CSO's most-asked question: "does this
   * memo's confidence match the evidence?" Always populated on per-
   * analysis DPRs — `cannot_assess` is the explicit honest answer when
   * feedback is unknown.
   */
  calibratedRejection?: CalibratedRejection;
  /**
   * Fractionation of Expertise (R²F paper-app #1, locked 2026-05-07
   * wedge-batch-4). Per-decision-class slicing of the author's outcome
   * history. Names the detected decision class for THIS memo and
   * compares this-class outcome calibration to other-class outcome
   * calibration. Closes the Margaret-class "your feedback is sparse FOR
   * WHICH class?" gap that Feedback Adequacy (paper-app #6) leaves
   * ambiguous. Renders as §4.7 strip on the DPR cover.
   */
  fractionationOfExpertise?: FractionationOfExpertise;
  /**
   * Decision Rubric Structure (R²F paper-app #4, anchored in Dawes 1979
   * "The Robust Beauty of Improper Linear Models"). Pure-function scan
   * of bias-detective excerpts for structural rubric markers (numbered
   * criteria, weighted criteria, comparison tables, options-vs-criteria
   * language) vs narrative-coherence signals (illusion_of_validity +
   * inside_view_dominance + narrative_fallacy bias hits). Renders as
   * §4.8 strip on the DPR cover.
   */
  decisionRubric?: DecisionRubric;
  /**
   * Algorithm Aversion (R²F paper-app #7, anchored in Dietvorst,
   * Simmons & Massey 2015 "Algorithm Aversion"). Pure-function scan
   * for language patterns dismissing quantitative analysis in favor of
   * intuition + authority claims. Counter-programs the most common
   * buyer objection ("we don't want AI overriding our CSO") by naming
   * the pattern as a documented decision-making error with citation.
   * Renders as §4.9 strip on the DPR cover.
   */
  algorithmAversion?: AlgorithmAversion;
  /**
   * Synergy Defensibility summary (locked 2026-05-09, M&A cascade depth ship).
   * Populated only when documentType === 'synergy_model' AND the file-parser
   * detected a synergy-shaped spreadsheet at upload time. Carries the
   * portfolio-level summary + top critical/high claims for surfacing on the
   * DPR cover. Extracted from Document.content's STRUCTURED SYNERGY MODEL
   * block (no re-parse of the original .xlsx). Null when the audit was on
   * a non-synergy document type or the parser bailed out.
   */
  synergyDefensibility?: SynergyDefensibilitySummary;
  /**
   * Data lifecycle / retention policy footer (DPR v2, P2 #4). Always
   * populated — this is the procurement-grade contractual statement of
   * what happens to the source document, the audit, and the DPR after
   * it leaves the platform. Pulled from plan-tier defaults +
   * trust-copy + company-info constants.
   */
  dataLifecycle: DataLifecyclePolicy;
  /**
   * Client-safe export marker (DPR v2, P2 #5). Populated only when the
   * generator was invoked with `{ clientSafe: true }` — entity names,
   * amounts, and person names in the meta strip have been replaced
   * with stable placeholders so the artefact can be shared with an LP,
   * regulator, or third-party assurance firm without leaking the
   * underlying competitive intelligence. Null on standard exports.
   */
  clientSafe?: ClientSafeExportMeta;
  /**
   * Decision Package member roster (4.4 deep) — populated only when the
   * DPR was generated from a Decision Package root rather than a single
   * Analysis. Adds a per-doc lineage page to the PDF showing which
   * documents composed the decision, their per-doc DQI, and their
   * individual input hashes. Null when the DPR is per-analysis (the
   * legacy / default mode).
   */
  packageContext?: {
    packageId: string;
    packageName: string;
    decisionFrame: string | null;
    status: string;
    decidedAt: string | null;
    compositeDqi: number | null;
    compositeGrade: string | null;
    members: Array<{
      documentId: string;
      filename: string;
      role: string | null;
      analysisId: string | null;
      overallScore: number | null;
      biasCount: number;
      inputHash: string;
    }>;
    packageInputHash: string;
    crossReference: {
      runAt: string;
      conflictCount: number;
      highSeverityCount: number;
      summary: string | null;
    } | null;
    outcome: {
      summary: string;
      realisedDqi: number | null;
      brierScore: number | null;
      reportedAt: string;
    } | null;
  };
  /**
   * Deal-native member roster (3.1 deep, added 2026-04-26 P1 #19 after
   * Marcus's audit caught the post-close-inquiry artefact gap). Populated
   * only when the DPR was generated from a Deal root rather than a single
   * Analysis. Same shape contract as `packageContext` plus deal-specific
   * fields (`dealType`, `stage`, `ticketSize`, `currency`, `fundName`,
   * `vintage`, `sector`, `targetCompany`) so an M&A audit committee
   * receives one artefact covering CIM + financial model + counsel memo
   * + IC deck instead of the four-document shuffle the per-analysis DPR
   * forced. Null when the DPR is per-analysis or per-package.
   */
  dealContext?: {
    dealId: string;
    dealName: string;
    dealType: string;
    stage: string;
    sector: string | null;
    fundName: string | null;
    vintage: number | null;
    targetCompany: string | null;
    ticketSize: number | null;
    currency: string;
    status: string;
    exitDate: string | null;
    compositeDqi: number | null;
    compositeGrade: string | null;
    members: Array<{
      documentId: string;
      filename: string;
      role: string | null;
      analysisId: string | null;
      overallScore: number | null;
      biasCount: number;
      inputHash: string;
    }>;
    dealInputHash: string;
    crossReference: {
      runAt: string;
      conflictCount: number;
      highSeverityCount: number;
      summary: string | null;
    } | null;
    outcome: {
      irr: number | null;
      moic: number | null;
      exitType: string | null;
      exitValue: number | null;
      holdPeriodMonths: number | null;
      notes: string | null;
      reportedAt: string;
    } | null;
  };
  schemaVersion: number;
  generatedAt: Date;
  // Meta for the PDF renderer — not persisted.
  meta: {
    filename: string;
    overallScore: number;
    noiseScore: number;
    summary: string;
    metaVerdict: string | null;
    biasCount: number;
    /**
     * Top recommended mitigation pulled from the highest-severity bias's
     * `suggestion` field. Null when no biases were flagged or none carried
     * a suggestion. The PDF renders this as a forward-looking "RECOMMENDED
     * NEXT ACTION" section on page 1 so a GC reading the record sees not
     * just risks but the remediation the record implies.
     */
    topMitigation: string | null;
    /**
     * Label of the bias the top mitigation came from, for attribution
     * inside the mitigation section ("Recommended mitigation for
     * {biasLabel}: ..."). Null when topMitigation is null.
     */
    topMitigationFor: string | null;
  };
}

export interface ModelLineage {
  /** Per-node model routing in force at audit time. Mirror of the cost-tier
   *  routing documented in CLAUDE.md. Update this map whenever routing
   *  changes in src/lib/ai/providers/gemini.ts. */
  nodes: Record<string, { model: string; temperature: number; topP: number }>;
  note: string;
}

export interface JudgeVariance {
  noiseScore: number;
  // Optional distribution fields — present when the analysis has noiseStats
  // populated; otherwise a single honest note replaces the distribution.
  distribution?: {
    earlyAccuracy?: number;
    recentAccuracy?: number;
    benchmarks?: Record<string, unknown>;
  };
  metaVerdict: string | null;
  /**
   * Per-judge metadata captured during the pipeline run (1.1 deep). Null
   * for legacy analyses (judgeOutputs column hadn't shipped yet).
   * Procurement uses this to demonstrate convergence — the bias detective,
   * noise judge, fact checker, pre-mortem, and meta-judge are independent
   * passes and the variance shows up as flag counts + statistical jury
   * mean/stdDev.
   */
  granular?: {
    biasDetective?: { flagCount: number; severeFlagCount: number; biasTypes: string[] };
    noiseJudge?: {
      mean: number | null;
      stdDev: number | null;
      variance: number | null;
      sampleCount: number | null;
    };
    factChecker?: {
      score: number | null;
      totalClaims: number | null;
      verified: number | null;
      contradicted: number | null;
    };
    metaJudge?: { verdict: string | null };
    preMortem?: {
      failureScenarioCount: number;
      redTeamCount: number;
      inversionCount: number;
    };
    capturedAt?: string;
  };
  note: string;
}

export interface CitationEntry {
  biasType: string;
  biasLabel: string;
  taxonomyId: string | null;
  citation: string | null;
  doi: string | null;
}

export interface RegulatoryEntry {
  biasType: string;
  frameworks: Array<{ id: string; name: string; provisions: string[] }>;
  aggregateRiskScore: number;
}

export interface PipelineLineageEntry {
  order: number;
  nodeId: string;
  zone: string;
  label: string;
  academicAnchor: string;
}

/**
 * Per-room blind-prior summary as it lives in the DPR (4.1 deep).
 * The shape mirrors `BlindPriorAggregate` but is reduced to the fields
 * a procurement-grade record needs: counts, central tendency, spread,
 * agreement, calibration. Names are only included when the participant
 * opted in to share identity — same privacy contract as the in-app view.
 */
export interface BlindPriorRoomAggregate {
  roomId: string;
  roomTitle: string;
  outcomeFrame: string | null;
  deadline: string | null;
  revealedAt: string | null;
  participantCount: number;
  meanConfidence: number;
  medianConfidence: number;
  stdDevConfidence: number;
  topRisksAgreement: number;
  topRisks: Array<{ risk: string; count: number; attributedTo: string[] }>;
  meanBrier: number | null;
  bestCalibrated: {
    name: string | null;
    confidencePercent: number;
    brierScore: number;
    brierCategory: string | null;
  } | null;
  outcomeReported: boolean;
}

/**
 * Counterfactual scenario row inside the DPR v2 Counterfactual Impact
 * block. Mirrors `CounterfactualScenario` from
 * src/lib/analysis/counterfactual.ts but reduced to the shape a
 * GC-grade record needs: bias label, expected improvement, sample size,
 * Wilson confidence, monetary anchor (where the analysis carries a
 * DecisionFrame.monetaryValue, otherwise null).
 */
export interface CounterfactualScenarioRow {
  biasType: string;
  biasLabel: string;
  expectedImprovementPct: number;
  historicalSampleSize: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
}

/**
 * Counterfactual ROI summary surfaced on page 1 of the DPR. The
 * monetaryAnchorAvailable flag drives the "Estimates capped to
 * percentage points only — no monetary anchor on this audit" disclaimer
 * we render when the analysis lacks a DecisionFrame value.
 */
export interface CounterfactualImpactSummary {
  scenarios: CounterfactualScenarioRow[];
  aggregateImprovementPct: number;
  weightedImprovementPct: number;
  monetaryAnchorAvailable: boolean;
  dataAsOf: string;
  /** Honest disclosure shown next to the aggregate number. */
  methodologyNote: string;
}

/**
 * Reviewer decisions / HITL log. Captures the human-oversight artefact
 * EU AI Act Art 14 + Basel III Pillar 2 ICAAP require. Empty arrays
 * are valid (a reviewer might have accepted nothing or dismissed
 * nothing); the discriminator that says "a human reviewed this" is the
 * non-null `reviewedAt` timestamp.
 */
export interface ReviewerDecisionLog {
  reviewerName: string | null;
  reviewerRole: string | null;
  reviewedAt: string | null;
  acceptedMitigations: Array<{ biasLabel: string; mitigation: string }>;
  dismissedFlags: Array<{ biasLabel: string; reason: string }>;
  dissentLog: Array<{ source: string; objection: string; resolution: string | null }>;
  finalSignOff: 'approved' | 'approved_with_conditions' | 'deferred' | 'rejected' | null;
  signOffNote: string | null;
}

/**
 * Org calibration / Decision Debt summary. Cloverpop-defense block —
 * proves the DQI shown is calibrated against THIS org's outcome
 * history, not a generic global benchmark. When the org has no closed
 * outcomes yet, falls back to the platform seed baseline (the Brier-
 * scored prediction over the 143-case library) so every DPR carries
 * calibration evidence — never "(empty)" — until customer outcomes
 * supersede the seed.
 */
export interface OrgCalibrationSummary {
  /** 'org' once the org has ≥1 closed outcome, 'platform_seed' until then. */
  source: 'org' | 'platform_seed';
  decisionsTracked: number;
  outcomesClosed: number;
  meanBrierScore: number | null;
  brierCategory: string | null;
  recalibratedFromOriginal: {
    originalScore: number;
    recalibratedScore: number;
    delta: number;
  } | null;
  /** Platform seed numbers — populated when source === 'platform_seed'.
   *  Re-derivable from public case-study data; safe to render in any
   *  client-safe DPR. Extended 2026-04-30 (B1 lock) with bootstrap CI
   *  half-width + iterations + seed + computed-at so the DPR cover
   *  carries the procurement-grade methodology footnote (Margaret +
   *  James persona ask). */
  platformSeed?: {
    n: number;
    meanBrier: number;
    classificationAccuracy: number;
    methodologyVersion: string;
    brierCi95?: { lower: number; upper: number; halfWidth: number };
    bootstrapIterations?: number;
    bootstrapSeed?: number;
    computedAt?: string;
  };
  calibrationNote: string;
}

/**
 * Data lifecycle / retention policy footer. Single source of truth for
 * what happens to source documents + audits + the DPR itself once the
 * artefact leaves the platform. Pulled from plan-tier defaults
 * (src/lib/stripe.ts) + trust-copy.ts + company-info.ts.
 */
export interface DataLifecyclePolicy {
  retentionDays: number;
  retentionTier: string;
  encryptionAtRest: string;
  encryptionInTransit: string;
  legalHoldAvailable: boolean;
  rightToErasure: string;
  subProcessors: string[];
  productionRegion: string;
  retentionContact: string;
  /**
   * Deferred-but-credible roadmap items the procurement reader may
   * ask about — surfaced honestly on the footer with a "roadmap"
   * tag so a GC doesn't infer they're live today.
   */
  roadmap: string[];
}

/**
 * Client-safe export marker. Populated only when `generate()` was
 * invoked with `{ clientSafe: true }` — counts how many entities,
 * amounts, and person names were replaced with stable placeholders in
 * the rendered meta strip + summary + reviewer notes. Null on
 * standard exports.
 */
export interface ClientSafeExportMeta {
  enabled: boolean;
  entitiesMasked: number;
  amountsMasked: number;
  namesMasked: number;
  scrubAppliedAt: string;
}

// ─── Model-lineage constant ──────────────────────────────────────────
// Reflects the cost-tier routing documented in CLAUDE.md (Apr 2026).
// Bump the note when routing changes so the record declares the
// change set the audit ran under.
const CURRENT_MODEL_LINEAGE: ModelLineage = {
  nodes: {
    gdprAnonymizer: { model: 'gemini-3.1-flash-lite', temperature: 0.0, topP: 0.95 },
    dataStructurer: { model: 'gemini-3.1-flash-lite', temperature: 0.0, topP: 0.95 },
    intelligenceGatherer: { model: 'gemini-3.1-flash-lite', temperature: 0.2, topP: 0.95 },
    biasDetective: { model: 'gemini-3-flash-preview', temperature: 0.2, topP: 0.95 },
    noiseJudge: { model: 'gemini-3-flash-preview', temperature: 0.4, topP: 0.95 },
    statisticalJury: { model: 'gemini-3-flash-preview', temperature: 0.3, topP: 0.95 },
    verification: { model: 'gemini-3-flash-preview', temperature: 0.1, topP: 0.95 },
    deepAnalysis: { model: 'gemini-3-flash-preview', temperature: 0.3, topP: 0.95 },
    simulation: { model: 'gemini-3-flash-preview', temperature: 0.5, topP: 0.95 },
    rpdRecognition: { model: 'gemini-3-flash-preview', temperature: 0.25, topP: 0.95 },
    forgottenQuestions: { model: 'gemini-3-flash-preview', temperature: 0.35, topP: 0.95 },
    metaJudge: { model: 'gemini-3-flash-preview', temperature: 0.15, topP: 0.95 },
    riskScorer: { model: 'deterministic', temperature: 0.0, topP: 1.0 },
  },
  note: 'Cost-tier routing: preprocessing nodes on Gemini 3.1 Flash Lite, analysis/synthesis nodes on Gemini 3 Flash Preview. Final risk score is deterministic (not LLM-generated).',
};

// ─── Fallback prompt fingerprint ─────────────────────────────────────
// If an Analysis has no linked PromptVersion (pre-versioning rows, or
// a failure during versioning), we compute the SHA-256 of the current
// prompts.ts file as a best-effort fingerprint. Honest disclosure: the
// record notes when this fallback was used.
let cachedPromptFileHash: { hash: string; computedAt: number } | null = null;
const PROMPT_FILE_PATH = join(process.cwd(), 'src', 'lib', 'agents', 'prompts.ts');

function getPromptFileFingerprint(): string {
  const now = Date.now();
  if (cachedPromptFileHash && now - cachedPromptFileHash.computedAt < 60_000) {
    return cachedPromptFileHash.hash;
  }
  try {
    const content = readFileSync(PROMPT_FILE_PATH, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');
    cachedPromptFileHash = { hash, computedAt: now };
    return hash;
  } catch (err) {
    log.warn('Could not hash prompts.ts as fallback fingerprint:', err);
    return 'FILE_NOT_AVAILABLE';
  }
}

// ─── DPR v2 helper builders (locked 2026-04-26 P2) ────────────────────
// One builder per new field family. Each is defensive: it returns
// `undefined` (or a safe default for `dataLifecycle`, which is always
// populated) when the data isn't available rather than throwing — the
// PDF renderer skips the section honestly when given `undefined`.

/** Build the Counterfactual Impact summary from the existing
 *  computeCounterfactuals helper. Returns `undefined` for the cold-start
 *  case (no orgId, no historical outcomes) so the PDF skips the section
 *  with an honest "no historical baseline yet" disclosure. */
async function buildCounterfactualImpact(
  analysisId: string,
  orgId: string | null
): Promise<CounterfactualImpactSummary | undefined> {
  if (!orgId) return undefined;
  try {
    const cf = await computeCounterfactuals(analysisId, orgId);
    if (cf.scenarios.length === 0) return undefined;
    const scenarios: CounterfactualScenarioRow[] = cf.scenarios.slice(0, 3).map(s => ({
      biasType: s.biasRemoved,
      biasLabel: formatBiasLabel(s.biasRemoved),
      expectedImprovementPct: s.expectedImprovement,
      historicalSampleSize: s.historicalSampleSize,
      confidence: s.confidence,
      estimatedMonetaryImpact: s.estimatedMonetaryImpact,
      currency: s.currency,
    }));
    const monetaryAnchorAvailable = scenarios.some(s => s.estimatedMonetaryImpact != null);
    const methodologyNote = monetaryAnchorAvailable
      ? 'Monetary anchors derived from the linked DecisionFrame.monetaryValue. Confidence reflects historical sample size (Wilson score) weighted by the per-org CausalEdge strength.'
      : 'Percentage-point estimates only — no monetary anchor on this audit. Confidence reflects historical sample size (Wilson score) weighted by per-org causal-edge strength.';
    return {
      scenarios,
      aggregateImprovementPct: cf.aggregateImprovement,
      weightedImprovementPct: cf.weightedImprovement,
      monetaryAnchorAvailable,
      dataAsOf: cf.dataAsOf,
      methodologyNote,
    };
  } catch (err) {
    log.warn(
      'Counterfactual impact lookup for DPR failed (treating as cold-start):',
      err instanceof Error ? err.message : String(err)
    );
    return undefined;
  }
}

/** Build the Org Calibration / Decision Debt summary. Pulls Brier
 *  stats + the analysis's own `recalibratedDqi` JSON field. Null is the
 *  honest answer for cold-start orgs with no closed outcomes.
 *
 *  Exported 2026-04-30 (B5 lock) so the deal-page calibration chip
 *  can reuse the same builder the DPR uses — single source of truth
 *  for the per-org-vs-seed calibration shape. */
export async function buildOrgCalibration(
  orgId: string | null,
  recalibratedDqi: unknown
): Promise<OrgCalibrationSummary | undefined> {
  let stats: Awaited<ReturnType<typeof getOrgBrierStats>> | null = null;
  if (orgId) {
    try {
      stats = await getOrgBrierStats(prisma, orgId, 365);
    } catch (err) {
      log.warn(
        'Brier stats lookup for DPR failed (likely schema drift or empty org):',
        err instanceof Error ? err.message : String(err)
      );
      stats = null;
    }
  }

  // Platform seed fallback — when the org has no closed outcomes yet
  // (cold start, design-partner phase, or schema drift) render the
  // 143-case Brier-scored baseline so the DPR always carries
  // calibration evidence. Replaced by per-org calibration as soon as
  // the org has ≥1 closed outcome.
  if (!stats || stats.count === 0) {
    const baseline = computePlatformCalibrationBaseline();
    const seedBrierCat = brierCategory(baseline.meanBrier);
    return {
      source: 'platform_seed',
      decisionsTracked: 0,
      outcomesClosed: 0,
      meanBrierScore: null,
      brierCategory: null,
      recalibratedFromOriginal: null,
      platformSeed: {
        n: baseline.n,
        meanBrier: baseline.meanBrier,
        classificationAccuracy: baseline.classificationAccuracy,
        methodologyVersion: baseline.methodologyVersion,
        brierCi95: baseline.brierCi95,
        bootstrapIterations: baseline.bootstrapIterations,
        bootstrapSeed: baseline.bootstrapSeed,
        computedAt: baseline.computedAt.slice(0, 10),
      },
      calibrationNote: `Platform calibration baseline · Brier ${baseline.meanBrier.toFixed(3)} ± ${baseline.brierCi95.halfWidth.toFixed(3)} (${seedBrierCat}, 95% CI) over ${baseline.n} audited corporate decisions, ${Math.round(
        baseline.classificationAccuracy * 100
      )}% classification accuracy at the investigate-further cutoff. ${baseline.bootstrapIterations.toLocaleString('en-US')}-iteration bootstrap, seed ${baseline.bootstrapSeed}, methodology v${baseline.methodologyVersion}. This is the seed methodology applied without hindsight; per-org calibration replaces the seed once this organisation has ≥1 closed outcome.`,
    };
  }

  const brierCat = stats.avg > 0 ? brierCategory(stats.avg) : null;
  let recalibratedFromOriginal: OrgCalibrationSummary['recalibratedFromOriginal'] = null;
  if (
    recalibratedDqi &&
    typeof recalibratedDqi === 'object' &&
    'originalScore' in recalibratedDqi &&
    'recalibratedScore' in recalibratedDqi
  ) {
    const r = recalibratedDqi as { originalScore: number; recalibratedScore: number };
    recalibratedFromOriginal = {
      originalScore: r.originalScore,
      recalibratedScore: r.recalibratedScore,
      delta: Math.round((r.recalibratedScore - r.originalScore) * 10) / 10,
    };
  }
  const calibrationNote = recalibratedFromOriginal
    ? `DQI shown is calibrated against this organisation's outcome history (${stats.count} closed decisions, mean Brier ${stats.avg.toFixed(3)} · ${brierCat ?? 'unscored'}). Original-vs-recalibrated delta: ${recalibratedFromOriginal.delta >= 0 ? '+' : ''}${recalibratedFromOriginal.delta}.`
    : `Org calibration baseline: ${stats.count} closed decisions tracked, mean Brier ${stats.avg.toFixed(3)} (${brierCat ?? 'unscored'}). Recalibration applied only after the outcome flywheel reaches a per-org statistical floor; this audit shows the absolute DQI.`;
  return {
    source: 'org',
    decisionsTracked: stats.count,
    outcomesClosed: stats.count,
    meanBrierScore: stats.avg,
    brierCategory: brierCat,
    recalibratedFromOriginal,
    calibrationNote,
  };
}

/** Build the Data Lifecycle / Retention Policy footer. Always populated
 *  — every DPR carries this footer because every reader is procurement-
 *  facing. Pulls plan-tier defaults + trust-copy + company-info. */
async function buildDataLifecycle(
  userId: string,
  orgId: string | null
): Promise<DataLifecyclePolicy> {
  let retentionDays = 90;
  let retentionTier = 'individual';
  try {
    if (orgId) {
      const plan = await getOrgPlan(orgId);
      retentionTier = plan;
      retentionDays = await getRetentionDaysForOrg(orgId);
    } else if (userId) {
      const plan = await getUserPlan(userId);
      retentionTier = plan;
      retentionDays = await getRetentionDaysForUser(userId);
    }
  } catch (err) {
    log.warn(
      'Plan/retention lookup for DPR footer failed (using safe defaults):',
      err instanceof Error ? err.message : String(err)
    );
  }
  return {
    retentionDays,
    retentionTier,
    encryptionAtRest: 'AES-256-GCM',
    encryptionInTransit: 'TLS 1.2+',
    legalHoldAvailable: true,
    rightToErasure:
      'GDPR Art. 17 (Right to Erasure) · NDPR Art. 23 (Data Subject Rights) · PoPIA s.24',
    subProcessors: [
      'Vercel (US-region production)',
      'Supabase',
      'Resend (transactional email)',
      'Cloudflare (DNS + email routing)',
    ],
    productionRegion:
      'US (Vercel + Supabase). EU + Multi-region available on Enterprise — Enterprise-conversation residency, not production today.',
    retentionContact: 'team@decision-intel.com',
    roadmap: [
      'Private-key signing of the DPR (planned Q3 2026)',
      'RFC 3161 Time-Stamping Authority (planned Q3 2026)',
      'EU-region production residency (Enterprise SLA on request)',
    ],
  };
}

// ─── Main assembler ──────────────────────────────────────────────────

export async function assembleProvenanceRecordData(
  analysisId: string
): Promise<ProvenanceRecordData> {
  // Schema-drift tolerant: try the full query first; fall back to a
  // narrower query if PromptVersion relation or Document.contentHash are
  // missing (P2021/P2022). Without the fallback, a missing migration
  // silently aborted every DPR generation with a generic 500.
  let analysis: Awaited<ReturnType<typeof prisma.analysis.findUnique>> & {
    biases?: Array<{
      biasType: string;
      severity: string;
      suggestion: string | null;
      excerpt: string | null;
      confidence: number | null;
    }>;
    promptVersion?: { hash: string; name: string; version: number } | null;
    document: {
      id: string;
      filename: string;
      contentHash: string | null;
      userId: string;
      orgId: string | null;
    };
  };
  try {
    const full = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: {
          select: {
            biasType: true,
            severity: true,
            suggestion: true,
            excerpt: true,
            confidence: true,
          },
        },
        // Toxic combinations fed into the RCF pattern-aware boost so
        // cases tagged with the same patternLabel surface in the top
        // analogs (M&A cascade depth ship 2026-05-09).
        toxicCombinations: {
          select: { patternLabel: true, toxicScore: true },
        },
        promptVersion: {
          select: { hash: true, name: true, version: true },
        },
        document: {
          select: {
            id: true,
            filename: true,
            contentHash: true,
            userId: true,
            orgId: true,
            // Synergy defensibility extraction. Prefer the structured
            // parsedStructuredData column (locked 2026-05-09 hard-layer
            // ship — Document.parsedStructuredData JSON field). Falls back
            // to the inline-marker text extraction from content for legacy
            // uploads or when the structured field is null.
            content: true,
            documentType: true,
            parsedStructuredData: true,
          },
        },
      },
    });
    if (!full) {
      throw new Error(`Analysis ${analysisId} not found — cannot assemble provenance record.`);
    }
    // The cast is required because Prisma's narrowing of `findUnique` returns
    // a unioned type; we know our shape after `include`.
    analysis = full as typeof analysis;
  } catch (queryErr: unknown) {
    const code = (queryErr as { code?: string }).code;
    if (code !== 'P2021' && code !== 'P2022') {
      throw queryErr;
    }
    // Fallback: drop the PromptVersion relation + contentHash column.
    // promptFingerprint will fall back to the prompts.ts file hash;
    // inputHash will be 'UNAVAILABLE'.
    const fallback = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: {
          select: {
            biasType: true,
            severity: true,
            suggestion: true,
            excerpt: true,
            confidence: true,
          },
        },
        document: {
          select: { id: true, filename: true, userId: true, orgId: true },
        },
      },
    });
    if (!fallback) {
      throw new Error(`Analysis ${analysisId} not found — cannot assemble provenance record.`);
    }
    analysis = {
      ...fallback,
      promptVersion: null,
      document: {
        ...fallback.document,
        contentHash: null,
      },
    } as typeof analysis;
  }

  const biasTypes = Array.from(new Set((analysis.biases ?? []).map(b => b.biasType)));

  // Top recommended mitigation: pick the highest-severity bias with a
  // non-empty suggestion. Severity is a string ('critical' | 'high' |
  // 'medium' | 'low') — rank it explicitly so 'critical' beats 'high'.
  const SEVERITY_RANK: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const rankedBiases = (analysis.biases ?? [])
    .filter(b => b.suggestion && b.suggestion.trim().length > 0)
    .sort(
      (a, b) =>
        (SEVERITY_RANK[b.severity?.toLowerCase() ?? ''] ?? 0) -
        (SEVERITY_RANK[a.severity?.toLowerCase() ?? ''] ?? 0)
    );
  const topMitigationBias = rankedBiases[0] ?? null;
  const topMitigation = topMitigationBias?.suggestion?.trim() ?? null;
  const topMitigationFor = topMitigationBias ? formatBiasLabel(topMitigationBias.biasType) : null;

  // Prompt fingerprint: prefer the linked PromptVersion.hash (authoritative
  // per-audit hash). Fall back to hashing prompts.ts (honest best-effort).
  const promptFingerprint = analysis.promptVersion?.hash ?? getPromptFileFingerprint();

  const inputHash = analysis.document.contentHash ?? 'UNAVAILABLE';

  // Citations: one entry per detected bias type, with taxonomy ID + full
  // APA citation + DOI if present.
  const citations: CitationEntry[] = biasTypes.map(biasType => {
    const edu = getBiasEducation(biasType);
    return {
      biasType,
      biasLabel: formatBiasLabel(biasType),
      taxonomyId: edu?.taxonomyId ?? null,
      citation: edu?.academicReference?.citation ?? null,
      doi: edu?.academicReference?.doi ?? null,
    };
  });

  // Regulatory mapping: one entry per detected bias, listing the
  // frameworks + provision IDs the bias touches.
  const regulatoryMapping: RegulatoryEntry[] = biasTypes.map(biasType => {
    const risk = getCrossFrameworkRisk(biasType);
    return {
      biasType,
      aggregateRiskScore: risk.aggregateRiskScore,
      frameworks: risk.frameworks.map(fw => ({
        id: fw.frameworkId,
        name: fw.frameworkName,
        provisions: fw.provisions.map(p => `${p.provisionId} — ${p.title}`),
      })),
    };
  });

  // Pipeline lineage: node IDs + order (hashes-per-node are record v2).
  const pipelineLineage: PipelineLineageEntry[] = PIPELINE_NODES.map((node, i) => ({
    order: i + 1,
    nodeId: node.id,
    zone: node.zone,
    label: node.label,
    academicAnchor: node.academicAnchor,
  }));

  // Judge variance: granular per-judge summary persisted on Analysis
  // (1.1 deep). Falls back to the v1 shape when judgeOutputs is null
  // (legacy analyses captured before the column shipped).
  const noiseBenchmarks =
    analysis.noiseBenchmarks && typeof analysis.noiseBenchmarks === 'object'
      ? (analysis.noiseBenchmarks as Record<string, unknown>)
      : undefined;
  const judgeOutputs =
    (analysis as unknown as { judgeOutputs?: JudgeVariance['granular'] | null }).judgeOutputs ??
    null;
  const judgeVariance: JudgeVariance = {
    noiseScore: analysis.noiseScore,
    distribution: noiseBenchmarks ? { benchmarks: noiseBenchmarks } : undefined,
    metaVerdict: analysis.metaVerdict ?? null,
    granular: judgeOutputs ?? undefined,
    note: judgeOutputs
      ? 'Per-judge convergence summary. Each judge runs independently; flag counts + noise stdDev show pipeline convergence. Raw prompt outputs are excluded by design (prompt-IP protection); the meta-judge verdict reproduces the convergence call.'
      : 'Legacy analysis — granular per-judge outputs were not captured at run time. Available on request under the DPA from the internal audit log.',
  };

  // Decision Room blind-prior aggregates (4.1 deep). Pulls every room
  // whose `analysisId` matches, computes the anonymised aggregate per
  // room, and reduces it down to the procurement-friendly shape stored
  // on the DPR. Schema-drift tolerant — falls back to an empty array
  // when the table or columns aren't migrated yet.
  let blindPriorAggregates: BlindPriorRoomAggregate[] = [];
  try {
    const rooms = await prisma.decisionRoom.findMany({
      where: { analysisId: analysis.id },
      select: {
        id: true,
        title: true,
        blindPriorOutcomeFrame: true,
        blindPriorDeadline: true,
        blindPriorRevealedAt: true,
        outcomeId: true,
        decisionRoomBlindPriors: {
          select: {
            id: true,
            respondentUserId: true,
            respondentEmail: true,
            respondentName: true,
            confidencePercent: true,
            topRisks: true,
            privateRationale: true,
            shareRationale: true,
            shareIdentity: true,
            brierScore: true,
            brierCategory: true,
            brierCalculatedAt: true,
            submittedAt: true,
          },
        },
      },
    });
    blindPriorAggregates = rooms
      .filter(r => r.decisionRoomBlindPriors.length > 0)
      .map(room => {
        const agg = aggregateBlindPriors(room.decisionRoomBlindPriors as BlindPriorRow[]);
        return {
          roomId: room.id,
          roomTitle: room.title,
          outcomeFrame: room.blindPriorOutcomeFrame,
          deadline: room.blindPriorDeadline?.toISOString() ?? null,
          revealedAt: room.blindPriorRevealedAt?.toISOString() ?? null,
          participantCount: agg.count,
          meanConfidence: agg.meanConfidence,
          medianConfidence: agg.medianConfidence,
          stdDevConfidence: agg.stdDevConfidence,
          topRisksAgreement: agg.topRisksAgreement,
          topRisks: agg.topRisks.slice(0, 6),
          meanBrier: agg.meanBrier,
          bestCalibrated: agg.bestCalibrated,
          outcomeReported: room.outcomeId !== null,
        };
      });
  } catch (err) {
    log.warn(
      'Blind-prior aggregate lookup for DPR failed (likely schema drift):',
      err instanceof Error ? err.message : String(err)
    );
  }

  // DPR v2 enrichment (locked 2026-04-26 P2 from NotebookLM
  // highest-ROI synthesis). Each block is independently fault-tolerant
  // — failure to populate one returns undefined and the PDF skips the
  // section honestly rather than fabricating data.
  const orgId = analysis.document.orgId ?? null;
  const userId = analysis.document.userId;
  const documentType =
    (analysis.document as unknown as { documentType?: string | null }).documentType ?? null;
  const industry = (analysis.document as unknown as { industry?: string | null }).industry ?? null;
  const domainHint = documentType ?? industry;
  const [counterfactualImpact, orgCalibration, dataLifecycle, feedbackAdequacy] = await Promise.all(
    [
      buildCounterfactualImpact(analysis.id, orgId),
      buildOrgCalibration(
        orgId,
        (analysis as unknown as { recalibratedDqi?: unknown }).recalibratedDqi ?? null
      ),
      buildDataLifecycle(userId, orgId),
      getFeedbackAdequacy(prisma, userId, { domainHint }),
    ]
  );
  // Reference-class forecast — pure function, deterministic, runs in
  // <5ms. Computed synchronously after the Promise.all so it can use
  // the deduplicated biasTypes computed above. Pass the toxic-combination
  // patternLabels that fired on this audit so the RCF surfaces structurally-
  // analogous failures (M&A cascade depth ship 2026-05-09).
  const auditPatternLabels = (
    (
      analysis as unknown as {
        toxicCombinations?: Array<{ patternLabel: string | null }>;
      }
    ).toxicCombinations ?? []
  )
    .map(t => t.patternLabel)
    .filter((p): p is string => Boolean(p));
  const referenceClassForecast = getReferenceClassForecast({
    biasTypes,
    industry,
    documentType,
    toxicCombinations: auditPatternLabels,
  });
  // Validity classification — read the persisted value from
  // judgeOutputs first (set at audit-completion time by /api/analyze/
  // stream); fall back to live compute for legacy analyses where the
  // pipeline didn't persist it. The DPR + UI surfaces always show the
  // SAME band the DQI engine scored against; never silently drift.
  const persistedValidity = (
    analysis as unknown as {
      judgeOutputs?: { validityClassification?: ValidityClassification | null } | null;
    }
  ).judgeOutputs?.validityClassification;
  const validityClassification =
    persistedValidity ??
    classifyValidity({
      documentType,
      industry,
    });

  // Bias-input shape shared across the next 4 detectors. Severity is
  // normalised to the 4-band canonical lowercase form once.
  const dprNormalisedBiases = (analysis.biases ?? []).map(b => ({
    biasType: b.biasType,
    severity: (['critical', 'high', 'medium', 'low'].includes((b.severity ?? '').toLowerCase())
      ? (b.severity ?? '').toLowerCase()
      : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    excerpt: b.excerpt ?? null,
  }));

  // Calibrated Rejection of Subjective Confidence — Item 3 lock
  // 2026-05-07. Pure function combining the validity class + feedback
  // adequacy + bias-detective hits on confidence-language patterns
  // (illusion_of_validity / overconfidence / authority / anchoring).
  // Renders as the 4th first-class strip on the DPR cover answering
  // Margaret-class CSO's most-asked question: "does this memo's
  // confidence match the evidence?" Always populated — `cannot_assess`
  // is the explicit honest answer when feedback verdict is 'unknown'.
  const calibratedRejection = computeCalibratedRejection({
    validity: validityClassification,
    feedback: feedbackAdequacy,
    biases: dprNormalisedBiases,
  });

  // Fractionation of Expertise — R²F paper-app #1 (wedge-batch-4 lock
  // 2026-05-07). Per-decision-class slicing of the user's outcome
  // history. Single Prisma query inside the detector with try/catch +
  // 'cannot_assess' fallback — never crashes the DPR path.
  const fractionationOfExpertise = await getFractionationOfExpertise(prisma, userId, {
    documentType,
  });

  // Decision Rubric Structure — R²F paper-app #4 (Dawes 1979). Pure
  // function over bias excerpts + summary; deterministic, no DB call.
  const decisionRubric = computeDecisionRubric({
    biases: dprNormalisedBiases,
    summary: analysis.summary,
  });

  // Algorithm Aversion — R²F paper-app #7 (Dietvorst et al. 2015). Pure
  // function over bias excerpts + summary; deterministic, no DB call.
  const algorithmAversion = computeAlgorithmAversion({
    biases: dprNormalisedBiases,
    summary: analysis.summary,
  });

  // Synergy Defensibility — preferred source is Document.parsedStructuredData
  // (locked 2026-05-09 hard-layer ship — first-class Prisma JSON column
  // populated by the upload route's type-aware structured extraction).
  // Falls back to the inline STRUCTURED SYNERGY MODEL block in
  // Document.content for legacy uploads where parsedStructuredData is null
  // (existed before the migration; or upload was on the old text-only path).
  // Pure function either way, deterministic, no LLM.
  const doc = (
    analysis as unknown as {
      document?: {
        content?: string | null;
        documentType?: string | null;
        parsedStructuredData?: unknown;
      };
    }
  ).document;
  let synergyDefensibility: SynergyDefensibilitySummary | undefined = undefined;
  if (doc?.documentType === 'synergy_model') {
    // Path 1 (preferred): structured field
    if (doc.parsedStructuredData) {
      const parsed = doc.parsedStructuredData as ParsedSynergyModelData | null;
      synergyDefensibility = summariseSynergyDefensibility(parsed) ?? undefined;
    }
    // Path 2 (fallback): inline-marker text extraction for legacy uploads
    if (!synergyDefensibility && doc.content) {
      synergyDefensibility = extractSynergyDefensibilityFromContent(doc.content) ?? undefined;
    }
  }

  // Phase 4 wire-in: build the per-bias findings augment from the live
  // analysis.biases data. The new HTML/CSS DPR render at /dpr-render
  // reads this map to populate finding cards with verbatim memo
  // excerpts + recommended mitigations + severity overrides.
  const findingsAugment: Record<string, DprFindingsAugmentRow> = {};
  for (const bias of analysis.biases ?? []) {
    // Keep the FIRST occurrence per biasType (the canonical instance).
    // BiasInstances can appear multiple times if the same bias fires on
    // different excerpts of the same memo; the DPR card is per-type so
    // we surface the leading excerpt + suggestion. Reviewer decisions UI
    // can extend this later if multi-instance per type becomes important.
    if (findingsAugment[bias.biasType]) continue;
    findingsAugment[bias.biasType] = {
      evidenceQuote: bias.excerpt?.trim() || null,
      mitigation: bias.suggestion?.trim() || null,
      severityOverride: normaliseSeverity(bias.severity),
      confidenceOverride: bias.confidence ?? undefined,
    };
  }

  return {
    analysisId: analysis.id,
    documentId: analysis.document.id,
    userId,
    orgId,
    promptFingerprint,
    inputHash,
    modelLineage: CURRENT_MODEL_LINEAGE,
    judgeVariance,
    citations,
    regulatoryMapping,
    pipelineLineage,
    findingsAugment,
    blindPriorAggregates,
    counterfactualImpact,
    // reviewerDecisions intentionally undefined in the live assembler —
    // the capture UI hasn't shipped, so the only honest answer for the
    // live path is "no reviewer-decision record on this audit". The
    // SPECIMEN seeds a plausible value so a procurement reader can see
    // what the section will look like once the UI ships.
    reviewerDecisions: undefined,
    orgCalibration,
    feedbackAdequacy,
    referenceClassForecast,
    validityClassification,
    calibratedRejection,
    fractionationOfExpertise,
    decisionRubric,
    algorithmAversion,
    synergyDefensibility,
    dataLifecycle,
    clientSafe: undefined,
    schemaVersion: 2,
    generatedAt: new Date(),
    meta: {
      filename: analysis.document.filename,
      overallScore: analysis.overallScore,
      noiseScore: analysis.noiseScore,
      summary: analysis.summary,
      metaVerdict: analysis.metaVerdict ?? null,
      biasCount: biasTypes.length,
      topMitigation,
      topMitigationFor,
    },
  };
}

function normaliseSeverity(
  s: string | null | undefined
): 'critical' | 'high' | 'medium' | 'low' | undefined {
  const lower = (s ?? '').toLowerCase();
  if (lower === 'critical' || lower === 'high' || lower === 'medium' || lower === 'low')
    return lower;
  return undefined;
}
