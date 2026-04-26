/**
 * Africa-anchored regulatory frameworks (1.3c deep).
 *
 * Provides bias-to-provision mappings for eleven African regulatory
 * regimes so the Decision Provenance Record can render specific
 * provision-level citations when an analysis is run on an African
 * memo. Coverage:
 *
 *   - NDPR (Nigeria Data Protection Regulation)
 *   - CBN AI Guidelines (Central Bank of Nigeria)
 *   - WAEMU (West African Economic and Monetary Union)
 *   - CMA Kenya (Capital Markets Authority)
 *   - CBK (Central Bank of Kenya — added 2026-04-26)
 *   - BoG Cyber & ICT Risk (Bank of Ghana)
 *   - FRC Nigeria (Financial Reporting Council Code of Corporate Governance)
 *   - CBE AI Guidelines (Central Bank of Egypt)
 *   - PoPIA (Protection of Personal Information Act, South Africa)
 *   - SARB Model Risk (South African Reserve Bank)
 *   - BoT FinTech Sandbox (Bank of Tanzania)
 *
 * Provisions cite the regulator's own naming where verifiable; bias
 * mappings are conservative (riskWeight ≤ 0.85) and reference the
 * specific mechanism by which a bias creates regulatory risk under
 * the cited provision.
 *
 * Bias-coverage discipline (locked 2026-04-26 after the persona audit
 * caught zero African mappings for the dominant pe_vc biases):
 * anchoring_bias, survivorship_bias, and planning_fallacy each carry
 * at least one African-framework mapping. When adding a new pe_vc
 * sample bundle, audit `expectedBiases` against this file before
 * shipping — if a lead bias has no African mapping, the DPR will fall
 * back to Basel III / EU AI Act citations on what is meant to be a
 * Pan-African deal, which is exactly the "doesn't know my market"
 * tell Sankore-class buyers screen for.
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const NDPR_FRAMEWORK: RegulatoryFramework = {
  id: 'ndpr_nigeria',
  name: 'Nigeria Data Protection Regulation',
  jurisdiction: 'Nigeria',
  category: 'data_privacy',
  lastUpdated: '2024-04-15',
  provisions: [
    {
      id: 'ndpr_art_12',
      framework: 'ndpr_nigeria',
      section: 'Art. 12',
      title: 'Automated Individual Decision-Making',
      description:
        'Data subjects have the right not to be subject to a decision based solely on automated processing where it produces legal effects or similarly significantly affects them. Processors must provide meaningful information about the logic involved.',
      riskLevel: 'high',
      keywords: ['automated decision', 'profiling', 'data subject right', 'meaningful information'],
    },
    {
      id: 'ndpr_art_13',
      framework: 'ndpr_nigeria',
      section: 'Art. 13',
      title: 'Right to Erasure & Rectification',
      description:
        'Right to have personal data erased or rectified when no longer necessary for the purposes for which it was collected.',
      riskLevel: 'medium',
      keywords: ['data erasure', 'rectification', 'data subject right'],
    },
  ],
  biasMappings: [
    {
      biasType: 'algorithmic_bias',
      provisionId: 'ndpr_art_12',
      riskWeight: 0.85,
      mechanism:
        'Automated bias compounding produces legal-effect decisions without meaningful human oversight',
      example:
        'Credit-scoring model trained on biased historical data denies a Lagos-based applicant',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'ndpr_art_12',
      riskWeight: 0.55,
      mechanism:
        'Confirmation bias in human reviewer override of the model produces inconsistent legal-effect decisions',
      example:
        'Human reviewer over-rules model only when model decision aligns with prior expectation',
    },
  ],
};

export const CBN_AI_FRAMEWORK: RegulatoryFramework = {
  id: 'cbn_ai_guidelines',
  name: 'Central Bank of Nigeria — AI Governance Guidelines',
  jurisdiction: 'Nigeria',
  category: 'ai_governance',
  lastUpdated: '2024-08-30',
  provisions: [
    {
      id: 'cbn_ai_model_governance',
      framework: 'cbn_ai_guidelines',
      section: 'Para. 4.2',
      title: 'Model Governance & Validation',
      description:
        'Regulated financial institutions deploying AI/ML must implement independent model validation, periodic re-validation, and documented model risk-management.',
      riskLevel: 'high',
      keywords: ['model validation', 'model risk', 'AI governance'],
    },
    {
      id: 'cbn_ai_explainability',
      framework: 'cbn_ai_guidelines',
      section: 'Para. 5.1',
      title: 'Explainability & Customer Disclosure',
      description:
        'Customer-facing AI decisions must be explainable in plain language; institutions must provide reasoning artifacts on customer request.',
      riskLevel: 'high',
      keywords: ['explainability', 'customer disclosure', 'reasoning artifact'],
    },
  ],
  biasMappings: [
    {
      biasType: 'overconfidence_bias',
      provisionId: 'cbn_ai_model_governance',
      riskWeight: 0.65,
      mechanism: 'Overconfidence in model performance produces inadequate validation cycles',
      example: 'Bank treats model accuracy as stable across cycle regimes without re-validation',
    },
    {
      biasType: 'narrative_fallacy',
      provisionId: 'cbn_ai_explainability',
      riskWeight: 0.55,
      mechanism:
        'Narrative-style customer disclosure substitutes for structured reasoning artifact',
      example: 'Customer adverse-action notice tells a story rather than discloses the model logic',
    },
  ],
};

export const WAEMU_FRAMEWORK: RegulatoryFramework = {
  id: 'waemu',
  name: 'West African Economic and Monetary Union',
  jurisdiction: 'WAEMU (8 member states)',
  category: 'financial',
  lastUpdated: '2024-06-01',
  provisions: [
    {
      id: 'waemu_data_localisation',
      framework: 'waemu',
      section: 'Reg. R09',
      title: 'Cross-Border Data Localisation',
      description:
        'Financial-sector data on WAEMU residents must be processed and stored within the WAEMU zone unless explicit BCEAO authorisation is granted.',
      riskLevel: 'high',
      keywords: ['data localisation', 'cross-border', 'WAEMU residency'],
    },
    {
      id: 'waemu_governance',
      framework: 'waemu',
      section: 'BCEAO Circular 04-2017',
      title: 'Internal Governance & Risk',
      description:
        'WAEMU-licensed financial institutions must maintain documented internal governance, risk management, and material-decision evidence.',
      riskLevel: 'high',
      keywords: ['internal governance', 'risk management', 'material decision'],
    },
  ],
  biasMappings: [
    {
      biasType: 'groupthink',
      provisionId: 'waemu_governance',
      riskWeight: 0.65,
      mechanism:
        'Unanimous board-level decisions without dissent capture violate documented governance evidence',
      example: 'WAEMU bank loan-committee minutes record no dissent on a concentrated exposure',
    },
    {
      biasType: 'planning_fallacy',
      provisionId: 'waemu_governance',
      riskWeight: 0.6,
      mechanism:
        'Planning-fallacy timelines on cross-border integration evade material-decision risk-management evidence',
      example:
        'WAEMU acquirer underwrites 12-month operational integration across CIV / SEN / BFA without contingency capture in the loan-committee minutes',
    },
  ],
};

export const CMA_KENYA_FRAMEWORK: RegulatoryFramework = {
  id: 'cma_kenya',
  name: 'Capital Markets Authority (Kenya)',
  jurisdiction: 'Kenya',
  category: 'financial',
  lastUpdated: '2024-03-12',
  provisions: [
    {
      id: 'cma_kenya_disclosure',
      framework: 'cma_kenya',
      section: 'Conduct Regs. 2024 Pt. III',
      title: 'Listed-Company Material Disclosure',
      description:
        'Listed companies must disclose all material information bearing on investor decision-making, including forward-looking-statement caveats and known risk factors.',
      riskLevel: 'high',
      keywords: ['material disclosure', 'forward-looking', 'risk factor'],
    },
    {
      id: 'cma_kenya_board_decision',
      framework: 'cma_kenya',
      section: 'Code of Corporate Governance s.2',
      title: 'Board Decision-Making',
      description:
        'Board must demonstrate documented dissent capture, independent advice, and structured decision-making for material transactions.',
      riskLevel: 'high',
      keywords: ['dissent', 'independent advice', 'material transaction'],
    },
  ],
  biasMappings: [
    {
      biasType: 'optimism_bias',
      provisionId: 'cma_kenya_disclosure',
      riskWeight: 0.7,
      mechanism:
        'Optimism in forward-looking statements understates risk factors that bear on investor decision-making',
      example: 'Listed cement company forecasts 25% growth without disclosing FX-cycle dependency',
    },
    {
      biasType: 'groupthink',
      provisionId: 'cma_kenya_board_decision',
      riskWeight: 0.6,
      mechanism:
        'Unanimous board approval without dissent capture violates structured decision-making',
      example: 'Board minutes record unanimous M&A approval with no recorded structured challenge',
    },
    {
      biasType: 'survivorship_bias',
      provisionId: 'cma_kenya_disclosure',
      riskWeight: 0.65,
      mechanism:
        'Selectively citing surviving comparables understates the risk factors disclosure regime requires for material investor decision-making',
      example:
        'Issuer cites three surviving Pan-African consumer-staples comps to justify an 8x exit multiple while omitting the failed Sub-Saharan African rollouts in the same vintage',
    },
  ],
};

export const CBK_FRAMEWORK: RegulatoryFramework = {
  id: 'cbk_kenya',
  name: 'Central Bank of Kenya — Banking & Digital Lending Governance',
  jurisdiction: 'Kenya',
  category: 'financial',
  lastUpdated: '2024-12-01',
  provisions: [
    {
      id: 'cbk_digital_lending',
      framework: 'cbk_kenya',
      section: 'Banking (Amendment) Act 2024 §33B',
      title: 'Digital Credit Provider Licensing & Conduct',
      description:
        'Digital credit providers operating in Kenya must hold a CBK licence, maintain documented credit-decisioning governance (including any AI/ML model governance), and meet customer-disclosure and complaint-handling obligations. Material credit decisions made through automated processing require documented human-oversight evidence.',
      riskLevel: 'high',
      keywords: ['digital lending', 'AI credit decision', 'consumer protection', 'CBK licence'],
    },
    {
      id: 'cbk_model_governance',
      framework: 'cbk_kenya',
      section: 'Risk Management Guidelines (rev. 2023) §VIII',
      title: 'Model Risk Management for Regulated Banks',
      description:
        'CBK-licensed banks deploying models for credit, market, or operational risk must maintain independent model validation, periodic re-validation, and documented model-risk management — including for any AI/ML models in production use.',
      riskLevel: 'high',
      keywords: ['model risk', 'model validation', 'CBK guidelines'],
    },
  ],
  biasMappings: [
    {
      biasType: 'overconfidence_bias',
      provisionId: 'cbk_model_governance',
      riskWeight: 0.65,
      mechanism:
        'Overconfidence in model performance produces inadequate validation cycles, violating CBK Risk Management Guidelines on documented model-risk management',
      example:
        'Kenyan bank treats SME-lending model accuracy as stable through KES devaluation cycles without re-validation',
    },
    {
      biasType: 'algorithmic_bias',
      provisionId: 'cbk_digital_lending',
      riskWeight: 0.75,
      mechanism:
        'Algorithmic bias in automated credit decisions violates the §33B human-oversight evidence + customer-disclosure obligations',
      example:
        'Digital lender deploys credit-scoring model that produces systematically different decisions by region without documented oversight evidence',
    },
    {
      biasType: 'narrative_fallacy',
      provisionId: 'cbk_digital_lending',
      riskWeight: 0.55,
      mechanism:
        'Narrative-style disclosure of credit decision logic substitutes for the structured reasoning artefact §33B requires',
      example:
        'Adverse-action notice to a Nairobi SME tells a story rather than discloses the model logic in plain language',
    },
  ],
};

export const BOG_FRAMEWORK: RegulatoryFramework = {
  id: 'bog_ghana',
  name: 'Bank of Ghana — Cyber & Information Security',
  jurisdiction: 'Ghana',
  category: 'financial',
  lastUpdated: '2023-09-01',
  provisions: [
    {
      id: 'bog_model_governance',
      framework: 'bog_ghana',
      section: 'Directive 2018/05 (rev. 2023) §5',
      title: 'Model & Algorithmic Governance',
      description:
        'Ghanaian regulated financial institutions must maintain documented model governance, periodic validation, and incident-response procedures for AI/ML systems.',
      riskLevel: 'high',
      keywords: ['model governance', 'AI/ML', 'incident response'],
    },
  ],
  biasMappings: [
    {
      biasType: 'overconfidence_bias',
      provisionId: 'bog_model_governance',
      riskWeight: 0.6,
      mechanism: 'Overconfidence in model stability produces inadequate validation cycles',
      example:
        'Ghanaian bank treats credit-scoring model as stable through cedi devaluation cycles',
    },
  ],
};

export const FRC_NIGERIA_FRAMEWORK: RegulatoryFramework = {
  id: 'frc_nigeria',
  name: 'Financial Reporting Council of Nigeria — Code of Corporate Governance',
  jurisdiction: 'Nigeria',
  category: 'corporate_governance',
  lastUpdated: '2018-01-15',
  provisions: [
    {
      id: 'frc_nigeria_board_decision',
      framework: 'frc_nigeria',
      section: 'Principle 1.1',
      title: 'Board Effectiveness & Decision-Making',
      description:
        'Board of public-interest entities must demonstrate documented dissent capture, structured decision processes, and independent oversight.',
      riskLevel: 'high',
      keywords: ['dissent', 'board effectiveness', 'public-interest entity'],
    },
    {
      id: 'frc_nigeria_risk_management',
      framework: 'frc_nigeria',
      section: 'Principle 11',
      title: 'Risk Management & Internal Controls',
      description:
        'Risk-management framework must document material-risk identification, escalation, and mitigation decisions.',
      riskLevel: 'high',
      keywords: ['risk management', 'material risk', 'escalation'],
    },
  ],
  biasMappings: [
    {
      biasType: 'groupthink',
      provisionId: 'frc_nigeria_board_decision',
      riskWeight: 0.7,
      mechanism:
        'Unanimous board decisions on material matters without dissent capture violate Principle 1.1',
      example:
        'Public-interest entity board approves a related-party transaction without any recorded challenge',
    },
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'frc_nigeria_risk_management',
      riskWeight: 0.55,
      mechanism: 'Sunk-cost-driven escalation decisions evade material-risk re-identification',
      example:
        'Board continues a failing project to recover prior capex without re-evaluating material risk',
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'frc_nigeria_board_decision',
      riskWeight: 0.6,
      mechanism:
        'Anchoring on the seller, sponsor, or first comparable suppresses the documented dissent capture and structured decision processes Principle 1.1 requires',
      example:
        'Public-interest entity board approves an acquisition at the seller-tabled price multiple without a documented independent challenge or alternative-comparable analysis',
    },
  ],
};

export const CBE_FRAMEWORK: RegulatoryFramework = {
  id: 'cbe_egypt',
  name: 'Central Bank of Egypt — ICT Governance & Risk Framework',
  jurisdiction: 'Egypt',
  category: 'ai_governance',
  lastUpdated: '2023-11-20',
  provisions: [
    {
      id: 'cbe_ai_governance',
      framework: 'cbe_egypt',
      section: 'CBE 2023 Framework §III',
      title: 'AI/ML Model Governance',
      description:
        'Egyptian regulated banks deploying AI/ML must maintain documented model governance, explainability, and customer disclosure.',
      riskLevel: 'high',
      keywords: ['AI governance', 'model risk', 'explainability'],
    },
  ],
  biasMappings: [
    {
      biasType: 'algorithmic_bias',
      provisionId: 'cbe_ai_governance',
      riskWeight: 0.8,
      mechanism:
        'Algorithmic bias in customer-facing models violates explainability and disclosure obligations',
      example:
        'Egyptian bank credit-scoring model produces systematically different outcomes by region',
    },
  ],
};

export const POPIA_FRAMEWORK: RegulatoryFramework = {
  id: 'popia_south_africa',
  name: 'Protection of Personal Information Act (South Africa)',
  jurisdiction: 'South Africa',
  category: 'data_privacy',
  lastUpdated: '2021-07-01',
  provisions: [
    {
      id: 'popia_s71',
      framework: 'popia_south_africa',
      section: 's.71',
      title: 'Automated Decision-Making',
      description:
        'Data subjects have the right not to be subject to a decision based solely on automated processing where it has legal effects, with the right to access reasoning and to object.',
      riskLevel: 'high',
      keywords: ['automated decision', 'data subject right', 'reasoning'],
    },
    {
      id: 'popia_s24',
      framework: 'popia_south_africa',
      section: 's.24',
      title: 'Quality of Information',
      description:
        'Responsible parties must take reasonable steps to ensure personal information is complete, accurate, not misleading, and updated.',
      riskLevel: 'medium',
      keywords: ['data quality', 'accuracy'],
    },
  ],
  biasMappings: [
    {
      biasType: 'algorithmic_bias',
      provisionId: 'popia_s71',
      riskWeight: 0.85,
      mechanism:
        'Algorithmic bias in legal-effect decisions violates s.71 reasoning + objection rights',
      example:
        'Insurer pricing model produces systematically higher premiums on a protected characteristic',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'popia_s24',
      riskWeight: 0.5,
      mechanism: 'Confirmation bias in data curation produces incomplete or misleading information',
      example: 'Responsible party retains favourable data and deletes contradictory observations',
    },
  ],
};

export const SARB_FRAMEWORK: RegulatoryFramework = {
  id: 'sarb_model_risk',
  name: 'South African Reserve Bank — Model Risk Governance',
  jurisdiction: 'South Africa',
  category: 'financial',
  lastUpdated: '2024-02-15',
  provisions: [
    {
      id: 'sarb_d2_2022',
      framework: 'sarb_model_risk',
      section: 'Directive D2/2022',
      title: 'Model Risk & AI Governance',
      description:
        'SA-regulated banks must maintain documented model governance, validation, and AI risk management.',
      riskLevel: 'high',
      keywords: ['model risk', 'AI governance', 'validation'],
    },
    {
      id: 'sarb_joint_standard_2',
      framework: 'sarb_model_risk',
      section: 'Joint Standard 2 of 2024',
      title: 'Cybersecurity & Cyber Resilience',
      description:
        'Cybersecurity governance and incident response obligations covering AI/ML systems.',
      riskLevel: 'high',
      keywords: ['cybersecurity', 'cyber resilience', 'incident response'],
    },
  ],
  biasMappings: [
    {
      biasType: 'overconfidence_bias',
      provisionId: 'sarb_d2_2022',
      riskWeight: 0.65,
      mechanism: 'Overconfidence in model stability produces inadequate validation cycles',
      example: 'SA bank treats credit-scoring model as stable through ZAR cycle regimes',
    },
  ],
};

export const BOT_FRAMEWORK: RegulatoryFramework = {
  id: 'bot_tanzania',
  name: 'Bank of Tanzania — FinTech Regulatory Sandbox',
  jurisdiction: 'Tanzania',
  category: 'ai_governance',
  lastUpdated: '2023-12-01',
  provisions: [
    {
      id: 'bot_sandbox_governance',
      framework: 'bot_tanzania',
      section: 'BoT FinTech Sandbox Guidelines 2023 §V',
      title: 'AI/ML Decision Governance',
      description:
        'FinTech entities operating in the BoT sandbox must maintain documented model governance, customer disclosure, and exit-criteria evidence.',
      riskLevel: 'medium',
      keywords: ['AI governance', 'sandbox', 'customer disclosure'],
    },
  ],
  biasMappings: [
    {
      biasType: 'overconfidence_bias',
      provisionId: 'bot_sandbox_governance',
      riskWeight: 0.55,
      mechanism:
        'Overconfidence in sandbox-stage models produces inadequate exit-criteria evidence',
      example:
        'Tanzanian fintech treats sandbox-stage validation as sufficient for full-license operation',
    },
  ],
};

export const AFRICA_FRAMEWORKS: RegulatoryFramework[] = [
  NDPR_FRAMEWORK,
  CBN_AI_FRAMEWORK,
  WAEMU_FRAMEWORK,
  CMA_KENYA_FRAMEWORK,
  CBK_FRAMEWORK,
  BOG_FRAMEWORK,
  FRC_NIGERIA_FRAMEWORK,
  CBE_FRAMEWORK,
  POPIA_FRAMEWORK,
  SARB_FRAMEWORK,
  BOT_FRAMEWORK,
];
