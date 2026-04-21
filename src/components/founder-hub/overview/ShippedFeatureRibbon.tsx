'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import {
  SHIPPED_FEATURES,
  FEATURE_CATEGORY_LABEL,
  FEATURE_CATEGORY_COLOR,
  type ShippedFeature,
} from '@/lib/data/product-overview';

type CategoryFilter = 'all' | ShippedFeature['category'];

export function ShippedFeatureRibbon() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const filtered = useMemo(
    () =>
      filter === 'all' ? SHIPPED_FEATURES : SHIPPED_FEATURES.filter(f => f.category === filter),
    [filter]
  );

  const active = filtered[Math.min(activeIdx, filtered.length - 1)] ?? filtered[0];

  const categoryCounts = useMemo(() => {
    const counts: Record<ShippedFeature['category'], number> = {
      integration: 0,
      pipeline: 0,
      ux: 0,
      intelligence: 0,
      distribution: 0,
    };
    SHIPPED_FEATURES.forEach(f => {
      counts[f.category] += 1;
    });
    return counts;
  }, []);

  return (
    <div>
      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 12,
        }}
      >
        <CategoryPill
          label="All"
          count={SHIPPED_FEATURES.length}
          accent="var(--text-muted)"
          active={filter === 'all'}
          onClick={() => {
            setFilter('all');
            setActiveIdx(0);
          }}
        />
        {(Object.keys(FEATURE_CATEGORY_LABEL) as ShippedFeature['category'][]).map(cat => (
          <CategoryPill
            key={cat}
            label={FEATURE_CATEGORY_LABEL[cat]}
            count={categoryCounts[cat]}
            accent={FEATURE_CATEGORY_COLOR[cat]}
            active={filter === cat}
            onClick={() => {
              setFilter(cat);
              setActiveIdx(0);
            }}
          />
        ))}
      </div>

      {/* Feature ribbon */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 12,
        }}
      >
        {filtered.map((feature, idx) => {
          const color = FEATURE_CATEGORY_COLOR[feature.category];
          const isActive = idx === activeIdx;
          return (
            <motion.button
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.015 }}
              onClick={() => setActiveIdx(idx)}
              style={{
                flex: '0 0 auto',
                width: 170,
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
                {FEATURE_CATEGORY_LABEL[feature.category]}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                {feature.title}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${FEATURE_CATEGORY_COLOR[active.category]}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: `${FEATURE_CATEGORY_COLOR[active.category]}18`,
                color: FEATURE_CATEGORY_COLOR[active.category],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: FEATURE_CATEGORY_COLOR[active.category],
                  marginBottom: 2,
                }}
              >
                {FEATURE_CATEGORY_LABEL[active.category]}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                {active.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {active.detail}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryPill({
  label,
  count,
  accent,
  active,
  onClick,
}: {
  label: string;
  count: number;
  accent: string;
  active: boolean;
  onClick: () => void;
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
