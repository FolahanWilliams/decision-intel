/**
 * Outreach engine — the ETA / owner-operator wedge motion (locked 2026-06-26).
 *
 * The ICP pivoted from the smaller-fund-GP gatekeeper to the ETA / owner-operator
 * layer: independent sponsor (lead), self-funded searcher (#2 + UK access),
 * serial acquirer (lowest churn). The PRIMARY motion is ONLINE + daily —
 * Searchfunder DMs + LinkedIn + the free live-deal audit offer — because the
 * founder runs the community GTM mostly online; the in-person rooms below are
 * the periodic, replaceable layer (founder's own call). The funnel math (the
 * Execution Kit): ~40 real conversations → ~15 free audits on live memos → 5
 * closes (~10-12%), ask for a referral at every win. Leading indicator: number
 * of free audits actually RUNNING on real memos — that, not demos, predicts
 * revenue 4-6 weeks out.
 *
 * What this module provides:
 *   1. EVENTS — the periodic London / EU ETA in-person rooms (dates approximate
 *      until the founder confirms on each org's site — see each rationale)
 *   2. WEDGE_PERSONAS — the 3 ETA buyer-class-continuous personas with
 *      ETA-specific self-articulated pain + canonical 143-case bias hooks
 *   3. DM_TEMPLATES — verbatim drafts the founder edits. LEAD FORWARD on the
 *      FREE live-deal audit (not the retro): for the ETA wedge the audit is
 *      fundraising leverage they WANT, so no ego-threat to manage. Plain
 *      language — never "DPR" / "R²F" / "DQI" / "reasoning audit platform" on
 *      a first DM (CLAUDE.md cold-context rule); the bridge sentence comes
 *      after they reply.
 *   4. ACTION_CADENCE — the online channel funnel + 5-10 DMs/week + the
 *      referral-at-the-aha-moment flywheel + the in-person prep arc
 *
 * Why this lives at /lib/data: the event-prep card on Founder OS reads from
 * here, and any future surface (chat coaching, outreach hub, weekly digest)
 * can compose against the same SSOT without duplicating persona + DM copy.
 *
 * Update HERE when (a) the event lineup / dates shift (founder confirms a real
 * date), (b) the wedge personas change (per CLAUDE.md ICP lock), (c) DM
 * templates fall flat in the wild and the founder rewrites them.
 */

export interface PrepEvent {
  /** Slug used as React key + URL fragment. */
  id: string;
  /** Event name as it appears on the public site. */
  name: string;
  /** ISO-8601 start date (YYYY-MM-DD). Used for countdown math. */
  startDate: string;
  /** ISO-8601 end date (YYYY-MM-DD). Some events are one-day. */
  endDate: string;
  /** Venue + neighbourhood (e.g. "BAFTA, Piccadilly"). */
  venue: string;
  /**
   * v3.5 §2 priority signal: 'highest' = the one event that must not be
   * missed; 'high' = high signal-per-conversation; 'medium' = high volume,
   * lower signal-per-conversation. Maximum two events per month per the
   * Sharran 1-1-1 traffic-source discipline.
   */
  priority: 'highest' | 'high' | 'medium';
  /** Which ETA wedge personas this event is densest in. */
  primaryPersonas: WedgePersonaId[];
  /**
   * The pre-event prep arc start — number of weeks before the event when
   * outreach should begin. Highest-signal attendees book 4-6 weeks ahead.
   */
  prepArcWeeks: number;
  /** One-line rationale for why this event makes the cut. */
  rationale: string;
}

export type WedgePersonaId = 'independent_sponsor' | 'self_funded_searcher' | 'serial_acquirer';

export interface WedgePersona {
  id: WedgePersonaId;
  /** Display name as the founder thinks of the buyer. */
  label: string;
  /** AUM / revenue / engagement-count band that defines the persona. */
  band: string;
  /** Industries the persona most often works in (intersect with case library). */
  industries: Industry[];
  /**
   * The pain the persona feels and articulates aloud (NOT what we frame for
   * them — what they say first). Used as the empathic-mode-first opener
   * anchor on every DM and the discovery-call prompt.
   */
  selfArticulatedPain: string;
  /**
   * Verbatim industry-specific bias hook the founder leads the DM with.
   * Sourced from the 143-case library; each hook cites a specific
   * historical case so the prospect immediately recognises the pattern.
   */
  canonicalBiasHooks: BiasHook[];
}

export type Industry =
  | 'technology'
  | 'financial_services'
  | 'healthcare'
  | 'manufacturing'
  | 'retail'
  | 'telecommunications'
  | 'aerospace'
  | 'automotive'
  | 'entertainment'
  | 'government';

export interface BiasHook {
  /** The named bias as it appears in the 143-case library + bias taxonomy. */
  bias: string;
  /** The historical case the prospect will recognise (no fabrication). */
  case: string;
  /** What the bias did in that case — one short clause for the DM hook. */
  whatItDid: string;
}

export interface DmTemplate {
  personaId: WedgePersonaId;
  /** Cold-context opener for first contact. Plain language only. */
  opener: string;
  /** Mid-funnel reply when the prospect responds with curiosity, not commitment. */
  curiosityReply: string;
  /** Discovery-call ask after 1-2 message exchanges. 20-min, free, no pitch. */
  discoveryAsk: string;
  /** 4-line follow-up to introducer after every warm intro (Mr. Reiner / Mr. Gabe rule). */
  introducerFollowUp: string;
}

// ============================================================================
// EVENTS — Phase 1 wedge calendar (v3.5 §2)
// ============================================================================

// NOTE on dates: these are the ETA in-person rooms the Execution Kit names,
// but the exact 2026/2027 dates are NOT yet confirmed — the startDate/endDate
// below are APPROXIMATE next-occurrence placeholders (first-of-month) so the
// countdown chip renders, and every rationale flags "confirm the exact date".
// FOUNDER ACTION: verify each on the org's site and correct the date here.
// The PRIMARY motion is online (Searchfunder + LinkedIn + the free-audit
// offer, see ACTION_CADENCE) — these rooms are the periodic, replaceable layer.
export const EVENTS: PrepEvent[] = [
  {
    id: 'iese_search_fund_conf_2026',
    name: 'IESE International Search Fund Conference',
    startDate: '2026-10-01',
    endDate: '2026-10-01',
    venue: 'IESE, Barcelona',
    priority: 'medium',
    primaryPersonas: ['self_funded_searcher', 'independent_sponsor'],
    prepArcWeeks: 5,
    rationale:
      'APPROXIMATE date (~Oct, confirm on iese.edu). The global search-fund room — worth a flight if budget allows. Searchers + their backers in one place; lead with the free live-deal audit, never a pitch.',
  },
  {
    id: 'gerald_edelman_eta_awards_2026',
    name: 'Gerald Edelman ETA / Search Fund Awards',
    startDate: '2026-11-01',
    endDate: '2026-11-01',
    venue: 'London (confirm)',
    priority: 'high',
    primaryPersonas: ['self_funded_searcher', 'independent_sponsor'],
    prepArcWeeks: 5,
    rationale:
      'APPROXIMATE date (~Nov, confirm with Gerald Edelman). A UK room full of searchers AND their named backers — vendor-accessible via sponsorship. Pre-book coffees; offer the free audit on a live deal.',
  },
  {
    id: 'lbs_eta_conference_2027',
    name: 'LBS Entrepreneurship Through Acquisition Conference',
    startDate: '2027-04-01',
    endDate: '2027-04-01',
    venue: 'London Business School',
    priority: 'high',
    primaryPersonas: ['self_funded_searcher', 'independent_sponsor'],
    prepArcWeeks: 6,
    rationale:
      'APPROXIMATE date (~April, confirm with LBS ETA Club). Densest UK searcher room + their backers. Vendor-accessible via sponsorship. The discovery-first, free-audit motion.',
  },
  {
    id: 'rollupeurope_serial_acquirer_symposium_2027',
    name: 'Serial Acquirer Symposium (RollUpEurope)',
    startDate: '2027-06-01',
    endDate: '2027-06-01',
    venue: 'Marylebone, London',
    priority: 'highest',
    primaryPersonas: ['serial_acquirer', 'independent_sponsor'],
    prepArcWeeks: 6,
    rationale:
      'APPROXIMATE date (~June, confirm with RollUpEurope). ~200 of EXACTLY these buyers in one London room — the best in-person bet. Sponsor or attend; pre-book coffees, run live audits, ask for referrals at the aha moment.',
  },
];

// ============================================================================
// WEDGE_PERSONAS — the 3 ETA / owner-operator wedge personas
// ============================================================================

export const WEDGE_PERSONAS: WedgePersona[] = [
  {
    id: 'independent_sponsor',
    label: 'Independent / fundless sponsor',
    band: 'No committed fund · self-funds diligence · raises ~85% equity from family offices / HNWs',
    industries: ['technology', 'financial_services', 'manufacturing', 'healthcare', 'retail'],
    selfArticulatedPain:
      "I self-fund my diligence and shop every deal memo to family offices to raise the equity. My reputation with those capital partners IS my business — if a deal I raised on goes sideways, the next raise is harder. The memos that lose me a backer are the ones with a blind spot they spotted and I didn't.",
    canonicalBiasHooks: [
      {
        bias: 'Illusion of Validity',
        case: 'WeWork S-1 (2019)',
        whatItDid:
          'narrative coherence created false confidence — the memo raised on a story the base rates did not support',
      },
      {
        bias: "Overconfidence (Winner's Curse)",
        case: 'AOL-Time Warner merger (2000)',
        whatItDid:
          'the synergy case assumed convergence economics already breaking; the bidder who wins the auction is the one who over-estimated value',
      },
      {
        bias: 'Inside-View Dominance',
        case: 'Daimler-Chrysler merger (1998)',
        whatItDid:
          'projections rejected the reference class on integrations like this one — "this deal is special"',
      },
    ],
  },
  {
    id: 'self_funded_searcher',
    label: 'Self-funded searcher (ETA)',
    band: 'One company · SBA / acquisition loan personally guaranteed · no investment committee',
    industries: ['manufacturing', 'technology', 'healthcare', 'retail', 'financial_services'],
    selfArticulatedPain:
      "I'm searching for one company to buy with a loan I'll personally guarantee. One decision, total ruin if I'm wrong, and no investment committee behind me. Multiple LOIs die in diligence before one closes — and the ones that scare me most are the ones where I'd already fallen in love with the business.",
    canonicalBiasHooks: [
      {
        bias: 'Confirmation Bias',
        case: 'Kodak digital photography exit (1989)',
        whatItDid:
          'once you love the target, diligence becomes a verification exercise instead of a truth-seeking one',
      },
      {
        bias: 'Optimism Bias',
        case: 'Boeing 737 MAX certification (2018)',
        whatItDid:
          'cost + timeline projections systematically underweighted the tail — the debt-service model that only works in the best case',
      },
      {
        bias: 'Inside-View Dominance',
        case: 'Daimler-Chrysler merger (1998)',
        whatItDid:
          'the operating thesis assumed "I can modernise this legacy business easily" against a reference class that says first-time operators usually cannot',
      },
    ],
  },
  {
    id: 'serial_acquirer',
    label: 'Serial acquirer / roll-up operator',
    band: 'Buy-and-build under one platform · repeated acquisition theses · continuous deal flow',
    industries: ['technology', 'financial_services', 'manufacturing', 'healthcare', 'retail'],
    selfArticulatedPain:
      "I run a buy-and-build — repeated acquisition theses under one platform. The risk isn't any single deal; it's that my proven playbook stops fitting a target that's structurally different, and I apply it anyway because it worked the last ten times.",
    canonicalBiasHooks: [
      {
        bias: 'Inside-View Dominance',
        case: 'GE–Alstom power acquisition (2015)',
        whatItDid:
          'the seasoned deal machine applied its proven roll-up playbook to a target the reference class flagged as different — "we have integrated a hundred of these" overrode "this one is not those"',
      },
      {
        bias: 'Overconfidence',
        case: 'AOL-Time Warner merger (2000)',
        whatItDid: 'synergy estimates assumed convergence economics that were already breaking',
      },
      {
        bias: 'Anchoring Bias',
        case: 'Nokia smartphone strategy (2007-2010)',
        whatItDid:
          "anchored on the prior platform's economics instead of the market that was actually forming",
      },
    ],
  },
];

// ============================================================================
// DM_TEMPLATES — verbatim cold-context drafts (CLAUDE.md cold-context rule)
// ============================================================================

export const DM_TEMPLATES: DmTemplate[] = [
  {
    personaId: 'independent_sponsor',
    opener:
      "Hi {name} — saw you're {raising on / closing} a {sector} deal. I built a tool that runs a deal memo through a reasoning audit (Kahneman / Klein based) and flags the one assumption most likely to blow up in diligence, or scare off a capital partner, before they see it. Happy to run it free on a live memo of yours and just send you what it catches. No pitch, no logo on it, yours to keep. Worth a look?",
    curiosityReply:
      "Easiest path: send me your current deal memo (redacted / anonymised is totally fine), or paste it at decision-intel.com/demo. In ~60 seconds you get back the top cognitive biases showing up in the reasoning with the exact lines, a Decision Quality score (think FICO, for the decision), the reference-class base rate for deals like this (the outside view), and the single highest-priority thing to fix before you take it to capital partners. Free, yours to keep, unbranded. If it's useful we can talk; if not, you've lost 20 minutes.",
    discoveryAsk:
      "Before I run it, quick 15 min? Not a pitch — Mom-Test, I just want your world: tell me about the last deal you walked away from, or wish you had, and what your diligence almost missed. And when a deal goes sideways after you've raised the equity, what does that cost you with those backers next time you raise? Then I'll run the audit on your live deal and show you one thing you'd have missed.",
    introducerFollowUp:
      "Glad that was useful. Quick ask — who's one other sponsor or searcher you respect who's mid-deal right now? I'll run the same free audit on their memo and surface one thing they'd have missed. Easy intro if you're up for it: \"Been using this to pressure-test my deal reasoning before I take it to capital partners — it caught a flaw I'd have missed. Worth 15 minutes, want an intro?\"",
  },
  {
    personaId: 'self_funded_searcher',
    opener:
      "Hi {name} — saw you're searching in {sector}. I built a tool that runs a deal memo through a reasoning audit (Kahneman / Klein based) and flags the one assumption most likely to blow up in diligence, before you sign a loan you personally guarantee. Happy to run it free on a live memo of yours and just send you what it catches. No pitch, yours to keep. Worth a look?",
    curiosityReply:
      "Easiest path: send me your current deal memo (redacted is fine), or paste it at decision-intel.com/demo. In ~60 seconds you get back the cognitive biases in the reasoning with the exact lines, a Decision Quality score (think FICO, for the decision), the reference-class base rate for deals like this, and the single highest-priority thing to fix before you take it to your lender or co-investors. Free, yours to keep — it also makes you look institutional to the people you're borrowing from, without the team a fund has.",
    discoveryAsk:
      "Quick 15 min before I run it? Not a pitch — I just want to hear about the last deal you walked away from, or wish you had, and what your diligence almost missed. Then I'll run the audit on your live thesis and show you one thing you'd have missed. The one that scares you most is usually the one you'd already fallen in love with.",
    introducerFollowUp:
      "Glad that was useful. Quick ask — who's one other searcher or sponsor you respect who's mid-deal right now? I'll run the same free audit on their memo and surface one thing they'd have missed. Easy intro: \"Been using this to pressure-test my deal reasoning before I sign — it caught a flaw I'd have missed. Worth 15 minutes, want an intro?\"",
  },
  {
    personaId: 'serial_acquirer',
    opener:
      "Hi {name} — saw the buy-and-build you're running in {sector}. I built a tool that runs each acquisition thesis through a reasoning audit (Kahneman / Klein based) and flags where your proven playbook stops fitting a target that's structurally different, before you've committed. Happy to run it free on a live deal memo. No pitch, yours to keep. Worth a look?",
    curiosityReply:
      'Easiest path: send me a live deal memo or even an early teaser / CIM, or paste it at decision-intel.com/demo. You get back a fast read — the cognitive biases in the reasoning with the exact lines, a Decision Quality score (think FICO, for the decision), the reference-class base rate, and the highest-priority thing to fix. Across repeated deals it becomes a screening triage: a quick Go / No-Go before you spend on diligence. Free, yours to keep.',
    discoveryAsk:
      "Quick 15 min? Not a pitch — I want to hear how a thesis moves from teaser to committed in your shop, and the deal where the playbook that worked ten times didn't fit the eleventh. Then I'll run the audit on a live one and show you one thing it flags. The risk is never one deal; it's applying the proven playbook to the target that's structurally different.",
    introducerFollowUp:
      'Glad that was useful. Quick ask — who\'s one other operator running a buy-and-build, or a sponsor / searcher mid-deal, who I should run this for free? Easy intro: "Been using this as a standing check on every acquisition thesis — it caught a flaw I\'d have missed. Worth 15 minutes, want an intro?"',
  },
];

// ============================================================================
// ACTION_CADENCE — daily / weekly / pre-event prep arc
// ============================================================================

export const ACTION_CADENCE = {
  /** 5-10 personalised DMs/week (Searchfunder + LinkedIn) to the ETA wedge. */
  weeklyDmTarget: { min: 5, max: 10 },
  /** 1-1-1 traffic-source discipline cap on in-person events (online is the daily motion). */
  monthlyEventCap: 2,
  /** Referral / follow-up after a win — keep it short. */
  followUpToIntroducerLines: 4,
  /**
   * The 90-day funnel math (the Execution Kit). The LEADING indicator to watch
   * weekly is freeAuditsRunning — that, not demos, predicts revenue 4-6 weeks
   * out. Rule: every working day produces at least one new real conversation
   * with a sponsor or searcher.
   */
  funnel: {
    conversations: 40, // real chats with the ICP
    freeAuditsRunning: 15, // on their LIVE memos — the leading indicator
    closes: 5, // ~10-12% of conversations
    referralRule: 'ask at every win, right after a real finding lands (the aha moment)',
  },
  /**
   * The ONLINE channels — the primary daily motion. The in-person rooms in
   * EVENTS are the periodic, replaceable layer. Ranked by leverage for a
   * no-warm-intros founder (the Execution Kit channel priority).
   */
  onlineChannels: [
    {
      rank: 1,
      channel: 'Searchfunder.com',
      firstAction:
        'Join free; complete a credible profile; DM ~5 active searchers/sponsors a week; answer questions in threads. Densest online channel, ~10k members.',
      cadence: 'this week, then daily',
    },
    {
      rank: 2,
      channel: 'LinkedIn',
      firstAction:
        'Value-first DMs to UK ETA / sponsors (LBS ETA Club, Gerald Edelman network, Orca). Post 2x/week — a teardown of a famous failed deal run through the audit.',
      cadence: 'daily',
    },
    {
      rank: 3,
      channel: 'UK ETA podcast (Found & Funded)',
      firstAction:
        'Pitch yourself as a guest doing a live "reasoning teardown" of an anonymised deal memo — winner\'s curse, management halo, inside-view dominance. Cheap, warm credibility with exactly this community.',
      cadence: 'pitch once, high ROI',
    },
  ],
  /** The 90-day plan (the Execution Kit) — weeks, not an event countdown. */
  ninetyDayPlan: [
    {
      weeks: '1-2',
      focus:
        'Set the table: join Searchfunder + credible profile; build a list of 40 named sponsors/searchers; post one credibility teardown; register for / pitch one ETA event + one podcast.',
    },
    {
      weeks: '3-6',
      focus:
        'Conversations to free audits: 15-20 outreach touches/week; run the free live-deal audit for anyone who sends a memo; Mom-Test discovery first, pitch second; sign the first 1-2 founding members.',
    },
    {
      weeks: '7-10',
      focus:
        'Close + start the flywheel: close toward 5 paying; ask every happy user for one referral at the aha moment; turn the best result into an anonymised case study.',
    },
    {
      weeks: '11-13',
      focus:
        'Tighten + compound: write down which message / channel / objection worked; double down on the one channel that produced the most audits; line up the next 10 from referrals.',
    },
  ],
  /** Pre-event prep arc by week for an in-person ETA room (RollUpEurope / LBS / GE / IESE). */
  prepArc: [
    {
      weeksBeforeEvent: 6,
      action:
        'Pull the attendee / member list (Searchfunder surfaces many). Filter to the 3 ETA wedge personas. Target 20-30 names.',
    },
    {
      weeksBeforeEvent: 5,
      action: 'Match each name to sector → canonical bias hook from the 143-case library.',
    },
    {
      weeksBeforeEvent: 4,
      action:
        'Send first wave of ~10 DMs (highest-priority names). Lead with the FREE live-deal audit, edit per-prospect.',
    },
    {
      weeksBeforeEvent: 3,
      action:
        'Send second wave of ~10 DMs. Track replies. Convert to free audits on live memos (the leading indicator).',
    },
    {
      weeksBeforeEvent: 2,
      action:
        'Run the discovery calls (Mom-Test). Learn what the prospect cares about; pitch second. Capture quotes.',
    },
    {
      weeksBeforeEvent: 1,
      action:
        "Pre-book 5+ 1:1 coffees at the event. Send a pin: 'Coffee at {venue}, {time}. Bring a live deal memo, I'll run the audit and surface one thing you'd have missed.'",
    },
    {
      weeksBeforeEvent: 0,
      action:
        'Run the room. Live-audit memos at the coffees. Ask for a referral at the aha moment. Same-day follow-up with the audit + a referral ask.',
    },
  ],
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Days until an event (negative = event has passed).
 * Used by EventPrepCard to render the countdown chip.
 */
export function daysUntil(event: PrepEvent, today: Date = new Date()): number {
  const start = new Date(event.startDate);
  const ms = start.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Whether the event's LAST day is in the past — keyed on endDate, not
 * startDate. This is the correct "is this event still relevant?" test for a
 * MULTI-DAY event: daysUntil() keys off startDate, so on day 2 of a 2-day
 * conference daysUntil is already negative even though the event is still
 * running. The selectors below filter on this so a live multi-day event
 * (e.g. Strategy World London, Jun 9-10) doesn't vanish on its second day.
 * Mirrors daysUntil's ceil semantics: 0 on the final day, negative once past.
 */
export function hasEventEnded(event: PrepEvent, today: Date = new Date()): boolean {
  const end = new Date(event.endDate);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) < 0;
}

/**
 * Human countdown label that handles the in-progress case. Because daysUntil()
 * keys off startDate, a running multi-day event has daysUntil <= 0 — so a naive
 * `days < 0 ? 'Past'` mislabels a live event. Use this everywhere a countdown
 * chip is rendered so the label reads "Happening now" during the event.
 */
export function formatEventCountdown(event: PrepEvent, today: Date = new Date()): string {
  if (hasEventEnded(event, today)) return 'Past';
  const days = daysUntil(event, today);
  if (days <= 0) return 'Happening now';
  if (days === 1) return 'Tomorrow';
  return `${days} days away`;
}

/**
 * Returns the next event that has not yet ended (running OR upcoming). Returns
 * null when the calendar is empty or all events have passed. A currently-running
 * event sorts first (its startDate-based daysUntil is <= 0, i.e. most proximate).
 */
export function getNextEvent(today: Date = new Date()): PrepEvent | null {
  const upcoming = EVENTS.filter(e => !hasEventEnded(e, today)).sort(
    (a, b) => daysUntil(a, today) - daysUntil(b, today)
  );
  return upcoming[0] ?? null;
}

/**
 * Returns the highest-priority not-yet-ended event ('highest' before 'high'
 * before 'medium', tie-broken by date proximity). Includes events that are
 * currently running (not just future-dated ones).
 */
export function getHighestPriorityUpcomingEvent(
  today: Date = new Date(),
  // Injectable so the selection logic can be locked against a synthetic
  // calendar, independently of the date-rotating real EVENTS (which no
  // longer carries a multi-day 'highest' event post the 2026-06-26 ETA
  // pivot). All real callers pass 0-or-1 args; the default preserves them.
  events: readonly PrepEvent[] = EVENTS
): PrepEvent | null {
  const upcoming = events.filter(e => !hasEventEnded(e, today));
  if (upcoming.length === 0) return null;
  const priorityWeight: Record<PrepEvent['priority'], number> = {
    highest: 3,
    high: 2,
    medium: 1,
  };
  return upcoming.sort((a, b) => {
    const dp = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (dp !== 0) return dp;
    return daysUntil(a, today) - daysUntil(b, today);
  })[0];
}

/**
 * Resolve persona by id. Returns null when id doesn't match (the union type
 * makes this rare but we keep the runtime guard for future extensions).
 */
export function getPersona(id: WedgePersonaId): WedgePersona | null {
  return WEDGE_PERSONAS.find(p => p.id === id) ?? null;
}

export function getDmTemplate(personaId: WedgePersonaId): DmTemplate | null {
  return DM_TEMPLATES.find(t => t.personaId === personaId) ?? null;
}
