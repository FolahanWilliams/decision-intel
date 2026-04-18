'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CONTENT_WEEK,
  CONTENT_PRINCIPLE,
  type ContentDay,
} from '@/lib/data/positioning-frameworks';

function getTodayIndex(): number {
  const d = new Date().getDay();
  // Sunday=0 in JS; our week starts Monday=1. Map to 0-indexed array:
  // Mon→0, Tue→1, Wed→2, Thu→3, Fri→4, Sat→5, Sun→6
  if (d === 0) return 6;
  return d - 1;
}

export function ContentCadenceCalendar() {
  const [todayIdx, setTodayIdx] = useState<number>(0);
  const [focusIdx, setFocusIdx] = useState<number>(0);

  useEffect(() => {
    // Read the real date only on the client so SSR and hydration match on 0.
    const idx = getTodayIndex();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe date read
    setTodayIdx(idx);
    setFocusIdx(idx);
  }, []);

  const focused = CONTENT_WEEK[focusIdx];

  return (
    <div>
      {/* Week grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {CONTENT_WEEK.map((day, idx) => {
          const isToday = idx === todayIdx;
          const isFocus = idx === focusIdx;
          return (
            <DayCell
              key={day.dayNumber}
              day={day}
              isToday={isToday}
              isFocus={isFocus}
              onClick={() => setFocusIdx(idx)}
            />
          );
        })}
      </div>

      {/* Focus day detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={focused.dayNumber}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Day {focused.dayNumber} · {focused.day}
                {focusIdx === todayIdx && ' · TODAY'}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '2px 0 4px',
                }}
              >
                {focused.theme}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {focused.intent}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Decision question
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
              {focused.decisionQuestion}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 6,
              }}
            >
              Decision Intel prompt template
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              {focused.diPromptTemplate}
            </div>
          </div>

          <div>
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
              Format
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {focused.format.map(f => (
                <li
                  key={f}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Principle */}
      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        {CONTENT_PRINCIPLE}
      </div>
    </div>
  );
}

function DayCell({
  day,
  isToday,
  isFocus,
  onClick,
}: {
  day: ContentDay;
  isToday: boolean;
  isFocus: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '10px 8px',
        minHeight: 84,
        background: isFocus ? '#16A34A' : isToday ? 'rgba(22, 163, 74, 0.12)' : 'var(--bg-card)',
        color: isFocus ? '#fff' : 'var(--text-primary)',
        border: isFocus
          ? '1.5px solid #16A34A'
          : isToday
            ? '1.5px solid #16A34A'
            : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: isFocus ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
        }}
      >
        {day.day.slice(0, 3)}
        {isToday && ' · Today'}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {day.theme}
      </div>
    </button>
  );
}
