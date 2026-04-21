'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Flame, MessageSquare, Key, Star, ShieldOff } from 'lucide-react';
import {
  BUYER_PERSONAS,
  PERSONA_TIER_LABEL,
  PERSONA_TIER_COLOR,
  type BuyerPersona,
  type PersonaTier,
} from '@/lib/data/outreach';

const TIER_ORDER: PersonaTier[] = ['primary', 'adjacent', 'anti_pattern'];

export function BuyerPersonaMap() {
  const [expandedId, setExpandedId] = useState<string | null>(BUYER_PERSONAS[0].id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {TIER_ORDER.map(tier => {
        const personas = BUYER_PERSONAS.filter(p => p.tier === tier);
        if (personas.length === 0) return null;
        const color = PERSONA_TIER_COLOR[tier];
        return (
          <div key={tier}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: color,
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color,
                }}
              >
                {PERSONA_TIER_LABEL[tier]}
              </div>
              {tier === 'anti_pattern' && <ShieldOff size={12} style={{ color, marginLeft: -4 }} />}
              {tier === 'primary' && <Star size={12} style={{ color, marginLeft: -4 }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {personas.map(p => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  isExpanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonaCard({
  persona,
  isExpanded,
  onToggle,
}: {
  persona: BuyerPersona;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = PERSONA_TIER_COLOR[persona.tier];
  const isAnti = persona.tier === 'anti_pattern';

  return (
    <motion.div
      layout
      transition={{ duration: 0.18 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isExpanded ? color : 'var(--border-color)'}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        opacity: isAnti && !isExpanded ? 0.75 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isAnti ? <ShieldOff size={14} /> : <User size={14} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
            }}
          >
            {persona.title}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {persona.titleVariants.join(' · ')}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color,
            padding: '3px 8px',
            background: `${color}12`,
            border: `1px solid ${color}30`,
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          {isExpanded ? 'Collapse' : 'Open'}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '4px 14px 14px 56px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {isAnti && persona.antiReason && (
                <div
                  style={{
                    padding: 10,
                    background: `${color}10`,
                    border: `1px solid ${color}40`,
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <ShieldOff size={12} style={{ color, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong style={{ color }}>Why NOT to start here:</strong> {persona.antiReason}
                  </div>
                </div>
              )}

              <PersonaDetailRow
                icon={<Flame size={12} />}
                label="Their pain"
                accent={color}
                body={persona.pain}
              />
              <PersonaDetailRow
                icon={<MessageSquare size={12} />}
                label="Language they use (mirror this)"
                accent={color}
                body={persona.language}
                mono
              />
              <PersonaDetailRow
                icon={<Key size={12} />}
                label="Budget / decision authority"
                accent={color}
                body={persona.authority}
              />
              <PersonaDetailRow
                icon={<MapPin size={12} />}
                label="Where to find them"
                accent={color}
                body={persona.whereToFind}
              />
              {persona.warmIntroPath && (
                <PersonaDetailRow
                  icon={<Star size={12} />}
                  label={isAnti ? 'If you still engage' : 'Warmest intro path'}
                  accent={color}
                  body={persona.warmIntroPath}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PersonaDetailRow({
  icon,
  label,
  accent,
  body,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: accent,
          marginBottom: 3,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          fontFamily: mono ? 'ui-monospace, Menlo, monospace' : 'inherit',
        }}
      >
        {body}
      </div>
    </div>
  );
}
