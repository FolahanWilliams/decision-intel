'use client';

import { useState } from 'react';
import { INTENT_DESCRIPTIONS, INTENT_LABELS, OUTREACH_INTENTS } from '@/lib/outreach/types';
import type { OutreachIntent } from '@/lib/outreach/types';

interface Props {
  onGenerate: (input: {
    url?: string;
    rawText?: string;
    intent: OutreachIntent;
    contactName?: string;
    contactTitle?: string;
    contactCompany?: string;
  }) => void;
  isRunning: boolean;
}

export function OutreachComposer({ onGenerate, isRunning }: Props) {
  const [mode, setMode] = useState<'url' | 'paste'>('paste');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [intent, setIntent] = useState<OutreachIntent>('connect');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactCompany, setContactCompany] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'paste' && rawText.trim().length < 50) return;

    onGenerate({
      ...(mode === 'url' ? { url: url.trim() } : { rawText: rawText.trim() }),
      intent,
      contactName: contactName.trim() || undefined,
      contactTitle: contactTitle.trim() || undefined,
      contactCompany: contactCompany.trim() || undefined,
    });
  };

  const canSubmit =
    !isRunning && ((mode === 'url' && url.trim().length > 0) || (mode === 'paste' && rawText.trim().length >= 50));

  return (
    <form onSubmit={handleSubmit} style={formCard}>
      <div style={sectionHeading}>New Outreach</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMode('paste')}
          style={modeTab(mode === 'paste')}
        >
          Paste profile text
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={modeTab(mode === 'url')}
        >
          LinkedIn URL
        </button>
      </div>

      {mode === 'url' ? (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>LinkedIn profile URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/..."
            style={inputStyle}
          />
          <div style={hint}>
            LinkedIn gates most profiles behind login — if the URL fetch fails, paste the profile text instead.
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Profile text (paste from LinkedIn)</label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste the About section + Experience + recent posts. More text = better message."
            rows={8}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={hint}>
            {rawText.trim().length}/50 characters minimum. Copy the full About + Experience blocks.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="optional"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={contactTitle}
            onChange={e => setContactTitle(e.target.value)}
            placeholder="optional"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Company</label>
          <input
            type="text"
            value={contactCompany}
            onChange={e => setContactCompany(e.target.value)}
            placeholder="optional"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Intent</label>
        <div style={intentGrid}>
          {OUTREACH_INTENTS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setIntent(i)}
              style={intentCard(intent === i)}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                {INTENT_LABELS[i]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {INTENT_DESCRIPTIONS[i]}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={!canSubmit} style={submitButton(canSubmit)}>
        {isRunning ? 'Generating...' : 'Generate Outreach'}
      </button>
    </form>
  );
}

const formCard: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
};

const sectionHeading: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const hint: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginTop: 6,
};

const modeTab = (active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
  background: active ? 'var(--accent-primary)20' : 'transparent',
  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
});

const intentGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const intentCard = (active: boolean): React.CSSProperties => ({
  textAlign: 'left',
  padding: 12,
  borderRadius: 'var(--radius-md)',
  border: active ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
  background: active ? 'var(--accent-primary)15' : 'var(--bg-elevated)',
  cursor: 'pointer',
});

const submitButton = (enabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: enabled ? 'var(--accent-primary)' : 'var(--bg-elevated)',
  color: enabled ? '#fff' : 'var(--text-muted)',
  fontSize: 14,
  fontWeight: 700,
  cursor: enabled ? 'pointer' : 'not-allowed',
  transition: 'all 0.2s ease',
});
