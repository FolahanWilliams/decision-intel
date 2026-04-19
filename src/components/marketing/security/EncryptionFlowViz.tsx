'use client';

/**
 * EncryptionFlowViz
 *
 * Hero companion for /security. Shows the end-to-end encryption chain
 * every strategic memo travels through: browser (TLS) → API edge (auth)
 * → GDPR anonymizer (PII stripped) → pipeline (in-tenant) → AES-256-GCM
 * vault (with keyVersion stamp). An animated pulse moves through the
 * chain on a loop so the page communicates motion without pulling focus.
 *
 * Companion to DataLifecycleViz (/privacy) — same light palette, same
 * Framer Motion grammar, same prefers-reduced-motion hook so the two
 * pages feel like a single product.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  KeyRound,
  Lock,
  ShieldCheck,
  Cpu,
  Database,
  type LucideIcon,
} from 'lucide-react';
import { useReducedMotion } from '@/components/marketing/how-it-works/useReducedMotion';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
};

interface Stage {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
}

const STAGES: Stage[] = [
  { id: 'browser', label: 'Browser', sub: 'TLS 1.2+', icon: Globe },
  { id: 'edge', label: 'API edge', sub: 'session auth', icon: ShieldCheck },
  { id: 'anonymize', label: 'Anonymize', sub: 'PII stripped', icon: KeyRound },
  { id: 'pipeline', label: 'Pipeline', sub: 'in-tenant', icon: Cpu },
  { id: 'vault', label: 'Vault', sub: 'AES-256-GCM', icon: Lock },
  { id: 'db', label: 'Postgres', sub: `keyVersion stamp`, icon: Database },
];

export function EncryptionFlowViz() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(reducedMotion ? STAGES.length - 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % STAGES.length;
      setActive(i);
    }, 1400);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const effectiveActive = reducedMotion ? STAGES.length - 1 : active;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        padding: '26px 24px 22px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      <style>{`
        @media (max-width: 419px) {
          .encryption-flow-stage-label { font-size: 10px !important; }
          .encryption-flow-stage-sub { font-size: 9px !important; }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={14} color={C.green} strokeWidth={2.25} />
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.green,
            }}
          >
            Encryption chain
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.slate900,
              marginTop: 1,
            }}
          >
            Browser to vault, end-to-end
          </div>
        </div>
      </div>

      {/* Rail */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 10,
          minHeight: 88,
        }}
      >
        {/* Connecting line underneath */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 28,
            height: 2,
            background: C.slate200,
            borderRadius: 2,
          }}
          aria-hidden
        />

        {STAGES.map((stage, i) => {
          const isActive = i === effectiveActive;
          const isPast = i < effectiveActive;
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <motion.div
                animate={
                  isActive
                    ? {
                        scale: 1.08,
                        boxShadow: `0 0 0 6px ${C.greenSoft}`,
                      }
                    : { scale: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
                }
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isActive || isPast ? C.green : C.white,
                  border: `1.5px solid ${isActive || isPast ? C.green : C.slate300}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <Icon
                  size={18}
                  color={isActive || isPast ? C.white : C.slate500}
                  strokeWidth={2.25}
                />
              </motion.div>
              <div
                className="encryption-flow-stage-label"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? C.green : C.slate900,
                  textAlign: 'center',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {stage.label}
              </div>
              <div
                className="encryption-flow-stage-sub"
                style={{
                  fontSize: 9.5,
                  color: C.slate500,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  fontFamily:
                    stage.sub === 'AES-256-GCM' || stage.sub === 'keyVersion stamp'
                      ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
                      : undefined,
                }}
              >
                {stage.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Caption */}
      <div
        style={{
          fontSize: 11,
          color: C.slate500,
          lineHeight: 1.55,
          borderTop: `1px solid ${C.slate100}`,
          paddingTop: 12,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        Every row in the encrypted columns carries a <code
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: 10.5,
            color: C.slate700,
          }}
        >keyVersion</code> stamp so keys can be rotated without bricking historical data.
      </div>
    </div>
  );
}
