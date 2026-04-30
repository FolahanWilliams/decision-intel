/**
 * Sample Decision Provenance Record — hand-crafted seed data used to
 * render the public SPECIMEN PDF at /api/public/sample-dpr. No database
 * reads, no LLM calls, no user data. The memo is fictional; the hashes
 * are computed at import time over stable canonical strings so every
 * build produces the same SPECIMEN bytes.
 *
 * A SPECIMEN watermark is stamped across every page by the generator
 * so a GC, journalist, or regulator can't mistake this for a live audit.
 * The point of the specimen is exactly to let them see what a live DPR
 * would look like before anyone has to sign a contract.
 */

import { createHash } from 'node:crypto';
import type {
  ProvenanceRecordData,
  ModelLineage,
  JudgeVariance,
  CitationEntry,
  RegulatoryEntry,
  PipelineLineageEntry,
  CounterfactualImpactSummary,
  ReviewerDecisionLog,
  OrgCalibrationSummary,
  DataLifecyclePolicy,
} from './provenance-record-data';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import type { ReferenceClassForecast } from '@/lib/learning/reference-class-forecast';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import { PIPELINE_NODES } from '@/lib/data/pipeline-nodes';

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

const SAMPLE_FILENAME = 'ProjectHeliograph-MarketEntry-Memo-v3.pdf';
const SAMPLE_ANALYSIS_ID = 'specimen-analysis-0000';
const SAMPLE_DOCUMENT_ID = 'specimen-document-0000';

const SAMPLE_MODEL_LINEAGE: ModelLineage = {
  nodes: {
    gdprAnonymizer: { model: 'preprocessing-tier', temperature: 0.0, topP: 0.95 },
    dataStructurer: { model: 'preprocessing-tier', temperature: 0.0, topP: 0.95 },
    intelligenceGatherer: { model: 'preprocessing-tier', temperature: 0.2, topP: 0.95 },
    biasDetective: { model: 'analysis-tier', temperature: 0.2, topP: 0.95 },
    noiseJudge: { model: 'analysis-tier', temperature: 0.4, topP: 0.95 },
    statisticalJury: { model: 'analysis-tier', temperature: 0.3, topP: 0.95 },
    rpdRecognition: { model: 'analysis-tier', temperature: 0.25, topP: 0.95 },
    forgottenQuestions: { model: 'analysis-tier', temperature: 0.35, topP: 0.95 },
    metaJudge: { model: 'analysis-tier', temperature: 0.15, topP: 0.95 },
    riskScorer: { model: 'deterministic', temperature: 0.0, topP: 1.0 },
  },
  note: 'Cost-tier routing: preprocessing and analysis tiers run on separate model classes; final risk score is deterministic, not model-generated. Actual model IDs are resolved at audit time and available to design partners on request under NDA.',
};

const SAMPLE_JUDGE_VARIANCE: JudgeVariance = {
  noiseScore: 22,
  metaVerdict:
    'Concurred on three of four material flags; minority dissent on reference-class (Pre-Mortem flagged the 18-month break-even claim as optimistic; Ensemble Sampling concurred only after base-rate pull).',
  note: 'Summary view of judge variance. Per-judge granular outputs are stored in the internal audit log and are available on request under the DPA; they are deliberately excluded from the client-facing record to protect prompt internals.',
};

const SAMPLE_CITATIONS: CitationEntry[] = [
  {
    biasType: 'confirmation_bias',
    biasLabel: 'Confirmation Bias',
    taxonomyId: 'DI-B-001',
    citation:
      'Nickerson, R. S. (1998). Confirmation bias: A ubiquitous phenomenon in many guises. Review of General Psychology, 2(2), 175–220.',
    doi: '10.1037/1089-2680.2.2.175',
  },
  {
    biasType: 'anchoring_bias',
    biasLabel: 'Anchoring Bias',
    taxonomyId: 'DI-B-002',
    citation:
      'Tversky, A., & Kahneman, D. (1974). Judgment under uncertainty: Heuristics and biases. Science, 185(4157), 1124–1131.',
    doi: '10.1126/science.185.4157.1124',
  },
  {
    biasType: 'overconfidence_bias',
    biasLabel: 'Overconfidence Bias',
    taxonomyId: 'DI-B-004',
    citation:
      'Moore, D. A., & Healy, P. J. (2008). The trouble with overconfidence. Psychological Review, 115(2), 502–517.',
    doi: '10.1037/0033-295X.115.2.502',
  },
  {
    biasType: 'sunk_cost_fallacy',
    biasLabel: 'Sunk Cost Fallacy',
    taxonomyId: 'DI-B-006',
    citation:
      'Arkes, H. R., & Blumer, C. (1985). The psychology of sunk cost. Organizational Behavior and Human Decision Processes, 35(1), 124–140.',
    doi: '10.1016/0749-5978(85)90049-4',
  },
];

/**
 * Specimen regulatory mapping. Updated 2026-04-26 (P1 #25, Titi persona
 * finding) so the public sample DPR no longer reads as US/EU-only.
 * African frameworks are surfaced alongside the existing EU/US/UK
 * regimes — every public-tier DPR sample now carries NDPR + WAEMU +
 * CMA Kenya + PoPIA + FRC Nigeria entries on the same biases an
 * African-market deal would touch. The full map across the 18-framework
 * registry is in src/lib/compliance/frameworks/; this file exposes the
 * subset the SPECIMEN renders.
 */
const SAMPLE_REGULATORY: RegulatoryEntry[] = [
  {
    biasType: 'confirmation_bias',
    aggregateRiskScore: 7.4,
    frameworks: [
      {
        id: 'eu_ai_act',
        name: 'EU AI Act',
        provisions: ['Article 14 — Human oversight', 'Article 15 — Accuracy and record-keeping'],
      },
      {
        id: 'basel_iii',
        name: 'Basel III · Pillar 2 ICAAP',
        provisions: ['Qualitative-decision documentation'],
      },
      {
        id: 'ndpr_nigeria',
        name: 'NDPR Art. 12 (Nigeria)',
        provisions: ['Automated-decision rights — meaningful information about the logic'],
      },
      {
        id: 'popia_south_africa',
        name: 'PoPIA s.24 (South Africa)',
        provisions: ['Quality of information — accuracy and completeness'],
      },
    ],
  },
  {
    biasType: 'overconfidence_bias',
    aggregateRiskScore: 8.1,
    frameworks: [
      {
        id: 'sec_ai_disclosure',
        name: 'SEC AI Disclosure',
        provisions: ['Rule 206(4)-8 — Investment-adviser decision documentation'],
      },
      {
        id: 'eu_ai_act',
        name: 'EU AI Act',
        provisions: ['Annex III — High-risk decision support'],
      },
      {
        id: 'cbn_ai_guidelines',
        name: 'CBN AI Guidelines (Nigeria)',
        provisions: ['Para. 4.2 — Model governance & validation'],
      },
      {
        id: 'sarb_model_risk',
        name: 'SARB Model Risk (South Africa)',
        provisions: ['Directive D2/2022 — Model risk & AI governance'],
      },
    ],
  },
  {
    biasType: 'anchoring_bias',
    aggregateRiskScore: 5.8,
    frameworks: [
      { id: 'eu_ai_act', name: 'EU AI Act', provisions: ['Article 13 — Transparency to users'] },
      { id: 'gdpr', name: 'GDPR', provisions: ['Article 22 — Automated decision-making'] },
      {
        id: 'frc_nigeria',
        name: 'FRC Nigeria',
        provisions: ['Principle 1.1 — Board effectiveness & decision-making'],
      },
    ],
  },
  {
    biasType: 'sunk_cost_fallacy',
    aggregateRiskScore: 6.2,
    frameworks: [
      { id: 'sox_404', name: 'SOX §404', provisions: ['Internal-controls documentation'] },
      {
        id: 'frc_nigeria',
        name: 'FRC Nigeria',
        provisions: ['Principle 11 — Risk management & material-risk re-identification'],
      },
      {
        id: 'waemu',
        name: 'WAEMU',
        provisions: ['BCEAO Circular 04-2017 — Internal governance & material-decision evidence'],
      },
      {
        id: 'cma_kenya',
        name: 'CMA Kenya',
        provisions: ['Conduct Regs 2024 Pt. III — Material disclosure & risk factors'],
      },
    ],
  },
];

const SAMPLE_PIPELINE_LINEAGE: PipelineLineageEntry[] = PIPELINE_NODES.map((node, i) => ({
  order: i + 1,
  nodeId: node.id,
  zone: node.zone,
  label: node.label,
  academicAnchor: node.academicAnchor,
}));

// ─── DPR v2 specimen blocks ──────────────────────────────────────────
// Plausible seed values so the SPECIMEN PDF demonstrates every v2
// section. Hand-crafted to read like a real CSO+GC review of the
// fictional Project Heliograph DACH market-entry memo.

const SAMPLE_COUNTERFACTUAL_IMPACT: CounterfactualImpactSummary = {
  scenarios: [
    {
      biasType: 'overconfidence_bias',
      biasLabel: 'Overconfidence Bias',
      expectedImprovementPct: 18.4,
      historicalSampleSize: 31,
      confidence: 0.78,
      estimatedMonetaryImpact: 2_580_000,
      currency: 'USD',
    },
    {
      biasType: 'confirmation_bias',
      biasLabel: 'Confirmation Bias',
      expectedImprovementPct: 11.2,
      historicalSampleSize: 26,
      confidence: 0.69,
      estimatedMonetaryImpact: 1_570_000,
      currency: 'USD',
    },
    {
      biasType: 'sunk_cost_fallacy',
      biasLabel: 'Sunk Cost Fallacy',
      expectedImprovementPct: 7.6,
      historicalSampleSize: 19,
      confidence: 0.58,
      estimatedMonetaryImpact: 1_065_000,
      currency: 'USD',
    },
  ],
  aggregateImprovementPct: 32.4,
  weightedImprovementPct: 13.1,
  monetaryAnchorAvailable: true,
  dataAsOf: '2026-04-23T09:00:00Z',
  methodologyNote:
    'Monetary anchors derived from the linked DecisionFrame.monetaryValue (DACH expansion budget USD 14M). Confidence reflects historical sample size (Wilson score) weighted by per-org CausalEdge strength. Aggregate assumes bias independence — the 32.4-pt headline overstates the realistic combined effect; reviewers should trust the confidence-weighted 13.1-pt number for board-presentation purposes.',
};

const SAMPLE_REVIEWER_DECISIONS: ReviewerDecisionLog = {
  reviewerName: 'Sarah Adekunle',
  reviewerRole: 'General Counsel · Project Heliograph review',
  reviewedAt: '2026-04-22T19:15:00Z',
  acceptedMitigations: [
    {
      biasLabel: 'Overconfidence Bias',
      mitigation:
        'Commission an independent reference-class forecast against eight to twelve comparable European DACH expansions before the committee vote. Require base-rate break-even distributions alongside point estimates so the committee sees the range, not a single number.',
    },
    {
      biasLabel: 'Confirmation Bias',
      mitigation:
        'Expand the customer-discovery cohort from 14 to 30 prospects with explicit selection criteria documented; reviewer to validate the selection criteria do not over-weight the existing GTM thesis.',
    },
  ],
  dismissedFlags: [
    {
      biasLabel: 'Anchoring Bias',
      reason:
        'The 18-month break-even number was set by the IC at the prior gate, not by this memo. The anchoring critique applies to that earlier decision, not to the current vote on incremental headcount.',
    },
  ],
  dissentLog: [
    {
      source: 'Ensemble Sampling (judge)',
      objection:
        'Concurred only after base-rate pull on the 18-month break-even claim; pre-pull the model rated the claim as "supported".',
      resolution:
        'Documented in the audit log; reviewer accepts the post-pull verdict as the binding one.',
    },
    {
      source: 'Pre-mortem (judge)',
      objection:
        'Flagged currency hedge as unfunded for the 18-month horizon; CFO disagreed (hedge budget is in OPEX, not CAPEX).',
      resolution:
        'CFO clarification accepted; mitigation #2 modified to require the OPEX hedge line to be called out explicitly in the IC pack.',
    },
  ],
  finalSignOff: 'approved_with_conditions',
  signOffNote:
    'Approving the audit record subject to (a) the independent reference-class forecast landing before the IC vote, and (b) the OPEX currency-hedge line being made explicit in the deck. Both conditions must be satisfied or this audit record should not be relied upon as supporting the committee decision.',
};

const SAMPLE_ORG_CALIBRATION: OrgCalibrationSummary = {
  source: 'org',
  decisionsTracked: 42,
  outcomesClosed: 28,
  meanBrierScore: 0.183,
  brierCategory: 'good',
  recalibratedFromOriginal: {
    originalScore: 68,
    recalibratedScore: 64,
    delta: -4,
  },
  calibrationNote:
    "DQI shown is calibrated against this organisation's outcome history (28 closed decisions, mean Brier 0.183 · good). Original-vs-recalibrated delta: -4 (the organisation has historically been over-confident on DACH-style market entries; the recalibrator pulls the headline score down accordingly).",
};

const SAMPLE_FEEDBACK_ADEQUACY: FeedbackAdequacy = {
  verdict: 'sparse',
  closedOutcomes: 6,
  recentClosedOutcomes: 4,
  daysSinceLastOutcome: 95,
  meanBrier: 0.21,
  domainMatchCount: 2,
  domainHint: 'market_entry',
  note: 'Only 2 closed-loop outcomes on market_entry decisions in the past 18 months — too few for calibrated intuition by Kahneman & Klein’s (2009) standard. Experience-based justifications in this memo should be cross-checked against external base rates. Mean Brier 0.210 across 4 scored outcomes (CIA-analyst band).',
};

const SAMPLE_REFERENCE_CLASS_FORECAST: ReferenceClassForecast = {
  poolSize: 143,
  matchedClassSize: 11,
  baselineFailureRate: 0.636,
  baselineSampleSize: 11,
  predictedOutcomeBand: 'reference_class_struggles',
  topAnalogs: [
    {
      caseId: 'wework-ipo-2019',
      slug: 'wework-the-wework-collapse',
      title: 'The WeWork S-1 Collapse',
      company: 'WeWork',
      industry: 'real_estate',
      year: 2019,
      outcome: 'catastrophic_failure',
      similarityScore: 0.74,
      matchReason: '64% bias overlap · industry match (real_estate) · high-stakes context',
    },
    {
      caseId: 'walmart-germany',
      slug: 'walmart-germany-market-entry',
      title: 'Walmart Germany Market Entry',
      company: 'Walmart',
      industry: 'retail',
      year: 1997,
      outcome: 'failure',
      similarityScore: 0.61,
      matchReason: '52% bias overlap · ic_memo pattern',
    },
    {
      caseId: 'tesco-fresh-easy',
      slug: 'tesco-fresh-easy-us-expansion',
      title: 'Tesco Fresh & Easy US Expansion',
      company: 'Tesco',
      industry: 'retail',
      year: 2007,
      outcome: 'failure',
      similarityScore: 0.58,
      matchReason: '47% bias overlap · ic_memo pattern',
    },
    {
      caseId: 'home-depot-china',
      slug: 'home-depot-china-exit',
      title: 'Home Depot China Exit',
      company: 'Home Depot',
      industry: 'retail',
      year: 2006,
      outcome: 'failure',
      similarityScore: 0.55,
      matchReason: '43% bias overlap · ic_memo pattern',
    },
    {
      caseId: 'starbucks-australia',
      slug: 'starbucks-australia-failure',
      title: 'Starbucks Australia Failure',
      company: 'Starbucks',
      industry: 'consumer',
      year: 2000,
      outcome: 'partial_failure',
      similarityScore: 0.49,
      matchReason: '40% bias overlap',
    },
  ],
  note: 'Reference class of 11 historically-similar decisions failed in 64% of cases. Per Kahneman & Lovallo (2003), this is a structurally challenging base rate — the memo’s confidence should be calibrated against this rate, not against the inside-view narrative. Closest analog: WeWork (2019) — outcome: catastrophic failure.',
  inputs: {
    biasTypes: ['confirmation_bias', 'overconfidence_bias', 'anchoring_bias', 'halo_effect'],
    industry: 'real_estate',
    documentType: 'ic_memo',
  },
};

const SAMPLE_VALIDITY_CLASSIFICATION: ValidityClassification = {
  validityClass: 'low',
  rationale:
    'documentType="ic_memo" maps to low-validity per the Kahneman & Klein 2009 environment taxonomy; industry="real_estate" tilts the band down (already at low)',
  signals: {
    documentType: 'ic_memo',
    industry: 'real_estate',
    decisionHorizon: '18-month integration horizon',
  },
};

const SAMPLE_DATA_LIFECYCLE: DataLifecyclePolicy = {
  retentionDays: 365,
  retentionTier: 'team',
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

const SAMPLE_SUMMARY =
  'Proposal to launch a direct sales motion into DACH markets with a projected 18-month break-even, anchored to a single customer-discovery cohort of 14 prospects. Analysis flags confirmation bias in source selection, overconfidence in the break-even claim, and sunk-cost framing around the incumbent go-to-market build. Recommended action: commission an independent reference-class forecast against comparable European expansions before the committee vote.';

/**
 * Build the SPECIMEN ProvenanceRecordData. Timestamps are frozen to the
 * release date of the SPECIMEN so re-generating produces byte-identical
 * content (helpful for caching, not strictly required).
 */
export function buildSampleDprData(): ProvenanceRecordData {
  const specimenDate = new Date('2026-04-23T09:00:00Z');
  return {
    analysisId: SAMPLE_ANALYSIS_ID,
    documentId: SAMPLE_DOCUMENT_ID,
    userId: 'specimen',
    orgId: null,
    promptFingerprint: hash('specimen-prompt-v1.0'),
    inputHash: hash('specimen-memo-projectheliograph-v3'),
    modelLineage: SAMPLE_MODEL_LINEAGE,
    judgeVariance: SAMPLE_JUDGE_VARIANCE,
    citations: SAMPLE_CITATIONS,
    regulatoryMapping: SAMPLE_REGULATORY,
    pipelineLineage: SAMPLE_PIPELINE_LINEAGE,
    blindPriorAggregates: [
      {
        roomId: 'specimen-room-0001',
        roomTitle: 'Project Heliograph · IC pre-vote',
        outcomeFrame:
          'Should we approve the DACH market entry at the proposed $14M budget and 18-month break-even target?',
        deadline: '2026-04-22T17:00:00Z',
        revealedAt: '2026-04-22T17:30:00Z',
        participantCount: 6,
        meanConfidence: 47.5,
        medianConfidence: 50,
        stdDevConfidence: 18.4,
        topRisksAgreement: 0.42,
        topRisks: [
          {
            risk: 'break-even underestimates customer-acquisition cost',
            count: 4,
            attributedTo: ['Sarah Adekunle'],
          },
          {
            risk: 'reference-class missing — no comparable EU expansions cited',
            count: 3,
            attributedTo: [],
          },
          { risk: 'sunk-cost framing on incumbent GTM build', count: 2, attributedTo: [] },
          { risk: 'currency hedge unfunded for the 18-month horizon', count: 2, attributedTo: [] },
        ],
        meanBrier: 0.142,
        bestCalibrated: {
          name: 'Sarah Adekunle',
          confidencePercent: 35,
          brierScore: 0.062,
          brierCategory: 'excellent',
        },
        outcomeReported: true,
      },
    ],
    counterfactualImpact: SAMPLE_COUNTERFACTUAL_IMPACT,
    reviewerDecisions: SAMPLE_REVIEWER_DECISIONS,
    orgCalibration: SAMPLE_ORG_CALIBRATION,
    feedbackAdequacy: SAMPLE_FEEDBACK_ADEQUACY,
    referenceClassForecast: SAMPLE_REFERENCE_CLASS_FORECAST,
    validityClassification: SAMPLE_VALIDITY_CLASSIFICATION,
    dataLifecycle: SAMPLE_DATA_LIFECYCLE,
    clientSafe: undefined,
    schemaVersion: 2,
    generatedAt: specimenDate,
    meta: {
      filename: SAMPLE_FILENAME,
      overallScore: 64,
      noiseScore: 22,
      summary: SAMPLE_SUMMARY,
      metaVerdict:
        'Proceed only after independent reference-class forecast + reviewer sign-off on the break-even assumption. Not board-ready as drafted.',
      biasCount: SAMPLE_CITATIONS.length,
      topMitigation:
        'Commission an independent reference-class forecast against eight to twelve comparable European DACH expansions before the committee vote. Require the forecaster to submit base-rate break-even distributions alongside point estimates so the committee sees the range, not a single number.',
      topMitigationFor: 'Overconfidence Bias',
    },
  };
}
