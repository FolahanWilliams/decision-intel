import type { PublicCompanyAnalysis } from '../types';

export const ZUCKERBERG_ANALYSES: PublicCompanyAnalysis[] = [
  {
    id: 'da-meta-annual-letter-2025',
    title: "Zuckerberg's 2025 Letter: Sunk Cost Recovery Masked as Strategic Vision",
    company: 'Meta Platforms',
    industry: 'technology',
    year: 2025,
    yearRealized: 2025,
    summary:
      "Mark Zuckerberg's 2025 annual letter presents a fascinating cognitive bias case study: a CEO navigating between two massive strategic bets (metaverse and AI). The letter reveals a complex bias signature — sunk cost patterns around Reality Labs spending are reframed as 'long-term conviction,' while the AI pivot shows classic bandwagon and availability heuristic patterns. Notably, the letter never quantifies the metaverse opportunity relative to AI, suggesting compartmentalized rather than comparative strategic thinking. The DQI score reflects above-average evidence quality (Meta's financial transparency is strong) offset by poor process maturity signals and active toxic combinations.",
    decisionContext:
      "Annual communication addressing Meta's dual strategic bets on AI (Llama, AI assistants) and metaverse (Reality Labs), $40B+ annual capex, and organizational transformation.",
    outcome: 'partial_success',
    impactScore: 80,
    estimatedImpact:
      '$1.5T+ market cap recovery from 2022 lows, but $50B+ metaverse investment with unclear ROI',
    impactDirection: 'positive',

    biasesPresent: [
      'sunk_cost_fallacy',
      'framing_effect',
      'bandwagon_effect',
      'availability_heuristic',
      'overconfidence_bias',
      'anchoring_bias',
    ],
    primaryBias: 'sunk_cost_fallacy',
    toxicCombinations: ['Sunk Ship', 'Optimism Trap'],
    beneficialPatterns: [],
    biasesManaged: ['status_quo_bias'],
    mitigationFactors: [
      'Strong financial position allows parallel betting',
      'Open-source AI strategy (Llama) creates external validation loop',
      'Board includes experienced technology directors',
    ],
    survivorshipBiasRisk: 'medium',

    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 6,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },

    lessonsLearned: [
      "When a CEO reframes declining investment returns as 'long-term conviction,' the sunk cost fallacy should be the first hypothesis tested.",
      'Dual strategic bets that are never comparatively evaluated in CEO communications suggest siloed decision-making — each bet is justified independently rather than against alternatives.',
      'The bandwagon effect in AI investment is strongest when a CEO has a recent failure (metaverse) that creates pressure to demonstrate strategic relevance.',
    ],
    source:
      'Meta Platforms 2024 Annual Report, CEO Letter (February 2025); Meta Q4 2024 Earnings Call',
    sourceType: 'annual_report',

    ceoName: 'Mark Zuckerberg',
    ceoTenureStart: 2004,
    filingType: 'annual_letter',
    filingDate: '2025-02-15',
    filingYear: 2024,
    ticker: 'META',

    dqiScore: 52,
    dqiGrade: 'C',
    dqiComponents: {
      biasLoad: 40,
      noiseLevel: 55,
      evidenceQuality: 75,
      processMaturity: 38,
      complianceRisk: 58,
      historicalAlignment: 45,
    },

    biasExcerpts: [
      {
        biasType: 'sunk_cost_fallacy',
        excerpt:
          "Reality Labs represents our long-term bet on the next computing platform. We've invested over $50 billion because we believe the metaverse will be as important as mobile was.",
        explanation:
          'Classic sunk cost language: justifying continued investment by referencing cumulative past investment ("$50 billion") rather than forward-looking expected returns. The mobile analogy anchors to a successful platform transition without addressing why metaverse adoption has stalled.',
        severity: 'critical',
      },
      {
        biasType: 'framing_effect',
        excerpt:
          "We're not pivoting away from the metaverse. We're expanding our ambition to include AI. These are complementary visions for the future of computing.",
        explanation:
          'Reframing what the market perceives as a strategic retreat (metaverse de-prioritization) as an expansion. The "complementary" frame avoids the harder question: given finite capital and attention, which bet has higher expected returns?',
        severity: 'high',
      },
      {
        biasType: 'bandwagon_effect',
        excerpt:
          'Every major technology company is investing heavily in AI. We believe Meta is uniquely positioned to win because of our data, our distribution, and Llama.',
        explanation:
          'The "every major company" phrasing is a bandwagon signal — justifying investment by pointing to peer behavior rather than independent analysis. The differentiation claim (data, distribution, Llama) is asserted without comparative evidence against Google, OpenAI, or Anthropic.',
        severity: 'medium',
      },
      {
        biasType: 'availability_heuristic',
        excerpt:
          "Meta AI now has over 700 million monthly users. People are using AI across all our apps in ways we didn't anticipate.",
        explanation:
          'Leading with the most impressive and readily available metric (700M MAU) without context: what is engagement depth? What is revenue per AI user? The "ways we didn\'t anticipate" framing creates an illusion of organic demand that may conflate distribution (2B existing users) with genuine product-market fit.',
        severity: 'medium',
      },
      {
        biasType: 'overconfidence_bias',
        excerpt:
          "I believe this will be the most transformative year in Meta's history. The AI products we're building will redefine how people connect.",
        explanation:
          '"Most transformative year in history" is superlative confidence language. Meta said similar things about the metaverse rebrand (2021), Reels launch (2022), and Year of Efficiency (2023). The pattern of annual superlatives suggests calibration drift.',
        severity: 'high',
      },
      {
        biasType: 'anchoring_bias',
        excerpt:
          'Our stock has recovered over 500% from the 2022 lows. The market now sees what we saw — that our investments are paying off.',
        explanation:
          'Anchoring to the 2022 low (a crisis point) makes the 500% recovery sound validating. But anchoring to the 2021 peak tells a different story: the stock is roughly flat over 4 years. The anchor point selection reveals a framing choice, not an objective assessment.',
        severity: 'medium',
      },
    ],

    stockPerformance: {
      priceAtFiling: 585,
      price6mo: 610,
      return6mo: 4.3,
      sp500Return6mo: 4.1,
    },

    contentAngles: [
      "Zuckerberg's Letter Triggers 'Sunk Ship' — The Same Pattern That Sank Kodak",
      "The $50B Question: Is Meta's Metaverse Investment Strategy or Sunk Cost Fallacy?",
      "Bandwagon Effect in AI: Why 'Everyone Else Is Doing It' Isn't a Strategy",
      "Meta's DQI 52: Strong Evidence Quality Can't Save Poor Decision Process",
      'How to Spot Sunk Cost Fallacy in CEO Communications: A Meta Case Study',
    ],
    headlineHook:
      "Zuckerberg's 2025 letter scores DQI 52 with a 'Sunk Ship' toxic combination on the $50B metaverse bet. The same pattern preceded Kodak's refusal to pivot from film.",
  },
];
