import type { FailureCase } from './types';

/**
 * Retail & Government Failure Cases
 *
 * Documented decision failures in retail, government/defense, and
 * additional financial/technology sectors. Each case maps cognitive
 * biases to catastrophic outcomes with sourced evidence.
 */

export const RETAIL_CASES: FailureCase[] = [
  {
    id: 'toys_r_us_2017',
    title: 'Toys "R" Us Bankruptcy',
    company: 'Toys "R" Us',
    industry: 'retail',
    year: 2017,
    yearDiscovered: 2017,
    summary:
      'Burdened by $5B in LBO debt from 2005, leadership repeatedly chose cost-cutting and store maintenance deferral over e-commerce investment, assuming physical retail dominance would persist.',
    decisionContext:
      'Board and PE sponsors (Bain, KKR, Vornado) prioritized debt service over digital transformation. Multiple proposals to invest in online capabilities were rejected 2012-2016 in favor of maintaining dividend distributions.',
    outcome: 'catastrophic_failure',
    impactScore: 82,
    estimatedLoss: '$5B+ in enterprise value; 33,000 jobs lost',
    biasesPresent: [
      'sunk_cost_fallacy',
      'status_quo_bias',
      'anchoring_bias',
      'overconfidence_bias',
      'confirmation_bias',
    ],
    primaryBias: 'sunk_cost_fallacy',
    toxicCombinations: ['Sunk Ship', 'Status Quo Lock'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
    },
    lessonsLearned: [
      'LBO debt structures can create sunk cost traps that prevent necessary pivots',
      'Physical retail assumptions must be continuously challenged against digital trends',
      'PE governance structures may suppress dissent from operational management',
    ],
    preDecisionEvidence: {
      document:
        "Toys R Us 2014 board presentation by CEO Antonio Urcelay framed e-commerce investment as 'premature' given debt covenants. The LBO debt ($5.3B) required $400M/year in interest payments; proposed $1.2B e-commerce transformation was rejected as 'incompatible with current capital structure.' Bain, KKR, and Vornado as PE sponsors pushed for continued dividend recaps through 2014-2016 rather than capex redirection. Management acknowledged Amazon's Prime (2005) and Prime-now (2014) as existential threats in the same presentation that rejected digital transformation investment.",
      source: 'Toys R Us Inc. S-1 filings; Bloomberg News investigation (2017); U.S. Bankruptcy Court E.D. Va. Case 17-34665',
      date: '2014-09',
      documentType: 'board_memo',
      detectableRedFlags: [
        'Digital transformation explicitly acknowledged as strategic necessity AND rejected as capital-incompatible in the same document',
        'LBO debt service ($400M/year) preempting competitive-maintenance capex',
        'Physical-store assumption: "consumers will still shop in stores for toys" — stated without market evidence',
        'PE governance structure insulated strategic decisions from operational management dissent',
        'Dividend recaps continued 2014-2016 — extracting cash while deferring transformation',
      ],
      flaggableBiases: ['sunk_cost_fallacy', 'status_quo_bias', 'loss_aversion', 'anchoring_bias'],
      hypotheticalAnalysis:
        "DI would flag the Toys R Us LBO-era decision process as the canonical sunk-cost + status-quo failure. When the operating company acknowledges competitive threat and simultaneously declines to respond due to capital-structure constraints inherited from the LBO, the decision is not 'whether to transform' — it's 'whether to service debt or survive.' A bias-adjusted review would have forced a choice at the PE governance level: restructure the debt to enable transformation, or accept that the business cannot survive under the debt load. Continuing both dividend recaps AND transformation-deferral was the decision-intelligence failure.",
    },
    source: 'SEC Filing 10-K, Toys "R" Us Inc., 2017; Bloomberg News investigation',
    sourceType: 'sec_filing',
  },
  {
    id: 'sears_kmart_2018',
    title: 'Sears Holdings Collapse',
    company: 'Sears Holdings (Sears/Kmart)',
    industry: 'retail',
    year: 2018,
    yearDiscovered: 2018,
    summary:
      'CEO Eddie Lampert applied hedge fund financial engineering to retail operations, stripping assets and creating internal competition between divisions rather than investing in customer experience or e-commerce.',
    decisionContext:
      "Lampert restructured Sears into competing business units that bid against each other for resources, applied short-term financial metrics to long-term retail decisions, and sold off Lands' End, Craftsman, and real estate while stores deteriorated.",
    outcome: 'catastrophic_failure',
    impactScore: 88,
    estimatedLoss: '$12B+ in market value; 200,000+ jobs over decline period',
    biasesPresent: [
      'overconfidence_bias',
      'confirmation_bias',
      'anchoring_bias',
      'authority_bias',
      'framing_effect',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Echo Chamber'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 4,
    },
    lessonsLearned: [
      'Financial engineering cannot substitute for operational retail expertise',
      'Internal competition models can destroy collaborative customer focus',
      'Authority bias around a dominant CEO prevents course correction',
    ],
    preDecisionEvidence: {
      document:
        "Eddie Lampert's restructuring of Sears Holdings from 2008 onward split the company into 30+ internal business units (BUs) that would 'compete' with each other for resources and transact at internal transfer prices. Lampert personally authorized the structure and required the BUs to negotiate bilateral agreements. Financial engineering accelerated through 2012-2018: Lands' End spin-off (2014, $4.6B value extracted), Craftsman brand sold to Stanley Black & Decker (2017, $900M), Seritage REIT spin-off of 235 stores (2015) at above-market rents lease-back to Sears — effectively a cash extraction disguised as a real-estate transaction.",
      source: 'Sears Holdings SEC filings 2008-2018; ESL Investments letters to Sears shareholders; David Dayen reporting (The American Prospect); Bankruptcy Court SDNY Case 18-23538',
      date: '2015-04',
      documentType: 'strategy_document',
      detectableRedFlags: [
        '30+ internal BUs competing via transfer pricing — destroying operational coordination for merchandising',
        'Seritage REIT transaction extracted $2.7B cash while saddling Sears with above-market lease obligations',
        'Store maintenance capex dropped to <$100M/year on 700+ stores — visible operational decay',
        'Lampert simultaneously CEO, Chairman, and largest creditor via ESL — concentrating governance conflicts',
        'Customer-experience metrics declined consistently 2010-2018 without triggering strategic reconsideration',
      ],
      flaggableBiases: ['overconfidence_bias', 'authority_bias', 'confirmation_bias', 'framing_effect'],
      hypotheticalAnalysis:
        "DI would flag the Sears decision process as the canonical authority-bias + financial-engineering-frame failure. Lampert's hedge-fund success (ESL's Kmart turnaround) created a halo that insulated subsequent decisions from retail-operational scrutiny. A bias-adjusted review would have treated the 30-BU internal-competition structure as an operational red flag requiring independent retail-industry benchmarking — no other successful retailer operates this way. The concentration of CEO, Chairman, and largest-creditor roles in one person should have triggered mandatory independent directors with enhanced authority.",
    },
    source: 'SEC Filing 10-K, Sears Holdings Corp., 2018; Investopedia case study',
    sourceType: 'sec_filing',
  },
  {
    id: 'bed_bath_beyond_2023',
    title: 'Bed Bath & Beyond Bankruptcy',
    company: 'Bed Bath & Beyond',
    industry: 'retail',
    year: 2023,
    yearDiscovered: 2023,
    summary:
      "New CEO Mark Tritton's strategy to replace national brands with private-label products alienated loyal customers while failing to build brand equity, accelerating an already declining business into bankruptcy.",
    decisionContext:
      "Tritton, hired from Target in 2019, applied Target's private-label playbook to BBB without accounting for the different customer base and store experience. Board unanimously backed the pivot despite early signals of customer rejection.",
    outcome: 'catastrophic_failure',
    impactScore: 78,
    estimatedLoss: '$4B+ in enterprise value; 30,000 jobs',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'availability_heuristic',
      'confirmation_bias',
      'groupthink',
      'halo_effect',
    ],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Blind Sprint', 'Echo Chamber', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 6,
    },
    lessonsLearned: [
      'Success at one company does not transfer automatically — context matters',
      'Customer preference data should override executive intuition',
      'Private-label pivots require gradual transition, not wholesale replacement',
    ],
    source: 'SEC Filing 10-K, Bed Bath & Beyond Inc., 2022; WSJ investigation 2023',
    sourceType: 'sec_filing',
  },
  {
    id: 'moviepass_2018',
    title: 'MoviePass Subscription Collapse',
    company: 'MoviePass / Helios & Matheson',
    industry: 'retail',
    year: 2018,
    yearDiscovered: 2018,
    summary:
      'MoviePass offered unlimited movie tickets for $9.95/month when single tickets cost $12+, assuming scale would force theaters to share revenue. Burned through $40M/month with no path to profitability.',
    decisionContext:
      'CEO Mitch Lowe and parent company HMNY leadership believed subscriber volume would create negotiating leverage with AMC and Regal. They rejected financial models showing unsustainable burn rate, citing "disruption" narratives.',
    outcome: 'catastrophic_failure',
    impactScore: 70,
    estimatedLoss: '$300M+ investor losses',
    biasesPresent: [
      'overconfidence_bias',
      'planning_fallacy',
      'confirmation_bias',
      'bandwagon_effect',
      'optimism_bias',
    ],
    primaryBias: 'planning_fallacy',
    toxicCombinations: ['Optimism Trap', 'Blind Sprint'],
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 5,
    },
    lessonsLearned: [
      'Unit economics must work before scaling',
      'Platform negotiating leverage requires genuine alternatives for counterparties',
      'Disruption narratives cannot override basic financial math',
    ],
    source: 'SEC Filing, Helios & Matheson Analytics, 2018; Vanity Fair investigation',
    sourceType: 'sec_filing',
  },
];

export const GOVERNMENT_DEFENSE_CASES: FailureCase[] = [
  {
    id: 'healthcare_gov_2013',
    title: 'Healthcare.gov Launch Failure',
    company: 'US Centers for Medicare & Medicaid Services (CMS)',
    industry: 'government',
    year: 2013,
    yearDiscovered: 2013,
    summary:
      'The federal health insurance marketplace website crashed on launch day and remained largely unusable for 2 months. 55 contractors with no single integrator, late requirements changes, and suppressed testing reports.',
    decisionContext:
      'CMS leadership received multiple warnings about system readiness but proceeded with October 1 launch due to political pressure. Internal test reports showing catastrophic failures were not escalated to decision-makers. No end-to-end testing was performed until 2 weeks before launch.',
    outcome: 'failure',
    impactScore: 85,
    estimatedLoss: '$2.1B total project cost; massive political fallout',
    biasesPresent: [
      'planning_fallacy',
      'groupthink',
      'authority_bias',
      'overconfidence_bias',
      'status_quo_bias',
      'zeigarnik_effect',
      'paradox_of_choice',
    ],
    primaryBias: 'planning_fallacy',
    toxicCombinations: ['Yes Committee', 'Blind Sprint', 'Deadline Panic'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 55,
    },
    lessonsLearned: [
      'Large government IT projects need a single accountable integrator',
      'Political deadlines must not override technical readiness assessments',
      'Testing reports must have guaranteed escalation paths to decision-makers',
    ],
    source: 'GAO Report GAO-14-694, "Healthcare.gov: Ineffective Planning and Oversight," 2014',
    sourceType: 'post_mortem',
  },
  {
    id: 'f35_program_2001',
    title: 'F-35 Joint Strike Fighter Cost Overruns',
    company: 'US Department of Defense / Lockheed Martin',
    industry: 'government',
    year: 2001,
    yearDiscovered: 2010,
    summary:
      'Originally estimated at $233B for 2,866 aircraft, the F-35 program has grown to $400B+ with decade-long delays. Concurrency strategy (building aircraft while still in development) locked in design flaws.',
    decisionContext:
      'DoD adopted "concurrent development" to accelerate delivery, building production aircraft before testing was complete. Initial cost estimates were knowingly optimistic to secure congressional funding. Three service variants increased complexity exponentially.',
    outcome: 'partial_failure',
    impactScore: 90,
    estimatedLoss: '$170B+ in cost overruns; 10+ year delays',
    biasesPresent: [
      'planning_fallacy',
      'sunk_cost_fallacy',
      'overconfidence_bias',
      'anchoring_bias',
      'groupthink',
      'optimism_bias',
      'paradox_of_choice',
    ],
    primaryBias: 'planning_fallacy',
    toxicCombinations: ['Optimism Trap', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 50,
    },
    lessonsLearned: [
      'Concurrent development creates massive sunk cost traps when defects are found late',
      'Multi-service requirement consolidation exponentially increases program risk',
      'Initial cost anchors in defense procurement systematically underestimate by 40-80%',
    ],
    source:
      'GAO Report GAO-21-105, "F-35 Joint Strike Fighter: DOD Needs to Update Modernization Schedule," 2021',
    sourceType: 'post_mortem',
  },
  {
    id: 'afghan_reconstruction_2002',
    title: 'Afghanistan Reconstruction Failures',
    company: 'US Government (SIGAR oversight)',
    industry: 'government',
    year: 2002,
    yearDiscovered: 2021,
    summary:
      'Over $145B spent on reconstruction with widespread waste. Projects built without Afghan input, ignoring local conditions. SIGAR documented systematic overconfidence in timelines and institutional capacity building.',
    decisionContext:
      'US agencies replicated Western institutional models without adapting to Afghan social structures, governance traditions, or economic realities. Progress reports systematically overstated success metrics. Rotating 1-year deployments prevented institutional learning.',
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedLoss: '$145B+ in reconstruction spending with minimal lasting impact',
    biasesPresent: [
      'overconfidence_bias',
      'confirmation_bias',
      'availability_heuristic',
      'planning_fallacy',
      'groupthink',
      'hindsight_bias',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Echo Chamber', 'Optimism Trap', 'Blind Sprint'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 100,
    },
    lessonsLearned: [
      'Institutional models cannot be transplanted without deep local adaptation',
      'Rotating leadership creates recency bias and prevents learning from past failures',
      'Progress metrics must be independently validated, not self-reported',
    ],
    source:
      'SIGAR, "What We Need to Learn: Lessons from Twenty Years of Afghanistan Reconstruction," 2021',
    sourceType: 'post_mortem',
  },
];

export const ADDITIONAL_FINANCIAL_CASES: FailureCase[] = [
  {
    id: 'archegos_2021',
    title: 'Archegos Capital Management Collapse',
    company: 'Archegos Capital / Credit Suisse / Nomura',
    industry: 'financial_services',
    year: 2021,
    yearDiscovered: 2021,
    summary:
      "Bill Hwang's family office used total return swaps to build $100B+ in concentrated positions with 5x-8x leverage. When ViacomCBS stock dropped, margin calls triggered forced liquidation causing $10B+ in prime broker losses.",
    decisionContext:
      "Multiple prime brokers (Credit Suisse, Nomura, Goldman, Morgan Stanley) each extended leverage without visibility into Archegos's total exposure across counterparties. Risk managers at Credit Suisse flagged concerns but were overridden by relationship managers protecting revenue.",
    outcome: 'catastrophic_failure',
    impactScore: 88,
    estimatedLoss: '$10B+ across prime brokers; Credit Suisse $5.5B',
    biasesPresent: [
      'overconfidence_bias',
      'authority_bias',
      'groupthink',
      'bandwagon_effect',
      'confirmation_bias',
      'selective_perception',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Echo Chamber', 'Yes Committee'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 15,
    },
    lessonsLearned: [
      'Counterparty risk cannot be assessed without cross-broker visibility',
      'Revenue incentives must not override risk management escalation',
      'Total return swaps created opacity that existing regulatory frameworks did not address',
    ],
    preDecisionEvidence: {
      document:
        "Archegos Capital Management (Bill Hwang family office) built concentrated positions in ViacomCBS, Discovery, Baidu, Tencent Music, and GSX Techedu using total return swaps across Credit Suisse, Nomura, Goldman Sachs, Morgan Stanley, UBS, and MUFG. Each prime broker saw only its own slice of the exposure (typically 5-8x leverage). Aggregate leverage exceeded 20x. When ViacomCBS announced a $3B secondary offering on March 22 2021, the stock fell 50% in a week — triggering margin calls that exceeded Archegos's capacity. Goldman and Morgan Stanley exited positions first; Credit Suisse and Nomura, late to unwind, took the largest losses.",
      source: "Credit Suisse Special Committee Report on Archegos (Paul, Weiss, July 2021); SEC Complaint v. Hwang & Halligan (2022)",
      date: '2021-03-26',
      documentType: 'risk_assessment',
      detectableRedFlags: [
        'Total-return-swap structure obscures beneficial ownership — prime brokers could not see aggregate exposure',
        "Bill Hwang's prior Tiger Asia vehicle had SEC insider-trading settlement in 2012",
        'Five prime brokers each at 5-8x leverage — aggregate ~25x across the family office',
        'Concentrated positions in a handful of US-listed Chinese stocks and media names — zero diversification',
        "ViacomCBS $3B secondary offering announced while Archegos held 20%+ of free float via swaps",
      ],
      flaggableBiases: ['overconfidence_bias', 'bandwagon_effect', 'selective_perception', 'authority_bias'],
      hypotheticalAnalysis:
        "DI would flag Archegos as the canonical cross-counterparty opacity failure. Each prime broker independently underwrote its exposure as reasonable in isolation — a decision process that structurally cannot assess aggregate risk. A bias-adjusted framework would have required each prime broker to demand cross-broker exposure disclosure from family-office counterparties as a precondition for leverage. The bandwagon effect is explicit: later banks (Credit Suisse, Nomura) joined the relationship because earlier banks (Goldman, MS) had validated it — without independent verification.",
    },
    source: 'Credit Suisse Special Committee Report on Archegos, July 2021; SEC Complaint 2022',
    sourceType: 'sec_filing',
  },
  {
    id: 'celsius_network_2022',
    title: 'Celsius Network Bankruptcy',
    company: 'Celsius Network',
    industry: 'financial_services',
    year: 2022,
    yearDiscovered: 2022,
    summary:
      'Crypto lending platform promised 18%+ yields to depositors while deploying funds in high-risk DeFi strategies and proprietary trading. When crypto markets declined, a $1.2B balance sheet hole was revealed.',
    decisionContext:
      'CEO Alex Mashinsky publicly assured depositors funds were safe while internally the risk team documented growing losses. Yield promises were maintained even as returns from lending declined, requiring increasingly risky strategies to cover the spread.',
    outcome: 'catastrophic_failure',
    impactScore: 80,
    estimatedLoss: '$4.7B in customer deposits frozen',
    biasesPresent: [
      'overconfidence_bias',
      'planning_fallacy',
      'confirmation_bias',
      'framing_effect',
      'sunk_cost_fallacy',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 6,
    },
    lessonsLearned: [
      'Yield promises create structural incentives for increasing risk',
      'Customer-facing assurances must be independently verified against internal data',
      'DeFi counterparty risk chains can create hidden systemic exposure',
    ],
    preDecisionEvidence: {
      document:
        "Celsius Network's 2021 marketing materials promised depositors up to 18% annualized yield on stablecoin deposits — in a market where risk-free rates were near zero. CEO Alex Mashinsky hosted weekly AMAs repeatedly stating 'banks are not your friends' and that Celsius funds were safer than traditional banking. Internally, Celsius deployed deposits into DeFi protocols (Anchor 20%, Aave, Compound) and proprietary trading at Celsius KeyFi subsidiary. Internal risk reports flagged a growing mismatch between yield promised to depositors and yield generated by assets, plugged by CEL token appreciation dependencies.",
      source: "Celsius Network Chapter 11 filings (SDNY Case 22-10964); Alex Mashinsky DOJ Indictment (July 2023); NYAG complaint",
      date: '2022-03',
      documentType: 'public_statement',
      detectableRedFlags: [
        '18% yield on stablecoins in a zero-rate environment — structurally unsustainable without deposit-funded losses',
        'CEO public messaging inconsistent with internal risk-team assessments',
        'Deposit/yield-source asset duration mismatch growing through 2021-2022',
        'Proprietary trading losses (Celsius KeyFi) not disclosed to depositors',
        'CEL token price used as solvency mechanism — reflexive dependency between platform and token value',
      ],
      flaggableBiases: ['overconfidence_bias', 'framing_effect', 'bandwagon_effect', 'confirmation_bias'],
      hypotheticalAnalysis:
        "DI would flag Celsius as the canonical framing-effect deception compounded by bandwagon effect. The 'banks are not your friends' framing converted what was functionally an unsecured loan to a crypto operator into a moral positioning statement — disarming normal depositor-risk scrutiny. A bias-adjusted depositor-facing communication would have been required to disclose the sources of the 18% yield, the asset-liability duration profile, and the CEL-token dependency. The bandwagon effect on the depositor side — 'millions of users are doing this' — substituted social proof for independent risk assessment.",
    },
    source: 'Celsius Network bankruptcy filing, Chapter 11, SDNY 2022; DOJ Indictment 2023',
    sourceType: 'sec_filing',
  },
  {
    id: 'greensill_capital_2021',
    title: 'Greensill Capital Collapse',
    company: 'Greensill Capital',
    industry: 'financial_services',
    year: 2021,
    yearDiscovered: 2021,
    summary:
      'Supply chain finance firm collapsed when Credit Suisse froze $10B in linked funds. Greensill had been financing "prospective receivables" (invoices that didn\'t yet exist) and concentrated exposure in Sanjeev Gupta\'s GFG Alliance.',
    decisionContext:
      'Founder Lex Greensill convinced Credit Suisse asset management and SoftBank to back increasingly aggressive lending against future receivables. Insurance coverage from Tokio Marine was not renewed but this was not disclosed to fund investors.',
    outcome: 'catastrophic_failure',
    impactScore: 82,
    estimatedLoss: '$10B+ in frozen funds; 3,000+ jobs at risk in GFG Alliance',
    biasesPresent: [
      'authority_bias',
      'confirmation_bias',
      'overconfidence_bias',
      'bandwagon_effect',
      'groupthink',
    ],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Yes Committee', 'Echo Chamber'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
    },
    lessonsLearned: [
      'Supply chain finance against prospective receivables is unsecured lending in disguise',
      'Insurance coverage status must be continuously verified, not assumed',
      'Concentration risk in a single counterparty defeats the purpose of diversified trade finance',
    ],
    source: 'UK Parliament Treasury Committee report on Greensill Capital, 2021; FT investigation',
    sourceType: 'news_investigation',
  },
];

export const ADDITIONAL_TECH_CASES: FailureCase[] = [
  {
    id: 'zillow_ibuying_2021',
    title: 'Zillow iBuying Program Shutdown',
    company: 'Zillow',
    industry: 'technology',
    year: 2021,
    yearDiscovered: 2021,
    summary:
      "Zillow's algorithmic home-buying program (Zillow Offers) purchased 27,000 homes using ML price predictions that systematically overpaid, resulting in a $881M write-down and 2,000 layoffs.",
    decisionContext:
      "Zillow's Zestimate algorithm was repurposed for buying decisions despite known accuracy limitations. When the model consistently overpaid, leadership increased purchase volume to hit growth targets rather than recalibrating the model. Internal data scientists raised concerns that were deprioritized.",
    outcome: 'failure',
    impactScore: 78,
    estimatedLoss: '$881M write-down; 2,000 layoffs; program shuttered',
    biasesPresent: [
      'overconfidence_bias',
      'anchoring_bias',
      'confirmation_bias',
      'planning_fallacy',
      'sunk_cost_fallacy',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 12,
    },
    lessonsLearned: [
      'ML model accuracy for estimation ≠ accuracy for buying decisions (asymmetric loss)',
      'Growth targets must not override model recalibration signals',
      'Real estate markets have latency that algorithmic models underestimate',
    ],
    preDecisionEvidence: {
      document:
        "Zillow Offers expanded from 20 markets to 25, with CEO Rich Barton publicly committing to purchasing 5,000+ homes per month by end of 2021. Internal data scientists had raised concerns that the Zestimate algorithm — designed for advertising-supported price display — exhibited systematic positive bias when repurposed as a buying signal in a rising market. Q2 2021 earnings described iBuying as 'a transformational growth opportunity.' Inventory grew faster than disposal capacity, creating a growing stock of homes held at above-market prices.",
      source: 'Zillow Group Q2 2021 shareholder letter and earnings call; Bloomberg reporting (Patrick Clark)',
      date: '2021-08-05',
      documentType: 'earnings_call',
      detectableRedFlags: [
        'Inventory (homes held for resale) growing materially faster than disposition cadence',
        'Zestimate algorithm repurposed from display-ads to capital-allocation with no retrained validation',
        'Data-science escalations about model drift were deprioritized in favor of volume targets',
        'Renovation-cost overruns reported anecdotally but not systematically re-incorporated into underwriting',
        'Scaling from 20 to 25 markets accelerated during a period of accelerating inventory backlog',
      ],
      flaggableBiases: ['overconfidence_bias', 'anchoring_bias', 'confirmation_bias', 'sunk_cost_fallacy'],
      hypotheticalAnalysis:
        "DI would flag the decision to scale iBuying volume while inventory backlog was growing as a canonical sunk-cost + overconfidence failure. Once Zillow had committed to iBuying as a public strategic pillar, management reframed each new overpayment as 'market latency' rather than 'model error.' A decision process that treated rising inventory age as a bright-line pause-gate — rather than an accelerant for the growth narrative — would have halted expansion in Q1 2021 and limited losses to a fraction of the final $881M write-down.",
    },
    source: 'Zillow Q3 2021 Earnings Call; SEC Filing 10-Q 2021; Bloomberg investigation',
    sourceType: 'sec_filing',
  },
  {
    id: 'peloton_overexpansion_2021',
    title: 'Peloton Overexpansion and Demand Collapse',
    company: 'Peloton Interactive',
    industry: 'technology',
    year: 2021,
    yearDiscovered: 2022,
    summary:
      'Peloton extrapolated pandemic-era demand growth as permanent, investing $400M in a new factory and acquiring Precor for $420M. When demand normalized, they were left with massive excess inventory and capacity.',
    decisionContext:
      'CEO John Foley and board treated 2020-2021 subscriber growth as the new baseline rather than a pandemic anomaly. Demand forecasting models anchored on recent explosive growth. Internal finance team projections were overridden by leadership optimism.',
    outcome: 'failure',
    impactScore: 75,
    estimatedLoss: '$40B+ in market cap decline; 4,000+ layoffs',
    biasesPresent: [
      'recency_bias',
      'availability_heuristic',
      'overconfidence_bias',
      'anchoring_bias',
      'planning_fallacy',
    ],
    primaryBias: 'recency_bias',
    toxicCombinations: ['Recency Spiral', 'Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 10,
    },
    lessonsLearned: [
      'Pandemic demand must be modeled as a temporary shock, not a permanent shift',
      'Capital investment decisions require base-rate analysis, not trend extrapolation',
      'Manufacturing capacity commitments should use scenario planning, not single-point forecasts',
    ],
    preDecisionEvidence: {
      document:
        "Peloton's Q4 FY2021 shareholder letter projected connected-fitness subscriber growth above 5M by end of FY2022 and announced the $400M Peloton Output Park manufacturing facility in Troy, Ohio alongside the $420M acquisition of Precor. The projections extrapolated 2020-2021 pandemic growth rates while acknowledging a return to in-person fitness. The investments assumed durable demand at pandemic-peak levels despite gyms reopening.",
      source: 'Peloton Interactive Q4 FY2021 shareholder letter and earnings call',
      date: '2021-08-26',
      documentType: 'earnings_call',
      detectableRedFlags: [
        'Capital commitments ($820M combined) premised on pandemic demand as a permanent baseline',
        'No published sensitivity analysis for a return-to-gyms scenario',
        'Treadmill recall + Tread+ product failures in Q2 FY2021 signaled operational strain',
        'Inventory buildup (subsequently $1.1B) as gym reopening accelerated',
        'Internal finance team projections reportedly more conservative than public guidance',
      ],
      flaggableBiases: ['recency_bias', 'availability_heuristic', 'overconfidence_bias', 'planning_fallacy'],
      hypotheticalAnalysis:
        "DI would flag the Peloton FY2022 capital commitments as the canonical recency-bias + availability-heuristic pair. Extrapolating a step-function pandemic demand spike as a permanent growth trajectory is exactly the decision the availability heuristic produces — vivid, recent data overwhelming base-rate reasoning. A bias-adjusted process would have modeled at least three demand scenarios (pandemic-permanent, partial retention, full reversion) with capital commitments scaled to the conservative case.",
    },
    source: 'Peloton SEC Filing 10-K 2022; WSJ investigation Feb 2022',
    sourceType: 'sec_filing',
  },
  {
    id: 'rivian_production_2021',
    title: 'Rivian Production Target Failures',
    company: 'Rivian Automotive',
    industry: 'technology',
    year: 2021,
    yearDiscovered: 2022,
    summary:
      'Rivian went public at $66B valuation with promises to deliver 1,200 vehicles in 2021. Delivered only 920 despite $0 revenue history. Production targets were consistently missed through 2022-2023.',
    decisionContext:
      'IPO valuation anchored on ambitious production forecasts that assumed manufacturing ramp rates comparable to mature automakers. Supply chain constraints and quality issues were systematically underestimated. Board and investors accepted optimistic timelines without independent manufacturing assessment.',
    outcome: 'partial_failure',
    impactScore: 72,
    estimatedLoss: '$55B+ in market cap decline from peak',
    biasesPresent: [
      'planning_fallacy',
      'overconfidence_bias',
      'anchoring_bias',
      'optimism_bias',
      'bandwagon_effect',
    ],
    primaryBias: 'planning_fallacy',
    toxicCombinations: ['Optimism Trap', 'Blind Sprint'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 15,
    },
    lessonsLearned: [
      'EV manufacturing ramp rates cannot be benchmarked against software scaling curves',
      'IPO valuations based on production forecasts require independent manufacturing due diligence',
      'Supply chain complexity in automotive requires 2-3x timeline buffers',
    ],
    source: 'Rivian SEC Filing S-1 2021; 10-K 2022; Bloomberg production analysis',
    sourceType: 'sec_filing',
  },
];
