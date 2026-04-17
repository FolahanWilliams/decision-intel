'use client';

import { ResponsiveRadar } from '@nivo/radar';
import type { BiasInstance } from '@/types';

interface BiasProfileRadarProps {
  biases: BiasInstance[];
}

const SEVERITY_SCORE: Record<string, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 25,
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

function formatBiasLabel(type: string): string {
  return type
    .replace(/_bias$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getDominantSeverity(biases: BiasInstance[]): string {
  const counts: Record<string, number> = {};
  for (const b of biases) {
    counts[b.severity] = (counts[b.severity] || 0) + 1;
  }
  let max = '';
  let maxCount = 0;
  for (const [sev, count] of Object.entries(counts)) {
    if (count > maxCount) {
      max = sev;
      maxCount = count;
    }
  }
  return max;
}

export function BiasProfileRadar({ biases }: BiasProfileRadarProps) {
  if (biases.length < 3) return null;

  const data = biases.map(b => ({
    bias: formatBiasLabel(b.biasType),
    intensity: Math.round((SEVERITY_SCORE[b.severity] ?? 50) * (b.confidence ?? 0.8)),
    baseline: 40,
  }));

  const dominantColor = SEVERITY_COLOR[getDominantSeverity(biases)] ?? '#EF4444';

  return (
    <div style={{ height: '100%', minHeight: 300 }}>
      <ResponsiveRadar
        data={data}
        keys={['intensity', 'baseline']}
        indexBy="bias"
        maxValue={100}
        margin={{ top: 32, right: 64, bottom: 32, left: 64 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [] }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={14}
        enableDots
        dotSize={8}
        dotColor="#FFFFFF"
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color', modifiers: [] }}
        colors={[dominantColor, 'rgba(148, 163, 184, 0.25)']}
        fillOpacity={0.18}
        blendMode="normal"
        motionConfig="gentle"
        legends={[
          {
            anchor: 'top-left',
            direction: 'column',
            translateX: -40,
            translateY: -20,
            itemWidth: 80,
            itemHeight: 18,
            itemTextColor: '#94A3B8',
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        theme={{
          text: { fill: '#475569', fontSize: 11, fontFamily: 'inherit' },
          grid: { line: { stroke: 'rgba(148, 163, 184, 0.25)' } },
          tooltip: {
            container: {
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: 12,
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          },
        }}
      />
    </div>
  );
}
