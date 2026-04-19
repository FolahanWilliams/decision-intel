export interface DemoBias {
  biasType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence: number;
}

export interface DemoLogicalFallacy {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  excerpt: string;
  explanation: string;
  score: number;
}

export interface DemoSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategicAdvice: string;
}

export interface DemoCompliance {
  frameworks: Array<{
    name: string;
    status: 'compliant' | 'partial' | 'non_compliant';
    score: number;
    findings: string[];
  }>;
  overallRisk: string;
}

export interface DemoPreMortem {
  scenarios: Array<{
    title: string;
    probability: number;
    impact: string;
    description: string;
  }>;
}

export interface DemoToxicCombination {
  name: string;
  biases: string[];
  riskLevel: 'critical' | 'high';
  description: string;
  historicalExample?: string;
}

export interface DemoAnalysis {
  id: string;
  documentName: string;
  shortName: string;
  /** One-line CSO-coded teaser shown on the picker card. Replaces the
   *  legacy 140-char truncation of `summary`. Keep ~110 chars max. */
  teaser: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases: DemoBias[];
  metaVerdict: string;
  createdAt: string;
  noiseStats: { mean: number; stdDev: number; variance: number };
  noiseBenchmarks: Array<{ label: string; value: number }>;
  simulation: {
    overallVerdict: string;
    twins: Array<{
      name: string;
      role: string;
      vote: string;
      confidence: number;
      rationale: string;
    }>;
  };
  logicalFallacies: DemoLogicalFallacy[];
  swot: DemoSwot;
  compliance: DemoCompliance;
  preMortem: DemoPreMortem;
  intelligence: {
    recallScore: number;
    similarCases: Array<{
      title: string;
      outcome: string;
      similarity: number;
      lesson: string;
    }>;
    recognitionCues: Array<{
      title: string;
      description: string;
      similarity: number;
    }>;
    patternMatch: string;
  };
  toxicCombinations?: DemoToxicCombination[];
  outcome?: {
    what: string;
    when: string;
    impact: string;
  };
}

// ─── Example 1: Microsoft-Nokia Acquisition ─────────────────────────

export const DEMO_NOKIA: DemoAnalysis = {
  id: 'demo-nokia-acquisition',
  documentName:
    'Microsoft Corporation \u2014 Strategic Rationale for Nokia Devices & Services Acquisition (2013)',
  shortName: 'Microsoft-Nokia Acquisition',
  teaser:
    'A $7.2B acquisition memo with six cognitive biases the board never named — and a $7.6B write-down 22 months later.',
  overallScore: 38,
  noiseScore: 67,
  createdAt: '2013-09-02T14:00:00Z',
  summary:
    'This strategic memorandum exhibits significant cognitive bias contamination across 6 dimensions. The decision to acquire Nokia Devices & Services for $7.2B shows classic anchoring to the seller\u2019s valuation framework, confirmation bias in selective market analysis, and sunk cost reasoning that frames the acquisition as protecting $1B in prior annual commitments. The absence of documented dissent and overconfident revenue projections suggest groupthink dynamics in the board\u2019s decision process. Microsoft ultimately wrote down $7.6B of the acquisition value in July 2015 \u2014 more than the entire purchase price.',
  metaVerdict:
    'REJECT \u2014 This decision document contains critical cognitive bias contamination that undermines the strategic rationale. The acquisition price appears anchored to the seller\u2019s framework rather than independent valuation. Recommendations: (1) Commission independent valuation ignoring Nokia\u2019s asking price entirely, (2) Formally assign a red team to argue against the acquisition with equal airtime, (3) Stress-test revenue projections using base rates from comparable mobile platform acquisitions (HP/Palm, Google/Motorola), (4) Require documented dissenting opinions before board vote.',
  noiseStats: { mean: 67, stdDev: 14.2, variance: 201.64 },
  noiseBenchmarks: [
    { label: 'This Document', value: 67 },
    { label: 'M&A Average', value: 42 },
    { label: 'Industry Best', value: 18 },
  ],
  biases: [
    {
      biasType: 'anchoring_bias',
      severity: 'critical',
      excerpt:
        'The proposed acquisition price of $7.2 billion reflects Nokia\u2019s enterprise value based on their board\u2019s assessment of the Devices & Services division\u2019s strategic worth to potential acquirers.',
      explanation:
        'The $7.2B valuation is anchored to Nokia\u2019s asking price rather than an independent assessment of intrinsic value. Nokia\u2019s smartphone market share had declined from 35% to 14% in three years, yet the acquisition price implies a premium to trailing revenue multiples. No alternative valuation methodology (DCF, comparable transactions adjusted for decline trajectory) is presented to challenge this anchor.',
      suggestion:
        'Commission an independent valuation that starts from first principles \u2014 projected cash flows under realistic market share scenarios \u2014 without reference to Nokia\u2019s asking price. Compare against base rates from HP/Palm ($1.2B, written off entirely) and Google/Motorola ($12.5B, sold for $2.9B).',
      confidence: 0.94,
    },
    {
      biasType: 'confirmation_bias',
      severity: 'high',
      excerpt:
        'Nokia\u2019s patent portfolio of 30,000+ patents and its strong brand recognition in emerging markets position the combined entity for significant growth in the global smartphone market.',
      explanation:
        'The analysis selectively emphasizes Nokia\u2019s patent portfolio and emerging market brand strength while omitting or minimizing disconfirming evidence: Lumia sales declined 41% quarter-over-quarter, Windows Phone market share was 3.6% globally, and developer ecosystem adoption was collapsing.',
      suggestion:
        'Require a balanced evidence matrix: for every bullish data point, explicitly present the strongest bearish counterpoint. The patent portfolio value should be stress-tested against the scenario where Windows Phone fails entirely.',
      confidence: 0.91,
    },
    {
      biasType: 'sunk_cost_fallacy',
      severity: 'high',
      excerpt:
        'Our existing $1 billion annual commitment to Nokia through platform support payments and marketing subsidies represents a significant investment that this acquisition would protect and build upon.',
      explanation:
        'The memo frames the $7.2B acquisition as protecting the $1B+ already spent annually on Nokia platform support. This is classic sunk cost reasoning \u2014 past expenditures should be irrelevant to a forward-looking acquisition decision.',
      suggestion:
        'Reframe the analysis as a clean-sheet decision: "If we had never invested in Nokia, would we pay $7.2B for this business today given current trajectory?" Evaluate the acquisition solely on prospective returns.',
      confidence: 0.89,
    },
    {
      biasType: 'overconfidence_bias',
      severity: 'high',
      excerpt:
        'We project the combined entity will achieve 15% global smartphone market share by 2018, driven by Nokia\u2019s emerging market distribution and the Windows Phone ecosystem\u2019s differentiated user experience.',
      explanation:
        'Revenue projections assume 15% smartphone market share by 2018 despite a trajectory showing consistent decline (35% \u2192 14% in three years). No sensitivity analysis is presented. No base rate comparison to other platform turnaround attempts is included.',
      suggestion:
        'Apply reference class forecasting: what happened to other companies that acquired declining mobile platforms? HP/Palm, Google/Motorola, and BlackBerry all experienced continued decline post-acquisition. Present three scenarios (bull/base/bear) with probability-weighted outcomes.',
      confidence: 0.92,
    },
    {
      biasType: 'groupthink',
      severity: 'medium',
      excerpt:
        'The board unanimously supports this strategic direction, recognizing the transformative potential of combining Microsoft\u2019s software expertise with Nokia\u2019s hardware design and global distribution.',
      explanation:
        'All board members are quoted expressing unanimous support. No dissenting views, devil\u2019s advocate arguments, or red team analysis are documented. Unanimous board support for a $7.2B acquisition is a red flag for groupthink.',
      suggestion:
        'Formally assign at least two board members to argue against the acquisition with equal presentation time. Document and distribute the strongest counterarguments before the final vote.',
      confidence: 0.86,
    },
    {
      biasType: 'status_quo_bias',
      severity: 'medium',
      excerpt:
        'This acquisition strengthens our commitment to the Windows Phone platform and ensures we control the full hardware-software stack, consistent with our mobile-first strategy.',
      explanation:
        'The memo frames continued investment in Windows Phone as the natural path forward, despite market evidence suggesting the platform was failing. No consideration is given to alternative approaches: licensing Android, building hardware for Android, or pivoting to services-only mobile strategy.',
      suggestion:
        'Explicitly evaluate at least three alternative strategies before committing to the acquisition: (1) License Android, (2) Exit mobile hardware entirely, (3) Acquire a company with Android momentum instead.',
      confidence: 0.84,
    },
  ],
  simulation: {
    overallVerdict: 'REJECT',
    twins: [
      {
        name: 'CFO Alex',
        role: 'Financial Rigor',
        vote: 'REJECT',
        confidence: 0.91,
        rationale:
          'The $7.2B price implies growth that contradicts every trend line. Base rate for mobile platform acquisitions suggests 70%+ probability of write-down exceeding $3B within 3 years.',
      },
      {
        name: 'Strategy Director Maya',
        role: 'Market Analysis',
        vote: 'REJECT',
        confidence: 0.87,
        rationale:
          'Windows Phone at 3.6% market share is below the viability threshold for developer ecosystem sustainability. Acquiring Nokia does not solve the app gap problem.',
      },
      {
        name: 'Risk Officer James',
        role: 'Downside Protection',
        vote: 'REJECT',
        confidence: 0.85,
        rationale:
          "Integration risk is severe: hardware margins are structurally lower than software, Nokia's organizational culture differs fundamentally, and 32,000 new employees create enormous execution risk.",
      },
      {
        name: 'Growth Advocate Priya',
        role: 'Opportunity Assessment',
        vote: 'CONDITIONAL APPROVE',
        confidence: 0.52,
        rationale:
          'The patent portfolio has defensible value and emerging market distribution is genuinely hard to build. But only at a significantly lower price ($3-4B) with aggressive milestone-based earnouts.',
      },
    ],
  },
  logicalFallacies: [
    {
      name: 'Appeal to Authority',
      severity: 'high',
      excerpt: 'Nokia\u2019s board\u2019s assessment of strategic worth',
      explanation:
        'The valuation relies on Nokia\u2019s own board assessment rather than independent analysis. This is circular reasoning when buying from the entity making the valuation.',
      score: 28,
    },
    {
      name: 'False Dilemma',
      severity: 'high',
      excerpt: 'We must control the full hardware-software stack',
      explanation:
        'Presents only two options (acquire Nokia or lose mobile) while ignoring viable alternatives like partnering with Android OEMs or building a services-first strategy.',
      score: 32,
    },
    {
      name: 'Hasty Generalization',
      severity: 'medium',
      excerpt: 'Strong brand recognition in emerging markets',
      explanation:
        'Generalizes Nokia\u2019s historical brand strength to future smartphone competitiveness without accounting for the rapid shift to app-ecosystem-driven purchasing decisions.',
      score: 45,
    },
  ],
  swot: {
    strengths: [
      '30,000+ patent portfolio provides defensive IP moat',
      'Established manufacturing and supply chain across 120+ countries',
      'Strong brand recognition in emerging markets (India, Africa, SE Asia)',
    ],
    weaknesses: [
      'Smartphone market share in freefall (35% \u2192 14% in 3 years)',
      'Windows Phone ecosystem has only 3.6% global share \u2014 below developer viability threshold',
      'Hardware margins structurally lower than Microsoft\u2019s software business model',
      'Cultural integration risk with 32,000 new employees',
    ],
    opportunities: [
      'Vertical integration could enable tighter hardware-software optimization',
      'Emerging market distribution channel hard to replicate organically',
      'Patent licensing revenue potential independent of device sales',
    ],
    threats: [
      'Android ecosystem dominance accelerating (78% market share and growing)',
      'iOS capturing majority of profit pool despite lower unit share',
      'Developer community actively abandoning Windows Phone platform',
      'Comparable acquisitions (HP/Palm, Google/Motorola) resulted in massive write-downs',
    ],
    strategicAdvice:
      'The SWOT analysis reveals a fundamentally asymmetric risk profile: weaknesses and threats significantly outweigh strengths and opportunities. The patent portfolio is the only asset with defensible standalone value. Recommendation: pursue a patent licensing deal without acquiring the Devices & Services division.',
  },
  compliance: {
    frameworks: [
      {
        name: 'SOX (Sarbanes-Oxley)',
        status: 'partial',
        score: 55,
        findings: [
          'Revenue projections lack required sensitivity analysis and scenario modeling',
          'No documented risk factors or material uncertainty disclosures',
          'Board vote unanimity not supported by documented deliberation process',
        ],
      },
      {
        name: 'SEC M&A Disclosure',
        status: 'non_compliant',
        score: 35,
        findings: [
          'No fairness opinion from independent financial advisor referenced',
          'Alternative acquisition targets not evaluated or documented',
          'Material integration risks insufficiently disclosed',
        ],
      },
    ],
    overallRisk:
      'The document\u2019s compliance posture presents moderate-to-high regulatory risk, primarily due to insufficient independent valuation documentation and missing sensitivity analyses required for M&A transactions of this magnitude.',
  },
  preMortem: {
    scenarios: [
      {
        title: 'Platform Abandonment',
        probability: 0.65,
        impact: 'catastrophic',
        description:
          'Windows Phone market share continues declining below 2%, triggering mass developer exodus. The acquired hardware division becomes stranded without a viable software ecosystem, requiring $5B+ write-down.',
      },
      {
        title: 'Integration Failure',
        probability: 0.5,
        impact: 'severe',
        description:
          'Cultural clash between Microsoft\u2019s software-first and Nokia\u2019s hardware-first organizations leads to talent attrition, delayed product cycles, and missed market windows.',
      },
      {
        title: 'Market Timing Risk',
        probability: 0.4,
        impact: 'high',
        description:
          'The smartphone market consolidates faster than projected around iOS and Android duopoly, leaving no viable path to the 15% market share target.',
      },
    ],
  },
  intelligence: {
    recallScore: 82,
    similarCases: [
      {
        title: 'HP acquires Palm ($1.2B, 2010)',
        outcome: 'FAILURE',
        similarity: 0.89,
        lesson:
          'Acquiring a declining mobile platform did not reverse ecosystem collapse. Palm was shut down within 18 months.',
      },
      {
        title: 'Google acquires Motorola ($12.5B, 2012)',
        outcome: 'PARTIAL',
        similarity: 0.84,
        lesson:
          'Patent portfolio retained value, but hardware division sold for $2.9B — a 77% loss. Vertical integration did not produce differentiation.',
      },
      {
        title: 'BlackBerry pivot to enterprise (2013)',
        outcome: 'FAILURE',
        similarity: 0.71,
        lesson:
          'Dominant smartphone platform that failed to adapt. Market share decline was irreversible once developer ecosystem collapsed below viability threshold.',
      },
    ],
    recognitionCues: [
      {
        title: 'Declining Platform Acquisition Pattern',
        description:
          'Acquiring a mobile hardware company with declining market share during an ecosystem transition has a base rate failure rate of >80%.',
        similarity: 0.91,
      },
      {
        title: 'Sunk Cost Escalation Commitment',
        description:
          'This pattern of increasing commitment to protect prior investments is well-documented in M&A literature. It correlates with 2.3x higher write-down probability.',
        similarity: 0.87,
      },
    ],
    patternMatch:
      'This closely resembles the "Declining Platform Acquisition" archetype seen in HP/Palm and Google/Motorola — high failure rate when acquiring hardware companies during ecosystem collapse.',
  },
  toxicCombinations: [
    {
      name: 'Sunk Ship',
      biases: ['Sunk Cost Fallacy', 'Escalation of Commitment'],
      riskLevel: 'critical',
      description:
        'Prior $1B annual commitment to Nokia created psychological attachment that made walking away feel like wasting past investments, driving escalation.',
      historicalExample: 'Microsoft wrote down $7.6B \u2014 more than the entire purchase price.',
    },
    {
      name: 'Echo Chamber',
      biases: ['Confirmation Bias', 'Groupthink'],
      riskLevel: 'critical',
      description:
        'Selective market analysis supporting the acquisition narrative with no documented dissent from the board.',
    },
    {
      name: 'Anchored Overreach',
      biases: ['Anchoring Bias', 'Overconfidence Bias'],
      riskLevel: 'high',
      description:
        'The $7.2B price anchored to Nokia\u2019s asking price combined with wildly optimistic 15% market share projections created a valuation disconnected from reality.',
      historicalExample:
        'Nokia\u2019s smartphone share was already in freefall from 35% to 14%, yet projections assumed a reversal with no historical precedent.',
    },
  ],
  outcome: {
    what: 'Microsoft wrote down $7.6B of the acquisition value and laid off 7,800 former Nokia employees.',
    when: 'July 2015 \u2014 22 months after deal closed',
    impact:
      'The write-down exceeded the entire $7.2B acquisition price. Windows Phone was eventually discontinued in 2017.',
  },
};

// ─── Example 2: Project Phoenix Expansion ────────────────────────────

export const DEMO_PHOENIX: DemoAnalysis = {
  id: 'demo-phoenix-expansion',
  documentName: 'Strategic Initiative: Project Phoenix \u2014 European Market Expansion',
  shortName: 'Project Phoenix Expansion',
  teaser:
    'A four-country market-entry plan built on one partnership case study, $15M in sunk cost, and a 95% team consensus.',
  overallScore: 29,
  noiseScore: 74,
  createdAt: '2025-11-15T10:00:00Z',
  summary:
    'This expansion proposal demonstrates severe cognitive bias contamination across all 6 major categories. The decision to enter European markets relies entirely on appeal to authority (CEO\u2019s 30-year experience), extrapolates a single partnership success to 4 markets without variance analysis, and frames $15M in prior spending as justification to continue. The 95% team consensus is presented as validation rather than recognized as a groupthink signal. Revenue projections ($30M by Q2) lack any sensitivity analysis or competitive benchmarking.',
  metaVerdict:
    'REJECT \u2014 This proposal should not proceed without fundamental restructuring. Every major claim rests on a logical fallacy or cognitive bias. Recommendations: (1) Commission independent market research for each target country separately, (2) Develop 3-scenario financial model with probability-weighted outcomes, (3) Appoint a formal devil\u2019s advocate team, (4) Evaluate the $15M sunk cost as irrelevant to the forward-looking decision.',
  noiseStats: { mean: 74, stdDev: 16.8, variance: 282.24 },
  noiseBenchmarks: [
    { label: 'This Document', value: 74 },
    { label: 'Expansion Plans Avg', value: 38 },
    { label: 'Industry Best', value: 15 },
  ],
  biases: [
    {
      biasType: 'anchoring_bias',
      severity: 'critical',
      excerpt:
        'Our CEO, who has 30 years of experience in global markets, firmly believes that Germany should be our primary target. His judgment has never been wrong before.',
      explanation:
        'The entire market selection is anchored to a single person\u2019s judgment with zero supporting data. "Never been wrong" is survivorship bias compounded with authority anchoring. No market sizing, competitive analysis, or regulatory assessment is presented for Germany vs. alternatives.',
      suggestion:
        'Replace authority-based reasoning with data-driven market selection. Score each potential market on: TAM, competitive density, regulatory barriers, cultural fit, and talent availability. Let the data determine the target, not one person\u2019s intuition.',
      confidence: 0.96,
    },
    {
      biasType: 'confirmation_bias',
      severity: 'high',
      excerpt:
        'Based on our recent success with the TechCorp partnership last quarter, we expect similar outcomes across all European markets.',
      explanation:
        'A single partnership success is being generalized to predict outcomes across 4 entirely different markets with different regulatory environments, customer behaviors, and competitive landscapes. No disconfirming evidence is sought or presented.',
      suggestion:
        'Analyze at least 3 comparable companies that attempted European expansion from a North American base. What was their success rate? What were the common failure modes? Present the base rate, not just the best case.',
      confidence: 0.93,
    },
    {
      biasType: 'sunk_cost_fallacy',
      severity: 'high',
      excerpt:
        'We\u2019ve already invested $15M in preliminary research and partnerships. Given this substantial investment, it would be wasteful to abandon the initiative now.',
      explanation:
        'The $15M already spent is explicitly used to justify continued investment. This is textbook sunk cost reasoning. The only relevant question is whether the next dollar invested generates positive returns, regardless of what was spent previously.',
      suggestion:
        'Remove all references to prior spending from the decision framework. Reframe as: "Starting from zero today, would we invest $5M in Q1 to enter this market?" If the answer requires referencing past spending to be "yes," the decision is compromised.',
      confidence: 0.95,
    },
    {
      biasType: 'overconfidence_bias',
      severity: 'critical',
      excerpt:
        'Q2 2026: Full operations - projected $30M revenue. These projections are based on best-case scenarios. Our team is confident we\u2019ll meet or exceed these targets.',
      explanation:
        'The document explicitly admits projections are "based on best-case scenarios" yet presents them as the plan. $30M revenue in Q2 from a market entered in Q1 implies instant market penetration with zero ramp time. No scenario analysis, no sensitivity testing, no comparison to industry benchmarks for new market entry.',
      suggestion:
        'Replace best-case projections with probability-weighted scenarios: Bull (20% probability), Base (50%), Bear (30%). Industry benchmarks suggest new market entries typically achieve 10-20% of optimistic projections in year one.',
      confidence: 0.97,
    },
    {
      biasType: 'groupthink',
      severity: 'high',
      excerpt:
        'Our internal survey shows 95% of team members support this decision. Any dissenting opinions represent a small minority view that doesn\u2019t warrant serious consideration.',
      explanation:
        'The document not only reports near-unanimous consensus but explicitly dismisses the 5% who dissented as unworthy of consideration. This is a textbook groupthink indicator: dissent is marginalized rather than investigated. The dissenters may be seeing risks the majority is blind to.',
      suggestion:
        'Formally interview every dissenter. Document their concerns in full. Require the project sponsor to write a point-by-point rebuttal of each dissenting argument. If the dissent cannot be rigorously refuted, it should inform the risk assessment.',
      confidence: 0.94,
    },
    {
      biasType: 'bandwagon_effect',
      severity: 'medium',
      excerpt:
        'Since our competitors are all expanding internationally, we must do the same or risk being left behind.',
      explanation:
        'Competitor behavior is used as the primary justification for strategic action without analyzing whether those competitors are succeeding or failing in their expansions. "Everyone is doing it" is not a strategy \u2014 it\u2019s a bandwagon effect.',
      suggestion:
        'Research the actual outcomes of competitor international expansions. What percentage are profitable? What is the median time to profitability? How many have quietly retreated? Use competitor outcomes as a base rate, not their intentions as validation.',
      confidence: 0.88,
    },
  ],
  simulation: {
    overallVerdict: 'REJECT',
    twins: [
      {
        name: 'CFO Alex',
        role: 'Financial Rigor',
        vote: 'REJECT',
        confidence: 0.95,
        rationale:
          '$30M revenue in Q2 from a Q1 market entry is unrealistic by any benchmark. Best-case projections without downside analysis is a red flag. The $15M sunk cost framing reveals compromised financial reasoning.',
      },
      {
        name: 'Strategy Director Maya',
        role: 'Market Analysis',
        vote: 'REJECT',
        confidence: 0.92,
        rationale:
          'No market sizing, no competitive analysis, no regulatory assessment for Germany or any target market. Selecting a country based on one executive\u2019s intuition is not strategy \u2014 it\u2019s a gamble.',
      },
      {
        name: 'Risk Officer James',
        role: 'Downside Protection',
        vote: 'REJECT',
        confidence: 0.93,
        rationale:
          'The document dismisses dissent, uses sunk costs as justification, and presents only best-case scenarios. Every risk assessment red flag is present. This project needs to be restructured from scratch before any approval.',
      },
      {
        name: 'Growth Advocate Priya',
        role: 'Opportunity Assessment',
        vote: 'REJECT',
        confidence: 0.7,
        rationale:
          'European expansion may have merit, but this proposal provides zero evidence to support it. I cannot approve based on authority arguments and best-case projections alone. Bring back data.',
      },
    ],
  },
  logicalFallacies: [
    {
      name: 'Appeal to Authority',
      severity: 'critical',
      excerpt: 'CEO has 30 years of experience... his judgment has never been wrong',
      explanation:
        'Market selection based entirely on one person\u2019s authority rather than data. Past success does not guarantee future accuracy, especially in unfamiliar markets.',
      score: 15,
    },
    {
      name: 'Hasty Generalization',
      severity: 'critical',
      excerpt: 'TechCorp deal generated $50M... we can project at least $200M from four markets',
      explanation:
        'Extrapolating a single data point (one partnership) to predict outcomes across four different markets. This is statistically invalid with n=1.',
      score: 12,
    },
    {
      name: 'Ad Populum (Bandwagon)',
      severity: 'medium',
      excerpt: 'Our competitors are all expanding internationally, we must do the same',
      explanation:
        'Competitor behavior is used as the primary justification without analyzing whether those expansions are actually successful.',
      score: 40,
    },
    {
      name: 'False Urgency',
      severity: 'high',
      excerpt: 'The market window is closing... every week we wait, our competitors gain ground',
      explanation:
        'Creates artificial time pressure to prevent thorough analysis. No evidence is provided that the window is actually closing or that a few weeks of analysis would materially change outcomes.',
      score: 25,
    },
  ],
  swot: {
    strengths: [
      'Proven product-market fit in North American market',
      'Successful TechCorp partnership demonstrates enterprise sales capability',
      'Leadership team has international business experience',
    ],
    weaknesses: [
      'Zero European market presence or brand recognition',
      'No localization, regulatory compliance, or GDPR readiness documented',
      'Financial projections based entirely on best-case scenarios',
      'Decision framework contaminated by 6 cognitive biases',
      'No documented competitive analysis for target markets',
    ],
    opportunities: [
      'European enterprise SaaS market growing at 18% CAGR',
      'Potential first-mover advantage in specific verticals',
      'EU regulatory complexity creates barriers that favor well-resourced entrants',
    ],
    threats: [
      'Established European competitors with local relationships and regulatory knowledge',
      'GDPR compliance costs and complexity significantly underestimated',
      'Currency risk (USD/EUR volatility) not addressed in projections',
      'Cultural differences in enterprise sales cycles (typically 2-3x longer in EU)',
    ],
    strategicAdvice:
      'The opportunity exists but the execution plan is fundamentally unsound. Recommend: pause the timeline, commission proper market research, develop a phased entry strategy starting with one market, and build realistic 3-scenario financial models before seeking approval.',
  },
  compliance: {
    frameworks: [
      {
        name: 'GDPR (EU Data Protection)',
        status: 'non_compliant',
        score: 20,
        findings: [
          'No data protection impact assessment (DPIA) documented',
          'No mention of data processing agreements or privacy-by-design',
          'Customer data handling for EU market not addressed',
        ],
      },
      {
        name: 'SOX (Financial Controls)',
        status: 'non_compliant',
        score: 25,
        findings: [
          'Revenue projections explicitly based on "best-case scenarios" with no risk factors',
          'No sensitivity analysis or scenario modeling for material investment',
          'Sunk cost reasoning in financial justification raises internal control concerns',
        ],
      },
    ],
    overallRisk:
      'Critical compliance gaps across both GDPR and SOX frameworks. The proposal cannot proceed to European markets without a comprehensive GDPR compliance program, and the financial projections do not meet SOX standards for material investment decisions.',
  },
  preMortem: {
    scenarios: [
      {
        title: 'Regulatory Ambush',
        probability: 0.6,
        impact: 'catastrophic',
        description:
          'GDPR enforcement action within 6 months of launch due to zero privacy-by-design preparation. Potential fines up to 4% of global annual turnover, plus reputational damage and forced market exit.',
      },
      {
        title: 'Revenue Cliff',
        probability: 0.75,
        impact: 'severe',
        description:
          'Q2 revenue reaches $2-5M instead of projected $30M. The 90% shortfall triggers a crisis of confidence, budget clawbacks, and leadership blame game. Best-case projections make the inevitable miss look catastrophic.',
      },
      {
        title: 'Cultural Misfit',
        probability: 0.55,
        impact: 'high',
        description:
          'North American sales playbook fails in European enterprise market where sales cycles are 2-3x longer and relationship-driven. Burn through $5M in Q1 with minimal pipeline to show for it.',
      },
    ],
  },
  intelligence: {
    recallScore: 68,
    similarCases: [
      {
        title: 'WeWork International Expansion (2018)',
        outcome: 'FAILURE',
        similarity: 0.78,
        lesson:
          'Rapid multi-market international expansion without local market validation led to massive losses. Unit economics that worked domestically failed to translate.',
      },
      {
        title: 'Uber European Launch (2014-2016)',
        outcome: 'PARTIAL',
        similarity: 0.72,
        lesson:
          'Regulatory complexity in European markets was severely underestimated. Required 3x the timeline and 5x the legal budget originally planned.',
      },
    ],
    recognitionCues: [
      {
        title: 'Premature Multi-Market Entry',
        description:
          'Launching in 4+ international markets simultaneously without validated playbook. Reference class suggests 70% probability of retreat from at least 2 markets within 18 months.',
        similarity: 0.83,
      },
      {
        title: 'Best-Case-Only Financial Modeling',
        description:
          'Absence of bear/base case scenarios in financial projections. Historically correlated with 2.8x higher shortfall vs plan.',
        similarity: 0.79,
      },
    ],
    patternMatch:
      'This resembles the "Overconfident International Expansion" pattern — simultaneous multi-market entry without local validation, driven by board pressure rather than market readiness signals.',
  },
  toxicCombinations: [
    {
      name: 'Authority Cascade',
      biases: ['Anchoring Bias', 'Groupthink'],
      riskLevel: 'critical',
      description:
        'The CEO\u2019s 30-year experience anchored the entire market selection while 95% team consensus suppressed dissent. Authority-driven decisions amplified by group conformity eliminate the error-correction mechanisms a decision of this magnitude requires.',
      historicalExample:
        'WeWork\u2019s international expansion was similarly driven by Adam Neumann\u2019s conviction, bypassing market validation. The company retreated from multiple markets within 18 months.',
    },
    {
      name: 'Momentum Trap',
      biases: ['Sunk Cost Fallacy', 'Bandwagon Effect'],
      riskLevel: 'critical',
      description:
        'The $15M already spent creates forward momentum that is reinforced by competitor FOMO. Together they create an unstoppable push to continue regardless of evidence, because stopping feels like both waste and falling behind.',
    },
    {
      name: 'Optimism Spiral',
      biases: ['Overconfidence Bias', 'Confirmation Bias'],
      riskLevel: 'high',
      description:
        'Best-case-only projections ($30M by Q2) are validated by cherry-picking a single partnership success. Overconfidence generates the projections; confirmation bias selects only the evidence that supports them.',
      historicalExample:
        'Uber projected rapid European adoption based on US success, but sales cycles were 2-3x longer and regulatory costs 5x higher than planned.',
    },
  ],
};

// ─── Example 3: Strategic Partnership: Meridian Health JV ──────────────

export const DEMO_SERIES_B: DemoAnalysis = {
  id: 'demo-meridian-strategic-partnership',
  documentName:
    'Meridian Health Technologies — Strategic Partnership & Equity Stake Recommendation ($45M)',
  shortName: 'Meridian Strategic Partnership',
  teaser:
    'A $45M strategic partnership memo that anchors on top-down TAM, optimistic regulatory timing, and outdated comparables.',
  overallScore: 58,
  noiseScore: 42,
  createdAt: '2025-06-12T09:00:00Z',
  summary:
    'This strategic partnership recommendation evaluates a $45M equity stake plus joint go-to-market commitment with Meridian Health Technologies. Meridian has demonstrated genuine product-market fit in remote patient monitoring with $12M ARR growing 140% YoY, and its FDA 510(k) clearance for two device classes is a meaningful regulatory moat. However, the memo exhibits moderate cognitive bias contamination across 5 dimensions. TAM estimates are anchored to top-down projections without bottom-up validation, the regulatory timeline for the De Novo pathway assumes best-case FDA review cadence, and recent high-profile healthtech outcomes (Livongo, Nuvance) are used as comparable benchmarks without adjusting for materially different market conditions. The strategic case has substance but the risk analysis is underweight relative to the capital and reputation being committed.',
  metaVerdict:
    "CONDITIONAL APPROVE — The underlying business has defensible strengths: real clinical validation, meaningful revenue traction, and a regulatory moat that takes 18–24 months to replicate. However, approval should be contingent on specific diligence: (1) Commission independent bottom-up TAM analysis for the three target therapeutic areas, ignoring management's top-down $28B figure, (2) Engage a regulatory affairs consultant to stress-test the De Novo classification timeline under realistic FDA backlog assumptions, (3) Require key-person insurance and retention packages for the CTO and VP of Regulatory Affairs before close, (4) Negotiate milestone-based tranche structure tied to FDA submission milestones rather than a single close, (5) Obtain reimbursement pre-authorization letters from at least two major payers before committing the full round.",
  noiseStats: { mean: 42, stdDev: 9.6, variance: 92.16 },
  noiseBenchmarks: [
    { label: 'This Document', value: 42 },
    { label: 'Strategic Investment Avg', value: 35 },
    { label: 'Best-in-Class Strategy', value: 14 },
  ],
  biases: [
    {
      biasType: 'anchoring_bias',
      severity: 'high',
      excerpt:
        'The remote patient monitoring market is projected to reach $28.2B by 2028, representing a massive TAM opportunity. At current growth rates, Meridian is positioned to capture 2-4% of this addressable market within five years.',
      explanation:
        "The $28.2B TAM figure is a top-down estimate from a single industry report (Grand View Research) and is used as the anchor for Meridian's revenue projections. No bottom-up analysis validates whether the segments Meridian actually serves — chronic cardiac monitoring, post-surgical remote recovery, and diabetes management devices — collectively represent $28B or a much smaller serviceable addressable market. The 2-4% capture rate is applied to the inflated top-down number, making projected revenues appear 3-5x more attainable than a bottoms-up model would suggest.",
      suggestion:
        "Replace the top-down TAM with a bottom-up SAM analysis: count the actual number of patients in Meridian's three therapeutic areas, multiply by realistic per-patient revenue, and apply adoption curves from comparable medical device launches. The serviceable market is likely $4-7B, not $28B.",
      confidence: 0.91,
    },
    {
      biasType: 'optimism_bias',
      severity: 'high',
      excerpt:
        'We anticipate De Novo classification approval by Q1 2026, enabling expansion into the continuous glucose monitoring segment. The FDA has been increasingly supportive of digital health innovations, and our pre-submission meetings have been encouraging.',
      explanation:
        'The memo assumes best-case FDA review timelines despite the De Novo pathway averaging 14-18 months from submission to decision, with recent healthcare AI/device reviews trending longer due to increased FDA scrutiny post-2023. "Encouraging pre-submission meetings" are standard FDA process and do not predict approval timeline or outcome. The Q1 2026 target implies a 10-month review cycle, which would be in the fastest 15% of De Novo decisions historically.',
      suggestion:
        'Model three regulatory timeline scenarios: Optimistic (12 months, 20% probability), Base (18 months, 50%), and Extended (24+ months with additional data requests, 30%). Stress-test the financial model under each scenario, particularly the cash runway implications of the Extended case.',
      confidence: 0.88,
    },
    {
      biasType: 'availability_bias',
      severity: 'medium',
      excerpt:
        "The Livongo acquisition by Teladoc at $18.5B and Nuvance Health's successful IPO demonstrate that healthtech companies with clinical validation can achieve exceptional outcomes. Meridian's clinical data package is comparable in rigor to these benchmarks.",
      explanation:
        'The memo anchors exit expectations to Livongo ($18.5B acquisition) and Nuvance, both of which occurred during the 2020-2021 healthtech valuation peak. These are cognitively "available" because they were high-profile, but they represent outlier outcomes during an unprecedented market environment. Post-2022 healthtech multiples contracted 60-70%, making these comparables misleading for a 2025-2027 exit horizon. Additionally, Livongo had $289M ARR at acquisition versus Meridian\'s $12M.',
      suggestion:
        'Use post-2023 healthtech exit multiples as the primary comparable set. Median Series B-to-exit outcomes for digital health companies show 3-5x returns, not the 15-20x implied by Livongo-era comparisons. Include at least five recent healthtech exits or late-stage rounds to establish a realistic range.',
      confidence: 0.85,
    },
    {
      biasType: 'groupthink',
      severity: 'medium',
      excerpt:
        "The steering committee reviewed the opportunity across three sessions and reached strong consensus that Meridian represents a compelling strategic fit. All members noted the strength of the clinical data and the management team's execution track record.",
      explanation:
        'Three committee sessions reaching "strong consensus" with all members aligned is presented as validation of the strategic case. However, unanimous agreement on a $45M commitment with reputational exposure should raise questions about whether dissenting views were adequately surfaced. No red team analysis, no documentation of the strongest bear case arguments, and no discussion of what would make this partnership fail.',
      suggestion:
        "Before final commitment, require one committee member to formally present the bear case with equal rigor and time allocation as the bull case. Document the top three reasons this partnership could result in a write-down and the committee's specific responses to each.",
      confidence: 0.82,
    },
    {
      biasType: 'framing_effect',
      severity: 'medium',
      excerpt:
        'At $380M pre-money, Meridian is valued at 31.7x trailing ARR — a significant discount to the healthtech median of 42x for companies with comparable growth profiles and clinical validation.',
      explanation:
        'The valuation is framed as a "discount" by selecting a favorable comparison set. The 42x median is drawn from peak-era healthtech multiples and companies with significantly higher ARR bases. Current (2025) healthtech Series B rounds are closing at 15-25x ARR for companies with $10-15M ARR. At 31.7x, Meridian is actually at a premium to the current market, not a discount.',
      suggestion:
        "Reframe the valuation analysis using the current market: gather the last 20 healthtech Series B rounds from the trailing 12 months, filter for companies with $8-20M ARR and 100%+ growth, and present the actual percentile where $380M pre-money falls. Be transparent about whether this is a premium or discount in today's market.",
      confidence: 0.87,
    },
  ],
  simulation: {
    overallVerdict: 'CONDITIONAL APPROVE',
    twins: [
      {
        name: 'CFO Alex',
        role: 'Financial Rigor',
        vote: 'APPROVE',
        confidence: 0.68,
        rationale:
          '$12M ARR growing 140% YoY with 72% gross margins is a strong financial profile. Unit economics are heading in the right direction. However, the 31.7x valuation requires continued execution at this growth rate for at least 4 more quarters to justify the entry price. Approve with a milestone-based tranche structure.',
      },
      {
        name: 'Strategy Director Maya',
        role: 'Market Analysis',
        vote: 'APPROVE',
        confidence: 0.65,
        rationale:
          'The FDA 510(k) clearance creates a genuine 18-24 month regulatory moat. Remote patient monitoring has structural tailwinds from CMS reimbursement expansion and hospital-at-home mandates. The TAM is overstated but the real SAM is still large enough to support the thesis. Approve contingent on bottoms-up TAM validation.',
      },
      {
        name: 'Risk Officer James',
        role: 'Downside Protection',
        vote: 'CONDITIONAL',
        confidence: 0.55,
        rationale:
          'Key person risk on CTO and VP Regulatory is severe — the De Novo pathway knowledge is concentrated in two individuals. Reimbursement risk is underweighted: CMS rate-setting for RPM codes is under active review and could compress margins 20-30%. Conditional on key-person insurance, retention packages, and reimbursement sensitivity analysis.',
      },
      {
        name: 'Growth Advocate Priya',
        role: 'Opportunity Assessment',
        vote: 'REJECT',
        confidence: 0.6,
        rationale:
          'The growth narrative relies too heavily on the De Novo classification timeline, which is optimistic. If the FDA pathway takes 24 months instead of 10, the company burns through the Series B without accessing the CGM market and needs a bridge or down round. The exit comparables are outdated. I would reconsider at a $280-320M pre-money valuation with tranche protections.',
      },
    ],
  },
  logicalFallacies: [
    {
      name: 'Cherry Picking',
      severity: 'high',
      excerpt: "Livongo acquisition at $18.5B... Meridian's clinical data is comparable",
      explanation:
        'Selects the single most successful healthtech exit of the past decade as the primary comparable while omitting the dozens of healthtech companies that failed, were acqui-hired, or exited below their last private round during the same period. Survivorship bias in comparable selection inflates expected returns.',
      score: 30,
    },
    {
      name: 'Hasty Generalization',
      severity: 'medium',
      excerpt: 'FDA has been increasingly supportive of digital health innovations',
      explanation:
        "Generalizes from FDA's overall Digital Health Innovation Action Plan to predict a specific regulatory outcome for Meridian's De Novo submission. The FDA's general posture toward digital health does not predict the timeline or outcome for any individual device classification. In fact, De Novo review times have increased in recent quarters.",
      score: 45,
    },
    {
      name: 'False Cause',
      severity: 'medium',
      excerpt:
        '140% YoY growth demonstrates clear product-market fit and validates the $28B TAM opportunity',
      explanation:
        "Conflates the company's growth rate with TAM validation. A company can grow rapidly in a small market niche without that growth validating a $28B market estimate. Revenue growth validates demand for the specific product, not the size of the theoretical total market.",
      score: 50,
    },
  ],
  swot: {
    strengths: [
      'FDA 510(k) clearance for two device classes creates 18-24 month regulatory moat',
      '$12M ARR growing 140% YoY with 72% gross margins and improving unit economics',
      'Published peer-reviewed clinical validation (NEJM Digital Medicine, JAMA Network Open) — rare for a Series B company',
      'Established hospital system partnerships with 14 health networks covering 2,200+ beds',
      'CTO has 3 prior FDA submissions with 100% clearance rate',
    ],
    weaknesses: [
      'TAM analysis relies on top-down estimates without bottom-up validation of serviceable market',
      'Key person risk concentrated in CTO and VP of Regulatory Affairs',
      'Reimbursement strategy assumes current CMS RPM codes remain stable — rates under active review',
      'De Novo classification timeline assumes best-case FDA review cadence',
    ],
    opportunities: [
      'CMS Hospital-at-Home waiver expansion creating $3.2B incremental RPM demand',
      'De Novo CGM classification would open second major therapeutic vertical',
      'International expansion via CE Mark pathway — EU MDR compliance already in progress',
      'Platform potential: clinical data assets could support pharma partnerships for real-world evidence',
    ],
    threats: [
      'CMS reimbursement rate review for RPM codes (CPT 99453-99458) could compress margins 20-30%',
      'Apple, Google, and Samsung investing heavily in consumer health monitoring with potential to move upstream',
      'FDA De Novo pathway delays averaging 3-6 months beyond stated targets in recent quarters',
      'Post-2023 healthtech valuation compression means exit multiples may not support $380M entry price',
    ],
    strategicAdvice:
      'Meridian has real strengths that distinguish it from speculative healthtech investments: clinical validation, regulatory clearance, and meaningful revenue traction. The investment thesis has substance. However, the risk analysis is underweight in three critical areas: regulatory timeline assumptions, reimbursement stability, and key person concentration. A conditional approval with tranche-based funding tied to FDA milestones would align the investment structure with the actual risk profile.',
  },
  compliance: {
    frameworks: [
      {
        name: 'FDA 21 CFR Part 820 (Quality System Regulation)',
        status: 'compliant',
        score: 78,
        findings: [
          'Design controls documentation referenced for 510(k)-cleared devices appears complete',
          'Post-market surveillance plan documented for cleared device classes',
          'CAPA (Corrective and Preventive Action) system in place but audit trail coverage unclear for De Novo candidate device',
        ],
      },
      {
        name: 'HIPAA (Health Insurance Portability and Accountability)',
        status: 'partial',
        score: 62,
        findings: [
          'BAA (Business Associate Agreement) templates referenced for hospital partnerships',
          'PHI data handling architecture described at high level but encryption-at-rest implementation details not specified',
          'Incident response plan exists but breach notification timeline compliance not validated',
          'No third-party HIPAA audit report referenced in the memo',
        ],
      },
      {
        name: 'SEC Regulation D (Private Placement)',
        status: 'partial',
        score: 58,
        findings: [
          'Risk factors section present but does not adequately disclose regulatory timeline uncertainty',
          'Forward-looking statements lack sufficient cautionary language regarding reimbursement assumptions',
          'Material risk of key person departure not disclosed as a specific risk factor',
        ],
      },
    ],
    overallRisk:
      'Compliance posture is mixed: strong on FDA quality systems for cleared devices, but partial on HIPAA operational controls and SEC disclosure adequacy. The investment memo itself does not meet best-practice standards for risk disclosure in a Series B private placement, particularly regarding regulatory timeline and reimbursement risks. These gaps are correctable but should be addressed before close.',
  },
  preMortem: {
    scenarios: [
      {
        title: 'FDA De Novo Pathway Delay',
        probability: 0.45,
        impact: 'severe',
        description:
          'The De Novo classification for the continuous glucose monitoring device takes 24+ months instead of the projected 10 months. Meridian burns through 70% of the Series B without accessing the CGM market, forcing a bridge round at unfavorable terms or a pivot to slower-growth therapeutic areas.',
      },
      {
        title: 'CMS Reimbursement Rate Compression',
        probability: 0.35,
        impact: 'high',
        description:
          "CMS finalizes RPM code rate reductions of 25% in the 2026 Physician Fee Schedule, compressing Meridian's gross margins from 72% to 54%. The unit economics that justified the $380M valuation no longer hold, and the company must fundamentally restructure its pricing model.",
      },
      {
        title: 'Key Person Departure',
        probability: 0.25,
        impact: 'severe',
        description:
          'The CTO (who holds the institutional knowledge for the De Novo submission) departs for a competing healthtech startup or a FAANG health division. The FDA submission is delayed 12+ months while a replacement navigates the existing regulatory strategy, and two key FDA reviewer relationships are lost.',
      },
      {
        title: 'Competitive Moat Erosion',
        probability: 0.3,
        impact: 'high',
        description:
          "Apple launches a clinical-grade RPM feature integrated with Apple Health and secures FDA clearance through its established 510(k) pathway. Hospital systems begin piloting the Apple solution due to patient familiarity and zero hardware procurement costs. Meridian's customer acquisition cost doubles within two quarters.",
      },
    ],
  },
  intelligence: {
    recallScore: 74,
    similarCases: [
      {
        title: 'Livongo Health Series B ($52.5M, 2016)',
        outcome: 'SUCCESS',
        similarity: 0.81,
        lesson:
          'Chronic condition management platform with clinical validation. Key success factor was securing CMS reimbursement codes early and building payer relationships before scaling. Exited at $18.5B via Teladoc acquisition.',
      },
      {
        title: 'Theranos Series C ($200M, 2014)',
        outcome: 'FAILURE',
        similarity: 0.62,
        lesson:
          'Clinical validation claims that could not withstand FDA scrutiny. Regulatory pathway assumptions were never independently validated by investors.',
      },
      {
        title: 'Omada Health Series B ($48M, 2016)',
        outcome: 'SUCCESS',
        similarity: 0.77,
        lesson:
          'Digital health prevention platform. Phased FDA approach with initial wellness focus before clinical claims proved effective. Revenue growth sustained through payer partnerships.',
      },
    ],
    recognitionCues: [
      {
        title: 'De Novo FDA Pathway Risk',
        description:
          'The De Novo classification pathway has a median review time of 14-18 months, with recent healthtech AI devices trending longer. The projected 10-month timeline places this in the fastest 15% historically.',
        similarity: 0.88,
      },
      {
        title: 'Peak-Era Healthtech Anchoring',
        description:
          'Valuation comparables are anchored to 2020-2021 peak-era healthtech multiples. Post-2022 multiples contracted 60-70%, making these benchmarks misleading for current exit expectations.',
        similarity: 0.85,
      },
    ],
    patternMatch:
      'This resembles the "Promising Digital Health Platform with Regulatory Risk" pattern. Similar companies succeed when FDA timelines are realistic and reimbursement is secured early, but fail when regulatory assumptions are anchored to best-case scenarios.',
  },
  toxicCombinations: [
    {
      name: 'Rosy Runway',
      biases: ['Optimism Bias', 'Anchoring Bias'],
      riskLevel: 'high',
      description:
        'The $28B top-down TAM anchors revenue expectations while optimistic FDA timelines compress the path to profitability. Together they create a financial model that looks viable but collapses under realistic assumptions \u2014 the SAM is likely $4-7B and the De Novo pathway averages 14-18 months, not 10.',
      historicalExample:
        'Theranos anchored to a $200B diagnostics TAM while assuming best-case regulatory timelines. Investors who challenged neither assumption lost $600M+.',
    },
    {
      name: 'Consensus Fog',
      biases: ['Groupthink', 'Framing Effect'],
      riskLevel: 'high',
      description:
        'Unanimous investment committee consensus combined with a valuation framed as a "discount" (31.7x vs. cherry-picked 42x median) prevents critical examination. The strong consensus signals that the bear case was never given equal weight.',
    },
    {
      name: 'Survivorship Lens',
      biases: ['Availability Bias', 'Framing Effect'],
      riskLevel: 'critical',
      description:
        'Livongo\u2019s $18.5B exit and Nuvance\u2019s IPO are the most cognitively available healthtech outcomes, creating a frame where exceptional exits feel normal. The dozens of healthtech failures from the same era are invisible, distorting the expected return distribution.',
      historicalExample:
        'Post-2022 healthtech multiples contracted 60-70%. Investors who anchored to 2020-2021 peak-era exits systematically overpaid in subsequent rounds.',
    },
  ],
  outcome: {
    what: 'Meridian secured $45M at $380M pre-money. Initial FDA pathway was restructured after 18-month review delay, validating the pre-mortem scenario.',
    when: 'August 2025 — close completed; FDA delay confirmed by Q4 2026',
    impact:
      'The De Novo classification required two additional rounds of clinical data submission, pushing CGM market entry to Q3 2027. Meridian raised a $20M bridge round at flat valuation to extend runway. Core RPM business continued growing at 95% YoY, partially offsetting the regulatory setback.',
  },
};

// ─── Example 4: WeWork S-1 ────────────────────────────────────────────

export const DEMO_WEWORK: DemoAnalysis = {
  id: 'demo-wework-s1',
  documentName:
    'The We Company — Form S-1 Registration Statement: Strategic Rationale & Financial Disclosures (August 2019)',
  shortName: 'WeWork S-1 Filing',
  teaser:
    'The IPO prospectus with 11 pre-decision biases the market caught in 30 days — and a $39B valuation reset.',
  overallScore: 24,
  noiseScore: 81,
  createdAt: '2019-08-14T09:00:00Z',
  summary:
    'The We Company S-1 exhibits the most severe cognitive bias contamination of any contemporary public filing. Eleven pre-decision biases converge across valuation, governance, financial presentation, and market positioning. The $47B private valuation is anchored to SoftBank\u2019s earlier rounds rather than comparables. "Community-Adjusted EBITDA" cherry-picks metrics that frame a commercial real-estate arbitrage as a tech platform. Supervoting founder shares (20:1) combined with self-dealing transactions (building leases, "We" trademark sale) concentrate decision rights on a single person whose charisma masks operational fragility. The filing withdrew within 33 days and Adam Neumann was removed as CEO within 45.',
  metaVerdict:
    'REJECT \u2014 This IPO document contains catastrophic cognitive bias contamination across 11 dimensions that invalidate the underlying strategic rationale. The $47B valuation cannot survive cyclical stress-testing; the "tech company" framing is contradicted by an 83% gross lease obligation on a 10-year average tenor against flexible member agreements. Recommendations: (1) Re-anchor valuation to comparable real-estate arbitrage businesses (IWG trades at ~1.5x revenue, implying ~$4-6B), (2) Demand elimination of supervoting share structure and all related-party transactions, (3) Replace "Community-Adjusted EBITDA" with GAAP measures only, (4) Commission independent cyclical stress test assuming commercial real estate downturn, (5) Require documented dissenting views from non-executive directors.',
  noiseStats: { mean: 81, stdDev: 18.4, variance: 338.56 },
  noiseBenchmarks: [
    { label: 'This Document', value: 81 },
    { label: 'Tech IPO Average', value: 34 },
    { label: 'Industry Best', value: 14 },
  ],
  biases: [
    {
      biasType: 'anchoring_bias',
      severity: 'critical',
      excerpt:
        'Our most recent equity financing valued the Company at $47 billion on a pre-money basis, reflecting the transformative potential of our space-as-a-service platform.',
      explanation:
        'The $47B valuation anchors to SoftBank\u2019s January 2019 primary round rather than any public-market comparable. IWG plc, the only at-scale publicly-traded competitor, trades at ~1.5x revenue — implying WeWork is worth $4-6B on the same methodology. No DCF, precedent transaction, or peer-multiple analysis is offered to justify the private-round anchor.',
      suggestion:
        'Re-price from comparables: IWG (flexible workspace, at scale) and Boston Properties (commercial real-estate lessor). The $47B figure should be disclosed as an artifact of a specific private financing, not a market valuation.',
      confidence: 0.96,
    },
    {
      biasType: 'confirmation_bias',
      severity: 'critical',
      excerpt:
        'Community-Adjusted EBITDA, a key metric we use to evaluate our performance, was $467 million for the year ended December 31, 2018.',
      explanation:
        'The filing introduces "Community-Adjusted EBITDA" — a non-GAAP metric that excludes core operating costs including marketing, G&A, and building-level operating expenses. GAAP operating loss for 2018 was $1.69B. The custom metric systematically cherry-picks inputs that confirm a "path to profitability" narrative while omitting the structural economics (lease obligations at 10-year average tenor versus flexible member agreements) that make profitability architecturally difficult.',
      suggestion:
        'Strike all non-GAAP "community-adjusted" metrics from the investor communication. Require presentation using GAAP operating income and a cash-burn runway calculation that includes minimum lease payments.',
      confidence: 0.95,
    },
    {
      biasType: 'narrative_fallacy',
      severity: 'critical',
      excerpt:
        'Our mission is to elevate the world\u2019s consciousness. We have built a worldwide platform that supports growth, shared experiences and true success.',
      explanation:
        'The "elevate the world\u2019s consciousness" framing reframes a commercial real-estate arbitrage (long-term leases sublet short-term) as a consciousness-raising mission. Mission-coded language is consistently invoked where financial disclosures would be expected, creating a narrative scaffold that makes the business resistant to ordinary accounting scrutiny.',
      suggestion:
        'Require the S-1 narrative sections to be replaced with factual descriptions of the business model: "We lease commercial real estate on long-term contracts and sublet it on short-term member agreements." Any mission language must be supported by a measurable outcome metric.',
      confidence: 0.92,
    },
    {
      biasType: 'halo_effect',
      severity: 'high',
      excerpt:
        'Our Founder and Chief Executive Officer, Adam Neumann, has an unrivaled vision for what our company can become and the role it can play in the world.',
      explanation:
        'Executive biographical framing emphasizes "unrivaled vision" across 15+ occurrences in the S-1 while governance red flags (supervoting shares at 20:1, trust structure surviving founder\u2019s death, related-party real-estate leases to entities controlled by Neumann, $5.9M paid to acquire the "We" trademark from Neumann) are disclosed but not contextualized. Positive founder attributes halo onto operational judgment that independent directors should evaluate separately.',
      suggestion:
        'Require the S-1 to group all founder-related transactions into a single "Related-Party Risks" section with aggregate dollar exposure. Separate founder vision from operational-execution capability in the risk factors.',
      confidence: 0.89,
    },
    {
      biasType: 'overconfidence_bias',
      severity: 'high',
      excerpt:
        'We believe the addressable market for our core Space-as-a-Service membership offering in the 280 target cities is $1.6 trillion.',
      explanation:
        'The $1.6 trillion TAM is computed by multiplying office-worker counts across 280 cities by average occupancy costs, with no adjustment for penetration realism, competitive capture, or cyclical compression. WeWork\u2019s 2018 revenue ($1.82B) implies a 0.1% share of this TAM — the framing makes hypergrowth feel easy when the structural limits (lease capacity, build-out pace, churn-adjusted LTV) make it architecturally constrained.',
      suggestion:
        'Present TAM adjusted for realistic penetration ceilings (e.g., IWG at peak achieved <1% of its TAM globally). Include a sensitivity chart showing revenue under 0.5%, 1%, and 2% penetration scenarios with corresponding capital requirements.',
      confidence: 0.91,
    },
    {
      biasType: 'authority_bias',
      severity: 'high',
      excerpt:
        'Our high-vote stock structure ensures that our founder continues to provide visionary leadership as we execute on our long-term strategy.',
      explanation:
        'The dual-class share structure grants 20 votes per share to Neumann-held stock versus 1 vote per public share, providing concentrated decision authority with no external accountability. The framing ("ensures founder provides visionary leadership") treats governance concentration as a feature rather than a risk. Post-IPO public shareholders would hold <2% of voting power despite holding a majority of economic interest.',
      suggestion:
        'Require standard 1:1 voting structure or disclose voting concentration prominently in the summary risk factors. Benchmark against Facebook (10:1, widely criticized) and Google (10:1, lost GIC investor over it) as the upper bounds of acceptable governance concentration.',
      confidence: 0.9,
    },
    {
      biasType: 'sunk_cost_fallacy',
      severity: 'high',
      excerpt:
        'We have invested $12.8 billion to build our global community platform — capital that positions us for the next phase of growth.',
      explanation:
        'Prior invested capital ($12.8B across SoftBank and preceding rounds) is framed as a foundation that justifies the IPO valuation and continued capital absorption. This is classic sunk cost reasoning: past expenditure does not establish forward value. Comparable analysis would ask what the business is worth to a buyer who has spent $0 previously.',
      suggestion:
        'Reframe as a clean-sheet valuation: "If a new buyer acquired this business today with no prior investment, what would it be worth?" This exercise typically produces valuations 70-80% below the cumulative-invested-capital framing.',
      confidence: 0.88,
    },
    {
      biasType: 'illusion_of_control',
      severity: 'high',
      excerpt:
        'Our member experience is designed and operated entirely by us, giving us full control over the quality and consistency of community value we deliver.',
      explanation:
        'The filing claims operational control over the member experience while omitting that the underlying real-estate economics are entirely determined by commercial-office market cycles. WeWork is exposed to occupancy risk, build-out cost inflation, and municipal lease regulations — none of which it controls. The "full control" language creates a false sense of operational resilience.',
      suggestion:
        'Add a dedicated section quantifying exogenous risk factors: percent of portfolio in rent-controlled markets, blended lease duration, build-out cost volatility, and occupancy sensitivity to GDP. Avoid "control" language where cyclical dependency exists.',
      confidence: 0.86,
    },
    {
      biasType: 'optimism_bias',
      severity: 'medium',
      excerpt:
        'As we scale, we expect significant operating leverage from fixed cost absorption and a continued trajectory toward profitability.',
      explanation:
        'Profitability projections assume simultaneous (1) revenue growth continuing at 100%+ YoY, (2) gross margin improvement of 500-700 bps, (3) G&A leverage of 15%+ of revenue, and (4) no cyclical commercial-real-estate disruption. Each assumption is plausible in isolation; their joint probability is not disclosed. Historically, businesses that require all of multiple concurrent improvements to hit projections miss on at least one.',
      suggestion:
        'Present a joint-probability sensitivity: what is the probability of hitting all four improvements simultaneously, given base rates from comparable businesses? Include a downside scenario where only two of the four improvements materialize.',
      confidence: 0.83,
    },
    {
      biasType: 'bandwagon_effect',
      severity: 'medium',
      excerpt:
        'We are a community company committed to maximum global impact, similar to how Airbnb has redefined hospitality and Uber has redefined transportation.',
      explanation:
        'The S-1 positions WeWork alongside Airbnb (peer-to-peer hospitality) and Uber (peer-to-peer transportation) to inherit their valuation frameworks. The underlying business models differ categorically: Airbnb and Uber are asset-light marketplace businesses; WeWork owns long-dated lease liabilities. The peer-group framing is chosen to justify valuation multiples the actual business does not earn on its own economics.',
      suggestion:
        'Force explicit peer-set disclosure based on operational similarity: IWG (flexible workspace, real-estate-heavy), Realogy (real-estate services), Boston Properties (commercial lessor). Disclose how the proposed valuation multiple compares to each.',
      confidence: 0.85,
    },
    {
      biasType: 'survivorship_bias',
      severity: 'medium',
      excerpt:
        'Building on the success of our core membership offering, we have expanded into adjacent categories including WeLive, WeGrow, Powered by We, and our strategic investments portfolio.',
      explanation:
        'The filing presents adjacent-category expansion (WeLive residential, WeGrow education, Powered by We enterprise, Meetup acquisition) as evidence of platform leverage. The base rate of successful horizontal expansion at pre-IPO scale is historically <25%. No evidence is presented that these adjacencies have achieved unit economics comparable to the core — in fact, WeLive had 2 locations after 4 years and WeGrow served ~100 students.',
      suggestion:
        'Require disclosure of unit economics for each adjacency separately. Treat expansion-as-validation framing as a bias signal rather than evidence of platform leverage until independent financials demonstrate comparable margins.',
      confidence: 0.81,
    },
  ],
  simulation: {
    overallVerdict: 'REJECT',
    twins: [
      {
        name: 'CFO Alex',
        role: 'Financial Rigor',
        vote: 'REJECT',
        confidence: 0.95,
        rationale:
          'GAAP operating loss of $1.69B on $1.82B revenue. The "Community-Adjusted EBITDA" metric systematically excludes the largest recurring costs. The $47B valuation implies 26x revenue — IWG, the only comparable at-scale operator, trades at ~1.5x. The valuation is unsupportable under any conventional framework.',
      },
      {
        name: 'Governance Director Maya',
        role: 'Board Oversight',
        vote: 'REJECT',
        confidence: 0.94,
        rationale:
          'Supervoting shares (20:1), founder trust surviving death, related-party real-estate leases, and the $5.9M "We" trademark payment to Neumann collectively represent the most concentrated governance structure in a contemporary major IPO. No independent director could exercise meaningful oversight under this architecture.',
      },
      {
        name: 'Real-Estate Specialist James',
        role: 'Sector Benchmark',
        vote: 'REJECT',
        confidence: 0.89,
        rationale:
          'Average lease tenor of 10+ years against month-to-month member agreements creates severe cyclical exposure. The occupancy sensitivity to GDP is not disclosed. A 20% GDP contraction in any major market produces a revenue shortfall the capital structure cannot absorb.',
      },
      {
        name: 'Growth Advocate Priya',
        role: 'Opportunity Assessment',
        vote: 'CONDITIONAL APPROVE',
        confidence: 0.38,
        rationale:
          'The core flexible-workspace thesis is valid and has category growth ahead. However, conditional on: (1) valuation reset to $6-8B, (2) elimination of supervoting shares, (3) removal of all adjacencies, (4) founder transitioning out of CEO role. Without these four conditions, cannot approve.',
      },
    ],
  },
  logicalFallacies: [
    {
      name: 'Equivocation',
      severity: 'critical',
      excerpt: '"Community-Adjusted EBITDA"',
      explanation:
        'Uses the word "EBITDA" — which has a standardized accounting definition — then redefines it to exclude operating costs that are unambiguously operating costs. Trading on the term\u2019s established meaning while substituting a custom definition is a textbook equivocation fallacy.',
      score: 22,
    },
    {
      name: 'False Analogy',
      severity: 'high',
      excerpt:
        '"similar to how Airbnb has redefined hospitality and Uber has redefined transportation"',
      explanation:
        'The analogy maps WeWork (capital-intensive, long-lease liability) onto asset-light marketplace platforms (Airbnb, Uber). The operational economics differ categorically; the analogy exists to inherit valuation multiples without earning them.',
      score: 30,
    },
    {
      name: 'Appeal to Emotion',
      severity: 'medium',
      excerpt: '"elevate the world\u2019s consciousness"',
      explanation:
        'Mission-coded language substitutes for business-model description in an SEC filing. The emotional framing makes ordinary accounting scrutiny feel reductive or hostile to a valid purpose.',
      score: 38,
    },
  ],
  swot: {
    strengths: [
      'Category leadership in flexible workspace — largest private operator globally',
      'Brand recognition disproportionate to revenue scale',
      'Portfolio of prime real-estate locations in 100+ cities',
    ],
    weaknesses: [
      'GAAP operating loss of $1.69B on $1.82B revenue (2018)',
      '83% of forward obligations are fixed-rate lease payments with 10+ year average tenor',
      'Member agreements are short-dated (many month-to-month), creating severe duration mismatch',
      'Dual-class share structure excludes public shareholders from governance',
    ],
    opportunities: [
      'Enterprise (Powered by We) segment has validated 50%+ gross margins in pilot locations',
      'Flexible workspace secular growth (~15% category CAGR)',
      'International markets still under-penetrated',
    ],
    threats: [
      'Commercial real-estate downturn would expose duration mismatch immediately',
      'IWG plc trades at ~1.5x revenue — the public-market anchor for the sector',
      'Adjacency businesses (WeLive, WeGrow) consume capital without validated unit economics',
      'Founder governance structure may prevent critical course corrections',
    ],
    strategicAdvice:
      'Pursue the core flexible-workspace thesis at appropriate valuation (~$6-8B). Divest all adjacencies. Eliminate supervoting shares. Replace founder with operator CEO. The business is viable; the filing architecture is not.',
  },
  compliance: {
    frameworks: [
      {
        name: 'SEC Regulation S-K',
        status: 'non_compliant',
        score: 28,
        findings: [
          'Non-GAAP "Community-Adjusted EBITDA" does not reconcile to GAAP operating income in the required format',
          'Related-party transactions disclosed but not aggregated or presented with risk assessment',
          'Dual-class share structure justifications lack comparable peer benchmarking',
        ],
      },
      {
        name: 'NYSE Corporate Governance',
        status: 'non_compliant',
        score: 31,
        findings: [
          'Independent director composition inadequate for founder-dominated voting structure',
          'Related-party transaction approval process not documented',
          'Audit committee independence compromised by founder-controlled board composition',
        ],
      },
      {
        name: 'Sarbanes-Oxley Section 404',
        status: 'partial',
        score: 58,
        findings: [
          'Internal controls framework exists but cyclical stress-testing not documented',
          'Revenue recognition policy for member agreements adequate but lease obligation disclosure insufficient',
        ],
      },
    ],
    overallRisk:
      'The filing presents severe regulatory risk across governance and non-GAAP disclosure dimensions. The SEC review process is likely to require material revisions before effectiveness, and the governance structure may not satisfy NYSE listing requirements without material amendment.',
  },
  preMortem: {
    scenarios: [
      {
        title: 'Valuation Reset During SEC Review',
        probability: 0.75,
        impact: 'catastrophic',
        description:
          'Public-market scrutiny during the SEC review period forces repricing from $47B to $8-15B, triggering employee equity repricing, loss of institutional anchor orders, and potential withdrawal of filing. IPO postponed or cancelled.',
      },
      {
        title: 'Founder Governance Crisis',
        probability: 0.6,
        impact: 'severe',
        description:
          'Institutional investor opposition to supervoting shares and related-party transactions forces founder CEO to exit. Board transition creates 6-12 month strategic uncertainty, delaying operational execution on core flexible-workspace thesis.',
      },
      {
        title: 'Commercial Real-Estate Downturn',
        probability: 0.4,
        impact: 'catastrophic',
        description:
          'GDP contraction in major markets (US coastal cities, London, Tel Aviv) produces 15-25% occupancy decline while lease obligations remain fixed. Duration mismatch consumes remaining cash reserves; requires distressed equity raise at 80-90% discount.',
      },
    ],
  },
  intelligence: {
    recallScore: 94,
    similarCases: [
      {
        title: 'Regus (now IWG) near-bankruptcy (2003)',
        outcome: 'NEAR-FAILURE',
        similarity: 0.92,
        lesson:
          'The flexible-workspace duration mismatch (long leases vs. flexible memberships) caused Regus to file for US Chapter 11 protection when the 2001 recession hit. Recovery required complete recapitalization. WeWork has the identical structural exposure.',
      },
      {
        title: 'Theranos (2015-2018)',
        outcome: 'FAILURE',
        similarity: 0.71,
        lesson:
          'Mission-coded narrative ("democratize healthcare") substituted for operational and financial transparency. Founder supervoting control prevented internal course correction. Private-market valuation ($9B peak) disconnected from underlying economics.',
      },
      {
        title: 'Blue Apron IPO (2017)',
        outcome: 'FAILURE',
        similarity: 0.58,
        lesson:
          'Private valuation ($2B) did not survive public-market scrutiny. Shares lost 50% in six months as public investors applied conventional unit-economics frameworks the private-round narrative had been insulated from.',
      },
    ],
    recognitionCues: [
      {
        title: 'Founder Halo + Supervoting Shares + Related-Party Transactions',
        description:
          'This three-way combination is the canonical "governance failure" signature in pre-IPO filings. Historical base rate: 80%+ result in material post-IPO governance intervention (founder transition, board restructuring, or going-private transaction).',
        similarity: 0.94,
      },
      {
        title: 'Non-GAAP Metric as Primary Performance Indicator',
        description:
          'When management introduces a custom non-GAAP metric ("Community-Adjusted EBITDA") and emphasizes it over GAAP equivalents in the S-1, the base rate of material restatement or SEC intervention within 24 months is ~65%.',
        similarity: 0.89,
      },
    ],
    patternMatch:
      'This closely resembles the "Mission-Coded Governance Concentration" archetype. Historical comparables (Theranos, Uber pre-governance-reset, Facebook\u2019s 2012 IPO controversy) all required post-filing governance intervention before business stabilization.',
  },
  toxicCombinations: [
    {
      name: 'Mission Shield',
      biases: ['Narrative Fallacy', 'Halo Effect', 'Appeal to Emotion'],
      riskLevel: 'critical',
      description:
        '"Elevating the world\u2019s consciousness" framing combined with founder halo makes operational scrutiny feel hostile to a valid purpose. The three-way combination disarms the analytical apparatus that would normally challenge governance and financial disclosures.',
      historicalExample:
        'Theranos used the same pattern ("democratize healthcare") to shield board-level financial disclosures for years before public collapse.',
    },
    {
      name: 'Valuation Isolation',
      biases: ['Anchoring Bias', 'Bandwagon Effect', 'Sunk Cost Fallacy'],
      riskLevel: 'critical',
      description:
        'Private-round valuation ($47B) anchors to SoftBank framework, bandwagon framing inherits Airbnb/Uber multiples, and sunk-cost framing invokes $12.8B prior investment as justification — together producing a valuation insulated from public-market comparables.',
      historicalExample:
        'Blue Apron\u2019s $2B private valuation survived inside its round-to-round narrative but lost 50% within six months of public scrutiny.',
    },
    {
      name: 'Governance Opacity',
      biases: ['Authority Bias', 'Illusion of Control', 'Overconfidence Bias'],
      riskLevel: 'critical',
      description:
        '20:1 supervoting founder shares combined with "visionary leadership" framing and overconfident TAM projections create a governance structure that cannot self-correct. The founder has both the authority and the confidence to reject all dissenting input, while the board structure removes independent accountability.',
    },
  ],
  outcome: {
    what: 'IPO withdrawn September 30, 2019. Adam Neumann removed as CEO on September 24 (6 days after S-1 filing). SoftBank intervened with $9.5B bailout package. Valuation reset to $8B.',
    when: 'September 2019 — 33 days after S-1 filing',
    impact:
      '$39B valuation destruction in 33 days. Subsequent SPAC merger in October 2021 valued the company at $9B. Filed for Chapter 11 bankruptcy on November 6, 2023 — the single largest valuation reversal of a private-market darling in US capital markets history.',
  },
};

// Combined list for the demo selector
// Three samples deliberately — three in a row reads as a cleaner visual
// lineup on the demo page than four. Nokia + WeWork are the real famous
// decisions; Phoenix covers the market-entry scenario most CSOs recognise.
// DEMO_SERIES_B stays exported above so any direct deep-link keeps working.
export const DEMO_ANALYSES: DemoAnalysis[] = [DEMO_NOKIA, DEMO_WEWORK, DEMO_PHOENIX];

// Backwards compatibility
export const DEMO_ANALYSIS = DEMO_NOKIA;
