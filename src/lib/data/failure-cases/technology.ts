import { FailureCase } from './types';

export const TECHNOLOGY_CASES: FailureCase[] = [
  {
    id: 'tech-001',
    title: 'Kodak Digital Camera Decision',
    company: 'Eastman Kodak',
    industry: 'technology',
    year: 1975,
    yearDiscovered: 2012,
    summary:
      'Kodak invented the digital camera in 1975 but suppressed the technology to protect its lucrative film business. Over three decades, leadership repeatedly chose to defend the status quo rather than cannibalize existing revenue, ultimately filing for bankruptcy in 2012 as digital photography rendered film obsolete.',
    decisionContext:
      'Whether to invest in and commercialize digital photography technology or continue prioritizing the highly profitable film and chemical processing business.',
    outcome: 'catastrophic_failure',
    impactScore: 90,
    estimatedLoss: '$31B',
    biasesPresent: [
      'status_quo_bias',
      'confirmation_bias',
      'loss_aversion',
      'anchoring_bias',
      'sunk_cost_fallacy',
    ],
    primaryBias: 'status_quo_bias',
    toxicCombinations: ['Status Quo Lock', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 12,
    },
    lessonsLearned: [
      'Inventing a disruptive technology does not protect incumbents if loss aversion prevents them from commercializing it.',
      'Status quo bias is most dangerous when current profits are high, as it creates an illusion that the existing model is permanent.',
      'Companies must be willing to cannibalize their own products before competitors do it for them.',
    ],
    preDecisionEvidence: {
      document: 'Future of Digital Imaging: Market Research Report',
      source: 'Kodak Research Labs',
      date: '1981-09-01',
      documentType: 'internal_memo',
      detectableRedFlags: [
        'Internal research directly contradicted corporate strategy by predicting digital photography would overtake film by 2010',
        '30-year timeline to digital dominance created false comfort and deferred urgency for strategic pivoting',
        'A working digital camera prototype had already been built internally in 1975, proving technical feasibility',
        'Declining film margins were being ignored in favor of absolute revenue figures that masked underlying erosion',
      ],
      flaggableBiases: [
        'status_quo_bias',
        'confirmation_bias',
        'loss_aversion',
        'sunk_cost_fallacy',
      ],
      hypotheticalAnalysis:
        "A decision intelligence system would have flagged the internal contradiction between Kodak's own 1981 research predicting digital dominance and the company's continued $5B+ annual film investment. The 30-year timeline created false comfort — the bias detector would have identified status quo bias and loss aversion in leadership's refusal to cannibalize profitable film revenue.",
    },
    keyQuotes: [
      {
        text: "It was filmless photography, so management's reaction was, 'that's cute — but don't tell anyone about it.'",
        source: 'Steven Sasson, interviewed by New York Times ("Kodak\'s First Digital Moment")',
        date: '2008-08-12',
        speaker: 'Steven J. Sasson, Kodak engineer who built the first digital camera',
      },
      {
        text: 'Film is a huge, huge profit machine. No one wanted to be the one who killed the golden goose.',
        source: 'Former Kodak executive, quoted in Harvard Business Review',
        date: '2012-01',
        speaker: 'Anonymous Kodak executive',
      },
      {
        text: 'We had a business challenge, not a technology challenge.',
        source: 'Kodak Chapter 11 filing explanatory statement',
        date: '2012-01-19',
        speaker: 'Antonio Perez, CEO',
      },
    ],
    timeline: [
      {
        date: '1975-12',
        event: 'Kodak engineer Steven Sasson builds the first self-contained digital camera — 0.01 megapixel, 8 lbs, 23-second capture time.',
        source: 'Sasson interview, NYT 2008',
      },
      {
        date: '1981',
        event: 'Internal Kodak research report predicts digital photography will overtake film by ~2010, giving the company a decade to transition.',
        source: 'Chunka Mui, "How Kodak Failed" (Forbes, 2012)',
      },
      {
        date: '1989',
        event: 'Board passes over Phil Samper (the "digital" candidate) for CEO and chooses Kay R. Whitmore, who recommits to film as core strategy.',
        source: 'Harvard Business School case: Kodak (2002)',
      },
      {
        date: '1996',
        event: 'Kodak launches Advantix film system — a $500M+ investment in a hybrid analog format released the same year Nikon launched its first DSLR.',
        source: 'Kodak 1996 10-K',
      },
      {
        date: '2003',
        event: 'CEO Daniel Carp announces pivot to digital — but digital cameras already commoditized; Kodak competes on price without its traditional margin advantage.',
        source: 'Kodak 2003 annual report',
      },
      {
        date: '2007',
        event: 'Smartphone cameras begin displacing dedicated digital cameras. Kodak has no smartphone or sensor-licensing strategy.',
        source: 'Kodak 2007 10-K',
      },
      {
        date: '2012-01-19',
        event: 'Eastman Kodak files for Chapter 11 bankruptcy.',
        source: 'SDNY Case No. 12-10202',
      },
    ],
    stakeholders: [
      {
        name: 'Colby Chandler',
        role: 'CEO (1983–1990)',
        position: 'advocate',
        notes: 'Defended film-centric strategy through late 1980s despite internal digital prototypes.',
      },
      {
        name: 'Kay R. Whitmore',
        role: 'CEO (1990–1993)',
        position: 'advocate',
        notes: 'Chosen over Phil Samper; doubled down on film.',
      },
      {
        name: 'George M. C. Fisher',
        role: 'CEO (1993–1999)',
        position: 'dissenter',
        notes: 'Recruited from Motorola to drive digital transition; his plans were slowed by entrenched film-division leadership.',
      },
      {
        name: 'Steven Sasson',
        role: 'Engineer, digital camera inventor',
        position: 'overruled',
        notes: '1975 digital camera shelved by management; Sasson remained at Kodak but was never given a commercial product path.',
      },
      {
        name: 'Phil Samper',
        role: 'President (CEO candidate 1989)',
        position: 'dissenter',
        notes: 'Advocated earlier digital commitment; passed over for CEO, departed Kodak in 1989.',
      },
    ],
    counterfactual: {
      recommendation:
        'Commit in 1981 to commercializing digital alongside film at ~15% of annual R&D; license Kodak\'s sensor patents aggressively rather than defensively; acquire or partner with emerging digital specialists (Casio QV-10 era, 1995); spin digital into an independent subsidiary insulated from film-division politics.',
      rationale:
        'Kodak had 30 years of runway and every piece of evidence it needed. The failure was not seeing the future — the 1981 report saw it correctly. The failure was loss aversion on a profit pool that management could not bring itself to self-cannibalize until competitors did it for them.',
      estimatedOutcome:
        'Kodak survives as a digital sensor and imaging IP licensing business — comparable to Fujifilm\'s successful pivot to specialty chemicals and cosmetics. Avoids Chapter 11; preserves ~30K jobs in Rochester.',
    },
    dqiEstimate: {
      score: 31,
      grade: 'F',
      topBiases: ['status_quo_bias', 'loss_aversion', 'sunk_cost_fallacy'],
      rationale:
        'The 1981 strategic review is a textbook case of "decision intelligence found the right answer, leadership ignored it." Every subsequent decade re-committed to the same status-quo choice despite accumulating contrary evidence — a terminal loss-aversion trajectory.',
    },
    postMortemCitations: [
      {
        label: 'Chunka Mui, "How Kodak Failed" (Forbes)',
        year: 2012,
      },
      {
        label: 'Harvard Business School Case 703-503: Eastman Kodak Co.',
        year: 2002,
      },
      {
        label: "Willy Shih, 'The Real Lessons From Kodak's Decline' (MIT Sloan Management Review)",
        year: 2016,
      },
      {
        label: 'Kodak Chapter 11 Examiner Report, SDNY',
        year: 2013,
      },
    ],
    relatedCases: ['tech-002', 'tech-003'],
    patternFamily: 'Incumbent Cannibalization Paralysis',
    source:
      'Chunka Mui, "How Kodak Failed" (Forbes, 2012); Kodak Chapter 11 filing, SDNY Case No. 12-10202',
    sourceType: 'case_study',
  },
  {
    id: 'tech-002',
    title: 'Nokia Smartphone Market Collapse',
    company: 'Nokia',
    industry: 'technology',
    year: 2007,
    yearDiscovered: 2013,
    summary:
      "Nokia held 49.4% global mobile phone market share in 2007 but failed to respond to the iPhone and Android revolution. Internal organizational politics, overconfidence in the Symbian platform, and a culture of fear that suppressed bad news led to Nokia's mobile division being sold to Microsoft for $7.2 billion in 2013, down from a peak market capitalization of $250 billion.",
    decisionContext:
      'Whether to abandon the aging Symbian operating system in favor of a modern touch-based smartphone platform after Apple launched the iPhone in 2007.',
    outcome: 'catastrophic_failure',
    impactScore: 95,
    estimatedLoss: '$243B',
    biasesPresent: [
      'status_quo_bias',
      'overconfidence_bias',
      'groupthink',
      'confirmation_bias',
      'loss_aversion',
    ],
    primaryBias: 'status_quo_bias',
    toxicCombinations: ['Echo Chamber', 'Status Quo Lock'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 15,
    },
    lessonsLearned: [
      'Market dominance breeds overconfidence that blinds organizations to paradigm shifts happening in real time.',
      'A culture of fear where middle management hides bad news from senior leadership creates a fatal information asymmetry.',
      'Platform transitions require decisive action; incremental improvements to legacy systems cannot close a generational gap.',
    ],
    preDecisionEvidence: {
      document: 'Smartphone OS Strategy Review',
      source: 'Nokia Strategy Division',
      date: '2007-06-15',
      documentType: 'strategy_document',
      detectableRedFlags: [
        'Symbian market share was declining quarter-over-quarter despite being presented as the dominant platform',
        'Touch-based interfaces were dismissed as a "niche" use case despite the iPhone launch creating an entirely new product category',
        'Developer ecosystem for Symbian was shrinking as third-party developers migrated to emerging platforms',
        "Apple's iPhone launch in January 2007 was creating a new smartphone category that invalidated Nokia's feature-phone assumptions",
      ],
      flaggableBiases: [
        'status_quo_bias',
        'overconfidence_bias',
        'groupthink',
        'confirmation_bias',
      ],
      hypotheticalAnalysis:
        "Decision intelligence would have flagged the contradiction between declining Symbian developer engagement metrics and the board's decision to double down on the platform. The anchoring to existing 40% market share masked the velocity of change — a noise analysis would have shown unprecedented inter-analyst disagreement about smartphone OS futures.",
    },
    keyQuotes: [
      {
        text: "Nokia's platform is burning.",
        source: 'Leaked Nokia internal memo ("Burning Platform")',
        date: '2011-02-08',
        speaker: 'Stephen Elop, CEO',
      },
      {
        text: 'The iPhone is a niche product.',
        source: 'Interview attributed to Nokia leadership, 2007 (widely reported paraphrase)',
        date: '2007',
        speaker: 'Nokia senior management (paraphrased)',
      },
      {
        text: 'We did not do anything wrong, but somehow, we lost.',
        source: 'Stephen Elop farewell speech, reported by Reuters',
        date: '2013-09',
        speaker: 'Stephen Elop, CEO',
      },
    ],
    timeline: [
      {
        date: '2007-01-09',
        event: 'Apple announces the iPhone. Nokia holds 49% global mobile market share.',
        source: 'Apple keynote, January 2007',
      },
      {
        date: '2007-06',
        event: 'Nokia internal strategy review dismisses touch-based interfaces as "niche" and commits to evolving Symbian rather than replacing it.',
        source: 'Vuori & Huy (2016), Nokia Strategy Review documents',
      },
      {
        date: '2008-09',
        event: 'Symbian Foundation announced — Nokia open-sources Symbian to counter iPhone/Android. Board-level decision to keep Symbian as flagship.',
        source: 'Symbian Foundation press release',
      },
      {
        date: '2010-09',
        event: 'Stephen Elop (ex-Microsoft) appointed CEO — the first non-Finnish Nokia CEO.',
        source: 'Nokia press release, September 10 2010',
      },
      {
        date: '2011-02-11',
        event: 'Elop announces Windows Phone partnership; abandons Symbian and the in-house MeeGo platform. Nokia stock drops 14% in one day.',
        source: 'Nokia–Microsoft strategic partnership announcement',
      },
      {
        date: '2013-09-03',
        event: 'Microsoft announces acquisition of Nokia Devices & Services for €5.4B ($7.2B).',
        source: 'Microsoft press release, September 2013',
      },
      {
        date: '2014-04-25',
        event: 'Acquisition closes. Nokia smartphone unit fully absorbed; Microsoft writes down $7.6B on the deal in 2015.',
        source: 'Microsoft Q4 2015 10-K',
      },
    ],
    stakeholders: [
      {
        name: 'Olli-Pekka Kallasvuo',
        role: 'CEO (2006–2010)',
        position: 'advocate',
        notes: 'Defended Symbian-centric strategy through critical 2007–2010 window.',
      },
      {
        name: 'Anssi Vanjoki',
        role: 'EVP, Markets',
        position: 'dissenter',
        notes: 'Publicly advocated faster pivot to modern smartphone OS; resigned September 2010 after being passed over for CEO.',
      },
      {
        name: 'Jorma Ollila',
        role: 'Chairman (1999–2012)',
        position: 'advocate',
        notes: 'Former CEO whose Symbian legacy shaped board risk tolerance.',
      },
      {
        name: 'Stephen Elop',
        role: 'CEO (2010–2014)',
        position: 'dissenter',
        notes: 'Chose Windows Phone over Android; decision debated to this day as either last hope or trojan horse for Microsoft acquisition.',
      },
      {
        name: 'Tero Ojanperä',
        role: 'EVP, Services & CTO',
        position: 'overruled',
        notes: 'Advocated services/app-ecosystem strategy internally; sidelined as Symbian defense dominated.',
      },
    ],
    counterfactual: {
      recommendation:
        'In mid-2007, commission an honest six-month Symbian replacement study involving external developers; by 2008 either adopt Android (Samsung\'s 2009 path) or ship the MeeGo N900 as flagship; build a dedicated app-store team in 2008 instead of 2011; retain Vanjoki rather than alienating him.',
      rationale:
        'Nokia\'s failure was not choosing the wrong OS in 2011 — it was a three-year refusal (2007–2010) to concede that Symbian was architecturally incapable of competing with iOS/Android. The "burning platform" memo came four years too late.',
      estimatedOutcome:
        'Nokia becomes the Samsung of Europe — an Android leader with 15–20% smartphone share by 2013. Avoids Microsoft sale; preserves Finnish headquarters and 20K+ device jobs.',
    },
    dqiEstimate: {
      score: 34,
      grade: 'F',
      topBiases: ['status_quo_bias', 'overconfidence_bias', 'groupthink'],
      rationale:
        'Market dominance (49% share) created an anchoring effect so strong that declining developer engagement and rising iPhone/Android velocity were literally filtered out of board-level reporting. The Vuori & Huy study documents a "fear culture" where middle managers hid bad news — a decision-process failure, not an information failure.',
    },
    postMortemCitations: [
      {
        label: 'Vuori & Huy, "Distributed Attention and Shared Emotions in the Innovation Process" (Administrative Science Quarterly)',
        year: 2016,
      },
      {
        label: 'Yves Doz & Mikko Kosonen, "Nokia — Fast, Focused, and Flexible" (INSEAD case)',
        year: 2008,
      },
      {
        label: 'James Surowiecki, "Where Nokia Went Wrong" (The New Yorker)',
        year: 2013,
      },
      {
        label: 'Microsoft 2015 10-K — $7.6B Nokia goodwill impairment',
        year: 2015,
      },
    ],
    relatedCases: ['tech-001', 'tech-003', 'tech-006'],
    patternFamily: 'Incumbent Cannibalization Paralysis',
    source:
      'Timo O. Vuori and Quy N. Huy, "Distributed Attention and Shared Emotions in the Innovation Process," Administrative Science Quarterly (2016)',
    sourceType: 'academic_paper',
  },
  {
    id: 'tech-003',
    title: 'Blockbuster Rejection of Netflix Partnership',
    company: 'Blockbuster',
    industry: 'technology',
    year: 2000,
    yearDiscovered: 2010,
    summary:
      "In 2000, Netflix co-founder Reed Hastings offered to sell the company to Blockbuster for $50 million. Blockbuster's CEO John Antioco and his team declined, anchored to the brick-and-mortar rental model and overconfident in their market position. Blockbuster filed for bankruptcy in 2010.",
    decisionContext:
      'Whether to acquire Netflix and invest in DVD-by-mail and eventual streaming technology, or continue focusing on the existing store-based rental business model.',
    outcome: 'catastrophic_failure',
    impactScore: 85,
    estimatedLoss: '$6B',
    biasesPresent: [
      'anchoring_bias',
      'status_quo_bias',
      'overconfidence_bias',
      'confirmation_bias',
      'loss_aversion',
    ],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Status Quo Lock', 'Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
    },
    lessonsLearned: [
      'Anchoring to an existing distribution model prevents incumbents from recognizing that convenience and technology will reshape customer expectations.',
      "Late fees represented 16% of Blockbuster's revenue, creating a perverse incentive to resist customer-friendly disruption.",
      'Overconfidence in physical retail presence is not a sustainable competitive moat when digital alternatives emerge.',
    ],
    preDecisionEvidence: {
      document:
        'After evaluating the Netflix proposal, we have concluded that online DVD rental represents a very small niche segment of the market. Our core customers value the in-store browsing experience and immediate availability. Late fee revenue of approximately $800 million annually remains essential to our business model, and we see no reason to disrupt a proven revenue stream for an unproven digital concept.',
      source:
        "Blockbuster Board Meeting Minutes, CEO John Antioco's assessment after meeting with Netflix co-founders Reed Hastings and Marc Randolph",
      date: '2000-04-15',
      documentType: 'board_memo',
      detectableRedFlags: [
        'Over 90% of revenue derived from physical store operations with no diversification strategy for digital channels',
        'Wholesale dismissal of digital disruption as a "niche market" without rigorous scenario analysis of internet adoption trends',
        'Late-fee dependency ($800M/year) was generating significant customer resentment and creating vulnerability to any competitor offering a no-late-fee alternative',
        'No online strategy or digital distribution roadmap despite broadband adoption accelerating across the United States',
      ],
      flaggableBiases: ['status_quo_bias', 'anchoring_bias', 'confirmation_bias', 'overconfidence'],
      hypotheticalAnalysis:
        'A decision intelligence platform would have identified the extreme concentration risk of 90% physical-store revenue and flagged the dismissal of online rental as a dangerous status quo bias given broadband adoption trajectories. The $800 million late-fee dependency would have been surfaced as a strategic vulnerability rather than a strength, since it created a direct incentive for customers to switch to any subscription-based competitor. The platform would have recommended scenario modeling for digital disruption and highlighted the $50 million acquisition cost as asymmetrically low relative to the downside risk of inaction.',
    },
    keyQuotes: [
      {
        text: 'They laughed us out of their office. At least initially.',
        source: 'Marc Randolph, "That Will Never Work"',
        date: '2019',
        speaker: 'Marc Randolph, Netflix co-founder, recalling the 2000 Blockbuster meeting',
      },
      {
        text: 'We are ahead of every other major retailer on the internet and ahead of virtually every other retailer in creating a seamless online-offline experience.',
        source: 'Blockbuster 2004 annual report letter to shareholders',
        date: '2005-03',
        speaker: 'John Antioco, CEO',
      },
      {
        text: 'The dot-com hysteria is gone... we would rather own our own technology than buy it.',
        source: 'Blockbuster executive commentary, cited in "Netflixed" (Keating)',
        date: '2000',
        speaker: 'Ed Stead, Blockbuster General Counsel',
      },
    ],
    timeline: [
      {
        date: '1997-08',
        event: 'Netflix founded; launches DVD-by-mail rental service.',
        source: 'Netflix S-1 Registration Statement, 2002',
      },
      {
        date: '2000-04',
        event: 'Netflix co-founders Reed Hastings and Marc Randolph offer Netflix to Blockbuster for $50M. Blockbuster CEO John Antioco declines.',
        source: 'Marc Randolph, "That Will Never Work" (2019)',
      },
      {
        date: '2004-08',
        event: 'Blockbuster finally launches Blockbuster Online (DVD-by-mail) — four years after rejecting Netflix. By this point Netflix has 2M+ subscribers.',
        source: 'Blockbuster 2004 annual report',
      },
      {
        date: '2005',
        event: 'Activist investor Carl Icahn wins three board seats; pressures Antioco to cut investment in online and no-late-fees initiatives.',
        source: 'Blockbuster proxy filings, 2005',
      },
      {
        date: '2007-03',
        event: 'Antioco ousted; replaced by Jim Keyes who reverses the digital-forward strategy.',
        source: 'Blockbuster 8-K, March 20 2007',
      },
      {
        date: '2007-01',
        event: 'Netflix launches streaming — the technology Blockbuster said was "unproven".',
        source: 'Netflix Q1 2007 shareholder letter',
      },
      {
        date: '2010-09-23',
        event: 'Blockbuster files for Chapter 11 bankruptcy. Netflix market cap: $13B.',
        source: 'SDNY Case No. 10-14997',
      },
    ],
    stakeholders: [
      {
        name: 'John Antioco',
        role: 'CEO (1997–2007)',
        position: 'advocate',
        notes: 'Rejected 2000 Netflix acquisition. Later (2004–2006) reversed and led the $400M push into online and no-late-fees — but was ousted by Icahn before it matured.',
      },
      {
        name: 'Ed Stead',
        role: 'General Counsel & EVP Business Development',
        position: 'advocate',
        notes: 'Primary voice dismissing the Netflix offer; argued Blockbuster should build rather than buy.',
      },
      {
        name: 'Carl Icahn',
        role: 'Activist shareholder (from 2005)',
        position: 'advocate',
        notes: 'Fought against online and no-late-fee investment; later called his Blockbuster investment his "worst decision."',
      },
      {
        name: 'Jim Keyes',
        role: 'CEO (2007–2011)',
        position: 'advocate',
        notes: 'Reversed Antioco\'s digital pivot; refocused on store operations.',
      },
      {
        name: 'Reed Hastings',
        role: 'Netflix CEO (external counterparty)',
        position: 'dissenter',
        notes: 'Explicitly flagged the disruption during the 2000 meeting; his prediction became a 10-year recording of prescience.',
      },
    ],
    counterfactual: {
      recommendation:
        'Acquire Netflix in 2000 for $50M (or at a stepped-up $150–250M in 2002); use 9,000 stores as returns/exchange endpoints for an integrated online-offline model; eliminate late fees in 2002 rather than 2005; invest in streaming infrastructure in 2005 once broadband penetration crosses 50%.',
      rationale:
        'The Blockbuster-Netflix decision is the clearest "incumbent cannibalization paralysis" case in modern business. Late fees (16% of revenue) made customer-friendly disruption organizationally unthinkable, even as the data that customers hated late fees was overwhelming.',
      estimatedOutcome:
        'Blockbuster becomes the platform that Netflix would have built — same streaming dominance, but with 9,000-store physical distribution making content acquisition economics 20–30% better. Could plausibly have held $30B+ market cap through 2015.',
    },
    dqiEstimate: {
      score: 29,
      grade: 'F',
      topBiases: ['status_quo_bias', 'anchoring_bias', 'loss_aversion'],
      rationale:
        'Anchored to $800M annual late-fee revenue as a strength rather than a liability. Dismissed online as "niche" in 2000 despite broadband doubling every 18 months. The $50M offer was 0.05% of enterprise value — asymmetrically cheap insurance rejected on reflex.',
    },
    postMortemCitations: [
      {
        label: 'Greg Satell, "A Look Back at Why Blockbuster Really Failed" (Forbes)',
        year: 2014,
      },
      {
        label: 'Gina Keating, "Netflixed: The Epic Battle for America\'s Eyeballs"',
        year: 2012,
      },
      {
        label: 'Marc Randolph, "That Will Never Work"',
        year: 2019,
      },
      {
        label: 'Blockbuster Inc. Chapter 11 filing (SDNY Case No. 10-14997)',
        year: 2010,
      },
    ],
    relatedCases: ['tech-001', 'tech-002', 'cs-success-tech-002'],
    patternFamily: 'Incumbent Cannibalization Paralysis',
    source:
      'Greg Satell, "A Look Back at Why Blockbuster Really Failed" (Forbes, 2014); Blockbuster Inc. Chapter 11 filing (2010)',
    sourceType: 'case_study',
  },
  {
    id: 'tech-004',
    title: 'Yahoo Rejection of Microsoft Acquisition',
    company: 'Yahoo',
    industry: 'technology',
    year: 2008,
    yearDiscovered: 2017,
    summary:
      "Yahoo's board rejected Microsoft's $44.6 billion acquisition offer in 2008, with CEO Jerry Yang holding out for a higher price. The company continued to decline, ultimately selling its core internet business to Verizon for $4.48 billion in 2017, a 90% decline from the rejected offer.",
    decisionContext:
      "Whether to accept Microsoft's $31-per-share acquisition bid or hold out for a higher offer based on the belief that Yahoo's independent value would increase.",
    outcome: 'catastrophic_failure',
    impactScore: 80,
    estimatedLoss: '$44.6B',
    biasesPresent: ['anchoring_bias', 'overconfidence_bias', 'loss_aversion', 'confirmation_bias'],
    primaryBias: 'anchoring_bias',
    toxicCombinations: ['Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 10,
    },
    lessonsLearned: [
      'Anchoring to a higher internal valuation while the competitive landscape is deteriorating can destroy shareholder value.',
      'Board members must evaluate offers against realistic future scenarios, not best-case projections.',
      'Overconfidence in a turnaround strategy without concrete evidence is not a substitute for a certain premium offer.',
    ],
    source:
      'Microsoft SEC filing of acquisition proposal (2008); Yahoo-Verizon acquisition agreement (2017)',
    sourceType: 'sec_filing',
  },
  {
    id: 'tech-005',
    title: 'Theranos Fraudulent Blood Testing Technology',
    company: 'Theranos',
    industry: 'technology',
    year: 2003,
    yearDiscovered: 2018,
    summary:
      "Theranos claimed to have revolutionized blood testing with proprietary technology that could run hundreds of tests from a single drop of blood. The technology never worked as claimed, yet the company raised over $700 million, reaching a $9 billion valuation as investors and board members deferred to founder Elizabeth Holmes's authority.",
    decisionContext:
      "Whether investors and board members should have demanded independent validation of Theranos's technology claims before investing hundreds of millions of dollars.",
    outcome: 'catastrophic_failure',
    impactScore: 85,
    estimatedLoss: '$9B',
    biasesPresent: ['authority_bias', 'groupthink', 'confirmation_bias', 'halo_effect'],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Yes Committee', 'Echo Chamber', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 8,
    },
    lessonsLearned: [
      'A prestigious board (Kissinger, Shultz, Mattis) without domain expertise creates authority bias without substantive oversight.',
      'Confirmation bias led investors to accept curated demos rather than demanding rigorous independent validation.',
      'When a company aggressively litigates against whistleblowers rather than addressing their claims, it signals systemic deception.',
    ],
    preDecisionEvidence: {
      document:
        'The Edison platform is capable of performing over 200 standard laboratory tests from a single drop of blood drawn from a fingertip. Our proprietary micro-sample technology eliminates the need for traditional venipuncture, making diagnostic testing faster, cheaper, and accessible to millions. We project deployment across 10,000 pharmacy locations within 24 months.',
      source: 'Elizabeth Holmes, 2014 Theranos Investor Pitch Deck',
      date: '2014-06-15',
      documentType: 'public_statement',
      detectableRedFlags: [
        'No peer-reviewed validation of the Edison device had been published or submitted to any scientific journal',
        'Board of directors included prominent political figures (Kissinger, Shultz, Mattis) but zero medical device or diagnostics experts',
        'Walgreens partnership agreement was signed without Walgreens conducting independent testing of the technology',
        'Internal whistleblower complaints about device accuracy were dismissed and met with legal threats rather than investigation',
      ],
      flaggableBiases: ['halo_effect', 'authority_bias', 'confirmation_bias', 'overconfidence'],
      hypotheticalAnalysis:
        'A decision intelligence platform would have flagged the complete absence of peer-reviewed evidence for a medical device claiming 200+ test capabilities as a critical validation gap. The board composition—heavy on political authority figures, devoid of diagnostics expertise—matches the halo effect and authority bias pattern where prestige substitutes for domain competence. The platform would have recommended independent third-party testing as a mandatory prerequisite before any partnership or investment commitment.',
    },
    keyQuotes: [
      {
        text: 'First they think you\'re crazy, then they fight you, and then all of a sudden you change the world.',
        source: 'Elizabeth Holmes, TEDMED 2014',
        date: '2014',
        speaker: 'Elizabeth Holmes, CEO',
      },
      {
        text: 'I don\'t know anything about her company. But I know she has changed the world.',
        source: 'Henry Kissinger, quoted in Forbes cover story',
        date: '2014-06',
        speaker: 'Henry Kissinger, Theranos board director',
      },
      {
        text: 'Ms. Holmes, you are making choices that can impact public health.',
        source: 'U.S. District Judge Edward J. Davila, sentencing hearing',
        date: '2022-11-18',
        speaker: 'Judge Edward Davila, N.D. Cal.',
      },
    ],
    timeline: [
      {
        date: '2003',
        event: 'Holmes drops out of Stanford and founds Real-Time Cures (later Theranos) at age 19.',
        source: 'John Carreyrou, "Bad Blood" (2018)',
      },
      {
        date: '2013-09',
        event: 'Walgreens begins rollout of Theranos "wellness centers" in Arizona and California stores.',
        source: 'Walgreens–Theranos partnership announcement',
      },
      {
        date: '2014-06',
        event: 'Forbes cover story pegs Holmes\'s net worth at $4.5B based on $9B Theranos valuation.',
        source: 'Forbes, June 2014',
      },
      {
        date: '2015-02',
        event: 'Internal whistleblower Tyler Shultz (grandson of board member George Shultz) files concerns with NY State Department of Health.',
        source: 'Tyler Shultz testimony, U.S. v. Holmes',
      },
      {
        date: '2015-10-15',
        event: 'John Carreyrou publishes WSJ investigation: Theranos running most tests on third-party Siemens machines, not Edison.',
        source: 'Wall Street Journal, October 15 2015',
      },
      {
        date: '2016-01',
        event: 'CMS inspection finds deficiencies "jeopardize patient health and safety" at Theranos Newark lab.',
        source: 'CMS Form 2567 inspection report',
      },
      {
        date: '2018-03-14',
        event: 'SEC charges Theranos, Holmes, and former COO Balwani with "massive fraud."',
        source: 'SEC v. Theranos, Case 5:18-cv-01602',
      },
      {
        date: '2022-01-03',
        event: 'Jury convicts Holmes on 4 counts of investor fraud.',
        source: 'U.S. v. Holmes, N.D. Cal.',
      },
      {
        date: '2022-11-18',
        event: 'Holmes sentenced to 135 months in federal prison.',
        source: 'U.S. v. Holmes, sentencing order',
      },
    ],
    stakeholders: [
      {
        name: 'Elizabeth Holmes',
        role: 'Founder & CEO',
        position: 'advocate',
        notes: 'Convicted on 4 counts of investor fraud; sentenced to 11.25 years federal prison.',
      },
      {
        name: 'Ramesh "Sunny" Balwani',
        role: 'President & COO',
        position: 'advocate',
        notes: 'Convicted separately on 12 counts of fraud; sentenced to 12 years, 11 months.',
      },
      {
        name: 'George Shultz',
        role: 'Board Director (former Secretary of State)',
        position: 'silent',
        notes: 'Initially dismissed grandson Tyler\'s concerns; later acknowledged he had been "deceived."',
      },
      {
        name: 'Henry Kissinger',
        role: 'Board Director (former Secretary of State)',
        position: 'silent',
        notes: 'Publicly admitted having no technical understanding of Theranos technology.',
      },
      {
        name: 'James Mattis',
        role: 'Board Director (4-star Marine General, future SecDef)',
        position: 'silent',
        notes: 'Advocated internally for military deployment despite no validation.',
      },
      {
        name: 'Tyler Shultz',
        role: 'Employee & whistleblower',
        position: 'dissenter',
        notes: 'First internal whistleblower; filed complaint February 2015; faced legal intimidation from family\'s own law firm.',
      },
      {
        name: 'Erika Cheung',
        role: 'Lab associate & whistleblower',
        position: 'dissenter',
        notes: 'Co-blew the whistle alongside Shultz; reported lab deficiencies to CMS.',
      },
    ],
    counterfactual: {
      recommendation:
        'Board requires peer-reviewed validation of Edison technology as a condition of any partnership; Walgreens insists on independent third-party testing before rolling out to stores; early-stage investors (Draper, Oracle\'s Ellison, DeVos family) condition investment on technical due diligence from a diagnostics-specialist firm; board refreshes to include at least two diagnostics or molecular biology experts alongside political figures.',
      rationale:
        'Theranos is the modern canonical halo-effect/authority-bias failure. Every due-diligence failure traces to the same structural problem: prestigious board, zero domain expertise. The decision to waive technical validation in the presence of "Kissinger and Shultz" is the bias.',
      estimatedOutcome:
        'Theranos never reaches $9B valuation; likely pivots to a legitimate smaller-scale diagnostics company or winds down by 2013 without harming patients. The 11.5M+ blood tests later voided by Theranos itself never occur.',
    },
    dqiEstimate: {
      score: 19,
      grade: 'F',
      topBiases: ['authority_bias', 'halo_effect', 'confirmation_bias'],
      rationale:
        'No independent technical validation for a medical device was a binary disqualifier. Board composition heavy on political authority with zero diagnostics expertise is the exact pattern the DQI framework is designed to flag. Aggressive litigation against internal whistleblowers is the operational tell.',
    },
    postMortemCitations: [
      {
        label: 'John Carreyrou, "Bad Blood: Secrets and Lies in a Silicon Valley Startup"',
        year: 2018,
      },
      {
        label: 'SEC v. Theranos, Inc., Elizabeth Holmes, and Ramesh Balwani (Case 5:18-cv-01602)',
        year: 2018,
      },
      {
        label: 'U.S. v. Elizabeth A. Holmes (N.D. Cal., verdict & sentencing)',
        year: 2022,
      },
      {
        label: 'HBO documentary "The Inventor: Out for Blood in Silicon Valley"',
        year: 2019,
      },
    ],
    relatedCases: ['tech-006', 'fin-008'],
    patternFamily: 'Founder Hubris + Prestige-Over-Expertise Board',
    source:
      'John Carreyrou, "Bad Blood: Secrets and Lies in a Silicon Valley Startup" (2018); SEC v. Theranos complaint (2018)',
    sourceType: 'news_investigation',
  },
  {
    id: 'tech-006',
    title: 'WeWork Failed IPO and Valuation Collapse',
    company: 'WeWork',
    industry: 'technology',
    year: 2019,
    yearDiscovered: 2019,
    summary:
      "WeWork's attempted IPO in 2019 exposed massive governance failures and unsustainable economics, causing its valuation to plummet from $47 billion to under $8 billion. Founder Adam Neumann exercised unchecked authority while SoftBank and other investors inflated the valuation through groupthink-driven funding rounds.",
    decisionContext:
      'Whether to proceed with a public offering at a $47 billion valuation despite governance red flags including related-party transactions, dual-class shares, and a founder-controlled board.',
    outcome: 'catastrophic_failure',
    impactScore: 80,
    estimatedLoss: '$39B',
    biasesPresent: [
      'overconfidence_bias',
      'authority_bias',
      'groupthink',
      'bandwagon_effect',
      'framing_effect',
      'halo_effect',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Yes Committee', 'Optimism Trap', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 6,
    },
    lessonsLearned: [
      'Labeling a real estate company as a "technology" company to justify higher multiples is a form of framing bias that sophisticated investors should detect.',
      'Concentrated investor relationships (SoftBank) can create an echo chamber that validates increasingly unrealistic valuations.',
      'Governance structures that grant founders unchecked control are a warning sign, not a feature.',
    ],
    preDecisionEvidence: {
      document:
        'We define "Community Adjusted EBITDA" as net loss excluding interest expense, income taxes, depreciation and amortization, stock-based compensation, and building and community-level operating expenses. We believe this metric provides a useful measure of our operating performance by eliminating the impact of costs that we do not consider indicative of our core operations.',
      source: 'WeWork Companies Inc., S-1 Registration Statement filed with SEC',
      date: '2019-08-14',
      documentType: 'sec_filing',
      detectableRedFlags: [
        'Net loss of $1.9 billion presented as profitable through "Community Adjusted EBITDA" which excluded nearly all major cost categories',
        'CEO Adam Neumann controlled majority voting power through super-voting share structure, insulating management from board oversight',
        'Related-party transactions including a $5.9 million payment to a Neumann-controlled entity for the "We" trademark',
        'No credible path to profitability demonstrated despite cumulative losses exceeding $4 billion',
      ],
      flaggableBiases: ['framing_effect', 'overconfidence', 'anchoring_bias', 'narrative_fallacy'],
      hypotheticalAnalysis:
        'A decision intelligence platform would have immediately flagged "Community Adjusted EBITDA" as a framing effect designed to redefine profitability by excluding the majority of actual operating costs. The $47 billion valuation anchored to SoftBank\'s last private round would have been challenged against comparable public real estate companies trading at a fraction of that multiple. The concentration of voting power and related-party self-dealing would have triggered governance risk alerts incompatible with public market standards.',
    },
    keyQuotes: [
      {
        text: 'The We Company\'s mission is to elevate the world\'s consciousness.',
        source: 'WeWork S-1 Registration Statement',
        date: '2019-08-14',
        speaker: 'WeWork S-1, opening line',
      },
      {
        text: 'Adam is a unique leader who has proven he can simultaneously be a visionary, operator, and innovator.',
        source: 'Masayoshi Son interview, CNBC',
        date: '2018',
        speaker: 'Masayoshi Son, SoftBank CEO',
      },
      {
        text: 'I think the issue was valuation, not the company.',
        source: 'Adam Neumann post-ouster commentary, NYT',
        date: '2019-12',
        speaker: 'Adam Neumann, co-founder (after removal)',
      },
      {
        text: 'Adam\'s personal dealings with the company were unacceptable.',
        source: 'SoftBank statement on WeWork intervention',
        date: '2019-10-23',
        speaker: 'SoftBank, October 2019 statement',
      },
    ],
    timeline: [
      {
        date: '2010-02',
        event: 'Adam Neumann and Miguel McKelvey co-found WeWork in New York.',
        source: 'Brown & Farrell, "The Cult of We"',
      },
      {
        date: '2017-08',
        event: 'SoftBank leads $4.4B investment at $20B valuation; Son reportedly doubles the round after a 12-minute tour.',
        source: 'Brown & Farrell (2021); Bloomberg reporting',
      },
      {
        date: '2019-01',
        event: 'SoftBank valuation round of $2B at $47B post-money — peak valuation.',
        source: 'WeWork 8-K equivalents and press reporting',
      },
      {
        date: '2019-04',
        event: 'Neumann sells ~$700M of his shares through loans and secondary transactions before IPO.',
        source: 'WSJ, July 2019',
      },
      {
        date: '2019-08-14',
        event: 'The We Company files S-1 for IPO.',
        source: 'SEC S-1 filing',
      },
      {
        date: '2019-09-17',
        event: 'WeWork postpones IPO amid investor pushback over governance, valuation, related-party transactions.',
        source: 'We Company press release',
      },
      {
        date: '2019-09-24',
        event: 'Neumann steps down as CEO under SoftBank pressure.',
        source: 'We Company 8-K equivalent, September 24 2019',
      },
      {
        date: '2019-10-22',
        event: 'SoftBank rescue package values WeWork at $8B — an 83% decline from the $47B January round. Neumann receives ~$1.7B exit package.',
        source: 'SoftBank investor presentation, October 2019',
      },
      {
        date: '2021-10-21',
        event: 'WeWork goes public via SPAC (BowX Acquisition) at ~$9B valuation.',
        source: 'WeWork / BowX merger announcement',
      },
      {
        date: '2023-11-06',
        event: 'WeWork files for Chapter 11 bankruptcy.',
        source: 'D.N.J. Case No. 23-19865',
      },
    ],
    stakeholders: [
      {
        name: 'Adam Neumann',
        role: 'Co-founder & CEO',
        position: 'advocate',
        notes: 'Held 20:1 super-voting shares pre-IPO; removed as CEO September 2019 with ~$1.7B exit package.',
      },
      {
        name: 'Miguel McKelvey',
        role: 'Co-founder & CCO',
        position: 'silent',
      },
      {
        name: 'Masayoshi Son',
        role: 'SoftBank Group CEO (lead investor)',
        position: 'advocate',
        notes: 'Pushed WeWork valuation from $5B (2015) to $47B (2019). Later acknowledged "my investment judgment was poor."',
      },
      {
        name: 'Rajeev Misra',
        role: 'SoftBank Vision Fund CEO',
        position: 'advocate',
        notes: 'Led SoftBank Vision Fund investments; central to the valuation escalation.',
      },
      {
        name: 'Bruce Dunlevie',
        role: 'Benchmark Capital partner & WeWork board director',
        position: 'silent',
        notes: 'Benchmark were early investors; board declined to block the governance structure.',
      },
      {
        name: 'Lew Frankfort',
        role: 'Board director (former Coach CEO)',
        position: 'silent',
      },
      {
        name: 'Public market investors',
        role: 'S-1 audience',
        position: 'dissenter',
        notes: 'The market itself rejected the IPO — the single clearest "decision intelligence" check in the timeline was the investor community\'s refusal to buy the S-1 narrative.',
      },
    ],
    counterfactual: {
      recommendation:
        'Board eliminates super-voting share structure in 2017 before SoftBank investment; independent directors block the Neumann "We" trademark payment; SoftBank caps valuation at $15–20B (real-estate operator multiples); Neumann\'s related-party real estate holdings divested pre-IPO; Community Adjusted EBITDA not permitted as a headline metric.',
      rationale:
        'WeWork is the canonical "framing effect + founder control + capital abundance" case. Each individual governance failure was addressable. The S-1 rejection by public markets is retrospective proof that public-investor-grade decision intelligence existed — it was just walled off from SoftBank\'s Vision Fund judgment.',
      estimatedOutcome:
        'WeWork IPO at $15–18B in 2019, modeled honestly as a real estate operator with premium amenities. Neumann exits as founder-chairman on normal terms. Company could plausibly grow into IWG-class competitor ($10B+ market cap by 2023) rather than bankrupt.',
    },
    dqiEstimate: {
      score: 24,
      grade: 'F',
      topBiases: ['framing_effect', 'overconfidence_bias', 'authority_bias'],
      rationale:
        'Community Adjusted EBITDA alone is a framing-effect catastrophe. Combined with Neumann\'s 20:1 voting control, related-party self-dealing, and SoftBank\'s anchor-investor status suppressing independent scrutiny, this is a decision process with no working circuit-breaker — exactly what DQI is designed to identify.',
    },
    postMortemCitations: [
      {
        label: 'Eliot Brown & Maureen Farrell, "The Cult of We: WeWork, Adam Neumann, and the Great Startup Delusion"',
        year: 2021,
      },
      {
        label: 'Reeves Wiedeman, "Billion Dollar Loser: The Epic Rise and Spectacular Fall of Adam Neumann and WeWork"',
        year: 2020,
      },
      {
        label: 'Hulu documentary "WeWork: or the Making and Breaking of a $47 Billion Unicorn"',
        year: 2021,
      },
      {
        label: 'WeWork Chapter 11 filing (D.N.J. Case No. 23-19865)',
        year: 2023,
      },
    ],
    relatedCases: ['tech-005', 'tech-004'],
    patternFamily: 'Founder Hubris + Capital Abundance',
    source:
      'WeWork S-1 Filing (2019, withdrawn); Eliot Brown and Maureen Farrell, "The Cult of We" (2021)',
    sourceType: 'sec_filing',
  },
  {
    id: 'tech-007',
    title: 'Quibi Streaming Platform Failure',
    company: 'Quibi',
    industry: 'technology',
    year: 2020,
    yearDiscovered: 2020,
    summary:
      'Quibi raised $1.75 billion to launch a mobile-only short-form video platform, shutting down just six months after launch. Founders Jeffrey Katzenberg and Meg Whitman were overconfident in the concept, ignored market research showing weak demand, and planned around assumptions that proved false when COVID-19 changed viewing habits.',
    decisionContext:
      'Whether to launch a premium mobile-only streaming service with short-form content in a market already saturated with free alternatives like YouTube and TikTok.',
    outcome: 'catastrophic_failure',
    impactScore: 70,
    estimatedLoss: '$1.75B',
    biasesPresent: [
      'overconfidence_bias',
      'confirmation_bias',
      'planning_fallacy',
      'groupthink',
      'anchoring_bias',
      'halo_effect',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Golden Child'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 5,
    },
    lessonsLearned: [
      'Celebrity founder status can attract capital but does not validate a flawed product-market hypothesis.',
      'Planning fallacy led to overly optimistic subscriber projections that never materialized.',
      'Confirmation bias in market research means hearing what you want from focus groups rather than what the data actually shows.',
    ],
    source:
      'Quibi investor communications (2020); Lucas Shaw, "Inside the Meltdown of Quibi" (Bloomberg Businessweek, 2020)',
    sourceType: 'news_investigation',
  },
  {
    id: 'tech-008',
    title: 'Google+ Social Network Failure',
    company: 'Google',
    industry: 'technology',
    year: 2011,
    yearDiscovered: 2019,
    summary:
      'Google invested over $500 million in Google+, a social network designed to compete with Facebook. Despite low user engagement and internal data showing the platform was failing, Google continued investing and even integrated Google+ into other products, forcing adoption rather than earning it organically.',
    decisionContext:
      "Whether to continue investing in and forcing adoption of Google+ across Google's product ecosystem despite consistently low engagement metrics.",
    outcome: 'failure',
    impactScore: 55,
    estimatedLoss: '$500M+',
    biasesPresent: [
      'confirmation_bias',
      'overconfidence_bias',
      'bandwagon_effect',
      'sunk_cost_fallacy',
      'planning_fallacy',
    ],
    primaryBias: 'confirmation_bias',
    toxicCombinations: ['Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 20,
    },
    lessonsLearned: [
      'Forcing user adoption through product integration is not a substitute for genuine product-market fit.',
      "Confirmation bias led leadership to interpret forced signups as organic growth, masking the platform's fundamental engagement problem.",
      'Overconfidence in engineering capability ignores the network effects that protect established social platforms.',
    ],
    preDecisionEvidence: {
      document: 'Emerald Sea Project Memo: Google+ Integration Strategy',
      source: 'Vic Gundotra, VP of Engineering',
      date: '2011-01-15',
      documentType: 'strategy_document',
      detectableRedFlags: [
        'Forced integration across all Google products was mandated top-down without any user demand signals or market research justification',
        "Internal employee surveys showed widespread skepticism about the platform's ability to compete with Facebook",
        "Facebook's network effects and switching costs were systematically underestimated in the project rationale",
        'No organic growth mechanism was identified — the strategy relied entirely on coerced adoption through product bundling',
      ],
      flaggableBiases: [
        'confirmation_bias',
        'overconfidence_bias',
        'bandwagon_effect',
        'planning_fallacy',
      ],
      hypotheticalAnalysis:
        "A decision intelligence tool would have detected overconfidence bias in the top-down mandate and confirmation bias in the lack of internal dissent channels. The absence of any user-demand signal in the project memo — combined with the forced integration strategy — would have triggered high-confidence warnings about the 'build it and they will come' assumption being driven by planning fallacy rather than evidence.",
    },
    source:
      'Ars Technica post-mortem analysis (2019); Google official blog announcement of Google+ shutdown (2018)',
    sourceType: 'post_mortem',
  },
  {
    id: 'tech-009',
    title: 'IBM Watson Health Strategic Failure',
    company: 'IBM',
    industry: 'technology',
    year: 2015,
    yearDiscovered: 2022,
    summary:
      'IBM invested over $5 billion acquiring companies and building Watson Health, promising AI-driven healthcare transformation. The technology consistently failed to deliver on marketing claims, with oncology recommendations sometimes being unsafe. IBM sold the division for approximately $1 billion in 2022.',
    decisionContext:
      "Whether to continue investing billions in Watson Health's AI-driven oncology and healthcare analytics products despite repeated failures to match clinical accuracy claims in real-world settings.",
    outcome: 'failure',
    impactScore: 70,
    estimatedLoss: '$5B',
    biasesPresent: [
      'overconfidence_bias',
      'planning_fallacy',
      'confirmation_bias',
      'sunk_cost_fallacy',
      'anchoring_bias',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap', 'Sunk Ship'],
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 15,
    },
    lessonsLearned: [
      'Marketing AI capabilities before the technology can reliably deliver creates a credibility gap that erodes customer trust.',
      'Planning fallacy in AI healthcare deployments consistently underestimates the difficulty of working with messy, unstructured clinical data.',
      'Confirmation bias led IBM to showcase cherry-picked success stories while ignoring systemic accuracy failures.',
    ],
    source:
      'Casey Ross and Ike Swetlitz, "IBM\'s Watson Supercomputer Recommended Unsafe and Incorrect Cancer Treatments" (STAT News, 2018)',
    sourceType: 'news_investigation',
  },
  {
    id: 'tech-010',
    title: 'Juicero Press Failure',
    company: 'Juicero',
    industry: 'technology',
    year: 2013,
    yearDiscovered: 2017,
    summary:
      'Juicero raised $120 million to build a $400 internet-connected juice press that squeezed proprietary pre-packaged fruit pouches. Bloomberg reporters demonstrated the pouches could be squeezed by hand just as effectively, exposing the product as an over-engineered solution to a nonexistent problem.',
    decisionContext:
      'Whether to invest $120 million in a Wi-Fi-connected juicing machine requiring proprietary pouches, rather than validating whether consumers needed or wanted the product.',
    outcome: 'catastrophic_failure',
    impactScore: 40,
    estimatedLoss: '$120M',
    biasesPresent: [
      'overconfidence_bias',
      'confirmation_bias',
      'planning_fallacy',
      'groupthink',
      'bandwagon_effect',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Optimism Trap'],
    contextFactors: {
      monetaryStakes: 'medium',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 5,
    },
    lessonsLearned: [
      'Overconfidence in Silicon Valley\'s "disrupt everything" mentality can lead investors to fund solutions searching for problems.',
      'Planning fallacy in hardware startups is especially dangerous because physical products cannot pivot as easily as software.',
      'Basic product validation (can a human squeeze the pouch by hand?) should precede any significant capital investment.',
    ],
    source:
      'Ellen Huet and Olivia Zaleski, "Silicon Valley\'s $400 Juicer May Be Feeling the Squeeze" (Bloomberg, 2017)',
    sourceType: 'news_investigation',
  },
];
