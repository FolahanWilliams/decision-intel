'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, X } from 'lucide-react';

export function CreatePackageButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [decisionFrame, setDecisionFrame] = useState('');
  const [visibility, setVisibility] = useState<'team' | 'private'>('team');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    if (name.trim().length === 0) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/decision-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || undefined,
          visibility,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        package?: { id: string };
      };
      if (!res.ok || !data.package) {
        setError(data.error ?? 'Could not create the package.');
        return;
      }
      setOpen(false);
      router.push(`/dashboard/decisions/${data.package.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Plus size={14} /> New package
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 'var(--spacing-md)',
          }}
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2
                style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}
              >
                New decision package
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, 120))}
                  placeholder="DACH market entry · Q2"
                  style={inputStyle}
                  autoFocus
                />
              </Field>
              <Field
                label="Decision frame"
                hint="Optional one-line question the package is built around."
              >
                <textarea
                  value={decisionFrame}
                  onChange={e => setDecisionFrame(e.target.value.slice(0, 600))}
                  placeholder="Should we approve the DACH market entry at $14M / 18-month break-even?"
                  rows={3}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </Field>
              <Field label="Visibility">
                <div style={{ display: 'flex', gap: 8 }}>
                  <Toggle
                    label="Team"
                    active={visibility === 'team'}
                    onClick={() => setVisibility('team')}
                  />
                  <Toggle
                    label="Private"
                    active={visibility === 'private'}
                    onClick={() => setVisibility('private')}
                  />
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  Visibility controls who sees the package shell. Each member doc still uses its own
                  visibility — adding a private memo to a team package does NOT widen its read
                  radius.
                </p>
              </Field>
              {error && (
                <div
                  style={{
                    color: 'var(--severity-high)',
                    fontSize: 12,
                    padding: '6px 10px',
                    background: 'rgba(239,68,68,0.08)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {error}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <button
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Create package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--severity-high)' }}>*</span>}
      </div>
      {hint && (
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: active ? 'rgba(22,163,74,0.1)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
