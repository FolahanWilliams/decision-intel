/**
 * Built-in Decision Playbook Templates
 *
 * Pre-configured analysis profiles for common high-stakes decision types.
 * Each template bundles: document type, compliance frameworks, bias focus areas,
 * and persona configuration to optimize the analysis pipeline for a specific use case.
 */

export interface PlaybookTemplate {
  name: string;
  description: string;
  category: string;
  industry: string | null;
  documentType: string | null;
  complianceFrameworks: string[];
  biasFocus: string[];
  personaConfig: {
    roles: Array<{
      name: string;
      role: string;
      focus: string;
      riskTolerance: string;
    }>;
  };
}

export const BUILT_IN_PLAYBOOKS: PlaybookTemplate[] = [
  {
    name: 'M&A Due Diligence',
    description:
      "Comprehensive bias audit for M&A proposals, acquisition memos, and deal evaluation documents. Detects winner's curse, overconfidence in synergies, and anchoring to initial valuations.",
    category: 'm_and_a',
    industry: 'financial_services',
    documentType: 'due_diligence',
    complianceFrameworks: ['sox_framework', 'sec_reg_d'],
    biasFocus: [
      'winners_curse',
      'overconfidence_bias',
      'anchoring_bias',
      'confirmation_bias',
      'sunk_cost_fallacy',
      'planning_fallacy',
    ],
    personaConfig: {
      roles: [
        {
          name: 'Skeptical CFO',
          role: 'Chief Financial Officer',
          focus: 'Valuation assumptions and synergy realism',
          riskTolerance: 'conservative',
        },
        {
          name: 'Integration Lead',
          role: 'Post-Merger Integration',
          focus: 'Operational feasibility and cultural fit',
          riskTolerance: 'moderate',
        },
        {
          name: 'Independent Director',
          role: 'Board Member',
          focus: 'Shareholder value and strategic alternatives',
          riskTolerance: 'conservative',
        },
        {
          name: 'Market Analyst',
          role: 'Strategy',
          focus: 'Competitive dynamics and market timing',
          riskTolerance: 'moderate',
        },
        {
          name: 'Risk Officer',
          role: 'Enterprise Risk',
          focus: 'Downside scenarios and tail risks',
          riskTolerance: 'conservative',
        },
      ],
    },
  },
  {
    name: 'Board Strategy Review',
    description:
      'Audit strategic plans, annual strategy documents, and board presentations for groupthink, status quo bias, and overconfidence in forecasts.',
    category: 'board_review',
    industry: null,
    documentType: null,
    complianceFrameworks: ['sox_framework'],
    biasFocus: [
      'groupthink',
      'status_quo_bias',
      'overconfidence_bias',
      'planning_fallacy',
      'survivorship_bias',
      'framing_effect',
    ],
    personaConfig: {
      roles: [
        {
          name: "Devil's Advocate",
          role: 'Independent Director',
          focus: 'Challenge assumptions and surface blind spots',
          riskTolerance: 'conservative',
        },
        {
          name: 'Customer Champion',
          role: 'Chief Customer Officer',
          focus: 'Market reality and customer needs',
          riskTolerance: 'moderate',
        },
        {
          name: 'Innovation Scout',
          role: 'Chief Innovation Officer',
          focus: 'Disruptive threats and emerging trends',
          riskTolerance: 'aggressive',
        },
        {
          name: 'Operations Realist',
          role: 'Chief Operating Officer',
          focus: 'Execution feasibility and resource constraints',
          riskTolerance: 'conservative',
        },
        {
          name: 'Financial Guardian',
          role: 'Audit Committee Chair',
          focus: 'Capital allocation and return hurdles',
          riskTolerance: 'conservative',
        },
      ],
    },
  },
  {
    name: 'Risk Assessment',
    description:
      'Evaluate risk reports, risk appetite statements, and regulatory submissions for optimism bias, normalcy bias, and selective reporting.',
    category: 'risk_assessment',
    industry: null,
    documentType: null,
    complianceFrameworks: ['fca_consumer_duty', 'basel3_framework'],
    biasFocus: [
      'optimism_bias',
      'normalcy_bias',
      'availability_bias',
      'anchoring_bias',
      'framing_effect',
      'authority_bias',
    ],
    personaConfig: {
      roles: [
        {
          name: 'Worst-Case Thinker',
          role: 'Tail Risk Analyst',
          focus: 'Black swan scenarios and correlated risks',
          riskTolerance: 'conservative',
        },
        {
          name: 'Regulatory Lens',
          role: 'Chief Compliance Officer',
          focus: 'Regulatory expectations and reporting accuracy',
          riskTolerance: 'conservative',
        },
        {
          name: 'Quantitative Auditor',
          role: 'Risk Model Validator',
          focus: 'Methodology soundness and data quality',
          riskTolerance: 'moderate',
        },
        {
          name: 'Business Context',
          role: 'Business Line Head',
          focus: 'Practical risk-reward trade-offs',
          riskTolerance: 'moderate',
        },
        {
          name: 'External Reviewer',
          role: 'Independent Risk Consultant',
          focus: 'Industry benchmarks and peer comparison',
          riskTolerance: 'conservative',
        },
      ],
    },
  },
  {
    name: 'Strategic Investment',
    description:
      'Audit investment memos, capital allocation proposals, and funding requests for confirmation bias, anchoring to management projections, and herding behavior.',
    category: 'investment_committee',
    industry: 'financial_services',
    documentType: 'ic_memo',
    complianceFrameworks: ['sec_reg_d', 'fca_consumer_duty'],
    biasFocus: [
      'confirmation_bias',
      'anchoring_bias',
      'herding_behavior',
      'overconfidence_bias',
      'disposition_effect',
      'authority_bias',
    ],
    personaConfig: {
      roles: [
        {
          name: 'Bear Case Analyst',
          role: 'Investment Analyst',
          focus: 'Downside scenarios and exit risk',
          riskTolerance: 'conservative',
        },
        {
          name: 'Portfolio Fit',
          role: 'Portfolio Manager',
          focus: 'Concentration risk and correlation',
          riskTolerance: 'moderate',
        },
        {
          name: 'Due Diligence Lead',
          role: 'Operations DD',
          focus: 'Management team quality and operational risks',
          riskTolerance: 'moderate',
        },
        {
          name: 'Market Timer',
          role: 'Macro Strategist',
          focus: 'Cycle positioning and macro headwinds',
          riskTolerance: 'conservative',
        },
        {
          name: 'Value Skeptic',
          role: 'Valuation Specialist',
          focus: 'Comparable analysis and multiple justification',
          riskTolerance: 'conservative',
        },
      ],
    },
  },
  {
    name: 'Product Launch Decision',
    description:
      'Evaluate product launch proposals, go/no-go documents, and business cases for planning fallacy, sunk cost escalation, and overconfidence in market sizing.',
    category: 'strategic_planning',
    industry: 'technology',
    documentType: null,
    complianceFrameworks: [],
    biasFocus: [
      'planning_fallacy',
      'sunk_cost_fallacy',
      'overconfidence_bias',
      'confirmation_bias',
      'survivorship_bias',
      'bandwagon_effect',
    ],
    personaConfig: {
      roles: [
        {
          name: 'Customer Skeptic',
          role: 'Head of User Research',
          focus: 'Actual user need vs assumed demand',
          riskTolerance: 'moderate',
        },
        {
          name: 'Engineering Realist',
          role: 'VP Engineering',
          focus: 'Technical debt and delivery timeline',
          riskTolerance: 'conservative',
        },
        {
          name: 'Unit Economics Hawk',
          role: 'CFO',
          focus: 'CAC, LTV, and path to profitability',
          riskTolerance: 'conservative',
        },
        {
          name: 'Competitive Watcher',
          role: 'Strategy Lead',
          focus: 'Competitive response and differentiation',
          riskTolerance: 'moderate',
        },
        {
          name: 'Growth Optimist',
          role: 'Head of Growth',
          focus: 'Distribution channels and market timing',
          riskTolerance: 'aggressive',
        },
      ],
    },
  },
  {
    name: 'Hiring & People Decisions',
    description:
      'Audit executive hiring proposals, restructuring plans, and talent strategy documents for halo effect, similarity bias, and authority bias.',
    category: 'custom',
    industry: null,
    documentType: null,
    complianceFrameworks: [],
    biasFocus: [
      'halo_effect',
      'authority_bias',
      'confirmation_bias',
      'anchoring_bias',
      'framing_effect',
      'groupthink',
    ],
    personaConfig: {
      roles: [
        {
          name: 'Culture Fit Skeptic',
          role: 'Head of People',
          focus: 'Diversity of thought and culture add vs fit',
          riskTolerance: 'moderate',
        },
        {
          name: 'Performance Analyst',
          role: 'Analytics Lead',
          focus: 'Data-driven assessment over gut feel',
          riskTolerance: 'moderate',
        },
        {
          name: 'Business Needs',
          role: 'Hiring Manager',
          focus: 'Role requirements and team gaps',
          riskTolerance: 'moderate',
        },
        {
          name: 'External Benchmark',
          role: 'Executive Recruiter',
          focus: 'Market comp and candidate quality',
          riskTolerance: 'moderate',
        },
        {
          name: 'Long-term Thinker',
          role: 'CEO',
          focus: 'Leadership pipeline and succession',
          riskTolerance: 'moderate',
        },
      ],
    },
  },
];

export const PLAYBOOK_CATEGORIES = [
  { value: 'm_and_a', label: 'M&A / Transactions' },
  { value: 'board_review', label: 'Board & Strategy Review' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'investment_committee', label: 'Investment Committee' },
  { value: 'strategic_planning', label: 'Strategic Planning' },
  { value: 'custom', label: 'Custom' },
] as const;
