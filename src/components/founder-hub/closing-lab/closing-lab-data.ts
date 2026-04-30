/**
 * Closing Lab — sales-psychology SSOT.
 *
 * Synthesizes Eddie Maalouf's 6 high-ticket-psychology principles + Satyam's
 * 5 sales-infrastructure pillars + the brutal-honest pre-mortem critique
 * (5 silent objections + 3 fastest-converter personas + 3 trap personas +
 * the 80% cut list) into one operational playbook surface for the Founder
 * Hub.
 *
 * Source materials (master KB sources, ingested 2026-04-28):
 *   • Maalouf: maalouf-psychology-of-closing-high-ticket.md (KB source 8dfaeb03)
 *   • Satyam: satyam-competition-becomes-irrelevant.md (KB source 59dbc9f0)
 *   • NotebookLM synthesis note 570294bf — full prose answer captured
 *     2026-04-28 from turn 39 of master-KB conversation 9a90e1e8.
 *
 * Locked: 2026-04-28. When new sales-psychology material arrives (next
 * articles, podcast notes, or NotebookLM synthesis batches), update HERE
 * only — every section in ClosingLabTab pulls from these typed exports.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type ConverterId = 'mid_market_associate' | 'boutique_ma_advisor' | 'fractional_cso';
export type TrapId = 'f500_cso' | 'pan_african_partner' | 'gc_audit_committee';
export type MaaloufPrincipleId =
  | 'pressure_without_pressure'
  | 'low_vs_high_ticket'
  | 'authority_not_trust'
  | 'talk_about_other_opportunities'
  | 'embody_bigger_better'
  | 'stay_in_business_longer';
export type SatyamPillarId =
  | 'category_of_one'
  | 'us_vs_them_frame'
  | 'conviction_is_the_variable'
  | 'charge_more_win_anyway'
  | 'sales_infrastructure_is_the_weapon';
export type SilentObjectionId =
  | 'dqi_trust_me_math'
  | 'no_nda_hard_purge'
  | 'founder_continuity'
  | 'chatgpt_wrapper'
  | 'pan_african_regulatory';

export interface FastestConverter {
  id: ConverterId;
  /** Persona archetype (e.g., 'Adaeze') for shorthand on the call. */
  archetype: string;
  label: string;
  description: string;
  /** "Why they are ready NOW" — fear / pain that makes them swipe today. */
  whyReadyNow: string;
  /** Closeable ticket band — the price point that fits a corporate-card swipe. */
  ticketBand: string;
  /** Maalouf principle most load-bearing for this persona. */
  loadBearingMaalouf: MaaloufPrincipleId;
  /** Exact phrase to use on the call — verbatim. */
  exactPhrase: string;
  /** Satyam category-of-one framing tailored to this persona. */
  categoryFraming: string;
  /** Most likely silent objection from this persona. */
  topSilentObjection: SilentObjectionId;
  /** Verbatim response to that objection. */
  objectionResponse: string;
  /** What conviction the founder draws from when selling to this persona. */
  convictionAnchor: string;
  /** Pre-call nurture asset that pre-handles the main objection. */
  preCallAsset: string;
  /** 14-day outreach sequence — concrete day-by-day actions. */
  outreachSequence: string[];
  /** Accent color for UI rendering. */
  color: string;
}

export interface TrapPersona {
  id: TrapId;
  label: string;
  /** Why they look attractive (the trap itself). */
  whyTheyLookAttractive: string;
  /** Why they are actually 12+ months out — the structural reason. */
  whyTheyAreATrap: string;
  /** When to revisit (the unlock condition). */
  whenToRevisit: string;
  color: string;
}

export interface MaaloufPrinciple {
  id: MaaloufPrincipleId;
  /** Principle number (1-6) per Maalouf's article ordering. */
  number: number;
  label: string;
  /** Maalouf's own framing — verbatim from the article. */
  maaloufQuote: string;
  /** How this maps onto Decision Intel specifically. */
  diApplication: string;
  /** Anti-pattern — what the founder must NOT do. */
  antiPattern: string;
  /** Ideal phrasing the founder can use on a real call. */
  idealPhrase: string;
}

export interface SatyamPillar {
  id: SatyamPillarId;
  number: number;
  label: string;
  /** One-line summary of the pillar. */
  summary: string;
  /** Satyam's verbatim framing from the article. */
  satyamQuote: string;
  /** How this maps onto Decision Intel specifically. */
  diApplication: string;
  /** The concrete move the founder makes this week. */
  thisWeekMove: string;
}

export interface SilentObjection {
  id: SilentObjectionId;
  label: string;
  /** What the buyer thinks but does not say out loud. */
  whatBuyerThinks: string;
  /** Why this kills the deal — the structural reason it ends procurement. */
  whyItKillsTheDeal: string;
  /** Concrete fix this week. */
  thisWeekFix: string;
  /** Status — drives the badge color in the UI. */
  status: 'shipped' | 'in_progress' | 'todo';
  /** Optional verbatim response when the buyer surfaces a softer version. */
  verbatimResponse?: string;
}

export type CutVerdict = 'kill' | 'hide_flag' | 'enterprise_only' | 'keep';

export interface CutListItem {
  feature: string;
  verdict: CutVerdict;
  /** Why this verdict. */
  rationale: string;
}

export interface FunnelStep {
  number: number;
  label: string;
  /** What this surface IS. */
  what: string;
  /** What it deliberately is NOT (the friction we cut). */
  whatItIsNot: string;
  /** The specific action the user takes. */
  action: string;
}

export interface NeverSayPhrase {
  phrase: string;
  /** Why this kills the deal. */
  whyItKills: string;
  /** What to say instead. */
  saySteadInstead: string;
}

// ─── DATA ────────────────────────────────────────────────────────────

export const FASTEST_CONVERTERS: FastestConverter[] = [
  {
    id: 'mid_market_associate',
    archetype: 'Adaeze',
    label: 'Mid-market PE/VC associate',
    description:
      '24-year-old associate up at 2 AM drafting an IC memo, terrified of looking stupid in front of the Managing Partner. Has a corporate card. Does not need CFO approval below the procurement threshold.',
    whyReadyNow:
      'Acute career fear: looking stupid at the next IC meeting. The product makes them the smartest person in the room. They swipe today because the cost of looking stupid > the cost of $149/month.',
    ticketBand: '£149/mo Professional · sub-procurement-approval at every fund',
    loadBearingMaalouf: 'pressure_without_pressure',
    exactPhrase:
      'I have a spot next Tuesday open for an onboarding call where we can actually get ahead and maximize that. I am running 15 associate pilots this month, and I have a 10-minute window today to run your current draft memo through the pipeline before your MD sees it.',
    categoryFraming:
      "We don't provide deal templates or logging software. We run an 11-node bias auditor that acts as an outsourced adversarial red-team, simulating the exact logical gaps the partners will grill you on in 60 seconds.",
    topSilentObjection: 'chatgpt_wrapper',
    objectionResponse:
      'You might think you can just run this through ChatGPT. You cannot. ChatGPT gives you one generative opinion. We use Ensemble Sampling across a 143-case historical reference library based on the Kahneman-Klein R²F academic synthesis to give you a deterministic, auditable record. ChatGPT guesses; we audit.',
    convictionAnchor:
      'The Fear of Messing Up (JOLT effect). This 24-year-old is up until 2 AM terrified of looking stupid in front of the IC. The tool makes them the smartest person in the room. The conviction is real because the pain is real.',
    preCallAsset:
      'A 1-page Challenger-style teardown of the WeWork S-1 (or another famous failed deal) showing exactly what an associate could have caught. Proves the AI is smarter than they are before they pay.',
    outreachSequence: [
      'Day 1 — Identify 50 mid-market PE/VC associates on LinkedIn (target: 2-5 person investment teams, $50M-$500M AUM).',
      'Day 2 — Send the Challenger-style WeWork-S-1 teardown PDF to the first 10. No DM. Just attach + a single line: "Three flaws an MD would have spotted in 60 seconds. The first one cost $40B."',
      'Day 4 — Follow up with the 10 who opened: "Would you want to run your current draft through the same pipeline?"',
      'Day 6 — Send the next 10 the teardown.',
      'Day 8 — Schedule discovery calls with the openers — 30-minute slots, JOLT-style scripted.',
      'Day 10 — Run live audit on 1 redacted IC memo per call. Show the wow moment. Pivot to checkout.',
      'Day 12 — Stripe checkout link sent same-day. Maalouf pressure-without-pressure: "I have onboarding bandwidth Tuesday."',
      'Day 14 — Close 2-3 paid pilots at £149/mo. The rest: "I will check in next quarter when you have a new draft memo."',
    ],
    color: '#16A34A',
  },
  {
    id: 'boutique_ma_advisor',
    archetype: 'Potomac',
    label: 'Boutique sell-side M&A advisor',
    description:
      "Runs a 2-10 person sell-side shop. Paid strictly on closing. If a PE buyer's IC spots a flaw in their CIM (ungrounded hockey-stick projections, weak comps), the valuation drops or the deal dies. Buys per-deal.",
    whyReadyNow:
      'Direct commission risk. Every CIM with a hidden flaw costs them a $1M commission. The £499 audit is rounding-error insurance against losing the deal.',
    ticketBand: '£499 per-deal audit OR £149/mo Professional for active pipeline',
    loadBearingMaalouf: 'authority_not_trust',
    exactPhrase:
      "We're running audits on dozens of mid-market CIMs this quarter. Bring a redacted CIM from a deal you lost last year. I will run the audit live in 7 minutes. If it does not flag the exact blind spots that cost you the deal, this is not for you.",
    categoryFraming:
      "Most advisors just write a CIM and hope the buyer does not dig too deep. We red-team your CIM by simulating the PE buyer's Investment Committee before you go to market, bulletproofing your valuation.",
    topSilentObjection: 'no_nda_hard_purge',
    objectionResponse:
      'Your data never trains our models, by contract. AES-256-GCM encryption at rest, TLS 1.2+ in transit, and you can hit our API archive endpoint to trigger a 7-day hard purge the moment the deal dies or the NDA expires. You bulk-delete the entire engagement with one click.',
    convictionAnchor:
      "The $1M commission contrast (Cialdini's contrast principle). Their commission on a $50M sale is $1M. Your fee is £499. It is a rounding-error insurance premium. The conviction is in the math.",
    preCallAsset:
      'The public WeWork Decision Provenance Record (DPR) sent via cold email — proves instant, high-stakes capability without risking their data. Anchors the live-audit ask.',
    outreachSequence: [
      'Day 1 — Identify 30 boutique sell-side advisors on LinkedIn — 2-10 person shops, mid-market focus.',
      'Day 2 — Cold email each MD with the WeWork DPR attached: "I built a 60-second AI red-team. Here are the three fatal flaws it found in WeWork\'s S-1. Run your draft CIMs through this before you go to market."',
      'Day 4 — Follow-up DM to the 10 who replied: "Want to run a redacted CIM live in a 30-minute call?"',
      'Day 7 — Live audit on their actual CIM. Force the evidence moment. Show the silent-objections list of the PE buyer.',
      'Day 9 — Per-deal Stripe link sent same-day: £499 unlocks the unblurred audit + DPR PDF.',
      'Day 12 — Close 1-2 per-deal audits. Convert top performers to £149/mo for ongoing pipeline.',
      'Day 14 — Re-engagement: "Got a new CIM going to market this month? Audit it."',
    ],
    color: '#0EA5E9',
  },
  {
    id: 'fractional_cso',
    archetype: 'Ex-MBB Solo',
    label: 'Solo / Fractional CSO (ex-MBB consultant)',
    description:
      'Ex-McKinsey/BCG consultant charging high retainers. Suffers from the universal critique that "consultants have their own biases." Needs to mathematically prove their deliverables are rigorous to differentiate themselves from other solo consultants.',
    whyReadyNow:
      'Retainer differentiation. Every fractional CSO sells "expert intuition." The DPR is the academic, auditable record they attach to their strategy deck to justify a £20K/month retainer.',
    ticketBand: '£149/mo Professional or £249/mo Individual',
    loadBearingMaalouf: 'talk_about_other_opportunities',
    exactPhrase:
      'We are actively attaching our Decision Provenance Records to the strategy decks of ex-MBB consultants who want to mathematically prove to their clients that their recommendations are debiased. I am talking to three other fractional CSOs this week about standardizing this.',
    categoryFraming:
      'Consulting firms charge $1M to tell clients about cognitive bias, but have the same biases themselves. We built the AI that does not. We provide the 60-second insurance premium on your strategic-planning cadence.',
    topSilentObjection: 'founder_continuity',
    objectionResponse:
      "You aren't buying a fragile startup; you're buying a productized academic synthesis. Our SOC 2 Type II infrastructure runs on Vercel and Supabase, and our data room includes a Vendor Continuity Plan backed by a senior engineering network that previously scaled Wiz to $32B.",
    convictionAnchor:
      'Charge more and win anyway (Satyam). Price is perceived value constructed in real-time. You are giving them the ultimate Cialdini Authority weapon — an academic, stamped DPR they can hand to their clients to justify their £20K/month retainer.',
    preCallAsset:
      'A blank but fully formatted Decision Provenance Record (DPR) PDF aligned with EU AI Act Article 14, demonstrating the exact artifact they will hand to their clients.',
    outreachSequence: [
      'Day 1 — Identify 25 fractional CSOs / ex-MBB solo consultants on LinkedIn (filter: "Strategy Consultant" + "Fractional" + ex-McKinsey/BCG/Bain).',
      'Day 2 — Cold email with the blank DPR PDF attached: "Attach this to the appendix of your next strategy deck. Mathematically proves to your client that your recommendation is debiased against 30+ cognitive errors."',
      'Day 4 — DM follow-up: "Other ex-MBB consultants are standardizing on this. Would you want a 30-minute walkthrough?"',
      'Day 7 — Live demo on a redacted past engagement of theirs. Show how their existing recommendation gets a DPR.',
      'Day 9 — Stripe link: £149/mo Professional or £249/mo Individual.',
      'Day 11 — Maalouf "talk about other opportunities" — name 3 other consultants currently piloting.',
      'Day 14 — Close 2 fractional CSOs. The rest: re-engage when their next engagement starts.',
    ],
    color: '#8B5CF6',
  },
];

export const TRAP_PERSONAS: TrapPersona[] = [
  {
    id: 'f500_cso',
    label: 'Fortune 500 Chief Strategy Officer',
    whyTheyLookAttractive:
      '$50K-$150K ACV ceiling. $250M pain from bad strategic decisions. The unicorn-revenue path runs through them. They look like the obvious target on a TAM slide.',
    whyTheyAreATrap:
      'Structurally 12-18 months out. Selling to them requires surviving a 6-12 month procurement cycle that demands SOC 2 Type II compliance, EU AI Act Article 14 mapping, Audit Committee sign-off, and a vendor-risk register review. You do not have the outcome data flywheel or the published reference cases to survive this cycle yet. Pitching them today bleeds runway.',
    whenToRevisit:
      'After 3+ published wedge cases (mid-market associate or boutique advisor case studies with named outcomes). The 12-18 month F500 unlock is gated on social proof you generate from the fastest-converter cohort.',
    color: '#94A3B8',
  },
  {
    id: 'pan_african_partner',
    label: 'Pan-African fund partner (Sankore-class MD)',
    whyTheyLookAttractive:
      'Your tri-cultural moat (Lagos / UK / US) + capital-allocation pressure across volatile FX regimes makes them the ultimate enterprise beachhead. Sankore is your first design partner. The fit is real.',
    whyTheyAreATrap:
      'Enterprise PE/VC sales cycles take 9-18 months. Selling to the partner requires proving ROI across multiple deals + satisfying strict regional regulatory frameworks (Nigerian SEC ISA 2007, NDPR, FRC Nigeria current code). Waiting for them to sign a $30K/year contract drains your immediate 30-day momentum. The partnership is real but it is not a 30-day close.',
    whenToRevisit:
      'After the Sankore design partnership produces a published reference case AND the 18-framework regulatory map closes the ISA 2007 gap. Then bundle with adjacent Pan-African funds for a multi-deal close motion.',
    color: '#475569',
  },
  {
    id: 'gc_audit_committee',
    label: 'General Counsels / Audit Committees',
    whyTheyLookAttractive:
      'Your 18-framework compliance map (post-ISA 2007 fix) makes them look like a great target. Regulatory tailwinds (EU AI Act Article 14 enforceable Aug 2026) make their pain real and dated.',
    whyTheyAreATrap:
      'GCs are gatekeepers, not early adopters. Their literal job on any enterprise contract is to find reasons NOT to sign. They will relentlessly scrutinize your data retention windows, NDA compliance, lack of statistical confidence intervals on DQI, and your continuity-of-vendor risk as a 16-year-old solo founder. Pitching them directly at pre-seed is corporate suicide.',
    whenToRevisit:
      'ONLY after a CSO or M&A head champions the deal and pulls the GC into the procurement loop. Never sell to the GC first. Equip the champion with the GC artefact (DPR + DPA + Vendor Continuity Plan) so they can clear the GC review themselves.',
    color: '#64748B',
  },
];

export const MAALOUF_PRINCIPLES: MaaloufPrinciple[] = [
  {
    id: 'pressure_without_pressure',
    number: 1,
    label: 'Create pressure without creating pressure',
    maaloufQuote:
      '"I have a spot next Tuesday open for an onboarding call where we can actually get ahead and maximize that." Try to find ways to create pressure without actually creating pressure.',
    diApplication:
      'For the mid-market associate persona, create urgency around their NEXT IC meeting (date-specific, stakes-specific) rather than around your sales quota. The pressure is theirs, not yours.',
    antiPattern:
      '"This price is only good through Friday." That is YOUR pressure on THEM. Sophisticated buyers smell desperation in 2 seconds and use it to negotiate down or stall.',
    idealPhrase:
      '"Your IC meeting is Thursday. I have a 10-minute slot today to run your draft through the pipeline before your MD sees it. After Thursday it will not matter."',
  },
  {
    id: 'low_vs_high_ticket',
    number: 2,
    label: 'Low-ticket vs. high-ticket: different rules',
    maaloufQuote:
      "If you're selling people $1,500 a month, $2,000 a month — I sell them on the spot. I don't let them get off that call. The big guys don't want to be pressure sold.",
    diApplication:
      "For the next 30 days, you are playing by Maalouf's LOW-TICKET rules. £149-499 is corporate-card territory; close on the call. The 12-month MEDDPICC enterprise consensus motion is for the F500 ceiling, NOT for the wedge cohort.",
    antiPattern:
      'Treating a £149/mo associate sale like a £30K F500 deal. Sending them DPAs, security questionnaires, and a 14-stakeholder buying committee map. They will bounce because the friction does not match the price.',
    idealPhrase:
      '"This is a £149/mo per-seat license. You can swipe a card right now and have your first audit running in 5 minutes. No DPA required at this tier — it ships when you upgrade to Strategy."',
  },
  {
    id: 'authority_not_trust',
    number: 3,
    label: 'Authority is not trust',
    maaloufQuote:
      'Authority is not trust. Do they perceive you as someone of status? Do you make them feel like you are more important to them than they are to you?',
    diApplication:
      "Your authority anchors are NOT 'I am a 16-year-old founder.' They are: published Decision Provenance Records, the 143-case academic reference library, the Wiz advisor, the Recognition-Rigor Framework. Lead with the artefact, not the founder bio.",
    antiPattern:
      'Apologizing for your age, your stage, your lack of paying customers. Every apology drops your authority by 30%. The buyer reads it as "this person needs me more than I need them" and they pull teeth on price.',
    idealPhrase:
      'Lead with: "We have audited 143 historical strategic decisions to calibrate the engine. Every flagged bias is mapped to a peer-reviewed paper at /taxonomy. The Decision Provenance Record we ship today maps onto EU AI Act Article 14 record-keeping by design."',
  },
  {
    id: 'talk_about_other_opportunities',
    number: 4,
    label: 'Talk about other opportunities',
    maaloufQuote:
      'No one wants to go to the empty restaurant. When you are not talking about other things, other opportunities, other projects you have got going on — it makes it sound like you do not have anything to do except them.',
    diApplication:
      "Mention specific other prospects (ANONYMIZED — never name a real prospect). Phrases like 'I am running 15 associate pilots this month' or 'three fractional CSOs are standardizing on this' anchor you as in-demand, not desperate.",
    antiPattern:
      'Saying "you would be our first customer." Even if true, it tells the buyer you have nothing else and they have all the leverage. Negotiation becomes one-way.',
    idealPhrase:
      '"I am running 15 associate pilots this month and bandwidth is tight. Tuesday is the next slot I have for a new pilot."',
  },
  {
    id: 'embody_bigger_better',
    number: 5,
    label: 'Embody being bigger and better',
    maaloufQuote:
      'You must embody being bigger and better to get there. You have to have this new identity — that you are more important to their business than they are to your business, even if it is not true.',
    diApplication:
      "When the buyer asks 'what other tools do I need to integrate with this' — answer 'we are the layer your other tools attach to, not the other way around.' You are the reasoning layer, not the integration target.",
    antiPattern:
      'Sending status updates like "we are still pre-revenue and looking for design partners." Even when factually true, this triggers the "low authority" trap. Reframe: "We are running a closed design-partner cohort with five seats."',
    idealPhrase:
      '"You are not buying a fragile startup. You are buying a productized academic synthesis with SOC 2 Type II infrastructure on Vercel + Supabase. The Decision Provenance Record you receive is the artefact your audit committee will eventually require."',
  },
  {
    id: 'stay_in_business_longer',
    number: 6,
    label: 'Stay in business longer',
    maaloufQuote:
      'If you are in business for six months and I am in business for six years, and we are fighting for the same client — I am gonna win. People do not like to be the only people working with you.',
    diApplication:
      'You cannot fake six years of operation, but you CAN fake the social-proof equivalents: a 143-case reference library shipped, a multi-jurisdiction compliance map covering G7 / EU / GCC / African markets, the Wiz advisor relationship documented, R²F as a category claim with academic anchors.',
    antiPattern:
      'Pretending you have customers you do not have. Sophisticated buyers triangulate via LinkedIn, Crunchbase, and direct reference checks. One discovered lie ends the deal.',
    idealPhrase:
      '"We have shipped two production specimens — the WeWork S-1 audit and the Dangote 2014 Pan-African expansion plan — and we are in active design-partner conversations with three Pan-African funds. Our advisor scaled Wiz from zero to $32B."',
  },
];

export const SATYAM_PILLARS: SatyamPillar[] = [
  {
    id: 'category_of_one',
    number: 1,
    label: 'Present a category of one, not an offer',
    summary:
      'When you present an offer, the prospect compares it. When you present a category of one, comparison breaks down — they evaluate it on its own terms.',
    satyamQuote:
      'When you present a category of one, that comparison mechanism breaks down. There is nothing to compare it against. The prospect has to evaluate it on its own terms.',
    diApplication:
      "Decision Intel is NOT 'an AI decision-intelligence platform' — that invites comparison to Cloverpop and Aera. It IS the 'native reasoning layer for every high-stakes call.' The reasoning-layer category does not exist yet; you are creating it. Cloverpop logs decisions; Decision Intel audits them.",
    thisWeekMove:
      'Strip every "AI decision-intelligence platform" and "decision intelligence" framing from cold-context surfaces. Replace with "reasoning layer" or "60-second audit on a strategic memo" per the cold-context-onramp rule.',
  },
  {
    id: 'us_vs_them_frame',
    number: 2,
    label: 'Run the us-vs-them conversation without arrogance',
    summary:
      'Let the prospect raise the comparison. Listen to what they say about competitors. Their complaints are doors into your differentiation.',
    satyamQuote:
      'Most people in this space will place someone and their involvement ends there. What I have found is that the placement failing usually has nothing to do with the rep. It has to do with the infrastructure they walked into.',
    diApplication:
      'On every discovery call, ask: "You have probably looked at Cloverpop or asked your team to use ChatGPT for this. What did those conversations look like?" Then listen — every complaint about Cloverpop ("just logging, no audit") is a door into the R²F + DPR differentiation.',
    thisWeekMove:
      "Add the question to every cold-call opener script. Track which complaints recur — the top 3 become the 'category-failure-mode' anchor for the cold email subject line.",
  },
  {
    id: 'conviction_is_the_variable',
    number: 3,
    label: 'Conviction is the variable that makes everything else work',
    summary:
      'Conviction cannot be performed. Sophisticated buyers read energy. Real conviction transmits; faked conviction loses the deal in the first 30 seconds.',
    satyamQuote:
      'Conviction is not performance. You cannot fake it at a high level with sophisticated buyers. They have been sold to too many times. They notice the tiny hesitations.',
    diApplication:
      'Your conviction anchors: (a) the metacognition speech you delivered at school — that is the voice; (b) the 2008-financial-crisis paper — that is the academic anchor; (c) the financial-literacy initiative — that is the proof you operationalize cognitive education. Read them aloud before every call until the language is muscle memory.',
    thisWeekMove:
      'Record yourself running the 7-minute artifact-led pitch (Founder Hub Sales Toolkit). Listen for hesitations on price, on the 16-year-old framing, on Pan-African specifics. The hesitations ARE the conviction gap. Drill them out by re-recording until clean.',
  },
  {
    id: 'charge_more_win_anyway',
    number: 4,
    label: 'Charge more than competition and win anyway',
    summary:
      'Price is perceived value constructed in real time, in the call. The market rate is the floor, not the ceiling. Better diagnosis + specificity + confidence = premium.',
    satyamQuote:
      'Price is determined by the perceived value you create in the conversation. The market rate is just the floor.',
    diApplication:
      "Cloverpop comparable tier is ~£59/seat/mo. DI's £149/mo Professional is 2.5× that AND wins because the diagnosis is sharper (Recognition-Rigor Framework versus Cloverpop's logging-only model) and the artefact is concrete (DPR PDF versus a dashboard). Premium price is a feature for the buyer, not a bug.",
    thisWeekMove:
      "Practice holding the £149 frame on every discovery call. When the buyer says 'that is more than Cloverpop,' the response is: 'Cloverpop is logging. We audit. The £90 difference per seat per month is the cost of catching one Echo Chamber pattern before capital is committed.'",
  },
  {
    id: 'sales_infrastructure_is_the_weapon',
    number: 5,
    label: 'The sales infrastructure is the weapon',
    summary:
      'Tight qualification, pre-call nurture assets, objection libraries, call-review feedback, metrics that matter. A team running on systems beats a team running on talent + vibes.',
    satyamQuote:
      'A competition running on talent and vibes cannot outperform a team running on systems, data, and continuous improvement. The talent gap is easier to close than the systems gap.',
    diApplication:
      'You already have most of the infrastructure (Sales Toolkit tab, Buying Committee Map, Deal Stall Diagnostic Tree, Cialdini wheel, Outreach Hub). What is MISSING: pre-call nurture asset library (the per-persona asset names listed under each fastest-converter), call-review checklist, close-rate-by-persona tracking.',
    thisWeekMove:
      'Build a 1-page sales-call-review checklist (5 yes/no questions per call) and run it after every discovery call this week. Examples: "Did the buyer raise the comparison themselves?" "Did I lead with the artefact?" "Did I avoid apologizing for stage?"',
  },
];

export const SILENT_OBJECTIONS: SilentObjection[] = [
  {
    id: 'dqi_trust_me_math',
    label: 'DQI is "trust me" math, not enterprise ROI',
    whatBuyerThinks:
      "You're charging me £2,499/mo to tell me my M&A memo is a 'D' based on a weighting formula you just invented. Where are the confidence intervals? If I take this heuristic counterfactual dollar impact estimate to my CFO to justify the software cost, I will get laughed out of the room.",
    whyItKillsTheDeal:
      'Audit committees and CFOs reject black-box financial estimates. They evaluate evidence for a living. If your scoring system looks like a toy grade rather than statistically defensible risk modeling, it fails procurement immediately.',
    thisWeekFix:
      'Suppress hard counterfactual dollar amounts on the DPR + InlineAnalysisResultCard. Replace with "DQI improvement +X%" + a "Monetary impact: pre-validation (v0.x)" tag. Keep the dollar math hidden in tooltips for internal inspection only. Until N>30 outcome-validated audits per org exist, dollar claims fail procurement.',
    status: 'in_progress',
    verbatimResponse:
      'The DQI is currently in v2.0 calibration — the methodology is published at /how-it-works and the weights derive from the 143-case historical reference library. Statistical confidence intervals roll out as the per-org outcome flywheel produces N>30 validated audits. Until then we ship the directional grade, not the false-precision dollar figure.',
  },
  {
    id: 'no_nda_hard_purge',
    label: 'Cathedral of code without NDA hard-purge',
    whatBuyerThinks:
      'You have an AI boardroom simulator, 14 RSS feeds, and a dozen dashboards, but I cannot bulk-delete my confidential target data when a deal dies or an NDA expires. This kid built 40 cool features but does not understand that data lifecycle governance is my actual job.',
    whyItKillsTheDeal:
      'M&A partners and F500 GCs care more about data compartmentalization and legal exposure than your 12-node pipeline. A 30-day soft-delete window is a catastrophic liability for a broken NDA. If they cannot purge confidential targets instantly, they will never upload their pipeline.',
    thisWeekFix:
      'Build POST /api/deals/[id]/archive endpoint for 7-day NDA-expiry hard purges. Surface the endpoint in the deal-detail UI as a "Purge on NDA expiry" toggle. Document in /security and the DPA template.',
    status: 'todo',
    verbatimResponse:
      'Your data never trains our models, by contract. AES-256-GCM encryption at rest, TLS 1.2+ in transit, and you can hit our archive endpoint to trigger a 7-day hard purge the moment the deal dies. You bulk-delete the entire engagement with one click.',
  },
  {
    id: 'founder_continuity',
    label: '16-year-old solo founder continuity risk',
    whatBuyerThinks:
      'He is a genius, but he is 16 and operating solo. What happens to my enterprise SLA, compliance records, and £30K contract when he has AP exams next May, or leaves for Stanford? There is zero technical continuity if he gets hit by a bus or just gets busy.',
    whyItKillsTheDeal:
      'You cannot sell a "system of record for strategic reasoning" if the system itself is viewed as a fragile single-point-of-failure startup. A Fortune 500 enterprise will not migrate board-level processes to a platform that might be abandoned during college midterms.',
    thisWeekFix:
      'Write a formal "Vendor Continuity & Succession Plan" one-pager for the data room. Document who maintains the codebase (e.g., a senior engineer sourced via the Wiz advisor network) if the founder is incapacitated or in exams. Answer the question before procurement asks it.',
    status: 'todo',
    verbatimResponse:
      'You are not buying a fragile startup. You are buying a productized academic synthesis with SOC 2 Type II infrastructure on Vercel + Supabase, and our data room includes a Vendor Continuity Plan backed by a senior engineering network that previously scaled Wiz to $32B. The Decision Provenance Record format is open and the codebase is documented; no single point of failure.',
  },
  {
    id: 'chatgpt_wrapper',
    label: 'The "ChatGPT wrapper" suspicion',
    whatBuyerThinks:
      "This '3-judge statistical jury' is just three API calls to Gemini with different temperatures. My internal dev team could build this prompt chain in a weekend using LangChain. I am not paying a premium for a UI wrapped around a foundation model.",
    whyItKillsTheDeal:
      'If a buyer believes your product is just clever prompt engineering, they will defer to their existing enterprise Microsoft Copilot or Palantir AIP rollout rather than onboarding a new vendor.',
    thisWeekFix:
      'Already shipped: rename "3-judge jury" to "Ensemble Sampling" across all marketing. Forward-looking discipline: shift 100% of defensive messaging from the LLM pipeline to the 143-case reference library + Kahneman × Klein R²F academic synthesis. The moat is the historical pattern-matching and the future outcome data, NOT the prompts.',
    status: 'shipped',
    verbatimResponse:
      'You can spin up three Gemini calls in a weekend. You cannot spin up the 143-case Decision Knowledge Graph, the Recognition-Rigor Framework with peer-reviewed academic anchors, the Decision Provenance Record mapped to EU AI Act Article 14, and the per-org Brier-scored outcome flywheel. The prompts are 10% of the moat. The rest is the IP.',
  },
  {
    id: 'pan_african_regulatory',
    label: 'The Pan-African regulatory illusion',
    whatBuyerThinks:
      "You pitched me a Pan-African compliance map tailored for African funds, but I want to know whether you cover MY primary regulator (e.g. Nigerian SEC ISA 2007, current FRC Nigeria code, CBN, NDPR). If those are not in the audit by name, you do not actually know my market.",
    whyItKillsTheDeal:
      'For a licensed firm managing significant AUM, regulatory mapping is not a marketing bullet point — it is a legal requirement. Presenting incomplete regional compliance breaks trust instantly and turns an "insider" wedge into an "outsider" misstep.',
    thisWeekFix:
      'ISA 2007 was added to africa-frameworks.ts in the 2026-04-29 ship; the Pan-African map now covers 12 African regimes (NDPR, CBN, FRC Nigeria, ISA 2007, WAEMU, CMA Kenya, CBK, BoG, CBE, PoPIA, SARB, BoT). Every consumer surface MUST derive the count from getAllRegisteredFrameworks().length so additions ripple automatically — never literal a number. When entering a new market, add the primary governing body in the same week you enter, not after.',
    status: 'shipped',
    verbatimResponse:
      "You are right, and that is exactly why we map directly with the regulator's primary instrument. The Nigerian SEC ISA 2007 and the current FRC Nigeria Code are mapped flag-by-flag to the relevant DPR sections. Bring me your toughest compliance question and we will walk through how the engine catches it.",
  },
];

export const CUT_LIST: CutListItem[] = [
  {
    feature: '14 RSS Feeds & Content Studio',
    verdict: 'kill',
    rationale:
      'Complete vanity features for a high-stakes cognitive auditor. Cuts out of the 30-day funnel entirely; deferred to month-6 when content marketing matters.',
  },
  {
    feature: 'Generic RAG Chat / AI Assistant / Copilot',
    verdict: 'kill',
    rationale:
      'You are selling an automated, deterministic audit. A generic chat interface turns you back into a "ChatGPT wrapper" in their minds. The audit IS the answer; chat is friction.',
  },
  {
    feature: 'Meeting Transcript Analysis & Speaker Bias Profiles',
    verdict: 'kill',
    rationale:
      'The 30-day wedge is auditing written strategy memos and CIMs. Analyzing Zoom calls is a completely different product with massive friction.',
  },
  {
    feature: 'Decision Knowledge Graph & Causal DAG',
    verdict: 'hide_flag',
    rationale:
      'A solo consultant or associate running their first document gets exactly zero value from an empty graph. Only provides value at month 6 with 30+ decisions logged.',
  },
  {
    feature: 'AI Boardroom Simulator (5-persona debate)',
    verdict: 'hide_flag',
    rationale:
      'Too heavy for a solo user\'s quick workflow. Exception: keep the "Dr. Red Team" adversarial node — predicting the single hardest objection the MD/buyer will ask is the exact value these personas pay for.',
  },
  {
    feature: 'Team Cognitive Profiles & Org Benchmarking',
    verdict: 'enterprise_only',
    rationale: 'Solo advisors and individual associates do not have teams to benchmark.',
  },
  {
    feature: '17/18-framework Compliance Mapping (SOX, EU AI Act, etc.)',
    verdict: 'enterprise_only',
    rationale:
      'A 24-year-old associate and a boutique M&A advisor do not care about EU AI Act. Only Fortune 500 GCs care, and they take 12 months to close.',
  },
  {
    feature: 'Enterprise Slack Integration',
    verdict: 'enterprise_only',
    rationale: 'Solo users are not deploying enterprise Slack bots to capture team deliberations.',
  },
  {
    feature: 'Browser Extension (5-second quick-score on DocSend)',
    verdict: 'keep',
    rationale:
      'Massive accelerator. The ability to run a 5-second quick-score on a DocSend CIM without downloading it removes all ingestion friction. Ship this for the 30-day wedge.',
  },
  {
    feature: 'DPR PDF Export',
    verdict: 'keep',
    rationale:
      'This is the literal deliverable the fractional CSO attaches to their strategy deck to justify their retainer. The fractional-CSO buyer is paying £249/mo specifically to download this PDF.',
  },
];

export const SIMPLIFIED_FUNNEL: FunnelStep[] = [
  {
    number: 1,
    label: 'Landing Page · The Hook',
    what: 'H1: "Bulletproof your IC Memo / CIM before the partners tear it apart." Massive center-page text box and PDF dropzone. "Paste your draft. Get the 3 fatal flaws in 60 seconds."',
    whatItIsNot:
      'NO "native reasoning layer" abstraction. NO "X-framework compliance map" wall. NO category-creation framing for cold readers. The hook is fear, not category claims.',
    action:
      'The visitor pastes their draft memo or drops a PDF. The 60-second progress bar starts immediately. No registration wall.',
  },
  {
    number: 2,
    label: 'Demo / Upload · The Ingestion',
    what: 'Immediate processing. The 60-second streaming loading bar starts the moment the file lands.',
    whatItIsNot:
      'NO asking them to create a "Decision Frame" first. NO defining success criteria. NO inviting team members. NO market-context picker. NO 5-field context form. They drop the file; the audit runs.',
    action:
      'The audit runs in 60 seconds with the streaming progress bar visible. Names of the 12 nodes show as they fire — proves the engine is working without explaining what they do.',
  },
  {
    number: 3,
    label: 'Audit · The Reveal & The Wall',
    what: 'The DQI score (e.g., "DQI: 42 — High Risk"), names of the top 3 cognitive biases (Anchoring, Sunk Cost, Overconfidence), and the Dr. Red Team\'s single most damaging objection they are about to face.',
    whatItIsNot:
      'NO surfacing 10 tabs of SWOT, Noise, Logic, Intelligence. NO showing the full bias-instance excerpts (those are blurred). NO mitigation playbooks (those are paywalled). NO counterfactual dollar impact (until v3.0 confidence intervals exist).',
    action:
      'The actual excerpts from their text, the specific mitigation playbooks, and the counterfactual dollar impact are blurred. Only the headline + bias names + Dr. Red Team objection are visible.',
  },
  {
    number: 4,
    label: 'Checkout · The Conversion',
    what: 'Stripe modal: "Unlock this audit: £499" (M&A advisor) or "Upgrade to Professional: £149/mo" (associate / CSO). One-click checkout, card on file, audit unlocks 5 seconds after charge.',
    whatItIsNot:
      'NO 14-stakeholder buying committee map. NO DPA signature flow at this tier. NO procurement intake form. The ENTIRE conversion is one click + one card swipe.',
    action:
      'Card swipe → audit unlocks → DPR PDF download → the artefact is in their hands inside 90 seconds total. The fractional CSO immediately attaches it to their strategy deck.',
  },
];

export const NEVER_SAY_PHRASES: NeverSayPhrase[] = [
  {
    phrase: 'We can customize the platform to do whatever you need.',
    whyItKills:
      "Triggers Maalouf's low-authority trap (you sound desperate, pull teeth, get negotiated down). Triggers DI's Unpaid Dev Shop failure mode. You are not a dev shop.",
    saySteadInstead:
      '"This is the published roadmap. If your specific need is not on it, the answer is no. If it is on it, the timeline is X." No custom features outside the published roadmap.',
  },
  {
    phrase: 'Are you interested in a demo of how our 12-node LangGraph pipeline works?',
    whyItKills:
      'Triggers the "Cathedral of Code" trap. You are over-explaining the technology instead of protecting their revenue. Nobody cares about the 12 nodes. They care about the £187K cost of ignoring a bias.',
    saySteadInstead:
      '"Bring a redacted memo from a deal you lost last year. I will run the audit live in 7 minutes. If it does not flag the exact blind spots that cost you the deal, this is not for you."',
  },
  {
    phrase: 'We are an AI Decision Intelligence Platform.',
    whyItKills:
      'Violates Satyam\'s "Category of One" rule by inviting direct comparison to Aera (which owns the analyst term) or Cloverpop. Drops you into a Gartner-crowded category where you lose on every dimension except technical depth — which they will not see.',
    saySteadInstead:
      '"We are the Reasoning Layer for every high-stakes call. Cloverpop logs decisions. Decision Intel audits them. The category does not exist yet — we are creating it."',
  },
];
