// Positioning Copilot — pre-filled framework answers for Decision Intel.
// Source frameworks:
//   - Sharp's brand system (category → availability)
//   - "How to Find a Market Worth Entering"
//   - Strategic Thinking compass (Natan Mohart)
//   - Ideal Pitch Deck Structure (Syed Muhammad Adeem)
//   - Boil-the-ocean quality standard
//
// Update whenever positioning shifts. Every answer here is mirrored back to
// the founder via the Positioning Copilot tab and the cheat-sheet PDF, so keep
// the voice concrete and CSO-ready — no filler, no hedging language.

export type Status = 'strong' | 'partial' | 'gap';

export const STATUS_COLOR: Record<Status, string> = {
  strong: '#16A34A',
  partial: '#F59E0B',
  gap: '#EF4444',
};

export const STATUS_LABEL: Record<Status, string> = {
  strong: 'Locked',
  partial: 'In progress',
  gap: 'Not yet',
};

// ─── Sharp's 8-step Brand Spine ─────────────────────────────────────────────

export interface SpineStep {
  id: string;
  step: number;
  title: string;
  question: string;
  answer: string;
  failureMode: string; // what happens if this step is weak
  status: Status;
  nextAction?: string;
}

export const SPINE_STEPS: SpineStep[] = [
  {
    id: 'category',
    step: 1,
    title: 'Category',
    question: 'Do you understand the market you are in?',
    answer:
      'Decision intelligence for corporate strategy — a new category that sits next to strategy consulting and BI, not inside either. The closest adjacent is "decision management" (Cloverpop), but we lead with bias-audit + outcome calibration, not workflow.',
    failureMode: 'No category clarity = weak brand. Know the game first.',
    status: 'partial',
    nextAction:
      'Anchor every cold email + every deck slide to "decision intelligence" so the term gets sticky.',
  },
  {
    id: 'buyer',
    step: 2,
    title: 'Buyer',
    question: 'Do you know who buys in this category?',
    answer:
      'Chief Strategy Officer at Fortune 500 / late-stage private co. Owns the strategic memo process, reports to CEO, signs the contract. Secondary: Head of M&A. PE/VC is NOT a target — budgets are small, relationship-driven.',
    failureMode: 'Vague audience = weak message. Know the buyer.',
    status: 'strong',
  },
  {
    id: 'problem',
    step: 3,
    title: 'Problem',
    question: 'What job is your brand helping with?',
    answer:
      "Catch cognitive bias + missing evidence in strategic memos and board decks BEFORE they reach the steering committee. The CSO's existential job is credibility with the CEO and board — we preserve it, quarter after quarter.",
    failureMode: 'Unclear value = weak demand. Solve something real.',
    status: 'strong',
  },
  {
    id: 'position',
    step: 4,
    title: 'Position',
    question: 'What do you want to be known for?',
    answer:
      'The Four Moments We Catch What Others Miss — (1) the Decision Knowledge Graph compounds every call, (2) we predict CEO/steering-committee questions before the meeting, (3) we audit the reasoning, (4) we close the outcome loop via DQI.',
    failureMode: 'If you mean everything, you mean nothing.',
    status: 'strong',
  },
  {
    id: 'assets',
    step: 5,
    title: 'Assets',
    question: 'Do you have distinctive brand cues?',
    answer:
      'Green accent + DQI A-F grade scale + Decision Knowledge Graph visual + bias web radial diagrams + pre-decision memo-with-red-flags layout on /proof. These are ownable and reused across app + LinkedIn posts + case studies.',
    failureMode: 'Forgettable look = forgettable brand. Build recognisable assets.',
    status: 'partial',
    nextAction:
      'Pick ONE signature visual (the bias radial web is strongest) and repeat it across every outreach touchpoint.',
  },
  {
    id: 'memory',
    step: 6,
    title: 'Memory',
    question: 'Will people remember you in buying moments?',
    answer:
      'Not yet — zero pilots means zero brand memory. The LinkedIn bias case studies (Kodak, Blockbuster, Nokia) are the memory-building engine because they seed the pattern "cognitive bias → failed strategic decision → we would have caught it."',
    failureMode: 'Not remembered = not chosen. Build memory, not noise.',
    status: 'gap',
    nextAction:
      'Ship one bias case study per week for 12 weeks straight. Consistency beats brilliance.',
  },
  {
    id: 'consistency',
    step: 7,
    title: 'Consistency',
    question: 'Are you repeating the same signals over time?',
    answer:
      'Founder Hub Content Studio + daily-linkedin cron is the machine. Every post must carry the same four signals: a famous failure → the bias that caused it → how we would have caught it → the DQI grade it would have scored.',
    failureMode: 'Random branding kills recall. Repeat what works.',
    status: 'partial',
    nextAction:
      'Lock the post format: [Company] failed because of [Bias]. DQI would have scored this a [Grade]. 135 other cases show the same pattern.',
  },
  {
    id: 'availability',
    step: 8,
    title: 'Availability',
    question: 'Is your brand easy to find and buy?',
    answer:
      'Self-serve Stripe checkout at $249/mo Individual, $2,499/mo Strategy. Landing + /proof + /bias-genome + /how-it-works are the organic funnel. Missing: direct CSO calendar booking on the landing page.',
    failureMode: 'Great branding fails if buying is hard.',
    status: 'partial',
    nextAction: 'Add a "Book a 20-min CSO demo" calendar link above the fold on the landing page.',
  },
];

// ─── Market Worth Entering (6 questions) ────────────────────────────────────

export interface MarketDimension {
  id: string;
  title: string;
  question: string;
  answer: string;
  subQuestions: Array<{ q: string; a: string }>;
  confidence: number; // 0-100
}

export const MARKET_DIMENSIONS: MarketDimension[] = [
  {
    id: 'shift',
    title: 'Market Shift',
    question: 'What is changing right now?',
    answer:
      'AI-native strategy ops is emerging the same way AI-native sales ops (Gong, Clari) did 2018-2022. CSOs now expect intelligence, not just slides.',
    subQuestions: [
      {
        q: 'What trend is rising?',
        a: 'Boards demanding structured post-mortems on failed strategic bets (Berkshire, JPM annual-letter references).',
      },
      {
        q: 'What old way is breaking?',
        a: 'The annual McKinsey engagement as the only source of strategic rigor. CSOs need continuous audit, not quarterly consultants.',
      },
      {
        q: 'Has customer behaviour changed?',
        a: 'Yes — CSOs now use ChatGPT/Claude ad-hoc for memo review. We offer the structured, auditable, cited version.',
      },
      {
        q: 'Is technology making it easier or cheaper?',
        a: 'Gemini-3-flash at ~£0.30/audit makes 60-second structured bias detection viable where it was $50K consulting.',
      },
      {
        q: 'Why does this matter now?',
        a: 'Post-ZIRP capital discipline. Every strategic bet is scrutinized. The cost of a bad memo is higher than ever.',
      },
    ],
    confidence: 80,
  },
  {
    id: 'pain',
    title: 'Pain',
    question: 'What problem is getting worse?',
    answer:
      'CSO average tenure has compressed to ~3 years. Careers end over one bad steering-committee recommendation. Boards are holding CSOs accountable for process, not just outcome.',
    subQuestions: [
      {
        q: 'What frustrates people today?',
        a: 'Spending 20+ hours on a memo and getting killed in 8 minutes of Q&A over a bias they never saw.',
      },
      {
        q: 'What takes too long?',
        a: 'Red-teaming a memo internally — asking peers to find flaws. Peers are conflict-averse and under-cite.',
      },
      {
        q: 'What costs too much?',
        a: 'Consulting firms charge £200K-£1M per engagement. Most CSOs can only afford 1-2 per year.',
      },
      {
        q: 'What feels broken or inefficient?',
        a: 'No artifact survives between strategic decisions. Every memo starts from zero. The Decision Knowledge Graph is the fix.',
      },
      {
        q: 'Is this pain frequent or rare?',
        a: 'Frequent — every board cycle (quarterly) produces 3-5 strategic memos per CSO.',
      },
    ],
    confidence: 85,
  },
  {
    id: 'customer',
    title: 'Customer Group',
    question: 'Who feels this pain the most?',
    answer:
      'CSO at a public or late-stage private company with a formal strategy function. Reports directly to CEO. Owns the board-meeting strategic-memo workflow. ~15,000 globally.',
    subQuestions: [
      {
        q: 'Who feels this pain most often?',
        a: 'CSOs with boards that hold formal steering-committee reviews every quarter.',
      },
      {
        q: 'What role / industry / lifestyle?',
        a: 'CSO, VP Strategy, Head of Corporate Development. Industries: tech, healthcare, financial services, energy, consumer.',
      },
      {
        q: 'Who is actively looking for help?',
        a: 'CSOs who survived a board grilling recently. Emotional freshness drives purchase intent.',
      },
      {
        q: 'Who has urgency?',
        a: 'CSOs with a major strategic bet in the next 90 days — M&A thesis, market entry, pricing shift, CAPEX >$100M.',
      },
      {
        q: 'Who has budget or influence?',
        a: 'CSOs with $50K-$500K discretionary line item. They can pilot without procurement gauntlets.',
      },
    ],
    confidence: 80,
  },
  {
    id: 'solutions',
    title: 'Existing Solutions',
    question: 'How are they solving it today?',
    answer:
      'Manual peer review (conflict-averse, under-cites), ad-hoc consulting (expensive, slow), or nothing. Cloverpop is workflow-adjacent but does not audit bias or predict board objections.',
    subQuestions: [
      {
        q: 'What are they using today?',
        a: 'Word docs, Google Slides, email peer review, occasional Bain/McKinsey engagements, and ChatGPT/Claude informally.',
      },
      {
        q: 'Are they using competitors, agencies, spreadsheets, or manual work?',
        a: 'Agencies + manual + spreadsheets. No true competitor in bias-auditing.',
      },
      {
        q: 'What do they dislike about those options?',
        a: 'Consulting = slow + expensive + exits with the consultant. Peer review = too polite. ChatGPT = no citations, no memory.',
      },
      {
        q: 'Where are current solutions weak?',
        a: 'Every existing option lacks: (1) persistence across decisions, (2) a DQI score, (3) predicted CEO questions.',
      },
      {
        q: 'What gap still exists?',
        a: 'No tool delivers a structured, auditable, cited bias review in 60 seconds with an artifact that compounds.',
      },
    ],
    confidence: 85,
  },
  {
    id: 'opportunity',
    title: 'Opportunity Size',
    question: 'Is this big enough to build around?',
    answer:
      '~15,000 target companies globally with a formal CSO function. At $30K average ACV (blending Individual + Strategy + Enterprise), 5% penetration = $22.5M ARR. Adjacent verticals (M&A, BizOps) expand TAM 3-5x.',
    subQuestions: [
      {
        q: 'How many people or businesses have this problem?',
        a: 'Global: ~15,000 formal CSO functions. US: ~6,000. Addressable in year 1: ~300 warm targets via advisor network.',
      },
      {
        q: 'Is the market growing?',
        a: 'Yes — CSO roles up ~14% YoY since 2022 per LinkedIn Economic Graph. AI-native strategy tooling is nascent.',
      },
      {
        q: 'Can you reach them?',
        a: 'Yes — LinkedIn + advisor intros + inbound from /proof + /bias-genome pages. No paid ads needed pre-seed.',
      },
      {
        q: 'Is solving this valuable enough?',
        a: 'Yes — a single prevented bad strategic decision > 10x annual subscription cost. ROI is obvious to the buyer.',
      },
      {
        q: 'Can this become repeat revenue?',
        a: 'Yes — quarterly board cycles create natural renewal cadence. Decision Knowledge Graph compounds switching cost.',
      },
    ],
    confidence: 70,
  },
  {
    id: 'thesis',
    title: 'Build Thesis',
    question: 'Only move forward if the market is real.',
    answer:
      'Thesis = YES. Clear shift (AI + capital discipline). Strong pain (tenure compression). Specific customer (CSO). Weak current solutions. Large enough market. All five criteria met. Proceed with pilot outreach now.',
    subQuestions: [
      {
        q: 'There is a clear shift',
        a: 'Yes — AI-native strategy ops is the next Gong/Clari cycle.',
      },
      { q: 'The pain is strong', a: 'Yes — CSO tenure compression + post-ZIRP scrutiny.' },
      { q: 'A specific customer feels it deeply', a: 'Yes — CSO at pre-board-meeting moment.' },
      {
        q: 'Current solutions are weak',
        a: 'Yes — none deliver 60-sec structured audit with memory.',
      },
      { q: 'The market is large enough', a: 'Yes — $22.5M+ ARR at 5% penetration of primary TAM.' },
    ],
    confidence: 80,
  },
];

// ─── Strategic Thinking Compass (8 directions) ─────────────────────────────

export interface CompassDirection {
  id: string;
  angle: number; // degrees on the compass (0 = North, 45 = NE, ...)
  title: string;
  tagline: string;
  principles: string[];
  appliedToDecisionIntel: string;
}

export const COMPASS_DIRECTIONS: CompassDirection[] = [
  {
    id: 'vision',
    angle: 0,
    title: 'Vision',
    tagline: 'Think 10 years ahead',
    principles: [
      'Goals beyond timelines',
      'What will change the game?',
      'Invest in the future',
      'Build bridges between steps',
    ],
    appliedToDecisionIntel:
      'In 10 years every C-suite decision artifact flows through a decision intelligence layer the way every sales call flows through Gong today. Decision Intel is that layer for strategy.',
  },
  {
    id: 'problem_solving',
    angle: 45,
    title: 'Problem Solving',
    tagline: 'Strike at the root',
    principles: [
      'Fix causes, not symptoms',
      "What's the core problem?",
      'Breakthrough solutions, not quick fixes',
      'Test: "If we had one shot..."',
    ],
    appliedToDecisionIntel:
      'Root cause is not "CSOs need better memos" — it\'s "CSOs have no compounding artifact across decisions." The Decision Knowledge Graph fixes the root. Everything else is symptom management.',
  },
  {
    id: 'synthesis',
    angle: 90,
    title: 'Synthesis',
    tagline: 'Connect the dots',
    principles: [
      'Find patterns in chaos',
      'What links these points?',
      'Patterns > raw data',
      'Insight maps → action',
    ],
    appliedToDecisionIntel:
      'Case studies + bias taxonomy + CEO question prediction + DQI all compose into "The Four Moments." One narrative, four proof points, same demo every time.',
  },
  {
    id: 'decisiveness',
    angle: 135,
    title: 'Decisiveness',
    tagline: 'Decide without 100% info',
    principles: [
      "Act, don't wait",
      'Reversible? → Experiment',
      'Irreversible? → Analyze + deadline',
      'Mistakes → lessons, not disasters',
    ],
    appliedToDecisionIntel:
      'Most product bets are reversible (ship it, ship the next thing). Pricing language and positioning vocabulary are less reversible — lock those in CLAUDE.md and do not drift.',
  },
  {
    id: 'adaptability',
    angle: 180,
    title: 'Adaptability',
    tagline: 'Plan B, C, D...',
    principles: [
      'Prepare for black swans',
      '"What if everything changes tomorrow?"',
      'Build safety cushions',
      'Pivot fast, fail small',
    ],
    appliedToDecisionIntel:
      'Plan A: CSO top-down at Fortune 500. Plan B: M&A teams bottom-up (smaller ACV, faster to close). Plan C: Corp-dev at PE portfolio companies. All three live in the Founder School curriculum already.',
  },
  {
    id: 'storytelling',
    angle: 225,
    title: 'Storytelling',
    tagline: 'Data + emotions → inspire',
    principles: [
      'Structure: Pain → Solution → Path',
      'Metaphors over jargon',
      'Focus on benefits: "What\'s in it?"',
    ],
    appliedToDecisionIntel:
      "The Kodak/Blockbuster/Nokia case-study pattern IS the story. Famous failure → bias we would have caught → would you rather be the next case, or the first customer who wasn't?",
  },
  {
    id: 'focus',
    angle: 270,
    title: 'Focus',
    tagline: '5% effort → 95% result',
    principles: [
      "Multiply, don't add",
      "Where's your leverage?",
      'Automate routines',
      'Ruthless "no" to distractions',
    ],
    appliedToDecisionIntel:
      'The 5% that drives 95%: upload → analyze → review demo flow. Polishing that single 60-second path > any new feature. Every other tab in the Founder Hub is a distraction if the demo flow drops a frame.',
  },
  {
    id: 'analysis',
    angle: 315,
    title: 'Analysis',
    tagline: 'Look for the non-obvious',
    principles: [
      'Every decision triggers a chain of events',
      'What breaks if we succeed?',
      'Think 10 steps ahead',
      'Map hidden risks',
    ],
    appliedToDecisionIntel:
      'Non-obvious: the real competitor is "do nothing." The real objection is not price, it\'s "my peers will think I\'m admitting I miss biases." Outreach must address the ego, not the spec.',
  },
];

// ─── Pitch Deck (16 slides) ────────────────────────────────────────────────

export interface PitchSlide {
  index: number;
  title: string;
  purpose: string;
  decisionIntelAnswer: string;
  kind: 'hook' | 'setup' | 'proof' | 'business' | 'close';
}

export const PITCH_SLIDES: PitchSlide[] = [
  {
    index: 1,
    title: 'Hook',
    purpose: 'Grab attention fast — first 30 seconds',
    decisionIntelAnswer:
      'Kodak invented the digital camera in 1975 and buried it. That single meeting cost them $31B. We would have caught it.',
    kind: 'hook',
  },
  {
    index: 2,
    title: 'Insight',
    purpose: 'Share a fresh perspective',
    decisionIntelAnswer:
      "Strategic failure is not a data problem. It's a bias problem. 30+ cognitive biases, well-studied since Kahneman, have never been operationalized at the C-suite. We did it in 60 seconds per memo.",
    kind: 'hook',
  },
  {
    index: 3,
    title: 'Problem',
    purpose: 'Define the pain clearly — costly, frequent, urgent',
    decisionIntelAnswer:
      'CSO average tenure is 3 years. Careers end over one bad board recommendation. There is no tool that audits reasoning quality before it reaches the steering committee.',
    kind: 'setup',
  },
  {
    index: 4,
    title: 'Timing',
    purpose: 'Why this opportunity exists right now',
    decisionIntelAnswer:
      'Gemini-3-flash pricing ($0.30/audit) + post-ZIRP capital discipline + AI-native strategy-ops emergence. This window did not exist 24 months ago and closes in 18.',
    kind: 'setup',
  },
  {
    index: 5,
    title: 'Solution',
    purpose: 'Keep it simple — one clear solution',
    decisionIntelAnswer:
      'Upload memo → 60-second audit → DQI grade + top biases + predicted CEO questions + board-ready PDF. Every audit added to the Decision Knowledge Graph.',
    kind: 'setup',
  },
  {
    index: 6,
    title: 'Proof',
    purpose: 'Show real usage — evidence matters more than features',
    decisionIntelAnswer:
      'Pre-pilot: 135 historical decisions audited retrospectively. Kodak, Blockbuster, Nokia, Enron, Theranos — every failure has a traceable bias. /proof page shows the flagged evidence before the outcome reveal.',
    kind: 'proof',
  },
  {
    index: 7,
    title: 'Market',
    purpose: 'Show opportunity size — big enough to scale',
    decisionIntelAnswer:
      '~15,000 formal CSO functions globally. ACV $3K-$30K blended. 5% penetration = $22.5M+ ARR. Expansion into M&A + BizOps adds 3-5x TAM.',
    kind: 'proof',
  },
  {
    index: 8,
    title: 'Conviction',
    purpose: 'Why you will win — hard to replicate edge',
    decisionIntelAnswer:
      '3-year compounding head-start on: (1) bias taxonomy library, (2) case-study corpus, (3) CEO-question prediction corpus. Every audit makes the next one better. GPT wrappers cannot catch up.',
    kind: 'proof',
  },
  {
    index: 9,
    title: 'Advantage',
    purpose: 'Your unique strength',
    decisionIntelAnswer:
      'The Decision Knowledge Graph. No competitor has one. Every other tool resets at zero per call. We compound.',
    kind: 'proof',
  },
  {
    index: 10,
    title: 'Traction',
    purpose: 'Signals that matter — numbers build trust',
    decisionIntelAnswer:
      'Pre-revenue. Advisor from Wiz $0→$32B. 200+ components shipped. /proof, /bias-genome, /how-it-works live. Active pilot outreach to 15 CSOs via advisor network.',
    kind: 'proof',
  },
  {
    index: 11,
    title: 'Team',
    purpose: 'Why you — investors bet on people',
    decisionIntelAnswer:
      'Solo technical founder, 16 years old, shipped 200+ components + 70+ API routes + 12-node LangGraph pipeline. Advised by a senior who took Wiz to $32B. Seeking GTM co-founder.',
    kind: 'proof',
  },
  {
    index: 12,
    title: 'Business Model',
    purpose: 'How you make money',
    decisionIntelAnswer:
      'Tiered SaaS. Free (4 audits/mo) → Individual $249/mo (15 audits) → Strategy $2,499/mo (fair-use 250 audits/mo + team) → Enterprise custom (volume floor + overage). Blended gross margin: ~90% across tiers (~95% Individual typical, 85-88% heavy Strategy team). Elite for enterprise SaaS without overclaiming.',
    kind: 'business',
  },
  {
    index: 13,
    title: 'Competition',
    purpose: 'Know the landscape — clearly position your edge',
    decisionIntelAnswer:
      'Direct: none. Adjacent: Cloverpop (decision workflow, not bias audit), McKinsey/Bain (consulting, not software), ChatGPT (no structure, no memory). Real competitor: "do nothing" — teams don\'t audit decisions at all.',
    kind: 'business',
  },
  {
    index: 14,
    title: 'Unit Economics',
    purpose: 'Show sustainability — direction matters more than perfection',
    decisionIntelAnswer:
      'LLM COGS: ~£6/mo at 15 audits/user on Gemini paid tier 1. Individual ACV: $2,988/yr. Gross margin >95%. CAC target: <$500 via organic content + advisor intros.',
    kind: 'business',
  },
  {
    index: 15,
    title: 'Ask / Use of Funds',
    purpose: 'Clearly state how much and why',
    decisionIntelAnswer:
      'Raising $750K-$1.5M pre-seed. 60% GTM (co-founder + 3 pilot-to-paid sprints). 25% product (enterprise SSO + team features). 15% runway extension to 18 months.',
    kind: 'close',
  },
  {
    index: 16,
    title: 'Next Step',
    purpose: 'Close strong — define the next action',
    decisionIntelAnswer:
      "Two paths: (1) audit one of your portfolio CSOs' real board memos live on a 30-minute call, or (2) introduce me to one CSO who lost sleep over a board presentation this quarter.",
    kind: 'close',
  },
];

// ─── Positioning Knowledge Graph ───────────────────────────────────────────

export type GraphNodeKind =
  | 'core'
  | 'category'
  | 'buyer'
  | 'problem'
  | 'capability'
  | 'proof'
  | 'pitch'
  | 'channel';

export interface PositioningNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  detail: string;
}

export interface PositioningEdge {
  from: string;
  to: string;
  label?: string;
}

export const POSITIONING_NODES: PositioningNode[] = [
  {
    id: 'core',
    label: 'Decision Intel',
    kind: 'core',
    detail: 'The decision intelligence platform for corporate strategy teams.',
  },
  {
    id: 'category',
    label: 'Category',
    kind: 'category',
    detail:
      'Decision intelligence — a new category we are seeding. Adjacent to decision management, orthogonal to BI and consulting.',
  },
  {
    id: 'cso',
    label: 'CSO',
    kind: 'buyer',
    detail:
      'Primary buyer. Signs the contract. Cares about board credibility quarter after quarter.',
  },
  {
    id: 'mna',
    label: 'M&A Head',
    kind: 'buyer',
    detail: 'Secondary buyer. Uses the product for deal-thesis red-teaming.',
  },
  {
    id: 'bias',
    label: 'Memo Bias',
    kind: 'problem',
    detail:
      'Cognitive bias in strategic memos — confirmation, anchoring, sunk cost, etc. 30+ biases taxonomy. Uncaught in most peer review.',
  },
  {
    id: 'tenure',
    label: 'Short Tenure',
    kind: 'problem',
    detail: 'CSO tenure compressed to ~3 years. One bad memo ends careers.',
  },
  {
    id: 'audit',
    label: '60s Audit',
    kind: 'capability',
    detail:
      'Upload → 12-node pipeline → DQI grade + biases + predicted questions. The core demo flow.',
  },
  {
    id: 'dkg',
    label: 'Knowledge Graph',
    kind: 'capability',
    detail:
      'The Decision Knowledge Graph. Every audit persists. Compounds quarter over quarter. The real moat.',
  },
  {
    id: 'predict',
    label: 'CEO Qs',
    kind: 'capability',
    detail: 'CEO question prediction. Pre-empts the board grilling. 5 role-primed personas.',
  },
  {
    id: 'dqi',
    label: 'DQI Grade',
    kind: 'capability',
    detail: 'DQI A-F grade scale. 85+ A, 70+ B, 55+ C, 40+ D. Buyer-legible in one glance.',
  },
  {
    id: 'cases',
    label: '135 Cases',
    kind: 'proof',
    detail:
      'Historical case library. Kodak, Blockbuster, Nokia, Theranos, Enron. Every failure traceable to a bias.',
  },
  {
    id: 'taxonomy',
    label: 'Bias Taxonomy',
    kind: 'proof',
    detail: '30+ biases with stable IDs DI-B-001–020 live. Published at /taxonomy.',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    kind: 'proof',
    detail: '12-node LangGraph sequential+parallel pipeline. Technical defensibility.',
  },
  {
    id: 'four_moments',
    label: 'Four Moments',
    kind: 'pitch',
    detail: 'Graph + Predict + Audit + Outcome loop. The locked positioning narrative.',
  },
  {
    id: 'kodak_hook',
    label: 'Kodak Hook',
    kind: 'pitch',
    detail: 'Opening line: "$31B mistake. We would have caught it."',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    kind: 'channel',
    detail: 'LinkedIn content engine. Daily bias case studies. Brand memory engine.',
  },
  {
    id: 'advisor',
    label: 'Advisors',
    kind: 'channel',
    detail: 'Advisor network. Warm intros via Wiz advisor. Highest-conversion channel.',
  },
  {
    id: 'proof_page',
    label: '/proof',
    kind: 'channel',
    detail: '/proof marketing page. Live proof of bias detection on real historical memos.',
  },
];

export const POSITIONING_EDGES: PositioningEdge[] = [
  { from: 'core', to: 'category' },
  { from: 'core', to: 'cso', label: 'primary buyer' },
  { from: 'core', to: 'mna', label: 'secondary' },
  { from: 'cso', to: 'bias' },
  { from: 'cso', to: 'tenure' },
  { from: 'mna', to: 'bias' },
  { from: 'bias', to: 'audit' },
  { from: 'tenure', to: 'audit' },
  { from: 'audit', to: 'dqi' },
  { from: 'audit', to: 'predict' },
  { from: 'audit', to: 'dkg' },
  { from: 'dkg', to: 'cases' },
  { from: 'audit', to: 'taxonomy' },
  { from: 'audit', to: 'pipeline' },
  { from: 'core', to: 'four_moments', label: 'how we pitch' },
  { from: 'four_moments', to: 'dkg' },
  { from: 'four_moments', to: 'predict' },
  { from: 'four_moments', to: 'audit' },
  { from: 'four_moments', to: 'dqi' },
  { from: 'four_moments', to: 'kodak_hook' },
  { from: 'kodak_hook', to: 'cases' },
  { from: 'cso', to: 'advisor', label: 'warmest path' },
  { from: 'cso', to: 'linkedin' },
  { from: 'cso', to: 'proof_page' },
];

// ─── Boil-the-ocean standard (applied to outreach) ──────────────────────────

export const BOIL_THE_OCEAN_STANDARD = {
  principle:
    'The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right.',
  appliedToOutreach: [
    'Never send a cold email without a specific company failure pattern referenced — "I watched your Q3 earnings call segment on the XYZ pivot. The pre-decision memo for that bet probably had 3 biases we would have flagged. Want to see?"',
    'Never offer to "circle back" when the permanent follow-up is within reach.',
    'Never present a workaround demo when the real audit is ready.',
    'The standard is not "they replied." The standard is "holy shit, that\'s exactly the blind spot."',
  ],
};

// ─── One-line daily rehearsal prompts ──────────────────────────────────────

export const REHEARSAL_PROMPTS: string[] = [
  '1-line category: "Decision intelligence for corporate strategy — catches bias before the steering committee does."',
  '1-line buyer: "Chief Strategy Officer at a Fortune 500 or late-stage private. Signs the contract. Cares about board credibility quarter after quarter."',
  '1-line problem: "CSO average tenure is 3 years. Careers end over one bad board recommendation. No tool audits reasoning before the meeting."',
  '1-line proof: "135 historical decisions audited retrospectively. Every failure traceable to a named bias. /proof shows it live."',
  '1-line moat: "The Decision Knowledge Graph compounds every call. GPT wrappers reset at zero."',
  '1-line ask: "Audit one real memo on a 30-minute call, or one warm intro to a CSO who lost sleep this quarter."',
];
