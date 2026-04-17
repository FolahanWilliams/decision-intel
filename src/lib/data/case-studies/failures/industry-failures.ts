import { CaseStudy } from '../types';

export const INDUSTRY_FAILURE_CASES: CaseStudy[] = [
  {
    id: 'cs-fail-ind-001',
    title: 'Boeing 737 MAX MCAS Design Failures',
    company: 'Boeing',
    industry: 'aerospace',
    year: 2018,
    yearRealized: 2019,
    summary:
      "Boeing's 737 MAX featured the MCAS (Maneuvering Characteristics Augmentation System) that relied on a single angle-of-attack sensor with no redundancy. To avoid costly pilot retraining that would reduce the MAX's competitive advantage against Airbus, Boeing minimized MCAS disclosure to airlines and the FAA. Two crashes — Lion Air 610 (October 2018) and Ethiopian Airlines 302 (March 2019) — killed 346 people. The MAX was grounded worldwide for 20 months.",
    decisionContext:
      'Whether to design the 737 MAX MCAS system with redundant sensors and comprehensive pilot training, accepting higher costs and longer delivery timelines, or minimize changes to preserve the "no new type rating required" selling point.',
    outcome: 'catastrophic_failure',
    impactScore: 99,
    estimatedImpact: '$20B+ in direct costs; 346 lives lost',
    impactDirection: 'negative',
    biasesPresent: [
      'planning_fallacy',
      'confirmation_bias',
      'overconfidence_bias',
      'groupthink',
      'anchoring_bias',
      'framing_effect',
    ],
    primaryBias: 'planning_fallacy',
    toxicCombinations: ['Echo Chamber', 'Blind Sprint'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 20,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Framing a safety-critical system as a "minor change" to avoid regulatory scrutiny is the most dangerous form of the framing effect — it literally kills people.',
      'When engineers raised concerns about single-sensor dependency, organizational pressure to meet schedule and cost targets overrode safety culture.',
      'The planning fallacy of "we can ship on time with this simpler design" created a cascade of compromises that accumulated into catastrophic system failure.',
    ],
    source:
      'House Committee on Transportation and Infrastructure, "The Design, Development & Certification of the Boeing 737 MAX" (September 2020); NTSB accident reports (Lion Air 610, Ethiopian Airlines 302); DOJ deferred prosecution agreement (January 2021)',
    sourceType: 'ntsb_report',
    preDecisionEvidence: {
      document:
        'Boeing\'s 2011 board presentation on the 737 MAX program (reconstructed from House Committee report): Boeing evaluated two options — a clean-sheet narrow-body design (est. $15-20B, 7-10 year timeline) vs. re-engining the existing 737 airframe with new LEAP engines (est. $3B, 3-5 year timeline). The board approved the re-engine approach in August 2011, citing: "Airbus is already taking orders for the A320neo. We cannot afford to cede the narrow-body market for a decade." Internal engineering memo (2012): "The larger LEAP engines change the aircraft\'s handling characteristics, particularly at high angles of attack. We recommend augmentation through a new flight control law." The MCAS system was designed as a "minor flight control modification" — framing that enabled Boeing to classify it as not requiring new type certification.',
      source:
        'House Committee on Transportation and Infrastructure report (2020), Chapter 4; Boeing internal emails and memos cited in DOJ deferred prosecution agreement; FAA ODA audit findings',
      date: '2011-08-01',
      documentType: 'board_memo',
      detectableRedFlags: [
        'Choosing 3-5 year timeline over 7-10 year timeline primarily due to competitive pressure — time pressure overriding engineering completeness',
        'Framing a flight control system change as "minor modification" to avoid regulatory scrutiny — classic framing effect',
        "Engineering team's recommendation for augmentation acknowledged the handling change but was not paired with redundancy requirements",
        'Unanimous board consensus with no documented dissent — 20 participants yet no one flagged the safety tradeoff explicitly',
        '"No new type rating" as a selling point — anchoring customer value proposition to pilot training avoidance rather than safety',
      ],
      flaggableBiases: [
        'planning_fallacy',
        'confirmation_bias',
        'framing_effect',
        'groupthink',
        'anchoring_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: CRITICAL "Blind Sprint" toxic combination — time pressure + groupthink + planning fallacy. The decision to re-engine rather than design new is defensible, but the DOWNSTREAM framing of MCAS as "minor" is where catastrophic risk accumulates. Red flag: classifying a system that can override pilot control authority as a "minor modification" is the framing effect at its most dangerous. Second red flag: zero documented dissent among 20 participants on a safety-critical aerospace decision — in any healthy engineering culture, this unanimity itself is a warning sign. The platform would generate an IMMEDIATE ESCALATION: "This decision involves safety-of-flight systems where failure modes include loss of life. The combination of time pressure, framing effects, and unanimous consensus requires independent safety review outside the program management chain." Recommendation: Require dual-sensor redundancy as a non-negotiable design constraint before program approval.',
    },
    keyQuotes: [
      {
        text: 'Designed by clowns who in turn are supervised by monkeys.',
        source: 'Boeing internal instant message, released by House Committee',
        date: '2017-06',
        speaker: 'Boeing 737 MAX engineer (internal Slack-equivalent)',
      },
      {
        text: "I still haven't been forgiven by God for the covering up I did last year.",
        source: 'Boeing internal instant message, released by House Committee',
        date: '2018',
        speaker: 'Mark Forkner, Chief Technical Pilot (later acquitted at trial)',
      },
      {
        text: 'We are not going to rush to make a decision just because of pressure.',
        source: 'Statement to analysts after Lion Air 610',
        date: '2018-11',
        speaker: 'Dennis Muilenburg, CEO',
      },
      {
        text: 'I sincerely apologize from the bottom of my heart.',
        source: 'Senate Commerce Committee testimony',
        date: '2019-10-29',
        speaker: 'Dennis Muilenburg, CEO (to families of crash victims)',
      },
    ],
    timeline: [
      {
        date: '2011-08',
        event:
          'American Airlines signals it will order Airbus A320neo unless Boeing responds — forcing Boeing to commit to re-engined 737 (MAX) rather than clean-sheet design.',
        source: 'House Committee report, Ch. 2',
      },
      {
        date: '2012',
        event:
          'Engineers discover larger CFM LEAP engines require mounting forward/higher — creates nose-up pitch tendency under certain conditions. MCAS is designed as a software fix.',
        source: 'House Committee report, Ch. 3',
      },
      {
        date: '2013',
        event:
          'Boeing internal decision to rely on a single Angle-of-Attack sensor for MCAS inputs (rather than both) to avoid triggering a new simulator training requirement.',
        source: 'DOJ Deferred Prosecution Agreement, January 2021',
      },
      {
        date: '2016-11',
        event:
          'Chief Technical Pilot Mark Forkner asks FAA to remove MCAS from the 737 MAX Flight Crew Operations Manual — approved.',
        source: 'FAA correspondence, cited in House Committee report',
      },
      {
        date: '2017-03-08',
        event:
          'FAA grants amended type certificate for 737 MAX — without requiring new simulator training.',
        source: 'FAA Type Certificate, 737-8',
      },
      {
        date: '2018-10-29',
        event: 'Lion Air Flight 610 crashes into Java Sea, killing 189.',
        source: 'KNKT (Indonesia) final report',
      },
      {
        date: '2019-03-10',
        event:
          'Ethiopian Airlines Flight 302 crashes after takeoff, killing 157. Fleet grounded globally within 72 hours.',
        source: 'EAIB Interim Report; FAA emergency order',
      },
      {
        date: '2020-11-18',
        event:
          'FAA approves return to service after 20-month grounding and MCAS redesign to use both AoA sensors.',
        source: 'FAA Airworthiness Directive 2020-24-02',
      },
      {
        date: '2021-01-07',
        event:
          'DOJ Deferred Prosecution Agreement — Boeing agrees to $2.5B penalty for conspiracy to defraud the FAA.',
        source: 'DOJ press release, January 7 2021',
      },
    ],
    stakeholders: [
      {
        name: 'Dennis Muilenburg',
        role: 'CEO (2015–2019)',
        position: 'advocate',
        notes:
          'Oversaw MAX program through both crashes. Fired December 2019; received ~$62M in severance and stock.',
      },
      {
        name: 'Kevin McAllister',
        role: 'CEO, Boeing Commercial Airplanes',
        position: 'advocate',
        notes: 'Fired October 2019 amid MAX crisis.',
      },
      {
        name: 'Mark Forkner',
        role: 'Chief Technical Pilot',
        position: 'overruled',
        notes:
          'Asked FAA to drop MCAS from pilot training docs. Acquitted at trial 2022 — jury accepted he was scapegoated for systemic decisions made above him.',
      },
      {
        name: 'Curtis Ewbank',
        role: 'Boeing engineer',
        position: 'dissenter',
        notes:
          'Raised concerns about MCAS single-sensor design during development; concerns were dismissed.',
      },
      {
        name: 'Ali Bahrami',
        role: 'FAA Associate Administrator for Aviation Safety',
        position: 'silent',
        notes:
          'Previously Boeing lobbyist; symbolizes the FAA-industry revolving door flagged by NTSB.',
      },
      {
        name: 'Edward Pierson',
        role: 'Boeing 737 production manager (dissenter & whistleblower)',
        position: 'dissenter',
        notes:
          'Warned senior leadership in 2018 about production-line quality breakdown at Renton facility.',
      },
    ],
    counterfactual: {
      recommendation:
        "Require dual-sensor AoA redundancy for MCAS from inception; disclose MCAS in the Flight Crew Operations Manual and require differences training for 737 NG pilots; escalate Curtis Ewbank's concerns to independent safety review outside the 737 MAX program office; separate the Boeing Designated Engineering Representative (DER) function from program schedule pressure; ground the fleet after Lion Air 610 pending root-cause analysis rather than after Ethiopian 302.",
      rationale:
        'This is the clearest "framing effect kills people" case in the modern dataset. Classifying a flight-critical automated system as a "minor modification" to avoid simulator training is the bias in its most concrete form. The single-sensor design was knowable, documentable, and dissent was actively present — it was overridden by schedule/cost framing.',
      estimatedOutcome:
        '737 MAX program ships 12–18 months later with dual-sensor MCAS and disclosed training. Both crashes avoided. Boeing avoids $20B+ in direct costs and its certification credibility stays intact — avoiding the subsequent 737 MAX 9 door plug, 787 quality, and leadership turnover cascade.',
    },
    dqiEstimate: {
      score: 16,
      grade: 'F',
      topBiases: ['framing_effect', 'planning_fallacy', 'groupthink'],
      rationale:
        'A safety-of-flight decision made under time pressure with unanimous consensus, zero documented dissent among 20 participants, and explicit framing of a flight-control override system as a "minor change" to manufacture a regulatory outcome. Every dimension of the DQI framework is simultaneously failing.',
    },
    postMortemCitations: [
      {
        label:
          'House Committee on Transportation & Infrastructure, "The Design, Development & Certification of the Boeing 737 MAX"',
        year: 2020,
      },
      {
        label: 'DOJ Deferred Prosecution Agreement (U.S. v. The Boeing Company)',
        year: 2021,
      },
      {
        label: 'KNKT (Indonesia NTSC) Aircraft Accident Investigation Report PK-LQP',
        year: 2019,
      },
      {
        label: 'EAIB Interim Investigation Report ET-AVJ',
        year: 2019,
      },
      {
        label: 'Netflix documentary "Downfall: The Case Against Boeing"',
        year: 2022,
      },
    ],
    relatedCases: ['fin-001', 'tech-005'],
    patternFamily: 'Schedule-Driven Safety Framing',
  },
  {
    id: 'cs-fail-ind-003',
    title: 'Toys R Us Leveraged Buyout Failure',
    company: 'Toys R Us',
    industry: 'retail',
    year: 2005,
    yearRealized: 2018,
    summary:
      'Bain Capital, KKR, and Vornado acquired Toys R Us in a $6.6 billion leveraged buyout in 2005, loading the company with $5.3 billion in debt. The massive debt service ($400M+/year in interest alone) starved the company of capital needed to invest in e-commerce and store improvements during the critical period when Amazon was transforming retail. Toys R Us filed for bankruptcy in September 2017 and liquidated in 2018.',
    decisionContext:
      'Whether a leveraged buyout loading $5.3B in debt onto a retailer facing secular headwinds from e-commerce and big-box competitors was a viable financial structure.',
    outcome: 'catastrophic_failure',
    impactScore: 83,
    estimatedImpact: '$6.6B investment lost; 33,000 jobs eliminated',
    impactDirection: 'negative',
    biasesPresent: [
      'sunk_cost_fallacy',
      'anchoring_bias',
      'overconfidence_bias',
      'status_quo_bias',
      'planning_fallacy',
    ],
    primaryBias: 'sunk_cost_fallacy',
    toxicCombinations: ['Sunk Ship', 'Status Quo Lock'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 10,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Loading a retailer with debt during a period of structural industry transformation eliminates the financial flexibility needed to adapt.',
      'Anchoring to historical cash flow projections when the retail landscape was being fundamentally disrupted by e-commerce was a classic anchoring failure.',
      'The sunk cost of the LBO premium made it increasingly difficult to accept write-downs or pursue the operational investments needed for transformation.',
    ],
    source:
      'Toys R Us Inc. Chapter 11 filing, E.D. Va. Case No. 17-34665; KKR, Bain Capital, Vornado Realty Trust SEC filings (2005); CNBC investigation "The Death of an American Icon" (2018)',
    sourceType: 'sec_filing',
  },
  {
    id: 'cs-fail-ind-005',
    title: 'Sears Refuses E-Commerce Transformation',
    company: 'Sears',
    industry: 'retail',
    year: 2005,
    yearRealized: 2018,
    summary:
      "Sears, once America's largest retailer with $50 billion in annual revenue and the original mail-order catalog business, failed to transition to e-commerce despite having the perfect historical precedent. CEO Eddie Lampert's strategy focused on financial engineering, share buybacks, and real estate monetization rather than digital transformation. From 2005 to 2018, Sears spent $6 billion on buybacks while investing almost nothing in e-commerce or store renovation. The company filed for bankruptcy in October 2018.",
    decisionContext:
      "Whether to invest heavily in e-commerce transformation — leveraging Sears' catalog heritage, distribution network, and customer data — or pursue financial engineering through buybacks and asset stripping.",
    outcome: 'catastrophic_failure',
    impactScore: 86,
    estimatedImpact: '$12B+ in market cap destroyed; 250,000+ jobs lost over 15 years',
    impactDirection: 'negative',
    biasesPresent: [
      'status_quo_bias',
      'anchoring_bias',
      'confirmation_bias',
      'sunk_cost_fallacy',
      'overconfidence_bias',
    ],
    primaryBias: 'status_quo_bias',
    toxicCombinations: ['Status Quo Lock', 'Sunk Ship'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Sears invented the direct-to-consumer catalog model that Amazon digitized — having the DNA for transformation but choosing financial engineering instead is the ultimate status quo bias failure.',
      'Spending $6B on share buybacks while stores deteriorated and e-commerce went unfunded shows how anchoring to short-term stock price metrics can destroy long-term value.',
      'A CEO with a hedge fund background (Lampert) applied financial optimization to a business that needed operational transformation — the framing of the problem determined the wrong solution.',
    ],
    source:
      'Sears Holdings Corp. Chapter 11 filing, S.D.N.Y. Case No. 18-23538; SEC filings (10-K, 2005-2018); Stephanie Clifford, "The Long Decline of Sears," New York Times (2017)',
    sourceType: 'sec_filing',
  },
];
