/**
 * EU AI Act Framework (2024)
 *
 * Maps cognitive biases to EU AI Act provisions. The AI Act classifies AI
 * systems by risk level and imposes requirements for high-risk systems
 * including risk management, data governance, transparency, and human oversight.
 *
 * Reference: Regulation (EU) 2024/1689 — Artificial Intelligence Act
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const EU_AI_ACT_FRAMEWORK: RegulatoryFramework = {
  id: 'eu_ai_act',
  name: 'EU AI Act',
  jurisdiction: 'European Union',
  category: 'ai_governance',
  lastUpdated: '2025-08-01',

  provisions: [
    {
      id: 'euaia_high_risk',
      framework: 'eu_ai_act',
      section: 'Article 6',
      title: 'High-Risk AI Classification',
      description:
        'AI systems that pose significant risks to health, safety, or fundamental rights are classified as high-risk and subject to mandatory requirements. This includes AI used in employment, creditworthiness, law enforcement, and critical infrastructure.',
      riskLevel: 'critical',
      keywords: ['high-risk', 'classification', 'safety', 'fundamental rights', 'critical infrastructure'],
    },
    {
      id: 'euaia_risk_management',
      framework: 'eu_ai_act',
      section: 'Article 9',
      title: 'Risk Management System',
      description:
        'High-risk AI systems must implement a risk management system that identifies, evaluates, and mitigates risks throughout the AI lifecycle, including risks of bias, discrimination, and unintended harmful outcomes.',
      riskLevel: 'high',
      keywords: ['risk management', 'lifecycle', 'mitigation', 'bias', 'discrimination'],
    },
    {
      id: 'euaia_data_governance',
      framework: 'eu_ai_act',
      section: 'Article 10',
      title: 'Data and Data Governance',
      description:
        'Training, validation, and testing datasets must be subject to appropriate data governance practices including examination for biases, gaps, and representativeness.',
      riskLevel: 'high',
      keywords: ['data governance', 'training data', 'bias', 'representativeness', 'validation'],
    },
    {
      id: 'euaia_transparency',
      framework: 'eu_ai_act',
      section: 'Article 13',
      title: 'Transparency and Information',
      description:
        'High-risk AI systems must be designed to enable users to interpret outputs and understand the system\'s capabilities and limitations. Documentation must be clear and accessible.',
      riskLevel: 'high',
      keywords: ['transparency', 'explainability', 'interpretability', 'documentation', 'limitations'],
    },
    {
      id: 'euaia_human_oversight',
      framework: 'eu_ai_act',
      section: 'Article 14',
      title: 'Human Oversight',
      description:
        'High-risk AI systems must allow effective human oversight during use, enabling humans to understand, monitor, and intervene in the AI\'s operation, including the ability to override or reverse decisions.',
      riskLevel: 'critical',
      keywords: ['human oversight', 'human-in-the-loop', 'override', 'intervention', 'monitoring'],
    },
  ],

  biasMappings: [
    { biasType: 'confirmation_bias', provisionId: 'euaia_data_governance', riskWeight: 0.8, mechanism: 'Confirmation bias in data curation leads to training datasets that reinforce existing patterns while excluding contradictory evidence, creating biased AI outputs.', example: 'An AI credit scoring team selects training data that confirms their hypothesis about creditworthiness, excluding data from demographics that contradict their model.' },
    { biasType: 'confirmation_bias', provisionId: 'euaia_risk_management', riskWeight: 0.7, mechanism: 'Confirmation bias in risk assessment leads to underestimating risks that contradict the team\'s belief in the system\'s accuracy.', example: 'AI developers dismiss bias audit findings that show discriminatory outcomes because they conflict with the team\'s confidence in their fairness metrics.' },
    { biasType: 'anchoring_bias', provisionId: 'euaia_risk_management', riskWeight: 0.6, mechanism: 'Anchoring to initial performance metrics prevents recognition of degraded accuracy over time.', example: 'A team anchors to 95% accuracy measured at launch and fails to detect that accuracy has dropped to 78% for certain demographic groups.' },
    { biasType: 'groupthink', provisionId: 'euaia_human_oversight', riskWeight: 0.8, mechanism: 'Groupthink in development teams creates blind spots that human oversight mechanisms should catch but fail to because oversight personnel share the same groupthink.', example: 'An AI ethics board rubber-stamps deployment because all members share the development team\'s optimistic assumptions about system performance.' },
    { biasType: 'overconfidence_bias', provisionId: 'euaia_transparency', riskWeight: 0.7, mechanism: 'Overconfidence in AI capabilities leads to understating limitations in user-facing documentation.', example: 'System documentation claims "high accuracy across all demographics" without disclosing known performance gaps for minority populations.' },
    { biasType: 'overconfidence_bias', provisionId: 'euaia_risk_management', riskWeight: 0.8, mechanism: 'Overconfidence in model robustness leads to inadequate stress testing and failure to identify edge cases.', example: 'Developers skip adversarial testing because they believe their model is "robust enough" based on standard benchmarks.' },
    { biasType: 'authority_bias', provisionId: 'euaia_human_oversight', riskWeight: 0.7, mechanism: 'Users defer to AI recommendations without critical evaluation, undermining the purpose of human oversight.', example: 'Loan officers approve all AI-recommended rejections without review because they perceive the AI as more authoritative than their own judgment.' },
    { biasType: 'status_quo_bias', provisionId: 'euaia_data_governance', riskWeight: 0.6, mechanism: 'Resistance to updating training data perpetuates historical biases encoded in legacy datasets.', example: 'A hiring AI continues to use 10-year-old training data that reflects historical gender imbalances, despite policy changes to promote diversity.' },
    { biasType: 'selective_perception', provisionId: 'euaia_data_governance', riskWeight: 0.7, mechanism: 'Selective perception in data labeling introduces systematic bias through inconsistent annotation criteria.', example: 'Data labelers consistently rate ambiguous cases differently for different demographic groups, introducing annotation bias into the training set.' },
    { biasType: 'cognitive_misering', provisionId: 'euaia_human_oversight', riskWeight: 0.7, mechanism: 'Cognitive misering leads human overseers to rubber-stamp AI decisions without meaningful review.', example: 'Human reviewers of AI-flagged content approve 98% of AI decisions in under 3 seconds, providing no meaningful oversight.' },
    { biasType: 'bandwagon_effect', provisionId: 'euaia_high_risk', riskWeight: 0.5, mechanism: 'Deploying AI because competitors have, without proper risk classification of the specific use case.', example: 'A company deploys AI-based hiring screening because "everyone in the industry uses it" without conducting the required conformity assessment.' },
    { biasType: 'planning_fallacy', provisionId: 'euaia_risk_management', riskWeight: 0.6, mechanism: 'Underestimating the time and resources needed for proper AI risk management and compliance.', example: 'A team plans 2 weeks for AI Act compliance when the conformity assessment alone requires 3 months of documentation and testing.' },
  ],
};
