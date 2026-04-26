'use client';

/**
 * SecurityLifecycleStrip — dynamic strip that sits above the CredibilityTrio
 * cards inside beat 06 (Security + Governance). A single memo packet flows
 * left-to-right across four stages: Upload → Anonymize → Analyze → Delete.
 * Each stage has a small badge that anchors the guarantee in concrete
 * language (AES-256-GCM, no PII, no training, retention ≤ 30d).
 *
 * Dark-theme component — lives on the navy security beat.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldOff, Cpu, Trash2 } from 'lucide-react';

const C = {
  white: '#FFFFFF',
  navy: '#0F172A',
  navyLight: '#1E293B',
  navyBorder: 'rgba(255,255,255,0.08)',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  green: '#16A34A',
  greenGlow: 'rgba(22,163,74,0.35)',
};

type Stage = {
  key: string;
  label: string;
  badge: string;
  sub: string;
  Icon: typeof FileText;
};

const STAGES: Stage[] = [
  {
    key: 'upload',
    label: 'Upload',
    badge: 'TLS 1.2+',
    sub: 'Encrypted in transit',
    Icon: FileText,
  },
  {
    key: 'anon',
    label: 'Anonymize',
    badge: 'No PII',
    sub: 'Stripped before models',
    Icon: ShieldOff,
  },
  {
    key: 'analyze',
    label: 'Analyze',
    badge: 'No training',
    sub: 'By contract, not promise',
    Icon: Cpu,
  },
  {
    key: 'delete',
    label: 'Delete',
    badge: 'AES-256-GCM',
    sub: 'At rest, key-rotated',
    Icon: Trash2,
  },
];

export function SecurityLifecycleStrip() {
  // Drive the packet position via a state machine — starts at stage 0,
  // advances every 2.2s, wraps. Using Framer Motion's animate prop off a
  // state variable gives us a smooth tween between discrete stages.
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStage(s => (s + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        maxWidth: 1160,
        margin: '0 auto',
        padding: '64px 24px 24px',
        position: 'relative',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 28 }}
      >
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: '#86EFAC',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            margin: 0,
            marginBottom: 10,
          }}
        >
          Data lifecycle
        </p>
        <h3
          style={{
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 800,
            color: C.white,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: 0,
            maxWidth: 720,
          }}
        >
          Four stages, four guarantees &mdash; every memo, every time.
        </h3>
      </motion.div>

      {/* Strip */}
      <div
        className="security-strip-track"
        style={{
          background: C.navyLight,
          border: `1px solid ${C.navyBorder}`,
          borderRadius: 16,
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stage rail */}
        <div
          className="security-strip-stages"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
            gap: 8,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {STAGES.map((s, i) => {
            const active = stage === i;
            const past = i < stage;
            return (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'center',
                  transition: 'opacity 0.4s',
                  opacity: active ? 1 : past ? 0.75 : 0.55,
                }}
              >
                {/* Stage disc */}
                <motion.div
                  animate={{
                    scale: active ? 1.08 : 1,
                    boxShadow: active
                      ? `0 0 0 6px ${C.greenGlow}, 0 8px 18px rgba(22,163,74,0.25)`
                      : '0 4px 10px rgba(0,0,0,0.25)',
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    background: active ? C.green : 'rgba(255,255,255,0.08)',
                    border: `1.5px solid ${active ? C.green : 'rgba(255,255,255,0.15)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: active ? C.white : C.slate300,
                  }}
                >
                  <s.Icon size={22} strokeWidth={2} />
                </motion.div>
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: C.white,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: active ? '#86EFAC' : C.slate400,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: 'var(--font-mono, monospace)',
                      marginTop: 4,
                    }}
                  >
                    {s.badge}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate500,
                      marginTop: 2,
                    }}
                  >
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress rail running beneath the discs — the animated line
            that narrates the flow between stages. */}
        <div
          aria-hidden
          className="security-strip-rail"
          style={{
            position: 'absolute',
            top: 55, // aligned with disc centers (28 padding + 27 half-disc)
            left: 32 + 27, // center of first disc
            right: 32 + 27, // center of last disc
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            zIndex: 0,
            borderRadius: 1,
          }}
        >
          <motion.div
            animate={{ width: `${(stage / (STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${C.green} 0%, #86EFAC 100%)`,
              borderRadius: 1,
            }}
          />
          {/* Flowing packet dot */}
          <motion.div
            animate={{ left: `calc(${(stage / (STAGES.length - 1)) * 100}% - 6px)` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: -5,
              width: 12,
              height: 12,
              borderRadius: 6,
              background: C.green,
              boxShadow: `0 0 0 4px ${C.greenGlow}`,
            }}
          />
        </div>

        {/* Micro-footer with the signed-DPA line — anchors the dynamic
            viz to a procurement-language commitment. */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${C.navyBorder}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12.5,
            color: C.slate400,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            Signed DPA on every paid tier &middot; GDPR + EU AI Act mapped &middot; SOC 2 ready
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#86EFAC',
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            Zero retention · zero training
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .security-strip-rail { display: none; }
          .security-strip-stages {
            grid-template-columns: 1fr 1fr !important;
            row-gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
