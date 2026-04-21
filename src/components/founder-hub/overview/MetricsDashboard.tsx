'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, GitBranch, Library, Radio, Cpu, Share2 } from 'lucide-react';
import { PRODUCT_METRICS, type ProductMetric } from '@/lib/data/product-overview';

const ICON: Record<ProductMetric['icon'], React.ReactNode> = {
  biases: <Brain size={14} />,
  pipeline: <GitBranch size={14} />,
  cases: <Library size={14} />,
  outcomes: <Radio size={14} />,
  providers: <Cpu size={14} />,
  touchpoints: <Share2 size={14} />,
};

export function MetricsDashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}
    >
      {PRODUCT_METRICS.map((metric, i) => (
        <MetricCard key={metric.label} metric={metric} delay={0.04 * i} />
      ))}
    </div>
  );
}

function MetricCard({ metric, delay }: { metric: ProductMetric; delay: number }) {
  const numeric = Number(metric.value);
  const isCountable = !Number.isNaN(numeric);
  const [display, setDisplay] = useState<number>(isCountable ? 0 : 0);

  useEffect(() => {
    if (!isCountable) return;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * numeric));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isCountable, numeric]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{
        position: 'relative',
        padding: 14,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 70,
          height: 70,
          background: `radial-gradient(circle at top right, ${metric.accent}20, transparent 70%)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          position: 'relative',
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: `${metric.accent}18`,
            color: metric.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ICON[metric.icon]}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: metric.accent,
          }}
        >
          {metric.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isCountable ? display : metric.value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginTop: 8,
          lineHeight: 1.4,
        }}
      >
        {metric.sub}
      </div>
    </motion.div>
  );
}
