'use client';

import { Compass, Download, Layers, Map, Presentation, Share2 } from 'lucide-react';
import { PositioningSpine } from './positioning/PositioningSpine';
import { MarketThesisGrid } from './positioning/MarketThesisGrid';
import { StrategicCompass } from './positioning/StrategicCompass';
import { PitchDeckRoadmap } from './positioning/PitchDeckRoadmap';
import { PositioningGraph } from './positioning/PositioningGraph';
import { PositioningCoachChat } from './positioning/PositioningCoachChat';
import { generatePositioningCheatsheet } from '@/lib/exports/positioning-cheatsheet';

interface PositioningCopilotTabProps {
  founderPass: string;
}

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: string;
}

function SectionHeading({ icon, title, subtitle, accent = '#16A34A' }: SectionHeadingProps) {
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
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function PositioningCopilotTab({ founderPass }: PositioningCopilotTabProps) {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,165,233,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ maxWidth: 560, minWidth: 280 }}>
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
              Positioning Copilot
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
            Six frameworks, pre-filled for Decision Intel. Walk the spine, test the thesis, spin
            the compass, run a slide — then open the cheat sheet and send the email.
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

      {/* 1. Brand Spine */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <SectionHeading
          icon={<Layers size={16} />}
          title="Brand Spine"
          subtitle="Byron Sharp's 8 steps, applied to Decision Intel. Click each card for the failure mode and next move."
        />
        <PositioningSpine />
      </section>

      {/* 2. Market Thesis */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <SectionHeading
          icon={<Map size={16} />}
          title="Market Thesis"
          subtitle="Six questions. Only move forward if all five pre-criteria are strong. Click a dimension to see the supporting sub-questions."
          accent="#0EA5E9"
        />
        <MarketThesisGrid />
      </section>

      {/* 3. Strategic Compass */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <SectionHeading
          icon={<Compass size={16} />}
          title="Strategic Thinking Compass"
          subtitle="Eight lenses for any decision. Click a direction to see how it applies to Decision Intel."
        />
        <StrategicCompass />
      </section>

      {/* 4. Pitch Deck Roadmap */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <SectionHeading
          icon={<Presentation size={16} />}
          title="Pitch Deck — 16 Slides"
          subtitle="The exact slide order that gets funded. Click any slide to rehearse the line you actually say."
          accent="#8B5CF6"
        />
        <PitchDeckRoadmap />
      </section>

      {/* 5. Positioning Graph */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <SectionHeading
          icon={<Share2 size={16} />}
          title="Positioning Knowledge Graph"
          subtitle="Every piece of your story, connected. Hover any node to isolate its relationships; click to expand."
          accent="#EC4899"
        />
        <PositioningGraph />
      </section>

      {/* 6. Coach Chat */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 4,
        }}
      >
        <SectionHeading
          icon={<Compass size={16} />}
          title="Positioning Coach"
          subtitle="Grounded in CLAUDE.md + all five frameworks above. Roleplay buyers, drill one-liners, rehearse live."
        />
        <PositioningCoachChat founderPass={founderPass} />
      </section>
    </div>
  );
}
