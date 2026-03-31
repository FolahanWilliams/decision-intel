import type React from 'react';

// ─── Shared Styles for Founder Hub Tabs ──────────────────────────────────────

export const card: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: 'var(--bg-secondary, #111)',
  border: '1px solid var(--border-primary, #222)',
  marginBottom: 16,
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

export const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--text-muted, #71717a)',
  marginBottom: 6,
};

export const stat: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: 'var(--text-primary, #fff)',
};

export const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  background: `${color}15`,
  color,
  border: `1px solid ${color}30`,
});

export const tableRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 2fr',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid var(--border-primary, #222)',
  fontSize: 13,
};

// ─── Helper Functions ────────────────────────────────────────────────────────

export function formatBias(s: string) {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatIndustry(s: string) {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
