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

// ─── Search Results ────────────────────────────────────────────────────────

function SearchResults({
  query,
  tabContent,
}: {
  query: string;
  tabContent: Record<TabId, React.ReactNode>;
}) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

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
          Showing all tabs filtered by &quot;<strong style={{ color: '#16A34A' }}>{query}</strong>
          &quot; — use{' '}
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid var(--border-primary, #333)',
              fontSize: 11,
            }}
          >
            Ctrl+F
          </kbd>{' '}
          to jump to matches
        </span>
      </div>
      {TABS.map(tab => (
        <div key={tab.id} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              padding: '8px 0',
              borderBottom: '1px solid var(--border-primary, #222)',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {tab.label}
            </span>
          </div>
          {tabContent[tab.id]}
        </div>
      ))}
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

  return (
    <ErrorBoundary sectionName="Founder Hub">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header + Search */}
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

        {/* Tab Navigation — grouped by category (Product / GTM / Intelligence / Tools) */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-primary, #222)',
            paddingBottom: 6,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {TAB_GROUPS.map(group => {
            const groupTabs = TABS.filter(t => t.group === group);
            if (groupTabs.length === 0) return null;
            return (
              <div key={group} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted, #71717a)',
                    marginBottom: 4,
                    paddingLeft: 4,
                  }}
                >
                  {group}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {groupTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        fontSize: 13,
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        color:
                          activeTab === tab.id
                            ? 'var(--text-primary, #fff)'
                            : 'var(--text-muted, #71717a)',
                        background: 'none',
                        border: 'none',
                        borderBottom:
                          activeTab === tab.id ? '2px solid #16A34A' : '2px solid transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.15s, border-color 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Content */}
        {searchQuery ? (
          <SearchResults query={searchQuery} tabContent={TAB_CONTENT} />
        ) : (
          TAB_CONTENT[activeTab]
        )}

        {/* AI Chat Widget */}
        <FounderChatWidget founderPass={FOUNDER_PASS} />
      </div>
    </ErrorBoundary>
  );
}
