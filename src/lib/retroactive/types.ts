/**
 * Retroactive audit mode — types SSOT.
 * Locked 2026-05-21 (adaptation #1).
 *
 * The retroactive flow runs DI against historical CLOSED decisions
 * where the outcome is already known. Three structural elements:
 *
 *   1. RetroactiveMetadata — per-container metadata (when the
 *      decision was made, when the outcome was known, provenance,
 *      bulk batch).
 *   2. ExtractedOutcomeDraft — what the parser pulls out of a bulk
 *      document to pre-fill a DecisionContainerOutcome.
 *   3. BulkPairingResult — the paired memo+outcome batch the bulk
 *      uploader produces for the user to review.
 *
 * Pure types. No I/O, no Prisma. Consumed by outcomeExtractor,
 * bulkPairing, the API routes, and the UI surfaces.
 */

// ──────────────────────────────────────────────────────────────────────
// 1. Metadata persisted on the container
// ──────────────────────────────────────────────────────────────────────

export interface RetroactiveMetadata {
  /** ISO date — when the original decision was committed. */
  decidedAt: string;
  /** ISO date — when the outcome became known (or null if still ongoing
   *  but historically interesting enough to backfill). */
  outcomeKnownAt: string;
  /** Free-text source of the historical record (e.g.
   *  "Sankore IC archive 2018"). Surfaces on the DPR cover for
   *  provenance. */
  sourceProvenance?: string;
  /** Groups bulk-uploaded entries — set by the bulk endpoint. */
  bulkUploadBatchId?: string;
  /** 0-1 confidence the pairing engine assigned when memo + outcome
   *  were auto-paired. Null when the user paired manually. */
  pairingConfidence?: number;
  /** How the pairing happened — useful for telemetry + audit-trail
   *  honesty (the DPR can surface "auto-paired at 0.78 confidence"). */
  pairingMethod?: 'manual' | 'auto_high' | 'auto_medium' | 'auto_low';
}

// ──────────────────────────────────────────────────────────────────────
// 2. Outcome extraction — what the parser pulls from a document
// ──────────────────────────────────────────────────────────────────────

/** Canonical outcome direction. Maps onto
 *  DecisionContainerOutcome.outcomeSummary verdict semantics. */
export type OutcomeDirection = 'positive' | 'negative' | 'mixed' | 'too_early';

/** Maps onto the existing outcome enum on
 *  DecisionContainerOutcome (success / failure / mixed / too_early). */
export type OutcomeVerdict =
  | 'value_created'
  | 'value_destroyed'
  | 'value_neutral'
  | 'too_early_to_tell'
  | 'unknown';

export interface ExtractedOutcomeDraft {
  /** Which document the outcome was extracted from (id). */
  sourceDocumentId: string;
  /** Verbatim quote(s) from the document supporting the outcome
   *  classification. NEVER fabricated — always a literal substring of
   *  the source content. */
  evidenceQuotes: string[];
  /** Inferred direction. */
  direction: OutcomeDirection;
  /** Inferred verdict mapping into DecisionContainerOutcome.outcome. */
  verdict: OutcomeVerdict;
  /** Per-finding plain-language narrative the user sees + can edit. */
  draftNarrative: string;
  /** Optional structured metrics extracted: dollar amounts, IRR,
   *  MOIC, IRR vs target, time-to-exit, etc. Values are strings as
   *  parsed (the user confirms + types narrow them on save). */
  draftMetrics: Array<{
    label: string;
    value: string;
    /** Verbatim source quote — provenance. */
    sourceQuote: string;
  }>;
  /** Confidence 0-1 in the extraction itself. Low confidence triggers
   *  the "needs review" UI badge. */
  extractionConfidence: number;
  /** Which tier produced this draft. Determines fallback behaviour
   *  if the LLM tier fails. */
  extractionTier: 'regex' | 'llm' | 'fallback';
  /** When this draft was extracted (ISO). */
  extractedAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// 3. Bulk pairing — memo + outcome pairs produced by the bulk uploader
// ──────────────────────────────────────────────────────────────────────

export interface UploadedHistoricalDoc {
  documentId: string;
  filename: string;
  /** Plain-text content (post-redaction + post-parse). */
  content: string;
  /** ISO date inferred from the document (filename + content
   *  heuristics). Used for temporal-proximity pairing. */
  inferredDate?: string;
  /** Auto-detected document role. */
  detectedRole: 'memo' | 'outcome' | 'mixed' | 'unknown';
  /** Confidence in the role detection 0-1. */
  roleConfidence: number;
  /** Named entities extracted (company names, project codenames,
   *  monetary amounts). Used for entity-overlap pairing. */
  entities: {
    organizations: string[];
    amounts: string[];
    projectCodenames: string[];
  };
}

export interface BulkPair {
  /** Stable id for the pair — UUID. */
  pairId: string;
  /** The decision-document — what was reasoned about. */
  memoDoc: UploadedHistoricalDoc;
  /** Optional outcome-document — what actually happened. May be null
   *  if no outcome doc was uploaded (user fills in manually). */
  outcomeDoc?: UploadedHistoricalDoc;
  /** Optional extracted outcome draft (when outcomeDoc present). */
  outcomeDraft?: ExtractedOutcomeDraft;
  /** Pairing confidence 0-1. */
  confidence: number;
  /** Confidence band — drives UI affordance (auto-accept vs review
   *  vs flagged-as-unpaired). */
  band: 'auto_high' | 'auto_medium' | 'auto_low' | 'unpaired';
  /** Signals that drove the pairing — surfaced in the UI so the user
   *  can verify. */
  signals: {
    entityOverlap: number; // 0-1
    temporalProximityDays?: number;
    contentSimilarity: number; // 0-1
  };
}

export interface BulkPairingResult {
  /** Stable batch id — persisted on every container created from this
   *  bulk in `retroactiveMetadata.bulkUploadBatchId`. */
  batchId: string;
  /** Total documents uploaded in this batch. */
  totalDocs: number;
  /** Auto-detected memos. */
  memoCount: number;
  /** Auto-detected outcomes. */
  outcomeCount: number;
  /** Paired entries (one row per memo, with optional outcome). */
  pairs: BulkPair[];
  /** Documents that didn't fit either side — surfaced as a separate
   *  list so the user can re-classify. */
  unclassified: UploadedHistoricalDoc[];
  /** When the bulk was processed (ISO). */
  processedAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// 4. Confidence thresholds — pure constants, shared across tiers
// ──────────────────────────────────────────────────────────────────────

export const PAIRING_CONFIDENCE_THRESHOLDS = {
  /** ≥0.75 → auto-accept; user can still review. */
  autoHigh: 0.75,
  /** 0.5-0.75 → flagged for review with default-yes. */
  autoMedium: 0.5,
  /** 0.25-0.5 → flagged for review with default-no. */
  autoLow: 0.25,
} as const;

export const OUTCOME_EXTRACTION_CONFIDENCE_THRESHOLDS = {
  /** ≥0.7 → render extracted outcome inline, "looks confident" affordance. */
  high: 0.7,
  /** 0.4-0.7 → render with "review carefully" badge. */
  medium: 0.4,
  /** <0.4 → render with "needs verification" warning. */
  low: 0.4,
} as const;
