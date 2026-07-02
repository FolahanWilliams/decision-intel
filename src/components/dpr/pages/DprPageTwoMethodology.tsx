/**
 * DPR Page Two — Methodological Defensibility.
 *
 * Locked 2026-05-05 (Phase 2). The second page of the legal-evidence-record
 * arc: BEFORE the audit committee reads findings, they read what made the
 * findings rigorous. Two sections:
 *
 *   §2 — Judge Variance (Noise Stats)
 *      Mean / std-dev / coefficient-of-variation / calibration-band, with a
 *      plain-language interpretation: a low CV (stdDev relative to the mean)
 *      means the jury converged on a strong signal — the verdict is robust
 *      across multiple lenses. (We report CV, a normalized dispersion, NOT the
 *      raw statistical variance σ², which is not a percentage.) This is the
 *      procurement reader's first objective signal that the audit is sound.
 *
 *   §3 — Model Lineage & Prompt Fingerprint
 *      Per-node model routing, prompt hash, grounded-retrieval scope,
 *      temperature settings. Two-column layout so the procurement reader
 *      can scan it in seconds.
 *
 * IP-protection: per-judge prompt content is NEVER serialised. Only the
 * SHA-256 fingerprint + summary statistics. The locked vocabulary in
 * trust-copy.ts says: "Per-judge granular outputs are stored in the internal
 * audit log and are available on request under the DPA."
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprStatCard, DprStatGrid } from '../primitives/DprStatCard';
import { DprKvGrid } from '../primitives/DprKvGrid';
import { DprNotice } from '../primitives/DprNotice';
import type { JudgeVariance, ModelLineage } from '@/lib/reports/provenance-record-data';

export interface DprPageTwoMethodologyProps {
  judgeVariance: JudgeVariance;
  modelLineage: ModelLineage;
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
}

export function DprPageTwoMethodology(props: DprPageTwoMethodologyProps) {
  const {
    judgeVariance,
    modelLineage,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
  } = props;

  // Pull out the statistical jury / noise judge granular if present
  const noiseJudge = judgeVariance.granular?.noiseJudge;
  const biasDetective = judgeVariance.granular?.biasDetective;

  // Dispersion as a coefficient of variation (stdDev relative to the mean noise
  // score) — the procurement-legible normalized spread. The raw statistical
  // variance (σ²) is NOT a percentage; rendering it as one produced a nonsense
  // "13,870%" (σ²≈139 × 100). CV = stdDev / mean, guarded for a near-zero mean
  // (a very clean memo, where a percentage spread is undefined).
  const meanNoise = judgeVariance.noiseScore;
  const cvPct =
    noiseJudge?.stdDev != null && meanNoise >= 1 ? (noiseJudge.stdDev / meanNoise) * 100 : null;
  const convergenceBand = computeConvergenceBand(cvPct);

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      {/* §2 — Judge Variance / Noise Stats */}
      <DprSection
        marker="§2"
        eyebrow="Methodological defensibility"
        title="Judge variance — what the jury saw"
        strap="Decision Intel runs three independent professional lenses on every memo: equity-research skeptical, regulator-hostile, and contrarian-strategist. Below: the variance the jury produced. Low variance means the audit verdict is robust across lenses; high variance tells the reviewer which audience will be harshest."
      >
        <DprStatGrid layout="four">
          <DprStatCard
            label="Mean noise score"
            value={`${Math.round(judgeVariance.noiseScore)}/100`}
            foot="Composite across three R²F lenses."
          />
          <DprStatCard
            label="Std. deviation"
            value={noiseJudge?.stdDev != null ? noiseJudge.stdDev.toFixed(1) : '—'}
            foot="Variance across the jury sample. Lower = stronger convergence."
          />
          <DprStatCard
            label="Dispersion (CV)"
            value={cvPct != null ? `${cvPct.toFixed(1)}%` : '—'}
            foot={convergenceBand.foot}
          />
          <DprStatCard
            label="Bias detective flags"
            value={biasDetective?.flagCount?.toString() ?? '—'}
            foot={
              biasDetective?.severeFlagCount != null
                ? `${biasDetective.severeFlagCount} flagged as severe.`
                : 'Single independent pass; cross-checked against the noise jury.'
            }
          />
        </DprStatGrid>

        {judgeVariance.metaVerdict && (
          <DprNotice mark="Meta-judge verdict">
            <span style={{ fontStyle: 'italic' }}>{judgeVariance.metaVerdict}</span>
          </DprNotice>
        )}

        {judgeVariance.note && <DprNotice mark="On per-judge IP">{judgeVariance.note}</DprNotice>}
      </DprSection>

      {/* §3 — Model Lineage & Prompt Fingerprint */}
      <DprSection
        marker="§3"
        eyebrow="Reproducibility"
        title="Model lineage and prompt fingerprint"
        strap="The exact configuration in force at audit time. Together with the prompt-fingerprint hash on page 1, this establishes that any re-run of this audit on the same source memo would produce a fingerprint identical to the one on file — or fail audibly."
      >
        <DprKvGrid rows={buildLineageRows(modelLineage)} />

        <DprNotice mark="On cost-tier routing">
          {modelLineage.note ||
            'Per-node model routing balances cost against the rigour each step requires. Preprocessing nodes use a low-cost analytical tier; the meta-judge — the highest-leverage single call in the pipeline — uses a Pro-grade model. Actual model IDs are resolved at audit time and available to design partners on request under NDA.'}
        </DprNotice>
      </DprSection>
    </DprPageShell>
  );
}

function buildLineageRows(lineage: ModelLineage) {
  const nodes = Object.entries(lineage.nodes);
  if (nodes.length === 0) {
    return [
      {
        k: 'Pipeline lineage',
        v: 'No node lineage recorded for this audit.',
      },
    ];
  }

  // Group by tier so the procurement reader sees the cost discipline at a
  // glance: preprocessing tier → analysis tier → deterministic tier.
  return nodes.slice(0, 12).map(([nodeId, cfg]) => ({
    k: prettyNodeName(nodeId),
    v: (
      <span>
        {cfg.model}
        <span style={{ color: 'var(--dpr-grey-500)', marginLeft: 8 }}>
          T={cfg.temperature.toFixed(2)} · top-p={cfg.topP.toFixed(2)}
        </span>
      </span>
    ),
    mono: true,
  }));
}

function prettyNodeName(nodeId: string): string {
  return nodeId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
}

function computeConvergenceBand(cvPct: number | null) {
  if (cvPct == null) {
    return { foot: 'Dispersion not recorded for legacy audits.' };
  }
  if (cvPct < 20) return { foot: 'Robust convergence — the jury agreed across lenses.' };
  if (cvPct < 40) return { foot: 'Moderate spread — the verdict survives multiple lenses.' };
  return { foot: 'High spread — the audit is framing-sensitive; review by lens.' };
}
