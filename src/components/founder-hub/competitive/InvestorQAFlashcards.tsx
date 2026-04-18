'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode } from 'lucide-react';
import {
  INVESTOR_QA,
  TOPIC_LABEL,
  TOPIC_COLOR,
  type InvestorQA,
} from '@/lib/data/competitive-positioning';

type TopicFilter = 'all' | InvestorQA['topic'];

export function InvestorQAFlashcards() {
  const [filter, setFilter] = useState<TopicFilter>('all');
  const [activeId, setActiveId] = useState<string>(INVESTOR_QA[0].id);

  const filtered = filter === 'all' ? INVESTOR_QA : INVESTOR_QA.filter(q => q.topic === filter);

  const active =
    filtered.find(q => q.id === activeId) ?? filtered[0] ?? INVESTOR_QA[0];

  return (
    <div>
      {/* Topic filter pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 12,
        }}
      >
        <FilterPill
          label="All"
          accent="var(--text-muted)"
          active={filter === 'all'}
          onClick={() => {
            setFilter('all');
            setActiveId(INVESTOR_QA[0].id);
          }}
          count={INVESTOR_QA.length}
        />
        {(Object.keys(TOPIC_LABEL) as InvestorQA['topic'][]).map(topic => {
          const count = INVESTOR_QA.filter(q => q.topic === topic).length;
          if (count === 0) return null;
          return (
            <FilterPill
              key={topic}
              label={TOPIC_LABEL[topic]}
              accent={TOPIC_COLOR[topic]}
              active={filter === topic}
              onClick={() => {
                setFilter(topic);
                const first = INVESTOR_QA.find(q => q.topic === topic);
                if (first) setActiveId(first.id);
              }}
              count={count}
            />
          );
        })}
      </div>

      {/* Question list */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {filtered.map(qa => {
          const color = TOPIC_COLOR[qa.topic];
          const isActive = qa.id === active.id;
          return (
            <button
              key={qa.id}
              onClick={() => setActiveId(qa.id)}
              style={{
                padding: 10,
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-primary)',
                border: isActive ? `1.5px solid ${color}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isActive ? 'rgba(255,255,255,0.85)' : color,
                  marginBottom: 4,
                }}
              >
                {TOPIC_LABEL[qa.topic]}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {qa.question}
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${TOPIC_COLOR[active.topic]}`,
            borderRadius: 'var(--radius-md)',
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#EF4444',
              marginBottom: 6,
            }}
          >
            Investor asks
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              lineHeight: 1.45,
              marginBottom: 16,
              padding: 14,
              background: 'rgba(239, 68, 68, 0.06)',
              borderLeft: '3px solid #EF4444',
              borderRadius: 6,
            }}
          >
            &ldquo;{active.question}&rdquo;
          </div>

          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: TOPIC_COLOR[active.topic],
              marginBottom: 6,
            }}
          >
            Your answer
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.65,
              margin: '0 0 12px',
            }}
          >
            {active.answer}
          </p>

          {active.proof && (
            <div
              style={{
                padding: 12,
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <FileCode size={12} style={{ color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#16A34A',
                    marginBottom: 3,
                  }}
                >
                  Technical proof
                </div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {active.proof}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FilterPill({
  label,
  accent,
  active,
  onClick,
  count,
}: {
  label: string;
  accent: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 600,
        color: active ? '#fff' : 'var(--text-secondary)',
        background: active ? accent : 'var(--bg-card)',
        border: active ? `1px solid ${accent}` : '1px solid var(--border-color)',
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      {label}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: active ? 'rgba(255,255,255,0.85)' : accent,
          padding: '1px 6px',
          borderRadius: 10,
          background: active ? 'rgba(255,255,255,0.15)' : `${accent}18`,
        }}
      >
        {count}
      </span>
    </button>
  );
}
