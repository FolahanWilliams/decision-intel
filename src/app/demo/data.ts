export interface DemoBias {
  biasType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  excerpt: string;
  explanation: string;
  suggestion: string;
  confidence: number;
}

export interface DemoAnalysis {
  id: string;
  documentName: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases: DemoBias[];
  metaVerdict: string;
  createdAt: string;
  noiseStats: { mean: number; stdDev: number; variance: number };
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
}

export const DEMO_ANALYSIS: DemoAnalysis = {
  id: 'demo-nokia-acquisition',
  documentName:
    'Microsoft Corporation \u2014 Strategic Rationale for Nokia Devices & Services Acquisition (2013)',
  overallScore: 38,
  noiseScore: 67,
  createdAt: '2013-09-02T14:00:00Z',
  summary:
    'This strategic memorandum exhibits significant cognitive bias contamination across 6 dimensions. The decision to acquire Nokia Devices & Services for $7.2B shows classic anchoring to the seller\u2019s valuation framework, confirmation bias in selective market analysis, and sunk cost reasoning that frames the acquisition as protecting $1B in prior annual commitments. The absence of documented dissent and overconfident revenue projections suggest groupthink dynamics in the board\u2019s decision process. Microsoft ultimately wrote down $7.6B of the acquisition value in July 2015 \u2014 more than the entire purchase price.',
  metaVerdict:
    'REJECT \u2014 This decision document contains critical cognitive bias contamination that undermines the strategic rationale. The acquisition price appears anchored to the seller\u2019s framework rather than independent valuation. Recommendations: (1) Commission independent valuation ignoring Nokia\u2019s asking price entirely, (2) Formally assign a red team to argue against the acquisition with equal airtime, (3) Stress-test revenue projections using base rates from comparable mobile platform acquisitions (HP/Palm, Google/Motorola), (4) Require documented dissenting opinions before board vote.',
  noiseStats: {
    mean: 67,
    stdDev: 14.2,
    variance: 201.64,
  },
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
        'The analysis selectively emphasizes Nokia\u2019s patent portfolio and emerging market brand strength while omitting or minimizing disconfirming evidence: Lumia sales declined 41% quarter-over-quarter, Windows Phone market share was 3.6% globally, and developer ecosystem adoption was collapsing. Positive data is presented prominently while negative data is buried in appendices.',
      suggestion:
        'Require a balanced evidence matrix: for every bullish data point, explicitly present the strongest bearish counterpoint. The patent portfolio value should be stress-tested against the scenario where Windows Phone fails entirely \u2014 what are the patents worth standalone?',
      confidence: 0.91,
    },
    {
      biasType: 'sunk_cost_fallacy',
      severity: 'high',
      excerpt:
        'Our existing $1 billion annual commitment to Nokia through platform support payments and marketing subsidies represents a significant investment that this acquisition would protect and build upon.',
      explanation:
        'The memo frames the $7.2B acquisition as protecting the $1B+ already spent annually on Nokia platform support. This is classic sunk cost reasoning \u2014 past expenditures should be irrelevant to a forward-looking acquisition decision. The relevant question is whether $7.2B generates positive NPV from today forward, regardless of prior spending.',
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
        'Revenue projections assume 15% smartphone market share by 2018 despite a trajectory showing consistent decline (35% \u2192 14% in three years). No sensitivity analysis is presented. No base rate comparison to other platform turnaround attempts is included. The projection appears to assume the acquisition itself reverses the decline \u2014 a common overconfidence pattern in M&A.',
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
        'All board members are quoted expressing unanimous support. No dissenting views, devil\u2019s advocate arguments, or red team analysis are documented anywhere in the memorandum. Unanimous board support for a $7.2B acquisition that fundamentally reshapes company strategy is a red flag for groupthink \u2014 healthy boards have documented disagreement on decisions of this magnitude.',
      suggestion:
        'Formally assign at least two board members to argue against the acquisition with equal presentation time. Document and distribute the strongest counterarguments before the final vote. Consider bringing in an external advisor with no relationship to either party.',
      confidence: 0.86,
    },
    {
      biasType: 'status_quo_bias',
      severity: 'medium',
      excerpt:
        'This acquisition strengthens our commitment to the Windows Phone platform and ensures we control the full hardware-software stack, consistent with our mobile-first strategy.',
      explanation:
        'The memo frames continued investment in Windows Phone as the natural path forward, despite market evidence suggesting the platform was failing. The acquisition doubles down on the existing strategy rather than evaluating whether the strategy itself should change. No consideration is given to alternative approaches: licensing Android, building hardware for Android, or pivoting to services-only mobile strategy.',
      suggestion:
        'Explicitly evaluate at least three alternative strategies before committing to the acquisition: (1) License Android and build hardware around it, (2) Exit mobile hardware entirely and focus on cross-platform services, (3) Acquire a company with Android momentum instead. Compare expected NPV of each.',
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
};
