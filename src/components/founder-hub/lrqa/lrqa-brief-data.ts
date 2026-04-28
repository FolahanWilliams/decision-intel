/**
 * LRQA / Ian Spaulding — Capability Brief & Meeting Playbook.
 *
 * Single source of truth for the LRQA prospect surface inside the Founder
 * Hub. Mirrors the sankore/ directory pattern (brief stays inside the
 * authenticated Founder Hub — never leaks to public surfaces per the
 * CLAUDE.md no-named-prospects rule).
 *
 * Context: Ian Spaulding is the dad of one of Folahan's best friends, so
 * this is a warm-intro at the highest possible level. The first meeting
 * (this week, 2026-04-26 onward) is advisor-grade conversation first,
 * partnership conversation second. Trust capital is real but burns fast
 * if mishandled.
 *
 * The brief is structured for query: every section has a clear export
 * shape so NotebookLM, the founder, and future Claude sessions can
 * reference specific facts without re-deriving from LinkedIn.
 *
 * Created 2026-04-26 from Ian's LinkedIn profile + LRQA company filings
 * + recent press (Reuters, LRQA newsroom). Update as the relationship
 * develops.
 */

// ─── Ian Spaulding — personal & professional profile ─────────────────────

export const IAN_PROFILE = {
  name: 'Ian Spaulding',
  role: 'Group Chief Executive Officer',
  company: 'LRQA',
  location: 'Greater London, United Kingdom',
  linkedinFollowers: 18165,
  connections: '500+',

  warmIntroContext:
    "Ian is the father of one of Folahan's best friends. The connection surfaced through casual conversation about what each parent does. This is the highest-value warm intro Folahan has had outside the Wiz advisor relationship — and it lands at the EXACT intersection of Decision Intel's positioning (risk management + AI + Pan-African expansion + supply chain reasoning audit). Treat as advisor-grade conversation first, partnership conversation second. Trust capital from the personal connection is real but burns fast if Folahan over-pitches in the first meeting.",

  intellectualProfile: {
    education: [
      {
        institution: 'Yale University',
        degree: 'Masters of Arts, Religion / Human Rights',
        years: '1996-1998',
      },
      {
        institution: 'American University',
        degree: 'Bachelors of Arts, Political Science',
        years: '1990-1994',
      },
    ],
    intellectualSignal:
      'A Yale MA in Religion / Human Rights is unusual for a $500M+ risk-management CEO. It signals Ian thinks structurally about ethics, governance, and human-centred decisions — not just compliance checkboxes. Folahan should engage at this level: cite Kahneman-Klein 2009 R²F, the published 2008 financial crisis paper, the metacognition speech. Ian will recognise depth instantly.',
  },

  careerArc: [
    {
      role: 'Group CEO',
      company: 'LRQA',
      years: 'Sep 2023 – Present',
      thrust:
        'Driving transformation, streamlining operations, expanding into cybersecurity / ESG / inspection / AI; 61K+ clients across 160 countries.',
    },
    {
      role: 'Managing Director — Assessment, then Chief Growth Officer',
      company: 'LRQA',
      years: 'May 2022 – Aug 2023',
      thrust:
        'Drove internal alignment + growth initiatives + digital market awareness during the LRQA platform consolidation post-ELEVATE acquisition.',
    },
    {
      role: 'CEO, then Senior Partner',
      company: 'ELEVATE',
      years: 'Apr 2013 – Apr 2022',
      thrust:
        "Founded and scaled ELEVATE — a leading risk + sustainability solutions firm — into a category leader. Acquired by LRQA in 2022. KEY INSIGHT: Ian knows the founder journey from the inside. He knows what it's like to scale a risk-tech firm from zero. He'll respect technical depth + intellectual honesty + scrappy execution, and he'll see through founder-theatre instantly.",
    },
    {
      role: 'Managing Director',
      company: 'INFACT Global Partners',
      years: 'Sep 2007 – Apr 2013',
      thrust: 'Risk + responsible sourcing across emerging markets.',
    },
    {
      role: 'Director, Global Compliance',
      company: 'Sears Holdings Corporation',
      years: 'Apr 2001 – Sep 2007',
      thrust:
        'Enterprise-scale compliance + supply chain assurance for one of the largest US retailers. Knows the Fortune 500 procurement lens from the inside.',
    },
  ],

  topSkills: [
    'Leadership',
    'Cross-functional Team Leadership',
    'Business Strategy',
    'Sustainable Development',
    'Corporate Social Responsibility',
  ],

  boardRoles: [
    'Advisory Board Member — EiQ by LRQA (Jul 2025 – present)',
    'Board Member — Qarma | Quality & Compliance (Jan 2024 – present)',
  ],

  recentPublicVoice: [
    {
      date: '2026-03 (1mo ago, Reuters)',
      title: 'Key risk trends shaping 2026',
      thrust:
        '"Trade weaponized, regulation weakened and strengthened at the same time, cyber and AI risks converging into supply chain risk." Drew on EiQ supply-chain intelligence software data + WEF risk report. The piece IS the strategic lens Ian sees the world through.',
      diRelevance:
        "Decision Intel's R²F + 17-framework regulatory map + Pan-African anchor + the convergence of decision-quality with regulatory tailwinds map DIRECTLY onto Ian's framing. Folahan should reference this Reuters piece in the first 5 minutes — proves Folahan has read Ian's actual thinking, not just the CV.",
    },
    {
      date: '2026-04 (4d ago, Earth Day)',
      title: 'Responsible Sourcing & Climate Performance Risk Outlook',
      thrust:
        '"The risk today isn\'t ambition, it\'s proof. Targets are everywhere, but real demonstrable progress is much harder to find. In a more regulated, more scrutinised world, evidence is what separates leaders from the rest."',
      diRelevance:
        "This quote is the Decision Provenance Record thesis in Ian's own words. The DPR — hashed, tamper-evident, mapped against 17 regulatory frameworks — IS evidence that separates leaders from the rest. Folahan should literally repeat this back to Ian in the meeting: \"Your Earth Day quote — 'evidence is what separates leaders from the rest' — that's exactly the DPR thesis.\"",
    },
  ],
} as const;

// ─── LRQA — company snapshot ──────────────────────────────────────────────

export const LRQA_COMPANY = {
  oneLiner:
    'The leading global risk management partner — compliance, certification, supply chain assurance, sustainability, cybersecurity, and emerging technologies for 61,000+ organisations in 150+ countries.',

  tagline: 'Your Risk Management Advantage',

  scale: {
    clients: '61,000+ organisations',
    geography: "150+ countries (160 per Ian's most recent post)",
    employeeCount: 'Several thousand globally',
    revenue: 'Estimated $500M+ (debut €500M Term Loan B in Q1 2026)',
  },

  serviceLines: [
    'Compliance & certification (ISO standards, sector certifications)',
    'Supply chain assurance (responsible sourcing, audits)',
    'Sustainability + ESG advisory + reporting',
    'Cybersecurity assurance',
    'Emerging technologies risk (AI governance, etc.)',
    'Industrial inspection (post Lindinger acquisition Feb 2026)',
  ],

  recentStrategicMoves: [
    {
      date: '2026-04 (1w ago)',
      move: 'Acquired Partner Africa — first EMEA acquisition, ethical sourcing + food safety + human rights advisory',
      diRelevance:
        "CRITICAL — this is the warmest possible signal for the Pan-African angle. LRQA is actively investing in Africa. Folahan's Lagos rooting + Dangote DPR + Pan-African regulatory map (NDPR / CBN / WAEMU / PoPIA / CMA Kenya) make Decision Intel uniquely valuable to LRQA's Africa strategy. Lead with this in the meeting.",
      strategicWeight: 'critical',
    },
    {
      date: '2026-03 (1mo ago)',
      move: 'Successfully priced €500M Term Loan B — debut in syndicated term loan market, "significantly oversubscribed"',
      diRelevance:
        'Ian explicitly said: "supports the next phase of our strategy, enabling continued investment in technology, innovation and targeted M&A." The capital is THERE for partnerships and acquisitions. This is the moment to surface as either an integration partner OR a future M&A candidate.',
      strategicWeight: 'high',
    },
    {
      date: '2026-02 (2mo ago)',
      move: 'Mission AI Possible internal hackathon — 87 ideas, 13 teams shortlisted, 3 finalists, 5 AI projects already deployed (scheduling, report writing, insights x2, technical reviews)',
      diRelevance:
        'LRQA is investing in AI internally. This means they have organisational maturity to evaluate AI products + technical staff who can integrate them. It also means Folahan should NOT pitch DI as "we\'ll do AI for you" — pitch DI as "we bring R²F + 17-framework regulatory IP + 143-case library that you would not build internally."',
      strategicWeight: 'high',
    },
    {
      date: '2026-02 (2mo ago)',
      move: 'Acquired Lindinger Inspection Engineers — 50-year-old family-owned industrial inspection firm',
      diRelevance:
        "Pattern: LRQA actively acquires specialised expertise. They bought Ian's ELEVATE in 2022 the same way. Decision Intel could be a future acquisition candidate — but Folahan should NOT lead with this. Lead with integration, let acquisition surface naturally if Ian raises it.",
      strategicWeight: 'medium',
    },
    {
      date: '2026-01 (3mo ago)',
      move: 'Welcomed Didier Michaud-Daniel as Chair (former CEO of Bureau Veritas + Otis)',
      diRelevance:
        "Bureau Veritas is LRQA's most direct global competitor. This Chair appointment signals LRQA is serious about competing at scale. Folahan should know the Bureau Veritas / SGS / Intertek / DNV competitive set and not over-claim DI fits in a category they've already covered.",
      strategicWeight: 'medium',
    },
    {
      date: '2026 ongoing',
      move: 'EiQ by LRQA — supply chain intelligence software; ERSA 4.0 (Enhanced Responsible Sourcing Assessment) in public consultation March-June 2026, launches at NY Global Summit September 2026',
      diRelevance:
        "EiQ + ERSA 4.0 IS the integration target. Decision Intel as the reasoning audit layer ON TOP of EiQ's supply chain intelligence is a clean integration story. Specifically: ERSA 4.0 produces sourcing risk scores; DI audits the REASONING behind sourcing decisions made on those scores. This is the surgical integration pitch.",
      strategicWeight: 'critical',
    },
  ],

  competitiveContext: {
    directGlobalCompetitors: [
      'Bureau Veritas (€5B+ revenue) — new LRQA Chair came from BV',
      'SGS',
      'Intertek',
      'DNV',
      'TÜV SÜD',
    ],
    note: "These are the certification + assurance giants. LRQA competes head-on with them. Decision Intel is NOT in their category — DI is the reasoning-audit layer that sits ABOVE certification work. Position carefully: do NOT claim DI competes with Bureau Veritas, position DI as the layer that makes LRQA's offering more defensible than BV's.",
  },
} as const;

// ─── Strategic intersection — where DI fits in LRQA's stack ──────────────

export interface IntegrationPath {
  id: string;
  title: string;
  fitStrength: 'critical' | 'high' | 'medium';
  whereInLrqaStack: string;
  diValueAdd: string;
  pitchPositioning: string;
  proofArtefact: string;
  realisticTimeline: string;
}

export const INTEGRATION_PATHS: IntegrationPath[] = [
  {
    id: 'eiq_reasoning_layer',
    title: 'Reasoning audit layer ON TOP of EiQ supply chain intelligence',
    fitStrength: 'critical',
    whereInLrqaStack:
      'EiQ by LRQA — supply chain intelligence software, ERSA 4.0 framework, Global Grievance Mechanism Dashboard.',
    diValueAdd:
      "EiQ produces sourcing risk scores + responsible-sourcing assessments. Decision Intel audits the REASONING behind sourcing decisions made on those scores: did the procurement team apply the right weighting? Did they catch the toxic combination of overconfidence + sunk cost on a supplier they've been with for 8 years? The R²F catches what EiQ's scoring can't — the bias in the human decision over the score.",
    pitchPositioning:
      '"EiQ tells your client THAT a supplier is high-risk. Decision Intel audits HOW the procurement team reasoned about that risk. The two are complementary, not competitive — and together they produce an artefact (the DPR) that survives an auditor\'s review in a way neither does alone."',
    proofArtefact:
      'Run a live audit on the public Earth Day Responsible Sourcing & Climate Performance Risk Outlook report — flag the bias patterns in the framing, demonstrate the R²F output, show the DPR shape.',
    realisticTimeline:
      'Phase 1: Joint white paper (60-90 days). Phase 2: ERSA 4.0 reasoning-audit module pilot at September 2026 Global Summit. Phase 3: Full integration negotiation (6-12 months).',
  },
  {
    id: 'pan_african_partner_africa',
    title: 'Pan-African reasoning audit for Partner Africa expansion',
    fitStrength: 'critical',
    whereInLrqaStack:
      'Partner Africa (acquired April 2026) — ethical sourcing + food safety + human rights advisory across Africa.',
    diValueAdd:
      "Partner Africa's clients face Pan-African regulatory complexity (NDPR, CBN, FRC Nigeria, WAEMU, PoPIA, CMA Kenya, BoG, CBE, SARB, BoT). Decision Intel's 17-framework regulatory map covers this exact set + the structural-assumptions audit branches on jurisdiction-specific FX cycles (NGN, KES, GHS, EGP). NO US-incumbent competitor (Bureau Veritas, SGS, Intertek) has this depth at the reasoning-audit layer for African markets.",
    pitchPositioning:
      '"You just acquired Partner Africa — first EMEA acquisition, signal that Africa is strategic. I\'m a Lagos-rooted founder with two production specimen DPRs (WeWork US-pattern, Dangote 2014 Pan-African expansion) + a 17-framework map covering NDPR, CBN, WAEMU, PoPIA. Your Partner Africa clients need exactly this reasoning-audit layer to prove their decisions are defensible to LP / regulator scrutiny. We could build the joint Pan-African reasoning audit offering together."',
    proofArtefact:
      'Bring the Dangote DPR PDF on a tablet/phone. Walk through the regulatory mapping for NDPR + CBN + WAEMU. Show the sovereign-context branching for NGN, KES, GHS, EGP.',
    realisticTimeline:
      'Phase 1: Africa-focused joint pilot with one Partner Africa client (90 days). Phase 2: Co-branded Pan-African reasoning audit offering (6 months).',
  },
  {
    id: 'esg_evidence_dpr',
    title: 'DPR as the "evidence that separates leaders from the rest" for ESG',
    fitStrength: 'high',
    whereInLrqaStack:
      'Sustainability + ESG advisory + reporting service line. Climate performance risk outlooks. Carbon disclosure assurance.',
    diValueAdd:
      'Ian\'s Earth Day quote: "evidence is what separates leaders from the rest." The DPR IS that evidence — hashed, tamper-evident, regulatory-mapped artefact for every strategic ESG decision. LRQA can issue ESG certifications; Decision Intel produces the decision-quality artefact that makes those certifications defensible if challenged.',
    pitchPositioning:
      "\"Your Earth Day quote landed for me — 'evidence is what separates leaders from the rest.' That's the Decision Provenance Record thesis. Every strategic ESG decision your clients make — supplier change, factory siting, decarbonisation timeline — could carry a DPR proving the reasoning was rigorous. LRQA's certifications + DI's DPRs is a defensibility stack no competitor offers.\"",
    proofArtefact:
      'Reference the LRQA Climate Performance Risk Outlook report. Show how DI would audit the reasoning behind a climate-target-setting decision.',
    realisticTimeline:
      'Phase 1: Joint Reuters / FT op-ed positioning piece (30 days). Phase 2: Pilot with 2-3 LRQA clients on climate decisions (90 days).',
  },
  {
    id: 'mission_ai_external_ip',
    title: "External category-grade IP that LRQA's internal AI hackathon can't produce",
    fitStrength: 'high',
    whereInLrqaStack:
      'Mission AI Possible hackathon (87 ideas, 5 deployed projects). LRQA AI capability stack.',
    diValueAdd:
      "LRQA's internal AI initiative produces tactical AI tools (scheduling, report writing, insights, technical reviews). It does NOT produce category-defining IP like the R²F (Kahneman-Klein synthesis) + 20-bias taxonomy + 17-framework regulatory map + 143-case library + Brier-scored outcome flywheel. These take 5+ years of academic + product work. LRQA could license or partner with DI to bring this IP into the LRQA platform without rebuilding.",
    pitchPositioning:
      "\"Your Mission AI Possible hackathon shows internal AI capability. The question for any enterprise AI strategy is what to build vs partner. R²F + the 17-framework map + the 143-case library would take a team 3-5 years to recreate from scratch — and the academic IP (Kahneman-Klein 2009 'Conditions for Intuitive Expertise', the 50-year heuristics-and-biases program) anchors the credibility in a way internal builds rarely match. Worth exploring whether DI is a partner-don't-build candidate for LRQA.\"",
    proofArtefact:
      'Send the Kahneman-Klein 2009 paper PDF (the R²F intellectual anchor) + a one-page IP moat brief.',
    realisticTimeline:
      'Phase 1: Strategic licensing conversation (30 days). Phase 2: Integrated POC for one LRQA client decision (60 days).',
  },
  {
    id: 'reuters_2026_risk_lens',
    title: "The reasoning audit for Ian's 2026 risk-trend convergence thesis",
    fitStrength: 'high',
    whereInLrqaStack:
      "Ian's strategic narrative + LRQA's public-voice positioning. The Reuters piece + WEF risk report.",
    diValueAdd:
      "Ian's thesis: trade weaponization + regulatory fragmentation + cyber / AI / supply chain risk convergence = harder, more important risk decisions. Decision Intel is BUILT for exactly this convergence — the R²F + 17-framework regulatory map + structural-assumptions audit (FX cycles, sovereign context) handles cross-border decisions where the bias patterns are amplified by complexity.",
    pitchPositioning:
      '"Your Reuters piece on 2026 risk trends — trade weaponized, regulation fragmenting, cyber + AI converging into supply chain risk — that\'s exactly the decision environment Decision Intel was built for. The harder cross-border decisions get, the more bias patterns compound. The R²F + 17-framework map + structural-assumptions audit ARE the operational answer to your strategic narrative."',
    proofArtefact:
      "Quote Ian's Reuters piece directly. Show how the 12-node pipeline addresses each of his named convergence risks.",
    realisticTimeline:
      'Phase 1: Joint thought-leadership piece (30 days). Phase 2: LRQA referral channel for high-stakes cross-border audit conversations (90 days).',
  },
] as const;

// ─── Three-tier ask hierarchy ────────────────────────────────────────────

export interface AskTier {
  tier: 1 | 2 | 3;
  label: string;
  ask: string;
  rationale: string;
  whyIanMightSayYes: string;
  whyIanMightSayNo: string;
  fallbackPosition: string;
}

export const ASK_HIERARCHY: AskTier[] = [
  {
    tier: 1,
    label: 'IDEAL — Integration partnership / design partner',
    ask: 'A 90-day joint pilot exploring DI as the reasoning audit layer ON TOP of EiQ for one specific Partner Africa client decision. Folahan handles the audit + DPR generation; LRQA provides the client context + integration access. £0 to LRQA in the pilot phase; commercial discussion at month 3 based on demonstrated lift.',
    rationale:
      'This is the optimal ask because it commits LRQA to a low-risk experiment that proves DI value WITHIN their existing client relationships, gives DI a flagship reference, and creates the natural path to a deeper commercial relationship (integration / partnership / referral channel) without requiring Ian to commit to a multi-year deal in the first meeting.',
    whyIanMightSayYes:
      'Low risk to LRQA (no cash out). High learning value (tests whether reasoning audit moves the needle for Partner Africa clients). Aligns with the Term Loan B "investment in technology + innovation" mandate. Personal connection means Ian wants to give Folahan a real shot.',
    whyIanMightSayNo:
      'Internal politics — LRQA may already be evaluating competitive tools internally. EiQ team may not want external integration in their flagship product. Commercial team may want a paid pilot, not free.',
    fallbackPosition:
      'If integration pilot is too aggressive, fall back to Tier 2 (introductions). If introductions are also held back, fall back to Tier 3 (advisor relationship + send the Kahneman-Klein paper as homework).',
  },
  {
    tier: 2,
    label: "HIGH-VALUE — Introductions to Ian's network",
    ask: '3-5 specific introductions: (a) one VP of Strategy or CSO at a Fortune 500 LRQA client where reasoning audit would land, (b) one M&A executive who could use DI for diligence reasoning, (c) one Partner Africa contact for the Pan-African pilot, (d) one EiQ team lead for the integration conversation, (e) optionally Didier Michaud-Daniel (LRQA Chair, ex Bureau Veritas) if Ian is willing.',
    rationale:
      "Even if integration is too aggressive for the first meeting, network introductions cost Ian almost nothing and accelerate Folahan's pipeline by 3-6 months per intro. Frame as \"I'd benefit enormously from 3-5 specific intros — here's exactly who and why.\" Specificity respects Ian's time and proves Folahan has done the homework.",
    whyIanMightSayYes:
      "Cheap for Ian (an email each). Helps the friend's son. Gives Ian optionality to see how Folahan executes before committing to anything bigger.",
    whyIanMightSayNo:
      'Ian protects his network capital — he might say "let me see how the first conversations go before I make introductions." That\'s a reasonable position; respect it.',
    fallbackPosition:
      'If full introduction list is too much, ask for ONE specific intro (the EiQ team lead or the Partner Africa contact — whichever is most strategic). Better to land one intro than ask for 5 and get 0.',
  },
  {
    tier: 3,
    label: 'TABLE STAKES — Strategic advisor relationship',
    ask: "A 30-minute follow-up call once per quarter for the first year, where Folahan presents progress + asks for specific advice. Ian's 30 years of risk + sustainability + Africa scaling experience is uniquely valuable for Decision Intel's GTM motion. Frame as \"I'd benefit from your perspective at quarterly check-ins.\"",
    rationale:
      'Even if Ian declines integration AND introductions, an advisor relationship with quarterly cadence builds trust capital + gives Folahan repeated context-setting moments. After 4 quarters of Folahan executing well, the integration / introduction asks become much easier to land.',
    whyIanMightSayYes:
      'Low time commitment (30 min × 4). Personal connection means the relationship matters anyway. Mentoring younger founders is something most CEOs at this stage of career enjoy.',
    whyIanMightSayNo:
      'Time is genuinely scarce. Ian may prefer ad-hoc check-ins rather than scheduled cadence.',
    fallbackPosition:
      'If quarterly cadence is too formal, frame as "I\'d love to keep you posted on progress and reach out when I hit specific decisions where your perspective would be valuable." Less commitment for Ian, same relationship-building effect.',
  },
] as const;

// ─── Pre-meeting prep checklist ──────────────────────────────────────────

export interface PrepItem {
  category: 'research' | 'artefact' | 'rehearse' | 'avoid';
  item: string;
  detail: string;
}

export const MEETING_PREP: PrepItem[] = [
  {
    category: 'research',
    item: "Re-read Ian's Reuters piece on 2026 risk trends",
    detail:
      'Ian linked it on LinkedIn ~1 month ago. Quote it back to him in the first 5 minutes — proves Folahan has read his actual thinking. Specifically reference "trade weaponized, regulation weakened and strengthened at the same time, cyber and AI risks converging into supply chain risk."',
  },
  {
    category: 'research',
    item: "Re-read Ian's Earth Day post (4d ago)",
    detail:
      "\"The risk today isn't ambition, it's proof. Targets are everywhere, but real demonstrable progress is much harder to find. In a more regulated, more scrutinised world, evidence is what separates leaders from the rest.\" This IS the DPR thesis in Ian's words. Quote it.",
  },
  {
    category: 'research',
    item: 'Read the Partner Africa acquisition press release + the LRQA newsroom pieces',
    detail:
      'First EMEA acquisition. Active M&A pipeline for 2026. Africa is strategic. Walk in knowing what they bought + why.',
  },
  {
    category: 'research',
    item: 'Read the LRQA Term Loan B press release (1mo ago)',
    detail:
      '€500M, oversubscribed, supports "investment in technology, innovation and targeted M&A." Capital is there for partnerships and acquisitions. This is the moment.',
  },
  {
    category: 'research',
    item: 'Skim ERSA 4.0 framework documentation (LRQA newsroom)',
    detail:
      'In public consultation March-June 2026. Launches at NY Global Summit September 2026. Used by 100+ companies in 10,000+ workplaces. The integration story for DI lives here.',
  },
  {
    category: 'research',
    item: "Review LRQA's competitive set (Bureau Veritas, SGS, Intertek, DNV)",
    detail:
      "Don't over-claim DI competes with these. Position DI as the reasoning-audit layer that makes LRQA's offering more defensible than BV's. New Chair Didier Michaud-Daniel is ex Bureau Veritas — he knows BV inside out.",
  },
  {
    category: 'artefact',
    item: 'Bring the Dangote DPR PDF on a tablet (printed too as backup)',
    detail:
      'For the live walk-through if appropriate. Africa-focused, demonstrates the Pan-African regulatory mapping that aligns with Partner Africa acquisition.',
  },
  {
    category: 'artefact',
    item: 'Bring the WeWork DPR PDF on the same device',
    detail:
      'For US/global comparison if Ian asks "what does this look like for our Fortune 500 clients?"',
  },
  {
    category: 'artefact',
    item: 'Bring the Kahneman-Klein 2009 paper PDF',
    detail:
      'Yale MA in Religion / Human Rights — Ian appreciates intellectual depth. Cite the paper, offer to send the full PDF afterward. The 2008 financial crisis paper Folahan published is the credibility opener.',
  },
  {
    category: 'artefact',
    item: 'Have the LRQA-specific one-pager ready (offline + email)',
    detail:
      'A single page tailored to LRQA: integration paths, ask hierarchy, follow-up. Send via email within 4 hours of the meeting ending — strikes the iron while the conversation is fresh.',
  },
  {
    category: 'rehearse',
    item: 'The 7-minute artefact-led pitch on the Dangote DPR (es_10)',
    detail:
      'Practice out loud, with a timer, until it lands within ±30 seconds. The 90-second frame → 5-min audit walk-through → 30-second close pattern.',
  },
  {
    category: 'rehearse',
    item: 'The 3-tier ask hierarchy in 60 seconds',
    detail:
      'Be able to deliver the Tier 1 integration ask, the Tier 2 intros ask, and the Tier 3 advisor ask in under a minute total. Smooth fallbacks if Ian raises objections.',
  },
  {
    category: 'rehearse',
    item: 'The "why this matters to LRQA" 3-sentence pitch',
    detail:
      '"Your acquisition of Partner Africa + your Reuters piece on 2026 risk convergence + the EiQ supply chain intelligence software are the three signals I read as Decision Intel being uniquely complementary to LRQA. We bring R²F + the 17-framework Pan-African regulatory map + 143-case library. Together with EiQ + Partner Africa, that\'s a Pan-African reasoning audit offering no competitor can replicate in 12 months."',
  },
  {
    category: 'avoid',
    item: 'Do NOT lead with the founder story',
    detail:
      'Ian knows Folahan is 16 + Lagos-rooted + Wiz-advised through his son. Save the founder narrative for if he asks. Lead with the LRQA-specific intersection + the artefact (Dangote DPR).',
  },
  {
    category: 'avoid',
    item: 'Do NOT over-promise on integration timing',
    detail:
      'Be honest that integration with EiQ takes months and depends on EiQ team buy-in. Honesty about realistic timeline (per JOLT Limit) lands better than over-promised features.',
  },
  {
    category: 'avoid',
    item: 'Do NOT pitch acquisition or competitor displacement',
    detail:
      "LRQA acquired ELEVATE (Ian's firm) in 2022. They know how to acquire. If acquisition is on the table, Ian will surface it himself. Folahan should NEVER raise it first.",
  },
  {
    category: 'avoid',
    item: 'Do NOT over-claim the DQI scoring',
    detail:
      'Ian has 30 years in audit / certification / standards. He knows what scoring rigor looks like. Be honest that DQI weights are currently expert priors based on Kahneman-Sibony research, not yet empirically validated against confidence intervals — and that the Outcome Gate enforcement is the architectural answer to producing that calibration data over 18 months.',
  },
  {
    category: 'avoid',
    item: 'Do NOT exploit the personal connection',
    detail:
      'Ian is meeting Folahan because his son spoke highly. The trust capital is real but burns fast if Folahan over-pitches. Treat as advisor-grade conversation first, partnership conversation second. Let the work product do the persuasion, not the relationship.',
  },
];

// ─── Question bank — what Folahan should ASK Ian ──────────────────────────

export interface QuestionEntry {
  category: 'discovery' | 'fit' | 'process' | 'advice';
  question: string;
  whyAsk: string;
  signalIfYes: string;
}

export const QUESTION_BANK: QuestionEntry[] = [
  {
    category: 'discovery',
    question:
      '"Reading your Reuters piece on 2026 risk trends — the convergence point you flagged (cyber + AI + supply chain) — is that mostly a thought-leadership framing for LRQA, or is it actively reshaping how you allocate investment internally?"',
    whyAsk:
      'Surfaces whether the convergence narrative is strategic priority vs PR. The answer determines whether DI fits as integration partner (strategic priority) or content collaboration (PR).',
    signalIfYes:
      'If actively reshaping investment, Tier 1 integration ask is in play. If mostly thought-leadership, Tier 2 introductions / Tier 3 advisor are the right asks.',
  },
  {
    category: 'discovery',
    question:
      '"On the Partner Africa acquisition — what was the strategic gap you saw? Was it geographic coverage, sector expertise, regulatory depth, or something else?"',
    whyAsk:
      "Tells Folahan exactly where DI's Pan-African anchor + 17-framework regulatory map + Dangote DPR fits in LRQA's stated rationale for the acquisition. Lets Folahan position DI as filling adjacent gaps Partner Africa doesn't.",
    signalIfYes:
      'If the answer is "regulatory depth + reasoning audit for African contexts," Decision Intel\'s positioning is uniquely strong. Lead the Tier 1 ask with this.',
  },
  {
    category: 'fit',
    question:
      '"How does EiQ\'s ERSA 4.0 framework handle the gap between sourcing risk SCORES and the actual reasoning behind sourcing decisions? Where does the audit trail stop?"',
    whyAsk:
      'Surfaces the integration opportunity directly. EiQ scores risk; DI audits reasoning. The "where does the audit trail stop" question lets Ian articulate the gap DI fills.',
    signalIfYes:
      'If Ian acknowledges the gap is real, the integration pitch becomes "we extend EiQ\'s audit trail one layer up." If he says "we already cover that," DI may need to position differently.',
  },
  {
    category: 'fit',
    question:
      "\"Your Mission AI Possible hackathon produced 5 deployed projects. What's LRQA's build-vs-buy posture for AI capabilities you don't yet have internally — particularly category-defining IP like reasoning frameworks or research-grounded scoring?\"",
    whyAsk:
      'Surfaces whether LRQA is open to external partnerships for category-grade AI IP, or if they want to build everything internally. Determines whether DI as licensing / integration / acquisition is even on the table.',
    signalIfYes:
      'If Ian says "we partner for IP we wouldn\'t build internally," Tier 1 integration is in play. If he says "we build everything internally," pivot to Tier 2 introductions.',
  },
  {
    category: 'process',
    question:
      "\"If we ran a 90-day joint pilot on one Partner Africa client, what would success look like for LRQA — what's the threshold where you'd say 'this is worth a deeper conversation'?\"",
    whyAsk:
      'Forces Ian to articulate his own success criteria for the Tier 1 ask. Whatever he says becomes the explicit goalpost for the pilot. Removes ambiguity about what "wins."',
    signalIfYes:
      'A specific threshold (e.g., "if the audit catches 1 toxic combination per 5 sourcing decisions and the client values it at >$10K of risk avoidance per audit") = clean pilot framing. Vague answer = need to propose the criteria yourself.',
  },
  {
    category: 'advice',
    question:
      '"You scaled ELEVATE from zero to a category leader, then sold to LRQA. With Decision Intel\'s positioning + the Pan-African wedge + the design partner approach — where would you focus first? What would you NOT do that I\'m probably tempted to do?"',
    whyAsk:
      'This is the gold question. Ian has done the founder journey in adjacent space. His answer is worth more than any pitch. Triggers advisor-mode rather than buyer-mode.',
    signalIfYes:
      "A substantive answer = Tier 3 advisor relationship is real. Vague answer = Ian doesn't want to be a mentor; respect that and stick with Tier 1 / 2.",
  },
  {
    category: 'advice',
    question:
      '"The honest version: where would Decision Intel fall apart in front of LRQA\'s procurement team? What\'s the gap that would kill the deal six months in?"',
    whyAsk:
      "Invites Ian to be a critical friend. Surfaces objections Folahan can address proactively. Ian's 30 years of enterprise procurement experience makes his answer unusually valuable.",
    signalIfYes:
      'A specific procurement objection (e.g., "your DQI doesn\'t have empirical validation; my procurement team will require that") = actionable feedback Folahan can address. Vague encouragement = polite pass.',
  },
];

// ─── 48h Follow-up Playbook ──────────────────────────────────────────────

export interface FollowUpStep {
  hoursAfter: number;
  action: string;
  artefact: string;
  rationale: string;
}

export const FOLLOWUP_PLAYBOOK: FollowUpStep[] = [
  {
    hoursAfter: 0,
    action: 'Send a 4-line thank-you email from the train / Uber leaving the meeting',
    artefact:
      '"Ian — really valued the time today. The conversation about [specific topic Ian raised] gave me a sharper frame. The Dangote DPR is attached as promised; I\'ll send the LRQA-specific one-pager + Kahneman-Klein paper within 24h. — F"',
    rationale:
      "Velocity signals seriousness. A 4-line email from the train shows Folahan respects Ian's time and is already in execution mode.",
  },
  {
    hoursAfter: 4,
    action: 'Send the LRQA-tailored one-pager + the Kahneman-Klein 2009 paper PDF',
    artefact:
      '1-page PDF: integration paths, ask hierarchy, suggested next step. No marketing fluff. The Kahneman-Klein paper as a separate attachment with a 1-line note: "The R²F intellectual anchor — Yale background, you\'ll appreciate the depth."',
    rationale:
      "Within-the-day follow-up is the founder velocity signal. The one-pager makes Ian's internal forwarding easy (he can ship it to EiQ team / Partner Africa team / advisor without reformatting).",
  },
  {
    hoursAfter: 24,
    action: 'Send the WeWork DPR PDF + a 1-line note on a public document Ian has commented on',
    artefact:
      '"Ian — also wanted to share the WeWork S-1 audit (US/global pattern, complement to the Dangote one). And re your Earth Day post — the \'evidence that separates leaders from the rest\' line is the DPR thesis in 12 words. Mind if I quote you (with attribution) in our positioning?"',
    rationale:
      'The "mind if I quote you" ask is the social-proof play (Cialdini Liking + Authority). If Ian says yes, his quote becomes ammunition. If he says no, no harm done.',
  },
  {
    hoursAfter: 48,
    action: 'Run a free audit on a public LRQA report and send the resulting DPR',
    artefact:
      'Pick the LRQA Climate Performance Risk Outlook OR the Reuters piece OR a recent ERSA-related document. Run it through DI. Send Ian the resulting DPR with a 2-line note: "Ran your most recent public risk outlook through the audit — interesting flags around [specific bias]. The full DPR is attached."',
    rationale:
      "This is the artefact-led follow-up that converts. It demonstrates DI value on Ian's OWN material, proves the product works, and gives Ian something to forward internally that's tangibly different from a sales follow-up.",
  },
  {
    hoursAfter: 168, // 7 days
    action: 'Calendar follow-up email proposing the Tier 1 / Tier 2 / Tier 3 next step',
    artefact:
      "Based on the meeting, propose ONE concrete next step (don't list all 3 tiers). If Tier 1 felt in play, propose the 90-day pilot scope. If Tier 2, propose specific introductions. If Tier 3, propose the quarterly cadence.",
    rationale:
      "A week is enough time for Ian to have processed the meeting + the artefacts. The single-concrete-next-step ask is the JOLT Offer move — don't give him 3 options, recommend the one that fits.",
  },
];

// ─── Things to remember about Ian ─────────────────────────────────────────

export const IAN_REMEMBER = [
  'He scaled ELEVATE from zero — he KNOWS the founder journey from inside.',
  'He has a Yale MA in Religion / Human Rights — intellectual depth, not just commercial.',
  'He just acquired Partner Africa (1w ago) — Africa is strategically front-of-mind.',
  '€500M Term Loan B (1mo ago) — capital available for partnerships + M&A.',
  'Mission AI Possible hackathon (2mo ago) — internal AI capability, but external IP is partner-friendly territory.',
  'New Chair from Bureau Veritas (3mo ago) — competing at scale matters.',
  'EiQ + ERSA 4.0 launches at NY Global Summit September 2026 — DI integration could be on that stage.',
  'He has 18,165 LinkedIn followers + 500+ direct connections — his intro graph is enormous if leveraged carefully.',
  'He explicitly values "evidence over ambition" — quote his Earth Day language back to him.',
  'He lives in the UK — same timezone as Folahan, simpler scheduling than US-based prospects.',
] as const;
