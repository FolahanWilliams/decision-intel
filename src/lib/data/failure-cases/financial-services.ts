import { FailureCase } from './types';

export const FINANCIAL_SERVICES_CASES: FailureCase[] = [
  {
    id: 'fin-001',
    title: 'Lehman Brothers Collapse',
    company: 'Lehman Brothers',
    industry: 'financial_services',
    year: 2008,
    yearDiscovered: 2008,
    summary:
      'Lehman Brothers filed for the largest bankruptcy in U.S. history after accumulating massive exposure to subprime mortgage-backed securities. Senior leadership dismissed internal risk warnings and external market signals, maintaining leveraged positions that ultimately proved catastrophic.',
    decisionContext:
      'Whether to reduce exposure to mortgage-backed securities and lower leverage ratios as the housing market showed signs of stress in 2007-2008.',
    outcome: 'catastrophic_failure',
    impactScore: 100,
    estimatedLoss: '$639B',
    biasesPresent: ['groupthink', 'overconfidence_bias', 'confirmation_bias'],
    primaryBias: 'groupthink',
    toxicCombinations: ['Echo Chamber', 'Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 12,
    },
    lessonsLearned: [
      'Excessive leverage combined with concentrated positions in illiquid assets creates existential risk that no amount of hedging can mitigate.',
      'When internal risk officers are overruled or sidelined, the organization loses its critical feedback loop.',
      'Groupthink at the board level can prevent timely recognition of systemic market shifts.',
    ],
    preDecisionEvidence: {
      document:
        'The risk committee recommended maintaining current MBS and commercial real estate exposure levels, noting that housing market fundamentals remain sound despite regional softness. Leverage ratios of 31:1 are consistent with peer institutions.',
      source: 'Lehman Brothers Risk Committee Presentation, March 2007',
      date: '2007-03',
      documentType: 'internal_memo',
      detectableRedFlags: [
        'Leverage ratio at 31:1 (highest on Wall Street)',
        '$85B in MBS with no hedging strategy',
        'Chief Risk Officer subsequently sidelined/demoted',
        'Repo 105 accounting to temporarily hide $50B in assets',
        'Commercial real estate doubled in 12 months',
      ],
      flaggableBiases: [
        'overconfidence',
        'groupthink',
        'anchoring_bias',
        'normalcy_bias',
        'confirmation_bias',
      ],
      hypotheticalAnalysis:
        "DI would have flagged extreme overconfidence in housing market stability, anchoring to peer leverage ratios as justification (31:1 is dangerous regardless of peers), groupthink pattern of sidelining the CRO who raised concerns, and confirmation bias in selective use of 'regional softness' framing to dismiss systemic risk.",
    },
    keyQuotes: [
      {
        text: "The real estate market, the bond market, in the short term have had such a major drop that it's kind of hard to believe. In the long run, the real estate market will be fine.",
        source: 'Lehman Brothers Q2 2008 earnings call',
        date: '2008-06-16',
        speaker: 'Richard S. Fuld Jr., CEO',
      },
      {
        text: 'Do we have a bazooka? No. Do we have a pea-shooter? Yes.',
        source: 'Internal description of Lehman risk-management capability, cited in FCIC Report',
        date: '2008',
        speaker: 'Anonymous Lehman risk officer',
      },
      {
        text: 'We have a huge brand with tremendous value that is based on our culture and our people. And those things we will never lose.',
        source: 'Lehman Brothers Q1 2008 earnings call',
        date: '2008-03-18',
        speaker: 'Richard S. Fuld Jr., CEO',
      },
    ],
    timeline: [
      {
        date: '2006-Q4',
        event: 'Lehman becomes the #1 underwriter of U.S. MBS, aggressively expanding commercial real estate via Archstone acquisition commitments.',
        source: 'FCIC Report, Chapter 9',
      },
      {
        date: '2007-03',
        event: 'Risk Committee memo recommends maintaining MBS exposure; cites "peer leverage" as benchmark.',
        source: 'Valukas Report, Vol. 1',
      },
      {
        date: '2007-Q2',
        event: 'CRO Madelyn Antoncic raises concerns about leverage; is sidelined from risk decisions.',
        source: 'Valukas Report, Vol. 3 (Antoncic testimony)',
      },
      {
        date: '2007-12',
        event: 'Repo 105 transactions escalate — $38.6B in assets temporarily removed from balance sheet at quarter-end.',
        source: 'Valukas Report, Vol. 3',
      },
      {
        date: '2008-03-16',
        event: 'Bear Stearns collapse; Fuld tells staff Lehman is "not Bear Stearns." No material deleveraging follows.',
        source: 'FCIC Report, Chapter 17',
      },
      {
        date: '2008-06',
        event: 'Lehman reports first quarterly loss ($2.8B); still pays $128M in dividends that quarter.',
        source: 'Lehman Brothers Q2 2008 10-Q',
      },
      {
        date: '2008-09-10',
        event: 'Lehman preannounces $3.9B Q3 loss and $5.3B writedown; stock falls 45% in one day.',
        source: 'Lehman Brothers September 10, 2008 press release',
      },
      {
        date: '2008-09-15',
        event: 'Lehman Brothers Holdings Inc. files Chapter 11 — largest bankruptcy in U.S. history ($691B in assets).',
        source: 'SDNY Case No. 08-13555',
      },
    ],
    stakeholders: [
      {
        name: 'Richard S. Fuld Jr.',
        role: 'Chairman & CEO',
        position: 'advocate',
        notes: 'Dominated board discussion; publicly rejected multiple buyout approaches (Korea Development Bank, Warren Buffett in 2008).',
      },
      {
        name: 'Joseph Gregory',
        role: 'President & COO',
        position: 'advocate',
        notes: 'Pushed aggressive expansion into commercial real estate. Fired by Fuld in June 2008 after Q2 loss.',
      },
      {
        name: 'Madelyn Antoncic',
        role: 'Chief Risk Officer (to 2007)',
        position: 'overruled',
        notes: 'Raised concerns about leverage and CRE exposure through 2006–2007; moved out of risk role in late 2007.',
      },
      {
        name: 'Erin Callan',
        role: 'CFO (Dec 2007 – June 2008)',
        position: 'advocate',
        notes: 'Publicly defended balance sheet through Q1/Q2 2008. Departed shortly before collapse.',
      },
      {
        name: 'Henry "Hank" Kaufman',
        role: 'Board Director (Finance & Risk Committee chair)',
        position: 'silent',
        notes: 'Economist with deep market expertise; committee met twice in 2006 and twice in 2007 despite the exposure buildup.',
      },
    ],
    counterfactual: {
      recommendation:
        'Cut gross leverage from 31:1 toward 15:1 by Q4 2007 via asset sales and equity raise; hedge MBS concentration via CDX indices; reinstate CRO authority over exposure limits; halt Archstone acquisition closing.',
      rationale:
        'Lehman had three distinct windows (March 2007 peer concerns, August 2007 Bear hedge-fund collapse, March 2008 Bear bailout) where a less-biased process would have forced deleveraging. The decision to keep expanding through all three is what made failure catastrophic rather than merely painful.',
      estimatedOutcome:
        'Survival as a significantly smaller firm — likely acquired or recapitalized in 2008 rather than liquidated, preserving ~$600B of counterparty value and avoiding the global credit freeze that Lehman\'s uncontrolled failure triggered.',
    },
    dqiEstimate: {
      score: 22,
      grade: 'F',
      topBiases: ['overconfidence_bias', 'groupthink', 'anchoring_bias'],
      rationale:
        'Near-unanimous board, dissenting CRO sidelined rather than escalated, leverage framed against peers rather than absolute risk tolerance, and explicit dismissal of Bear Stearns as an applicable signal — all hallmarks of an F-grade decision process.',
    },
    postMortemCitations: [
      {
        label: 'Valukas Report (Report of Examiner Anton R. Valukas)',
        year: 2010,
        excerpt:
          'Lehman repeatedly exceeded its own internal risk limits and concentration limits... senior management intentionally exceeded these limits in pursuit of its growth strategy.',
      },
      {
        label: 'Financial Crisis Inquiry Commission Report, Chapter 17 ("The Fall of Lehman")',
        year: 2011,
      },
      {
        label: 'SEC vs. Fuld et al., SDNY (investigation closed without charges, 2012)',
        year: 2012,
      },
      {
        label: 'House Committee on Oversight testimony, October 6, 2008',
        year: 2008,
        excerpt:
          "Fuld: 'Until the day they put me in the ground, I will wonder' — on what caused the collapse.",
      },
    ],
    relatedCases: ['fin-002', 'fin-005', 'fin-007', 'fin-008'],
    patternFamily: 'Leveraged Hubris + Sidelined Risk Function',
    source:
      'Lehman Brothers Holdings Inc. Chapter 11 Proceedings, SDNY Case No. 08-13555; Financial Crisis Inquiry Commission Report (2011)',
    sourceType: 'sec_filing',
  },
  {
    id: 'fin-002',
    title: 'Bear Stearns Hedge Fund Collapse',
    company: 'Bear Stearns',
    industry: 'financial_services',
    year: 2007,
    yearDiscovered: 2007,
    summary:
      "Two Bear Stearns hedge funds heavily invested in collateralized debt obligations backed by subprime mortgages collapsed, triggering a liquidity crisis that led to the firm's fire-sale acquisition by JPMorgan Chase. Fund managers anchored to historical CDO performance and ignored deteriorating fundamentals.",
    decisionContext:
      'Whether to maintain or reduce leveraged positions in subprime CDOs as delinquency rates began rising in early 2007.',
    outcome: 'catastrophic_failure',
    impactScore: 85,
    estimatedLoss: '$1.6B',
    biasesPresent: ['anchoring_bias', 'overconfidence_bias', 'confirmation_bias', 'recency_bias'],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 6,
    },
    lessonsLearned: [
      'Anchoring to historical default rates blinded managers to structural changes in the mortgage market.',
      'Leverage amplifies losses exponentially when underlying asset correlations increase during stress.',
      'Liquidity risk in structured products is often underestimated until a crisis materializes.',
    ],
    preDecisionEvidence: {
      document:
        "Bear Stearns High-Grade Structured Credit Strategies Fund Q1 2007 investor letter reported positive returns and described subprime mortgage default rates as 'consistent with historical norms adjusted for loan-to-value considerations.' The letter defended continued use of 10:1 fund-level leverage on AAA and AA CDO tranches and stated that 'market dislocations create opportunity' as subprime spreads widened. The funds' internal risk models used 2001-2005 default data as the baseline despite 2006 originations being of visibly lower credit quality.",
      source: 'Bear Stearns Asset Management — High-Grade Structured Credit Fund Q1 2007 investor letter; SEC v. Cioffi & Tannin (2008)',
      date: '2007-04',
      documentType: 'investor_deck',
      detectableRedFlags: [
        'Internal risk models used 2001-2005 default data as baseline for 2006-vintage subprime exposures',
        "'Market dislocations create opportunity' — classic doubling-down framing as losses accumulated",
        '10:1 fund-level leverage on structured products whose correlations were materially untested in stress',
        'Fund managers made private investor communications inconsistent with marks being reported to repo counterparties',
        'Cioffi shifted personal money out of the fund while publicly maintaining bullish stance',
      ],
      flaggableBiases: ['anchoring_bias', 'overconfidence_bias', 'confirmation_bias', 'recency_bias'],
      hypotheticalAnalysis:
        "DI would flag the Bear Stearns CDO funds as an anchoring-to-benign-history failure. Using 2001-2005 subprime default data to model 2006-vintage loans is like using pre-crisis Lehman leverage to justify 2008 positions. The SEC complaint against Cioffi/Tannin later documented private-vs-public inconsistency — a decision process audit would have flagged marks-discrepancy between investor letters and repo pricing as a bright-line red flag requiring escalation outside the portfolio management team.",
    },
    source:
      'SEC Litigation Release No. 22306 (2012); Bear Stearns Asset Management investor communications',
    sourceType: 'sec_filing',
  },
  {
    id: 'fin-003',
    title: 'JPMorgan London Whale Trading Losses',
    company: 'JPMorgan Chase',
    industry: 'financial_services',
    year: 2012,
    yearDiscovered: 2012,
    summary:
      "JPMorgan's Chief Investment Office accumulated massive synthetic credit derivative positions that resulted in $6.2 billion in trading losses. Trader Bruno Iksil's positions grew unchecked as risk models were manipulated and senior management dismissed early warnings.",
    decisionContext:
      "Whether to reduce or hedge the CIO's growing synthetic credit portfolio as positions exceeded internal risk limits in early 2012.",
    outcome: 'failure',
    impactScore: 75,
    estimatedLoss: '$6.2B',
    biasesPresent: ['overconfidence_bias', 'anchoring_bias', 'groupthink'],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Yes Committee'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
    },
    lessonsLearned: [
      'Risk models that can be manually overridden without independent review create dangerous blind spots.',
      'When traders mark their own positions, conflicts of interest can obscure true risk exposure.',
      'A culture where challenging senior traders is discouraged allows losses to compound.',
    ],
    preDecisionEvidence: {
      document:
        "Internal JPMorgan Chief Investment Office risk reports from Q4 2011 and Q1 2012 documented that the Synthetic Credit Portfolio (SCP) was breaching Value-at-Risk limits on more than 100 days in the first quarter of 2012. The bank switched from a proven VaR model to a new 'VaR model 2' on January 30, 2012 — which halved reported VaR almost overnight. Positions in the CDX.NA.IG.9 index were so large that the portfolio effectively WAS the market, making hedging impossible without moving prices against itself.",
      source: 'U.S. Senate PSI "JPMorgan Chase Whale Trades" Report (2013), Exhibits 7-12; JPMorgan 10-K FY2012 restatement',
      date: '2012-01-30',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        'Risk model switched mid-stream (Jan 30, 2012) — new model halved reported VaR on unchanged positions',
        'Portfolio exceeded VaR limits more than 100 times in Q1 2012 — breaches suppressed rather than escalated',
        'CIO positions in CDX.NA.IG.9 were large enough to constitute a material share of outstanding — no liquid exit',
        'Traders marked their own positions — senior risk management did not perform independent verification',
        "Dimon publicly dismissed the Bloomberg/WSJ reporting as a 'tempest in a teapot' (April 2012) while losses were actively accumulating",
      ],
      flaggableBiases: ['overconfidence_bias', 'anchoring_bias', 'groupthink', 'authority_bias'],
      hypotheticalAnalysis:
        "DI would flag the January 2012 risk model switch as the canonical 'change the measurement to avoid the constraint' moment. A decision process with working independent risk review would have required documenting model-change impact on reported VaR before deployment — the 50% overnight reduction is the kind of signal that cannot survive an honest audit. Dimon's April 2012 public dismissal is the authority-bias amplifier: once the CEO frames the issue as overblown, internal challenge becomes career-limiting.",
    },
    source:
      'U.S. Senate Permanent Subcommittee on Investigations, "JPMorgan Chase Whale Trades" Report (2013)',
    sourceType: 'case_study',
  },
  {
    id: 'fin-004',
    title: 'Barings Bank Collapse',
    company: 'Barings Bank',
    industry: 'financial_services',
    year: 1995,
    yearDiscovered: 1995,
    summary:
      "Nick Leeson, a derivatives trader in Barings' Singapore office, accumulated $1.3 billion in hidden losses through unauthorized speculative trades on Nikkei futures. The 233-year-old bank collapsed when the losses were discovered, as management had granted Leeson unsupervised authority over both trading and settlement.",
    decisionContext:
      "Whether to maintain Leeson's dual role overseeing both trading execution and back-office settlement without independent oversight.",
    outcome: 'catastrophic_failure',
    impactScore: 90,
    estimatedLoss: '$1.3B',
    biasesPresent: [
      'authority_bias',
      'overconfidence_bias',
      'status_quo_bias',
      'groupthink',
      'cognitive_misering',
      'gamblers_fallacy',
    ],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Yes Committee', 'Doubling Down'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 4,
    },
    lessonsLearned: [
      'Separation of duties between trading and settlement is a non-negotiable control; combining them invites fraud.',
      'Authority bias led management to trust a profitable trader without questioning the source of returns.',
      'Remote offices with insufficient oversight can become vectors for catastrophic risk accumulation.',
    ],
    preDecisionEvidence: {
      document:
        "Barings' internal audit report on the Singapore futures operation identified that trader Nick Leeson had unsupervised control over both trading and back-office settlement functions — a fundamental violation of segregation-of-duties control. The report flagged the error account (88888) where losses were accumulating but was not escalated with urgency. Leeson's reported profits ($30M in 1994) were inconsistent with the documented arbitrage strategy he was authorized to execute. London management continued to wire margin payments to Singapore on Leeson's request.",
      source: "Barings internal audit report; Bank of England 'Board of Banking Supervision' Report, Ch. 4",
      date: '1994-08',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        'Single trader controlling both trading and settlement with no segregation of duties',
        'Account 88888 ("five-eights") used to hide losses — visible to anyone checking reconciliation reports',
        'Reported P&L of $30M from "arbitrage" was implausibly high for the authorized strategy',
        'Margin payments from London to Singapore grew from £30M to £500M in 12 months',
        'SIMEX inquiries about unusually large Nikkei futures positions were routed through Leeson himself',
      ],
      flaggableBiases: ['authority_bias', 'gamblers_fallacy', 'overconfidence_bias', 'cognitive_misering'],
      hypotheticalAnalysis:
        "DI would flag Barings as the canonical gambler's-fallacy + authority-bias combination. Leeson's escalating doubling-down after losses is textbook gambler's fallacy ('the next trade will reverse my losses'). London management's authority bias toward Leeson's reported profits caused them to keep funding the error account even as margin calls grew exponentially. Segregation-of-duties is a bright-line control that no bias-adjusted review of Barings' operations would have left unaddressed.",
    },
    source: 'Bank of England Board of Banking Supervision Report on Barings (1995)',
    sourceType: 'case_study',
  },
  {
    id: 'fin-005',
    title: 'Long-Term Capital Management Collapse',
    company: 'Long-Term Capital Management',
    industry: 'financial_services',
    year: 1998,
    yearDiscovered: 1998,
    summary:
      "LTCM, a hedge fund staffed by Nobel laureates and renowned traders, nearly collapsed the global financial system when its highly leveraged convergence trades failed during the Russian financial crisis. The fund's models assumed historical correlations would hold, leading to $4.6 billion in losses and a Federal Reserve-coordinated bailout.",
    decisionContext:
      'Whether to reduce leverage and position concentration as emerging market volatility increased in mid-1998, or to trust that models based on historical data would hold.',
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedLoss: '$4.6B',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'cognitive_misering',
      'groupthink',
      'confirmation_bias',
      'gamblers_fallacy',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Echo Chamber', 'Optimism Trap', 'Doubling Down'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 10,
    },
    lessonsLearned: [
      'Quantitative models anchored to historical data fail catastrophically during regime changes and tail events.',
      'The presence of Nobel laureates and star talent does not immunize an organization against overconfidence.',
      'Extreme leverage transforms manageable losses into systemic crises.',
    ],
    preDecisionEvidence: {
      document:
        "1997 annual investor letter describing 'negligible' portfolio risk based on Value-at-Risk models",
      source: 'Long-Term Capital Management Partners (John Meriwether)',
      date: '1997',
      documentType: 'financial_report',
      detectableRedFlags: [
        'VaR models assuming normal distributions in fat-tailed markets',
        'Leverage exceeding 25:1 on notional $1.25T',
        'Correlation assumptions based on 5-year lookback missing regime changes',
        'Nobel laureate credentials creating authority bias in risk oversight',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'anchoring_bias',
        'cognitive_misering',
        'groupthink',
        'confirmation_bias',
        'gamblers_fallacy',
      ],
      hypotheticalAnalysis:
        "A decision intelligence system would have flagged the fundamental model risk — VaR calculations assuming normal distributions while the fund's own leverage amplified tail-risk exposure. The 'negligible risk' characterization in the investor letter, contradicted by 25:1 leverage ratios, would have triggered overconfidence and authority bias warnings.",
    },
    keyQuotes: [
      {
        text: 'The fund returned capital of $2.7 billion to investors... because the opportunities had become too few.',
        source: 'LTCM 1997 Annual Letter to Investors',
        date: '1997-12',
        speaker: 'John Meriwether, Founding Principal',
      },
      {
        text: 'Our results should not be too different from the market, and our long-term record is one of minimum drawdowns.',
        source: 'LTCM investor communication, Q2 1998',
        date: '1998-07',
        speaker: 'John Meriwether, Founding Principal',
      },
      {
        text: 'What we did will be seen as completely sensible to a dispassionate observer... we had the right strategy — we simply had too much leverage.',
        source: 'Interview with Myron Scholes, cited in "When Genius Failed"',
        date: '1999',
        speaker: 'Myron Scholes, Nobel Laureate & LTCM Principal',
      },
    ],
    timeline: [
      {
        date: '1994-02',
        event: 'LTCM launches with $1.25B from 80 investors at 25× leverage; initial principals include Meriwether, Scholes, Merton, and ex-Fed Vice Chairman David Mullins.',
        source: 'PWG Report, Appendix A',
      },
      {
        date: '1996',
        event: 'Returns of 41% net of fees; fund becomes unable to deploy new capital at same convergence spreads, signaling trade crowding.',
        source: 'Lowenstein, "When Genius Failed", ch. 7',
      },
      {
        date: '1997-12',
        event: 'Fund returns $2.7B to investors — but retains full trading book, actually *increasing* leverage relative to equity base.',
        source: 'LTCM 1997 investor letter',
      },
      {
        date: '1998-05',
        event: 'Salomon Smith Barney closes its arbitrage desk, unwinding positions similar to LTCM — the first warning that "convergence" strategies were becoming divergent.',
        source: 'PWG Report, ch. 3',
      },
      {
        date: '1998-08-17',
        event: 'Russia defaults on ruble-denominated debt; flight-to-quality drives spreads wider rather than narrower. LTCM loses 44% of capital in one month.',
        source: 'Federal Reserve Board staff study (Kambhu et al., 2007)',
      },
      {
        date: '1998-09-23',
        event: 'Fed-organized consortium of 14 banks injects $3.625B to prevent forced liquidation; LTCM effectively dissolved.',
        source: "PWG Report, ch. 4",
      },
    ],
    stakeholders: [
      {
        name: 'John Meriwether',
        role: 'Founding Principal & CEO',
        position: 'advocate',
        notes: 'Pushed to return capital in 1997 to keep per-partner returns high rather than shrink leverage.',
      },
      {
        name: 'Myron Scholes',
        role: 'Principal (Nobel Laureate, Options Pricing)',
        position: 'advocate',
        notes: 'Publicly defended the model framework; later acknowledged leverage as the core error.',
      },
      {
        name: 'Robert Merton',
        role: 'Principal (Nobel Laureate, Continuous-Time Finance)',
        position: 'advocate',
      },
      {
        name: 'David Mullins',
        role: 'Principal (former Fed Vice Chair)',
        position: 'silent',
        notes: 'Brought regulatory gravitas but did not publicly flag leverage or crowding concerns.',
      },
      {
        name: 'Eric Rosenfeld',
        role: 'Principal (risk & trading systems)',
        position: 'advocate',
      },
    ],
    counterfactual: {
      recommendation:
        'Retain 1997 capital base (avoid the forced leverage increase); cap gross leverage at 10:1; diversify across strategies with genuinely uncorrelated drivers; install an independent non-principal risk officer with veto power.',
      rationale:
        'Every bias LTCM exhibited traces to a closed-loop where the same people who designed the models also signed off on leverage and rejected external challenge. The model wasn\'t the problem — absence of any external risk voice was.',
      estimatedOutcome:
        'Fund survives Russia default with 15–20% drawdown rather than 44%; likely continues operating through the early 2000s before gradual wind-down.',
    },
    dqiEstimate: {
      score: 28,
      grade: 'F',
      topBiases: ['overconfidence_bias', 'authority_bias', 'groupthink'],
      rationale:
        'The presence of two Nobel laureates made the model un-challengeable internally (authority bias), external risk voices were absent (no non-principal risk committee), and the 1997 capital return increased rather than decreased effective leverage — a decision only explicable under overconfidence.',
    },
    postMortemCitations: [
      {
        label: "President's Working Group on Financial Markets Report",
        year: 1999,
      },
      {
        label: 'Roger Lowenstein, "When Genius Failed: The Rise and Fall of Long-Term Capital Management"',
        year: 2000,
      },
      {
        label: 'Kambhu, Schuermann & Stiroh, "Hedge Funds, Financial Intermediation, and Systemic Risk" (Federal Reserve Bank of New York Staff Reports, No. 291)',
        year: 2007,
      },
    ],
    relatedCases: ['fin-001', 'fin-002', 'fin-008'],
    patternFamily: 'Model-Worship + Unchallenged Expertise',
    source:
      'Roger Lowenstein, "When Genius Failed" (2000); President\'s Working Group on Financial Markets Report (1999)',
    sourceType: 'academic_paper',
  },
  {
    id: 'fin-006',
    title: 'Enron Accounting Fraud and Collapse',
    company: 'Enron',
    industry: 'financial_services',
    year: 2001,
    yearDiscovered: 2001,
    summary:
      'Enron used special purpose entities and mark-to-market accounting to hide billions in debt and inflate profits. A culture of intimidation silenced internal dissent while the board repeatedly approved complex off-balance-sheet structures they did not fully understand, resulting in the largest corporate bankruptcy at the time.',
    decisionContext:
      'Whether to approve increasingly complex off-balance-sheet financing structures proposed by CFO Andrew Fastow, despite their opacity and conflict-of-interest concerns.',
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedLoss: '$74B',
    biasesPresent: ['groupthink', 'confirmation_bias', 'authority_bias', 'halo_effect'],
    primaryBias: 'groupthink',
    toxicCombinations: ['Echo Chamber', 'Yes Committee', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 15,
    },
    lessonsLearned: [
      'Boards that defer to charismatic executives without independent scrutiny become rubber stamps for fraud.',
      'Confirmation bias in auditing relationships (Arthur Andersen) allowed accounting irregularities to persist for years.',
      "Whistleblower protections are essential; Sherron Watkins' warnings were ignored because the culture punished dissent.",
    ],
    preDecisionEvidence: {
      document:
        "Enron board meeting minutes from June 1999 document the approval of CFO Andrew Fastow's role as managing partner of LJM Cayman L.P. — a special purpose entity that would transact with Enron. The board waived Enron's Code of Ethics specifically to permit Fastow's dual role. Minutes reflect no challenging questions about the inherent conflict of interest. Similar waivers were granted for LJM2 (October 1999) and Chewco.",
      source: 'Powers Report (Special Investigative Committee of the Board of Directors of Enron Corp.)',
      date: '1999-06-28',
      documentType: 'board_memo',
      detectableRedFlags: [
        "Formal waiver of Enron's Code of Ethics to allow CFO to run a counterparty to Enron",
        'Board approval of LJM transactions without independent legal and financial review',
        'Arthur Andersen auditors received ~$25M in consulting fees annually — larger than audit fees',
        "Sherron Watkins' August 2001 memo to Ken Lay warning 'Enron could implode in a wave of accounting scandals' was not escalated to the board",
        'Mark-to-market accounting on Raptors hedged Enron stock — making hedges worthless when stock fell',
      ],
      flaggableBiases: ['groupthink', 'authority_bias', 'halo_effect', 'confirmation_bias'],
      hypotheticalAnalysis:
        "DI would flag the Code of Ethics waiver as the canonical authority-bias + halo-effect decision. Skilling/Fastow's perceived brilliance caused the board to treat the fundamental conflict-of-interest as an administrative detail rather than a governance red flag. A bias-adjusted review would have required independent outside counsel plus a non-management board committee veto on any CFO-counterparty structure. Sherron Watkins' memo in August 2001 represents the canonical 'ignored dissenter' pattern — had any governance circuit-breaker been working, her warning alone would have paused operations.",
    },
    source:
      'U.S. Senate Committee on Governmental Affairs, "The Role of the Board of Directors in Enron\'s Collapse" (2002)',
    sourceType: 'case_study',
  },
  {
    id: 'fin-007',
    title: 'AIG Credit Default Swap Crisis',
    company: 'American International Group',
    industry: 'financial_services',
    year: 2008,
    yearDiscovered: 2008,
    summary:
      "AIG's Financial Products division sold approximately $500 billion in credit default swaps on mortgage-backed CDOs without adequate reserves. When housing prices collapsed, AIG faced margin calls it could not meet, requiring a $182 billion federal bailout to prevent cascading counterparty failures.",
    decisionContext:
      'Whether to continue underwriting credit default swaps on mortgage-backed securities without posting collateral or building loss reserves against a potential housing downturn.',
    outcome: 'catastrophic_failure',
    impactScore: 100,
    estimatedLoss: '$182B',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'confirmation_bias',
      'cognitive_misering',
      'groupthink',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Echo Chamber'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 8,
    },
    lessonsLearned: [
      'Selling insurance without reserves against tail risk is a business model that guarantees eventual catastrophe.',
      'Anchoring to AAA credit ratings on structured products masked the true default correlation risk.',
      "Counterparty risk concentration can transform a single firm's failure into a systemic crisis.",
    ],
    preDecisionEvidence: {
      document:
        '2005 Financial Products division strategy memo on CDS portfolio expansion targeting $500B notional value',
      source: 'AIG Financial Products Division (Joseph Cassano)',
      date: '2005',
      documentType: 'strategy_document',
      detectableRedFlags: [
        'CDS portfolio concentration in mortgage-backed securities',
        'Risk models assuming housing prices could not decline nationally',
        'No stress testing for correlated defaults',
        'Leverage ratios exceeding 100:1 on some positions',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'anchoring_bias',
        'confirmation_bias',
        'cognitive_misering',
        'groupthink',
      ],
      hypotheticalAnalysis:
        'Decision intelligence would have flagged the extreme concentration risk and the foundational assumption that national housing prices could not decline simultaneously — an assumption contradicted by historical data from Japan (1990s) and regional US markets. The absence of correlated-default stress testing would have triggered immediate model risk warnings.',
    },
    source:
      'Financial Crisis Inquiry Commission Report (2011); Congressional Oversight Panel, "The AIG Rescue" (2010)',
    sourceType: 'sec_filing',
  },
  {
    id: 'fin-008',
    title: 'Wirecard Accounting Fraud',
    company: 'Wirecard',
    industry: 'financial_services',
    year: 2020,
    yearDiscovered: 2020,
    summary:
      'German payments company Wirecard fabricated €1.9 billion in cash balances held in Philippine bank accounts. Despite years of investigative journalism by the Financial Times exposing irregularities, German regulators and auditors sided with the company, even filing criminal complaints against the journalists.',
    decisionContext:
      'Whether to investigate or dismiss repeated allegations of accounting fraud raised by short sellers and journalists between 2015 and 2020.',
    outcome: 'catastrophic_failure',
    impactScore: 85,
    estimatedLoss: '€1.9B',
    biasesPresent: [
      'confirmation_bias',
      'authority_bias',
      'groupthink',
      'selective_perception',
      'halo_effect',
    ],
    primaryBias: 'confirmation_bias',
    toxicCombinations: ['Echo Chamber', 'Yes Committee', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 10,
    },
    lessonsLearned: [
      'Regulators who identify with the companies they oversee become enablers rather than watchdogs.',
      'Shooting the messenger (attacking journalists and short sellers) is a red flag for confirmation bias in governance.',
      'Third-party audits are insufficient safeguards when auditors face conflicts of interest and fail to verify basic claims.',
    ],
    preDecisionEvidence: {
      document:
        '2019 annual investor presentation claiming €1.9B held in trustee accounts in the Philippines',
      source: 'Wirecard AG Investor Relations (Markus Braun, CEO)',
      date: '2019',
      documentType: 'investor_deck',
      detectableRedFlags: [
        'Third-party trustee arrangement obscuring direct verification',
        'Revenue growth outpacing industry by 3x without clear explanation',
        'Short-seller reports from 2015-2019 raising fraud allegations',
        'Auditor reliance on trustee confirmations without independent verification',
      ],
      flaggableBiases: [
        'confirmation_bias',
        'authority_bias',
        'groupthink',
        'selective_perception',
        'halo_effect',
      ],
      hypotheticalAnalysis:
        'Decision intelligence would have flagged the unusual trustee account structure as a verification gap — the inability to independently confirm €1.9B in assets through standard audit procedures was a critical red flag. The pattern of attacking short-sellers rather than providing transparent rebuttals would have triggered authority bias and confirmation bias warnings.',
    },
    keyQuotes: [
      {
        text: 'There is zero truth to the allegations... the report is not only wrong, but it is a baseless attack on our company.',
        source: 'Wirecard response to FT "House of Wirecard" investigation',
        date: '2019-02',
        speaker: 'Markus Braun, CEO',
      },
      {
        text: 'BaFin stands on the side of Wirecard.',
        source: 'BaFin short-selling ban announcement (paraphrased across German press)',
        date: '2019-02-18',
        speaker: 'Felix Hufeld, BaFin President',
      },
      {
        text: 'The missing €1.9 billion probably does not exist.',
        source: 'Wirecard AG ad-hoc disclosure',
        date: '2020-06-22',
        speaker: 'Wirecard management board',
      },
    ],
    timeline: [
      {
        date: '2015-04',
        event: 'FT Alphaville publishes first "House of Wirecard" posts raising concerns about Asian subsidiaries.',
        source: 'Financial Times, Dan McCrum',
      },
      {
        date: '2018-09',
        event: 'Wirecard joins the DAX 30, replacing Commerzbank — market cap peaks near €24B.',
        source: 'Deutsche Börse press release',
      },
      {
        date: '2019-01',
        event: 'FT publishes leaked internal documents alleging accounting fraud at Wirecard Singapore.',
        source: 'FT investigation, Jan 30 2019',
      },
      {
        date: '2019-02-18',
        event: 'BaFin imposes a two-month ban on short selling Wirecard stock and files criminal complaint against FT journalists for market manipulation.',
        source: 'BaFin official announcement',
      },
      {
        date: '2019-04',
        event: 'EY issues unqualified 2018 audit opinion despite not obtaining direct confirmation from the Philippine trustee banks.',
        source: 'German Parliamentary Inquiry testimony, 2021',
      },
      {
        date: '2019-10',
        event: 'Wirecard commissions KPMG special audit in response to FT reporting.',
        source: 'Wirecard ad-hoc disclosure',
      },
      {
        date: '2020-04-28',
        event: 'KPMG special audit report: could not verify the existence of the €1.9B or the revenue from three key partner businesses.',
        source: 'KPMG Special Investigation Report, April 2020',
      },
      {
        date: '2020-06-18',
        event: 'BDO confirms from Philippine central bank that the €1.9B never existed in the named accounts.',
        source: 'FT, BSP statement',
      },
      {
        date: '2020-06-25',
        event: 'Wirecard files for insolvency; Braun arrested.',
        source: 'Munich District Court filings',
      },
    ],
    stakeholders: [
      {
        name: 'Markus Braun',
        role: 'CEO (2002–2020)',
        position: 'advocate',
        notes: 'Arrested June 2020; convicted on fraud and market-manipulation charges in 2024.',
      },
      {
        name: 'Jan Marsalek',
        role: 'COO',
        position: 'advocate',
        notes: 'Fled Germany June 2020; believed to be in Russia.',
      },
      {
        name: 'Alexander von Knoop',
        role: 'CFO',
        position: 'silent',
      },
      {
        name: 'Thomas Eichelmann',
        role: 'Supervisory Board Chair (from Jan 2020)',
        position: 'dissenter',
        notes: 'Commissioned the KPMG special audit that ultimately exposed the fraud.',
      },
      {
        name: 'Felix Hufeld',
        role: 'BaFin President (2015–2021)',
        position: 'overruled',
        notes: 'Forced to resign January 2021 after acknowledging BaFin "was not effective enough."',
      },
      {
        name: 'Dan McCrum',
        role: 'Financial Times investigative reporter',
        position: 'dissenter',
        notes: 'Subject of BaFin criminal complaint; reporting vindicated by KPMG and BDO findings.',
      },
    ],
    counterfactual: {
      recommendation:
        'BaFin investigates the FT allegations on their merits rather than shorting the messengers; EY refuses to sign the 2018 audit without direct bank confirmations from BDO Unibank and BPI; supervisory board commissions independent audit in 2019 rather than 2020.',
      rationale:
        'Every escalation point — regulator, auditor, board — chose institutional defense over independent verification. A decision process with even one working circuit-breaker would have shortened the fraud window by 18–24 months and prevented the DAX 30 listing.',
      estimatedOutcome:
        'Fraud exposed at ~€500M scale in 2019 rather than €1.9B in 2020. Wirecard delisted but not the systemic failure it became; BaFin retains credibility.',
    },
    dqiEstimate: {
      score: 18,
      grade: 'F',
      topBiases: ['confirmation_bias', 'authority_bias', 'halo_effect'],
      rationale:
        'DAX 30 status (halo), regulator alignment with the company (authority), and active hostility toward critics (confirmation bias as organizational posture) made the decision process structurally incapable of self-correction.',
    },
    postMortemCitations: [
      {
        label: 'German Parliamentary Inquiry into Wirecard (Untersuchungsausschuss)',
        year: 2021,
      },
      {
        label: 'KPMG Special Investigation Report on Wirecard AG',
        year: 2020,
      },
      {
        label: 'Dan McCrum, "Money Men: A Hot Startup, A Billion Dollar Fraud, A Fight for the Truth"',
        year: 2022,
      },
      {
        label: 'EY disciplinary proceedings by Abschlussprüferaufsichtsstelle (APAS)',
        year: 2023,
      },
    ],
    relatedCases: ['fin-001', 'fin-005', 'fin-006'],
    patternFamily: 'Regulator Capture + Shoot-the-Messenger',
    source:
      'German Parliamentary Inquiry into Wirecard (2021); FT investigative series by Dan McCrum (2015-2020)',
    sourceType: 'news_investigation',
  },
  {
    id: 'fin-009',
    title: 'Credit Suisse Archegos Capital Losses',
    company: 'Credit Suisse',
    industry: 'financial_services',
    year: 2021,
    yearDiscovered: 2021,
    summary:
      "Credit Suisse lost $5.5 billion when family office Archegos Capital defaulted on margin calls from highly leveraged total return swap positions. Despite receiving multiple internal warnings about Archegos's concentrated exposure, the prime brokerage division chose to maintain the profitable relationship rather than reduce limits.",
    decisionContext:
      "Whether to enforce margin requirements and reduce exposure to Archegos Capital as the family office's concentrated leveraged positions grew beyond normal risk thresholds.",
    outcome: 'failure',
    impactScore: 75,
    estimatedLoss: '$5.5B',
    biasesPresent: [
      'anchoring_bias',
      'status_quo_bias',
      'cognitive_misering',
      'loss_aversion',
      'overconfidence_bias',
    ],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Status Quo Lock'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 12,
    },
    lessonsLearned: [
      'Revenue anchoring causes relationship managers to underweight risk signals when a client is highly profitable.',
      'Status quo bias in risk management means limits that should be tightened remain unchanged until it is too late.',
      'When multiple banks have the same exposure, the first to act minimizes losses while the last absorbs the worst.',
    ],
    preDecisionEvidence: {
      document:
        "Credit Suisse prime services risk committee reviewed Archegos Capital exposure in late 2020 and early 2021. The committee documented that Archegos's aggregate gross exposure across prime brokers exceeded $50B against reported family-office equity of ~$10B, implying effective leverage of 5-8x on concentrated single-stock positions. Credit Suisse's initial margin requirements on Archegos total return swaps were set materially below Goldman Sachs and Morgan Stanley — a competitive-intensity decision rather than a risk-based one. Earlier internal recommendations to raise margin were deferred pending relationship-revenue discussions.",
      source: 'Credit Suisse Special Committee Report on Archegos (Paul, Weiss, July 2021), pp. 26-58',
      date: '2021-01',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        'Initial margin below peer banks on identical counterparty — competitive-pricing decision overriding risk',
        "Knowledge that Bill Hwang's prior Tiger Asia vehicle settled SEC insider-trading charges in 2012",
        'Archegos aggregate gross exposure across prime brokers estimated at 5x+ reported family-office capital',
        'Prime services risk function did not have authority to force margin increases over relationship-banker objection',
        "CRO pushback on Archegos limits deferred to relationship-revenue discussions",
      ],
      flaggableBiases: ['anchoring_bias', 'loss_aversion', 'authority_bias', 'overconfidence_bias'],
      hypotheticalAnalysis:
        "DI would flag Credit Suisse's Archegos risk decisions as the canonical revenue-anchor override of risk function. The bank's below-peer margin was a commercially-motivated choice that a bias-adjusted process would have required competitive/risk trade-off documentation for — 'we accept $X of additional tail risk to compete with GS on this specific counterparty' should have been an explicit ratified decision, not an emergent drift. Hwang's 2012 SEC settlement made the halo-effect operative: 'we know this counterparty' overrode base-rate concern about concentrated leverage.",
    },
    source:
      'Credit Suisse Special Committee Report on Archegos (2021); SEC complaint against Archegos principals',
    sourceType: 'case_study',
  },
  {
    id: 'fin-010',
    title: 'FTX Cryptocurrency Exchange Collapse',
    company: 'FTX',
    industry: 'financial_services',
    year: 2022,
    yearDiscovered: 2022,
    summary:
      "FTX, valued at $32 billion, collapsed in days after it was revealed that customer deposits had been commingled with its sister trading firm Alameda Research. The company operated without a board of directors, and investors performed minimal due diligence, deferring to founder Sam Bankman-Fried's perceived authority.",
    decisionContext:
      'Whether investors, auditors, and regulators should have demanded standard corporate governance structures, independent boards, and segregation of customer funds before extending trust and capital.',
    outcome: 'catastrophic_failure',
    impactScore: 90,
    estimatedLoss: '$32B',
    biasesPresent: ['authority_bias', 'groupthink', 'overconfidence_bias', 'halo_effect'],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Yes Committee', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 5,
    },
    lessonsLearned: [
      'Authority bias toward charismatic founders can cause sophisticated investors to abandon basic due diligence.',
      "The absence of a functioning board of directors is a critical governance red flag regardless of a company's valuation.",
      'Commingling customer funds with proprietary trading is a fundamental violation of fiduciary duty that no amount of innovation justifies.',
    ],
    preDecisionEvidence: {
      document:
        "FTX raised $400M at a $32B valuation from investors including Sequoia, Paradigm, SoftBank, Temasek, and the Ontario Teachers' Pension Plan. The company had no board of directors. CEO Sam Bankman-Fried was the sole signatory on corporate actions. No independent audit of the relationship between FTX and sister trading firm Alameda Research had been performed. Sequoia's published profile described SBF playing League of Legends during the pitch meeting as a positive trait.",
      source: 'FTX Series C press release; Sequoia Capital published profile of Sam Bankman-Fried (archived, deleted November 2022)',
      date: '2022-01-31',
      documentType: 'press_release',
      detectableRedFlags: [
        'No board of directors at a company holding billions of dollars in customer assets',
        'Founder-controlled holding companies commingling corporate and personal funds',
        'No segregation of customer crypto deposits from sister trading firm balance sheet',
        'Unaudited relationship between FTX exchange and Alameda Research',
        'Sequoia published profile celebrating founder attention-splitting as a virtue',
      ],
      flaggableBiases: ['authority_bias', 'halo_effect', 'bandwagon_effect', 'groupthink'],
      hypotheticalAnalysis:
        'DI would flag the absence of a functioning board of directors at a $32B financial-services company as a binary governance failure. The Sequoia profile\'s framing of founder-as-genius as substitute for institutional due diligence is a textbook halo-effect signal. Customer funds commingling is a bright-line fiduciary red flag — no bias-adjusted valuation could survive basic audit-trail verification of customer-asset segregation.',
    },
    source:
      "FTX Debtors' First Interim Report, Chapter 11 Case No. 22-11068 (2023); SEC v. Samuel Bankman-Fried complaint",
    sourceType: 'sec_filing',
  },
  {
    id: 'fin-011',
    title: 'Silicon Valley Bank Collapse',
    company: 'Silicon Valley Bank',
    industry: 'financial_services',
    year: 2023,
    yearDiscovered: 2023,
    summary:
      'SVB collapsed after a bank run triggered by unrealized losses on its long-duration bond portfolio. Management had concentrated deposits in the tech/VC sector and invested heavily in long-term treasuries and MBS without adequate interest rate hedging, anchoring to the prolonged low-rate environment.',
    decisionContext:
      'Whether to hedge interest rate risk on the held-to-maturity bond portfolio or maintain unhedged positions as rates began rising rapidly in 2022.',
    outcome: 'catastrophic_failure',
    impactScore: 90,
    estimatedLoss: '$209B',
    biasesPresent: ['groupthink', 'anchoring_bias', 'status_quo_bias', 'recency_bias'],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Status Quo Lock'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 9,
    },
    lessonsLearned: [
      'Anchoring to a decade of near-zero interest rates caused management to treat rising rates as a temporary anomaly rather than a regime change.',
      'Concentrated depositor bases in a single industry amplify run risk when that industry faces a downturn.',
      'Recency bias in risk models that rely on recent low-volatility periods systematically underestimate tail risks.',
    ],
    preDecisionEvidence: {
      document:
        "SVB's Q4 2021 earnings commentary emphasized the bank's strategy of investing incoming deposits into high-quality long-duration agency MBS and Treasuries with the expectation that its tech/VC deposit base would remain stable. Hedging of interest-rate risk on the held-to-maturity portfolio was explicitly described as unnecessary given the rate outlook. The bank operated without a Chief Risk Officer for eight months in 2022.",
      source: 'SVB Financial Group Q4 2021 earnings call and 10-K; Federal Reserve SVB Review (April 2023)',
      date: '2022-01-27',
      documentType: 'earnings_call',
      detectableRedFlags: [
        'Held-to-maturity book extended to 5.6-year average duration with no interest-rate hedging',
        '~90% of deposits uninsured (above FDIC $250K limit), concentrated in a single industry',
        'No Chief Risk Officer in place from April to December 2022',
        '2021 deposit growth of $87B (doubling) was assumed to be durable despite tech-sector cyclicality',
        'Federal Reserve supervisors had flagged issues but ratings actions lagged',
      ],
      flaggableBiases: ['anchoring_bias', 'status_quo_bias', 'recency_bias', 'groupthink'],
      hypotheticalAnalysis:
        'DI would flag two compounding decisions: (1) extending HTM duration to 5.6 years during a near-zero-rate environment without hedging was a classic recency-bias mistake — treating a decade of low rates as permanent. (2) The concentrated uninsured deposit base meant a run was a single-industry event away. The vacant CRO seat through most of 2022 is a governance signal that reliably precedes crisis.',
    },
    source:
      "Federal Reserve Board Review of the Federal Reserve's Supervision and Regulation of SVB (2023)",
    sourceType: 'case_study',
  },
  {
    id: 'fin-012',
    title: 'MF Global Bankruptcy',
    company: 'MF Global',
    industry: 'financial_services',
    year: 2011,
    yearDiscovered: 2011,
    summary:
      "Under CEO Jon Corzine's leadership, MF Global made a $6.3 billion bet on European sovereign debt using repo-to-maturity transactions. When European debt prices fell, margin calls drained the firm's liquidity, and $1.6 billion in customer funds were improperly used to meet obligations.",
    decisionContext:
      "Whether to approve CEO Corzine's strategy of leveraged bets on European sovereign bonds as a path to transforming MF Global from a brokerage into an investment bank.",
    outcome: 'catastrophic_failure',
    impactScore: 75,
    estimatedLoss: '$1.6B',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'authority_bias',
      'groupthink',
      'sunk_cost_fallacy',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Yes Committee', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 7,
    },
    lessonsLearned: [
      "A CEO's prior political stature and reputation can create authority bias that suppresses board-level risk oversight.",
      'Concentrated directional bets funded by customer money violate the fundamental trust of brokerage operations.',
      'Anchoring to past success in government bond markets ignores the different risk profile of sovereign credit exposure.',
    ],
    preDecisionEvidence: {
      document:
        "MF Global's Q3 FY2011 board materials documented a $6.3B gross exposure to European sovereign debt (Italy, Spain, Portugal, Ireland, Belgium) through repo-to-maturity transactions. The structure was disclosed as 'off-balance-sheet' despite carrying full market risk. CEO Jon Corzine personally directed the trades, overruling Chief Risk Officer Michael Roseman's objections — Roseman was replaced in January 2011 after refusing to approve increased sovereign exposure. CFO Henri Steenkamp's balance sheet reports understated the true liquidity risk of the RTM structure.",
      source: "SIPA Trustee's Report on MF Global (2013); CFTC v. MF Global Inc. complaint; House Financial Services Committee testimony",
      date: '2011-06',
      documentType: 'board_memo',
      detectableRedFlags: [
        'Chief Risk Officer (Roseman) removed in Jan 2011 after objecting to sovereign exposure — replaced by successor more receptive to CEO strategy',
        'Repo-to-maturity structure reported as off-balance-sheet while carrying full market risk',
        "CEO Corzine's personal direction of proprietary trades from executive office — blurring line between CEO and trader roles",
        'Initial board approvals set limit at $1B — breached multiple times before limit was raised retroactively to $4.75B, then $5B',
        'Financial Industry Regulatory Authority (FINRA) raised concerns about capital treatment of the RTM positions in summer 2011',
      ],
      flaggableBiases: ['overconfidence_bias', 'authority_bias', 'sunk_cost_fallacy', 'gamblers_fallacy'],
      hypotheticalAnalysis:
        "DI would flag Corzine's removal of the CRO as the single most diagnostic event. A decision process where the CEO replaces the risk officer who challenges him — and the board allows it — is structurally incapable of circuit-breaking. The retroactive limit raises (rather than forced unwinds) is the signature of gambler's fallacy: each loss cycle produces a 'we're closer to the reversal' rationalization rather than a mandatory trim. The $1.6B customer-fund shortfall that ended the firm was the final-stage expression of a decision process that had already ceased functioning.",
    },
    source: "CFTC v. MF Global Inc. complaint; SIPA Trustee's Report on MF Global (2013)",
    sourceType: 'sec_filing',
  },
  {
    id: 'fin-013',
    title: 'Wells Fargo Fake Accounts Scandal',
    company: 'Wells Fargo',
    industry: 'financial_services',
    year: 2016,
    yearDiscovered: 2016,
    summary:
      'Wells Fargo employees created over 3.5 million unauthorized bank and credit card accounts to meet aggressive cross-selling targets. The practice persisted for over a decade as management dismissed internal complaints and the board failed to investigate systemic misconduct.',
    decisionContext:
      'Whether to maintain aggressive cross-selling quotas and the "eight is great" strategy despite mounting evidence of employee misconduct and unauthorized account creation.',
    outcome: 'failure',
    impactScore: 80,
    estimatedLoss: '$3B',
    biasesPresent: ['groupthink', 'authority_bias', 'bandwagon_effect'],
    primaryBias: 'groupthink',
    toxicCombinations: ['Yes Committee'],
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 20,
    },
    lessonsLearned: [
      'Incentive structures that reward volume over quality create systemic pressure for misconduct at every organizational level.',
      'When employees who report problems are fired rather than heard, the organization eliminates its own early warning system.',
      'Authority bias toward a storied corporate culture ("the Wells Fargo way") prevented leaders from acknowledging systemic fraud.',
    ],
    preDecisionEvidence: {
      document:
        "2010 internal 'Going for Gr-Eight' cross-selling strategy memo setting 8-products-per-customer target",
      source: 'Wells Fargo Community Banking Division (Carrie Tolstedt)',
      date: '2010',
      documentType: 'internal_memo',
      detectableRedFlags: [
        '8-product target was arbitrary with no customer-demand basis',
        'Aggressive sales quotas creating perverse incentives',
        'Whistleblower complaints already surfacing about fake accounts',
        'Branch-level metrics showing statistically improbable account opening rates',
      ],
      flaggableBiases: ['groupthink', 'authority_bias', 'bandwagon_effect'],
      hypotheticalAnalysis:
        "Decision intelligence would have flagged the disconnect between the arbitrary '8 products' target and actual customer financial needs. The escalating whistleblower reports combined with statistically anomalous account-opening metrics would have triggered fraud-risk and incentive-misalignment warnings at high confidence.",
    },
    source:
      'Wells Fargo Board Independent Directors Report (2017); CFPB Consent Order No. 2016-CFPB-0015',
    sourceType: 'case_study',
  },
  {
    id: 'fin-014',
    title: 'Deutsche Bank Mirror Trading Scandal',
    company: 'Deutsche Bank',
    industry: 'financial_services',
    year: 2017,
    yearDiscovered: 2017,
    summary:
      "Deutsche Bank's Moscow branch facilitated $10 billion in mirror trades that moved money out of Russia between 2011 and 2015. Compliance failures and a culture of status quo acceptance allowed suspicious transactions to continue despite red flags, resulting in $630 million in regulatory fines.",
    decisionContext:
      'Whether to investigate and halt suspicious mirror trading patterns between the Moscow and London offices that compliance teams had flagged multiple times.',
    outcome: 'failure',
    impactScore: 65,
    estimatedLoss: '$630M',
    biasesPresent: [
      'status_quo_bias',
      'cognitive_misering',
      'groupthink',
      'confirmation_bias',
      'selective_perception',
    ],
    primaryBias: 'status_quo_bias',
    toxicCombinations: ['Echo Chamber'],
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 15,
    },
    lessonsLearned: [
      'Status quo bias in compliance means that revenue-generating activities receive less scrutiny than they warrant.',
      'Cognitive misering in AML processes leads teams to check boxes rather than critically analyze transaction patterns.',
      'Decentralized operations across jurisdictions create oversight gaps that enable illicit activity to persist.',
    ],
    preDecisionEvidence: {
      document:
        "Deutsche Bank Moscow equity desk from 2011 onward executed a pattern of same-day matched trades: the Moscow office bought Russian equities from clients for rubles while the London office sold the same securities for dollars or euros to related counterparties. Internal compliance teams flagged the pattern as 'economically meaningless from a trading perspective' multiple times between 2012 and 2014. Trade volume reached approximately $10B. Moscow head of equities Tim Wiswell's personal relationships with client counterparties were documented in internal communications that went unaddressed.",
      source: 'FCA Final Notice to Deutsche Bank AG (2017); NY DFS Consent Order (2017) ¶¶ 21-45',
      date: '2014-06',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        "Compliance team described the mirror-trade pattern as 'economically meaningless' in writing — yet trades continued",
        'Revenue from the trades was material to Moscow equity desk P&L — creating escalation disincentive',
        'Sanctioned clients appeared in trade counterparty chains',
        'Head of equities Moscow (Wiswell) had personal relationships with counterparty firms, flagged but not reviewed',
        'No jurisdictional KYC review correlated Moscow-client identities with London-counterparty identities',
      ],
      flaggableBiases: ['status_quo_bias', 'selective_perception', 'cognitive_misering', 'loss_aversion'],
      hypotheticalAnalysis:
        "DI would flag Deutsche Bank's mirror-trading case as the canonical 'revenue-generating activity evades compliance scrutiny' failure. When a compliance team calls transactions 'economically meaningless' and they continue, a decision process with working circuit-breakers would have required either a documented business-purpose explanation or a halt. The organizational status quo — 'this desk makes money, other desks don't, let the experts manage it' — is the bias. A bias-adjusted AML review would have required cross-jurisdiction identity matching as a mandatory bright-line check that would have surfaced the pattern in months, not years.",
    },
    source: 'FCA Final Notice to Deutsche Bank AG (2017); NY DFS Consent Order (2017)',
    sourceType: 'fca_enforcement',
  },
  {
    id: 'fin-015',
    title: 'Bernie Madoff Ponzi Scheme',
    company: 'Bernard L. Madoff Investment Securities',
    industry: 'financial_services',
    year: 2008,
    yearDiscovered: 2008,
    summary:
      "Bernie Madoff operated the largest Ponzi scheme in history for at least 17 years, fabricating returns for thousands of investors. Despite Harry Markopolos submitting detailed fraud evidence to the SEC multiple times starting in 2000, regulators deferred to Madoff's authority and reputation as a former NASDAQ chairman.",
    decisionContext:
      "Whether the SEC and feeder funds should investigate Madoff's consistently above-market returns and opaque operational structure, or continue to defer to his industry authority and reputation.",
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedLoss: '$64.8B',
    biasesPresent: ['authority_bias', 'confirmation_bias', 'bandwagon_effect', 'halo_effect'],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Echo Chamber', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 3,
    },
    lessonsLearned: [
      'Authority bias can paralyze regulatory agencies when the subject of investigation holds industry prestige.',
      'Bandwagon effect among investors created social proof that substituted for independent due diligence.',
      'Consistent, market-beating returns with no drawdowns are themselves a red flag that should trigger deeper scrutiny.',
    ],
    preDecisionEvidence: {
      document:
        "Harry Markopolos submitted a detailed analysis to the SEC titled 'The World's Largest Hedge Fund is a Fraud' documenting 29 specific red flags, including the mathematical impossibility of Madoff's claimed split-strike conversion strategy at his reported AUM, the absence of any audit trail for the claimed trades, and the obscure two-person Friehling & Horowitz audit firm reviewing a multi-billion-dollar enterprise. The SEC took no substantive action.",
      source: 'Harry Markopolos submission to SEC Boston Regional Office',
      date: '2005-11-07',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        'Claimed options-market volume exceeded actual CBOE volume for the relevant contracts',
        'Audit firm Friehling & Horowitz had three employees — one semi-retired — for a claimed multi-billion-dollar audit',
        'Returns were uncorrelated with market conditions and showed near-zero drawdowns for 15+ years',
        'Fund-of-funds feeders (Fairfield Greenwich, Tremont) took massive fees but performed no independent trade verification',
        'Investors were explicitly told not to discuss the investment publicly',
      ],
      flaggableBiases: ['authority_bias', 'bandwagon_effect', 'halo_effect', 'confirmation_bias'],
      hypotheticalAnalysis:
        "DI would flag the Markopolos submission itself as the canonical 'external dissenter was ignored' pattern. Every structural red flag was documented 3+ years before collapse. The SEC's failure was not information — it was authority bias toward Madoff's NASDAQ chairmanship role. The fund-of-funds ecosystem that fed Madoff exhibited pure bandwagon effect: each feeder took comfort from other feeders' endorsements rather than performing independent verification.",
    },
    source:
      'SEC Office of Inspector General Report No. 509 (2009); Harry Markopolos, "No One Would Listen" (2010)',
    sourceType: 'sec_filing',
  },
];
