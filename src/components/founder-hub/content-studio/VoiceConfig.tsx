'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { card, sectionTitle, badge } from '../shared-styles';

const TONES = [
  { id: 'authoritative', label: 'Authoritative', color: '#3b82f6' },
  { id: 'conversational', label: 'Conversational', color: '#22c55e' },
  { id: 'technical', label: 'Technical', color: '#a855f7' },
  { id: 'inspirational', label: 'Inspirational', color: '#f59e0b' },
] as const;

interface VoiceConfigProps {
  tone: string;
  setTone: (t: string) => void;
  voiceNotes: string;
  setVoiceNotes: (v: string) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}

export function VoiceConfig({
  tone,
  setTone,
  voiceNotes,
  setVoiceNotes,
  isOpen,
  setIsOpen,
}: VoiceConfigProps) {
  const activeTone = TONES.find(t => t.id === tone) || TONES[0];

  return (
    <div style={card}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...sectionTitle,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: isOpen ? 12 : 0,
          padding: 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          🎙️ Brand Voice
          {!isOpen && <span style={badge(activeTone.color)}>{activeTone.label}</span>}
        </span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isOpen && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted, #71717a)',
                marginBottom: 8,
              }}
            >
              Tone
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      tone === t.id
                        ? `2px solid ${t.color}`
                        : '2px solid var(--border-primary, #222)',
                    background: tone === t.id ? `${t.color}15` : 'transparent',
                    color: tone === t.id ? t.color : 'var(--text-secondary, #a1a1aa)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted, #71717a)',
                marginBottom: 8,
              }}
            >
              Custom Voice Notes
            </div>
            <textarea
              value={voiceNotes}
              onChange={e => setVoiceNotes(e.target.value)}
              placeholder="E.g., Always mention Decision Intel by name. Reference Kahneman when possible. Keep sentences short and punchy."
              maxLength={2000}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-primary, #222)',
                background: 'var(--bg-primary, #0a0a0a)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
