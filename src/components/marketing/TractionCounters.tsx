'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BarChart3, Shield, Target, TrendingUp } from 'lucide-react';

interface CounterProps {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
}

function AnimatedCounter({ value, suffix = '', label, icon }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return Math.round(v).toLocaleString();
  });

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, count, value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 px-4 py-3">
      <div className="text-blue-400/80">{icon}</div>
      <div className="flex items-baseline gap-1">
        <motion.span className="text-3xl font-bold text-white tabular-nums">
          {rounded}
        </motion.span>
        {suffix && <span className="text-lg text-zinc-400">{suffix}</span>}
      </div>
      <span className="text-sm text-zinc-500 text-center">{label}</span>
    </div>
  );
}

interface TractionData {
  totalAnalyses: number;
  totalBiasesDetected: number;
  totalOutcomes: number;
  biasDetectionAccuracy: number;
  isRealData: boolean;
}

export function TractionCounters() {
  const [data, setData] = useState<TractionData | null>(null);

  useEffect(() => {
    fetch('/api/public/outcome-stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null);
  }, []);

  if (!data) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-lg p-4">
        <AnimatedCounter
          value={data.totalAnalyses}
          label="Analyses Run"
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <AnimatedCounter
          value={data.totalBiasesDetected}
          label="Biases Detected"
          icon={<Shield className="w-5 h-5" />}
        />
        <AnimatedCounter
          value={data.totalOutcomes}
          label="Outcomes Tracked"
          icon={<Target className="w-5 h-5" />}
        />
        <AnimatedCounter
          value={Math.round(data.biasDetectionAccuracy * 100)}
          suffix="%"
          label="Detection Accuracy"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>
      <p className="text-xs text-zinc-600 text-center mt-2">
        {data.isRealData ? 'Live platform data' : 'Research baseline — updated as platform data grows'}
      </p>
    </div>
  );
}
