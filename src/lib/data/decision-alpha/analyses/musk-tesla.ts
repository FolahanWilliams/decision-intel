import type { PublicCompanyAnalysis } from '../types';

export const MUSK_ANALYSES: PublicCompanyAnalysis[] = [
  {
    id: 'da-tsla-earnings-call-2025q1',
    title: "Musk's Q1 2025 Earnings Call: Overconfidence Meets Time Pressure in AI Pivot",
    company: 'Tesla',
    industry: 'technology',
    year: 2025,
    yearRealized: 2025,
    summary:
      "Elon Musk's Q1 2025 earnings call transcript reveals a dense concentration of cognitive biases characteristic of visionary founder-CEOs under pressure. The call pivots aggressively from automotive headwinds to AI and robotics narratives, with multiple overconfidence markers (definitive timelines for FSD and Optimus), anchoring to peak-era growth rates, and framing effects that reposition declining vehicle margins as strategic investments. The Winner Effect biological signal is strongly present — success-streak language despite deteriorating core metrics.",
    decisionContext:
      'Quarterly earnings communication to analysts and shareholders addressing declining vehicle deliveries, margin compression, and strategic pivot toward AI, autonomy, and humanoid robotics.',
    outcome: 'partial_failure',
    impactScore: 72,
    estimatedImpact: '$200B+ market cap volatility tied to narrative shifts',
    impactDirection: 'negative',

    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'framing_effect',
      'planning_fallacy',
      'confirmation_bias',
      'availability_heuristic',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Blind Sprint'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'high',

    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 3,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },

    lessonsLearned: [
      'CEO earnings calls with 6+ detectable biases and no dissent signals represent elevated decision risk regardless of the company\'s historical success.',
      'The "Optimism Trap" toxic combination (anchoring + overconfidence + time pressure) appears frequently in founder-CEO communications during business model transitions.',
      'Winner Effect amplification is strongest when past success is used to justify unrelated future predictions (automotive success → robotics success).',
    ],
    source: 'Tesla Q1 2025 Earnings Call Transcript (April 22, 2025)',
    sourceType: 'earnings_call',

    ceoName: 'Elon Musk',
    ceoTenureStart: 2008,
    filingType: 'earnings_call',
    filingDate: '2025-04-22',
    filingYear: 2025,
    ticker: 'TSLA',

    dqiScore: 41,
    dqiGrade: 'D',
    dqiComponents: {
      biasLoad: 32,
      noiseLevel: 45,
      evidenceQuality: 38,
      processMaturity: 35,
      complianceRisk: 55,
      historicalAlignment: 42,
    },

    biasExcerpts: [
      {
        biasType: 'overconfidence_bias',
        excerpt:
          'I am highly confident that Tesla will be doing unsupervised FSD this year. It will be the biggest asset value increase in history.',
        explanation:
          'Definitive confidence language ("highly confident," "biggest in history") for an outcome with significant technical and regulatory uncertainty. Historical pattern: Musk has predicted FSD completion in 2018, 2020, 2021, 2022, 2023, and 2024 — each time with similar confidence language.',
        severity: 'critical',
      },
      {
        biasType: 'anchoring_bias',
        excerpt:
          'We delivered 1.8 million vehicles, which is still a massive number. The long-term trajectory is 20 million vehicles per year.',
        explanation:
          'Anchoring to a speculative 20M target while actual deliveries declined year-over-year. The "massive number" framing anchors listeners to absolute scale rather than the rate-of-change deterioration.',
        severity: 'high',
      },
      {
        biasType: 'framing_effect',
        excerpt:
          'The margin compression you see is really an investment in the future. We are investing in AI, in Optimus, in next-gen vehicles.',
        explanation:
          'Reframing margin decline (negative) as strategic investment (positive). This is a classic framing effect — the same financial reality is positioned as intentional strategy rather than competitive pressure.',
        severity: 'high',
      },
      {
        biasType: 'planning_fallacy',
        excerpt:
          'Optimus will be in production by the end of next year. I think it could be a $25 trillion market opportunity.',
        explanation:
          'Combining an aggressive production timeline with an extraordinary market size estimate. Planning fallacy compounds with overconfidence — the $25T figure exceeds the entire US GDP, suggesting aspiration rather than analysis.',
        severity: 'critical',
      },
      {
        biasType: 'confirmation_bias',
        excerpt:
          'Every piece of data we see confirms that the autonomous future is coming faster than anyone expects.',
        explanation:
          'Classic confirmation bias marker: "every piece of data confirms." Rigorous analysis acknowledges disconfirming evidence. The absence of any mention of regulatory delays, accident investigations, or competitive benchmarking suggests selective evidence interpretation.',
        severity: 'high',
      },
      {
        biasType: 'availability_heuristic',
        excerpt:
          'Look at what happened with ChatGPT — nobody expected AI to move this fast. The same thing is about to happen with physical AI.',
        explanation:
          'Using the readily available, highly salient example of ChatGPT\'s success to predict success in a fundamentally different domain (physical robotics). Availability heuristic: the most mentally accessible AI success story is generalized to all AI applications.',
        severity: 'medium',
      },
    ],

    stockPerformance: {
      priceAtFiling: 172,
    },

    contentAngles: [
      "Elon Musk's Earnings Call Triggered 2 Toxic Combinations. Here's What They Mean.",
      'DQI 41: Why Tesla\'s Q1 Call Is a Case Study in the "Optimism Trap"',
      'The Winner Effect in CEO Communications: Tesla as a Case Study',
      '6 Biases in One Earnings Call: Deconstructing Musk\'s AI Pivot Narrative',
      "Planning Fallacy Alert: Musk's Timeline Predictions vs. Historical Accuracy",
    ],
    headlineHook:
      "Musk's Q1 2025 earnings call scores DQI 41 — triggering both 'Optimism Trap' and 'Blind Sprint' toxic combinations. The same patterns preceded Yahoo's $40B destruction.",
  },
];
