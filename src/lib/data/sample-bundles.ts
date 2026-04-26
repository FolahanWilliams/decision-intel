/**
 * Role-anchored sample memos (4.3 deep, extended 2026-04-25 with pe_vc).
 *
 * Samples per primary buyer role (CSO / M&A / BizOps / PE-Venture-Fund),
 * each at decision-grade quality matching the EM case-study standard.
 * The WelcomeModal-captured role routes the demo paste flow + dashboard
 * sample picker to the matching bundle so the first paste a buyer
 * makes maps to a decision they actually face.
 *
 * The `pe_vc` track was added in the 2026-04-25 Sankore-readiness pass.
 * Per CLAUDE.md positioning, PE/VC is NOT a primary marketed audience —
 * the landing/pricing/case-study pages stay focused on Fortune 500
 * strategy. But the platform must HONOR PE/VC users when they sign up
 * (Sankore is the design partner; Marcus + Adaeze + Titi all flagged
 * the role-enum gap as a procurement-stage tell). The pe_vc samples
 * carry African / EM markers because the design partner is a Pan-African
 * fund and that is the EM context the persona panels asked for.
 *
 * Each memo is plausible enough to survive a procurement-grade smell
 * test: real cycle-aware structural assumptions, real cited
 * comparables, real toxic-combination patterns. They are NOT real
 * companies — every name + number is synthetic. The point is that
 * pasting one and clicking Run produces a defensible audit (DQI in
 * the 40s-60s range, 4-7 named biases, an emerging-market or
 * compliance overlay where appropriate).
 */

export type SampleRole = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

export interface SampleBundle {
  /** URL-safe identifier, used by /case-studies/sample/[slug]. */
  slug: string;
  role: SampleRole;
  title: string;
  /** One-line procurement-grade hook surfaced on cards. */
  summary: string;
  /** Why this sample is wired to this role — one sentence. */
  hookCopy: string;
  /** The actual paste-ready memo body. ~600-1000 words. */
  content: string;
  /**
   * Biases the audit is expected to surface — used as a "this sample
   * shows you what we catch" preview chip without running the
   * pipeline. snake_case keys per src/lib/constants/bias-education.ts.
   */
  expectedBiases: string[];
  /** Plausible DQI given the memo's flaws. */
  expectedDqi: number;
  /** When set, surface the structural-assumptions panel. */
  marketContext?: 'emerging_market' | 'developed_market' | 'cross_border';
  /** Optional regulator-overlay tag for the bundle card. */
  regulatoryTag?: string;
}

// ─── CSO bundle (3) ─────────────────────────────────────────────────

const CSO_BRAZIL_ENTRY: SampleBundle = {
  slug: 'cso-brazil-market-entry',
  role: 'cso',
  title: 'Should we enter Brazil in 2026?',
  summary:
    'Pan-LATAM market-entry recommendation with FX-cycle exposure and a 35% CAGR claim anchored to a single peer.',
  hookCopy:
    'CSOs paste this when they are about to sign off on a market-entry recommendation that anchors to one peer.',
  marketContext: 'emerging_market',
  expectedBiases: [
    'anchoring_bias',
    'overconfidence_bias',
    'narrative_fallacy',
    'availability_heuristic',
    'optimism_bias',
  ],
  expectedDqi: 52,
  content: `# Q1 2026 Strategic Recommendation — Brazil Market Entry

## Executive Summary

We recommend the Board approve a $42M, three-year direct-entry into Brazil starting Q3 2026, targeting the SME industrial-services segment. We project the entity hits revenue break-even in month 18 and net-income break-even in month 30, with a five-year IRR of 31%. The opportunity is sized at $2.4B and growing at 35% CAGR — comparable to what HelixWorks captured in their 2018-2022 LATAM expansion.

## Strategic Rationale

Brazil is the largest LATAM industrial-services market and the fastest-growing in the region. The combination of (a) recently-elected pro-business administration, (b) tax reform that simplifies state-level VAT treatment, and (c) the structural shortage of mid-market integrators created by the 2024 sector consolidation makes entry now materially more favorable than the analysis we ran in 2022.

HelixWorks' precedent is the load-bearing comparable. They entered São Paulo in 2018 with a similar capital outlay ($35M, inflation-adjusted to $44M today), reached revenue break-even in 17 months, and delivered a 33% five-year IRR. Their growth was driven by the same SME-integrator gap we are now targeting, which gives us high confidence in our 35% CAGR assumption.

## Capital Plan

- $14M in years one and two for direct sales build-out, hub office in São Paulo, and local engineering team (target headcount: 38 by month 18).
- $8M for operating capital and FX-translation buffer.
- $6M reserved for inorganic add-ons in years two and three — three local integrators we have identified would cost between $1.5M and $2.5M each.

The $42M is at the upper end of what the FY26 capital plan supports, but the Board has previously indicated comfort with this range for a single-country LATAM entry.

## Financial Projections

| Year | Revenue (USD M) | EBITDA Margin | Net Income (USD M) |
|------|-----------------|---------------|--------------------|
| Y1   | 6.4             | -38%          | -3.2               |
| Y2   | 21.8            | -4%           | -1.0               |
| Y3   | 48.6            | 14%           | 5.4                |
| Y4   | 78.2            | 19%           | 11.7               |
| Y5   | 112.4           | 22%           | 19.8               |

The Y3 EBITDA crossover is the load-bearing assumption. It depends on the SME segment growing at 35% and our share of new logos hitting 8% by Y3. Both are inside the band HelixWorks delivered.

## FX Treatment

We model the BRL/USD exchange rate at 5.10 — the FY26 budget consensus from FactSet on 2026-01-12. We have not built a hedging line item; any meaningful BRL move can be absorbed by repricing the local services contracts on annual cycles, as our local SaaS peers do today.

## Regulatory & Tax

The recently-passed tax reform takes effect 2027-01. It simplifies state-level VAT treatment in a way we believe is unambiguously favorable to entrant integrators. Our outside counsel reviewed the public draft in November and has no material concerns.

## Risks Considered

- **Macro:** A LATAM-wide commodity price retreat could compress SME demand. We rank this medium-probability and would respond by reducing local headcount additions.
- **Execution:** Hiring senior engineering talent in São Paulo is competitive. Our local recruiting partner has committed to a 90-day fill rate on the first eight roles.
- **Competition:** Incumbent regional players are unlikely to react aggressively to a $42M entry, given their own 2024 capital constraints.

## Recommendation

We recommend Board approval to proceed at the $42M envelope, with a Q3 2026 launch and the first three-year IRR review at the FY28 mid-year board.

## Appendix: Comparable Reference

HelixWorks LATAM (2018-2022): $35M capital deployed, 17-month revenue break-even, 33% five-year IRR, 41% headcount-driven OpEx growth in years 2-3.
`,
};

const CSO_PHOENIX_DEFER: SampleBundle = {
  slug: 'cso-phoenix-defer',
  role: 'cso',
  title: 'Q4 board recommendation: defer the Phoenix product',
  summary:
    'Sunk-cost vs graceful-deferral framing on a 28-month internal product build. The recommendation tilts toward "one more quarter".',
  hookCopy:
    'The CSO version of the question every leadership team eventually faces — and most answer wrong.',
  expectedBiases: [
    'sunk_cost_fallacy',
    'escalation_of_commitment',
    'optimism_bias',
    'planning_fallacy',
    'confirmation_bias',
  ],
  expectedDqi: 47,
  content: `# Q4 Board Recommendation — Phoenix Product Status & Path Forward

## Recommendation

We recommend the Board approve one additional quarter of investment in Phoenix at the current run-rate ($3.4M / quarter), conditional on the engineering org hitting two performance milestones by the end of Q1 2026. If both milestones are achieved, we propose a public commercial launch in Q3 2026.

## Background

Phoenix is the next-generation analytics platform we have been building since Q1 2023. Total invested capital to date is $34.2M, against an original budget of $19M. The original commercial launch target was Q4 2024; the current target is Q3 2026.

We have shipped Phoenix to two design partners — Stockton Capital and the FinServ Industries vertical at Greenfield. Stockton renewed for a second year at $1.1M ARR; Greenfield exercised their non-renewal option and downgraded to the legacy platform in November 2025.

## Why We Believe One More Quarter Is Right

The engineering team has spent the last six months substantially rewriting the data layer. The first version, in production with both design partners, suffered from query latency that exceeded the contractual SLAs ~9% of the time. The new data layer has not yet been deployed end-to-end, but internal benchmarks suggest median latency drops by 64% and tail latency by 43%.

The product team has also been working with two prospective customers — Marshall & Ross and DenseWorks — who have signaled willingness to sign at $1.6M ARR each, conditional on the new data layer being deployed. Combined with Stockton's renewal, that puts us at $3.8M in ARR within the next three quarters, which materially de-risks the program.

We have invested $34.2M and are 90% of the way to a viable product. Walking away now leaves none of that capital recoverable. One additional quarter at $3.4M — less than 10% of total invested capital — gets us to a place where the program either ships or is shut down with substantially better evidence.

## Key Milestones for Q1 2026

1. **Performance:** New data-layer median latency below 240ms in production for Stockton.
2. **Pipeline:** Signed LOIs from both Marshall & Ross and DenseWorks at $1.6M ARR each.

If either milestone slips, we will return to the Board in March with a wind-down recommendation.

## Risks We Considered

The Greenfield non-renewal is the principal counter-data-point. We characterise it as an isolated event tied to a leadership change at Greenfield (their CIO transitioned in October 2025), not a structural rejection of Phoenix. The Greenfield team that worked with us was redeployed, not retained.

We have also considered the option of a wind-down now. We rejected it because the engineering investment in the new data layer is the load-bearing technical risk, and we have substantially de-risked it. The new data layer has not failed once in our internal benchmarks; the team is confident the deployment is straightforward.

## Capital Allocation

The $3.4M for Q1 2026 is already in the FY26 plan. If the Board approves this recommendation, no incremental allocation is required.

If Phoenix launches commercially in Q3 2026, the FY27 plan calls for $9-12M of incremental investment for go-to-market scaling.

## Recommendation, Restated

Approve one additional quarter of Phoenix investment at $3.4M, conditional on the two Q1 2026 milestones above.

## Appendix: Investment Timeline

Q1 2023 — Phoenix program approved at $19M / 24-month plan.
Q4 2024 — First design-partner deployment with Stockton; original launch target slipped.
Q2 2025 — Greenfield design partner deployed; SLA breach surfaces.
Q3 2025 — Data-layer rewrite begins; total invested capital surpasses $30M.
Q4 2025 — Greenfield non-renews; Stockton renews. Total invested capital reaches $34.2M.
`,
};

const CSO_REGULATORY_ACQUISITION: SampleBundle = {
  slug: 'cso-regulatory-consultancy-acquisition',
  role: 'cso',
  title: 'Should we acquire the regulatory consultancy advising us?',
  summary:
    'Conflict-of-interest plus cycle-aware acquisition memo with a $48M ticket and 5x revenue multiple.',
  hookCopy:
    'The acquisition memo with a load-bearing conflict — pasting it surfaces what counsel almost certainly hasn’t escalated yet.',
  marketContext: 'cross_border',
  regulatoryTag: 'EU AI Act · Basel III · GDPR',
  expectedBiases: [
    'confirmation_bias',
    'familiarity_bias',
    'in_group_bias',
    'overconfidence_bias',
    'sunk_cost_fallacy',
  ],
  expectedDqi: 49,
  content: `# Strategic Acquisition Recommendation — Regulatory Counsel & Strategy Group

## Recommendation

We recommend the Board approve the acquisition of Regulatory Counsel & Strategy Group ("RCS") for $48M cash, structured as a stock-and-cash 60/40 deal, with closing targeted for Q2 2026. RCS has been our outside regulatory advisor since 2019 and has played a central role in our EU regulatory strategy, including the 2024 AI Act readiness program.

## Strategic Rationale

RCS brings three things we cannot build organically inside a 24-month horizon: (a) a senior team of 14 partners with regulator-side relationships across the European Banking Authority, the FCA, and the AMF, (b) a proprietary regulatory-tracker product currently licensed to 47 European financial institutions, and (c) a content platform that consistently ranks in the top three regulatory-intelligence providers on procurement RFPs.

We have worked with RCS continuously for seven years. They know our business, they have advised on every material regulatory question we have faced since 2019, and they have repeatedly demonstrated the kind of judgment we would want in-house. The acquisition both protects against a future where they are sold to a competitor (which we believe is increasingly likely given recent industry consolidation) and gives us a step-change in our European regulatory positioning.

## Valuation

We have agreed to $48M, representing 5.0x trailing twelve-month revenue ($9.6M). Comparable public-firm regulatory-services multiples sit at 2.8-3.4x. We pay a premium for: (a) the regulator-relationship intangibles, (b) the regulatory-tracker product (which we model as $4-6M ARR by 2027), and (c) the quality of the partner team.

We have also independently triangulated the valuation against three private comparable transactions: Lexford → Carrelton (2023, 4.6x), Oaks Counsel → Mercer Holdings (2024, 5.2x), and the Ashbridge / Kaplan deal (2024, 5.4x). RCS sits within this band.

## Diligence

We have conducted financial diligence (Deloitte), legal diligence (Cleary Gottlieb), and operational diligence (in-house corp dev). All three workstreams have closed without material findings.

The financial diligence confirmed RCS's reported revenue growth (28% CAGR over the last three years), gross margin (78%), and partner economics. The legal diligence surfaced two minor matters — both resolved — and confirmed there are no outstanding regulator actions against the firm.

## Synergies

We model $2.1M in revenue synergies in year one (cross-sell to our existing financial-services accounts) and $3.4M by year three. Cost synergies are modest — we are absorbing a high-quality team, not consolidating overlapping back-office.

## Risks Considered

The principal risk is partner-retention. RCS's value sits with the 14 partners; if more than three exit in the first 18 months, the deal is materially impaired. We have proposed a five-year retention package for all 14, with vesting tied to our internal performance metrics. The partner group has indicated unanimous support for the deal in principal, although final compensation terms are still being negotiated.

The second risk is the regulator-relationship intangibles. Several of RCS's most senior regulator contacts are personal relationships, and there is no guarantee those carry forward inside our organisation. We have asked the partner group to provide a relationship-handover plan within 90 days of close.

We considered the conflict question. RCS has been our outside counsel for seven years, which raises a theoretical concern about the diligence work being performed under time pressure. We mitigated by retaining Cleary Gottlieb (independent of RCS) for the legal diligence and Deloitte (independent of RCS) for the financial diligence. We are confident the diligence was rigorous.

## Capital Plan

The $48M is within our FY26 capital envelope and does not require incremental Board approval beyond this transaction.

## Recommendation, Restated

Approve the acquisition of RCS at $48M, 60% cash / 40% stock, with closing targeted for Q2 2026 and the five-year partner-retention package as described.

## Appendix: Relationship History

RCS has advised on the 2019 cross-border banking restructuring, the 2021 EU MiFID II readiness work, the 2023 sustainability-reporting program, and the 2024 EU AI Act readiness program. Their work product has been consistently strong; the principal partner has been part of every material regulatory decision we have made since 2019.
`,
};

// ─── M&A bundle (3) ─────────────────────────────────────────────────

const MA_PROJECT_ATLAS: SampleBundle = {
  slug: 'ma-project-atlas-ic-memo',
  role: 'ma',
  title: 'Project Atlas — preliminary IC memo',
  summary:
    'Synergy-assumption + integration-risk memo with a $40M ticket size and a 24-month integration timeline.',
  hookCopy:
    'The IC memo most diligence teams write with two weeks left on the clock — see what surfaces when you paste it.',
  expectedBiases: [
    'overconfidence_bias',
    'planning_fallacy',
    'optimism_bias',
    'anchoring_bias',
    'narrative_fallacy',
  ],
  expectedDqi: 54,
  content: `# Project Atlas — Preliminary Investment Committee Memo

## Transaction Summary

Atlas Industries (target) — recommended approval at $40M cash, structured as 100% equity acquisition with a 12-month earn-out tied to integration milestones. We project a five-year IRR of 27% and a payback period of 36 months. Closing target: Q3 2026.

## Strategic Rationale

Atlas is the second-largest specialty distributor in our adjacent vertical and a long-standing target on our M&A pipeline. Acquisition gives us (a) immediate scale into the segment, (b) approximately $14M in run-rate revenue synergies through cross-sell into our existing channels, and (c) a step-change in our regional coverage that would otherwise take 36-48 months to build organically.

The acquisition also addresses a strategic gap our largest competitor exploited last year, when they acquired Atlas's nearest peer and used the resulting scale to win two of our largest accounts.

## Synergy Model

| Category                     | Year 1 | Year 2 | Run-rate |
|------------------------------|--------|--------|----------|
| Revenue synergy (cross-sell) | $4.2M  | $9.6M  | $14.0M   |
| COGS synergy (vendor mix)    | $1.1M  | $2.4M  | $3.6M    |
| OpEx synergy (consolidation) | $0.8M  | $1.7M  | $2.4M    |
| Total                        | $6.1M  | $13.7M | $20.0M   |

The revenue-synergy model is the load-bearing component. We assume 18% of our target accounts adopt Atlas's specialty SKU set within the first 24 months. This rate is consistent with the 2022 cross-sell our last comparable deal (Project Vector) achieved, although Vector was a smaller transaction with a less complex SKU portfolio.

## Integration Plan

The integration work is sequenced over a 24-month runway:

- **Months 0-3:** Day-1 readiness, branding alignment, customer communications.
- **Months 3-9:** ERP migration to our platform, sales-channel consolidation.
- **Months 9-18:** Cross-sell campaign launch, vendor-mix harmonization.
- **Months 18-24:** Operational consolidation, full P&L integration.

We have allocated $2.4M for integration costs (one-time), within the standard 6% of deal value our integration playbook calls for.

## Diligence

Financial diligence (KPMG): No material findings; revenue and margin trends in line with deal-room representations. Quality-of-Earnings adjustments resulted in a $0.4M reduction to TTM EBITDA, which we have already reflected in the model.

Legal diligence (Skadden): Two minor IP-licensing matters identified, both addressable through standard reps & warranties. No material litigation exposure.

Customer diligence: We interviewed 11 of Atlas's top 20 accounts. All 11 expressed satisfaction with Atlas's service quality; nine indicated openness to expanding their relationship under our brand.

## Risks Considered

**Customer attrition:** Cross-sell deals frequently see 5-10% target-customer attrition in years 1-2. We have modelled 6% attrition and a corresponding revenue-synergy haircut.

**Integration execution:** Our last three acquisitions averaged 28-month integration timelines against 24-month plans. We have built in a four-month buffer in the synergy run-rate ramp.

**Talent retention:** Atlas's senior team (8 leaders, 14 senior managers) is critical to the integration. We have proposed retention packages for all eight leaders; six have indicated they would stay through the earn-out period. The two who would not are CFO and Head of Field Sales — both replaceable through internal promotion.

## Comparable Transactions

- Project Vector (2022): $32M, similar industry, 24-month integration, 22% IRR realized.
- Project Mercury (2023): $58M, larger but comparable, 26% IRR realized.

We are pricing Atlas at the upper end of the band for these comparables, reflecting the scarcity of remaining acquisition targets in the segment.

## Recommendation

We recommend IC approval of the Atlas acquisition at $40M cash, with the 12-month earn-out structure, closing in Q3 2026. The synergy model and integration plan support a 27% five-year IRR, well above our 22% threshold.

## Appendix: Sensitivity Analysis

A 200bp compression in synergy delivery (revenue + COGS + OpEx) reduces five-year IRR to 21%. A 12-month integration delay reduces IRR to 24%. Both scenarios remain within our threshold.
`,
};

const MA_BANK_DILIGENCE: SampleBundle = {
  slug: 'ma-bank-regulatory-diligence',
  role: 'ma',
  title: 'Bank-regulatory M&A diligence note',
  summary:
    'Basel III ICAAP overlay on a regional bank acquisition memo, with capital-allocation rigor and SRT exposure.',
  hookCopy:
    'Bank deals fail differently — paste this to see what the audit catches that legal diligence won’t.',
  regulatoryTag: 'Basel III · ICAAP · SOX',
  expectedBiases: [
    'overconfidence_bias',
    'anchoring_bias',
    'availability_heuristic',
    'confirmation_bias',
  ],
  expectedDqi: 56,
  content: `# Project Beacon — Regulatory Diligence Note

## Transaction Snapshot

Target: Beacon Federal Savings, a $4.8B-asset regional thrift with a regional-commercial-real-estate concentration. Proposed transaction: full acquisition at 1.45x tangible book ($720M total consideration). Closing target: Q4 2026, subject to regulator approval.

## Regulatory Context

Beacon is a state-chartered savings bank under FDIC primary regulation. The transaction will require approval from (a) the FDIC, (b) the relevant state banking commissioner, and (c) the Federal Reserve under the Bank Holding Company Act, given our acquisition vehicle is a registered bank holding company.

The deal sits at the boundary of where Pillar 2 ICAAP scrutiny intensifies. Our combined post-close balance sheet will move from $14.7B to $19.5B in total assets, crossing the $15B threshold that activates more rigorous CCAR-style capital planning expectations. We have engaged Davis Polk and Ernst & Young on the regulatory submission strategy and have factored a 9-month regulator-review timeline into the closing schedule.

## Capital Position

Pro forma CET1 ratio at close: 11.4%, against a regulatory minimum of 7% (4.5% baseline + 2.5% capital conservation buffer). The 4.4% headroom provides substantial cushion against stressed-scenario outcomes.

We have run the 2024 CCAR severely-adverse scenario against the combined balance sheet. Pro forma CET1 in the trough quarter is 8.6% — well above the 4.5% minimum but tighter than our standalone 9.1% trough. The combined entity is materially more resilient than Beacon standalone (5.9% trough), driven by our higher-quality consumer-credit book and lower commercial-real-estate concentration.

## Loan Book Diligence

Beacon's $3.1B loan book is 64% commercial real estate, of which 41% is multifamily and 23% is office. The office concentration ($292M) is the principal credit-quality concern given the structural shifts in office occupancy.

We have re-underwritten the top 25 office exposures (representing 71% of the portfolio by dollar amount). 18 of 25 have current LTVs below 70% and DSCR above 1.30x. Five have LTVs between 70-85% with DSCR between 1.10-1.30x — manageable but on a watch list. Two are stressed (LTV >85%, DSCR <1.10x) and we have proposed a $14M provision adjustment in our offer model.

The multifamily book is high-quality. Average LTV 62%, average DSCR 1.41x, geographic concentration in markets with positive net migration.

## Synthetic Risk Transfer (SRT) Exposure

Beacon has $640M of synthetic-risk-transfer trades on file with two counterparties. This is the most novel piece of the transaction and the area where we have invested the most diligence time.

We have reviewed all 14 SRT transactions and confirmed: (a) all are properly documented under ISDA; (b) the protection has been recognized on a regulatory-capital basis under the standardized approach; (c) the trade economics — protection-cost vs. capital-relief — are reasonable.

The principal concern is concentration: 78% of the SRT protection is with a single counterparty (Counterparty A, a major European bank with a 250bp CDS spread). If Counterparty A's standing deteriorates, the regulatory-capital recognition is at risk. We have modelled the impact of losing all Counterparty A protection: pro forma CET1 drops by 84bp to 10.6%. Still well above minimum.

## Forward-Looking Statements

Management's projections show Beacon's commercial-real-estate book stabilizing in 2027 and resuming growth in 2028. We have built our model on a more conservative path: flat CRE balances through 2028, then 3% growth from 2029. This produces a pro forma 2029 ROE of 12.4%, above our 11% acquisition threshold.

## Recommendation

The combined transaction is regulator-approvable, capital-accretive, and commercially attractive at the proposed valuation. We recommend the deal team proceed to regulator pre-filing, with the formal application targeted for Q1 2026.

The two open items are: (a) the $14M loan-book provision adjustment, which the seller has not yet accepted; and (b) the SRT counterparty-concentration question, which we recommend addressing through a contractual seller representation that no SRT trades will be amended pre-close.

## Appendix: Capital Allocation

If approved, the combined entity will hold $1.06B of incremental Tier 1 capital against $720M of consideration. The capital is risk-adjusted appropriately for the post-close balance sheet and leaves a $340M cushion for either organic loan growth or future inorganic activity.
`,
};

const MA_REVERSE_MERGER: SampleBundle = {
  slug: 'ma-reverse-merger-cross-border',
  role: 'ma',
  title: 'Reverse-merger IC memo with cross-border exposure',
  summary:
    'Reverse-merger structure with US listing + EU operating entity. Multi-jurisdictional governance variance.',
  hookCopy:
    'Cross-border reverse mergers are where most diligence holes hide — paste it and see.',
  marketContext: 'cross_border',
  regulatoryTag: 'SEC Reg D · GDPR · UK FCA',
  expectedBiases: [
    'narrative_fallacy',
    'overconfidence_bias',
    'optimism_bias',
    'planning_fallacy',
    'familiarity_bias',
  ],
  expectedDqi: 51,
  content: `# Project Crossfield — Investment Committee Memo

## Transaction Summary

Recommend approval of the reverse merger between our US-listed shell entity ("Acquirer") and Crossfield Technologies ("Target"), a UK-domiciled enterprise software company. Combined entity to be listed on Nasdaq under the existing ticker; principal operations remain in London with a US sales office of 18 FTEs.

Aggregate consideration: $214M, structured as 100% stock at a fixed exchange ratio. Combined enterprise value at announcement: $1.1B. Closing target: Q2 2026.

## Strategic Rationale

Crossfield's enterprise platform is the leading European entrant in our adjacent vertical, with 142 mid-market customers (UK, Germany, France, Netherlands) and an ARR of $36M growing at 41% YoY. The combination gives us:

- An immediate European footprint that would take 36 months to build organically.
- A development team of 84 engineers with deep specialty expertise we do not have in-house.
- A path to a US public listing for Crossfield without going through an independent IPO process.

The reverse-merger structure is favored over a direct acquisition because (a) it preserves Crossfield's UK operating entity and tax structure, (b) it avoids a US IPO timeline that would be 12-18 months longer, and (c) it allows the combined entity to retain Crossfield's senior leadership in operating roles.

## Governance & Structure

Combined-entity governance:
- Board: 9 seats. Our nominees: 5. Crossfield nominees: 3. One independent director jointly nominated.
- CEO: Crossfield CEO, currently based in London, will assume the combined-entity CEO role effective on close.
- CFO: Our existing CFO, based in New York.
- Operating entity: Crossfield UK Ltd remains the principal operating entity; our existing US shell entity becomes the listed parent.

The UK/US split is structured to optimize for: SEC reporting compliance (US shell), GDPR data-handling (UK entity for European customer data), and UK tax residency (Crossfield retains qualifying R&D credits worth $4-6M annually).

## Regulatory Considerations

**SEC:** The reverse-merger structure triggers a Form S-4 filing; we anticipate a 90-120-day SEC review. Our outside counsel (Cravath) has confirmed the deal is structurally compliant with Rule 144 resale restrictions.

**UK FCA:** Crossfield is not currently FCA-regulated, but two of its enterprise customers are; we have confirmed there are no change-of-control consents required.

**GDPR:** Crossfield maintains a UK Data Protection Officer; the combined entity will retain this role and add a US-based Privacy Counsel reporting to the General Counsel. Customer data remains within the UK/EU under Crossfield's existing infrastructure.

**SEC AI Disclosure:** Crossfield's platform uses ML for product features; we have begun a review under the proposed SEC AI-disclosure rulemaking and anticipate disclosing the use cases in the combined-entity 10-K.

## Financial Profile

| Metric        | Acquirer | Crossfield | Combined PF |
|---------------|----------|------------|-------------|
| ARR           | $84M     | $36M       | $120M       |
| Growth (YoY)  | 22%      | 41%        | 28% blended |
| Gross margin  | 79%      | 84%        | 81% blended |
| EBITDA margin | 18%      | -4%        | 12% blended |
| Net cash      | $194M    | $42M       | $236M       |

Crossfield's negative EBITDA margin reflects ongoing investment in product expansion; we have stress-tested the combined model at flat investment and the entity is EBITDA-positive at 22% within 18 months of close.

## Synergy Model

We have NOT modelled meaningful cost synergies from the combination. Our view is that Crossfield's product velocity is the primary source of value, and that velocity depends on retaining the engineering team and operating model.

Revenue synergies are modelled at $5-8M ARR by year three, driven by cross-sell of Crossfield's specialty modules to our US customer base.

## Risks Considered

**Currency:** Approximately 60% of combined revenue will be GBP/EUR-denominated. We have entered a one-year FX hedging program covering 50% of forecast non-USD revenue. Beyond year one, we plan to revisit hedging policy with the Board.

**Talent retention:** Crossfield's CTO and VP Engineering are critical. Both have signed retention packages with three-year vesting; both have publicly endorsed the combination.

**Integration:** We have deliberately limited integration scope to back-office consolidation (finance, HR systems, investor relations). Operational integration of product or engineering is NOT planned.

## Recommendation

We recommend IC approval of the Project Crossfield reverse merger at $214M aggregate consideration, with closing in Q2 2026 conditional on the Form S-4 SEC review and the standard regulator clearances above.

## Appendix: Customer Concentration

Crossfield's top-10 customers represent 38% of ARR. Top-3 represent 19%. We have spoken with all top-10 customers; eight have indicated they expect the combination to be net-positive for them, two are neutral.
`,
};

// ─── BizOps bundle (3) ──────────────────────────────────────────────

const BIZOPS_REPLATFORM_BILLING: SampleBundle = {
  slug: 'bizops-replatform-billing',
  role: 'bizops',
  title: 'Should we re-platform billing?',
  summary:
    'Buy-vs-build framing on a 14-month internal billing migration with vendor lock-in and migration risk.',
  hookCopy:
    'The classic "buy or build" memo — paste it and see how the audit re-frames the build case.',
  expectedBiases: [
    'overconfidence_bias',
    'planning_fallacy',
    'optimism_bias',
    'familiarity_bias',
    'sunk_cost_fallacy',
  ],
  expectedDqi: 50,
  content: `# Strategic Decision Memo — Billing Platform Re-architecture

## Recommendation

We recommend the company invest $4.6M and 14 months in re-platforming our billing system onto our own internal infrastructure, replacing the current third-party SaaS provider (Vendor X) at contract renewal in Q4 2026. We project annual run-rate savings of $1.8M from year two and substantially improved product velocity on billing-adjacent features.

## Background

We have used Vendor X's billing platform since our 2018 founding. Annual fees have grown from $0.4M (FY19) to $2.1M (FY26) — a 26% CAGR driven by both volume growth and Vendor X's annual price increases (averaging 14% per year). At our current trajectory, Vendor X spend hits $3.4M by FY28.

Vendor X has historically been a strong partner. Their platform handles our subscription, usage-based, and tiered-pricing models without modification, and their support team has been responsive to escalations. The integration into our application has been stable for the last 36 months.

## Strategic Rationale for Re-platforming

Three structural reasons argue for build-over-buy at this scale:

1. **Run-rate economics:** A $4.6M one-time build replaces a $2.1M annual fee that compounds. Year-two ROI is ~25%; the 36-month total cost of ownership is materially lower under build.

2. **Product velocity:** Vendor X's roadmap consistently lags our needs. Three of our last four major billing-adjacent product launches required 90+ days of Vendor X-side work. An in-house platform aligns release velocity with our own.

3. **Optionality:** Vendor X's contractual data-extraction provisions are restrictive. Operating our own billing platform removes vendor lock-in entirely and gives us the option to spin out a billing-as-a-service offering for our enterprise customer base (a possibility we have discussed in roadmap reviews but never been able to pursue).

## Build Plan

The platform will be built by an existing internal team of seven engineers led by our Head of Platform, who has built and operated payment infrastructure at two prior companies. We have assigned an additional three engineers from our payments-infrastructure team for the migration phase.

Plan:

- **Months 0-4:** Architecture & infrastructure stand-up. Database schema, API surface, ledger primitives.
- **Months 4-9:** Subscription & invoicing engine. Tax calculation, dunning, retry logic.
- **Months 9-12:** Migration tooling, parallel-run with Vendor X.
- **Months 12-14:** Cutover, dual-write retirement.

Total build cost: $4.6M (engineering opex of $3.8M + $0.5M cloud infrastructure + $0.3M third-party fraud/tax services).

## Comparable Reference

Our payments-infrastructure team built our payment-processing platform in 2022 ($2.4M, 9 months) and our fraud-detection platform in 2024 ($1.6M, 6 months). Both are operating reliably today. The team's track record is the principal evidence that the 14-month timeline is achievable.

## Cutover Risk

We have built a four-month parallel-run window into the plan. During this window, every transaction routes through both Vendor X and the new platform. Reconciliation discrepancies above 0.05% trigger an automatic rollback flag. If we cannot achieve sub-0.05% discrepancy by month 14, we will renew Vendor X for an additional 12-month term and continue the build.

## Risks Considered

**Timeline overrun:** Our last two infrastructure builds came in slightly under budget but 1-2 months over the planned timeline. We have built a one-month buffer into the cutover window.

**Tax compliance:** Vendor X handles sales-tax calculation across 47 US states and four EU jurisdictions. We will retain a third-party tax-calculation service (Avalara) to handle tax computation, with the new platform calling out to Avalara for every invoice. This is the same architecture our payments-processing platform uses today.

**Customer disruption:** A two-week customer-communication campaign will precede cutover. We do not anticipate customer-facing disruption — invoices will continue to be issued on the same cadence and through the same email infrastructure.

## Recommendation

Approve the $4.6M, 14-month billing-platform re-architecture, with a target cutover date of Q4 2026 aligned to the Vendor X contract renewal.

## Appendix: Vendor X Renewal Terms

Vendor X's standard renewal terms include a 12% annual price escalator and an extended 36-month commitment. If we do not give 90-day notice of non-renewal by Q3 2026, we are auto-renewed into a 36-month term at $2.4M annual base.
`,
};

const BIZOPS_RD_BUDGET: SampleBundle = {
  slug: 'bizops-fy26-rd-budget',
  role: 'bizops',
  title: 'FY26 budget memo: increase R&D spend by 30%',
  summary:
    'Budget recommendation increasing R&D from 18% to 23% of revenue, anchored to a high-yielding 2024 cohort.',
  hookCopy:
    'Most R&D-yield arguments anchor to one good cohort — paste this to see how the audit frames the rest of the curve.',
  expectedBiases: [
    'survivorship_bias',
    'anchoring_bias',
    'overconfidence_bias',
    'availability_heuristic',
    'narrative_fallacy',
  ],
  expectedDqi: 53,
  content: `# FY26 Budget Memo — R&D Spend Recommendation

## Recommendation

We recommend the FY26 budget include an R&D spend of $94M, representing 23% of forecast FY26 revenue and a 30% increase over FY25. The incremental $21.8M will fund three new program areas (Platform Modernization, Specialty Product Lines, Vertical AI) and support an additional 64 engineering FTEs.

## Background

Our R&D spend has grown from $52M in FY22 to $72M in FY25, tracking revenue growth at roughly 18% of revenue. Over the same period, R&D yield (defined as new-product revenue 24 months after launch divided by R&D investment) has averaged 1.4x.

The 2024 R&D cohort, which delivered the Specialty SKU expansion, returned 2.3x — substantially above the trailing average. The 2024 cohort outperformance is the load-bearing data point for this recommendation: if we can replicate that yield in FY26, the incremental $21.8M generates $50M of new-product revenue by FY28.

## Why Now

Three structural reasons argue for an R&D step-change in FY26:

1. **Engineering hiring velocity has improved.** We hired 38 senior engineers in H2 FY25 against a plan of 30. The pipeline for FY26 hiring is the strongest we have seen in three years.

2. **Three new program areas are pipeline-ready.** Platform Modernization (technical debt retirement and infrastructure consolidation), Specialty Product Lines (extensions of the 2024 cohort), and Vertical AI (industry-specific ML applications) are each at the architecture-design stage and need additional capacity to ship in FY26.

3. **Competitive dynamics:** Our two largest competitors increased R&D spend by 28% and 34% respectively in their most recent fiscal years. Maintaining our 18% revenue ratio risks falling behind on product velocity.

## Program-Level Allocation

| Program                 | FY25 Spend | FY26 Spend | Δ      | Yield Target (24mo) |
|-------------------------|------------|------------|--------|---------------------|
| Core Platform           | $34M       | $36M       | +6%    | 1.5x                |
| Platform Modernization  | $0M        | $14M       | new    | n/a (debt retirement)|
| Specialty Product Lines | $22M       | $26M       | +18%   | 2.0x                |
| Vertical AI             | $4M        | $12M       | +200%  | 1.8x                |
| Other                   | $12M       | $6M        | -50%   | 1.0x                |
| **Total**               | **$72M**   | **$94M**   | +30%   | 1.7x blended        |

The Specialty Product Lines extension and the Vertical AI initiative together represent $26M of incremental investment. These are the programs most directly tied to the 2024 cohort's outperformance.

## Yield Forecast

We model the FY26 cohort returning a blended 1.7x yield over 24 months — above our trailing average (1.4x) but below the FY24 cohort outperformance (2.3x). The upside scenario (achieving 2.0x yield) returns $188M of new-product revenue by FY28; the downside scenario (1.2x yield) returns $113M.

## Risks Considered

**Yield reversion:** R&D yield is volatile year-over-year. The FY24 cohort's 2.3x outperformance may not be repeatable. Our model assumes mean reversion toward 1.7x rather than persistent 2.3x performance.

**Hiring execution:** The 64-FTE plan depends on continued strong engineering hiring. If we miss the H1 hiring plan by more than 20%, we will redirect the unspent capital into customer-success investment rather than carrying open headcount.

**Product-market fit on Vertical AI:** Vertical AI is the most speculative program area. The $12M is structured as a stage-gated investment, with a $4M phase-one budget and a Q3 FY26 review before releasing the remaining $8M.

## Recommendation

Approve the FY26 R&D budget at $94M, with the program-level allocation above and the FY26 mid-year yield review as the principal control point.

## Appendix: Historical R&D Yield

| Cohort | Spend | 24-month yield |
|--------|-------|----------------|
| FY21   | $42M  | 1.3x           |
| FY22   | $52M  | 1.5x           |
| FY23   | $61M  | 1.2x           |
| FY24   | $66M  | 2.3x           |
| FY25   | $72M  | TBD (in flight)|
`,
};

const BIZOPS_EMEA_SHUTTER: SampleBundle = {
  slug: 'bizops-emea-shutter',
  role: 'bizops',
  title: 'Should we shutter the EMEA hub?',
  summary:
    'Sunk-cost vs rationalisation memo on a five-year EMEA office investment that has not delivered the original thesis.',
  hookCopy:
    'A five-year office investment that hasn’t paid back — see how the audit frames the close-down case.',
  expectedBiases: [
    'sunk_cost_fallacy',
    'escalation_of_commitment',
    'optimism_bias',
    'confirmation_bias',
    'familiarity_bias',
  ],
  expectedDqi: 48,
  content: `# Strategic Decision Memo — EMEA Hub Status & Path Forward

## Recommendation

We recommend the company maintain the EMEA hub at its current scale through FY26 and conduct a renewed evaluation in Q1 FY27. We do NOT recommend a full closure at this time, despite the underperformance against the original 2021 thesis.

## Background

The EMEA hub was opened in Dublin in 2021 with a five-year plan to establish a regional revenue base of $20M ARR by year five and a regional operating profit by year four. We have invested $14.2M cumulatively (operating costs net of regional revenue) over five years.

Year-five performance against the plan:

| Metric                        | Plan     | Actual  | Delta   |
|-------------------------------|----------|---------|---------|
| Regional ARR                  | $20.0M   | $7.6M   | -62%    |
| Regional operating loss/profit| $1.5M    | -$3.8M  | n/a     |
| Regional headcount            | 28       | 23      | -18%    |
| Customer count                | 86       | 31      | -64%    |

The hub is materially under-performing against the original plan. Year-five revenue is at the level we projected for year three.

## Why We Recommend Continuing

Five reasons.

1. **Reputation:** EMEA has been our highest-NPS region for the last three years. Customer-side feedback about our European service quality is consistently the strongest in the company. Closing the hub would damage a hard-earned regional reputation.

2. **Path-dependence on enterprise sales:** Our European enterprise pipeline has lengthened as we have invested more time in market — early deals took 14 months, current pipeline averages 9 months. A closure would reset this learning curve to zero.

3. **Strategic optionality:** The European market is structurally important for our product category. Even at $7.6M ARR, we are present in markets that would otherwise require a 24-36 month re-establishment if we exit and return.

4. **Incremental cost:** Maintaining the hub at current scale costs $4.2M annually. The marginal cost of one additional year of operation is low relative to the strategic optionality it preserves.

5. **Macro:** The European industrial-services market has been challenging since 2023. The 2024-2025 GDP slowdown has hit our segment particularly hard. As macro conditions normalize, we expect demand acceleration.

## What Would Trigger Closure

We propose three triggers that, if met by Q1 FY27, would shift our recommendation to closure:

- Regional ARR below $9M.
- Net new logos in FY26 below 10.
- Regional operating loss exceeding $5M for FY26.

If any two of three are breached, we will recommend closure with a 12-month wind-down beginning Q3 FY27.

## Cost of Continuation

The current run-rate cost is $4.2M / year operating loss. Continuing through FY27 at flat headcount adds $4.2M to cumulative investment, bringing total invested capital to $18.4M.

A full closure today would cost $2.4M (severance, real-estate exit, customer-transition support). Closing in 12 months under the trigger framework would cost approximately the same.

## Comparable Reference

Our APAC hub (opened 2019) underperformed in years 1-3, was held at minimal scale for two additional years, and is now profitable. The patience that produced the APAC outcome is the load-bearing precedent for the recommendation.

## Risks Considered

**Continued underperformance:** The most realistic risk is that FY26 looks like FY25, and we end the year with another $4.2M of accumulated loss and no clear improvement signal. The trigger framework above is designed to limit this risk.

**Talent attrition:** Two of our 23 EMEA team members have given notice in the last six months. If three more leave in FY26, the operational capacity argument for keeping the hub erodes substantially.

**Opportunity cost:** The $4.2M annual cost is real capital that could be redeployed to higher-yielding programs. We accept this opportunity cost for one additional year given the strategic optionality argument.

## Recommendation

Maintain the EMEA hub at current scale through FY26. Conduct a comprehensive Q1 FY27 review against the trigger framework. If at least two triggers are breached, recommend closure with a 12-month wind-down.

## Appendix: Cumulative Investment History

FY21: $1.6M (year one operating loss)
FY22: $2.4M (year two operating loss + headcount expansion)
FY23: $3.4M (year three operating loss)
FY24: $3.0M (FY24 macro pressure)
FY25: $3.8M (FY25 underperformance)
Cumulative: $14.2M
`,
};

// ─── PE / Venture / Fund bundle (2) ─────────────────────────────────

const PE_LAGOS_CONSUMER_ROLLUP: SampleBundle = {
  slug: 'pe-lagos-consumer-rollup',
  role: 'pe_vc',
  title: 'Lagos consumer-staples roll-up — preliminary IC memo',
  summary:
    'Pan-African consumer-staples roll-up across Lagos, Accra and Nairobi with a 5-year exit thesis anchored on FY24 EBITDA multiples and a $42M ticket.',
  hookCopy:
    'Fund analysts paste this when their IC is one week away and the deal team is anchoring on a single comparable transaction.',
  marketContext: 'emerging_market',
  expectedBiases: [
    'anchoring_bias',
    'overconfidence_bias',
    'confirmation_bias',
    'narrative_fallacy',
    'optimism_bias',
  ],
  expectedDqi: 49,
  content: `# Preliminary IC Memo — Project Baobab (Pan-African Consumer Staples Roll-Up)

**Prepared by:** Pan-African Investments — Lagos Office
**Date:** 28 March 2026
**IC Date:** 4 April 2026
**Recommendation:** Approve $42M Series-A roll-up vehicle, 60% equity / 40% mezzanine

## Executive Summary

We recommend the IC approve a $42M ticket into a roll-up vehicle (NewCo) acquiring three regional consumer-staples businesses across Nigeria, Ghana and Kenya. The vehicle targets a 4.2x MOIC over five years via operational integration, regional brand consolidation and an exit to a strategic FMCG acquirer in 2030-31. The thesis is anchored on the 2024 Tiger Brands acquisition of Empresas Polar's Nigerian subsidiary (5.8x EV/EBITDA multiple).

## The Three Targets

**Target 1 — Lagos beverages (Nigeria):** $18M acquisition. NGN-denominated revenue of ₦12.4Bn (~$8.2M at current naira rates), FY24 EBITDA margin of 14%. Founder-led; no formal IFRS audit before 2023.

**Target 2 — Accra snacks (Ghana):** $14M acquisition. GHS-denominated revenue of ₵38M (~$3.1M at GHS 12.3:USD), FY24 EBITDA margin of 18%. Strong distribution network across 4 regions; minority Bank of Ghana stake.

**Target 3 — Nairobi sauces & condiments (Kenya):** $10M acquisition. KES-denominated revenue of KSh 420M (~$3.2M at KES 130:USD), FY24 EBITDA margin of 11%. Two-product concentration (75% of revenue from one SKU).

Combined FY24 revenue ~$14.5M; combined EBITDA ~$2.0M; entry multiple 21x EBITDA — justified by integration synergies.

## Why Now

Tiger Brands' 2024 acquisition demonstrates strategic-acquirer appetite for Pan-African consumer brands at premium multiples. Their entry establishes the comp set for our exit thesis. The 2025-26 window is uniquely favourable because:

1. The naira-cedi-shilling tri-currency basket has stabilised since the H1 2024 Nigeria FX-liberalisation.
2. AfCFTA single-market provisions came into force Q4 2025, lowering intra-regional tariffs by an average of 12%.
3. Nestlé and Diageo have both signalled Africa-strategy refreshes for 2027-28; we expect strategic-buyer pipeline to be deep when we exit.

## Synergies

We model $1.8M of run-rate synergies achieved by Year 3:
- Procurement consolidation (palm oil, sugar, packaging): $0.7M annually
- Shared distribution into Cotonou + Abidjan via WAEMU corridor: $0.5M
- Centralised finance + accounting service in Lagos: $0.3M
- Regional brand investment lifting realised pricing: $0.3M

## Exit Thesis

Exit in 2030 at $186M (4.2x MOIC) assumes:
- Combined Year-5 revenue of $32M (CAGR ~17% from current $14.5M)
- Year-5 EBITDA margin expansion to 22% (+5pp from current blended ~14%)
- Exit multiple of 8x EBITDA (+30% premium to entry, justified by regional scale + strategic-buyer competition)
- Strategic acquirer outcome (either Tiger Brands, Diageo, Nestlé, or a Pan-African strategic; we have informal indications from two of four)

## Risks

**FX risk:** All three targets generate revenue in local currency; we underwrite in USD. FY24 brought a 38% naira devaluation — the risk is not symmetric. We propose hedging the first 18 months of cash flow forward via FMDQ-listed naira FX forwards (CBN I&E window) and CFA-zone forwards through a regional bank counterparty.

**Regulatory risk:** Nigeria's Federal Competition and Consumer Protection Commission (FCCPC) requires merger notification above ₦1Bn; we will file before close. CMA Kenya approval expected within 90 days based on comparable transactions.

**Concentration risk:** The Nairobi target derives 75% of revenue from a single SKU. We have a Year-1 plan to launch two adjacent SKUs leveraging the existing distribution network.

**Operational integration:** Three founder-led businesses across three countries with different management cultures. We will install a CFO and a VP Operations in Year 1.

## Comparable Transactions

The 2024 Tiger Brands / Empresas Polar Nigeria acquisition is our anchor comp at 5.8x EV/EBITDA. Other relevant Pan-African consumer-staples comparables:
- Kasapreko (Ghana) — 2023 minority stake at 6.1x EV/EBITDA
- Bidco Africa (Kenya) — 2022 secondary at 7.4x EV/EBITDA

We are confident the 8x exit multiple is achievable.

## Track Record

Our last three Pan-African consumer roll-ups returned 3.1x, 4.7x and 2.8x — average 3.5x. We are comfortable underwriting Project Baobab at 4.2x given the AfCFTA tailwind and the more favourable FX environment.

## Investment Committee Ask

We recommend the IC approve:
- $42M ticket ($25M equity, $17M mezzanine)
- 5-year hold, 7-year hard cap
- LP capital calls in Q2 2026 (60%) and Q4 2026 (40%)
- 2% management fee on committed capital, 20% carry above 8% IRR hurdle

Recommendation: APPROVE.`,
};

const PE_KENYA_FINTECH_GROWTH: SampleBundle = {
  slug: 'pe-kenya-fintech-growth',
  role: 'pe_vc',
  title: 'Series-B growth round — Nairobi neo-bank, $30M ticket',
  summary:
    'Pre-IC memo for a $30M Series-B into a Nairobi-headquartered SME-lending neo-bank, anchored on user-growth extrapolation and one peer transaction.',
  hookCopy:
    'PE / VC investors paste this when the growth-round CIM is making confident claims about regulatory tailwinds the analyst has not stress-tested.',
  marketContext: 'emerging_market',
  regulatoryTag: 'CMA Kenya · CBK · CBN',
  expectedBiases: [
    'overconfidence_bias',
    'narrative_fallacy',
    'survivorship_bias',
    'availability_heuristic',
    'planning_fallacy',
  ],
  expectedDqi: 54,
  content: `# Pre-IC Memo — Project Tilapia (Series-B Investment in Nairobi-HQ Neo-Bank)

**Fund:** Sahel Growth Capital II
**Prepared by:** Investment Team, Lagos
**Date:** 18 March 2026
**IC Date:** 25 March 2026
**Ticket:** $30M Series-B participation (lead)
**Recommendation:** APPROVE with conditions

## Executive Summary

Project Tilapia is a Nairobi-headquartered SME-lending neo-bank operating in Kenya, Uganda, Nigeria and (planned 2026) Ghana. The company has grown active SME loans from 4,200 in Q1 2024 to 31,800 in Q4 2025 (CAGR 198%). Loan book stands at $48M with 6.2% non-performing loans (NPL); deposit book at $112M with a 1.4x loan-to-deposit ratio inverse. We recommend a $30M Series-B at $180M post-money valuation (16x trailing revenue), leading the round alongside three co-investors.

## Investment Thesis

The thesis rests on four pillars:

**1. SME under-banking gap.** ~63% of African SMEs lack access to formal credit. Tilapia's average loan size ($8,400) sits in the sweet-spot — too small for traditional banks, too large for microfinance. We estimate the Pan-African TAM at $36Bn over 5 years.

**2. Regulatory tailwinds.** The Central Bank of Kenya (CBK) has signalled support for digital-first SME lending under the 2024 Banking (Amendment) Act. The Central Bank of Nigeria's Open Banking framework went live Q4 2025. We expect more African regulators to follow within 18-24 months.

**3. Best-in-class unit economics.** Tilapia's CAC is $42 against an LTV of $640 (LTV:CAC of 15.2x), driven by referral-led growth and zero-marketing-spend Q3-Q4 2025. Net interest margin of 11.4% is the highest in the African neo-banking peer set.

**4. Exit liquidity.** The Q3 2025 IPO of EgyptBank (3.8x revenue at IPO, now at 4.6x) and the rumoured 2027 IPO of an Egyptian SME lender create a credible public-market exit path. Strategic acquirer interest from Standard Bank and Equity Group has been informally signalled.

## Growth Modeling

We model:
- 2026 active SMEs: 78,000 (+145% YoY)
- 2027 active SMEs: 195,000 (+150% YoY)
- 2028 active SMEs: 425,000 (+118% YoY)
- 2029 active SMEs: 870,000 (+105% YoY)

The growth-rate decay curve is conservative — most peers in our internal database held >150% YoY growth through Year 4 of operations. Tilapia is in Year 3.

Loan book modelling: $48M (now) → $180M (2026) → $410M (2027) → $720M (2028) → $1.2Bn (2029). Implied LTM revenue: $7M (now) → $18M (2026) → $42M (2027) → $78M (2028) → $135M (2029).

At Year-4 exit (2030), we model $1.6Bn loan book / $185M revenue / $58M EBITDA. Exit multiple of 14x EBITDA = $812M enterprise value. Our $30M today returns $135M at exit (4.5x MOIC, 35% gross IRR).

## Comparable Transactions

The most relevant comp is the Q3 2025 EgyptBank IPO (3.8x revenue at IPO, ~$1.4Bn market cap). EgyptBank is a deposit-led full-stack neo-bank, not a pure SME lender, but the operational comparison is the closest available in the African neo-banking peer set.

## Risks

**Regulatory risk.** SME lending across four jurisdictions creates four-way regulatory exposure. The CBN requires Nigerian deposit-taking institutions to maintain a 30% liquidity ratio that Tilapia does not yet meet. Management has flagged this as a 2026 priority.

**Asset quality.** NPL of 6.2% sits above the 4.5% Pan-African neo-bank average. Management argues this is driven by the seasoning of late-2024 vintages and will compress to 4.0% by Q4 2026 as the loan-book mix shifts.

**Currency mismatch.** Loan book is locally denominated; equity raise is USD. We model a 12% annual basket-currency depreciation against USD; the actual realised depreciation in 2024-25 was 18% and 9% respectively.

**Concentration.** 41% of the loan book is to Kenyan SMEs in agriculture / agro-processing. A drought-year (last seen 2022) would test asset quality.

## Why $180M Post-Money

Anchored to:
- 16x LTM revenue ($7M LTM × 16 = $112M, then a 60% premium for the demonstrated growth trajectory)
- The Q3 2025 EgyptBank IPO at 3.8x revenue (we apply a 4x premium to private SaaS-comparable multiples)

The 16x revenue multiple is justifiable given the growth rate and unit economics.

## Recommendation

We recommend the IC approve a $30M Series-B participation with the following conditions:
1. Tilapia must close the CBN liquidity ratio gap by Q3 2026.
2. NPL must be benchmarked at 5.0% within 18 months; breach triggers a board observer seat.
3. We require pre-emptive rights on a Series-C up to $20M.
4. ESG diligence on the SME borrower profile must complete pre-close.

Recommendation: APPROVE WITH CONDITIONS.`,
};

// ─── Public exports ─────────────────────────────────────────────────

export const SAMPLE_BUNDLES: readonly SampleBundle[] = [
  CSO_BRAZIL_ENTRY,
  CSO_PHOENIX_DEFER,
  CSO_REGULATORY_ACQUISITION,
  MA_PROJECT_ATLAS,
  MA_BANK_DILIGENCE,
  MA_REVERSE_MERGER,
  BIZOPS_REPLATFORM_BILLING,
  BIZOPS_RD_BUDGET,
  BIZOPS_EMEA_SHUTTER,
  PE_LAGOS_CONSUMER_ROLLUP,
  PE_KENYA_FINTECH_GROWTH,
] as const;

export const SAMPLE_BUNDLES_BY_SLUG: Readonly<Record<string, SampleBundle>> =
  Object.fromEntries(SAMPLE_BUNDLES.map(b => [b.slug, b]));

export function bundlesForRole(role: SampleRole | null | undefined): SampleBundle[] {
  if (!role) {
    // Show one of each so a fresh visitor without role still sees the
    // breadth.
    return [SAMPLE_BUNDLES[0], SAMPLE_BUNDLES[3], SAMPLE_BUNDLES[6], SAMPLE_BUNDLES[9]];
  }
  if (role === 'other') {
    return [SAMPLE_BUNDLES[0], SAMPLE_BUNDLES[3], SAMPLE_BUNDLES[6], SAMPLE_BUNDLES[9]];
  }
  return SAMPLE_BUNDLES.filter(b => b.role === role);
}

export const ROLE_LABEL: Record<SampleRole, string> = {
  cso: 'Corporate Strategy',
  ma: 'M&A / Corp Dev',
  bizops: 'BizOps / FP&A',
  pe_vc: 'PE / Venture / Fund',
  other: 'Mixed selection',
};
