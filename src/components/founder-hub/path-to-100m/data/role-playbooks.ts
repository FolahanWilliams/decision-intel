/**
 * RoleOutreachPlaybooks consumer data — 8 personas with discovery script,
 * killer pitch, meeting arc, signals, follow-up cadence, NotebookLM
 * follow-up question per role. Split out from monolithic data.ts at F2
 * lock 2026-04-29.
 *
 * Source synthesis: 2026-04-27 buyer-persona-tailored-explanation pass.
 * When personas evolve, update HERE only.
 */

export type RolePlaybook = {
  id: string;
  role: string;
  archetype: string;
  buyerType: 'wedge' | 'expansion' | 'channel' | 'amplifier' | 'capital' | 'fast_validator';
  priority: 'now' | 'summer_2026' | 'q3_2026' | 'q4_2026' | '2027';
  ticketBand: string;
  whatTheyWant: string[];
  whatKeepsThemUp: string[];
  howToReach: {
    coldChannel: string;
    coldOpener: string;
    coldBlunder: string;
    warmIntroPath: string;
  };
  discoveryQuestions: {
    opening: string[];
    rigor: string[];
    decisionGate: string[];
  };
  artefactToLead: string;
  killerPitch: string;
  threePhrasesNeverToSay: string[];
  meetingArc: { minute: string; move: string }[];
  signalsToListenFor: { positive: string[]; negative: string[] };
  followUp: { day: string; artifact: string }[];
  conversionWindow: string;
  whyTheyConvert: string;
  whyTheyDont: string;
  notebookLmFollowUp: string;
};


export const ROLE_PLAYBOOKS: RolePlaybook[] = [
  // -----------------------------------------------------------------------
  // 1. MID-MARKET PE/VC ASSOCIATE — fastest paid validation (NotebookLM 2026-04-28)
  // -----------------------------------------------------------------------
  {
    id: 'mid_market_pe_vc_associate',
    role: 'Mid-Market PE/VC Associate · "Adaeze" archetype',
    archetype:
      '24-28-year-old analyst / associate · drafts IC memos until 2 AM on a 13-inch laptop · no firm-level budget authority but personal ambition · acute fear of looking stupid in front of the Managing Partner during IC · UK + EU mid-market PE/VC firms are highest density',
    buyerType: 'fast_validator',
    priority: 'now',
    ticketBand:
      '£149/mo Professional tier · sits below the corporate-card threshold that triggers CFO approval · paid in 14-30 days · 6-9 month retention pattern',
    whatTheyWant: [
      'A 60-second bias audit on their IC memo BEFORE the Managing Partner sees it',
      'Specific named flags ("anchoring on the seller\'s asking price in section 3", "base-rate neglect in the synergy projections") with the exact sentence highlighted',
      'A pre-meeting cheat sheet of "what the partners will grill you on" — the Dr Red Team output',
      "Personal career-defending utility · their MD-impression matters more than their firm's decision quality at this career stage",
    ],
    whatKeepsThemUp: [
      'Walking into IC and being humiliated by the MD over a flaw they should have caught',
      'A junior-analyst-level bias error landing in a deal that closes badly — career-defining moment',
      'Missing the obvious objection a senior partner sees in 30 seconds that they missed in 4 weeks of work',
      'Being the analyst whose memo "needs more work" — the worst sentence in PE',
    ],
    howToReach: {
      coldChannel:
        'LinkedIn DM at scale to mid-market PE/VC associates · also: London networking events in private equity + corporate development circles where the founder can meet associates in person',
      coldOpener:
        'I built an 11-node bias auditor for investment memos. Run your draft through it before your MD sees it — it highlights the exact logical gaps the partners will grill you on, in 60 seconds. £149/mo, sits below the credit-card-approval threshold.',
      coldBlunder:
        'Pitching the firm-level value proposition ("decision quality across the portfolio") — the associate doesn\'t buy that. Pitch the personal MD-impression-defending value.',
      warmIntroPath:
        "TASIS England school network → Oxford / LSE / Imperial alumni now in PE/VC associate seats · the founder's extended-family McKinsey connections are also adjacent (associates frequently cross between MBB and PE).",
    },
    discoveryQuestions: {
      opening: [
        '"What\'s the worst feedback you\'ve gotten from your MD on an IC memo? What was the bias your draft missed?"',
        '"How long do you spend on a memo before it goes to IC? Where\'s the bottleneck — research, framing, defending it in the room?"',
        '"When the MD pushes back, what is usually the question you wish you\'d caught yourself?"',
      ],
      rigor: [
        '"If you had a 60-second audit on your draft BEFORE the MD reviews it — flagging the 2-3 cognitive biases the partners will catch first — what\'s your cycle look like?"',
        '"For your last 5 memos that went to IC, which got pushed back the hardest? Was it execution-quality or bias / blind-spot?"',
        '"Walk me through the objection that hurt the most last quarter. What pattern would you have caught with 60 more seconds of pre-IC scrutiny?"',
      ],
      decisionGate: [
        '"£149/mo on your corporate card — sits below the approval threshold. Want to run your next draft through it tonight?"',
        '"If we\'re not flagging blind spots your MD catches in the first 3 audits, cancel — full refund."',
        '"If this works, what would you tell your peers at firm X? Could you bring 2-3 associates on your team?"',
      ],
    },
    artefactToLead:
      "Live audit on a redacted public memo (WeWork S-1 or any famously failed IC document). Show the Dr Red Team objection FIRST — that's the feature that proves the AI is smarter than the analyst. The 12-node pipeline / R²F vocabulary stays warm-context only.",
    killerPitch:
      "You're drafting IC memos at 2 AM. Your MD sees flaws in 30 seconds that took you 4 weeks not to notice. £149/mo, on your credit card, sits below the CFO threshold. Run your draft through this BEFORE the MD sees it. If it's not catching things you missed in the first 3 audits, cancel. The Dr Red Team objection alone is worth £149.",
    threePhrasesNeverToSay: [
      '"Recognition-Rigor Framework arbitrating Kahneman + Klein" — they don\'t care about academic moats; they care about not being humiliated tomorrow',
      '"Decision Provenance Record for audit committees" — that\'s an enterprise vocabulary; they\'re a personal user',
      '"60-second audit on a strategic memo before the room sees it" — works for CSOs, NOT associates · associates already think in IC-memo language; mirror their language',
    ],
    meetingArc: [
      {
        minute: '0:00-1:00',
        move: 'Frame: "Bias audit on your draft IC memo. 60 seconds. Names the 3 biggest flags before your MD sees it."',
      },
      {
        minute: '1:00-3:00',
        move: 'Live audit on the WeWork S-1 (or a redacted memo they brought) — show DQI + 3 biases + Dr Red Team objection.',
      },
      {
        minute: '3:00-7:00',
        move: 'Discovery: "What\'s the worst feedback you\'ve gotten from your MD recently? Would this have caught it?"',
      },
      {
        minute: '7:00-12:00',
        move: 'Pricing: £149/mo, corporate card, sits below approval threshold. Cancel anytime. First audit free.',
      },
      {
        minute: '12:00-15:00',
        move: 'Close: "Run your next draft tonight. If it\'s not catching things, full refund."',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific recent IC memo where they got humiliated',
        'They ask "can I run it on a draft tonight?" within the first 8 minutes',
        'They volunteer the corporate-card-threshold detail unprompted',
        'They mention a peer who would also benefit',
      ],
      negative: [
        'They redirect to "let me ask my MD" — usually means they\'re too junior or too risk-averse to swipe their card without permission',
        'They focus on firm-level value ("would this help our IC process?") — wrong frame; redirect to personal MD-impression',
        "They ask about SOC 2 / EU AI Act — they're not the buyer; that's firm-level. Disqualify or escalate.",
      ],
    },
    followUp: [
      {
        day: 'T+0 (immediately after demo)',
        artifact:
          'Free first-audit voucher · DPR PDF on the redacted memo they shared · 1-line follow-up "Run your next IC draft tonight."',
      },
      { day: 'T+24h', artifact: 'Check-in DM: "Did you run a draft? What did the audit catch?"' },
      {
        day: 'T+7d',
        artifact:
          'Stripe checkout link · cancel-anytime framing · "If the first 3 audits don\'t catch things you missed, full refund"',
      },
      {
        day: 'T+30d',
        artifact:
          'Renewal check-in + ask for 2-3 peer-associate referrals at their firm or peer firms',
      },
    ],
    conversionWindow: '14-30 days · single-meeting close on credit card · no procurement cycle',
    whyTheyConvert:
      'Acute personal career fear + pricing under the corporate-card-approval threshold + Dr Red Team output that proves immediate value. The friction is near-zero: no procurement, no GC, no IT review. Just swipe.',
    whyTheyDont:
      "They're too junior to use a corporate card without MD approval (rare but real). Or their firm has a \"no AI tools\" blanket policy. Or they're not actually an associate — they're a partner shadowing as one. Disqualify quickly.",
    notebookLmFollowUp:
      "For mid-market PE/VC associates, what's the typical 6-month retention curve? When do they churn (graduation to associate director, firm AI-tool policy change, deal-flow drought)? What's the path to converting them as champions when they get promoted to associate director or principal?",
  },

  // -----------------------------------------------------------------------
  // 2. BOUTIQUE SELL-SIDE M&A ADVISOR — fastest paid validation, direct revenue link
  // -----------------------------------------------------------------------
  {
    id: 'boutique_sell_side_ma',
    role: 'Boutique Sell-Side M&A Advisor · "Potomac" archetype',
    archetype:
      "2-10-person M&A advisory shop · paid only on closing · UK + US mid-market sell-side · 5-15 deals/year · CIM is the deliverable; valuation drops or deal dies if PE buyer's IC spots a flaw · MD or partner is the actual buyer (small enough firm that the MD has the corporate card)",
    buyerType: 'fast_validator',
    priority: 'now',
    ticketBand:
      '$499 per-deal audit OR £149-249/mo Professional · per-deal pricing matches their commission-on-close model · paid in 14-21 days',
    whatTheyWant: [
      "A pre-market Dr Red Team audit on the CIM — names the 3 fatal flaws a PE buyer's IC will spot",
      'Cross-document conflict scan across the CIM + financial model + management presentation — catches inconsistencies that kill valuations',
      'Independent third-party DPR they can attach to the CIM appendix · proves to PE buyer that the seller has done the rigor work',
      'Direct revenue protection: a 7-minute audit that prevents a £100K-£2M commission from collapsing',
    ],
    whatKeepsThemUp: [
      "A PE buyer's IC catches a hockey-stick projection or unsupported synergy claim → valuation drops 10-20%, commission drops 10-20%",
      'A deal collapses on a flaw the team should have caught in week 4 of diligence → zero commission, 6 months of work gone',
      'A buyer-side team uses better diligence tools than the sell-side does · negotiating asymmetry that costs money every quarter',
      'The "we\'ve been doing this 20 years" trap — the team that stops self-auditing eventually meets a buyer team that doesn\'t',
    ],
    howToReach: {
      coldChannel:
        'Direct cold email to the MD or partner of UK / US boutique M&A shops · also: M&A networking events in London (Tier 1 city for mid-market sell-side) where the founder can meet partners in person',
      coldOpener:
        "I built a 60-second AI red-team that simulates a PE buyer's IC. Here are the 3 fatal flaws it found in a public CIM [attach the WeWork DPR]. Run your draft CIMs through this before going to market — bulletproofs your valuation. £499 per deal, no subscription required.",
      coldBlunder:
        'Pitching subscription pricing to a deal-cadence business. They think in commission-per-close, not monthly recurring. Lead with $499 per-deal · subscription is a secondary option for high-volume shops.',
      warmIntroPath:
        'Wiz advisor (Josh Rainer) → his M&A network · TASIS England network → Oxford / LSE alumni in mid-market M&A · extended-family McKinsey connections (alumni at boutique firms post-MBB).',
    },
    discoveryQuestions: {
      opening: [
        '"What was the last deal where a PE buyer\'s IC caught something you missed in your CIM? What did it cost on valuation?"',
        '"Walk me through your typical CIM-to-market timeline. Where\'s the bias-review step?"',
        '"On your last 5 deals, how many times did the buyer\'s diligence find something that should have surfaced in your prep?"',
      ],
      rigor: [
        '"If you had a 60-second Dr Red Team audit on every CIM BEFORE going to market — flagging the 3 fatal flaws the buyer\'s IC would catch first — what\'s the commission delta on your last 12 months of deals?"',
        '"For cross-document conflict detection — when was the last time you found a contradiction between the CIM and the management model AFTER the buyer\'s team did?"',
        '"What\'s your team\'s current bias-review process pre-market? Who plays adversarial red-team internally?"',
      ],
      decisionGate: [
        '"$499 per deal · runs in 60 seconds · pays for itself the first time we catch something that would have dropped your valuation 5%."',
        '"Bring a redacted CIM from a deal you lost last year. I run the audit live in 7 minutes. If it doesn\'t flag the exact reason that deal died, this product isn\'t for you."',
        '"If we close one deal this quarter, can we be your standard pre-market step on every deal next quarter?"',
      ],
    },
    artefactToLead:
      'WeWork S-1 DPR (cross-doc conflict scan + Dr Red Team objections + DQI) · then the live evidence-moment audit on a redacted CIM they bring. Frame the DPR as the artefact that ATTACHES to their CIM appendix — third-party rigor proof for the buyer.',
    killerPitch:
      "You get paid on close. A PE buyer's IC catching one bad assumption drops your valuation 10-20% — that's your commission. £499 per deal, 60 seconds, runs the Dr Red Team that simulates the buyer's IC review. Cheaper than one hour of legal work. Pays for itself the first time we catch something that would have killed your commission.",
    threePhrasesNeverToSay: [
      '"Decision Quality Index" — they think in valuation multiple and commission, not abstract scores',
      '"Native reasoning layer" — too abstract for a deal-cadence business',
      '"Subscription tier with seats" — wrong economic model · per-deal pricing matches their reality',
    ],
    meetingArc: [
      {
        minute: '0:00-1:30',
        move: 'Frame: "Pre-market Dr Red Team on every CIM. £499 per deal. Catches the 3 flaws the buyer\'s IC would hit first."',
      },
      {
        minute: '1:30-5:00',
        move: 'Live audit on the WeWork S-1 OR a redacted CIM they brought · cross-doc conflict scan · highlight the dollar-impact-of-catching-this-flaw on valuation.',
      },
      {
        minute: '5:00-10:00',
        move: 'Discovery: "When did this last cost you commission? Walk me through it."',
      },
      {
        minute: '10:00-15:00',
        move: 'Pricing: £499 per deal, runs in 60 seconds, attaches to CIM appendix as third-party rigor proof.',
      },
      {
        minute: '15:00-20:00',
        move: 'Close: "Bring me your next CIM draft this week. Audit on me. If it doesn\'t flag something useful, no charge."',
      },
    ],
    signalsToListenFor: {
      positive: [
        "They name a specific past deal where the buyer's IC dropped the valuation",
        'They volunteer "we don\'t have an internal red-team process" within the first 5 minutes',
        'They ask about the cross-document conflict scan unprompted',
        'They reference a peer firm using AI tools as competitive pressure',
      ],
      negative: [
        'They redirect to "we have our own quality process" without naming what it IS',
        'They focus on subscription pricing — wrong economic model · counter with per-deal',
        "They ask about regulatory mapping (EU AI Act / SOX) — they're a sell-side advisor, not a regulated entity · disqualify or redirect to enterprise tier",
      ],
    },
    followUp: [
      {
        day: 'T+0 (immediately after demo)',
        artifact:
          'Free audit voucher on next CIM · DPR specimen showing how it attaches to a CIM appendix · the Dr Red Team output from the live demo',
      },
      {
        day: 'T+48h',
        artifact:
          'Send a real CIM teardown (or specimen DPR adapted to their sector — tech / industrial / fintech) showing what the audit catches in their typical deal shape',
      },
      {
        day: 'T+1w',
        artifact:
          'Per-deal pricing confirm + Stripe checkout link · "Audit your next CIM, charged on close"',
      },
      {
        day: 'T+30d',
        artifact:
          'After first deal · ask for 2-3 boutique-firm peer referrals + case-study permission (anonymised)',
      },
    ],
    conversionWindow:
      '14-21 days · single-meeting close on per-deal pricing · no procurement cycle · MD has the card',
    whyTheyConvert:
      "Direct revenue link · per-deal pricing matches their commission-on-close model · the Dr Red Team output is a 60-second proof that the AI catches things their human team misses. Cheaper than one hour of legal work; pays for itself the first time it catches a flaw the buyer's IC would have caught.",
    whyTheyDont:
      'Their firm has a "we\'ve been doing this 20 years" cultural posture that defensively rejects external tools. Or they have an in-house adversarial-review process they trust. Force the Evidence Moment with a redacted CIM from a deal they lost — if the audit doesn\'t flag the exact reason it died, accept the no.',
    notebookLmFollowUp:
      "What's the typical mid-market boutique M&A advisor's deal cadence and tool budget? Specifically: how many deals/year does a typical 5-person shop close, what's the per-deal third-party-tool spend, and where in the workflow does the AI-tool spend currently land?",
  },

  // -----------------------------------------------------------------------
  // 3. SOLO / FRACTIONAL CSO (ex-MBB) — fastest paid validation via DPR-as-deliverable
  // -----------------------------------------------------------------------
  {
    id: 'solo_fractional_cso',
    role: 'Solo / Fractional CSO · ex-MBB consultant · "Independent" archetype',
    archetype:
      'Ex-McKinsey / BCG / Bain consultant · operates as independent advisor or fractional CSO for mid-market companies · charges £150-£500/hr or £15-50K/month retainer · sells strategic judgment as the product · UK + US London / NYC / SF density · LinkedIn-discoverable',
    buyerType: 'fast_validator',
    priority: 'now',
    ticketBand:
      '£149/mo Professional OR £249/mo Individual · paid in 14-30 days · DPR-as-deliverable is the conversion lever',
    whatTheyWant: [
      'A tamper-evident DPR they can attach to every strategy deliverable as an appendix · proves to the client that their recommendation is debiased',
      "Differentiation against other solo consultants who don't have algorithmic rigor proof",
      'A defensible answer to the client question "how do I know your strategic recommendation isn\'t just YOUR biases?"',
      'Time savings on bias-review — instead of self-auditing, run the audit, attach the artefact, move on',
    ],
    whatKeepsThemUp: [
      'A client who terminates the retainer because they "could just hire McKinsey for the same thing"',
      "A strategic recommendation that lands badly with the client's board → reputation damage → next-retainer-loss",
      'A peer consultant landing the same client at a higher rate by claiming better methodology',
      'The universal "consultants have their own biases" critique that erodes trust over time',
    ],
    howToReach: {
      coldChannel:
        'Cold email to LinkedIn-discoverable solo / fractional CSOs · UK + US filter · ex-MBB filter · 5-15 years post-MBB ideal · also: London speaking / networking events for ex-consultants and fractional executives',
      coldOpener:
        'You sell strategic rigor, but your clients know humans have bias. Attach our tamper-evident Decision Provenance Record to the appendix of your next strategy deck. It mathematically proves to your client that your recommendation is debiased against 30+ cognitive errors. £149/mo, no commitment.',
      coldBlunder:
        'Pitching it as a tool to replace their judgment — instant defensive shutdown. Frame as ""amplifies your expert intuition while suppressing bias"" — Klein RPD framing, not Kahneman replacement.',
      warmIntroPath:
        "Wiz advisor (Josh Rainer) → his ex-MBB-now-fractional-CSO network · the founder's extended-family McKinsey connections — direct ex-MBB relationships · TASIS England school network → Oxford / LSE / Imperial alumni in fractional-CSO roles.",
    },
    discoveryQuestions: {
      opening: [
        "\"How do you currently respond when a client says 'how do I know your recommendation isn't just YOUR biases?'\"",
        '"What\'s your differentiation against other ex-MBB fractional CSOs at the same rate?"',
        '"On a typical strategy engagement, how much time do you spend on self-audit / bias-check before the deliverable goes to the client?"',
      ],
      rigor: [
        '"If every strategy deliverable carried a tamper-evident DPR appendix proving the recommendation was debiased against 30+ cognitive errors — what would change about your client conversations?"',
        '"For your next renewal conversation — what\'s the strongest evidence you currently have that your work is more rigorous than the alternative?"',
        '"How often does the client board push back on your recommendation in a way that suggests a missed blind spot?"',
      ],
      decisionGate: [
        '"£149/mo · cancel anytime · attach the DPR to your next deliverable. If the client doesn\'t notice or care, refund."',
        '"Audit one of your past strategy decks live in 7 minutes. If the DPR doesn\'t make you more confident in the recommendation, it\'s not for you."',
        '"What would you tell your peer fractional CSOs who are competing with you for the same retainer?"',
      ],
    },
    artefactToLead:
      "Live audit on a redacted past strategy deck they bring · show the DPR generation in real time · highlight that it attaches as a CIM-style appendix to their existing deliverable. The Klein RPD recognition framing matters more than the Kahneman bias-detection framing — they're selling expert intuition, not data.",
    killerPitch:
      "You sell strategic rigor at £150-500/hr. Your clients know humans have bias. Decision Intel doesn't replace your intuition — Klein's Recognition-Primed Decision framework AMPLIFIES your expert intuition while suppressing bias, giving you the auditable record to justify your retainer. £149/mo. Attach the DPR to every deliverable. Differentiates you from every other ex-MBB fractional CSO.",
    threePhrasesNeverToSay: [
      '"Replace your judgment" — instant defensive shutdown · they sell judgment',
      '"Bias detection" alone — feels accusatory · use "amplifies expert intuition while suppressing bias" instead',
      '"Enterprise procurement-grade" — they\'re solo, not procurement · pitch personal-brand differentiation',
    ],
    meetingArc: [
      {
        minute: '0:00-1:30',
        move: 'Frame: "Tamper-evident rigor proof attached to every strategy deliverable. Differentiates you from every other ex-MBB."',
      },
      {
        minute: '1:30-5:00',
        move: 'Live audit on a redacted past strategy deck they bring · show DPR generation in real time · point at the appendix-attachment shape.',
      },
      {
        minute: '5:00-10:00',
        move: 'Discovery: "How do you currently answer the \'consultants have biases too\' critique?"',
      },
      {
        minute: '10:00-15:00',
        move: 'Pricing: £149/mo, cancel anytime, DPR attaches to every deliverable.',
      },
      {
        minute: '15:00-20:00',
        move: 'Close: "Try it on your next deliverable. If the client doesn\'t notice or care, refund."',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They volunteer the "consultants have biases too" critique unprompted — proves the pain is real',
        'They ask about the DPR-as-appendix shape within 5 minutes',
        'They reference a peer using AI tools as competitive pressure',
        'They mention a client who has pushed back on bias / blind spots recently',
      ],
      negative: [
        'They focus exclusively on price — usually a junior consultant, not a fractional CSO',
        'They ask "does this train on my data?" without engaging the DPR shape — privacy-anchored, not value-anchored',
        'They redirect to "I\'ll discuss with my partners" — they\'re actually at a firm, not solo · disqualify',
      ],
    },
    followUp: [
      {
        day: 'T+0 (immediately after demo)',
        artifact:
          'Free 14-day trial · the DPR specimen on the redacted deck they shared · 1-line follow-up "Use it on your next deliverable."',
      },
      { day: 'T+48h', artifact: 'Check-in: "Did the client notice? What was the reaction?"' },
      {
        day: 'T+1w',
        artifact:
          'Stripe checkout link · cancel-anytime framing · "If your clients don\'t engage with the DPR appendix, refund"',
      },
      {
        day: 'T+30d',
        artifact:
          'Renewal check-in + ask for case-study permission (anonymised) + 2-3 ex-MBB peer referrals',
      },
    ],
    conversionWindow:
      '14-30 days · single-meeting close on monthly subscription · no procurement cycle · solo decision-maker',
    whyTheyConvert:
      'Universal "consultants have biases too" critique creates the pull · DPR-as-appendix is the differentiation lever against every other ex-MBB fractional CSO · Klein RPD framing positions DI as amplifier-not-replacer of their expert intuition · cancel-anytime removes risk.',
    whyTheyDont:
      "They're early in their fractional career and price-sensitive · or their clients are non-procurement-grade and won't engage with the DPR appendix shape · or they're actually at a firm and need partner approval. Force the live-audit Evidence Moment to test which case it is.",
    notebookLmFollowUp:
      'What\'s the typical solo / fractional CSO retention curve and upsell path? Specifically: when do they convert from £149/mo Professional to £249/mo Individual? When do they bring a client onto the platform as their own design partner (the "client-as-revenue-channel" pattern)? What\'s the LinkedIn-discoverability filter for ex-MBB fractional CSOs in the UK + US?',
  },

  // -----------------------------------------------------------------------
  // 4. PAN-AFRICAN / EM FUND PARTNER — summer 2026 design-partner BRIDGE (NOT GTM wedge per v3.2)
  // -----------------------------------------------------------------------
  // v3.2 lock 2026-04-30: Pan-African / EM-focused funds are NOT the GTM wedge.
  // The GTM wedge is Individual buyers @ £249/mo (UK + US CSOs / M&A heads / corp dev directors).
  // Sankore-class fund partners are the DESIGN-PARTNER BRIDGE — the warm-intro path that
  // produces reference DPRs to unlock the F500 ceiling. Strategic value isn't fund-buyer-budget;
  // it's fund operational insight + reference-grade artefact production.
  {
    id: 'pan_african_fund_partner',
    role: 'Pan-African / EM Fund Partner · summer-2026 design-partner BRIDGE (v3.2)',
    archetype:
      'Sankore-class · $200M-$2B AUM · capital-allocation pressure across NGN/KES/GHS/EGP/CFA · IC-cycle calendar · procurement-grade compliance need (NDPR, CBN, ISA 2007, WAEMU, PoPIA) · DESIGN-PARTNER bridge (NOT primary buyer per v3.2) · target only AFTER 5 paid Individual subscribers + 10 raving advocates + 1 verifiable referral via DPR fire (graduation rule)',
    buyerType: 'wedge',
    priority: 'summer_2026',
    ticketBand:
      '£2,000-3,000/mo design partner → £30-50K ARR after 3 IC cycles · expansion path to firm-wide seat after 6 months',
    whatTheyWant: [
      'Edge: a tool that catches blind spots BEFORE the IC vote — the "post-close partner question that starts with why didn\'t we see that in Q3" goes away',
      'Cross-border procurement gift: one tool that handles NDPR + CBN + WAEMU + PoPIA + CMA Kenya — saves their GC from per-region compliance memos',
      'Capital-allocation discipline: structured FX-cycle + sovereign-context analysis on every memo (Nigeria naira free-float, Kenya KES managed float, etc.)',
      'IC artefact: a hashed, tamper-evident DPR for LP reporting — the Client-Safe Export Mode is non-negotiable',
    ],
    whatKeepsThemUp: [
      'A bad call landing badly with the LP base — the Sequoia-LP question "what is your decision quality process?"',
      'FX volatility wiping a thesis they already have committed capital toward',
      'Local regulatory exposure they did not know about (NDPR fine, CBN restriction, WAEMU rule change)',
      'A GP-level mistake that becomes a fund-strategy question at LPAC',
    ],
    howToReach: {
      coldChannel:
        'LinkedIn DM with the Dangote DPR PDF attached, OR a Sankore-style warm intro via the Wiz advisor network (preferred 5×).',
      coldOpener:
        '60-second audit on a strategic memo. Attached: an anonymised Decision Provenance Record on the 2014 Dangote Pan-African expansion plan. Same audit fires on your IC memos in 60 seconds. Worth a 20-minute call to walk you through one of yours?',
      coldBlunder:
        '"Decision intelligence platform powered by AI" — generic SaaS framing reads as US-import noise; the partner deletes the message in 3 seconds. NEVER lead cold with "reasoning layer," R²F, DPR, or DQI as first impressions.',
      warmIntroPath:
        'Wiz advisor → Pan-African fund partners in his network → 30-min framing call → live audit on a redacted IC memo from a deal of theirs that went sideways.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last IC memo that landed badly. What did the analyst believe was the weakest assumption? Did it survive into the final memo?"',
        '"When a deal goes sideways post-close, who reconstructs the decision rationale? How long does it take?"',
        '"Across the last 12 months, how many IC memos have you written? How many touched FX-volatile jurisdictions?"',
      ],
      rigor: [
        '"If you had a 60-second audit BEFORE every IC vote — naming the 2-3 cognitive biases the room would catch first — which past deal would have ended differently?"',
        '"Your GC currently writes per-region compliance memos. What would change if every IC artefact already mapped to NDPR, CBN, WAEMU, and PoPIA?"',
        '"For the LP report, what is the audit-trail standard? Who is the toughest LP on decision-process documentation?"',
      ],
      decisionGate: [
        '"If we ran a 6-month design partnership — retro-auditing 3 dead deals + your live IC memos — what would the success metric be at month 6?"',
        '"What is your typical SaaS-tool procurement cycle? Who needs to see the DPR specimen before contract signature?"',
        '"If we close a £2,499/mo contract today and you log 10 outcomes by Q3, can we publish an anonymised reference case in Q4?"',
      ],
    },
    artefactToLead:
      'Dangote DPR (public/dpr-sample-dangote.pdf) — the anonymised 2014 Pan-African industrial expansion audit, with NDPR/CBN/WAEMU mapping section.',
    killerPitch:
      'Consulting firms charge you $1M to tell you about cognitive bias — and they have the same biases themselves. We built an AI that does not. For your IC cycle, this is a £30K/year insurance premium on every capital-allocation decision, with the regulatory map your GC already needs.',
    threePhrasesNeverToSay: [
      '"Decision intelligence platform" — Gartner-crowded, codes as Cloverpop / Aera / Quantellia',
      '"AI-powered" alone — buyer hears "ChatGPT wrapper"; the R²F + 12-node architecture differentiation gets lost',
      '"Boardroom strategic decision" — funds do not have boards; the language cues "this is built for F500, not us"',
    ],
    meetingArc: [
      {
        minute: '0:00-1:30',
        move: 'Frame: "60-second audit on every memo before IC. Here is one we ran on Dangote 2014."',
      },
      {
        minute: '1:30-3:00',
        move: 'Live audit on a redacted IC memo they brought (or on Dangote DPR if they did not).',
      },
      {
        minute: '3:00-5:00',
        move: 'Walk through 2-3 flagged biases and the regulatory framework cross-mapping.',
      },
      {
        minute: '5:00-7:00',
        move: 'Show DQI + counterfactual + Client-Safe Export Mode for LP reporting.',
      },
      {
        minute: '7:00-12:00',
        move: 'Discovery questions (above) — surface the post-close partner-question pain.',
      },
      {
        minute: '12:00-18:00',
        move: 'Discuss Design Partnership shape: 3 retro-audits + live IC memos for 6 months at £2,499/mo.',
      },
      {
        minute: '18:00-20:00',
        move: 'Close: "Two slots remain in the design-partner cohort. Are you the Pan-African anchor?"',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They bring a redacted IC memo without being asked',
        'They name a specific past deal that went sideways within the first 5 minutes',
        'They ask about LP-reporting and Client-Safe Export Mode',
        'They reference their fund\'s cross-border IC volume as a number ("we did 12 deals last year across 5 countries")',
      ],
      negative: [
        'They reach for "we already have a process" without naming what the process IS',
        'They ask about pricing in minute 3 (signals procurement-deflection, not engaged buying)',
        'They cannot name the last bad call — usually means they are not the IC decision-maker',
      ],
    },
    followUp: [
      {
        day: 'T+0 (4 hours after meeting)',
        artifact:
          'Thank-you note + Dangote DPR + the 2008 financial-crisis paper PDF + 1-page summary of what was discussed',
      },
      {
        day: 'T+24h',
        artifact:
          'Live audit run on a redacted version of THEIR memo, with the 2-3 biggest flags + counterfactual delta highlighted',
      },
      {
        day: 'T+72h',
        artifact:
          'Design-partnership term sheet (1 page): £2,499/mo, 6 months, 3 retro-audits + live IC, weekly Brier-score sync, Outcome Gate enforced contractually',
      },
      {
        day: 'T+7d',
        artifact:
          'Single concrete next step: "Either the term sheet works, or we found we are not a fit. Either way I want to know by Friday."',
      },
    ],
    conversionWindow: '2-3 meetings · 4-6 weeks · paid contract or paid no within 60 days',
    whyTheyConvert:
      'They evaluate evidence for a living. The Dangote DPR + the live audit on their own memo is unfakeable proof that DI catches things their current process misses. The Pan-African regulatory map clears their GC procurement gate in one artefact.',
    whyTheyDont:
      'They are mid-IC-cycle and have no bandwidth to onboard a new tool. OR: their fund AUM is below $200M and they are too small to justify $30K/year. OR: they have been burned by a prior US SaaS vendor who did not understand African regulatory regimes — earn that trust back with the Dangote DPR before talking pricing.',
    notebookLmFollowUp:
      'What does success look like at Day 90 of a Sankore-class design partnership? Specific metrics, owner, artefacts, and the LP-facing reference-case shape we should target for Q4 publication.',
  },

  // -----------------------------------------------------------------------
  // 2. F500 CHIEF STRATEGY OFFICER — the revenue ceiling
  // -----------------------------------------------------------------------
  {
    id: 'f500_cso',
    role: 'Fortune 500 Chief Strategy Officer · 12-month ceiling play (NOT primary outbound)',
    archetype:
      'Reports to CEO · $50-150M strategy budget · ships 40-60 strategic recommendations / year · audit-committee + board are the ultimate consumers · incumbent advisor: McKinsey / BCG / Bain at $500K-$5M per engagement · 6-12 month procurement cycle requires SOC 2 Type II + EU AI Act mapping + audit-committee sign-off · this is the unicorn revenue ceiling, NOT the 30-day target',
    buyerType: 'expansion',
    priority: 'q4_2026',
    ticketBand:
      '£50-150K ARR · multi-seat Strategy contract · 12-month auto-renew · enterprise security review',
    whatTheyWant: [
      'A 60-second hygiene step BETWEEN the analyst and the steering committee — names the exact biases the room will catch first',
      'A board-ready DPR artefact for every recommendation — defends the call when audit committee asks "how was this decided"',
      'EU AI Act Art 14 + SOX §404 + Basel III internal-controls coverage out of the box (procurement-grade)',
      'Quantitative DQI score that survives audit-chair scrutiny — confidence intervals, named methodology, version-stamped',
    ],
    whatKeepsThemUp: [
      'A board recommendation landing badly because of a blind spot the analyst missed',
      'The post-board question "why was this not flagged earlier" — career-defining moment',
      'Audit committee asking "what is your strategic-recommendation quality process" — having no answer',
      'A regulator request under EU AI Act Art 14 — having no audit trail for AI-augmented strategic decisions',
    ],
    howToReach: {
      coldChannel:
        'Warm intro from Wiz advisor preferred. Cold-acceptable: targeted LinkedIn DM with WeWork DPR + the 2008 paper, after 3-5 LinkedIn content engagements over 30 days.',
      coldOpener:
        'You ship 40-60 strategic recommendations a year that go to your steering committee. Three years ago there was no way to audit the reasoning behind those memos in 60 seconds — names the biases, scores the rigor, generates a Decision Provenance Record. Now there is. 20-minute call worth your time?',
      coldBlunder:
        '"Disrupting strategy consulting" or "the McKinsey alternative" — CSO defaults to defensive ("our consultants are great"). Do not position AGAINST the consultants in cold; they are the buyer\'s peers. Position WITH consultants in warm conversations.',
      warmIntroPath:
        'Wiz advisor → his McKinsey-alumni network → introductions to F500 CSOs in his coverage portfolio. Per the NotebookLM McKinsey synthesis, this is the highest-ROI advisor ask.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last strategic memo that landed badly. What was the analyst\'s weakest assumption? Did it survive into the final memo?"',
        '"For your steering committee, what is the average prep time per recommendation? Who is the harshest internal critic?"',
        '"On a typical board-ready memo, what does your team currently do for bias / blind-spot review BEFORE the steering committee sees it?"',
      ],
      rigor: [
        '"If you had a 60-second audit on every memo BEFORE the steering committee — naming the 2-3 biases the room would catch first, with a DQI score and a confidence interval — what would change about your process?"',
        '"For audit committee, what is the standard for documenting strategic-recommendation rationale? When was the last time you had to defend a call from 18 months ago?"',
        '"Under EU AI Act Article 14, you will need record-keeping on AI-augmented strategic decisions starting Aug 2026. What is your current plan?"',
      ],
      decisionGate: [
        '"If we ran a 6-month enterprise pilot — auditing the next 30 strategic memos plus retro-auditing 5 from the last quarter — what would the success metric be at month 6?"',
        '"What is your typical SaaS-tool procurement cycle for an enterprise contract? Who needs to see the DPR + security posture before signature?"',
        '"For the eventual reference case — would you co-publish an anonymised case study at month 12, or is that a non-starter for your industry?"',
      ],
    },
    artefactToLead:
      'WeWork S-1 DPR (public/dpr-sample-wework.pdf) — anonymised 2019 audit on the famously biased filing — surfaces founder-overconfidence, anchoring, and disclosure-asymmetry. Pair with the 2008 paper as the credibility anchor.',
    killerPitch:
      "You don't have a process for auditing strategic memos before they reach the board, because three years ago it was not technically possible. Now it is. Decision Intel is the 60-second hygiene step between your analyst and the committee — it makes your VP of Strategy the adult in the room on every recommendation.",
    threePhrasesNeverToSay: [
      '"Replace your consultants" — CSO needs consultants for political cover; never positioned as a competitor',
      '"AI-powered strategic platform" — buzzword bingo; CSO has heard it from 14 vendors this year',
      '"For founders / for individual users" — F500 CSO disqualifies as not procurement-grade in 2 seconds',
    ],
    meetingArc: [
      {
        minute: '0:00-1:30',
        move: 'Frame: "Hygiene step between analyst and steering committee. Here is the WeWork S-1 audit."',
      },
      {
        minute: '1:30-3:00',
        move: 'Walk through the WeWork DPR — biases flagged, regulatory mapping, DQI score, audit-committee artefact shape.',
      },
      {
        minute: '3:00-5:00',
        move: 'Live audit on a redacted memo they brought (or offer to do this on the next call if they did not).',
      },
      {
        minute: '5:00-12:00',
        move: 'Discovery questions — surface the steering-committee pain, the audit-committee documentation gap, the EU AI Act Art 14 timing.',
      },
      {
        minute: '12:00-18:00',
        move: 'Position: 6-month enterprise pilot, 30 live memos + 5 retro, security review starts in parallel.',
      },
      {
        minute: '18:00-20:00',
        move: 'Close: "What is the next step on your side? Who else needs to see the WeWork DPR?"',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific past memo that went badly within the first 10 minutes',
        'They ask about EU AI Act Art 14 or audit-committee documentation by minute 15',
        'They volunteer the procurement contact unprompted',
        'They mention the audit-committee chair by name',
      ],
      negative: [
        'They keep redirecting to "send me a deck and I will share with the team" — typical procurement-deflection; insist on a second meeting first',
        'They ask "what makes you different from Cloverpop" — answer with the R²F intellectual moat + the 17-framework regulatory map; if they push back further, they may have a Cloverpop bias',
        'They cannot name the audit-committee chair — usually means they are NOT the right buyer; ask for an intro',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Thank-you + WeWork DPR + the 2008 paper + 1-page summary of the strategic-memo audit pain we surfaced',
      },
      {
        day: 'T+48h',
        artifact:
          'Live audit run on a redacted recent memo (if they shared one) OR a famous failed strategic call from their industry',
      },
      {
        day: 'T+1w',
        artifact:
          'Enterprise pilot proposal: 6 months, 30 live + 5 retro, security review schedule, success metric, conversion price',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Procurement intro by next Friday or this is not the right time for your org"',
      },
    ],
    conversionWindow:
      '4-6 meetings · 12-24 weeks · enterprise procurement timeline · contract by month 6 of conversation',
    whyTheyConvert:
      'The WeWork DPR makes the audit committee comfortable. The R²F intellectual moat (Kahneman + Klein synthesis) survives McKinsey-trained scrutiny. The 17-framework regulatory map clears procurement on first pass. The DPR is the EU AI Act Art 14 answer that nobody else has.',
    whyTheyDont:
      'Continuity question (16-year-old solo founder). Reference-case maturity (no F500 logos yet). Procurement-checkbox gaps (SOC 2 Type II is infrastructure-only; full Type II audit pending). Address each in the 1-page continuity playbook + by-name reference to the wedge cases that will close in 2026.',
    notebookLmFollowUp:
      'What is the typical procurement cycle length for a F500 audit committee approving a new SaaS tool, broken down by stage (initial review, security review, legal review, vendor risk register, contract negotiation)? What is the cycle compression we would get from EU AI Act Art 14 timing pressure?',
  },

  // -----------------------------------------------------------------------
  // 3. F500 M&A HEAD / CORP DEV DIRECTOR
  // -----------------------------------------------------------------------
  {
    id: 'f500_ma_head',
    role: 'F500 M&A Head / Corporate Development Director',
    archetype:
      'Reports to CFO or Strategy · 5-15 deals/year · ticket sizes $50M-$2B · IC cycle every 4-6 weeks · post-close synergy targets are personally tracked · 70-90% of M&A deals fail to create expected value (Harvard / McKinsey baselines)',
    buyerType: 'expansion',
    priority: 'q3_2026',
    ticketBand:
      '£30-80K ARR · per-deal audit pricing for spike-volume firms ($1K-3K per deal) · annual seat for high-cadence corp dev shops',
    whatTheyWant: [
      'Pre-IC bias audit on the deal thesis — confirmation, sunk-cost, base-rate neglect surfaced BEFORE the partner vote',
      'Cross-document conflict detection on the deal room (CIM + financial model + counsel memo + IC deck) — all 4 audited together',
      'Historical-pattern matching against the 143-case library — "this thesis hits the same pattern Kraft-Heinz did on Unilever"',
      'Deal-level composite DQI + tamper-evident DPR for post-close diligence reviews',
    ],
    whatKeepsThemUp: [
      'A deal closing that the team should have killed in IC — career-killing moment',
      'A post-close "why didn\'t we see that in Q3" question from the partner who voted yes',
      'A regulator Q&A under EU Merger Regulation or Hart-Scott-Rodino with no audit trail',
      'An LP / activist-investor letter post-deal asking for the decision-quality documentation',
    ],
    howToReach: {
      coldChannel:
        'LinkedIn DM with the WeWork DPR + a teaser flag from the 2014 Dangote expansion (cross-border M&A precedent). Warm intro via Wiz advisor or via a portfolio CFO who has used DI on a strategy memo.',
      coldOpener:
        'Pre-IC bias audit on the deal thesis in 60 seconds. Cross-document conflict detection across CIM, model, counsel memo, IC deck. Pattern-match against 143 deal-failure cases. Worth a 20-min call before your next IC?',
      coldBlunder:
        '"M&A intelligence platform" — buyer hears Quantexa or DealCloud, defaults to "we already have that." Lead with the bias-audit + the historical-pattern match, NOT the data layer.',
      warmIntroPath:
        'Wiz advisor → portfolio-company CFO or Corp Dev director who has run a memo through DI → intro to peer at a non-portfolio firm.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last deal where the partner question post-close started with why didn\'t we see X. What was X? When did the team first notice X in the data room?"',
        '"For the average IC cycle, how many days between deal-team thesis lock and partner vote? What is the bias-review step in that window?"',
        '"Of last year\'s deals — what is the synergy realisation vs IC projection? Where do the gaps come from?"',
      ],
      rigor: [
        '"If you had 60-second pre-IC audits on every deal thesis — flagging confirmation bias, sunk-cost anchoring, base-rate neglect — would your IC vote pattern change on any past deal?"',
        '"For cross-document conflict detection — how often does your team find a contradiction between the CIM and the financial model AFTER IC has voted? What does that cost?"',
        '"For the audit committee, what is the standard for documenting deal rationale? When was the last time you had to defend a 2-year-old call?"',
      ],
      decisionGate: [
        '"If we ran a 3-deal pilot — pre-IC audit on every memo plus retro-audit of last year\'s top-5 closed deals — what would the success metric be?"',
        '"For pricing, would per-deal audit ($2K-3K per IC submission) or annual seat ($50K) work better for your cadence?"',
        '"Who needs to see the deal-level DPR before contract — Legal, GC, CFO, audit chair?"',
      ],
    },
    artefactToLead:
      'WeWork S-1 DPR (US public-market shape) for global firms. Dangote 2014 DPR for cross-border / EM-exposure firms. Both surface deal-thesis biases of the kind their IC vote would have caught.',
    killerPitch:
      '70-90% of M&A deals fail to create the value the IC voted for. The pattern is rarely missing data — it is unflagged confirmation bias, sunk-cost anchoring, and base-rate neglect that survived into the final memo. Decision Intel runs the bias audit + cross-doc conflict scan in 60 seconds before IC, and the deal-level DPR is the artefact your audit committee asks for after close.',
    threePhrasesNeverToSay: [
      '"M&A intelligence platform" — generic, gets lumped with Quantexa / DealCloud / DealRoom',
      '"For the M&A team" alone — bypasses the IC voter who is the real buyer; address the IC voter directly',
      '"Replace diligence" — never; we are the LAYER ON TOP of diligence, the bias-audit + reasoning-record-keeping artefact',
    ],
    meetingArc: [
      {
        minute: '0:00-1:30',
        move: 'Frame: "Bias audit + cross-doc conflict + DPR for the audit committee."',
      },
      {
        minute: '1:30-4:00',
        move: 'Live audit on a redacted IC deck or on the WeWork S-1 — show 4-doc cross-reference (CIM + model + counsel + IC deck).',
      },
      {
        minute: '4:00-7:00',
        move: 'Walk historical-pattern match: "your thesis hits the same pattern Kraft-Heinz did on Unilever — here is the counterfactual."',
      },
      {
        minute: '7:00-12:00',
        move: 'Discovery — surface the post-close partner-question pain, the IC-cycle bottleneck.',
      },
      {
        minute: '12:00-18:00',
        move: 'Pricing options — per-deal vs annual seat. Pilot shape: 3 deals + 5 retro.',
      },
      {
        minute: '18:00-20:00',
        move: 'Close: "When is the next IC? Can we run the audit on that thesis BEFORE the vote?"',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific deal where the IC voter caught a blind spot post-close',
        'They ask about cross-document conflict detection unprompted',
        "They volunteer the audit committee's next-meeting date",
        'They reference a specific historical M&A failure and ask "would you have caught this"',
      ],
      negative: [
        'They redirect to "send the deck to procurement" — corp dev rarely owns procurement, this is a deflection',
        'They ask about integration with their existing data room (Datasite, Intralinks) without engaging the bias-audit value — usually means they want a feature, not a tool',
        'They cannot name a recent IC-vote regret — usually means they are too new or not in the deal flow',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Thank-you + WeWork DPR + cross-doc conflict cheat-sheet (1 page) + the 2008 paper as credibility anchor',
      },
      {
        day: 'T+24h',
        artifact:
          'Live audit run on a redacted recent deal thesis (if shared) OR on a public M&A failure in their sector',
      },
      {
        day: 'T+1w',
        artifact:
          '3-deal pilot proposal — pre-IC audit + 5 retro audits, weekly Brier sync, deal-level DPR for audit committee, $X per deal or $Y annual seat pricing',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Pre-IC audit on your next deal by Friday, or we are not the right tool for this cycle"',
      },
    ],
    conversionWindow:
      '3-5 meetings · 8-16 weeks · IC-cycle aligned · paid pilot by month 3 of conversation',
    whyTheyConvert:
      'The 60-second pre-IC audit is genuinely 10× faster than the next 60 seconds of analyst review. The historical-pattern match against the 143-case library is unfakeable. The deal-level DPR is the artefact the audit committee already asks for verbally; we just generate it.',
    whyTheyDont:
      'Their existing diligence-tool stack (Datasite + Intralinks + a custom M&A scorecard) is sticky and they see DI as redundant. Counter: the bias-audit + DPR is NOT in any of those tools; we are layer-on-top, not replacement. Show them.',
    notebookLmFollowUp:
      'What is the per-deal pricing benchmark for M&A AI tools sold to F500 corp dev teams in 2026? Examples (DealRoom, DealCloud, Quantexa) with public ACVs.',
  },

  // -----------------------------------------------------------------------
  // 4. F500 GENERAL COUNSEL / AUDIT COMMITTEE CHAIR
  // -----------------------------------------------------------------------
  {
    id: 'f500_gc_audit_chair',
    role: 'F500 General Counsel / Audit Committee Chair · 12-month gate (NOT outbound target)',
    archetype:
      'Procurement gatekeeper, NOT early adopter · risk-management orientation · EU AI Act Art 14 + SOX + Basel III + GDPR Art 22 are personal worry-list · vendor-risk-register reviews every new SaaS · Reuters-headline allergy · their literal job is to find reasons NOT to sign · pitching pre-seed is corporate suicide · runs in parallel with CSO buying conversation, NEVER as primary',
    buyerType: 'expansion',
    priority: 'q4_2026',
    ticketBand:
      '£80-200K ARR · enterprise-tier pricing · contractual SLAs · DPA + ISO 27001 expectations · multi-year commits common',
    whatTheyWant: [
      'Hashed + tamper-evident DPR for every AI-augmented strategic decision — EU AI Act Art 14 record-keeping by design',
      'Cross-mapping of every flag to a named regulatory provision — auditable, defensible, version-stamped',
      'Client-Safe Export Mode for shareable artefacts (LP, regulator, third-party assurance)',
      'Clear sub-processor list, data-lifecycle disclosure, retention windows, indemnification, exit-assistance, audit rights',
    ],
    whatKeepsThemUp: [
      'A regulator request under EU AI Act Art 14 that the company cannot answer in writing',
      'An audit-committee question "do we have governance on AI-augmented decisions" — having no documented answer',
      'A class-action or short-seller letter citing a strategic-recommendation gap that should have been flagged',
      'Vendor risk: a SaaS tool with weak posture creating a third-party data-breach incident',
    ],
    howToReach: {
      coldChannel:
        'Almost never cold. Reach via the CSO or M&A head once they have engaged. The GC is a procurement gate, not a primary buyer — surface DI to them via the warm internal champion.',
      coldOpener:
        'N/A — do not lead cold to the GC. If absolutely required: "Decision Intel maps onto EU AI Act Article 14 record-keeping by design. 17-framework regulatory map. Would your GC team review the DPR specimen + Terms appendix?"',
      coldBlunder:
        'Leading with bias-detection — the GC does not buy "bias detection," they buy "regulatory record-keeping." Frame the product entirely around EU AI Act Art 14 + SOX + Basel III answers.',
      warmIntroPath:
        'CSO or M&A head champions DI internally → introduces GC into the conversation in meeting 3 → GC reviews DPR specimen + DPA + Terms appendix in parallel with vendor-risk register.',
    },
    discoveryQuestions: {
      opening: [
        '"What is your current plan for EU AI Act Article 14 record-keeping on AI-augmented strategic decisions, given the Aug 2026 enforcement date?"',
        '"For audit-committee questions on strategic-recommendation governance, what is the artefact you can produce in writing?"',
        '"Under SOX §404 and Basel III ICAAP, what is the documented internal-controls process for qualitative strategic decisions?"',
      ],
      rigor: [
        '"If every strategic-recommendation memo carried a hashed + tamper-evident DPR mapping each flag to a named regulatory provision — what would change about your audit-committee posture?"',
        '"For LP / regulator / third-party-assurance shareability, what is your current artefact? How long does it take to produce?"',
        '"For the vendor-risk register, what are the procurement-grade gates we will need to clear (SOC 2, ISO 27001, DPA, sub-processor list, data residency, exit assistance)?"',
      ],
      decisionGate: [
        '"What is the timeline for vendor-risk-register approval if security and legal start in parallel?"',
        '"Who else needs to see the DPR + DPA + Terms appendix before contract?"',
        '"What is the procurement-grade DPA shape we will need? Standard contractual clauses, IDTA, NDPR transfer agreement — which apply?"',
      ],
    },
    artefactToLead:
      'DPR specimen + Terms appendix from the public Enterprise Quote PDF + the /security regulatory-tailwinds page + the /privacy GDPR-Art-13 mandatory-disclosure block. The GC reads regulatory artefacts, not product demos.',
    killerPitch:
      'Decision Intel is the reasoning layer the Fortune 500 needs before regulators start asking. EU AI Act Art 14 record-keeping. Basel III Pillar 2 ICAAP qualitative-decision documentation. SOX §404 internal controls. 17 frameworks mapped flag-by-flag. Hashed and tamper-evident DPR on every audit. Your audit committee does not have to take the tool on faith — they review each flag against its cited regulatory source in a single artefact.',
    threePhrasesNeverToSay: [
      '"AI does the work" — GC hears liability. Frame as "the human decision-maker is in control; AI provides the audit layer they are required to produce anyway."',
      '"It is just for strategic memos" — narrows scope; the GC needs the same governance for M&A theses, fund IC memos, board recommendations',
      '"Cloud-hosted on Vercel + Supabase" without context — leads to data-residency questions; lead with regulatory framework coverage, then technical posture',
    ],
    meetingArc: [
      {
        minute: '0:00-2:00',
        move: 'Frame: "EU AI Act Art 14 + SOX + Basel III + GDPR Art 22 + 17-framework map. We are the artefact that satisfies all five."',
      },
      {
        minute: '2:00-5:00',
        move: 'Walk through the DPR cover page → integrity fingerprints → regulatory-mapping section → reviewer-decisions HITL log → data-lifecycle footer.',
      },
      {
        minute: '5:00-10:00',
        move: 'Walk through the Terms appendix — indemnification, SLA, exit assistance, sub-processor change notification, audit rights.',
      },
      {
        minute: '10:00-15:00',
        move: "Discovery — surface the GC's specific framework concerns + vendor-risk-register gates.",
      },
      {
        minute: '15:00-20:00',
        move: 'Procurement timeline — security review, legal review, vendor risk, contract — agreed sequencing.',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They open the DPR specimen and immediately read the Verification block + sub-processor list',
        'They reference EU AI Act Art 14 by article number unprompted',
        'They ask about indemnification + audit rights + exit assistance in writing',
        'They volunteer to escalate to procurement on a defined timeline',
      ],
      negative: [
        'They focus only on data residency (US vs EU) — usually means they have an EU-only mandate; honour the disclaimer language and offer the EU residency roadmap',
        'They ask "where is your SOC 2 Type II report" — current state is infrastructure-aligned; surface the trust-copy.ts language and the Type II target date',
        'They want a custom DPA without a baseline — this is a deal-killer; point them to the existing DPA template and negotiate from there',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Thank-you + DPR specimen PDF + Terms appendix + DPA template + sub-processor list + 1-page summary of compliance posture',
      },
      {
        day: 'T+48h',
        artifact:
          'Specific responses to each procurement question raised (in writing) + vendor-risk-register draft answers',
      },
      {
        day: 'T+1w',
        artifact:
          'Procurement-timeline proposal — security review week 1-2, legal review week 2-3, contract negotiation week 3-4',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Vendor-risk-register sign-off by Friday or we move target sign date to next quarter"',
      },
    ],
    conversionWindow:
      '4-8 weeks of procurement-stage work · runs in parallel with the CSO or M&A buying conversation · NOT a separate sales cycle, a separate gate',
    whyTheyConvert:
      'The DPR + Terms appendix is the most procurement-grade vendor artefact they have seen for a SaaS in their inbox this year. The 17-framework map closes the regulatory gap they were already worrying about. The trust-copy.ts vocabulary discipline ("hashed + tamper-evident", not "signed + hashed") signals operational honesty.',
    whyTheyDont:
      'SOC 2 Type II audit not yet complete (infrastructure-aligned today, full audit pending). Address with the trust-copy.ts language + a target completion date.',
    notebookLmFollowUp:
      'What does a F500 vendor-risk-register questionnaire look like in 2026? Top 30 questions an audit-committee chair will ask of a new AI SaaS vendor before sign-off.',
  },

  // -----------------------------------------------------------------------
  // 5. MANAGEMENT CONSULTANT (McKinsey / BCG / Bain)
  // -----------------------------------------------------------------------
  {
    id: 'management_consultant',
    role: 'Management Consultant Partner (McKinsey QuantumBlack / BCG GAMMA / Bain Advanced Analytics)',
    archetype:
      'Sells $500K-$5M strategy / AI-transformation engagements · F500 CSO is their buyer · embeds analytical tools as engagement line items · alliances org actively packages AI tooling with engagements (e.g., McKinsey × Credo AI, McKinsey × C3 AI)',
    buyerType: 'channel',
    priority: 'q3_2026',
    ticketBand:
      'Channel partnership · revenue share or per-seat licensing · DI is line-item in the consulting engagement · indirect ARR from co-sells · long-term: F500 CSO pull-through into direct DI ARR',
    whatTheyWant: [
      'A tool that sharpens their analytical work without competing for the strategy seat',
      'AI governance positioning for the EU AI Act Aug 2026 enforcement that fits their existing engagement vocabulary',
      'A partnership that lets them say "we layer Decision Intel into your strategic-decision process" in client pitches',
      'Co-publishable content (joint research, conference talks, white papers) that elevates both brands',
    ],
    whatKeepsThemUp: [
      'Generative-AI displacement — boutique AI shops eating engagement margin',
      'Client question "what is your AI governance answer for EU AI Act Art 14"',
      'Internal partner pressure on engagement-margin compression',
    ],
    howToReach: {
      coldChannel:
        'Wiz advisor → his McKinsey-alumni network (heavily saturated per NotebookLM 2026-04-27 synthesis) → introduction to a McKinsey QuantumBlack senior partner (target: Lieven Van der Veken or Head of Alliances).',
      coldOpener:
        'For QuantumBlack engagement teams, Decision Intel is the EU AI Act Art 14 record-keeping artefact + the bias-audit layer that fits inside your analytical-transformation engagements. Worth a 30-min peer-level conversation about what an alliance shape would look like?',
      coldBlunder:
        'Pitching as a competitor. Consultants buy AI tooling that AMPLIFIES the engagement, never replaces the analytical seat. Frame DI as "we are the audit layer; you are the strategy."',
      warmIntroPath:
        'Wiz advisor (McKinsey alumni network) → MD-level intro at QuantumBlack → 30-min framing call → category-conversation, not vendor-pitch.',
    },
    discoveryQuestions: {
      opening: [
        '"For your analytical-transformation engagements, how are you currently positioning EU AI Act Article 14 record-keeping for your F500 clients?"',
        '"Inside QuantumBlack engagements, what is the typical AI tooling embedded in the deliverable? How does the alliances org evaluate new partners?"',
        '"Your team\'s view on Cloverpop, Aera, IBM watsonx — what gaps do you see those tools leave in your client engagements?"',
      ],
      rigor: [
        '"If we ran a co-pilot engagement — your strategy partner + DI as the audit-layer artefact — what would the client-facing deliverable look like?"',
        '"For the alliance shape, what is the typical commercial structure (revenue share, per-seat, embedded license, joint marketing)?"',
        '"For the co-publishable angle — joint research, conference talk, white paper — what does QuantumBlack\'s alliances calendar look like?"',
      ],
      decisionGate: [
        '"For a 90-day pilot embedded in one of your live engagements — what would the success metric be?"',
        '"Who else inside QuantumBlack needs to evaluate the partnership before sign?"',
        '"What is the typical alliance-onboarding timeline at McKinsey — 6 weeks, 3 months, longer?"',
      ],
    },
    artefactToLead:
      'A category-conversation deck (peer-level) — NOT a sales deck. The 2008 paper + the R²F intellectual moat + the 17-framework regulatory map. Layer the WeWork DPR as a working artefact later in the conversation.',
    killerPitch:
      "McKinsey provides the strategy. Decision Intel provides the continuous audit and the EU AI Act Article 14 regulatory record. We are not a competitor to the QuantumBlack engagement — we are the artefact that ships with it, signed off by the client's audit committee, that proves you delivered governance and not just analytical insight.",
    threePhrasesNeverToSay: [
      '"Disrupt consulting" — instant defensive shutdown; the partner\'s entire P&L is the engagement',
      '"Replace your AI bias review" — never; we are the artefact, they are the process',
      '"Sell directly to your clients" — channel partnerships die when the partner suspects you will end-run them',
    ],
    meetingArc: [
      {
        minute: '0:00-2:00',
        move: 'Frame: peer-level category conversation. "We are the audit layer; you are the strategy seat."',
      },
      {
        minute: '2:00-7:00',
        move: 'Walk through the R²F intellectual moat + 17-framework regulatory map + the EU AI Act Art 14 timing argument.',
      },
      {
        minute: '7:00-12:00',
        move: 'Discovery — surface engagement-margin pressure + client-side AI-governance questions.',
      },
      {
        minute: '12:00-18:00',
        move: 'Position: 90-day co-pilot, one live engagement, joint co-publishable deliverable.',
      },
      {
        minute: '18:00-25:00',
        move: 'Discuss alliance commercial structure (rev share / per-seat / embedded license / co-marketing).',
      },
      {
        minute: '25:00-30:00',
        move: 'Close: "What is the next step on the alliances side? Who needs to see this?"',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name a current engagement where DI would have fit',
        'They volunteer the alliances org contact unprompted',
        'They reference Credo AI / C3 AI partnership shapes as benchmarks',
        'They ask about co-publishable angles (research papers, conference talks)',
      ],
      negative: [
        'They redirect to "we already have McKinsey internal tooling for that" — usually a defensive close; surface the R²F moat as proof of structural difference',
        'They ask "why would we partner with a 16-year-old founder" — surface the 2008 paper + the Wiz advisor as the credibility anchors',
        'They want exclusivity — typical opening ask; counter with non-exclusive partnership + first-mover co-marketing rights',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Peer-level thank-you + 2008 paper + R²F architecture overview + 17-framework regulatory map summary',
      },
      {
        day: 'T+48h',
        artifact:
          'Co-pilot engagement proposal — 90-day, one live engagement, joint deliverable, alliance commercial structure draft',
      },
      {
        day: 'T+1w',
        artifact:
          'Joint co-publishable content draft — "AI governance and decision provenance: the EU AI Act Art 14 answer" white paper outline',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Alliances introduction by Friday or we are evaluating the BCG GAMMA + Bain alliance paths in parallel"',
      },
    ],
    conversionWindow:
      '6-12 weeks for partnership agreement · 3-6 months for first co-engagement · long-tail F500 CSO direct ARR pulls through over 12-24 months',
    whyTheyConvert:
      'The R²F intellectual moat survives partner-level scrutiny. The EU AI Act Art 14 regulatory tailwind is timing they can sell to their CSO clients THIS quarter. The co-publishable angle elevates both brands and gives the partner a name-on-paper outcome.',
    whyTheyDont:
      'They internalise the AI tooling (build their own bias-audit pipeline using GPT-4 or Claude) — counter with the R²F architecture defensibility and the multi-year regulatory mapping they cannot replicate without 12-18 months of compliance work.',
    notebookLmFollowUp:
      'What does the McKinsey QuantumBlack alliance commercial model look like end-to-end? Specific partnership terms (Credo AI, C3 AI, Wonderful) — revenue share, per-seat licensing, embedded-license, exclusivity, co-marketing. Where is the leverage for a startup partner with one anchor engagement?',
  },

  // -----------------------------------------------------------------------
  // 6. COMPLIANCE / RISK FIRM EXECUTIVE (LRQA / Bureau Veritas / SGS / Intertek / DNV)
  // -----------------------------------------------------------------------
  {
    id: 'compliance_risk_firm',
    role: 'Compliance / Risk Firm Executive (LRQA-class)',
    archetype:
      'CEO or business-unit lead at a global assurance / risk-management firm · 60K+ clients · 150+ countries · service lines: certification, technical inspection, supply-chain assurance, ESG, cyber assurance · just-acquired or just-built EM-region capability (e.g., LRQA × Partner Africa April 2026)',
    buyerType: 'channel',
    priority: 'q3_2026',
    ticketBand:
      'Channel + integration partnership · technology layer in their service-delivery stack · per-engagement licensing or managed-service revenue · indirect ARR through their existing client base',
    whatTheyWant: [
      'AI-native technology that augments their existing assurance / inspection / supply-chain services',
      'EU AI Act + EM-region regulatory coverage that complements their geographic footprint',
      'A reasoning-audit layer that fits inside their EiQ-style supply-chain intelligence software',
      'Joint-venture or partnership shape that does not threaten their existing service revenue',
    ],
    whatKeepsThemUp: [
      'Disruption from AI-native challengers eating their assurance services',
      'EU AI Act and similar regulations creating new compliance categories they cannot serve fast enough',
      'EM-region client demand for governance services where they do not yet have local capacity',
      'Internal innovation pressure (e.g., LRQA Mission AI Possible internal hackathon) without external partnerships',
    ],
    howToReach: {
      coldChannel:
        'Almost never cold. Reach via warm intro at the highest level (e.g., Ian Spaulding at LRQA via the family relationship). For other firms (BV, SGS, DNV), via Wiz advisor or a client overlap.',
      coldOpener:
        'N/A — these conversations require warm intros at C-level or BU-lead level. The relationship IS the on-ramp.',
      coldBlunder:
        'Pitching as a software vendor. These firms buy partnerships and joint-ventures, not SaaS subscriptions. Frame DI as a technology layer that augments their existing service stack.',
      warmIntroPath:
        'Family / school relationship → C-level intro → category conversation, not vendor pitch → 90-day pilot embedded in one of their existing service lines.',
    },
    discoveryQuestions: {
      opening: [
        '"For your existing assurance / inspection / supply-chain services, where do AI-augmented decision audits fit naturally?"',
        '"With the EU AI Act Article 14 enforcement coming Aug 2026, what is your client-facing positioning?"',
        '"For your recent EM-region acquisitions / partnerships — what governance gap are your clients asking you to close?"',
      ],
      rigor: [
        '"If we ran a co-pilot engagement — DI as the reasoning-audit layer inside one of your service lines (e.g., your supply-chain intelligence offering) — what would the client deliverable look like?"',
        '"For the alliance commercial structure, what is the typical shape (managed service, per-engagement licensing, joint-venture, white-label)?"',
        '"For co-publishable content — joint research, conference talk, regulatory comment — what does the calendar look like?"',
      ],
      decisionGate: [
        '"For a 90-day pilot embedded in one of your live engagements — what would the success metric be?"',
        '"Who else internally needs to evaluate the partnership before sign?"',
        '"What is the typical alliance-onboarding timeline — 6 weeks, 3 months, longer?"',
      ],
    },
    artefactToLead:
      'For LRQA: the LrqaTab brief inside the Founder Hub (already detailed). For other firms: the 17-framework regulatory map + the EU AI Act Art 14 mapping + the R²F architecture overview. NOT a product demo first — a category conversation.',
    killerPitch:
      'You provide global assurance. Decision Intel provides the AI-native reasoning-audit layer that lives inside that assurance — the EU AI Act Article 14 record-keeping artefact your enterprise clients are already required to produce. We are not a competitor to your service revenue; we are the technology layer that makes your existing service line the answer to the EU AI Act question.',
    threePhrasesNeverToSay: [
      '"We will go direct to your clients" — channel partnerships die on this signal',
      '"We replace your assurance work" — never; we layer onto their service',
      '"For 16-year-old solo founders" — disqualifies you from the C-level conversation',
    ],
    meetingArc: [
      {
        minute: '0:00-2:00',
        move: 'Frame: peer-level category conversation. "We are the AI-native reasoning-audit layer that fits inside your service stack."',
      },
      {
        minute: '2:00-10:00',
        move: 'Walk through DI architecture + 17-framework regulatory map + the specific fit with their service lines (LRQA = EiQ + Partner Africa).',
      },
      {
        minute: '10:00-18:00',
        move: 'Discovery — surface AI-disruption pressure + EU AI Act timing + EM-region governance gap.',
      },
      {
        minute: '18:00-25:00',
        move: 'Position: 90-day pilot embedded in one of their live engagements, joint co-publishable deliverable, alliance commercial structure draft.',
      },
      {
        minute: '25:00-30:00',
        move: 'Close: "What is the next step internally? Who needs to see this?"',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific service line where DI would fit (LRQA EiQ supply-chain intelligence is the canonical example)',
        'They volunteer the alliances or innovation-org contact unprompted',
        'They reference a recent EM-region acquisition or expansion as an integration target',
        'They invite a follow-up meeting with their innovation team within 2 weeks',
      ],
      negative: [
        'They redirect to "we have internal AI capability" — usually defensive; surface R²F architecture as differentiator',
        'They want exclusivity in a region or industry — open countering, but the deal must allow expansion to other categories',
        'They ask for a multi-year exclusive without a paid pilot — typical large-firm posture; counter with 90-day paid pilot first, then exclusivity discussion',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Peer-level thank-you + 2008 paper + R²F architecture overview + 17-framework regulatory map summary + the integration paths specific to their service lines',
      },
      {
        day: 'T+48h',
        artifact:
          'Co-pilot engagement proposal — 90-day, one service line, joint deliverable, alliance commercial structure draft',
      },
      {
        day: 'T+1w',
        artifact:
          'Joint co-publishable content draft — e.g., "AI Governance for EM-Region Supply Chains: an LRQA × Decision Intel perspective"',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Alliances introduction by Friday or we are evaluating other channel paths in parallel"',
      },
    ],
    conversionWindow:
      '8-16 weeks for partnership agreement · 3-6 months for first co-engagement · long-tail enterprise pull-through over 12-24 months',
    whyTheyConvert:
      'The EU AI Act Art 14 timing pressure on their enterprise clients is real and immediate. Their service line (LRQA EiQ, BV Quality, SGS Risk Management) needs an AI-native augmentation to defend margin against AI-native disruptors. DI fills that gap without competing.',
    whyTheyDont:
      'They build internally (LRQA Mission AI Possible internal hackathon) instead of partnering. Counter: surface the R²F architectural defensibility + the regulatory mapping moat as 12-18 months of work they cannot replicate internally before EU AI Act enforcement.',
    notebookLmFollowUp:
      'What does the typical alliance commercial structure look like for assurance / inspection firms (LRQA, Bureau Veritas, SGS, Intertek, DNV) when they partner with AI-native technology vendors? Specific examples of recent partnerships, terms, and the pull-through revenue model.',
  },

  // -----------------------------------------------------------------------
  // 7. PRE-SEED / SEED VENTURE INVESTOR
  // -----------------------------------------------------------------------
  {
    id: 'pre_seed_seed_investor',
    role: 'Pre-Seed / Seed Venture Investor',
    archetype:
      'Operator-stage angel · Seed-stage VC partner · check size £100K-£2M · thesis fit: enterprise infra, AI-native, regulatory tailwind, founder-led category creation · pre-seed reasonable: pre-revenue with strong design-partner pipeline; seed reasonable: 3-5 paid pilots + early ARR',
    buyerType: 'capital',
    priority: 'now',
    ticketBand:
      'Pre-seed: £4-8M raise · Seed: £24-48M raise · advisor convertibles + operator angels for warm-network access · enterprise-infra-focused funds (e.g., Index, Sequoia, Greylock seed practice, Nordic-focused Creandum) for thesis fit',
    whatTheyWant: [
      'Clear unicorn-shape ICP with structural moat (R²F + Pan-African wedge + 17-framework regulatory map)',
      'Founder profile that survives PE/VC due-diligence (Wiz advisor, 2008 paper, Stanford / Berkeley application target)',
      'Honest 2030 path with conditional probabilities (HonestProbabilityPath: 50% × 35% × 30% × 15% = 0.79% absolute IPO)',
      'Procurement-grade traction signal — at least one paid design partner closed before serious pre-seed conversations',
    ],
    whatKeepsThemUp: [
      'Founder continuity (16-year-old solo, Stanford / Berkeley target Nov 2027)',
      'Time-to-revenue (zero paying customers as of 2026-04-27)',
      'Category clarity (Cloverpop / Aera / IBM watsonx / Palantir competitive surround)',
      'External attack vectors (Cloverpop data advantage, IBM bundling, agentic-shift)',
    ],
    howToReach: {
      coldChannel:
        'Josh Rainer (Wiz advisor) → his McKinsey-alumni-turned-operator-angel network → 5 named target funds (Cyberstarts, Index Ventures, Conviction · Sarah Guo, Neo · Ali Partovi, Elad Gil solo). Per NotebookLM 2026-04-27, the advisor opens 3 of 5 doors directly (Cyberstarts + Index + likely Conviction overlap). Elad Gil is the one cold-email path that works — he reads outlier-profile cold by design.',
      coldOpener:
        'Decision Intel: 60-second AI audit on every strategic memo before the board sees it. Recognition-Rigor Framework operationalising 50 years of Nobel-winning behavioral economics. 17-framework regulatory map across G7 / EU / GCC / African markets — EU AI Act Article 14 enforcement Aug 2, 2026. 16-year-old solo founder who published academic research on bias mechanics (2008 financial crisis). 190K LOC shipped solo. Worth a pre-seed conversation?',
      coldBlunder:
        '"We are pre-revenue and looking for our first customer" — instant disqualification at pre-seed. Lead with the wedge + the regulatory tailwind + the design-partner pipeline (even if not closed yet).',
      warmIntroPath:
        'Josh Rainer (Wiz advisor) → Cyberstarts (seeded Wiz) + Index Ventures (backed Wiz) + Conviction (Sarah Guo) — three of these are direct warm intros via the Wiz pattern recognition. Neo Residency (Ali Partovi) — apply summer 2026 cohort directly. Elad Gil — direct cold email when the founder arc is sufficiently outlier (this profile qualifies).',
    },
    discoveryQuestions: {
      opening: [
        '"Where does Decision Intel sit in your enterprise-infra thesis? What pattern does this remind you of?"',
        '"Your fund\'s view on the AI-governance category — Cloverpop / Aera / IBM watsonx — where do you see the moat forming?"',
        '"For the EU AI Act Article 14 enforcement on Aug 2, 2026 — what is your fund\'s perspective on the timing pressure for F500 buyers?"',
      ],
      rigor: [
        '"For the Pan-African / EM-fund wedge — what is the comparable thesis from your portfolio? What were the indicators of category-defining traction?"',
        '"For founder continuity — what is your standard pattern for 16-year-old solo founders shipping enterprise infra (Stanford / Berkeley target Nov 2027)? What does the continuity playbook need to include?"',
        '"For the unicorn-path conditional probability (50% × 35% × 30% × 15% = 0.79% absolute IPO) — does that math match your pre-seed B2B baseline?"',
      ],
      decisionGate: [
        '"What is your typical pre-seed cycle — meetings, diligence, term sheet, close?"',
        '"What is the tracking question that decides whether you lead or follow?"',
        '"For the design-partner pipeline — what is the threshold (paid pilots, MRR, design-partner LOIs) that converts you from interested to leading?"',
      ],
    },
    artefactToLead:
      'A 12-slide pre-seed deck — H1: native reasoning layer for every high-stakes call · slide 2: R²F intellectual moat (Kahneman + Klein) · slide 3: regulatory tailwinds (EU AI Act Aug 2026, SEC, Basel III) · slide 4: ICP wedge (Individual £249/mo · UK + US) → bridge (Sankore Design Foundation) → ceiling (F500 corp dev M&A · cross-border · 19-framework map differentiator) · slides 5-9: product · slide 10: HonestProbabilityPath + 16 metrics · slide 11: vendor continuity playbook · slide 12: ask + use of funds.',
    killerPitch:
      'Decision Intel is the native reasoning layer for every high-stakes call. We catch the cognitive bias McKinsey charges $1M to find — and McKinsey has the same biases themselves. Our wedge is Individual UK + US CSOs / M&A heads / corp dev directors at £249/mo (frictionless, no procurement gate); Sankore (Pan-African fund, London office, summer 2026) is the design-partner bridge that produces reference DPRs; the ceiling is F500 corporate strategy + corp dev M&A at £50K-150K ACV — cross-border M&A specifically, where the 19-framework regulatory map (Pan-African + G7/EU/GCC) becomes a moat layer no US-only incumbent carries. Timing: EU AI Act Article 14 enforcement Aug 2, 2026. The Recognition-Rigor Framework operationalising Kahneman + Klein gives us a defensible IP moat no incumbent has matched in 16 years of academic debate. Goal: $30M+ founder cash exit by 2031-2033 at a £30-95M EV strategic acquisition (8-12× ARR multiple), 35-55% probability range. Most likely acquirers: LRQA, IBM watsonx.governance arm, Big-4 governance practice.',
    threePhrasesNeverToSay: [
      '"Disrupting strategy consulting" — investor hears "competing with McKinsey/BCG/Bain"; instant skepticism',
      '"For everyone making decisions" — non-segment, instant disqualification',
      '"Just need our first customer" — pre-seed investors fund teams + thesis, not desperation',
    ],
    meetingArc: [
      {
        minute: '0:00-2:00',
        move: 'Frame: native reasoning layer + Individual £249/mo wedge + Sankore design-partner bridge + EU AI Act Aug 2026 timing. Note: NOT "Pan-African wedge" — that was the v3.1 framing; v3.2 lock has Pan-African as cross-border M&A differentiator (moat layer for the F500 ceiling), not the GTM wedge.',
      },
      {
        minute: '2:00-10:00',
        move: 'Pitch deck — slides 1-9 (problem, R²F moat, regulatory tailwind, wedge, product).',
      },
      {
        minute: '10:00-18:00',
        move: 'HonestProbabilityPath conditional-probability slide + 16 investor metrics tracker.',
      },
      {
        minute: '18:00-25:00',
        move: 'Founder continuity playbook + Wiz-advisor unfair-network slide.',
      },
      {
        minute: '25:00-30:00',
        move: 'Ask: £4-8M pre-seed at £20-30M pre-money + use-of-funds (3 paid design partners + GTM hire + ISA 2007 + DQI CIs + EU residency).',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They reference a comparable thesis from their portfolio',
        'They ask about the design-partner pipeline conversion timeline',
        'They volunteer to introduce to a thematic-fit co-investor',
        'They engage on the conditional-probability math without dismissing the absolute IPO outcome',
      ],
      negative: [
        'They focus exclusively on continuity (16-year-old solo) without engaging the moat — usually a polite no',
        'They ask "what is your TAM?" without engaging the wedge — generic-VC pattern; surface the F500 strategy budget at $50-150M and the wedge-as-reference-generator narrative',
        'They want exclusive access to design-partner data — early ask; counter with reference-case-publishing rights post-close',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Thank-you + the 12-slide pre-seed deck PDF + the 2008 paper as voice-anchoring proof + the WeWork DPR as product-shape proof',
      },
      {
        day: 'T+48h',
        artifact:
          'Specific responses to their diligence questions (in writing) — wedge metrics, design-partner pipeline status, continuity playbook',
      },
      {
        day: 'T+1w',
        artifact:
          'Reference-call request — Wiz advisor + 1-2 design-partner conversations (with permission)',
      },
      {
        day: 'T+2w',
        artifact:
          'Single concrete next step — "Term sheet by Friday or we close the round with the lead investor on parallel timeline"',
      },
    ],
    conversionWindow: '4-6 meetings · 6-12 weeks · pre-seed close in 12-16 weeks of process',
    whyTheyConvert:
      'The R²F intellectual moat survives partner-level due diligence. The Pan-African wedge has a clear reference-generator → F500 ceiling sequence. The EU AI Act Aug 2026 timing pressure is a forced clock. The HonestProbabilityPath gives investors honest math (rare at pre-seed). The Wiz advisor is the highest-signal trust anchor.',
    whyTheyDont:
      'Continuity question (16-year-old solo, Stanford Nov 2027). Time-to-revenue (zero paying customers). Procurement-grade gaps (SOC 2 Type II, ISA 2007, DQI CIs). Address each in the continuity playbook + the next-30-days roadmap + the 90-day action plan.',
    notebookLmFollowUp:
      'Pre-seed European + US investors most likely to fund a 16-year-old solo founder building enterprise infrastructure with a Pan-African wedge — name 5 with thesis fit + warm-intro paths, and the most recent comparable check they have written.',
  },

  // -----------------------------------------------------------------------
  // 8. SENIOR STRATEGIC ADVISOR / WIZ-NETWORK OPERATOR
  // -----------------------------------------------------------------------
  {
    id: 'senior_strategic_advisor',
    role: 'Senior Strategic Advisor / Wiz-Network Operator',
    archetype:
      'Wiz-credentialed senior consultant or operator · 1:1 cadence with the founder · McKinsey-alumni network saturation · F500 CSO + pre-seed-VC introductions are the lever · the relationship IS the unfair advantage',
    buyerType: 'amplifier',
    priority: 'now',
    ticketBand:
      'No direct revenue · advisor equity grant or paid retainer (modest) · indirect ARR via the introductions they unlock · long-term: this is the highest-leverage relationship the founder has',
    whatTheyWant: [
      'Specific, pre-qualified asks per 1:1 — never "any introductions" (advisor cannot source against vague asks)',
      'Closed-loop feedback after every intro they make — meeting outcome, deal-stage progression, lessons learned',
      'A 1-pager that describes Decision Intel in their vocabulary (cloud-security parallels: "DI is to strategic decisions what Wiz is to cloud posture")',
      'Real wins to point at — design-partner closes, F500 conversation progress, pre-seed term sheet — that justify their continued time investment',
    ],
    whatKeepsThemUp: [
      'Wasted advisor time — when the founder asks for vague introductions and does not follow up on the ones they make',
      'Reputational risk — when the founder makes a bad impression in a meeting they sourced',
      'Stalled progress — 60+ days between the advisor making an intro and the founder reporting a meaningful outcome',
    ],
    howToReach: {
      coldChannel: 'N/A — relationship already exists.',
      coldOpener: 'N/A — leverage is the relationship cadence.',
      coldBlunder:
        'Asking for "any introductions" without specifying who, why, and what for. The advisor cannot source against generic asks.',
      warmIntroPath: 'Already active.',
    },
    discoveryQuestions: {
      opening: [
        '"Of your active McKinsey-alumni-turned-operator network, who do you think would be the highest-ROI introduction for Decision Intel right now?"',
        '"For the Wiz GTM playbook — what was the first paid F500 customer move? What did the founders learn that DI should learn faster?"',
        '"For pre-seed VCs in your overlap — who has the strongest enterprise-infra-with-regulatory-tailwind thesis right now?"',
      ],
      rigor: [
        '"For the McKinsey QuantumBlack alliance path — based on your network insight, what is the highest-probability entry point (alliances org, specific senior partner, internal champion)?"',
        '"For the Pan-African / EM-fund wedge — given your portfolio breadth, what is the comparable wedge-into-ceiling pattern you have seen succeed?"',
        '"For the founder-continuity question (16-year-old solo, Stanford / Berkeley Nov 2027) — what is your view on the procurement-stage answer and the GTM co-founder search?"',
      ],
      decisionGate: [
        '"For our next 1:1 — what is the single highest-ROI introduction you can make this week, and what should I prepare in advance?"',
        '"For the advisor agreement — should we formalize equity or retainer at this stage, or wait until pre-seed close?"',
        '"For the closed-loop feedback — what is your preferred cadence (after-each-intro, weekly, monthly)?"',
      ],
    },
    artefactToLead:
      'A specific pre-qualified ask: who, why, what for. NOT a generic update. The advisor performs against specific asks 5× better than against general updates.',
    killerPitch:
      'You helped build Wiz from startup to $32B. The DI pattern is similar: a category-defining technical product, a procurement-grade compliance moat, and a wedge that generates references for the F500 ceiling. The single highest-leverage intro you can make this quarter is to QuantumBlack alliances.',
    threePhrasesNeverToSay: [
      '"Any introductions you can make would help" — advisor cannot source against vague asks',
      '"How do I do GTM" — the advisor will help, but only if the founder is doing the operational work themselves',
      '"What should I do next" — pull the agenda, never push it onto the advisor',
    ],
    meetingArc: [
      {
        minute: '0:00-3:00',
        move: 'Closed-loop on prior asks — outcomes of prior introductions, deal-stage progression, lessons learned.',
      },
      {
        minute: '3:00-12:00',
        move: 'Specific pre-qualified ask of the meeting — "I want intro to X for Y reason. I have prepared Z. What should I add?"',
      },
      {
        minute: '12:00-25:00',
        move: 'Strategic question — "based on your Wiz GTM lens, what would you do differently in the next 90 days?"',
      },
      {
        minute: '25:00-30:00',
        move: 'Confirm next-meeting agenda + immediate-next-action commitments on both sides.',
      },
    ],
    signalsToListenFor: {
      positive: [
        'They name the introduction without being asked',
        'They volunteer follow-up actions on their side',
        'They reference a specific Wiz playbook moment as relevant',
        'They invite a higher-cadence schedule (monthly → bi-weekly)',
      ],
      negative: [
        'They redirect every question to "you should figure that out" — usually means the asks are too vague; sharpen them',
        'They have not made an intro in 60+ days — relationship has gone passive; surface this directly in next 1:1',
        'They ask about your school commitments / time allocation — usually a polite signal that they think the venture is a side project; counter with the operating-cadence proof',
      ],
    },
    followUp: [
      {
        day: 'T+4h',
        artifact:
          'Closed-loop summary of the meeting + the specific next-action commitments + the 1-pager update on Decision Intel progress',
      },
      {
        day: 'T+48h',
        artifact:
          'Following up on each introduction made in the meeting — "had the call with X on Friday, here is what came of it"',
      },
      {
        day: 'T+1w',
        artifact:
          'Pre-prepared agenda for next meeting — specific asks, closed-loop on prior actions, strategic question',
      },
    ],
    conversionWindow:
      'Ongoing relationship · cadence is the metric, not the conversion · monthly 1:1 + ad-hoc check-ins · 6-month equity / retainer formalization decision',
    whyTheyConvert:
      'Already converted — the relationship exists. The lever is the cadence quality + the specific-ask discipline.',
    whyTheyDont:
      'Founder lapses on closed-loop feedback. Founder asks for vague introductions. Founder fails to act on the introductions made (lets the warm thread go cold). Each is a relationship-erosion signal — fix immediately.',
    notebookLmFollowUp:
      'What is the optimal advisor-cadence pattern for a 16-year-old solo founder with a Wiz-credentialed advisor? Cadence frequency, ask specificity, closed-loop reporting, equity / retainer milestones — drawing on benchmarks from successful founder-advisor relationships in enterprise SaaS.',
  },
];

// =========================================================================
// SECTION 4 · R²F DEEP DIVE — current moat + 5 levers to deepen
// =========================================================================

