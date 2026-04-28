'use client';

import {
  Rocket,
  Shield,
  Play,
  MessageSquare,
  Layers,
  AlertTriangle,
  Heart,
  Users,
  Activity,
  Lightbulb,
  TrendingUp,
  Zap,
  Compass,
} from 'lucide-react';
import type { StrategicPrinciple } from '@/lib/data/sales-toolkit';
import { PitchReframeToggle } from './sales/PitchReframeToggle';
import { ObjectionFlashcards } from './sales/ObjectionFlashcards';
import { DemoStepperTimeline } from './sales/DemoStepperTimeline';
import { AudiencePitchTabs } from './sales/AudiencePitchTabs';
import { SalesFrameworkBrowser } from './sales/SalesFrameworkBrowser';
import { EnterpriseFrictionMatrix } from './sales/EnterpriseFrictionMatrix';
import { CialdiniInfluenceWheel } from './sales/CialdiniInfluenceWheel';
import { BuyingCommitteeMap } from './sales/BuyingCommitteeMap';
import { DealStallDiagnosticTree } from './sales/DealStallDiagnosticTree';
import { SalesMovesGrid } from './sales/SalesMovesGrid';
import {
  SALES_FRAMEWORK_GAPS,
  AGE_ASYMMETRY_TACTICS,
  VOSS_TACTICS,
  BRINKMANSHIP_MOVES,
  STRATEGIC_THINKING_PRINCIPLES,
} from '@/lib/data/sales-toolkit';

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
        icon={<MessageSquare size={16} />}
        title="Elevator Pitches · 5 buyer audiences"
        subtitle="CSO, M&A Lead, Fund Partner / EM Investor (the GTM wedge), Board / Audit Committee, Technical. Each leads with the WeWork or Dangote DPR as the live-evidence anchor. Locked vocabulary throughout."
        accent="#0EA5E9"
      >
        <AudiencePitchTabs />
      </Section>

      <Section
        icon={<Users size={16} />}
        title="Buying Committee Map · Pan-African fund vs F500 CSO"
        subtitle="The full committee for each ICP — who has budget, who's the champion path, who vetoes. Toggle between the GTM wedge (Pan-African fund, 6 roles) and the revenue ceiling (F500 CSO, 5 roles). Click any role for the navigation script."
        accent="#16A34A"
      >
        <BuyingCommitteeMap />
      </Section>

      <Section
        icon={<Heart size={16} />}
        title="Cialdini's 6 Influence Principles · applied to DI"
        subtitle="Reciprocation, commitment & consistency, social proof, liking, authority, scarcity — each operationalised with the literal phrase Folahan says + the anti-pattern. Source: Cialdini PDF in the master KB. Click any principle on the wheel."
        accent="#EC4899"
      >
        <CialdiniInfluenceWheel />
      </Section>

      <Section
        icon={<Layers size={16} />}
        title="Enterprise Sales Frameworks · 5 battle-tested"
        subtitle="Challenger (teach → tailor → take control), JOLT (overcome 40-60% no-decision), MEDDPICC (8-point qual), SPIN (situation → need-payoff), SLIP (paid pilot design). Not invented — operationalised from primary research in the master KB."
        accent="#8B5CF6"
      >
        <SalesFrameworkBrowser />
      </Section>

      <Section
        icon={<Lightbulb size={16} />}
        title="Sales-Framework Gaps · 5 moves you are NOT yet operationalising"
        subtitle="JOLT Pre-buttal · Sandler negative reverse · Cialdini arguing-against-self · Challenger artefact-led teardown · Cialdini natural scarcity. Each carries the verbatim phrase + the mechanism + the anti-pattern + which Sparring Room dimension it scores against. Source: NotebookLM master KB synthesis 2026-04-28 (note 1a28e9f4)."
        accent="#6366F1"
      >
        <SalesMovesGrid moves={SALES_FRAMEWORK_GAPS} accent="#6366F1" />
      </Section>

      <Section
        icon={<TrendingUp size={16} />}
        title="Age Asymmetry · 6 tactics that turn 16 into an asset"
        subtitle="Voss accusation audit · Cohen naked-business advantage · Grove/Scott constructive confrontation · Cialdini perceptual contrast · Klein/Newport competence-specificity · Cialdini arguing-against-self. For when the buyer is 35-55 and you are 16. Source: NotebookLM master KB synthesis 2026-04-28 (note b18d07af)."
        accent="#16A34A"
      >
        <SalesMovesGrid moves={AGE_ASYMMETRY_TACTICS} accent="#16A34A" />
      </Section>

      <Section
        icon={<MessageSquare size={16} />}
        title="Chris Voss Tactics · 5 hostage-negotiator moves applied to DI"
        subtitle="Tactical empathy · calibrated questions · mirroring · the 'how am I supposed to do that' strategy · labeling. Each tagged to the persona it works best for. Voss specialised in hostage negotiation — your buyers have similar skepticism levels (their reputation/career is on the line for picking the wrong tool)."
        accent="#0EA5E9"
      >
        <SalesMovesGrid moves={VOSS_TACTICS} accent="#0EA5E9" />
      </Section>

      <Section
        icon={<Zap size={16} />}
        title="Brinkmanship · 4 game-theory moves that flip the power dynamic"
        subtitle="Schelling (The Strategy of Conflict) + Dixit & Nalebuff (Thinking Strategically). The skill of deliberately creating the risk of a mutually-bad outcome — the deal dying — to force the buyer to evaluate DI on YOUR terms. Evidence-Moment ultimatum · weaponized honest off-ramp · reject the unpaid dev shop · natural scarcity on pilot seats. Brinkmanship is the META-PATTERN that fires when mutual_disqualification + pressure_without_pressure + damaging_admission cluster high in your Sparring Room reps."
        accent="#DC2626"
      >
        <SalesMovesGrid moves={BRINKMANSHIP_MOVES} accent="#DC2626" />
      </Section>

      <Section
        icon={<Compass size={16} />}
        title="Strategic Thinking Principles · 5 game-theory anchors for positioning"
        subtitle="Dixit & Nalebuff (Thinking Strategically). HIGHER-ORDER principles that govern HOW Decision Intel is built, sold, and positioned — not per-call tactics. Reference these when making roadmap, positioning, or competitive-strategy decisions. Look-forward-reason-backward · strategic moves by limiting options · credible commitments · setting category ground rules · cooperation/coordination over competition."
        accent="#8B5CF6"
      >
        <StrategicPrinciplesList principles={STRATEGIC_THINKING_PRINCIPLES} />
      </Section>

      <Section
        icon={<AlertTriangle size={16} />}
        title="Enterprise Friction Matrix · 5 deal-killers + responses"
        subtitle="The frictions enterprise buyers will surface during procurement (Nigerian SEC ISA 2007 gap, Client-Safe DPR Export, VDR integration, DQI explainability, shelfware risk). Each card carries the pre-baked response + the underlying product status — so frictions also surface real product gaps to fix."
        accent="#DC2626"
      >
        <EnterpriseFrictionMatrix />
      </Section>

      <Section
        icon={<Activity size={16} />}
        title="Deal Stall Diagnostic Tree · when a strong meeting goes silent"
        subtitle="5 root causes ranked by probability + the recovery move + the literal recovery script. Use this when a Pan-African fund partner or F500 CSO has gone quiet for 2-3 weeks after a strong audit walk-through."
        accent="#D97706"
      >
        <DealStallDiagnosticTree />
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
    </div>
  );
}

// ─── StrategicPrinciplesList ──────────────────────────────────────
// Renders a 5-principle game-theory list for the Strategic Thinking
// section. Each card collapses by default to keep the section scannable.

function StrategicPrinciplesList({ principles }: { principles: StrategicPrinciple[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {principles.map(p => (
        <details
          key={p.id}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #8B5CF6',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {p.principle}
          </summary>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Summary:</strong> {p.summary}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: '#8B5CF6' }}>Decision Intel application:</strong>{' '}
              {p.diApplication}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: '#16A34A' }}>When it bites:</strong> {p.whenItBites}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
