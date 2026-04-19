'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Loader2, Edit3, Save, X } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  role: string;
  focus: string;
  values: string;
  bias: string;
  riskTolerance: string;
}

const RISK_OPTIONS = ['conservative', 'moderate', 'aggressive'] as const;

const EMPTY_PERSONA = {
  name: '',
  role: '',
  focus: '',
  values: '',
  bias: '',
  riskTolerance: 'moderate',
};

export function PersonaManager() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PERSONA);

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/personas');
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const handleCreate = async () => {
    if (!draft.name || !draft.role || !draft.focus || !draft.values || !draft.bias) return;
    setSaving(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        const persona = await res.json();
        setPersonas(prev => [...prev, persona]);
        setDraft(EMPTY_PERSONA);
        setShowNew(false);
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...draft }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPersonas(prev => prev.map(p => (p.id === editingId ? updated : p)));
        setEditingId(null);
        setDraft(EMPTY_PERSONA);
      }
    } catch {
      // Error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/personas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPersonas(prev => prev.filter(p => p.id !== id));
      }
    } catch {
      // Error
    }
  };

  const startEdit = (persona: Persona) => {
    setEditingId(persona.id);
    setDraft({
      name: persona.name,
      role: persona.role,
      focus: persona.focus,
      values: persona.values,
      bias: persona.bias,
      riskTolerance: persona.riskTolerance,
    });
    setShowNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNew(false);
    setDraft(EMPTY_PERSONA);
  };

  return (
    <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <div
        className="card-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <h3 className="flex items-center gap-sm">
          <Users size={18} />
          Decision Personas
        </h3>
        {!showNew && !editingId && personas.length < 10 && (
          <button
            onClick={() => {
              setShowNew(true);
              setDraft(EMPTY_PERSONA);
            }}
            className="btn btn-primary flex items-center gap-sm"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            <Plus size={14} />
            Add Persona
          </button>
        )}
      </div>
      <div className="card-body">
        <p
          className="text-xs text-muted"
          style={{ marginBottom: 'var(--spacing-md)', lineHeight: 1.5 }}
        >
          Custom personas replace the default AI-generated decision panel for your organization.
          Each analysis will simulate these specific decision-makers voting on your proposals. If
          none are defined, the AI generates domain-specific personas per document.
        </p>

        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: '20px' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : (
          <>
            {/* Existing personas */}
            {personas.map(persona => (
              <div
                key={persona.id}
                style={{
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background:
                    editingId === persona.id ? 'rgba(249,115,22,0.05)' : 'var(--bg-secondary)',
                  border: `1px solid ${editingId === persona.id ? 'rgba(249,115,22,0.3)' : 'var(--liquid-border)'}`,
                  borderRadius: '8px',
                }}
              >
                {editingId === persona.id ? (
                  <PersonaForm
                    draft={draft}
                    setDraft={setDraft}
                    onSave={handleUpdate}
                    onCancel={cancelEdit}
                    saving={saving}
                    isEdit
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{persona.name}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            background: 'rgba(249,115,22,0.12)',
                            color: 'var(--warning)',
                          }}
                        >
                          {persona.role}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            background:
                              persona.riskTolerance === 'aggressive'
                                ? 'rgba(239,68,68,0.1)'
                                : persona.riskTolerance === 'conservative'
                                  ? 'rgba(34,197,94,0.1)'
                                  : 'rgba(245,158,11,0.1)',
                            color:
                              persona.riskTolerance === 'aggressive'
                                ? '#f87171'
                                : persona.riskTolerance === 'conservative'
                                  ? '#4ade80'
                                  : '#fbbf24',
                            textTransform: 'capitalize',
                          }}
                        >
                          {persona.riskTolerance}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          margin: '2px 0',
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>Focus:</strong> {persona.focus}
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          margin: '2px 0',
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>Values:</strong> {persona.values}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                      <button
                        onClick={() => startEdit(persona)}
                        style={{
                          padding: '4px',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(persona.id)}
                        style={{
                          padding: '4px',
                          background: 'transparent',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '6px',
                          color: 'var(--error)',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {personas.length === 0 && !showNew && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(249,115,22,0.03)',
                  border: '1px dashed rgba(249,115,22,0.2)',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  No custom personas defined. The AI will generate domain-specific personas for each
                  document.
                </p>
                <button
                  onClick={() => {
                    setShowNew(true);
                    setDraft(EMPTY_PERSONA);
                  }}
                  className="btn btn-primary flex items-center gap-sm"
                  style={{ fontSize: '12px', margin: '0 auto' }}
                >
                  <Plus size={14} />
                  Create your first persona
                </button>
              </div>
            )}

            {/* New persona form */}
            {showNew && (
              <div
                style={{
                  padding: '14px 16px',
                  background: 'rgba(249,115,22,0.05)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: '8px',
                  marginTop: '8px',
                }}
              >
                <PersonaForm
                  draft={draft}
                  setDraft={setDraft}
                  onSave={handleCreate}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PersonaForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
  isEdit = false,
}: {
  draft: typeof EMPTY_PERSONA;
  setDraft: (d: typeof EMPTY_PERSONA) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}) {
  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    fontSize: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 600 as const,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block' as const,
    marginBottom: '3px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Chief Medical Officer"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Role</label>
          <input
            value={draft.role}
            onChange={e => setDraft({ ...draft, role: e.target.value })}
            placeholder="e.g. CMO Proxy"
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Focus Areas</label>
        <input
          value={draft.focus}
          onChange={e => setDraft({ ...draft, focus: e.target.value })}
          placeholder="e.g. Patient safety, clinical evidence, treatment outcomes"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Decision Values</label>
        <input
          value={draft.values}
          onChange={e => setDraft({ ...draft, values: e.target.value })}
          placeholder="e.g. Evidence-based medicine, do no harm, cost-effectiveness"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Natural Bias / Blind Spot</label>
        <input
          value={draft.bias}
          onChange={e => setDraft({ ...draft, bias: e.target.value })}
          placeholder="e.g. Skeptical of treatments without randomized controlled trials"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Risk Tolerance</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {RISK_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setDraft({ ...draft, riskTolerance: opt })}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                background: draft.riskTolerance === opt ? 'rgba(249,115,22,0.15)' : 'transparent',
                border: `1px solid ${draft.riskTolerance === opt ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                color: draft.riskTolerance === opt ? '#FBBF24' : 'var(--text-muted)',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: draft.riskTolerance === opt ? 600 : 400,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
        <button
          onClick={onCancel}
          className="btn btn-ghost flex items-center gap-sm"
          style={{ fontSize: '12px', padding: '5px 12px' }}
        >
          <X size={14} />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={
            saving || !draft.name || !draft.role || !draft.focus || !draft.values || !draft.bias
          }
          className="btn btn-primary flex items-center gap-sm"
          style={{ fontSize: '12px', padding: '5px 12px' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEdit ? 'Update' : 'Create'} Persona
        </button>
      </div>
    </div>
  );
}
