/**
 * WeWork S-1 (2019) — public audit data, hand-curated 2026-04-26.
 *
 * Every bias finding here is verifiable from the publicly-filed
 * S-1 prospectus (SEC filing, August 14, 2019). The lift weights are
 * calibrated estimates using the same scoring rubric that drives the
 * production DQI calculation: weights are proportional to (severity
 * × counterfactual reach × base-rate distance), capped at the rubric
 * maximum. The base DQI of 24 (F grade) matches the public sample
 * shown on /how-it-works in SAMPLE_DQI_SCORES.
 *
 * Used by:
 *   - CounterfactualLiftViz (interactive lift demo on /how-it-works)
 *   - WeWorkProofPanel on the landing page (read-only excerpt)
 *
 * The mitigated-DQI ceiling is deliberately D-range (~50), not A-range,
 * because the underlying decision (a 2019 IPO at a $47B valuation) had
 * structural failures beyond bias — governance, unit economics, and
 * market timing — that no amount of bias mitigation would have fixed.
 * This is the honest story: the audit catches what the board would
 * catch, but it cannot rescue a fundamentally bad decision.
 *
 * Single source of truth — when this file changes, every downstream
 * consumer picks up the new numbers automatically.
 */

export type WeWorkBias = {
  id: string;
  label: string;
  taxonomyId: string;
  liftIfMitigated: number;
  severity: 'high' | 'medium' | 'low';
  excerpt: string;
};

export const WEWORK_AUDIT = {
  documentName: 'WeWork S-1',
  documentSubtitle: 'Public document · 2019 IPO prospectus',
  baseDqi: 24,
  baseGrade: 'F' as const,
  noiseScore: 18,
  metaVerdict:
    'Reject as drafted. Even after the highest-impact biases are mitigated, the underlying capital-allocation thesis remains undefensible at the proposed valuation.',
  biases: [
    {
      id: 'overconfidence',
      label: 'Overconfidence',
      taxonomyId: 'DI-B-007',
      liftIfMitigated: 12,
      severity: 'high',
      excerpt:
        'Adjusted EBITDA framing excluded standard operating costs (marketing, design, member acquisition) and was presented as the headline metric.',
    },
    {
      id: 'anchoring',
      label: 'Anchoring',
      taxonomyId: 'DI-B-002',
      liftIfMitigated: 9,
      severity: 'high',
      excerpt:
        'Every projection tethered to the $47B private valuation set by SoftBank, not to market comparables for real-estate or coworking businesses.',
    },
    {
      id: 'sunkcost',
      label: 'Sunk cost',
      taxonomyId: 'DI-B-006',
      liftIfMitigated: 5,
      severity: 'medium',
      excerpt:
        '$4B+ of prior funding shaped the IPO as the only path forward, narrowing the alternatives the document seriously considered.',
    },
  ] satisfies WeWorkBias[],
} as const;

export const WEWORK_TOTAL_LIFT = WEWORK_AUDIT.biases.reduce(
  (sum, b) => sum + b.liftIfMitigated,
  0
);

export const WEWORK_MITIGATED_DQI = WEWORK_AUDIT.baseDqi + WEWORK_TOTAL_LIFT;
