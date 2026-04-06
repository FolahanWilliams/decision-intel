import type { PublicCompanyAnalysis } from '../types';

export const BUFFETT_ANALYSES: PublicCompanyAnalysis[] = [
  {
    id: 'da-brk-annual-letter-2024',
    title: "Buffett's 2024 Annual Letter: A Masterclass in Disciplined Capital Allocation",
    company: 'Berkshire Hathaway',
    industry: 'financial_services',
    year: 2025,
    yearRealized: 2025,
    summary:
      "Warren Buffett's 2024 annual shareholder letter continues his tradition of candid, long-term-oriented communication. The letter acknowledges mistakes openly (notably the Paramount investment), avoids euphemistic language about underperformance, and maintains consistent framing around intrinsic value rather than quarterly metrics. DQI analysis reveals remarkably low bias load compared to peer CEO communications, with mild anchoring to historical Berkshire performance and subtle status quo bias in insurance positioning.",
    decisionContext:
      'Annual communication to shareholders summarizing capital allocation decisions, portfolio positioning, and strategic outlook for Berkshire Hathaway.',
    outcome: 'success',
    impactScore: 78,
    estimatedImpact: '$900B+ market cap, consistent outperformance',
    impactDirection: 'positive',

    biasesPresent: ['anchoring_bias', 'status_quo_bias'],
    primaryBias: 'anchoring_bias',
    toxicCombinations: [],
    beneficialPatterns: ['Dissent Encouraged', 'External Advisors'],
    biasesManaged: ['overconfidence_bias', 'confirmation_bias', 'sunk_cost_fallacy'],
    mitigationFactors: [
      'Explicit acknowledgment of mistakes (Paramount loss)',
      'Long-term framing reduces recency and availability bias',
      'Decentralized decision-making across operating companies',
      'Public commitment to intellectual honesty',
    ],
    survivorshipBiasRisk: 'medium',

    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 4,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },

    lessonsLearned: [
      'Explicit error acknowledgment in CEO communications correlates with higher long-term trust and lower overconfidence signals.',
      'Anchoring to intrinsic value rather than market price produces more stable decision frameworks.',
      'Buffett\'s "owner\'s manual" approach creates accountability structures that constrain future bias.',
    ],
    source: "Berkshire Hathaway 2024 Annual Report, Chairman's Letter (February 22, 2025)",
    sourceType: 'annual_report',

    // CEO-specific fields
    ceoName: 'Warren Buffett',
    ceoTenureStart: 1965,
    filingType: 'annual_letter',
    filingDate: '2025-02-22',
    filingYear: 2024,
    ticker: 'BRK',

    dqiScore: 82,
    dqiGrade: 'B',
    dqiComponents: {
      biasLoad: 88,
      noiseLevel: 85,
      evidenceQuality: 90,
      processMaturity: 72,
      complianceRisk: 82,
      historicalAlignment: 75,
    },

    biasExcerpts: [
      {
        biasType: 'anchoring_bias',
        excerpt:
          'Berkshire now owns more Treasury Bills than the Federal Reserve. This is not our preference. We prefer to own good businesses.',
        explanation:
          'Mild anchoring to Berkshire\'s historical identity as a business-buyer. The $334B cash position signals disciplined waiting, but the framing anchors readers to the "preference" narrative rather than engaging with whether current valuations justify continued cash accumulation.',
        severity: 'low',
      },
      {
        biasType: 'status_quo_bias',
        excerpt:
          'Our insurance operations remain the bedrock of Berkshire. The float is extraordinary and the underwriting discipline is second to none.',
        explanation:
          'Consistent framing of insurance as "bedrock" across decades of letters creates a status quo frame that may underweight emerging risks to the insurance model (climate change frequency, InsurTech disruption).',
        severity: 'low',
      },
    ],

    stockPerformance: {
      priceAtFiling: 680000,
      price12mo: 742000,
      return12mo: 9.1,
      sp500Return12mo: 7.2,
    },

    contentAngles: [
      "Why Buffett's DQI Score Is the Highest Among Top CEOs — and What It Means",
      'The Art of Admitting Mistakes: How Buffett Defuses Overconfidence Bias',
      "Buffett's 2024 Letter Has Only 2 Detectable Biases. Most CEOs Have 6+.",
      'What 60 Years of Shareholder Letters Reveal About Decision Quality',
    ],
    headlineHook:
      "Buffett's annual letter scores DQI 82 — the highest among America's top CEOs. The secret: he tells you when he's wrong.",
  },
];
