'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { PROBLEM_STATEMENTS, type ProblemStatement } from '@/lib/data/product-overview';

const SEVERITY_COLOR: Record<ProblemStatement['severity'], string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
};

const SEVERITY_LABEL: Record<ProblemStatement['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
};

export function ProblemConstellation() {
  const [openId, setOpenId] = useState<string | null>(PROBLEM_STATEMENTS[0].id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {PROBLEM_STATEMENTS.map(p => (
        <ProblemRow
          key={p.id}
          problem={p}
          isOpen={openId === p.id}
          onToggle={() => setOpenId(openId === p.id ? null : p.id)}
        />
      ))}
    </div>
  );
}

function ProblemRow({
  problem,
  isOpen,
  onToggle,
}: {
  problem: ProblemStatement;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const color = SEVERITY_COLOR[problem.severity];
  return (
    <motion.div
      layout
      transition={{ duration: 0.18 }}
      onClick={onToggle}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-color)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        padding: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: `${color}18`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color,
                background: `${color}15`,
                border: `1px solid ${color}30`,
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              {SEVERITY_LABEL[problem.severity]}
            </span>
            {problem.citation && (
              <span
                style={{
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                }}
              >
                — {problem.citation}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.45,
            }}
          >
            {problem.headline}
          </div>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-color)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {problem.detail}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
