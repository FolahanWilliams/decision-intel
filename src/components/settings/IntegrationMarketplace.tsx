'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Webhook, Key, Mail, CreditCard, ExternalLink, Check } from 'lucide-react';
import { WebhookManager } from './WebhookManager';

interface SlackStatus {
  connected: boolean;
  teamName?: string;
}

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Real-time decision capture, bias detection nudges, and outcome tracking via Slack channels.',
    icon: MessageSquare,
    color: '#4A154B',
    category: 'Collaboration',
    status: 'available' as const,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Decision capture and nudge delivery via Microsoft Teams channels and chats.',
    icon: MessageSquare,
    color: '#6264A7',
    category: 'Collaboration',
    status: 'coming_soon' as const,
  },
  {
    id: 'webhooks',
    name: 'Outbound Webhooks',
    description: 'Send real-time event notifications to your own endpoints with HMAC-signed payloads.',
    icon: Webhook,
    color: '#22c55e',
    category: 'Developer',
    status: 'available' as const,
  },
  {
    id: 'api_keys',
    name: 'API Keys',
    description: 'Programmatic access to Decision Intel via REST API with scoped permissions.',
    icon: Key,
    color: '#eab308',
    category: 'Developer',
    status: 'available' as const,
  },
  {
    id: 'email',
    name: 'Email Notifications',
    description: 'Analysis completion alerts, weekly digests, and outcome reminders via email.',
    icon: Mail,
    color: '#3b82f6',
    category: 'Notifications',
    status: 'available' as const,
  },
  {
    id: 'stripe',
    name: 'Stripe Billing',
    description: 'Subscription management, usage-based billing, and payment processing.',
    icon: CreditCard,
    color: '#635BFF',
    category: 'Billing',
    status: 'available' as const,
  },
];

export function IntegrationMarketplace() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'webhooks'>('marketplace');
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);

  useEffect(() => {
    fetch('/api/integrations/slack/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSlackStatus({ connected: data.connected, teamName: data.teamName });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
        Integrations
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
        Connect Decision Intel with your existing tools and workflows
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--liquid-border)', paddingBottom: '0' }}>
        {(['marketplace', 'webhooks'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'marketplace' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {INTEGRATIONS.map(integration => {
            const Icon = integration.icon;
            const isSlackConnected = integration.id === 'slack' && slackStatus?.connected;
            const isComingSoon = integration.status === 'coming_soon';

            return (
              <div
                key={integration.id}
                style={{
                  padding: '20px',
                  background: 'var(--liquid-tint)',
                  border: '1px solid var(--liquid-border)',
                  borderRadius: 'var(--radius-lg)',
                  backdropFilter: 'blur(var(--liquid-blur))',
                  opacity: isComingSoon ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: `${integration.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} style={{ color: integration.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {integration.name}
                      </h3>
                      {isSlackConnected && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          <Check size={10} /> Connected
                        </span>
                      )}
                      {isComingSoon && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {integration.category}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {integration.description}
                </p>

                {!isComingSoon && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {integration.id === 'slack' && !isSlackConnected && (
                      <a
                        href="/api/integrations/slack/oauth"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        Connect <ExternalLink size={12} />
                      </a>
                    )}
                    {integration.id === 'slack' && isSlackConnected && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Connected to {slackStatus?.teamName}
                      </span>
                    )}
                    {integration.id === 'webhooks' && (
                      <button
                        onClick={() => setActiveTab('webhooks')}
                        className="btn btn-secondary btn-sm"
                      >
                        Manage Webhooks
                      </button>
                    )}
                    {integration.id === 'api_keys' && (
                      <a
                        href="/dashboard/settings"
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        Manage Keys
                      </a>
                    )}
                    {integration.id === 'email' && (
                      <a
                        href="/dashboard/settings"
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        Configure
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'webhooks' && <WebhookManager />}
    </div>
  );
}
