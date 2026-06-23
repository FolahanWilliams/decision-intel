'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FounderChatWidget } from '@/components/founder-hub/FounderChatWidget';
import { Loader2 } from 'lucide-react';
import { ALL_CASES, HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

const CASES_WITH_PRE_DECISION_EVIDENCE = ALL_CASES.filter(c => c.preDecisionEvidence).length;

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
// A2 outreach consolidation (locked 2026-04-28): OutreachHubTab wraps
// OutreachCommandCenterTab + OutreachAndMeetingsTab + DesignPartnersTab
// into one tab with internal section toggle. The three underlying
// components stay where they are; this hub composes them.
const OutreachHubTab = dynamic(
  () =>
    import('@/components/founder-hub/OutreachHubTab').then(m => ({
      default: m.OutreachHubTab,
    })),
  { loading: tabLoader }
);
// Closing Lab — sales-psychology playbook (Maalouf + Satyam + brutal-
// honest critique synthesis). Locked 2026-04-28.
const ClosingLabTab = dynamic(
  () =>
    import('@/components/founder-hub/ClosingLabTab').then(m => ({
      default: m.ClosingLabTab,
    })),
  { loading: tabLoader }
);
// Sparring Room — live sales-rep practice (paste Wispr Flow transcript →
// 15-dim Sales DQI grading + buyer-perspective simulation). v3 locked 2026-04-28.
const SparringRoomTab = dynamic(
  () =>
    import('@/components/founder-hub/SparringRoomTab').then(m => ({
      default: m.SparringRoomTab,
    })),
  { loading: tabLoader }
);
// Education Room — flashcard + recall + apply mastery surface across 15
// decks / 160+ cards. SM-2 spaced repetition + AI-graded recall. Locked 2026-04-28.
const EducationRoomTab = dynamic(
  () =>
    import('@/components/founder-hub/EducationRoomTab').then(m => ({
      default: m.EducationRoomTab,
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
// Positioning consolidation (locked 2026-05-10 batch 2 #5): PositioningCopilotTab
// + CompetitivePositioningTab + CategoryPositionTab now mount inside
// PositioningHubTab as Practise / Reference / Map sections. Legacy tab
// slugs route here via LEGACY_TAB_REDIRECTS so chat-driven nav and
// bookmarks keep working unchanged.
const PositioningHubTab = dynamic(
  () =>
    import('@/components/founder-hub/PositioningHubTab').then(m => ({
      default: m.PositioningHubTab,
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
const MetricsTab = dynamic(
  () =>
    import('@/components/founder-hub/MetricsTab').then(m => ({
      default: m.MetricsTab,
    })),
  { loading: tabLoader }
);
const FounderOSTab = dynamic(
  () =>
    import('@/components/founder-hub/FounderOSTab').then(m => ({
      default: m.FounderOSTab,
    })),
  { loading: tabLoader }
);
const FaithOSTab = dynamic(
  () =>
    import('@/components/founder-hub/FaithOSTab').then(m => ({
      default: m.FaithOSTab,
    })),
  { loading: tabLoader }
);
const SatPrepTab = dynamic(
  () =>
    import('@/components/founder-hub/SatPrepTab').then(m => ({
      default: m.SatPrepTab,
    })),
  { loading: tabLoader }
);
// 66-Day Protocol — founder-private "choose reality" check-in tracker
// (Foundations cluster, sibling to Faith OS). Two ~15-second check-ins a day
// grow a tree to full bloom at day 66. Locked 2026-06-14.
const RealityProtocolTab = dynamic(
  () =>
    import('@/components/founder-hub/RealityProtocolTab').then(m => ({
      default: m.RealityProtocolTab,
    })),
  { loading: tabLoader }
);
const VoiceActivityTab = dynamic(
  () =>
    import('@/components/founder-hub/VoiceActivityTab').then(m => ({
      default: m.VoiceActivityTab,
    })),
  { loading: tabLoader }
);
const MeetingsLogTab = dynamic(
  () =>
    import('@/components/founder-hub/MeetingsLogTab').then(m => ({
      default: m.MeetingsLogTab,
    })),
  { loading: tabLoader }
);
// DesignPartnersTab now imported through OutreachHubTab above
// (A2 consolidation 2026-04-28).
const LrqaTab = dynamic(
  () =>
    import('@/components/founder-hub/LrqaTab').then(m => ({
      default: m.LrqaTab,
    })),
  { loading: tabLoader }
);
const CornerstoneBriefTab = dynamic(
  () =>
    import('@/components/founder-hub/cornerstone/CornerstoneBriefTab').then(m => ({
      default: m.CornerstoneBriefTab,
    })),
  { loading: tabLoader }
);
const AccountabilitySprintTab = dynamic(
  () =>
    import('@/components/founder-hub/AccountabilitySprintTab').then(m => ({
      default: m.AccountabilitySprintTab,
    })),
  { loading: tabLoader }
);
const AntlerBriefTab = dynamic(
  () =>
    import('@/components/founder-hub/AntlerBriefTab').then(m => ({
      default: m.AntlerBriefTab,
    })),
  { loading: tabLoader }
);
const PathToHundredMillionTab = dynamic(
  () =>
    import('@/components/founder-hub/PathToHundredMillionTab').then(m => ({
      default: m.PathToHundredMillionTab,
    })),
  { loading: tabLoader }
);
// Pilot Plan — the post-VC-pass re-foundation as a living surface: first 3 paid
// pilots + the public prospective track record (SpaceX call ledger). Locked
// 2026-06-21. SSOT in pilot-plan/pilot-plan-data.ts.
const PilotPlanTab = dynamic(
  () => import('@/components/founder-hub/PilotPlanTab').then(m => ({ default: m.PilotPlanTab })),
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
  Delete,
  Search,
  X,
  Library,
  Lightbulb,
  GraduationCap,
  Terminal,
  Compass,
  Map,
  Target,
  CheckSquare,
  Presentation,
  Handshake,
  Mic,
  Activity,
  Sprout,
  Flag,
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
  | 'positioning_hub'
  | 'sales'
  | 'outreach_hub'
  | 'closing_lab'
  | 'sparring_room'
  | 'education_room'
  | 'content'
  | 'data_ecosystem'
  | 'case_library'
  | 'founder_tips'
  | 'founder_school'
  | 'cron_controls'
  | 'forecast'
  | 'unicorn_roadmap'
  | 'meetings_log'
  | 'lrqa'
  | 'cornerstone'
  | 'accountability_sprint'
  | 'antler_brief'
  | 'path_to_100m'
  | 'pilot_plan'
  | 'voice_activity'
  | 'metrics'
  | 'founder_os'
  | 'faith_os'
  | 'sat_prep'
  | 'reality_protocol'
  | 'todo';

type TabGroup = 'Foundations' | 'Start' | 'Product' | 'Go-to-Market' | 'Intelligence' | 'Tools';

// Maps old tab slugs (from 17-tab era) to new 10-tab slugs so bookmarks and
// deep links don't break after consolidation.
const LEGACY_TAB_REDIRECTS: Record<string, TabId> = {
  pipeline: 'product_deep',
  scoring: 'product_deep',
  dqi_methodology: 'product_deep',
  methodologies: 'research',
  playbook: 'research',
  // Positioning consolidation (locked 2026-05-10 batch 2 #5): three tabs
  // collapsed into PositioningHubTab with Practise / Reference / Map
  // sections. Legacy slugs route to the consolidated tab; section
  // deep-link handled by URL `&section=` param.
  strategy: 'positioning_hub',
  investor_defense: 'positioning_hub',
  positioning: 'positioning_hub',
  positioning_copilot: 'positioning_hub',
  category_position: 'positioning_hub',
  integrations: 'data_ecosystem',
  stats: 'data_ecosystem',
  case_studies: 'case_library',
  correlation_causal: 'case_library',
  decision_alpha: 'case_library',
  content_studio: 'content',
  meeting_prep: 'outreach_hub',
  // A2 outreach consolidation (locked 2026-04-28): three tabs collapsed
  // into one OutreachHubTab with internal Pipeline / Messages /
  // Design Partners sections. Legacy slugs route to the consolidated
  // tab; the section deep-link is handled by URL `&section=` param.
  outreach_cmd: 'outreach_hub',
  outreach: 'outreach_hub',
  design_partners: 'outreach_hub',
};

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode; group: TabGroup }> = [
  // Foundations — faith woven UNDER the operating platform (Faith OS, 2026-05-28).
  // Rendered first (TAB_GROUPS lists 'Foundations' before 'Start') so the
  // literal-first surface is the foundation everything else is built on.
  { id: 'faith_os', label: 'Faith OS', icon: <BookOpen size={16} />, group: 'Foundations' },
  // Personal study OS — SAT prep (founder-private; never on the customer dashboard).
  { id: 'sat_prep', label: 'SAT Prep', icon: <GraduationCap size={16} />, group: 'Foundations' },
  // 66-Day Protocol — founder-private "choose reality" tracker (2026-06-14).
  {
    id: 'reality_protocol',
    label: '66-Day Protocol',
    icon: <Sprout size={16} />,
    group: 'Foundations',
  },
  // Start — guided 2-day walkthrough entry point
  { id: 'start', label: 'Start Here', icon: <Compass size={16} />, group: 'Start' },
  // GTM v3.5 §11 (RATIFIED 2026-05-05) — the cognitive-discipline surface
  // that supports the Phase 1 motion. Mounted in 'Start' so it's the
  // first-thing-of-the-day check before any other tab. Daily checkin +
  // SFC-zero streak counter + 6 pillars + content log + skill tracker.
  // Persisted in localStorage (single-user; no backend cost yet).
  { id: 'founder_os', label: 'Founder OS', icon: <Shield size={16} />, group: 'Start' },
  { id: 'unicorn_roadmap', label: 'Unicorn Roadmap', icon: <Target size={16} />, group: 'Start' },
  {
    id: 'path_to_100m',
    label: 'Path to £100M Exits',
    icon: <Target size={16} />,
    group: 'Start',
  },
  // Pilot Plan — the post-VC-pass re-foundation (locked 2026-06-21): first 3
  // paid pilots + the public prospective track record (SpaceX call ledger).
  {
    id: 'pilot_plan',
    label: 'Pilot Plan',
    icon: <Flag size={16} />,
    group: 'Start',
  },
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
  // Positioning Hub (locked 2026-05-10 batch 2 #5) — consolidates
  // Positioning Copilot (Practise) + Competitive Positioning (Reference)
  // + Category Position (Map). Section deep-link via `&section=`. Tab
  // count: 33 → 31.
  {
    id: 'positioning_hub',
    label: 'Positioning Hub',
    icon: <Compass size={16} />,
    group: 'Go-to-Market',
  },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} />, group: 'Go-to-Market' },
  {
    id: 'closing_lab',
    label: 'Closing Lab',
    icon: <Target size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'sparring_room',
    label: 'Sparring Room',
    icon: <Brain size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'education_room',
    label: 'Education Room',
    icon: <GraduationCap size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'outreach_hub',
    label: 'Outreach Hub',
    icon: <Zap size={16} />,
    group: 'Go-to-Market',
  },
  {
    id: 'lrqa',
    // Role-neutral label (locked 2026-05-02). Prior label "LRQA / Ian Spaulding"
    // was a named-prospect leak in the client bundle per CLAUDE.md no-named-
    // prospects rule. The founder remembers what this tab is; the bundle
    // doesn't need the proper noun. Tab id stays 'lrqa' for backward-compat
    // with deeplinks + saved progress; only the visible label changes.
    label: 'Assurance Firm · Warm Intro',
    icon: <Handshake size={16} />,
    group: 'Go-to-Market',
  },
  {
    // Role-neutral label per CLAUDE.md no-named-prospects rule. The
    // tab id stays 'cornerstone' for founder-recall and stable
    // bookmarks; the visible label says nothing about the firm.
    id: 'cornerstone',
    label: 'Pre-Seed VC · Warm Intro',
    icon: <Handshake size={16} />,
    group: 'Go-to-Market',
  },
  {
    // Role-neutral label per CLAUDE.md no-named-prospects rule (the brief
    // content names the mentor + InsurX internally, like the LRQA brief).
    id: 'accountability_sprint',
    label: 'Accountability Sprint',
    icon: <Target size={16} />,
    group: 'Go-to-Market',
  },
  {
    // Role-neutral label per CLAUDE.md no-named-prospects rule. The tab id
    // keeps 'antler_brief' for founder-recall + stable deeplinks; the brief
    // content names Magnus / Antler internally, like the LRQA + Cornerstone
    // briefs. Founder-hub is admin-gated, so the content naming is safe.
    id: 'antler_brief',
    label: 'Day-Zero VC · Antler',
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
  {
    id: 'voice_activity',
    label: 'Voice Activity',
    icon: <Mic size={16} />,
    group: 'Intelligence',
  },
  {
    // GTM v3.5 RATIFIED 2026-05-04 — real-time Phase 1 graduation
    // dashboard. Pulls /api/founder-hub/metrics every 60s for the Vohra
    // HXC PMF %, paid HXC retention, demos completed, audit cadence,
    // outcome closure rate, micro-deliberation events, Brier baseline,
    // and the days-since-X tripwires. The single surface a founder
    // checks every morning to decide whether to scale or pivot.
    id: 'metrics',
    label: 'Metrics',
    icon: <Activity size={16} />,
    group: 'Intelligence',
  },
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

const TAB_GROUPS: TabGroup[] = [
  'Foundations',
  'Start',
  'Product',
  'Go-to-Market',
  'Intelligence',
  'Tools',
];

// ─── Search Index ─────────────────────────────────────────────────────────
// Flat keyword index over tab sections. Previously, typing in search rendered
// TAB_CONTENT for all 11 tabs at once — defeating lazy loading. Now search
// hits this static index and the user jumps to the matching tab.

type SearchEntry = {
  tabId: TabId;
  section: string;
  preview: string;
  keywords: string;
  /**
   * Optional URL hash slug. When set, clicking the search result sets
   * `window.location.hash = '#${sectionId}'` so the matching AccordionSection
   * inside the destination tab auto-opens, scrolls into view, and flashes.
   * Without this the user lands at the top of the tab and still has to
   * click the right accordion header. (B1 lock 2026-04-28.)
   */
  sectionId?: string;
};

const SEARCH_INDEX: SearchEntry[] = [
  {
    tabId: 'sat_prep',
    section: 'SAT Prep',
    preview: 'Daily drills, official test log, calibration loop, and SM-2 vocab. 1280 → 1550.',
    keywords:
      'sat prep study test score psat 1550 1280 stanford bluebook khan academy math reading writing rw vocab spaced repetition calibration brier error log weak areas drills daily training official test september november digital sat college board',
  },
  {
    tabId: 'faith_os',
    section: 'Faith OS',
    preview:
      "Daily spiritual checkin + Today's Three (the day's three priorities), evening reflection, prayer journal, reading progress.",
    keywords:
      "faith os todays three today's three daily three priorities goals rule of three highlight commit evening reflection prayer journal scripture devotional spiritual checkin streak the build campaign quarter rocks weekly intentions",
  },
  {
    tabId: 'reality_protocol',
    section: '66-Day Protocol',
    preview:
      'Choose reality, build the person. Two 15-second check-ins a day (morning intention + night honest mark) grow a tree to full bloom at day 66. A slip never resets the tree.',
    keywords:
      '66 day protocol reality choose reality tree check-in checkin morning question night mark slip never resets streak habit lally 2010 automaticity bloom august 19 escape avoidance discipline scripture verse kjv proverbs 24:16 falleth seven times graduation phone out of the bedroom on-ramp purpose engine anti-goal prince king daily ritual personal private founder',
  },
  {
    tabId: 'start',
    section: 'Start Here — interactive map',
    preview:
      'The daily landing: The Build campaign, the brain-dump intake, and an interactive map of every Founder Hub tab with journey overlays.',
    keywords:
      'start here map journey overlay guided tour walkthrough compass onboarding first where begin path flow brain dump intake daily dump campaign the build pitch research outreach reflect product',
  },
  {
    tabId: 'overview',
    section: 'Product Overview',
    preview: 'High-level narrative: the four moments we catch what others miss.',
    keywords:
      'overview narrative moat four moments elevator pitch positioning compounding decision knowledge graph dqi',
  },
  {
    tabId: 'pilot_plan',
    section: 'Pilot Plan — first 3 paid pilots',
    preview:
      'The post-VC-pass re-foundation: 3 paid pilots (who/why/how/price), the public prospective track record + SpaceX call ledger, the 3 refinements, the sequence.',
    keywords:
      'pilot plan first 3 paid pilots action plan re-foundation rob vc pass hindsight trap retro cold open public track record prospective brier spacex spcx call ledger score the flag not the forecast sankore p0 credibility re-rank sequence guardrails fundable solo gp fractional cso corp dev wedge',
  },
  {
    tabId: 'positioning_hub',
    section: 'Positioning Copilot',
    preview: 'Brand spine, market thesis, compass, pitch deck, coach — rehearse before outreach.',
    keywords:
      'positioning copilot brand spine sharp 8 steps market thesis strategic compass pitch deck coach outreach rehearsal cheat sheet pdf export visual knowledge graph',
  },
  {
    tabId: 'positioning_hub',
    section: 'Brand Spine (Sharp 8 steps)',
    preview: 'Category, buyer, problem, position, assets, memory, consistency, availability.',
    keywords:
      'sharp brand byron spine category buyer problem position assets memory consistency availability',
  },
  {
    tabId: 'positioning_hub',
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
    sectionId: 'analysis-pipeline',
  },
  {
    tabId: 'product_deep',
    section: 'Scoring Engine',
    preview: 'Toxic patterns, risk multipliers, compound bias interactions.',
    keywords:
      'scoring engine toxic combinations interaction matrix risk multipliers weights composite',
    sectionId: 'scoring-engine',
  },
  {
    tabId: 'product_deep',
    section: 'DQI Methodology',
    preview: 'Decision Quality Index formula, percentiles, calibration.',
    keywords: `dqi decision quality index methodology formula percentile calibration ${HISTORICAL_CASE_COUNT} historical decisions benchmark`,
    sectionId: 'dqi-methodology',
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
    section: 'Pre-Decision Audit Practices',
    // Section name avoids Sibony's "decision hygiene" term — that's
    // borrowed academic vocabulary that we do NOT use as DI category
    // language (banned per src/lib/constants/icp.ts BANNED_VOCABULARY).
    // Cite Sibony as research foundation, position OUR product as
    // "pre-decision audit" / "reasoning layer" / "R²F" instead.
    preview: 'Sibony — checklists, pre-mortems, structured assessment, noise audits.',
    keywords:
      'pre-decision audit sibony checklists pre-mortems structured independent assessment noise audits quadrants',
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
    tabId: 'positioning_hub',
    section: 'External Story',
    preview: 'Moat narrative, market sizing, "why now" hook.',
    keywords:
      'positioning external story moat narrative market sizing why now pitch fundraise tam sam som',
  },
  {
    tabId: 'positioning_hub',
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
    tabId: 'sales',
    section: 'MEDDIC · qualify the pilot',
    preview:
      'The MEDDIC qualification framework mapped to the DI sale: discovery questions, DI application, and proof per letter. Mark each one for a live prospect and see the weak links.',
    keywords:
      'meddic meddpicc qualify qualification deal pilot metrics economic buyer decision criteria process identify pain champion discovery questions enterprise sales framework proof dpr dqi r2f retro audit boardroom twin wedge gp cso corp dev close next weak links deal health',
  },
  // Closing Lab — Maalouf + Satyam + brutal-honest critique synthesis.
  // Surfaced as 5 distinct search entries so a query for "fastest
  // converters" or "silent objections" or "pressure without pressure"
  // lands directly on the relevant section.
  {
    tabId: 'closing_lab',
    section: 'Closing Lab · 3 fastest converters',
    preview:
      'Mid-market PE/VC associate · boutique sell-side M&A advisor · solo fractional CSO. The personas who can swipe a corporate card today.',
    keywords:
      'closing lab fastest converters mid market associate adaeze archetype potomac boutique sell side m&a advisor fractional cso ex mbb mckinsey bcg bain solo consultant 14 day outreach sequence corporate card swipe pre seed wedge personas',
  },
  {
    tabId: 'closing_lab',
    section: 'Closing Lab · Maalouf 6 high-ticket-psychology principles',
    preview:
      'Pressure without pressure · authority not trust · embody bigger and better · talk about other opportunities · stay in business longer.',
    keywords:
      'closing lab maalouf eddie psychology high ticket deals pressure without pressure authority not trust low ticket high ticket talk other opportunities embody bigger better stay in business longer status',
  },
  {
    tabId: 'closing_lab',
    section: 'Closing Lab · Satyam 5 sales-infrastructure pillars',
    preview:
      'Category of one · us-vs-them frame · conviction is the variable · charge more and win anyway · sales infrastructure is the weapon.',
    keywords:
      'closing lab satyam vizionaryfocuss sell so good competition becomes irrelevant category of one us vs them conviction infrastructure charge more sales experience product before product',
  },
  {
    tabId: 'closing_lab',
    section: 'Closing Lab · 5 silent objections',
    preview:
      'DQI is "trust me" math · NDA hard-purge · 16-year-old continuity · ChatGPT wrapper suspicion · Pan-African regulatory illusion.',
    keywords:
      'closing lab silent objections brutal honest critique pre mortem dqi trust me math confidence intervals nda hard purge cathedral of code 16 year old founder continuity stanford ap exams chatgpt wrapper ensemble sampling pan african regulatory isa 2007 frc nigeria',
  },
  {
    tabId: 'closing_lab',
    section: 'Closing Lab · 80% cut list + 4-step funnel + phrases to never say',
    preview:
      'What to kill / hide / move to enterprise · the simplified landing→demo→audit→checkout funnel · 3 phrases that kill deals.',
    keywords:
      'closing lab cut list 80 percent kill hide feature flag enterprise tier simplified funnel landing demo audit checkout four step never say phrases ai decision intelligence platform 12 node langgraph customize whatever you need',
  },
  // Sparring Room — live sales-rep practice. Wispr Flow voice → grade.
  {
    tabId: 'sparring_room',
    section: 'Sparring Room · Live sales-rep practice with AI grading',
    preview:
      'Pick a buyer persona × scenario, hear their opener + 3 questions, speak via Wispr Flow, paste transcript, get a 10-dim Sales DQI scorecard.',
    keywords:
      'sparring room practice live rep wispr flow voice transcript sales dqi grade buyer persona scenario rehearse pitch coach mid market pe associate margaret titi adaeze potomac marcus james riya cold first meeting skeptical follow up hot inbound procurement objection handler live demo',
  },
  {
    tabId: 'sparring_room',
    section:
      'Sparring Room · 7 buyer personas (Adaeze / Margaret / Titi / Potomac / Marcus / James / Riya)',
    preview:
      'Three fastest-converters + Margaret-class F500 CSO + Titi-class Pan-African fund partner + James-class GC + Riya-class pre-seed VC associate.',
    keywords:
      'sparring buyer personas adaeze mid market pe associate margaret f500 cso fortune 500 chief strategy officer titi pan african fund partner potomac boutique sell side m&a advisor marcus solo fractional cso james gc audit committee general counsel riya pre seed vc associate',
  },
  {
    tabId: 'sparring_room',
    section:
      'Sparring Room · Sales DQI rubric (Maalouf 4 + Satyam 3 + DI discipline 2 + fundamentals 1)',
    preview:
      '10-dimension grading: pressure-without-pressure, authority-not-trust, pinpoint-pain, embody-bigger, category-of-one, conviction, infrastructure, vocabulary, empathic-mode-first, specificity.',
    keywords:
      'sparring sales dqi rubric grading dimensions pressure without pressure authority not trust pinpoint pain embody bigger better category of one conviction transmission sales infrastructure quality vocabulary discipline empathic mode first specificity over vagueness maalouf satyam',
  },
  {
    tabId: 'sparring_room',
    section: 'Sparring Room · 7 scenario modes incl. networking-event in-person',
    preview:
      'Networking event in-person (London) · cold first meeting · skeptical follow-up · hot inbound · procurement evaluation · live objection handler · live demo specimen walkthrough.',
    keywords:
      'sparring scenario modes networking event in person london drinks party conference cold first meeting skeptical follow up hot inbound procurement evaluation gc ciso live objection handling 30 seconds live demo specimen audit walkthrough wework dangote 7 minute',
  },
  // Education Room — flashcard + recall + apply mastery engine across
  // 15 decks / 160+ cards. Surfaced as 4 distinct entries so a query for
  // "flashcards" or "loss aversion" or "regulatory frameworks" lands on
  // the deck picker.
  {
    tabId: 'education_room',
    section: 'Education Room · Flashcard + recall + apply across 15 decks',
    preview: `160+ cards covering DI vocabulary, 7 buyer personas, Maalouf 6 + Satyam 5, 15-dim Sales DQI rubric, 5 silent objections, ${FRAMEWORK_COUNT} regulatory frameworks, 12-node pipeline, R²F integration, advanced sales moves, strategic thinking, Goldner discovery. SM-2 spaced repetition + AI-graded recall.`,
    keywords:
      'education room flashcards recall apply spaced repetition sm2 mastery recollection wispr flow practice rehearsal vocabulary discipline locked banned r2f dpr dqi pipeline regulatory frameworks personas verbatim brinkmanship strategic thinking goldner',
  },
  {
    tabId: 'education_room',
    section: 'Education Room · DI Vocabulary deck (locked + banned + cold-context bridges)',
    preview: `20 cards: reasoning layer, R²F, DPR, DQI, ${HISTORICAL_CASE_COUNT} historical decisions, ${FRAMEWORK_COUNT} frameworks, ${BIAS_COUNT}-bias R²F taxonomy, ~90% margin, banned phrases (decision intelligence platform / decision hygiene / boardroom strategic decision).`,
    keywords: `education room di vocabulary deck reasoning layer r2f dpr dqi ${HISTORICAL_CASE_COUNT} decisions ${FRAMEWORK_COUNT} frameworks ${BIAS_COUNT} biases blended margin banned decision intelligence platform decision hygiene boardroom strategic decision warm cold context bridge specimen library wework dangote design partner seats`,
  },
  {
    tabId: 'education_room',
    section:
      'Education Room · Buyer Personas deck (Adaeze / Potomac / Marcus / Margaret / Titi / James / Riya)',
    preview:
      "14 cards: each persona's role + ticket band + primary concern + verbatim opener phrase + canonical objection-handler response.",
    keywords:
      'education room buyer personas deck adaeze mid market pe associate potomac boutique m&a advisor marcus solo fractional cso margaret f500 cso titi pan african fund partner james gc audit committee riya pre seed vc verbatim phrase opener objection',
  },
  {
    tabId: 'education_room',
    section: `Education Room · Loss-aversion framing + ${FRAMEWORK_COUNT} regulatory frameworks + R²F (Kahneman + Klein) + Founder one-liners`,
    preview: `Kahneman & Tversky 1979 prospect theory applied to your sales pitch · the ${FRAMEWORK_COUNT} regulatory frameworks card-by-card · how 3 nodes implement Kahneman + 3 implement Klein + metaJudge arbitrates · External Attack Vectors + ICP wedge vs ceiling.`,
    keywords:
      'education room loss aversion framing kahneman tversky prospect theory regulatory frameworks eu ai act basel iii ndpr cbn waemu popia isa 2007 r2f kahneman klein recognition primed decision pre mortem external attack vectors icp wedge ceiling design partner contract',
  },
  {
    tabId: 'accountability_sprint',
    section: 'Accountability Sprint · 1-on-1 mentor brief + 4-week plan',
    preview:
      'Extraction plan for the Kristian Marcus 1-on-1 (InsurX PM): the InsurX↔DI parallel opener, what to pull from him, the 4-week goal + week-1 commitments, logistics, and the relationship play.',
    keywords:
      'accountability sprint kristian marcus insurx mentor advisor 1 on 1 one on one hoxton shoreditch four week 4 week plan goal commitments discovery script bafta strategy world london institutional trust playbook empower not threaten pm friction teardown engineer to distribution pivot relationship play whatsapp',
  },
  // Outreach Hub — three internal sections, surfaced separately in
  // search so the founder lands on the right section directly.
  {
    tabId: 'outreach_hub',
    section: 'Outreach Hub · Pipeline & Strategy',
    preview: 'ICP events, this-week priority, persona map, channel matrix, contact tracker.',
    keywords:
      'outreach pipeline strategy icp events this week priority persona map channel matrix contact tracker poc kit framework punch list traction plan command center',
  },
  {
    tabId: 'outreach_hub',
    section: 'Outreach Hub · Message Generator',
    preview: 'Paste a profile, pick an intent, draft a tailored message.',
    keywords:
      'outreach message generator linkedin draft compose tailored message intent connect pilot poc investor history meetings',
  },
  {
    tabId: 'outreach_hub',
    section: 'Outreach Hub · Design Partners',
    preview: 'Inbound prospect intake + design-partner program structure.',
    keywords:
      'design partners inbound prospect intake program structure conversion poc paid pilot loi',
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
    sectionId: 'integrations-flywheel',
  },
  {
    tabId: 'data_ecosystem',
    section: 'Live Stats',
    preview: 'Output metrics, usage, activation.',
    keywords: 'live stats metrics usage activation kpi analytics dashboard numbers',
    sectionId: 'live-stats',
  },
  {
    tabId: 'case_library',
    section: 'Historical Cases',
    preview: `${ALL_CASES.length} case studies, ${CASES_WITH_PRE_DECISION_EVIDENCE} with pre-decision evidence.`,
    keywords:
      'historical cases kodak blockbuster nokia enron case studies library evidence corporate decisions',
    sectionId: 'historical-cases',
  },
  {
    tabId: 'case_library',
    section: 'Correlation & Causal',
    preview: 'Bias interaction matrix, toxic combinations.',
    keywords: 'correlation causal bias interaction matrix toxic combinations compound patterns',
    sectionId: 'correlation-causal',
  },
  {
    tabId: 'case_library',
    section: 'Decision Alpha',
    preview: 'CEO decision quality leaderboard.',
    keywords: 'decision alpha ceo leaderboard quality buffett musk huang zuck rankings',
    sectionId: 'decision-alpha',
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
    tabId: 'positioning_hub',
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
    tabId: 'path_to_100m',
    section: 'Path to £100M Exits',
    preview:
      'Strategic compass + per-role outreach playbooks (8 personas) + R²F intellectual moat deep-dive + 16 investor metrics + killer responses to "not for us" / "I’m confused" + warm-intro network map + 90-day action plan + NotebookLM follow-up lab.',
    keywords:
      // Search keywords scrubbed 2026-05-02 of named-prospect leaks per
      // CLAUDE.md no-named-prospects rule. Removed: sankore, lrqa,
      // ian spaulding, bureau veritas, sgs, intertek, dnv, tasis school,
      // family relationships, named pre-seed funds. Kept: category descriptors
      // (assurance firm, fund partner, F500 GC), public competitors named in
      // pitch decks (cloverpop, aera, ibm watsonx, quantellia), advisor
      // relationship category, and the public Wiz $32B reference (CLAUDE.md
      // approved credential). The founder still finds this tab via category
      // searches without exposing prospect identities in the client bundle.
      'path 100m arr 100 million unicorn 2030 north star strengths weaknesses matrix r2f recognition rigor framework kahneman klein meta judge mercier sperber argumentative reasoning environmental validity decision framing gate provisional patents academic credentials category definition vocabulary cold warm bridge sentence persona pitch library cso vp strategy corp dev mna m&a fund partner fortune 500 general counsel audit committee mckinsey quantumblack bcg gamma bain advanced analytics assurance firm compliance assurance pre-seed seed venture investor advisor outreach playbook discovery questions killer pitch meeting arc cold opener warm intro follow-up cadence signals positive negative phrases never to say objection handling not for us right now jolt effect honest off-ramp pings echoes refrigerator confused vulnerability reset 5th grade financial anchor evidence challenge cloverpop aera ibm watsonx category contrast investor metrics bookings revenue arr mrr gross profit tcv acv ltv cac billings churn cmgr burn rate downloads vanity cumulative chart tricks size before growth failure modes watchtower quantellia consulting trap manual logging cathedral of code external attack vector ibm bundling agentic shift warm intro network map mckinsey pre-seed funds 90-day action plan may june july 2026 isa 2007 dqi confidence intervals gtm co-founder reference case term sheet notebooklm follow-up lab questions',
  },
  {
    tabId: 'outreach_hub',
    section: 'Outreach Hub · Design Partner Triage',
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
  {
    tabId: 'founder_os',
    section: 'Founder OS',
    preview:
      'GTM v3.5 §11 (RATIFIED 2026-05-05) — the cognitive-discipline surface that makes the Phase 1 motion executable. Six pillars: Neurobiological Protection (zero SFC), Long-Form Information Diet (30-min minimum, primary sources), Active Recall + Elaborative Encoding, AI Orchestration NOT Cognitive Offloading, Distress Tolerance + Emotional Regulation, Internal Locus of Control. Daily checkin (SFC = 0?, deep work hours, deep reading minutes, exercise, meditation), SFC-zero streak counter, long-form content log with active-recall summaries, quarterly skill acquisition tracker, weekly review prompt every Sunday. Check first thing daily before LinkedIn or email.',
    keywords:
      'founder os operating system discipline cognitive sfc short-form short form content tiktok reels shorts ban eliminate dopamine prefrontal cortex executive function deep work deep reading active recall elaborative encoding ai orchestration cognitive offloading distress tolerance emotional regulation locus of control reverse flynn effect long-form youtube interviews 30 minutes pillars checkin streak weekly review skill acquisition quarterly progressive summarisation neurobiology',
  },
  {
    tabId: 'metrics',
    section: 'Metrics',
    preview:
      'Real-time GTM v3.5 Phase 1 dashboard. Vohra HXC PMF % vs the 40% graduation gate, paid HXC customers retained 90+ days vs the 8-12 baseline, demos completed, audit volume per HXC user per week, outcome closure rate, micro-deliberation events with confirmation rate, Brier baseline, Bias Genome distinct-bias contribution, days-since-X cadence tripwires. Auto-refreshes every 60 seconds. The single surface to glance at every morning to decide scale-or-pivot.',
    keywords:
      'metrics dashboard pmf vohra hxc graduation kill threshold paid customers retention 90 days demos completed audits weekly monthly outcome closure rate brier calibration bias genome moat micro-deliberation funnel signups conversion phase 1 real-time refresh trend cadence tripwires days since',
  },
];

const SEARCH_RESULT_LIMIT = 24;

function escapeRegexLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Wrap each matched token in the text with a highlight mark. Builds React nodes
// (no dangerouslySetInnerHTML) by splitting on a capturing alternation: the
// matched groups land on odd indices.
function highlightTokens(text: string, tokens: string[]): React.ReactNode {
  const valid = tokens
    .map(escapeRegexLiteral)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (valid.length === 0) return text;
  const parts = text.split(new RegExp(`(${valid.join('|')})`, 'ig'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{
          background: 'color-mix(in srgb, var(--accent-primary) 24%, transparent)',
          color: 'var(--text-primary)',
          borderRadius: 3,
          padding: '0 2px',
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const SEARCH_FIELD_WEIGHTS = {
  section: { exact: 12, prefix: 9, substr: 6 },
  keywords: { exact: 7, prefix: 5, substr: 3 },
  preview: { exact: 4, prefix: 3, substr: 1 },
};

function fieldTokenScore(
  field: string,
  words: string[],
  tok: string,
  w: { exact: number; prefix: number; substr: number }
): number {
  if (words.includes(tok)) return w.exact;
  if (words.some(word => word.startsWith(tok))) return w.prefix;
  if (field.includes(tok)) return w.substr;
  return 0;
}

// Ranked, multi-term (AND) scoring: EVERY token must match somewhere, or the
// entry is dropped (-1). A match in the section title ranks above keywords
// above preview; a whole-word match above a word-prefix above a raw substring.
function scoreSearchEntry(entry: SearchEntry, tokens: string[]): number {
  const section = entry.section.toLowerCase();
  const keywords = entry.keywords.toLowerCase();
  const preview = entry.preview.toLowerCase();
  const sectionWords = section.split(/[^a-z0-9]+/i).filter(Boolean);
  const keywordWords = keywords.split(/[^a-z0-9]+/i).filter(Boolean);
  const previewWords = preview.split(/[^a-z0-9]+/i).filter(Boolean);
  let total = 0;
  for (const tok of tokens) {
    const best = Math.max(
      fieldTokenScore(section, sectionWords, tok, SEARCH_FIELD_WEIGHTS.section),
      fieldTokenScore(keywords, keywordWords, tok, SEARCH_FIELD_WEIGHTS.keywords),
      fieldTokenScore(preview, previewWords, tok, SEARCH_FIELD_WEIGHTS.preview)
    );
    if (best === 0) return -1;
    total += best;
  }
  return total;
}

function SearchResults({ query, onJump }: { query: string; onJump: (tabId: TabId) => void }) {
  const tokens = useMemo(() => query.toLowerCase().trim().split(/\s+/).filter(Boolean), [query]);

  const matches = useMemo(() => {
    if (tokens.length === 0) return [];
    return SEARCH_INDEX.map(entry => ({ entry, score: scoreSearchEntry(entry, tokens) }))
      .filter(m => m.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [tokens]);

  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset the highlighted result whenever the query changes. Deferred via
  // setTimeout(…, 0) to satisfy react-hooks/set-state-in-effect (codebase idiom).
  useEffect(() => {
    const t = setTimeout(() => setSelected(0), 0);
    return () => clearTimeout(t);
  }, [query]);

  // Click handler that deep-links into the matching accordion section when
  // sectionId is set. Sets the URL hash BEFORE onJump so when the new tab's
  // AccordionSection mounts, its hashchange-aware effect catches it and
  // auto-opens + scrolls. (B1 lock 2026-04-28.)
  const jumpToEntry = useCallback(
    (entry: SearchEntry) => {
      if (entry.sectionId && typeof window !== 'undefined') {
        const targetHash = `#${entry.sectionId}`;
        // Replace then re-set so consecutive clicks on the same section re-fire
        // the hashchange listener inside AccordionSection.
        if (window.location.hash === targetHash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        requestAnimationFrame(() => {
          window.location.hash = targetHash;
        });
      }
      onJump(entry.tabId);
    },
    [onJump]
  );

  // Keyboard navigation: ↑ ↓ to move through results, Enter to jump. Works while
  // the cursor is in the search box (a single-line input ignores ↑ ↓).
  useEffect(() => {
    if (matches.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, matches.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const m = matches[selected];
        if (m) jumpToEntry(m.entry);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [matches, selected, jumpToEntry]);

  // Keep the highlighted result scrolled into view.
  useEffect(() => {
    const node = listRef.current?.children[selected] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (tokens.length === 0) return null;

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
          <strong style={{ color: 'var(--accent-primary)' }}>{query}</strong>&quot;
          <span style={{ color: 'var(--text-muted)' }}> · ↑↓ to navigate, ↵ to jump</span>
        </span>
      </div>
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(({ entry }, idx) => {
          const tab = TABS.find(t => t.id === entry.tabId);
          const isSel = idx === selected;
          return (
            <button
              key={`${entry.tabId}-${entry.section}`}
              onClick={() => jumpToEntry(entry)}
              onMouseEnter={() => setSelected(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                borderRadius: 10,
                border: `1px solid ${isSel ? 'var(--accent-primary)' : 'var(--border-primary, #222)'}`,
                background: isSel
                  ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary, #111))'
                  : 'var(--bg-secondary, #111)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
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
                  {highlightTokens(entry.section, tokens)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {highlightTokens(entry.preview, tokens)}
                </div>
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
// Persist a successful unlock on this device so the founder isn't re-prompted
// on every page reload / tab navigation. The REAL access control is the
// server-side isAdminUserId gate in layout.tsx — this client keypad is only
// defense-in-depth (a shared/borrowed logged-in session), so remembering the
// unlock on the device is an acceptable trade for the speed.
const UNLOCK_STORAGE_KEY = 'di-founder-hub-unlocked-v1';

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
  const [mounted, setMounted] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // chatPaneOpen state + localStorage sync were retired 2026-04-23 when
  // the AI chat switched from permanent-pane to floating widget. The
  // `di-founder-hub-chat-pane` localStorage key orphans on first load
  // for returning users — acceptable, no migration needed.
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore a prior unlock on this device (set `mounted` afterwards so we
  // never flash the lock screen for an already-unlocked returning user).
  useEffect(() => {
    try {
      if (localStorage.getItem(UNLOCK_STORAGE_KEY) === '1') setUnlocked(true);
    } catch {
      // localStorage unavailable (e.g. private mode) — fall through to keypad.
    }
    setMounted(true);
  }, []);

  // Auto-unlock the instant the entered code matches — no Enter or button
  // press needed. Drives both the on-screen keypad and physical typing.
  useEffect(() => {
    if (unlocked || !FOUNDER_PASS) return;
    if (passInput === FOUNDER_PASS) {
      setUnlocked(true);
      setPassError(false);
      try {
        localStorage.setItem(UNLOCK_STORAGE_KEY, '1');
      } catch {
        // ignore — unlock still holds for this session.
      }
    }
  }, [passInput, unlocked]);

  const handleKeypadPress = useCallback((digit: string) => {
    setPassError(false);
    setPassInput(prev => (prev + digit).slice(0, 64));
  }, []);

  const handleKeypadBackspace = useCallback(() => {
    setPassError(false);
    setPassInput(prev => prev.slice(0, -1));
  }, []);

  const handleKeypadClear = useCallback(() => {
    setPassError(false);
    setPassInput('');
  }, []);

  // Wrong-code error only surfaces on an explicit Enter — the auto-unlock
  // effect owns the success path, so the founder normally never sees it.
  const handleSubmit = useCallback(() => {
    if (FOUNDER_PASS && passInput === FOUNDER_PASS) return;
    setPassError(true);
  }, [passInput]);

  // Physical-keyboard fallback while locked (e.g. if the code isn't purely
  // numeric) — without rendering a text field, so the keypad stays primary.
  useEffect(() => {
    if (unlocked || !mounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key.length === 1) {
        handleKeypadPress(e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [unlocked, mounted, handleKeypadBackspace, handleKeypadPress, handleSubmit]);

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

  if (!mounted) {
    // Avoid flashing the lock screen before the localStorage restore runs
    // for an already-unlocked returning user.
    return <div style={{ minHeight: '60vh' }} />;
  }

  if (!unlocked) {
    const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const btnStyle: React.CSSProperties = {
      height: 56,
      borderRadius: 12,
      border: '1px solid var(--border-primary, #333)',
      background: 'var(--bg-secondary, #111)',
      color: 'var(--text-primary, #fff)',
      fontSize: 20,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      transition: 'background 0.12s ease',
    };
    return (
      <div
        className="max-w-xs mx-auto px-4"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Lock size={36} style={{ color: 'var(--text-muted, #71717a)', marginBottom: 14 }} />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary, #fff)',
            marginBottom: 6,
          }}
        >
          Founder Access Only
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted, #71717a)',
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          Tap your access code.
        </p>

        {/* Entered-code dots */}
        <div
          aria-hidden
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 16,
            maxWidth: 220,
            marginBottom: 18,
          }}
        >
          {passInput.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted, #71717a)', letterSpacing: 4 }}>
              ••••
            </span>
          ) : (
            passInput.split('').map((_, i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: passError ? '#ef4444' : '#16A34A',
                  display: 'inline-block',
                }}
              />
            ))
          )}
        </div>

        {/* Click keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 260,
          }}
        >
          {keypadKeys.map(k => (
            <button key={k} type="button" onClick={() => handleKeypadPress(k)} style={btnStyle}>
              {k}
            </button>
          ))}
          <button
            type="button"
            onClick={handleKeypadClear}
            style={{ ...btnStyle, fontSize: 13, color: 'var(--text-muted, #71717a)' }}
          >
            Clear
          </button>
          <button type="button" onClick={() => handleKeypadPress('0')} style={btnStyle}>
            0
          </button>
          <button
            type="button"
            onClick={handleKeypadBackspace}
            aria-label="Delete last digit"
            style={{ ...btnStyle, color: 'var(--text-muted, #71717a)' }}
          >
            <Delete size={20} />
          </button>
        </div>

        {passError && (
          <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 14 }}>
            Incorrect access code.
          </p>
        )}
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-muted, #71717a)',
            marginTop: 14,
            textAlign: 'center',
          }}
        >
          Unlocks automatically when the code matches, then stays unlocked on this device.
        </p>
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
        /* Mobile-only Ask AI pill in the header. Hidden ≥768px where
           the floating bubble at bottom-right is reachable. (B5 lock
           2026-04-28.) */
        @media (max-width: 767px) {
          .founder-hub-ask-ai-pill {
            display: inline-flex !important;
          }
        }
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
                fontSize: 'var(--fs-page-h1-platform)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary, #fff)',
                margin: 0,
              }}
            >
              Founder Hub
            </h1>
            {/* Mobile-only Ask AI pill — the floating bubble at bottom-right
                is hard to reach + signal-quiet on a 320px viewport. This
                button dispatches `founder-chat-open` which the
                FounderChatWidget listener catches; the chat then snaps to
                full-screen below 640px via the widget's own media query.
                Hidden ≥768px since the floating bubble works fine there.
                (B5 lock 2026-04-28.) */}
            <button
              type="button"
              className="founder-hub-ask-ai-pill"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('founder-chat-open'));
                }
              }}
              aria-label="Ask the Founder AI"
              style={{
                marginLeft: 8,
                display: 'none',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={13} />
              Ask AI
            </button>
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
        {/* Apply LEGACY_TAB_REDIRECTS at the map-nav entry point so the
            StartHere map (which still names retired slugs like
            'positioning_copilot' / 'category_position' as separate
            visual nodes) routes to the consolidated tab. The map nodes
            stay as conceptual sub-flow visualisations; clicks land on
            the canonical tab. */}
        <StartHereTab
          onNavigateToTab={id => {
            const target = (LEGACY_TAB_REDIRECTS[id] ?? id) as TabId;
            setActiveTab(target);
          }}
        />
      </ErrorBoundary>
    ),
    overview: <ProductOverviewTab />,
    positioning_hub: (
      <ErrorBoundary sectionName="Positioning Hub">
        <PositioningHubTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    product_deep: (
      <>
        <AccordionSection
          title="Analysis Pipeline"
          subtitle="12-node LangGraph sequence"
          sectionId="analysis-pipeline"
        >
          <ErrorBoundary sectionName="Analysis Pipeline">
            <CorePipelineTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection
          title="Scoring Engine"
          subtitle="Toxic patterns and risk multipliers"
          sectionId="scoring-engine"
        >
          <ErrorBoundary sectionName="Scoring Engine">
            <ScoringEngineTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection
          title="DQI Methodology"
          subtitle="Formula, percentiles, calibration"
          sectionId="dqi-methodology"
        >
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
    sales: (
      <ErrorBoundary sectionName="Sales Toolkit">
        <SalesToolkitTab />
      </ErrorBoundary>
    ),
    closing_lab: (
      <ErrorBoundary sectionName="Closing Lab">
        <ClosingLabTab />
      </ErrorBoundary>
    ),
    sparring_room: (
      <ErrorBoundary sectionName="Sparring Room">
        <SparringRoomTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    education_room: (
      <ErrorBoundary sectionName="Education Room">
        <EducationRoomTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    outreach_hub: (
      <ErrorBoundary sectionName="Outreach Hub">
        <OutreachHubTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    lrqa: (
      // ErrorBoundary sectionName scrubbed 2026-05-02 of named prospect.
      <ErrorBoundary sectionName="Assurance firm warm-intro brief">
        <LrqaTab />
      </ErrorBoundary>
    ),
    cornerstone: (
      // Phase 2 lock 2026-05-09 — sectionName + tab label scrubbed of
      // named prospect per CLAUDE.md no-named-prospects rule.
      <ErrorBoundary sectionName="Pre-seed VC warm-intro brief">
        <CornerstoneBriefTab />
      </ErrorBoundary>
    ),
    accountability_sprint: (
      <ErrorBoundary sectionName="Accountability Sprint brief">
        <AccountabilitySprintTab />
      </ErrorBoundary>
    ),
    antler_brief: (
      // sectionName scrubbed of named prospect per CLAUDE.md no-named-prospects
      // rule (the brief content names Magnus / Antler internally).
      <ErrorBoundary sectionName="Day-zero VC inbound brief">
        <AntlerBriefTab />
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
          sectionId="integrations-flywheel"
        >
          <IntegrationsAndFlywheelTab />
        </AccordionSection>
        <AccordionSection
          title="Live Stats"
          subtitle="Output metrics, usage, activation"
          sectionId="live-stats"
        >
          <LiveStatsTab />
        </AccordionSection>
      </>
    ),
    case_library: (
      <>
        <AccordionSection
          title="Historical Cases"
          subtitle={`${CASES_WITH_PRE_DECISION_EVIDENCE} case studies with pre-decision evidence`}
          sectionId="historical-cases"
        >
          <CaseStudiesTab />
        </AccordionSection>
        <AccordionSection
          title="Correlation & Causal Graph"
          subtitle="Bias interaction matrix, toxic combinations"
          sectionId="correlation-causal"
        >
          <ErrorBoundary sectionName="Correlation & Causal">
            <CorrelationCausalTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection
          title="Decision Alpha"
          subtitle="CEO decision quality leaderboard"
          sectionId="decision-alpha"
        >
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
    unicorn_roadmap: (
      <ErrorBoundary sectionName="Unicorn Roadmap">
        <UnicornRoadmapTab />
      </ErrorBoundary>
    ),
    path_to_100m: (
      <ErrorBoundary sectionName="Path to £100M Exits">
        <PathToHundredMillionTab />
      </ErrorBoundary>
    ),
    pilot_plan: (
      <ErrorBoundary sectionName="Pilot Plan">
        <PilotPlanTab />
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
    voice_activity: (
      <ErrorBoundary sectionName="Voice Activity">
        <VoiceActivityTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    metrics: (
      <ErrorBoundary sectionName="Metrics">
        <MetricsTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    founder_os: (
      <ErrorBoundary sectionName="Founder OS">
        <FounderOSTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    faith_os: (
      <ErrorBoundary sectionName="Faith OS">
        <FaithOSTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    sat_prep: (
      <ErrorBoundary sectionName="SAT Prep">
        <SatPrepTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    reality_protocol: (
      <ErrorBoundary sectionName="66-Day Protocol">
        <RealityProtocolTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
  };

  return TAB_CONTENT[activeTab];
}
