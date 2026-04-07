'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FounderChatWidget } from '@/components/founder-hub/FounderChatWidget';
import { ProductOverviewTab } from '@/components/founder-hub/ProductOverviewTab';
import { CorePipelineTab } from '@/components/founder-hub/CorePipelineTab';
import { ScoringEngineTab } from '@/components/founder-hub/ScoringEngineTab';
import { DqiMethodologyTab } from '@/components/founder-hub/DqiMethodologyTab';
import { IntegrationsAndFlywheelTab } from '@/components/founder-hub/IntegrationsAndFlywheelTab';
import { StrategyAndPositioningTab } from '@/components/founder-hub/StrategyAndPositioningTab';
import { SalesToolkitTab } from '@/components/founder-hub/SalesToolkitTab';
import { LiveStatsTab } from '@/components/founder-hub/LiveStatsTab';
import { PlaybookAndResearchTab } from '@/components/founder-hub/PlaybookAndResearchTab';
import { MethodologiesAndPrinciplesTab } from '@/components/founder-hub/MethodologiesAndPrinciplesTab';
import { CaseStudiesTab } from '@/components/founder-hub/CaseStudiesTab';
import { CorrelationCausalTab } from '@/components/founder-hub/CorrelationCausalTab';
import { DecisionAlphaTab } from '@/components/founder-hub/DecisionAlphaTab';
import { ContentStudioTab } from '@/components/founder-hub/ContentStudioTab';
import { InvestorDefenseTab } from '@/components/founder-hub/InvestorDefenseTab';
import { FounderTipsTab } from '@/components/founder-hub/FounderTipsTab';
import {
  Rocket,
  Brain,
  BarChart3,
  Plug,
  Shield,
  BookOpen,
  Target,
  MessageSquare,
  Zap,
  TrendingUp,
  Network,
  Lock,
  Crosshair,
  Search,
  X,
  Library,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { card } from '@/components/founder-hub/shared-styles';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'pipeline'
  | 'scoring'
  | 'dqi_methodology'
  | 'integrations'
  | 'strategy'
  | 'sales'
  | 'stats'
  | 'playbook'
  | 'methodologies'
  | 'case_studies'
  | 'correlation_causal'
  | 'decision_alpha'
  | 'content_studio'
  | 'investor_defense'
  | 'founder_tips';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} /> },
  { id: 'pipeline', label: 'Analysis Pipeline', icon: <Brain size={16} /> },
  { id: 'scoring', label: 'Scoring Engine', icon: <BarChart3 size={16} /> },
  { id: 'dqi_methodology', label: 'DQI Methodology', icon: <Target size={16} /> },
  { id: 'integrations', label: 'Integrations & Flywheel', icon: <Plug size={16} /> },
  { id: 'strategy', label: 'Strategy & Positioning', icon: <Shield size={16} /> },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} /> },
  { id: 'stats', label: 'Live Stats', icon: <TrendingUp size={16} /> },
  { id: 'playbook', label: 'Playbook & Research', icon: <BookOpen size={16} /> },
  { id: 'methodologies', label: 'Methodologies & Principles', icon: <GraduationCap size={16} /> },
  { id: 'case_studies', label: 'Case Studies', icon: <Library size={16} /> },
  { id: 'correlation_causal', label: 'Correlation & Causal Graph', icon: <Network size={16} /> },
  { id: 'decision_alpha', label: 'Decision Alpha', icon: <TrendingUp size={16} /> },
  { id: 'content_studio', label: 'Content Studio', icon: <Zap size={16} /> },
  { id: 'investor_defense', label: 'Investor Defense', icon: <Crosshair size={16} /> },
  { id: 'founder_tips', label: 'Founder Tips', icon: <Lightbulb size={16} /> },
];

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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
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

  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Incorrect access code.</p>
        )}
      </div>
    );
  }

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    overview: <ProductOverviewTab />,
    pipeline: <CorePipelineTab />,
    scoring: <ScoringEngineTab />,
    dqi_methodology: (
      <ErrorBoundary sectionName="DQI Methodology">
        <DqiMethodologyTab />
      </ErrorBoundary>
    ),
    integrations: <IntegrationsAndFlywheelTab />,
    strategy: <StrategyAndPositioningTab />,
    sales: <SalesToolkitTab />,
    stats: <LiveStatsTab />,
    playbook: <PlaybookAndResearchTab />,
    methodologies: (
      <ErrorBoundary sectionName="Methodologies & Principles">
        <MethodologiesAndPrinciplesTab />
      </ErrorBoundary>
    ),
    case_studies: <CaseStudiesTab />,
    correlation_causal: (
      <ErrorBoundary sectionName="Correlation & Causal">
        <CorrelationCausalTab />
      </ErrorBoundary>
    ),
    decision_alpha: (
      <ErrorBoundary sectionName="Decision Alpha">
        <DecisionAlphaTab />
      </ErrorBoundary>
    ),
    content_studio: (
      <ErrorBoundary sectionName="Content Studio">
        <ContentStudioTab founderPass={FOUNDER_PASS} />
      </ErrorBoundary>
    ),
    investor_defense: (
      <ErrorBoundary sectionName="Investor Defense">
        <InvestorDefenseTab />
      </ErrorBoundary>
    ),
    founder_tips: (
      <ErrorBoundary sectionName="Founder Tips">
        <FounderTipsTab />
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 24,
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-primary, #222)',
            paddingBottom: 0,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {TABS.map(tab => (
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
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color:
                  activeTab === tab.id ? 'var(--text-primary, #fff)' : 'var(--text-muted, #71717a)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #16A34A' : '2px solid transparent',
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
