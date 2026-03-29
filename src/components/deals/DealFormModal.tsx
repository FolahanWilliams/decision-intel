'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { DEAL_TYPES, DEAL_STAGES, SECTORS, CURRENCIES, type DealSummary } from '@/types/deals';

interface DealFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: DealSummary | null;
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

export function DealFormModal({ open, onOpenChange, deal, onSuccess }: DealFormModalProps) {
  const isEdit = !!deal;

  const [name, setName] = useState('');
  const [dealType, setDealType] = useState('');
  const [stage, setStage] = useState('intake');
  const [sector, setSector] = useState('');
  const [ticketSize, setTicketSize] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fundName, setFundName] = useState('');
  const [vintage, setVintage] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate when editing
  useEffect(() => {
    if (deal) {
      setName(deal.name);
      setDealType(deal.dealType);
      setStage(deal.stage);
      setSector(deal.sector || '');
      setTicketSize(deal.ticketSize ? String(deal.ticketSize) : '');
      setCurrency(deal.currency || 'USD');
      setFundName(deal.fundName || '');
      setVintage(deal.vintage ? String(deal.vintage) : '');
      setTargetCompany(deal.targetCompany || '');
    } else {
      setName('');
      setDealType('');
      setStage('screening');
      setSector('');
      setTicketSize('');
      setCurrency('USD');
      setFundName('');
      setVintage('');
      setTargetCompany('');
    }
    setError(null);
  }, [deal, open]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!dealType) {
      setError('Project type is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        dealType,
        stage,
      };
      if (sector) body.sector = sector;
      if (ticketSize) body.ticketSize = parseFloat(ticketSize);
      if (currency !== 'USD') body.currency = currency;
      if (fundName.trim()) body.fundName = fundName.trim();
      if (vintage) body.vintage = parseInt(vintage, 10);
      if (targetCompany.trim()) body.targetCompany = targetCompany.trim();

      if (isEdit && deal) {
        body.id = deal.id;
      }

      const res = await fetch('/api/deals', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} project`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [
    name,
    dealType,
    stage,
    sector,
    ticketSize,
    currency,
    fundName,
    vintage,
    targetCompany,
    isEdit,
    deal,
    onOpenChange,
    onSuccess,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update project details.' : 'Add a new project to your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Corp Acquisition"
              style={inputStyle}
            />
          </div>

          {/* Project Type + Stage row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Project Type *</label>
              <select
                value={dealType}
                onChange={e => setDealType(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select type...</option>
                {DEAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)} style={selectStyle}>
                {DEAL_STAGES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject / Target + Sector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Subject / Target</label>
              <input
                type="text"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="Company name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Sector</label>
              <select value={sector} onChange={e => setSector(e.target.value)} style={selectStyle}>
                <option value="">Select sector...</option>
                {SECTORS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value / Budget + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Value / Budget</label>
              <input
                type="number"
                value={ticketSize}
                onChange={e => setTicketSize(e.target.value)}
                placeholder="e.g. 50000000"
                min="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={selectStyle}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team / Division + Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Team / Division</label>
              <input
                type="text"
                value={fundName}
                onChange={e => setFundName(e.target.value)}
                placeholder="e.g. Corporate Strategy"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input
                type="number"
                value={vintage}
                onChange={e => setVintage(e.target.value)}
                placeholder="e.g. 2024"
                min="1990"
                max="2100"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                fontSize: 12,
                color: '#ef4444',
                padding: '6px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={() => onOpenChange(false)}
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
