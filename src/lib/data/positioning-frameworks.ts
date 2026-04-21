// Extended positioning frameworks — seven more decision-grade tools,
// pre-filled for Decision Intel.
//
// Sources (all infographics uploaded 2026-04-18):
//   - 5 Levels of Entrepreneurship Thinking
//   - Positioning 8-step yes/no flowchart
//   - Brand Building 8 steps
//   - Storytelling 9 steps
//   - Founder Content System (7-day cadence)
//   - Modern Sales Process (10 steps)
//   - Ideal Customer Profile (9 steps)

import type { Status } from './positioning-copilot';

// ─── Framework 1 — 5 Levels of Entrepreneurship Thinking ───────────────────

export interface EntrepreneurLevel {
  level: number;
  title: string;
  motto: string;
  goal: string;
  mindset: string;
  howToImprove: string[];
  decisionIntelState:
    | { kind: 'below'; note: string }
    | { kind: 'current'; note: string }
    | { kind: 'next'; note: string; moves: string[] }
    | { kind: 'aspiration'; note: string };
  color: string;
}

export const CURRENT_LEVEL = 2; // honest self-assessment — we have a product, we are discovering

export const ENTREPRENEUR_LEVELS: EntrepreneurLevel[] = [
  {
    level: 1,
    title: 'The Doer',
    motto: '"Let me try this idea quickly."',
    goal: 'Move fast',
    mindset: 'Action-first, no strategy',
    howToImprove: ['Define the problem before building', 'Talk to users before launching'],
    decisionIntelState: {
      kind: 'below',
      note: 'Moved past this. The 200+ components, 70+ routes, and 12-node pipeline prove execution. No more "just ship" without strategy.',
    },
    color: '#86A789',
  },
  {
    level: 2,
    title: 'The Builder',
    motto: '"Let\'s build something people want."',
    goal: 'Validation',
    mindset: 'Problem-first',
    howToImprove: ['Define your ideal customer', 'Focus on one use case'],
    decisionIntelState: {
      kind: 'current',
      note: 'We are here. Product is built. ICP is CSO. One use case: strategic memo audit. Next proof needed: a paying pilot.',
    },
    color: '#D8BFD8',
  },
  {
    level: 3,
    title: 'The Strategist',
    motto: '"How do I win this market?"',
    goal: 'Scale',
    mindset: 'Systems and leverage',
    howToImprove: ['Build feedback loops', 'Test distribution channels'],
    decisionIntelState: {
      kind: 'next',
      note: 'The level-up zone. Winning the market means repeatable outreach → pilot → paid motion. Distribution is the unlock.',
      moves: [
        'Ship the outreach cadence: LinkedIn daily + advisor intro weekly + cold email M/W/F',
        'Instrument every demo: which slide kills which objection, which hook converts',
        'Test 3 channels in parallel: LinkedIn inbound, advisor warm intro, proof-page-to-Calendly',
      ],
    },
    color: '#F7E7A4',
  },
  {
    level: 4,
    title: 'The Operator',
    motto: '"How do I build a growth machine?"',
    goal: 'Leverage',
    mindset: 'Automation and systems',
    howToImprove: ['Build repeatable processes', 'Focus on predictable revenue'],
    decisionIntelState: {
      kind: 'aspiration',
      note: 'Post-pilot, post-seed. Repeatable CSO acquisition, 90-day pilot-to-paid conversion motion, customer success playbook.',
    },
    color: '#E8A89C',
  },
  {
    level: 5,
    title: 'The Category Creator',
    motto: '"I don\'t compete. I redefine the game."',
    goal: 'Dominate a category',
    mindset: 'Narrative and positioning',
    howToImprove: ['Create a unique point of view', 'Build a strong brand story'],
    decisionIntelState: {
      kind: 'aspiration',
      note: 'Decision intelligence as a named category. "Cloverpop for decisions" becomes "Decision Intel for decisions." 3-5 year horizon.',
    },
    color: '#C8B4DD',
  },
];

// ─── Framework 2 — Positioning Yes/No Flow ────────────────────────────────

export interface FlowStep {
  id: string;
  step: number;
  title: string;
  question: string;
  yesAnswer: string; // what being on the Yes side looks like
  noFailure: string; // what happens if No
  diFlag: 'yes' | 'partial' | 'no';
  diNote: string;
}

export const POSITIONING_FLOW: FlowStep[] = [
  {
    id: 'customer',
    step: 1,
    title: 'Customer',
    question: 'Do you know exactly who this is for?',
    yesAnswer: 'CSO at Fortune 500 / late-stage private. Signs the contract. Board-accountable.',
    noFailure: 'Too broad = no one cares. Pick a specific person.',
    diFlag: 'yes',
    diNote: 'Locked. CSO first, M&A Head second. Not PE/VC.',
  },
  {
    id: 'problem',
    step: 2,
    title: 'Problem',
    question: 'Does this solve a painful problem?',
    yesAnswer: 'Yes — career-ending bias in strategic memos. Tenure compression. Board scrutiny.',
    noFailure: 'Weak problem = weak demand. Raise the stakes.',
    diFlag: 'yes',
    diNote: 'One bad memo ends a CSO career. Pain is existential.',
  },
  {
    id: 'alternatives',
    step: 3,
    title: 'Alternatives',
    question: 'Do you know what they use instead?',
    yesAnswer: 'Manual peer review, ad-hoc consulting (McKinsey/Bain), informal ChatGPT.',
    noFailure: 'No context = no decision. Find the baseline.',
    diFlag: 'yes',
    diNote: 'Clear baseline — each with specific failure modes we exploit.',
  },
  {
    id: 'difference',
    step: 4,
    title: 'Difference',
    question: 'Is this clearly different?',
    yesAnswer:
      '60-second structured audit + DQI grade + Decision Knowledge Graph. No one else has the graph.',
    noFailure: '"Better" is weak. "Different" wins.',
    diFlag: 'yes',
    diNote: 'Different, not just better. The graph is the unfakeable differentiator.',
  },
  {
    id: 'value',
    step: 5,
    title: 'Value',
    question: 'Is the value obvious?',
    yesAnswer: 'One prevented bad strategic decision > 10x annual subscription cost.',
    noFailure: 'Confusion kills conversion. Simplify it.',
    diFlag: 'partial',
    diNote:
      'ROI obvious. Mechanism (how we catch bias) needs a one-sentence explanation every prospect gets on first contact.',
  },
  {
    id: 'category',
    step: 6,
    title: 'Category',
    question: 'Do people know what this is?',
    yesAnswer:
      'Decision intelligence for corporate strategy. Adjacent to decision management (Cloverpop).',
    noFailure: 'No anchor = confusion. Anchor to something familiar.',
    diFlag: 'partial',
    diNote:
      'Category still emerging. "AI-native strategy ops" is the emerging frame — anchor there in outreach.',
  },
  {
    id: 'proof',
    step: 7,
    title: 'Proof',
    question: 'Is there proof it works?',
    yesAnswer:
      '135 historical decisions audited retrospectively. Every failure traceable to a bias.',
    noFailure: 'No proof = no trust.',
    diFlag: 'partial',
    diNote:
      'Retrospective proof is strong. Live customer proof is the gap — needs first paid pilot.',
  },
  {
    id: 'relevance',
    step: 8,
    title: 'Relevance',
    question: "Does it feel like it's for them?",
    yesAnswer:
      'CSO-specific language. Board deck / strategic memo / steering committee. No PE/VC jargon.',
    noFailure: 'Feels generic = use their language, show their world.',
    diFlag: 'yes',
    diNote: 'Vocabulary is locked in CLAUDE.md. Every touchpoint uses CSO-native terms.',
  },
];

export const FLOW_CLOSING = {
  principle: 'GREAT POSITIONING ALWAYS:',
  rules: [
    'Start specific',
    'Solve real pain',
    'Be different',
    'Be obvious',
    'Prove it',
    'Make it stick',
  ],
};

// ─── Framework 3 — Brand Building 8 steps ─────────────────────────────────

export interface BrandStep {
  id: string;
  step: number;
  title: string;
  question: string;
  diAnswer: string;
  status: Status;
  ifWeak: string;
}

export const BRAND_STEPS: BrandStep[] = [
  {
    id: 'strategic_analysis',
    step: 1,
    title: 'Strategic Analysis',
    question: 'Have you identified unmet customer needs and competitor gaps?',
    diAnswer:
      'Unmet need: continuous, structured bias audit of strategic memos. Competitor gap: Cloverpop handles workflow not bias; consulting is too slow and exits with the consultant; ChatGPT has no memory or citations.',
    status: 'strong',
    ifWeak: 'Stop and research. Talk to real customers. Map competitor strengths and weaknesses.',
  },
  {
    id: 'essence',
    step: 2,
    title: 'Brand Essence',
    question: "Can you define your brand's soul in one timeless concept?",
    diAnswer:
      '"We catch what others miss." One concept, four moments (Graph, Predict, Audit, Outcome loop). It outlives any feature.',
    status: 'strong',
    ifWeak: 'Revisit self-analysis. What one thing must you be known for?',
  },
  {
    id: 'identity',
    step: 3,
    title: 'Identity Depth',
    question: 'Does your brand go beyond product?',
    diAnswer:
      'Yes — methodology-first (Kahneman, Tetlock, Sibony, Strebulaev cited publicly). A principled point of view: cognitive bias is operationally detectable and correctable, not a soft-skill problem.',
    status: 'strong',
    ifWeak: 'Anchor to a timeless pillar: a belief, a manifesto, a counter-conventional truth.',
  },
  {
    id: 'value_prop',
    step: 4,
    title: 'Value Proposition',
    question: 'Do you offer emotional or self-expressive benefits?',
    diAnswer:
      'Emotional: preserve your credibility with the CEO and board. Self-expressive: the CSO who runs the most rigorous strategy function in the company — quarter after quarter.',
    status: 'strong',
    ifWeak: 'Commodity warning. Add a brand personality or a brand symbol.',
  },
  {
    id: 'credibility',
    step: 5,
    title: 'Execution & Credibility',
    question: 'Do you have proof points to back up your claims?',
    diAnswer:
      'Retrospective 135-case library. Published bias taxonomy (DI-B-001–020). /proof page with live detection demos. GAP: no paying pilot yet.',
    status: 'partial',
    ifWeak: 'Brand gap. Fix operations or delivery. Collect proof stories and facts.',
  },
  {
    id: 'zoom_out',
    step: 6,
    title: 'Zoom Out',
    question: 'Are you seeing what others miss?',
    diAnswer:
      'The real competitor is "do nothing." The real objection is ego, not price. Strategy decisions are the last unstructured C-suite workflow. These are non-obvious takes that show category-level thinking.',
    status: 'strong',
    ifWeak: 'Zoom out. What are the second-order effects of this market shift?',
  },
  {
    id: 'launch',
    step: 7,
    title: 'Positioning & Launch',
    question: 'Will they instantly get the meaning?',
    diAnswer:
      'Tagline: "The decision intelligence platform for corporate strategy." First-line outreach: "Kodak lost $31B. We would have caught it." Both are instantly legible.',
    status: 'partial',
    ifWeak: 'Visualize it — charts, images, before/after. Launch moment needs a signature visual.',
  },
  {
    id: 'visuals',
    step: 8,
    title: 'Visuals',
    question: 'Can they see the story?',
    diAnswer:
      'Bias web radial, DQI A-F card, pre-decision-memo red-flags layout, knowledge-graph hero. Consistent visual vocabulary. Needs stronger motion/demo video.',
    status: 'partial',
    ifWeak: 'Add context: analogy, personal relevance, human trade-offs.',
  },
];

// ─── Framework 4 — Storytelling 9 Steps ───────────────────────────────────

export type StoryContext = 'cold_email' | 'demo' | 'pitch';

export const STORY_CONTEXT_LABEL: Record<StoryContext, string> = {
  cold_email: 'Cold Email',
  demo: 'Live Demo',
  pitch: 'Investor Pitch',
};

export interface StoryStep {
  id: string;
  step: number;
  title: string;
  question: string;
  failureMode: string;
  byContext: Record<StoryContext, string>;
}

export const STORY_STEPS: StoryStep[] = [
  {
    id: 'attention',
    step: 1,
    title: 'Attention',
    question: 'Are people paying attention?',
    failureMode: 'You are in the entertainment business. Attention comes first.',
    byContext: {
      cold_email:
        '"Kodak lost $31B in one meeting. You probably have 3 biases in your next board memo."',
      demo: 'Open by pasting one of their prior board memo excerpts into the live audit. Let the DQI grade hit the screen before you say anything.',
      pitch:
        'Slide 1: a single photo of the 1975 Kodak digital-camera prototype memo. Silence. "$31B".',
    },
  },
  {
    id: 'emotion',
    step: 2,
    title: 'Emotion',
    question: 'Does it make them feel something?',
    failureMode: 'Add emotion: surprise, curiosity, discomfort, drama.',
    byContext: {
      cold_email: 'Discomfort. Make them think: "could this be in MY memo?"',
      demo: 'Controlled embarrassment for the prospect — their historic memo shows 4 flagged biases.',
      pitch: 'Stakes: careers end over one bad memo. The investor feels the existential CSO pain.',
    },
  },
  {
    id: 'surprise',
    step: 3,
    title: 'Surprise',
    question: 'Does it challenge expectations?',
    failureMode: 'Add surprise: contrarian take, provocative question, unexpected comparison.',
    byContext: {
      cold_email: '"Peer review is dangerous because peers are polite."',
      demo: '"The bias that killed Kodak is in 78% of the 135 memos we audited."',
      pitch: '"This is not the next Gong. This is Gong-before-it-was-obvious — 2016 Gong."',
    },
  },
  {
    id: 'evidence',
    step: 4,
    title: 'Evidence',
    question: 'Is the surprise anchored in proof?',
    failureMode: 'Provocation without evidence is noise.',
    byContext: {
      cold_email: 'Link to /proof with the Kodak pre-decision memo + the 4 biases we flagged.',
      demo: 'Walk through the 12-node pipeline on THEIR document. Every flag has a citation to the passage that triggered it.',
      pitch:
        '135 historical decisions. 30+ biases taxonomy. Published academic foundations (Kahneman, Tetlock).',
    },
  },
  {
    id: 'wow_data',
    step: 5,
    title: 'Wow Data',
    question: 'Does the data pass the "wow" test?',
    failureMode: 'Upgrade the data: scale, comparison, human meaning.',
    byContext: {
      cold_email:
        '"CSO average tenure is 3 years. One bad board recommendation ends most careers."',
      demo: 'Show the 20×20 bias interaction matrix — 400 toxic combinations the buyer has never seen mapped.',
      pitch:
        '$22.5M ARR at 5% penetration of the 15,000-company target TAM. ~90% blended gross margin.',
    },
  },
  {
    id: 'zoom_out',
    step: 6,
    title: 'Zoom Out',
    question: 'Are you seeing what others miss?',
    failureMode: 'Zoom out. Second-order effects. What happens next?',
    byContext: {
      cold_email:
        '"Post-ZIRP, every strategic bet is scrutinized. The cost of a bad memo is higher than ever."',
      demo: '"If you run this quarterly for 2 years, you have a Decision Knowledge Graph no competitor can replicate."',
      pitch:
        '"Sales ops, customer success ops, now strategy ops. Strategy is the last C-suite workflow with no intelligence layer."',
    },
  },
  {
    id: 'context',
    step: 7,
    title: 'Context',
    question: 'Will they instantly get the meaning?',
    failureMode: 'Visualize it: charts, images, before → after.',
    byContext: {
      cold_email: 'Embed one image: the pre-decision memo with 3 red flags. No more copy.',
      demo: 'Side-by-side: their memo before (grey) vs. after (annotated). Before → After is the most powerful frame.',
      pitch:
        'Compare the workflow: consulting engagement timeline (6 weeks, £300K) vs. Decision Intel (60 seconds, $249).',
    },
  },
  {
    id: 'visuals',
    step: 8,
    title: 'Visuals',
    question: 'Can they see the story?',
    failureMode: 'Add context: analogy, personal relevance, human trade-offs.',
    byContext: {
      cold_email: 'Bias web thumbnail inline. The radial shape is the signature visual.',
      demo: 'The Decision Knowledge Graph live in their browser — watch it populate as their memo lands.',
      pitch: 'One image: the DQI A-F card for a famous failed memo (Theranos pitch deck scored F).',
    },
  },
  {
    id: 'hope',
    step: 9,
    title: 'Hope',
    question: 'Does the story give people hope?',
    failureMode: 'Stories connect. Stories guide. End with a path forward.',
    byContext: {
      cold_email:
        '"Want to see your next memo audited in 60 seconds? One-click calendar link below."',
      demo: '"You can run this on every memo for the next year. Quarter after quarter, you compound."',
      pitch:
        '"In 10 years, every C-suite decision runs through a decision intelligence layer. We are that layer."',
    },
  },
];

// ─── Framework 5 — Founder Content System (7-day cadence) ─────────────────

export interface ContentDay {
  dayNumber: number;
  day: string;
  theme: string;
  intent: string;
  decisionQuestion: string;
  diPromptTemplate: string;
  format: string[];
}

export const CONTENT_WEEK: ContentDay[] = [
  {
    dayNumber: 1,
    day: 'Monday',
    theme: 'Start With Honesty',
    intent: 'Real insight from your week — struggle, shift, or learning.',
    decisionQuestion: 'Do you have something real to share this week?',
    diPromptTemplate:
      '"This week I [wrestled with / figured out / got wrong] [specific Decision Intel decision]. What I learned: [one-sentence insight]."',
    format: ['Short-form LinkedIn post (150-200 words)', 'No graphic — text carries the weight'],
  },
  {
    dayNumber: 2,
    day: 'Tuesday',
    theme: "Show What You're Building",
    intent: 'Prove you are actually building — feature, workflow, screenshot, behind-the-scenes.',
    decisionQuestion: "Have you shown progress on what you're building?",
    diPromptTemplate:
      '"Shipped: [feature name]. Why it matters to CSOs: [one line]. Screenshot: [actual product shot, not mockup]."',
    format: [
      'Product screenshot',
      '1-2 lines of CSO-relevant context',
      'Visible DQI grade or bias web if possible',
    ],
  },
  {
    dayNumber: 3,
    day: 'Wednesday',
    theme: 'Teach Your Thinking',
    intent: 'Teach one insight — a decision you made, a technique, a lesson.',
    decisionQuestion: 'Did you teach something useful?',
    diPromptTemplate:
      '"The bias that killed [famous company]: [bias name]. How to catch it in YOUR memo: [3 concrete checks]. DQI would score this a [grade]."',
    format: [
      'Case study carousel (5-7 slides)',
      'Bias-focused',
      'Ends with a question to the reader',
    ],
  },
  {
    dayNumber: 4,
    day: 'Thursday',
    theme: 'Create a Reach Post',
    intent:
      'Designed for reach — remix a viral structure, respond to a popular idea, simplify a complex concept.',
    decisionQuestion: 'Did you post something designed for reach?',
    diPromptTemplate:
      '"7 biases that quietly destroy strategic decisions (the 4th is in most board memos)." Listicle format — guaranteed scroll-stop.',
    format: ['Listicle or contrarian take', 'Hook-dense first 2 lines', 'Save-worthy payload'],
  },
  {
    dayNumber: 5,
    day: 'Friday',
    theme: "Share What Didn't Work",
    intent: 'Explain: what you tried → what failed → what changed. Failure makes you relatable.',
    decisionQuestion: 'Did you share something that failed?',
    diPromptTemplate:
      '"Thought: [hypothesis]. Tested: [specific outreach / pricing / messaging experiment]. Result: [number or quote]. Changing: [new approach]."',
    format: ['Post-mortem format', 'Actual numbers / quotes', 'Honest "what I got wrong"'],
  },
  {
    dayNumber: 6,
    day: 'Saturday',
    theme: 'Document the Journey',
    intent: 'Show the routine, workflow, or effort behind the work.',
    decisionQuestion: 'Did you document a real day of building?',
    diPromptTemplate:
      '"Saturday build log: [what you worked on] + [one screenshot] + [one decision you made and why]."',
    format: ['Building-in-public tone', 'Photo or screenshot', 'Short — 3-5 sentences max'],
  },
  {
    dayNumber: 7,
    day: 'Sunday',
    theme: 'End With a Recap',
    intent: 'Share what you built, what you learned, what comes next. Resets the cycle.',
    decisionQuestion: 'Did you recap the week?',
    diPromptTemplate:
      '"Week of [date] at Decision Intel: Built → [list]. Learned → [one insight]. Next week → [focus]. Quarter after quarter."',
    format: [
      'Numbered list or 3-block format',
      'Sign off with a theme line ("Consistency compounds")',
    ],
  },
];

export const CONTENT_PRINCIPLE =
  'Consistency compounds. A B+ post every day beats an A+ post once a month.';

// ─── Framework 6 — Modern Sales Process (10 Steps) ────────────────────────

export interface SalesStep {
  id: string;
  step: number;
  title: string;
  purpose: string;
  youAsk: string;
  theyMightSay: string;
  youRespond: string;
  trapToAvoid: string;
}

export const SALES_STEPS: SalesStep[] = [
  {
    id: 'customer',
    step: 1,
    title: 'Customer',
    purpose: 'Confirm exact buyer: role, industry, situation.',
    youAsk:
      '"Before we start — who else attends your steering committee, and how long have you been in the CSO seat?"',
    theyMightSay: '"I\'ve been CSO for 18 months. Board is 9 members, mostly independent."',
    youRespond:
      '"That gives us a clear context. Founded CSO + 9 independents = high scrutiny. Tell me about the last memo that got tough questions."',
    trapToAvoid:
      'Do not pitch before confirming role. A VP Strategy is NOT a CSO — the conversation changes entirely.',
  },
  {
    id: 'pain',
    step: 2,
    title: 'Pain',
    purpose: 'Is the problem painful enough to act on NOW?',
    youAsk:
      '"When was the last time you walked out of a board meeting feeling like you missed something?"',
    theyMightSay: '"Last quarter. I didn\'t see the capital-allocation question coming."',
    youRespond:
      '"That\'s exactly the pain we exist for. What would it have been worth to anticipate that question 48 hours earlier?"',
    trapToAvoid: 'If the answer is vague, do not push to pitch. Re-surface the trigger in step 3.',
  },
  {
    id: 'trigger',
    step: 3,
    title: 'Trigger',
    purpose: 'Why does this matter RIGHT NOW?',
    youAsk:
      '"What\'s changed in your function in the last 90 days — new CEO, new board member, new capital cycle?"',
    theyMightSay: '"New CFO arrived in February. Capital discipline is the theme for the year."',
    youRespond:
      '"Then your Q2 memo is under a sharper microscope than your Q1 was. This window is where audit makes the difference."',
    trapToAvoid: 'If no trigger, the deal will not close this quarter. Mark it as nurture.',
  },
  {
    id: 'discovery',
    step: 4,
    title: 'Discovery',
    purpose: 'How do they solve this today?',
    youAsk: '"Walk me through how you red-team a memo today. Who reads it? How long does it take?"',
    theyMightSay: '"Two peers. Takes about a week. They usually give me light edits."',
    youRespond: '"And in that week, how many biases do you estimate get caught? One? Three?"',
    trapToAvoid: 'Do not jump to "we do this better." Let them articulate the gap themselves.',
  },
  {
    id: 'implication',
    step: 5,
    title: 'Implication',
    purpose: 'Do they see the cost of the problem?',
    youAsk:
      '"If one uncaught bias costs one board cycle — what\'s the real cost to you? Reputation? Role? Strategic trajectory?"',
    theyMightSay: '"I think about this constantly. One bad call stays with you for years."',
    youRespond:
      "\"That's why we built this. The cost isn't a bad quarter. It's the trajectory of your career.\"",
    trapToAvoid: "Do not let the stakes feel theoretical. Anchor them to the CSO's own future.",
  },
  {
    id: 'value',
    step: 6,
    title: 'Value',
    purpose: 'Can they see the transformation?',
    youAsk:
      '"What does your next board meeting look like if the DQI grade on every memo is visible to the committee?"',
    theyMightSay: '"Honestly, it changes the power dynamic. They see we\'ve stress-tested it."',
    youRespond:
      '"Exactly. The grade is the shield. The graph is the compounding asset. Quarter after quarter."',
    trapToAvoid: 'Value = their transformation, not our features. Keep the camera on them.',
  },
  {
    id: 'differentiation',
    step: 7,
    title: 'Differentiation',
    purpose: 'Is the solution clearly DIFFERENT — not just better?',
    youAsk:
      '"Have you tried ChatGPT, consulting, or a peer-review framework? What\'s been missing?"',
    theyMightSay: '"ChatGPT doesn\'t remember. Consultants leave with the knowledge."',
    youRespond:
      '"We are different in one specific way: the Decision Knowledge Graph. Every audit you run compounds. Nothing else does that."',
    trapToAvoid: 'Do not list features. Pick ONE axis of difference and own it: memory.',
  },
  {
    id: 'decision',
    step: 8,
    title: 'Decision',
    purpose: 'Is the buying path clear?',
    youAsk: '"Who else signs off, and what\'s the budget line this typically sits on?"',
    theyMightSay: '"My discretionary line up to $100K. Beyond that, CFO."',
    youRespond:
      '"Perfect — Individual + Strategy tiers land well inside. Let\'s design a 90-day pilot that lives inside your line."',
    trapToAvoid:
      'Do not let the deal die on "let me check." Leave the call with a named next step.',
  },
  {
    id: 'action',
    step: 9,
    title: 'Action',
    purpose: 'Is the next step obvious?',
    youAsk:
      '"Would you rather (A) audit one real memo live on a 30-min call this week, or (B) start the 90-day pilot next Monday?"',
    theyMightSay: '"Let\'s do A first — I want to see it on a real document."',
    youRespond: '"I\'ll send the calendar link now. Block 30 min for Thursday. Bring the memo."',
    trapToAvoid: 'Do not offer 3+ options. Two-option close forces commitment.',
  },
  {
    id: 'followup',
    step: 10,
    title: 'Follow-up',
    purpose: 'Make post-call re-entry automatic.',
    youAsk:
      '"Can I add you to the weekly bias-case note so you see what we catch across the other CSO pilots?"',
    theyMightSay: '"Sure, add me."',
    youRespond:
      '"Great. First note lands Sunday. I\'ll reference one anonymized pattern that mirrors your situation."',
    trapToAvoid: 'Do not vanish between demo and close. The bias note is the drip.',
  },
];

export const SALES_PRINCIPLES = [
  "Start with the buyer's pain — not your features",
  'Create urgency before pitching',
  'Expose the cost of doing nothing',
  'Make value obvious in seconds',
  'Remove friction from the decision',
  'Treat sales as a repeatable system',
];

// ─── Framework 7 — Ideal Customer Profile (9 Steps) ───────────────────────

export interface ICPStep {
  id: string;
  step: number;
  title: string;
  question: string;
  diAnswer: string;
  narrowTo: string; // what the step should narrow the ICP to
  universeSize: number; // rough count remaining after this filter
}

export const ICP_STEPS: ICPStep[] = [
  {
    id: 'market_universe',
    step: 1,
    title: 'Market Universe',
    question: 'Can you list all possible customer segments?',
    diAnswer:
      'Everyone who makes strategic decisions for a company — executives, consultants, PE, VC, corp dev, strategy teams, non-profits.',
    narrowTo: 'All decision-making roles in companies > 50 employees.',
    universeSize: 500000,
  },
  {
    id: 'market_size',
    step: 2,
    title: 'Market Size',
    question: 'Is the segment large enough to support growth?',
    diAnswer:
      'Focus on companies with a formal strategy function — enterprise + late-stage private. Rules out startups (too small) and micro-businesses (no strategy function).',
    narrowTo: 'Companies with dedicated Chief Strategy function.',
    universeSize: 15000,
  },
  {
    id: 'product_fit',
    step: 3,
    title: 'Product Fit',
    question: 'Does your product strongly solve their problem?',
    diAnswer:
      'Our product audits strategic memos and board decks. Perfect fit for CSOs who write these quarterly.',
    narrowTo: 'Roles that write or sign off on board-level strategic memos.',
    universeSize: 12000,
  },
  {
    id: 'pain',
    step: 4,
    title: 'Pain',
    question: 'Is the problem painful enough to act on?',
    diAnswer:
      'Most painful for CSOs reporting to demanding boards (Fortune 500, PE-backed late-stage, public companies with activist investors).',
    narrowTo: 'CSOs at public + late-stage private with formal board oversight.',
    universeSize: 6000,
  },
  {
    id: 'accessibility',
    step: 5,
    title: 'Accessibility',
    question: 'Can you easily reach this customer?',
    diAnswer:
      'LinkedIn-active CSOs + those reachable via the Wiz advisor network. US + UK + Western Europe (English-language).',
    narrowTo: 'LinkedIn-active English-speaking CSOs in US/UK/EU.',
    universeSize: 3500,
  },
  {
    id: 'buying_behavior',
    step: 6,
    title: 'Buying Behavior',
    question: 'Do companies like this normally buy solutions like yours?',
    diAnswer:
      'Yes — CSOs buy strategy tools (Cloverpop, Spotfire, Palantir Foundry, consulting engagements). Line item exists.',
    narrowTo: 'CSOs with existing strategy-tool or consulting spend.',
    universeSize: 2500,
  },
  {
    id: 'decision_speed',
    step: 7,
    title: 'Decision Speed',
    question: 'Can they make buying decisions quickly?',
    diAnswer:
      'CSOs with discretionary budget up to ~$100K can pilot without procurement gauntlet. Individual + Strategy tiers sit inside this threshold.',
    narrowTo: 'CSOs with $50K-$250K discretionary authority.',
    universeSize: 1200,
  },
  {
    id: 'value_creation',
    step: 8,
    title: 'Value Creation',
    question: 'Will this customer generate meaningful revenue?',
    diAnswer:
      'Strategy tier ($2,499/mo = ~$30K ACV) + potential enterprise expansion for team features makes each CSO a meaningful account.',
    narrowTo: 'CSOs at companies > $100M revenue where $30K ACV is a rounding error.',
    universeSize: 800,
  },
  {
    id: 'retention',
    step: 9,
    title: 'Retention Potential',
    question: 'Will they stay and expand usage?',
    diAnswer:
      "Quarterly board cycles = natural renewal cadence. Decision Knowledge Graph compounds switching cost. Team expansion inside the CSO's function.",
    narrowTo:
      'Winning ICP: LinkedIn-active CSO, public or PE-backed, $100M+ revenue, recent board event, English-speaking.',
    universeSize: 500,
  },
];

export const ICP_CLOSING = {
  title: 'Year-1 Addressable ICP',
  bullets: [
    'LinkedIn-active CSO',
    'Public or PE-backed (>$100M revenue)',
    'English-speaking (US/UK/EU)',
    'Recent board event or new CEO/CFO trigger',
    'Discretionary budget $50K-$250K',
    '~500 target accounts — 5% penetration = 25 paying pilots',
  ],
};
