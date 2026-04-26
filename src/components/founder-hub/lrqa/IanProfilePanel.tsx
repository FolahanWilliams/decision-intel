'use client';

/**
 * Ian Spaulding profile + warm-intro context — the hero panel for the
 * LRQA brief. Sets the relational frame (friend's dad, advisor-grade
 * conversation first), the intellectual frame (Yale Religion/HR, ELEVATE
 * founder journey), and the recent-public-voice quotes Folahan should
 * literally reference in the meeting.
 */

import { Building2, GraduationCap, Briefcase, Quote } from 'lucide-react';
import { IAN_PROFILE } from './lrqa-brief-data';

export function IanProfilePanel() {
  return (
    <div>
      {/* Warm-intro context strip — high-warning amber, sets the relational tone */}
      <div
        style={{
          padding: 14,
          background: 'rgba(217,119,6,0.06)',
          border: '1px solid rgba(217,119,6,0.30)',
          borderLeft: '3px solid #D97706',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#D97706',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}
        >
          Warm-intro context · trust capital is real but burns fast
        </div>
        {IAN_PROFILE.warmIntroContext}
      </div>

      {/* Identity card */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            {IAN_PROFILE.name}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#16A34A',
              marginTop: 2,
            }}
          >
            {IAN_PROFILE.role} · {IAN_PROFILE.company}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Building2 size={12} />
            {IAN_PROFILE.location} · {IAN_PROFILE.linkedinFollowers.toLocaleString()} followers ·{' '}
            {IAN_PROFILE.connections} connections
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GraduationCap size={10} /> Education
          </div>
          {IAN_PROFILE.intellectualProfile.education.map(e => (
            <div key={e.institution} style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 4 }}>
              <strong>{e.institution}</strong> — {e.degree} ({e.years})
            </div>
          ))}
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              borderLeft: '2px solid #16A34A',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            {IAN_PROFILE.intellectualProfile.intellectualSignal}
          </div>
        </div>
      </div>

      {/* Career arc */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Briefcase size={10} /> Career arc · 30+ years
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {IAN_PROFILE.careerArc.map((step, i) => (
            <div
              key={`${step.role}-${i}`}
              style={{
                padding: '8px 12px',
                background: i === 0 ? 'rgba(22,163,74,0.06)' : 'var(--bg-secondary)',
                border: `1px solid ${i === 0 ? 'rgba(22,163,74,0.30)' : 'var(--border-color)'}`,
                borderLeft: `3px solid ${i === 0 ? '#16A34A' : '#94A3B8'}`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {step.role}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {step.company}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  }}
                >
                  {step.years}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                {step.thrust}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent public voice — quote-back ammunition */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#0EA5E9',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Quote size={12} /> Recent public voice · quote these in the meeting
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {IAN_PROFILE.recentPublicVoice.map((v, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid #0EA5E9',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 6,
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {v.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  }}
                >
                  {v.date}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                  marginBottom: 8,
                  paddingLeft: 10,
                  borderLeft: '2px solid #0EA5E9',
                }}
              >
                {v.thrust}
              </div>
              <div
                style={{
                  padding: 8,
                  background: 'rgba(22,163,74,0.06)',
                  border: '1px solid rgba(22,163,74,0.30)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: '#16A34A' }}>DI relevance:</strong> {v.diRelevance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
