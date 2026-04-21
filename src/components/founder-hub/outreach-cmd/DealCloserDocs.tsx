'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, Shield, FileSignature } from 'lucide-react';
import { DEAL_CLOSER_DOCS, type DealCloserDoc } from '@/lib/data/outreach';

const DOC_ICON: Record<string, React.ReactNode> = {
  security: <Shield size={14} />,
  design_partner_loi: <FileSignature size={14} />,
};

export function DealCloserDocs() {
  const [activeId, setActiveId] = useState<string>(DEAL_CLOSER_DOCS[0].id);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const active = DEAL_CLOSER_DOCS.find(d => d.id === activeId)!;

  const copyToClipboard = async () => {
    try {
      const text = docToPlainText(active);
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.warn('clipboard copy failed:', err);
      alert('Copy failed. Select the text manually.');
    }
  };

  return (
    <div>
      {/* Doc picker */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {DEAL_CLOSER_DOCS.map(doc => {
          const isActive = doc.id === activeId;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setActiveId(doc.id);
                setCopyState('idle');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? doc.accent : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${doc.accent}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${doc.accent}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <span
                style={{
                  color: isActive ? '#fff' : doc.accent,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {DOC_ICON[doc.id] ?? <FileText size={14} />}
              </span>
              {doc.name}
            </button>
          );
        })}
      </div>

      {/* Active doc detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: 12,
          }}
        >
          {/* Left: metadata + copy */}
          <div
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${active.accent}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignSelf: 'start',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: active.accent, display: 'flex' }}>
                {DOC_ICON[active.id] ?? <FileText size={14} />}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: active.accent,
                }}
              >
                Deal-closer doc
              </span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              {active.name}
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 3,
                }}
              >
                Purpose
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {active.purpose}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 3,
                }}
              >
                When to send
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {active.when}
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: copyState === 'copied' ? '#16A34A' : active.accent,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {copyState === 'copied' ? <Check size={12} /> : <Copy size={12} />}
              {copyState === 'copied' ? 'Copied' : 'Copy full doc'}
            </button>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Use copied text to regenerate your PDF or paste into email.
            </div>
          </div>

          {/* Right: rendered doc */}
          <div
            style={{
              padding: 18,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {active.sections.map((s, i) => (
              <div
                key={s.heading}
                style={{
                  marginBottom: i === active.sections.length - 1 ? 0 : 14,
                  paddingBottom: i === active.sections.length - 1 ? 0 : 14,
                  borderBottom:
                    i === active.sections.length - 1 ? 'none' : '1px dashed var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: active.accent,
                    marginBottom: 5,
                  }}
                >
                  {s.heading}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {s.body}
                </div>
              </div>
            ))}
            {active.footer && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-color)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                {active.footer}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function docToPlainText(doc: DealCloserDoc): string {
  const parts = [`# ${doc.name}`, ''];
  doc.sections.forEach(s => {
    parts.push(`## ${s.heading}`);
    parts.push(s.body);
    parts.push('');
  });
  if (doc.footer) {
    parts.push('---');
    parts.push(doc.footer);
  }
  return parts.join('\n');
}
