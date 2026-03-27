/**
 * Limited Partnership Operating Agreement (LPOA) Framework
 *
 * Maps cognitive biases to the key governance provisions found in limited
 * partnership operating agreements. These provisions govern the relationship
 * between general partners (GPs) and limited partners (LPs) in private
 * investment fund structures across jurisdictions.
 *
 * Reference: Institutional Limited Partners Association (ILPA) Principles 3.0,
 * common law partnership governance standards
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const LPOA_FRAMEWORK: RegulatoryFramework = {
  id: 'lpoa',
  name: 'Limited Partnership Operating Agreement',
  jurisdiction: 'International',
  category: 'corporate_governance',
  lastUpdated: '2026-03-01',

  provisions: [
    {
      id: 'lpoa_capital_calls',
      framework: 'lpoa',
      section: 'Capital Contributions',
      title: 'Capital Call Procedures',
      description:
        'Establishes the procedures, notice periods, and conditions under which the general partner may call committed capital from limited partners. Includes provisions for default consequences, excuse rights, and the timing and frequency of drawdowns relative to identified investment opportunities.',
      riskLevel: 'high',
      keywords: [
        'capital call',
        'drawdown',
        'commitment',
        'notice period',
        'default',
        'excuse rights',
        'contribution obligations',
      ],
    },
    {
      id: 'lpoa_distribution_waterfall',
      framework: 'lpoa',
      section: 'Distributions',
      title: 'Distribution Waterfall',
      description:
        'Defines the sequence and priority of distributions to partners, including return of capital, preferred return thresholds, carried interest calculations, GP catch-up provisions, and clawback mechanisms. The waterfall structure determines the economic alignment between GPs and LPs.',
      riskLevel: 'high',
      keywords: [
        'distribution waterfall',
        'carried interest',
        'preferred return',
        'GP catch-up',
        'clawback',
        'profit allocation',
        'hurdle rate',
      ],
    },
    {
      id: 'lpoa_key_person',
      framework: 'lpoa',
      section: 'Key Person',
      title: 'Key Person Provisions',
      description:
        'Identifies the individuals whose continued involvement is material to the fund\'s investment program and specifies the consequences of a key person event, including suspension of the investment period, LP notification requirements, and reinstatement vote procedures.',
      riskLevel: 'high',
      keywords: [
        'key person',
        'key man',
        'investment suspension',
        'team continuity',
        'reinstatement vote',
        'material personnel',
        'departure trigger',
      ],
    },
    {
      id: 'lpoa_investment_restrictions',
      framework: 'lpoa',
      section: 'Investment Program',
      title: 'Investment Restrictions',
      description:
        'Defines the permitted scope of the fund\'s investment activities, including concentration limits, geographic restrictions, sector mandates, leverage caps, and co-investment policies. These restrictions protect LPs by ensuring the GP invests within the agreed strategy parameters.',
      riskLevel: 'medium',
      keywords: [
        'investment restrictions',
        'concentration limits',
        'leverage cap',
        'sector mandate',
        'co-investment',
        'geographic limits',
        'portfolio constraints',
      ],
    },
    {
      id: 'lpoa_reporting',
      framework: 'lpoa',
      section: 'Reporting and Transparency',
      title: 'Reporting Requirements',
      description:
        'Specifies the frequency, content, and format of reports the GP must provide to LPs, including quarterly financial statements, annual audited accounts, capital account statements, portfolio valuations, and ESG disclosures. Timely and accurate reporting is essential for LP governance and fiduciary oversight.',
      riskLevel: 'medium',
      keywords: [
        'reporting',
        'financial statements',
        'portfolio valuation',
        'transparency',
        'audit',
        'capital accounts',
        'LP disclosure',
      ],
    },
    {
      id: 'lpoa_gp_removal',
      framework: 'lpoa',
      section: 'Governance and Termination',
      title: 'GP Removal and Dissolution',
      description:
        'Establishes the grounds and procedures for removing the general partner with or without cause, dissolving the partnership, and winding down fund operations. Includes voting thresholds, no-fault removal mechanics, transition provisions, and the treatment of carried interest upon removal.',
      riskLevel: 'high',
      keywords: [
        'GP removal',
        'dissolution',
        'wind-down',
        'no-fault removal',
        'for-cause termination',
        'voting threshold',
        'fund termination',
      ],
    },
  ],

  biasMappings: [
    // ── anchoring_bias ──────────────────────────────────────────────────
    {
      biasType: 'anchoring_bias',
      provisionId: 'lpoa_distribution_waterfall',
      riskWeight: 0.85,
      mechanism:
        'Waterfall negotiations anchor to the GP\'s initial term sheet proposals, particularly on carried interest percentages and preferred return hurdle rates. LPs anchor to industry-standard "2 and 20" structures rather than independently assessing whether the economics are appropriate for the specific fund strategy and risk profile.',
      example:
        'An LP negotiating a first-time fund\'s terms anchors to the 20% carried interest standard despite the fund pursuing a low-risk credit strategy where 15% carry would be market-appropriate, resulting in an economic structure that over-compensates the GP relative to the value delivered.',
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'lpoa_capital_calls',
      riskWeight: 0.6,
      mechanism:
        'Capital call timing anchors to historical deployment pace rather than current market conditions. GPs anchor drawdown schedules to prior fund patterns, calling capital on a predetermined timeline rather than adapting to the actual availability of suitable investment opportunities.',
      example:
        'A GP calls 30% of commitments in the first year because Fund III deployed at that pace, despite a significantly different market environment with fewer attractive deals, forcing premature deployment into lower-quality opportunities to justify the capital drawn.',
    },

    // ── confirmation_bias ───────────────────────────────────────────────
    {
      biasType: 'confirmation_bias',
      provisionId: 'lpoa_investment_restrictions',
      riskWeight: 0.75,
      mechanism:
        'Investment committees selectively interpret restriction clauses to confirm that desired transactions fall within permitted parameters. When a deal is commercially attractive, the team seeks readings of the LPOA that permit the investment while ignoring reasonable interpretations that would restrict it.',
      example:
        'A fund with a 25% sector concentration limit classifies a fintech lending platform as "technology" rather than "financial services" to avoid triggering the concentration cap, despite the platform\'s revenue being entirely derived from lending margins — an interpretation chosen to fit the desired outcome.',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'lpoa_reporting',
      riskWeight: 0.65,
      mechanism:
        'Portfolio valuation processes selectively weight data points that confirm existing marks while discounting evidence suggesting write-downs. Quarterly reporting reflects confirmation-driven valuations that present an overly optimistic picture of portfolio performance to LPs.',
      example:
        'A GP values a portfolio company at 12x EBITDA based on a single comparable transaction that supports the existing mark, while ignoring three other recent comparables trading at 8-9x that would necessitate a significant write-down in the quarterly report to LPs.',
    },

    // ── authority_bias ──────────────────────────────────────────────────
    {
      biasType: 'authority_bias',
      provisionId: 'lpoa_key_person',
      riskWeight: 0.8,
      mechanism:
        'Deference to the founding partner\'s authority prevents the LP Advisory Committee from triggering key person provisions even when circumstances warrant it. The GP\'s track record and reputation create an authority halo that makes LPs reluctant to exercise their contractual rights.',
      example:
        'A fund\'s founding partner reduces their time commitment to 50% after launching a second venture, clearly triggering the key person clause, but no LP raises the issue because the founder\'s reputation and prior returns create deference that overrides contractual governance.',
    },

    // ── groupthink ──────────────────────────────────────────────────────
    {
      biasType: 'groupthink',
      provisionId: 'lpoa_gp_removal',
      riskWeight: 0.8,
      mechanism:
        'LP Advisory Committees develop a consensus culture that makes it extremely difficult to build support for GP removal even when performance or conduct warrants it. Individual LPs who privately harbor concerns about GP behavior self-censor during committee meetings, and the collective fails to act on mounting evidence of governance failures.',
      example:
        'An LPAC receives multiple reports of style drift and related-party transactions, but no LP initiates a for-cause removal vote because each assumes others would have raised concerns if the situation were truly serious, leading to collective inaction while governance violations continue.',
    },
    {
      biasType: 'groupthink',
      provisionId: 'lpoa_investment_restrictions',
      riskWeight: 0.65,
      mechanism:
        'Investment committees reach rapid consensus on transactions that push against LPOA restrictions, with members reluctant to be the sole dissenter who delays or blocks a deal that the team collectively supports. The pressure to maintain deal velocity suppresses critical scrutiny of compliance boundaries.',
      example:
        'An investment committee unanimously approves a platform acquisition that would bring total leverage to 5.8x against a 6.0x LPOA cap, with no member raising the concern that the leverage calculation excludes certain off-balance-sheet commitments that would breach the limit.',
    },

    // ── sunk_cost_fallacy ───────────────────────────────────────────────
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'lpoa_capital_calls',
      riskWeight: 0.75,
      mechanism:
        'GPs issue follow-on capital calls to support underperforming portfolio companies because of capital already invested, rather than objectively assessing whether incremental investment serves LP interests. The sunk cost of prior draws justifies further drawdowns that compound losses.',
      example:
        'A GP calls $15 million in additional capital to fund a struggling portfolio company\'s bridge round, citing the $40 million already invested, despite the company missing every milestone and the bridge terms being highly dilutive — throwing good money after bad to avoid recognizing a loss.',
    },
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'lpoa_distribution_waterfall',
      riskWeight: 0.7,
      mechanism:
        'GPs resist triggering clawback provisions because of the psychological weight of returning previously received carried interest. The prior receipt of carry creates an emotional attachment that biases the GP toward valuation and realization decisions that avoid clawback triggers.',
      example:
        'A GP delays writing down a portfolio company that is clearly impaired because doing so would trigger the clawback mechanism on $8 million of previously distributed carry, instead maintaining an unrealistic valuation that delays the day of reckoning and misleads LPs about true fund performance.',
    },

    // ── overconfidence_bias ─────────────────────────────────────────────
    {
      biasType: 'overconfidence_bias',
      provisionId: 'lpoa_key_person',
      riskWeight: 0.7,
      mechanism:
        'GPs overestimate their ability to maintain team stability and underestimate the probability of key person events when negotiating LPOA terms. Overconfidence in team retention leads to accepting narrow key person definitions and short cure periods that provide inadequate protection for LPs.',
      example:
        'A GP negotiates a key person clause covering only two of five partners, confident the full team will remain intact, but two years later three non-key partners depart simultaneously — a scenario the clause was not designed to address, leaving LPs without a suspension trigger despite losing 60% of the investment team.',
    },

    // ── framing_effect ──────────────────────────────────────────────────
    {
      biasType: 'framing_effect',
      provisionId: 'lpoa_distribution_waterfall',
      riskWeight: 0.75,
      mechanism:
        'Waterfall structures framed using different calculation methodologies produce materially different economic outcomes but appear equivalent to LPs who lack the modeling sophistication to distinguish them. The framing of carry as "deal-by-deal" versus "whole-fund" obscures significant differences in GP economics.',
      example:
        'A GP presents a deal-by-deal waterfall as "standard industry terms," and LPs approve without recognizing that this structure allows the GP to collect carry on early winners while LPs bear losses on later deals — a framing that would have been rejected if presented as the aggregate economic impact.',
    },
    {
      biasType: 'framing_effect',
      provisionId: 'lpoa_reporting',
      riskWeight: 0.6,
      mechanism:
        'Quarterly reports frame portfolio performance using metrics that present the most favorable picture, such as gross IRR rather than net IRR, or MOIC excluding unrealized write-downs. The selective framing of performance data obscures the true state of LP returns.',
      example:
        'A GP reports a "25% gross IRR" prominently in the quarterly letter while burying the 14% net IRR — which accounts for management fees, carry, and fund expenses — in a supplemental table, framing performance in a way that systematically overstates the returns LPs are actually receiving.',
    },

    // ── status_quo_bias ─────────────────────────────────────────────────
    {
      biasType: 'status_quo_bias',
      provisionId: 'lpoa_gp_removal',
      riskWeight: 0.75,
      mechanism:
        'LPs default to maintaining the existing GP relationship even when performance or governance triggers for removal have been met. The status quo of the current management arrangement is strongly preferred over the disruptive alternative of removal and transition, leading to inaction in situations that demand governance intervention.',
      example:
        'A fund has returned only 0.6x capital after eight years with no realistic path to returning committed capital, clearly warranting a no-fault removal discussion, but the LPAC votes to extend the fund term rather than exercise removal rights because changing GPs feels riskier than the known underperformance.',
    },

    // ── loss_aversion ───────────────────────────────────────────────────
    {
      biasType: 'loss_aversion',
      provisionId: 'lpoa_capital_calls',
      riskWeight: 0.7,
      mechanism:
        'LPs face disproportionate psychological weight from the prospect of defaulting on a capital call versus the financial analysis of whether honoring the call is economically rational. Loss aversion — the fear of losing existing fund rights, suffering default penalties, and reputational damage — drives LPs to fund calls they should rationally decline.',
      example:
        'An LP honors a $5 million capital call for a fund showing clear signs of distress because the default penalty would forfeit their existing 1.2x invested capital, even though independent analysis suggests the incremental $5 million has a negative expected return and the rational action is to negotiate or default.',
    },

    // ── recency_bias ────────────────────────────────────────────────────
    {
      biasType: 'recency_bias',
      provisionId: 'lpoa_reporting',
      riskWeight: 0.6,
      mechanism:
        'LP evaluation of GP performance disproportionately weights recent quarterly results rather than full-cycle track record analysis. Recency bias in interpreting reports leads LPs to overreact to recent marks — both positive and negative — and make re-up decisions based on the most recent vintage rather than the GP\'s complete history.',
      example:
        'An LP commits to a GP\'s Fund V based on the strong recent markups in Fund IV\'s quarterly report, without recognizing that the markups are driven by unrealized paper gains in a frothy market and that the GP\'s Funds I through III showed significant value erosion in the two years following similar markup patterns.',
    },
    {
      biasType: 'recency_bias',
      provisionId: 'lpoa_investment_restrictions',
      riskWeight: 0.55,
      mechanism:
        'Investment restriction negotiations are disproportionately influenced by recent market events rather than systematic analysis of long-term risk factors. LPs demand restrictions addressing the most recent crisis while overlooking structural risks that have not manifested recently.',
      example:
        'After a high-profile fund fraud, LPs negotiate detailed related-party transaction restrictions into the LPOA while leaving leverage limits and concentration caps at loosely defined levels — restrictions that would have prevented the actual losses in the 2022 credit cycle that the LPs experienced firsthand.',
    },
  ],
};
