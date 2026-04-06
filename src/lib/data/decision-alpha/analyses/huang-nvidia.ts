import type { PublicCompanyAnalysis } from '../types';

export const HUANG_ANALYSES: PublicCompanyAnalysis[] = [
  {
    id: 'da-nvda-annual-letter-2025',
    title: "Huang's 2025 Annual Letter: Visionary Framing With Overconfidence Undercurrents",
    company: 'NVIDIA',
    industry: 'technology',
    year: 2025,
    yearRealized: 2025,
    summary:
      "Jensen Huang's 2025 annual shareholder letter and GTC keynote address present a compelling but bias-rich narrative about NVIDIA's position in the AI revolution. The communication demonstrates strong framing effects — positioning NVIDIA not as a chipmaker but as the 'computing platform for the age of AI.' Overconfidence markers are present but tempered by genuine market dominance. The key risk signal: anchoring to current monopolistic market share (80%+ in AI training GPUs) without adequately addressing emerging competition from AMD, custom silicon (Google TPU, Amazon Trainium), and potential demand cyclicality.",
    decisionContext:
      'Annual communication framing NVIDIA\'s strategic position in the AI infrastructure buildout, addressing record revenue growth, data center demand, and the "next industrial revolution" narrative.',
    outcome: 'success',
    impactScore: 85,
    estimatedImpact: '$3T+ market cap, 200%+ revenue growth',
    impactDirection: 'positive',

    biasesPresent: [
      'overconfidence_bias',
      'framing_effect',
      'anchoring_bias',
      'confirmation_bias',
    ],
    primaryBias: 'framing_effect',
    toxicCombinations: ['Optimism Trap'],
    beneficialPatterns: ['External Advisors'],
    biasesManaged: ['groupthink'],
    mitigationFactors: [
      'Genuine market dominance provides evidence base for confidence',
      'CUDA ecosystem moat is real and measurable',
      'Capital allocation discipline — R&D reinvestment rate is high',
    ],
    survivorshipBiasRisk: 'high',

    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 5,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: true,
    },

    lessonsLearned: [
      'Even when overconfidence is partially justified by market position, the absence of competitive risk acknowledgment in CEO communications is a leading indicator of complacency.',
      'Framing a cyclical hardware business as a perpetual platform business changes risk perception without changing underlying risk.',
      'The strongest bias risk for dominant market leaders is anchoring to current share — Intel, Nokia, and BlackBerry all exhibited similar patterns at their peaks.',
    ],
    source:
      'NVIDIA FY2025 Annual Report, CEO Letter (March 2025); GTC 2025 Keynote Address (March 17, 2025)',
    sourceType: 'annual_report',

    ceoName: 'Jensen Huang',
    ceoTenureStart: 1993,
    filingType: 'annual_letter',
    filingDate: '2025-03-17',
    filingYear: 2025,
    ticker: 'NVDA',

    dqiScore: 58,
    dqiGrade: 'C',
    dqiComponents: {
      biasLoad: 52,
      noiseLevel: 65,
      evidenceQuality: 72,
      processMaturity: 48,
      complianceRisk: 60,
      historicalAlignment: 50,
    },

    biasExcerpts: [
      {
        biasType: 'framing_effect',
        excerpt:
          'We are not a chip company. We are the computing platform company for the age of AI. Every industry, every country needs NVIDIA.',
        explanation:
          'Strategic reframing from semiconductor manufacturer (cyclical, commoditizable) to platform company (recurring, monopolistic). This framing effect shapes investor perception of durability and moat width. Compare Intel circa 2000: "We are not a chip company, we power the Internet."',
        severity: 'high',
      },
      {
        biasType: 'overconfidence_bias',
        excerpt:
          'The next industrial revolution has begun. And it runs on NVIDIA. Demand for our platform is incredible, and we are scaling as fast as we can.',
        explanation:
          'Claiming ownership of an "industrial revolution" is peak overconfidence language. While NVIDIA\'s position is genuinely strong, "incredible demand" without quantifying supply/demand balance or acknowledging potential cyclicality mirrors language from previous tech cycle peaks.',
        severity: 'high',
      },
      {
        biasType: 'anchoring_bias',
        excerpt:
          'Data center revenue grew 409% year-over-year. We see continued acceleration as sovereign AI and enterprise inference scale globally.',
        explanation:
          'Anchoring to an extraordinary growth rate (409%) and projecting "continued acceleration." In hardware markets, triple-digit growth rates are inherently unsustainable — anchoring to them creates expectations that even a healthy business cannot meet.',
        severity: 'medium',
      },
      {
        biasType: 'confirmation_bias',
        excerpt:
          'Every major cloud provider, every enterprise, every nation is investing in AI infrastructure. The evidence is overwhelming and unanimous.',
        explanation:
          '"Overwhelming and unanimous" evidence language is a confirmation bias marker. Rigorous analysis would acknowledge: some customers are slowing capex (Meta cut AI spend in late 2024), open-source alternatives are gaining traction, and inference costs are declining faster than expected.',
        severity: 'medium',
      },
    ],

    stockPerformance: {
      priceAtFiling: 890,
      price6mo: 950,
      return6mo: 6.7,
      sp500Return6mo: 4.1,
    },

    contentAngles: [
      'Jensen Huang Scores DQI 58 — Why the AI King\'s Communication Has a Blind Spot',
      "NVIDIA's \"Platform Company\" Frame: Genius Strategy or Textbook Framing Effect?",
      'The Anchoring Problem: When 409% Growth Becomes Your Baseline',
      "Is NVIDIA the Next Intel? What Bias Analysis Reveals About Peak-Cycle CEO Language",
      "Every AI Company Says 'Industrial Revolution.' Here's Why That's a Bias Red Flag.",
    ],
    headlineHook:
      "Huang's annual letter scores DQI 58 with an 'Optimism Trap' warning. The same framing pattern appeared in Intel's communications at their 2000 peak.",
  },
];
