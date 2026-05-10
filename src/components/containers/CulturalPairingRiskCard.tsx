'use client';

/**
 * CulturalPairingRiskCard — captures the cultural-pairing risk
 * structured field for cross-border deals.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 10 (Daimler-Chrysler
 * + HP-Autonomy class failures). When a container is acquisition-mode,
 * force the team to explicitly name the regulatory pairing, the
 * cultural integration risks, and a named historical analog deal —
 * preventing the cultural-reasoning failure that drives the canonical
 * cross-border M&A failure cases.
 *
 * Surface rules:
 *   - Mounted on the container detail page when container.kind ===
 *     'acquisition' AND culturalPairingRisk === null.
 *   - Three required fields: regulatory pairing · cultural integration
 *     risks (≥1) · historical analog deal.
 *   - One optional field: GAAP/IFRS reconciliation note.
 */

import { useState } from 'react';
import { CheckCircle, Globe2, Loader2, Plus, Trash2 } from 'lucide-react';

interface CulturalPairingRiskCardProps {
  containerId: string;
  containerName: string;
  onSaved?: () => void;
}

export function CulturalPairingRiskCard({
  containerId,
  containerName,
  onSaved,
}: CulturalPairingRiskCardProps) {
  const [regulatoryPairing, setRegulatoryPairing] = useState('');
  const [risks, setRisks] = useState<string[]>(['']);
  const [historicalAnalogDeal, setHistoricalAnalogDeal] = useState('');
  const [gaapIfrsNote, setGaapIfrsNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const handleSave = async () => {
    setError(null);
    const filteredRisks = risks.filter(s => s.trim().length > 0);
    if (regulatoryPairing.trim().length === 0) {
      setError('Regulatory pairing is required.');
      return;
    }
    if (filteredRisks.length === 0) {
      setError('Name at least one cultural integration risk.');
      return;
    }
    if (historicalAnalogDeal.trim().length === 0) {
      setError('Name a historical analog deal (e.g. Daimler-Chrysler, HP-Autonomy).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/decisions/${containerId}/cultural-pairing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regulatoryPairing: regulatoryPairing.trim(),
          culturalIntegrationRisks: filteredRisks,
          historicalAnalogDeal: historicalAnalogDeal.trim(),
          gaapIfrsReconciliationNote: gaapIfrsNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to save cultural-pairing risk');
      }
      setSaved(true);
      onSaved?.();
      setTimeout(() => setHidden(true), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--warning)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 16,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Globe2 size={16} style={{ color: 'var(--warning)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--warning)',
          }}
        >
          Cross-border review
        </span>
      </div>
      <h2
        style={{
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 6px',
        }}
      >
        Name the cultural and regulatory pairing for {containerName}.
      </h2>
      <p
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}
      >
        Per the canonical cross-border M&amp;A failure literature (Daimler-Chrysler, HP-Autonomy,
        AOL-Time Warner), the failure is rarely in the financial mathematics — it&rsquo;s in the
        cultural reasoning. Naming the pairing here forces the diligence team to confront the gap
        before it bites.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Regulatory pairing" hint="e.g. EU AI Act + NDPR Nigeria, US GAAP + UK IFRS">
          <input
            type="text"
            value={regulatoryPairing}
            onChange={e => setRegulatoryPairing(e.target.value.slice(0, 500))}
            placeholder="Name both regulatory regimes the deal spans"
            disabled={submitting || saved}
            style={inputStyle}
          />
        </Field>

        <Field label="Cultural integration risks" hint="What specifically clashes? Be concrete.">
          {risks.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <input
                type="text"
                value={r}
                onChange={e => {
                  const next = [...risks];
                  next[i] = e.target.value.slice(0, 500);
                  setRisks(next);
                }}
                placeholder="e.g. Hierarchical decision-making at acquirer vs flat at target"
                disabled={submitting || saved}
                style={inputStyle}
              />
              {risks.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRisks(risks.filter((_, ii) => ii !== i))}
                  aria-label="Remove risk"
                  disabled={submitting || saved}
                  style={iconButtonStyle(submitting || saved)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRisks([...risks, ''])}
            disabled={submitting || saved}
            style={addButtonStyle(submitting || saved)}
          >
            <Plus size={12} /> Add risk
          </button>
        </Field>

        <Field
          label="Historical analog deal"
          hint="Name a published cross-border deal with similar pairing — Daimler-Chrysler, HP-Autonomy, Tata-Corus, etc."
        >
          <input
            type="text"
            value={historicalAnalogDeal}
            onChange={e => setHistoricalAnalogDeal(e.target.value.slice(0, 500))}
            placeholder="The most relevant comparable from the M&A failure literature"
            disabled={submitting || saved}
            style={inputStyle}
          />
        </Field>

        <Field
          label="GAAP / IFRS reconciliation note (optional)"
          hint="Where do accounting standards diverge? HP-Autonomy was driven by US GAAP vs UK upfront-revenue recognition."
        >
          <textarea
            value={gaapIfrsNote}
            onChange={e => setGaapIfrsNote(e.target.value.slice(0, 1000))}
            rows={2}
            placeholder="Optional — a single line about the accounting divergence is enough"
            disabled={submitting || saved}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }}
          />
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: '12px 0 0',
            fontSize: 'var(--fs-xs)',
            color: 'var(--error)',
          }}
        >
          {error}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        {saved ? (
          <span
            style={{
              padding: '8px 16px',
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle size={14} />
            Pairing saved
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            style={{
              padding: '8px 16px',
              background: submitting ? 'var(--bg-elevated)' : 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: submitting ? 'var(--text-muted)' : '#fff',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save cross-border review
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 'var(--fs-sm)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
};

const iconButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: 6,
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
});

const addButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  background: 'transparent',
  border: 'none',
  fontSize: 'var(--fs-xs)',
  color: 'var(--accent-primary)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
});

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {hint && (
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 'var(--fs-xs)',
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
