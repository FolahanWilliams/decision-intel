import { CaseStudy } from '../types';

export const TECHNOLOGY_SUCCESS_CASES: CaseStudy[] = [
  {
    id: 'cs-success-tech-001',
    title: 'Apple iPhone Pivot: Cannibalizing the iPod',
    company: 'Apple',
    industry: 'technology',
    year: 2007,
    yearRealized: 2012,
    summary:
      'In 2007, the iPod generated 40% of Apple\'s revenue. Steve Jobs launched the iPhone knowing it would cannibalize iPod sales — which it did, with iPod revenue declining 70% by 2012. But the iPhone became the most profitable product in consumer electronics history, generating over $200 billion in cumulative revenue by 2012. Jobs explicitly overrode internal resistance from the iPod team, framing the decision as "if we don\'t cannibalize ourselves, someone else will."',
    decisionContext:
      "Whether to launch a smartphone product that would directly cannibalize Apple's most profitable product line (iPod), risking short-term revenue disruption for uncertain long-term market opportunity.",
    outcome: 'exceptional_success',
    impactScore: 98,
    estimatedImpact: '$3T+ market cap created; redefined mobile computing',
    impactDirection: 'positive',
    biasesPresent: ['overconfidence_bias', 'loss_aversion', 'sunk_cost_fallacy', 'anchoring_bias'],
    primaryBias: 'loss_aversion',
    toxicCombinations: [],
    beneficialPatterns: ['The Controlled Burn'],
    biasesManaged: ['loss_aversion', 'sunk_cost_fallacy'],
    mitigationFactors: [
      "CEO personally championed the disruption of the company's own cash cow",
      'Framed as existential necessity rather than optional growth bet',
      'Iterative development through internal prototyping before public commitment',
      'Maintained iPod team morale by positioning iPhone as evolution, not replacement',
    ],
    survivorshipBiasRisk: 'medium',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: true,
      unanimousConsensus: false,
      participantCount: 12,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'Loss aversion was present but managed through a "cannibalize yourself first" framing that converted fear of loss into competitive urgency.',
      'The sunk cost in iPod ecosystem was explicitly acknowledged and then deliberately set aside — the team was told "the iPod has done its job."',
      "Survivorship bias risk is medium: Jobs's conviction happened to align with market reality, but a less capable execution could have destroyed both product lines.",
    ],
    source:
      'Walter Isaacson, "Steve Jobs" (2011); Apple Inc. 10-K filings (2007-2012); Yukari Iwatani Kane, "Haunted Empire" (2014)',
    sourceType: 'biography',
    preDecisionEvidence: {
      document:
        'Steve Jobs, Macworld keynote (January 9, 2007): "Today Apple is going to reinvent the phone... An iPod, a phone, an internet communicator — these are not three separate devices. This is one device." Internal Apple board presentation (2006, described in Isaacson biography): Jobs argued "the phone is going to eat the iPod. The question is whether it\'s going to be our phone or someone else\'s." The iPod generated $9.15 billion in FY2006 — roughly 40% of Apple\'s $19.3 billion total revenue. iPod team members privately expressed concern that the iPhone would "kill our baby."',
      source:
        'Macworld 2007 keynote transcript; Isaacson "Steve Jobs" (2011) Ch. 36; Apple 10-K FY2006',
      date: '2007-01-09',
      documentType: 'public_statement',
      detectableRedFlags: [
        'Cannibalizing a product line worth 40% of total revenue — extreme concentration risk',
        'No proven track record in telecommunications or carrier relationships',
        'iPod team expressing internal dissent that was overridden rather than addressed through process',
        'CEO conviction-driven decision without formal quantitative cannibalization modeling',
      ],
      flaggableBiases: [
        'overconfidence_bias',
        'loss_aversion',
        'sunk_cost_fallacy',
        'anchoring_bias',
      ],
      hypotheticalAnalysis:
        'DI Platform would flag: HIGH-RISK loss aversion pattern — 40% revenue concentration at risk. But critically, it would ALSO detect the "Controlled Burn" beneficial pattern: leadership explicitly acknowledging the cannibalization risk and framing it as strategic necessity ("if we don\'t, someone else will"). The platform would note: biases ARE present (overconfidence, anchoring to iPod success) but mitigation factors are active — iterative prototyping, existential framing, and CEO willing to destroy own cash cow. Recommendation: Proceed, but establish quantitative cannibalization tracking milestones. Ensure iPod team has a role in iPhone development to prevent organizational resistance. The key distinction from a failure case: the biases were RECOGNIZED and MANAGED, not ignored.',
    },
  },
  {
    id: 'cs-success-tech-002',
    title: 'Netflix Streaming Pivot from DVD-by-Mail',
    company: 'Netflix',
    industry: 'technology',
    year: 2007,
    yearRealized: 2013,
    summary:
      'Netflix launched streaming in 2007 while its DVD-by-mail business was thriving with 7.5 million subscribers. CEO Reed Hastings deliberately invested in streaming infrastructure at the expense of DVD margins, knowing it would temporarily depress earnings. The 2011 Qwikster debacle (attempting to split DVD and streaming) temporarily cost 800,000 subscribers, but Hastings course-corrected. By 2013, streaming subscribers surpassed DVD subscribers, and Netflix had redefined media consumption globally.',
    decisionContext:
      'Whether to invest heavily in streaming technology and content licensing at the expense of the highly profitable DVD-by-mail business, before broadband penetration made streaming universally viable.',
    outcome: 'exceptional_success',
    impactScore: 95,
    estimatedImpact: '$250B+ market cap created; disrupted $600B global media industry',
    impactDirection: 'positive',
    biasesPresent: ['status_quo_bias', 'loss_aversion', 'planning_fallacy', 'anchoring_bias'],
    primaryBias: 'status_quo_bias',
    toxicCombinations: [],
    beneficialPatterns: ['The Controlled Burn', 'The Patient Bet'],
    biasesManaged: ['status_quo_bias', 'loss_aversion'],
    mitigationFactors: [
      "CEO studied Blockbuster's failure to pivot and used it as a counter-example",
      'Gradual streaming investment allowed learning before full commitment',
      'Willingness to admit and reverse the Qwikster mistake quickly',
      'Board supported multi-year margin compression for strategic positioning',
    ],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 10,
      dissentEncouraged: true,
      externalAdvisors: false,
      iterativeProcess: true,
    },
    lessonsLearned: [
      "Studying competitors' failures (Blockbuster) as a deliberate debiasing technique helped Netflix leadership overcome status quo bias.",
      'The Qwikster mistake shows that even correct strategic direction can fail tactically — but the willingness to quickly reverse course preserved the strategic vision.',
      'Planning fallacy was present (streaming took longer to become profitable than projected) but was mitigated by maintaining the DVD business as a cash flow bridge.',
    ],
    source:
      'Reed Hastings and Erin Meyer, "No Rules Rules" (2020); Netflix 10-K filings (2007-2013); Gina Keating, "Netflixed" (2012)',
    sourceType: 'annual_report',
    preDecisionEvidence: {
      document:
        'Netflix 2007 Annual Letter to Shareholders (January 2008): "We named our company Netflix, not DVD-by-mail, because we believed the future of movie delivery was over the internet... We started streaming in January 2007 at no extra charge to our DVD subscribers. We expect streaming to be a small part of the value for some years to come." The letter explicitly warned investors that streaming investment would compress margins: "We are investing heavily in streaming, which will reduce our operating margins in the near term." Q4 2007 earnings call: Hastings stated "The DVD business is still growing, but the future is clearly streaming."',
      source:
        'Netflix 2007 Annual Letter to Shareholders; Netflix Q4 2007 Earnings Call Transcript; Netflix 10-K FY2007',
      date: '2008-01-25',
      documentType: 'public_statement',
      detectableRedFlags: [
        'Investing in streaming before broadband penetration supported mass adoption — only 55% of US homes had broadband in 2007',
        'Margin compression acknowledged upfront — short-term earnings would decline',
        "DVD business still growing — classic innovator's dilemma of investing away from current strength",
        'No proven streaming content licensing model existed yet — infrastructure bet on unbuilt ecosystem',
      ],
      flaggableBiases: ['status_quo_bias', 'loss_aversion', 'planning_fallacy', 'anchoring_bias'],
      hypotheticalAnalysis:
        'DI Platform would flag: "Patient Bet" + "Controlled Burn" beneficial patterns detected. Key distinction: this decision acknowledges risk transparently (CEO publicly warning about margin compression) rather than hiding it. Status quo bias is present in the organization (DVD still growing) but leadership is ACTIVELY managing it by studying Blockbuster\'s failure. Planning fallacy risk: streaming profitability timeline likely underestimated — platform would recommend maintaining DVD cash flow bridge for 3-5 years longer than management projects. Verdict: biases present but mitigation factors are strong. Iterative rollout (streaming free for existing subscribers) de-risks the bet. Recommendation: Proceed with caution on timeline — ensure DVD business is not prematurely cannibalized before streaming economics are proven.',
    },
    keyQuotes: [
      {
        text: "Most companies that are great at something don't become great at new things... because they don't want to disrupt themselves.",
        source: 'Reed Hastings interview, Charlie Rose',
        date: '2013',
        speaker: 'Reed Hastings, CEO',
      },
      {
        text: 'Why are we launching a new service with a worse user experience... Because we would rather be cannibalized by ourselves than by someone else.',
        source: 'Reed Hastings internal memo, paraphrased in "No Rules Rules"',
        date: '2011',
        speaker: 'Reed Hastings, CEO',
      },
      {
        text: 'In hindsight, I slid into arrogance based upon past success.',
        source: 'Reed Hastings public apology re: Qwikster',
        date: '2011-10-10',
        speaker: 'Reed Hastings, CEO',
      },
      {
        text: "We didn't want to become the next Blockbuster.",
        source: 'Reed Hastings, "No Rules Rules"',
        date: '2020',
        speaker: 'Reed Hastings, CEO',
      },
    ],
    timeline: [
      {
        date: '2007-01',
        event:
          'Netflix launches "Watch Now" streaming as free add-on for DVD subscribers — 1,000 titles initially.',
        source: 'Netflix Q1 2007 shareholder letter',
      },
      {
        date: '2008-10',
        event:
          'Netflix signs Starz Play content deal — ~$30M/year for streaming rights to premium content.',
        source: 'Netflix Q4 2008 earnings call',
      },
      {
        date: '2010-11',
        event:
          'Netflix launches standalone streaming plan ($7.99/mo) — decoupling streaming from DVD pricing.',
        source: 'Netflix Q4 2010 shareholder letter',
      },
      {
        date: '2011-07-12',
        event:
          'Price hike splits DVD and streaming plans — customer backlash loses ~800K subscribers.',
        source: 'Netflix Q3 2011 shareholder letter',
      },
      {
        date: '2011-09-18',
        event: 'Hastings announces Qwikster spinoff of DVD business.',
        source: 'Netflix blog post, September 18 2011',
      },
      {
        date: '2011-10-10',
        event: 'Netflix abandons Qwikster after 23 days — Hastings publicly apologizes.',
        source: 'Netflix press release, October 10 2011',
      },
      {
        date: '2013-02-01',
        event:
          'House of Cards launches — first high-profile Netflix Original Series, committing the company to original content.',
        source: 'Netflix press release, February 1 2013',
      },
      {
        date: '2013-12',
        event:
          'International streaming expansion into 41 Latin American countries; streaming revenue overtakes DVD for the first time.',
        source: 'Netflix Q4 2013 shareholder letter',
      },
    ],
    stakeholders: [
      {
        name: 'Reed Hastings',
        role: 'Co-founder & CEO',
        position: 'advocate',
        notes: 'Drove the streaming pivot and owned the Qwikster reversal publicly.',
      },
      {
        name: 'Ted Sarandos',
        role: 'Chief Content Officer',
        position: 'advocate',
        notes: 'Led the bet on original content; later co-CEO.',
      },
      {
        name: 'Andy Rendich',
        role: 'CEO, Qwikster (briefly) / former operations lead',
        position: 'overruled',
        notes:
          'Was tapped to run the spun-off DVD business; role eliminated when Qwikster was reversed.',
      },
      {
        name: 'Netflix Board (including Jay Hoag, Richard Barton)',
        role: 'Board of Directors',
        position: 'advocate',
        notes:
          'Tolerated multi-year margin compression and the Qwikster reversal without ousting Hastings — rare governance patience.',
      },
      {
        name: 'Wall Street analysts (e.g., Michael Pachter)',
        role: 'External skeptics',
        position: 'dissenter',
        notes:
          'Repeatedly downgraded Netflix through 2011–2013; vindicated a subscriber-base view of value only after 2014.',
      },
    ],
    counterfactual: {
      recommendation:
        '(This IS the counterfactual to Blockbuster.) Netflix\'s process — transparent margin compression guidance, iterative launch, deliberate study of Blockbuster\'s failure, willingness to reverse Qwikster within 23 days — is the canonical "good decision under biased conditions" model.',
      rationale:
        'The informative feature of this case is not what went right in 2007, but what Hastings *could have gotten wrong* and caught. The Qwikster reversal is the most important data point — a board tolerant of strategic reversal is the ultimate anti-sunk-cost institutional asset.',
      estimatedOutcome:
        'Netflix becomes what it actually became — $200B+ market cap category-definer — precisely because the biases present (status quo, loss aversion, planning fallacy) were *named and actively managed* rather than denied.',
    },
    dqiEstimate: {
      score: 84,
      grade: 'B',
      topBiases: ['planning_fallacy', 'anchoring_bias'],
      rationale:
        'Not a perfect A (the 2011 Qwikster misstep is a real planning-fallacy failure) but an exceptional B — dissent-welcoming process, deliberate de-biasing via studying Blockbuster, transparent risk communication to shareholders, and organizational willingness to reverse course.',
    },
    postMortemCitations: [
      {
        label:
          'Reed Hastings & Erin Meyer, "No Rules Rules: Netflix and the Culture of Reinvention"',
        year: 2020,
      },
      {
        label: 'Gina Keating, "Netflixed: The Epic Battle for America\'s Eyeballs"',
        year: 2012,
      },
      {
        label:
          'Harvard Business School Case 615-007: Netflix: Designing, Pricing, and Managing Its Streaming Service',
        year: 2014,
      },
      {
        label: 'Netflix 10-K filings (2007–2013)',
      },
    ],
    relatedCases: ['tech-003', 'tech-001'],
    patternFamily: 'Self-Disruption with Dissent-Tolerant Governance',
  },
  {
    id: 'cs-success-tech-003',
    title: 'Amazon AWS: The Accidental $80B Business',
    company: 'Amazon',
    industry: 'technology',
    year: 2003,
    yearRealized: 2015,
    summary:
      "Amazon Web Services began as an internal infrastructure project in 2003, launched publicly in 2006, and grew into a $80+ billion annual revenue business by 2022. Jeff Bezos bet that Amazon's internal computing infrastructure could be productized for external developers. Wall Street analysts dismissed the project as a distraction from e-commerce. Andy Jassy led the effort with a small team, operating with minimal resources for years before reaching profitability.",
    decisionContext:
      'Whether to invest in building and selling cloud infrastructure as a service — a market that did not yet exist — while the core e-commerce business was still proving its own profitability to skeptical investors.',
    outcome: 'exceptional_success',
    impactScore: 97,
    estimatedImpact: '$80B+ annual revenue; created $1.5T cloud computing market',
    impactDirection: 'positive',
    biasesPresent: ['overconfidence_bias', 'anchoring_bias', 'confirmation_bias'],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: [],
    beneficialPatterns: ['The Patient Bet', 'The Platform Leap'],
    biasesManaged: ['anchoring_bias'],
    mitigationFactors: [
      'Started with internal customer (Amazon.com) providing real-world validation',
      'Launched with simple services (S3, EC2) and iterated based on developer feedback',
      'Bezos\'s "Day 1" philosophy institutionalized long-term thinking over quarterly metrics',
      'Small autonomous team structure prevented bureaucratic interference',
    ],
    survivorshipBiasRisk: 'medium',
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 8,
      dissentEncouraged: true,
      externalAdvisors: false,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'Overconfidence bias was present (Bezos believed Amazon could serve external developers better than anyone) but was mitigated by iterative development and customer feedback loops.',
      'Anchoring bias was managed by NOT anchoring to competitor pricing or existing market definitions — AWS created a new category.',
      "Survivorship risk is medium: the bet could have easily failed if the internal infrastructure wasn't genuinely world-class or if enterprise adoption had been slower.",
    ],
    source:
      'Brad Stone, "The Everything Store" (2013); Amazon 10-K filings (2006-2015); AWS re:Invent keynotes (2012-2015)',
    sourceType: 'annual_report',
  },
  {
    id: 'cs-success-tech-004',
    title: 'Microsoft Satya Nadella Cloud Transformation',
    company: 'Microsoft',
    industry: 'technology',
    year: 2014,
    yearRealized: 2020,
    summary:
      'When Satya Nadella became CEO in 2014, Microsoft was perceived as a declining legacy tech company, with its stock flat for 14 years. Nadella pivoted the company from "Windows first" to "cloud first, mobile first," openly embracing Linux and open source — heresy in Microsoft\'s culture. He killed the Nokia phone acquisition strategy, invested massively in Azure, and shifted Office to a subscription model. Microsoft\'s market cap grew from $300B to $2.5T+ by 2024.',
    decisionContext:
      'Whether to abandon the Windows-centric strategy that had defined Microsoft for 30 years and pivot to cloud services and subscription models, requiring cultural transformation and the deliberate obsolescence of legacy cash cows.',
    outcome: 'exceptional_success',
    impactScore: 96,
    estimatedImpact: '$2.2T+ in market cap created (2014-2024)',
    impactDirection: 'positive',
    biasesPresent: ['status_quo_bias', 'sunk_cost_fallacy', 'loss_aversion', 'anchoring_bias'],
    primaryBias: 'status_quo_bias',
    toxicCombinations: [],
    beneficialPatterns: ['The Controlled Burn', "The Outsider's Lens", 'The Platform Leap'],
    biasesManaged: ['status_quo_bias', 'sunk_cost_fallacy', 'loss_aversion'],
    mitigationFactors: [
      'New CEO from outside the Windows division brought fresh perspective',
      'Explicitly articulated that the "Windows first" era was over — named the bias',
      'Embraced "growth mindset" (Carol Dweck) as cultural transformation framework',
      'Brought in external leaders and encouraged internal dissenters to speak up',
      'Wrote off the Nokia acquisition ($7.6B) immediately rather than doubling down',
    ],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 15,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      "Nadella's willingness to write off the Nokia acquisition immediately demonstrated that sunk cost management requires visible, painful action — not just words.",
      "Embracing Linux and open source — the opposite of Microsoft's historical competitive strategy — showed that overcoming status quo bias sometimes requires doing the most culturally uncomfortable thing.",
      'The "growth mindset" framework gave employees a psychological model for understanding why change was necessary, reducing resistance at every level.',
    ],
    preDecisionEvidence: {
      document:
        "Satya Nadella's February 4 2014 memo to all Microsoft employees ('Our Industry Does Not Respect Tradition — It Only Respects Innovation') named the strategic pivot: 'We will reinvent productivity to empower every person and every organization on the planet to do more and achieve more.' Within the first year, Nadella publicly embraced Linux (October 2014 'Microsoft Loves Linux' event), open-sourced .NET Core, launched Office for iPad (March 2014), and wrote down the $7.6B Nokia acquisition in Q4 FY2015. Every action was visible cultural signaling that Windows-first was ending.",
      source:
        "Satya Nadella, 'Hit Refresh' (2017); Nadella employee memos Feb 2014, July 2014; Microsoft 10-K FY2015 (Nokia impairment)",
      date: '2014-02-04',
      documentType: 'internal_memo',
      detectableRedFlags: [
        '(Here the "red flags" are positive decision-intelligence markers — the mitigation factors)',
        'CEO explicitly named the status quo bias ("Windows first") to overcome it',
        'Nokia $7.6B writedown in first 18 months — sunk-cost management demonstrated visibly',
        'External cultural framework (Carol Dweck growth mindset) adopted as organizational language',
        'Office for iPad launched within first 50 days — prior leadership had blocked this for years',
      ],
      flaggableBiases: ['status_quo_bias', 'sunk_cost_fallacy', 'loss_aversion'],
      hypotheticalAnalysis:
        "DI would flag this as the canonical case of 'biases present AND actively managed.' Status quo bias (Windows dominance), sunk-cost fallacy (Nokia), and loss aversion (revenue cannibalization from Office subscription) were all operative. Nadella's decision process named each bias explicitly, took visible counter-actions in the first 18 months, and used cultural framework language (growth mindset) to give middle management an explanation for why previously-heretical decisions were now mandatory. The Nokia writedown in particular is the most instructive single action — it eliminated the sunk-cost escalation pathway before it could compound.",
    },
    source:
      'Satya Nadella, "Hit Refresh" (2017); Microsoft 10-K filings (2014-2020); Mary Jo Foley, "Microsoft 2.0" (2019)',
    sourceType: 'biography',
  },
  {
    id: 'cs-success-tech-005',
    title: 'NVIDIA GPU Pivot to AI and Deep Learning',
    company: 'NVIDIA',
    industry: 'technology',
    year: 2012,
    yearRealized: 2023,
    summary:
      "NVIDIA was a $10B gaming GPU company when CEO Jensen Huang began investing in GPU computing for AI research around 2012. The CUDA platform (launched 2006) was initially unprofitable and dismissed by analysts. Huang bet that parallel processing would be the foundation of AI/ML training. When the deep learning revolution arrived (AlexNet, 2012), NVIDIA had a decade of invested tooling. By 2023, NVIDIA's market cap exceeded $1 trillion as the indispensable infrastructure for AI.",
    decisionContext:
      'Whether to invest significant R&D resources in GPU computing for non-gaming applications (scientific computing, AI/ML), cannibalizing gaming-focused engineering resources for a market that had no proven demand.',
    outcome: 'exceptional_success',
    impactScore: 99,
    estimatedImpact: '$3T+ market cap; created the AI compute infrastructure market',
    impactDirection: 'positive',
    biasesPresent: ['confirmation_bias', 'overconfidence_bias', 'anchoring_bias'],
    primaryBias: 'confirmation_bias',
    toxicCombinations: [],
    beneficialPatterns: ['The Patient Bet', 'The Platform Leap'],
    biasesManaged: ['anchoring_bias'],
    mitigationFactors: [
      'CUDA platform built an ecosystem moat through developer adoption before competitors recognized the market',
      'Maintained profitable gaming business as cash flow bridge during the unprofitable compute investment',
      "CEO's engineering background allowed deep technical conviction rather than pure financial analysis",
      'Partnered with AI researchers (universities, labs) to validate compute architecture choices',
    ],
    survivorshipBiasRisk: 'high',
    contextFactors: {
      monetaryStakes: 'high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 10,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      "Confirmation bias was PRESENT and arguably BENEFICIAL — Huang's conviction about GPU computing's future persisted despite years of skepticism, and it happened to be correct.",
      'This case illustrates that biases are not inherently negative; confirmation bias in pursuit of a correct insight can create massive value. The key is whether the underlying thesis is valid.',
      "Survivorship bias risk is high: if deep learning had not emerged as the dominant AI paradigm, NVIDIA's GPU compute bet could have been a costly dead end.",
    ],
    source:
      'NVIDIA 10-K filings (2012-2023); Jensen Huang keynotes (GTC 2012-2023); Tae Kim, "The Nvidia Way" (2024)',
    sourceType: 'annual_report',
  },
  {
    id: 'cs-success-tech-006',
    title: 'Adobe Creative Cloud SaaS Transition',
    company: 'Adobe',
    industry: 'technology',
    year: 2013,
    yearRealized: 2017,
    summary:
      'In 2013, Adobe abandoned its perpetual license model for Creative Suite ($2,600/license) and moved to Creative Cloud ($50/month subscription). The stock dropped 8% on announcement day. Revenue declined for two consecutive quarters as perpetual license sales dried up before subscription revenue ramped. By 2017, recurring revenue exceeded 80% of total revenue, the stock had tripled, and Adobe had the most predictable revenue stream in enterprise software.',
    decisionContext:
      'Whether to abandon the profitable perpetual license model generating $4B+/year in favor of a subscription model that would cause immediate revenue decline and Wall Street backlash.',
    outcome: 'exceptional_success',
    impactScore: 90,
    estimatedImpact: '$200B+ in market cap created (2013-2023)',
    impactDirection: 'positive',
    biasesPresent: ['loss_aversion', 'status_quo_bias', 'anchoring_bias'],
    primaryBias: 'loss_aversion',
    toxicCombinations: [],
    beneficialPatterns: ['The Controlled Burn', 'The Platform Leap'],
    biasesManaged: ['loss_aversion', 'status_quo_bias'],
    mitigationFactors: [
      'CEO Shantanu Narayen prepared the board for 2-3 quarters of revenue decline with explicit financial modeling',
      'Provided a bridge period where both perpetual and subscription options were available',
      'Communicated the rationale transparently to Wall Street, accepting short-term stock price pain',
      'Customer retention data from early Creative Cloud pilots validated the subscription model before full commitment',
    ],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: false,
      timePressure: false,
      unanimousConsensus: false,
      participantCount: 12,
      dissentEncouraged: true,
      externalAdvisors: true,
      iterativeProcess: true,
    },
    lessonsLearned: [
      'Loss aversion was managed by explicitly modeling the "valley of death" between perpetual and subscription revenue and securing board commitment to the transition period.',
      'Anchoring to current revenue ($4B perpetual) was overcome by reframing the analysis around customer lifetime value, which was 3-5x higher under subscription.',
      'The iterative rollout (pilot → bridge period → full transition) allowed real data to validate the strategy at each stage, reducing uncertainty.',
    ],
    source:
      'Adobe 10-K filings (2013-2017); Shantanu Narayen interviews, Harvard Business Review (2015); Morgan Stanley research note "Adobe: The SaaS Transformation" (2016)',
    sourceType: 'earnings_call',
  },
];
