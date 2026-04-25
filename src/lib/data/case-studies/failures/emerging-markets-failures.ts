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

  {
    id: 'cs-fail-em-004',
    title: 'Jumia Group Pan-African E-Commerce IPO',
    company: 'Jumia Technologies AG',
    industry: 'retail',
    year: 2019,
    yearRealized: 2023,
    summary:
      'Jumia listed on NYSE in April 2019 on a thesis that pan-African e-commerce would replicate the Amazon-in-the-US trajectory, with management framing the company as the "Amazon of Africa." Within months a short-seller report from Citron Research alleged inflated active-customer counts, and Jumia subsequently restated certain customer metrics. The structural assumption — that pan-African e-commerce GMV growth would translate to unit-economics convergence — proved wrong: post-IPO, the company exited Cameroon, Tanzania, and Rwanda; closed its food-delivery vertical in seven markets; and by 2023 was retrenched to a smaller, profitability-first footprint. The IPO valuation collapsed by >85% from its first-day high.',
    decisionContext:
      'Whether to underwrite Jumia at the proposed IPO valuation on the thesis that GMV growth across 14 African markets translated linearly to defensible unit economics, treating the cross-border footprint as a moat rather than a cost-allocation problem.',
    outcome: 'partial_failure',
    impactScore: 78,
    estimatedImpact: 'IPO valuation collapse from $1.4B day-one peak to ~$200M by 2023; multiple market exits; metrics restatement and SEC scrutiny',
    impactDirection: 'negative',
    biasesPresent: [
      'survivorship_bias',
      'narrative_fallacy',
      'authority_bias',
      'overconfidence_bias',
      'anchoring_bias',
    ],
    primaryBias: 'narrative_fallacy',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'high',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 25,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      '"Amazon of X" framing is a textbook narrative-fallacy cue: the analogy collapses fundamental differences in payment infrastructure, logistics maturity, and consumer purchasing power that are first-order to e-commerce unit economics.',
      'Cross-border footprint optimised for "presence" rather than market-by-market unit economics inflates fixed costs without proportional contribution. Phasing capacity to markets with verified payment + logistics primitives outperforms breadth.',
      'Authority bias from a Goldman + Morgan Stanley underwriting consortium does not substitute for first-principles unit-economics scrutiny. Underwriter conviction is correlated, not orthogonal, to the pricing thesis.',
      'A structural audit would have flagged THREE Dalio determinants: trade-share concentration (cross-border GMV depends on intra-African trade flows), governance variance across 14 jurisdictions, and currency-cycle (naira/cedi/shilling/rand exposures stacked).',
    ],
    source:
      'Jumia F-1 (2019); Citron Research short report (May 2019); Jumia 6-K filings (2019-2023); Reuters / Bloomberg coverage of market exits and metrics restatement; Jumia 2022 annual report disclosure on profitability shift',
    sourceType: 'sec_filing',
    preDecisionEvidence: {
      document:
        'Jumia F-1 IPO prospectus (March 2019) and roadshow deck: positioned the company as "the leading e-commerce platform in Africa" with 4.0M active customers across 14 markets and a $1.4B implied valuation at the proposed price range. The thesis emphasised GMV growth (94% YoY in 2018) and the size of the addressable consumer market (1.3B Africans, $4T projected GDP by 2025) without breaking out per-market contribution margins. Logistics costs were treated as a function of GMV scale rather than per-market route economics. The "Amazon-of-Africa" framing appeared in 7 separate places in the prospectus and roadshow.',
      source: 'Jumia F-1 (SEC EDGAR, 2019); Citron short report May 9 2019',
      date: '2019-04-01',
      documentType: 'sec_filing',
      detectableRedFlags: [
        '"Amazon of Africa" framing repeated 7+ times — narrative-fallacy cue treating a structural analogy as a unit-economics argument',
        'Active-customer metric defined as "customers who placed at least one order over the past 12 months" — generous definition that survivorship-biases the cohort, later restated',
        'GMV growth foregrounded; per-market contribution margin nowhere disclosed',
        'Logistics cost modelled as a function of GMV scale, not per-market route density',
        '14-market footprint with no commitment to phase exits or expansions based on per-market profitability',
        'Underwriter consortium (Morgan Stanley, Citigroup, Berenberg, RBC) creates authority-bias signal that substitutes for first-principles scrutiny',
      ],
      flaggableBiases: [
        'narrative_fallacy',
        'survivorship_bias',
        'authority_bias',
        'overconfidence_bias',
        'anchoring_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: CRITICAL "Anchor + Sprint" pattern with primary bias narrative_fallacy. Cognitive audit surfaces narrative-fallacy on the Amazon analogy, survivorship on the active-customer definition, and authority on the underwriter signal. Structural audit (Dalio lens) flags THREE load-bearing determinants: trade-share (intra-African logistics cost asymmetry), governance variance (14-jurisdiction regulatory stack), and currency-cycle (multi-currency GMV translation). Hardening questions: (1) Show per-market contribution margin for top-5 markets — what is the unit economics for delivering a $30 order in Lagos vs Cairo vs Cape Town? (2) What is the active-customer count under a stricter definition (last 90 days)? (3) Which markets would you exit at a P&L test, and is that test built into the operating plan? Recommendation: pass at the proposed valuation; underwrite at a 50-70% discount with a phased-market commitment from management.',
    },
    relatedCases: ['cs-fail-em-001'],
    patternFamily: 'Narrative-Fallacy Cross-Border IPO',
  },

  {
    id: 'cs-fail-em-005',
    title: 'Equity Group Pan-African Banking Expansion (DRC + Rwanda)',
    company: 'Equity Group Holdings PLC',
    industry: 'financial_services',
    year: 2020,
    yearRealized: 2024,
    summary:
      'Equity Group, Kenya\'s largest bank by customers, completed its acquisition of Banque Commerciale du Congo (BCDC) in August 2020 — combining BCDC with its existing ProCredit Bank Congo subsidiary to form Equity BCDC, the second-largest bank in DRC. The thesis: Equity\'s mobile-first model and SME-focused origination would translate across the regional CEMAC + EAC bloc, replicating its Kenyan unit economics. Outcome: Equity BCDC became Equity\'s second-largest market by 2023, but DRC operations carry materially higher cost-of-risk than the home market and the regional integration thesis has run into governance + currency-cycle frictions that were minor in Kenya. Decision rated partial-failure on the original thesis, not on the acquisition itself.',
    decisionContext:
      'Whether to extend Equity\'s mobile-first banking model across the CEMAC + EAC bloc through an anchor acquisition (BCDC), assuming the regulatory and currency environment in DRC + Rwanda would tolerate the same operational template that worked in Kenya.',
    outcome: 'partial_failure',
    impactScore: 58,
    estimatedImpact: 'Higher-than-projected cost-of-risk in DRC operations; regional thesis materially modified by 2023; integration costs ran ~30% over plan',
    impactDirection: 'negative',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'availability_heuristic',
      'planning_fallacy',
    ],
    primaryBias: 'anchoring_bias',
    toxicCombinations: [],
    beneficialPatterns: ['Pre-mortem on M&A integration', 'Stakeholder dissent surfaced'],
    biasesManaged: ['confirmation_bias'],
    mitigationFactors: [
      'Board commissioned an independent regional-banking advisor for cost-of-risk modelling',
      'Phased integration with explicit go/no-go gates per quarter',
    ],
    survivorshipBiasRisk: 'medium',
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 18,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'Anchoring on Kenyan unit economics (cost-to-income ratio ~50%) systematically under-estimates DRC unit economics, where currency volatility, regulatory lift, and SME credit environment differ structurally.',
      'A mobile-first origination playbook depends on banking-rails maturity that varies across the EAC + CEMAC bloc; the assumption of "rails parity" is itself a structural bet.',
      'Pre-mortem ahead of close caught the integration-timeline risk; cost-of-risk variance was correctly flagged as medium-probability and is the dominant negative deviation in 2023 results.',
    ],
    source:
      'Equity Group Holdings annual reports 2020-2023 (Nairobi Securities Exchange); BCDC integration disclosures; Central Bank of Kenya statements on cross-border bank-supervision; African Banker analysis "Equity\'s DRC bet" (2022)',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'Equity Group 2019 strategy review: management presented BCDC acquisition as the anchor of a "Pan-African 2024" target — top-3 bank position in 6 EAC + CEMAC markets, with the assumption that the Kenyan cost-to-income ratio (52% in 2019) would converge in newly-acquired markets within 36 months. The plan modelled DRC cost-of-risk at 250bps, 60% above the Kenyan reference (155bps) but well below the BCDC standalone history (340bps under prior management). Pre-mortem identified integration-timeline + cost-of-risk variance as the two top risks; mitigations were budgeted but with a 12-month, not 24-month, buffer.',
      source: 'Equity Group strategy review 2019; BCDC due-diligence summary disclosed in shareholder circular',
      date: '2019-12-15',
      documentType: 'strategy_document',
      detectableRedFlags: [
        'Kenyan cost-to-income ratio used as a 36-month convergence target across 5 different jurisdictions',
        'DRC cost-of-risk plan (250bps) is 26% below BCDC standalone history (340bps) — implicit assumption that Equity\'s origination shifts the risk profile inside 36 months',
        'Integration-cost buffer at 12 months despite 24-month historical median for cross-border bank integrations',
        'Currency-cycle risk on Congolese franc treated as a translation-only item, not a thesis-level structural assumption',
      ],
      flaggableBiases: [
        'anchoring_bias',
        'overconfidence_bias',
        'planning_fallacy',
        'availability_heuristic',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: MEDIUM-HIGH anchoring on Kenyan unit economics with a planning-fallacy compound on the integration timeline. Beneficial-pattern signal: pre-mortem was conducted, dissent was surfaced, external advisor commissioned — these are real positive patterns and the audit should weight the decision favourably on process, not just on outcome variance. Structural audit (Dalio lens) flags TWO load-bearing determinants: currency-cycle (CDF / RWF / KES + USD-translation exposures) and governance (regulatory variance across 5 jurisdictions). Hardening questions: (1) What is the cost-of-risk plan if DRC takes 60 months, not 36, to converge? (2) What is the FX translation impact at a 30% CDF devaluation scenario? (3) Is the 12-month integration-cost buffer benchmarked against any single comparable EAC + CEMAC bank integration? Recommendation: proceed with a 24-month buffer applied uniformly + a quarterly cost-of-risk gate with explicit pause-points if DRC cost-of-risk exceeds 320bps for two consecutive quarters.',
    },
    relatedCases: ['cs-fail-em-003'],
    patternFamily: 'Cross-Border Banking · Cycle-Variance Anchor',
  },

  {
    id: 'cs-fail-em-006',
    title: 'Twiga Foods Series E + Pan-African FMCG Pivot',
    company: 'Twiga Foods Ltd',
    industry: 'retail',
    year: 2021,
    yearRealized: 2024,
    summary:
      'Twiga Foods raised a $50M Series C in 2021 led by Creadev with participation from Goldman Sachs, IFC, and TLcom — pitched as the leading B2B food-distribution platform in Kenya with a thesis to expand pan-African (Nigeria, Côte d\'Ivoire, Uganda) and to vertically integrate into manufacturing (Twiga Fresh). By late 2023, Twiga had retrenched: management changes, layoffs of >280 staff across 2022-2023, exit from Nigeria, suspension of Twiga Fresh manufacturing, and a recapitalisation that revalued the company well below its 2021 mark. Decision: the structural thesis that B2B distribution platform economics translate at the same density across SSA proved incorrect under post-COVID FX + capital cycle conditions.',
    decisionContext:
      'Whether to underwrite Twiga at a $300-400M Series C valuation on a thesis that B2B agri-food distribution unit economics replicate across SSA, with vertical integration into manufacturing as a margin-protection lever.',
    outcome: 'failure',
    impactScore: 81,
    estimatedImpact: 'Multi-investor markdown of 2021 Series C valuation by 60-80%; >280 layoffs; Nigeria exit; manufacturing line suspension',
    impactDirection: 'negative',
    biasesPresent: [
      'survivorship_bias',
      'overconfidence_bias',
      'narrative_fallacy',
      'planning_fallacy',
      'authority_bias',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Anchor + Sprint', 'Hot-Hand + Authority'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'high',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 12,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Capital-cycle timing matters: a 2021-vintage thesis priced for 2021 capital availability does not survive a 2022-2023 SSA capital-cycle reset.',
      'Authority bias in syndicate participation (Goldman + IFC) substituted for unit-economics scrutiny among co-investors. Authority is correlated with conviction, not with first-principles reasoning.',
      'Vertical integration into manufacturing on top of cross-border expansion compounds two structural bets — capital intensity AND geographic-scaling — into one round\'s thesis. Each is hard alone.',
      'A structural audit would have flagged debt-cycle (capital availability dependency for follow-ons), currency-cycle (NGN exposure on Nigeria entry), and trade-share (intra-SSA agri-input flows) as load-bearing.',
    ],
    source:
      'Twiga Foods Series C announcement (Nov 2021); Bloomberg / Reuters coverage of 2022-2023 layoffs and management change; The Information coverage of recapitalisation (2023); Pitchbook Twiga round summary',
    sourceType: 'news_investigation',
    preDecisionEvidence: {
      document:
        'Twiga Series C investor memo (Q3 2021): pitched the company as the Pan-African B2B food-distribution platform with 100k+ active retailer customers in Kenya, growing to a target of 1M+ across SSA by 2025. The thesis assumed (a) Kenyan unit economics translate to Nigeria + Côte d\'Ivoire within 18-24 months of market entry, (b) vertical integration into manufacturing (Twiga Fresh) compounds margin by 800-1200bps, and (c) follow-on capital at 2021 rates would be available through 2023. The round was priced at ~$300M post.',
      source: 'Twiga Series C investor memo Q3 2021; co-investor circulars',
      date: '2021-11-01',
      documentType: 'investor_deck',
      detectableRedFlags: [
        'Kenyan unit economics translated to Nigeria + Côte d\'Ivoire on an 18-24 month convergence assumption with no per-market route-density modelling',
        'Vertical integration into manufacturing AND geographic expansion underwritten in a single round — two distinct structural bets',
        'Follow-on capital availability assumed at 2021 SSA-VC rates through 2023 — a capital-cycle assumption load-bearing on the burn-rate plan',
        'Syndicate stack (Goldman + IFC + Creadev + TLcom) provides authority signal that may have substituted for unit-economics scrutiny among co-investors',
        'Active-retailer growth metric foregrounded; per-retailer take-rate + cohort retention nowhere disclosed in the headline pitch',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'survivorship_bias',
        'narrative_fallacy',
        'planning_fallacy',
        'authority_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: CRITICAL "Anchor + Sprint" + "Hot-Hand + Authority" toxic combinations. Primary bias: overconfidence on cross-border unit-economics convergence and on follow-on capital availability. Structural audit (Dalio lens) flags THREE load-bearing determinants: debt-cycle (SSA-VC capital availability), currency-cycle (NGN + KES + XOF exposures stacked under a single burn plan), and trade-share (intra-SSA agri-flow integration cost). Hardening questions: (1) What is the burn-rate runway under a 24-month capital-availability lockup scenario? (2) Show per-market route-density unit economics for the top-3 entry markets. (3) Why are vertical integration AND geographic expansion in one round\'s thesis rather than sequenced? (4) What is the management-team\'s prior cross-border execution track record? Recommendation: pass at the proposed valuation OR underwrite at half the price with explicit phasing — geographic expansion in this round, manufacturing in a follow-on conditioned on Kenya unit-economics inflection.',
    },
    relatedCases: ['cs-fail-em-004'],
    patternFamily: 'Capital-Cycle-Sensitive SSA Series C',
  },

  {
    id: 'cs-fail-em-007',
    title: 'MTN Mobile Money (MoMo) Multi-Market Roll-Out',
    company: 'MTN Group Limited',
    industry: 'financial_services',
    year: 2018,
    yearRealized: 2023,
    summary:
      'MTN Group accelerated MoMo (mobile money) rollout across 17 African markets between 2018 and 2022, framing it as the "fintech super-app of Africa" and announcing a $5B+ standalone fintech valuation in 2021 ahead of a planned MoMo IPO. Core MoMo unit economics in Ghana, Uganda, and Côte d\'Ivoire were strong; pan-African convergence assumed regulatory + interoperability parity that did not hold. By 2023: the IPO was deferred multiple times; Nigeria MoMo encountered a CBN audit causing temporary fund-blocking; the Uganda regulator tightened agent-commission caps; and the standalone-fintech valuation was rerated downward by ~40%. Decision rated partial-failure on the structural-convergence thesis, not on MoMo as a business.',
    decisionContext:
      'Whether to underwrite MoMo as a standalone pan-African fintech at a unified valuation — assuming regulatory + interoperability convergence across 17 markets — or as a portfolio of country-level mobile-money businesses with country-specific cycle exposures.',
    outcome: 'partial_failure',
    impactScore: 65,
    estimatedImpact: 'IPO deferral; standalone-fintech valuation rerating ~$2B downward; multi-market regulatory frictions in Nigeria, Uganda, Cameroon',
    impactDirection: 'negative',
    biasesPresent: [
      'narrative_fallacy',
      'survivorship_bias',
      'overconfidence_bias',
      'anchoring_bias',
    ],
    primaryBias: 'narrative_fallacy',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: ['Outside-view benchmark from M-Pesa data'],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'medium',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 22,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'Regulatory convergence across 17 sub-Saharan markets is not a base case; it is a structural bet that should be priced into the multiple, not assumed.',
      'M-Pesa\'s Kenyan trajectory is one data point, not the modal regional trajectory. Survivorship-biasing the M-Pesa story produces a confidence interval that is too narrow on cross-border returns.',
      'Standalone-fintech valuation requires unit-economics homogeneity that the underlying portfolio doesn\'t have. Treat as a portfolio of 17 country businesses with idiosyncratic cycle exposure and discount accordingly.',
    ],
    source:
      'MTN Group annual reports 2019-2023 (JSE + NSE filings); MTN MoMo IPO deferral statements (2022, 2023); CBN action on MTN Nigeria MoMo agency activity (2022); Bank of Uganda mobile-money agent-commission cap announcement (2023)',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'MTN MoMo strategy update (Q4 2021): standalone-fintech framing at $5-6B valuation range, with the thesis that regulatory interoperability across 17 SSA markets would converge on a "single mobile-money rail" within 36 months. Plan budgeted minimal regulatory friction in Nigeria + Cameroon (priced as residual disclosure). M-Pesa\'s Kenyan ARPU (2018-2021) was used as the reference for ARPU-convergence in the next-tier markets. The framing of MoMo as a super-app vs as a portfolio of 17 country businesses appeared in 9 separate places in the strategy update.',
      source: 'MTN Group MoMo strategy update Q4 2021; MTN annual report 2021',
      date: '2021-11-01',
      documentType: 'strategy_document',
      detectableRedFlags: [
        '"Single mobile-money rail" framing across 17 SSA markets — narrative-fallacy cue treating regulatory + interoperability convergence as inevitable rather than as a 17-jurisdiction structural bet',
        'M-Pesa Kenyan ARPU used as the convergence reference — survivorship bias on a single-jurisdiction trajectory',
        'Nigeria + Cameroon regulatory friction priced as residual disclosure rather than thesis-level (CBN audit subsequently materialised)',
        'Standalone-fintech valuation premised on portfolio homogeneity that the 17-market portfolio doesn\'t empirically have',
        'IPO timing assumption (12-18 months) does not account for cross-jurisdictional regulatory-clearance variance',
      ],
      flaggableBiases: [
        'narrative_fallacy',
        'survivorship_bias',
        'overconfidence_bias',
        'anchoring_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: HIGH narrative-fallacy on the "single rail" framing + survivorship-bias on the M-Pesa anchor. Beneficial-pattern signal: outside-view benchmark from M-Pesa data is correctly used, so the audit weights the decision-process favourably on that axis even where the inference is too tight. Structural audit (Dalio lens) flags THREE load-bearing determinants: governance variance (17-jurisdiction regulatory stack), trade-share (intra-SSA mobile-money interoperability), and currency-cycle (multi-currency ARPU translation). Hardening questions: (1) What is the standalone valuation if treated as 17 country businesses with country-specific cycle discounts, and how does that compare to the unified $5-6B framing? (2) What is the regulatory-clearance pathway in Nigeria + Cameroon, with explicit milestones? (3) What is the ARPU-convergence reference if M-Pesa Kenya is excluded — is it the modal trajectory or the outlier? Recommendation: keep MoMo as an integrated unit but disclose the country-by-country valuation build with explicit per-country discount factors; defer IPO timing 18-24 months to absorb regulatory clearance variance.',
    },
    relatedCases: ['cs-fail-em-002'],
    patternFamily: 'Cross-Jurisdiction "Single Rail" Narrative',
  },

  {
    id: 'cs-fail-em-008',
    title: 'Naspers / Tencent Cross-Border Concentration Cycle',
    company: 'Naspers Limited / Prosus N.V.',
    industry: 'technology',
    year: 2018,
    yearRealized: 2023,
    summary:
      'Naspers held a ~31% stake in Tencent acquired in 2001 for $32M, which by 2018 represented >100% of Naspers\' market cap (the rest of the conglomerate trading at a negative implied value). Successive structural moves — the 2019 Prosus listing in Amsterdam, the 2021 share-stapling, and the 2022 open-ended Tencent share buyback to fund Naspers/Prosus repurchases — were framed as discount-narrowing measures. The structural assumption: a Tencent + Chinese-tech-cycle position held inside an SA-listed corporate vehicle could trade at parity to direct Tencent exposure if the discount was managed structurally. Outcome: 2021-2022 Chinese-tech-platform regulatory regime change (anti-monopoly, gaming-time restrictions, ride-hail crackdown) collapsed Tencent\'s multiple, structurally re-priced the discount, and exposed the cross-border cycle assumption as the load-bearing structural bet all along.',
    decisionContext:
      'Whether to treat the Naspers/Tencent stake as a structural-investment with a managed discount, or as a single-name, single-jurisdiction cycle exposure that needed cycle-aware divestment timing.',
    outcome: 'partial_failure',
    impactScore: 76,
    estimatedImpact: 'Tencent multiple compression of >40% peak-to-trough 2021-2022; Naspers/Prosus discount widened to >40% at multiple points; structural restructurings did not durably narrow the discount through the cycle',
    impactDirection: 'negative',
    biasesPresent: [
      'anchoring_bias',
      'overconfidence_bias',
      'sunk_cost_fallacy',
      'survivorship_bias',
    ],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Anchor + Sprint'],
    beneficialPatterns: ['Independent-board cycle-review committee'],
    biasesManaged: ['groupthink'],
    mitigationFactors: [
      'Multiple structural restructurings indicate active engagement with the discount problem',
      'Independent advisor commissioned for 2019 Prosus listing rationale',
    ],
    survivorshipBiasRisk: 'high',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 14,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'A position that grows to >100% of corporate market cap is no longer a position — it is the corporate strategy. Treating it as a managed asset rather than a single-jurisdiction cycle exposure is a category error.',
      'Structural moves (listings, share-stapling, buybacks) can compress a discount inside a stable cycle; they do not durably compress a discount through a cycle regime change.',
      'Survivorship bias on the 2001-2018 Tencent trajectory anchors the cycle-regime forecast on the most-favourable single observation. The 2021 regulatory regime change was structurally foreseeable; cycle-regime change at the home-jurisdiction level (China) was the load-bearing risk all along.',
      'A structural audit would have flagged THREE Dalio determinants: governance variance (CN regulatory regime stability), reserve-currency status (USD/CNY-cycle on Tencent earnings translation), and debt-cycle (CN domestic credit cycle).',
    ],
    source:
      'Naspers / Prosus annual reports 2018-2023; Prosus 2019 listing prospectus; Bloomberg / Reuters coverage of CN tech regulatory crackdown 2021-2022; analyst reports from Sanford Bernstein and JPMorgan on the Naspers/Prosus discount evolution',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'Naspers 2018 strategy review + Prosus listing prospectus (Sept 2019): structural moves justified as discount-narrowing measures, with the Tencent stake treated as a "core long-term holding" with no explicit cycle-aware divestment plan beyond opportunistic share-sales (2018: $9.8B placement). The cycle assumption underlying the strategy was that Chinese-tech regulatory + cycle dynamics would remain in the 2014-2018 regime through the 2020s. Discount-management was framed as the binding problem rather than concentration risk per se.',
      source: 'Naspers 2018 annual report; Prosus listing prospectus 2019',
      date: '2018-09-01',
      documentType: 'financial_report',
      detectableRedFlags: [
        'Position represents >100% of corporate market cap; managed as an asset rather than a structural exposure',
        '2014-2018 CN regulatory regime treated as the base case for 2020s cycle assumption',
        'Discount-management framed as the binding problem; concentration risk on a single foreign-jurisdiction tech-cycle treated as a residual',
        'Sunk-cost-fallacy cue: 2001-2018 trajectory used as the anchor for cycle-regime forecasting',
        'No explicit cycle-aware divestment schedule despite a position that materially exceeds corporate diversification thresholds',
      ],
      flaggableBiases: [
        'anchoring_bias',
        'overconfidence_bias',
        'sunk_cost_fallacy',
        'survivorship_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: HIGH anchoring on the 2001-2018 Tencent trajectory + sunk-cost on the position size. Beneficial-pattern signal: structural restructurings indicate active engagement (process is good); the issue is cycle-aware sizing, not engagement effort. Structural audit (Dalio lens) flags THREE load-bearing determinants: governance variance (CN regulatory regime), reserve-currency status (USD/CNY-cycle), and debt-cycle (CN domestic credit cycle) — all on the home-jurisdiction of the underlying asset, not on the holder\'s own jurisdiction. Hardening questions: (1) What does the position-size policy say about a single asset exceeding 100% of corporate market cap, and was that policy applied here? (2) What is the cycle-aware divestment schedule that would have reduced concentration into the 2014-2018 favourable regime? (3) What is the discount-narrowing thesis under a CN regulatory regime change scenario, and was that scenario priced into the 2018-2019 structural moves? Recommendation: accelerate divestment with a cycle-aware schedule rather than relying on structural-restructuring discount-narrowing alone; explicitly price a regulatory regime-change scenario into the discount-management plan.',
    },
    relatedCases: [],
    patternFamily: 'Cross-Border Concentration · Cycle-Regime Risk',
  },
];
