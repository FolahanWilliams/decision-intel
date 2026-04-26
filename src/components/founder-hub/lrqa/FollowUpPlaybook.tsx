'use client';

/**
 * 48-hour Follow-Up Playbook — the structured cadence of post-meeting
 * actions that turn a single meeting into a partnership conversation.
 * Each step has a literal artefact + the rationale.
 */

import { Send } from 'lucide-react';
import { FOLLOWUP_PLAYBOOK, IAN_REMEMBER } from './lrqa-brief-data';

function formatHours(h: number): string {
  if (h === 0) return 'T+0';
  if (h < 24) return `T+${h}h`;
  if (h === 24) return 'T+24h';
  if (h === 48) return 'T+48h';
  if (h === 168) return 'T+7d';
  return `T+${h}h`;
}

export function FollowUpPlaybook() {
  return (
    <div>
      {/* Followup timeline */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#16A34A',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Send size={12} /> Post-meeting cadence — 48h playbook
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {FOLLOWUP_PLAYBOOK.map((step, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid #16A34A',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gridTemplateColumns: '70px 1fr',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#16A34A',
                textAlign: 'center',
                padding: '4px 0',
                background: 'rgba(22,163,74,0.10)',
                borderRadius: 999,
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                letterSpacing: '0.04em',
              }}
            >
              {formatHours(step.hoursAfter)}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                  lineHeight: 1.4,
                }}
              >
                {step.action}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  borderLeft: '2px solid #16A34A',
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              >
                {step.artefact}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--text-muted)' }}>Why:</strong> {step.rationale}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Things to remember strip */}
      <div
        style={{
          padding: 14,
          background: 'rgba(217,119,6,0.06)',
          border: '1px solid rgba(217,119,6,0.30)',
          borderLeft: '3px solid #D97706',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#D97706',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Things to remember about Ian
        </div>
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.7 }}>
          {IAN_REMEMBER.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
