'use client';

/**
 * AI-Native Matrix — Fragile Wrapper vs Decision Intel comparison
 * (locked 2026-05-09 evening, derived from the Gemini-pushback frame
 * + sharpened with DI's actual citable moats per CLAUDE.md).
 *
 * The vanilla Gemini matrix was directionally right but generic —
 * every AI startup pitches "we're not a wrapper." This version names
 * DI's specific differentiators in every cell so the matrix
 * differentiates DI from Cloverpop / Aera / Quantellia / IBM
 * watsonx.governance, not just from generic GPT wrappers.
 *
 * Use as: pitch-deck slide ("why AI commodification doesn't kill DI"),
 * investor-call follow-up artefact, senior-direct corp dev application
 * supporting evidence.
 */

import { ShieldX, ShieldCheck } from 'lucide-react';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

interface MatrixRow {
  vector: string;
  fragileWrapper: string;
  decisionIntel: string;
  /** Optional citation-grade source for the DI claim. */
  diSource?: string;
}

const MATRIX_ROWS: ReadonlyArray<MatrixRow> = [
  {
    vector: 'Core IP',
    fragileWrapper:
      'Generates text from a foundation-model prompt. The prompt IS the product; commodifies the moment GPT-N+1 ships.',
    decisionIntel:
      'Recognition-Rigor Framework arbitrating Kahneman (System 2 debiasing) + Klein (Recognition-Primed Decision) over a 22-bias taxonomy (DI-B-001 → DI-B-022) + 13 named compound failure patterns. R²F is the citation-grade IP, not the prompt.',
    diSource:
      'Kahneman & Klein 2009 "Conditions for Intuitive Expertise" + Kahneman & Lovallo 2003',
  },
  {
    vector: 'Data defense',
    fragileWrapper:
      'Forgets the prompt once the session ends. Each user gets the same model behaviour as every other user — no compounding asset.',
    decisionIntel:
      "Per-org Brier accumulation against the 0.258 platform-baseline calibration. Every closed outcome via the Outcome Gate sharpens the org's DQI calibration AND contributes to the Bias Genome cross-org learning surface. Mathematically sharper with every deal.",
    diSource:
      'Platform calibration baseline computed against the 143-case library (Tetlock-anchored)',
  },
  {
    vector: 'Authorship robustness',
    fragileWrapper:
      'Breaks if human-authored memos disappear. Built around the assumption that a 40-page strategy memo flows in as input.',
    decisionIntel:
      'Authorship-agnostic R²F detectors fire identically on human-authored AND AI-assisted AND agent-generated reasoning patterns. The structurer node accepts agent decision-chain logs as a native input. Hardens AS the agentic shift accelerates.',
    diSource:
      'Agentic-shift investigation Q2 2026 + DI-B-021 illusion_of_validity (narrative coherence detector)',
  },
  {
    vector: 'Procurement defense',
    fragileWrapper:
      'No regulatory mapping. GC + audit committee see the output as "AI-generated" with no citable provenance trail.',
    decisionIntel: `Decision Provenance Record — hashed + tamper-evident artefact mapping every flagged bias to provisions across ${FRAMEWORK_COUNT} frameworks (G7 / EU / GCC / African markets). Aligned with AI Verify's 11 internationally-recognised AI governance principles. The exact human-oversight record EU AI Act Article 14 + Basel III Pillar 2 ICAAP requires.`,
    diSource: `${FRAMEWORK_COUNT}-framework regulatory map · src/lib/compliance/frameworks/`,
  },
  {
    vector: 'Workflow surface',
    fragileWrapper:
      'Single feature (bias detection or summarisation). One vulnerability — one user-research finding can collapse the wedge.',
    decisionIntel:
      'Multiple ANGLES on the SAME audit moment: 13-node pipeline + DPR + 3-frame noise jury + 5-gate Committee Readiness + named-pattern aggregation + structural-assumptions Dalio overlay + cross-doc cross-reference + Brier-scored outcome gate. Each angle reinforces the reasoning-audit category, not separate products.',
    diSource: 'Phase 2 DecisionContainer surface — 5 modes × shared audit pipeline',
  },
  {
    vector: 'Cross-border M&A defensibility',
    fragileWrapper:
      "US-only regulatory awareness. Acquirers operating in Pan-African / EM markets can't use the audit because their regulators aren't mapped.",
    decisionIntel:
      "Pan-African / EM regulatory coverage: NDPR · CBN · WAEMU · PoPIA · SARB · ISA Nigeria 2007 · CMA Kenya · CBE · BoT FinTech. Cloverpop + IBM watsonx.governance don't cover these regimes — DI's moat layer for cross-border M&A acquirers.",
    diSource: `src/lib/compliance/frameworks/africa-frameworks.ts · ${FRAMEWORK_COUNT} frameworks total`,
  },
  {
    vector: 'Calibration evidence',
    fragileWrapper:
      'No calibration baseline. Every claim is "trust the model." Investor diligence question — "is your scoring actually predictive?" — has no answer.',
    decisionIntel:
      'Brier 0.258 platform-baseline calibration computed against the 143-case reference-class corpus, anchored against Tetlock superforecaster bands (CIA-analyst 0.23 / amateur 0.35). Per-org Brier supersedes the seed once outcomes accumulate. Methodology version trichotomy (2.0.0-no-validity / 2.1.0 / 2.2.0) so a procurement reader can tell which methodology produced any score.',
    diSource: 'src/lib/learning/platform-baseline.ts · /api/intelligence/calibration-baseline',
  },
];

export function AiNativeMatrix() {
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
          Positioning · AI commodification defense
        </div>
        <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 4 }}>
          Why DI doesn&apos;t commodify with the next foundation model
        </h3>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          Every cell is citable to a CLAUDE.md lock. Use this matrix when an investor or partner
          asks &ldquo;won&rsquo;t GPT-N+1 just do this?&rdquo; — the answer is in the columns.
        </p>
      </header>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 1fr',
            gap: 0,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <HeaderCell label="Vector" />
          <HeaderCell
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ShieldX size={14} style={{ color: 'var(--error)' }} />
                Fragile AI Wrapper
              </span>
            }
          />
          <HeaderCell
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                Decision Intel
              </span>
            }
            highlight
          />
        </div>
        {MATRIX_ROWS.map((row, i) => (
          <div
            key={row.vector}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr 1fr',
              gap: 0,
              borderBottom: i === MATRIX_ROWS.length - 1 ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <Cell highlight bg="var(--bg-secondary)">
              <span
                style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {row.vector}
              </span>
            </Cell>
            <Cell>
              <p
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {row.fragileWrapper}
              </p>
            </Cell>
            <Cell bg="rgba(22, 163, 74, 0.04)" diColumn>
              <p
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {row.decisionIntel}
              </p>
              {row.diSource && (
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginTop: 6,
                  }}
                >
                  Source: {row.diSource}
                </div>
              )}
            </Cell>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        The meta-point under every column:{' '}
        <strong>AI amplifies competence, it does not create it.</strong> GPT-N+1 makes column one
        (the wrapper) cheaper to clone, but the moats in the other columns are accumulated
        competence and data no model release hands a competitor for free. It is the same wind that
        let one operator ship this whole platform alone, available to every competitor, and still
        not enough without the bundle above.
      </p>

      <div
        style={{
          marginTop: 12,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}
      >
        Forward-looking rule: every cell stays citable to a CLAUDE.md lock. When a moat changes (new
        framework added · new bias shipped · methodology version bumps · new HXC persona), update
        the matching cell here in lockstep.
      </div>
    </section>
  );
}

function HeaderCell({ label, highlight }: { label: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        fontSize: 'var(--fs-2xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: highlight ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontWeight: 600,
        background: highlight ? 'rgba(22, 163, 74, 0.06)' : 'transparent',
      }}
    >
      {label}
    </div>
  );
}

function Cell({
  children,
  highlight: _highlight,
  bg,
  diColumn,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  bg?: string;
  diColumn?: boolean;
}) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: bg ?? 'var(--bg-card)',
        fontSize: 'var(--fs-xs)',
        borderLeft: diColumn ? '2px solid var(--accent-primary)' : 'none',
      }}
    >
      {children}
    </div>
  );
}
