'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Webhook,
  Key,
  Mail,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Terminal,
  Loader2,
  Unplug,
} from 'lucide-react';
import { WebhookManager } from './WebhookManager';
import type { SlackInstallationStatus } from '@/types/human-audit';

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Real-time decision capture, bias detection nudges, and outcome tracking via Slack channels.',
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
    description:
      'Send real-time event notifications to your own endpoints with HMAC-signed payloads.',
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

const SLASH_COMMANDS = [
  { command: '/di analyze', description: 'Analyze a decision in the current channel' },
  { command: '/di prior', description: 'Submit a decision prior' },
  { command: '/outcome', description: 'Report a decision outcome' },
  { command: '/di status', description: 'Check integration status' },
  { command: '/di help', description: 'Show available commands' },
];

function SlackDetailSection({
  slackStatus,
  slackLoading,
  slackError,
  onDisconnect,
  disconnecting,
}: {
  slackStatus: SlackInstallationStatus | null;
  slackLoading: boolean;
  slackError: string | null;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const isConnected = slackStatus?.connected === true;
  const isTokenExpired = slackStatus?.status === 'token_expired';

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          padding: '24px',
          background: 'var(--liquid-tint)',
          border: '1px solid var(--liquid-border)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(var(--liquid-blur))',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#4A154B15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={22} style={{ color: '#4A154B' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Slack Integration
              </h3>
              {/* Status indicator */}
              {slackLoading ? (
                <Loader2
                  size={14}
                  style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color:
                      isConnected && !isTokenExpired
                        ? '#22c55e'
                        : isTokenExpired
                          ? '#f59e0b'
                          : 'var(--text-muted)',
                    background:
                      isConnected && !isTokenExpired
                        ? 'rgba(34, 197, 94, 0.1)'
                        : isTokenExpired
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(255, 255, 255, 0.06)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background:
                        isConnected && !isTokenExpired
                          ? '#22c55e'
                          : isTokenExpired
                            ? '#f59e0b'
                            : '#6b7280',
                      display: 'inline-block',
                    }}
                  />
                  {isConnected && !isTokenExpired
                    ? 'Connected'
                    : isTokenExpired
                      ? 'Token Expired'
                      : 'Disconnected'}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Collaboration
            </span>
          </div>
        </div>

        {/* Error state */}
        {slackError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: '#f87171',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            {slackError}
          </div>
        )}

        {/* Token expired warning */}
        {isTokenExpired && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: '#fbbf24',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            Your Slack token has expired. Please reconnect to restore the integration.
          </div>
        )}

        {/* Connected state */}
        {isConnected && !isTokenExpired && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  Workspace
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {slackStatus.teamName || 'Unknown'}
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  Connected
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {slackStatus.installedAt
                    ? new Date(slackStatus.installedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </div>
              </div>
            </div>

            {/* Scopes */}
            {slackStatus.scopes && slackStatus.scopes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  Granted Scopes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {slackStatus.scopes.map(scope => (
                    <span
                      key={scope}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect button */}
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: disconnecting ? 'not-allowed' : 'pointer',
                opacity: disconnecting ? 0.6 : 1,
              }}
            >
              {disconnecting ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Unplug size={12} />
              )}
              {disconnecting ? 'Disconnecting...' : 'Disconnect Workspace'}
            </button>
          </div>
        )}

        {/* Disconnected / expired state - show connect button */}
        {(!isConnected || isTokenExpired) && !slackLoading && (
          <div style={{ marginBottom: '20px' }}>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '14px',
              }}
            >
              {isTokenExpired
                ? 'Reconnect your Slack workspace to resume decision capture and bias detection nudges.'
                : 'Connect your Slack workspace to enable real-time decision capture, bias detection nudges, and outcome tracking.'}
            </p>
            <a
              href="/api/integrations/slack/oauth"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                background: '#4A154B',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              {isTokenExpired ? 'Reconnect Slack' : 'Connect Slack'} <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* Slash commands documentation */}
        <div
          style={{
            borderTop: '1px solid var(--liquid-border)',
            paddingTop: '18px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Available Slash Commands
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SLASH_COMMANDS.map(cmd => (
              <div
                key={cmd.command}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <code
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#a78bfa',
                    whiteSpace: 'nowrap',
                    minWidth: '110px',
                  }}
                >
                  {cmd.command}
                </code>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {cmd.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function IntegrationMarketplace() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'webhooks'>('marketplace');
  const [slackStatus, setSlackStatus] = useState<SlackInstallationStatus | null>(null);
  const [slackLoading, setSlackLoading] = useState(true);
  const [slackError, setSlackError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchSlackStatus = useCallback(async () => {
    try {
      setSlackLoading(true);
      setSlackError(null);
      const res = await fetch('/api/integrations/slack/status');
      if (res.ok) {
        const data: SlackInstallationStatus = await res.json();
        setSlackStatus(data);
      } else if (res.status === 401) {
        setSlackStatus({ connected: false });
      } else {
        setSlackError('Failed to load Slack integration status.');
        setSlackStatus({ connected: false });
      }
    } catch {
      setSlackError('Could not reach the server. Please try again.');
      setSlackStatus({ connected: false });
    } finally {
      setSlackLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlackStatus();
  }, [fetchSlackStatus]);

  const handleDisconnect = useCallback(async () => {
    if (!slackStatus?.teamId) return;
    if (!window.confirm('Disconnect this Slack workspace? Decision capture will stop immediately.'))
      return;

    setDisconnecting(true);
    setSlackError(null);
    try {
      const res = await fetch('/api/integrations/slack/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: slackStatus.teamId }),
      });
      if (res.ok) {
        setSlackStatus({ connected: false });
      } else {
        const data = await res.json().catch(() => null);
        setSlackError(data?.error || 'Failed to disconnect Slack workspace.');
      }
    } catch {
      setSlackError('Could not reach the server. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  }, [slackStatus?.teamId]);

  // Filter out Slack from the grid cards since it gets its own detail section
  const otherIntegrations = INTEGRATIONS.filter(i => i.id !== 'slack');

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1100px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        Integrations
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        Connect Decision Intel with your existing tools and workflows
      </p>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--liquid-border)',
          paddingBottom: '0',
        }}
      >
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
              borderBottom:
                activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
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
        <>
          {/* Slack detail section */}
          <SlackDetailSection
            slackStatus={slackStatus}
            slackLoading={slackLoading}
            slackError={slackError}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
          />

          {/* Other integrations grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              marginTop: '16px',
            }}
          >
            {otherIntegrations.map(integration => {
              const Icon = integration.icon;
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
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
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {integration.name}
                        </h3>
                        {isComingSoon && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {integration.category}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                    }}
                  >
                    {integration.description}
                  </p>

                  {!isComingSoon && (
                    <div style={{ display: 'flex', gap: '8px' }}>
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
        </>
      )}

      {activeTab === 'webhooks' && <WebhookManager />}
    </div>
  );
}
