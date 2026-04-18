'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, TrendingUp } from 'lucide-react';
import { TARGET_INDUSTRIES, type TargetIndustry } from '@/lib/data/outreach';

const FIT_LABEL: Record<TargetIndustry['fit'], string> = {
  core: 'Core ICP',
  strong: 'Strong fit',
  bridge: 'Bridge / secondary',
};

export function TargetIndustryAtlas() {
  const [activeId, setActiveId] = useState<string>(TARGET_INDUSTRIES[0].id);
  const active = TARGET_INDUSTRIES.find(i => i.id === activeId)!;

  return (
    <div>
      {/* Industry tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 12,
        }}
      >
        {TARGET_INDUSTRIES.map(ind => {
          const isActive = ind.id === activeId;
          return (
            <button
              key={ind.id}
              onClick={() => setActiveId(ind.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? ind.accent : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${ind.accent}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${ind.accent}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <Building2 size={12} />
              {ind.name}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: isActive ? 'rgba(255,255,255,0.2)' : `${ind.accent}18`,
                  color: isActive ? '#fff' : ind.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {FIT_LABEL[ind.fit]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Industry detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${active.accent}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: active.accent,
                }}
              >
                {FIT_LABEL[active.fit]}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '2px 0 4px',
                }}
              >
                {active.name}
              </h3>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                background: `${active.accent}12`,
                border: `1px solid ${active.accent}40`,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                color: active.accent,
              }}
            >
              <TrendingUp size={12} />
              {active.cadence}
            </div>
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 14px',
            }}
          >
            {active.note}
          </p>

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
            Sample companies
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
            }}
          >
            {active.companies.map(c => (
              <span
                key={c}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 20,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
