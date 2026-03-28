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

export interface DemoAnalysis {
  id: string;
  documentName: string;
  shortName: string;
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
};

// ─── Example 3: Series B Investment Memo ────────────────────────────

export const DEMO_SERIES_B: DemoAnalysis = {
  id: 'demo-meridian-series-b',
  documentName: 'Meridian Health Technologies — Series B Investment Thesis ($45M Round)',
  shortName: 'Meridian Series B',
  overallScore: 58,
  noiseScore: 42,
  createdAt: '2025-06-12T09:00:00Z',
  summary:
    'This Series B investment memo presents a mixed-quality thesis for a $45M round at $380M pre-money valuation. Meridian Health Technologies has demonstrated genuine product-market fit in remote patient monitoring with $12M ARR growing 140% YoY, and its FDA 510(k) clearance for two device classes is a meaningful regulatory moat. However, the memo exhibits moderate cognitive bias contamination across 5 dimensions. TAM estimates are anchored to top-down projections without bottom-up validation, the regulatory timeline for the De Novo pathway assumes best-case FDA review cadence, and recent high-profile healthtech exits (Livongo, Nuvance) are used as comparable benchmarks without adjusting for materially different market conditions. The investment case has substance but the risk analysis is underweight relative to the capital being deployed.',
  metaVerdict:
    "CONDITIONAL APPROVE — The underlying business has defensible strengths: real clinical validation, meaningful revenue traction, and a regulatory moat that takes 18–24 months to replicate. However, approval should be contingent on specific due diligence: (1) Commission independent bottom-up TAM analysis for the three target therapeutic areas, ignoring management's top-down $28B figure, (2) Engage a regulatory affairs consultant to stress-test the De Novo classification timeline under realistic FDA backlog assumptions, (3) Require key-person insurance and retention packages for the CTO and VP of Regulatory Affairs before close, (4) Negotiate milestone-based tranche structure tied to FDA submission milestones rather than a single close, (5) Obtain reimbursement pre-authorization letters from at least two major payers before committing the full round.",
  noiseStats: { mean: 42, stdDev: 9.6, variance: 92.16 },
  noiseBenchmarks: [
    { label: 'This Document', value: 42 },
    { label: 'Series B Average', value: 35 },
    { label: 'Healthcare VC Best', value: 14 },
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
        "The investment committee reviewed the opportunity across three sessions and reached strong consensus that Meridian represents a compelling risk-adjusted return. All partners noted the strength of the clinical data and the management team's execution track record.",
      explanation:
        'Three committee sessions reaching "strong consensus" with all partners aligned is presented as validation of the thesis quality. However, unanimous agreement in a venture partnership evaluating a $45M commitment should raise questions about whether dissenting views were adequately surfaced. No red team analysis, no documentation of the strongest bear case arguments, and no discussion of what would make this investment fail.',
      suggestion:
        "Before final commitment, require one partner to formally present the bear case with equal rigor and time allocation as the bull case. Document the top three reasons this investment could result in a total loss and the committee's specific responses to each.",
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
  outcome: {
    what: 'Meridian secured $45M at $380M pre-money. Initial FDA pathway was restructured after 18-month review delay, validating the pre-mortem scenario.',
    when: 'August 2025 — close completed; FDA delay confirmed by Q4 2026',
    impact:
      'The De Novo classification required two additional rounds of clinical data submission, pushing CGM market entry to Q3 2027. Meridian raised a $20M bridge round at flat valuation to extend runway. Core RPM business continued growing at 95% YoY, partially offsetting the regulatory setback.',
  },
};

// Combined list for the demo selector
export const DEMO_ANALYSES: DemoAnalysis[] = [DEMO_NOKIA, DEMO_PHOENIX, DEMO_SERIES_B];

// Backwards compatibility
export const DEMO_ANALYSIS = DEMO_NOKIA;
