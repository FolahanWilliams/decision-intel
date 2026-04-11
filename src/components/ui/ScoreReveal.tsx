'use client';

import { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { motion, AnimatePresence } from 'framer-motion';

const GRADE_THRESHOLDS: Array<{ min: number; grade: string; color: string }> = [
  { min: 85, grade: 'A', color: '#34d399' },
  { min: 70, grade: 'B', color: '#38bdf8' },
  { min: 55, grade: 'C', color: '#fbbf24' },
  { min: 40, grade: 'D', color: '#fb923c' },
  { min: 0, grade: 'F', color: '#f87171' },
];

function getGrade(score: number): { grade: string; color: string } {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return { grade: t.grade, color: t.color };
  }
  return { grade: 'F', color: '#f87171' };
}

interface ScoreRevealProps {
  score: number;
  label: string;
  showGrade?: boolean;
  duration?: number;
  /**
   * Milliseconds of suspense pause to hold the placeholder before the score
   * animates in. Defaults to 0 (no pause) for backwards-compatibility; callers
   * in the hero flow should pass 1200 for the SAT-score reveal feel.
   */
  suspenseMs?: number;
}

export function ScoreReveal({
  score,
  label,
  showGrade = false,
  duration = 1500,
  suspenseMs = 0,
}: ScoreRevealProps) {
  const [stage, setStage] = useState<'suspense' | 'revealing'>(
    suspenseMs > 0 ? 'suspense' : 'revealing'
  );

  useEffect(() => {
    if (suspenseMs <= 0) return;
    const timer = setTimeout(() => setStage('revealing'), suspenseMs);
    return () => clearTimeout(timer);
  }, [suspenseMs]);

  const { grade, color } = getGrade(Math.round(score));

  return (
    <div>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {label}
      </h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minHeight: 36 }}>
        <AnimatePresence mode="wait">
          {stage === 'suspense' ? (
            <motion.span
              key="suspense"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Scoring decision quality
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ display: 'inline-block', marginLeft: 2 }}
              >
                ...
              </motion.span>
            </motion.span>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}
            >
              <AnimatedNumber
                value={Math.round(score)}
                duration={duration}
                suffix="/100"
                style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)' }}
              />
              {showGrade && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: duration / 1000 + 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 12,
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    fontSize: 16,
                    fontWeight: 800,
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {grade}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
