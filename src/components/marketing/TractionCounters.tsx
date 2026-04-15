'use client';

import { motion } from 'framer-motion';

export function TractionCounters() {
  const metrics = [
    {
      value: '25%',
      label: 'Decision Noise',
      citation: 'KAHNEMAN',
      color: '#EF4444', // Red (Problem)
    },
    {
      value: '72%',
      label: 'Cognitive Bias',
      citation: 'MCKINSEY',
      color: '#F59E0B', // Amber (Problem)
    },
    {
      value: '94.2%',
      label: 'Risk Detection',
      citation: 'BENCHMARK',
      color: '#16A34A', // Green (Solution)
    },
    {
      value: '18.5pt',
      label: 'DQI Recovery',
      citation: 'AVG. UPLIFT',
      color: '#8B5CF6', // Purple (Solution)
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(8px)',
          border: `1px solid var(--border-color)`,
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: 'var(--border-color)' }}>
          {metrics.map((m, _idx) => (
            <div
              key={m.label}
              className="px-8 py-10 flex flex-col items-center justify-center text-center transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {m.value}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-secondary)' }}>
                  {m.label}
                </span>
                <span className="text-[8.5px] font-extrabold uppercase tracking-[0.15em] mt-1" style={{ color: 'var(--text-muted)' }}>
                  ({m.citation})
                </span>
              </div>
              {/* Subtle accent dot */}
              <div className="mt-4 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--border-color)' }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          Audited Intelligence & Behavioral Benchmarks
        </p>
      </div>
    </div>
  );
}
