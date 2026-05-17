/**
 * V2 — mandatory pre-mortem dissent gate (locked 2026-05-16).
 *
 * Pure SSOT for "must the sponsor have recorded a written pre-mortem
 * defence before this decision's outcome can be logged, and have they?"
 * Shared VERBATIM by the outcome route (server hard-gate) and the
 * decision-detail client guard — never two implementations that drift.
 * No I/O. Mirrors the M-7 ripple-detection / M-3 extract-from-memo
 * pure-function-first discipline.
 *
 * The rigor is the product. A wrapper produces an opinion; this makes
 * the sponsor formally answer the antagonist BEFORE the outcome is
 * logged, and that written exchange becomes part of the tamper-evident
 * human-oversight record (the DPR). Acquisition-mode only — that is
 * where the Deal-Fever pre-mortem fires.
 */

export type PremortemPattern = 'deal_fever' | 'winners_curse' | 'synergy_mirage';

export interface PremortemDefenceAnswer {
  pattern: PremortemPattern;
  /** The pre-mortem question, verbatim, so the DPR shows the exchange. */
  question: string;
  /** The sponsor's written answer. Must be non-empty to count. */
  writtenDefence: string;
}

export interface PremortemDefence {
  answers: PremortemDefenceAnswer[];
  answeredByUserId: string;
  /** ISO timestamp. */
  answeredAt: string;
}

const PATTERNS: ReadonlySet<string> = new Set(['deal_fever', 'winners_curse', 'synergy_mirage']);

/** Min characters for a written defence to count as a real answer —
 *  prevents "ok"/"." from satisfying the gate. */
export const MIN_DEFENCE_CHARS = 12;

/**
 * Pure. The gate only applies to acquisition-mode containers that have
 * at least one analyzed document — exactly the condition under which the
 * Deal-Fever pre-mortem surfaces. Everything else is exempt (the gate
 * must not block investment/strategic decisions or empty containers).
 */
export function requiresPremortemDefence(input: {
  kind: string;
  analyzedDocCount: number;
}): boolean {
  return input.kind === 'acquisition' && input.analyzedDocCount > 0;
}

/**
 * Defensive parser for the `DecisionContainer.premortemDefence` JSON
 * column. Returns null on anything malformed — a corrupt blob must
 * never throw inside the outcome path. Mirrors parseExtractionResponse.
 */
export function parsePremortemDefence(raw: unknown): PremortemDefence | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.answers)) return null;
  if (typeof obj.answeredByUserId !== 'string' || obj.answeredByUserId.length === 0) {
    return null;
  }
  if (typeof obj.answeredAt !== 'string') return null;

  const answers: PremortemDefenceAnswer[] = [];
  for (const a of obj.answers) {
    if (!a || typeof a !== 'object') continue;
    const rec = a as Record<string, unknown>;
    if (typeof rec.pattern !== 'string' || !PATTERNS.has(rec.pattern)) continue;
    if (typeof rec.question !== 'string' || rec.question.trim().length === 0) continue;
    if (typeof rec.writtenDefence !== 'string') continue;
    answers.push({
      pattern: rec.pattern as PremortemPattern,
      question: rec.question,
      writtenDefence: rec.writtenDefence,
    });
  }
  if (answers.length === 0) return null;
  return { answers, answeredByUserId: obj.answeredByUserId, answeredAt: obj.answeredAt };
}

/**
 * Pure. A defence is COMPLETE when it parses AND every recorded answer
 * carries a substantive written defence (≥ MIN_DEFENCE_CHARS trimmed).
 * Partial / stub answers do not satisfy the gate.
 */
export function isPremortemDefenceComplete(raw: unknown): boolean {
  const parsed = parsePremortemDefence(raw);
  if (!parsed) return false;
  return parsed.answers.every(a => a.writtenDefence.trim().length >= MIN_DEFENCE_CHARS);
}

export interface OutcomeGateVerdict {
  allowed: boolean;
  /** Procurement-grade reason, surfaced verbatim in the 400 + the
   *  client toast. Present only when blocked. */
  reason?: string;
  /** Machine code for the client to branch on. */
  code?: 'PREMORTEM_DEFENCE_REQUIRED';
}

/**
 * Pure. The shared gate predicate: may an outcome be logged for this
 * container? Blocks only when the pre-mortem defence is REQUIRED
 * (acquisition + analyzed) and not COMPLETE. Non-acquisition / empty
 * containers always pass — V2 must not regress the existing flow.
 */
export function checkPremortemDefenceGate(input: {
  kind: string;
  analyzedDocCount: number;
  premortemDefence: unknown;
}): OutcomeGateVerdict {
  if (!requiresPremortemDefence(input)) return { allowed: true };
  if (isPremortemDefenceComplete(input.premortemDefence)) return { allowed: true };
  return {
    allowed: false,
    code: 'PREMORTEM_DEFENCE_REQUIRED',
    reason:
      'Record your written defence to the Deal-Fever pre-mortem questions before logging the outcome — the rigor has to be on the record, not in your head.',
  };
}
