import { CaseStudy } from '../types';

// Deduped 2026-04-16: cs-fail-tech-001 Yahoo (legacy tech-004 kept),
// cs-fail-tech-004 Quibi (legacy tech-007 kept), cs-fail-tech-005 WeWork
// (legacy tech-006 Tier 2 kept).

export const TECHNOLOGY_FAILURE_CASES: CaseStudy[] = [
  {
    id: 'cs-fail-tech-002',
    title: 'HP Autonomy $11.1B Acquisition Write-Down',
    company: 'Hewlett-Packard',
    industry: 'technology',
    year: 2011,
    yearRealized: 2012,
    summary:
      "HP acquired British software company Autonomy for $11.1 billion in August 2011, paying a 64% premium. Within 13 months, HP wrote down $8.8 billion — 79% of the purchase price — alleging that Autonomy had inflated revenues through accounting improprieties. Due diligence had flagged concerns about Autonomy's hardware sales being classified as software revenue, but HP leadership dismissed these warnings.",
    decisionContext:
      'Whether to proceed with the Autonomy acquisition at 12.6x revenue despite due diligence red flags about revenue recognition practices and accounting irregularities.',
    outcome: 'catastrophic_failure',
    impactScore: 88,
    estimatedImpact: '$8.8B write-down',
    impactDirection: 'negative',
    biasesPresent: [
      'confirmation_bias',
      'anchoring_bias',
      'authority_bias',
      'overconfidence_bias',
      'sunk_cost_fallacy',
    ],
    primaryBias: 'confirmation_bias',
    toxicCombinations: ['Echo Chamber', 'Sunk Ship'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 12,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'When due diligence flags accounting irregularities, dismissing those warnings because of strategic conviction is a textbook confirmation bias failure.',
      'Paying extreme revenue multiples requires extreme certainty about the quality of those revenues — not the opposite.',
      'The sunk cost of months of deal negotiation can create momentum that overrides rational assessment of new negative information.',
    ],
    source:
      'HP SEC filing (8-K, November 20, 2012); Autonomy acquisition proxy statement (2011); U.S. v. Sushovan Hussain, N.D. Cal. No. 16-cr-00462',
    sourceType: 'sec_filing',
    preDecisionEvidence: {
      document:
        'HP\'s August 18, 2011 press release: "HP today announced it has entered into a definitive agreement to purchase Autonomy Corporation plc for approximately $11.1 billion... Autonomy is a leader in the fast-growing area of information management and next-generation enterprise search... HP expects the acquisition to be accretive to HP\'s non-GAAP earnings per share." CEO Léo Apotheker stated: "Autonomy will be a different kind of platform company." Internal due diligence teams had flagged that a significant portion of Autonomy\'s "software" revenue was actually derived from low-margin hardware sales resold as bundled software — a concern that was escalated to leadership but overridden.',
      source:
        'HP press release (Aug 18, 2011); Deloitte due diligence report findings (cited in SEC complaint); HP Board meeting minutes (summarized in proxy filings)',
      date: '2011-08-18',
      documentType: 'press_release',
      detectableRedFlags: [
        'Paying 12.6x revenue for a software company — extreme multiple requires extreme certainty about revenue quality',
        'Internal due diligence flagged hardware revenue classified as software — a fundamental accounting concern dismissed by leadership',
        'CEO framing Autonomy as "a different kind of platform company" without quantitative justification — vague strategic narrative overriding financial analysis',
        "Deal negotiated rapidly under time pressure after Dell's interest in Autonomy was rumored — competitive urgency distorting valuation discipline",
      ],
      flaggableBiases: [
        'confirmation_bias',
        'anchoring_bias',
        'authority_bias',
        'sunk_cost_fallacy',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: CRITICAL confirmation bias — leadership dismissing internal DD red flags that contradict the strategic thesis. The revenue classification concern is not a minor discrepancy but a fundamental question about whether the business being acquired is actually a software business. Authority bias: CEO Apotheker\'s conviction overriding expert due diligence findings. Sunk cost: months of deal preparation creating momentum toward closing despite emerging negative signals. Toxic combination "Echo Chamber + Sunk Ship" detected. Recommendation: HALT the deal until an independent third-party auditor re-evaluates Autonomy\'s revenue breakdown. The due diligence red flags warrant a minimum 60-day pause for forensic accounting review.',
    },
  },
  {
    id: 'cs-fail-tech-003',
    title: 'Xerox PARC Fails to Commercialize the GUI',
    company: 'Xerox',
    industry: 'technology',
    year: 1979,
    yearRealized: 1984,
    summary:
      "Xerox PARC invented the graphical user interface, the mouse, Ethernet, and laser printing in the 1970s. Despite having working prototypes, Xerox leadership failed to commercialize these inventions, viewing them as irrelevant to the copier business. Steve Jobs visited PARC in 1979 and recognized the GUI's potential; Apple launched the Macintosh in 1984. Xerox's failure to capitalize on its own R&D is widely considered the greatest missed commercialization opportunity in technology history.",
    decisionContext:
      'Whether to invest in commercializing the Alto computer and graphical user interface technology developed at PARC, or continue focusing exclusively on the copier and document business.',
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedImpact: '$100B+ in unrealized value (personal computing market)',
    impactDirection: 'negative',
    biasesPresent: [
      'status_quo_bias',
      'anchoring_bias',
      'loss_aversion',
      'framing_effect',
      'confirmation_bias',
    ],
    primaryBias: 'status_quo_bias',
    toxicCombinations: ['Status Quo Lock', 'Sunk Ship'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Inventing breakthrough technology is necessary but not sufficient — the organizational willingness to disrupt its own business model is the critical success factor.',
      'When leadership anchors to existing revenue streams, it creates a framing effect where revolutionary technology is evaluated only through the lens of the current business.',
      'Separating R&D from commercialization without a bridge mechanism guarantees that innovations will be exploited by competitors.',
    ],
    source:
      'Michael A. Hiltzik, "Dealers of Lightning: Xerox PARC and the Dawn of the Computer Age" (1999); Douglas K. Smith and Robert C. Alexander, "Fumbling the Future" (1988)',
    sourceType: 'academic_paper',
  },
  {
    id: 'cs-fail-tech-006',
    title: 'Meta Platforms Metaverse Pivot and Reality Labs Losses',
    company: 'Meta Platforms',
    industry: 'technology',
    year: 2021,
    yearRealized: 2024,
    summary:
      'In October 2021, Facebook renamed itself Meta Platforms and committed to building the "metaverse" as its next computing platform. From 2019 through 2024, the Reality Labs division accumulated more than $60B in cumulative operating losses while consumer VR adoption failed to cross mainstream thresholds. The ticker symbol was changed from FB to META, the corporate identity was overhauled, and annual Reality Labs opex exceeded $15B in 2022 and 2023 — a single division burning more than the entire annual revenue of most S&P 500 companies.',
    decisionContext:
      'Whether to commit tens of billions of dollars per year to build an entirely new computing platform (VR/AR + social "metaverse") before consumer demand, developer ecosystem, or hardware maturity had validated the category — while the core Family of Apps business faced its first-ever user-growth decline and ATT/Apple privacy headwinds.',
    outcome: 'partial_failure',
    impactScore: 72,
    estimatedImpact:
      '$60B+ Reality Labs cumulative operating losses (2019–2024); ~70% stock decline 2021–2022 before recovery',
    impactDirection: 'negative',
    biasesPresent: [
      'authority_bias',
      'sunk_cost_fallacy',
      'overconfidence_bias',
      'bandwagon_effect',
      'availability_heuristic',
      'planning_fallacy',
      'framing_effect',
    ],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Golden Child', 'Blind Sprint', 'Sunk Ship'],
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
      'Super-voting-share founder control (Zuckerberg: ~58% of voting power) removes the institutional circuit-breaker that dissent-welcoming boards provide on multi-year, multi-billion-dollar bets.',
      'The "metaverse" rebrand framed an unvalidated research bet as a strategic inevitability — classic framing effect converting "we are investing" into "we are *already* the category leader."',
      'Bandwagon effect flowed downhill in 2021: every major tech company announcing metaverse initiatives reinforced internal Meta conviction that the category was real rather than speculative.',
      'The Apple ATT headwind of 2021 compressed core-ads margins at the exact moment Reality Labs spending accelerated — creating a "sunk ship" dynamic where leadership could not cut without admitting the pivot was premature.',
    ],
    preDecisionEvidence: {
      document:
        "Mark Zuckerberg's October 28 2021 Connect keynote announced the Meta rebrand and committed to the metaverse as the company's defining bet. Reality Labs was reorganized as a separately-reported segment with operating losses of $10.2B for 2021 (disclosed Feb 2022) and projected higher spending in 2022. No public metrics, milestones, or disconfirmation criteria were defined. Consumer VR penetration in 2021 stood at approximately 3% of US households — the category had not crossed early-majority thresholds since Oculus launched in 2016.",
      source:
        "Meta Platforms 'Founder's Letter' and Connect 2021 Keynote; Meta Q4 2021 shareholder letter (first Reality Labs segment disclosure)",
      date: '2021-10-28',
      documentType: 'public_statement',
      detectableRedFlags: [
        'Public commitment to category leadership absent validated consumer demand signal (VR penetration <5%)',
        'No published milestone framework or disconfirmation criteria for continuing Reality Labs investment',
        'Super-voting-share structure (Zuckerberg ~58%) insulates strategy from institutional shareholder feedback',
        'Corporate rebrand (FB→META) is asymmetric: easy to announce, reputationally costly to reverse',
        'Timing collides with Apple ATT tracking changes cutting core-ad-targeting precision — Reality Labs bet accelerates into core-business headwind',
        'Internal product launches (Horizon Worlds) fell short of user targets but spending was not proportionally recalibrated',
      ],
      flaggableBiases: [
        'authority_bias',
        'sunk_cost_fallacy',
        'overconfidence_bias',
        'bandwagon_effect',
        'framing_effect',
      ],
      hypotheticalAnalysis:
        "DI would flag the Meta metaverse commitment as a multi-bias compound: (1) Authority bias — Zuckerberg's voting-share dominance means the strategic question is really 'does Zuckerberg believe this' rather than 'has the company independently validated this?' (2) Framing effect — the corporate rebrand converts a speculative R&D bet into stated identity, raising the reversal cost. (3) Bandwagon effect — 2021's industry-wide metaverse announcements (Microsoft, Epic, Nvidia) created false consensus about category inevitability. (4) Absence of disconfirmation criteria — no published trigger for slowing or halting Reality Labs spend means the sunk-cost fallacy has free rein as losses accumulate. The platform would have recommended defining explicit consumer-adoption milestones (e.g., 20M monthly active users on a named flagship app by end of 2023) as a continue/pause gate before committing to the rebrand.",
    },
    keyQuotes: [
      {
        text: "I'm proud to announce that starting today, our company is now Meta. Our mission remains the same — still about bringing people together. Our apps and their brands aren't changing either. But it's time to adopt a new company brand to encompass everything that we do.",
        source: 'Mark Zuckerberg, Meta Connect 2021 Keynote',
        date: '2021-10-28',
        speaker: 'Mark Zuckerberg, CEO',
      },
      {
        text: 'I want to be clear — this is a very long-term bet. We do not expect to generate meaningful revenue from Reality Labs for several years.',
        source: 'Mark Zuckerberg, Q4 2021 earnings call',
        date: '2022-02-02',
        speaker: 'Mark Zuckerberg, CEO',
      },
      {
        text: "Meta has been the subject of investor concerns over the outsize spending, especially in Reality Labs, where we've been investing in the long-term vision for the metaverse.",
        source: 'Meta Q3 2022 shareholder letter',
        date: '2022-10-26',
        speaker: 'Meta Q3 2022 shareholder letter',
      },
    ],
    timeline: [
      {
        date: '2014-03',
        event: 'Facebook acquires Oculus VR for ~$2B — the foundational metaverse bet.',
        source: 'Facebook 10-K FY2014',
      },
      {
        date: '2020-Q4',
        event:
          'Reality Labs disclosed as separate segment for the first time — 2020 operating loss of $6.6B.',
        source: 'Meta 10-K FY2021 (retrospective)',
      },
      {
        date: '2021-10-28',
        event:
          'Facebook rebrands to Meta Platforms; Zuckerberg commits to metaverse as strategic identity.',
        source: 'Meta Connect 2021 Keynote',
      },
      {
        date: '2022-02-02',
        event:
          'Meta reports Q4 2021 — Reality Labs FY2021 operating loss of $10.2B; stock falls 26% next day on combined DAU decline + investment guidance.',
        source: 'Meta Q4 2021 earnings release',
      },
      {
        date: '2022-10-26',
        event:
          'Horizon Worlds monthly active users reported at <200K vs 500K internal target; investor backlash accelerates.',
        source: 'WSJ, "Company Documents Show Meta\'s Flagship Metaverse Falling Short"',
      },
      {
        date: '2022-11-09',
        event:
          'Meta announces 11,000 layoffs (~13% of workforce) — "Year of Efficiency" era begins.',
        source: 'Mark Zuckerberg public letter to employees',
      },
      {
        date: '2023-02-01',
        event:
          'Q4 2022 reports Reality Labs loss of $13.7B for the year — continues to forecast growing losses in 2023.',
        source: 'Meta Q4 2022 shareholder letter',
      },
      {
        date: '2024-02-01',
        event:
          'Q4 2023 reports Reality Labs loss of $16.1B for FY2023; cumulative RL losses since 2019 exceed $50B.',
        source: 'Meta Q4 2023 shareholder letter',
      },
    ],
    stakeholders: [
      {
        name: 'Mark Zuckerberg',
        role: 'Founder & CEO',
        position: 'advocate',
        notes:
          'Sole architect of the metaverse commitment; ~58% voting power via super-voting shares insulates the decision from institutional shareholder pushback.',
      },
      {
        name: 'Andrew Bosworth',
        role: 'CTO / Head of Reality Labs',
        position: 'advocate',
        notes: 'Internal champion of the metaverse strategic bet.',
      },
      {
        name: 'Sheryl Sandberg',
        role: 'COO (to 2022)',
        position: 'silent',
        notes: 'Departed role June 2022 as the Reality Labs spending ramped.',
      },
      {
        name: 'David Wehner',
        role: 'CFO (to 2022)',
        position: 'silent',
        notes:
          'Oversaw Reality Labs segment disclosure; transitioned to Chief Strategy Officer role in 2022.',
      },
      {
        name: 'Brad Gerstner (Altimeter Capital)',
        role: 'External shareholder activist',
        position: 'dissenter',
        notes:
          'October 2022 open letter "Time to Get Fit" called for 20% headcount cuts and halving Reality Labs spend.',
      },
      {
        name: 'Institutional shareholders',
        role: 'External stakeholders',
        position: 'overruled',
        notes: 'Cannot exert governance leverage due to super-voting share structure.',
      },
    ],
    counterfactual: {
      recommendation:
        'Maintain Reality Labs as an R&D division without the corporate rebrand. Define explicit user-adoption milestones (e.g., 20M MAU on a flagship consumer app by EOY 2023) as continue/pause gates. Cap Reality Labs annual opex at 10% of Family of Apps operating income rather than the effective 20%+ it reached in 2022–23. Respond to Apple ATT headwind with core-business investment before metaverse speculation.',
      rationale:
        "The underlying VR/AR R&D bet is defensible — Apple's 2024 Vision Pro launch confirms the category has legitimacy. The decision-process failure was three-fold: the corporate rebrand raised reversal cost, the absence of disconfirmation criteria made the bet unboundable, and the super-voting-share structure removed the dissent circuit-breaker. A bias-adjusted process would have protected the research while preventing the loss acceleration.",
      estimatedOutcome:
        'Meta preserves ~$25–35B of the $60B+ Reality Labs cumulative loss while maintaining the underlying VR/AR R&D capability. Stock avoids the 70% 2021–22 drawdown; executive credibility preserved for future transitions (e.g., AI 2023+).',
    },
    dqiEstimate: {
      score: 38,
      grade: 'F',
      topBiases: ['authority_bias', 'sunk_cost_fallacy', 'framing_effect'],
      rationale:
        'F grade reflects process, not strategy. Founder-controlled voting, no published milestones, asymmetric rebrand commitment, and accelerating spend into confirmed headwinds (ATT) are all individual process failures; compounded, they produce the compounded loss trajectory. Note: partial — not catastrophic — because Meta retained the AI pivot optionality and has since executed it well.',
    },
    postMortemCitations: [
      {
        label: 'Altimeter Capital open letter "Time to Get Fit, Meta"',
        year: 2022,
      },
      {
        label: 'WSJ, "Company Documents Show Meta\'s Flagship Metaverse Falling Short"',
        year: 2022,
      },
      {
        label: 'Meta 10-K filings FY2021–FY2023 (Reality Labs segment disclosure)',
      },
      {
        label: 'Alex Heath, The Verge — ongoing Meta coverage',
        year: 2022,
      },
    ],
    relatedCases: ['tech-006', 'tech-005', 'fin-010'],
    patternFamily: 'Founder-Controlled Asymmetric Bet',
    source:
      "Meta Platforms Inc. 10-K filings (FY2021–FY2023); Meta Connect 2021 Keynote; Altimeter Capital 'Time to Get Fit, Meta' letter (Oct 2022); WSJ and Verge investigative coverage",
    sourceType: 'sec_filing',
  },
];
