'use client';

import { useRef } from 'react';
import {
  Compass,
  Download,
  Layers,
  Map,
  Presentation,
  Share2,
  Trophy,
  GitBranch,
  Sparkles,
  BookOpen,
  Calendar,
  MessagesSquare,
  Filter,
  Target,
} from 'lucide-react';
import { PositioningSpine } from './positioning/PositioningSpine';
import { MarketThesisGrid } from './positioning/MarketThesisGrid';
import { StrategicCompass } from './positioning/StrategicCompass';
import { PitchDeckRoadmap } from './positioning/PitchDeckRoadmap';
import { PositioningGraph } from './positioning/PositioningGraph';
import { PositioningCoachChat } from './positioning/PositioningCoachChat';
import { LevelsLadder } from './positioning/LevelsLadder';
import { PositioningFlow } from './positioning/PositioningFlow';
import { BrandEssenceCanvas } from './positioning/BrandEssenceCanvas';
import { StoryArcConstructor } from './positioning/StoryArcConstructor';
import { ContentCadenceCalendar } from './positioning/ContentCadenceCalendar';
import { SalesCallScript } from './positioning/SalesCallScript';
import { ICPFunnelBuilder } from './positioning/ICPFunnelBuilder';
import { generatePositioningCheatsheet } from '@/lib/exports/positioning-cheatsheet';

interface PositioningCopilotTabProps {
  founderPass: string;
}

// Section registry — single source of truth for ordering, anchors, and the nav bar.
interface SectionConfig {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  group: 'Assess' | 'Define' | 'Target' | 'Tell' | 'Execute' | 'Coach';
  render: (props: { founderPass: string }) => React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'levels',
    icon: <Trophy size={16} />,
    title: 'Where Am I?',
    subtitle:
      'The 5 levels of entrepreneurship thinking. Know your rung, pick the next move to climb. Honest self-assessment pre-filled.',
    accent: '#F59E0B',
    group: 'Assess',
    render: () => <LevelsLadder />,
  },
  {
    id: 'spine',
    icon: <Layers size={16} />,
    title: 'Brand Spine',
    subtitle:
      "Byron Sharp's 8 steps, applied to Decision Intel. Click any card for failure mode + next move.",
    accent: '#16A34A',
    group: 'Define',
    render: () => <PositioningSpine />,
  },
  {
    id: 'flow',
    icon: <GitBranch size={16} />,
    title: 'Positioning Diagnostic',
    subtitle:
      'Eight yes/no checks that every great positioning passes. First weak step tells you exactly what to fix before scaling outreach.',
    accent: '#0EA5E9',
    group: 'Define',
    render: () => <PositioningFlow />,
  },
  {
    id: 'brand',
    icon: <Sparkles size={16} />,
    title: 'Brand Essence Canvas',
    subtitle:
      'Strategic analysis → essence → identity → value → credibility → visuals. The deeper emotional layer Sharp does not cover.',
    accent: '#EC4899',
    group: 'Define',
    render: () => <BrandEssenceCanvas />,
  },
  {
    id: 'market',
    icon: <Map size={16} />,
    title: 'Market Thesis',
    subtitle:
      'Six questions. Only move if all five pre-criteria are strong. Click a dimension for sub-questions.',
    accent: '#0EA5E9',
    group: 'Target',
    render: () => <MarketThesisGrid />,
  },
  {
    id: 'icp',
    icon: <Filter size={16} />,
    title: 'ICP Funnel',
    subtitle:
      'Nine filters that narrow 500K possibilities to ~500 year-1 target accounts. Walk the funnel; end with the list you pursue.',
    accent: '#14B8A6',
    group: 'Target',
    render: () => <ICPFunnelBuilder />,
  },
  {
    id: 'compass',
    icon: <Compass size={16} />,
    title: 'Strategic Thinking Compass',
    subtitle:
      'Eight lenses for any decision. Click a direction to see how it applies to Decision Intel today.',
    accent: '#16A34A',
    group: 'Tell',
    render: () => <StrategicCompass />,
  },
  {
    id: 'pitch',
    icon: <Presentation size={16} />,
    title: 'Pitch Deck — 16 Slides',
    subtitle:
      'The exact slide order that gets funded. Click any slide to rehearse the line you actually say.',
    accent: '#8B5CF6',
    group: 'Tell',
    render: () => <PitchDeckRoadmap />,
  },
  {
    id: 'story',
    icon: <BookOpen size={16} />,
    title: 'Story Arc Constructor',
    subtitle:
      'Nine narrative beats. Toggle context — cold email, live demo, investor pitch — and see exactly what goes in each slot.',
    accent: '#F59E0B',
    group: 'Tell',
    render: () => <StoryArcConstructor />,
  },
  {
    id: 'graph',
    icon: <Share2 size={16} />,
    title: 'Positioning Knowledge Graph',
    subtitle:
      'Every piece of your story connected. Hover any node to isolate relationships. Click to expand.',
    accent: '#EC4899',
    group: 'Tell',
    render: () => <PositioningGraph />,
  },
  {
    id: 'sales',
    icon: <Target size={16} />,
    title: 'Live Sales Call Script',
    subtitle:
      'Ten steps, each with what you ask → what they say → what you respond. Plus the trap to avoid.',
    accent: '#8B5CF6',
    group: 'Execute',
    render: () => <SalesCallScript />,
  },
  {
    id: 'content',
    icon: <Calendar size={16} />,
    title: 'Weekly Content Cadence',
    subtitle:
      'Seven-day rhythm. Today is highlighted. Prompt template + format for each day, pre-filled for Decision Intel.',
    accent: '#14B8A6',
    group: 'Execute',
    render: () => <ContentCadenceCalendar />,
  },
  {
    id: 'coach',
    icon: <MessagesSquare size={16} />,
    title: 'Positioning Coach',
    subtitle:
      'Grounded in CLAUDE.md + all twelve frameworks above. Roleplay buyers, drill one-liners, rehearse live.',
    accent: '#16A34A',
    group: 'Coach',
    render: ({ founderPass }) => <PositioningCoachChat founderPass={founderPass} />,
  },
];

const GROUP_LABEL: Record<SectionConfig['group'], string> = {
  Assess: 'Assess',
  Define: 'Define position',
  Target: 'Target customer',
  Tell: 'Tell the story',
  Execute: 'Execute',
  Coach: 'Coach',
};

const GROUP_ORDER: SectionConfig['group'][] = [
  'Assess',
  'Define',
  'Target',
  'Tell',
  'Execute',
  'Coach',
];

function SectionHeading({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${accent}18`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export function PositioningCopilotTab({ founderPass }: PositioningCopilotTabProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero header */}
      <div
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,165,233,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ maxWidth: 620, minWidth: 280 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Compass size={18} style={{ color: '#16A34A' }} />
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
              }}
            >
              Positioning Copilot — 13 frameworks
            </div>
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Rehearse before you reach out.
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 8,
              marginBottom: 0,
              lineHeight: 1.55,
            }}
          >
            Thirteen decision frameworks, every one pre-filled for Decision Intel. Assess where you
            are, sharpen the spine, pick your target, rehearse the story, run the live play — then
            open the cheat sheet and send the email.
          </p>
        </div>

        <button
          onClick={() => {
            try {
              generatePositioningCheatsheet();
            } catch (err) {
              console.warn('cheatsheet export failed:', err);
              alert('Export failed — see console.');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: '#16A34A',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={14} />
          Cheat Sheet PDF
        </button>
      </div>

      {/* Sticky anchor nav */}
      <nav
        aria-label="Positioning Copilot sections"
        style={{
          position: 'sticky',
          top: 8,
          zIndex: 10,
          padding: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {GROUP_ORDER.map(group => {
          const sections = SECTIONS.filter(s => s.group === group);
          if (sections.length === 0) return null;
          return (
            <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  minWidth: 100,
                  flexShrink: 0,
                }}
              >
                {GROUP_LABEL[group]}
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = s.accent;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = s.accent;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <span style={{ color: s.accent, display: 'flex', alignItems: 'center' }}>
                      {s.icon}
                    </span>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sections */}
      {SECTIONS.map(section => (
        <section
          key={section.id}
          ref={el => {
            sectionRefs.current[section.id] = el;
          }}
          id={`copilot-${section.id}`}
          style={{
            padding: 18,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
            scrollMarginTop: 80,
          }}
        >
          <SectionHeading
            icon={section.icon}
            title={section.title}
            subtitle={section.subtitle}
            accent={section.accent}
          />
          {section.render({ founderPass })}
        </section>
      ))}
    </div>
  );
}
