'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PIPELINE_NODES, ZONES, type PipelineZone } from '@/lib/data/pipeline-nodes';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  violet: '#7C3AED',
  violetLight: 'rgba(124, 58, 237, 0.08)',
};

const ZONE_ACCENT: Record<PipelineZone, string> = {
  preprocessing: C.violet,
  analysis: C.green,
  synthesis: C.slate900,
};

interface PipelineNodeDetailProps {
  nodeId: string | null;
  onClose: () => void;
}

export function PipelineNodeDetail({ nodeId, onClose }: PipelineNodeDetailProps) {
  const node = nodeId ? PIPELINE_NODES.find(n => n.id === nodeId) : null;

  return (
    <AnimatePresence initial={false}>
      {node && (
        <motion.div
          key={node.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div
            style={{
              marginTop: 12,
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '22px 24px',
              position: 'relative',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close node detail"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: C.slate100,
                border: 'none',
                borderRadius: 999,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: C.slate500,
              }}
            >
              <X size={14} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: ZONE_ACCENT[node.zone],
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: `${ZONE_ACCENT[node.zone]}18`,
                }}
              >
                {ZONES[node.zone].label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: C.slate400,
                }}
              >
                node: {node.id}
              </span>
            </div>

            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: C.slate900,
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: 14,
                paddingRight: 32,
              }}
            >
              {node.label}
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 18,
              }}
              className="pipeline-node-detail-grid"
            >
              <DetailField label="What it does" body={node.purpose} />
              <DetailField label="What it produces" body={node.output} mono />
              <DetailField label="Academic anchor" body={node.academicAnchor} italic />
            </div>

            <style>{`
              @media (max-width: 720px) {
                .pipeline-node-detail-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailField({
  label,
  body,
  mono,
  italic,
}: {
  label: string;
  body: string;
  mono?: boolean;
  italic?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <p
        style={{
          fontSize: 13.5,
          color: C.slate600,
          lineHeight: 1.6,
          margin: 0,
          fontFamily: mono ? 'var(--font-mono, monospace)' : 'inherit',
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {body}
      </p>
    </div>
  );
}
