'use client';

/**
 * PathToHundredMillionTab — the founder-hub centerpiece for "how do I move
 * Decision Intel toward $100M ARR by 2030 + how do I actually approach the
 * specific people I need to talk to."
 *
 * Grounded in NotebookLM master KB synthesis (strengths/weaknesses, 16
 * investor metrics, R²F intellectual-moat deepening, persona-tailored
 * category definitions, killer objection responses, market-wedge, McKinsey
 * QuantumBlack engagement, design-partner conviction).
 *
 * 10 surfaces:
 *   1. North Star Hero — $100M ARR by 2030 framing + counter-probability
 *   2. Strengths × Weaknesses Matrix — the asymmetric reality check
 *   3. R²F Deep Dive — current 3 pillars + 5 moat-deepening levers
 *   4. Category + Pitch Library — what DI is, what it is not, vocabulary
 *      by reader temperature, persona-tailored pitches
 *   5. Role Outreach Playbooks — 8 personas with full discovery scripts,
 *      meeting arc, follow-up cadence, signals-to-listen-for, killer pitch
 *   6. Killer Responses Playbook — JOLT-effect handling for "not for us"
 *      and "I'm confused" + category contrast for incumbent comparisons
 *   7. Investor Metrics Tracker — 17 metrics with current state + 12mo
 *      target + tripwires (incl. Platform Calibration Credibility, the
 *      seed Brier baseline derived from the 143-case library — F1 lock
 *      2026-04-29)
 *   8. Failure Modes Watchtower — 3 internal traps + 3 external attack
 *      vectors with named tripwires
 *   9. Warm-Intro Network Map — Wiz advisor / TASIS / Sankore / LRQA /
 *      McKinsey / pre-seed / family · ask hierarchy per node
 *  10. 90-Day Action Plan — May-July 2026 sequenced moves
 *  11. NotebookLM Follow-Up Lab — 10 next questions to deepen this surface
 *
 * Source data: src/components/founder-hub/path-to-100m/data.ts.
 * When NotebookLM produces fresh synthesis, update HERE only.
 */

import {
  Scale,
  Microscope,
  BookOpen,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  Network,
  Calendar,
  HelpCircle,
  AlertCircle,
  Filter,
  Layers,
  Coins,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { NorthStarHero } from './path-to-100m/NorthStarHero';
import { MarketRealityCheck } from './path-to-100m/MarketRealityCheck';
import { SimplifiedThirtyDayFunnel } from './path-to-100m/SimplifiedThirtyDayFunnel';
import { StrengthsWeaknessesMatrix } from './path-to-100m/StrengthsWeaknessesMatrix';
import { R2FDeepDive } from './path-to-100m/R2FDeepDive';
import { ThreeLayerModel } from './path-to-100m/ThreeLayerModel';
import { AiNativeMatrix } from './path-to-100m/AiNativeMatrix';
import { DefensibilityVectorsCard } from './path-to-100m/DefensibilityVectorsCard';
import { MechanismLedgerCard } from './path-to-100m/MechanismLedgerCard';
import { CategoryAndPitchLibrary } from './path-to-100m/CategoryAndPitchLibrary';
import { RoleOutreachPlaybooks } from './path-to-100m/RoleOutreachPlaybooks';
import { KillerResponsesPlaybook } from './path-to-100m/KillerResponsesPlaybook';
import { InvestorMetricsTracker } from './path-to-100m/InvestorMetricsTracker';
import { FailureModesWatchtower } from './path-to-100m/FailureModesWatchtower';
import { WarmIntroNetworkMap } from './path-to-100m/WarmIntroNetworkMap';
import { NinetyDayActionPlan } from './path-to-100m/NinetyDayActionPlan';
import { NotebookLmFollowUpLab } from './path-to-100m/NotebookLmFollowUpLab';
import { SharranOperatingPrinciples } from './path-to-100m/SharranOperatingPrinciples';
import { ValuationHackTool } from './path-to-100m/ValuationHackTool';
import { TwoXTomorrowStressTest } from './path-to-100m/TwoXTomorrowStressTest';
import { TenTenForeverOverlay } from './path-to-100m/TenTenForeverOverlay';

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

export function PathToHundredMillionTab() {
  return (
    <div style={{ paddingBottom: 64 }}>
      <NorthStarHero />

      <Section
        icon={<AlertCircle size={16} />}
        title="Market Reality Check · 30-day fast-converters vs 12-month ceiling plays"
        subtitle="NotebookLM 2026-04-28 brutal-critique synthesis. Three time-horizons (30-day fast-converters · summer 2026 design-partner wedge · 12-month ceiling plays) + 5 silent objections that close tabs today + the this-week fix for each. The honest reframe: the current strategy is a 12-18 month play, not a 30-day play. For paid validation in the next 30 days, stop pitching the cathedral — start pitching individuals with a corporate expense card and acute career fear."
        accent="#DC2626"
      >
        <MarketRealityCheck />
      </Section>

      <Section
        icon={<Filter size={16} />}
        title="Simplified 30-Day Conversion Funnel · 4 screens · feature verdicts"
        subtitle="The 4-screen funnel that closes paid validation in 30 days: landing (no jargon, single H1) → upload (drop file, audit fires) → reveal + paywall (DQI + 3 biases + Dr Red Team objection, then blur) → checkout ($499/deal OR £149/mo). Below: 14 feature verdicts — keep / hide behind feature flag / move to enterprise tier / kill — that strip the cathedral down to the 30-day funnel without losing the long-tail value."
        accent="#0EA5E9"
      >
        <SimplifiedThirtyDayFunnel />
      </Section>

      <Section
        icon={<Scale size={16} />}
        title="Strengths × Weaknesses · the asymmetric reality check"
        subtitle="5 strengths to weaponise (with how-to-deploy + tripwires) + 5 weaknesses to neutralise (with countermoves + 30-day asks). Click any card for the full deep-dive."
        accent="#16A34A"
      >
        <StrengthsWeaknessesMatrix />
      </Section>

      <Section
        icon={<Microscope size={16} />}
        title="R²F Deep Dive · the intellectual moat + 5 levers to deepen it"
        subtitle="Current state: Kahneman-side rigor + Klein-side recognition + meta-judge synthesis (3 pillars, 7 nodes). 5 levers from NotebookLM 2026-04-27 synthesis to make the moat unassailable: Mercier & Sperber argumentative-reasoning · Environmental Validity weighting · Decision Framing Gate · provisional patents · institutional academic credentials."
        accent="#7C3AED"
      >
        <R2FDeepDive />
      </Section>

      <Section
        icon={<Layers size={16} />}
        title="3-Layer Architectural Frame · Snowflake → Salesforce → DI"
        subtitle="Lifted from the 2026-05-09 Gemini-pushback validation pass — the cleanest architectural slot for DI. Snowflake owns data integrity, Salesforce owns execution discipline, Decision Intel owns the reasoning layer between them. Use as the opening line for cold investor calls + senior-direct corp dev applications + pitch-deck slide 2. EARNED vocabulary — never the H1."
        accent="#16A34A"
      >
        <ThreeLayerModel />
      </Section>

      <Section
        icon={<ShieldCheck size={16} />}
        title="AI Commodification Defense Matrix · why GPT-N+1 doesn't kill DI"
        subtitle="Sharpened version of the Gemini matrix — every cell names DI's specific citable moat (R²F · 22-bias taxonomy · 143-case library · 19-framework regulatory map · Brier 0.258 · agentic-shift defense · Pan-African coverage · per-org Brier accumulation). Use when an investor or partner asks 'won't the next foundation model just do this?'"
        accent="#0EA5E9"
      >
        <AiNativeMatrix />
      </Section>

      <Section
        icon={<Microscope size={16} />}
        title="Mechanism Hit-Rate Ledger · the proof that matters (not the DQI)"
        subtitle="The buyer doesn't care about the score — they care whether, on a decision that went badly, the BLIND audit named the mechanism that actually materialized before anyone knew the outcome. This ledger makes that measurable + un-cherry-pickable (verbatim finding + verbatim outcome per row), it's provable NOW (no waiting for the DQI to calibrate), and it's the advisor/investor artifact. Seeded with the confirmed blind retros (Zillow · Fermi · WeWork); fill it as you grade your run. N-floor honest — don't headline a rate below 5 settled cases. The bulletproof version is FORWARD: audit a current filing, hash-stamp the DPR, let the outcome arrive."
        accent="#16A34A"
      >
        <MechanismLedgerCard />
      </Section>

      <Section
        icon={<Shield size={16} />}
        title="Defensibility Vectors · the 'is it just a wrapper?' answer"
        subtitle="The honest frame (the wrapper is the wedge; the accumulating decision→outcome record + enforced process is the company) + the 7 non-wrapper vectors with live shipped/queued status + the acqui-hire-vs-scale-binary-is-false reframe + the do-not-quote guardrail. The verbatim spoken answer is in Killer Responses → 'How are you different?'; this is the daily visual reference. Rehearse before Strategy World London."
        accent="#16A34A"
      >
        <DefensibilityVectorsCard />
      </Section>

      <Section
        icon={<Layers size={16} />}
        title="Sharran Operating Principles · 7 mental models from a 5-exit operator"
        subtitle="Sharran Srivatsaa (scaled 2 companies past $8B, 5 exits) — applied to Decision Intel via the master KB Q1-Q4 synthesis. Hero is the 1-1-1 violation table: DI today is Phase 4-architected for a Phase 1 buyer; the discipline is HIDE THE PLUMBING. Each principle carries the Sharran framing + the DI-applied framing + a phase tag (NOW / LATER / INAPPLICABLE) + a specific 90-day action when applicable. Three CTAs jump to dedicated sibling tools below: Valuation Hack · 2× Tomorrow · 10-10 Forever."
        accent="#0F172A"
      >
        <SharranOperatingPrinciples />
      </Section>

      <Section
        icon={<BookOpen size={16} />}
        title="Category Definition + Persona Pitch Library"
        subtitle="What Decision Intel IS (warm category claim, cold descriptive, vocabulary-by-context bridge sentences) + what it IS NOT (8 things to never say). Persona-tailored pitches for CSOs, M&A heads, Pan-African funds, GCs, pre-seed VCs, McKinsey, LRQA-class firms — each with the killer line + the closing move."
        accent="#0EA5E9"
      >
        <CategoryAndPitchLibrary />
      </Section>

      <Section
        icon={<Users size={16} />}
        title="Role Outreach Playbooks · 8 personas, full meeting arc"
        subtitle="For each role (Pan-African fund partner / F500 CSO / M&A head / GC + audit chair / management consultant / LRQA-class firm / pre-seed VC / Wiz-network advisor): what they want, what keeps them up, exact cold opener, discovery questions, killer pitch, 3 phrases never to say, meeting arc minute-by-minute, signals to listen for, follow-up cadence T+0 → T+2w. Click any role for the full playbook."
        accent="#D97706"
      >
        <RoleOutreachPlaybooks />
      </Section>

      <Section
        icon={<Shield size={16} />}
        title='Killer Responses Playbook · "not for us" + "confused" + category-contrast'
        subtitle='When the buyer says "this is not for us right now" (JOLT effect — fear-paralysis, not disinterest) → 3 honest off-ramp / pings-and-echoes / asynchronous-refrigerator moves. When they look confused → 3 vulnerability-reset / 5th-grade-anchor / evidence-challenge moves. When they ask "how are you different from Cloverpop / Aera / IBM watsonx" → 3 one-sentence category-contrast lines. Exact phrasings, why-it-works, follow-up move.'
        accent="#DC2626"
      >
        <KillerResponsesPlaybook />
      </Section>

      <Section
        icon={<TrendingUp size={16} />}
        title="16 Investor Metrics Tracker · current state + 12mo target + tripwires"
        subtitle="Business + financial (8 metrics: bookings, ARR/MRR, gross profit, TCV/ACV, LTV, billings, CAC, GMV-skip) + product + engagement (5 metrics: active users, CMGR, churn, burn rate, downloads-skip) + presentation discipline (3 metrics: cumulative-charts-never, chart-tricks-never, size-before-growth). Each tagged on-track / gap / unbuilt with the named tripwire."
        accent="#0EA5E9"
      >
        <InvestorMetricsTracker />
      </Section>

      <Section
        icon={<Coins size={16} />}
        title="Valuation Hack · the up-sell + zero-value subtraction prompts"
        subtitle="Sharran's $50M → $75M mechanic, specialised for advisors (Mr. Reiner / Mr. Gabe / Big-4 governance) instead of acquirers per the master KB Q4 synthesis. Two pre-built copy-paste prompts (Path-to-Benchmark for the up-sell · Zero-Value Subtraction for the cut-list) + three counter-pattern guardrails (VC scale-default trap · consulting dismissal trap · enterprise-buyer filter rule). Capture surface flags items amber when the advisor didn't explain WHY a specific enterprise buyer would pay a premium."
        accent="#16A34A"
      >
        <ValuationHackTool />
      </Section>

      <Section
        icon={<AlertTriangle size={16} />}
        title="Failure Modes Watchtower · 3 internal traps + 3 external attack vectors"
        subtitle="Internal: Quantellia unscalable-consulting · Cloverpop manual-logging · DI cathedral-of-code (currently active). External: Cloverpop data advantage · IBM watsonx bundling · agentic-shift makes strategic-memo obsolete. Each with named tripwire + the named source to monitor + the countermove."
        accent="#DC2626"
      >
        <FailureModesWatchtower />
      </Section>

      <Section
        icon={<Activity size={16} />}
        title="2× Tomorrow Stress Test · interactive bottleneck simulator"
        subtitle="Sharran's 'if the business doubled tomorrow, where would it break?' mechanic, run against current DI state numbers. Adjust 5 inputs (daily audits · paid Individuals · warm intros/wk · London events/mo · Founder Hub tabs); the bottleneck table auto-doubles each metric and surfaces the specific breaking point + the pre-emptive build needed today. Severity-coded (critical / high / medium / manageable) with the load-bearing risk first."
        accent="#D97706"
      >
        <TwoXTomorrowStressTest />
      </Section>

      <Section
        icon={<Network size={16} />}
        title="Warm-Intro Network Map · Wiz advisor / TASIS / Sankore / LRQA / McKinsey / pre-seed / family"
        subtitle="8 network nodes with relationship type (family / advisor / school / design-partner / channel / untapped) + what they unlock + 3-tier ask hierarchy (Tier 1 ideal, Tier 2 high-value, Tier 3 fallback) + status + cadence + the next-step prompt."
        accent="#7C3AED"
      >
        <WarmIntroNetworkMap />
      </Section>

      <Section
        icon={<Users size={16} />}
        title="10-10 Forever Overlay · 7 missing relationship slots"
        subtitle="Sharran's 'identify the 10 people you would invest in for the next 10 years' rule, applied to the existing 3 named nodes. Master KB Q3 synthesis identified 7 specific person-types missing — each maps to a Phase 1-4 risk Mr. Reiner / Mr. Gabe / Sankore alone don't cover. Vendor Continuity Engineer (F500 procurement key-person risk), Governance Coalition Insider (IBM watsonx bundling defense), Elite Consulting Channel Partner, F500 GC Validator, Agentic-Shift Technologist, Fractional CSO Evangelist, Behavioral Science Academic Anchor."
        accent="#16A34A"
      >
        <TenTenForeverOverlay />
      </Section>

      <Section
        icon={<Calendar size={16} />}
        title="90-Day Action Plan · May-July 2026"
        subtitle="12 sequenced actions across product / GTM / fundraise / data / positioning / authority. Each with the why, the success criterion, the named blocker, dependencies, effort sizing. Designed to land Phase 1 of the HonestProbabilityPath: 3 paid design partners + Sankore close + ISA 2007 + DQI CIs + LRQA second meeting + QuantumBlack alliance intro + GTM co-founder search + first reference case + pre-seed lead term sheet."
        accent="#16A34A"
      >
        <NinetyDayActionPlan />
      </Section>

      <Section
        icon={<HelpCircle size={16} />}
        title="NotebookLM Follow-Up Lab · 10 next questions to deepen this surface"
        subtitle="Specific questions to run in NotebookLM master KB to harvest fresh synthesis: McKinsey alliance commercial models · 5 named pre-seed funds · F500 procurement cycle compression · Sankore Day-90 success criteria · Cloverpop disclosed ACVs · EU AI Act enforcement examples · teen-founder continuity benchmarks · LP decision-quality questions · advisor cadence patterns · agentic-shift telemetry. Each with the why-ask + the expected output + priority."
        accent="#D97706"
      >
        <NotebookLmFollowUpLab />
      </Section>
    </div>
  );
}

export { Section as PathToHundredMillionSection };
