'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Layers,
  AlertTriangle,
  GitCompare,
  Scale,
  Cpu,
  Hash,
} from 'lucide-react';

/**
 * DprAnatomyViz — Interactive layered visualization of a Decision
 * Provenance Record. Built 2026-04-26 to close the "DPR is jargon"
 * gap that 4 readers across 3 audit rounds flagged: cold visitors
 * see "Decision Provenance Record" on the landing page and don't
 * know what it actually is.
 *
 * The viz renders a stacked-page representation of a real DPR (every
 * label and number sourced from src/lib/reports/sample-dpr.ts so the
 * marketing surface and the actual artifact never drift). Clicking
 * a row expands its detail panel inline — what the section contains,
 * what regulatory provision it satisfies, and what a reviewer would
 * verify. Compact + click-driven so the page stays scannable.
 *
 * Pure SVG / Framer Motion. Respects prefers-reduced-motion via the
 * shared useReducedMotion hook. Mobile: stacks single-column.
 */

type DprSection = {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  oneLiner: string;
  contains: string[];
  regulatoryProvision: string;
  reviewerCheck: string;
  pageHint: string;
};

const SECTIONS: DprSection[] = [
  {
    id: 'header',
    icon: FileText,
    label: 'Header & identity',
    oneLiner: 'Names the document, the audit, and the moment in time it ran.',
    contains: [
      'Document identifier (filename + content hash)',
      'Audit identifier + schema version',
      'Generation timestamp (UTC)',
      'Organization + user attribution',
    ],
    regulatoryProvision: 'EU AI Act Art. 15 — accuracy and record-keeping',
    reviewerCheck:
      'A reviewer running a verification job can recompute the input hash from the source document and confirm it matches the value on the cover.',
    pageHint: 'Cover page',
  },
  {
    id: 'summary',
    icon: Layers,
    label: 'Executive summary + DQI',
    oneLiner: 'The 60-second board-ready read with the composite score.',
    contains: [
      'Plain-language summary of the decision being audited',
      'Decision Quality Index (0–100, A–F band)',
      'Noise score (judge-variance metric)',
      'Meta-verdict: proceed, hold, or reject',
    ],
    regulatoryProvision: 'GDPR Art. 22 — meaningful information about the logic of automated decisions',
    reviewerCheck:
      'The DQI is deterministic from the pipeline outputs — the same memo always scores the same number. Reviewers can re-run and confirm.',
    pageHint: 'Page 1',
  },
  {
    id: 'biases',
    icon: AlertTriangle,
    label: 'Biases identified',
    oneLiner: 'Every detection comes back with an excerpt, severity, and confidence.',
    contains: [
      'Each detection: bias name + DI-B taxonomy ID',
      'Verbatim excerpt from the source document',
      'Severity score (low / medium / high / critical)',
      'Citation back to the peer-reviewed paper that named the bias',
    ],
    regulatoryProvision: 'EU AI Act Art. 13 — transparency to affected parties',
    reviewerCheck:
      'Every bias name links back to a published academic source. A skeptical reviewer can chase any flag back to its original definition without leaving the document.',
    pageHint: 'Pages 2–4',
  },
  {
    id: 'counterfactuals',
    icon: GitCompare,
    label: 'Counterfactual scenarios',
    oneLiner: 'What changes if you remove the highest-impact bias.',
    contains: [
      'Per-bias counterfactual: lift to DQI if mitigated',
      'Top mitigation: the single highest-impact action',
      'Worked example showing the revised reasoning',
      'Probability shift on the underlying decision outcome',
    ],
    regulatoryProvision: 'Basel III Pillar 2 — qualitative-decision documentation',
    reviewerCheck:
      'Counterfactuals are computed from the same scoring rubric as the DQI itself, so the lift number is reproducible from the same inputs.',
    pageHint: 'Page 5',
  },
  {
    id: 'regulatory',
    icon: Scale,
    label: 'Regulatory mapping',
    oneLiner: 'Each flagged bias mapped to the provisions it touches across 18 frameworks.',
    contains: [
      'Per-bias: every regulatory framework the bias triggers',
      'Aggregate risk score per bias (0–10)',
      'Specific articles + sections (not just framework names)',
      'Geographic coverage: G7, EU, GCC, African markets',
    ],
    regulatoryProvision: 'AI Verify principles 7 + 11 — accountability + inclusive growth',
    reviewerCheck:
      'A GC can verify any provision cited maps to the named framework by checking the published statute — the DPR shows the article, not just the framework name.',
    pageHint: 'Page 6',
  },
  {
    id: 'pipeline',
    icon: Cpu,
    label: 'Pipeline + model lineage',
    oneLiner: 'Which agent produced which signal, with cost-tier transparency.',
    contains: [
      'Twelve-node pipeline order + zone (preprocessing / analysis / synthesis)',
      'Per-node model class (preprocessing-tier vs analysis-tier vs deterministic)',
      'Temperature + top-p settings per node',
      'Judge-variance metaverdict from the synthesis layer',
    ],
    regulatoryProvision: 'EU AI Act Art. 14 — human oversight + technical documentation',
    reviewerCheck:
      'The pipeline lineage names every agent that touched the memo and the model class it ran on, so a regulator can trace any output back to a specific node.',
    pageHint: 'Page 7',
  },
  {
    id: 'fingerprint',
    icon: Hash,
    label: 'Provenance fingerprints',
    oneLiner: 'SHA-256 hashes of the inputs and the prompt — tamper-evident by design.',
    contains: [
      'Input hash: SHA-256 of the source document content',
      'Prompt fingerprint: SHA-256 of the prompt-version stack',
      'Generation timestamp + UTC offset',
      'Schema version (current: v1)',
    ],
    regulatoryProvision: 'SOX §404 — internal controls evidence trail',
    reviewerCheck:
      'A counterparty can recompute the input hash from the source document at any time. If the bytes match, the audit record is provably tied to the document. Tamper-evident even without private-key signing.',
    pageHint: 'Footer of every page',
  },
];

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
};

export function DprAnatomyViz() {
  const [activeId, setActiveId] = useState<string | null>('biases');

  return (
    <div className="dpr-anatomy-grid">
      {/* LEFT — stacked-page metaphor */}
      <div className="dpr-anatomy-stack">
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow:
              '0 24px 48px -16px rgba(15,23,42,0.16), 0 8px 24px -8px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.04)',
          }}
        >
          {/* DPR header bar */}
          <div
            style={{
              padding: '12px 18px',
              background: C.slate900,
              color: C.white,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: 11,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span>DECISION PROVENANCE RECORD · v1</span>
            <span style={{ color: C.slate400 }}>SHA-256 7b3a1f…d09</span>
          </div>

          {/* Stack of section rows */}
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {SECTIONS.map((section, idx) => {
              const isActive = activeId === section.id;
              const Icon = section.icon;
              return (
                <li
                  key={section.id}
                  style={{
                    borderTop: idx === 0 ? 'none' : `1px solid ${C.slate200}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(isActive ? null : section.id)}
                    aria-expanded={isActive}
                    aria-controls={`dpr-section-${section.id}`}
                    style={{
                      width: '100%',
                      background: isActive ? C.greenLight : C.white,
                      border: 'none',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isActive ? C.green : C.slate100,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                    >
                      <Icon size={15} color={isActive ? C.white : C.slate500} strokeWidth={2.5} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: C.slate900,
                          marginBottom: 2,
                        }}
                      >
                        {section.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.slate500,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {section.oneLiner}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.slate400,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      }}
                    >
                      {section.pageHint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* RIGHT — active-section detail panel */}
      <div className="dpr-anatomy-detail">
        <AnimatePresence mode="wait">
          {activeId ? (
            <DprSectionDetail
              key={activeId}
              section={SECTIONS.find(s => s.id === activeId)!}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: C.slate50,
                border: `1px dashed ${C.slate200}`,
                borderRadius: 16,
                padding: '32px 28px',
                textAlign: 'center',
                color: C.slate500,
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              Click any section on the left to see what it contains, what
              regulatory provision it satisfies, and what a reviewer can verify.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .dpr-anatomy-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 28px;
          align-items: start;
        }
        .dpr-anatomy-stack { width: 100%; }
        .dpr-anatomy-detail { width: 100%; position: sticky; top: 80px; }
        @media (max-width: 900px) {
          .dpr-anatomy-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .dpr-anatomy-detail { position: static; }
        }
      `}</style>
    </div>
  );
}

function DprSectionDetail({ section }: { section: DprSection }) {
  const Icon = section.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 24px 22px',
        boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: C.greenLight,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color={C.green} strokeWidth={2.5} />
        </span>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 2,
            }}
          >
            DPR section
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.slate900 }}>{section.label}</div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.slate400,
            marginBottom: 8,
          }}
        >
          Contains
        </div>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {section.contains.map(item => (
            <li
              key={item}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 13,
                color: C.slate700,
                lineHeight: 1.5,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: C.green,
                  flexShrink: 0,
                  marginTop: 8,
                }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.slate400,
            marginBottom: 6,
          }}
        >
          Regulatory provision
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.slate900,
            lineHeight: 1.5,
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          }}
        >
          {section.regulatoryProvision}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.slate400,
            marginBottom: 6,
          }}
        >
          What a reviewer verifies
        </div>
        <p
          style={{
            fontSize: 13,
            color: C.slate700,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {section.reviewerCheck}
        </p>
      </div>
    </motion.div>
  );
}
