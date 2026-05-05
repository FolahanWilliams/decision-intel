/**
 * DPR Risk Strip — the procurement-grade R²F band/strip.
 *
 * Used on Page 3 for the 5 R²F-anchored signals: Validity Classification,
 * Reference Class Forecast, Feedback Adequacy, Org Calibration,
 * Counterfactual Impact. Each strip carries a severity-colored left border,
 * a band label (the R²F signal name), a band value (e.g. "LOW VALIDITY",
 * "CHALLENGING BASE RATE"), a Source Serif headline, and a body that
 * explains what the band means and what the procurement reader should
 * conclude.
 *
 * Severity follows the locked palette: critical=red, high=blue (Kahneman
 * optimum), medium=amber, low=green, info=cyan.
 */

import type { ReactNode } from 'react';

export type DprSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface DprRiskStripProps {
  /** Short uppercase signal name (e.g. "VALIDITY", "REFERENCE CLASS FORECAST"). */
  label: string;
  /** Short uppercase band classification (e.g. "LOW", "CHALLENGING BASE RATE"). */
  band: string;
  /** Severity color of the left border + label. */
  severity: DprSeverity;
  /** The Source Serif headline summarising what the band means. */
  headline: string;
  /** The body paragraph — what the procurement reader should conclude. */
  children: ReactNode;
  /** Optional footer rows — key/value pairs of supporting data. */
  footRows?: { k: string; v: ReactNode }[];
}

export function DprRiskStrip({
  label,
  band,
  severity,
  headline,
  children,
  footRows,
}: DprRiskStripProps) {
  return (
    <article className={`dpr-risk-strip dpr-risk-strip--${severity}`}>
      <header className="dpr-risk-strip-head">
        <span className={`dpr-risk-strip-label dpr-risk-strip-label--${severity}`}>{label}</span>
        <span className="dpr-risk-strip-band">{band}</span>
      </header>
      <h3 className="dpr-risk-strip-headline">{headline}</h3>
      <p className="dpr-risk-strip-body">{children}</p>
      {footRows && footRows.length > 0 && (
        <footer className="dpr-risk-strip-foot">
          {footRows.map((row, i) => (
            <div key={i} className="dpr-risk-strip-foot-row">
              <span className="dpr-risk-strip-foot-key">{row.k}</span>
              <span className="dpr-risk-strip-foot-val">{row.v}</span>
            </div>
          ))}
        </footer>
      )}
    </article>
  );
}
