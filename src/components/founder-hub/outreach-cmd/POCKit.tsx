'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Briefcase } from 'lucide-react';
import { POC_MILESTONES, POC_SUCCESS_CRITERIA } from '@/lib/data/outreach';

const STORAGE_KEY = 'outreach-cmd-pocs-v1';

interface POCRecord {
  id: string;
  company: string;
  startDate: string; // ISO date
  deliverableChecks: Record<string, boolean>; // `${weekNum}::${deliverable}` → bool
  criteria: Record<string, { met: boolean; note: string }>; // criterion id → state
  nps?: number;
  wouldPay?: 'yes' | 'maybe' | 'no' | null;
  quote?: string;
}

function readPOCs(): POCRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as POCRecord[]) : [];
  } catch {
    // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    return [];
  }
}

function weeksSince(startISO: string): number {
  const start = new Date(startISO);
  const now = new Date();
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.min(6, Math.floor(diffDays / 7) + 1));
}

export function POCKit() {
  const [pocs, setPocs] = useState<POCRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setPocs(readPOCs());
  }, []);

  const save = (next: POCRecord[]) => {
    setPocs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  };

  const active = useMemo<POCRecord | null>(
    () => pocs.find(p => p.id === activeId) ?? null,
    [pocs, activeId]
  );
  const currentWeek = active ? weeksSince(active.startDate) : 1;

  const createPOC = () => {
    if (!newCompany.trim()) return;
    const poc: POCRecord = {
      id: `poc-${Date.now()}`,
      company: newCompany.trim(),
      startDate: new Date().toISOString(),
      deliverableChecks: {},
      criteria: {},
      wouldPay: null,
    };
    save([poc, ...pocs]);
    setActiveId(poc.id);
    setNewCompany('');
  };

  const updateActive = (patch: Partial<POCRecord>) => {
    if (!active) return;
    save(pocs.map(p => (p.id === active.id ? { ...p, ...patch } : p)));
  };

  const toggleDeliverable = (weekNum: number, d: string) => {
    if (!active) return;
    const key = `${weekNum}::${d}`;
    updateActive({
      deliverableChecks: { ...active.deliverableChecks, [key]: !active.deliverableChecks[key] },
    });
  };

  const updateCriterion = (id: string, patch: { met?: boolean; note?: string }) => {
    if (!active) return;
    const existing = active.criteria[id] ?? { met: false, note: '' };
    updateActive({
      criteria: { ...active.criteria, [id]: { ...existing, ...patch } },
    });
  };

  const deletePOC = (id: string) => {
    save(pocs.filter(p => p.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const overallProgress = (poc: POCRecord): number => {
    const total = POC_MILESTONES.reduce((acc, m) => acc + m.deliverables.length, 0);
    if (total === 0) return 0;
    const done = Object.values(poc.deliverableChecks).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 280px) 1fr',
        gap: 14,
      }}
    >
      {/* Left: POC list + new POC form */}
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
            Start a new POC
          </div>
          <input
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            placeholder="Company name"
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: 12,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
            }}
          />
          <div style={{ height: 6 }} />
          <button
            onClick={createPOC}
            disabled={!newCompany.trim()}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: newCompany.trim() ? '#F59E0B' : 'var(--bg-secondary)',
              color: newCompany.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 4,
              cursor: newCompany.trim() ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Plus size={12} />
            Kick off POC
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
          Active POCs ({pocs.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pocs.length === 0 && (
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
              No POCs yet. Target: 3–5 POCs by end of Week 2.
            </div>
          )}
          {pocs.map(p => {
            const isActive = p.id === activeId;
            const pct = overallProgress(p);
            const wk = weeksSince(p.startDate);
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                style={{
                  padding: 10,
                  background: isActive ? '#F59E0B' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  border: isActive ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
                  borderLeft: '3px solid #F59E0B',
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
                  {p.company}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  Week {wk} of 6 · {pct}% complete
                </div>
                <div
                  style={{
                    marginTop: 4,
                    height: 3,
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isActive ? '#fff' : '#F59E0B',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: active POC detail */}
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
            <Briefcase size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                color: 'var(--text-primary)',
              }}
            >
              Kick off your first POC.
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              Each POC unlocks a 6-week milestone tracker, success criteria scoring, and the Week 5
              evaluation capture.
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
                  borderLeft: '3px solid #F59E0B',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Briefcase size={16} style={{ color: '#F59E0B' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {active.company}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Started {new Date(active.startDate).toLocaleDateString()} · currently in Week{' '}
                    {currentWeek}
                  </div>
                </div>
                <button
                  onClick={() => deletePOC(active.id)}
                  style={{
                    padding: 6,
                    background: 'transparent',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  title="Delete POC"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Milestones */}
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
                  6-Week milestones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {POC_MILESTONES.map(m => {
                    const isCurrent = m.week === currentWeek;
                    return (
                      <div
                        key={m.week}
                        style={{
                          padding: 10,
                          background: isCurrent
                            ? 'rgba(245, 158, 11, 0.08)'
                            : 'var(--bg-secondary)',
                          border: isCurrent
                            ? '1px solid rgba(245, 158, 11, 0.35)'
                            : '1px solid var(--border-color)',
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: isCurrent ? '#F59E0B' : 'var(--text-primary)',
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          Week {m.week} · {m.label}
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 8,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                padding: '2px 6px',
                                borderRadius: 3,
                                background: '#F59E0B',
                                color: '#fff',
                              }}
                            >
                              NOW
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {m.deliverables.map(d => {
                            const key = `${m.week}::${d}`;
                            const done = !!active.deliverableChecks[key];
                            return (
                              <button
                                key={key}
                                onClick={() => toggleDeliverable(m.week, d)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 6,
                                  padding: '5px 8px',
                                  background: done ? 'rgba(22,163,74,0.06)' : 'transparent',
                                  border: done
                                    ? '1px solid rgba(22,163,74,0.25)'
                                    : '1px solid transparent',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: 11,
                                  color: 'var(--text-primary)',
                                  lineHeight: 1.5,
                                }}
                              >
                                <span
                                  style={{
                                    color: done ? '#16A34A' : 'var(--text-muted)',
                                    marginTop: 1,
                                    flexShrink: 0,
                                  }}
                                >
                                  {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                </span>
                                <span
                                  style={{
                                    textDecoration: done ? 'line-through' : 'none',
                                    color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                                  }}
                                >
                                  {d}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Success criteria */}
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
                  Success criteria (answered on Week 5)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {POC_SUCCESS_CRITERIA.map(c => {
                    const state = active.criteria[c.id] ?? { met: false, note: '' };
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: 10,
                          background: state.met ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-secondary)',
                          border: state.met
                            ? '1px solid rgba(22, 163, 74, 0.3)'
                            : '1px solid var(--border-color)',
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {c.name}
                          </div>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              color: state.met ? '#16A34A' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={state.met}
                              onChange={e => updateCriterion(c.id, { met: e.target.checked })}
                              style={{ accentColor: '#16A34A' }}
                            />
                            MET
                          </label>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            marginBottom: 4,
                          }}
                        >
                          {c.description}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            marginBottom: 6,
                          }}
                        >
                          {c.measurement}
                        </div>
                        <textarea
                          value={state.note}
                          onChange={e => updateCriterion(c.id, { note: e.target.value })}
                          placeholder="Their answer / your observation..."
                          rows={2}
                          style={{
                            width: '100%',
                            padding: 6,
                            fontSize: 11,
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 3,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion signal */}
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
                  Conversion signal · Week 5
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  {(['yes', 'maybe', 'no'] as const).map(v => {
                    const colorMap = { yes: '#16A34A', maybe: '#F59E0B', no: '#EF4444' };
                    const labelMap = {
                      yes: 'Would pay',
                      maybe: 'Maybe / needs',
                      no: 'Would not pay',
                    };
                    const isSelected = active.wouldPay === v;
                    return (
                      <button
                        key={v}
                        onClick={() => updateActive({ wouldPay: v })}
                        style={{
                          padding: '8px 10px',
                          background: isSelected ? colorMap[v] : 'var(--bg-secondary)',
                          color: isSelected ? '#fff' : 'var(--text-primary)',
                          border: isSelected
                            ? `1.5px solid ${colorMap[v]}`
                            : '1px solid var(--border-color)',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {labelMap[v]}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: 8,
                  }}
                >
                  <div>
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
                      NPS (0-10)
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={active.nps ?? ''}
                      onChange={e =>
                        updateActive({ nps: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="—"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: 14,
                        fontWeight: 700,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                  <div>
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
                      Testimonial quote (approved)
                    </div>
                    <textarea
                      value={active.quote ?? ''}
                      onChange={e => updateActive({ quote: e.target.value })}
                      placeholder="1-2 sentences, anonymized OK..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: 6,
                        fontSize: 11,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 3,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
