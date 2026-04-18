'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Monitor, Briefcase } from 'lucide-react';
import {
  STORY_STEPS,
  STORY_CONTEXT_LABEL,
  type StoryContext,
  type StoryStep,
} from '@/lib/data/positioning-frameworks';

const CONTEXT_ICON: Record<StoryContext, React.ReactNode> = {
  cold_email: <Mail size={14} />,
  demo: <Monitor size={14} />,
  pitch: <Briefcase size={14} />,
};

const ARC_HEIGHT = 120;
const ARC_WIDTH_MIN = 680;

export function StoryArcConstructor() {
  const [context, setContext] = useState<StoryContext>('cold_email');
  const [activeStep, setActiveStep] = useState<number>(1);
  const active = STORY_STEPS.find(s => s.step === activeStep)!;

  return (
    <div>
      {/* Context toggle */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          padding: 4,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          width: 'fit-content',
        }}
      >
        {(Object.keys(STORY_CONTEXT_LABEL) as StoryContext[]).map(c => (
          <button
            key={c}
            onClick={() => setContext(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: context === c ? '#fff' : 'var(--text-secondary)',
              background: context === c ? '#16A34A' : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {CONTEXT_ICON[c]}
            {STORY_CONTEXT_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Arc visualization */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 16px 16px',
          marginBottom: 14,
          overflowX: 'auto',
        }}
      >
        <svg
          viewBox={`0 0 ${ARC_WIDTH_MIN} ${ARC_HEIGHT + 60}`}
          style={{ width: '100%', minWidth: ARC_WIDTH_MIN, height: 'auto', display: 'block' }}
        >
          {/* Arc path */}
          <path
            d={`M 40 ${ARC_HEIGHT + 10} Q ${ARC_WIDTH_MIN / 2} ${-20}, ${ARC_WIDTH_MIN - 40} ${ARC_HEIGHT + 10}`}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1.5"
            strokeDasharray="4 5"
          />

          {/* Step nodes */}
          {STORY_STEPS.map((step, i) => {
            const t = i / (STORY_STEPS.length - 1);
            // Quadratic bezier evaluation:
            const p0x = 40;
            const p0y = ARC_HEIGHT + 10;
            const p1x = ARC_WIDTH_MIN / 2;
            const p1y = -20;
            const p2x = ARC_WIDTH_MIN - 40;
            const p2y = ARC_HEIGHT + 10;
            const x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
            const y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
            const isActive = step.step === activeStep;
            return (
              <g
                key={step.id}
                onClick={() => setActiveStep(step.step)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 20 : 16}
                  fill={isActive ? '#16A34A' : 'var(--bg-primary)'}
                  stroke="#16A34A"
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ transition: 'all 0.15s ease' }}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={isActive ? '#fff' : '#16A34A'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {step.step}
                </text>
                <text
                  x={x}
                  y={y + 38}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? 'var(--text-primary)' : 'var(--text-muted)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {step.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active step detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${context}-${active.step}`}
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
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 8,
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
                Step {active.step} of {STORY_STEPS.length} — {STORY_CONTEXT_LABEL[context]}
              </div>
              <div
                style={{
                  fontSize: 18,
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
                fontSize: 11,
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                maxWidth: 400,
                textAlign: 'right',
              }}
            >
              {active.question}
            </div>
          </div>

          <div
            style={{
              padding: 14,
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
                color: '#16A34A',
                marginBottom: 6,
              }}
            >
              What you put here for {STORY_CONTEXT_LABEL[context].toLowerCase()}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              {active.byContext[context]}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: 'rgba(239, 68, 68, 0.06)',
              borderLeft: '2px solid #EF4444',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: '#EF4444' }}>Fail mode:</strong> {active.failureMode}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step thumb navigator */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          gap: 4,
        }}
      >
        {STORY_STEPS.map((step: StoryStep) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.step)}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: 10,
              fontWeight: 600,
              color: activeStep === step.step ? '#fff' : 'var(--text-secondary)',
              background: activeStep === step.step ? '#16A34A' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              cursor: 'pointer',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.title}
          </button>
        ))}
      </div>
    </div>
  );
}
