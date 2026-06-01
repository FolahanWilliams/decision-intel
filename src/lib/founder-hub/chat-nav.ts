/**
 * Chat → Founder Hub tab navigation helpers.
 *
 * The Founder Hub chat widget (src/components/founder-hub/FounderChatWidget.tsx)
 * scans assistant messages for tab references and renders clickable
 * "→ Go to X" chips below them. Clicking a chip dispatches
 * `founder-hub-navigate` which the hub page (src/app/(platform)/dashboard/founder-hub/page.tsx)
 * listens for and switches the active tab in response.
 *
 * The mapping is duplicated here (a small subset of the hub's TABS
 * array) so the widget doesn't need to pull the hub's page component
 * into its bundle. Keep the two in sync — when a tab is added or
 * renamed in the hub, add it here too.
 */

export interface TabNavTarget {
  /** Tab ID — must match a TabId in the hub page's TABS array. */
  id: string;
  /** Human label the AI is likely to use, e.g. "Research & Foundations". */
  label: string;
  /** Short-form aliases the AI commonly shortens to. Lowercase, matched
   *  as whole-phrase contains. */
  aliases?: string[];
}

// Reconciled against the canonical 26-id TabId union in the hub page
// (2026-05-15). The 2026-05-10 positioning consolidation +
// 2026-04-28 OutreachHub consolidation half-shipped — this table still
// carried 6 retired tab-ids (positioning_copilot / positioning /
// category_position / outreach_cmd / outreach / design_partners) that
// the hub handler's `TABS.some(t => t.id === next)` check rejects, so
// chat-driven nav to those was BROKEN. The retired ids are folded into
// the consolidated `positioning_hub` / `outreach_hub` with the old
// labels preserved as aliases (the AI still says "competitive
// positioning"; it must resolve to the live tab). 9 tabs shipped
// 2026-04-27→2026-05-13 without a nav target are added so the AI can
// actually navigate the founder to them (sparring_room is load-bearing
// for BAFTA prep; path_to_100m + metrics for seed prep).
export const TAB_NAV_TARGETS: TabNavTarget[] = [
  // Start
  { id: 'start', label: 'Start Here', aliases: ['start here tab'] },
  { id: 'founder_os', label: 'Founder OS', aliases: ['founder os tab', 'os tab'] },
  { id: 'unicorn_roadmap', label: 'Unicorn Roadmap' },
  {
    id: 'path_to_100m',
    label: 'Path to £100M Exits',
    aliases: ['path to 100m', 'path to a hundred million', 'exit path', 'path to exit'],
  },
  // Product
  { id: 'overview', label: 'Product Overview' },
  { id: 'product_deep', label: 'Pipeline & Scoring', aliases: ['pipeline and scoring'] },
  {
    id: 'research',
    label: 'Research & Foundations',
    aliases: ['research tab', 'research and foundations', 'foundations tab'],
  },
  // Go-to-Market
  {
    id: 'positioning_hub',
    label: 'Positioning Hub',
    aliases: [
      'positioning',
      'positioning copilot',
      'competitive positioning',
      'category position',
      'positioning tab',
    ],
  },
  { id: 'sales', label: 'Sales Toolkit' },
  { id: 'closing_lab', label: 'Closing Lab', aliases: ['closing lab tab'] },
  {
    id: 'sparring_room',
    label: 'Sparring Room',
    aliases: ['sparring tab', 'sales rehearsal', 'rehearsal room', 'practice room'],
  },
  {
    id: 'education_room',
    label: 'Education Room',
    aliases: ['education tab', 'flashcards', 'recall drill'],
  },
  {
    id: 'outreach_hub',
    label: 'Outreach Hub',
    aliases: [
      'outreach strategy',
      'message generator',
      'design partners',
      'design partner tab',
      'outreach tab',
      'outreach command center',
    ],
  },
  {
    id: 'lrqa',
    label: 'Assurance Firm · Warm Intro',
    aliases: ['assurance firm warm intro', 'lrqa brief', 'assurance brief'],
  },
  {
    id: 'cornerstone',
    label: 'Pre-Seed VC · Warm Intro',
    aliases: ['pre-seed vc warm intro', 'cornerstone brief', 'vc warm intro brief'],
  },
  {
    id: 'accountability_sprint',
    label: 'Accountability Sprint',
    aliases: [
      'accountability sprint',
      'kristian',
      'kristian marcus',
      'sprint brief',
      'mentor session',
      'mentor brief',
    ],
  },
  { id: 'content', label: 'Content Studio' },
  // Intelligence
  { id: 'data_ecosystem', label: 'Data Ecosystem' },
  { id: 'case_library', label: 'Case Library' },
  {
    id: 'metrics',
    label: 'Metrics',
    aliases: ['metrics tab', 'phase 1 dashboard', 'pmf dashboard', 'kpi dashboard'],
  },
  // Tools
  { id: 'todo', label: 'To-Do', aliases: ['to do tab', 'todo tab'] },
  {
    id: 'meetings_log',
    label: 'Meetings Log',
    aliases: ['meeting log', 'meetings tab', 'past meetings', 'meeting history'],
  },
  {
    id: 'voice_activity',
    label: 'Voice Activity',
    aliases: ['voice tab', 'voice sessions', 'voice mode log'],
  },
  { id: 'forecast', label: '12-Month Forecast', aliases: ['forecast tab'] },
  { id: 'founder_tips', label: 'Founder Tips' },
  { id: 'founder_school', label: 'Founder School' },
  { id: 'cron_controls', label: 'Cron Controls' },
];

/** DOM event the widget dispatches and the hub page listens for. */
export const FOUNDER_HUB_NAVIGATE_EVENT = 'founder-hub-navigate';

export interface FounderHubNavigateDetail {
  tabId: string;
  /** Optional lesson/section to scroll to once the tab mounts; consumers
   *  may ignore. */
  anchor?: string;
}

/** Scan assistant message text for tab references. Returns up to N
 *  unique targets so we don't paper the widget with chips. Prefers
 *  longest-match to avoid "outreach strategy" being detected as two
 *  separate tabs ("strategy" and "outreach"). */
export function detectNavTargets(text: string, limit = 3): TabNavTarget[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hits = new Map<string, { target: TabNavTarget; index: number }>();

  for (const target of TAB_NAV_TARGETS) {
    const phrases = [target.label, ...(target.aliases ?? [])];
    for (const phrase of phrases) {
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx === -1) continue;
      const existing = hits.get(target.id);
      if (!existing || idx < existing.index) {
        hits.set(target.id, { target, index: idx });
      }
    }
  }

  return Array.from(hits.values())
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map(h => h.target);
}

/** Explicit navigation marker the chat system prompt teaches the model
 *  to emit when the user asks the AI to take them to a specific tab.
 *  Form: [[nav:tabId]]  — e.g. "[[nav:outreach_hub]]". The widget
 *  auto-fires the founder-hub-navigate event for the first valid marker
 *  in a response and strips every marker from the displayed text.
 *
 *  Why a marker rather than LLM tool calling: keeps the Gemini chat
 *  route as a simple stream and lets the widget operate on final
 *  assembled text. A malformed or unknown tabId is silently ignored.
 */
const NAV_MARKER_RE = /\[\[nav:([a-z0-9_-]+)\]\]/gi;

export interface NavMarkerExtraction {
  /** Message text with every marker stripped — what the widget displays. */
  cleaned: string;
  /** Unique tabIds in order of first appearance. Unknown ids filtered out. */
  tabIds: string[];
}

/** Pull [[nav:tabId]] markers out of a (potentially streaming) message.
 *  Safe to call on partial text — a marker split across chunks will not
 *  match until both halves are concatenated, which is always the case
 *  when the widget's running buffer is passed in. */
export function extractNavMarkers(text: string): NavMarkerExtraction {
  if (!text) return { cleaned: text, tabIds: [] };
  const validIds = new Set(TAB_NAV_TARGETS.map(t => t.id));
  const seen = new Set<string>();
  const tabIds: string[] = [];
  let match: RegExpExecArray | null;
  NAV_MARKER_RE.lastIndex = 0;
  while ((match = NAV_MARKER_RE.exec(text)) !== null) {
    const id = match[1];
    if (validIds.has(id) && !seen.has(id)) {
      seen.add(id);
      tabIds.push(id);
    }
  }
  const cleaned = text
    .replace(NAV_MARKER_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return { cleaned, tabIds };
}
