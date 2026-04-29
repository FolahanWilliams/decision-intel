import { NextResponse } from 'next/server';
import {
  computePlatformCalibrationBaseline,
  formatBaselineLine,
  formatClassificationLine,
} from '@/lib/learning/platform-baseline';

/**
 * GET /api/intelligence/calibration-baseline
 *
 * Returns the platform calibration baseline — Brier-scored predictions
 * over the 143-case library using the published DQI methodology with
 * evidence-quality neutralised to avoid hindsight peeking.
 *
 * Public + cacheable. The case library is compile-time-static, so the
 * response is identical for every caller until the next deploy.
 *
 * The caller is expected to use this as the "before customer outcomes
 * accumulate" calibration evidence in DPRs, the BiasGenomeContributionCard
 * discovery state, the InvestorMetricsTracker, and the marketing
 * surfaces. As live customer outcomes accumulate (Outcome Gate Phase
 * 1+2+3), per-org calibration via /api/calibration/profile supersedes
 * this seed.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export function GET() {
  const baseline = computePlatformCalibrationBaseline();
  return NextResponse.json(
    {
      ...baseline,
      formatted: {
        baselineLine: formatBaselineLine(baseline),
        classificationLine: formatClassificationLine(baseline),
      },
    },
    {
      headers: {
        // Cache aggressively at every layer — the response is static
        // for the lifetime of the deployed bundle.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    }
  );
}
