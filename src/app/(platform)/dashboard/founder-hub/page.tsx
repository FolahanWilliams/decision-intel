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
const StrategyAndPositioningTab = dynamic(
  () =>
    import('@/components/founder-hub/StrategyAndPositioningTab').then(m => ({
      default: m.StrategyAndPositioningTab,
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
const PlaybookAndResearchTab = dynamic(
  () =>
    import('@/components/founder-hub/PlaybookAndResearchTab').then(m => ({
      default: m.PlaybookAndResearchTab,
    })),
  { loading: tabLoader }
);
const MethodologiesAndPrinciplesTab = dynamic(
  () =>
    import('@/components/founder-hub/MethodologiesAndPrinciplesTab').then(m => ({
      default: m.MethodologiesAndPrinciplesTab,
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
const InvestorDefenseTab = dynamic(
  () =>
    import('@/components/founder-hub/InvestorDefenseTab').then(m => ({
      default: m.InvestorDefenseTab,
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
} from 'lucide-react';
import { card } from '@/components/founder-hub/shared-styles';
import { AccordionSection } from '@/components/founder-hub/AccordionSection';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'product_deep'
  | 'research'
  | 'positioning'
  | 'sales'
  | 'outreach'
  | 'content'
  | 'data_ecosystem'
  | 'case_library'
  | 'founder_tips'
  | 'founder_school';

type TabGroup = 'Product' | 'Go-to-Market' | 'Intelligence' | 'Tools';

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
  // Product
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} />, group: 'Product' },
  { id: 'product_deep', label: 'Pipeline & Scoring', icon: <Brain size={16} />, group: 'Product' },
  { id: 'research', label: 'Research & Foundations', icon: <BookOpen size={16} />, group: 'Product' },
  // Go-to-Market
  { id: 'positioning', label: 'Competitive Positioning', icon: <Shield size={16} />, group: 'Go-to-Market' },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} />, group: 'Go-to-Market' },
  { id: 'outreach', label: 'Outreach & Meetings', icon: <Crosshair size={16} />, group: 'Go-to-Market' },
  { id: 'content', label: 'Content Studio', icon: <Zap size={16} />, group: 'Go-to-Market' },
  // Intelligence
  { id: 'data_ecosystem', label: 'Data Ecosystem', icon: <Plug size={16} />, group: 'Intelligence' },
  { id: 'case_library', label: 'Case Library', icon: <Library size={16} />, group: 'Intelligence' },
  // Tools
  { id: 'founder_tips', label: 'Founder Tips', icon: <Lightbulb size={16} />, group: 'Tools' },
  { id: 'founder_school', label: 'Founder School', icon: <GraduationCap size={16} />, group: 'Tools' },
];

const TAB_GROUPS: TabGroup[] = ['Product', 'Go-to-Market', 'Intelligence', 'Tools'];

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
    tabId: 'overview',
    section: 'Product Overview',
    preview: 'High-level narrative: the four moments we catch what others miss.',
    keywords:
      'overview narrative moat four moments elevator pitch positioning compounding decision knowledge graph dqi',
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
      'dqi decision quality index methodology formula percentile calibration 146 historical decisions benchmark',
  },
  {
    tabId: 'research',
    section: 'Methodologies & Principles',
    preview: 'Kahneman, Sibony, Strebulaev — academic foundations.',
    keywords:
      'kahneman sibony strebulaev noise thinking fast slow behavioral economics academic research principles',
  },
  {
    tabId: 'research',
    section: 'Playbook & Research',
    preview: 'Cited papers, research library, decision playbook.',
    keywords: 'playbook research library papers citations decision protocol checklist method',
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
    preview: '14 case studies with pre-decision evidence.',
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
];

function SearchResults({
  query,
  onJump,
}: {
  query: string;
  onJump: (tabId: TabId) => void;
}) {
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
        <Search size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {matches.length} section{matches.length === 1 ? '' : 's'} match &quot;
          <strong style={{ color: '#16A34A' }}>{query}</strong>&quot; — click to jump.
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
                e.currentTarget.style.borderColor = '#16A34A';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-primary, #222)';
              }}
            >
              <div style={{ marginTop: 2, color: '#16A34A' }}>{tab?.icon}</div>
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
    if (typeof window === 'undefined') return 'overview';
    const raw = new URLSearchParams(window.location.search).get('tab');
    if (!raw) return 'overview';
    const validIds = TABS.map(t => t.id);
    if (validIds.includes(raw as TabId)) return raw as TabId;
    return LEGACY_TAB_REDIRECTS[raw] ?? 'overview';
  });
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Incorrect access code.</p>
        )}
      </div>
    );
  }

  // Only build TAB_CONTENT when NOT searching. Building this record
  // instantiates every dynamic() component, defeating lazy loading.
  const tabContent: React.ReactNode = searchQuery ? null : renderTab(activeTab, FOUNDER_PASS);

  return (
    <ErrorBoundary sectionName="Founder Hub">
      <div className="founder-hub-root max-w-6xl mx-auto px-4 py-6">
        {renderHeader()}
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
        <FounderChatWidget founderPass={FOUNDER_PASS} />
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
            <Rocket size={26} style={{ color: '#16A34A' }} />
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
                        color: isActive
                          ? 'var(--text-highlight)'
                          : 'var(--text-secondary)',
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
                          color: isActive
                            ? 'var(--accent-primary)'
                            : 'var(--text-muted)',
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

function renderTab(activeTab: TabId, FOUNDER_PASS: string): React.ReactNode {
  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    overview: <ProductOverviewTab />,
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
      <>
        <AccordionSection
          title="Methodologies & Principles"
          subtitle="Kahneman, Sibony, Strebulaev — academic foundations"
        >
          <ErrorBoundary sectionName="Methodologies & Principles">
            <MethodologiesAndPrinciplesTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection
          title="Playbook & Research"
          subtitle="Cited papers, research library, decision playbook"
        >
          <ErrorBoundary sectionName="Playbook & Research">
            <PlaybookAndResearchTab />
          </ErrorBoundary>
        </AccordionSection>
      </>
    ),
    positioning: (
      <>
        <AccordionSection
          title="External Story"
          subtitle="Moat narrative, market sizing, 'why now' hook"
        >
          <ErrorBoundary sectionName="Strategy & Positioning">
            <StrategyAndPositioningTab />
          </ErrorBoundary>
        </AccordionSection>
        <AccordionSection
          title="Investor Defense"
          subtitle="Kill-shot objections, Q&A, competitive responses"
        >
          <ErrorBoundary sectionName="Investor Defense">
            <InvestorDefenseTab />
          </ErrorBoundary>
        </AccordionSection>
      </>
    ),
    sales: (
      <ErrorBoundary sectionName="Sales Toolkit">
        <SalesToolkitTab />
      </ErrorBoundary>
    ),
    outreach: <OutreachAndMeetingsTab founderPass={FOUNDER_PASS} />,
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
        <AccordionSection title="Historical Cases" subtitle="14 case studies with pre-decision evidence">
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
        <AccordionSection
          title="Decision Alpha"
          subtitle="CEO decision quality leaderboard"
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
  };

  return TAB_CONTENT[activeTab];
}
