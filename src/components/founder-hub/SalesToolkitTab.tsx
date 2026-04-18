'use client';

import { Rocket, Shield, Play, MessageSquare, Layers } from 'lucide-react';
import { PitchReframeToggle } from './sales/PitchReframeToggle';
import { ObjectionFlashcards } from './sales/ObjectionFlashcards';
import { DemoStepperTimeline } from './sales/DemoStepperTimeline';
import { AudiencePitchTabs } from './sales/AudiencePitchTabs';
import { SalesFrameworkBrowser } from './sales/SalesFrameworkBrowser';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, accent, children }: SectionProps) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}
    >
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
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

export function SalesToolkitTab() {
  return (
    <div>
      <Section
        icon={<Rocket size={16} />}
        title="Critical Pitch Reframe"
        subtitle="Defensive vs offensive framing. Toggle to see which attracts which buyer. Strebulaev's Stanford GSB finding: the best decision-makers optimize for bold moves, not risk avoidance."
        accent="#16A34A"
      >
        <PitchReframeToggle />
      </Section>

      <Section
        icon={<Shield size={16} />}
        title="Objection Handler · 8 enterprise objections"
        subtitle="Every objection a buyer will raise, the pre-baked response, and the tone that lands it. Click any card to drill the answer."
        accent="#F59E0B"
      >
        <ObjectionFlashcards />
      </Section>

      <Section
        icon={<Play size={16} />}
        title="Demo Script · 8 steps, 8-12 min"
        subtitle="The exact flow that creates the wow moment. Step 5 (Boardroom Simulation) is where the prospect goes silent — let it land."
        accent="#16A34A"
      >
        <DemoStepperTimeline />
      </Section>

      <Section
        icon={<MessageSquare size={16} />}
        title="Elevator Pitches · by audience"
        subtitle="Four audiences, four pitches. Key hooks highlighted so you can drop them without thinking. CSO, M&A Lead, Board, Technical."
        accent="#0EA5E9"
      >
        <AudiencePitchTabs />
      </Section>

      <Section
        icon={<Layers size={16} />}
        title="Enterprise Sales Frameworks"
        subtitle="Challenger (teach → tailor → take control), MEDDPICC (8-point qualification), SPIN (situation → need-payoff). Battle-tested, not invented."
        accent="#8B5CF6"
      >
        <SalesFrameworkBrowser />
      </Section>
    </div>
  );
}
