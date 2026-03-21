'use client';

import { useState, useMemo } from 'react';
import { NoiseBenchmark } from '@/types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ExternalLink, Info } from 'lucide-react';

interface ClaimDeviationScatterProps {
  benchmarks: NoiseBenchmark[];
}

interface ScatterPoint {
  name: string;
  docValue: number;
  marketValue: number;
  variance: string;
  explanation: string;
  sourceUrl?: string;
  rawDocValue: string;
  rawMarketValue: string;
}

/**
 * Extracts a numeric value from a benchmark string.
 * Handles: "15%", "$2.5M", "3.2x", "45", "12.5 billion", etc.
 */
function extractNumeric(val: string): number | null {
  if (!val) return null;
  // Remove currency, commas, percentage signs
  const cleaned = val.replace(/[$€£,]/g, '').trim();
  // Try to extract first number (including decimals)
  const match = cleaned.match(/([\d.]+)/);
  if (!match) return null;
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  // Handle suffixes
  const lower = cleaned.toLowerCase();
  if (lower.includes('billion') || lower.includes('b')) num *= 1000;
  else if (lower.includes('million') || lower.includes('m')) num *= 1;
  else if (lower.includes('trillion') || lower.includes('t')) num *= 1000000;
  else if (lower.includes('thousand') || lower.includes('k')) num *= 0.001;

  return num;
}

// Aligned with design system: --error, --warning, --success
const VARIANCE_COLORS: Record<string, string> = {
  High: '#f87171',
  Medium: '#fbbf24',
  Low: '#34d399',
};

export function ClaimDeviationScatter({ benchmarks }: ClaimDeviationScatterProps) {
  const [selectedPoint, setSelectedPoint] = useState<ScatterPoint | null>(null);

  const points = useMemo(() => {
    const result: ScatterPoint[] = [];
    for (const b of benchmarks) {
      const dv = extractNumeric(b.documentValue);
      const mv = extractNumeric(b.marketValue);
      if (dv !== null && mv !== null) {
        result.push({
          name: b.metric,
          docValue: Math.round(dv * 100) / 100,
          marketValue: Math.round(mv * 100) / 100,
          variance: b.variance,
          explanation: b.explanation,
          sourceUrl: b.sourceUrl,
          rawDocValue: b.documentValue,
          rawMarketValue: b.marketValue,
        });
      }
    }
    return result;
  }, [benchmarks]);

  if (points.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">
        No numeric benchmark data available for scatter plot.
        <p className="text-[10px] mt-1">
          Benchmarks need numeric document and market values to plot.
        </p>
      </div>
    );
  }

  // Calculate axis bounds
  const allValues = points.flatMap(p => [p.docValue, p.marketValue]);
  const minVal = Math.min(...allValues) * 0.8;
  const maxVal = Math.max(...allValues) * 1.2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-accent-primary" />
          <span className="text-sm font-semibold">Claim Deviation Scatter</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> High variance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Points on the diagonal = document claims match market consensus. Points far from the
        diagonal = high-noise claims.
      </p>

      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--liquid-border)"
              strokeOpacity={0.3}
            />
            <XAxis
              type="number"
              dataKey="docValue"
              name="Document Value"
              domain={[minVal, maxVal]}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              label={{
                value: 'Document Value',
                position: 'bottom',
                offset: 10,
                style: { fontSize: 11, fill: 'var(--text-muted)' },
              }}
            />
            <YAxis
              type="number"
              dataKey="marketValue"
              name="Market Value"
              domain={[minVal, maxVal]}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              label={{
                value: 'Market Value',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                style: { fontSize: 11, fill: 'var(--text-muted)' },
              }}
            />
            {/* Diagonal reference line: perfect agreement */}
            <ReferenceLine
              segment={[
                { x: minVal, y: minVal },
                { x: maxVal, y: maxVal },
              ]}
              stroke="var(--accent-primary)"
              strokeDasharray="6 3"
              strokeOpacity={0.4}
              label={{
                value: 'Perfect Agreement',
                position: 'insideTopRight',
                style: { fontSize: 9, fill: 'var(--text-muted)' },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as ScatterPoint;
                return (
                  <div className="bg-secondary border border-border p-3 text-xs max-w-[250px]">
                    <p className="font-semibold text-foreground mb-1">{p.name}</p>
                    <p className="text-muted">
                      Doc: <span className="text-foreground">{p.rawDocValue}</span>
                    </p>
                    <p className="text-muted">
                      Market: <span className="text-foreground">{p.rawMarketValue}</span>
                    </p>
                    <span
                      className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5"
                      style={{
                        color: VARIANCE_COLORS[p.variance],
                        background: `${VARIANCE_COLORS[p.variance]}20`,
                      }}
                    >
                      {p.variance} Variance
                    </span>
                  </div>
                );
              }}
            />
            {/* Plot points grouped by variance */}
            {['High', 'Medium', 'Low'].map(variance => {
              const filtered = points.filter(p => p.variance === variance);
              if (filtered.length === 0) return null;
              return (
                <Scatter
                  key={variance}
                  data={filtered}
                  fill={VARIANCE_COLORS[variance]}
                  fillOpacity={0.7}
                  stroke={VARIANCE_COLORS[variance]}
                  strokeWidth={1}
                  cursor="pointer"
                  onClick={(_, __, event) => {
                    // Recharts wraps payload in the event target
                    const el = event?.currentTarget;
                    if (!el) return;
                    // Find the matching point by element index
                    const idx = parseInt(el.getAttribute('data-index') || '0', 10);
                    const varPoints = points.filter(p => p.variance === variance);
                    const clicked = varPoints[idx];
                    if (clicked) {
                      setSelectedPoint(prev => (prev?.name === clicked.name ? null : clicked));
                    }
                  }}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Selected point detail */}
      {selectedPoint && (
        <div className="p-3 border border-accent-primary/30 bg-accent-primary/5 text-xs space-y-2">
          <div className="flex items-start justify-between">
            <span className="font-semibold text-accent-primary">{selectedPoint.name}</span>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-muted hover:text-foreground text-xs"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/20">
              <span className="text-muted block">Document Claims</span>
              <span className="font-semibold text-foreground">{selectedPoint.rawDocValue}</span>
            </div>
            <div className="p-2 bg-muted/20">
              <span className="text-muted block">Market Consensus</span>
              <span className="font-semibold text-foreground">{selectedPoint.rawMarketValue}</span>
            </div>
          </div>
          <p className="text-muted leading-relaxed">{selectedPoint.explanation}</p>
          {selectedPoint.sourceUrl && (
            <a
              href={selectedPoint.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-primary hover:underline"
            >
              View Source <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
