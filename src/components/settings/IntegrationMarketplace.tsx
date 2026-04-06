'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
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
  Hash,
  BellRing,
  Activity,
  Check,
  ChevronRight,
  Brain,
  Save,
  HardDrive,
  FolderOpen,
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
    id: 'google_drive',
    name: 'Google Drive',
    description:
      'Auto-analyze documents from Google Drive. Connect your Drive, select folders to watch, and new documents are analyzed automatically.',
    icon: HardDrive,
    color: '#4285F4',
    category: 'Data Sources',
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
  { command: '/di analyze', description: 'Audit the most recent decision in this channel' },
  { command: '/di score <text>', description: 'Quick inline bias check on any text' },
  { command: '/di brief', description: 'Org intelligence briefing — top risks and maturity' },
  { command: '/di prior', description: 'Submit a blind prior for the active decision room' },
  { command: '/di outcome', description: 'Report a decision outcome (success/failure)' },
  { command: '/di status', description: 'Calibration level, trends, and pending outcomes' },
  { command: '/di help', description: 'Show all available commands' },
];

const swrFetcher = (url: string) => fetch(url).then(r => (r.ok ? r.json() : null));

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  numMembers: number;
  isMember: boolean;
}

function SlackChannelConfig() {
  const { data: channels } = useSWR<{ channels: SlackChannel[] }>(
    '/api/integrations/slack/channels',
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: config, mutate: mutateConfig } = useSWR<{
    monitoredChannels: string[];
    nudgeFrequency: string;
  }>('/api/integrations/slack/config', swrFetcher, { revalidateOnFocus: false });

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [nudgeFrequency, setNudgeFrequency] = useState('normal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setSelectedChannels(config.monitoredChannels || []);
      setNudgeFrequency(config.nudgeFrequency || 'normal');
    }
  }, [config]);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId) ? prev.filter(c => c !== channelId) : [...prev, channelId]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/integrations/slack/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitoredChannels: selectedChannels, nudgeFrequency }),
      });
      if (res.ok) {
        setSaved(true);
        mutateConfig();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const channelList = channels?.channels || [];
  const hasChanges =
    config &&
    (JSON.stringify(selectedChannels.sort()) !==
      JSON.stringify((config.monitoredChannels || []).sort()) ||
      nudgeFrequency !== (config.nudgeFrequency || 'normal'));

  return (
    <div
      style={{ borderTop: '1px solid var(--liquid-border)', paddingTop: '18px', marginTop: '4px' }}
    >
      {/* Channel Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <Hash size={14} style={{ color: 'var(--text-muted)' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Monitored Channels
        </h4>
      </div>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginBottom: '10px',
          lineHeight: 1.5,
        }}
      >
        Select which channels the bot monitors for decisions. Leave empty to monitor all channels.
      </p>

      {channelList.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '16px',
            maxHeight: 140,
            overflowY: 'auto',
          }}
        >
          {channelList.map(ch => {
            const isSelected = selectedChannels.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected
                    ? '1px solid rgba(22, 163, 74, 0.4)'
                    : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected && <Check size={10} />}
                <span>{ch.isPrivate ? '🔒' : '#'}</span>
                {ch.name}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            fontStyle: 'italic',
          }}
        >
          Loading channels...
        </div>
      )}

      {/* Nudge Frequency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <BellRing size={14} style={{ color: 'var(--text-muted)' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Nudge Frequency
        </h4>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { value: 'normal', label: 'Normal', desc: 'All warning + critical nudges' },
          { value: 'quiet', label: 'Quiet', desc: 'Critical biases only' },
          { value: 'off', label: 'Off', desc: 'No nudges (still detects decisions)' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setNudgeFrequency(opt.value);
              setSaved(false);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              border:
                nudgeFrequency === opt.value
                  ? '1px solid rgba(22, 163, 74, 0.4)'
                  : '1px solid var(--border-color)',
              background:
                nudgeFrequency === opt.value ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-card)',
              color:
                nudgeFrequency === opt.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{opt.label}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--accent-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            marginBottom: '4px',
          }}
        >
          {saving ? (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Save size={12} />
          )}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      )}
      {saved && (
        <span style={{ fontSize: '11px', color: '#22c55e', marginLeft: '8px' }}>✓ Saved</span>
      )}
    </div>
  );
}

interface SlackActivityData {
  recentDecisions: Array<{
    id: string;
    content: string;
    type: string | null;
    score: number | null;
    createdAt: string;
  }>;
  recentNudges: Array<{
    id: string;
    biasType: string;
    severity: string;
    wasHelpful: boolean | null;
    createdAt: string;
  }>;
  summary: {
    decisionsThisWeek: number;
    nudgesThisWeek: number;
    outcomesThisWeek: number;
    nudgeHelpfulRate: number | null;
  };
}

function SlackActivityFeed() {
  const { data } = useSWR<SlackActivityData>('/api/integrations/slack/activity', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const { summary } = data;
  const hasActivity = summary.decisionsThisWeek > 0 || summary.nudgesThisWeek > 0;

  return (
    <div
      style={{ borderTop: '1px solid var(--liquid-border)', paddingTop: '18px', marginTop: '4px' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: expanded ? '12px' : '0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          padding: 0,
          width: '100%',
        }}
      >
        <Activity size={14} style={{ color: 'var(--text-muted)' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 600, flex: 1, textAlign: 'left' }}>
          Bot Activity
        </h4>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>{summary.decisionsThisWeek} decisions</span>
          <span>{summary.nudgesThisWeek} nudges</span>
          <span>{summary.outcomesThisWeek} outcomes</span>
          <span style={{ fontSize: '10px' }}>this week</span>
          <ChevronRight
            size={14}
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </div>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary stats */}
          {summary.nudgeHelpfulRate !== null && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                padding: '8px 10px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Nudge helpfulness rate:{' '}
              <strong style={{ color: '#22c55e' }}>{summary.nudgeHelpfulRate}%</strong>
            </div>
          )}

          {/* Recent decisions */}
          {data.recentDecisions.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Recent Decisions
              </div>
              {data.recentDecisions.map(d => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    marginBottom: '4px',
                  }}
                >
                  <Brain size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.content}
                  </span>
                  {d.score !== null && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#eab308' : '#ef4444',
                      }}
                    >
                      {d.score}/100
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent nudges */}
          {data.recentNudges.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Recent Nudges
              </div>
              {data.recentNudges.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    marginBottom: '4px',
                  }}
                >
                  <BellRing
                    size={12}
                    style={{
                      color: n.severity === 'critical' ? '#ef4444' : '#eab308',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                    {n.biasType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!hasActivity && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                padding: '8px 0',
              }}
            >
              No bot activity this week. Start discussing decisions in monitored Slack channels.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GoogleDriveFolder {
  id: string;
  name: string;
  parents: string[] | null;
}

interface GoogleDriveConfig {
  connected: boolean;
  driveEmail?: string;
  monitoredFolders?: string[];
  lastSyncAt?: string;
  scopes?: string[];
  createdAt?: string;
}

function GoogleDriveFolderConfig() {
  const { data: foldersData } = useSWR<{ folders: GoogleDriveFolder[] }>(
    '/api/integrations/google/folders',
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: config, mutate: mutateConfig } = useSWR<GoogleDriveConfig>(
    '/api/integrations/google/config',
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config?.monitoredFolders) {
      setSelectedFolders(config.monitoredFolders);
    }
  }, [config]);

  const toggleFolder = (folderId: string) => {
    setSelectedFolders(prev =>
      prev.includes(folderId) ? prev.filter(f => f !== folderId) : [...prev, folderId]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/integrations/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitoredFolders: selectedFolders }),
      });
      if (res.ok) {
        setSaved(true);
        mutateConfig();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const folderList = foldersData?.folders || [];
  const hasChanges =
    config &&
    JSON.stringify(selectedFolders.sort()) !==
      JSON.stringify((config.monitoredFolders || []).sort());

  return (
    <div
      style={{ borderTop: '1px solid var(--liquid-border)', paddingTop: '18px', marginTop: '4px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <FolderOpen size={14} style={{ color: 'var(--text-muted)' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Monitored Folders
        </h4>
      </div>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginBottom: '10px',
          lineHeight: 1.5,
        }}
      >
        Select which Google Drive folders to watch. New or modified files in these folders are
        automatically downloaded and analyzed every 10 minutes. Supported: PDF, DOCX, XLSX, CSV,
        PPTX, Google Docs, Sheets, and Slides.
      </p>

      {folderList.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '16px',
            maxHeight: 160,
            overflowY: 'auto',
          }}
        >
          {folderList.map(folder => {
            const isSelected = selectedFolders.includes(folder.id);
            return (
              <button
                key={folder.id}
                onClick={() => toggleFolder(folder.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected
                    ? '1px solid rgba(66, 133, 244, 0.4)'
                    : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(66, 133, 244, 0.15)' : 'var(--bg-card)',
                  color: isSelected ? '#4285F4' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected && <Check size={10} />}
                <FolderOpen size={11} />
                {folder.name}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            fontStyle: 'italic',
          }}
        >
          Loading folders...
        </div>
      )}

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            background: '#4285F4',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            marginBottom: '4px',
          }}
        >
          {saving ? (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Save size={12} />
          )}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      )}
      {saved && (
        <span style={{ fontSize: '11px', color: '#22c55e', marginLeft: '8px' }}>Saved</span>
      )}
    </div>
  );
}

function GoogleDriveDetailSection({
  driveConfig,
  driveLoading,
  onDisconnect,
  disconnecting,
}: {
  driveConfig: GoogleDriveConfig | null;
  driveLoading: boolean;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const isConnected = driveConfig?.connected === true;

  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--liquid-tint)',
        border: '1px solid var(--liquid-border)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(var(--liquid-blur))',
        marginTop: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: '#4285F415',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HardDrive size={22} style={{ color: '#4285F4' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Google Drive
            </h3>
            {driveLoading ? (
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
                  color: isConnected ? '#22c55e' : 'var(--text-muted)',
                  background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-card-hover)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isConnected ? '#22c55e' : '#6b7280',
                    display: 'inline-block',
                  }}
                />
                {isConnected ? 'Connected' : 'Disconnected'}
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
            Data Sources
          </span>
        </div>
      </div>

      {/* Connected state */}
      {isConnected && (
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
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
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
                Drive Account
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {driveConfig?.driveEmail || 'Unknown'}
              </div>
            </div>
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
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
                Last Sync
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {driveConfig?.lastSyncAt
                  ? new Date(driveConfig.lastSyncAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </div>
            </div>
          </div>

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
            {disconnecting ? 'Disconnecting...' : 'Disconnect Google Drive'}
          </button>
        </div>
      )}

      {/* Disconnected state */}
      {!isConnected && !driveLoading && (
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '14px',
            }}
          >
            Connect your Google Drive to automatically analyze new documents added to selected
            folders.
          </p>
          <a
            href="/api/integrations/google/oauth"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              background: '#4285F4',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            Connect Google Drive <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Folder Configuration (only when connected) */}
      {isConnected && <GoogleDriveFolderConfig />}
    </div>
  );
}

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
  const [testNudgeLoading, setTestNudgeLoading] = useState(false);

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
                          : 'var(--bg-card-hover)',
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
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
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
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
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
                        background: 'var(--bg-card-hover)',
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
            <button
              onClick={async () => {
                setTestNudgeLoading(true);
                try {
                  const res = await fetch('/api/integrations/slack/test-nudge', { method: 'POST' });
                  if (res.ok) {
                    // Show success feedback
                  }
                } catch {
                  // Silently handle error
                } finally {
                  setTestNudgeLoading(false);
                }
              }}
              disabled={testNudgeLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                cursor: testNudgeLoading ? 'not-allowed' : 'pointer',
                opacity: testNudgeLoading ? 0.6 : 1,
              }}
            >
              {testNudgeLoading && (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              )}
              {testNudgeLoading ? 'Sending...' : 'Send Test Nudge'}
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

        {/* Channel Configuration (only when connected) */}
        {isConnected && !isTokenExpired && <SlackChannelConfig />}

        {/* Bot Activity Feed (only when connected) */}
        {isConnected && !isTokenExpired && <SlackActivityFeed />}

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
                  background: 'var(--bg-card)',
                }}
              >
                <code
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
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

  // Google Drive state
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveDisconnecting, setDriveDisconnecting] = useState(false);

  const fetchDriveConfig = useCallback(async () => {
    try {
      setDriveLoading(true);
      const res = await fetch('/api/integrations/google/config');
      if (res.ok) {
        const data: GoogleDriveConfig = await res.json();
        setDriveConfig(data);
      } else {
        setDriveConfig({ connected: false });
      }
    } catch {
      setDriveConfig({ connected: false });
    } finally {
      setDriveLoading(false);
    }
  }, []);

  const handleDriveDisconnect = useCallback(async () => {
    if (!window.confirm('Disconnect Google Drive? Auto-analysis of new documents will stop.'))
      return;

    setDriveDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/google/config', { method: 'DELETE' });
      if (res.ok) {
        setDriveConfig({ connected: false });
      }
    } catch {
      // silent
    } finally {
      setDriveDisconnecting(false);
    }
  }, []);

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
    fetchDriveConfig();
  }, [fetchSlackStatus, fetchDriveConfig]);

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

  // Filter out Slack and Google Drive from the grid cards since they get their own detail sections
  const otherIntegrations = INTEGRATIONS.filter(i => i.id !== 'slack' && i.id !== 'google_drive');

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

          {/* Google Drive detail section */}
          <GoogleDriveDetailSection
            driveConfig={driveConfig}
            driveLoading={driveLoading}
            onDisconnect={handleDriveDisconnect}
            disconnecting={driveDisconnecting}
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
