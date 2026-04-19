'use client';

import { motion } from 'framer-motion';
import type { LessonViz } from '@/lib/data/founder-school/visualizations';
import {
  ChainVizRender,
  QuadrantsVizRender,
  FlywheelVizRender,
  WeightBarsVizRender,
  FunnelVizRender,
  SwimlanesVizRender,
  TimelineVizRender,
  PyramidVizRender,
  CompoundVizRender,
  RadialNetworkVizRender,
  StepperVizRender,
  MatrixVizRender,
} from './viz-primitives';

interface Props {
  viz: LessonViz;
  accent: string;
}

export function LessonVisualization({ viz, accent }: Props) {
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const body = (() => {
    switch (viz.type) {
      case 'chain':
        return <ChainVizRender viz={viz} accent={accent} />;
      case 'quadrants':
        return <QuadrantsVizRender viz={viz} accent={accent} />;
      case 'flywheel':
        return <FlywheelVizRender viz={viz} accent={accent} />;
      case 'weightBars':
        return <WeightBarsVizRender viz={viz} accent={accent} />;
      case 'funnel':
        return <FunnelVizRender viz={viz} accent={accent} />;
      case 'swimlanes':
        return <SwimlanesVizRender viz={viz} accent={accent} />;
      case 'timeline':
        return <TimelineVizRender viz={viz} accent={accent} />;
      case 'pyramid':
        return <PyramidVizRender viz={viz} accent={accent} />;
      case 'compound':
        return <CompoundVizRender viz={viz} accent={accent} />;
      case 'radialNetwork':
        return <RadialNetworkVizRender viz={viz} accent={accent} />;
      case 'stepper':
        return <StepperVizRender viz={viz} accent={accent} />;
      case 'matrix':
        return <MatrixVizRender viz={viz} accent={accent} />;
    }
  })();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${accent}22`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        marginBottom: 18,
      }}
    >
      {viz.caption && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: accent,
            marginBottom: 10,
          }}
        >
          {viz.caption}
        </div>
      )}
      {body}
    </motion.div>
  );
}
