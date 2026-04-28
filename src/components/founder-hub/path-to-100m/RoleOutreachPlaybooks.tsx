'use client';

import { useState } from 'react';
import {
  Briefcase,
  Building2,
  Handshake,
  Scale,
  Users,
  ShieldCheck,
  TrendingUp,
  Star,
  Mail,
  CalendarClock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ROLE_PLAYBOOKS, type RolePlaybook } from './data';

const BUYER_TYPE_ACCENT: Record<RolePlaybook['buyerType'], string> = {
  fast_validator: '#16A34A',
  wedge: '#D97706',
  expansion: '#0EA5E9',
  channel: '#7C3AED',
  amplifier: '#D97706',
  capital: '#DC2626',
};

const PRIORITY_LABEL: Record<RolePlaybook['priority'], string> = {
  now: '30-day fast-converter',
  summer_2026: 'Summer 2026 design-partner wedge',
  q3_2026: 'Q3 2026',
  q4_2026: 'Q4 2026 · 12-month ceiling',
  '2027': '2027 ceiling',
};

const ROLE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  pan_african_fund_partner: Handshake,
  f500_cso: Briefcase,
  f500_ma_head: Building2,
  f500_gc_audit_chair: Scale,
  management_consultant: Users,
  compliance_risk_firm: ShieldCheck,
  pre_seed_seed_investor: TrendingUp,
  senior_strategic_advisor: Star,
};

function PlaybookDetail({ p }: { p: RolePlaybook }) {
  const accent = BUYER_TYPE_ACCENT[p.buyerType];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Archetype + ticket */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          Archetype · {p.buyerType.replace('_', ' ')} · {PRIORITY_LABEL[p.priority]}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.55,
          }}
        >
          {p.archetype}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Ticket band:</strong> {p.ticketBand}
        </div>
      </div>

      <div className="role-grid-2col">
        <div
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            What they want
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {p.whatTheyWant.map(w => (
              <li
                key={w}
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 3,
                  lineHeight: 1.5,
                }}
              >
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            What keeps them up
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {p.whatKeepsThemUp.map(u => (
              <li
                key={u}
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 3,
                  lineHeight: 1.5,
                }}
              >
                {u}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cold opener */}
      <div
        style={{
          padding: 12,
          background: 'rgba(14,165,233,0.04)',
          border: '1px solid rgba(14,165,233,0.20)',
          borderLeft: '3px solid #0EA5E9',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#0EA5E9',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Mail size={11} /> How to reach
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.55,
          }}
        >
          <strong>Channel:</strong> {p.howToReach.coldChannel}
        </div>
        <div
          style={{
            padding: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            Cold opener
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            {p.howToReach.coldOpener}
          </div>
        </div>
        <div
          style={{
            padding: 10,
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            Cold blunder · do NOT say
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {p.howToReach.coldBlunder}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          <strong>Warm intro path:</strong> {p.howToReach.warmIntroPath}
        </div>
      </div>

      {/* Discovery questions */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#7C3AED',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Discovery questions · ask in this order
        </div>
        <div className="role-discovery-grid">
          {(['opening', 'rigor', 'decisionGate'] as const).map(stage => (
            <div key={stage}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                {stage === 'decisionGate' ? 'decision gate' : stage}
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                {p.discoveryQuestions[stage].map(q => (
                  <li
                    key={q}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Killer pitch */}
      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(22,163,74,0.04))',
          border: '1px solid rgba(22,163,74,0.25)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#16A34A',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          Killer pitch
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            fontWeight: 600,
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          &ldquo;{p.killerPitch}&rdquo;
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
          <strong>Lead with:</strong> {p.artefactToLead}
        </div>
      </div>

      {/* Three phrases never to say */}
      <div
        style={{
          padding: 12,
          background: 'rgba(220,38,38,0.04)',
          border: '1px solid rgba(220,38,38,0.18)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          3 phrases never to say
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
          {p.threePhrasesNeverToSay.map(ph => (
            <li
              key={ph}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 4,
                lineHeight: 1.5,
              }}
            >
              {ph}
            </li>
          ))}
        </ul>
      </div>

      {/* Meeting arc */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#0EA5E9',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <CalendarClock size={11} /> Meeting arc · minute by minute
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {p.meetingArc.map(step => (
            <div
              key={step.minute}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  color: '#0EA5E9',
                  fontWeight: 700,
                  flexShrink: 0,
                  minWidth: 90,
                }}
              >
                {step.minute}
              </div>
              <div>{step.move}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Signals */}
      <div className="role-grid-2col">
        <div
          style={{
            padding: 12,
            background: 'rgba(22,163,74,0.04)',
            border: '1px solid rgba(22,163,74,0.18)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={11} /> Positive signals
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {p.signalsToListenFor.positive.map(s => (
              <li
                key={s}
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginBottom: 3,
                  lineHeight: 1.5,
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            padding: 12,
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AlertCircle size={11} /> Negative signals
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {p.signalsToListenFor.negative.map(s => (
              <li
                key={s}
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginBottom: 3,
                  lineHeight: 1.5,
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Follow-up cadence */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#D97706',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Follow-up cadence
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {p.followUp.map(f => (
            <div
              key={f.day}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  color: '#D97706',
                  fontWeight: 700,
                  flexShrink: 0,
                  minWidth: 110,
                }}
              >
                {f.day}
              </div>
              <div>{f.artifact}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <strong>Conversion window:</strong> {p.conversionWindow}
        </div>
      </div>

      {/* Why convert / why not */}
      <div className="role-grid-2col">
        <div
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Why they convert
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {p.whyTheyConvert}
          </div>
        </div>
        <div
          style={{
            padding: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #DC2626',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Why they don&apos;t
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {p.whyTheyDont}
          </div>
        </div>
      </div>

      {/* NotebookLM follow-up */}
      <div
        style={{
          padding: 12,
          background: 'rgba(124,58,237,0.05)',
          border: '1px dashed rgba(124,58,237,0.30)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#7C3AED',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          NotebookLM follow-up question for this persona
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          {p.notebookLmFollowUp}
        </div>
      </div>
    </div>
  );
}

export function RoleOutreachPlaybooks() {
  const [activeRoleId, setActiveRoleId] = useState(ROLE_PLAYBOOKS[0].id);
  const active = ROLE_PLAYBOOKS.find(r => r.id === activeRoleId) ?? ROLE_PLAYBOOKS[0];

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {ROLE_PLAYBOOKS.map(r => {
          const Icon = ROLE_ICON[r.id] ?? Briefcase;
          const accent = BUYER_TYPE_ACCENT[r.buyerType];
          const isActive = r.id === activeRoleId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRoleId(r.id)}
              style={{
                padding: 12,
                background: isActive ? `${accent}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                borderTop: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {r.buyerType}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {r.role}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {PRIORITY_LABEL[r.priority]}
              </div>
            </button>
          );
        })}
      </div>

      <PlaybookDetail p={active} />

      <style>{`
        .role-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .role-discovery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .role-grid-2col,
          .role-discovery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
