'use client';

/**
 * Meeting Prep Board — categorised checklist of pre-meeting work
 * (research / artefact / rehearse / avoid). Filter chips let Folahan
 * focus on one category at a time. Each item has its own detail panel.
 *
 * Plus the Question Bank — what to ASK Ian during the meeting, with the
 * "why ask" + the "what a YES signals" framings so Folahan can
 * triangulate which tier of ask becomes plausible based on Ian's
 * answers.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Briefcase, Mic, AlertCircle, HelpCircle } from 'lucide-react';
import { MEETING_PREP, QUESTION_BANK, type PrepItem, type QuestionEntry } from './lrqa-brief-data';

const PREP_CATEGORIES: PrepItem['category'][] = ['research', 'artefact', 'rehearse', 'avoid'];

const CATEGORY_META: Record<
  PrepItem['category'],
  { label: string; color: string; Icon: typeof BookOpen }
> = {
  research: { label: 'Research', color: '#0EA5E9', Icon: BookOpen },
  artefact: { label: 'Bring', color: '#16A34A', Icon: Briefcase },
  rehearse: { label: 'Rehearse', color: '#8B5CF6', Icon: Mic },
  avoid: { label: 'Avoid', color: '#DC2626', Icon: AlertCircle },
};

const QUESTION_CATEGORY_COLORS: Record<QuestionEntry['category'], string> = {
  discovery: '#0EA5E9',
  fit: '#16A34A',
  process: '#8B5CF6',
  advice: '#D97706',
};

export function MeetingPrepBoard() {
  const [activeCategory, setActiveCategory] = useState<PrepItem['category']>('research');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  const filteredPrep = MEETING_PREP.filter(p => p.category === activeCategory);
  const activeQuestion = QUESTION_BANK[activeQuestionIdx];

  return (
    <div>
      {/* Prep checklist section */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          Pre-meeting checklist
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {PREP_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat];
            const isActive = cat === activeCategory;
            const count = MEETING_PREP.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? '#fff' : meta.color,
                  background: isActive ? meta.color : `${meta.color}10`,
                  border: `1px solid ${meta.color}40`,
                  borderRadius: 999,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <meta.Icon size={11} />
                {meta.label}
                <span
                  style={{
                    fontSize: 9,
                    background: isActive ? 'rgba(255,255,255,0.25)' : `${meta.color}25`,
                    padding: '1px 6px',
                    borderRadius: 999,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtered prep items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {filteredPrep.map((item, i) => {
              const meta = CATEGORY_META[item.category];
              return (
                <div
                  key={`${item.category}-${i}`}
                  style={{
                    padding: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.item}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {item.detail}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Question Bank section */}
      <div>
        <div
          style={{
            fontSize: 11,
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
          <HelpCircle size={12} /> Question bank — what to ASK Ian
        </div>

        {/* Question selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {QUESTION_BANK.map((q, i) => {
            const isActive = i === activeQuestionIdx;
            const color = QUESTION_CATEGORY_COLORS[q.category];
            return (
              <button
                key={i}
                onClick={() => setActiveQuestionIdx(i)}
                style={{
                  padding: '8px 12px',
                  background: isActive ? color : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 600,
                  lineHeight: 1.4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 8,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginRight: 6,
                    opacity: 0.85,
                  }}
                >
                  {q.category}
                </span>
                Q{i + 1}
              </button>
            );
          })}
        </div>

        {/* Active question detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQuestionIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              padding: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${QUESTION_CATEGORY_COLORS[activeQuestion.category]}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: QUESTION_CATEGORY_COLORS[activeQuestion.category],
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              {activeQuestion.category}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                marginBottom: 12,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderLeft: `2px solid ${QUESTION_CATEGORY_COLORS[activeQuestion.category]}`,
                borderRadius: 4,
              }}
            >
              {activeQuestion.question}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                Why ask
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {activeQuestion.whyAsk}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#16A34A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                What a YES signals
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {activeQuestion.signalIfYes}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
