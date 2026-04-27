'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Phone, Trash2, FileText } from 'lucide-react';
import { GOLDNER_QUESTIONS, PATTERNS, type PatternId } from '@/lib/data/outreach';

const STORAGE_KEY_CALLS = 'outreach-cmd-discovery-calls-v1';

interface DiscoveryCall {
  id: string;
  company: string;
  contactName: string;
  dateISO: string;
  notes: Record<number, string>; // question number → notes
  patterns: PatternId[]; // tagged patterns
  summary: string;
}

function readCalls(): DiscoveryCall[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALLS);
    return raw ? (JSON.parse(raw) as DiscoveryCall[]) : [];
  } catch {
    // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    return [];
  }
}

export function DiscoveryCallCompanion() {
  const [calls, setCalls] = useState<DiscoveryCall[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setCalls(readCalls());
  }, []);

  const save = (next: DiscoveryCall[]) => {
    setCalls(next);
    try {
      localStorage.setItem(STORAGE_KEY_CALLS, JSON.stringify(next));
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  };

  const active = useMemo<DiscoveryCall | null>(
    () => calls.find(c => c.id === activeId) ?? null,
    [calls, activeId]
  );

  const createCall = () => {
    if (!company.trim() || !contactName.trim()) return;
    const now = new Date();
    const c: DiscoveryCall = {
      id: `call-${Date.now()}`,
      company: company.trim(),
      contactName: contactName.trim(),
      dateISO: now.toISOString(),
      notes: {},
      patterns: [],
      summary: '',
    };
    save([c, ...calls]);
    setActiveId(c.id);
    setCompany('');
    setContactName('');
  };

  const updateActive = (patch: Partial<DiscoveryCall>) => {
    if (!active) return;
    const next = calls.map(c => (c.id === active.id ? { ...c, ...patch } : c));
    save(next);
  };

  const updateQuestionNote = (qNum: number, note: string) => {
    if (!active) return;
    const next = { ...active.notes };
    if (!note.trim()) delete next[qNum];
    else next[qNum] = note;
    updateActive({ notes: next });
  };

  const togglePattern = (pId: PatternId) => {
    if (!active) return;
    const next = active.patterns.includes(pId)
      ? active.patterns.filter(p => p !== pId)
      : [...active.patterns, pId];
    updateActive({ patterns: next });
  };

  const deleteCall = (id: string) => {
    save(calls.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 280px) 1fr',
        gap: 14,
      }}
    >
      {/* Left: call list + new call form */}
      <div>
        <div
          style={{
            padding: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            New discovery call
          </div>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Company"
            style={inputStyle()}
          />
          <div style={{ height: 4 }} />
          <input
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Contact name"
            style={inputStyle()}
          />
          <div style={{ height: 6 }} />
          <button
            onClick={createCall}
            disabled={!company.trim() || !contactName.trim()}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: company.trim() && contactName.trim() ? '#16A34A' : 'var(--bg-secondary)',
              color: company.trim() && contactName.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 4,
              cursor: company.trim() && contactName.trim() ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Plus size={12} />
            Start call
          </button>
        </div>

        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 6,
            padding: '0 2px',
          }}
        >
          Calls logged ({calls.length})
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 440,
            overflowY: 'auto',
          }}
        >
          {calls.length === 0 && (
            <div
              style={{
                padding: 12,
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
                borderRadius: 4,
              }}
            >
              No calls yet. Start your first one above.
            </div>
          )}
          {calls.map(c => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  padding: 10,
                  background: isActive ? '#16A34A' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  border: isActive ? '1.5px solid #16A34A' : '1px solid var(--border-color)',
                  borderLeft: isActive ? '3px solid #16A34A' : '3px solid transparent',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.contactName} · {c.company}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {new Date(c.dateISO).toLocaleDateString()} · {c.patterns.length} pattern
                  {c.patterns.length === 1 ? '' : 's'} tagged
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: active call detail */}
      <div>
        {!active ? (
          <div
            style={{
              padding: 24,
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Phone size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                color: 'var(--text-primary)',
              }}
            >
              Pick a call to drive with Goldner&apos;s script.
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              Type notes as they talk. Tag patterns the moment they describe one. After 10 calls,
              the Pattern Validation dashboard surfaces your validated wedge.
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Header */}
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '3px solid #16A34A',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Phone size={16} style={{ color: '#16A34A' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {active.contactName} · {active.company}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(active.dateISO).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteCall(active.id)}
                  style={{
                    padding: 6,
                    background: 'transparent',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  title="Delete this call"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Questions + notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                {GOLDNER_QUESTIONS.map(q => (
                  <QuestionBlock
                    key={q.number}
                    qNum={q.number}
                    question={q.question}
                    probes={q.probes}
                    listenFor={q.listenFor}
                    value={active.notes[q.number] ?? ''}
                    onChange={v => updateQuestionNote(q.number, v)}
                  />
                ))}
              </div>

              {/* Pattern tagging */}
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 10,
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
                  Pattern tagging · tag only what they named unprompted
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 6,
                  }}
                >
                  {PATTERNS.map(p => {
                    const isTagged = active.patterns.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePattern(p.id)}
                        style={{
                          padding: 10,
                          background: isTagged ? p.color : 'var(--bg-secondary)',
                          color: isTagged ? '#fff' : 'var(--text-primary)',
                          border: isTagged
                            ? `1.5px solid ${p.color}`
                            : '1px solid var(--border-color)',
                          borderLeft: `3px solid ${p.color}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: isTagged ? 'rgba(255,255,255,0.85)' : p.color,
                            marginBottom: 2,
                          }}
                        >
                          Pattern {p.id}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>
                          {p.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
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
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <FileText size={11} />
                  One-line summary · write within 10 min of the call
                </div>
                <textarea
                  value={active.summary}
                  onChange={e => updateActive({ summary: e.target.value })}
                  placeholder="Strongest verbatim quote + which pattern + next step..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 12,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.55,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    color: '#16A34A',
                    marginTop: 6,
                    fontStyle: 'italic',
                  }}
                >
                  <Save size={10} />
                  Notes auto-save to this browser as you type.
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function QuestionBlock({
  qNum,
  question,
  probes,
  listenFor,
  value,
  onChange,
}: {
  qNum: number;
  question: string;
  probes: string[];
  listenFor: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showHints, setShowHints] = useState(false);
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid #16A34A',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(22,163,74,0.18)',
              color: '#16A34A',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            Q{qNum}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
            }}
          >
            {question}
          </div>
        </div>
        <button
          onClick={() => setShowHints(!showHints)}
          style={{
            padding: '3px 8px',
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: showHints ? '#fff' : 'var(--text-muted)',
            background: showHints ? '#16A34A' : 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 3,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Hints
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showHints && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: 10,
                background: 'var(--bg-secondary)',
                borderRadius: 4,
                marginBottom: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#16A34A',
                  marginBottom: 3,
                }}
              >
                Probes if they go vague
              </div>
              <ul style={{ margin: '0 0 6px 0', paddingLeft: 16 }}>
                {probes.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#F59E0B',
                  marginBottom: 3,
                  marginTop: 8,
                }}
              >
                Listen for
              </div>
              <div>{listenFor}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Type what they say. Capture exact wording where you can."
        rows={3}
        style={{
          width: '100%',
          padding: 8,
          fontSize: 12,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: 1.5,
        }}
      />
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
  };
}
