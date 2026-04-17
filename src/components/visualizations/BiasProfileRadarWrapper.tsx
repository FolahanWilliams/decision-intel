'use client';

import dynamic from 'next/dynamic';
import type { BiasInstance } from '@/types';

const BiasProfileRadar = dynamic(
  () =>
    import('@/components/visualizations/BiasProfileRadar').then(m => ({
      default: m.BiasProfileRadar,
    })),
  { ssr: false }
);

interface Props {
  biases: BiasInstance[];
}

export function BiasProfileRadarWrapper({ biases }: Props) {
  return <BiasProfileRadar biases={biases} />;
}
