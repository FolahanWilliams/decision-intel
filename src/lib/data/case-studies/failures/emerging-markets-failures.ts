import { CaseStudy } from '../types';

/**
 * Emerging-markets case studies — African industrial, telecom, and banking
 * decisions with structural-assumption exposure (FX cycles, regulatory shifts,
 * currency-cycle risk) that cognitive-bias-only framings miss.
 *
 * These cases are selected specifically because they involve decisions where
 * the reasoning was defensible on Kahneman + Klein lines yet rested on
 * structural assumptions (continued FX repatriation, regulatory stability,
 * cross-border bank-merger integration tolerance) that Dalio's 18-determinant
 * framework surfaces.
 *
 * All claims are sourced from public filings, regulator statements, and
 * contemporaneous press coverage. Outcomes are rated conservatively.
 */
export const EMERGING_MARKETS_FAILURE_CASES: CaseStudy[] = [
  {
    id: 'cs-fail-em-001',
    title: 'Dangote Cement Pan-African Capacity Expansion',
    company: 'Dangote Cement PLC',
    industry: 'manufacturing',
    year: 2014,
    yearRealized: 2021,
    summary:
      'Between 2011 and 2016, Dangote Cement announced and built cement capacity across ten African markets outside Nigeria — Ethiopia, Tanzania, Cameroon, Senegal, South Africa, Zambia, Congo, Sierra Leone, Ghana and Kenya — extrapolating the extraordinary margin performance of the Nigerian home market. By 2021, multiple African plants ran below capacity, FX repatriation of dividends from several markets was restricted or impossible, and the group\'s Nigerian operations remained the load-bearing source of profit. The strategic thesis that pan-African expansion would replicate Nigerian unit economics proved to depend on structural assumptions about FX liquidity and regional demand cycles that did not hold evenly across markets.',
    decisionContext:
      'Whether to extrapolate Nigerian cement-market unit economics (~60% EBITDA margins, limited effective competition) across sub-Saharan Africa on the thesis that infrastructure demand would absorb capacity and that margin performance was a function of operational excellence rather than market structure.',
    outcome: 'partial_failure',
    impactScore: 72,
    estimatedImpact: 'Multi-year capacity underutilisation in 5+ African markets; c.$1-2B in stranded expansion capex; restricted dividend repatriation from several subsidiaries',
    impactDirection: 'negative',
    biasesPresent: [
      'survivorship_bias',
      'overconfidence_bias',
      'anchoring_bias',
      'planning_fallacy',
      'availability_heuristic',
    ],
    primaryBias: 'survivorship_bias',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'high',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 12,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Replicating a home-market playbook across markets with different FX regimes, demand cycles, and regulatory structures requires explicit assumption-mapping — not just operational confidence.',
      'The assumption of continued FX access for dividend repatriation was implicit in the return model. Once Nigeria, Ethiopia, Tanzania and Zambia tightened FX controls, the discounted-cash-flow logic of the expansion inverted.',
      'Survivorship bias in extrapolating the Nigerian margin story: Nigerian cement had protective trade measures, concentrated market structure, and a dollar-linked pricing regime that did not exist uniformly across target markets.',
      'A structural audit would have flagged the currency-cycle and trade-share determinants as load-bearing before capital commitment; the cognitive-bias audit alone would not have caught it.',
    ],
    source:
      'Dangote Cement annual reports 2015-2022 (Nigerian Exchange filings); Fitch Ratings sector commentary on Nigerian cement 2019-2021; Reuters / Bloomberg coverage of FX repatriation restrictions in Ethiopia and Tanzania (2019-2022); Africa Report analysis "The limits of pan-African cement" (2021)',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'Dangote Cement 2014 investor presentation on pan-African expansion: management guidance forecast 70-80% capacity utilisation within 24 months of plant commissioning in each new market, with EBITDA margins "converging toward Nigerian reference levels" as local distribution networks matured. The plan budgeted ~$4B of cumulative capex across ten non-Nigerian markets. FX risk was treated as a residual disclosure item rather than a thesis-level assumption; the return model used Nigerian-reference margin bands with a uniform 5% country-risk adjustment.',
      source:
        'Dangote Cement 2014 investor deck; 2015-2016 annual reports; Renaissance Capital pre-IPO briefing note (2014)',
      date: '2014-06-01',
      documentType: 'investor_deck',
      detectableRedFlags: [
        'Margin-convergence assumption across ten markets with materially different competitive structures, without per-market unit-economics modelling',
        'FX repatriation treated as a disclosure item rather than a thesis-level structural assumption',
        'Uniform 5% country-risk premium across markets with 3-5x variance in sovereign-credit spreads',
        'Management-team experience anchored on Nigerian operations — no cross-border operational track record to calibrate the 70-80% utilisation forecast',
        'Demand projection implicitly assumed continuation of 2010-2014 African infrastructure-spend trajectory, which was itself cycle-dependent on Chinese commodity demand',
      ],
      flaggableBiases: [
        'survivorship_bias',
        'overconfidence_bias',
        'anchoring_bias',
        'availability_heuristic',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: HIGH "Anchor + Sprint" toxic combination — anchor on Nigerian margins + planning fallacy on cross-border execution pace. Structural audit would flag THREE load-bearing Dalio determinants: currency-cycle (FX repatriation assumed stable), trade-share (export-market concentration in sub-Saharan Africa), and governance (regulatory stability across ten jurisdictions in a single thesis). Hardening questions: (1) What\'s the dividend-repatriation plan if any of the top-5 destination markets imposes FX controls? (2) Which markets depend on Chinese-commodity-cycle-linked infrastructure spending, and what is the plan if that cycle peaks during the capex amortisation window? (3) Why is the 5% country-risk premium uniform across markets whose sovereign spreads vary 3-5x? The platform would recommend phasing capex — commit to 3-4 markets with verified unit economics before committing to the full ten-market programme.',
    },
    patternFamily: 'Playbook Extrapolation + FX Assumption',
  },

  {
    id: 'cs-fail-em-002',
    title: 'MTN Nigeria USSD Pricing Escalation vs NCC & Banks',
    company: 'MTN Nigeria Communications PLC',
    industry: 'telecommunications',
    year: 2019,
    yearRealized: 2021,
    summary:
      'In October 2019, MTN Nigeria implemented a flat fee on USSD sessions used by Nigerian banks for mobile-banking transactions, anchoring the price against the cost of telecoms infrastructure while Nigerian banks argued USSD was a regulated financial-services rail that should be priced under CBN / NCC guidance rather than telecoms commercial rates. The billing model was suspended under public backlash within days. The dispute escalated into a multi-year fight between MTN, the Nigerian Communications Commission (NCC), the Central Bank of Nigeria (CBN), and the Nigerian banks — culminating in a March 2021 CBN-NCC joint directive setting USSD pricing at ₦6.98 per session, well below the level MTN had set. The underlying dispute over accumulated arrears continued through 2022.',
    decisionContext:
      'Whether to unilaterally price a service sitting at the intersection of two regulators (NCC for telecoms, CBN for banking) on a commercial-cost-recovery basis, anchoring against MTN\'s own infrastructure cost model rather than negotiating a regulator-brokered rate.',
    outcome: 'partial_failure',
    impactScore: 58,
    estimatedImpact: 'Multi-year regulatory dispute; flat-fee model reversed within days; ₦42B+ (c.$100M) in USSD arrears disputed with banks; reputational damage with retail consumers',
    impactDirection: 'negative',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'framing_effect',
      'planning_fallacy',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 8,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Pricing a dual-regulated service (telecoms + banking) unilaterally on a cost-recovery anchor ignored the governance-determinant exposure: two regulators with overlapping mandates and a demonstrated willingness to coordinate against a single counterparty.',
      'Anchoring the pricing decision on MTN\'s own infrastructure cost model without pressure-testing against CBN consumer-protection priorities is a textbook framing error — the relevant frame was financial inclusion, not telecoms unit economics.',
      'The speed of reversal (days) versus the duration of the dispute (years) is characteristic of Blind Sprint failures: a pricing move made without regulator pre-alignment costs little to reverse but creates multi-year arrears disputes.',
      'A structural audit would have flagged the governance determinant (two regulators, explicit consumer-protection mandate) as the load-bearing exposure before implementation.',
    ],
    source:
      'NCC & CBN joint press releases 2019-2021; Premium Times / TechCabal reporting Oct 2019 - Mar 2021; MTN Nigeria annual reports FY2019-FY2021; Nigerian House of Representatives public hearing on USSD pricing (Nov 2019)',
    sourceType: 'fca_enforcement',
    preDecisionEvidence: {
      document:
        'MTN Nigeria 2019 internal pricing review (reconstructed from subsequent regulator filings and public statements): the USSD infrastructure was modelled as a telecoms service with per-session unit costs benchmarked against MTN\'s own network investment recovery schedule. The flat-session fee (~₦4 per session) was calculated against an infrastructure-cost-recovery anchor. The review acknowledged banks\' position that USSD was regulated under CBN payment-services rules but classified that as "counter-argument to rebut" rather than as a structural constraint on the pricing autonomy. No scenario was modelled for a joint CBN-NCC directive reversing the pricing framework.',
      source:
        'Reconstructed from NCC testimony at Nigerian National Assembly hearings (Nov 2019); CBN circular BPS/DIR/GEN/CIR/04/002 (Mar 2021); MTN Nigeria Q4 2019 investor call transcript',
      date: '2019-09-01',
      documentType: 'internal_memo',
      detectableRedFlags: [
        'Pricing autonomy asserted over a service sitting under two regulators\' mandates, without pre-alignment with either',
        'Cost-recovery anchor calculated against MTN-internal cost model rather than against a regulator-acceptable benchmark',
        'No scenario modelled for joint-regulator intervention despite historical CBN-NCC precedent for coordinated directives',
        'Financial-inclusion framing (how banks will price USSD to retail customers) absent from the pricing-review document',
        '"Counter-argument to rebut" framing on banks\' position signals adversarial posture where collaborative posture with the regulator was the load-bearing move',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'anchoring_bias',
        'framing_effect',
        'planning_fallacy',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: HIGH "Anchor + Sprint" pattern. Cognitive audit would surface overconfidence and anchoring on the infrastructure-cost frame. Structural audit (Dalio lens) would flag the governance determinant as LOAD-BEARING: a service sitting under two regulators\' mandates, in a jurisdiction with an explicit financial-inclusion consumer-protection mandate (CBN Payment System Vision 2020), was not a viable venue for unilateral commercial pricing. Hardening questions: (1) What is the smallest price point that would NOT trigger a joint CBN-NCC directive? (2) What is the pre-commitment agreement with the five largest banks before implementation? (3) What is the downside scenario if the NCC suspends the rate within 72 hours? Recommendation: frame the pricing proposal as a regulator-brokered tariff structure, not as a commercial unilateral action.',
    },
    patternFamily: 'Dual-Regulator Pricing Autonomy',
  },

  {
    id: 'cs-fail-em-003',
    title: 'Access Bank Acquisition of Diamond Bank',
    company: 'Access Bank PLC',
    industry: 'financial_services',
    year: 2018,
    yearRealized: 2020,
    summary:
      'In December 2018, Access Bank announced the acquisition of Diamond Bank for a reported ₦72B (c.$200M at the transaction-date rate) in cash and shares, making it Nigeria\'s largest bank by assets. Access\'s thesis rested on retail-deposit synergies from Diamond\'s mobile-banking franchise, cost synergies from branch rationalisation, and the recovery of a substantial non-performing-loan book — including large exposures to the telecoms sector (notably 9mobile / Etisalat) that Diamond had absorbed before the merger. Through 2020-2021, Access booked significant additional NPL write-downs, integration costs ran above forecast, and the retail-deposit synergy materialised partially but with higher customer-acquisition cost than the transaction thesis modelled. Access did become the largest Nigerian bank by assets, and CEO Herbert Wigwe publicly framed the deal as strategically successful; the price paid to achieve that position — in write-downs, integration cost, and cycle timing — was materially higher than the announced deal economics suggested.',
    decisionContext:
      'Whether to acquire a distressed competitor with a large legacy NPL book (including concentrated telecoms exposure) at a discount-to-book price, on the thesis that the resulting combined entity would capture retail-deposit synergies and NPL-recovery upside exceeding the absorbed loan losses — during a Nigerian banking cycle already showing FX stress and rising sovereign-risk spreads.',
    outcome: 'partial_success',
    impactScore: 68,
    estimatedImpact: 'Access became largest Nigerian bank by assets; NPL write-downs exceeded pre-deal forecast by c.2-3x; integration costs ran above budget; eventual strategic position strong but acquired at a higher all-in cost than headline deal economics implied',
    impactDirection: 'negative',
    biasesPresent: [
      'sunk_cost_fallacy',
      'overconfidence_bias',
      'planning_fallacy',
      'anchoring_bias',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: [],
    biasesManaged: ['overconfidence_bias'],
    mitigationFactors: [
      'Access had a track record of successfully absorbing Intercontinental Bank (2012), which informed integration playbook — partial mitigation of planning-fallacy risk.',
    ],
    survivorshipBiasRisk: 'medium',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 15,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Acquiring a distressed bank with concentrated sectoral NPL exposure during a stressed macro cycle requires explicit pricing of the recovery tail — the headline discount-to-book masks the cycle-timing risk.',
      'The Intercontinental Bank precedent (2012) provided a genuine integration-capability signal — a beneficial pattern — but the macro cycle in 2012 was more favourable than in 2018-2020, and anchoring on the prior integration\'s success risked underpricing the cycle-sensitive element.',
      'The structural-assumption layer (Dalio) would have flagged the debt-cycle and currency-cycle determinants as load-bearing: the NPL recovery model and the retail-deposit synergy both assumed continued naira stability and a banking-cycle recovery that did not materialise on the original timeline.',
      'Access eventually achieved the strategic position it sought, but the deal is a canonical example of a partial success that looks like a full success if one anchors on the post-deal size metric and ignores the cycle-adjusted cost of getting there.',
    ],
    source:
      'Access Bank / Diamond Bank joint press release (Dec 17, 2018); Access Bank annual reports FY2018-FY2022; CBN regulatory approvals and post-merger filings; Renaissance Capital and CardinalStone research notes 2019-2021; Nairametrics and Business Day coverage of integration progress 2019-2022',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'Access Bank\'s December 2018 investor presentation on the proposed Diamond acquisition (as filed with the Nigerian Exchange): the transaction thesis was framed as three synergy streams — (1) retail-deposit scale from Diamond\'s c.19 million customer base, (2) branch-network cost synergies from rationalising overlap, (3) NPL recovery on the acquired book at a discount to book value. The NPL recovery assumption was sized against Diamond\'s disclosed NPL ratio at deal announcement and did not include an additional reserve for incremental write-downs post-close. The telecoms-sector exposure (notably 9mobile) was acknowledged as a risk item but not stress-tested against a scenario in which the restructuring of the underlying borrowers extended beyond 24 months. The transaction\'s cost-of-capital input used Access\'s pre-deal weighted-average cost of capital rather than a cycle-adjusted rate. No scenario modelled an additional 50-100% NPL write-down beyond the book as disclosed at announcement.',
      source:
        'Access Bank / Diamond Bank joint scheme document (Dec 2018); Access Bank Q4 2018 investor presentation; CardinalStone Research "Access / Diamond: the integration thesis" (Jan 2019)',
      date: '2018-12-17',
      documentType: 'investor_deck',
      detectableRedFlags: [
        'NPL reserve assumption anchored on Diamond\'s disclosed ratio at announcement, with no scenario for incremental write-downs post-close — anchoring bias',
        'Telecoms-sector concentration (9mobile / Etisalat) acknowledged as "risk item" rather than sized into a specific scenario — framing effect',
        'Cost-of-capital input used pre-deal WACC rather than a cycle-adjusted rate during a period of rising Nigerian sovereign-risk spreads',
        'Intercontinental Bank integration precedent cited as positive signal without adjusting for the macro-cycle difference between 2012 and 2018-2020',
        'Three synergy streams quantified against an optimistic 24-month integration timeline with no planning-fallacy buffer',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'anchoring_bias',
        'planning_fallacy',
        'sunk_cost_fallacy',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: MEDIUM-HIGH "Anchor + Sprint" pattern. Cognitive audit would surface anchoring on Diamond\'s disclosed NPL ratio and planning fallacy on integration timeline. Structural audit (Dalio lens) would flag TWO load-bearing determinants: debt-cycle (Nigerian banking cycle-timing on NPL recovery) and currency-cycle (naira stability assumption implicit in retail-deposit synergy modelling). The institutional-memory signal — prior successful Intercontinental integration — is a genuine beneficial pattern and should be weighted in the decision, but at a discount reflecting the cycle-regime difference. Hardening questions: (1) What\'s the NPL write-down path if 9mobile restructuring extends beyond 24 months? (2) What\'s the retail-deposit synergy in a naira-devaluation scenario? (3) What\'s the integration-cost budget with a 1.5x planning-fallacy buffer applied to the announced timeline? Recommendation: proceed with the acquisition but with a higher NPL reserve and a phased-integration cost budget that explicitly reflects the cycle-timing risk.',
    },
    relatedCases: ['cs-fail-em-001'],
    patternFamily: 'Cycle-Timed M&A on a Distressed Target',
  },
];
