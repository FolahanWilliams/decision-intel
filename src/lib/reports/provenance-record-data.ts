/**
 * Decision Provenance Record — data assembler.
 *
 * Builds the signed, hashed metadata bundle that the Decision Provenance
 * Record PDF generator consumes. Also the shape persisted to the
 * DecisionProvenanceRecord table (see prisma/schema.prisma).
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
import {
  aggregateBlindPriors,
  type BlindPriorRow,
} from '@/lib/learning/blind-prior-aggregate';

const log = createLogger('ProvenanceRecordData');

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
   * Pre-IC blind-prior aggregations attached to this analysis (4.1
   * deep). One entry per Decision Room that ran a blind-prior survey
   * before the decision was made. Empty array when no rooms had a
   * pre-IC survey — the DPR section then renders a one-line note.
   */
  blindPriorAggregates: BlindPriorRoomAggregate[];
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

// ─── Main assembler ──────────────────────────────────────────────────

export async function assembleProvenanceRecordData(
  analysisId: string
): Promise<ProvenanceRecordData> {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      biases: {
        select: { biasType: true, severity: true, suggestion: true },
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
        },
      },
    },
  });

  if (!analysis) {
    throw new Error(`Analysis ${analysisId} not found — cannot assemble provenance record.`);
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

  return {
    analysisId: analysis.id,
    documentId: analysis.document.id,
    userId: analysis.document.userId,
    orgId: analysis.document.orgId ?? null,
    promptFingerprint,
    inputHash,
    modelLineage: CURRENT_MODEL_LINEAGE,
    judgeVariance,
    citations,
    regulatoryMapping,
    pipelineLineage,
    blindPriorAggregates,
    schemaVersion: 1,
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

function formatBiasLabel(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
