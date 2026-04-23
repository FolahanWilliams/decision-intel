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
} from './provenance-record-data';
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
    'Concurred on three of four material flags; minority dissent on reference-class (preMortem flagged the 18-month break-even claim as optimistic; statisticalJury concurred only after base-rate pull).',
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

const SAMPLE_REGULATORY: RegulatoryEntry[] = [
  {
    biasType: 'confirmation_bias',
    aggregateRiskScore: 7.4,
    frameworks: [
      {
        id: 'eu_ai_act',
        name: 'EU AI Act',
        provisions: [
          'Article 14 — Human oversight',
          'Article 15 — Accuracy and record-keeping',
        ],
      },
      { id: 'basel_iii', name: 'Basel III · Pillar 2 ICAAP', provisions: ['Qualitative-decision documentation'] },
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
      { id: 'eu_ai_act', name: 'EU AI Act', provisions: ['Annex III — High-risk decision support'] },
    ],
  },
  {
    biasType: 'anchoring_bias',
    aggregateRiskScore: 5.8,
    frameworks: [
      { id: 'eu_ai_act', name: 'EU AI Act', provisions: ['Article 13 — Transparency to users'] },
      { id: 'gdpr', name: 'GDPR', provisions: ['Article 22 — Automated decision-making'] },
    ],
  },
  {
    biasType: 'sunk_cost_fallacy',
    aggregateRiskScore: 6.2,
    frameworks: [
      { id: 'sox_404', name: 'SOX §404', provisions: ['Internal-controls documentation'] },
    ],
  },
];

const SAMPLE_PIPELINE_LINEAGE: PipelineLineageEntry[] = PIPELINE_NODES.map(
  (node, i) => ({
    order: i + 1,
    nodeId: node.id,
    zone: node.zone,
    label: node.label,
    academicAnchor: node.academicAnchor,
  })
);

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
    schemaVersion: 1,
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
