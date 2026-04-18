'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare } from 'lucide-react';
import { AUDIENCE_PITCHES, type AudiencePitch } from '@/lib/data/sales-toolkit';

export function AudiencePitchTabs() {
  const [activeId, setActiveId] = useState<string>(AUDIENCE_PITCHES[0].id);
  const active = AUDIENCE_PITCHES.find(a => a.id === activeId)!;

  return (
    <div>
      {/* Audience tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 14,
        }}
      >
        {AUDIENCE_PITCHES.map((pitch: AudiencePitch) => {
          const isActive = pitch.id === activeId;
          return (
            <button
              key={pitch.id}
              onClick={() => setActiveId(pitch.id)}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? pitch.color : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${pitch.color}` : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: isActive ? 'rgba(255,255,255,0.7)' : pitch.color,
                }}
              />
              {pitch.audience}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: isActive ? 'rgba(255,255,255,0.18)' : `${pitch.color}18`,
                  color: isActive ? '#fff' : pitch.color,
                }}
              >
                {pitch.seconds}s
              </span>
            </button>
          );
        })}
      </div>

      {/* Pitch detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${active.color}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={14} style={{ color: active.color }} />
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: active.color,
              }}
            >
              For {active.audience}
            </div>
            <span
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={11} />
              {active.seconds} seconds
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.7,
              fontStyle: 'italic',
              padding: 14,
              background: 'var(--bg-secondary)',
              borderLeft: `2px solid ${active.color}`,
              borderRadius: 4,
              margin: '0 0 12px',
            }}
          >
            &ldquo;{renderWithEmphasis(active.pitch, active.emphasis, active.color)}&rdquo;
          </p>

          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Key hooks
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {active.emphasis.map(e => (
                <span
                  key={e}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    color: active.color,
                    background: `${active.color}12`,
                    border: `1px solid ${active.color}30`,
                    borderRadius: 3,
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function renderWithEmphasis(text: string, phrases: string[], color: string): React.ReactNode {
  // Split the text on any of the emphasis phrases (case-insensitive, longest first for greedy match).
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    let nextMatch: { phrase: string; idx: number } | null = null;
    for (const phrase of sorted) {
      const idx = remaining.toLowerCase().indexOf(phrase.toLowerCase());
      if (idx >= 0 && (!nextMatch || idx < nextMatch.idx)) {
        nextMatch = { phrase, idx };
      }
    }
    if (!nextMatch) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (nextMatch.idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, nextMatch.idx)}</span>);
    }
    const end = nextMatch.idx + nextMatch.phrase.length;
    parts.push(
      <strong key={key++} style={{ color, fontStyle: 'normal' }}>
        {remaining.slice(nextMatch.idx, end)}
      </strong>
    );
    remaining = remaining.slice(end);
  }
  return <>{parts}</>;
}
