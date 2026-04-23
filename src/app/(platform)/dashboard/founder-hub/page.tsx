'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FounderChatWidget } from '@/components/founder-hub/FounderChatWidget';
import { Loader2 } from 'lucide-react';

// ─── Lazy-loaded tabs (~12,000 lines total — only active tab is loaded) ─────
const tabLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
    <Loader2
      size={24}
      style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }}
    />
  </div>
);
const StartHereTab = dynamic(
  () =>
    import('@/components/founder-hub/StartHereTab').then(m => ({
      default: m.StartHereTab,
    })),
  { loading: tabLoader }
);
const ProductOverviewTab = dynamic(
  () =>
    import('@/components/founder-hub/ProductOverviewTab').then(m => ({
      default: m.ProductOverviewTab,
    })),
  { loading: tabLoader }
);
const CorePipelineTab = dynamic(
  () =>
    import('@/components/founder-hub/CorePipelineTab').then(m => ({ default: m.CorePipelineTab })),
  { loading: tabLoader }
);
const ScoringEngineTab = dynamic(
  () =>
    import('@/components/founder-hub/ScoringEngineTab').then(m => ({
      default: m.ScoringEngineTab,
    })),
  { loading: tabLoader }
);
const DqiMethodologyTab = dynamic(
  () =>
    import('@/components/founder-hub/DqiMethodologyTab').then(m => ({
      default: m.DqiMethodologyTab,
    })),
  { loading: tabLoader }
);
const IntegrationsAndFlywheelTab = dynamic(
  () =>
    import('@/components/founder-hub/IntegrationsAndFlywheelTab').then(m => ({
      default: m.IntegrationsAndFlywheelTab,
    })),
  { loading: tabLoader }
);
const SalesToolkitTab = dynamic(
  () =>
    import('@/components/founder-hub/SalesToolkitTab').then(m => ({ default: m.SalesToolkitTab })),
  { loading: tabLoader }
);
const LiveStatsTab = dynamic(
  () => import('@/components/founder-hub/LiveStatsTab').then(m => ({ default: m.LiveStatsTab })),
  { loading: tabLoader }
);
const ResearchFoundationsTab = dynamic(
  () =>
    import('@/components/founder-hub/ResearchFoundationsTab').then(m => ({
      default: m.ResearchFoundationsTab,
    })),
  { loading: tabLoader }
);
const CaseStudiesTab = dynamic(
  () =>
    import('@/components/founder-hub/CaseStudiesTab').then(m => ({ default: m.CaseStudiesTab })),
  { loading: tabLoader }
);
const CorrelationCausalTab = dynamic(
  () =>
    import('@/components/founder-hub/CorrelationCausalTab').then(m => ({
      default: m.CorrelationCausalTab,
    })),
  { loading: tabLoader }
);
const DecisionAlphaTab = dynamic(
  () =>
    import('@/components/founder-hub/DecisionAlphaTab').then(m => ({
      default: m.DecisionAlphaTab,
    })),
  { loading: tabLoader }
);
const ContentStudioTab = dynamic(
  () =>
    import('@/components/founder-hub/ContentStudioTab').then(m => ({
      default: m.ContentStudioTab,
    })),
  { loading: tabLoader }
);
const FounderTipsTab = dynamic(
  () =>
    import('@/components/founder-hub/FounderTipsTab').then(m => ({ default: m.FounderTipsTab })),
  { loading: tabLoader }
);
const OutreachAndMeetingsTab = dynamic(
  () =>
    import('@/components/founder-hub/OutreachAndMeetingsTab').then(m => ({
      default: m.OutreachAndMeetingsTab,
    })),
  { loading: tabLoader }
);
const FounderSchoolTab = dynamic(
  () =>
    import('@/components/founder-hub/FounderSchoolTab').then(m => ({
      default: m.FounderSchoolTab,
    })),
  { loading: tabLoader }
);
const CronControlsTab = dynamic(
  () =>
    import('@/components/founder-hub/CronControlsTab').then(m => ({
      default: m.CronControlsTab,
    })),
  { loading: tabLoader }
);
const PositioningCopilotTab = dynamic(
  () =>
    import('@/components/founder-hub/PositioningCopilotTab').then(m => ({
      default: m.PositioningCopilotTab,
    })),
  { loading: tabLoader }
);
const CompetitivePositioningTab = dynamic(
  () =>
    import('@/components/founder-hub/CompetitivePositioningTab').then(m => ({
      default: m.CompetitivePositioningTab,
    })),
  { loading: tabLoader }
);
const OutreachCommandCenterTab = dynamic(
  () =>
    import('@/components/founder-hub/OutreachCommandCenterTab').then(m => ({
      default: m.OutreachCommandCenterTab,
    })),
  { loading: tabLoader }
);
const ForecastRoadmapTab = dynamic(
  () =>
    import('@/components/founder-hub/ForecastRoadmapTab').then(m => ({
      default: m.ForecastRoadmapTab,
    })),
  { loading: tabLoader }
);
const CategoryPositionTab = dynamic(
  () =>
    import('@/components/founder-hub/CategoryPositionTab').then(m => ({
      default: m.CategoryPositionTab,
    })),
  { loading: tabLoader }
);
const UnicornRoadmapTab = dynamic(
  () =>
    import('@/components/founder-hub/UnicornRoadmapTab').then(m => ({
      default: m.UnicornRoadmapTab,
    })),
  { loading: tabLoader }
);
const TodoTab = dynamic(
  () => import('@/components/founder-hub/TodoTab').then(m => ({ default: m.TodoTab })),
  { loading: tabLoader }
);
const MeetingsLogTab = dynamic(
  () =>
    import('@/components/founder-hub/MeetingsLogTab').then(m => ({
      default: m.MeetingsLogTab,
    })),
  { loading: tabLoader }
);
const DesignPartnersTab = dynamic(
  () =>
    import('@/components/founder-hub/DesignPartnersTab').then(m => ({
      default: m.DesignPartnersTab,
    })),
  { loading: tabLoader }
);
import {
  Rocket,
  Brain,
  Plug,
  Shield,
  BookOpen,
  MessageSquare,
  Zap,
  Lock,
  Crosshair,
  Search,
  X,
  Library,
  Lightbulb,
  GraduationCap,
  Terminal,
  Compass,
  Map,
  Radar,
  Target,
  CheckSquare,
  Presentation,
  Handshake,
} from 'lucide-react';
import { card } from '@/components/founder-hub/shared-styles';
import { AccordionSection } from '@/components/founder-hub/AccordionSection';
import { CsoPipelineBoard } from '@/components/founder-hub/CsoPipelineBoard';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | 'start'
  | 'overview'
  | 'product_deep'
  | 'research'
  | 'positioning_copilot'
  | 'positioning'
  | 'sales'
  | 'outreach_cmd'
  | 'outreach'
  | 'design_partners'
  | 'content'
  | 'data_ecosystem'
  | 'case_library'
  | 'founder_tips'
  | 'founder_school'
  | 'cron_controls'
  | 'forecast'
  | 'category_position'
  | 'unicorn_roadmap'
  | 'meetings_log'
  | 'todo';

type TabGroup = 'Start' | 'Product' | 'Go-to-Market' | 'Intelligence' | 'Tools';

// Maps old tab slugs (from 17-tab era) to new 10-tab slugs so bookmarks and
// deep links don't break after consolidation.
const LEGACY_TAB_REDIRECTS: Record<string, TabId> = {
  pipeline: 'product_deep',
  scoring: 'product_deep',
  dqi_methodology: 'product_deep',
  methodologies: 'research',
  playbook: 'research',
  strategy: 'positioning',
  investor_defense: 'positioning',
  integrations: 'data_ecosystem',
  stats: 'data_ecosystem',
  case_studies: 'case_library',
  correlation_causal: 'case_library',
  decision_alpha: 'case_library',
  content_studio: 'content',
  meeting_prep: 'outreach',
};

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode; group: TabGroup }> = [
  // Start — guided 2-day walkthrough entry point
  { id: 'start', label: 'Start Here', icon: <Compass size={16} />, group: 'Start' },
  { id: 'unicorn_roadmap', label: 'Unicorn Roadmap', icon: <Target size={16} />, group: 'Start' },
  // Product
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} />, group: 'Product' },
  { id: 'product_deep', label: 'Pipeline & Scoring', icon: <Brain size={16} />, group: 'Product' },
  {
    id: 'research',
    label: 'Research & Foundations',
    icon: <BookOpen size={16} />,
    group: 'Product',
  },
  // Go-to-Market
  {
    id: 'positioning_copilot',
    label: 'Positioning Copilot',
    icon: <Compass size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'positioning',
    label: 'Competitive Positioning',
    icon: <Shield size={16} />,
    group: 'Go-to-Market',
  },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} />, group: 'Go-to-Market' },
  {
    id: 'outreach_cmd',
    label: 'Outreach Strategy',
    icon: <Zap size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'category_position',
    label: 'Category Position',
    icon: <Radar size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'outreach',
    label: 'Message Generator',
    icon: <Crosshair size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'design_partners',
    label: 'Design Partners',
    icon: <Handshake size={16} />,
    group: 'Go-to-Market',
  },
  { id: 'content', label: 'Content Studio', icon: <Zap size={16} />, group: 'Go-to-Market' },
  // Intelligence
  {
    id: 'data_ecosystem',
    label: 'Data Ecosystem',
    icon: <Plug size={16} />,
    group: 'Intelligence',
  },
  { id: 'case_library', label: 'Case Library', icon: <Library size={16} />, group: 'Intelligence' },
  // Tools
  {
    id: 'todo',
    label: 'To-Do',
    icon: <CheckSquare size={16} />,
    group: 'Tools',
  },
  {
    id: 'meetings_log',
    label: 'Meetings Log',
    icon: <Presentation size={16} />,
    group: 'Tools',
  },
  {
    id: 'forecast',
    label: '12-Month Forecast',
    icon: <Map size={16} />,
    group: 'Tools',
  },
  { id: 'founder_tips', label: 'Founder Tips', icon: <Lightbulb size={16} />, group: 'Tools' },
  {
    id: 'founder_school',
    label: 'Founder School',
    icon: <GraduationCap size={16} />,
    group: 'Tools',
  },
  {
    id: 'cron_controls',
    label: 'Cron Controls',
    icon: <Terminal size={16} />,
    group: 'Tools',
  },
];

const TAB_GROUPS: TabGroup[] = ['Start', 'Product', 'Go-to-Market', 'Intelligence', 'Tools'];

// ─── Search Index ─────────────────────────────────────────────────────────
// Flat keyword index over tab sections. Previously, typing in search rendered
// TAB_CONTENT for all 11 tabs at once — defeating lazy loading. Now search
// hits this static index and the user jumps to the matching tab.

type SearchEntry = {
  tabId: TabId;
  section: string;
  preview: string;
  keywords: string;
};

const SEARCH_INDEX: SearchEntry[] = [
  {
    tabId: 'start',
    section: 'Start Here — 2-day study plan',
    preview: 'Interactive flow + 4 sessions guiding you through all 15 tabs in ~6 hours.',
    keywords:
      'start here study plan guided tour walkthrough 2 day two day sessions progress compass onboarding first where begin path flow',
  },
  {
    tabId: 'overview',
    section: 'Product Overview',
    preview: 'High-level narrative: the four moments we catch what others miss.',
    keywords:
      'overview narrative moat four moments elevator pitch positioning compounding decision knowledge graph dqi',
  },
  {
    tabId: 'positioning_copilot',
    section: 'Positioning Copilot',
    preview: 'Brand spine, market thesis, compass, pitch deck, coach — rehearse before outreach.',
    keywords:
      'positioning copilot brand spine sharp 8 steps market thesis strategic compass pitch deck coach outreach rehearsal cheat sheet pdf export visual knowledge graph',
  },
  {
    tabId: 'positioning_copilot',
    section: 'Brand Spine (Sharp 8 steps)',
    preview: 'Category, buyer, problem, position, assets, memory, consistency, availability.',
    keywords:
      'sharp brand byron spine category buyer problem position assets memory consistency availability',
  },
  {
    tabId: 'positioning_copilot',
    section: 'Pitch Deck Roadmap',
    preview: '16 slides from hook to ask, each pre-filled with the line you actually say.',
    keywords:
      'pitch deck slides hook insight problem timing solution proof market conviction advantage traction team business model competition unit economics ask next step',
  },
  {
    tabId: 'product_deep',
    section: 'Analysis Pipeline',
    preview: '12-node LangGraph sequence that produces every audit.',
    keywords:
      'pipeline langgraph 12 node analysis extract detect score bias flow graph architecture nodes prompts',
  },
  {
    tabId: 'product_deep',
    section: 'Scoring Engine',
    preview: 'Toxic patterns, risk multipliers, compound bias interactions.',
    keywords:
      'scoring engine toxic combinations interaction matrix risk multipliers weights composite',
  },
  {
    tabId: 'product_deep',
    section: 'DQI Methodology',
    preview: 'Decision Quality Index formula, percentiles, calibration.',
    keywords:
      'dqi decision quality index methodology formula percentile calibration 135 historical decisions benchmark',
  },
  {
    tabId: 'research',
    section: 'Intellectual Constellation',
    preview:
      '37 thinkers on a radial map — click any node for origin, summary, and product surface.',
    keywords:
      'constellation thinkers map radial kahneman tversky klein sibony tetlock duke bayes strebulaev helmer thiel porter munger bezos boyd snowden surowiecki christensen moore dixon rackham dunkel osterwalder fitzpatrick hormozi lochhead voss minto miller eyal',
  },
  {
    tabId: 'research',
    section: 'The Noise moment',
    preview: '10% expected vs 55% actual variance — the insurance underwriter "holy shit" stat.',
    keywords:
      'noise moment kahneman sibony insurance underwriter 10 55 variance bell curve holy shit stat sales conversation opener',
  },
  {
    tabId: 'research',
    section: 'Kahneman ↔ Klein synthesis',
    preview: 'Structured debiasing vs expert intuition — Decision Intel as the both/and.',
    keywords:
      'kahneman klein dual framework synthesis axis structured debiasing expert intuition rpd failure to disagree 2009',
  },
  {
    tabId: 'research',
    section: 'Decision Quality Chain',
    preview:
      'Howard & Matheson — six links. Frame → alternatives → info → values → reasoning → commitment.',
    keywords:
      'decision quality chain howard matheson six links frame alternatives information values reasoning commitment dq chain',
  },
  {
    tabId: 'research',
    section: 'Decision Hygiene',
    preview: 'Sibony — checklists, pre-mortems, structured assessment, noise audits.',
    keywords:
      'decision hygiene sibony checklists pre-mortems structured independent assessment noise audits quadrants',
  },
  {
    tabId: 'research',
    section: 'Strebulaev 9 principles',
    preview:
      'Stanford GSB VC decision science. Consensus underperforms. Home runs, prepared mind, fast/slow lane.',
    keywords:
      'strebulaev nine principles stanford vc decision science consensus home runs prepared mind fast slow lane jockey horse',
  },
  {
    tabId: 'research',
    section: 'Methodology timeline',
    preview: '260 years of decision science from Bayes (1763) to Decision Intel (2026).',
    keywords: 'methodology timeline history bayes 1763 260 years decision science milestones dates',
  },
  {
    tabId: 'research',
    section: 'Research library',
    preview: 'Podcasts and long-form essays mapped to product + startup actions.',
    keywords:
      'research library podcast stratechery aggregation lenny platform builders 80000 hours',
  },
  {
    tabId: 'research',
    section: 'Sales positioning',
    preview: 'Hook / pitch / close by buyer persona — strategy, M&A, risk, board.',
    keywords: 'sales positioning persona hook pitch close strategy m&a risk board buyer',
  },
  {
    tabId: 'positioning',
    section: 'External Story',
    preview: 'Moat narrative, market sizing, "why now" hook.',
    keywords:
      'positioning external story moat narrative market sizing why now pitch fundraise tam sam som',
  },
  {
    tabId: 'positioning',
    section: 'Investor Defense',
    preview: 'Kill-shot objections, Q&A, competitive responses.',
    keywords:
      'investor defense objections q&a kill shot competitive responses fundraise pitch pushback',
  },
  {
    tabId: 'sales',
    section: 'Sales Toolkit',
    preview: 'Discovery questions, email templates, demo flow.',
    keywords:
      'sales toolkit discovery questions email templates demo flow outreach prospecting qualification',
  },
  {
    tabId: 'outreach',
    section: 'Outreach & Meetings',
    preview: 'Prospect pipeline, weekly brief, meeting prep.',
    keywords:
      'outreach meetings prospects pipeline weekly brief meeting prep calendar stakeholders linkedin',
  },
  {
    tabId: 'content',
    section: 'Content Studio',
    preview: 'LinkedIn post generator, case study analyzer, voice config.',
    keywords:
      'content studio linkedin post generator case study analyzer voice config ideas scanner',
  },
  {
    tabId: 'data_ecosystem',
    section: 'Integrations & Flywheel',
    preview: 'Input channels: Slack, Drive, email, webhooks.',
    keywords:
      'integrations flywheel slack google drive email webhook ingestion sources data ecosystem connections',
  },
  {
    tabId: 'data_ecosystem',
    section: 'Live Stats',
    preview: 'Output metrics, usage, activation.',
    keywords: 'live stats metrics usage activation kpi analytics dashboard numbers',
  },
  {
    tabId: 'case_library',
    section: 'Historical Cases',
    preview: '50+ case studies with pre-decision evidence.',
    keywords:
      'historical cases kodak blockbuster nokia enron case studies library evidence corporate decisions',
  },
  {
    tabId: 'case_library',
    section: 'Correlation & Causal',
    preview: 'Bias interaction matrix, toxic combinations.',
    keywords: 'correlation causal bias interaction matrix toxic combinations compound patterns',
  },
  {
    tabId: 'case_library',
    section: 'Decision Alpha',
    preview: 'CEO decision quality leaderboard.',
    keywords: 'decision alpha ceo leaderboard quality buffett musk huang zuck rankings',
  },
  {
    tabId: 'founder_tips',
    section: 'Founder Tips',
    preview: 'Playbook notes, session learnings, self-reflection.',
    keywords: 'founder tips playbook notes session learnings self-reflection personal advice',
  },
  {
    tabId: 'founder_school',
    section: 'Founder School',
    preview: 'Curated learning library for a solo technical founder.',
    keywords:
      'founder school learning library curriculum sources reading list curated education lessons',
  },
  {
    tabId: 'cron_controls',
    section: 'Cron Controls',
    preview: 'Manually fire scheduled jobs: LinkedIn email, Drive sync, outcome reminders.',
    keywords:
      'cron controls trigger manual run linkedin email drive sync outcome reminders dispatcher schedule jobs test admin',
  },
  {
    tabId: 'forecast',
    section: '12-Month Forecast',
    preview: 'Bootstrap vs VC lanes, 4 quarters, interactive milestone drill-down.',
    keywords:
      'forecast roadmap timeline bootstrap vc raise yc ycombinator accelerator pre-seed seed angel operator advisor dilution valuation runway discovery calls design partners pattern validation 12 month plan strategy',
  },
  {
    tabId: 'category_position',
    section: 'Category Position',
    preview:
      'DI landscape map, three market gaps with shipped-file evidence, 18-month category path.',
    keywords:
      'category position landscape gap creator quantexa aera pyramid palantir cloverpop competitive positioning map causal governance decision intelligence market incumbent analyst gartner forrester thesis four moments scorecard',
  },
  {
    tabId: 'unicorn_roadmap',
    section: 'Unicorn Roadmap',
    preview:
      'North star, executive memo, 5-year timeline, moat radar, 90-day sprint, pipeline funnel, pitfalls, fundraising gauge.',
    keywords:
      'unicorn roadmap north star vision executive memo synthesis kahneman klein moat 5 year timeline milestone sprint 90 day design partner funnel pipeline authority founder pitfall risk cadence weekly rhythm fundraising readiness pre-seed seed series a competitive map',
  },
  {
    tabId: 'design_partners',
    section: 'Design Partners',
    preview:
      'Triage inbound design-partner applications. Capacity strip (5 seats). Status transitions + founder notes.',
    keywords:
      'design partners applications cohort 5 seats strategy pilot status reviewing accepted declined withdrawn scheduled_call triage founder notes capacity cso head of corporate strategy banking insurance pharma aerospace energy m&a mna',
  },
  {
    tabId: 'todo',
    section: 'To-Do',
    preview:
      'Plain task list for day-to-day priorities. Pinned tasks stay up top. Deliberately short \u2014 Unicorn Roadmap and Forecast hold the structured stuff.',
    keywords:
      'todo to-do task list tasks short plain checklist prep meeting prep daily weekly priorities pinned done open reminder note',
  },
  {
    tabId: 'meetings_log',
    section: 'Meetings Log',
    preview:
      'Persistent record of every prep’d meeting with the AI-generated plan, post-call notes, learnings, next steps, and outcome. One place instead of scattered across Docs, Slack, and Drive. Auto-populated from the Meeting Preparation card on the Outreach Strategy tab.',
    keywords:
      'meetings meeting log history record notes learnings followup follow-up outcome cso vc advisor design partner reference call pitch prep plan ethos pathos logos cialdini past upcoming scheduled completed reschedule no-show journal',
  },
];

function SearchResults({ query, onJump }: { query: string; onJump: (tabId: TabId) => void }) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const matches = SEARCH_INDEX.filter(entry => {
    const haystack = `${entry.section} ${entry.preview} ${entry.keywords}`.toLowerCase();
    return haystack.includes(q);
  });

  if (matches.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 32 }}>
        <Search size={20} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          No sections match &quot;{query}&quot;
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Try a broader term, or press Escape to clear.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          ...card,
          borderLeft: '3px solid #16A34A',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Search size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {matches.length} section{matches.length === 1 ? '' : 's'} match &quot;
          <strong style={{ color: 'var(--accent-primary)' }}>{query}</strong>&quot; — click to jump.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(entry => {
          const tab = TABS.find(t => t.id === entry.tabId);
          return (
            <button
              key={`${entry.tabId}-${entry.section}`}
              onClick={() => onJump(entry.tabId)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--border-primary, #222)',
                background: 'var(--bg-secondary, #111)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-primary, #222)';
              }}
            >
              <div style={{ marginTop: 2, color: 'var(--accent-primary)' }}>{tab?.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: 2,
                  }}
                >
                  {tab?.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  {entry.section}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.preview}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const FOUNDER_PASS = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS || '';

export default function FounderHubPage() {
  // Default to Product Overview — Meeting Prep is time-sensitive and goes
  // stale after each investor meeting. Use the tab strip to switch.
  // Resolve initial tab from ?tab=X query param, supporting both current 10-tab
  // slugs and legacy 17-tab slugs (LEGACY_TAB_REDIRECTS) so bookmarks keep working.
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'start';
    const raw = new URLSearchParams(window.location.search).get('tab');
    if (!raw) return 'start';
    const validIds = TABS.map(t => t.id);
    if (validIds.includes(raw as TabId)) return raw as TabId;
    return LEGACY_TAB_REDIRECTS[raw] ?? 'start';
  });
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // chatPaneOpen state + localStorage sync were retired 2026-04-23 when
  // the AI chat switched from permanent-pane to floating widget. The
  // `di-founder-hub-chat-pane` localStorage key orphans on first load
  // for returning users — acceptable, no migration needed.
  const searchRef = useRef<HTMLInputElement>(null);

  const handleUnlock = useCallback(() => {
    if (!FOUNDER_PASS) {
      setPassError(true);
      return;
    }
    if (passInput === FOUNDER_PASS) {
      setUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  }, [passInput]);

  // Keyboard shortcut: Cmd/Ctrl+K to focus search, Escape to clear
  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [unlocked, searchQuery]);

  // Listen for navigation events from the FounderChatWidget. When the
  // chat response mentions another tab (e.g. "go to the Research tab")
  // the widget renders clickable chips; clicking one dispatches this
  // event and we flip the active tab so the founder doesn't have to
  // hunt for it in the left rail. Contract is defined in
  // src/lib/founder-hub/chat-nav.ts.
  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tabId?: string }>).detail;
      const next = detail?.tabId;
      if (!next) return;
      if (TABS.some(t => t.id === next)) {
        setActiveTab(next as TabId);
        setSearchQuery('');
      }
    };
    window.addEventListener('founder-hub-navigate', handler);
    return () => window.removeEventListener('founder-hub-navigate', handler);
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div
        className="max-w-md mx-auto px-4"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Lock size={40} style={{ color: 'var(--text-muted, #71717a)', marginBottom: 16 }} />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
          }}
        >
          Founder Access Only
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted, #71717a)',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          This page is private. Enter the access code to continue.
        </p>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <input
            type="password"
            value={passInput}
            onChange={e => {
              setPassInput(e.target.value);
              setPassError(false);
            }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Access code"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 14,
              borderRadius: 8,
              border: `1px solid ${passError ? '#ef4444' : 'var(--border-primary, #333)'}`,
              background: 'var(--bg-secondary, #111)',
              color: 'var(--text-primary, #fff)',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            onClick={handleUnlock}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#16A34A',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Unlock
          </button>
        </div>
        {passError && (
          <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>
            Incorrect access code.
          </p>
        )}
      </div>
    );
  }

  // Only build TAB_CONTENT when NOT searching. Building this record
  // instantiates every dynamic() component, defeating lazy loading.
  const tabContent: React.ReactNode = searchQuery
    ? null
    : renderTab(activeTab, FOUNDER_PASS, setActiveTab);

  return (
    <ErrorBoundary sectionName="Founder Hub">
      {/* Page cap widened from max-w-6xl (1152px) → max-w-screen-2xl
          (1536px) on 2026-04-23: with the chat now floating instead of
          anchored as a 340px right pane, the main column has a LOT of
          horizontal air, and 1152px was leaving visible empty space on
          wide monitors. 1536px uses the extra width without letting
          narrow-text line-lengths become unreadable. */}
      <div className="founder-hub-root max-w-screen-2xl mx-auto px-4 py-6">
        {renderHeader()}
        <CsoPipelineBoard founderPass={FOUNDER_PASS} />
        <div className="founder-hub-layout">
          <aside className="founder-hub-rail" aria-label="Founder Hub navigation">
            {renderHubRail()}
          </aside>
          <main className="founder-hub-main">
            {searchQuery ? (
              <SearchResults
                query={searchQuery}
                onJump={tabId => {
                  setActiveTab(tabId);
                  setSearchQuery('');
                }}
              />
            ) : (
              tabContent
            )}
          </main>
        </div>
        {/* Chat now renders as a floating bubble (variant="floating").
            The ≥1280px permanent-pane column was retired 2026-04-23 —
            it was compressing the main content to ~568px at the 1152px
            page cap once the 240px rail + 340px pane + gaps were
            subtracted. The widget handles its own open/close state via
            a bubble in the bottom-right. The hub's founder-hub-navigate
            listener (above) still drives tab switching from chat chips
            and from explicit [[nav:tabId]] markers the widget parses
            out of the assistant stream. */}
        <FounderChatWidget founderPass={FOUNDER_PASS} variant="floating" />
      </div>
      <style jsx global>{`
        .founder-hub-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: stretch;
        }
        .founder-hub-rail {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
        }
        .founder-hub-main {
          flex: 1;
          min-width: 0;
          width: 100%;
        }
        @media (min-width: 900px) {
          .founder-hub-layout {
            flex-direction: row;
            gap: 24px;
            align-items: flex-start;
          }
          .founder-hub-rail {
            width: 240px;
            flex-shrink: 0;
            position: sticky;
            top: 16px;
            max-height: calc(100vh - 32px);
            overflow-y: auto;
          }
        }
        /* .founder-hub-chat 340px pane column retired 2026-04-23; the
           chat is now a floating bubble and owns its own positioning. */
      `}</style>
    </ErrorBoundary>
  );

  // ─── Header / Tab Strip / Tab dispatch ─────────────────────────────────
  function renderHeader() {
    return (
      <header style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Rocket size={26} style={{ color: 'var(--accent-primary)' }} />
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text-primary, #fff)',
                margin: 0,
              }}
            >
              Founder Hub
            </h1>
          </div>
          <div style={{ position: 'relative', width: 260 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #71717a)',
              }}
            />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search content... (⌘K)"
              style={{
                width: '100%',
                padding: '8px 32px 8px 30px',
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid var(--border-primary, #333)',
                background: 'var(--bg-secondary, #111)',
                color: 'var(--text-primary, #fff)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #71717a)', margin: 0 }}>
          Your living knowledge board — product features, strategy, sales playbook, and research.
        </p>
      </header>
    );
  }

  function renderHubRail() {
    return (
      <nav>
        {TAB_GROUPS.map((group, groupIdx) => {
          const groupTabs = TABS.filter(t => t.group === group);
          if (groupTabs.length === 0) return null;
          return (
            <div
              key={group}
              style={{
                marginBottom: groupIdx < TAB_GROUPS.length - 1 ? 12 : 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '8px 10px 6px',
                }}
              >
                {group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupTabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchQuery('');
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--text-highlight)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-elevated)' : 'transparent',
                        border: isActive
                          ? '1px solid var(--border-color)'
                          : '1px solid transparent',
                        borderLeft: isActive
                          ? '3px solid var(--accent-primary)'
                          : '3px solid transparent',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {tab.icon}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }
}

function renderTab(
  activeTab: TabId,
  FOUNDER_PASS: string,
  setActiveTab: (id: TabId) => void
): React.ReactNode {
  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    start: (
      <ErrorBoundary sectionName="Start Here">
        <StartHereTab onNavigateToTab={id => setActiveTab(id as TabId)} />
      </ErrorBoundary>
    ),
    overview: <ProductOverviewTab />,
    positioning_copilot: (
      <ErrorBoundary sectionName="Positioning Copilot">
        <PositioningCopilotTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    product_deep: (
      <>
        <AccordionSection title="Analysis Pipeline" subtitle="12-node LangGraph sequence">
          <ErrorBoundary sectionName="Analysis Pipeline">
            <CorePipelineTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection title="Scoring Engine" subtitle="Toxic patterns and risk multipliers">
          <ErrorBoundary sectionName="Scoring Engine">
            <ScoringEngineTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection title="DQI Methodology" subtitle="Formula, percentiles, calibration">
          <ErrorBoundary sectionName="DQI Methodology">
            <DqiMethodologyTab />
          </ErrorBoundary>
        </AccordionSection>
      </>
    ),
    research: (
      <ErrorBoundary sectionName="Research & Foundations">
        <ResearchFoundationsTab />
      </ErrorBoundary>
    ),
    positioning: (
      <ErrorBoundary sectionName="Competitive Positioning">
        <CompetitivePositioningTab />
      </ErrorBoundary>
    ),
    sales: (
      <ErrorBoundary sectionName="Sales Toolkit">
        <SalesToolkitTab />
      </ErrorBoundary>
    ),
    outreach_cmd: (
      <ErrorBoundary sectionName="Outreach Command Center">
        <OutreachCommandCenterTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    outreach: <OutreachAndMeetingsTab founderPass={FOUNDER_PASS} />,
    design_partners: (
      <ErrorBoundary sectionName="Design Partners">
        <DesignPartnersTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    content: (
      <ErrorBoundary sectionName="Content Studio">
        <ContentStudioTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    data_ecosystem: (
      <>
        <AccordionSection
          title="Integrations & Flywheel"
          subtitle="Input channels: Slack, Drive, email, webhooks"
        >
          <IntegrationsAndFlywheelTab />
        </AccordionSection>
        <AccordionSection title="Live Stats" subtitle="Output metrics, usage, activation">
          <LiveStatsTab />
        </AccordionSection>
      </>
    ),
    case_library: (
      <>
        <AccordionSection
          title="Historical Cases"
          subtitle="14 case studies with pre-decision evidence"
        >
          <CaseStudiesTab />
        </AccordionSection>
        <AccordionSection
          title="Correlation & Causal Graph"
          subtitle="Bias interaction matrix, toxic combinations"
        >
          <ErrorBoundary sectionName="Correlation & Causal">
            <CorrelationCausalTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection title="Decision Alpha" subtitle="CEO decision quality leaderboard">
          <ErrorBoundary sectionName="Decision Alpha">
            <DecisionAlphaTab />
          </ErrorBoundary>
        </AccordionSection>
      </>
    ),
    founder_tips: (
      <ErrorBoundary sectionName="Founder Tips">
        <FounderTipsTab />
      </ErrorBoundary>
    ),
    founder_school: (
      <ErrorBoundary sectionName="Founder School">
        <FounderSchoolTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    cron_controls: (
      <ErrorBoundary sectionName="Cron Controls">
        <CronControlsTab />
      </ErrorBoundary>
    ),
    forecast: (
      <ErrorBoundary sectionName="12-Month Forecast">
        <ForecastRoadmapTab />
      </ErrorBoundary>
    ),
    category_position: (
      <ErrorBoundary sectionName="Category Position">
        <CategoryPositionTab />
      </ErrorBoundary>
    ),
    unicorn_roadmap: (
      <ErrorBoundary sectionName="Unicorn Roadmap">
        <UnicornRoadmapTab />
      </ErrorBoundary>
    ),
    todo: (
      <ErrorBoundary sectionName="To-Do">
        <TodoTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    meetings_log: (
      <ErrorBoundary sectionName="Meetings Log">
        <MeetingsLogTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
  };

  return TAB_CONTENT[activeTab];
}
