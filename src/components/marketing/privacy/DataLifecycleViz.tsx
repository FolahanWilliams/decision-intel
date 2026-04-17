'use client';

/**
 * DataLifecycleViz
 *
 * Hero companion for /privacy. Shows the four-stage journey a document
 * takes through our pipeline: Upload (TLS) → Anonymize (GDPR, PII stripped)
 * → Analyze (inside your tenant) → Vault (AES-256-GCM at rest). An
 * animated "packet" travels through the stages on a loop so the viz
 * communicates motion without demanding attention.
 *
 * Companion to OutcomeDetectionViz + PipelineLandingTeaser — same light
 * theme, same Framer Motion grammar, same useReducedMotion hook.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, ShieldCheck, Cpu, Lock, type LucideIcon } from 'lucide-react';
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
  violet: '#7C3AED',
};

type Stage = {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
};

const STAGES: Stage[] = [
  { id: 'upload', label: 'Upload', sub: 'TLS 1.2+', icon: UploadCloud },
  { id: 'anonymize', label: 'Anonymize', sub: 'PII stripped', icon: ShieldCheck },
  { id: 'analyze', label: 'Analyze', sub: 'in-tenant', icon: Cpu },
  { id: 'vault', label: 'Vault', sub: 'AES-256-GCM', icon: Lock },
];

export function DataLifecycleViz() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(reducedMotion ? STAGES.length - 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % STAGES.length;
      setActive(i);
    }, 1500);
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 4,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            Data lifecycle
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: C.slate900,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            PII is stripped before any LLM sees your memo.
          </div>
        </div>
        {!reducedMotion && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              background: C.greenSoft,
              border: `1px solid ${C.greenBorder}`,
              color: C.green,
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: C.green,
              }}
              aria-hidden
            />
            encrypted
          </motion.div>
        )}
      </div>

      {/* Stage row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          position: 'relative',
        }}
      >
        {/* Connecting line behind chips */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 22,
            left: '12%',
            right: '12%',
            height: 2,
            background: C.slate200,
            zIndex: 0,
            borderRadius: 1,
          }}
        />
        {!reducedMotion && (
          <motion.div
            aria-hidden
            animate={{
              width: `${((effectiveActive + 1) / STAGES.length) * 76}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 22,
              left: '12%',
              height: 2,
              background: C.green,
              zIndex: 1,
              borderRadius: 1,
            }}
          />
        )}

        {STAGES.map((s, i) => {
          const isActive = i === effectiveActive;
          const isPast = i < effectiveActive;
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                zIndex: 2,
              }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.06 : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isActive || isPast ? C.green : C.white,
                  border: `1.5px solid ${isActive || isPast ? C.green : C.slate200}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'background 0.35s, border-color 0.35s',
                }}
              >
                <Icon size={18} color={isActive || isPast ? C.white : C.slate500} strokeWidth={2} />
                {isActive && !reducedMotion && (
                  <motion.span
                    aria-hidden
                    animate={{ opacity: [0, 1, 0], scale: [0.9, 1.25, 1.5] }}
                    transition={{ duration: 1.3, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: 14,
                      border: `1.5px solid ${C.green}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </motion.div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? C.slate900 : C.slate600,
                  textAlign: 'center',
                  transition: 'color 0.35s',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: C.slate400,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                }}
              >
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer strip */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11.5,
          color: C.slate600,
          lineHeight: 1.45,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.green,
            flexShrink: 0,
          }}
        >
          <Lock size={11} strokeWidth={2.6} />
        </div>
        <span>
          <span style={{ color: C.slate900, fontWeight: 600 }}>Your tenant only.</span> Nothing
          crosses org boundaries. Nothing trains upstream models.
        </span>
      </div>
    </div>
  );
}
