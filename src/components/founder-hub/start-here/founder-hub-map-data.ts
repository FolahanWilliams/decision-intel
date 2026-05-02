/**
 * Founder Hub map — node positions, edges, journey paths.
 *
 * Source of truth for the dynamic Start Here landing page (locked
 * 2026-04-28). The 2-day study plan that previously shipped here was a
 * great learning track but it dictated ONE path through the hub. This
 * map flips that posture: the founder picks WHAT they're doing right
 * now (preparing a pitch / researching / executing outreach / etc.)
 * and the map highlights the recommended sequence + every tab's
 * relationship to every other.
 *
 * Update rules:
 *  • Adding a tab → add it to NODES with normalized (x, y) coordinates
 *    and prerequisites. The map auto-renders it.
 *  • Renaming a tab → edit only the `label` here; the existing
 *    persistence key uses tabId so progress carries.
 *  • Adding a new journey → push a JOURNEYS entry. The path is an
 *    ordered TabId array; the map highlights the sequence with
 *    numbered overlays.
 *  • Edges are LOGICAL connections that justify a journey ordering;
 *    they're rendered as Bezier curves on the canvas. Don't add a
 *    decorative edge unless it represents a real prerequisite or
 *    flow handoff.
 */

export type TabId =
  | 'unicorn_roadmap'
  | 'path_to_100m'
  | 'overview'
  | 'product_deep'
  | 'research'
  | 'positioning_copilot'
  | 'positioning'
  | 'sales'
  | 'closing_lab'
  | 'sparring_room'
  | 'education_room'
  | 'outreach_hub'
  | 'category_position'
  | 'lrqa'
  | 'content'
  | 'data_ecosystem'
  | 'case_library'
  | 'todo'
  | 'meetings_log'
  | 'forecast'
  | 'founder_tips'
  | 'founder_school'
  | 'cron_controls';

export type TabGroup = 'Start' | 'Product' | 'Go-to-Market' | 'Intelligence' | 'Tools';

export interface MapNode {
  id: TabId;
  label: string;
  group: TabGroup;
  /** Position in normalized 0-1 space; the renderer scales to viewport. */
  x: number;
  y: number;
  /** One-line summary of what this tab is for. Hover tooltip. */
  whatItsFor: string;
  /** Why a founder visits this tab — concrete payoff. */
  payoff: string;
  /** Roughly how long it takes to extract value from a fresh visit, in minutes. */
  minutes: number;
  /**
   * Tabs the founder gets more value from AFTER visiting these. Drives
   * the "you're missing context — visit X first" hint when a node is
   * clicked from a journey that starts elsewhere.
   */
  prerequisites: TabId[];
  /** Lucide icon name — string so the data file stays JSX-free. */
  iconName: string;
}

export interface MapEdge {
  from: TabId;
  to: TabId;
  /** Why this connection exists — shown in the hover tooltip on the edge. */
  rationale: string;
  /** Primary edges render solid; secondary render as dashed lines. */
  strength: 'primary' | 'secondary';
}

export interface Journey {
  id: 'pitch' | 'research' | 'outreach' | 'reflect' | 'product';
  label: string;
  description: string;
  /** What you'll have done by the end. */
  outcome: string;
  /** Ordered sequence of tabs to visit. */
  path: TabId[];
  /** Approximate total minutes if visiting all path nodes. */
  totalMinutes: number;
  /** Accent color for the journey overlay. */
  color: string;
}

// ─── NODES ──────────────────────────────────────────────────────────
//
// Layout grid (5 columns by TabGroup, vertical stacking within column).
// Coordinates are 0-1; the SVG renderer multiplies by viewport. Tweaks
// here ripple to the visualization without code edits.
//
// Column x-anchors:
//   Start:        0.07
//   Product:      0.27
//   Go-to-Market: 0.50  (densest, 7 nodes)
//   Intelligence: 0.73
//   Tools:        0.92

export const NODES: MapNode[] = [
  // ─── Start (3) ─────────────────────────────────────────────────────
  {
    id: 'unicorn_roadmap',
    label: 'Unicorn Roadmap',
    group: 'Start',
    x: 0.07,
    y: 0.28,
    whatItsFor:
      'The 2026→2030 roadmap from pre-seed to IPO with conditional probabilities at each phase.',
    payoff: 'Honest probability path, hard-truth risks, named tripwires per phase.',
    minutes: 15,
    prerequisites: [],
    iconName: 'Target',
  },
  {
    id: 'path_to_100m',
    label: 'Path to £100M Exits',
    group: 'Start',
    x: 0.07,
    y: 0.62,
    whatItsFor:
      'Strategic compass + per-role outreach playbooks (8 personas) + R²F moat-deepening levers.',
    payoff:
      '90-day plan, 16 investor metrics tracker, warm-intro network map, NotebookLM follow-ups.',
    minutes: 40,
    prerequisites: ['unicorn_roadmap'],
    iconName: 'Compass',
  },

  // ─── Product (3) ───────────────────────────────────────────────────
  {
    id: 'overview',
    label: 'Product Overview',
    group: 'Product',
    x: 0.27,
    y: 0.18,
    whatItsFor:
      'The four-moments narrative + locked vocabulary + Decision Knowledge Graph framing.',
    payoff: 'You can pitch the product in 60 seconds without reaching for notes.',
    minutes: 12,
    prerequisites: [],
    iconName: 'Rocket',
  },
  {
    id: 'product_deep',
    label: 'Pipeline & Scoring',
    group: 'Product',
    x: 0.27,
    y: 0.5,
    whatItsFor:
      '12-node LangGraph pipeline, scoring engine with toxic-combination detection, DQI methodology.',
    payoff: 'Technical depth for a CTO call. Scoring weights, calibration, the 20×20 matrix.',
    minutes: 30,
    prerequisites: ['overview'],
    iconName: 'Brain',
  },
  {
    id: 'research',
    label: 'Research & Foundations',
    group: 'Product',
    x: 0.27,
    y: 0.82,
    whatItsFor:
      '37-thinker constellation: Kahneman, Klein, Sibony, Tetlock, Strebulaev, and 32 others.',
    payoff: 'Anchors the IP claim. The Noise moment alone is a Monday-morning sales line.',
    minutes: 25,
    prerequisites: ['overview'],
    iconName: 'BookOpen',
  },

  // ─── Go-to-Market (10) ─────────────────────────────────────────────
  {
    id: 'category_position',
    label: 'Category Position',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.07,
    whatItsFor: 'The DI competitive landscape. 5 incumbents mapped, 3 gaps DI uniquely closes.',
    payoff: 'You can answer "how is this different from Cloverpop / IBM watsonx" in one sentence.',
    minutes: 15,
    prerequisites: [],
    iconName: 'Radar',
  },
  {
    id: 'positioning_copilot',
    label: 'Positioning Copilot',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.16,
    whatItsFor:
      "Sharp's brand spine, market thesis, strategic compass, pitch deck, AI rehearsal coach.",
    payoff: 'Rehearse a pitch out loud against the AI coach before a real meeting.',
    minutes: 35,
    prerequisites: ['overview'],
    iconName: 'Compass',
  },
  {
    id: 'positioning',
    label: 'Competitive Positioning',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.25,
    whatItsFor:
      'Cloverpop comparison, 5 moat layers, capability matrix, 8 investor Q&As, top-3 DI-space gaps.',
    payoff: 'Direct answers to "why this, why now, why you" for any procurement reader.',
    minutes: 25,
    prerequisites: ['category_position'],
    iconName: 'Shield',
  },
  {
    id: 'sales',
    label: 'Sales Toolkit',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.34,
    whatItsFor: 'JOLT, SLIP, Cialdini, MEDDPICC, SPIN, Challenger, demo flow, audience pitches.',
    payoff: 'Tactical sales layer. Pick the framework that matches your current pipeline blocker.',
    minutes: 30,
    prerequisites: ['positioning'],
    iconName: 'MessageSquare',
  },
  {
    id: 'closing_lab',
    label: 'Closing Lab',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.43,
    whatItsFor:
      'Maalouf 6 high-ticket-psychology principles + Satyam 5 sales-infrastructure pillars + 5 silent objections + 3 fastest-converter personas + 80% cut list.',
    payoff:
      'The exact phrase to use on the call, the silent objection that killed your last lost deal, and the 14-day outreach sequence per persona.',
    minutes: 35,
    prerequisites: ['sales'],
    iconName: 'Target',
  },
  {
    id: 'education_room',
    label: 'Education Room',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.52,
    whatItsFor:
      'Flashcard + recall + apply mastery across 15 decks (160+ cards): DI vocabulary, 7 buyer personas, Maalouf 6 + Satyam 5, 15-dim Sales DQI rubric, 5 silent objections, regulatory frameworks (count derived), 12-node pipeline, R²F integration, founder one-liners, advanced sales moves, strategic thinking, Goldner discovery. SM-2 spaced repetition + AI-graded recall.',
    payoff:
      'Mastery through recollection. Reading builds familiarity; recall under pressure builds the muscle that fires in a live conversation.',
    minutes: 30,
    prerequisites: ['closing_lab'],
    iconName: 'BookOpen',
  },
  {
    id: 'sparring_room',
    label: 'Sparring Room',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.61,
    whatItsFor:
      'Live sales-rep practice. AI generates a buyer-voice opener + 3 questions per persona × scenario (incl. networking-event in-person); you record via Wispr Flow, paste the transcript, get a 15-dimension Sales DQI scorecard (Maalouf 4 + Satyam 3 + DI discipline 2 + Kahneman loss-aversion + fundamentals + JOLT/Sandler/Cohen 4 meta-dimensions) + buyer-perspective simulation + the verbatim phrase you should have used.',
    payoff:
      'The reading→recall→doing loop completes here. Closing Lab gives you the framework; Education Room makes you recall it; Sparring Room makes you live it under pressure with rep-by-rep grade tracking.',
    minutes: 25,
    prerequisites: ['education_room'],
    iconName: 'Brain',
  },
  {
    id: 'outreach_hub',
    label: 'Outreach Hub',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.7,
    whatItsFor:
      'ICP events + persona map + channel matrix + contact tracker + LinkedIn message generator + design-partner triage.',
    payoff: 'The operational outbound layer. Every Monday-morning send-message lives here.',
    minutes: 40,
    prerequisites: ['sparring_room'],
    iconName: 'Zap',
  },
  {
    id: 'content',
    label: 'Content Studio',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.79,
    whatItsFor:
      'LinkedIn post generator, case-study analyzer, voice config, content opportunity scanner.',
    payoff: 'The content flywheel. Daily LinkedIn posts that warm up cold prospects.',
    minutes: 15,
    prerequisites: ['positioning'],
    iconName: 'Zap',
  },
  {
    id: 'lrqa',
    label: 'LRQA / Ian Spaulding',
    group: 'Go-to-Market',
    x: 0.5,
    y: 0.88,
    whatItsFor:
      'Active warm-intro brief: Ian profile, LRQA company map, integration paths, ask hierarchy, meeting prep.',
    payoff:
      'Walk into the meeting with the artefact + literal opening line + follow-up cadence ready.',
    minutes: 30,
    prerequisites: ['outreach_hub'],
    iconName: 'Handshake',
  },

  // ─── Intelligence (2) ──────────────────────────────────────────────
  {
    id: 'data_ecosystem',
    label: 'Data Ecosystem',
    group: 'Intelligence',
    x: 0.73,
    y: 0.32,
    whatItsFor: 'Slack / Drive / email / webhook integrations + live audit + activation stats.',
    payoff: 'How the flywheel feeds itself. Activation metrics that an investor will ask about.',
    minutes: 18,
    prerequisites: ['product_deep'],
    iconName: 'Plug',
  },
  {
    id: 'case_library',
    label: 'Case Library',
    group: 'Intelligence',
    x: 0.73,
    y: 0.62,
    whatItsFor: '143 historical decisions + bias interaction matrix + Decision Alpha leaderboard.',
    payoff:
      'Pick 3 cases to anchor every cold pitch. The corpus is the procurement-grade reference.',
    minutes: 25,
    prerequisites: ['research'],
    iconName: 'Library',
  },

  // ─── Tools (6) ─────────────────────────────────────────────────────
  {
    id: 'todo',
    label: 'To-Do',
    group: 'Tools',
    x: 0.92,
    y: 0.12,
    whatItsFor: 'Persistent founder to-do list scoped to the hub. Drag, sort, archive.',
    payoff: 'Anywhere you would have written a sticky note, write it here instead.',
    minutes: 5,
    prerequisites: [],
    iconName: 'CheckSquare',
  },
  {
    id: 'meetings_log',
    label: 'Meetings Log',
    group: 'Tools',
    x: 0.92,
    y: 0.27,
    whatItsFor: 'Past + upcoming meetings, prep notes, follow-up tracker.',
    payoff: 'Never lose context between two meetings with the same person.',
    minutes: 10,
    prerequisites: [],
    iconName: 'Calendar',
  },
  {
    id: 'forecast',
    label: '12-Month Forecast',
    group: 'Tools',
    x: 0.92,
    y: 0.42,
    whatItsFor: 'Bootstrap vs. VC lanes, 4 quarters, milestone drill-down with tripwires.',
    payoff:
      'The lane decision. Quarterly milestones written down so you can hold yourself to them.',
    minutes: 20,
    prerequisites: ['unicorn_roadmap'],
    iconName: 'Map',
  },
  {
    id: 'founder_tips',
    label: 'Founder Tips',
    group: 'Tools',
    x: 0.92,
    y: 0.57,
    whatItsFor: 'Playbook notes, session learnings, honest self-reflection captured between calls.',
    payoff: 'Captured wisdom you can re-read at 11pm before a Monday demo.',
    minutes: 8,
    prerequisites: [],
    iconName: 'Lightbulb',
  },
  {
    id: 'founder_school',
    label: 'Founder School',
    group: 'Tools',
    x: 0.92,
    y: 0.72,
    whatItsFor:
      '66 lessons across 8 tracks: Platform Foundations, Enterprise Sales, Product, GTM, BD, Leadership.',
    payoff:
      'Sample one or two lessons that match your current bottleneck. Cited research, not blogspam.',
    minutes: 25,
    prerequisites: [],
    iconName: 'GraduationCap',
  },
  {
    id: 'cron_controls',
    label: 'Cron Controls',
    group: 'Tools',
    x: 0.92,
    y: 0.87,
    whatItsFor:
      'Manual triggers for outcome-detection / playbook-followup / weekly-digest crons. Admin only.',
    payoff: 'Force a cron to run when you need to validate a fix without waiting for the schedule.',
    minutes: 5,
    prerequisites: [],
    iconName: 'Terminal',
  },
];

// ─── EDGES ──────────────────────────────────────────────────────────
//
// Each edge represents a real flow handoff or prerequisite, not a
// decorative line. Don't add edges that don't justify a journey
// ordering.

export const EDGES: MapEdge[] = [
  // Start cluster: roadmap → path
  {
    from: 'unicorn_roadmap',
    to: 'path_to_100m',
    rationale:
      'The roadmap names the destination; the path lays out the warm-intro and persona moves to get there.',
    strength: 'primary',
  },

  // Product flow: overview → deep dive → research foundations
  {
    from: 'overview',
    to: 'product_deep',
    rationale: 'After the four-moments narrative, the technical pipeline is the next layer down.',
    strength: 'primary',
  },
  {
    from: 'product_deep',
    to: 'research',
    rationale: 'The pipeline implements specific academic claims; the research tab anchors them.',
    strength: 'primary',
  },

  // Go-to-Market flow: category → positioning → sales → outreach → content / lrqa
  {
    from: 'category_position',
    to: 'positioning',
    rationale: 'Once you know the landscape shape, the moat narrative follows.',
    strength: 'primary',
  },
  {
    from: 'positioning_copilot',
    to: 'positioning',
    rationale: 'The copilot rehearses what positioning details defend.',
    strength: 'secondary',
  },
  {
    from: 'positioning',
    to: 'sales',
    rationale: 'Positioning is the WHY; sales is the HOW for any specific account.',
    strength: 'primary',
  },
  {
    from: 'sales',
    to: 'closing_lab',
    rationale:
      'Sales toolkit names the frameworks (JOLT / SLIP / Cialdini); closing lab applies them to the 3 fastest-converter personas with verbatim phrases.',
    strength: 'primary',
  },
  {
    from: 'closing_lab',
    to: 'education_room',
    rationale:
      'Closing lab gives you the verbatim phrases. Education Room makes you RECALL them on demand — flashcard, AI-graded text recall, scenario-application drills with SM-2 spaced repetition.',
    strength: 'primary',
  },
  {
    from: 'education_room',
    to: 'sparring_room',
    rationale:
      'Education Room builds the recall muscle (text-grade mastery). Sparring Room tests it under speech pressure — buyer-voice questions, voice answer, AI-graded with buyer-perspective simulation.',
    strength: 'primary',
  },
  {
    from: 'closing_lab',
    to: 'sparring_room',
    rationale:
      'Direct path when you skip the recall drill and go straight to live practice. The shorter loop for when a meeting is in 30 minutes.',
    strength: 'secondary',
  },
  {
    from: 'sparring_room',
    to: 'outreach_hub',
    rationale:
      'Practice rep first, outbound message second. Once a rep grades B+ in the room, the cold-message draft writes itself.',
    strength: 'primary',
  },
  {
    from: 'closing_lab',
    to: 'outreach_hub',
    rationale:
      'Direct path when you skip practice and just want to write outbound. Reading the verbatim phrase still beats nothing.',
    strength: 'secondary',
  },
  {
    from: 'outreach_hub',
    to: 'content',
    rationale: 'Inbound and outbound share a content pipeline; LinkedIn warming up cold prospects.',
    strength: 'secondary',
  },
  {
    from: 'outreach_hub',
    to: 'lrqa',
    rationale:
      'Concrete prospect briefs (LRQA) are the next layer down from generic outreach moves.',
    strength: 'secondary',
  },

  // Cross-group: research → case library, product_deep → data ecosystem
  {
    from: 'research',
    to: 'case_library',
    rationale:
      'Research names the principles; the case library shows the evidence behind each one.',
    strength: 'primary',
  },
  {
    from: 'product_deep',
    to: 'data_ecosystem',
    rationale: 'The pipeline is fed by integrations; the ecosystem tab shows the input channels.',
    strength: 'secondary',
  },
  {
    from: 'overview',
    to: 'category_position',
    rationale: 'Once you know what DI does, you can place it on the competitive map.',
    strength: 'secondary',
  },

  // Tools threading
  {
    from: 'unicorn_roadmap',
    to: 'forecast',
    rationale: 'The 5-year roadmap turns into 12-month milestones in the forecast.',
    strength: 'primary',
  },
  {
    from: 'outreach_hub',
    to: 'meetings_log',
    rationale: 'Every meeting that comes from outreach lands in the log for follow-up.',
    strength: 'secondary',
  },
  {
    from: 'outreach_hub',
    to: 'todo',
    rationale: 'Outreach moves spawn to-dos: send the brief, schedule the follow-up.',
    strength: 'secondary',
  },
  {
    from: 'path_to_100m',
    to: 'founder_school',
    rationale:
      'The path identifies the personas; founder school covers each persona move in depth.',
    strength: 'secondary',
  },
  {
    from: 'founder_tips',
    to: 'path_to_100m',
    rationale: 'Captured tips feed back into the strategic compass.',
    strength: 'secondary',
  },
];

// ─── JOURNEYS ───────────────────────────────────────────────────────
//
// A journey = a recommended sequence through the map for a specific
// founder context. The map highlights the path with numbered overlays.

export const JOURNEYS: Journey[] = [
  {
    id: 'pitch',
    label: 'Preparing a pitch',
    description:
      'You have a meeting in the next 48 hours. You need vocabulary, moat, recall mastery, rehearsal, and the verbatim phrase per persona — at least 2 graded sparring reps before walking in.',
    outcome:
      'Walk into the meeting with the locked positioning, three case anchors, the silent-objections list, the persona-specific exact phrase recalled cold from memory, AND a graded sparring rep proving you can deliver it under pressure.',
    path: [
      'overview',
      'category_position',
      'positioning',
      'positioning_copilot',
      'sales',
      'closing_lab',
      'education_room',
      'sparring_room',
      'path_to_100m',
    ],
    totalMinutes: 12 + 15 + 25 + 35 + 30 + 35 + 30 + 25 + 40,
    color: '#16A34A',
  },
  {
    id: 'research',
    label: 'Researching the market',
    description:
      'You want to understand the competitive landscape and what makes Decision Intel structurally different.',
    outcome:
      'You can answer "what is decision intelligence" + "why is DI structurally different" in two sentences each.',
    path: [
      'overview',
      'research',
      'category_position',
      'positioning',
      'case_library',
      'product_deep',
    ],
    totalMinutes: 12 + 25 + 15 + 25 + 25 + 30,
    color: '#0EA5E9',
  },
  {
    id: 'outreach',
    label: 'Executing outreach',
    description:
      'You have prospects to reach this week. You want the persona-specific exact phrase, recall mastery on the silent-objections list, a graded sparring rep, plus the 14-day sequence + message generator + warm-intro template ready.',
    outcome:
      '5-10 Monday-morning outreach drafts queued. The right channel + the right opener + the right silent-objection rebuttal — recalled cold from memory and backed by at least one graded rep on the persona you are about to call.',
    path: [
      'positioning',
      'sales',
      'closing_lab',
      'education_room',
      'sparring_room',
      'outreach_hub',
      'content',
      'lrqa',
      'meetings_log',
      'todo',
    ],
    totalMinutes: 25 + 30 + 35 + 30 + 25 + 40 + 15 + 30 + 10 + 5,
    color: '#F59E0B',
  },
  {
    id: 'reflect',
    label: 'Reflecting on a close',
    description:
      'A pitch just closed (or didn’t). You want to capture the lesson and feed it back into the path.',
    outcome:
      'A 1-paragraph tip captured + the strategic compass updated + the relevant tripwires flipped.',
    path: ['founder_tips', 'path_to_100m', 'forecast', 'unicorn_roadmap', 'founder_school'],
    totalMinutes: 8 + 40 + 20 + 15 + 25,
    color: '#8B5CF6',
  },
  {
    id: 'product',
    label: 'Diving into the product',
    description:
      'You want to explain the product to a technical buyer. CTO, head of data, or an engineering audience.',
    outcome:
      'You can walk through the 12-node pipeline + DQI methodology + scoring engine + outcome flywheel.',
    path: [
      'overview',
      'product_deep',
      'research',
      'data_ecosystem',
      'case_library',
      'founder_school',
    ],
    totalMinutes: 12 + 30 + 25 + 18 + 25 + 25,
    color: '#EC4899',
  },
];
