/**
 * Decision Alpha Index
 *
 * Public company CEO communication analyses using the DQI engine.
 * Phase 1: Curated static data for 4 CEOs (Buffett, Musk, Huang, Zuckerberg).
 */

import type { PublicCompanyAnalysis, DqiGrade } from './types';
import { BUFFETT_ANALYSES } from './analyses/buffett-berkshire';
import { MUSK_ANALYSES } from './analyses/musk-tesla';
import { HUANG_ANALYSES } from './analyses/huang-nvidia';
import { ZUCKERBERG_ANALYSES } from './analyses/zuckerberg-meta';

export type {
  PublicCompanyAnalysis,
  DqiGrade,
  DqiComponents,
  BiasExcerpt,
  StockPerformance,
  FilingType,
} from './types';

// ---------------------------------------------------------------------------
// Combined exports
// ---------------------------------------------------------------------------

export const DECISION_ALPHA_ANALYSES: PublicCompanyAnalysis[] = [
  ...BUFFETT_ANALYSES,
  ...MUSK_ANALYSES,
  ...HUANG_ANALYSES,
  ...ZUCKERBERG_ANALYSES,
];

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** CEO DQI Leaderboard — sorted by DQI score descending */
export function getLeaderboard(): PublicCompanyAnalysis[] {
  return [...DECISION_ALPHA_ANALYSES].sort((a, b) => b.dqiScore - a.dqiScore);
}

/** Filter analyses by stock ticker */
export function getAnalysisByTicker(ticker: string): PublicCompanyAnalysis[] {
  return DECISION_ALPHA_ANALYSES.filter(a => a.ticker.toLowerCase() === ticker.toLowerCase());
}

/** Filter analyses by CEO name (partial match) */
export function getAnalysisByCeo(ceoName: string): PublicCompanyAnalysis[] {
  const q = ceoName.toLowerCase();
  return DECISION_ALPHA_ANALYSES.filter(a => a.ceoName.toLowerCase().includes(q));
}

/** Aggregate statistics for the Decision Alpha dataset */
export function getAlphaStatistics() {
  const analyses = DECISION_ALPHA_ANALYSES;
  const totalAnalyses = analyses.length;

  const avgDqi =
    totalAnalyses > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.dqiScore, 0) / totalAnalyses)
      : 0;

  const gradeDistribution: Record<DqiGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const biasCounts: Record<string, number> = {};
  const toxicComboCounts: Record<string, number> = {};
  let totalBiases = 0;

  for (const a of analyses) {
    gradeDistribution[a.dqiGrade]++;
    totalBiases += a.biasesPresent.length;

    for (const b of a.biasesPresent) {
      biasCounts[b] = (biasCounts[b] ?? 0) + 1;
    }
    for (const t of a.toxicCombinations) {
      toxicComboCounts[t] = (toxicComboCounts[t] ?? 0) + 1;
    }
  }

  const avgBiasesPerAnalysis =
    totalAnalyses > 0 ? Math.round((totalBiases / totalAnalyses) * 10) / 10 : 0;

  const topBiases = Object.entries(biasCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topToxicCombos = Object.entries(toxicComboCounts).sort(([, a], [, b]) => b - a);

  return {
    totalAnalyses,
    avgDqi,
    avgBiasesPerAnalysis,
    gradeDistribution,
    topBiases,
    topToxicCombos,
    highestDqi: analyses.length > 0 ? getLeaderboard()[0] : null,
    lowestDqi: analyses.length > 0 ? getLeaderboard()[analyses.length - 1] : null,
  };
}
