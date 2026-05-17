/**
 * Defensibility Vector 1 — forced-at-vote 90-day operational-proxy
 * calibration loop (locked 2026-05-17).
 *
 * Pure SSOT for "must this decision carry a falsifiable 90-day
 * operational proxy before its outcome can be logged, and does it?"
 * Shared VERBATIM by the container outcome route (server hard-gate)
 * and the decision-detail client guard — never two implementations
 * that drift. Mirrors the V2 premortem-defence.ts pattern + the
 * M-7 / M-3 pure-function-first discipline. No I/O.
 *
 * Why this is the company, not the wrapper: a prompt wrapper produces
 * an opinion. It cannot make an executive return at day-90 to admit
 * the synergy timeline was a delusion. Forcing a falsifiable proxy at
 * the vote moment + autonomously surfacing it at horizon is the
 * persistent embedded antagonism a fast-follower cannot reconstruct —
 * and it collapses the calibration loop from terminal-IRR (5-10yr) to
 * per-proxy 30-90d, which is what makes the Vohra HXC PMF signal
 * testable inside Phase 1.
 *
 * Founder-scoped 2026-05-17: the gate applies to ALL container kinds
 * (investment | acquisition | strategic) — every wedge persona's
 * embedded loop must be covered for the PMF signal to be honest.
 *
 * Proxies are captured via the existing PriorsCaptureCard /
 * /api/decisions/[id]/priors microPredictions[] mechanism (locked
 * 2026-05-10). This module adds the GATE + the day-90 RESOLUTION /
 * Brier-scoring layer on top of that existing shape — no new Prisma
 * column, no migration; `brierScore` is an additive optional field
 * on the existing microPrediction JSON entry.
 */

export type ProxyResolution = 'true' | 'false' | 'partial';

/** One entry of `DecisionContainer.priors.microPredictions[]`
 *  (locked 2026-05-10) + the additive `brierScore` this layer stamps
 *  at resolution. */
export interface OperationalProxy {
  prediction: string;
  horizonDays: number;
  confidence: number;
  resolvedAt?: string;
  resolution?: ProxyResolution;
  /** (confidence − observed)² ∈ [0,1], stamped at resolution. */
  brierScore?: number;
}

export interface ParsedPriorsProxies {
  microPredictions: OperationalProxy[];
  /** ISO string the priors blob was first captured at, or null. */
  capturedAt: string | null;
}

const RESOLUTIONS: ReadonlySet<string> = new Set(['true', 'false', 'partial']);

/** A proxy is only "falsifiable + 90-day-class" if its prediction is
 *  substantive (not a stub) and its horizon is a real ≤90-day window.
 *  Mirrors V2's MIN_DEFENCE_CHARS rationale. */
export const MIN_PROXY_PREDICTION_CHARS = 8;
/** The lock is "90-day operational proxies" — a ≤90-day horizon is the
 *  90-day class; a 2027 target date is NOT a 90-day commitment. */
export const MAX_FALSIFIABLE_HORIZON_DAYS = 90;

const DAY_MS = 86_400_000;

// ─── Pure: defensive parse ───────────────────────────────────────────────────

/**
 * Defensive parser for the `DecisionContainer.priors` JSON column,
 * narrowed to what the gate + cron need. Returns null on anything
 * malformed — a corrupt blob must never throw inside the outcome path.
 * Mirrors parsePremortemDefence.
 */
export function parsePriorsForProxies(raw: unknown): ParsedPriorsProxies | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.microPredictions)) return null;

  const microPredictions: OperationalProxy[] = [];
  for (const m of obj.microPredictions) {
    if (!m || typeof m !== 'object') continue;
    const rec = m as Record<string, unknown>;
    if (typeof rec.prediction !== 'string') continue;
    if (typeof rec.horizonDays !== 'number' || !Number.isFinite(rec.horizonDays)) continue;
    if (typeof rec.confidence !== 'number' || !Number.isFinite(rec.confidence)) continue;
    const entry: OperationalProxy = {
      prediction: rec.prediction,
      horizonDays: rec.horizonDays,
      confidence: rec.confidence,
    };
    if (typeof rec.resolvedAt === 'string') entry.resolvedAt = rec.resolvedAt;
    if (typeof rec.resolution === 'string' && RESOLUTIONS.has(rec.resolution)) {
      entry.resolution = rec.resolution as ProxyResolution;
    }
    if (typeof rec.brierScore === 'number' && Number.isFinite(rec.brierScore)) {
      entry.brierScore = rec.brierScore;
    }
    microPredictions.push(entry);
  }

  return {
    microPredictions,
    capturedAt: typeof obj.capturedAt === 'string' ? obj.capturedAt : null,
  };
}

// ─── Pure: the gate ──────────────────────────────────────────────────────────

/** A proxy counts toward the gate when its prediction is substantive
 *  and its horizon is a real ≤90-day falsifiable window. */
export function isFalsifiable90DayProxy(p: OperationalProxy): boolean {
  return (
    p.prediction.trim().length >= MIN_PROXY_PREDICTION_CHARS &&
    p.horizonDays >= 1 &&
    p.horizonDays <= MAX_FALSIFIABLE_HORIZON_DAYS &&
    p.confidence >= 0 &&
    p.confidence <= 1
  );
}

export function hasFalsifiable90DayProxy(raw: unknown): boolean {
  const parsed = parsePriorsForProxies(raw);
  if (!parsed) return false;
  return parsed.microPredictions.some(isFalsifiable90DayProxy);
}

/**
 * Pure. The gate applies to ALL kinds (founder-scoped 2026-05-17) and
 * fires only once a real decision exists (≥1 analyzed doc) — it must
 * not block empty containers, exactly like V2's analyzed-docs guard.
 */
export function requiresOperationalProxyGate(input: { analyzedDocCount: number }): boolean {
  return input.analyzedDocCount > 0;
}

export interface OperationalProxyGateVerdict {
  allowed: boolean;
  reason?: string;
  code?: 'OPERATIONAL_PROXY_REQUIRED';
}

/**
 * Pure. The shared gate predicate: may an outcome be logged? Blocks
 * only when a proxy is REQUIRED (analyzed decision) and no falsifiable
 * ≤90-day proxy is on record. Empty containers always pass — Vector 1
 * must not regress the existing flow.
 */
export function checkOperationalProxyGate(input: {
  analyzedDocCount: number;
  priors: unknown;
}): OperationalProxyGateVerdict {
  if (!requiresOperationalProxyGate(input)) return { allowed: true };
  if (hasFalsifiable90DayProxy(input.priors)) return { allowed: true };
  return {
    allowed: false,
    code: 'OPERATIONAL_PROXY_REQUIRED',
    reason:
      'Log at least one falsifiable 90-day operational proxy (a CTO-retained / integration-hit / milestone-met prediction) before recording the outcome — the calibration loop only compounds if the proxy goes on the record at the vote, not after you know how it turned out.',
  };
}

// ─── Pure: day-90 resolution + Brier ─────────────────────────────────────────

/** ms timestamp the proxy comes due, or null if capturedAt is unusable. */
export function proxyDueAtMs(proxy: OperationalProxy, capturedAt: string | null): number | null {
  if (!capturedAt) return null;
  const base = Date.parse(capturedAt);
  if (!Number.isFinite(base)) return null;
  return base + proxy.horizonDays * DAY_MS;
}

export function isProxyDue(
  proxy: OperationalProxy,
  capturedAt: string | null,
  nowMs: number
): boolean {
  if (proxy.resolvedAt) return false;
  const due = proxyDueAtMs(proxy, capturedAt);
  return due !== null && due <= nowMs;
}

export function dueUnresolvedProxies(
  parsed: ParsedPriorsProxies,
  nowMs: number
): OperationalProxy[] {
  return parsed.microPredictions.filter(p => isProxyDue(p, parsed.capturedAt, nowMs));
}

/** Observed value for a resolution — true=1, false=0, partial=0.5. */
export function observedValue(resolution: ProxyResolution): number {
  return resolution === 'true' ? 1 : resolution === 'false' ? 0 : 0.5;
}

/** (confidence − observed)² clamped to [0,1] — mirrors the PMI M-3
 *  per-signal Brier shape verbatim. */
export function computeProxyBrier(confidence: number, resolution: ProxyResolution): number {
  const d = confidence - observedValue(resolution);
  const sq = d * d;
  return sq < 0 ? 0 : sq > 1 ? 1 : sq;
}

/**
 * Pure idempotent backfill: stamp brierScore on any proxy that has a
 * resolution but no score yet. Returns the (possibly new) array + a
 * `changed` flag so the cron only writes when something actually moved.
 */
export function scoreResolvedProxies(parsed: ParsedPriorsProxies): {
  changed: boolean;
  microPredictions: OperationalProxy[];
} {
  let changed = false;
  const microPredictions = parsed.microPredictions.map(p => {
    if (p.resolution && p.brierScore === undefined) {
      changed = true;
      return { ...p, brierScore: computeProxyBrier(p.confidence, p.resolution) };
    }
    return p;
  });
  return { changed, microPredictions };
}

/**
 * Pure. Resolve the proxy at `index`: stamp resolvedAt + resolution +
 * brierScore. Returns the new microPredictions array, or null when the
 * index is out of range or the proxy is already resolved (the route
 * then 400s rather than silently double-resolving).
 */
export function applyProxyResolution(
  parsed: ParsedPriorsProxies,
  index: number,
  resolution: ProxyResolution,
  nowMs: number
): OperationalProxy[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= parsed.microPredictions.length) {
    return null;
  }
  const target = parsed.microPredictions[index];
  if (target.resolvedAt) return null;
  const next = parsed.microPredictions.slice();
  next[index] = {
    ...target,
    resolvedAt: new Date(nowMs).toISOString(),
    resolution,
    brierScore: computeProxyBrier(target.confidence, resolution),
  };
  return next;
}
