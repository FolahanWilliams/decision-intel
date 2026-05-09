/**
 * Unit tests for the QofE Defensibility Scorer.
 *
 * Locks the deterministic red-flag detection over QofE report text
 * (locked 2026-05-09 evening, M&A hard-layer extension — qofe parser
 * ship). Mirrors the synergy-defensibility test pattern: per-flag
 * detection rules + portfolio aggregation.
 *
 * If these tests drift, the audit pipeline's QofE adjusted-EBITDA
 * defensibility check stops firing the right red flags on real Big-4
 * QofE deliverables — silently degrading the M&A diligence-stage signal.
 */

import { describe, it, expect } from 'vitest';
import { scoreQofeAssessment, type QofeRedFlagId } from './qofe-defensibility';

describe('scoreQofeAssessment', () => {
  it('returns clean assessment for non-QofE prose (no red flags)', () => {
    const result = scoreQofeAssessment(
      'This is a generic strategic memo about market entry, not a Quality of Earnings report. We discuss customer segments, pricing, and channel strategy.'
    );
    expect(result.redFlags).toHaveLength(0);
    expect(result.portfolioSeverity).toBe('low');
  });

  it('detects recurring "one-time" pattern when language saturates', () => {
    const text = `The QofE identified the following one-time items: legal fees (one-time),
    consulting fees (non-recurring), severance (unusual), audit costs (one-time), and
    relocation expense (non-recurring). All adjustments are one-time in nature.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'recurring_one_time');
    expect(flag).toBeDefined();
    expect(['medium', 'high', 'critical']).toContain(flag!.severity);
  });

  it('does NOT flag recurring "one-time" when language appears below threshold', () => {
    const text = 'The single one-time legal fee was excluded from EBITDA.';
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'recurring_one_time');
    expect(flag).toBeUndefined();
  });

  it('detects owner-comp full add-back pattern', () => {
    const text = `Owner salary of $400,000 was added back to EBITDA. Founder bonus of
    $150,000 was excluded as related-party compensation.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'owner_comp_full_add_back');
    expect(flag).toBeDefined();
  });

  it('detects speculative run-rate when pro-forma + run-rate language co-occur', () => {
    const text = `On a pro-forma basis, run-rate cost savings of $2M are expected.
    Annualized post-period contract wins should add another $1M go-forward.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'speculative_run_rate');
    expect(flag).toBeDefined();
  });

  it('detects working-capital normalization signal', () => {
    const text = `Working capital was normalized to a trailing twelve-month NWC peg.
    The net working capital adjustment increased EBITDA by $500K.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'cherry_picked_wc');
    expect(flag).toBeDefined();
  });

  it('FIRES customer-concentration flag when concentration disclosure is ABSENT (inverted rule)', () => {
    // Long enough QofE-shaped text that lacks any customer-concentration signal.
    const text = `Adjusted EBITDA Quality of Earnings Analysis. The following normalization
    adjustments were identified: management consulting fees, owner salary, severance costs,
    and one-time legal fees. After all adjustments, normalized EBITDA is $5.2M. The reported
    EBITDA was $3.8M before adjustments. Pro forma EBITDA on a run-rate basis is $5.5M.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'customer_concentration_undisclosed');
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  it('does NOT fire customer-concentration flag when disclosure IS present', () => {
    const text = `Top 5 customers represent 32% of revenue. Customer concentration analysis
    shows the top 1 customer at 12% — within the buyer's risk threshold. Key accounts have
    multi-year contracts.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'customer_concentration_undisclosed');
    expect(flag).toBeUndefined();
  });

  it('detects sell-side commission signal', () => {
    const text = `This Quality of Earnings report was prepared for the seller in connection
    with the sell-side process. Vendor due diligence findings are summarized below.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'sell_side_commission_signal');
    expect(flag).toBeDefined();
    expect(result.commissionedBy).toBe('sell_side');
  });

  it('detects buy-side commission when prepared for the buyer', () => {
    const text = `This QofE was prepared for the buyer in connection with the proposed acquisition.
    Buy-side findings are detailed in the appendix.`;
    const result = scoreQofeAssessment(text);
    expect(result.commissionedBy).toBe('buy_side');
  });

  it('returns commissionedBy null when neither sell-side nor buy-side language detected', () => {
    const text = `Quality of Earnings analysis. EBITDA reconciliation follows. Top 3 customers
    represent 45% of revenue.`;
    const result = scoreQofeAssessment(text);
    expect(result.commissionedBy).toBeNull();
  });

  it('computes portfolioSeverity as max across all flags', () => {
    // Text designed to trip multiple flags at varying severities.
    const text = `One-time legal fees, one-time consulting fees, one-time audit fees,
    one-time severance costs, one-time relocation expense (all non-recurring). Owner
    compensation was added back. Pro-forma run-rate annualized savings.`;
    const result = scoreQofeAssessment(text);
    expect(result.redFlags.length).toBeGreaterThanOrEqual(2);
    // Since recurring_one_time alone can be 'high' or 'critical' at 5+ matches,
    // the portfolio severity should match the highest individual flag.
    const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const maxSeverity = result.redFlags.reduce((acc, f) =>
      severityRank[f.severity] < severityRank[acc.severity] ? f : acc
    );
    expect(result.portfolioSeverity).toBe(maxSeverity.severity);
  });

  it('computes adjEbitdaInflationSignal as a 0-1 density signal', () => {
    const heavyText = Array(20).fill('Adjusted EBITDA normalized EBITDA quality of earnings').join(' ');
    const heavyResult = scoreQofeAssessment(heavyText);
    expect(heavyResult.adjEbitdaInflationSignal).toBeGreaterThan(0.5);

    const lightText =
      'This memo discusses market entry strategy. The TAM is significant. Go-to-market is the bottleneck.' +
      ' Generic content '.repeat(50);
    const lightResult = scoreQofeAssessment(lightText);
    expect(lightResult.adjEbitdaInflationSignal).toBeLessThan(0.1);
  });

  it('summary names sell-side commissioning when detected', () => {
    const text = `Quality of Earnings Report — prepared for the seller. Vendor due diligence
    findings: management add-backs, owner-related expenses, one-time costs.`;
    const result = scoreQofeAssessment(text);
    expect(result.summary).toContain('Sell-side');
  });

  it('captures matched phrases for transparency / DPR display', () => {
    const text = `Owner salary added back. Owner bonus added back. Founder compensation
    excluded.`;
    const result = scoreQofeAssessment(text);
    const flag = result.redFlags.find(f => f.id === 'owner_comp_full_add_back');
    expect(flag).toBeDefined();
    expect(flag!.matchedPhrases.length).toBeGreaterThan(0);
    expect(flag!.matchedPhrases.length).toBeLessThanOrEqual(6);
  });

  it('verdict text is procurement-grade for every red flag (non-empty + names the risk)', () => {
    const text = `One-time, non-recurring, unusual, one-time, non-recurring fees. Owner
    salary added back. Pro-forma run-rate annualized normalized EBITDA. Working capital
    NWC peg. Sell-side prepared for seller.`;
    const result = scoreQofeAssessment(text);
    for (const flag of result.redFlags) {
      expect(flag.verdict.length).toBeGreaterThan(50);
      expect(flag.verdict.toLowerCase()).not.toBe('');
    }
  });

  it('all 6 canonical flag ids are reachable via at least one matching content shape', () => {
    const reachable: QofeRedFlagId[] = [];
    const cases: Array<{ text: string; expectId: QofeRedFlagId }> = [
      {
        text: 'one-time, non-recurring, unusual, one-time, non-recurring',
        expectId: 'recurring_one_time',
      },
      { text: 'Owner salary added back. Related-party transactions.', expectId: 'owner_comp_full_add_back' },
      {
        text: 'Pro-forma EBITDA on a run-rate annualized basis.',
        expectId: 'speculative_run_rate',
      },
      {
        text: 'Working capital normalized to NWC peg, net working capital adjusted.',
        expectId: 'cherry_picked_wc',
      },
      {
        // Long content WITHOUT customer-concentration language fires the inverted rule.
        text:
          'Adjusted EBITDA. Normalized EBITDA. Quality of earnings analysis report. ' +
          'Adjustment items include legal fees, consulting fees, and audit costs.',
        expectId: 'customer_concentration_undisclosed',
      },
      {
        text: 'This QofE was prepared for the seller as part of the sell-side process.',
        expectId: 'sell_side_commission_signal',
      },
    ];
    for (const c of cases) {
      const result = scoreQofeAssessment(c.text);
      const found = result.redFlags.find(f => f.id === c.expectId);
      if (found) reachable.push(c.expectId);
    }
    expect(reachable.length).toBe(cases.length);
  });
});
