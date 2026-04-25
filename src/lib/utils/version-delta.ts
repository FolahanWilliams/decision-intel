/**
 * Cross-document version-delta helpers.
 *
 * Used by the VersionDeltaCard on the document-detail page to render a
 * "DQI 42 → 71 (+29), sunk_cost_bias resolved, anchoring_bias emerged"
 * summary when an Analysis was produced on a Document that's a new version
 * of an earlier one.
 *
 * Pure functions — no Prisma, no fetch. Compose with the data the caller
 * already has.
 */

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

export interface BiasFingerprint {
  biasType: string;
  severity: string;
}

export interface VersionDelta {
  dqi: {
    previous: number;
    current: number;
    delta: number;
    /** Display sign: 'improved' = current > previous, 'regressed' = current < previous, 'flat' = within 1 point. */
    direction: 'improved' | 'regressed' | 'flat';
  };
  noise: {
    previous: number;
    current: number;
    delta: number;
    direction: 'improved' | 'regressed' | 'flat';
  };
  biases: {
    /** Bias types present in previous, absent in current. The win column. */
    resolved: string[];
    /** Bias types present in current, absent in previous. The new-issues column. */
    emerged: string[];
    /** Bias types in both, but severity changed. */
    severityShifts: Array<{
      biasType: string;
      previousSeverity: string;
      currentSeverity: string;
      direction: 'improved' | 'worsened';
    }>;
    /** Bias types unchanged across both versions (same severity). */
    persistent: string[];
  };
}

function dqiDirection(delta: number): 'improved' | 'regressed' | 'flat' {
  if (Math.abs(delta) < 1) return 'flat';
  return delta > 0 ? 'improved' : 'regressed';
}

// Noise inversion — a HIGHER noise score is worse. Same delta math but
// flipped direction labels.
function noiseDirection(delta: number): 'improved' | 'regressed' | 'flat' {
  if (Math.abs(delta) < 1) return 'flat';
  return delta < 0 ? 'improved' : 'regressed';
}

export function computeVersionDelta(
  previous: { overallScore: number; noiseScore: number; biases: BiasFingerprint[] },
  current: { overallScore: number; noiseScore: number; biases: BiasFingerprint[] }
): VersionDelta {
  // Index by biasType — within a single analysis we expect one entry per
  // bias type (the pipeline aggregates), so this is a safe key.
  const prevByType = new Map<string, BiasFingerprint>();
  const currByType = new Map<string, BiasFingerprint>();
  for (const b of previous.biases) prevByType.set(b.biasType, b);
  for (const b of current.biases) currByType.set(b.biasType, b);

  const resolved: string[] = [];
  const emerged: string[] = [];
  const persistent: string[] = [];
  const severityShifts: VersionDelta['biases']['severityShifts'] = [];

  for (const [type, prevBias] of prevByType) {
    const curr = currByType.get(type);
    if (!curr) {
      resolved.push(type);
      continue;
    }
    const prevRank = SEVERITY_RANK[prevBias.severity.toLowerCase()] ?? 0;
    const currRank = SEVERITY_RANK[curr.severity.toLowerCase()] ?? 0;
    if (prevRank === currRank) {
      persistent.push(type);
    } else {
      severityShifts.push({
        biasType: type,
        previousSeverity: prevBias.severity,
        currentSeverity: curr.severity,
        direction: currRank < prevRank ? 'improved' : 'worsened',
      });
    }
  }
  for (const [type] of currByType) {
    if (!prevByType.has(type)) emerged.push(type);
  }

  const dqiDelta = current.overallScore - previous.overallScore;
  const noiseDelta = current.noiseScore - previous.noiseScore;

  return {
    dqi: {
      previous: Math.round(previous.overallScore),
      current: Math.round(current.overallScore),
      delta: Math.round(dqiDelta),
      direction: dqiDirection(dqiDelta),
    },
    noise: {
      previous: Math.round(previous.noiseScore),
      current: Math.round(current.noiseScore),
      delta: Math.round(noiseDelta),
      direction: noiseDirection(noiseDelta),
    },
    biases: {
      resolved: resolved.sort(),
      emerged: emerged.sort(),
      severityShifts: severityShifts.sort((a, b) => a.biasType.localeCompare(b.biasType)),
      persistent: persistent.sort(),
    },
  };
}

/** Format a bias type identifier ("sunk_cost_fallacy") into "Sunk Cost Fallacy". */
export function formatBiasName(s: string): string {
  return s
    .split('_')
    .map(w => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
