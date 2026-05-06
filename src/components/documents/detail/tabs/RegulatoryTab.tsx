/**
 * RegulatoryTab — "Which frameworks does this trigger?"
 *
 * The regulatory exposure tab. Renders:
 *   1. Trigger summary tile — N of M frameworks triggered
 *   2. Region heat-grid — frameworks grouped by region (G7 / EU / UK /
 *      US / Africa / GCC), each tile severity-tinted by triggered/clean
 *   3. Per-bias → framework mapping (when ≥1 bias maps to ≥1 framework)
 *   4. Sovereign-context callout when the audit has emerging-market
 *      jurisdictions (Naira / CFA / ZAR cycle visuals)
 *
 * Mirrors the DPR's page-6 19-framework crosswalk in the platform UI.
 */

'use client';

import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { SeverityEdgeCard, type Severity } from '../primitives';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import type { RegulatoryFramework } from '@/lib/compliance/regulatory-graph';

export interface RegulatoryTabFrameworkTrigger {
  /** Framework id (matches RegulatoryFramework.id). */
  frameworkId: string;
  /** Bias types that triggered this framework. */
  triggeredBy: string[];
  /** Aggregate risk severity for this framework. */
  severity: Severity;
  /** Optional triggered-provision count. */
  provisionCount?: number;
}

export interface RegulatoryTabSovereignContext {
  jurisdiction: string;
  /** Short note — e.g. "Naira free-float; CBN I&E window risk material" */
  note: string;
}

export interface RegulatoryTabProps {
  /** Per-framework triggers from this audit. */
  triggers: RegulatoryTabFrameworkTrigger[];
  /** Detected emerging-market sovereign contexts. */
  sovereignContexts?: RegulatoryTabSovereignContext[];
  /** Click handler — open framework detail. */
  onFrameworkClick?: (framework: RegulatoryFramework) => void;
}

const REGION_DEFS: Array<{
  key: string;
  label: string;
  match: (f: RegulatoryFramework) => boolean;
}> = [
  {
    key: 'eu',
    label: 'EU',
    match: f => /european union|eu\b/i.test(f.jurisdiction),
  },
  {
    key: 'us',
    label: 'US',
    match: f => /united states|us\b|sec|federal|sox/i.test(f.jurisdiction),
  },
  {
    key: 'uk',
    label: 'UK',
    match: f => /united kingdom|uk\b|fca/i.test(f.jurisdiction),
  },
  {
    key: 'africa',
    label: 'African markets',
    match: f =>
      /nigeria|kenya|ghana|south africa|tanzania|egypt|waemu|cfa|popia|cbn|ndpr/i.test(
        f.jurisdiction
      ),
  },
  {
    key: 'global',
    label: 'Global / multilateral',
    match: f => /basel|global|imf|wto/i.test(f.jurisdiction),
  },
];

export function RegulatoryTab(props: RegulatoryTabProps) {
  const { triggers, sovereignContexts = [], onFrameworkClick } = props;

  const allFrameworks = useMemo(() => getAllRegisteredFrameworks(), []);
  const triggerById = useMemo(() => {
    const m: Record<string, RegulatoryTabFrameworkTrigger> = {};
    for (const t of triggers) m[t.frameworkId] = t;
    return m;
  }, [triggers]);

  // Group frameworks into regional bands.
  const grouped = useMemo(() => {
    const out: Record<string, RegulatoryFramework[]> = {};
    for (const def of REGION_DEFS) out[def.key] = [];
    out.other = [];

    for (const f of allFrameworks) {
      const def = REGION_DEFS.find(r => r.match(f));
      if (def) out[def.key].push(f);
      else out.other.push(f);
    }
    return out;
  }, [allFrameworks]);

  const triggeredCount = triggers.length;
  const totalCount = allFrameworks.length;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Summary tile */}
      <SeverityEdgeCard
        severity={triggeredCount === 0 ? 'low' : triggeredCount >= 5 ? 'high' : 'medium'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background:
                triggeredCount === 0
                  ? 'color-mix(in srgb, var(--severity-low) 12%, transparent)'
                  : 'color-mix(in srgb, var(--severity-high) 12%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: triggeredCount === 0 ? 'var(--severity-low)' : 'var(--severity-high)',
              flexShrink: 0,
            }}
          >
            {triggeredCount === 0 ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.018em',
                fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
                lineHeight: 1.05,
                marginBottom: 4,
              }}
            >
              {triggeredCount} of {totalCount} frameworks triggered
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {triggeredCount === 0
                ? 'Audit found no flagged biases that map onto regulatory provisions across the registered frameworks. Re-check after material findings escalate.'
                : `Findings on this memo trigger provisions across ${triggeredCount} regulatory regimes — these are the contractual disclosures the audit-committee + GC reviewer will cite.`}
            </div>
          </div>
        </div>
      </SeverityEdgeCard>

      {/* Region heat-grid */}
      <div style={{ display: 'grid', gap: 14 }}>
        <SectionEyebrow label="Coverage by region" />
        {REGION_DEFS.map(def => {
          const frameworks = grouped[def.key];
          if (!frameworks || frameworks.length === 0) return null;
          return (
            <RegionGroup
              key={def.key}
              label={def.label}
              frameworks={frameworks}
              triggerById={triggerById}
              onFrameworkClick={onFrameworkClick}
            />
          );
        })}
      </div>

      {/* Sovereign context */}
      {sovereignContexts.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          <SectionEyebrow label="Sovereign context · emerging-market jurisdictions" />
          {sovereignContexts.map((ctx, i) => (
            <SeverityEdgeCard key={i} severity="info">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--info)',
                    background: 'color-mix(in srgb, var(--info) 12%, transparent)',
                    padding: '2px 8px',
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                >
                  {ctx.jurisdiction}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: 'var(--text-primary)',
                  }}
                >
                  {ctx.note}
                </p>
              </div>
            </SeverityEdgeCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Region group ---------------- */

interface RegionGroupProps {
  label: string;
  frameworks: RegulatoryFramework[];
  triggerById: Record<string, RegulatoryTabFrameworkTrigger>;
  onFrameworkClick?: (framework: RegulatoryFramework) => void;
}

function RegionGroup({ label, frameworks, triggerById, onFrameworkClick }: RegionGroupProps) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            color: 'var(--text-muted)',
          }}
        >
          {frameworks.length}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 8,
        }}
      >
        {frameworks.map(f => {
          const trigger = triggerById[f.id];
          const triggered = !!trigger;
          const severity: Severity = trigger?.severity ?? 'neutral';
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFrameworkClick?.(f)}
              disabled={!onFrameworkClick}
              style={{
                textAlign: 'left',
                background: triggered
                  ? `color-mix(in srgb, var(--severity-${severity}) 8%, var(--bg-card))`
                  : 'var(--bg-card)',
                border: `1px solid ${
                  triggered ? `var(--severity-${severity})` : 'var(--border-color)'
                }`,
                borderTop: `3px solid ${
                  triggered ? `var(--severity-${severity})` : 'var(--border-color)'
                }`,
                borderRadius: 'var(--radius-md, 8px)',
                padding: '10px 12px',
                cursor: onFrameworkClick ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                opacity: triggered ? 1 : 0.78,
              }}
              onMouseEnter={
                onFrameworkClick
                  ? e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    }
                  : undefined
              }
              onMouseLeave={
                onFrameworkClick
                  ? e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }
                  : undefined
              }
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                  letterSpacing: '-0.005em',
                }}
              >
                {f.name}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                {f.jurisdiction}
              </div>
              {triggered && trigger.provisionCount != null && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: `var(--severity-${severity})`,
                  }}
                >
                  {trigger.provisionCount} provision
                  {trigger.provisionCount === 1 ? '' : 's'} triggered
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Section eyebrow ---------------- */

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
    </div>
  );
}
