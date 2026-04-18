'use client';

import {
  Calendar,
  Users,
  Phone,
  Sparkles,
  Copy,
  Briefcase,
  Lightbulb,
  UserCircle,
  Globe,
  Radio,
} from 'lucide-react';
import { ThisWeekPriority } from './outreach-cmd/ThisWeekPriority';
import { ContactPipelineTracker } from './outreach-cmd/ContactPipelineTracker';
import { DiscoveryCallCompanion } from './outreach-cmd/DiscoveryCallCompanion';
import { PatternValidationDashboard } from './outreach-cmd/PatternValidationDashboard';
import { TemplateQuickCopy } from './outreach-cmd/TemplateQuickCopy';
import { POCKit } from './outreach-cmd/POCKit';
import { BuyerPersonaMap } from './outreach-cmd/BuyerPersonaMap';
import { TargetIndustryAtlas } from './outreach-cmd/TargetIndustryAtlas';
import { ChannelStrategyMatrix } from './outreach-cmd/ChannelStrategyMatrix';
import { FRAMEWORK_AUDIT_TOP_FIXES } from '@/lib/data/outreach';

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
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </section>
  );
}

export function OutreachCommandCenterTab() {
  return (
    <div>
      {/* Hero */}
      <div
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(245,158,11,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#16A34A',
            marginBottom: 6,
          }}
        >
          Outreach Command Center
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
          The Traction Plan, running live.
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Six operational surfaces pulled from your discovery map, outreach templates, POC playbook, and traction plan.
          Everything persists in your browser — use this during live calls, not as reading material.
        </p>
      </div>

      <Section
        icon={<Calendar size={16} />}
        title="This Week's Priority"
        subtitle="Auto-advances through the 4-week traction plan. Check off key actions as you complete them."
        accent="#16A34A"
      >
        <ThisWeekPriority />
      </Section>

      {/* Customer Discovery Map — who, where, how */}
      <Section
        icon={<UserCircle size={16} />}
        title="Buyer Persona Map"
        subtitle="Three primary buyers, three adjacent, three anti-patterns. Click any persona for their pain, their language, their authority, the warmest intro path. Mirror their vocabulary on every call."
        accent="#16A34A"
      >
        <BuyerPersonaMap />
      </Section>

      <Section
        icon={<Globe size={16} />}
        title="Target Industry Atlas"
        subtitle="Five industries ranked by fit. Sample companies and M&A cadence per vertical. Use this to pattern-match whether a new contact fits the ICP in 5 seconds."
        accent="#0EA5E9"
      >
        <TargetIndustryAtlas />
      </Section>

      <Section
        icon={<Radio size={16} />}
        title="Channel Strategy Matrix"
        subtitle="Five paths to the first 10 calls, plotted by effort per contact vs. response quality. Top-left quadrant is where to start — Josh intros and academic bridge."
        accent="#8B5CF6"
      >
        <ChannelStrategyMatrix />
      </Section>

      <Section
        icon={<Users size={16} />}
        title="Contact Pipeline Tracker"
        subtitle="15 Tier 1-3 seeded targets from the POC Target List. Add your 50 LinkedIn connections. Stage + notes persist across refreshes."
        accent="#0EA5E9"
      >
        <ContactPipelineTracker />
      </Section>

      <Section
        icon={<Phone size={16} />}
        title="Discovery Call Companion"
        subtitle="Goldner's 4-question script. Live notes per call. Tag patterns the moment a contact describes one unprompted."
        accent="#8B5CF6"
      >
        <DiscoveryCallCompanion />
      </Section>

      <Section
        icon={<Sparkles size={16} />}
        title="Pattern Validation Dashboard"
        subtitle="Aggregates every pattern tag across every discovery call. Each pattern hits 'validated' at 3+ independent confirmations."
        accent="#EC4899"
      >
        <PatternValidationDashboard />
      </Section>

      <Section
        icon={<Copy size={16} />}
        title="Template Quick-Copy Library"
        subtitle="Seven outreach templates. Pick a target to auto-fill company, hook, and deal frequency. One-click clipboard copy."
        accent="#F59E0B"
      >
        <TemplateQuickCopy />
      </Section>

      <Section
        icon={<Briefcase size={16} />}
        title="POC Kit"
        subtitle="One card per active POC. Six-week milestone tracker, success criteria, NPS, conversion signal, testimonial capture."
        accent="#F97316"
      >
        <POCKit />
      </Section>

      {/* Framework Audit Top Fixes — compact reference */}
      <section
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.18)',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lightbulb size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              Top 10 fixes — Framework Audit
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              The prioritized punch list from your 7-framework audit. Apply these before every document revision.
            </div>
          </div>
        </div>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 6,
          }}
        >
          {FRAMEWORK_AUDIT_TOP_FIXES.map((fix, i) => (
            <li
              key={fix}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid #16A34A',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(22, 163, 74, 0.18)',
                  color: '#16A34A',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              {fix}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
