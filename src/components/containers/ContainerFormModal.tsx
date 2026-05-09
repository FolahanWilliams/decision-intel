'use client';

/**
 * ContainerFormModal — create-form for a new DecisionContainer.
 * Mode-aware: kind picker (investment / acquisition / strategic)
 * shapes which optional fields render. Replaces the deleted
 * DealFormModal / CreatePackageButton with one unified surface.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CONTAINER_MODES,
  type DecisionContainerKind,
  CONTAINER_KINDS,
} from '@/lib/data/decision-container-modes';
import { DEAL_TYPE_OPTIONS, SECTOR_OPTIONS } from '@/types/containers';

interface ContainerFormModalProps {
  /** Pre-select a kind (e.g. from kind picker on parent page). */
  defaultKind?: DecisionContainerKind;
  onClose?: () => void;
  onCreated?: (id: string) => void;
}

export function ContainerFormModal({ defaultKind, onClose, onCreated }: ContainerFormModalProps) {
  const router = useRouter();
  const [kind, setKind] = useState<DecisionContainerKind>(defaultKind ?? 'strategic');
  const [name, setName] = useState('');
  const [decisionFrame, setDecisionFrame] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [sector, setSector] = useState('');
  const [dealType, setDealType] = useState('');
  const [fundName, setFundName] = useState('');
  const [vintage, setVintage] = useState('');
  const [ticketSize, setTicketSize] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [committeeDate, setCommitteeDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = CONTAINER_MODES[kind];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || null,
          targetCompany: targetCompany.trim() || null,
          sector: sector || null,
          dealType: kind === 'acquisition' ? dealType || null : null,
          fundName: kind === 'investment' ? fundName.trim() || null : null,
          vintage: kind === 'investment' && vintage ? parseInt(vintage, 10) : null,
          ticketSize: ticketSize ? parseFloat(ticketSize) : null,
          currency,
          committeeDate: committeeDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create container');
      }
      const id = json.id as string;
      if (onCreated) onCreated(id);
      else router.push(`/dashboard/decisions/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.40)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 4 }}>
            New decision
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}
          >
            Pick the mode that matches what you&apos;re deciding. The committee gate, required
            documents, and outcome metrics adapt automatically.
          </p>

          {/* Kind picker */}
          <div style={{ marginBottom: 16 }}>
            <Label>Decision type</Label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 8,
              }}
            >
              {CONTAINER_KINDS.map(k => {
                const m = CONTAINER_MODES[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {m.label}
                    </div>
                    <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                      Gate: {m.committeeLabel}
                    </div>
                  </button>
                );
              })}
            </div>
            <p
              style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              {mode.description}
            </p>
          </div>

          {/* Name */}
          <Field
            label="Name"
            required
            input={
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={
                  kind === 'investment'
                    ? 'Acme Corp Series B'
                    : kind === 'acquisition'
                      ? 'Project Marlin · Acme Corp'
                      : 'Q4 DACH market entry'
                }
                style={inputStyle}
                required
              />
            }
          />

          {/* Decision frame */}
          <Field
            label="Decision frame"
            hint="The line the committee has to vote yes/no on."
            input={
              <textarea
                value={decisionFrame}
                onChange={e => setDecisionFrame(e.target.value)}
                placeholder={
                  kind === 'strategic'
                    ? 'Should we enter the Brazilian market in 2026 at the proposed budget?'
                    : 'Should we proceed with this commitment at the proposed terms?'
                }
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            }
          />

          {/* Mode-specific fields */}
          {(kind === 'investment' || kind === 'acquisition') && (
            <>
              <Field
                label={kind === 'acquisition' ? 'Target company' : 'Portfolio company'}
                input={
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                    style={inputStyle}
                  />
                }
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field
                  label="Sector"
                  input={
                    <select
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">—</option>
                      {SECTOR_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  }
                />
                <Field
                  label="Ticket size"
                  input={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        style={{ ...inputStyle, width: 80 }}
                      >
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <input
                        type="number"
                        value={ticketSize}
                        onChange={e => setTicketSize(e.target.value)}
                        placeholder="50000000"
                        style={inputStyle}
                      />
                    </div>
                  }
                />
              </div>
            </>
          )}

          {kind === 'investment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <Field
                label="Fund name"
                input={
                  <input
                    type="text"
                    value={fundName}
                    onChange={e => setFundName(e.target.value)}
                    placeholder="Fund IV"
                    style={inputStyle}
                  />
                }
              />
              <Field
                label="Vintage"
                input={
                  <input
                    type="number"
                    value={vintage}
                    onChange={e => setVintage(e.target.value)}
                    placeholder="2026"
                    style={inputStyle}
                  />
                }
              />
            </div>
          )}

          {kind === 'acquisition' && (
            <Field
              label="Deal type"
              input={
                <select
                  value={dealType}
                  onChange={e => setDealType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">—</option>
                  {DEAL_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              }
            />
          )}

          <Field
            label={`${mode.committeeLabel} target date`}
            hint="Drives the T-N countdown on the kanban + committee-readiness gate."
            input={
              <input
                type="date"
                value={committeeDate}
                onChange={e => setCommitteeDate(e.target.value)}
                style={inputStyle}
              />
            }
          />

          {error && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: 'var(--error)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: submitting ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Creating…' : 'Create decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  fontFamily: 'inherit',
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--fs-2xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginBottom: 6,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  input,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  input: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>
        {label}
        {required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
      </Label>
      {input}
      {hint && (
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
