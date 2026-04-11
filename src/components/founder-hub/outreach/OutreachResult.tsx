'use client';

import { useState } from 'react';
import type { GeneratedOutreach } from '@/lib/outreach/types';
import { INTENT_LABELS } from '@/lib/outreach/types';

interface Props {
  outreach: GeneratedOutreach;
  artifactId: string | null;
  founderPass: string;
  onRegenerate: () => void;
  onStatusChanged?: () => void;
}

export function OutreachResult({
  outreach,
  artifactId,
  founderPass,
  onRegenerate,
  onStatusChanged,
}: Props) {
  const [editedMessage, setEditedMessage] = useState(outreach.message);
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [sentStatus, setSentStatus] = useState<'draft' | 'sent'>('draft');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleMarkSent = async () => {
    if (!artifactId || markingSent) return;
    setMarkingSent(true);
    try {
      const res = await fetch('/api/founder-hub/outreach/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({ id: artifactId, status: 'sent' }),
      });
      if (res.ok) {
        setSentStatus('sent');
        onStatusChanged?.();
      }
    } finally {
      setMarkingSent(false);
    }
  };

  const profile = outreach.profile;

  return (
    <div style={resultCard}>
      <div style={resultHeader}>
        <div>
          <div style={kicker}>Drafted outreach</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {profile.name ?? 'Unnamed contact'}
            {profile.role && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> — {profile.role}</span>}
          </div>
          {profile.company && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.company}</div>
          )}
        </div>
        <div style={intentChip}>{INTENT_LABELS[outreach.callouts.kind]}</div>
      </div>

      {profile.icpFit !== 'unknown' && (
        <div style={icpFitBlock(profile.icpFit)}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ICP fit: {profile.icpFit}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{profile.icpFitReason}</div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={sectionLabel}>Message</div>
        <textarea
          value={editedMessage}
          onChange={e => setEditedMessage(e.target.value)}
          rows={8}
          style={messageTextarea}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleCopy} style={primaryBtn}>
            {copied ? 'Copied!' : 'Copy message'}
          </button>
          <button
            type="button"
            onClick={handleMarkSent}
            disabled={!artifactId || sentStatus === 'sent' || markingSent}
            style={sentStatus === 'sent' ? sentBtn : secondaryBtn}
          >
            {sentStatus === 'sent' ? 'Marked sent' : markingSent ? 'Marking...' : 'Mark as sent'}
          </button>
          <button type="button" onClick={onRegenerate} style={secondaryBtn}>
            Regenerate
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={sectionLabel}>Warm openers (swap in if the main one feels off)</div>
        <ul style={bulletList}>
          {outreach.warmOpeners.map((opener, i) => (
            <li key={i} style={bulletItem}>
              {opener}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={sectionLabel}>Talking points (for the reply)</div>
        <ul style={bulletList}>
          {outreach.talkingPoints.map((point, i) => (
            <li key={i} style={bulletItem}>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div style={calloutBlock}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
          {outreach.callouts.headline}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
          {outreach.callouts.body}
        </div>
        {outreach.callouts.bullets.length > 0 && (
          <ul style={{ ...bulletList, marginTop: 8 }}>
            {outreach.callouts.bullets.map((b, i) => (
              <li key={i} style={bulletItem}>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(profile.recentTopics.length > 0 || profile.inferredPriorities.length > 0) && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {profile.recentTopics.length > 0 && (
            <div>
              <div style={sectionLabel}>Recent topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.recentTopics.map((t, i) => (
                  <span key={i} style={pill}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.inferredPriorities.length > 0 && (
            <div>
              <div style={sectionLabel}>Inferred priorities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.inferredPriorities.map((t, i) => (
                  <span key={i} style={pill}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const resultCard: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
};

const resultHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
  gap: 12,
};

const kicker: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  marginBottom: 4,
};

const intentChip: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent-primary)20',
  color: 'var(--accent-primary)',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const icpFitBlock = (fit: 'high' | 'medium' | 'low'): React.CSSProperties => {
  const color = fit === 'high' ? '#16A34A' : fit === 'medium' ? '#F59E0B' : '#94A3B8';
  return {
    padding: 12,
    borderRadius: 'var(--radius-md)',
    background: `${color}15`,
    border: `1px solid ${color}30`,
    color,
    marginBottom: 16,
  };
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: 8,
};

const messageTextarea: React.CSSProperties = {
  width: '100%',
  padding: 14,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 14,
  lineHeight: 1.55,
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const sentBtn: React.CSSProperties = {
  ...secondaryBtn,
  background: 'var(--accent-primary)15',
  borderColor: 'var(--accent-primary)',
  color: 'var(--accent-primary)',
};

const bulletList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  listStyle: 'disc',
};

const bulletItem: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  lineHeight: 1.5,
};

const calloutBlock: React.CSSProperties = {
  padding: 14,
  borderRadius: 'var(--radius-md)',
  background: 'var(--accent-primary)10',
  border: '1px solid var(--accent-primary)30',
};

const pill: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  fontSize: 11,
  color: 'var(--text-secondary)',
};
