'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, ChevronDown } from 'lucide-react';
import {
  SEED_TARGETS,
  TIER_LABEL,
  TIER_COLOR,
  INDUSTRY_LABEL,
  PIPELINE_STAGE_ORDER,
  STAGE_LABEL,
  STAGE_COLOR,
  type PipelineStage,
  type Tier,
  type Industry,
} from '@/lib/data/outreach';

const STORAGE_KEY_STAGES = 'outreach-cmd-pipeline-stages-v1';
const STORAGE_KEY_CUSTOM = 'outreach-cmd-pipeline-custom-v1';
const STORAGE_KEY_NOTES = 'outreach-cmd-pipeline-notes-v1';

interface CustomContact {
  id: string;
  company: string;
  contactName?: string;
  contactRole?: string;
  tier: Tier;
  industry?: Industry;
  createdAt: string;
}

interface PipelineEntry {
  id: string;
  company: string;
  contactName?: string;
  contactRole?: string;
  tier: Tier;
  industry?: Industry;
  isCustom: boolean;
  reason?: string;
  roleToTarget?: string;
  dealFrequency?: string;
  personalisationHook?: string;
}

function readStages(): Record<string, PipelineStage> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAGES);
    return raw ? (JSON.parse(raw) as Record<string, PipelineStage>) : {};
  } catch {
    return {};
  }
}
function readCustom(): CustomContact[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    return raw ? (JSON.parse(raw) as CustomContact[]) : [];
  } catch {
    return [];
  }
}
function readNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function ContactPipelineTracker() {
  const [stages, setStages] = useState<Record<string, PipelineStage>>({});
  const [custom, setCustom] = useState<CustomContact[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setStages(readStages());
    setCustom(readCustom());
    setNotes(readNotes());
  }, []);

  const saveStages = (next: Record<string, PipelineStage>) => {
    setStages(next);
    try {
      localStorage.setItem(STORAGE_KEY_STAGES, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  };
  const saveCustom = (next: CustomContact[]) => {
    setCustom(next);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  };
  const saveNotes = (next: Record<string, string>) => {
    setNotes(next);
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  };

  const entries: PipelineEntry[] = useMemo(() => {
    const seeded: PipelineEntry[] = SEED_TARGETS.map(t => ({
      id: t.id,
      company: t.company,
      tier: t.tier,
      industry: t.industry,
      isCustom: false,
      reason: t.reason,
      roleToTarget: t.roleToTarget,
      dealFrequency: t.dealFrequency,
      personalisationHook: t.personalisationHook,
    }));
    const customEntries: PipelineEntry[] = custom.map(c => ({
      id: c.id,
      company: c.company,
      contactName: c.contactName,
      contactRole: c.contactRole,
      tier: c.tier,
      industry: c.industry,
      isCustom: true,
    }));
    return [...seeded, ...customEntries];
  }, [custom]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (tierFilter !== 'all' && e.tier !== tierFilter) return false;
      const stage = stages[e.id] ?? 'not_contacted';
      if (stageFilter !== 'all' && stage !== stageFilter) return false;
      return true;
    });
  }, [entries, tierFilter, stageFilter, stages]);

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      not_contacted: 0,
      connection_sent: 0,
      responded: 0,
      call_booked: 0,
      call_done: 0,
      pattern_validated: 0,
      poc_asked: 0,
      poc_running: 0,
      poc_converted: 0,
      dormant: 0,
    };
    entries.forEach(e => {
      const s = stages[e.id] ?? 'not_contacted';
      counts[s] += 1;
    });
    return counts;
  }, [entries, stages]);

  const updateStage = (id: string, stage: PipelineStage) => {
    saveStages({ ...stages, [id]: stage });
  };
  const updateNote = (id: string, note: string) => {
    const next = { ...notes };
    if (!note.trim()) delete next[id];
    else next[id] = note;
    saveNotes(next);
  };
  const removeCustom = (id: string) => {
    saveCustom(custom.filter(c => c.id !== id));
    const nextStages = { ...stages };
    delete nextStages[id];
    saveStages(nextStages);
    const nextNotes = { ...notes };
    delete nextNotes[id];
    saveNotes(nextNotes);
  };

  return (
    <div>
      {/* Stage tally strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 4,
          marginBottom: 10,
        }}
      >
        {PIPELINE_STAGE_ORDER.map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
            style={{
              padding: '6px 8px',
              background: stageFilter === s ? STAGE_COLOR[s] : 'var(--bg-card)',
              color: stageFilter === s ? '#fff' : 'var(--text-primary)',
              border: `1px solid ${stageFilter === s ? STAGE_COLOR[s] : 'var(--border-color)'}`,
              borderLeft: `3px solid ${STAGE_COLOR[s]}`,
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease',
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: stageFilter === s ? 'rgba(255,255,255,0.8)' : STAGE_COLOR[s],
              }}
            >
              {STAGE_LABEL[s]}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                marginTop: 2,
                color: stageFilter === s ? '#fff' : 'var(--text-primary)',
              }}
            >
              {stageCounts[s]}
            </div>
          </button>
        ))}
      </div>

      {/* Filter + Add row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 10,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginRight: 4,
          }}
        >
          Tier
        </span>
        <TierChip label="All" active={tierFilter === 'all'} onClick={() => setTierFilter('all')} color="var(--text-muted)" />
        {(['tier_1', 'tier_2', 'tier_3'] as Tier[]).map(t => (
          <TierChip
            key={t}
            label={TIER_LABEL[t]}
            active={tierFilter === t}
            onClick={() => setTierFilter(t)}
            color={TIER_COLOR[t]}
          />
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              background: showAdd ? 'var(--bg-secondary)' : '#16A34A',
              color: showAdd ? 'var(--text-primary)' : '#fff',
              border: '1px solid',
              borderColor: showAdd ? 'var(--border-color)' : '#16A34A',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <Plus size={12} />
            {showAdd ? 'Cancel' : 'Add contact'}
          </button>
        </div>
      </div>

      {showAdd && <AddCustomContactForm onAdd={c => saveCustom([...custom, c])} onClose={() => setShowAdd(false)} />}

      {/* Entries list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            No contacts match this filter.
          </div>
        )}
        {filtered.map(entry => {
          const stage = stages[entry.id] ?? 'not_contacted';
          const isExpanded = expandedId === entry.id;
          return (
            <motion.div
              key={entry.id}
              layout
              transition={{ duration: 0.15 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${TIER_COLOR[entry.tier]}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: `${TIER_COLOR[entry.tier]}18`,
                    color: TIER_COLOR[entry.tier],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {entry.company}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {entry.contactName && (
                      <>
                        {entry.contactName}
                        {entry.contactRole ? ` · ${entry.contactRole}` : ''}
                        {' · '}
                      </>
                    )}
                    {entry.industry ? INDUSTRY_LABEL[entry.industry] : ''}
                  </div>
                </div>
                <select
                  value={stage}
                  onChange={e => {
                    e.stopPropagation();
                    updateStage(entry.id, e.target.value as PipelineStage);
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 8px',
                    background: `${STAGE_COLOR[stage]}18`,
                    color: STAGE_COLOR[stage],
                    border: `1px solid ${STAGE_COLOR[stage]}50`,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {PIPELINE_STAGE_ORDER.map(s => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '0 12px 12px 50px',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {entry.reason && (
                        <MetaRow label="Why this target">{entry.reason}</MetaRow>
                      )}
                      {entry.roleToTarget && (
                        <MetaRow label="Role to target">{entry.roleToTarget}</MetaRow>
                      )}
                      {entry.dealFrequency && (
                        <MetaRow label="Deal frequency">{entry.dealFrequency}</MetaRow>
                      )}
                      {entry.personalisationHook && (
                        <MetaRow label="Personalisation hook">{entry.personalisationHook}</MetaRow>
                      )}

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
                          Your notes
                        </div>
                        <textarea
                          value={notes[entry.id] ?? ''}
                          onChange={e => updateNote(entry.id, e.target.value)}
                          placeholder="Last touch date, key quotes, next step..."
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
                          }}
                        />
                      </div>

                      {entry.isCustom && (
                        <button
                          onClick={() => removeCustom(entry.id)}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '4px 10px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <X size={10} />
                          Remove custom contact
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TierChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        color: active ? '#fff' : color,
        background: active ? color : 'var(--bg-card)',
        border: `1px solid ${active ? color : 'var(--border-color)'}`,
        borderRadius: 20,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  );
}

function AddCustomContactForm({
  onAdd,
  onClose,
}: {
  onAdd: (c: CustomContact) => void;
  onClose: () => void;
}) {
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [tier, setTier] = useState<Tier>('tier_2');
  const [industry, setIndustry] = useState<Industry>('tech');

  const submit = () => {
    if (!company.trim()) return;
    const c: CustomContact = {
      id: `custom-${Date.now()}`,
      company: company.trim(),
      contactName: contactName.trim() || undefined,
      contactRole: contactRole.trim() || undefined,
      tier,
      industry,
      createdAt: new Date().toISOString(),
    };
    onAdd(c);
    onClose();
  };

  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 8,
      }}
    >
      <InputField label="Company" value={company} onChange={setCompany} />
      <InputField label="Contact name" value={contactName} onChange={setContactName} />
      <InputField label="Contact role" value={contactRole} onChange={setContactRole} />
      <SelectField
        label="Tier"
        value={tier}
        onChange={v => setTier(v as Tier)}
        options={(['tier_1', 'tier_2', 'tier_3'] as Tier[]).map(t => ({ value: t, label: TIER_LABEL[t] }))}
      />
      <SelectField
        label="Industry"
        value={industry}
        onChange={v => setIndustry(v as Industry)}
        options={(['tech', 'healthcare', 'industrial', 'financial', 'defense'] as Industry[]).map(i => ({
          value: i,
          label: INDUSTRY_LABEL[i],
        }))}
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <button
          onClick={submit}
          disabled={!company.trim()}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: company.trim() ? '#16A34A' : 'var(--bg-secondary)',
            color: company.trim() ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 4,
            cursor: company.trim() ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Add to pipeline
        </button>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
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
        {label}
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
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
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
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
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          fontSize: 12,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

