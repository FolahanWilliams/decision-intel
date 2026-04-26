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
