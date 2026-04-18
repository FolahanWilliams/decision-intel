'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PITCH_SLIDES, type PitchSlide } from '@/lib/data/positioning-copilot';

const KIND_COLOR: Record<PitchSlide['kind'], string> = {
  hook: '#14B8A6',
  setup: '#6366F1',
  proof: '#16A34A',
  business: '#8B5CF6',
  close: '#F59E0B',
};

const KIND_LABEL: Record<PitchSlide['kind'], string> = {
  hook: 'Open',
  setup: 'Setup',
  proof: 'Proof',
  business: 'Business',
  close: 'Close',
};

export function PitchDeckRoadmap() {
  const [openIdx, setOpenIdx] = useState<number>(1);
  const active = PITCH_SLIDES.find(s => s.index === openIdx);

  return (
    <div>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {PITCH_SLIDES.map((slide, i) => {
          const color = KIND_COLOR[slide.kind];
          const isActive = slide.index === openIdx;
          return (
            <motion.button
              key={slide.index}
              onClick={() => setOpenIdx(slide.index)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.015 }}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card)';
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                  }}
                >
                  Slide {slide.index}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: isActive ? 'rgba(255,255,255,0.18)' : `${color}15`,
                    color: isActive ? '#fff' : color,
                  }}
                >
                  {KIND_LABEL[slide.kind]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {slide.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {slide.purpose}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${KIND_COLOR[active.kind]}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 10,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Slide {active.index} of {PITCH_SLIDES.length}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginTop: 2,
                  }}
                >
                  {active.title}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  maxWidth: 360,
                  textAlign: 'right',
                }}
              >
                {active.purpose}
              </div>
            </div>

            <div
              style={{
                padding: 14,
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--text-primary)',
              }}
            >
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
                What you actually say
              </div>
              {active.decisionIntelAnswer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
