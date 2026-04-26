// Sales Toolkit — content extracted from the legacy SalesToolkitTab.
// Preserves every verbatim objection, demo step, audience pitch, and
// framework (Challenger, MEDDPICC, SPIN). Update here when pitch evolves.

// ─── Pitch Reframe (Strebulaev-inspired) ──────────────────────────────────

export const PITCH_REFRAME = {
  defensive: {
    label: 'Defensive (old)',
    pitch: 'Avoid bad deals. Catch biases. Prevent mistakes.',
    attracts: 'Compliance buyers',
    color: '#EF4444',
  },
  offensive: {
    label: 'Offensive (new)',
    pitch:
      "Swing with confidence. Make bolder strategic bets because you've stress-tested the decision. Decision Intel gives your team permission to be ambitious.",
    attracts: 'Strategy leaders',
    color: '#16A34A',
  },
  rationale:
    "Strebulaev (Stanford GSB) shows the best decision-makers optimize for bold moves, not risk avoidance. Leaders don't want a safety net — they want a decision quality amplifier. The defensive pitch attracts compliance buyers. The offensive pitch attracts strategy leaders.",
};

// ─── 8 Sales Objections with tone guidance ────────────────────────────────

export interface SalesObjection {
  id: string;
  objection: string;
  response: string;
  tone: string;
}

export const SALES_OBJECTIONS: SalesObjection[] = [
  {
    id: 'good_process',
    objection: '"We already have a good decision process."',
    response:
      "Great — upload your last 3 strategic documents and let's see what the DQI scores look like. Most organizations score 45-65 on their first run. The question isn't whether your process is good — it's whether there are blind spots nobody is catching.",
    tone: 'Curious, not confrontational',
  },
  {
    id: 'chatgpt_diff',
    objection: '"How is this different from just asking ChatGPT?"',
    response:
      "ChatGPT gives you one opinion from one model. We use 3 independent judges to measure noise, a 20x20 bias interaction matrix for compound scoring, 31 domain-specific biases that general models don't know to look for, and an outcome flywheel that makes us smarter with every decision you make. Plus Chrome extension for real-time checking and Slack for meeting-time coaching. It's the difference between asking a friend and hiring a forensic auditor.",
    tone: 'Technical credibility',
  },
  {
    id: 'security',
    objection: '"Our team would never share strategic documents with an external tool."',
    response:
      'We GDPR-anonymize every document before it touches AI — names, companies, and numbers are tokenized. The PII never leaves the anonymization layer. Plus, you self-host your data on your own Supabase instance. We can do an on-prem demo if that helps.',
    tone: 'Address security directly',
  },
  {
    id: 'no_budget',
    objection: '"We don\'t have budget for another software tool."',
    response:
      "A single avoided bad decision saves millions. Even if we prevent one strategic error per year, that's a 100-1000x ROI on the subscription. What's the cost of NOT catching the next anchoring bias in your board memo?",
    tone: 'ROI framing',
  },
  {
    id: 'tried_ai',
    objection: '"We tried AI tools before and they weren\'t useful."',
    response:
      "Were they general-purpose AI or purpose-built for high-stakes decisions? We have 20 cognitive biases including domain-specific ones like anchoring to initial estimates, sunk cost in failing initiatives, and groupthink in committee decisions that no general tool detects. Plus, our outcome tracking means we calibrate to YOUR organization's actual decision patterns — not generic advice.",
    tone: 'Specificity wins',
  },
  {
    id: 'time_to_value',
    objection: '"How long until we see value?"',
    response:
      "Upload your first strategic document — you'll have a full bias audit with DQI score in under 60 seconds. The Boardroom Simulation alone usually surfaces something nobody in the room raised. First-day value, not first-quarter value.",
    tone: 'Immediate gratification',
  },
  {
    id: 'small_team',
    objection: '"We\'re a small team, we don\'t need this."',
    response:
      'Small teams are actually more vulnerable to groupthink and authority bias — fewer voices means blind spots compound. Our Slack integration embeds cognitive coaching directly in your strategic discussions, no workflow change required. Think of it as a silent partner who only speaks up when they spot a bias.',
    tone: 'Turn weakness into strength',
  },
  {
    id: 'try_first',
    objection: '"Can I try it before committing?"',
    response:
      "Absolutely — visit /demo right now. Pick from 3 sample documents and watch the full 12-node pipeline run in real time with streaming progress. No login, no commitment. Or send us 3 of your own strategic documents and we'll run a free pilot with full DQI scoring and bias reports.",
    tone: 'Zero friction',
  },
];

// ─── 8 Demo Steps with timing ─────────────────────────────────────────────

export interface DemoStep {
  step: number;
  title: string;
  timing: string;
  action: string;
  tip: string;
  isWowMoment?: boolean;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Setup',
    timing: '30 sec',
    action:
      'Open the dashboard. Have a sample strategic document ready — ideally one from a real decision that had a known outcome (good or bad). Alternative: open /demo for a no-login streaming simulation with 3 pre-loaded samples.',
    tip: 'If using their own document, even better. If not, the /demo page has Nokia, Series B, and Phoenix samples with full streaming UX.',
  },
  {
    step: 2,
    title: 'Upload & Analyze',
    timing: '60 sec',
    action:
      'Drag the document onto the upload zone. Click "Analyze." While the SSE stream runs, narrate what the 12 pipeline nodes are doing: "Right now, our noise judge is scoring this document for variance, while our bias detective is scanning for 20 cognitive biases..."',
    tip: 'The streaming progress bar is your friend — it creates anticipation.',
  },
  {
    step: 3,
    title: 'DQI Score Reveal',
    timing: '60 sec',
    action:
      'When the score appears, pause for dramatic effect. "Your document scored 47/100 — that\'s a D grade. Let me show you why."',
    tip: 'Most memos score 40-65. If it scores high (80+), pivot to: "This is unusually clean — let me show you what we DID find."',
  },
  {
    step: 4,
    title: 'Bias Walkthrough',
    timing: '2 min',
    action:
      "Click into the Biases tab. Show 2-3 specific biases with their exact excerpts highlighted. \"See here — 'the initial offer of $50M' — that's anchoring to entry price. Your team is using a number they were given rather than independently valuing the asset.\"",
    tip: 'Always connect the bias to a specific excerpt. Abstract = forgettable. Concrete = compelling.',
  },
  {
    step: 5,
    title: 'Boardroom Simulation',
    timing: '2 min',
    action:
      'Switch to the Boardroom tab. Show the 5 decision personas voting. "Your Risk Officer voted REJECT because of concentration risk. Your Operations Lead flagged execution timeline as unrealistic. Did anyone on your real team raise these points?"',
    tip: 'This is usually where the prospect goes quiet and starts thinking about their last major decision. Let the silence land.',
    isWowMoment: true,
  },
  {
    step: 6,
    title: 'Noise Score',
    timing: '60 sec',
    action:
      'Show the Noise tab. "Three independent judges scored this memo. Two gave it 52, one gave it 71. That 19-point spread IS the noise in your decision process — you\'re getting different answers to the same question."',
    tip: 'If noise is low, that\'s also a story: "This is consistent — the issues are real, not random."',
  },
  {
    step: 7,
    title: 'Toxic Combinations',
    timing: '60 sec',
    action:
      "If detected, show the toxic combination card with the auto-generated mitigation playbook. \"'The Echo Chamber' — confirmation bias plus groupthink in a high-stakes context. This pattern appears in 73% of our historical failure cases. Estimated risk: $22.5M on this deal. Here's your 4-step debiasing playbook with research citations.\"",
    tip: 'The named patterns are memorable and shareable. The dollar impact makes it visceral. The mitigation playbook makes it actionable. Prospects will mention these to colleagues.',
  },
  {
    step: 8,
    title: 'Close',
    timing: '60 sec',
    action:
      '"Imagine if every strategic document went through this before the decision. How many of your last 10 major decisions would have scored differently?" Offer: free pilot — 3 documents analyzed, no commitment.',
    tip: "Don't oversell. The product sells itself after the demo. Just get the pilot started.",
  },
];

export const DEMO_TOTAL = '8-12 minutes';

// ─── 4 Audience-specific Elevator Pitches ─────────────────────────────────

export interface AudiencePitch {
  id: string;
  audience: string;
  seconds: number;
  pitch: string;
  color: string;
  emphasis: string[]; // talking points to highlight
}

export const AUDIENCE_PITCHES: AudiencePitch[] = [
  {
    id: 'cso',
    audience: 'Chief Strategy Officer',
    seconds: 35,
    pitch:
      "Decision Intel is the native reasoning layer for every high-stakes call your strategy office makes. Upload a board memo, get an R²F audit (Recognition-Rigor Framework — Kahneman's debiasing plus Klein's Recognition-Primed Decisions, arbitrated in one pipeline) and a Decision Quality Index in 60 seconds. Before you say yes, let me run a live audit on a document you already know — the WeWork S-1 from 2019 — so you see the work, not the pitch.",
    color: '#16A34A',
    emphasis: [
      'native reasoning layer',
      'high-stakes call',
      'WeWork S-1',
      'see the work, not the pitch',
    ],
  },
  {
    id: 'ma',
    audience: 'M&A / Corp Dev Lead',
    seconds: 35,
    pitch:
      "Every IC memo, CIM, and management presentation gets an R²F audit before it reaches the partners — bias flags with the exact paragraphs they appear in, cross-document conflict detection (CIM says 40% growth, model assumes 15%), and a deal-level composite Decision Quality Index. Sample DPR (Decision Provenance Record) on the WeWork S-1 — if you bring one redacted IC memo from a deal that went sideways, I'll run the audit live on our next call. About a third of partners say yes; that call closes at materially higher rates.",
    color: '#8B5CF6',
    emphasis: [
      'cross-document conflict detection',
      'composite Decision Quality Index',
      'redacted IC memo',
    ],
  },
  {
    id: 'fund',
    audience: 'Fund Partner / EM Investor',
    seconds: 35,
    pitch:
      "For capital-allocating teams (PE, EM-focused VC, family office IC), the audit anchor is geography-specific. Africa-focused funds see the Dangote 2014 pan-African expansion DPR — three Dalio determinants (currency cycle, trade share, governance) plus regulatory mapping across NDPR, CBN, WAEMU, PoPIA, CMA Kenya, Basel III. US/global funds see the WeWork S-1. The pitch is the evidence moment: 90 seconds to frame, then I run the audit live on a document you already know. Then the ask: bring a redacted IC memo from a deal that didn't go to plan, and we run THAT live next time.",
    color: '#D97706',
    emphasis: [
      'Dangote 2014 pan-African expansion',
      'evidence moment',
      'NDPR, CBN, WAEMU',
    ],
  },
  {
    id: 'board',
    audience: 'Board / Audit Committee',
    seconds: 60,
    pitch:
      "Decision Intel is the reasoning layer the Fortune 500 needs before regulators start asking. Every audit produces a Decision Provenance Record — hashed, tamper-evident, mapped to the regulatory provision it touches across 17 frameworks (EU AI Act Article 14 record-keeping, SEC AI disclosure, Basel III Pillar 2 ICAAP, GDPR Article 22, NDPR, CBN, WAEMU, SOX §404, plus more). The DPR is the artefact your audit committee will eventually require evidence of. We ship it on every audit, today, before the regulator asks.",
    color: '#F59E0B',
    emphasis: [
      'reasoning layer the Fortune 500 needs before regulators start asking',
      'Decision Provenance Record',
      '17 frameworks',
    ],
  },
  {
    id: 'technical',
    audience: 'Technical Audience',
    seconds: 35,
    pitch:
      "LangGraph 12-node pipeline (8 sequential + 4 parallel), schema-validated outputs between every step, Bayesian prior integration for per-org recalibration, Brier-scored outcome loop (Tetlock superforecasting research), 20×20 bias interaction matrix with 18 named toxic combinations. Two-model policy: gemini-3-flash-preview (analytical) + gemini-3.1-flash-lite (lightweight). ~17 LLM calls per audit, ~$0.40-0.65 cost, ~90% blended margin against $2,499/month Strategy tier. Not an LLM wrapper — twelve specialised products bound by deterministic glue.",
    color: '#0EA5E9',
    emphasis: [
      '20×20 bias interaction matrix',
      'Brier-scored outcome loop',
      'twelve specialised products',
    ],
  },
];

// ─── Challenger Sale (3 pillars) ──────────────────────────────────────────

export interface ChallengerPillar {
  number: number;
  title: string;
  description: string;
}

export const CHALLENGER = {
  intro:
    'Matt Dixon and Brent Adamson, CEB/Gartner research on 6,000+ reps. Top enterprise performers teach the buyer something counterintuitive about their own business, tailor the insight, then take control. Decision Intel is a natural Challenger product because the pitch itself is a reframe of how buyers think about their own decision process.',
  pillars: [
    {
      number: 1,
      title: 'TEACH',
      description:
        'Lead with the counterintuitive insight, not the product. Example: "Kahneman\'s insurance underwriter study found 55% variance where people expected 10%. Your IC has the same problem and nobody measures it." The reframe is the hook.',
    },
    {
      number: 2,
      title: 'TAILOR',
      description:
        "Translate the insight into the buyer's vocabulary. For a PE partner: thesis confirmation, management halo, winner's curse. For a corporate strategist: strategic drift, groupthink, escalation of commitment. Mirror their language, not yours.",
    },
    {
      number: 3,
      title: 'TAKE CONTROL',
      description:
        'Don\'t ask "what do you think?" after the demo. Direct the next step: "Send me the last three strategy memos that went sideways. I will run them through the engine and we will reconvene Thursday." Constructive tension over consensus.',
    },
  ] as ChallengerPillar[],
  footnote:
    'Relationship Builders are the worst performers in complex B2B. Challengers close deals because they change how the buyer thinks. Our product is a reframe. Lean into it.',
};

// ─── MEDDPICC (8 items) ───────────────────────────────────────────────────

export interface MeddpiccItem {
  letter: string;
  name: string;
  prompt: string;
}

export const MEDDPICC = {
  intro:
    'Score every enterprise opportunity above $50k on these eight dimensions weekly. Deals that cannot answer all eight by week 4 should be triaged, not nursed. Originated at PTC (1996), extended by Dick Dunkel and Andy Whyte.',
  items: [
    {
      letter: 'M',
      name: 'Metrics',
      prompt:
        'What is the quantified economic impact we are delivering? For DI: $X avoided loss per flagged toxic combination, Y hours saved per IC cycle.',
    },
    {
      letter: 'E',
      name: 'Economic Buyer',
      prompt:
        'Who personally signs the PO? Do we have direct access or only through a champion? If champion-only, this deal will slip.',
    },
    {
      letter: 'D',
      name: 'Decision Criteria',
      prompt:
        'What criteria will the buyer use to compare us to alternatives? Are the criteria written down? Have we influenced them?',
    },
    {
      letter: 'D',
      name: 'Decision Process',
      prompt:
        'Who signs off and in what order? How many committees? What is the realistic close timeline given that process?',
    },
    {
      letter: 'P',
      name: 'Paper Process',
      prompt:
        'Security review, legal redlines, procurement, vendor onboarding. Map every form and signature before the deal is verbally won.',
    },
    {
      letter: 'I',
      name: 'Identify Pain',
      prompt:
        'What specifically hurts today? A bad IC call they still regret? A noisy committee? If the pain is abstract, the deal is not real.',
    },
    {
      letter: 'C',
      name: 'Champion',
      prompt:
        'Is there one internal person who sells for us when we are not in the room and has authority to move the deal forward? Named, not assumed.',
    },
    {
      letter: 'C',
      name: 'Competition',
      prompt:
        'Incumbent, do-nothing, build-it-in-house, and any direct competitor. For DI the most common competitor is do-nothing dressed up as "we have a good process."',
    },
  ] as MeddpiccItem[],
};

// ─── SPIN (4 stages × 3 questions) ────────────────────────────────────────

export interface SpinStage {
  stage: 'Situation' | 'Problem' | 'Implication' | 'Need-Payoff';
  description: string;
  questions: string[];
}

export const SPIN = {
  intro:
    "Neil Rackham's research on 35,000+ sales calls. Large-ticket sales are won by asking a specific sequence of questions that make the buyer articulate their own pain. Use these verbatim on the first discovery call.",
  stages: [
    {
      stage: 'Situation',
      description: 'Baseline facts. Ask sparingly — too many bores the buyer.',
      questions: [
        'Walk me through how your IC reviews a deal today, from memo drafting to final vote.',
        'How many deals did you review last year and how many closed?',
        'Who writes the memo, who reviews it, and how do dissenting views get captured?',
      ],
    },
    {
      stage: 'Problem',
      description: 'Surface the pain. The buyer articulates, you listen.',
      questions: [
        'When was the last time you greenlit a deal you later regretted? What would you have wanted to see before voting yes?',
        'How do you know when your committee is rubber-stamping versus genuinely debating?',
        'How do you track whether your ICs improve over time?',
      ],
    },
    {
      stage: 'Implication',
      description: 'Make the pain expensive. Quantify the consequence of inaction.',
      questions: [
        'If one out of every ten yes-votes is actually a bad call, what does that cost this fund over a vintage?',
        'When the noise in your committee is invisible, how do you tell a bold bet from a biased one?',
        'If a competitor firm had a measurable decision quality score and you did not, would LPs eventually ask about it?',
      ],
    },
    {
      stage: 'Need-Payoff',
      description: 'Get the buyer to articulate the value of the solution in their own words.',
      questions: [
        'If you could see the bias and noise profile of every strategy memo in under 60 seconds, would you run it on the next three decisions?',
        'What would it be worth to catch one Echo Chamber pattern before capital was committed?',
        'If your partners saw a rising Decision Quality Index over two quarters, how would that change your LP narrative?',
      ],
    },
  ] as SpinStage[],
};

// ─── JOLT Effect (Matt Dixon — overcoming "no decision" / fear of failure) ──
// Source: NotebookLM master KB synthesis 2026-04-26 (note 9a249bd8). 40-60% of
// qualified enterprise deals are lost to "no decision" because buyers fear
// the career cost of a mistake. JOLT addresses this by de-risking the
// purchase rather than amplifying the pain of inaction.

export interface JoltElement {
  letter: 'J' | 'O' | 'L' | 'T';
  name: string;
  oneLine: string;
  description: string;
  diExample: string;
  antiPattern: string;
}

export const JOLT = {
  intro:
    "Matt Dixon (DCM Insights, post-Challenger research). Of all qualified enterprise deals, 40-60% are lost to NO DECISION — not to a competitor. Challenger Sale solves the 'pain of same' framing but doesn't address indecision driven by fear of failure. JOLT does. Use it on every deal that has emotional weight (i.e., the buyer worries about a career cost if they pick wrong).",
  elements: [
    {
      letter: 'J',
      name: 'Judge the level of indecision',
      oneLine: 'Use "pings and echoes" to test whether the buyer is overwhelmed by options, organisational pressure, or unspoken risk.',
      description:
        'Most founders assume a quiet buyer is processing. Often they\'re paralysed. Probe specifically: "What\'s the one thing that, if it went wrong, would make this look like the wrong call to your boss?" The answer reveals the actual decision constraint.',
      diExample:
        '"If we land this design partnership and 90 days in your IC says \'we don\'t see the lift yet,\' what specifically would make YOU look like you bet wrong on this?" — listen for the real fear; that\'s the one to address.',
      antiPattern:
        'Asking "what other concerns do you have?" — gives the buyer permission to invent new objections instead of surfacing the real one.',
    },
    {
      letter: 'O',
      name: 'Offer your recommendation',
      oneLine: "Don't act as a passive 'bobblehead' offering endless configurations. Tell them exactly what worked for similar firms.",
      description:
        'When buyers face decision fatigue, offering more options compounds the paralysis. The JOLT counter-move is asymmetric prescription: "Here\'s what I\'d do in your position, based on what I\'ve seen at firms with your profile." Then defend it.',
      diExample:
        '"Don\'t try to evaluate Decision Intel against three other tools. Run it on one IC memo where the outcome is already known. Compare what we flagged against what actually went wrong. That\'s the only test that matters; everything else is procurement theatre."',
      antiPattern:
        'Offering tiered pricing comparisons, multiple deployment options, or "we can configure it however you want" — buyer reads this as you don\'t know what works.',
    },
    {
      letter: 'L',
      name: 'Limit the exploration',
      oneLine: "Buyers will endlessly request whitepapers, reference calls, and demos because they suspect you're hiding flaws. Pre-buttal proactively.",
      description:
        'When prospects keep asking for "one more piece of validation," they\'re not buying — they\'re hedging against blame. Shut down the spiral with dangerous honesty: name your product\'s real limitations BEFORE they ask. This signals confidence and removes the hidden-flaw suspicion.',
      diExample:
        '"Two things I want you to know up front: our DQI scoring is based on expert priors, not yet empirically validated against confidence intervals — we say so on the security page. And we don\'t have an IBM-watsonx-grade enterprise deployment story yet. If either of those is a deal-breaker for you, it\'s better that we know now than at month four."',
      antiPattern:
        'Saying "we\'re happy to send any whitepapers / set up any reference calls you need" — every additional artefact you ship is permission for the buyer to hide.',
    },
    {
      letter: 'T',
      name: 'Take risk off the table',
      oneLine: 'De-risk the sale by introducing your customer success plan early, or offering safety nets (opt-out clauses, milestone-based pricing).',
      description:
        'Buyers don\'t fear losing the value of the product — they fear losing their reputation. Your job is to absorb the reputational risk into the deal structure: "If by month 3 you don\'t see X, we exit cleanly, no pro-ratas owed." This shifts the risk from the buyer\'s career to your company.',
      diExample:
        '"Six-month design partnership at £2K/month. If by month 3 your DQI hasn\'t moved, we exit clean — no pro-rata owed, you keep the audit history. The reason we offer this: I\'d rather lose the partnership than have it sit unused. Fair?"',
      antiPattern:
        'Holding firm on "no out-clauses" because of pricing discipline — at pre-seed with no logos, the out-clause itself IS the differentiator that closes deals competitors won\'t risk.',
    },
  ] as JoltElement[],
  whenToUse:
    'Every deal where the buyer\'s career is materially exposed if the call goes wrong: i.e., F500 CSO contracts, Pan-African fund Strategy-tier, any procurement above $30K/yr ACV. Less critical for free-tier / Individual conversions where the financial stake is low.',
};

// ─── SLIP Framework (paid pilot framing) ─────────────────────────────────────
// Source: NotebookLM master KB synthesis 2026-04-26 (note 9a249bd8). The
// 4 design constraints that distinguish a paid pilot that converts to
// enterprise from an unpaid free-trial that drags forever.

export interface SlipElement {
  letter: 'S' | 'L' | 'I' | 'P';
  name: string;
  question: string;
  diAnswer: string;
}

export const SLIP = {
  intro:
    'The framework for designing pilots that actually convert. The opposite — Hard install, High cost, Slow value, Doesn\'t play well — is the dev-shop trap. Pair SLIP with the Outcome Gate enforcement (es_11): Simple to install + Outcome Gate = the design partner cannot drift into "free shelfware" mode.',
  elements: [
    {
      letter: 'S',
      name: 'Simple to install',
      question: 'Can the design partner be value-extracting in 15 minutes after the contract signs?',
      diAnswer:
        'Yes IF the workflow mapping happens IN the discovery call (per es_9). Google Drive integration: 5-min OAuth + folder ID. Email-forward fallback: analyze+{token}@in.decision-intel.com. NO behaviour change required from the analyst.',
    },
    {
      letter: 'L',
      name: 'Low initial cost',
      question: 'Is the price under the partner\'s discretionary procurement threshold (i.e., under £2K/month for Pan-African funds, under £5K/month for F500 strategy)?',
      diAnswer:
        '£2K/month design partnership — sub-procurement-approval at every Pan-African / EM fund target. F500 Strategy-tier conversation happens after wedge produces 3 published cases.',
    },
    {
      letter: 'I',
      name: 'Instant value',
      question: 'Does the partner see a tangible "this is worth £2K" moment within the first 30 days?',
      diAnswer:
        'Yes — the first live audit walk-through (per es_9 step 3, or es_10 specimen audit). The bias profile on a real memo lands in 60 seconds. The "wow" moment is architectural, not sales-driven.',
    },
    {
      letter: 'P',
      name: 'Plays well in their existing ecosystem',
      question: 'Does the integration require the partner to rip out / replace anything they\'re currently using?',
      diAnswer:
        'No. DI sits BESIDE Drive / Notion / Slack workflows, not inside or above them. The DPR exports to PDF the partner\'s existing audit committee + LP reporting flow can attach. No platform lock-in.',
    },
  ] as SlipElement[],
};

// ─── Enterprise Friction Matrix (5 friction points + responses + product gaps)
// Source: NotebookLM master KB query 2026-04-26. The 5 specific frictions
// enterprise buyers will surface that the founder needs pre-baked
// responses for + visibility on which point at real product gaps to fix.

export type FrictionStatus = 'shipped' | 'partial' | 'gap' | 'roadmap';

export interface EnterpriseFriction {
  id: string;
  title: string;
  buyerSegment: 'F500 CSO' | 'M&A / Corp Dev' | 'Fund Partner' | 'GC / Compliance' | 'All';
  surfacedAs: string;
  preBakedResponse: string;
  productStatus: FrictionStatus;
  statusDetail: string;
  severity: 'critical' | 'high' | 'medium';
}

export const ENTERPRISE_FRICTION_MATRIX: EnterpriseFriction[] = [
  {
    id: 'vdr_disconnect',
    title: 'Virtual Data Room + M&A workflow disconnect',
    buyerSegment: 'M&A / Corp Dev',
    surfacedAs:
      '"Your cross-document conflict detection is impressive, but our deal team lives in Intralinks / Ansarada. We\'d need integration there. Plus we need NDA expiry tracking + automated bulk-delete when a deal collapses — your platform doesn\'t cover the workflow we actually live in."',
    preBakedResponse:
      'Honest answer: VDR integration is on the roadmap, not shipped. Today, the integration is email-forward to analyze+{token}@in.decision-intel.com, which works for any deal-room platform. NDA expiry + bulk-delete are real gaps; for design-partner pilots we set retention to your firm\'s policy via Document.contentKeyVersion + the retention cron. If VDR-native integration is the deal-breaker, I\'d rather know in week 1 than week 12.',
    productStatus: 'partial',
    statusDetail:
      'Email-forward path works today. VDR-native integration deferred to Phase 3 (post-wedge); NDA expiry tracking + bulk-delete: gap to fill in next 90 days.',
    severity: 'high',
  },
  {
    id: 'isa_2007_gap',
    title: 'Nigerian SEC Investment and Securities Act 2007 not in compliance map',
    buyerSegment: 'GC / Compliance',
    surfacedAs:
      '"Your 17-framework map is impressive — but for our Nigerian SEC-licensed entities, you\'re missing the Investment and Securities Act 2007 (ISA). Our GC will flag this as a critical procurement deal-killer."',
    preBakedResponse:
      '"You\'re right — ISA 2007 is a gap I\'m actively closing. I\'ll have the ISA mapping in the framework registry within 2 weeks. In the meantime, our NDPR + CBN + WAEMU coverage handles 80% of your Pan-African deal exposure; I\'d rather ship the ISA addition correctly than fake coverage we don\'t have." This response demonstrates regulatory competence + treats the GC as a partner, not an obstacle.',
    productStatus: 'gap',
    statusDetail:
      'CRITICAL gap for Sankore-class Nigerian SEC-licensed buyers. Should be added to src/lib/compliance/frameworks/africa-frameworks.ts as soon as practical. NotebookLM Q3 deal-stall analysis flagged this as a high-probability stall cause.',
    severity: 'critical',
  },
  {
    id: 'lp_anonymization',
    title: 'No "Client-Safe Export Mode" for LP / audit-committee DPR sharing',
    buyerSegment: 'Fund Partner',
    surfacedAs:
      '"We want to share DPR + DQI scores with our LPs to prove our diligence rigor — but the current PDF leaks target company names, financial amounts, and competitive intel. We can\'t send this out as-is."',
    preBakedResponse:
      '"Client-Safe Export Mode is in Phase 2 of our DPR roadmap — landing in Q2 2026. It auto-replaces target names with [TARGET], financial amounts with [REDACTED-AMOUNT], and competitive intel with [REDACTED-COMPETITIVE], while preserving the bias analysis + DQI score. For our first 3 design partners I\'ll do the redaction manually for any LP-bound DPR — that\'s the trade-off of being early. Want me to walk through the template I\'d use?"',
    productStatus: 'roadmap',
    statusDetail:
      'Real product gap. Manual redaction is acceptable for first 3 design partners; auto-redaction needed before scale. Build target: Q2 2026.',
    severity: 'high',
  },
  {
    id: 'dqi_explainability',
    title: 'DQI weights are "expert priors" without empirical validation / confidence intervals',
    buyerSegment: 'F500 CSO',
    surfacedAs:
      '"Your DQI is a weighted composite — 28% bias profile, 18% noise, etc. But these weights are based on expert priors. Where are the confidence intervals? Without empirical validation, my CFO won\'t accept your dollar-impact counterfactuals as defensible inputs to capital decisions."',
    preBakedResponse:
      '"You\'re reading the weights correctly — they\'re currently expert priors grounded in the published research (Kahneman-Sibony for bias/noise weighting, Howard-Matheson for the multi-criteria framework). Empirical validation requires what we don\'t have yet: 12-24 months of confirmed customer outcomes per org. The Outcome Gate enforcement (locked 2026-04-26) is exactly what produces that calibration data. After 18 months of your firm\'s confirmed outcomes, your DQI weights will be tuned to YOUR firm specifically with confidence intervals. Until then, treat the score as directionally correct, not point-precise — and we say so on the security page."',
    productStatus: 'partial',
    statusDetail:
      'Honest framing of the limitation IS the response. Per-org Brier-scored recalibration is the architectural answer; needs design-partner outcome data to start showing. Outcome Gate enforcement (just shipped) accelerates this.',
    severity: 'medium',
  },
  {
    id: 'shelfware_risk',
    title: 'Integration "shelfware" risk — buyers terrified of unused tools',
    buyerSegment: 'All',
    surfacedAs:
      '"We bought [other tool] last year and our analysts never adopted it. It became a £30K/year line item nobody used. How is Decision Intel different?"',
    preBakedResponse:
      '"This is the right question. The reason most enterprise tools become shelfware is that they require behaviour change without environmental change. We solve both: (1) Workflow mapping happens IN our discovery call so onboarding is 15 minutes, not 3 weeks (es_9). (2) The Outcome Gate is enforced at the platform level for design-partner orgs — your analysts can\'t run a new audit while past outcomes are unresolved (es_11). The platform enforces the discipline; you don\'t have to chase reminders. If 60 days in, audit volume drops below 3/week or DQI is flat, I\'m on a call with your team that week — not at the renewal meeting."',
    productStatus: 'shipped',
    statusDetail:
      'Outcome Gate Phase 1 (2026-04-26) ships the structural fix. Phase 2 (auto-draft outcome integration) lands next iteration. Workflow mapping in discovery is documented in es_9. Health metrics in es_8.',
    severity: 'critical',
  },
];

// ─── Cialdini's 6 Influence Principles applied to Decision Intel ──────────
// Source: NotebookLM master KB synthesis 2026-04-26 (note 75e173e9), grounded
// in Cialdini's "Influence: The Psychology of Persuasion" PDF in the KB.

export interface CialdiniPrinciple {
  id: string;
  name: string;
  oneLineTactic: string;
  examplePhrase: string;
  antiPattern: string;
  citationContext: string;
}

export const CIALDINI_FOR_DI: CialdiniPrinciple[] = [
  {
    id: 'reciprocation',
    name: 'Reciprocation',
    oneLineTactic:
      'Provide an unsolicited high-value bias audit of a public document to trigger a sense of obligation for a meeting.',
    examplePhrase:
      '"I ran a free audit on your last public S-1 / annual report / IC summary — let me show you the three biases it caught."',
    antiPattern:
      'Asking for the meeting first and PROMISING the audit later. The audit must arrive uninvited; the meeting is what reciprocates.',
    citationContext: 'Cialdini Ch. 2 (Reciprocation): the rule of obligation is automatic and pre-attentional.',
  },
  {
    id: 'commitment_consistency',
    name: 'Commitment & Consistency',
    oneLineTactic:
      'Secure a small initial agreement about the pain of unchecked biases, then drive alignment toward a pilot.',
    examplePhrase:
      '"Would you agree that unmeasured decision noise in your IC memos costs your fund money over a vintage?" → wait for yes → "Then a £2K/month pilot to measure that noise specifically is the rational next step, right?"',
    antiPattern:
      'Asking for the £2K commitment first. Always ladder up from a small intellectual yes to the financial commitment — never the reverse.',
    citationContext: 'Cialdini Ch. 3: people honour previously stated positions to avoid cognitive dissonance.',
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    oneLineTactic:
      'Leverage the 135-case library to demonstrate that peer enterprise teams are actively mitigating these exact risks.',
    examplePhrase:
      '"Your memo\'s structural profile matches 12 historical recommendations from comparable funds; 9 produced negative outcomes. The pattern is well-documented in the case library."',
    antiPattern:
      'Naming specific competitors as customers. Decision Intel\'s peer-validation comes from the 135-case CASE LIBRARY (well-documented historical decisions), not from a logo wall.',
    citationContext: 'Cialdini Ch. 4: in conditions of uncertainty, people look to similar others to determine correct behaviour.',
  },
  {
    id: 'liking',
    name: 'Liking',
    oneLineTactic:
      'Build rapid affinity and trust through "dangerous honesty" about your product\'s real limitations.',
    examplePhrase:
      '"I respect your IC\'s rigor, and to be completely honest, our audit catches biases but cannot rescue a fundamentally bad capital-allocation thesis. WeWork\'s mitigated DQI ceiling is still a D — that\'s the honest math."',
    antiPattern:
      'Hiding limitations to look stronger. Sophisticated buyers detect concealment in 30 seconds; honesty about gaps INCREASES liking, not decreases it.',
    citationContext: 'Cialdini Ch. 6: similarity, compliments, and association drive liking; honesty signals respect for the buyer\'s intelligence.',
  },
  {
    id: 'authority',
    name: 'Authority',
    oneLineTactic:
      'Establish unquestionable expertise by anchoring on the 2008-crisis paper + Nobel-winning behavioural science (Kahneman-Klein 2009 R²F).',
    examplePhrase:
      '"Our Recognition-Rigor Framework doesn\'t use generic AI; it operationalises 50 years of Kahneman and Klein\'s peer-reviewed research. I published my own paper on bias mechanics in the 2008 financial crisis — happy to send it."',
    antiPattern:
      'Citing your age (16). Authority comes from credentials + research grounding, not from emphasising youth as a "fascinating" angle.',
    citationContext:
      'Cialdini Ch. 5: titles, attire, and trappings (here: cited research, advisor relationships, published papers) trigger automatic deference.',
  },
  {
    id: 'scarcity',
    name: 'Scarcity',
    oneLineTactic:
      'Drive urgency by offering an exclusive, highly limited design partnership (5 seats total) instead of an open-ended trial.',
    examplePhrase:
      '"We\'re opening only 5 design-partner seats to co-build this category. 4 are already taken. The window closes when the 5th seat fills — likely within 4 weeks based on current conversations."',
    antiPattern:
      'Manufacturing fake scarcity ("price goes up next month!"). Real scarcity is structural (5 seats, founder time-bound) — never invented.',
    citationContext:
      'Cialdini Ch. 7: scarcity heuristic; people value what is rare, but only when the scarcity is credible.',
  },
];

// ─── Buying Committee Map (Pan-African fund vs F500 CSO) ──────────────────
// Source: NotebookLM master KB synthesis 2026-04-26 (note 75e173e9). The
// roles in each ICP's buying committee, what each cares about, what each
// vetoes, how to navigate. Toggle in UI between the two ICP segments.

export type BuyingCommitteeIcp = 'pan_african_fund' | 'f500_cso';

export interface CommitteeRole {
  id: string;
  title: string;
  persona: string;
  cares: string;
  vetoes: string;
  navigate: string;
  yPosition: number;
  authority: 'champion' | 'economic' | 'influencer' | 'veto';
}

export const BUYING_COMMITTEE: Record<BuyingCommitteeIcp, {
  label: string;
  description: string;
  roles: CommitteeRole[];
}> = {
  pan_african_fund: {
    label: 'Pan-African Fund (the GTM wedge)',
    description:
      '6-role committee for a $200M-$2B AUM Pan-African / EM-focused fund deciding whether to onboard Decision Intel. The Managing Partner holds budget; the Investment Director is your champion path; the Associate is the user; the GC vetoes on compliance; the Audit Chair vetoes on fiduciary risk; the CFO vetoes on cost.',
    roles: [
      {
        id: 'mp',
        title: 'Managing Partner / GP',
        persona: 'The economic buyer. Holds budget. Pattern-matches against firm reputation + LP perception.',
        cares:
          'LP perception of rigor; whether DI shows up favourably in the next LP investor letter; the "would I be embarrassed if this came up at the next LP advisory meeting" test.',
        vetoes:
          'Tools that read as gimmicky or unproven; anything that could embarrass the firm if leaked; spending without clear ROI math.',
        navigate:
          'Never sell directly to MP first. Land the Investment Director as champion; have the Director frame the partnership as risk reduction + LP-grade rigor; MP signs once Director endorses.',
        yPosition: 0,
        authority: 'economic',
      },
      {
        id: 'id',
        title: 'Investment Director / Senior Principal',
        persona: 'Your champion path. Has personally watched a deal go sideways. Wants the audit pre-IC.',
        cares:
          'Catching the bias their associates missed; demonstrating rigor at IC; being the partner who brought modern decision tooling into the firm.',
        vetoes:
          'Tools that generate friction in their team\'s workflow; vendors who don\'t respect IC time; anything that doesn\'t produce a usable artefact.',
        navigate:
          'Run the 7-minute Dangote DPR walk-through (es_10). Frame the partnership as "you and I co-build the IC-memo audit standard for Pan-African funds." This is the relationship the entire deal depends on.',
        yPosition: 1,
        authority: 'champion',
      },
      {
        id: 'associate',
        title: 'Associate / Analyst',
        persona: 'The user. Lives in Slack + Excel + Word. Drafts the IC memos.',
        cares:
          'UI quality; speed; removing friction; making themselves look smart in front of the partners.',
        vetoes:
          'Hackathon-looking projects; high onboarding friction; anything that forces them to leave their existing workflow on a 13" laptop with 4G connection.',
        navigate:
          'Map their workflow IN the discovery call (es_9). Set up email-forward or Drive integration so audits happen automatically when a draft is saved. Zero behaviour change required.',
        yPosition: 2,
        authority: 'influencer',
      },
      {
        id: 'gc',
        title: 'General Counsel / Chief Compliance Officer',
        persona: 'The legal gatekeeper. Assesses regulatory + vendor risk.',
        cares:
          'Data privacy; AI explainability; survivability of regulatory claims; alignment with NDPR, CBN, WAEMU, PoPIA, and local securities laws (e.g., Nigerian SEC ISA 2007).',
        vetoes:
          'Unmanaged legal exposure; missing regional compliance frameworks (especially ISA 2007 for Nigerian SEC-licensed firms); inability to generate Client-Safe anonymised export modes.',
        navigate:
          'Lead with the 17-framework compliance map + signed DPA. Acknowledge the ISA 2007 gap honestly + commit to closing it within 2 weeks. Emphasise AES-256-GCM encryption + GDPR/NDPR anonymisers stripping PII before any model call + hashed tamper-evident DPR.',
        yPosition: 3,
        authority: 'veto',
      },
      {
        id: 'audit_chair',
        title: 'Audit / Risk Committee Chair',
        persona: 'Fiduciary overseeing fund governance + ultimate risk exposure.',
        cares:
          'Reuters-headline risk; vendor robustness (is this startup going to be alive in 12 months?); auditable liability; whether the DPR is something they\'d cite in a board minute or to a regulator.',
        vetoes:
          '"Black box" AI; unproven scoring methodologies (DQI weights without confidence intervals); startup jargon.',
        navigate:
          'Lead with academic provenance — R²F built on 50 years of Kahneman-Klein peer-reviewed research (cite the 2009 paper, DOI 10.1037/a0016755). Show the Board Report PDF. Speak in enterprise vocabulary, never marketing jargon. Honest about DQI being directionally correct, not point-precise — confidence intervals come from per-org Brier-scored recalibration over 18 months.',
        yPosition: 4,
        authority: 'veto',
      },
      {
        id: 'cfo',
        title: 'Chief Financial Officer',
        persona: 'Controls operational budget + software vendor spend.',
        cares:
          'Cost justification; clear budget lines; comparable spend benchmarks.',
        vetoes:
          'Proposals that read as a software tool spec rather than a business case; unjustified premium pricing.',
        navigate:
          'Frame as "insurance premium on capital-allocation cadence." Benchmark £2K/month design partnership against the millions in capital eroded by a single blown deal. Provide a one-pager: what success looks like at month 6, what the £24K annualised cost is as a fraction of total advisory + due-diligence spend.',
        yPosition: 5,
        authority: 'veto',
      },
    ],
  },
  f500_cso: {
    label: 'Fortune 500 CSO Office (the revenue ceiling — 12-18 months out)',
    description:
      '5-role committee at a $5B+ Fortune 500 strategy office deciding whether to adopt Decision Intel as a recurring memo-audit layer. Different politics: the CSO owns budget but defers to the audit committee on compliance + the GC on regulatory; the strategy lead is the user-champion; procurement is the deal-killer if mishandled.',
    roles: [
      {
        id: 'cso',
        title: 'Chief Strategy Officer',
        persona: 'Economic buyer. Reports to CEO. Cares about board-level credibility of recommendations.',
        cares:
          'Board-ready evidence per memo; compounding edge over time; the audit committee accepting AI-assisted strategic decisions as defensible.',
        vetoes:
          'Tools that introduce friction into existing committee cadence; vendors who can\'t produce regulator-grade artefacts; anything that requires C-suite explaining to their board.',
        navigate:
          'Lead with the Decision Provenance Record + 17-framework regulatory map. Frame as "the artefact your audit committee will eventually require evidence of, before regulators start asking." EU AI Act Article 14 enforcement August 2026 = the calendared why-now.',
        yPosition: 0,
        authority: 'economic',
      },
      {
        id: 'strategy_lead',
        title: 'Head of Strategic Planning / VP of Strategy',
        persona: 'Champion path. Owns the review cadence. Lives the friction of unaudited memos.',
        cares:
          'Consistent quality across analysts; surfacing dissent before committee; being the strategy lead who modernised the review process.',
        vetoes:
          'Tools that don\'t respect the existing strategic review cadence; vendors who try to replace existing process rather than augment it.',
        navigate:
          'Frame as "the missing pre-committee hygiene step." Workflow mapping in discovery (es_9). Position DI as augmenting the existing cadence, never replacing it. Strategy leads are who walk the CSO through the buying decision internally.',
        yPosition: 1,
        authority: 'champion',
      },
      {
        id: 'gc_f500',
        title: 'General Counsel + Chief Privacy Officer',
        persona: 'Legal + privacy gatekeeper. Vetoes on compliance posture.',
        cares:
          'GDPR Article 22 automated-decision rights; SOC 2 Type II; the Decision Provenance Record being defensible under the EU AI Act + applicable US state laws (Colorado SB24-205 enforceable Feb 2026).',
        vetoes:
          'Vendors who claim certifications they don\'t have; black-box AI without explainability; missing Client-Safe export modes for any LP-bound or audit-committee-bound artefact.',
        navigate:
          'Match the F500 procurement bar: SOC 2 Type II infrastructure (Vercel + Supabase), AES-256-GCM encryption, hashed + tamper-evident DPR, full DPA, 17-framework regulatory map. Cite the trust-copy single source of truth (src/lib/constants/trust-copy.ts) so claims never drift.',
        yPosition: 2,
        authority: 'veto',
      },
      {
        id: 'cfo_f500',
        title: 'CFO / Head of Procurement',
        persona: 'Budget approver + procurement gatekeeper.',
        cares:
          'Multi-year ROI; vendor financial health; comparable spend benchmarks (vs McKinsey / BCG / consulting); contract structure (renewal terms, data portability on termination).',
        vetoes:
          'Vendor lock-in language; absence of data portability + exit assistance + termination terms; unrealistic ROI claims.',
        navigate:
          'Use the public Enterprise Quote Builder (/pricing/quote) to produce a non-binding offer with the Enterprise Terms Appendix (indemnification, SLA per tier, data portability on termination). The transparent terms BEFORE procurement engagement compresses the procurement cycle by weeks.',
        yPosition: 3,
        authority: 'veto',
      },
      {
        id: 'audit_committee',
        title: 'Audit Committee Chair (Board-level)',
        persona: 'Board fiduciary. Ultimate sign-off on AI-assisted strategic decision tooling.',
        cares:
          'Whether AI-assisted decision tools introduce risk that requires board-level disclosure; the EU AI Act Article 14 record-keeping evidence trail; the Decision Provenance Record as the auditable artefact.',
        vetoes:
          'Tools that add board-disclosure burden; vendors without published methodologies; AI systems that produce outputs the audit committee can\'t defend in a regulator meeting.',
        navigate:
          'Position the DPR as the artefact that REDUCES disclosure burden — it IS the regulator-grade evidence trail. Reference EU AI Act Article 14 alignment + the CLAUDE.md regulatory tailwinds. Audit Committee chairs are won at the level of frameworks, not features.',
        yPosition: 4,
        authority: 'veto',
      },
    ],
  },
};

// ─── Deal Stall Diagnostic Tree ─────────────────────────────────────────
// Source: NotebookLM master KB synthesis 2026-04-26 (note 75e173e9). When a
// strong-meeting buyer goes silent for 2-3 weeks, what's the diagnostic +
// recovery move? Ranked by probability.

export interface DealStallDiagnostic {
  id: string;
  title: string;
  probability: 'High' | 'Medium' | 'Low';
  diagnostic: string;
  recoveryMove: string;
  recoveryScript: string;
}

export const DEAL_STALL_DIAGNOSTICS: DealStallDiagnostic[] = [
  {
    id: 'champion_stuck_internal',
    title: 'Internal champion stuck on approval chain',
    probability: 'High',
    diagnostic:
      'Your champion (the Investment Director / Strategy Lead) loved the 7-minute audit walk-through and committed to internal champion duty. But they\'re now blocked above them — likely on CFO sign-off for the £2K/month line item, or on GC review of the DPA, or on Audit Chair review of vendor risk.',
    recoveryMove:
      'Equip the champion with the SPECIFIC artefact each blocker needs. Don\'t try to bypass the champion to reach the blocker — that destroys the relationship. Instead, ship the champion a one-page CFO-grade ROI summary + the signed DPA + the Audit Chair-grade vendor brief in a single email.',
    recoveryScript:
      '"I know your CFO + GC will need specific artefacts to greenlight this. I\'ve attached: (1) one-page ROI summary written for your CFO\'s spend-comparable lens, (2) our signed DPA template ready for your GC\'s review, (3) the vendor brief your Audit Chair will want — including SOC 2 posture + framework-by-framework regulatory map. Forward these directly; they answer 90% of the questions before they\'re asked."',
  },
  {
    id: 'export_blocker',
    title: 'Client-Safe Export Mode blocker (LP-bound DPR usage)',
    probability: 'High',
    diagnostic:
      'After the meeting, the partner mentally rehearsed sharing the DPR with their LPs / audit committee. They realised the current PDF leaks target company names, financial amounts, and competitive intel. They can\'t pay £2K/month for a tool whose output they can\'t safely export to the people they need to share it with.',
    recoveryMove:
      'Pre-emptively remove the blocker. Acknowledge it directly + commit to manual redaction for the first design-partner cycle while auto-redaction is built. The honesty-first response (per Cialdini Liking + JOLT Limit) lands harder than promising features you don\'t have.',
    recoveryScript:
      '"I\'ve been refining DPR exports based on fund feedback. We are finalising Client-Safe Export Mode that auto-replaces target names + financials with placeholders ([COMPANY_NAME], [REDACTED-AMOUNT]) while preserving the bias analysis + DQI score for LP reporting. For the first cohort of design partners I do this redaction manually so you have a working artefact today — happy to walk through the template I\'d use."',
  },
  {
    id: 'isa_2007_gap',
    title: 'Nigerian SEC ISA 2007 compliance gap (Sankore-class)',
    probability: 'High',
    diagnostic:
      'The partner forwarded your 17-framework compliance map to their GC or CCO. The GC noticed that while you have NDPR, CBN, and WAEMU, you\'re missing the Investment and Securities Act 2007. For a Nigerian SEC-licensed firm managing ₦100B+ AUM, this is a procurement deal-killer.',
    recoveryMove:
      'Demonstrate extreme regulatory competence. Don\'t fake coverage; commit to closing the gap in a credible timeframe (2 weeks). The response itself proves you\'re building a compliance moat, not just shipping a hacker product.',
    recoveryScript:
      '"As we prepare for a potential pilot, I wanted to let you know I\'m actively mapping the Nigerian SEC framework — specifically the Investment and Securities Act 2007 — into our compliance engine alongside our existing CBN + NDPR + WAEMU nodes. ETA 2 weeks. I\'d rather ship the ISA mapping correctly than fake coverage we don\'t have."',
  },
  {
    id: 'analysis_paralysis',
    title: 'Analysis paralysis from too many configurations offered',
    probability: 'Medium',
    diagnostic:
      'During the meeting, you may have acted as a "bobblehead" — offering endless configurations (custom personas, Slack integrations, API connections, different frameworks). You overwhelmed the buyer with choices. Decision fatigue follows; ghosting follows decision fatigue.',
    recoveryMove:
      'Apply JOLT Offer + Limit. Stop asking the buyer how they want to use it; tell them. Send a crisp one-page Design Partner proposal that DICTATES the workflow, doesn\'t ask them to design it.',
    recoveryScript:
      '"Based on how comparable funds operate, here\'s the exact 6-month playbook: (1) unlimited audits on your final IC drafts, (2) weekly 15-min syncs with me to refine the Brier scoring against your firm\'s outcomes, (3) Outcome Gate enforced at the platform level so the data flywheel actually rotates, (4) £2K/month, six-month term, case-study consent. This is the configuration that\'s worked for design partners; everything else is variation around the edges."',
  },
  {
    id: 'refrigerator_deal',
    title: 'Refrigerator deal — pipeline timing mismatch',
    probability: 'Medium',
    diagnostic:
      'The meeting was strong, but the partner\'s deal pipeline is currently slow. They don\'t have a major acquisition thesis going to IC this week. The opportunity moved from the "kitchen table" (highly perishable, needs immediate action) to the "refrigerator" (a decision that will be made next quarter).',
    recoveryMove:
      'Don\'t pester with "checking in" emails. Switch to providing asymmetric value to keep the deal warm. Send a high-value bias autopsy of a recent public corporate failure in their specific sector — proves the R²F framework\'s value asynchronously.',
    recoveryScript:
      '"Wanted to share something you might find useful — I just published a 300-word bias autopsy on [recent public sector-specific failure] using our 135-case pattern matcher. The toxic combination that drove the collapse maps to a recurring pattern in your sector. Attached. Whenever your next major IC memo is ready for a stress test, let me know."',
  },
];

// ─── 7-Minute Artefact-Led Pitch Beats ────────────────────────────────────
// Source: es_10 Founder School lesson + NotebookLM synthesis. The minute-by-
// minute script for running the live specimen audit on a sales call.

export interface PitchBeat {
  timeMark: string;
  beat: string;
  whatToSay: string;
  whatToFeel: string;
  antiPattern: string;
}

export const ARTIFACT_LED_PITCH_BEATS: PitchBeat[] = [
  {
    timeMark: '0:00–0:30',
    beat: 'Frame the document',
    whatToSay:
      '"Before I show you anything we built, I want to run an audit on a document you already know — the WeWork S-1 from 2019 / the Dangote 2014 Pan-African expansion plan. The outcome is famous, so we can compare what our pipeline catches against what hindsight tells us."',
    whatToFeel:
      'You\'re asserting authority by leading with evidence, not pitch. The buyer is curious — they want to see the audit run.',
    antiPattern:
      'Opening with "let me tell you about Decision Intel." The product is invisible scaffolding around the audit.',
  },
  {
    timeMark: '0:30–2:00',
    beat: 'Open the DPR + show the headline DQI + verdict',
    whatToSay:
      'Open the DPR PDF. Walk through the cover (DQI 24, F grade, "Reject as drafted" verdict). Pause for 3 seconds after each headline number — let the reader absorb. Don\'t over-narrate.',
    whatToFeel:
      'Letting the artefact do the work. Silence after the number is the move that lands the gravity.',
    antiPattern:
      'Talking through the cover. The cover IS the talk. Silence is the persuasion.',
  },
  {
    timeMark: '2:00–4:30',
    beat: 'Walk the 3 bias flags one at a time',
    whatToSay:
      '**Overconfidence (DI-B-007, +12 lift):** "Adjusted EBITDA framing excluded standard operating costs and was presented as the headline metric." [pause] **Anchoring (DI-B-002, +9 lift):** "Every projection tethered to the $47B private valuation set by SoftBank, not to market comparables." [pause] **Sunk cost (DI-B-006, +5 lift):** "$4B+ of prior funding shaped the IPO as the only path forward, narrowing the alternatives." [pause]',
    whatToFeel:
      'After each pause, let them say "yeah, we saw that at the time." That recognition is the buy signal.',
    antiPattern:
      'Walking all 12 nodes of the pipeline. Read the 3 flags. The pipeline is interesting; the flags are conversion-grade.',
  },
  {
    timeMark: '4:30–5:30',
    beat: 'The counterfactual lift + honest ceiling',
    whatToSay:
      '"If all three biases had been flagged and mitigated pre-IPO, the DQI would have lifted from 24 to 50 — still a D, because the underlying capital-allocation thesis had structural failures beyond bias. The audit catches what the board would catch; it cannot rescue a fundamentally bad decision. That honesty is part of why CSOs trust the output."',
    whatToFeel:
      'The "still a D" line is the honesty-first move (Cialdini Liking + JOLT Limit). Sales founders cut this line; it\'s the line that closes.',
    antiPattern:
      'Over-claiming the counterfactual ("the audit would have prevented WeWork"). Sophisticated buyers detect over-claiming in 30 seconds.',
  },
  {
    timeMark: '5:30–6:30',
    beat: 'Pivot to their world',
    whatToSay:
      '"On your team\'s memos, the same pipeline runs every flag against the same rubric. The difference is that you see the flags BEFORE the board does, not in the post-mortem. We do this for IC memos at funds, board packs at corp dev teams, and strategic recommendations at F500 strategy offices — pick the artefact that matches your workflow."',
    whatToFeel:
      'Hand back to them. The buyer\'s mind is now mapping their own memos onto the audit motion.',
    antiPattern:
      'Listing all use cases breathlessly. Three named use cases (IC, board packs, strategic recommendations) is enough.',
  },
  {
    timeMark: '6:30–7:00',
    beat: 'The transition question (this is the close)',
    whatToSay:
      '"If you brought one redacted IC memo or strategy doc from a recent decision that didn\'t go to plan, I could run the audit live in our next call. About a third of the people I show this to want to do that — would it be useful?"',
    whatToFeel:
      'Yes/no question; no hedging. The "bring your own document" ask converts at materially higher rates than any other follow-up.',
    antiPattern:
      'Asking "what do you think?" or "do you have any questions?" — both invite endless objection-surfacing instead of closing the next concrete step.',
  },
];
