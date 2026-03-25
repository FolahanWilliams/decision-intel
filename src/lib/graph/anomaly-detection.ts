/**
 * Temporal Anomaly Detection — detects structural changes in the
 * decision graph that may indicate organizational risk shifts.
 */

export interface GraphAnomaly {
  type: 'fragmentation' | 'centralization' | 'bias_surge' | 'outcome_shift';
  severity: number;
  description: string;
  detectedAt: string;
}

interface WeeklyStats {
  week: string;
  edges: number;
  biasEdges: number;
  similarityEdges: number;
}

/**
 * Detect temporal anomalies by comparing current week metrics
 * to a rolling 4-week average. Alerts on > 2 standard deviations.
 */
export function detectTemporalAnomalies(
  weeklyData: WeeklyStats[]
): GraphAnomaly[] {
  if (weeklyData.length < 5) return [];

  const anomalies: GraphAnomaly[] = [];
  const now = new Date().toISOString();

  // Get the last 4 weeks as baseline, current week as test
  const baseline = weeklyData.slice(-5, -1);
  const current = weeklyData[weeklyData.length - 1];

  // Compute baseline statistics
  const baseEdges = baseline.map(w => w.edges);
  const baseBiasEdges = baseline.map(w => w.biasEdges);

  const meanEdges = mean(baseEdges);
  const stdEdges = stdDev(baseEdges);
  const meanBiasEdges = mean(baseBiasEdges);
  const stdBiasEdges = stdDev(baseBiasEdges);

  // Check edge count anomalies
  if (stdEdges > 0) {
    const edgeZScore = (current.edges - meanEdges) / stdEdges;

    // Fragmentation: significant drop in edges
    if (edgeZScore < -2) {
      anomalies.push({
        type: 'fragmentation',
        severity: Math.round(Math.min(100, Math.abs(edgeZScore) * 20)),
        description: `Edge creation dropped ${Math.round(((meanEdges - current.edges) / meanEdges) * 100)}% below the 4-week average. Decision connections are fragmenting.`,
        detectedAt: now,
      });
    }

    // Centralization: significant spike in edges (may indicate centralized decision-making)
    if (edgeZScore > 2.5) {
      anomalies.push({
        type: 'centralization',
        severity: Math.round(Math.min(80, edgeZScore * 15)),
        description: `Edge creation spiked ${Math.round(((current.edges - meanEdges) / meanEdges) * 100)}% above the 4-week average. Decision-making may be concentrating.`,
        detectedAt: now,
      });
    }
  }

  // Check bias edge anomalies
  if (stdBiasEdges > 0) {
    const biasZScore = (current.biasEdges - meanBiasEdges) / stdBiasEdges;

    // Bias surge: significant increase in shared bias edges
    if (biasZScore > 2) {
      anomalies.push({
        type: 'bias_surge',
        severity: Math.round(Math.min(90, biasZScore * 20)),
        description: `Shared bias connections surged ${Math.round(((current.biasEdges - meanBiasEdges) / meanBiasEdges) * 100)}% above the 4-week average. Recurring bias patterns are intensifying.`,
        detectedAt: now,
      });
    }
  }

  // Outcome shift: check ratio of bias edges to total edges
  const currentBiasRatio = current.edges > 0 ? current.biasEdges / current.edges : 0;
  const baselineBiasRatios = baseline.map(w => w.edges > 0 ? w.biasEdges / w.edges : 0);
  const meanBiasRatio = mean(baselineBiasRatios);

  if (meanBiasRatio > 0 && currentBiasRatio > meanBiasRatio * 1.5 && currentBiasRatio > 0.4) {
    anomalies.push({
      type: 'outcome_shift',
      severity: Math.round(Math.min(75, (currentBiasRatio / meanBiasRatio) * 25)),
      description: `Bias-linked edges now represent ${Math.round(currentBiasRatio * 100)}% of all connections (up from ${Math.round(meanBiasRatio * 100)}% baseline). Decision quality may be declining.`,
      detectedAt: now,
    });
  }

  return anomalies.sort((a, b) => b.severity - a.severity);
}

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}
