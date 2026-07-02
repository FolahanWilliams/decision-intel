/**
 * Noise convergence band — the honest, STABLE presentation of the noise jury
 * (locked 2026-07-02).
 *
 * The noise score is `stdDev × 3` over 3 decorrelated jury frames — a dispersion
 * measured from THREE samples. A 3-sample dispersion is inherently jumpy
 * run-to-run (the founder saw 67.3 vs 59.3 on the same filing), and reporting it
 * as a false-precise point OVERSTATES its precision — both of those are "this
 * decision reads very differently depending on the lens," i.e. the SAME finding.
 *
 * The fix is NOT to make the jury deterministic — the jury MUST be decorrelated
 * (hot) to measure framing-sensitivity honestly; making it converge would
 * measure LESS noise, which is a lie. The fix is to present the measurement as
 * a BAND, the same discipline as the DPR's coefficient-of-variation banding: the
 * band is stable across the estimator's wobble, and it still surfaces the spread
 * (the disagreement IS the signal — it tells the reader which audience will be
 * harshest). Pure, no I/O, display-only — the raw stdDev + the DQI noise penalty
 * are untouched (no scoring / methodology change).
 *
 * The thresholds are on the 0-100 display noiseScore (`stdDev × 3`). They are
 * wide enough that ordinary run-to-run estimator wobble stays inside one band
 * (a stdDev of 20 vs 22 both read "volatile"), which is the whole point.
 */

export type NoiseConvergenceBand = 'robust' | 'moderate' | 'sensitive' | 'volatile';

export interface NoiseConvergence {
  band: NoiseConvergenceBand;
  /** Short headline the reader anchors on (stable across the wobble). */
  label: string;
  /** One line: what the band means for the reader. */
  hint: string;
}

const BANDS: Readonly<Record<NoiseConvergenceBand, { max: number; label: string; hint: string }>> =
  {
    robust: {
      max: 15,
      label: 'Robust',
      hint: 'The quality read held steady across every lens. Analyst, regulator, and contrarian scored it close together.',
    },
    moderate: {
      max: 35,
      label: 'Moderate',
      hint: 'Mild framing-sensitivity. The read shifts a little by lens, but the verdict holds under most.',
    },
    sensitive: {
      max: 55,
      label: 'Sensitive',
      hint: 'The read shifts materially by lens. A hostile framing scores this notably differently than a friendly one.',
    },
    volatile: {
      max: Infinity,
      label: 'Volatile',
      hint: 'High framing-sensitivity. Which audience reviews this changes the verdict; the lens is doing as much work as the memo.',
    },
  };

/**
 * Map a 0-100 display noiseScore (`stdDev × 3`) to a stable band. Clamps out-of-
 * range / non-finite input to 0 so a bad upstream value reads as "robust" rather
 * than throwing. The band is the customer-facing signal; the number is detail.
 */
export function noiseConvergenceBand(noiseScore: number): NoiseConvergence {
  const s = Number.isFinite(noiseScore) ? Math.max(0, Math.min(100, noiseScore)) : 0;
  const order: NoiseConvergenceBand[] = ['robust', 'moderate', 'sensitive', 'volatile'];
  for (const band of order) {
    if (s < BANDS[band].max) {
      return { band, label: BANDS[band].label, hint: BANDS[band].hint };
    }
  }
  // Unreachable (volatile.max = Infinity) but keeps the return total.
  return { band: 'volatile', label: BANDS.volatile.label, hint: BANDS.volatile.hint };
}
