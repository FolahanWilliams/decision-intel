/**
 * RegulatoryFrameworkHeatmap — regional grouped framework grid.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Replaces the flat chip strip with a regional grid: each region gets
 * its own row, frameworks within the region surface as severity-tinted
 * cells with hover labels. Visualizes the breadth of the 19-framework
 * regulatory map without overwhelming the executive view.
 */

'use client';

import type { ProvenanceBucket } from '@/lib/deliverable/types';

interface RegulatoryFrameworkHeatmapProps {
  frameworks: ProvenanceBucket['regulatoryFrameworks'];
}

const REGION_LABELS: Record<string, string> = {
  g7: 'G7',
  eu: 'European Union',
  us: 'United States',
  uk: 'United Kingdom',
  africa: 'African markets',
  global: 'Global',
  gcc: 'GCC',
  apac: 'Asia-Pacific',
  latam: 'Latin America',
  emerging: 'Emerging markets',
  unknown: 'Other',
};

const REGION_ACCENT: Record<string, string> = {
  g7: '#16a34a',
  eu: '#2563eb',
  us: '#0ea5e9',
  uk: '#7c3aed',
  africa: '#d97706',
  global: '#64748b',
  gcc: '#0891b2',
  apac: '#db2777',
  latam: '#65a30d',
  emerging: '#f59e0b',
  unknown: '#64748b',
};

export function RegulatoryFrameworkHeatmap({ frameworks }: RegulatoryFrameworkHeatmapProps) {
  if (frameworks.length === 0) {
    return (
      <div
        style={{
          padding: '14px 18px',
          fontSize: 12.5,
          color: 'var(--text-muted, #64748B)',
          border: '1px dashed var(--border-color, #E2E8F0)',
          borderRadius: 10,
        }}
      >
        No regulatory frameworks triggered by this audit&apos;s jurisdiction signals.
      </div>
    );
  }

  // Group by region
  const byRegion = new Map<string, ProvenanceBucket['regulatoryFrameworks']>();
  for (const fw of frameworks) {
    const key = fw.region.toLowerCase();
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(fw);
  }

  const sortedRegions = Array.from(byRegion.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '14px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 12,
        }}
      >
        Regulatory mapping · {frameworks.length} framework
        {frameworks.length === 1 ? '' : 's'} across {byRegion.size} region
        {byRegion.size === 1 ? '' : 's'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedRegions.map(([region, items]) => {
          const accent = REGION_ACCENT[region] ?? REGION_ACCENT.unknown;
          const label = REGION_LABELS[region] ?? region.toUpperCase();
          return (
            <div
              key={region}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: 14,
                alignItems: 'center',
              }}
              className="regulatory-region-row"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderLeft: `3px solid ${accent}`,
                  paddingLeft: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: 'var(--text-primary, #0F172A)',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--text-muted, #64748B)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ({items.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map(fw => (
                  <span
                    key={fw.id}
                    title={`${fw.label} · ${label}`}
                    style={{
                      display: 'inline-flex',
                      padding: '5px 11px',
                      background: `${accent}15`,
                      color: accent,
                      border: `1px solid ${accent}40`,
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'default',
                    }}
                  >
                    {fw.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
