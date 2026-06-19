/**
 * Antler · Magnus Grimeland meeting brief — SSOT.
 *
 * Founder-hub-internal (admin-gated). Names Magnus / Antler internally, like
 * the LRQA + Cornerstone briefs; the VISIBLE tab label stays role-neutral
 * ("Day-Zero VC · Inbound") per the CLAUDE.md no-named-prospects rule.
 *
 * Context (2026-06-19): Magnus Grimeland, Founder & CEO of Antler, cold-
 * inbounded Decision Intel personally (magnus@grimeland.com), cc'ing his
 * investment team, Google Meet next week. CEO-level personal outreach to a
 * pre-revenue solo founder is an outlier signal. Grounded in: the founder's
 * Antler podcast synthesis (Further, Faster), public Antler terms research,
 * and the project-antler-magnus-inbound memory.
 */

export interface KeyVal {
  k: string;
  v: string;
}
export interface Trait {
  trait: string;
  theyWant: string;
  youShow: string;
}

export const ANTLER_BRIEF = {
  setup: {
    headline: 'The CEO of Antler hunted you down. Treat it as signal, not a finish line.',
    points: [
      'Magnus Grimeland (Founder & CEO, Antler) emailed you personally and cc’d his investment team. At Antler that work almost always starts with a scout or associate — a personal CEO inbound is an outlier.',
      'He named the problem unprompted ("data-driven decision-making is one of the most critical challenges for businesses right now"). He gets it.',
      'It maps onto your secondary, network-first pre-seed track: the value is the global platform + portfolio relationships, not the cheque.',
    ],
  },

  // Who you're meeting — Magnus's DNA. Diverse-experience + resilience is his
  // explicit founder philosophy; mirror it, you have your own version.
  magnus: [
    {
      k: 'Origin',
      v: 'Grew up on a farm in Norway → United World College → Norwegian Navy Special Operations (SEALs) → Harvard → McKinsey (6 years, Junior Partner, Telco/Media/High-Tech across NA, Europe, Asia).',
    },
    {
      k: 'Operator',
      v: 'Co-founded Zalora and became COO of Global Fashion Group — rolled out the marketplace across 26 countries. He has actually built and scaled, not just invested.',
    },
    {
      k: 'Antler',
      v: 'Founded 2017 in Singapore. Global "day-zero" VC across 30+ locations / 6 continents, 1,400+ portfolio companies, $510M+ AUM. He calls Antler "roughly 1% of the way" to its potential — he thinks in decades.',
    },
    {
      k: 'Philosophy',
      v: 'Believes diverse life experience + resilience is the foundation of great founders. He looks for resilience because he lived it. Your 16-y-o-Lagos-to-SF arc is exactly the kind of story he is wired to respond to.',
    },
  ] as KeyVal[],

  // What Antler actually offers — know it cold before the call.
  antler: [
    {
      k: 'Day-zero investing',
      v: 'They fund "the institutional friends-and-family round" — before revenue metrics matter, on raw talent, psychology, and execution. That is exactly your stage.',
    },
    {
      k: 'ARC',
      v: 'Agreement for Rolling Capital: Antler matches ~50% of what you raise from other investors (up to a cap) in your early stages — de-risks outside investors and buys you speed. A real instrument, ask how it works.',
    },
    {
      k: 'Elevate',
      v: 'Their Series A–C follow-on fund. Antler can keep backing you through the whole journey, not just write one cheque. "Full-stack capital" is their pitch.',
    },
    {
      k: 'The flywheel',
      v: 'Great founders → great companies → great returns → reinvested into the platform → even better future founders. You are being evaluated as fuel for that flywheel.',
    },
  ] as KeyVal[],

  terms: {
    headline: 'The number to walk in knowing (and not anchor to)',
    body: 'Antler’s STANDARD pre-seed is roughly $100–150K for ~10–12% equity (residency-style), implying a ~$1–1.25M valuation — below even your own pre-seed cap. That is their program default. You are NOT an applicant: they cold-reached you, with a built, shipping product. Hold your valuation; treat their number as a floor to negotiate up from. (Public figure, possibly stale — confirm the structure on the call, Q1.)',
  },

  // What they look for in founders (Magnus + Jeff Becker, Antler GP NY).
  // Frame: the trait → how you already embody it. These ARE your talking points.
  founderTraits: [
    {
      trait: 'A "spike"',
      theyWant: 'A distinct, exceptional strength.',
      youShow:
        'You shipped an enterprise-grade reasoning-audit platform end-to-end, solo, at 16. The spike is undeniable.',
    },
    {
      trait: 'Grit + drive',
      theyWant: 'Staying power through pain; self-reliance; a high bar.',
      youShow:
        'A published 2008-crisis paper, a financial-literacy initiative, and a 200-component platform — all before leaving school.',
    },
    {
      trait: 'Momentum',
      theyWant:
        '"Breathing life into the business"; "action creates information" — building, not planning.',
      youShow:
        'Lead with what shipped THIS week + the live beta tester. Show motion, not a roadmap.',
    },
    {
      trait: 'Validation by selling',
      theyWant: 'Sell the thing before heavy build; real pull.',
      youShow:
        'A fund founder is design-partnering on her own deals, and Antler’s CEO inbounded — that IS pull.',
    },
    {
      trait: 'Concise communication',
      theyWant: 'Fast, articulate, low-noise.',
      youShow:
        'Run the 60-second audit live and let the artefact talk. Answer in headlines, then detail.',
    },
  ] as Trait[],

  playbook: {
    goal: 'Qualify each other. NOT to close. Value-show + listen (the Sankore first-meeting rule).',
    dos: [
      'Show the product, don’t tell the vision. Offer a live 60-second audit or screen-share the WeWork DPR specimen — your unfair edge over a typical day-zero founder with only a deck.',
      'Lead with traction + momentum: the wedge, the beta tester, the moat, the global story.',
      'Mirror his language: "day zero", "spike", "momentum", "scale globally", "full-stack capital".',
      'Ask, then let them pitch you.',
    ],
    donts: [
      'Don’t send the deck. Your cap is misaligned ($1.5M post / ~13% on the deck vs ~10% verbal) and you don’t negotiate before you understand their offer.',
      'Don’t commit to terms or a timeline. "This is exciting — I want to keep building the wedge and continue the conversation" is a complete answer.',
      'Don’t pitch the $249 individual tier or oversell the $100M arc.',
      'Don’t reflexively accept program terms — you have leverage.',
    ],
  },

  questions: [
    'Is this a direct investment or your residency program — and what does the structure look like for a company that’s already built and shipping?',
    'When you say "scale globally" — concretely, can you make warm intros to CSOs and corp-dev heads in your portfolio and network? (pressure-test: real vs performative)',
    'How does follow-on work — how does Antler Elevate / ARC come in?',
    'What made you reach out personally? (intel on what’s driving your inbound + it’s disarming)',
    'If we worked together, what would you want to see from me over the next 6–12 months?',
  ],

  proofPoints: [
    'A fund founder is already design-partnering Decision Intel on her own deals — a real beta user, not a hypothesis.',
    'The wedge motion + the four HXC personas; the 22-bias R²F moat + the 19-framework regulatory map + the 143-case corpus.',
    'The global story: Lagos → UK → SF. This IS Antler’s thesis (innovation is global; back exceptional founders everywhere).',
    'Being 16 is evidence, not a weakness — the generational-norm shift Antler invests in. Frame it as the proof of "why now".',
  ],

  whyNow: {
    headline: 'His "why now" is your "why now" — say it back to him',
    body: 'Magnus argues now is the best time to build: global reach in days, multiple disruptive technologies maturing at once (AI first), collapsing launch costs, shrinking corporate lifespans, and an urgent need to solve real problems. Decision Intel sits dead-centre: an AI-native reasoning-audit layer arriving exactly as the EU AI Act and the agentic shift make auditable decision-making compulsory. You are not adjacent to his thesis; you are an instance of it.',
  },

  asks: [
    {
      tier: 'Tier 1',
      ask: 'Understand Antler’s investment / program fit for an already-built company — structure and terms, from a position of strength.',
    },
    {
      tier: 'Tier 2',
      ask: 'Warm intros to 3–5 portfolio CSOs / corp-dev heads who’d give a 20-minute audit on a real memo. This is the network-access prize — worth more than the cheque.',
    },
    {
      tier: 'Tier 3',
      ask: 'A light advisor relationship with Magnus or the New York / Asia partners as the seed story matures.',
    },
  ] as { tier: string; ask: string }[],

  guardrails: [
    'Customers-before-investors still governs the SEED (the Mr. Gabe rule): it locks after 5+ paid Individuals + a design-partner pilot. This meeting is fuel + optionality, not a reason to pause the DM motion.',
    'Walk away if terms stay program-default for your stage, if the network turns out performative, or if board / governance overhead would slow the wedge.',
    'He cc’d his team — expect the process to route to an associate (Jussi Salovaara, Vegard Medbø, Rajiv Srivatsa, Lavanya Indralingam) after the intro. Keep Magnus warm; prep for diligence to move to the team.',
  ],

  logistics: {
    who: 'Magnus Grimeland — magnus@grimeland.com',
    format: 'Google Meet, next week (you organised it via Calendly).',
    cc: 'Jussi Salovaara (Managing Partner, Asia) · Vegard Medbø (Co-founder & COO) · Rajiv Srivatsa (Founding Partner, India) · Lavanya Indralingam (Partner). These are likely your diligence contacts after the intro.',
    practical:
      'Camera on, light in front of you, demo + DPR specimen ready to screen-share, your 60-second + wedge narrative rehearsed (drill the pre-seed VC persona in the Sparring Room first).',
  },
} as const;
