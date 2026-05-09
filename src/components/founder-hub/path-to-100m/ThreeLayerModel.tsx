'use client';

/**
 * The DI 3-layer mental model — Snowflake (data) → Salesforce
 * (execution) → Decision Intel (reasoning between them).
 *
 * Locked 2026-05-09 evening from the Gemini-pushback validation. The
 * 3-layer frame is sharper than the prior CLAUDE.md positioning frame
 * because it gives the reader a clean architectural slot for DI:
 * "the reasoning layer between data integrity and execution discipline."
 *
 * Use as the lead positioning frame for cold investor conversations,
 * pitch-deck slide 2, and the senior-direct corp dev applications.
 * NEVER use it as the H1 (per CLAUDE.md vocabulary lock — the H1 stays
 * "the reasoning audit platform"); this is supporting architectural
 * vocabulary that earns the reader's attention.
 */

import { Database, ShieldCheck, Workflow } from 'lucide-react';

interface LayerEntry {
  id: 'data' | 'reasoning' | 'execution';
  name: string;
  ownerExample: string;
  primaryQuestion: string;
  description: string;
  diRole?: string;
  highlight?: boolean;
}

const LAYERS: ReadonlyArray<LayerEntry> = [
  {
    id: 'execution',
    name: 'Execution discipline',
    ownerExample: 'Salesforce / Workday / NetSuite',
    primaryQuestion: 'Did the decision actually get implemented?',
    description:
      'Tracks the moves that follow the call — pipeline, tasks, approvals, performance. Mature category, dominant incumbents, slow displacement.',
  },
  {
    id: 'reasoning',
    name: 'Reasoning quality',
    ownerExample: 'Decision Intel',
    primaryQuestion: 'Was the call defensible at the moment of commit?',
    description:
      'Audits the human reasoning trail before capital is committed — biases, noise, base-rate neglect, validity classification, named compound failure patterns. Cross-border regulatory mapping. The audit moment IS the wedge.',
    diRole:
      'Recognition-Rigor Framework arbitrating Kahneman + Klein over a 22-bias taxonomy + 143-case reference-class corpus + 19-framework regulatory map (G7 / EU / GCC / African). Brier 0.258 platform calibration.',
    highlight: true,
  },
  {
    id: 'data',
    name: 'Data integrity',
    ownerExample: 'Snowflake / Databricks / BigQuery',
    primaryQuestion: 'Is the data we feed into the call correct?',
    description:
      'Stores, governs, and serves the inputs to a decision — financials, market data, pipeline state. Mature category with multi-billion-dollar incumbents.',
  },
];

const LAYER_ICONS: Record<LayerEntry['id'], React.ReactNode> = {
  data: <Database size={20} />,
  reasoning: <ShieldCheck size={20} />,
  execution: <Workflow size={20} />,
};

export function ThreeLayerModel() {
  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: 'var(--text-muted)',
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Positioning · 3-layer architectural frame
        </div>
        <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 4 }}>
          Snowflake owns data. Salesforce owns execution. Decision Intel owns the reasoning layer
          between them.
        </h3>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          Architectural vocabulary for cold investor conversations + pitch-deck slide 2 + senior-
          direct corp dev applications. <strong>Earned vocabulary</strong> — never the H1 (H1 stays
          &ldquo;the reasoning audit platform&rdquo;).
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LAYERS.map(layer => (
          <div
            key={layer.id}
            style={{
              background: layer.highlight ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-secondary)',
              border: '1px solid',
              borderColor: layer.highlight ? 'var(--accent-primary)' : 'var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              borderLeft: `4px solid ${layer.highlight ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  color: layer.highlight ? 'var(--accent-primary)' : 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {LAYER_ICONS[layer.id]}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--fs-md)',
                      fontWeight: 600,
                      color: layer.highlight ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {layer.name}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {layer.ownerExample}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  &ldquo;{layer.primaryQuestion}&rdquo;
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                  {layer.description}
                </p>
                {layer.diRole && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      borderLeft: '3px solid var(--accent-primary)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        marginRight: 6,
                      }}
                    >
                      DI&apos;s moat
                    </span>
                    {layer.diRole}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <strong>The opening line</strong> for senior-direct corp dev applications + cold investor
        conversations:{' '}
        <em>
          &ldquo;Snowflake owns data integrity. Salesforce owns execution discipline. Decision Intel
          owns the reasoning layer between them — the audit moment before capital is
          committed.&rdquo;
        </em>{' '}
        Then bridge to the locked H1: &ldquo;The reasoning audit platform — R²F over a 22-bias
        taxonomy, scored as a Decision Quality Index.&rdquo;
      </div>
    </section>
  );
}
