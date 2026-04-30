'use client';

import { useMemo, useState } from 'react';
import { FileDown, Loader2, ShieldCheck, ChevronLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface Defaults {
  perSeatMonthly: number;
  minSeats: number;
  minRetentionDays: number;
  slaTier: 'Standard' | 'Premium' | 'Custom';
  perDealMonthly: number;
  volumeFloorAuditsPerQuarter: number;
}

interface Props {
  defaults: Defaults;
  /**
   * Override the API endpoint the builder POSTs to. Defaults to the
   * admin-only `/api/billing/enterprise-quote`; the public `/pricing/quote`
   * surface passes `/api/billing/enterprise-quote-public` (IP-rate-limited,
   * no auth) instead.
   */
  apiEndpoint?: string;
  /**
   * Override the back-link target. Defaults to /dashboard/settings; the
   * public surface passes /pricing.
   */
  backHref?: string;
  /** Override the back-link label. Defaults to "Back to settings". */
  backLabel?: string;
}

export function EnterpriseQuoteBuilderClient({
  defaults,
  apiEndpoint = '/api/billing/enterprise-quote',
  backHref = '/dashboard/settings',
  backLabel = 'Back to settings',
}: Props) {
  const [customerName, setCustomerName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [seats, setSeats] = useState<number>(defaults.minSeats);
  const [perSeatMonthly, setPerSeatMonthly] = useState<number>(defaults.perSeatMonthly);
  const [dealOverageCount, setDealOverageCount] = useState<number>(0);
  const [perDealMonthly, setPerDealMonthly] = useState<number>(defaults.perDealMonthly);
  const [retentionDays, setRetentionDays] = useState<number>(defaults.minRetentionDays);
  const [slaTier, setSlaTier] = useState<'Standard' | 'Premium' | 'Custom'>(defaults.slaTier);
  const [region, setRegion] = useState<'US' | 'EU' | 'Multi-region'>('US');
  const [volumeFloor, setVolumeFloor] = useState<number>(defaults.volumeFloorAuditsPerQuarter);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acv = useMemo(() => {
    const seatACV = seats * perSeatMonthly * 12;
    const dealACV = dealOverageCount * perDealMonthly * 12;
    return { seatACV, dealACV, total: seatACV + dealACV };
  }, [seats, perSeatMonthly, dealOverageCount, perDealMonthly]);

  const generate = async () => {
    setError(null);
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (seats < defaults.minSeats) {
      setError(`Seat count must be at least ${defaults.minSeats}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          seats,
          perSeatMonthly,
          dealOverageCount,
          perDealMonthly,
          retentionDays,
          slaTier,
          region,
          volumeFloorAuditsPerQuarter: volumeFloor,
          notes: notes.trim() || undefined,
          validityDays,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Quote generation failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enterprise-quote-${customerName.replace(/[^a-z0-9-]/gi, '_').slice(0, 60)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <Link
          href={backHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 12,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={14} /> {backLabel}
        </Link>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        <ShieldCheck size={12} /> Admin · Enterprise Quote Builder
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        Build an Enterprise quote.
      </h1>
      <p
        style={{
          margin: '8px 0 14px',
          color: 'var(--text-secondary)',
          fontSize: 14,
          lineHeight: 1.55,
          maxWidth: 720,
        }}
      >
        Configurable Order Form: seats, M&A active-deal handle, retention window, SLA tier, volume
        floor. The PDF carries the same R²F + DPR provenance footer Enterprise procurement will see
        on every audit.
      </p>
      {/* B3 lock 2026-04-30 (Margaret + Titi persona ask) — visible-before-
          email reassurance banner. Reinforces that the live ACV figure on
          the right (or below on mobile) updates as inputs change AND the
          PDF download requires no email — the email field exists only to
          address the PDF inside, never to gate anything. */}
      <div
        style={{
          margin: '0 0 24px',
          maxWidth: 720,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(22, 163, 74, 0.06)',
          border: '1px solid rgba(22, 163, 74, 0.22)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
          Live ACV updates as you change inputs.
        </strong>{' '}
        Email is optional and never required to see your quote — the field below addresses the PDF
        only. Customer name is the only required input.
      </div>

      <div
        className="quote-builder-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 'var(--spacing-lg)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <Section title="Customer">
            <Field label="Customer organisation" required>
              <Input value={customerName} onChange={setCustomerName} placeholder="Acme Corp." />
            </Field>
            <FieldRow>
              <Field label="Contact name">
                <Input value={contactName} onChange={setContactName} placeholder="Sarah Adekunle" />
              </Field>
              <Field label="Contact email (optional)">
                <Input
                  value={contactEmail}
                  onChange={setContactEmail}
                  placeholder="sarah@acme.com"
                  type="email"
                />
              </Field>
            </FieldRow>
            <Field label="Region">
              <Select
                value={region}
                onChange={v => setRegion(v as typeof region)}
                options={['US', 'EU', 'Multi-region']}
              />
              {(region === 'EU' || region === 'Multi-region') && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {region === 'EU' ? 'EU' : 'Multi-region'} hosting requires an Enterprise
                    conversation.
                  </strong>{' '}
                  Production today runs on Vercel + Supabase US.{' '}
                  {region === 'EU' ? 'EU' : 'Multi-region'} residency is available on Enterprise
                  design-partner configurations and is confirmed during the Order Form discussion.
                  The PDF below records your stated preference; it is not a representation that{' '}
                  {region === 'EU' ? 'EU' : 'Multi-region'} is provisioned today.
                </div>
              )}
            </Field>
          </Section>

          <Section title="Seats">
            <FieldRow>
              <Field label={`Seat count (min ${defaults.minSeats})`}>
                <NumberInput value={seats} onChange={setSeats} min={defaults.minSeats} />
              </Field>
              <Field label="Per-seat ($/mo)">
                <NumberInput value={perSeatMonthly} onChange={setPerSeatMonthly} min={0} />
              </Field>
            </FieldRow>
          </Section>

          <Section
            title="Active Deal handle"
            tooltip="The Active Deal handle is an overage line on top of seats. Each handle gives the M&A or corp-dev team one additional concurrent deal slot beyond the fair-use cap (typically 5 concurrent deals on Strategy tier). Most enterprise teams need 0–3 additional handles; ticket sizes >$100M usually warrant 1 handle per analyst."
          >
            <FieldRow>
              <Field label="Additional active-deal slots">
                <NumberInput value={dealOverageCount} onChange={setDealOverageCount} min={0} />
              </Field>
              <Field label="Per-deal ($/mo)">
                <NumberInput value={perDealMonthly} onChange={setPerDealMonthly} min={0} />
              </Field>
            </FieldRow>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
              The Active Deal handle is an overage on top of the seat fee — used when an M&A or
              corp-dev team needs more concurrent deal slots than the fair-use cap supports.
            </p>
          </Section>

          <Section title="Retention + SLA + volume floor">
            <FieldRow>
              <Field label={`Retention (days, min ${defaults.minRetentionDays})`}>
                <NumberInput
                  value={retentionDays}
                  onChange={setRetentionDays}
                  min={defaults.minRetentionDays}
                />
              </Field>
              <Field label="SLA tier">
                <Select
                  value={slaTier}
                  onChange={v => setSlaTier(v as typeof slaTier)}
                  options={['Standard', 'Premium', 'Custom']}
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Volume floor (audits/quarter)">
                <NumberInput value={volumeFloor} onChange={setVolumeFloor} min={0} />
              </Field>
              <Field label="Quote validity (days)">
                <NumberInput value={validityDays} onChange={setValidityDays} min={7} max={180} />
              </Field>
            </FieldRow>
          </Section>

          <Section title="Notes (optional)">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Capture order-form specifics that don't fit the structured fields above."
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
              {notes.length} / 500
            </div>
          </Section>

          {error && (
            <div
              style={{
                color: 'var(--severity-high)',
                fontSize: 13,
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={generate}
            disabled={busy}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Generate quote PDF
          </button>
        </div>

        {/* Live ACV summary */}
        <aside
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-md)',
            position: 'sticky',
            top: 80,
            display: 'grid',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Annual Contract Value
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--accent-primary)',
              lineHeight: 1,
            }}
          >
            ${acv.total.toLocaleString()}
          </div>
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--border-color)',
              margin: '0',
            }}
          />
          <SummaryRow
            label={`Seats — ${seats} × $${perSeatMonthly}/mo × 12`}
            value={`$${acv.seatACV.toLocaleString()}`}
          />
          {dealOverageCount > 0 && (
            <SummaryRow
              label={`Deals — ${dealOverageCount} × $${perDealMonthly}/mo × 12`}
              value={`$${acv.dealACV.toLocaleString()}`}
            />
          )}
          <SummaryRow label="Retention" value={`${retentionDays} days`} />
          <SummaryRow label="SLA" value={slaTier} />
          <SummaryRow label="Volume floor" value={`${volumeFloor.toLocaleString()} / qtr`} />
          <SummaryRow label="Region" value={region} />
        </aside>
      </div>
      <style>{`
        @media (max-width: 800px) {
          .quote-builder-grid {
            grid-template-columns: 1fr !important;
          }
          .quote-builder-field-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
  tooltip,
}: {
  title: string;
  children: React.ReactNode;
  /** Optional procurement-grade explainer rendered as a HelpCircle icon next to the title with native tooltip on hover/focus. */
  tooltip?: string;
}) {
  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        display: 'grid',
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {title}
        {tooltip && (
          <span
            tabIndex={0}
            role="button"
            aria-label={`Help: ${title}`}
            title={tooltip}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'help',
              color: 'var(--text-muted)',
              outline: 'none',
            }}
          >
            <HelpCircle size={12} />
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="quote-builder-field-row"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
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
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
};

function Input({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type ?? 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      onChange={e => onChange(Number(e.target.value) || 0)}
      min={min}
      max={max}
      style={inputStyle}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
