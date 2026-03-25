/**
 * GDPR Automated Decision-Making Framework
 *
 * Maps cognitive biases to GDPR provisions related to automated
 * individual decision-making, profiling, and the right to explanation.
 *
 * Reference: Regulation (EU) 2016/679 (GDPR), Articles 13-14, 22, 35; Recital 71
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const GDPR_ART22_FRAMEWORK: RegulatoryFramework = {
  id: 'gdpr_art22',
  name: 'GDPR Automated Decisions (Art. 22)',
  jurisdiction: 'European Union',
  category: 'data_privacy',
  lastUpdated: '2025-06-01',

  provisions: [
    {
      id: 'gdpr_automated_decisions',
      framework: 'gdpr_art22',
      section: 'Article 22',
      title: 'Automated Individual Decision-Making',
      description:
        'Data subjects have the right not to be subject to decisions based solely on automated processing, including profiling, which produces legal effects or similarly significantly affects them. Exceptions require explicit consent, contractual necessity, or legal authorization with suitable safeguards.',
      riskLevel: 'critical',
      keywords: ['automated decision', 'profiling', 'legal effects', 'solely automated', 'significant effect'],
    },
    {
      id: 'gdpr_right_to_explanation',
      framework: 'gdpr_art22',
      section: 'Articles 13-14',
      title: 'Right to Meaningful Information',
      description:
        'Data subjects must receive meaningful information about the logic involved in automated decision-making, as well as the significance and envisaged consequences of such processing.',
      riskLevel: 'high',
      keywords: ['explanation', 'meaningful information', 'logic involved', 'consequences', 'transparency'],
    },
    {
      id: 'gdpr_dpia',
      framework: 'gdpr_art22',
      section: 'Article 35',
      title: 'Data Protection Impact Assessment',
      description:
        'Where processing, including automated decision-making and profiling, is likely to result in a high risk to the rights and freedoms of individuals, a Data Protection Impact Assessment must be carried out prior to processing.',
      riskLevel: 'high',
      keywords: ['impact assessment', 'DPIA', 'high risk', 'rights and freedoms', 'prior assessment'],
    },
    {
      id: 'gdpr_safeguards',
      framework: 'gdpr_art22',
      section: 'Recital 71',
      title: 'Safeguards for Automated Decisions',
      description:
        'Automated decisions must include safeguards such as the right to obtain human intervention, the right to express one\'s point of view, and the right to contest the decision. Processing must prevent discriminatory effects based on protected characteristics.',
      riskLevel: 'critical',
      keywords: ['human intervention', 'safeguards', 'contest decision', 'non-discrimination', 'express view'],
    },
  ],

  biasMappings: [
    { biasType: 'confirmation_bias', provisionId: 'gdpr_dpia', riskWeight: 0.7, mechanism: 'Confirmation bias in impact assessments leads to understating risks to data subjects by selectively evaluating favorable evidence.', example: 'A DPIA team concludes "low risk to data subjects" by citing positive user feedback while ignoring complaints and access requests from affected individuals.' },
    { biasType: 'confirmation_bias', provisionId: 'gdpr_right_to_explanation', riskWeight: 0.6, mechanism: 'Confirmation bias leads to explanations that justify the decision rather than genuinely explain the logic.', example: 'An automated rejection explanation says "based on comprehensive analysis" without disclosing which specific data points drove the negative outcome.' },
    { biasType: 'anchoring_bias', provisionId: 'gdpr_automated_decisions', riskWeight: 0.6, mechanism: 'Anchoring on historical data patterns perpetuates discriminatory automated decisions against protected groups.', example: 'An automated tenant screening system anchors on historical eviction data that disproportionately affects certain ethnic groups, reproducing historical discrimination.' },
    { biasType: 'groupthink', provisionId: 'gdpr_safeguards', riskWeight: 0.7, mechanism: 'Groupthink in human review panels leads to rubber-stamping automated decisions rather than providing meaningful human intervention.', example: 'A human review panel overturns less than 1% of automated decisions because panel members assume the system is correct and don\'t want to be the dissenter.' },
    { biasType: 'authority_bias', provisionId: 'gdpr_safeguards', riskWeight: 0.8, mechanism: 'Authority bias causes human reviewers to defer to automated system recommendations, undermining the right to meaningful human intervention.', example: 'Customer service agents processing automated credit denials tell complainants "the system has decided" without exercising their authority to review the decision.' },
    { biasType: 'overconfidence_bias', provisionId: 'gdpr_dpia', riskWeight: 0.7, mechanism: 'Overconfidence in system accuracy leads to inadequate impact assessments that underestimate the risk of incorrect automated decisions.', example: 'A DPIA states "negligible risk of incorrect decisions" based on 95% aggregate accuracy, ignoring that the 5% error rate affects tens of thousands of individuals.' },
    { biasType: 'status_quo_bias', provisionId: 'gdpr_automated_decisions', riskWeight: 0.6, mechanism: 'Resistance to changing automated decision systems even when they produce demonstrably unfair outcomes.', example: 'An insurance company continues using an automated pricing model that charges higher premiums to certain postcodes despite evidence of indirect racial discrimination.' },
    { biasType: 'cognitive_misering', provisionId: 'gdpr_right_to_explanation', riskWeight: 0.7, mechanism: 'Cognitive misering produces shallow, template-based explanations that fail to provide meaningful information about decision logic.', example: 'Automated decision explanations use generic templates ("your application did not meet our criteria") that provide no insight into which specific factors drove the outcome.' },
    { biasType: 'selective_perception', provisionId: 'gdpr_dpia', riskWeight: 0.6, mechanism: 'Selective perception in monitoring automated systems leads to noticing positive outcomes while overlooking discriminatory patterns.', example: 'Monitoring dashboards highlight overall accuracy improvements while filtering out demographic breakdowns that show declining performance for minority groups.' },
    { biasType: 'framing_effect', provisionId: 'gdpr_right_to_explanation', riskWeight: 0.5, mechanism: 'Framing automated decision explanations in ways that minimize the apparent significance of the decision on the data subject.', example: 'A rejection letter frames a credit denial as "your application is being reviewed further" when in fact it has been automatically rejected with no further review planned.' },
    { biasType: 'loss_aversion', provisionId: 'gdpr_safeguards', riskWeight: 0.5, mechanism: 'Loss aversion prevents organizations from overriding profitable automated decisions even when individual cases clearly warrant human intervention.', example: 'A bank refuses to override an automated loan rejection for a clearly creditworthy applicant because reversing automated decisions would "set a precedent" that reduces system efficiency.' },
  ],
};
