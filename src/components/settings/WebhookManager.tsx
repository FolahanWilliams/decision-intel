'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, PlayCircle, Loader2, Check, X, Copy } from 'lucide-react';

interface Subscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  failCount: number;
  lastError: string | null;
  lastSuccess: string | null;
  createdAt: string;
  _count?: { deliveries: number };
}

interface Delivery {
  id: string;
  event: string;
  statusCode: number | null;
  durationMs: number | null;
  attempt: number;
  success: boolean;
  createdAt: string;
}

const ALL_EVENTS = [
  'analysis.completed',
  'outcome.reported',
  'nudge.delivered',
  'toxic_combination.detected',
  'decision_room.updated',
];

export function WebhookManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const fetchDeliveries = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/deliveries?limit=10`);
    if (res.ok) {
      const data = await res.json();
      setDeliveries(data.deliveries);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchDeliveries(id);
    }
  };

  const testWebhook = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
    if (res.ok) {
      fetchDeliveries(id);
    }
  };

  const deleteWebhook = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setSubscriptions(prev => prev.map(s => (s.id === id ? { ...s, active } : s)));
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Webhook Subscriptions
        </h2>
        <button
          onClick={() => {
            setShowCreate(true);
            setNewSecret(null);
          }}
          className="btn btn-primary btn-sm flex items-center gap-sm"
        >
          <Plus size={14} /> New Webhook
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateWebhookForm
          onCreated={(sub, secret) => {
            setSubscriptions(prev => [sub, ...prev]);
            setNewSecret(secret);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* New secret display */}
      {newSecret && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <p style={{ fontSize: '12px', color: '#eab308', fontWeight: 600, marginBottom: '6px' }}>
            Signing Secret (save this — it won&apos;t be shown again)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code
              style={{
                fontSize: '11px',
                color: 'var(--text-primary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: 'break-all',
              }}
            >
              {newSecret}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newSecret)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : subscriptions.length === 0 ? (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          No webhook subscriptions yet. Create one to receive real-time event notifications.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              style={{
                border: '1px solid var(--liquid-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/* Subscription header */}
              <div
                onClick={() => toggleExpand(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: 'var(--liquid-tint)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: sub.active ? '#22c55e' : '#ef4444',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {sub.url}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {sub.events.join(', ')} &middot; {sub._count?.deliveries ?? 0} deliveries
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      testWebhook(sub.id);
                    }}
                    title="Send test event"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '4px',
                    }}
                  >
                    <PlayCircle size={14} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleActive(sub.id, !sub.active);
                    }}
                    title={sub.active ? 'Disable' : 'Enable'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: sub.active ? '#22c55e' : '#ef4444',
                      padding: '4px',
                    }}
                  >
                    {sub.active ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteWebhook(sub.id);
                    }}
                    title="Delete"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Delivery history */}
              {expandedId === sub.id && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--liquid-border)' }}>
                  {sub.lastError && (
                    <p style={{ fontSize: '11px', color: '#ef4444', marginBottom: '8px' }}>
                      Last error: {sub.lastError} (failures: {sub.failCount})
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginBottom: '6px',
                    }}
                  >
                    Recent Deliveries
                  </p>
                  {deliveries.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      No deliveries yet
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {deliveries.map(d => (
                        <div
                          key={d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.02)',
                            fontSize: '11px',
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: d.success ? '#22c55e' : '#ef4444',
                            }}
                          />
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {d.event}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {d.statusCode ?? '---'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{d.durationMs}ms</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {new Date(d.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateWebhookForm({
  onCreated,
  onCancel,
}: {
  onCreated: (sub: Subscription, secret: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['analysis.completed']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create');
        return;
      }

      onCreated(data.subscription, data.secret);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '16px',
        background: 'var(--liquid-tint)',
        border: '1px solid var(--liquid-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Endpoint URL
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--liquid-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Events
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_EVENTS.map(event => (
            <label
              key={event}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: events.includes(event)
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${events.includes(event) ? 'rgba(34, 197, 94, 0.2)' : 'var(--liquid-border)'}`,
                cursor: 'pointer',
                fontSize: '11px',
                color: events.includes(event) ? '#22c55e' : 'var(--text-muted)',
              }}
            >
              <input
                type="checkbox"
                checked={events.includes(event)}
                onChange={e => {
                  if (e.target.checked) {
                    setEvents(prev => [...prev, event]);
                  } else {
                    setEvents(prev => prev.filter(ev => ev !== event));
                  }
                }}
                style={{ display: 'none' }}
              />
              {event}
            </label>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || events.length === 0}
          className="btn btn-primary btn-sm flex items-center gap-sm"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          Create Webhook
        </button>
      </div>
    </form>
  );
}
