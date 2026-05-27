/**
 * PMI outcome inference (locked 2026-05-10 per PMI Path B).
 *
 * Pure functions that aggregate observed PMI signals into an outcome
 * direction + summary. Used by:
 *   - the Outcome Gate / outcome-inference pipeline to factor PMI ground
 *     truth into the per-org Brier calibration
 *   - the container detail page's "Did the deal deliver?" header chip
 *   - the DPR cover's post-close audit-loop closure section
 *
 * Architecture rule: PMI signals are the TARGET of the audit, not a new
 * product domain. This inference module reads the existing pmiSignals
 * JSON blob on DecisionContainerOutcome and emits a direction —
 * `positive` / `negative` / `mixed` / `too_early`. Per paper Ch 11:
 * automatic + rule-based comparison so the ex-post review doesn't
 * devolve into rationalisation theatre.
 *
 * Stays a pure function — no I/O. Callers pass the pmiSignals blob in;
 * we return the aggregation. Same shape as classifyOutcomeDirection
 * elsewhere in the codebase so consumers can switch between sources.
 */

import type { PmiSignal, PmiSignalsBlob } from '@/app/api/decisions/[id]/pmi-signals/helpers';

// Re-export the types for downstream consumers who don't want to depend
// on the route module directly.
export type { PmiSignal, PmiSignalsBlob };

export type PmiOutcomeDirection = 'positive' | 'negative' | 'mixed' | 'too_early';

export interface PmiOutcomeInference {
  direction: PmiOutcomeDirection;
  /** 0-1 confidence — driven by (a) observation coverage and (b) the
   *  consistency of the observed signals' resolution band. */
  confidence: number;
  meanBrier: number;
  observed: {
    hits: number;
    partials: number;
    misses: number;
    unmeasured: number;
  };
  /** Human-readable single-line summary (≤140 chars) for header chips. */
  summary: string;
}

/**
 * Aggregate PMI signals into an outcome direction. Decision rules
 * (locked):
 *   - too_early: < 40% of tracked signals have been observed
 *   - positive: ≥ 60% of observed signals resolved 'hit'
 *   - negative: ≥ 40% of observed signals resolved 'miss'
 *   - mixed: anything else (signals are landing but trajectory unclear)
 */
export function inferOutcomeFromPmiSignals(blob: PmiSignalsBlob | null): PmiOutcomeInference {
  if (!blob || blob.signals.length === 0) {
    return {
      direction: 'too_early',
      confidence: 0,
      meanBrier: 0,
      observed: { hits: 0, partials: 0, misses: 0, unmeasured: 0 },
      summary: 'No PMI signals tracked yet.',
    };
  }

  const total = blob.signals.length;
  const measured: PmiSignal[] = blob.signals.filter(s => s.observedValue !== undefined);
  const measuredCount = measured.length;
  const coverage = measuredCount / total;

  const hits = measured.filter(s => s.resolution === 'hit').length;
  const partials = measured.filter(s => s.resolution === 'partial').length;
  const misses = measured.filter(s => s.resolution === 'miss').length;
  const unmeasured = total - measuredCount;

  const meanBrier =
    measuredCount === 0
      ? 0
      : Math.round(
          (measured.reduce((acc, s) => acc + (s.brierScore ?? 0), 0) / measuredCount) * 1000
        ) / 1000;

  let direction: PmiOutcomeDirection;
  if (coverage < 0.4) {
    direction = 'too_early';
  } else {
    const hitRate = hits / measuredCount;
    const missRate = misses / measuredCount;
    if (hitRate >= 0.6) {
      direction = 'positive';
    } else if (missRate >= 0.4) {
      direction = 'negative';
    } else {
      direction = 'mixed';
    }
  }

  // Confidence: coverage × consistency. High coverage of mostly-same-resolution
  // signals is highest confidence; sparse coverage or oscillating resolutions
  // lower it.
  const dominantBand = Math.max(hits, partials, misses);
  const consistency = measuredCount === 0 ? 0 : dominantBand / measuredCount;
  const confidence = Math.round(coverage * consistency * 100) / 100;

  // Build summary line.
  let summary: string;
  if (direction === 'too_early') {
    summary = `Too early — ${measuredCount}/${total} signals observed (need ≥40% coverage).`;
  } else if (direction === 'positive') {
    summary = `Delivering as promised — ${hits}/${measuredCount} signals hit (Brier ${meanBrier.toFixed(2)}).`;
  } else if (direction === 'negative') {
    summary = `Missing forecast — ${misses}/${measuredCount} signals missed (Brier ${meanBrier.toFixed(2)}).`;
  } else {
    summary = `Mixed — ${hits} hit / ${partials} partial / ${misses} miss (Brier ${meanBrier.toFixed(2)}).`;
  }

  return {
    direction,
    confidence,
    meanBrier,
    observed: { hits, partials, misses, unmeasured },
    summary,
  };
}

/**
 * Map the PMI-derived direction onto the DecisionContainerOutcome shape
 * for the `acquisition` mode (synergy_realisation outcome shape). Used by
 * the outcome-inference draft pipeline so when PMI signals exist, the
 * draft outcome's `verdict` field is pre-populated.
 *
 * Mapping (per acquisition outcomeShape.fields.verdict enum):
 *   positive  → 'value_created'
 *   negative  → 'value_destroyed'
 *   mixed     → 'value_neutral'
 *   too_early → 'too_early_to_tell'
 */
export function pmiDirectionToAcquisitionVerdict(
  direction: PmiOutcomeDirection
): 'value_created' | 'value_destroyed' | 'value_neutral' | 'too_early_to_tell' {
  switch (direction) {
    case 'positive':
      return 'value_created';
    case 'negative':
      return 'value_destroyed';
    case 'mixed':
      return 'value_neutral';
    case 'too_early':
      return 'too_early_to_tell';
  }
}
