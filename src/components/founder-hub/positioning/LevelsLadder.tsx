'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, CheckCircle2 } from 'lucide-react';
import {
  ENTREPRENEUR_LEVELS,
  CURRENT_LEVEL,
  type EntrepreneurLevel,
} from '@/lib/data/positioning-frameworks';

export function LevelsLadder() {
  const [focusLevel, setFocusLevel] = useState<number>(CURRENT_LEVEL);
  const focused = ENTREPRENEUR_LEVELS.find(l => l.level === focusLevel)!;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: 20,
        alignItems: 'stretch',
      }}
    >
      {/* Ladder column */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Climb the ladder
        </div>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
          {ENTREPRENEUR_LEVELS.map(level => {
            const isCurrent = level.level === CURRENT_LEVEL;
            const isNext = level.level === CURRENT_LEVEL + 1;
            const isFocused = level.level === focusLevel;
            const isBelow = level.level < CURRENT_LEVEL;
            return (
              <button
                key={level.level}
                onClick={() => setFocusLevel(level.level)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: isFocused ? level.color : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: isFocused
                    ? `1.5px solid ${level.color}`
                    : isCurrent
                      ? '1.5px solid #16A34A'
                      : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  opacity: isBelow && !isFocused ? 0.55 : 1,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isFocused ? 'rgba(255,255,255,0.9)' : level.color,
                    color: isFocused ? level.color : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {level.level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: isFocused ? '#111' : 'var(--text-primary)',
                    }}
                  >
                    {level.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: isFocused ? 'rgba(0,0,0,0.7)' : 'var(--text-muted)',
                      marginTop: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {level.mindset}
                  </div>
                </div>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isFocused ? '#111' : '#16A34A',
                      background: isFocused ? 'rgba(255,255,255,0.8)' : 'rgba(22, 163, 74, 0.12)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    You
                  </span>
                )}
                {isNext && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isFocused ? '#111' : 'var(--text-muted)',
                      background: isFocused ? 'rgba(255,255,255,0.8)' : 'var(--bg-card)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <ArrowUp size={9} /> Next
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Focus detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={focused.level}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'var(--bg-card)',
            border: `1px solid var(--border-color)`,
            borderLeft: `3px solid ${focused.color}`,
            borderRadius: 'var(--radius-md)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Level {focused.level}
          </div>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '2px 0 4px',
              lineHeight: 1.1,
            }}
          >
            {focused.title}
          </h3>
          <p
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              margin: '0 0 12px',
            }}
          >
            {focused.motto}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 10,
                background: 'var(--bg-secondary)',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 3,
                }}
              >
                Goal
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                {focused.goal}
              </div>
            </div>
            <div
              style={{
                padding: 10,
                background: 'var(--bg-secondary)',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 3,
                }}
              >
                Mindset
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                {focused.mindset}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              How to improve
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              {focused.howToImprove.map(t => (
                <li
                  key={t}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <CheckCircle2
                    size={12}
                    style={{ color: focused.color, marginTop: 3, flexShrink: 0 }}
                  />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <DecisionIntelStateBlock state={focused.decisionIntelState} color={focused.color} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DecisionIntelStateBlock({
  state,
  color,
}: {
  state: EntrepreneurLevel['decisionIntelState'];
  color: string;
}) {
  const labels: Record<EntrepreneurLevel['decisionIntelState']['kind'], string> = {
    below: 'Cleared',
    current: 'You are here',
    next: 'Level-up zone — moves to make',
    aspiration: 'Aspirational — where the story lands',
  };
  const background: Record<EntrepreneurLevel['decisionIntelState']['kind'], string> = {
    below: 'var(--bg-secondary)',
    current: `${color}18`,
    next: 'rgba(245, 158, 11, 0.08)',
    aspiration: 'var(--bg-secondary)',
  };
  return (
    <div
      style={{
        padding: 12,
        background: background[state.kind],
        border: `1px solid ${state.kind === 'current' ? color : 'var(--border-color)'}`,
        borderRadius: 6,
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: state.kind === 'next' ? '#F59E0B' : color,
          marginBottom: 5,
        }}
      >
        {labels[state.kind]}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {state.note}
      </div>
      {state.kind === 'next' && 'moves' in state && (
        <ul
          style={{
            margin: '10px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {state.moves.map((m, i) => (
            <li
              key={i}
              style={{
                fontSize: 11,
                color: 'var(--text-primary)',
                paddingLeft: 18,
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: '#F59E0B',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </span>
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
