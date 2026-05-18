/**
 * Event prep — Phase 1 wedge calendar + 4-persona DM scaffolding.
 *
 * Locked 2026-05-05 (deep nightly audit Section 9.1). Strategy World London
 * (June 9-10 BAFTA) is the v3.5 §2 calendar-gated forcing function: "the
 * single highest-signal CSO event. Should not be missed." Phase 1 acquisition
 * mix (CLAUDE.md GTM Phase 1 wedge block) targets 5-10 personalised LinkedIn
 * DMs/week to the 4 wedge personas + 2 London events/month maximum (Sharran
 * 1-1-1 traffic-source discipline).
 *
 * What this module provides:
 *   1. EVENTS — the 5 v3.5-named London events with countdown-aware metadata
 *   2. WEDGE_PERSONAS — 4 Phase 1 buyer-class-continuous personas with
 *      industry hints + canonical 143-case bias references
 *   3. DM_TEMPLATES — verbatim cold-context drafts the founder edits, NOT
 *      R²F / DPR / DQI vocabulary (cold context per CLAUDE.md)
 *   4. INDUSTRY_BIAS_CROSSWALK — which case-study bias to lead with for
 *      each industry the persona works in
 *   5. ACTION_CADENCE — 5-10 DMs/week + 4-line follow-up cadence + 35-day
 *      pre-event prep arc
 *
 * Why this lives at /lib/data: the event-prep card on Founder OS reads from
 * here, and any future surface (chat coaching, outreach hub, weekly digest)
 * can compose against the same SSOT without duplicating persona + DM copy.
 *
 * Update HERE when (a) the event lineup shifts (new London event lands or
 * one cancels), (b) the 4 wedge personas change (per CLAUDE.md ICP lock),
 * (c) DM templates fall flat in the wild and the founder rewrites them.
 *
 * Vocabulary discipline (CLAUDE.md cold-context rule):
 *   - DM templates use plain language: "60-second audit", "strategic memo",
 *     "blind spots", "audit committee questions" — NEVER "DPR", "R²F",
 *     "Decision Quality Index", "reasoning audit platform" on first DM.
 *   - The bridge sentence ("audit your reasoning before the room does")
 *     is allowed once the prospect replies; not in the opener.
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
  /** Which of the 4 wedge personas this event is densest in. */
  primaryPersonas: WedgePersonaId[];
  /**
   * The pre-event prep arc start — number of weeks before the event when
   * outreach should begin. Highest-signal attendees book 4-6 weeks ahead.
   */
  prepArcWeeks: number;
  /** One-line rationale for why this event makes the cut. */
  rationale: string;
}

export type WedgePersonaId =
  | 'fractional_cso'
  | 'midmarket_corp_dev'
  | 'smaller_fund_gp'
  | 'pe_backed_founder';

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

export const EVENTS: PrepEvent[] = [
  {
    id: 'strategy_world_london_2026',
    name: 'Strategy World London',
    startDate: '2026-06-09',
    endDate: '2026-06-10',
    venue: 'BAFTA, 195 Piccadilly',
    priority: 'highest',
    primaryPersonas: ['fractional_cso', 'midmarket_corp_dev'],
    prepArcWeeks: 6,
    rationale:
      'v3.5 §2 lock: the single highest-signal CSO event. Pre-book 5+ 1:1 coffees with target-persona attendees, NOT booth + waiting. Each conversation = 20-min audit on a real strategic memo.',
  },
  {
    id: 'ai_in_business_2026_05_14',
    name: 'AI in Business Conference',
    startDate: '2026-05-14',
    endDate: '2026-05-14',
    venue: 'Prospero House, Borough',
    priority: 'high',
    primaryPersonas: ['fractional_cso'],
    prepArcWeeks: 3,
    rationale:
      'High-signal for fractional CSOs and mid-market Heads of Strategic Planning. Position the audit as the rigour layer their AI-assisted memos already need.',
  },
  {
    id: 'responsible_ai_2026_06_23',
    name: 'Responsible AI Conference',
    startDate: '2026-06-23',
    endDate: '2026-06-23',
    venue: 'London (TBC)',
    priority: 'high',
    primaryPersonas: ['fractional_cso', 'midmarket_corp_dev'],
    prepArcWeeks: 4,
    rationale:
      'Regulatory tailwinds audience (EU AI Act Aug 2026 enforcement). Discovery-FIRST motion; pivot to "audit committee evidence record" framing if the conversation surfaces a procurement-stage prospect.',
  },
  {
    id: 'momentum_ai_2026_06_29',
    name: 'Momentum AI',
    startDate: '2026-06-29',
    endDate: '2026-06-30',
    venue: 'London (TBC)',
    priority: 'high',
    primaryPersonas: ['midmarket_corp_dev', 'smaller_fund_gp'],
    prepArcWeeks: 4,
    rationale: 'M&A + fund partner density. Lead with the cross-border regulatory mapping pitch.',
  },
  {
    id: 'ai_summit_london_2026_06_10',
    name: 'AI Summit London',
    startDate: '2026-06-10',
    endDate: '2026-06-11',
    venue: 'ExCeL London, E16',
    priority: 'medium',
    primaryPersonas: ['midmarket_corp_dev', 'pe_backed_founder'],
    prepArcWeeks: 4,
    rationale:
      'Lower signal-per-conversation than Strategy World London (overlapping date) but high volume. Use only if you can run BOTH events without breaking the 1-1-1 traffic-source discipline.',
  },
];

// ============================================================================
// WEDGE_PERSONAS — the 4 Phase 1 buyer-class-continuous personas
// ============================================================================

export const WEDGE_PERSONAS: WedgePersona[] = [
  {
    id: 'fractional_cso',
    label: 'Fractional CSO',
    band: '3-5 client engagements · regular memo flow',
    industries: ['technology', 'financial_services', 'manufacturing', 'retail', 'healthcare'],
    selfArticulatedPain:
      'I write 4-6 strategic memos a month across 3-5 clients. Each client expects board-grade rigour. I do this alone. The memos that go sideways are the ones where I missed something obvious in retrospect — and I never see it until the client tells me.',
    canonicalBiasHooks: [
      {
        bias: 'Confirmation Bias',
        case: 'Kodak digital photography exit (1989)',
        whatItDid:
          'leadership filtered every market signal through the existing-film-business lens',
      },
      {
        bias: 'Sunk-Cost Fallacy',
        case: 'Blockbuster declining the Netflix acquisition (2000)',
        whatItDid: 'protected the in-store rental investment instead of the strategic option',
      },
      {
        bias: 'Anchoring Bias',
        case: 'Nokia smartphone strategy (2007-2010)',
        whatItDid:
          'anchored on Symbian dominance instead of the iPhone-shaped market that was forming',
      },
    ],
  },
  {
    id: 'midmarket_corp_dev',
    label: 'Head of Corporate Development / M&A (mid-market)',
    band: '$50M-$500M revenue scale-up · personal-decisive budget',
    industries: ['technology', 'financial_services', 'manufacturing', 'healthcare'],
    selfArticulatedPain:
      "I run 6-8 live deal threads at any time. IC every Thursday. The memos that get killed in IC are the ones with a blind spot we should have caught — confirmation bias on the management team, anchoring on the seller's price, narrative coherence that doesn't survive the CFO's first counterfactual.",
    canonicalBiasHooks: [
      {
        bias: 'Illusion of Validity',
        case: 'WeWork S-1 (2019)',
        whatItDid:
          'narrative coherence created false confidence; the metrics were aestheticised, not anchored to base rates',
      },
      {
        bias: 'Inside-View Dominance',
        case: 'Daimler-Chrysler merger (1998)',
        whatItDid:
          'projections rejected reference-class data on cross-cultural automotive mergers — "this case is special"',
      },
      {
        bias: 'Overconfidence',
        case: 'AOL-Time Warner merger (2000)',
        whatItDid: 'synergy estimates assumed convergence economics that were already breaking',
      },
      {
        bias: 'Inside-View Dominance',
        case: 'GE–Alstom power acquisition (2015)',
        whatItDid:
          'the seasoned deal machine applied its proven roll-up playbook to a target the reference class flagged as structurally different — "we have integrated a hundred of these" overrode "this one is not those"',
      },
    ],
  },
  {
    id: 'smaller_fund_gp',
    label: 'GP / principal at smaller fund',
    band: '£5M-£100M AUM · active deal flow OR LP-governance pressure',
    industries: ['technology', 'financial_services', 'healthcare', 'retail'],
    selfArticulatedPain:
      "Every deal I write up goes to my LPs as part of the quarterly letter. When a deal goes wrong, the LPs don't ask whether I had bad luck — they ask whether the IC memo flagged the risk and the team ignored it, or whether we never saw it. I can't always tell which is which from my own notes.",
    canonicalBiasHooks: [
      {
        bias: 'Halo Effect',
        case: 'Theranos investor decisions (2014-2016)',
        whatItDid:
          'positive signal on founder credentials propagated unchallenged through every diligence dimension',
      },
      {
        bias: 'Authority Bias',
        case: 'FTX investor decisions (2021-2022)',
        whatItDid:
          "Tier-1 backers' presence overruled standard governance + financial-controls due diligence",
      },
      {
        bias: 'Planning Fallacy',
        case: 'Quibi launch (2020)',
        whatItDid:
          'go-to-market timeline assumed best-case adoption curves; reference class on streaming launches was ignored',
      },
    ],
  },
  {
    id: 'pe_backed_founder',
    label: 'PE-backed mid-market CEO / founder',
    band: 'Personal-decisive budget · operating under PE governance cadence',
    industries: ['technology', 'manufacturing', 'healthcare', 'retail', 'financial_services'],
    selfArticulatedPain:
      "Every quarter I present to a PE board that asks two questions I can predict and one I can't. The unpredictable question is always rooted in something I already wrote in the memo but framed in a way that made the risk look smaller than it was. I want that question caught at draft time, not in the boardroom.",
    canonicalBiasHooks: [
      {
        bias: 'Optimism Bias',
        case: 'Boeing 737 MAX certification (2018)',
        whatItDid:
          'cost + timeline projections systematically underweighted catastrophic-tail risk',
      },
      {
        bias: 'Loss Aversion (mis-framed)',
        case: 'Long-Term Capital Management (1998)',
        whatItDid:
          'positions framed as defending existing returns instead of evaluated as fresh allocations on current data',
      },
      {
        bias: 'Status Quo Bias',
        case: 'Sears retail strategy (2005-2018)',
        whatItDid:
          'capital allocation defended the legacy footprint past the point where reference-class retailers had pivoted',
      },
    ],
  },
];

// ============================================================================
// DM_TEMPLATES — verbatim cold-context drafts (CLAUDE.md cold-context rule)
// ============================================================================

export const DM_TEMPLATES: DmTemplate[] = [
  {
    personaId: 'fractional_cso',
    opener:
      "Hi {name} — saw your post on {topic}. Quick context: I've been auditing strategic memos for the same blind spots that killed Kodak's digital exit and Blockbuster's Netflix decision — confirmation, sunk-cost, anchoring. The pattern is identical across industries; only the surface details change. Happy to run a 60-second audit on your next client memo if useful (no slides, no pitch). Just paste the memo, get back a list of biases the audit committee will catch first.",
    curiosityReply:
      "Sure — easiest path: paste the memo at decision-intel.com (no login needed for the first one). You'll get back a structured audit in under a minute: biases flagged with confidence scores, the questions a sceptical reviewer would ask, and the passages where the reasoning gets thin. If anything in the audit lands hard, I'd love a 20-min call to compare notes — what looked obvious from the outside vs. what you saw at draft time.",
    discoveryAsk:
      "Want to do a 20-min call this week or next? No agenda from my side. I'll ask 4 questions about how strategic memos move from draft to client review at your firm — workflow questions, not sales questions. If anything I learn maps onto something the audit can fix at draft time, I'll show you; if not, I'll send you the closest historical cases I have on file for your blind spots.",
    introducerFollowUp:
      'Hi {introducer} — quick note that {prospect} and I had a great 20-min on {date}. Came out of it with {one-specific-insight}. Genuinely useful for both sides. Will keep you posted as the conversation develops; if {prospect} mentions us back to you, the framing they responded to was {framing}. Thanks again for the bridge.',
  },
  {
    personaId: 'midmarket_corp_dev',
    opener:
      "Hi {name} — congrats on the {recent-deal-or-thread}. Quick reason for the DM: I've been auditing IC memos for the bias patterns that killed WeWork's IPO and the Daimler-Chrysler merger — narrative coherence that doesn't survive the CFO's first counterfactual, inside-view projections that ignore reference-class base rates. Happy to run a 60-second audit on your next IC memo (free, no slides, no pitch). Paste it at decision-intel.com; you'll get back the questions IC will ask first, before they catch them.",
    curiosityReply:
      "Easiest path: paste the IC memo at decision-intel.com — first audit is free. You'll get back a structured artefact: bias-by-bias confidence scores, the cross-document conflicts (deal terms vs. management projections), the structural assumptions a sceptical CFO would pressure-test. If you'd rather see the WeWork audit first as a calibration point, here's the link {link to /demo or DPR sample}.",
    discoveryAsk:
      "Want to compare notes for 20 min? I'll ask 4 questions about how memos move from draft to IC at your firm — pre-IC review patterns, who catches what when, the post-mortems that landed. If the audit can compress that loop, I'll show you on a real recent deal (anonymised, your call). If not, I'll send you the 3 historical cases closest to your active threads.",
    introducerFollowUp:
      "Hi {introducer} — wanted to close the loop: {prospect} and I had a substantive 20-min on {date}. The audit lands hardest for them around {pain-they-articulated}. Sending them the {WeWork or Dangote} DPR specimen as the next artefact. Will keep you posted on whether they pilot. If you have one more name in the {industry} space who's running into the same memo-quality friction, I'd value the intro.",
  },
  {
    personaId: 'smaller_fund_gp',
    opener:
      "Hi {name} — saw your {recent-LP-letter or deal-thread}. Quick context: the bias patterns that killed Theranos and FTX investor decisions — halo effect, authority bias from Tier-1 backer presence — are detectable at draft time, not just in retrospect. I've been auditing IC memos for them for a few months. Happy to run a 60-second audit on your next memo, free, no slides, no pitch. The framing isn't 'here's a tool' — it's 'here's what your LPs will ask first when something goes sideways, before they ask.'",
    curiosityReply:
      'Easiest path: paste the IC memo at decision-intel.com — first audit is free. The artefact you get back is the kind of structured evidence record an LP audit committee asks for: bias-by-bias confidence scores, the cross-document conflicts, the structural assumptions a sceptical LP would pressure-test. Useful as a pre-IC checklist or as the cover-page of the LP quarterly.',
    discoveryAsk:
      "Want to do 20 min this week or next? Discovery, not pitch. I'll ask 4 questions about how IC memos move from draft to LP-letter at your firm — what your LPs ask post-mortem when a deal goes wrong, who catches what at draft time, the calibration loops you've already built. If the audit compresses any of that, I'll show you on a real recent decision (anonymised). If not, I'll send the 3 historical cases closest to your portfolio.",
    introducerFollowUp:
      "Hi {introducer} — closing the loop: {prospect} and I had a useful 20-min on {date}. Their LP-letter quality is the angle that landed hardest. Sending them the audit on {anonymised-recent-deal-they-shared} as the next artefact. Will keep you posted. If there's one more GP in the {region/sector} space running into the same LP-questioning friction, I'd value the bridge.",
  },
  {
    personaId: 'pe_backed_founder',
    opener:
      "Hi {name} — saw the {recent-quarterly-or-news}. Quick context: I've been auditing strategy memos for the bias patterns that landed Boeing's 737 MAX timeline + LTCM's allocation decisions — optimism bias on cost / timeline, loss aversion in mis-framing positions as defending existing returns. Each of those was visible at draft time. Happy to run a 60-second audit on your next board memo, free, no slides, no pitch. Paste it at decision-intel.com; the artefact comes back with the questions your PE board will ask first.",
    curiosityReply:
      "Easiest path: paste the memo at decision-intel.com — first audit is free. You'll get back a structured evidence record: bias-by-bias confidence scores, the structural assumptions a sceptical PE chair would pressure-test, the audit-committee-grade questions surfaced as a pre-flight checklist. Useful as the cover page of any quarterly board pack.",
    discoveryAsk:
      "Want 20 min this week or next? Discovery, not pitch. I'll ask 4 questions about how strategy memos move from draft to PE board at your firm — the question patterns your chair surfaces, the post-mortems that landed, the questions you wish you'd anticipated. If the audit can fix any of that at draft time, I'll show you. If not, I'll send the 3 historical cases closest to your operating model.",
    introducerFollowUp:
      "Hi {introducer} — quick close-the-loop: {prospect} and I had a substantive 20-min on {date}. The framing that landed hardest was {framing}. Sending them the audit on {anonymised-recent-strategy-memo} as the next artefact. Will keep you posted. If there's one more PE-backed founder in your network running the same board-memo cadence, I'd value the bridge.",
  },
];

// ============================================================================
// ACTION_CADENCE — daily / weekly / pre-event prep arc
// ============================================================================

export const ACTION_CADENCE = {
  /** CLAUDE.md GTM Phase 1 wedge: 5-10 personalised LinkedIn DMs/week. */
  weeklyDmTarget: { min: 5, max: 10 },
  /** Sharran 1-1-1 traffic-source discipline cap (CLAUDE.md). */
  monthlyEventCap: 2,
  /** Mr. Reiner / Mr. Gabe warm-intro discipline (CLAUDE.md). */
  followUpToIntroducerLines: 4,
  /** Pre-event prep arc by week (highest-priority event = Strategy World London). */
  prepArc: [
    {
      weeksBeforeEvent: 6,
      action:
        'Pull the published attendee list. Filter to the 4 wedge personas. Target 20-30 names.',
    },
    {
      weeksBeforeEvent: 5,
      action: 'Match each name to industry → canonical bias hook from the 143-case library.',
    },
    {
      weeksBeforeEvent: 4,
      action:
        'Send first wave of 10 DMs (highest-priority names). Use opener template, edit per-prospect.',
    },
    {
      weeksBeforeEvent: 3,
      action: 'Send second wave of 10 DMs. Track replies. Convert 3-5 to 20-min discovery calls.',
    },
    {
      weeksBeforeEvent: 2,
      action:
        'Run the discovery calls. Learn what the prospect cares about; do NOT pitch yet. Capture quotes.',
    },
    {
      weeksBeforeEvent: 1,
      action:
        "Pre-book 5+ 1:1 coffees at the event. Send a calendar pin: 'Coffee at {venue}, {time}. Will run a live audit on a memo you bring.'",
    },
    {
      weeksBeforeEvent: 0,
      action:
        'Run the event. Live-audit memos at the coffees. Follow-up email same day with the audit artefact + 4-line note.',
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
 * Returns the next upcoming event (start date >= today). Returns null when
 * the calendar is empty or all events have passed.
 */
export function getNextEvent(today: Date = new Date()): PrepEvent | null {
  const upcoming = EVENTS.filter(e => daysUntil(e, today) >= 0).sort(
    (a, b) => daysUntil(a, today) - daysUntil(b, today)
  );
  return upcoming[0] ?? null;
}

/**
 * Returns the highest-priority upcoming event ('highest' before 'high'
 * before 'medium', tie-broken by date proximity).
 */
export function getHighestPriorityUpcomingEvent(today: Date = new Date()): PrepEvent | null {
  const upcoming = EVENTS.filter(e => daysUntil(e, today) >= 0);
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
