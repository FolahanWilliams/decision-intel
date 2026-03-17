/**
 * Macro & Industry Context Service
 *
 * Pulls macro-economic indicators from free public APIs (FRED, World Bank)
 * and provides industry benchmarks for the noiseJudge and verification nodes.
 */

import { withTimeout, withRetry } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MacroContext');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MacroSnapshot {
  timestamp: string;
  indicators: MacroIndicator[];
  summary: string;
}

export interface MacroIndicator {
  name: string;
  value: string;
  period: string;
  source: string;
  trend?: 'rising' | 'falling' | 'stable';
}

export interface IndustryBenchmark {
  metric: string;
  value: string;
  industry: string;
  source: string;
  period: string;
}

// ─── FRED API (Federal Reserve Economic Data) ────────────────────────────────
// Free API, no key required for basic access

const FRED_API = 'https://api.stlouisfed.org/fred';
const FRED_API_KEY = process.env.FRED_API_KEY || 'DEMO_KEY'; // DEMO_KEY has limited rate

interface FredObservation {
  date: string;
  value: string;
}

const FRED_SERIES: Record<string, string> = {
  FEDFUNDS: 'Federal Funds Rate',
  CPIAUCSL: 'Consumer Price Index',
  UNRATE: 'Unemployment Rate',
  GDP: 'Gross Domestic Product',
  UMCSENT: 'Consumer Sentiment Index',
  T10Y2Y: '10Y-2Y Treasury Spread',
};

async function fetchFredSeries(seriesId: string): Promise<FredObservation | null> {
  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: FRED_API_KEY,
      file_type: 'json',
      sort_order: 'desc',
      limit: '2', // Get last 2 for trend detection
    });

    const response = await withTimeout(
      () => fetch(`${FRED_API}/series/observations?${params}`),
      15_000,
      `FRED timeout: ${seriesId}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const observations = data.observations as FredObservation[] | undefined;
    if (!observations || observations.length === 0) return null;

    return observations[0];
  } catch {
    return null;
  }
}

// ─── Macro Snapshot ──────────────────────────────────────────────────────────

/**
 * Fetch current macroeconomic indicators from FRED.
 * Returns a snapshot of key economic data for enriching analysis context.
 * Gracefully degrades: returns whatever data is available.
 */
export async function getMacroSnapshot(): Promise<MacroSnapshot> {
  const indicators: MacroIndicator[] = [];

  // Fetch all series in parallel with individual timeouts
  const results = await Promise.allSettled(
    Object.entries(FRED_SERIES).map(async ([seriesId, name]) => {
      const obs = await withRetry(() => fetchFredSeries(seriesId), 1, 1000, 3000);
      if (obs && obs.value !== '.') {
        indicators.push({
          name,
          value: obs.value,
          period: obs.date,
          source: 'FRED',
        });
      }
    })
  );

  const failures = results.filter(r => r.status === 'rejected').length;
  if (failures > 0) {
    log.warn(`${failures}/${Object.keys(FRED_SERIES).length} FRED series failed to fetch`);
  }

  // Generate a brief summary
  const summary = generateMacroSummary(indicators);

  return {
    timestamp: new Date().toISOString(),
    indicators,
    summary,
  };
}

function generateMacroSummary(indicators: MacroIndicator[]): string {
  if (indicators.length === 0) {
    return 'Macro data temporarily unavailable.';
  }

  const parts: string[] = [];
  for (const ind of indicators) {
    parts.push(`${ind.name}: ${ind.value} (${ind.period})`);
  }

  return `Current macro environment: ${parts.join('; ')}.`;
}

// ─── Industry Benchmarks ─────────────────────────────────────────────────────
// Uses Gemini grounded search to fetch current industry benchmarks
// rather than maintaining a static database.

/**
 * Fetch industry-specific benchmarks via Gemini grounded search.
 * Used by the noiseJudge to compare document claims against reality.
 *
 * @param industry e.g. "Technology", "Finance", "Healthcare"
 * @param metrics Optional specific metrics to look up
 */
export async function getIndustryBenchmarks(
  industry: string,
  metrics?: string[]
): Promise<IndustryBenchmark[]> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { getRequiredEnvVar } = await import('@/lib/env');
    const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview',
      tools: [{ googleSearch: {} } as Record<string, unknown>],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const metricsStr =
      metrics && metrics.length > 0
        ? `Focus on these metrics: ${metrics.join(', ')}.`
        : 'Include: revenue growth rate, profit margin, market size, employee growth, and any sector-specific KPIs.';

    const prompt = `Provide current industry benchmarks for the "${industry}" sector.
${metricsStr}

For each benchmark, provide:
- metric: name of the metric
- value: current value/range (include unit)
- industry: the sector name
- source: where this data comes from
- period: time period (e.g. "2025 Q4", "2025 FY")

Return a JSON array of benchmark objects. Only include data you can verify via search.`;

    const result = await withTimeout(
      () => model.generateContent(prompt),
      25_000,
      'Industry benchmark search timeout'
    );

    const text = result.response?.text?.() || '[]';
    const benchmarks = JSON.parse(
      text
        .replace(/```json\n?/g, '')
        .replace(/```/g, '')
        .trim()
    );

    if (!Array.isArray(benchmarks)) return [];

    return benchmarks.slice(0, 10).map((b: Record<string, unknown>) => ({
      metric: String(b.metric || ''),
      value: String(b.value || ''),
      industry: String(b.industry || industry),
      source: String(b.source || 'Gemini Search'),
      period: String(b.period || 'Current'),
    }));
  } catch (err) {
    log.warn('Industry benchmark fetch failed:', err instanceof Error ? err.message : String(err));
    return [];
  }
}
