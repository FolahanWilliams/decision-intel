/**
 * The Human Pitch — SSOT for the founder-hub framing tab.
 *
 * Why this exists: you sell to HUMANS who do not care about R²F / DQI / DPR.
 * Humans buy on System 1 (fear, relief, a picture they instantly get) and
 * justify with System 2 afterward. So this surface holds (a) analogies a
 * stranger understands in one sentence, (b) the plain-English frame per
 * audience, (c) the bias-leverage persuasion system from the new books
 * (Shotton / Cialdini / Persuasion in B2B), and (d) the guardrails — the
 * jargon never to lead with and the two credibility overclaims never to make.
 *
 * Founder-private (server-gated). Edit the strings here; the tab + vizzes read
 * the SSOT. Every line is written the way you would SAY it on a call.
 */

export type AnalogyVizId = 'audit_asymmetry' | 'cockpit' | 'blind_spot' | 'smoke_detector';

export interface Analogy {
  id: AnalogyVizId;
  /** The human one-liner — the whole idea in a sentence. */
  title: string;
  /** The everyday scene the listener already knows. */
  hook: string;
  /** How that scene maps onto a decision (still plain language). */
  bridge: string;
  /** The line you actually say in the pitch. */
  sayThis: string;
  /** The jargon version that means nothing to a human — never say this. */
  notThis: string;
}

/** The mandatory one is first: audit the data, not the reasoning. */
export const ANALOGIES: Analogy[] = [
  {
    id: 'audit_asymmetry',
    title: 'You audit the money. Nobody audits the thinking that spent it.',
    hook: 'Every company on earth audits its finances — every receipt, every ledger, every quarter, by law. Armies of accountants on the numbers.',
    bridge:
      'But the decision that committed the money — the judgment behind the bet — gets no audit at all. And the biggest risk in a half-billion-dollar call is not a wrong number. It is not being able to tell conviction from bias.',
    sayThis:
      'We audit the data behind a decision to the penny, and the judgment that uses it almost not at all. Decision Intel audits the judgment — the part that actually decides whether the money was well spent.',
    notThis:
      'We run a 12-node R²F pipeline that scores a 22-bias taxonomy into a Decision Quality Index.',
  },
  {
    id: 'cockpit',
    title: 'A co-pilot, not a critic.',
    hook: 'Every airline puts two people in the cockpit. Not because the captain is bad — because no human, however good, catches their own blind spot at the exact moment it matters.',
    bridge:
      'A searcher flies solo. No co-pilot, no investment committee, nobody to say "are you sure?" before they sign a personal guarantee on their own money.',
    sayThis:
      "Decision Intel is the co-pilot's checklist for your deal. It doesn't fly the plane. It catches the one thing you can't see because you're the one flying it.",
    notThis:
      'It provides adversarial multi-agent boardroom simulation across five primed personas.',
  },
  {
    id: 'blind_spot',
    title: 'The spell-checker for the billion-dollar typo.',
    hook: "You can't proofread your own writing — you read what you meant to write, not what's on the page. That's why spell-check exists, and it's no insult to your intelligence.",
    bridge:
      "A deal memo is the same. You're too close to see the assumption you fell in love with. The flaw is invisible to the author by definition — that's not a knock on you, it's how brains work.",
    sayThis:
      "We're the spell-checker for reasoning. It doesn't doubt your judgment — it catches the typo you're blind to because you wrote it.",
    notThis:
      'It detects illusion-of-validity through narrative-coherence scoring weighted by domain validity class.',
  },
  {
    id: 'smoke_detector',
    title: 'A smoke detector in every room.',
    hook: "You don't install a smoke detector because you're a careless cook. You install it because the one fire you miss burns the house down.",
    bridge:
      'Most deal memos are fine. A few are not — and those are the ones that wipe you out. The trap: you cannot tell which is which from inside the memo.',
    sayThis:
      "Run the check on every deal for the same reason you wire a smoke detector in every room. It's cheap. The fire it catches isn't.",
    notThis:
      'The asymmetric tail of the outcome distribution justifies universal pre-commit auditing.',
  },
];

export interface AudienceFraming {
  id: 'eta' | 'fractional_cso' | 'ceiling';
  label: string;
  /** Who they are, in one human line. */
  who: string;
  /** The single sentence that makes them feel seen. */
  humanFrame: string;
  /** The 30-second opener you actually say. */
  coldOpen: string;
  /** What you are really selling. */
  sellThis: string[];
  /** What never to say to this person. */
  notThis: string[];
}

export const AUDIENCE_FRAMINGS: AudienceFraming[] = [
  {
    id: 'eta',
    label: 'The searcher / sponsor / operator',
    who: 'Buying one company to run, on their own money, personally guaranteed, with no investment committee.',
    humanFrame:
      "You're about to bet your own money — guaranteed personally — on a deal only you have looked at. We're the second set of eyes you don't have.",
    coldOpen:
      'I know your judgment is your edge. But you are about to personally guarantee an SBA loan and ask a family office to fund most of this deal, with nobody to catch a blind spot. Let me run a free 60-second check on your live memo today. If there is deal fever, or you have anchored on the asking price, we catch it before you burn another $20k in diligence.',
    sellThis: [
      'Relief, not rigor — they fear blowing their own runway far more than they want a slightly better deal.',
      'Leverage they CHOOSE to show a capital partner — their own proof that they did the work, so "trust me" becomes "here, look."',
      'Catch YOUR blind spot before YOU sign. A track record of your own judgment that only you can build.',
    ],
    notThis: [
      '"A record family offices already trust" — they have never heard of you; that is earned, not claimed.',
      'R²F / DQI / DPR as the opening words.',
      '"Your reasoning is flawed" — it detonates the call. Their judgment is their edge; you protect it, you do not audit them.',
    ],
  },
  {
    id: 'fractional_cso',
    label: 'The fractional CSO / consultant',
    who: 'Sells their judgment for a living; makes many decisions a week; allergic to anything that says their thinking is the problem.',
    humanFrame:
      "It doesn't replace your judgment — it amplifies it, and it does the rigor you skip under deadline.",
    coldOpen:
      "You know what a pre-mortem and a reference-class check are — you just don't have the billable hours to run them for every client. This does it in 60 seconds, and backs your gut call with real base rates so your read is provably sound. When the engagement ends, you hand the client a tamper-proof record of how the call was made, not just another slide deck.",
    sellThis: [
      'Amplify, do not replace — it protects the edge they sell, never commoditizes it.',
      'The bandwidth pitch — the rigor they already believe in but skip under deadline.',
      'The client flex — a premium deliverable that makes them look McKinsey-grade to a mid-market client.',
    ],
    notThis: [
      '"We audit your reasoning" as the opener — it sounds like you are auditing THEM.',
      'Anything that implies their judgment is the problem rather than the product.',
    ],
  },
  {
    id: 'ceiling',
    label: 'Banks & F500 — the ceiling (deck only)',
    who: 'The biggest, most painful buyer — and the one that CANNOT buy from you yet (procurement, security review, vendor risk).',
    humanFrame:
      'The market that will soon be legally required to produce exactly what we make — and the one place even existing audits are not trusted.',
    coldOpen:
      'This is the investor narrative, not a sales line. Regulators just moved the liability from the algorithm to the human who approved it (EU AI Act Article 14, Basel III). And the kicker: even where banks DO audit judgment, nobody trusts the result, because the human auditors are themselves inconsistent. We are the only record that is trustworthy by design — because it is not another human’s opinion.',
    sellThis: [
      'This is your TAM and your "why now" for the deck — never a month-one sale.',
      'The regulatory clock plus the trust gap equals a market that will be compelled to buy.',
      'At this stage: exactly one learning call, to understand the path. Never a pilot.',
    ],
    notThis: [
      '"We are trusted by the audit committee" — you are not, yet. Say "trustworthy by design."',
      'Chasing a bank pilot now — procurement and security review will eat six months; it is the premature-enterprise trap.',
    ],
  },
];

export interface PersuasionPrinciple {
  title: string;
  body: string;
  /** The source line you can quote (external books — real validation). */
  source: string;
}

/**
 * The bias-leverage system, from the books the founder added (Shotton's
 * Choice Factory / Illusion of Choice, Cialdini's Influence, Persuasion in
 * B2B, Barden's Decoded). These are EXTERNAL primary sources — quotable.
 */
export const PERSUASION_PRINCIPLES: PersuasionPrinciple[] = [
  {
    title: 'Sell relief, not rigor',
    body: 'They are not buying a better strategy. They are buying insurance against a decision that ruins them. Lead with the fear of the ruinous call and the 60-second relief — the upgrade in quality is the System-2 justification you add after.',
    source:
      '"Buyers fear bad decisions, wasted budgets, and missed opportunities more than they crave success." — Persuasion in B2B',
  },
  {
    title: 'System 1 first, System 2 after',
    body: 'Open on the gut fear (a deal that wipes them out) and the instant relief. Only once they are emotionally hooked do you bring out the taxonomy, the calibration math, the framework. Logic alone loses to a pitch that hits instinct.',
    source: '"People buy with emotion and justify with logic." — Persuasion in B2B',
  },
  {
    title: 'Additive rigor, not a report card',
    body: 'Cognitive bias is the grain of human nature, not a defect to shame. Amplify their intuition where it is valid; flag it only where it is not. Never call their thinking broken — that detonates the sale with an elite buyer.',
    source:
      '"Work with the grain of human nature rather than unproductively challenging it." — Richard Shotton, The Choice Factory',
  },
  {
    title: 'The record kills the fear of messing up',
    body: 'In B2B the strongest buy-trigger is removing the fear of looking foolish later. A tamper-proof record of how the call was made is the answer to "what if my board asks me about this in six months?" — sell that, not the audit.',
    source:
      '"Increase the fear of missing out, and reduce the fear of messing up." — Persuasion in B2B',
  },
  {
    title: 'Show the graveyard',
    body: 'Reverse social proof: elite teams fail without this all the time. WeWork, Kodak, Nokia, AOL-Time Warner — name the famous wreck that matches their deal. Nobody wants to be the next obvious-in-hindsight cautionary tale.',
    source:
      '"Buyers look at who else is using a thing... nobody wants to feel left behind." — Cialdini / Persuasion in B2B',
  },
];

export interface JargonSwap {
  jargon: string;
  human: string;
}

/** The words to NEVER lead with cold, and what to say instead. */
export const JARGON_SWAPS: JargonSwap[] = [
  {
    jargon: 'R²F / Recognition-Rigor Framework',
    human: 'a second set of eyes built on how the best decision-makers actually think',
  },
  { jargon: 'DQI / Decision Quality Index', human: 'a quality score for the decision, 0 to 100' },
  {
    jargon: 'DPR / Decision Provenance Record',
    human: 'a tamper-proof record of how the call was made',
  },
  {
    jargon: 'reasoning audit platform',
    human: 'we catch the blind spot in a big decision before you commit to it',
  },
  {
    jargon: 'cognitive bias taxonomy',
    human: 'the handful of ways smart people quietly fool themselves',
  },
  {
    jargon: 'Brier-calibrated outcome loop',
    human: 'it keeps score of how your calls actually turn out, so it gets sharper for you',
  },
];

export interface Guardrail {
  never: string;
  instead: string;
  why: string;
}

/** The two credibility overclaims the KB keeps drifting into — never make them. */
export const CREDIBILITY_GUARDRAILS: Guardrail[] = [
  {
    never: '"A record family offices / audit committees already trust."',
    instead: '"Your own proof that you did the work."',
    why: 'You are pre-revenue. They have never heard of your DPR; it is not a recognized signal yet. Third-party trust is earned through the value first, then claimed — never asserted up front.',
  },
  {
    never: '"Your reasoning is flawed / your judgment is biased."',
    instead: '"The blind spot you can’t see because you’re too close to it."',
    why: 'Telling an elite operator their judgment is broken triggers instant ego threat and ends the conversation. Name a missing process (a second set of eyes), never broken thinking.',
  },
];

export const SPEAK_HUMAN_RULE =
  'You are selling to a human, not a procurement form. They do not care about R²F, DQI, or DPR — they care about not getting wiped out, and looking sharp doing it. Lead with a picture they get in one sentence (an analogy), the fear, and the relief. Bring the framework out only after they lean in. Emotion first; the math is the receipt.';
