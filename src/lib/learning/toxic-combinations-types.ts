/**
 * Pure type definitions for toxic-combinations detection.
 *
 * Extracted so the named-pattern catalogue (named-patterns.ts) and any
 * other client-bundled consumers can reference these types without
 * pulling in the Prisma + detection-engine module that owns the runtime
 * implementation. Locked 2026-05-09 evening alongside the named-patterns
 * split.
 */

export interface ContextFactors {
  monetaryStakes: 'unknown' | 'low' | 'medium' | 'high' | 'very_high';
  dissentAbsent: boolean;
  timePressure: boolean;
  unanimousConsensus: boolean;
  participantCount: number;
  /** From BlindPrior — narrow spread = anchoring risk. */
  confidenceSpread: number | null;
  /** Whether the process actively encouraged dissent (from decision room data). */
  dissentEncouraged: boolean;
  /** Whether external advisors were involved. */
  externalAdvisors: boolean;
  /** Whether an iterative decision process was used. */
  iterativeProcess: boolean;
}
