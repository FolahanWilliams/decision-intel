'use client';

import { Crosshair, Target, Lock, BarChart3, MessageSquare, Shield, Map } from 'lucide-react';
import { CategoryContrastPanels } from './competitive/CategoryContrastPanels';
import { CloverpopComparisonGrid } from './competitive/CloverpopComparisonGrid';
import { MoatLayersStack } from './competitive/MoatLayersStack';
import { CompetitorHeatmap } from './competitive/CompetitorHeatmap';
import { InvestorQAFlashcards } from './competitive/InvestorQAFlashcards';
import { ObjectionQuickReference } from './competitive/ObjectionQuickReference';
import { MarketRoadmapTimeline } from './competitive/MarketRoadmapTimeline';

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

export function CompetitivePositioningTab() {
  return (
    <div>
      <Section
        icon={<Crosshair size={16} />}
        title="Elevator Pitch + Category Contrast"
        subtitle="Your opening line to every CSO and every investor. Cloverpop is a record system; you audit the reasoning."
        accent="#16A34A"
      >
        <CategoryContrastPanels />
      </Section>

      <Section
        icon={<Target size={16} />}
        title="Cloverpop Deep Comparison"
        subtitle="12 dimensions side-by-side. Shows adjacency without collision — different problem, different buyer, different moat."
        accent="#F59E0B"
      >
        <CloverpopComparisonGrid />
      </Section>

      <Section
        icon={<Lock size={16} />}
        title="Your Actual Moat — 5 Layers Deep"
        subtitle="Every layer grounded in a specific file path. Click through from surface layer (pipeline) to the three defensible ones (flywheel, graph, compliance)."
        accent="#16A34A"
      >
        <MoatLayersStack />
      </Section>

      <Section
        icon={<BarChart3 size={16} />}
        title="Competitor Capability Heatmap"
        subtitle="11 capabilities × 5 competitors. Footer tallies show Yes/Partial/No counts per competitor — only one is mostly green."
        accent="#0EA5E9"
      >
        <CompetitorHeatmap />
      </Section>

      <Section
        icon={<MessageSquare size={16} />}
        title="Ruthless Investor Q&A"
        subtitle="Eight tough questions. Filter by topic, click for battle-tested answer with code-level proof. Drill these out loud before your next VC call."
        accent="#EF4444"
      >
        <InvestorQAFlashcards />
      </Section>

      <Section
        icon={<Shield size={16} />}
        title="Common Objections — Quick Reference"
        subtitle="Seven objections you will hear repeatedly. Each tagged by flavor. Click for the two-sentence killshot response."
        accent="#0EA5E9"
      >
        <ObjectionQuickReference />
      </Section>

      <Section
        icon={<Map size={16} />}
        title="Market Size + 4-Year Expansion Roadmap"
        subtitle="TAM snapshot, pricing rationale, and the four-year sequence from Enterprise Decision Teams → horizontal platform."
        accent="#8B5CF6"
      >
        <MarketRoadmapTimeline />
      </Section>
    </div>
  );
}
