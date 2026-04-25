'use client';

import { useEffect, useState } from 'react';
import { Globe, ChevronDown, Edit3, Check, Loader2, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';

interface Props {
  marketContextApplied: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
  };
  /** When true, the chip exposes the override editor (owner-only). */
  isOwner?: boolean;
  /** Analysis id — required for the owner editor to PATCH the override. */
  analysisId?: string;
  /** Override snapshot, when present takes priority over `marketContextApplied`. */
  marketContextOverride?: Props['marketContextApplied'] & {
    overriddenAt?: string;
    overriddenBy?: string;
  } | null;
  /** Called after a successful save so the parent can refresh. */
  onChanged?: () => void;
}

const CONTEXT_LABEL: Record<Props['marketContextApplied']['context'], string> = {
  emerging_market: 'Emerging-market priors',
  developed_market: 'Developed-market priors',
  cross_border: 'Cross-border priors',
  unknown: 'Default priors',
};

const CONTEXT_HEX: Record<Props['marketContextApplied']['context'], string> = {
  emerging_market: '#16A34A',
  developed_market: '#2563EB',
  cross_border: '#7C3AED',
  unknown: '#64748B',
};

type ContextChoice = 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';

const CONTEXT_OPTIONS: Array<{ id: ContextChoice; label: string; ceiling: string }> = [
  { id: 'emerging_market', label: 'Emerging market', ceiling: '~35% CAGR ceiling' },
  { id: 'developed_market', label: 'Developed market', ceiling: '~25% CAGR ceiling' },
  { id: 'cross_border', label: 'Cross-border', ceiling: '~30% CAGR blended ceiling' },
  { id: 'unknown', label: 'No jurisdiction prior', ceiling: 'Default behaviour' },
];

/**
 * Surfaces "we applied X-market priors because Nigeria + Kenya were detected"
 * so the reader can see exactly which growth-rate ceiling drove the bias
 * detector's overconfidence trigger. Defaults to collapsed chip; expands to
 * full rationale on click.
 *
 * Owner-only override (3.6 deep): a small "Override" button on the
 * expanded panel lets the document owner flip the auto-detection. When
 * an override exists it wins for the current analysis surface.
 */
export function MarketContextChip({
  marketContextApplied,
  isOwner,
  analysisId,
  marketContextOverride,
  onChanged,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pickerContext, setPickerContext] = useState<ContextChoice>(
    (marketContextOverride?.context ?? marketContextApplied.context) as ContextChoice
  );
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setPickerContext(
      (marketContextOverride?.context ?? marketContextApplied.context) as ContextChoice
    );
  }, [marketContextApplied.context, marketContextOverride?.context]);

  // Effective view = override when present, else applied. The chip
  // renders against this so a user-flipped value lights up the right
  // colour + cagrCeiling everywhere.
  const effective = marketContextOverride ?? marketContextApplied;
  const isOverridden = !!marketContextOverride;

  // Hide chip ONLY when nothing useful would render — no auto context
  // and no override.
  if (effective.context === 'unknown' && !isOverridden) return null;

  const colour = CONTEXT_HEX[effective.context];
  const label = CONTEXT_LABEL[effective.context];
  const allCountries = [
    ...effective.emergingMarketCountries,
    ...effective.developedMarketCountries,
  ];
  const summary =
    allCountries.length === 0
      ? isOverridden
        ? 'manually overridden'
        : 'priors applied'
      : `${allCountries.slice(0, 3).join(', ')}${allCountries.length > 3 ? ` +${allCountries.length - 3} more` : ''}`;

  const handleSave = async () => {
    if (!analysisId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/analysis/${analysisId}/market-context`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: pickerContext }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Save failed (${res.status})`, 'error');
        return;
      }
      showToast('Market-context override saved.', 'success');
      setEditing(false);
      onChanged?.();
    } catch {
      showToast('Save failed. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!analysisId) return;
    setClearing(true);
    try {
      // Clearing the override = saving the auto-detected context as
      // override-null. We accomplish that by saving the original context
      // and treating `unknown` as a no-op trigger; simplest: just save
      // the auto-detected context.
      const res = await fetch(`/api/analysis/${analysisId}/market-context`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: marketContextApplied.context }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Reset failed (${res.status})`, 'error');
        return;
      }
      showToast('Market context reset to auto-detection.', 'success');
      onChanged?.();
    } catch {
      showToast('Reset failed.', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${colour}33`,
        borderLeft: `3px solid ${colour}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => setExpanded(prev => !prev)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
        aria-expanded={expanded}
      >
        <Globe size={16} style={{ color: colour, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {label}{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              · {summary}
            </span>
            {isOverridden && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#7C3AED',
                  background: 'rgba(124,58,237,0.10)',
                  border: '1px solid rgba(124,58,237,0.30)',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                Owner override
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 1,
            }}
          >
            Overconfidence trigger: ~{effective.cagrCeiling}% CAGR ceiling
          </div>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
      {expanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 8 }}>{effective.rationale}</div>
          {(effective.emergingMarketCountries.length > 0 ||
            effective.developedMarketCountries.length > 0) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: isOwner ? 10 : 0,
              }}
            >
              {effective.emergingMarketCountries.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>EM:</strong>{' '}
                  {effective.emergingMarketCountries.join(', ')}
                </div>
              )}
              {effective.developedMarketCountries.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>DM:</strong>{' '}
                  {effective.developedMarketCountries.join(', ')}
                </div>
              )}
            </div>
          )}

          {isOverridden && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              Auto-detection said{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {CONTEXT_LABEL[marketContextApplied.context]}
              </strong>
              .
            </div>
          )}

          {isOwner && analysisId && !editing && (
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setEditing(true)}
                className="btn btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <Edit3 size={11} />
                {isOverridden ? 'Change override' : 'Override'}
              </button>
              {isOverridden && (
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  {clearing ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                  Reset to auto
                </button>
              )}
            </div>
          )}

          {isOwner && editing && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Pick the right context
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CONTEXT_OPTIONS.map(o => {
                  const active = pickerContext === o.id;
                  const optColour =
                    o.id === 'emerging_market'
                      ? '#16A34A'
                      : o.id === 'developed_market'
                        ? '#2563EB'
                        : o.id === 'cross_border'
                          ? '#7C3AED'
                          : '#64748B';
                  return (
                    <button
                      key={o.id}
                      onClick={() => setPickerContext(o.id)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: `1px solid ${active ? optColour : 'var(--border-color)'}`,
                        background: active ? `${optColour}10` : 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: `1.5px solid ${active ? optColour : 'var(--border-color)'}`,
                          background: active ? optColour : 'transparent',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {o.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {o.ceiling}
                        </div>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 6,
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <X size={11} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Save override
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
