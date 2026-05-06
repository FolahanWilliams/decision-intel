/**
 * DPR Page Structural Assumptions — Dalio macro-determinants.
 *
 * Locked 2026-05-05 (Phase 3). Per master KB synthesis: audit committees
 * want to see "macro-structural determinants the memo implicitly depends
 * on" surfaced explicitly. Ray Dalio's framework breaks these into four
 * canonical determinants:
 *
 *   1. Debt cycle — short-term + long-term debt cycle position
 *   2. Governance — political stability, rule of law, regulatory regime
 *   3. Productivity — labour productivity trend + structural-reform pace
 *   4. Currency / FX — sovereign cycle, current-account position, peg / float regime
 *
 * For specimens, the four cards are populated from a hand-curated map.
 * For real audits, the structural-assumptions data lives in
 * Analysis.structuralAssumptions JSON (Phase 4 wire-in). The page is
 * silently omitted when no assumptions are available.
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprNotice } from '../primitives/DprNotice';

export interface DprStructuralAssumption {
  determinant: 'debt_cycle' | 'governance' | 'productivity' | 'currency';
  /** What the memo implicitly assumes about this determinant. */
  implicitAssumption: string;
  /** What an outside-view reading of the data shows. */
  outsideViewAnchor: string;
  /** What the audit committee should ask. */
  reviewerQuestion: string;
  /** Severity of the gap between memo and outside view. */
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface DprPageStructuralAssumptionsProps {
  assumptions: DprStructuralAssumption[];
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
}

const DETERMINANT_LABEL: Record<DprStructuralAssumption['determinant'], string> = {
  debt_cycle: 'Debt cycle',
  governance: 'Governance',
  productivity: 'Productivity',
  currency: 'Currency · FX',
};

const DETERMINANT_ICON: Record<DprStructuralAssumption['determinant'], string> = {
  debt_cycle: '◐',
  governance: '◇',
  productivity: '△',
  currency: '◌',
};

export function DprPageStructuralAssumptions(props: DprPageStructuralAssumptionsProps) {
  const {
    assumptions,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
  } = props;

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§6"
        eyebrow="Structural assumptions"
        title="Macro-determinants the memo implicitly depends on"
        strap="Dalio's framework breaks every strategic decision into four macro-structural determinants — debt cycle, governance, productivity, and currency / FX. The memo's recommendation rests on implicit assumptions about each. Below: what the memo assumes vs. what the outside-view data shows."
      >
        <div className="dpr-dalio-grid">
          {assumptions.map(a => (
            <article key={a.determinant} className={`dpr-dalio-card dpr-dalio-card--${a.severity}`}>
              <header className="dpr-dalio-card-head">
                <span className="dpr-dalio-card-icon">{DETERMINANT_ICON[a.determinant]}</span>
                <span className="dpr-dalio-card-label">{DETERMINANT_LABEL[a.determinant]}</span>
              </header>
              <div className="dpr-dalio-card-body">
                <div className="dpr-dalio-card-row">
                  <span className="dpr-dalio-card-row-label">Memo assumes</span>
                  <p className="dpr-dalio-card-row-text">{a.implicitAssumption}</p>
                </div>
                <div className="dpr-dalio-card-row">
                  <span className="dpr-dalio-card-row-label">Outside view</span>
                  <p className="dpr-dalio-card-row-text">{a.outsideViewAnchor}</p>
                </div>
                <div className="dpr-dalio-card-row dpr-dalio-card-row--question">
                  <span className="dpr-dalio-card-row-label">Reviewer should ask</span>
                  <p className="dpr-dalio-card-row-text">{a.reviewerQuestion}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <DprNotice mark="On the framework">
          The four-determinant decomposition is the canonical structural-decision lens used by Ray
          Dalio (Bridgewater) and adapted in Decision Intel&apos;s structural-assumptions audit. The
          memo&apos;s recommendation is only as robust as the weakest determinant; the
          reviewer&apos;s discipline is to surface the determinant the memo argues least
          convincingly and pressure- test it before capital commitment.
        </DprNotice>
      </DprSection>
    </DprPageShell>
  );
}

/** Specimen Dalio cards — used by the WeWork sample DPR. */
export const SAMPLE_STRUCTURAL_ASSUMPTIONS: DprStructuralAssumption[] = [
  {
    determinant: 'debt_cycle',
    implicitAssumption:
      'Funding the €14M expansion from existing balance-sheet cash; no incremental debt required to clear the 18-month break-even.',
    outsideViewAnchor:
      'European corporate debt cycle is mid-to-late stage; sovereign yield-curve inversion in Q1 2026 implies a 60-70% probability of recession-grade demand contraction in DACH within 18 months.',
    reviewerQuestion:
      'If DACH demand contracts 25-35% in months 9-15 of the expansion (consistent with mid-cycle recession), what is the present value of continuing to spend the €14M vs. pausing and re-deploying capital? Is the 18-month break-even resilient or fragile?',
    severity: 'high',
  },
  {
    determinant: 'governance',
    implicitAssumption:
      'EU regulatory regime is stable; existing GDPR + AI Act compliance for the parent firm extends seamlessly to DACH operations.',
    outsideViewAnchor:
      "EU AI Act high-risk decision-support obligations enter force August 2026 — 8 months after planned go-live. The memo assumes the parent's existing compliance posture covers the new obligations; this is not automatic for new market-entry workflows.",
    reviewerQuestion:
      'What incremental EU AI Act obligations apply to the DACH-localised decision-support workflow specifically (Article 14 human oversight, Article 15 record-keeping), and what is the implementation cost + timeline to clear them BEFORE go-live, not after?',
    severity: 'critical',
  },
  {
    determinant: 'productivity',
    implicitAssumption:
      "DACH labour productivity matches the parent firm's home-market productivity for the localised functions (sales engineering, customer success, regulatory liaison).",
    outsideViewAnchor:
      "DACH labour productivity in B2B SaaS roles is ~85-92% of US benchmarks per OECD 2025 data (Eurostat structural-business statistics). Wage costs are higher; output-per-FTE is meaningfully lower. The memo's headcount model implicitly assumes parity.",
    reviewerQuestion:
      'Re-cost the headcount model at 88% productivity (mid-point of DACH B2B SaaS range) and 110% wage-cost. What is the revised break-even? If it slips past 22 months, does the memo still recommend at €14M, or does it recommend a smaller pilot first?',
    severity: 'high',
  },
  {
    determinant: 'currency',
    implicitAssumption:
      'EUR / parent-currency rate stable through the 18-month break-even window; FX impact on the €14M budget assumed within ±3%.',
    outsideViewAnchor:
      'EUR / USD has shown ±9% intra-year volatility in the prior 36 months; ECB-Fed policy divergence in 2026 H2 is a known macro risk. The memo carries no FX hedge.',
    reviewerQuestion:
      'What is the cost of a 12-month FX hedge on the €14M budget at current forward rates? If the cost is < 2% of budget, why is the memo not hedging? If unhedged, what is the EUR-realised break-even at +9% / -9% / -15% scenarios?',
    severity: 'medium',
  },
];
