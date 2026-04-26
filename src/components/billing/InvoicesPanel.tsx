'use client';

import useSWR from 'swr';
import {
  FileText,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  createdAt: string | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
  periodEnd: string | null;
}

interface UpcomingInvoice {
  amountDue: number;
  currency: string;
  periodEnd: string | null;
  lineItemSummary: string | null;
}

interface ApiResponse {
  invoices: Invoice[];
  upcoming: UpcomingInvoice | null;
  customerless?: boolean;
}

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed (${res.status})`);
  return res.json();
};

function formatMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_TINT: Record<string, string> = {
  paid: '#16A34A',
  open: '#3b82f6',
  draft: '#94a3b8',
  uncollectible: '#ef4444',
  void: '#94a3b8',
};

export function InvoicesPanel() {
  const { data, error, isLoading } = useSWR<ApiResponse>('/api/billing/invoices', fetcher);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Billing history
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Last 6 invoices · upcoming charge preview
          </h3>
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : error ? (
        <div
          style={{
            color: 'var(--severity-high)',
            fontSize: 13,
            padding: 'var(--spacing-md)',
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={14} /> Could not load billing history.
        </div>
      ) : !data || data.customerless ? (
        <div
          style={{
            padding: 'var(--spacing-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          No Stripe history yet. Once you start a paid subscription, invoices and the upcoming
          charge preview will appear here.
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {data.upcoming && (
            <div
              style={{
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={16} color="#16A34A" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Upcoming charge
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {data.upcoming.lineItemSummary ?? 'Subscription renewal'}
                    {data.upcoming.periodEnd && ` · ${formatDate(data.upcoming.periodEnd)}`}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                }}
              >
                {formatMoney(data.upcoming.amountDue, data.upcoming.currency)}
              </div>
            </div>
          )}

          {/* Invoices table */}
          {data.invoices.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              No invoices generated yet.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
              {data.invoices.map(inv => {
                const tint = STATUS_TINT[inv.status ?? 'open'] ?? '#94a3b8';
                return (
                  <li
                    key={inv.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {inv.number ?? inv.id.slice(0, 12)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        {formatDate(inv.createdAt)}
                        <span>·</span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: tint,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {inv.status === 'paid' ? (
                            <CheckCircle size={10} />
                          ) : inv.status === 'open' ? (
                            <Clock size={10} />
                          ) : null}
                          {inv.status ?? 'unknown'}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatMoney(
                        inv.status === 'paid' ? inv.amountPaid : inv.amountDue,
                        inv.currency
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          PDF
                        </a>
                      )}
                      {inv.hostedInvoiceUrl && (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Stripe"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
