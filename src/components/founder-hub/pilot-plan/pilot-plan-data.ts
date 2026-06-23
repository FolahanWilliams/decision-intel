/**
 * Pilot Plan — the post-VC-pass re-foundation, as a living Founder Hub surface (SSOT).
 *
 * Founder-hub-internal (admin-gated). This is the canonical, navigable version of
 * docs/action-plan-first-3-pilots-2026-06.md — the plan to land the first 3 paid
 * pilots and the public prospective track record that earns the credibility a
 * pre-seed round needs. Built 2026-06-21 from the 2026-06-21 VC pass (Rob /
 * Hustle Fund), the Cowork re-foundation thread, and the repo-grounded review.
 *
 * Pure renderer over PILOT_PLAN (PilotPlanTab.tsx). Edit content HERE — the tab
 * is a dumb view. The publicCalls[] array is the one LIVING part: add a call when
 * you lock it, update its status + result as the proxy dates land (the SSOT-array
 * pattern, same as the sprint brief SESSION_LOG — no DB until it's worth one).
 *
 * The load-bearing discipline this surface exists to enforce:
 *   retro opens the door; prospective Brier earns belief.
 *   Score the FLAG (did the reasoning-risk we named materialise?), not the
 *   FORECAST (did we predict the outcome / price?).
 */

import { PUBLIC_CALLS } from '@/lib/data/public-calls';

// The PublicCall types + the calls now live in the canonical public SSOT
// (@/lib/data/public-calls), shared with the public /track-record page so the
// founder-hub ledger and the public page can never drift. Re-exported here for
// back-compat with existing importers (PilotPlanTab).
export type { PublicCall, PublicCallStatus } from '@/lib/data/public-calls';

export interface DiagnosisPoint {
  title: string;
  body: string;
}

export interface Pilot {
  name: string;
  tag: string;
  who: string;
  why: string;
  how: string;
  shape: string;
  price: string;
  success: string;
}

export interface Refinement {
  n: number;
  title: string;
  body: string;
}

export interface SequencePhase {
  window: string;
  items: readonly string[];
}

export interface CredibilityAsset {
  rank: number;
  asset: string;
  note: string;
  status: 'have' | 'building' | 'todo';
}

export interface Focus {
  headline: string;
  lanes: readonly string[];
  note: string;
}

export interface RobPassPoint {
  objection: string; // the verbatim VC-pass objection
  answer: string; // the ruthless, buyer-grounded spoken answer (agree, then reframe)
  proof: string; // the asset that backs the answer
}

export const PILOT_PLAN = {
  headline: 'The plan to land the first 3 paid pilots — and earn the track record funding needs.',
  thesis:
    'Re-alignment to the wedge you already chose, not re-invention. Rob did not break the strategy; he broke a deck that wandered back to the ceiling (confidential F500 M&A — the one buyer structurally closed to you this year). Re-found on the wedge, manufacture a public prospective track record on the side, and real funding is on the table.',
  provenance:
    'Built 2026-06-21 from the VC pass (Rob / Hustle Fund), the Cowork re-foundation thread, and the repo-grounded review. Re-weighted 2026-06-22 to the founder’s decisions: two NAMED lanes, Sankore as a stretch (not the week-1 anchor), 3 paying cheques as the bar, full-summer sprint. Full prose: docs/action-plan-first-3-pilots-2026-06.md.',

  // ─── The focus — WHO, exactly, and at what intensity. The founder’s own
  //     discipline: named targets, not a broad campaign; don’t spread thin. ───
  focus: {
    headline: 'Two named lanes this summer — specific people, not a campaign.',
    lanes: [
      'Lane A — ONE specific solo GP / angel. Warmest path: Rob’s Hustle Fund / Angel Squad network (he just engaged — ask for the intro). Owns their deal data; cleanest ROI ("it flagged a risk on a deal I’d have done").',
      'Lane B — ONE specific fractional CSO / strategy consultant. LinkedIn-findable, constant memo flow, their name is on every board memo. Value: "walk into the board Q&A already ready for the two risks it flagged."',
    ],
    note: 'Corp dev / PE-backed founder is OPPORTUNISTIC — take it if it comes warm, don’t run it as a third campaign. The whole point is clarity on WHO + WHY, not volume: "I’m targeting this person from here, that person from there." Full-summer sprint: DI is the priority through ~August — 8–10 personalised outreach/week (top of the 1-1-1 cadence, never cold-at-scale), 2 public calls/month, buyer conversations as the daily job.',
  } as Focus,

  // ─── The pass, line by line. Rob's six objections (the set every credible
  //     buyer raises) → the ruthless answer (agree, then reframe) → the proof
  //     asset. Rehearse this; never re-derive it live. This is "not scrambling
  //     when the next Rob shows up." ───
  theRobPass: [
    {
      objection:
        'Finding "anchoring" in WeWork\'s S-1 when you already know it failed is textbook hindsight bias.',
      answer:
        'Agreed — the retro library is a teaching aid, never proof, and I label it illustrative every time. So the real proof is FORWARD: I lock a reasoning-risk flag on a live public decision, in advance, with a falsifiable test and a due date, and I publish the misses. Judge the hit rate, not the hindsight.',
      proof:
        "The public prospective track record (/track-record): first call locked 2026-06-21, due Dec 31. Plus the cold-open that runs the audit on the buyer's OWN closed deal, not a famous failure.",
    },
    {
      objection:
        'Who puts a confidential, market-sensitive M&A memo into a third-party tool with no security or compliance accreditation?',
      answer:
        "Nobody, and I am not asking them to. The wedge runs on PUBLIC decisions and the buyer's own ALREADY-CLOSED deals — no live confidential upload needed to prove value. Confidential F500 M&A is the ceiling, not the entry; it opens after SOC 2 and references, not before.",
      proof:
        'The retro cold-open (run it on a deal you have already closed) + SOC 2 Type I on the Q4 2026 roadmap (/trust). The wedge sits structurally outside the confidentiality wall by design.',
    },
    {
      objection: 'What has the EU AI Act got to do with cognitive biases in an M&A deal?',
      answer:
        'Nothing at the wedge — you are right, and I have cut it. The Act governs AI SYSTEMS in eight defined high-risk areas; a human M&A reasoning call is not one of them. It is only live at the regulated-record ceiling (banks, audit committees), never for an individual operator. Leading the wedge with it was borrowed authority that cost credibility.',
      proof:
        'Cut from every wedge surface (positioning lock); kept only at the Phase-4 procurement ceiling where it genuinely binds.',
    },
    {
      objection: 'The deck reads as something Claude wrote — lots of AI waffle.',
      answer:
        'Fair hit on the deck. The substance under it is not waffle: it is 50-year-old intelligence-community tradecraft — pre-mortem, competing hypotheses, red team, the Structured Analytic Techniques the CIA runs by hand, automated. The deck buried that under category nouns. The fix is plain language: what we catch, on whose decision, scored how.',
      proof:
        'The R²F / SAT lineage (Heuer, Meehl, Tetlock, Ferrucci), provenance not invention, on the Intellectual Constellation. The track record proves the catch in concrete, dated terms a CFO can check.',
    },
    {
      objection: 'I do not see depth to the product and I do not see a moat.',
      answer:
        'Straight answer: the audit engine IS replicable, a team rebuilds the prompt in weeks, and I will not pretend otherwise. The moat is not the engine; it is what accumulates once embedded: the per-org decision→outcome calibration data, the workflow embeddedness, and a five-ingredient bundle where four (founder narrative, embedded time, real calibrated data, network) are unrepeatable. The moat is downstream of traction, which is exactly why the plan is one deep pilot, not more features.',
      proof:
        'The defensibility vectors + the five-ingredient bundle (Path to $100M tab). Honest framing: no moat yet, it is earned by getting embedded.',
    },
    {
      objection:
        'You have not made commercial traction. Get a signed paid pilot from a credible buyer, then take that forward.',
      answer:
        'Agreed — that is the only thing that matters now, and it is the whole plan, not a side-note. Two named lanes, a free retro on a closed deal to get in the door, convert to a paid pilot. No more product until that is signed.',
      proof:
        'This Pilot Plan: two named lanes, the retro-to-pilot motion, the month-4 kill criterion. The directive, made the spine.',
    },
  ] as RobPassPoint[],

  // ─── The diagnosis, settled. Stop re-litigating; act. ───
  diagnosis: [
    {
      title: 'Hindsight trap is real — with one exception.',
      body: 'WeWork-in-hindsight proves nothing about prediction; the case library is a teaching aid, never validity proof. The exception: the retro cold-open ("run it on a deal you’ve already closed, one good + one that went sideways") is legitimate — forensic on the prospect’s OWN outcome, ego-safe, mints a logo. Retro opens the door; it never poses as proof you predict. Label retro "illustrative" first, every time — saying it first IS the rebuttal.',
    },
    {
      title: 'The confidentiality wall closes F500 live M&A in 2026.',
      body: 'No GC uploads a live, market-sensitive deal to an unaccredited solo-founder tool with no track record. That is the ceiling, not the entry. Stop leading with it.',
    },
    {
      title: 'The EU AI Act does not apply to a human M&A decision.',
      body: 'Annex III high-risk scope is AI systems in eight defined areas (biometrics, employment, credit, law enforcement, and the rest). Corporate strategy and M&A are not in it; it governs systems, not judgment. Leading the wedge with it is borrowed authority that costs credibility with the exact sophisticated readers you need. Legitimate ONLY at the bank ceiling. Cut it from every wedge surface.',
    },
    {
      title:
        'The moat is the prospective calibration dataset — and the machine for it is shipped, just unfed.',
      body: 'Not the cases, the prompts, or the vocabulary (all copyable). Paired decision + reasoning + real outcome, Brier-scored over time. It is downstream of traction: you earn it by getting users to log real outcomes. Do not claim it; feed it.',
    },
    {
      title: 'The substance has a spine you underuse: automated Structured Analytic Techniques.',
      body: 'Pre-mortem, red-team, reference-class, devil’s advocate — the intelligence community has run these by hand for decades because the manual version is slow and expensive (RAND documents the cost). That lineage is the single biggest fix to "the deck reads like Claude wrote it." Keep "the reasoning audit platform" as the cold-buyer noun; put the SAT/IC lineage under it as the substance. Provenance, not category-invention.',
    },
  ] as DiagnosisPoint[],

  // ─── The three paid pilots. Four gates: owns the data · provable in one
  //     session · trust barrier low · frequent enough to calibrate. ───
  pilots: [
    {
      name: 'Solo GP / small-fund principal / active angel',
      tag: 'Lane A · named target',
      who: 'An individual running their own deal flow at a £5–100M fund, a syndicate lead, or a serious angel who writes/approves investment memos and owns the decision.',
      why: 'Owns the data outright (no GC, no procurement); investment bias is the most-documented domain on earth; enough decisions to calibrate; pays from a personal/fund card; reputation rides on judgment, so a private red-team is valuable to them.',
      how: 'Rob’s Hustle Fund / Angel Squad network is a direct line to exactly this person — he just engaged, so ask. Plus Mr. Gabe’s investor network and targeted DMs. Open with the retro: "Send me one deal you passed on that you regret and one you did that went sideways. I’ll run our audit and show you what the reasoning looked like in hindsight. 20 min, no pitch."',
      shape:
        'Retro on 2 closed decisions to get in → audit the next 3–5 LIVE memos, logging the predicted outcome + flagged risks via the operational-proxy gate (timestamped). 60–90 days.',
      price:
        '£249–499/mo, or a flat £750 for a 3-month pilot. The cheque existing matters more than the number.',
      success:
        'Pays · keeps pasting memos · ≥1 live decision’s outcome tracked · gives a quotable sentence.',
    },
    {
      name: 'Fractional CSO / independent strategy consultant',
      tag: 'Lane B · named target',
      who: 'Someone running 3–5 client engagements who produces strategy memos and board recommendations for a living.',
      why: 'Their product IS judgment quality; their name is on every memo; they own the workflow; personal budget; constant memo flow. Catching what the client’s board will catch before delivery is directly in their self-interest.',
      how: 'LinkedIn (findable + active); retro cold-open on a past, anonymised engagement; Strategy World London / conference 1:1s.',
      shape:
        'Audit the next client memos pre-delivery — value is "don’t get caught flat-footed in the board Q&A." Log which flagged risks the board actually raised. 60–90 days.',
      price: '£249–999/mo. They bill clients thousands; this is cheap insurance.',
      success: 'Pays · repeat use · testimonial · ideally brings it into a client engagement.',
    },
    {
      name: 'Mid-market Head of Corp Dev / PE-backed founder',
      tag: 'Opportunistic · not a third campaign',
      who: 'Head of Corp Dev at a $50–500M-revenue scale-up, or a PE-backed founder/CEO with personal-decisive budget, doing 1–3 deals a year.',
      why: 'High-stakes, personal budget pre-team, owns their own deal memos. NOT the F500 GC (closed) — the individual operator who can just buy it for their own work.',
      how: 'Mr. Reiner’s network (US); warm intros; retro cold-open on a closed deal.',
      shape: 'Retro on a closed deal → audit the next live deal memo + IC prep; track the outcome.',
      price: '£499–999/mo, or a per-deal fee.',
      success: 'Pays · uses it on a real deal · reference.',
    },
  ] as Pilot[],

  sankore: {
    headline: 'Sankore is the highest-CEILING stretch — chase it hard, but it is NOT the anchor.',
    body: 'The honest tension, settled (founder call, 2026-06-22): Sankore has the highest ceiling of anything in this plan — the 3 individual cheques prove DEMAND, but only an embedded relationship realistically produces real calibration data inside 12 months (individuals are the LEAST likely cohort to log honest 90-day outcomes — the Cloverpop manual-logging trap, and outcome-logging is the exact behaviour the moat depends on; Sankore’s contractual outcome-gate + the retroactive seed over 30–50 already-closed decisions gives real outcome data on day one). BUT it is not signed — and you cannot make an unsigned MoU the spine of a 90-day plan. So: pursue Sankore hard in parallel (it is the moat accelerant, and if the MoU signs it RE-RANKS to P0 and reshapes the sequence), but ANCHOR the 60–90 days on the two named individual lanes you control. Your fallback for getting at least SOME outcome data without it: the individual pilots’ operational-proxy gate forces a falsifiable ≤90-day call at vote time. Lead Sankore with the relationship/embed, not the monthly rate; take money if offered, but access + data is the prize.',
  },

  // ─── Three refinements from the 2026-06-21 review. Sharpen, don't replace. ───
  refinements: [
    {
      n: 1,
      title: 'Score the FLAG, not the FORECAST (the most important fix).',
      body: 'The public track record must Brier-score whether the reasoning-risk DI flagged actually materialised — NOT whether DI predicted the outcome or the price. Scoring outcomes makes you a forecaster competing with Tetlock and every analyst, where the pipeline is mediocre by design. Scoring whether your flags bite makes you a bias-auditor whose detection is calibrated — the actual product, and the only claim epistemic-honesty lets you make ("risk indicators correlated with poor outcomes; not causation; not price"). Publish the false positives too; the true-positive/false-positive profile over N calls IS the moat artifact.',
    },
    {
      n: 2,
      title: 'Sankore is the highest-ceiling stretch — chase it, but don’t make it the spine.',
      body: 'The prior draft argued Sankore is P0 (the only realistic real-calibration-data source in 12 months — true). The founder’s call (2026-06-22): it is not signed, so it cannot anchor the 90 days. Resolution: pursue Sankore hard in parallel (highest ceiling; re-ranks to P0 the day the MoU signs), but anchor on the two named individual lanes you control. The individual pilots prove the wedge; Sankore, IF it lands, proves the moat. Don’t gate the sprint on an unsigned deal.',
    },
    {
      n: 3,
      title:
        'The 3 cheques are the BAR investors named — but not the strongest credibility signal.',
      body: 'Three individuals at £249–999/mo reads as lifestyle SaaS to a skeptical seed investor (your own "£300K/yr lifestyle utility" warning). The cheques prove willingness-to-pay (necessary, hard, and the literal bar you were given) — but they don’t prove the product WORKS. The proofs that do, in order of what you control: (1) public Brier track record → (2) the GPT-vs-pipeline depth proof → (3) the 3 paid cheques, with Sankore the wildcard that leaps to the top the day it signs. Lead the investor story with 1–2 (controllable, start week 1) + the cheques as the floor; treat Sankore as upside, not the plan.',
    },
  ] as Refinement[],

  // ─── The public prospective track record — "Decision Intel, in the open." ───
  publicTrackRecord: {
    headline: 'The public prospective track record — your highest-leverage credibility move.',
    why: [
      'Kills the hindsight objection — forward, dated, public, falsifiable. The opposite of WeWork-in-hindsight.',
      'Seeds the moat in public — every locked call is one more prospective, outcome-scored data point. 1–2/month for 6–12 months = a track record no other pre-seed founder has.',
      'It is your best content — a public scorecard feeds the build-in-public motion and is the most credible content imaginable.',
      'No confidentiality wall, no cost — all public data.',
      'The machine is already shipped: run the audit → capture the prior (PriorsCaptureCard) → lock a ≤90-day falsifiable proxy (operational-proxy gate) → export the DPR → Brier-score it. The only missing surface is a public ledger, and you can publish call #1 as a post this week without it.',
    ],
    discipline: [
      'Only locked-forward calls count as track record; retro analyses are always labelled illustrative.',
      'You WILL be wrong on individual calls — fine and expected. Calibration across many beats being right once (superforecasters are wrong constantly and still beat classified analysts ~30% because they are calibrated). Publish losses; the honesty is the moat against "you cherry-pick."',
      'Stay in the DI lane and score the FLAG, not the FORECAST. You audit the reasoning and flag a specific reasoning-risk; what gets scored is whether that risk materialised, not whether you predicted the price.',
      'Frame every call as METHOD, never a hit-piece: "watch a locked, dated, falsifiable reasoning-audit play out in public." And because the early calls are N=1 with no buffer, pair a high-profile call with 1–2 lower-profile ones — the calibration story needs N≥10 before any single miss is just noise.',
    ],
  },

  // ─── Worked example: call #1, SpaceX (SPCX). All figures verified 2026-06-21. ───
  spacex: {
    decision:
      'SpaceX’s S-1 IPO thesis — the reasoning the ~$1.77T valuation rests on. Public document, no confidentiality wall, outcome unknown, debuted 9 days before this audit. Perfectly in-bounds.',
    facts: [
      'IPO’d on Nasdaq (ticker SPCX): priced June 11 2026 at $135/share / ~$1.77T; debuted June 12 closing $161 (+19%); ~$75B raised — largest US IPO ever. Public S-1 filed May 20 2026.',
    ],
    thesis: [
      '"Railroad infrastructure for space": reusable rockets cut launch cost ~$18,500/kg → ~$1,400/kg, unlocking Starlink → orbital AI → lunar → Mars.',
      '~$1.77T ≈ 60–70× forward revenue on ~$25B 2026E revenue — coverage is explicit this "prices 2030 outcomes" (Starlink ~$40B revenue, Starship reusable at scale, orbital-AI or Mars optionality printing real numbers).',
      'Starlink: 10.3M subscribers (Mar 2026), doubled YoY; illustrative 30–50M scenarios. ARPU fell $99 (2023) → $66 (Q1 2026).',
      'Starship: the stated near-term milestone is first commercial payloads in H2 2026.',
    ],
    flags: [
      {
        bias: 'Inside-view dominance (DI-B-022)',
        body: 'Coverage frames the ask as "conviction that Musk delivers a 2030 set of milestones the market has never priced for any single CEO" — the literal "this one is special, the comparables don’t apply." The reference class (60–70× forward revenue for outcomes 4 years out; one CEO across SpaceX + Tesla + xAI + X) is unfavourable.',
      },
      {
        bias: 'Planning fallacy / timeline optimism — the load-bearing, checkable flag',
        body: 'The entire downstream thesis (V3 Starlink capacity, orbital AI, lunar, Mars) is gated on Starship at commercial scale. Base rate: Starship flew 5 times in 2025 against a 25-flight target — 20% of plan. Stated milestone: first commercial payload H2 2026.',
      },
      {
        bias: 'Narrative coherence / illusion of validity (DI-B-021)',
        body: '"$1.77T → 7th-biggest US company, above Tesla" is internally coherent (cheap launch → broadband → AI → Mars), and the coherence is manufacturing confidence the base rates don’t support.',
      },
      {
        bias: 'Reference-class / competition under-weighting',
        body: 'Starlink ARPU fell $99 → $66; Amazon’s Kuiper/Leo hit enterprise beta Apr 2026. The 30–50M-sub scenarios under-weight deceleration + price competition.',
      },
    ],
    lockedCall:
      'DI flags that the SPCX valuation thesis is gated on a Starship timeline the reference class says is optimistic (5 of 25 planned flights in 2025). Locked falsifiable proxy (2026-06-21): does the first commercial Starship payload fly by Dec 31 2026 (the S-1’s own "H2 2026" milestone)? The reference-class base rate says it slips. Tracking it, win or lose.',
    proxies: [
      {
        window: '3-month (~Sep 2026)',
        q: 'Does SpaceX’s first post-IPO reporting reaffirm or quietly soften "H2 2026 commercial payload"? Is the test-flight cadence an H2 commercial debut requires actually happening?',
      },
      {
        window: '6-month (Dec 31 2026)',
        q: 'Did the first commercial Starship payload fly? (primary) Secondary: did Starlink net-adds decelerate / ARPU keep falling?',
      },
      {
        window: '12-month (Jun 2027)',
        q: 'Is the "2030-milestones-priced-today" gap narrowing or widening?',
      },
    ],
    scoring: [
      'DI is NOT predicting SPCX’s share price. The stock could rip on Starlink alone while the Starship timeline slips — and DI’s flag would still be validated, because the flag was about the reasoning-risk, not the price.',
      'Scored unit: did the flagged risk materialise? Starship commercial debut slips past Dec 31 2026 → flag confirmed. It flies on time → flag was a false positive, publish it. Across 10–15 calls you get an honest true-positive/false-positive profile on DI’s detection — the only thing that answers "does it actually work."',
    ],
    guardrail:
      'Publish as method, never a hit-piece — "watch a locked, dated, falsifiable reasoning-audit play out in public," not "SpaceX is overvalued." DI admires the company and audits the reasoning, not the rocket. Pair it with 1–2 lower-profile calls so the early record isn’t all-in on the most-watched company on earth.',
  },

  // ─── The LIVING ledger. Add a row when you lock a call; update status +
  //     result as the proxy dates land. This is the moat, accumulating in public. ───
  // The living ledger now lives in the canonical SSOT @/lib/data/public-calls
  // (shared with the public /track-record page). Add calls THERE.
  publicCalls: PUBLIC_CALLS,

  // ─── The four credibility assets, re-ranked (refinement #3). ───
  credibility: [
    {
      rank: 1,
      asset: 'Public Brier track record',
      note: 'The thing no other pre-seed founder has, and the only honest answer to "how do I know it works." Fully in your control. Start week 1.',
      status: 'building',
    },
    {
      rank: 2,
      asset: 'GPT-vs-pipeline depth proof',
      note: 'One real memo, one non-obvious catch the pipeline makes that a plain GPT prompt misses. Kills "it’s a sophisticated Claude wrapper." Fully in your control. Build week 1.',
      status: 'todo',
    },
    {
      rank: 3,
      asset: 'The 3 paid cheques',
      note: 'The bar investors named — proves willingness-to-pay (necessary, hard). Land them via the two named lanes. The "dog eats the food" floor, not the headline.',
      status: 'todo',
    },
    {
      rank: 4,
      asset: 'Sankore real-outcome reference',
      note: 'Highest CEILING — real calibration data + a logo via the retroactive seed. But a STRETCH (unsigned). Chase it hard; the day it lands it leaps to the top.',
      status: 'todo',
    },
  ] as CredibilityAsset[],

  // ─── The sequence. Order matters; don't jump ahead. ───
  sequence: [
    {
      window: 'Weeks 1–2 — clear the deck, load the gun',
      items: [
        'Ship the safe credibility cleanups (done: 7-component DQI + 22-bias counts swept). Park the pitch deck — it is not the blocker.',
        'Open the two named lanes: pick ONE specific solo GP / angel (ask Rob for the intro) and ONE specific fractional CSO; send each the retro cold-open.',
        'Build the one product proof (GPT vs pipeline).',
        'Publish public call #1 (SpaceX) — lock + timestamp via the proxy gate.',
        'Open the Sankore conversation — high-ceiling stretch; pursue, but don’t gate the plan on it.',
      ],
    },
    {
      window: 'Weeks 2–8 — first cheque',
      items: [
        'Full-summer sprint: 8–10 personalised conversations/week across the two named lanes (top of the 1-1-1 cadence, never cold-at-scale); corp dev only if it comes warm. Log every one in the WedgeProspect ledger (an empty ledger IS the displacement signal).',
        'Run the reverse-pilot in every call (the $300M→$3B motion): ask what they’d pay to solve + what it would take for them to become a buyer; get the ROI metric from THEIR mouth, hit it, come back with "I did what you said — ready?"',
        '2 public calls/month — pair the high-profile SpaceX call with a lower-profile one (the calibration story needs N before any single miss is just noise).',
        'Target: one signed paid pilot.',
      ],
    },
    {
      window: 'Months 2–4 — the pattern',
      items: [
        'Land all three paid pilots; run the prospective loop on each.',
        'Sankore embed running; start the retroactive calibration seed.',
        '1–2 public calls/month; the first approach their 3-month mark.',
      ],
    },
    {
      window: 'Months 4–6 — proof compounds',
      items: [
        'First closed outcomes → first real (small-N) calibration data → the moat starts existing.',
        '3 pilots with sustained usage + ≥1 quotable reference.',
        'Run the Vohra survey on the cohort (graduation signal).',
      ],
    },
    {
      window: 'Months 6–12 — fundable',
      items: [
        'Convert pilots to retained subs; Sankore reference + DPR specimens published.',
        'Public track record N≥10 calls + a first honest Brier readout.',
        'NOW open the seed conversation — customers before investors (the Mr. Gabe rule).',
      ],
    },
  ] as SequencePhase[],

  guardrails: [
    'Retro opens the door; prospective Brier earns belief. Never blur them.',
    'You will be wrong on public calls. Calibration over many beats being right once. Publish losses.',
    'Don’t claim the moat before it exists — it’s a shipped machine you’re feeding, not an asset you have.',
    'Don’t lead the wedge with regulation, security theatre, or F500 framing. Lead with: "here’s a real decision, here’s the non-obvious thing we caught, here’s our public track record."',
    'Stop polishing the deck. One paying customer > any slide.',
    'Fill the WedgeProspect ledger. An empty ledger means the motion isn’t running.',
  ] as readonly string[],

  nextMove:
    'This week, three moves: (1) lock SpaceX call #1 — an afternoon, the machine is already built, and it is the asset that most directly neutralises the VC pass; (2) open BOTH named lanes — one specific solo GP / angel (ask Rob for the intro) and one specific fractional CSO — with the retro cold-open; (3) open the Sankore conversation in parallel (upside, not the spine). Then run the reverse-pilot in every reply: what would they pay to solve, and what would make them a buyer?',
} as const;
