/**
 * Deal cross-reference helpers — shared across the deal page +
 * IcReadinessGate (and any future surface that reads a cross-reference
 * run's findings shape).
 *
 * The legacy on-disk shape was a bare `findings: DealCrossReferenceFinding[]`;
 * the 04-25 refactor introduced an optional wrapper
 * `findings: { findings, summary }` so the cross-reference agent could
 * carry per-run summary metadata. Both shapes still appear in
 * production rows depending on when the run was persisted, so callers
 * normalise via this helper rather than each one re-implementing the
 * conditional unwrap.
 *
 * Drift-class bug rule (CLAUDE.md 2026-04-27): every consumer imports
 * from this single source so a future shape change ripples in one
 * commit instead of N silent forks.
 */

import type { DealCrossReferenceFinding, DealCrossReferenceRun } from '@/types/deals';

/**
 * Normalises a stored DealCrossReferenceRun (or its raw `findings`
 * field, which may itself be the wrapped or bare shape) into a flat
 * `DealCrossReferenceFinding[]`. Returns an empty array on null /
 * malformed input — never throws.
 */
export function extractCrossReferenceFindings(
  run: DealCrossReferenceRun | null | undefined
): DealCrossReferenceFinding[] {
  if (!run || !run.findings) return [];
  if (Array.isArray(run.findings)) {
    return run.findings as DealCrossReferenceFinding[];
  }
  const wrapped = run.findings as { findings?: unknown };
  if (Array.isArray(wrapped.findings)) {
    return wrapped.findings as DealCrossReferenceFinding[];
  }
  return [];
}
