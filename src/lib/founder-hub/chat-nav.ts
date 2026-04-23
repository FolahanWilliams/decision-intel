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

export const TAB_NAV_TARGETS: TabNavTarget[] = [
  { id: 'start', label: 'Start Here', aliases: ['start here tab'] },
  { id: 'unicorn_roadmap', label: 'Unicorn Roadmap' },
  { id: 'overview', label: 'Product Overview' },
  { id: 'product_deep', label: 'Pipeline & Scoring', aliases: ['pipeline and scoring'] },
  {
    id: 'research',
    label: 'Research & Foundations',
    aliases: ['research tab', 'research and foundations', 'foundations tab'],
  },
  { id: 'positioning_copilot', label: 'Positioning Copilot' },
  { id: 'positioning', label: 'Competitive Positioning' },
  { id: 'sales', label: 'Sales Toolkit' },
  {
    id: 'outreach_cmd',
    label: 'Outreach Strategy',
    aliases: ['outreach strategy tab'],
  },
  { id: 'category_position', label: 'Category Position' },
  {
    id: 'outreach',
    label: 'Message Generator',
    aliases: ['message generator tab'],
  },
  { id: 'design_partners', label: 'Design Partners', aliases: ['design partner tab'] },
  { id: 'content', label: 'Content Studio' },
  { id: 'data_ecosystem', label: 'Data Ecosystem' },
  { id: 'case_library', label: 'Case Library' },
  { id: 'todo', label: 'To-Do', aliases: ['to do tab', 'todo tab'] },
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
