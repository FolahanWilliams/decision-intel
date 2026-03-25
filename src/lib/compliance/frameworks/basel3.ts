/**
 * Basel III Framework
 *
 * Maps cognitive biases to Basel III provisions governing bank capital adequacy,
 * stress testing, liquidity management, and market discipline disclosure.
 *
 * Reference: Basel III: A global regulatory framework for more resilient banks
 * and banking systems (BCBS, revised June 2011, updated 2017)
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const BASEL3_FRAMEWORK: RegulatoryFramework = {
  id: 'basel3',
  name: 'Basel III',
  jurisdiction: 'International (BCBS member jurisdictions)',
  category: 'financial',
  lastUpdated: '2025-12-01',

  provisions: [
    {
      id: 'basel3_pillar1_capital',
      framework: 'basel3',
      section: 'Pillar 1 — Capital Adequacy',
      title: 'Capital Adequacy and Risk-Weighted Assets',
      description:
        'Banks must maintain minimum capital ratios (CET1, Tier 1, Total Capital) against risk-weighted assets. Risk weights must be calculated using standardised or internal ratings-based (IRB) approaches, with capital buffers (conservation, countercyclical, systemic) providing additional resilience.',
      riskLevel: 'critical',
      keywords: [
        'capital adequacy',
        'CET1',
        'risk-weighted assets',
        'RWA',
        'capital buffers',
        'IRB',
        'standardised approach',
        'credit risk',
      ],
    },
    {
      id: 'basel3_pillar2_supervisory',
      framework: 'basel3',
      section: 'Pillar 2 — Supervisory Review',
      title: 'Supervisory Review and Internal Capital Adequacy',
      description:
        "Banks must have an internal capital adequacy assessment process (ICAAP) that considers all material risks, including those not fully captured in Pillar 1. Supervisors evaluate banks' risk profiles and may impose additional capital requirements.",
      riskLevel: 'high',
      keywords: [
        'ICAAP',
        'supervisory review',
        'SREP',
        'risk management',
        'stress testing',
        'concentration risk',
        'interest rate risk',
      ],
    },
    {
      id: 'basel3_pillar3_disclosure',
      framework: 'basel3',
      section: 'Pillar 3 — Market Discipline',
      title: 'Disclosure Requirements',
      description:
        "Banks must publish detailed information about their risk profile, capital adequacy, and risk management practices. Disclosures must be sufficient to allow market participants to assess the bank's risk profile and the adequacy of its capital.",
      riskLevel: 'high',
      keywords: [
        'disclosure',
        'transparency',
        'market discipline',
        'risk reporting',
        'Pillar 3 report',
        'investor information',
      ],
    },
    {
      id: 'basel3_lcr',
      framework: 'basel3',
      section: 'Liquidity Coverage Ratio',
      title: 'Liquidity Coverage Ratio (LCR)',
      description:
        'Banks must hold sufficient high-quality liquid assets (HQLA) to cover total net cash outflows over a 30-day stress scenario. The LCR ensures short-term resilience to liquidity disruptions.',
      riskLevel: 'critical',
      keywords: [
        'liquidity',
        'HQLA',
        'cash outflows',
        'stress scenario',
        'liquidity buffer',
        'LCR',
        'short-term liquidity',
      ],
    },
    {
      id: 'basel3_nsfr',
      framework: 'basel3',
      section: 'Net Stable Funding Ratio',
      title: 'Net Stable Funding Ratio (NSFR)',
      description:
        'Banks must maintain a stable funding profile in relation to their on- and off-balance-sheet activities. The NSFR requires available stable funding (ASF) to exceed required stable funding (RSF) over a one-year horizon, reducing over-reliance on short-term wholesale funding.',
      riskLevel: 'high',
      keywords: [
        'stable funding',
        'NSFR',
        'funding structure',
        'wholesale funding',
        'maturity mismatch',
        'long-term funding',
      ],
    },
  ],

  biasMappings: [
    // ── confirmation_bias ──────────────────────────────────────────────
    {
      biasType: 'confirmation_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.8,
      mechanism:
        'Risk model developers and validators seek confirming evidence for model outputs, selectively using back-testing data that supports model accuracy while dismissing periods where the model underperformed as "exceptional circumstances."',
      example:
        'An IRB model validation team highlights 8 out of 10 years where PD estimates were conservative, dismissing 2 years of significant underestimation as "tail events outside model scope," leading to under-capitalisation for the actual risk profile.',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.7,
      mechanism:
        'ICAAP assessments selectively incorporate stress scenarios and risk factors that confirm existing capital levels are adequate, rather than genuinely stress-testing capital adequacy under adverse conditions.',
      example:
        "A bank's ICAAP uses stress scenarios calibrated to historical crises that the bank weathered successfully, confirming capital adequacy, while excluding hypothetical scenarios (e.g., a cyber-event combined with market stress) that might challenge it.",
    },

    // ── anchoring_bias ─────────────────────────────────────────────────
    {
      biasType: 'anchoring_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.75,
      mechanism:
        'Risk weight calculations anchored to initial calibrations or regulatory minimums rather than independently derived from current portfolio risk. IRB model parameters anchored to historical calibration periods that may not reflect current conditions.',
      example:
        "A bank's loss-given-default (LGD) estimates are anchored to a calibration performed in 2018 using benign-period data, and subsequent recalibrations make only marginal adjustments rather than fundamental reassessments based on updated through-the-cycle data.",
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'basel3_lcr',
      riskWeight: 0.6,
      mechanism:
        'Liquidity stress scenario outflow assumptions anchored to regulatory minimums or historical experience rather than forward-looking assessment of potential outflow behaviour under severe stress.',
      example:
        'A bank models retail deposit outflows at exactly the regulatory 5% floor, anchoring to the minimum rather than assessing whether its specific deposit base (concentrated in digital-savvy customers with easy transfer options) might exhibit higher runoff.',
    },

    // ── availability_heuristic ─────────────────────────────────────────
    {
      biasType: 'availability_heuristic',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.6,
      mechanism:
        'Risk identification in the ICAAP dominated by recently materialised or widely publicised risks, while harder-to-imagine but potentially more severe risks are underweighted in the assessment.',
      example:
        "After the 2023 banking stress, a bank's ICAAP extensively covers interest rate risk and deposit flight scenarios but underweights operational risk from AI model failures — a risk with no recent vivid precedent but potentially severe impact.",
    },
    {
      biasType: 'availability_heuristic',
      provisionId: 'basel3_lcr',
      riskWeight: 0.55,
      mechanism:
        'Liquidity risk management influenced by the most recent liquidity event, leading to over-preparation for the last crisis type while underestimating novel liquidity stress channels.',
      example:
        "A bank over-invests in government bond HQLA buffers after a sovereign debt scare, while its actual highest liquidity risk — social media-driven retail deposit runs — receives no specific scenario planning because it hasn't happened to this bank yet.",
    },

    // ── groupthink ─────────────────────────────────────────────────────
    {
      biasType: 'groupthink',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.75,
      mechanism:
        'Risk committees reach consensus on capital adequacy assessments too rapidly, with members who have doubts about model assumptions or risk parameter calibrations self-censoring to maintain committee harmony.',
      example:
        'A model oversight committee unanimously approves an IRB model recalibration that reduces capital requirements by 12%, with no member voicing concerns about the benign calibration period used, because the CRO had already expressed support.',
    },
    {
      biasType: 'groupthink',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.7,
      mechanism:
        "ICAAP governance groups develop shared assumptions about the bank's risk profile that become immune to challenge. Stress scenario selection reflects group consensus rather than rigorous independent analysis.",
      example:
        "A bank's risk committee collectively assumes that their diversified business model protects against severe stress, and the ICAAP stress scenarios implicitly reflect this shared belief rather than testing whether diversification benefits hold under extreme conditions.",
    },

    // ── authority_bias ─────────────────────────────────────────────────
    {
      biasType: 'authority_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.6,
      mechanism:
        "Risk analysts defer to senior risk officers' judgment on model parameter choices, even when quantitative evidence suggests different calibrations. The authority of the CRO shapes risk assessments more than data.",
      example:
        "A junior risk analyst's model back-testing reveals that PD estimates are systematically low for SME exposures, but she does not escalate the finding because the head of credit risk modelling personally calibrated those parameters.",
    },
    {
      biasType: 'authority_bias',
      provisionId: 'basel3_pillar3_disclosure',
      riskWeight: 0.5,
      mechanism:
        'Disclosure content and tone shaped by senior management preferences rather than objective transparency requirements, with communications teams deferring to executive direction on how risks are characterised.',
      example:
        'A Pillar 3 disclosure describes concentration risk as "well-managed and within appetite" because the CEO directed the communications team to maintain investor confidence, even though internal risk reports show breaches of concentration limits.',
    },

    // ── bandwagon_effect ───────────────────────────────────────────────
    {
      biasType: 'bandwagon_effect',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.55,
      mechanism:
        'Risk modelling approaches adopted because peer banks use them, creating systemic risk through model monoculture. Banks gravitate toward similar risk models, creating correlated under-estimation of risk across the system.',
      example:
        "Multiple banks adopt the same vendor's credit risk model, and all calibrate it using similar data periods, creating a systemic blind spot where all institutions simultaneously underestimate PDs for the same asset class.",
    },
    {
      biasType: 'bandwagon_effect',
      provisionId: 'basel3_nsfr',
      riskWeight: 0.5,
      mechanism:
        'Funding strategies converge on industry-standard approaches because "everyone does it this way," creating crowded trades in the same funding instruments and correlated vulnerability to market disruptions.',
      example:
        'Multiple banks pursue the same covered bond issuance strategy to improve NSFR ratios, creating a crowded trade that becomes a systemic vulnerability when covered bond spreads widen simultaneously for all issuers.',
    },

    // ── overconfidence_bias ─────────────────────────────────────────────
    {
      biasType: 'overconfidence_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.8,
      mechanism:
        'Management overconfident in the precision of internal risk models, leading to capital levels calibrated to model outputs without adequate buffers for model uncertainty. The confidence interval around risk estimates is systematically too narrow.',
      example:
        'A bank holds CET1 at exactly 10.5% (regulatory minimum plus conservation buffer) because its IRB models indicate this is sufficient, with management overconfident that models capture tail risks — no management buffer is held for model error.',
    },
    {
      biasType: 'overconfidence_bias',
      provisionId: 'basel3_lcr',
      riskWeight: 0.65,
      mechanism:
        "Overconfidence in the bank's ability to monetise HQLA under stress conditions, or in the accuracy of outflow projections, leading to liquidity buffers that are adequate on paper but insufficient in practice.",
      example:
        "A bank's treasury is confident it can liquidate its government bond portfolio within 24 hours, but under actual market stress, bid-ask spreads widen dramatically and the bank can only monetise 60% of the expected amount at acceptable prices.",
    },

    // ── hindsight_bias ─────────────────────────────────────────────────
    {
      biasType: 'hindsight_bias',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.5,
      mechanism:
        'Post-crisis reviews of ICAAP processes conclude that failures "should have been foreseen," leading to over-specific remediation of past crisis pathways rather than improvements to the general quality of forward-looking risk assessment.',
      example:
        'After a credit loss event, the supervisor concludes the bank\'s ICAAP "clearly should have identified" the sector concentration risk, applying hindsight to criticise a forward-looking assessment that was reasonable given the information available at the time.',
    },
    {
      biasType: 'hindsight_bias',
      provisionId: 'basel3_pillar3_disclosure',
      riskWeight: 0.45,
      mechanism:
        'After a risk event, Pillar 3 disclosures are retrospectively judged as inadequate, creating pressure to over-disclose in ways that produce noise rather than genuinely useful information for market participants.',
      example:
        "After a trading loss, regulators and analysts criticise the bank's prior Pillar 3 disclosures for not highlighting the specific risk that materialised, even though the disclosure was comprehensive about market risk categories and VaR limits at the time.",
    },

    // ── planning_fallacy ───────────────────────────────────────────────
    {
      biasType: 'planning_fallacy',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.55,
      mechanism:
        'Capital planning underestimates the time and resources needed to implement risk model improvements, leading to extended periods where known model deficiencies affect capital calculations without remediation.',
      example:
        'A bank plans a 6-month IRB model enhancement program to address supervisor findings, but the actual implementation takes 18 months due to data quality issues and model validation requirements, leaving the bank with known model deficiencies for an additional year.',
    },
    {
      biasType: 'planning_fallacy',
      provisionId: 'basel3_lcr',
      riskWeight: 0.5,
      mechanism:
        'Liquidity contingency plans underestimate the time needed to execute recovery actions under stress, creating a gap between planned and achievable liquidity generation in a crisis.',
      example:
        "A bank's liquidity contingency plan assumes it can execute a repo programme within 48 hours of a stress event, but operational reality under stress (counterparty reluctance, legal documentation, settlement delays) means execution takes 2 weeks.",
    },

    // ── loss_aversion ──────────────────────────────────────────────────
    {
      biasType: 'loss_aversion',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.65,
      mechanism:
        'Loss aversion in capital allocation leads banks to resist releasing capital from profitable business lines to build buffers, because the immediate loss of returns is felt more acutely than the probabilistic benefit of higher resilience.',
      example:
        "A bank resists increasing its countercyclical capital buffer because the immediate reduction in ROE from holding additional capital outweighs management's assessment of the probability-weighted benefit of the buffer in a downturn.",
    },
    {
      biasType: 'loss_aversion',
      provisionId: 'basel3_nsfr',
      riskWeight: 0.55,
      mechanism:
        'Loss aversion drives banks to maintain cheaper short-term wholesale funding rather than transitioning to more expensive but more stable long-term funding, because the funding cost increase is felt as an immediate loss.',
      example:
        "A bank's treasury maintains a heavy reliance on overnight repo funding because switching to 1-year term funding would cost 80bps more, with the immediate NIM impact outweighing the NSFR compliance benefit in management's decision-making.",
    },

    // ── sunk_cost_fallacy ──────────────────────────────────────────────
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.5,
      mechanism:
        'Continued use of legacy risk models because of the significant investment in their development and regulatory approval, even when newer approaches would provide more accurate risk measurement.',
      example:
        "A bank continues using an IRB model approved in 2016 because the original development cost was EUR 15M and the regulatory approval process took 3 years, even though the model's discrimination power has deteriorated significantly.",
    },
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.45,
      mechanism:
        'ICAAP processes maintained in their current form because of prior investment in developing the methodology, rather than redesigning to address evolved risk profiles and supervisory expectations.',
      example:
        "A bank's ICAAP stress testing infrastructure was built at significant cost for a pre-COVID risk environment, and the bank continues using the same scenario framework rather than investing in a new one that captures current systemic risks.",
    },

    // ── status_quo_bias ────────────────────────────────────────────────
    {
      biasType: 'status_quo_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.55,
      mechanism:
        'Risk weight methodologies maintained in their current form because change introduces regulatory uncertainty. Banks prefer the known under-performance of current approaches to the uncertainty of implementing improved methodologies.',
      example:
        'A bank continues using the standardised approach for operational risk capital even though an advanced measurement approach would more accurately reflect its risk profile, because the current approach is "known and predictable."',
    },
    {
      biasType: 'status_quo_bias',
      provisionId: 'basel3_pillar3_disclosure',
      riskWeight: 0.45,
      mechanism:
        "Disclosure templates and reporting formats maintained year-over-year without evolution, even as the bank's risk profile changes and new disclosure requirements emerge, because existing processes are entrenched.",
      example:
        "A bank's Pillar 3 report uses the same format and narrative structure for 5 consecutive years, with only numerical updates, failing to incorporate new disclosure requirements on climate risk, operational resilience, and digital asset exposures.",
    },

    // ── framing_effect ─────────────────────────────────────────────────
    {
      biasType: 'framing_effect',
      provisionId: 'basel3_pillar3_disclosure',
      riskWeight: 0.65,
      mechanism:
        "Risk disclosures framed to present the bank's risk profile favourably, emphasising strengths while technically disclosing but de-emphasising material risks. The framing reduces the effectiveness of market discipline.",
      example:
        "A bank's Pillar 3 report leads with its strong CET1 ratio and conservative risk culture narrative, while burying information about a 40% increase in Level 3 assets and a growing maturity mismatch in a technical appendix.",
    },
    {
      biasType: 'framing_effect',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.5,
      mechanism:
        'Internal risk reports frame capital adequacy in the most favourable light, presenting ratios with the most beneficial denominator and emphasising surplus over requirements rather than absolute risk levels.',
      example:
        'Internal board reports present the CET1 ratio using the most favourable RWA calculation methodology, showing a 13.5% ratio, when the more conservative approach used by the supervisor would yield 11.2% — still compliant but with significantly less headroom.',
    },

    // ── selective_perception ───────────────────────────────────────────
    {
      biasType: 'selective_perception',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.6,
      mechanism:
        'Risk management teams selectively perceive signals from risk models and market data that confirm existing risk assessments, while filtering out contradictory signals that might require additional capital allocation.',
      example:
        'A risk team monitors daily VaR reports and notes when actual losses are below VaR (confirming model accuracy) but does not investigate days when profits significantly exceed VaR — a signal that the model may be fundamentally miscalibrated.',
    },
    {
      biasType: 'selective_perception',
      provisionId: 'basel3_pillar2_supervisory',
      riskWeight: 0.5,
      mechanism:
        'ICAAP risk identification processes selectively perceive risks that fit the existing risk taxonomy while missing emerging risks that do not fit neatly into established categories.',
      example:
        "A bank's ICAAP captures traditional credit, market, and operational risks but selectively filters out interconnection risks between these categories (e.g., cyber-event triggering credit losses) because the risk taxonomy does not accommodate cross-category risks.",
    },

    // ── recency_bias ───────────────────────────────────────────────────
    {
      biasType: 'recency_bias',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.6,
      mechanism:
        'Risk model calibration and capital calculations disproportionately influenced by recent data, leading to pro-cyclical capital requirements — too low in benign periods and too high after stress events.',
      example:
        'A bank recalibrates its PD models using the most recent 3 years of benign credit data, producing lower PD estimates and reduced capital requirements just before a credit cycle turns, precisely when higher capital would be needed.',
    },
    {
      biasType: 'recency_bias',
      provisionId: 'basel3_lcr',
      riskWeight: 0.5,
      mechanism:
        'Liquidity risk assessments over-weighted toward recent market conditions, leading to procyclical liquidity management — building buffers after stress events and releasing them during calm periods.',
      example:
        'A bank reduces its HQLA buffer during a prolonged period of low volatility and easy funding conditions, because recent experience suggests liquidity risk is low, just as conditions are building for the next liquidity shock.',
    },

    // ── cognitive_misering ─────────────────────────────────────────────
    {
      biasType: 'cognitive_misering',
      provisionId: 'basel3_pillar1_capital',
      riskWeight: 0.5,
      mechanism:
        "Risk teams apply minimal cognitive effort to complex risk calculations, defaulting to standardised approaches or vendor model defaults rather than investing analytical effort in calibrations specific to the bank's portfolio.",
      example:
        'A bank uses vendor-default correlation assumptions in its IRB credit portfolio model without verifying whether these correlations reflect actual default dependencies in its specific loan book, because the analytical effort to derive bank-specific correlations is substantial.',
    },
    {
      biasType: 'cognitive_misering',
      provisionId: 'basel3_pillar3_disclosure',
      riskWeight: 0.45,
      mechanism:
        "Disclosure teams apply minimal effort to narrative disclosures, producing boilerplate text that technically meets requirements but does not provide market participants with genuine insight into the bank's risk profile.",
      example:
        'A bank\'s Pillar 3 qualitative disclosures are copied from the prior year with minimal updates, containing generic statements about "robust risk management" rather than specific, current information about how the bank\'s risk profile has evolved.',
    },
  ],
};
