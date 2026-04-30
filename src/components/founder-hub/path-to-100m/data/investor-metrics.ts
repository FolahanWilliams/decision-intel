/**
 * InvestorMetricsTracker consumer data — 17 metrics with current state,
 * 12mo target, tripwires (incl. Platform Calibration Credibility, the
 * seed Brier baseline derived from the 143-case library — F1 lock
 * 2026-04-29). Split out from monolithic data.ts at F2 lock 2026-04-29.
 *
 * Source synthesis: 2026-04-27 16-investor-metrics NotebookLM pass +
 * 2026-04-29 platform calibration baseline addition.
 */

export type InvestorMetric = {
  id: string;
  category: 'business' | 'product' | 'presentation';
  rank: number;
  name: string;
  whatItIs: string;
  diCurrent: string;
  diTarget12mo: string;
  whyItMatters: string;
  computeMethod: string;
  tripwire: string;
  status: 'on_track' | 'gap' | 'unbuilt';
};

export const INVESTOR_METRICS: InvestorMetric[] = [
  // Business + Financial Metrics (8)
  {
    id: 'bookings_vs_revenue',
    category: 'business',
    rank: 1,
    name: 'Bookings vs. revenue',
    whatItIs:
      'Bookings = strict contractual obligation for a customer to pay. Revenue = service actually delivered + revenue recognized. Verbal agreements (e.g., Sankore "we are interested") are NEITHER.',
    diCurrent:
      'Zero contracted bookings · zero recognized revenue · multiple verbal agreements pending',
    diTarget12mo:
      '3-5 paid design partners contracted · £180K-£420K bookings · ratable revenue recognition',
    whyItMatters:
      'Investors will ignore "verbal interest" entirely. The first contract is the first real signal — only paid commitments count.',
    computeMethod:
      'Bookings: sum of all signed contract values (annualized for SaaS). Revenue: amount recognized per accounting period.',
    tripwire:
      'If 90 days pass with zero contracted bookings, the conversion conversation is broken. Pause shipping, force the close.',
    status: 'unbuilt',
  },
  {
    id: 'arr_mrr',
    category: 'business',
    rank: 2,
    name: 'Annual Recurring Revenue / Monthly Recurring Revenue',
    whatItIs:
      'ARR = annualized contract value of recurring subscriptions. MRR = monthly value. Excludes one-off services / consulting.',
    diCurrent: '£0 ARR · £0 MRR',
    diTarget12mo: '£70-90K ARR (3 design partners × £2,499/mo) → £950K-1.6M ARR by Q4 2027',
    whyItMatters:
      'ARR / MRR scales 5-10× more than one-off professional-services revenue. Investors weight ARR heavily for SaaS valuations (8-15× ARR multiples at Series A).',
    computeMethod:
      'Sum of (active monthly subscription value) × 12 = ARR. Monthly active subscription value = MRR.',
    tripwire:
      'If MRR plateaus for 3+ months without organic growth, GTM motion is broken. Diagnose: pricing? targeting? friction?',
    status: 'unbuilt',
  },
  {
    id: 'gross_profit',
    category: 'business',
    rank: 3,
    name: 'Gross Profit (and Gross Margin)',
    whatItIs:
      'Revenue minus direct cost of revenue (COGS). For SaaS: hosting, third-party APIs, payment processing.',
    diCurrent: 'N/A (zero revenue)',
    diTarget12mo:
      '~90% blended gross margin · honest math per CLAUDE.md (Individual typical 95%, Strategy typical 95%, Enterprise 70-88%)',
    whyItMatters:
      '90% is elite SaaS territory. It signals that every £1 of incremental revenue funds growth, not COGS. Use the honest blended figure (not the 97% ghost-user math) in every investor conversation.',
    computeMethod:
      '(Revenue - direct COGS) / Revenue. Direct COGS for DI: ~£0.30-0.50/audit Gemini cost + Vercel + Supabase + Resend + sentry.',
    tripwire:
      'If actual gross margin drops below 75% blended, scale economics are broken. Investigate: new model costs? higher API tier? whale-customer Drive polling?',
    status: 'on_track',
  },
  {
    id: 'tcv_acv',
    category: 'business',
    rank: 4,
    name: 'Total Contract Value / Annual Contract Value',
    whatItIs: 'TCV = entire contract length value. ACV = annualised contract value (TCV / years).',
    diCurrent: 'Target ACV: £30K (Strategy tier) for design partners; £80-200K for F500 enterprise',
    diTarget12mo:
      'ACV growth from £30K (wedge design partners) to £80-150K (F500 expansion) over 18 months',
    whyItMatters:
      'ACV growth signals upsell + procurement-grade positioning. Investors look for ACV expansion as a leading indicator of category-leadership.',
    computeMethod:
      'TCV: sum of all multi-year contracted commitments. ACV: TCV / contract length in years.',
    tripwire:
      'If ACV stays at £30K across all contracts, expansion motion is broken. F500 conversations should drive £80K+.',
    status: 'unbuilt',
  },
  {
    id: 'ltv',
    category: 'business',
    rank: 5,
    name: 'Lifetime Value (LTV)',
    whatItIs: "Net profit generated per customer across the customer's entire lifetime.",
    diCurrent: 'N/A (no live customers)',
    diTarget12mo: 'Modeled LTV: £30K ACV × ~90% margin / 10% annual churn = £270K LTV (elite SaaS)',
    whyItMatters:
      'LTV / CAC is the unit-economics story investors fund. £270K LTV against ~£10K CAC = 27× LTV/CAC ratio (target is >3×).',
    computeMethod: '(ACV × Gross Margin) / Annual Churn Rate.',
    tripwire:
      'If actual annual churn exceeds 15%, the LTV story collapses fast. Watch outcome-gate-enforcement adoption + design-partner satisfaction quarterly.',
    status: 'unbuilt',
  },
  {
    id: 'unearned_billings',
    category: 'business',
    rank: 6,
    name: 'Unearned (Deferred) Revenue + Billings',
    whatItIs:
      'Unearned: cash collected but not yet recognized as revenue (e.g., annual prepay). Billings = Revenue + Δ deferred revenue.',
    diCurrent: '£0 unearned · £0 billings',
    diTarget12mo:
      'For F500 customers prepaying annually, deferred revenue + billings becomes the forward-looking SaaS-health indicator',
    whyItMatters:
      'Billings is a stronger forward-looking indicator than revenue alone — it shows what the customer base has committed to, not just what has been recognized.',
    computeMethod: 'Billings = Revenue (period) + (Deferred Revenue end - Deferred Revenue start).',
    tripwire:
      'If billings consistently lag revenue, customers are not pre-paying — usually a contract-length issue (everything is monthly, not annual).',
    status: 'unbuilt',
  },
  {
    id: 'cac',
    category: 'business',
    rank: 7,
    name: 'Customer Acquisition Cost (CAC) — paid + blended',
    whatItIs:
      'Paid CAC: cost of paid acquisition channels per customer acquired. Blended CAC: total sales + marketing spend / customers acquired.',
    diCurrent:
      'Estimated: 100 hours × £100/hr founder time = £10K CAC per design partner (no paid marketing yet)',
    diTarget12mo:
      'Paid CAC <£15K via warm-intro + content motion · payback period ~4-5 months at £30K ACV with 90% margin',
    whyItMatters:
      'Investors look for paid CAC viability. £10-15K CAC against a £270K LTV is exceptional. The sub-12-month payback period is the unit-economics close.',
    computeMethod:
      'Paid CAC = Paid Marketing Spend / Customers Acquired (in same period). Blended CAC = (Sales + Marketing Spend) / Customers Acquired.',
    tripwire:
      'If paid CAC exceeds £25K without scaled paid channels, the GTM motion is over-reliant on founder time. Hire a GTM co-founder or paid-acquisition specialist.',
    status: 'gap',
  },
  {
    id: 'gmv_skip',
    category: 'business',
    rank: 8,
    name: 'GMV (Gross Merchandise Value) · NOT APPLICABLE',
    whatItIs: 'Total transaction volume on a marketplace.',
    diCurrent: 'N/A — DI is B2B SaaS, not a marketplace',
    diTarget12mo: 'N/A — never use GMV in DI investor conversations',
    whyItMatters:
      'Skip this metric entirely. Mentioning GMV in a SaaS pitch reads as confused or misleading.',
    computeMethod: 'N/A',
    tripwire: 'Never let an investor anchor on GMV — redirect to ARR / billings / bookings.',
    status: 'on_track',
  },

  // Product + Engagement Metrics (5)
  {
    id: 'active_users',
    category: 'product',
    rank: 9,
    name: 'Active Users (defined by audit velocity + outcome reporting)',
    whatItIs:
      'Define explicitly: NOT vanity logins. For DI, active = audit velocity + outcome reporting rate via the 409 Outcome Gate.',
    diCurrent: '0 active paying users',
    diTarget12mo: '3-5 design-partner orgs × ~20 audits/month + ≥40% outcome-reporting rate',
    whyItMatters:
      'Audit velocity proves the workflow stuck. Outcome reporting proves the data flywheel rotated. Together they prove DI is not shelfware.',
    computeMethod:
      'Audits per active user per month + (Outcomes Reported / Audits Run) per quarter.',
    tripwire:
      'If audits per user drop below 5/month sustained, the workflow integration broke (per Cloverpop manual-logging trap) — diagnose immediately.',
    status: 'gap',
  },
  {
    id: 'mom_growth',
    category: 'product',
    rank: 10,
    name: 'MoM Growth — Compounded Monthly Growth Rate (CMGR)',
    whatItIs:
      'Compounded Monthly Growth Rate (not simple averages). CMGR = ((Ending value / Starting value) ^ (1/months)) - 1.',
    diCurrent: 'N/A (no MRR yet)',
    diTarget12mo:
      'CMGR >15% on MRR for the first 12 months · slows to 8-12% as base grows · benchmark against pre-seed B2B median',
    whyItMatters:
      'Investors evaluate growth via CMGR to benchmark across cohorts. Simple month-over-month averages over-state growth on small bases.',
    computeMethod: '((End MRR / Start MRR) ^ (1/N months)) - 1, where N = number of months.',
    tripwire:
      'If CMGR drops below 8% sustained for 3 months, growth motion is broken. Diagnose pipeline + close-rate + ACV expansion.',
    status: 'unbuilt',
  },
  {
    id: 'churn',
    category: 'product',
    rank: 11,
    name: 'Churn — Gross + Net Revenue Churn',
    whatItIs:
      'Gross churn: actual MRR lost from cancellations. Net revenue churn: gross churn minus upsells / expansion. Negative net churn is the SaaS gold standard.',
    diCurrent: 'N/A (no live customers)',
    diTarget12mo:
      'Annual gross churn 5-10% · net revenue churn near-zero or negative as design partners expand seats',
    whyItMatters:
      'Cancellations grow exponentially with customer base — churn IS the ceiling on company size. Keeping it 5-10% prevents the ceiling from collapsing.',
    computeMethod:
      'Gross Annual Churn = (MRR Lost from Cancellations / MRR Start) × 12. Net Revenue Churn = (MRR Lost - MRR Expansion) / MRR Start × 12.',
    tripwire:
      'If gross annual churn exceeds 12%, the product is shelfware for some segment. Identify the churning segment and address (or deliberately exit it).',
    status: 'unbuilt',
  },
  {
    id: 'burn_rate',
    category: 'product',
    rank: 12,
    name: 'Burn Rate — Net + Gross Burn',
    whatItIs:
      'Net burn: actual cash burned per month (expenses minus revenue). Gross burn: total expenses regardless of revenue.',
    diCurrent:
      'Net burn: ~£1-2K/month (founder solo, mostly Gemini API + Vercel + Supabase + domain). Gross burn = Net burn (zero revenue offset).',
    diTarget12mo:
      'Maintain net burn under £5K/month pre-revenue · 12+ months runway by pre-seed close · target: 18 months at pre-seed',
    whyItMatters:
      'Long runway = leverage in negotiations. Investors prefer founders who do not need to close THIS quarter.',
    computeMethod: 'Net Burn = Total Expenses - Revenue. Gross Burn = Total Expenses.',
    tripwire:
      'If net burn exceeds £10K/month sustained pre-revenue, runway compresses. Cut: paid tools? unnecessary infrastructure? premature hires?',
    status: 'on_track',
  },
  {
    id: 'downloads_skip',
    category: 'product',
    rank: 13,
    name: 'Downloads · VANITY METRIC, SKIP',
    whatItIs: 'Number of times an app is downloaded.',
    diCurrent: 'N/A (DI is web-based, not a downloadable app)',
    diTarget12mo: 'N/A',
    whyItMatters:
      'Skip entirely. Mentioning downloads in a B2B SaaS pitch (no downloadable app) reads as confused.',
    computeMethod: 'N/A',
    tripwire:
      'Never let an investor anchor on downloads — redirect to active users + audit velocity.',
    status: 'on_track',
  },

  // Presentation Metrics (3)
  {
    id: 'cumulative_charts_skip',
    category: 'presentation',
    rank: 14,
    name: 'Cumulative Charts · NEVER USE',
    whatItIs: 'Charts showing total cumulative customers / revenue / users over time.',
    diCurrent: 'N/A',
    diTarget12mo:
      'NEVER use cumulative charts in pre-seed or seed decks — they always go up-and-to-the-right even when growth is decelerating.',
    whyItMatters:
      'Cumulative charts visually deceive. Investors who notice the chart trick weight against the founder. Use monthly new users / MRR instead.',
    computeMethod: 'Use Monthly New X (e.g., Monthly New MRR) charts instead.',
    tripwire: 'If a deck draft contains a cumulative chart, replace it before sending. Always.',
    status: 'on_track',
  },
  {
    id: 'chart_tricks_skip',
    category: 'presentation',
    rank: 15,
    name: 'Chart Tricks · NEVER USE',
    whatItIs:
      'Omitting Y-axis, shrinking scales to exaggerate growth, presenting percentage gains without absolute numbers.',
    diCurrent: 'N/A',
    diTarget12mo: 'Always show absolute numbers + Y-axis labelled + scale unmanipulated.',
    whyItMatters:
      'Sophisticated investors spot chart tricks instantly and the trust collapses. Honesty is the multiplier on trust.',
    computeMethod:
      'Always: Y-axis labelled, scale 0-baseline, absolute numbers next to percentages.',
    tripwire:
      'If a deck draft has a chart without a labelled Y-axis or scaled-from-zero baseline, fix it before sending.',
    status: 'on_track',
  },
  {
    id: 'order_of_operations',
    category: 'presentation',
    rank: 16,
    name: 'Order of Operations — Size BEFORE Growth',
    whatItIs:
      'Investor narrative pattern: introduce SIZE first (bookings, revenue, ARR), then GROWTH (MoM, CMGR, churn), then UNIT ECONOMICS (LTV/CAC, gross margin).',
    diCurrent:
      'Pre-revenue — size = zero today. Growth narrative anchored in the wedge + ceiling sequence.',
    diTarget12mo:
      'For Q3 2026 pre-seed deck: lead with the £70-90K booked ARR + 3 design partners (size), then growth, then unit economics.',
    whyItMatters:
      'Investors evaluate size BEFORE growth. Leading with growth on a tiny base (e.g., 200% MoM growth from £100 → £300 MRR) reads as desperate.',
    computeMethod:
      'Deck slide order: 1) Size (booked ARR + customer count) 2) Growth (CMGR + churn) 3) Unit economics (LTV/CAC + margin).',
    tripwire:
      'If a deck draft leads with a growth chart on a sub-£100K-ARR base, restructure to lead with size + thesis instead.',
    status: 'on_track',
  },
  {
    id: 'platform_calibration_credibility',
    category: 'presentation',
    rank: 17,
    name: 'Platform Calibration Credibility',
    whatItIs:
      'Brier-scored seed baseline derived from running our published DQI methodology over the 143-case library with hindsight neutralised. The deck-grade answer to "show me your outcome calibration" before customer outcomes accumulate.',
    diCurrent:
      'Brier 0.258 (fair band) over 143 audited corporate decisions · 52% classification accuracy at the C/D grade boundary · methodology version 2.0.0-seed. Source: src/lib/learning/platform-baseline.ts → computePlatformCalibrationBaseline(). Numbers re-derived from public case-study fields without hindsight peeking.',
    diTarget12mo:
      'Per-org Brier replaces the seed for ≥3 design-partner orgs (Outcome Gate Phase 1+2+3 enforces outcome logging contractually). Target trajectory: convergence toward the good band (≤ 0.20) as customer outcomes accumulate; Tetlock superforecaster band (≤ 0.13) is the long-term anchor.',
    whyItMatters:
      'Cloverpop\'s data advantage is the #1 outside-in attack vector (CLAUDE.md External Attack Vectors). The seed baseline is the contractual answer until customer outcomes build the per-org moat. A pre-seed VC asking "show me your outcome calibration" by month 4 of the conversation gets a defensible Tetlock-anchored number, not "we don\'t have customer outcomes yet."',
    computeMethod:
      'For each of the 143 cases: predicted DQI = bias-load + process maturity + noise + neutral evidence + neutral compliance, weighted by published WEIGHTS. Brier = (predicted_p − actual)² where predicted_p = predictedDqi/100. Aggregate as mean across the corpus. Re-derived at module init (compile-time-static).',
    tripwire:
      'If the seed Brier drifts > 0.05 commit-over-commit without an explicit methodology change, audit the predicted-DQI formula (likely a regression in the bias-load or process-maturity scoring). The number should only move when the corpus or methodology version changes.',
    status: 'on_track',
  },
  {
    id: 'paper_application_surface_area',
    category: 'presentation',
    rank: 18,
    name: 'R²F Paper-Application Surface Area',
    whatItIs:
      'Number of Kahneman / Klein / Lovallo paper findings operationalised as live signals on the audit pipeline + DPR cover, each anchored in a DOI-citable academic reference. The single most defensible upgrade against Cloverpop / Aera / Quantellia / IBM watsonx — none of whom run any of these on their pipelines.',
    diCurrent:
      '6 of 10 ranked applications shipped (locked 2026-04-30): Validity Classifier (Kahneman & Klein 2009 first condition · DQI methodology v2.1.0 with structural weight shift) · Feedback Adequacy (2009 second condition) · Reference Class Forecast (Kahneman & Lovallo 2003 HBR) · Illusion of Validity DI-B-021 (2009 central finding) · Inside-View Dominance DI-B-022 (Lovallo 2003) · Prospective Hindsight pre-mortem (Klein & Mitchell 1995). Total stable bias taxonomy: 22 entries (DI-B-001 through DI-B-022).',
    diTarget12mo:
      'All 10 paper applications shipped. Remaining 4: #1 Fractionation of Expertise (M&A buyer-conversion play) · #10 Calibrated Rejection of Subjective Confidence (author-vs-evidence confidence delta on DPR) · #7 Algorithm-aversion Counter-programming (surface platform calibration on rubric outputs) · #4 Improper Linear Models / Decision Rubric (new artefact class comparable to DPR — third specimen alongside WeWork + Dangote).',
    whyItMatters:
      'R²F was previously claimed in marketing copy but only partially operationalised. Each paper-application surface that ships is one more procurement-grade signal a Fortune 500 GC can read AND CITE. Investor narrative: "we name the moat with the same vocabulary the academic literature uses; the moat is the academic literature, applied as code." Six anchors with DOIs is harder for an incumbent to clone than five marketing claims.',
    computeMethod:
      'Count of paper-application surfaces in src/lib/learning/ + src/lib/agents/prompts.ts that (a) are anchored in a peer-reviewed paper with a DOI in bias-education.ts academicReference, (b) carry an Education Room flashcard with the kahneman_klein tag, (c) ship a procurement-grade surface (DPR section / bias detector / pipeline prompt change).',
    tripwire:
      'If the next paper application ships without (a) academic anchor in bias-education.ts, (b) Education Room flashcard, OR (c) a procurement-grade surface — pause and complete the cascade before the next one. The moat is the citability, not the count.',
    status: 'on_track',
  },
];

// =========================================================================
// SECTION 10 · FAILURE MODES WATCHTOWER (6 traps, 3 internal + 3 external)
// =========================================================================

