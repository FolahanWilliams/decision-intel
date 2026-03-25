/**
 * Sarbanes-Oxley (SOX) Act Framework
 *
 * Maps cognitive biases to key SOX provisions governing corporate financial
 * reporting, internal controls, and executive accountability.
 *
 * Reference: Sarbanes-Oxley Act of 2002 (Pub.L. 107-204)
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const SOX_FRAMEWORK: RegulatoryFramework = {
  id: 'sox',
  name: 'Sarbanes-Oxley Act',
  jurisdiction: 'United States',
  category: 'corporate_governance',
  lastUpdated: '2025-12-01',

  provisions: [
    {
      id: 'sox_section_302',
      framework: 'sox',
      section: 'Section 302',
      title: 'CEO/CFO Certification of Financial Reports',
      description:
        'The CEO and CFO must personally certify that financial statements fairly present the company\'s financial condition and results of operations. They must certify that they have evaluated the effectiveness of disclosure controls and reported any significant deficiencies.',
      riskLevel: 'critical',
      keywords: [
        'CEO certification',
        'CFO certification',
        'financial statements',
        'disclosure controls',
        'fair presentation',
        'material misstatement',
      ],
    },
    {
      id: 'sox_section_404',
      framework: 'sox',
      section: 'Section 404',
      title: 'Internal Controls Assessment',
      description:
        'Management must establish and maintain an adequate internal control structure and procedures for financial reporting. An annual assessment of internal controls must be included in the annual report, and the external auditor must attest to management\'s assessment.',
      riskLevel: 'critical',
      keywords: [
        'internal controls',
        'ICFR',
        'control effectiveness',
        'material weakness',
        'significant deficiency',
        'audit attestation',
      ],
    },
    {
      id: 'sox_section_802',
      framework: 'sox',
      section: 'Section 802',
      title: 'Document Integrity and Retention',
      description:
        'Criminal penalties for knowingly altering, destroying, mutilating, concealing, or falsifying records, documents, or tangible objects with intent to obstruct, impede, or influence a legal investigation. Requires retention of audit workpapers for at least 7 years.',
      riskLevel: 'high',
      keywords: [
        'document retention',
        'records integrity',
        'audit workpapers',
        'evidence preservation',
        'obstruction',
        'falsification',
      ],
    },
    {
      id: 'sox_section_906',
      framework: 'sox',
      section: 'Section 906',
      title: 'Criminal Penalties for Fraudulent Certification',
      description:
        'Criminal penalties (up to $5M fine and 20 years imprisonment) for CEO/CFO who willfully certifies financial statements knowing they do not comply with SOX requirements. This creates personal liability for executives who sign off on materially misleading reports.',
      riskLevel: 'critical',
      keywords: [
        'criminal penalties',
        'willful certification',
        'fraud',
        'executive liability',
        'false certification',
        'material noncompliance',
      ],
    },
  ],

  biasMappings: [
    // ── confirmation_bias ──────────────────────────────────────────────
    {
      biasType: 'confirmation_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.85,
      mechanism:
        'Executives seeking confirming evidence when certifying financial statements, selectively reviewing data that supports a favourable financial picture while discounting anomalies or red flags that suggest misstatement.',
      example:
        'A CFO reviews quarterly revenue figures and focuses on sales reports confirming growth targets, while ignoring accounts receivable aging data that suggests revenue recognition issues requiring restatement.',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'sox_section_404',
      riskWeight: 0.7,
      mechanism:
        'Internal control assessments designed to confirm existing controls are adequate rather than genuinely test for weaknesses. Testing procedures unconsciously structured to produce pass results.',
      example:
        'An internal audit team tests a sample of transactions that are known to be clean, confirming control effectiveness, rather than risk-based sampling that might uncover control failures in high-risk areas.',
    },

    // ── anchoring_bias ─────────────────────────────────────────────────
    {
      biasType: 'anchoring_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.7,
      mechanism:
        'Financial certifications anchored to prior-period figures or management estimates rather than independently derived calculations. Executives anchor to expected results, reducing scrutiny when actuals match expectations.',
      example:
        'A CEO certifies quarterly earnings that match analyst consensus within 2%, anchoring to the expected figure without questioning whether the "coincidental" alignment reflects genuine earnings management.',
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'sox_section_404',
      riskWeight: 0.55,
      mechanism:
        'Control assessments anchored to prior-year findings, with testing focused on previously identified issues rather than fresh identification of current-year risks.',
      example:
        'Internal audit focuses testing on three control deficiencies found last year, anchoring to historical issues while a new ERP implementation has introduced entirely different control risks not covered by the testing program.',
    },

    // ── availability_heuristic ─────────────────────────────────────────
    {
      biasType: 'availability_heuristic',
      provisionId: 'sox_section_404',
      riskWeight: 0.6,
      mechanism:
        'Internal control risk assessments driven by recently publicised corporate failures rather than systematic risk analysis. Control resources allocated to prevent the last scandal rather than the next one.',
      example:
        'After a peer company\'s fraud involving journal entry manipulation, the firm over-invests in journal entry testing while under-resourcing controls over revenue recognition — the firm\'s actual highest-risk area.',
    },
    {
      biasType: 'availability_heuristic',
      provisionId: 'sox_section_802',
      riskWeight: 0.5,
      mechanism:
        'Document retention decisions influenced by vivid memories of enforcement actions rather than systematic assessment of retention requirements, leading to inconsistent compliance.',
      example:
        'After hearing about a competitor\'s destruction-of-evidence penalty, a team over-preserves email communications but neglects to retain equally important Slack messages and shared drive files.',
    },

    // ── groupthink ─────────────────────────────────────────────────────
    {
      biasType: 'groupthink',
      provisionId: 'sox_section_302',
      riskWeight: 0.8,
      mechanism:
        'Executive leadership teams develop shared narratives about financial performance that suppress dissent. Board and audit committee members fail to challenge management\'s presentation of financial results.',
      example:
        'An executive team collectively agrees to characterise a one-time gain as recurring revenue in their certification narrative, with no member willing to raise the aggressive accounting treatment in front of the CEO.',
    },
    {
      biasType: 'groupthink',
      provisionId: 'sox_section_404',
      riskWeight: 0.65,
      mechanism:
        'Audit committees and control assessment teams reach premature consensus on control adequacy, with dissenting views about control weaknesses suppressed by group dynamics.',
      example:
        'An audit committee accepts management\'s assertion that a significant deficiency is merely a "control observation" because all committee members defer to the chair\'s view that the finding is immaterial.',
    },

    // ── authority_bias ─────────────────────────────────────────────────
    {
      biasType: 'authority_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.75,
      mechanism:
        'Junior finance staff and internal auditors defer to executive authority when identifying financial reporting concerns. The authority of the certifying officers paradoxically reduces the likelihood of issues being escalated to them.',
      example:
        'A financial controller identifies a potential inventory overstatement but does not escalate it because the CFO previously expressed confidence in the inventory valuation methodology. The CFO then certifies unaware of the issue.',
    },
    {
      biasType: 'authority_bias',
      provisionId: 'sox_section_404',
      riskWeight: 0.6,
      mechanism:
        'Internal audit teams defer to management\'s assessment of control effectiveness rather than forming independent opinions. The authority of process owners overrides testing evidence.',
      example:
        'An internal auditor finds evidence of a control override but accepts the VP of Finance\'s explanation that it was a one-time exception, rather than classifying it as a control failure requiring remediation.',
    },
    {
      biasType: 'authority_bias',
      provisionId: 'sox_section_906',
      riskWeight: 0.7,
      mechanism:
        'The authority structure that makes CEOs and CFOs the certifying officers can create pressure throughout the organisation to present information that supports a clean certification, suppressing bad news.',
      example:
        'Division controllers adjust estimates and reserves to present favourable results to the CFO, not because of explicit instruction, but because the authority dynamic creates implicit pressure to avoid delivering bad news.',
    },

    // ── bandwagon_effect ───────────────────────────────────────────────
    {
      biasType: 'bandwagon_effect',
      provisionId: 'sox_section_404',
      riskWeight: 0.45,
      mechanism:
        'Adoption of control frameworks and testing methodologies because they are industry standard, without assessing whether they address the firm\'s specific risk profile.',
      example:
        'A company adopts a peer\'s SOX testing program verbatim because "everyone in the industry uses this approach," without customising it for their unique business processes, transaction types, and IT environment.',
    },

    // ── overconfidence_bias ─────────────────────────────────────────────
    {
      biasType: 'overconfidence_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.8,
      mechanism:
        'Executives overconfident in their understanding of the company\'s financial position, certifying statements without adequate diligence. Overconfidence in personal judgment substitutes for rigorous verification.',
      example:
        'A CEO certifies annual financial statements based on a 30-minute briefing and personal conviction that "I know this business," without reviewing the detailed sub-certification process or control testing results.',
    },
    {
      biasType: 'overconfidence_bias',
      provisionId: 'sox_section_404',
      riskWeight: 0.65,
      mechanism:
        'Management overconfident in the effectiveness of internal controls, leading to insufficient testing rigor and premature conclusions about control adequacy.',
      example:
        'Management asserts that internal controls are effective based on the absence of known frauds, overconfident that a lack of detected issues means controls are working, rather than considering that controls may simply not be detecting problems.',
    },

    // ── hindsight_bias ─────────────────────────────────────────────────
    {
      biasType: 'hindsight_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.55,
      mechanism:
        'After a material misstatement is discovered, hindsight bias leads to inappropriate blame attribution and punitive responses rather than systemic improvements to the certification process.',
      example:
        'After a restatement, the board concludes the CFO "should have known" about the accounting error, applying hindsight bias rather than examining whether the sub-certification and review processes were systematically adequate.',
    },
    {
      biasType: 'hindsight_bias',
      provisionId: 'sox_section_802',
      riskWeight: 0.5,
      mechanism:
        'After an investigation, hindsight bias causes teams to view routine document disposal as suspicious obstruction, or conversely, to see warning signs in documents that were ambiguous at the time.',
      example:
        'During a regulatory investigation, routine email archival deletions from 18 months prior are retrospectively characterised as evidence destruction, even though they followed standard retention policies.',
    },

    // ── planning_fallacy ───────────────────────────────────────────────
    {
      biasType: 'planning_fallacy',
      provisionId: 'sox_section_404',
      riskWeight: 0.6,
      mechanism:
        'Underestimating the time and resources required for thorough internal control testing, leading to compressed timelines, reduced sample sizes, and superficial assessments near fiscal year-end.',
      example:
        'A SOX compliance team plans 8 weeks for control testing but encounters IT access delays and staff availability issues, compressing actual testing to 4 weeks and forcing reduced sample sizes across 30% of key controls.',
    },

    // ── loss_aversion ──────────────────────────────────────────────────
    {
      biasType: 'loss_aversion',
      provisionId: 'sox_section_302',
      riskWeight: 0.7,
      mechanism:
        'Fear of the consequences of qualified certifications or disclosed weaknesses leads executives to minimise findings. The personal loss associated with disclosing a material weakness exceeds the perceived risk of non-disclosure.',
      example:
        'A CFO downgrades a likely material weakness to a significant deficiency in the certification narrative because disclosing the material weakness would trigger stock price decline and personal reputational damage.',
    },
    {
      biasType: 'loss_aversion',
      provisionId: 'sox_section_404',
      riskWeight: 0.6,
      mechanism:
        'Management avoids acknowledging control deficiencies because the costs of remediation and disclosure are felt more acutely than the diffuse risk of undetected control failures.',
      example:
        'A management team classifies a control gap as "low risk" to avoid the cost and disruption of remediation, weighting the immediate loss of budget and resources more heavily than the probabilistic risk of a future control failure.',
    },

    // ── sunk_cost_fallacy ──────────────────────────────────────────────
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'sox_section_404',
      riskWeight: 0.5,
      mechanism:
        'Continued reliance on legacy control systems and processes because of prior investment, even when those systems no longer provide effective control coverage for current business processes.',
      example:
        'A firm continues using a manual three-way matching process for procurement because it invested heavily in training staff on this process, even though an automated system would provide more reliable control and the business has outgrown manual processes.',
    },

    // ── status_quo_bias ────────────────────────────────────────────────
    {
      biasType: 'status_quo_bias',
      provisionId: 'sox_section_404',
      riskWeight: 0.55,
      mechanism:
        'Control frameworks maintained in their current form because change is perceived as risky and disruptive, even when business processes have evolved beyond what the existing controls were designed to address.',
      example:
        'A company\'s SOX control matrix has not been materially updated in 5 years despite two major acquisitions and a cloud migration, because the compliance team prefers the stability of the existing framework over the disruption of redesign.',
    },
    {
      biasType: 'status_quo_bias',
      provisionId: 'sox_section_802',
      riskWeight: 0.45,
      mechanism:
        'Document retention policies maintained without updates as communication and storage technologies evolve, creating gaps in retention for newer channels while over-retaining for traditional formats.',
      example:
        'A firm\'s document retention policy covers email and physical records in detail but has no provisions for Slack messages, Teams chats, or cloud collaboration documents, because the policy has not been updated since 2015.',
    },

    // ── framing_effect ─────────────────────────────────────────────────
    {
      biasType: 'framing_effect',
      provisionId: 'sox_section_302',
      riskWeight: 0.7,
      mechanism:
        'Financial results framed to emphasise positive metrics while technically accurate but misleading non-GAAP measures obscure underlying financial condition from the certifying executives and investors.',
      example:
        'Management presents "adjusted EBITDA" excluding stock-based compensation, restructuring charges, and acquisition costs as the primary performance metric, framing the financial position more favourably than GAAP measures would indicate.',
    },
    {
      biasType: 'framing_effect',
      provisionId: 'sox_section_404',
      riskWeight: 0.5,
      mechanism:
        'Internal control findings framed as "observations" or "enhancement opportunities" rather than deficiencies, softening the perceived severity and reducing the likelihood of appropriate remediation.',
      example:
        'An internal audit report frames a segregation-of-duties violation as a "process improvement opportunity" rather than a control deficiency, causing the audit committee to underestimate the risk and deprioritise remediation.',
    },

    // ── selective_perception ───────────────────────────────────────────
    {
      biasType: 'selective_perception',
      provisionId: 'sox_section_302',
      riskWeight: 0.65,
      mechanism:
        'Executives selectively perceive financial data that confirms their performance narrative, filtering out contradictory signals that should trigger deeper investigation before certification.',
      example:
        'A CEO reviews a dashboard showing revenue growth and customer acquisition but does not perceive the simultaneously declining gross margins and increasing customer churn that together signal unsustainable growth.',
    },
    {
      biasType: 'selective_perception',
      provisionId: 'sox_section_404',
      riskWeight: 0.5,
      mechanism:
        'Control assessors selectively perceive evidence of control effectiveness while unconsciously filtering out evidence of control failures or workarounds.',
      example:
        'A SOX tester notes that all sampled transactions have proper approvals but does not perceive that 80% of approvals were retroactive — technically present but indicative of a preventive control failure.',
    },

    // ── recency_bias ───────────────────────────────────────────────────
    {
      biasType: 'recency_bias',
      provisionId: 'sox_section_302',
      riskWeight: 0.5,
      mechanism:
        'Certification decisions disproportionately influenced by the most recent quarter\'s performance rather than the full fiscal year, leading to certifications that reflect recent trends more than overall financial position.',
      example:
        'A CEO certifies annual financial statements with an optimistic tone based on a strong Q4, despite Q1-Q3 results indicating the company narrowly met its covenants and faced liquidity stress during the middle of the year.',
    },

    // ── cognitive_misering ─────────────────────────────────────────────
    {
      biasType: 'cognitive_misering',
      provisionId: 'sox_section_302',
      riskWeight: 0.6,
      mechanism:
        'Executives apply minimal cognitive effort to the certification process, treating it as a routine sign-off rather than a genuine assessment of financial statement accuracy and control effectiveness.',
      example:
        'A CEO signs the Section 302 certification alongside a stack of other documents at the end of the quarter, spending less than 2 minutes on a certification that carries personal criminal liability.',
    },
    {
      biasType: 'cognitive_misering',
      provisionId: 'sox_section_404',
      riskWeight: 0.55,
      mechanism:
        'Internal control assessments conducted with minimal analytical effort, relying on checklists and templates rather than thoughtful evaluation of whether controls address current business risks.',
      example:
        'A SOX testing team completes control testing by filling in a standardised workpaper template with minimal narrative, checking boxes without engaging analytically with whether the evidence genuinely supports control effectiveness.',
    },
  ],
};
