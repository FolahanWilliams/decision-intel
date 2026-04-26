'use client';

/**
 * LrqaTab — the founder-hub-only briefing surface for the warm-intro
 * meeting with Ian Spaulding (Group CEO of LRQA, dad of Folahan's
 * best friend). Mirrors the sankore/ pattern: stays inside the founder
 * hub, never leaks to public per the CLAUDE.md no-named-prospects rule.
 *
 * The tab orchestrates 5 surfaces:
 *   1. Ian Profile Panel — warm-intro context, identity, career arc, recent voice
 *   2. LRQA Company Map — service lines, scale, 6-month strategic moves, competitive context
 *   3. Integration Paths Map — 5 specific DI-LRQA fits with positioning + proof
 *   4. Ask Hierarchy Ladder — 3-tier asks (integration / introductions / advisor)
 *   5. Meeting Prep Board — checklist (research / artefact / rehearse / avoid) + question bank
 *   6. Follow-Up Playbook — 48h post-meeting cadence
 *
 * Created 2026-04-26 from Ian's LinkedIn profile + LRQA newsroom + Reuters
 * coverage. Update via lrqa-brief-data.ts as the relationship develops.
 */

import {
  UserCircle,
  Building2,
  Network,
  Trophy,
  ClipboardCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { IanProfilePanel } from './lrqa/IanProfilePanel';
import { LrqaCompanyMap } from './lrqa/LrqaCompanyMap';
import { IntegrationPathsMap } from './lrqa/IntegrationPathsMap';
import { AskHierarchyLadder } from './lrqa/AskHierarchyLadder';
import { MeetingPrepBoard } from './lrqa/MeetingPrepBoard';
import { FollowUpPlaybook } from './lrqa/FollowUpPlaybook';
import { ThreeGapsDifferentiator } from './competitive/ThreeGapsDifferentiator';

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
      {children}
    </section>
  );
}

export function LrqaTab() {
  return (
    <div>
      {/* Hero strip — sets the meeting context */}
      <div
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(217,119,6,0.05))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#16A34A',
            marginBottom: 6,
          }}
        >
          Active prospect · warm intro · meeting this week
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          LRQA / Ian Spaulding · Group CEO
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.55,
            maxWidth: 760,
          }}
        >
          $500M+ global risk management firm · 61,000 clients across 150+ countries · just acquired
          Partner Africa (April 2026) · €500M Term Loan B (March 2026) · EiQ supply-chain
          intelligence software · Mission AI Possible internal hackathon. The asymmetric alignment:
          LRQA is investing exactly where Decision Intel was built to play. Ian is the dad of one of
          Folahan&apos;s best friends — warm intro at the highest possible level. Treat as
          advisor-grade conversation first, partnership conversation second.
        </p>
      </div>

      <Section
        icon={<UserCircle size={16} />}
        title="Ian Spaulding · profile + warm-intro context"
        subtitle="Yale MA in Religion / Human Rights · 30+ years across Sears Holdings, KPMG, BSR, INFACT, ELEVATE (his founder journey, acquired by LRQA 2022). Recent public voice quotes to literally reference in the meeting."
        accent="#16A34A"
      >
        <IanProfilePanel />
      </Section>

      <Section
        icon={<Building2 size={16} />}
        title="LRQA · company snapshot + 6-month strategic moves"
        subtitle="Service lines, scale, the 6 strategic moves of the last 6 months (Partner Africa, Term Loan B, AI Hackathon, Lindinger, new Chair, ERSA 4.0) — each with strategic-weight badge + DI relevance. The competitive context (Bureau Veritas / SGS / Intertek / DNV) — do NOT over-claim."
        accent="#0EA5E9"
      >
        <LrqaCompanyMap />
      </Section>

      <Section
        icon={<Sparkles size={16} />}
        title="Why DI is structurally different · top 3 DI-space gaps"
        subtitle="The 3 systemic gaps in current decision intelligence (Cloverpop, Aera, Quantexa, IBM watsonx) that DI uniquely fixes — Causal Reasoning, Closed-Loop Accountability, Human-AI Governance. Reference these with Ian during the meeting if he asks 'how is this different from what's already out there?'. Same surface lives in the Competitive Positioning tab."
        accent="#DC2626"
      >
        <ThreeGapsDifferentiator />
      </Section>

      <Section
        icon={<Network size={16} />}
        title="5 integration paths · where DI fits in LRQA's stack"
        subtitle="Each path: where in the stack, what DI adds, the literal pitch positioning, the proof artefact, the realistic timeline. Two CRITICAL fits (EiQ reasoning audit layer, Pan-African / Partner Africa) are the lead asks."
        accent="#DC2626"
      >
        <IntegrationPathsMap />
      </Section>

      <Section
        icon={<Trophy size={16} />}
        title="3-tier ask hierarchy · ladder up, fall back gracefully"
        subtitle="Tier 1 (ideal) integration partnership, Tier 2 (high-value) intros to Ian's network of CSOs / M&A leaders, Tier 3 (table stakes) advisor relationship. Each tier carries the literal ask, the why-yes, the why-no, and the fallback if Ian declines that tier."
        accent="#16A34A"
      >
        <AskHierarchyLadder />
      </Section>

      <Section
        icon={<ClipboardCheck size={16} />}
        title="Pre-meeting prep + question bank"
        subtitle="Filtered checklist (research / artefact to bring / rehearse / avoid) + 7 specific questions to ASK Ian during the meeting (each with the why-ask + the what-a-yes-signals framing)."
        accent="#8B5CF6"
      >
        <MeetingPrepBoard />
      </Section>

      <Section
        icon={<Send size={16} />}
        title="48-hour follow-up playbook"
        subtitle="The structured cadence (T+0 thank-you · T+4h LRQA one-pager + Kahneman-Klein paper · T+24h WeWork DPR + quote-permission ask · T+48h live audit on a public LRQA report · T+7d single-concrete-next-step proposal). Plus the 10 things to remember about Ian."
        accent="#D97706"
      >
        <FollowUpPlaybook />
      </Section>
    </div>
  );
}
