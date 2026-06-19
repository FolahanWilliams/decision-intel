/**
 * Antler — research + approach brief (SSOT).
 *
 * Founder-hub-internal (admin-gated). Antler is a real, public firm (named
 * throughout CLAUDE.md), so naming it here is fine; the VISIBLE tab label
 * stays role-neutral per the no-named-prospects discipline.
 *
 * CONTEXT (corrected 2026-06-19 evening): the June-2026 "Magnus Grimeland /
 * Antler CEO" email was an IMPERSONATION (dead mailbox magnus@grimeland.com +
 * wrong-owner domain + implausible behaviour — see the
 * project-antler-magnus-inbound memory). The fake July-2 meeting is cancelled.
 * BUT a real warm path opened: the founder told a VC the whole story at a
 * networking event, was brutally honest, and that VC offered to introduce him
 * to Antler's London partners. THIS BRIEF is now the legitimate-firm prep for
 * pursuing the real Antler via that intro — pursued AFTER customers-before-
 * investors fires, not before. Real Antler = antler.co / verify any contact.
 *
 * Grounded in: public Antler material, Magnus's public bio, and the locked
 * funding dual-track (the pre-seed is a network-access play, not a big cheque).
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
    headline:
      'The CEO "inbound" was a scam. The real Antler is still worth it, and now you have a warm path in.',
    points: [
      'The June-2026 "Magnus Grimeland" email was an impersonation: magnus@grimeland.com bounced RecipientNotFound from its own server, the domain belongs to a different Norwegian (Kjell Grimeland / Volvere AS), and the behaviour was implausible (CC-ing an "investment team," inventing "your team at Decision Intel" when you are solo). Cancel the July-2 slot, do not reply, share no IP. Full forensics in the project-antler-magnus-inbound memory.',
      'The bright side is real and earned: you told a VC the whole story in person, were brutally honest, and he offered to introduce you to Antler’s London partners. That is the legitimate version of what the scam faked, and it came from your honesty, not from a forged email.',
      'So this brief is about pursuing the REAL Antler properly: who they are, what they back, how to walk in, and a stage-appropriate ask. The story to tell is "I felt the pull of a slick impersonation AND I caught it by running the one decisive test" — founder judgment + your own product thesis, lived. Never frame the scam as proof your startup is valuable; a sharp VC discounts that.',
    ],
  },

  // Top-of-house thesis still matters even if you meet the London partners.
  // Diverse-experience + resilience is Magnus's explicit founder philosophy.
  magnus: [
    {
      k: 'Origin',
      v: 'United World College (scholarship) → Harvard → McKinsey (6 years, last role Junior Partner; telecom/media/high-tech across NA, Europe, Asia) → Norwegian Naval Special Forces.',
    },
    {
      k: 'Operator',
      v: 'Co-founded Zalora (Asia’s largest fashion e-commerce, built from Singapore, 2013) → COO/MD of Global Fashion Group across 26 countries. He has actually built and scaled, not just invested.',
    },
    {
      k: 'Antler',
      v: 'Founded 2017. Global "day-zero" VC across 30+ locations; one of the most active early-stage investors; 1,000+ companies launched. Jan 2026: closed $510M in new global funds, ~half earmarked for US founders, with a new San Francisco residency. (Portfolio/AUM figures vary by source — verify before quoting.)',
    },
    {
      k: 'Philosophy',
      v: 'Backs exceptional founders at day zero and helps them build the company. Public line (Fortune, May 2026): "Silicon Valley doesn’t have a monopoly on tech — people can innovate from almost anywhere." Your Lagos→UK→SF arc is exactly the founder he is wired to respond to.',
    },
  ] as KeyVal[],

  // What Antler actually offers — know it cold.
  antler: [
    {
      k: 'Day-zero investing',
      v: 'Funds "the institutional friends-and-family round" before revenue metrics matter — on raw talent, psychology, and execution. Backing a solo founder and helping build the team IS the model, not a risk they tolerate.',
    },
    {
      k: 'What the IC evaluates',
      v: 'Not primarily WHAT you’re building — WHETHER you’re the kind of person who builds something that matters at global scale. The four traits: relentless execution, creative problem-solving, grit, communication. You win on founder; the live product is your evidence.',
    },
    {
      k: 'Follow-on (Elevate / ARC)',
      v: 'Antler can keep backing through the journey, not just one cheque. ARC matches a share of what you raise from other investors early; Elevate is the Series A–C follow-on. "Full-stack capital" is the pitch — ask how it actually works.',
    },
    {
      k: 'The flywheel',
      v: 'Great founders → great companies → returns → reinvested into the platform → better future founders. You’re evaluated as fuel for that flywheel.',
    },
  ] as KeyVal[],

  terms: {
    headline: 'What Antler’s money looks like (research — not a live negotiation)',
    body: 'Standard day-zero check ~$100–200K for ~10–12% (total commitment can run $200–500K by geography). UK cohort shape has historically been ~£210k at inception (≈£125k for 8.5% + ≈£85k convertible) plus up to ~£330k pre-committed for the next round (≈£500k total). TREAT AS INFERRED + STALE: confirm current 2026 terms before any real conversation, and note a founder arriving with a LIVE, in-market product may be structured differently from an idea-stage cohort. Use this to set expectations, not to walk in demanding a number.',
  },

  // What they look for → how you already embody it. These ARE your talking points.
  founderTraits: [
    {
      trait: 'A "spike"',
      theyWant: 'A distinct, exceptional strength.',
      youShow:
        'You shipped an enterprise-grade reasoning-audit platform end-to-end, solo, at 16. The spike is undeniable — and live.',
    },
    {
      trait: 'Relentless execution',
      theyWant: '"Action creates information"; building, not planning; staying power through pain.',
      youShow:
        'A live platform built solo in ~14 months around a full school schedule — the 12-node pipeline, 19 regulatory frameworks, the case library. Lead with what shipped THIS week.',
    },
    {
      trait: 'Validation by selling',
      theyWant: 'Real pull before heavy build.',
      youShow:
        'A fund founder is design-partnering Decision Intel on her own deals — a real beta user, not a hypothesis. And you caught a sophisticated impersonation aimed at you (judgment, not just code).',
    },
    {
      trait: 'Concise communication',
      theyWant: 'Fast, articulate, low-noise.',
      youShow:
        'Run the 60-second audit live and let the artefact talk. Answer in headlines, then detail.',
    },
  ] as Trait[],

  playbook: {
    goal: 'If the London-partner intro lands: qualify each other, value-show + listen (the Sankore first-meeting rule). NOT to close. They buy the founder; the live product is your evidence, not your pitch.',
    dos: [
      'Lead with the founder-and-problem story and a LIVE audit on a real case (WeWork S-1 or Dangote DPR) — your unfair edge over a cohort founder pitching a Figma mock.',
      'Lead the story with Lagos→UK→SF — his explicit public thesis AND his lived experience. The 19-framework Pan-African/cross-border moat embodies "innovate from anywhere."',
      'Be direct that today the team is you — to Antler that’s the profile they back, not a liability. "Most founders come with a deck; I’m coming with a live product."',
      'Mirror his language: "day zero," "spike," "momentum," "scale globally," "full-stack capital." He’s ex-McKinsey Junior Partner — he sat in the rooms where memos get debated and bias goes uncaught. Connect on that ("you’ve lived this"), never dunk on consulting.',
    ],
    donts: [
      'Don’t lead with the category claim, the DPR, or the number — lead founder + problem + live product.',
      'Don’t conflate the scam with the real firm, and don’t oversell the scam as "validation." The strong story is you caught it.',
      'Don’t let the warm intro override customers-before-investors — the SEED still locks only after 5+ paid Individuals + a design-partner pilot. This is optionality, not a reason to pause the wedge.',
      'Don’t share the deck or any IP with anyone claiming to be Antler until the contact verifies via @antler.co / his real LinkedIn. The scam taught you the channel-check; run it every time.',
    ],
  },

  questions: [
    'How does Antler structure the investment for a founder coming in with a LIVE product rather than at idea stage — does that change the terms or the path?',
    'Your new SF residency + US fund — how would you see Decision Intel using the US platform, given my ceiling buyer is Fortune 500 corp dev?',
    'Which parts of your portfolio/network would you connect me to first — corp-dev leaders, CSOs, regulated-industry operators? (pressure-test: real warm intros vs performative)',
    'What does the 6–12 months after a check look like — support model, and the milestones you’d want before the next round?',
    'Given my Pan-African regulatory moat, does Antler have reach into African / EM corporate or fund networks I could leverage?',
  ],

  proofPoints: [
    'A fund founder is already design-partnering Decision Intel on her own deals — a real beta user, not a hypothesis.',
    'Lagos → UK → SF + the 19-framework Pan-African / cross-border regulatory moat = Antler’s "innovate from anywhere" thesis embodied, not adjacent to it.',
    'Being 16 is evidence, not a weakness — the generational-norm shift Antler invests in. A live platform built solo in 14 months around school is the "why now / why you."',
    'The cognitive-science depth is real: published 2008-crisis bias research + teaching financial/psychological decision-making to younger students. The thesis behind the product is lived, not borrowed.',
  ],

  whyNow: {
    headline: 'His "why now" is your "why now" — say it back to him',
    body: 'Magnus argues now is the best time to build: global reach in days, multiple disruptive technologies maturing at once (AI first), collapsing launch costs, shrinking corporate lifespans, an urgent need to solve real problems. Decision Intel sits dead-centre: an AI-native reasoning-audit layer arriving exactly as the EU AI Act (enforcement Aug 2026) and the agentic shift make auditable decision-making compulsory. You are not adjacent to his thesis; you are an instance of it.',
  },

  asks: [
    {
      tier: 'Tier 1 — land the conversation',
      ask: 'Via your networking-event VC’s intro to Antler’s London partners. Send him a warm thank-you, confirm the intro, and offer to share a sample audit (WeWork S-1 / Dangote DPR) so the partners see it’s real BEFORE any call. The artefact does the persuasion.',
    },
    {
      tier: 'Tier 2 — understand the fit',
      ask: 'In the conversation: how Antler treats a founder arriving with a LIVE product, what the path/terms look like, and whether the "global network" is real CSO/corp-dev intros or performative. You’re evaluating them too.',
    },
    {
      tier: 'Tier 3 — the ask, IF it advances and customers-before-investors has fired',
      ask: 'The dual-track pre-seed: ~$200K / ~10% where the NETWORK is the point, not the capital (it compresses time-to-first-customer + time-to-design-partner). Let the live product justify being priced for what’s built. Do NOT walk in demanding the inflated "£400k at inception" figure the scam-era brief floated — there is no live IC, and the locked plan is the network-access cheque.',
    },
  ] as { tier: string; ask: string }[],

  guardrails: [
    'Customers-before-investors governs the SEED (Mr. Gabe rule): it locks only after 5+ paid Individuals + a design-partner pilot. The warm intro is fuel + optionality, NOT a reason to pause the DM/wedge motion.',
    'Verify every "Antler" contact resolves to @antler.co (passing DKIM) or his real LinkedIn (linkedin.com/in/magnusgrimeland) before sharing the deck or any IP. Run the decisive channel-check every time — the scam was the free lesson.',
    'Walk away if terms drift unfriendly, the network turns out performative, or governance/board overhead would slow the wedge.',
    'Tell the scam story as "I caught it" (judgment + product thesis lived), never as "a scammer’s effort proves my startup matters." A serious VC reads the latter as naïve spin.',
  ],

  logistics: {
    who: 'Warm path: your networking-event VC connection → introduction to Antler’s London partners. [FILL IN: his name + firm once confirmed, so future sessions can track the relationship.]',
    format:
      'Real channel, via that intro. The June "magnus@grimeland.com" Calendly inbound was an impersonation — cancel the July-2 slot, do not reply, share nothing.',
    cc: 'Verify any Antler contact: real Magnus is reachable via antler.co + linkedin.com/in/magnusgrimeland; legitimate Antler email is @antler.co with passing SPF/DKIM/DMARC. A bounce or a non-antler.co domain = stop.',
    practical:
      'Pursue AFTER customers-before-investors fires. First contact = value-show + listen; have the live audit + DPR specimen queued + a screen-share fallback; lead with founder-and-problem, not slides. (Also: turn on Calendly booking-approval so a stranger can’t drop a fake VC name on your calendar again.)',
  },
} as const;
