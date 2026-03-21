'use client';

import { useState, useMemo } from 'react';
import { NoiseBenchmark } from '@/types';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';

interface NoiseDecompositionProps {
  benchmarks: NoiseBenchmark[];
  noiseScore: number;
}

const VARIANCE_WEIGHTS: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const VARIANCE_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#eab308',
  Low: '#10b981',
};

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  variance?: string;
  weight?: number;
  index: number;
}

function CustomContent({ x, y, width, height, name, variance }: TreemapContentProps) {
  if (width < 20 || height < 20) return null;

  const color = VARIANCE_COLORS[variance || 'Low'] || VARIANCE_COLORS.Low;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.5}
        rx={0}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + 8}
            y={y + 16}
            fill="var(--text-primary)"
            fontSize={10}
            fontWeight={500}
          >
            {(name || '').length > Math.floor(width / 7)
              ? (name || '').slice(0, Math.floor(width / 7)) + '…'
              : name}
          </text>
          <text
            x={x + 8}
            y={y + 30}
            fill={color}
            fontSize={9}
            fontWeight={700}
            style={{ textTransform: 'uppercase' }}
          >
            {variance}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * Treemap showing which benchmark metrics contribute the most noise.
 * Tile size = variance weight. Color = variance level.
 */
export function NoiseDecomposition({ benchmarks, noiseScore }: NoiseDecompositionProps) {
  const [selectedMetric, setSelectedMetric] = useState<NoiseBenchmark | null>(null);

  const treemapData = useMemo(() => {
    return benchmarks.map(b => ({
      name: b.metric,
      size: VARIANCE_WEIGHTS[b.variance] || 1,
      weight: VARIANCE_WEIGHTS[b.variance] || 1,
      variance: b.variance,
      explanation: b.explanation,
      documentValue: b.documentValue,
      marketValue: b.marketValue,
      sourceUrl: b.sourceUrl,
    }));
  }, [benchmarks]);

  const highCount = benchmarks.filter(b => b.variance === 'High').length;
  const medCount = benchmarks.filter(b => b.variance === 'Medium').length;
  const lowCount = benchmarks.filter(b => b.variance === 'Low').length;

  if (benchmarks.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">
        No benchmark data available for noise decomposition.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-accent-primary" />
          <span className="text-sm font-semibold">Noise Decomposition</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {highCount > 0 && (
            <span className="text-red-400">
              {highCount} high-noise
            </span>
          )}
          {medCount > 0 && (
            <span className="text-yellow-400">
              {medCount} medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="text-emerald-400">
              {lowCount} low
            </span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Larger tiles = higher deviation from market consensus. Red tiles are the primary noise sources.
      </p>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="var(--bg-primary)"
            content={<CustomContent x={0} y={0} width={0} height={0} index={0} />}
            onClick={(data: { name: string }) => {
              const found = benchmarks.find(b => b.metric === data.name);
              setSelectedMetric(prev => prev?.metric === found?.metric ? null : found || null);
            }}
          >
            <Tooltip
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid rgba(255,255,255,0.10)',
                fontSize: '11px',
                padding: '8px 12px',
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-secondary border border-border p-2 text-[11px]">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-muted">Doc: {d.documentValue} | Mkt: {d.marketValue}</p>
                    <p style={{ color: VARIANCE_COLORS[d.variance] }}>{d.variance} variance</p>
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Selected metric detail */}
      {selectedMetric && (
        <div className="p-3 border border-border bg-card/50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{selectedMetric.metric}</span>
            <button
              onClick={() => setSelectedMetric(null)}
              className="text-muted hover:text-foreground"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-black/10">
              <span className="text-muted block text-[10px]">Document</span>
              <span className="font-semibold">{selectedMetric.documentValue}</span>
            </div>
            <div className="p-2 bg-black/10">
              <span className="text-muted block text-[10px]">Market</span>
              <span className="font-semibold">{selectedMetric.marketValue}</span>
            </div>
            <div className="p-2 bg-black/10">
              <span className="text-muted block text-[10px]">Variance</span>
              <span
                className="font-semibold"
                style={{ color: VARIANCE_COLORS[selectedMetric.variance] }}
              >
                {selectedMetric.variance}
              </span>
            </div>
          </div>
          <p className="text-muted leading-relaxed">{selectedMetric.explanation}</p>
        </div>
      )}

      {/* Noise contribution summary */}
      <div className="p-3 bg-muted/10 border border-border/50 text-xs">
        <span className="text-muted">Noise breakdown:</span>{' '}
        {highCount > 0 && (
          <span className="text-red-400">
            {Math.round((highCount / benchmarks.length) * 100)}% of claims have high deviation
          </span>
        )}
        {highCount > 0 && (medCount > 0 || lowCount > 0) && <span className="text-muted"> · </span>}
        {medCount > 0 && (
          <span className="text-yellow-400">
            {Math.round((medCount / benchmarks.length) * 100)}% moderate
          </span>
        )}
        {medCount > 0 && lowCount > 0 && <span className="text-muted"> · </span>}
        {lowCount > 0 && (
          <span className="text-emerald-400">
            {Math.round((lowCount / benchmarks.length) * 100)}% aligned
          </span>
        )}
      </div>
    </div>
  );
}
