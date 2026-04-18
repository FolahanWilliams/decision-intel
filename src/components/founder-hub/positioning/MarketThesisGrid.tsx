'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MARKET_DIMENSIONS,
  type MarketDimension,
} from '@/lib/data/positioning-copilot';

export function MarketThesisGrid() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {MARKET_DIMENSIONS.map((dim, idx) => (
          <DimensionCard
            key={dim.id}
            dim={dim}
            index={idx}
            isOpen={openId === dim.id}
            onToggle={() => setOpenId(openId === dim.id ? null : dim.id)}
            isLast={idx === MARKET_DIMENSIONS.length - 1}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        {openId && (
          <motion.div
            key={openId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <DimensionDetail dim={MARKET_DIMENSIONS.find(d => d.id === openId)!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DimensionCard({
  dim,
  index,
  isOpen,
  onToggle,
  isLast,
}: {
  dim: MarketDimension;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const confColor =
    dim.confidence >= 80 ? '#16A34A' : dim.confidence >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <button
      onClick={onToggle}
      style={{
        textAlign: 'left',
        padding: 12,
        border: isOpen
          ? `1px solid ${confColor}`
          : `1px solid var(--border-color)`,
        borderRadius: 'var(--radius-md)',
        background: isLast ? 'var(--text-primary)' : 'var(--bg-card)',
        color: isLast ? 'var(--bg-primary)' : 'var(--text-primary)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.15s ease',
        boxShadow: isOpen ? `0 0 0 2px ${confColor}20` : 'none',
      }}
      onMouseEnter={e => {
        if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-hover, var(--border-color))';
      }}
      onMouseLeave={e => {
        if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: isLast ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        Step {index + 1} / {MARKET_DIMENSIONS.length}
        {isLast && ' · Last step'}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        {dim.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: isLast ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
          lineHeight: 1.4,
          marginBottom: 10,
        }}
      >
        {dim.question}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: isLast ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dim.confidence}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              height: '100%',
              background: confColor,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isLast ? 'rgba(255,255,255,0.85)' : confColor,
            minWidth: 28,
            textAlign: 'right',
          }}
        >
          {dim.confidence}%
        </div>
      </div>
    </button>
  );
}

function DimensionDetail({ dim }: { dim: MarketDimension }) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {dim.title} — our answer
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          margin: '0 0 14px',
          lineHeight: 1.5,
        }}
      >
        {dim.answer}
      </p>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 8,
          borderTop: '1px solid var(--border-color)',
          paddingTop: 12,
        }}
      >
        Sub-questions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dim.subQuestions.map((sq, i) => (
          <div
            key={i}
            style={{
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{sq.q}</div>
            <div style={{ color: 'var(--text-primary)' }}>{sq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
