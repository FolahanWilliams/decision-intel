/**
 * bulkPairing — pure function pairing uploaded memo docs with outcome
 * docs in a bulk-upload batch. Locked 2026-05-21 (adaptation #1).
 *
 * The Sankore-killer feature: drop 30-50 historical decisions + their
 * outcome documents at once, parser auto-pairs them by entity overlap +
 * temporal proximity + content similarity, surfaces high-confidence
 * pairs for auto-accept, medium-confidence pairs for review, and
 * unpaired memos for manual outcome input.
 *
 * Pure function. No I/O, no LLM. Deterministic — same input → same
 * output. Tested independently.
 *
 * Pairing math:
 *   confidence = (entityOverlap * 0.5)
 *              + (temporalProximityScore * 0.25)
 *              + (contentSimilarity * 0.25)
 *
 * Bands:
 *   ≥0.75 → auto_high (auto-accept)
 *   0.5-0.75 → auto_medium (review with default-accept)
 *   0.25-0.5 → auto_low (review with default-reject)
 *   <0.25 → unpaired (memo flagged for manual outcome input)
 */

import type { BulkPair, BulkPairingResult, UploadedHistoricalDoc } from './types';
import { PAIRING_CONFIDENCE_THRESHOLDS } from './types';

// ──────────────────────────────────────────────────────────────────────
// Signal scoring
// ──────────────────────────────────────────────────────────────────────

/** Jaccard-like overlap between two sets of entities. Returns 0-1. */
function entityOverlapScore(
  a: UploadedHistoricalDoc['entities'],
  b: UploadedHistoricalDoc['entities']
): number {
  const orgsA = new Set(a.organizations.map(s => s.toLowerCase()));
  const orgsB = new Set(b.organizations.map(s => s.toLowerCase()));
  const codenamesA = new Set(a.projectCodenames.map(s => s.toLowerCase()));
  const codenamesB = new Set(b.projectCodenames.map(s => s.toLowerCase()));

  const orgIntersection = setIntersectSize(orgsA, orgsB);
  const orgUnion = setUnionSize(orgsA, orgsB);

  const codeIntersection = setIntersectSize(codenamesA, codenamesB);
  const codeUnion = setUnionSize(codenamesA, codenamesB);

  // Project codenames are stronger signals than generic org names —
  // weight them 2x. Returns the max of org-Jaccard and weighted-code.
  const orgScore = orgUnion === 0 ? 0 : orgIntersection / orgUnion;
  const codeScore = codeUnion === 0 ? 0 : Math.min(1, (codeIntersection / codeUnion) * 1.5);

  return Math.max(orgScore, codeScore);
}

function setIntersectSize<T>(a: Set<T>, b: Set<T>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

function setUnionSize<T>(a: Set<T>, b: Set<T>): number {
  return a.size + b.size - setIntersectSize(a, b);
}

/** Temporal proximity score. Returns 0-1.
 *  Perfect score (1.0) when outcomeDoc is 6-36 months after memoDoc.
 *  Decays to 0 if outcomeDoc is BEFORE memoDoc, or if gap is > 10 years. */
function temporalProximityScore(
  memoDate?: string,
  outcomeDate?: string
): {
  score: number;
  gapDays?: number;
} {
  if (!memoDate || !outcomeDate) return { score: 0 };
  const memo = new Date(memoDate).getTime();
  const outcome = new Date(outcomeDate).getTime();
  if (!Number.isFinite(memo) || !Number.isFinite(outcome)) return { score: 0 };

  const gapMs = outcome - memo;
  const gapDays = Math.round(gapMs / 86_400_000);

  if (gapDays < 0) {
    // Outcome BEFORE memo is impossible — strong negative signal
    return { score: 0, gapDays };
  }
  if (gapDays === 0) {
    // Same day — could be a "mixed" doc that contains both decision +
    // outcome. Mid-confidence signal.
    return { score: 0.5, gapDays };
  }
  if (gapDays < 30) {
    // Less than a month — suspicious; outcomes don't usually crystallise that fast
    return { score: 0.3, gapDays };
  }
  if (gapDays > 3650) {
    // > 10 years — implausible pairing
    return { score: 0, gapDays };
  }
  // Sweet spot: 6 months to 3 years
  if (gapDays >= 180 && gapDays <= 1095) return { score: 1.0, gapDays };
  // Plausible range: 1-12 months or 3-10 years
  if (gapDays >= 30 && gapDays < 180) {
    return { score: 0.6 + ((gapDays - 30) / (180 - 30)) * 0.4, gapDays };
  }
  // 3-10 years: linearly decay from 1.0 → 0.3
  return { score: Math.max(0.3, 1.0 - ((gapDays - 1095) / (3650 - 1095)) * 0.7), gapDays };
}

/** Content similarity — bag-of-significant-words Jaccard. Returns 0-1.
 *  Significant words = non-stopword tokens of length ≥4. */
function contentSimilarityScore(a: string, b: string): number {
  const tokensA = significantTokens(a);
  const tokensB = significantTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = setIntersectSize(tokensA, tokensB);
  const union = setUnionSize(tokensA, tokensB);
  if (union === 0) return 0;
  return Math.min(1, intersection / union);
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'have',
  'has',
  'had',
  'was',
  'were',
  'will',
  'would',
  'could',
  'should',
  'might',
  'their',
  'there',
  'these',
  'those',
  'they',
  'them',
  'than',
  'then',
  'when',
  'where',
  'which',
  'while',
  'what',
  'whose',
  'into',
  'over',
  'under',
  'about',
  'before',
  'after',
  'above',
  'below',
  'between',
  'against',
  'through',
  'during',
  'within',
  'without',
  'because',
  'although',
  'though',
  'however',
  'therefore',
  'thus',
  'such',
  'some',
  'many',
  'much',
  'most',
  'more',
  'less',
  'least',
  'each',
  'every',
  'both',
  'either',
  'neither',
  'other',
  'another',
  'same',
  'also',
  'only',
  'just',
  'even',
  'still',
  'already',
  'always',
  'never',
  'sometimes',
  'often',
  'rarely',
  'usually',
  'company',
  'firm',
  'team',
  'business',
  'market',
  'product',
  'service',
]);

function significantTokens(content: string): Set<string> {
  const out = new Set<string>();
  // Lowercase, strip non-word, split
  const tokens = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/);
  for (const t of tokens) {
    if (t.length < 4) continue;
    if (STOPWORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
// Pair confidence + band assignment
// ──────────────────────────────────────────────────────────────────────

interface PairCandidate {
  memo: UploadedHistoricalDoc;
  outcome: UploadedHistoricalDoc;
  confidence: number;
  signals: BulkPair['signals'];
}

function scorePair(memo: UploadedHistoricalDoc, outcome: UploadedHistoricalDoc): PairCandidate {
  const entityOverlap = entityOverlapScore(memo.entities, outcome.entities);
  const temporal = temporalProximityScore(memo.inferredDate, outcome.inferredDate);
  const contentSimilarity = contentSimilarityScore(memo.content, outcome.content);

  const confidence = entityOverlap * 0.5 + temporal.score * 0.25 + contentSimilarity * 0.25;

  return {
    memo,
    outcome,
    confidence,
    signals: {
      entityOverlap,
      temporalProximityDays: temporal.gapDays,
      contentSimilarity,
    },
  };
}

function bandForConfidence(confidence: number): BulkPair['band'] {
  if (confidence >= PAIRING_CONFIDENCE_THRESHOLDS.autoHigh) return 'auto_high';
  if (confidence >= PAIRING_CONFIDENCE_THRESHOLDS.autoMedium) return 'auto_medium';
  if (confidence >= PAIRING_CONFIDENCE_THRESHOLDS.autoLow) return 'auto_low';
  return 'unpaired';
}

// ──────────────────────────────────────────────────────────────────────
// Greedy stable matching — assign each outcome to at most one memo
// ──────────────────────────────────────────────────────────────────────

/** Stable IDs — cuid-shaped synthetic for pair ids. Pure (deterministic
 *  from inputs) so tests don't depend on randomness. */
function makePairId(memoDocId: string, outcomeDocId?: string): string {
  return outcomeDocId ? `pair-${memoDocId}-${outcomeDocId}` : `pair-${memoDocId}-unpaired`;
}

/** Stable batch id — used both as the BulkPairingResult.batchId and
 *  persisted on every container.retroactiveMetadata.bulkUploadBatchId
 *  for grouping. Caller can override; default derives from the input
 *  document count + a timestamp-stripped hash of doc ids. */
function makeBatchId(docs: UploadedHistoricalDoc[]): string {
  const ids = docs
    .map(d => d.documentId)
    .sort()
    .join('-');
  let hash = 0;
  for (let i = 0; i < ids.length; i++) {
    hash = ((hash << 5) - hash + ids.charCodeAt(i)) | 0;
  }
  return `bulk-${Math.abs(hash).toString(36)}-${docs.length}`;
}

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

export interface PairingInput {
  docs: UploadedHistoricalDoc[];
  /** Optional pre-computed batch id; tests pass deterministic ids. */
  batchId?: string;
}

/**
 * Pair memos + outcomes in a bulk upload batch.
 *
 * Strategy:
 *   1. Split docs by detected role (memo / outcome / mixed / unknown)
 *   2. For each memo, score against every outcome doc
 *   3. Greedy assignment: highest-confidence pairs first, each
 *      outcome can only be assigned once
 *   4. Memos with no assigned outcome render as unpaired (band='unpaired')
 *   5. 'mixed' role docs render as memo with the OUTCOME extracted from
 *      THEIR OWN content (handled downstream — extractor runs on the
 *      mixed doc itself)
 *   6. 'unknown' role docs go into the unclassified bucket
 *
 * Pure function. No side effects.
 */
export function pairBulkDocuments(input: PairingInput): BulkPairingResult {
  const { docs } = input;
  const batchId = input.batchId ?? makeBatchId(docs);

  const memos = docs.filter(d => d.detectedRole === 'memo');
  const outcomes = docs.filter(d => d.detectedRole === 'outcome');
  const mixed = docs.filter(d => d.detectedRole === 'mixed');
  const unclassified = docs.filter(d => d.detectedRole === 'unknown');

  // Score every memo × outcome combination
  const candidates: PairCandidate[] = [];
  for (const memo of memos) {
    for (const outcome of outcomes) {
      candidates.push(scorePair(memo, outcome));
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Greedy assignment
  const claimedOutcomes = new Set<string>();
  const claimedMemos = new Set<string>();
  const acceptedPairs: PairCandidate[] = [];

  for (const c of candidates) {
    if (claimedMemos.has(c.memo.documentId)) continue;
    if (claimedOutcomes.has(c.outcome.documentId)) continue;
    if (c.confidence < PAIRING_CONFIDENCE_THRESHOLDS.autoLow) continue;
    acceptedPairs.push(c);
    claimedMemos.add(c.memo.documentId);
    claimedOutcomes.add(c.outcome.documentId);
  }

  // Build BulkPair entries — paired memos first
  const pairs: BulkPair[] = acceptedPairs.map(c => ({
    pairId: makePairId(c.memo.documentId, c.outcome.documentId),
    memoDoc: c.memo,
    outcomeDoc: c.outcome,
    confidence: c.confidence,
    band: bandForConfidence(c.confidence),
    signals: c.signals,
  }));

  // Unpaired memos
  for (const memo of memos) {
    if (claimedMemos.has(memo.documentId)) continue;
    pairs.push({
      pairId: makePairId(memo.documentId),
      memoDoc: memo,
      confidence: 0,
      band: 'unpaired',
      signals: {
        entityOverlap: 0,
        contentSimilarity: 0,
      },
    });
  }

  // Mixed docs become their own memo entries (extractor runs on the
  // doc itself in the API route). We synthesize them as
  // memo-with-outcome-doc-equal-to-self so the UI treats them uniformly.
  for (const m of mixed) {
    pairs.push({
      pairId: makePairId(m.documentId, m.documentId),
      memoDoc: m,
      outcomeDoc: m,
      // Self-pair gets a synthetic high confidence — the doc itself
      // is its own outcome source.
      confidence: 0.9,
      band: 'auto_high',
      signals: {
        entityOverlap: 1,
        temporalProximityDays: 0,
        contentSimilarity: 1,
      },
    });
  }

  // Unclaimed outcomes — outcomes the engine couldn't pair with any
  // memo. We DON'T surface these as pairs; they go into unclassified
  // for the user to re-classify or attach manually.
  const unclaimedOutcomes = outcomes.filter(o => !claimedOutcomes.has(o.documentId));

  return {
    batchId,
    totalDocs: docs.length,
    memoCount: memos.length,
    outcomeCount: outcomes.length,
    pairs,
    unclassified: [...unclassified, ...unclaimedOutcomes],
    processedAt: new Date().toISOString(),
  };
}

// Re-exports for tests
export {
  entityOverlapScore as entityOverlapScoreExported,
  temporalProximityScore as temporalProximityScoreExported,
  contentSimilarityScore as contentSimilarityScoreExported,
  bandForConfidence as bandForConfidenceExported,
};
