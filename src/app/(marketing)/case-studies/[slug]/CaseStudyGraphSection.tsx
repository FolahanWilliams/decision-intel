'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBiasName } from '@/lib/utils/labels';
import type { CaseStudyNodeData } from '@/components/marketing/CaseStudyBiasGraph3DCanvas';

const CaseStudyBiasGraph3D = dynamic(
  () => import('@/components/marketing/CaseStudyBiasGraph3DCanvas'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060d1a',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px solid #1E3A5F',
            borderTopColor: '#60A5FA',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    ),
  },
);

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

interface Props {
  biases: string[];
  primaryBias: string;
  toxicCombinations: string[];
  company: string;
}

export function CaseStudyGraphSection({ biases, primaryBias, toxicCombinations, company }: Props) {
  const [selectedData, setSelectedData] = useState<CaseStudyNodeData | null>(null);

  const handleNodeSelect = useCallback((data: CaseStudyNodeData | null) => {
    setSelectedData(data);
  }, []);

  if (biases.length < 2) return null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '14px 16px 12px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#16A34A',
              marginBottom: 3,
            }}
          >
            3D Decision Knowledge Graph
          </div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.4 }}>
            {company} &mdash;{' '}
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {biases.length} biases
              {toxicCombinations.length > 0 && (
                <>, <span style={{ color: '#DC2626' }}>{toxicCombinations.length} toxic combination{toxicCombinations.length !== 1 ? 's' : ''}</span></>
              )}
            </span>
          </div>
        </div>

        {/* 3D Canvas */}
        <div style={{ height: 420, position: 'relative' }}>
          <CaseStudyBiasGraph3D
            biases={biases}
            primaryBias={primaryBias}
            toxicCombinations={toxicCombinations}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Drag to rotate · Scroll to zoom · Click to explore
          </span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <LegendDot color="#60A5FA" label="Decision" />
            <LegendDot color="#EF4444" label="Critical" />
            <LegendDot color="#F97316" label="High" />
            <LegendDot color="#EAB308" label="Medium" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 18, height: 2, background: '#DC2626', borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Toxic</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedData?.type === 'bias' && selectedData.biasKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', overflow: 'hidden' }}
            >
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: SEVERITY_COLORS[selectedData.severity ?? 'medium'],
                      background: (SEVERITY_COLORS[selectedData.severity ?? 'medium']) + '18',
                      padding: '2px 7px',
                      borderRadius: 4,
                    }}
                  >
                    {selectedData.severity}
                    {selectedData.isPrimary ? ' · Primary' : ''}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {formatBiasName(selectedData.biasKey)}
                  </span>
                </div>
                {selectedData.toxicCombos && selectedData.toxicCombos.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedData.toxicCombos.map(tc => (
                      <span
                        key={tc}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#FEE2E2',
                          color: '#991B1B',
                          border: '1px solid #FECACA',
                        }}
                      >
                        {tc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
    </div>
  );
}
