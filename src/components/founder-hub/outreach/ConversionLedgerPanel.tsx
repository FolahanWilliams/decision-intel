'use client';

/**
 * ConversionLedgerPanel — the wedge-funnel instrument (locked 2026-05-18).
 *
 * GTM v3.5 Phase-1 motion mandate: "track conversion religiously — DMs
 * sent, replies, audit booked, audit completed, conversion." The
 * month-4 kill criterion (<5 paid Individuals = halt-and-pivot,
 * regardless of every other metric) fires whether or not the founder
 * is watching — this panel makes it a steerable dashboard. Mounted at
 * the TOP of the Outreach Hub Pipeline section (the ONE conversion
 * mechanism per the 1-1-1 lock — never a new tab, never Content Studio).
 *
 * Founder-only (x-founder-pass). Reads/writes the WedgeProspect ledger;
 * metric math is the pure conversion-ledger SSOT (never inlined here).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, TrendingUp } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  FUNNEL_STAGES,
  PROSPECT_SOURCES,
  computeFunnelMetrics,
  isValidStageTransition,
  stageLabel,
  type FunnelStageId,
} from '@/lib/outreach/conversion-ledger';
import { WEDGE_PERSONAS } from '@/lib/data/event-prep';

interface Prospect {
  id: string;
  name: string;
  company: string | null;
  title: string | null;
  persona: string;
  source: string;
  stage: string;
  notes: string | null;
  updatedAt: string;
}

interface Props {
  founderPass: string;
}

const PERSONA_OPTIONS = [
  ...WEDGE_PERSONAS.map(p => ({ id: p.id, label: p.label })),
  { id: 'other', label: 'Other / waitlist' },
];

const KILL_BAND_COLOR: Record<string, string> = {
  at_risk: 'var(--error)',
  approaching: 'var(--warning)',
  on_track: 'var(--success)',
};

export function ConversionLedgerPanel({ founderPass }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company: '',
    persona: PERSONA_OPTIONS[0].id,
    source: 'linkedin_dm',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': founderPass }),
    [founderPass]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/outreach/prospects', {
        headers: { 'x-founder-pass': founderPass },
      });
      const json = await res.json().catch(() => null); // canonical res-body-parse exception
      if (!res.ok) {
        setError(json?.error || 'Could not load the conversion ledger');
        setProspects([]);
      } else {
        const list = json?.data?.prospects;
        setProspects(Array.isArray(list) ? list : []);
      }
    } catch {
      setError('Network error loading the conversion ledger');
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [founderPass]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => computeFunnelMetrics(prospects), [prospects]);

  const transition = useCallback(
    async (p: Prospect, to: FunnelStageId) => {
      setBusyId(p.id);
      try {
        const res = await fetch(`/api/founder-hub/outreach/prospects/${p.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ stage: to }),
        });
        const json = await res.json().catch(() => null); // canonical res-body-parse exception
        if (!res.ok) {
          setError(json?.error || 'Stage update failed');
        } else {
          setError(null);
          await load();
        }
      } catch {
        setError('Network error updating the prospect');
      } finally {
        setBusyId(null);
      }
    },
    [headers, load]
  );

  const remove = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const res = await fetch(`/api/founder-hub/outreach/prospects/${id}`, {
          method: 'DELETE',
          headers: { 'x-founder-pass': founderPass },
        });
        if (res.ok) await load();
      } catch {
        setError('Network error deleting the prospect');
      } finally {
        setBusyId(null);
      }
    },
    [founderPass, load]
  );

  const submitAdd = useCallback(async () => {
    if (form.name.trim().length < 2) {
      setAddError('Name is required');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/founder-hub/outreach/prospects', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null); // canonical res-body-parse exception
      if (!res.ok) {
        setAddError(json?.error || 'Could not add the prospect');
      } else {
        setForm({ name: '', company: '', persona: PERSONA_OPTIONS[0].id, source: 'linkedin_dm' });
        setShowAdd(false);
        await load();
      }
    } catch {
      setAddError('Network error adding the prospect');
    } finally {
      setAdding(false);
    }
  }, [form, headers, load]);

  const killColor = KILL_BAND_COLOR[metrics.killBand] ?? 'var(--text-muted)';

  return (
    <AccentCard accent="primary" className="conversion-ledger-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Wedge conversion ledger
        </h3>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Track every prospect DM → reply → audit → £249. The month-4 Phase-1 floor is{' '}
        {metrics.killFloor} paid Individuals; below it the wedge motion halts and pivots.
      </p>

      {/* Kill-criterion + funnel metric strip */}
      <div className="cl-metric-row">
        <div className="cl-metric" style={{ borderColor: killColor }}>
          <span className="cl-metric-num" style={{ color: killColor }}>
            {metrics.converted}
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {' '}
              / {metrics.killFloor}
            </span>
          </span>
          <span className="cl-metric-lbl">Converted · month-4 floor</span>
        </div>
        <div className="cl-metric">
          <span className="cl-metric-num" style={{ color: 'var(--text-primary)' }}>
            {metrics.conversionRatePct}%
          </span>
          <span className="cl-metric-lbl">Conversion rate</span>
        </div>
        <div className="cl-metric">
          <span className="cl-metric-num" style={{ color: 'var(--text-primary)' }}>
            {metrics.active}
          </span>
          <span className="cl-metric-lbl">Active in funnel</span>
        </div>
        <div className="cl-metric">
          <span
            className="cl-metric-num"
            style={{ color: metrics.stalled > 0 ? 'var(--warning)' : 'var(--text-primary)' }}
          >
            {metrics.stalled}
          </span>
          <span className="cl-metric-lbl">Stalled &gt; 14d</span>
        </div>
      </div>

      {/* Per-stage funnel bar */}
      <div className="cl-funnel">
        {FUNNEL_STAGES.map(s => (
          <div key={s.id} className="cl-funnel-cell">
            <span className="cl-funnel-count">{metrics.byStage[s.id]}</span>
            <span className="cl-funnel-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add prospect */}
      <div style={{ margin: '14px 0' }}>
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="cl-btn cl-btn-primary"
          >
            <Plus size={14} /> Log a prospect
          </button>
        ) : (
          <div className="cl-add-form">
            <div className="cl-add-grid">
              <input
                placeholder="Prospect name *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="cl-input"
              />
              <input
                placeholder="Company"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="cl-input"
              />
              <select
                value={form.persona}
                onChange={e => setForm(f => ({ ...f, persona: e.target.value }))}
                className="cl-input"
              >
                {PERSONA_OPTIONS.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="cl-input"
              >
                {PROSPECT_SOURCES.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {addError && (
              <p style={{ color: 'var(--error)', fontSize: 12, margin: '6px 0 0' }}>{addError}</p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={submitAdd}
                disabled={adding}
                className="cl-btn cl-btn-primary"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setAddError(null);
                }}
                className="cl-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            color: 'var(--error)',
            fontSize: 12.5,
            margin: '0 0 10px',
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Prospect list */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            color: 'var(--text-muted)',
            padding: '16px 0',
          }}
        >
          <Loader2 size={16} className="animate-spin" /> Loading ledger…
        </div>
      ) : prospects.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
          No prospects logged yet. The first 5-10 personalised DMs/week is the GTM v3.5 motion —
          log them here as you send them so the month-4 checkpoint is a dashboard, not a surprise.
        </p>
      ) : (
        <div className="cl-list">
          {prospects.map(p => {
            const targets = FUNNEL_STAGES.filter(
              s =>
                s.id !== p.stage &&
                isValidStageTransition(p.stage as FunnelStageId, s.id)
            );
            const personaLabel =
              PERSONA_OPTIONS.find(o => o.id === p.persona)?.label ?? p.persona;
            return (
              <div key={p.id} className="cl-row">
                <div className="cl-row-main">
                  <span className="cl-row-name">{p.name}</span>
                  {p.company && <span className="cl-row-co">· {p.company}</span>}
                  <span className="cl-row-persona">{personaLabel}</span>
                </div>
                <div className="cl-row-actions">
                  <span className="cl-stage-badge">{stageLabel(p.stage as FunnelStageId)}</span>
                  {targets.length > 0 && (
                    <select
                      disabled={busyId === p.id}
                      value=""
                      onChange={e => {
                        const to = e.target.value as FunnelStageId;
                        if (to) void transition(p, to);
                      }}
                      className="cl-input cl-move"
                      aria-label={`Move ${p.name}`}
                    >
                      <option value="">Move →</option>
                      {targets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={busyId === p.id}
                    className="cl-btn cl-btn-icon"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .conversion-ledger-panel .cl-metric-row {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px;
        }
        .conversion-ledger-panel .cl-metric {
          border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;
          background: var(--bg-secondary);
        }
        .conversion-ledger-panel .cl-metric-num { font-size: 22px; font-weight: 800; display: block; }
        .conversion-ledger-panel .cl-metric-lbl {
          font-size: 11px; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .conversion-ledger-panel .cl-funnel {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 4px;
        }
        .conversion-ledger-panel .cl-funnel-cell {
          text-align: center; padding: 8px 4px; border-radius: 8px;
          background: var(--bg-tertiary); border: 1px solid var(--border-color);
        }
        .conversion-ledger-panel .cl-funnel-count {
          display: block; font-size: 18px; font-weight: 700; color: var(--text-primary);
        }
        .conversion-ledger-panel .cl-funnel-lbl { font-size: 10px; color: var(--text-muted); }
        .conversion-ledger-panel .cl-add-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
        }
        .conversion-ledger-panel .cl-input {
          padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 8px;
          background: var(--bg-card); color: var(--text-primary); font-size: 13px; width: 100%;
        }
        .conversion-ledger-panel .cl-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
          border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card);
          color: var(--text-primary); font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .conversion-ledger-panel .cl-btn-primary {
          background: var(--accent-primary); color: #fff; border-color: var(--accent-primary);
        }
        .conversion-ledger-panel .cl-btn-icon { padding: 7px 8px; color: var(--text-muted); }
        .conversion-ledger-panel .cl-btn:disabled { opacity: 0.55; cursor: default; }
        .conversion-ledger-panel .cl-list { display: flex; flex-direction: column; gap: 6px; }
        .conversion-ledger-panel .cl-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 9px;
          background: var(--bg-card);
        }
        .conversion-ledger-panel .cl-row-main {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0;
        }
        .conversion-ledger-panel .cl-row-name { font-weight: 700; color: var(--text-primary); font-size: 13.5px; }
        .conversion-ledger-panel .cl-row-co { color: var(--text-muted); font-size: 12.5px; }
        .conversion-ledger-panel .cl-row-persona {
          font-size: 11px; color: var(--text-secondary); background: var(--bg-tertiary);
          padding: 2px 8px; border-radius: 999px;
        }
        .conversion-ledger-panel .cl-row-actions { display: flex; align-items: center; gap: 8px; }
        .conversion-ledger-panel .cl-stage-badge {
          font-size: 11px; font-weight: 700; color: var(--accent-primary);
          background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
          padding: 3px 9px; border-radius: 999px; white-space: nowrap;
        }
        .conversion-ledger-panel .cl-move { width: auto; padding: 5px 8px; font-size: 12px; }
        @media (max-width: 760px) {
          .conversion-ledger-panel .cl-metric-row { grid-template-columns: repeat(2, 1fr); }
          .conversion-ledger-panel .cl-funnel { grid-template-columns: repeat(3, 1fr); }
          .conversion-ledger-panel .cl-add-grid { grid-template-columns: 1fr; }
          .conversion-ledger-panel .cl-row { flex-direction: column; align-items: flex-start; }
          .conversion-ledger-panel .cl-row-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </AccentCard>
  );
}
