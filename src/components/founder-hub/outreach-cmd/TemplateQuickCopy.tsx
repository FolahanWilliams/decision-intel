'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Mail, Linkedin, MessageCircle, Mic } from 'lucide-react';
import {
  OUTREACH_TEMPLATES,
  TEMPLATE_CHANNEL_LABEL,
  TEMPLATE_CHANNEL_COLOR,
  SEED_TARGETS,
  type OutreachTemplate,
} from '@/lib/data/outreach';

const CHANNEL_ICON: Record<OutreachTemplate['channel'], React.ReactNode> = {
  email: <Mail size={12} />,
  linkedin_connection: <Linkedin size={12} />,
  linkedin_message: <MessageCircle size={12} />,
  verbal: <Mic size={12} />,
};

export function TemplateQuickCopy() {
  const [activeId, setActiveId] = useState<string>(OUTREACH_TEMPLATES[0].id);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [values, setValues] = useState<Record<string, string>>({});
  const [autofillTargetId, setAutofillTargetId] = useState<string>('');

  const active = OUTREACH_TEMPLATES.find(t => t.id === activeId)!;

  const filled = useMemo(() => {
    let body = active.body;
    let subject = active.subject ?? '';
    active.variables.forEach(v => {
      const value = values[v] ?? `{{${v}}}`;
      const re = new RegExp(`{{${v}}}`, 'g');
      body = body.replace(re, value);
      subject = subject.replace(re, value);
    });
    return { body, subject };
  }, [active, values]);

  const applyAutofill = (targetId: string) => {
    setAutofillTargetId(targetId);
    if (!targetId) return;
    const target = SEED_TARGETS.find(t => t.id === targetId);
    if (!target) return;
    setValues({
      FIRST_NAME: values.FIRST_NAME ?? '',
      COMPANY: target.company,
      PERSONALISATION_HOOK: target.personalisationHook,
      DEAL_FREQUENCY: target.dealFrequency,
    });
  };

  const setVariable = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = async () => {
    try {
      const text =
        active.channel === 'email' && filled.subject
          ? `Subject: ${filled.subject}\n\n${filled.body}`
          : filled.body;
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1800);
    } catch (err) {
      console.warn('clipboard copy failed:', err);
      alert('Copy failed. Select the text manually.');
    }
  };

  const hasUnfilled = active.variables.some(v => !values[v]);

  return (
    <div>
      {/* Template pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 12,
        }}
      >
        {OUTREACH_TEMPLATES.map(t => {
          const isActive = t.id === activeId;
          const color = TEMPLATE_CHANNEL_COLOR[t.channel];
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveId(t.id);
                setCopyState('idle');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? color : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${color}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${color}`,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                maxWidth: 300,
                textAlign: 'left',
              }}
            >
              <span
                style={{ color: isActive ? '#fff' : color, display: 'flex', alignItems: 'center' }}
              >
                {CHANNEL_ICON[t.channel]}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 300px) 1fr',
            gap: 12,
          }}
        >
          {/* Left: metadata + variables */}
          <div>
            <div
              style={{
                padding: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${TEMPLATE_CHANNEL_COLOR[active.channel]}`,
                borderRadius: 'var(--radius-md)',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: TEMPLATE_CHANNEL_COLOR[active.channel] }}>
                  {CHANNEL_ICON[active.channel]}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: TEMPLATE_CHANNEL_COLOR[active.channel],
                  }}
                >
                  {TEMPLATE_CHANNEL_LABEL[active.channel]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                  lineHeight: 1.3,
                }}
              >
                {active.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>When:</strong> {active.when}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Tone:</strong> {active.tone}
              </div>
            </div>

            {active.variables.length > 0 && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  Fill in variables
                </div>

                {/* Autofill from target */}
                {active.variables.some(v =>
                  ['COMPANY', 'PERSONALISATION_HOOK', 'DEAL_FREQUENCY'].includes(v)
                ) && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-muted)',
                        marginBottom: 3,
                      }}
                    >
                      Quick-fill from target
                    </div>
                    <select
                      value={autofillTargetId}
                      onChange={e => applyAutofill(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: 11,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                      }}
                    >
                      <option value="">— Pick a target to auto-fill —</option>
                      {SEED_TARGETS.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.company}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {active.variables.map(v => (
                    <div key={v}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-muted)',
                          marginBottom: 3,
                        }}
                      >
                        {v.replace(/_/g, ' ').toLowerCase()}
                      </div>
                      {v === 'PERSONALISATION_HOOK' ? (
                        <textarea
                          value={values[v] ?? ''}
                          onChange={e => setVariable(v, e.target.value)}
                          rows={3}
                          style={inputStyle()}
                          placeholder={`{{${v}}}`}
                        />
                      ) : (
                        <input
                          value={values[v] ?? ''}
                          onChange={e => setVariable(v, e.target.value)}
                          placeholder={`{{${v}}}`}
                          style={inputStyle()}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: filled preview + copy */}
          <div
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Preview · copy-ready
              </div>
              <button
                onClick={copyToClipboard}
                disabled={hasUnfilled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  background:
                    copyState === 'copied'
                      ? '#16A34A'
                      : hasUnfilled
                        ? 'var(--bg-secondary)'
                        : '#0EA5E9',
                  color: hasUnfilled && copyState !== 'copied' ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: hasUnfilled ? 'not-allowed' : 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {copyState === 'copied' ? <Check size={12} /> : <Copy size={12} />}
                {copyState === 'copied' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {active.subject && (
              <div
                style={{
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                  }}
                >
                  Subject
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {filled.subject}
                </div>
              </div>
            )}

            <pre
              style={{
                flex: 1,
                padding: 12,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                fontFamily: 'inherit',
                fontSize: 13,
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                minHeight: 200,
              }}
            >
              {filled.body}
            </pre>

            {hasUnfilled && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: '#F59E0B',
                  fontStyle: 'italic',
                }}
              >
                Fill in {active.variables.filter(v => !values[v]).length} variable
                {active.variables.filter(v => !values[v]).length === 1 ? '' : 's'} to enable copy.
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 10px',
    fontSize: 12,
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 4,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  };
}
