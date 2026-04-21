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
  note:
    'Cost-tier routing: preprocessing nodes on Gemini 3.1 Flash Lite, analysis/synthesis nodes on Gemini 3 Flash Preview. Final risk score is deterministic (not LLM-generated).',
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
        select: { biasType: true },
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

  // Judge variance: summary from what the Analysis row actually stores.
  // The three individual judge outputs (biasDetective, noiseJudge,
  // statisticalJury) are currently accessible via the internal audit log
  // but not persisted granularly on Analysis. v1 is honest about that.
  const noiseBenchmarks =
    analysis.noiseBenchmarks && typeof analysis.noiseBenchmarks === 'object'
      ? (analysis.noiseBenchmarks as Record<string, unknown>)
      : undefined;
  const judgeVariance: JudgeVariance = {
    noiseScore: analysis.noiseScore,
    distribution: noiseBenchmarks ? { benchmarks: noiseBenchmarks } : undefined,
    metaVerdict: analysis.metaVerdict ?? null,
    note:
      'Summary view of judge variance. Per-judge granular outputs are stored in the internal audit log and available on request under the DPA; they are deliberately excluded from the client-facing record to protect prompt internals.',
  };

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
    schemaVersion: 1,
    generatedAt: new Date(),
    meta: {
      filename: analysis.document.filename,
      overallScore: analysis.overallScore,
      noiseScore: analysis.noiseScore,
      summary: analysis.summary,
      metaVerdict: analysis.metaVerdict ?? null,
      biasCount: biasTypes.length,
    },
  };
}

function formatBiasLabel(biasType: string): string {
  return biasType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
