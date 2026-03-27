/**
 * API Metrics — In-memory ring buffer for route latency tracking
 *
 * Stores the last N API request metrics and provides aggregation functions.
 * Optionally flushes to the ApiUsage table for persistence.
 */

export interface ApiMetric {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

const BUFFER_SIZE = 1000;
const buffer: ApiMetric[] = [];
let writeIndex = 0;
let totalRecorded = 0;

/**
 * Record an API request metric.
 */
export function recordMetric(metric: ApiMetric): void {
  if (buffer.length < BUFFER_SIZE) {
    buffer.push(metric);
  } else {
    buffer[writeIndex % BUFFER_SIZE] = metric;
  }
  writeIndex++;
  totalRecorded++;
}

/**
 * Get all metrics within the last N milliseconds.
 */
export function getRecentMetrics(windowMs: number = 300_000): ApiMetric[] {
  const cutoff = Date.now() - windowMs;
  return buffer.filter(m => m.timestamp >= cutoff);
}

/**
 * Compute latency percentiles for a specific route or all routes.
 */
export function computePercentiles(
  route?: string,
  windowMs: number = 300_000
): { p50: number; p95: number; p99: number; count: number; avgMs: number } | null {
  let metrics = getRecentMetrics(windowMs);
  if (route) {
    metrics = metrics.filter(m => m.route === route);
  }

  if (metrics.length === 0) return null;

  const durations = metrics.map(m => m.durationMs).sort((a, b) => a - b);
  const count = durations.length;

  return {
    p50: durations[Math.floor(count * 0.5)] ?? 0,
    p95: durations[Math.floor(count * 0.95)] ?? 0,
    p99: durations[Math.floor(count * 0.99)] ?? 0,
    count,
    avgMs: durations.reduce((s, d) => s + d, 0) / count,
  };
}

/**
 * Get per-route summary for all tracked routes.
 */
export function getRouteSummaries(windowMs: number = 300_000): Array<{
  route: string;
  method: string;
  count: number;
  avgMs: number;
  p95: number;
  errorRate: number;
}> {
  const metrics = getRecentMetrics(windowMs);
  const grouped = new Map<string, ApiMetric[]>();

  for (const m of metrics) {
    const key = `${m.method} ${m.route}`;
    const arr = grouped.get(key) || [];
    arr.push(m);
    grouped.set(key, arr);
  }

  return Array.from(grouped.entries())
    .map(([key, entries]) => {
      const [method, route] = key.split(' ', 2);
      const durations = entries.map(e => e.durationMs).sort((a, b) => a - b);
      const errors = entries.filter(e => e.statusCode >= 400).length;
      return {
        route,
        method,
        count: entries.length,
        avgMs: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
        p95: durations[Math.floor(durations.length * 0.95)] ?? 0,
        errorRate: entries.length > 0 ? errors / entries.length : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get total metrics recorded since startup.
 */
export function getTotalRecorded(): number {
  return totalRecorded;
}

/**
 * Helper to wrap an API route handler with automatic metric recording.
 */
export function withMetrics(
  route: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const start = performance.now();
    try {
      const response = await handler(req);
      recordMetric({
        route,
        method: req.method,
        statusCode: response.status,
        durationMs: Math.round(performance.now() - start),
        timestamp: Date.now(),
      });
      return response;
    } catch (error) {
      recordMetric({
        route,
        method: req.method,
        statusCode: 500,
        durationMs: Math.round(performance.now() - start),
        timestamp: Date.now(),
      });
      throw error;
    }
  };
}
