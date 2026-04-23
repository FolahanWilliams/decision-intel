'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Settings,
  Bell,
  User,
  Shield,
  Moon,
  Save,
  CheckCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Unplug,
  Plug,
  PlayCircle,
} from 'lucide-react';
import { updateUserSettings, UserSettingsData } from '@/app/actions/settings';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/EnhancedToast';
import { createClientLogger } from '@/lib/utils/logger';
import type { SlackInstallationStatus } from '@/types/human-audit';
import { PersonaManager } from './PersonaManager';
import { BillingSection } from '@/components/ui/BillingSection';
import { ApiKeysSection } from '@/components/ui/ApiKeysSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const IntegrationsTabContent = dynamic(
  () =>
    import('@/components/settings/IntegrationMarketplace').then(m => ({
      default: m.IntegrationMarketplace,
    })),
  {
    loading: () => (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading integrations...
      </div>
    ),
  }
);

const ComplianceTabContent = dynamic(
  () => import('@/app/(platform)/dashboard/settings/compliance/page'),
  {
    loading: () => (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading compliance...
      </div>
    ),
  }
);

const AuditLogTabContent = dynamic(
  () => import('@/components/settings/AuditLogInline').then(m => ({ default: m.AuditLogInline })),
  {
    loading: () => (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading audit log...
      </div>
    ),
  }
);

const log = createClientLogger('Settings');

interface SettingsFormProps {
  initialSettings: UserSettingsData;
  userEmail?: string | null;
}

export default function SettingsForm({ initialSettings, userEmail }: SettingsFormProps) {
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(initialSettings.emailNotifications);
  const [analysisAlerts, setAnalysisAlerts] = useState(initialSettings.analysisAlerts);
  const [weeklyDigest, setWeeklyDigest] = useState(initialSettings.weeklyDigest);
  const [notificationSeverity, setNotificationSeverity] = useState(
    initialSettings.notificationSeverity
  );
  const [emailConfigured, setEmailConfigured] = useState(true); // assume configured until proven otherwise

  // Display preferences
  const [darkMode, setDarkMode] = useState(initialSettings.darkMode);

  // Save state
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();

  // Slack integration state
  const [slackStatus, setSlackStatus] = useState<SlackInstallationStatus | null>(null);
  const [slackLoading, setSlackLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const searchParams = useSearchParams();

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Onboarding replay state
  const [replayingTour, setReplayingTour] = useState(false);

  const handleReplayOnboarding = async () => {
    setReplayingTour(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: false, onboardingTourSeen: false }),
      });
      if (!res.ok) throw new Error('Failed to reset onboarding');
      localStorage.setItem('decision-intel-launch-tour', 'pending');
      showToast('Starting onboarding — redirecting to dashboard', 'success');
      router.push('/dashboard');
    } catch (err) {
      log.error('Failed to replay onboarding:', err);
      showToast('Failed to replay onboarding', 'error');
      setReplayingTour(false);
    }
  };

  // Sync theme with state
  useEffect(() => {
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode, setTheme]);

  // Fetch Slack integration status
  const fetchSlackStatus = useCallback(async () => {
    try {
      setSlackLoading(true);
      const res = await fetch('/api/integrations/slack/status');
      if (res.ok) {
        const data: SlackInstallationStatus = await res.json();
        setSlackStatus(data);
      }
    } catch (err) {
      log.error('Failed to fetch Slack status:', err);
    } finally {
      setSlackLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlackStatus();
  }, [fetchSlackStatus]);

  // Check email delivery configuration
  useEffect(() => {
    fetch('/api/notifications/status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && typeof data.emailConfigured === 'boolean') {
          setEmailConfigured(data.emailConfigured);
        }
      })
      .catch(() => {}); // Non-critical — leave as assumed-configured
  }, []);

  // Show toast on OAuth redirect
  useEffect(() => {
    const slackParam = searchParams.get('slack');
    if (slackParam === 'connected') {
      showToast('Slack workspace connected successfully!', 'success');
      fetchSlackStatus();
    } else if (slackParam === 'denied') {
      showToast('Slack authorization was cancelled', 'info');
    } else if (slackParam === 'error') {
      showToast('Failed to connect Slack workspace', 'error');
    }
  }, [searchParams, showToast, fetchSlackStatus]);

  const handleSlackDisconnect = async () => {
    if (!slackStatus?.teamId) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/slack/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: slackStatus.teamId }),
      });
      if (res.ok) {
        setSlackStatus({ connected: false });
        showToast('Slack workspace disconnected', 'success');
      } else {
        showToast('Failed to disconnect Slack', 'error');
      }
    } catch {
      showToast('Failed to disconnect Slack', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete account data');
      }
      // Sign out and redirect to home
      router.push('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserSettings({
          emailNotifications,
          analysisAlerts,
          weeklyDigest,
          darkMode,
          notificationSeverity,
        });
        setSaved(true);
        showToast('Settings saved successfully', 'success');
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        log.error('Failed to save settings:', error);
        showToast('Failed to save settings', 'error');
      }
    });
  };

  const rawTab = searchParams.get('tab') || 'account';
  // Legacy: "connections" tab was merged into "integrations" — remap silently
  // so old Slack/email deep-links still land on a valid tab.
  const activeTab = rawTab === 'connections' ? 'integrations' : rawTab;

  return (
    <div
      className="container"
      style={{
        paddingBottom: 'var(--spacing-2xl)',
        maxWidth: 800,
      }}
    >
      {/* Header — shared .page-header rhythm */}
      <header className="page-header">
        <div>
          <h1>
            <span className="text-gradient">Settings</span>
          </h1>
          <p className="page-subtitle">Manage your account preferences and notifications</p>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={tab => router.replace(`/dashboard/settings?tab=${tab}`, { scroll: false })}
      >
        <TabsList className="tab-chips mb-lg">
          <TabsTrigger value="account" className="tab-chip">
            <User size={14} /> Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="tab-chip">
            <Bell size={14} /> Preferences
          </TabsTrigger>
          <TabsTrigger value="integrations" className="tab-chip">
            <Plug size={14} /> Integrations
          </TabsTrigger>
          <TabsTrigger value="compliance" className="tab-chip">
            <Shield size={14} /> Compliance
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="tab-chip">
            <Settings size={14} /> Audit Log
          </TabsTrigger>
        </TabsList>

        {/* ── Account Tab ──────────────────────────── */}
        <TabsContent value="account">
          {/* Account Information */}
          <div className="card mb-lg animate-fade-in">
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <User size={18} />
                Account Information
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-lg">
                <div>
                  <label className="text-xs text-muted mb-xs font-medium block">Email</label>
                  <div
                    style={{
                      padding: 'var(--spacing-md)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {userEmail || 'Connected via Google'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted mb-xs font-medium block">
                    Plan &amp; Billing
                  </label>
                  <BillingSection />
                </div>
              </div>
            </div>
          </div>

          {/* Email Forwarding */}
          <EmailForwardingSection />

          {/* Security */}
          <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <Shield size={18} />
                Security
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-lg">
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-sm mb-sm">
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                      Two-Factor Auth
                    </span>
                  </div>
                  <p className="text-xs text-muted">Managed by Supabase</p>
                </div>
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-sm mb-sm">
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                      Data Encryption
                    </span>
                  </div>
                  <p className="text-xs text-muted">AES-256 at rest</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Tour */}
          <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <PlayCircle size={18} />
                Product Tour
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>Replay onboarding</div>
                  <div className="text-xs text-muted">
                    Rerun the welcome modal and guided product tour. Useful if you skipped it or
                    want a refresher on the core flow.
                  </div>
                </div>
                <button
                  onClick={handleReplayOnboarding}
                  disabled={replayingTour}
                  className="btn btn-primary flex items-center gap-sm"
                  style={{ flexShrink: 0, marginLeft: '24px' }}
                >
                  {replayingTour ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <PlayCircle size={14} />
                  )}
                  {replayingTour ? 'Starting…' : 'Replay tour'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            className="card mt-xl animate-fade-in"
            style={{ animationDelay: '0.2s', borderColor: 'var(--error)' }}
          >
            <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.3)' }}>
              <h3 className="flex items-center gap-sm" style={{ color: 'var(--error)' }}>
                <AlertTriangle size={18} />
                Danger Zone
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>Delete all my data</div>
                  <div className="text-xs text-muted">
                    Permanently removes all your documents, analyses, audit logs, and settings. This
                    cannot be undone.
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn flex items-center gap-sm"
                  style={{
                    background: 'transparent',
                    borderColor: 'var(--error)',
                    color: 'var(--error)',
                    flexShrink: 0,
                    marginLeft: '24px',
                  }}
                >
                  <Trash2 size={14} />
                  Delete my data
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Preferences Tab ──────────────────────────── */}
        <TabsContent value="preferences">
          {/* Notification Preferences */}
          <div className="card mb-lg animate-fade-in">
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <Bell size={18} />
                Notification Preferences
              </h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col gap-lg">
                {!emailConfigured && (
                  <div className="flex items-start gap-sm rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Email delivery is not configured. Toggling these settings will save your
                      preferences, but no emails will be sent until the email provider is set up.
                    </span>
                  </div>
                )}
                <ToggleOption
                  label="Email Notifications"
                  description="Receive email updates about your analyses"
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                  disabled={isPending}
                />
                <ToggleOption
                  label="Analysis Alerts"
                  description="Get notified when document analysis completes"
                  checked={analysisAlerts}
                  onChange={setAnalysisAlerts}
                  disabled={isPending}
                />
                <ToggleOption
                  label="Weekly Digest"
                  description="Receive a weekly summary of your risk assessments"
                  checked={weeklyDigest}
                  onChange={setWeeklyDigest}
                  disabled={isPending}
                />

                {/* Notification Severity Threshold */}
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>Severity Threshold</div>
                    <div className="text-xs text-muted">
                      Only receive notifications at or above this severity level
                    </div>
                  </div>
                  <select
                    value={notificationSeverity}
                    onChange={e =>
                      setNotificationSeverity(
                        e.target.value as 'all' | 'high_critical' | 'critical'
                      )
                    }
                    disabled={isPending}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    <option value="all">All notifications</option>
                    <option value="high_critical">High &amp; Critical only</option>
                    <option value="critical">Critical only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <Moon size={18} />
                Display Preferences
              </h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col gap-lg">
                <ToggleOption
                  label="Dark Mode"
                  description="Use dark theme (default)"
                  checked={darkMode}
                  onChange={setDarkMode}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Boardroom Personas */}
          <PersonaManager />

          {/* Save Button */}
          <div className="flex items-center justify-end gap-md mt-lg">
            {saved && (
              <span
                className="flex items-center gap-sm text-sm"
                style={{ color: 'var(--success)' }}
              >
                <CheckCircle size={16} />
                Settings saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn btn-primary flex items-center gap-sm"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </TabsContent>

        {/* ── Integrations Tab (merged Connections + Marketplace) ────── */}
        <TabsContent value="integrations">
          {/* Integrations */}
          <div className="card mb-xl animate-fade-in">
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <MessageSquare size={18} />
                Integrations
              </h3>
            </div>
            <div className="card-body">
              <div
                style={{
                  padding: 'var(--spacing-lg)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--liquid-border)',
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: slackStatus?.connected
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'var(--bg-card-hover)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MessageSquare
                        size={20}
                        style={{
                          color: slackStatus?.connected
                            ? 'var(--success)'
                            : 'var(--text-secondary)',
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>Slack</div>
                      {slackLoading ? (
                        <div className="text-xs text-muted">Checking connection...</div>
                      ) : slackStatus?.connected ? (
                        <div className="text-xs" style={{ color: 'var(--success)' }}>
                          Connected to <strong>{slackStatus.teamName}</strong>
                          {slackStatus.installedAt && (
                            <span className="text-muted">
                              {' '}
                              &middot; since{' '}
                              {new Date(slackStatus.installedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted">
                          Connect your Slack workspace to audit decisions in real-time
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    {slackStatus?.connected ? (
                      <button
                        onClick={handleSlackDisconnect}
                        disabled={disconnecting}
                        className="btn flex items-center gap-sm"
                        style={{
                          background: 'transparent',
                          borderColor: 'var(--error)',
                          color: 'var(--error)',
                          fontSize: '13px',
                        }}
                      >
                        {disconnecting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Unplug size={14} />
                        )}
                        {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/slack/oauth"
                        className="btn btn-primary flex items-center gap-sm"
                        style={{ fontSize: '13px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} />
                        Add to Slack
                      </a>
                    )}
                  </div>
                </div>

                {slackStatus?.connected && slackStatus.scopes && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-md)',
                      paddingTop: 'var(--spacing-md)',
                      borderTop: '1px solid var(--liquid-border)',
                    }}
                  >
                    <div
                      className="text-xs text-muted"
                      style={{ marginBottom: '6px', fontWeight: 600 }}
                    >
                      Permissions granted
                    </div>
                    <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                      {slackStatus.scopes.map(scope => (
                        <span
                          key={scope}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted" style={{ marginTop: 'var(--spacing-md)' }}>
                When connected, Decision Intel monitors decision-related messages in your channels
                and provides real-time cognitive bias nudges. All content is anonymized before
                analysis.
              </p>
            </div>
          </div>

          {/* API Keys */}
          <ApiKeysSection />

          {/* Full integration marketplace (connect, disconnect, manage scopes) */}
          <div className="mt-xl">
            <IntegrationsTabContent />
          </div>
        </TabsContent>

        {/* ── Compliance Tab ──────────────────────── */}
        <TabsContent value="compliance">
          <ComplianceTabContent />
        </TabsContent>

        {/* ── Audit Log Tab ──────────────────────── */}
        <TabsContent value="audit-log">
          <AuditLogTabContent />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--overlay-heavy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Escape' && !deleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 440, width: '90%', borderColor: 'var(--error)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header">
              <h3
                id="delete-modal-title"
                className="flex items-center gap-sm"
                style={{ color: 'var(--error)' }}
              >
                <AlertTriangle size={20} />
                Delete all account data?
              </h3>
            </div>
            <div className="card-body">
              <p id="delete-modal-desc" className="text-sm mb-lg" style={{ lineHeight: 1.6 }}>
                This will permanently erase{' '}
                <strong>all your documents, analyses, audit logs, and settings</strong>. You will be
                signed out immediately. This action <strong>cannot be undone</strong>.
              </p>
              {deleteError && (
                <p className="text-sm mb-lg" role="alert" style={{ color: 'var(--error)' }}>
                  {deleteError}
                </p>
              )}
              <div className="flex items-center justify-end gap-sm">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  className="btn btn-ghost"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn flex items-center gap-sm"
                  style={{ background: 'var(--error)', color: '#fff', borderColor: 'var(--error)' }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailForwardingSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const domain = process.env.NEXT_PUBLIC_EMAIL_INBOUND_DOMAIN || 'in.decision-intel.com';

  useEffect(() => {
    fetch('/api/integrations/email/token')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.token) setToken(data.token);
      })
      .catch(err => log.warn('email/token fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/integrations/email/token', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } catch {
      /* ignore */
    } finally {
      setRegenerating(false);
    }
  };

  const forwardingAddress = token ? `analyze+${token}@${domain}` : null;

  const handleCopy = () => {
    if (forwardingAddress) {
      navigator.clipboard.writeText(forwardingAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.05s' }}>
      <div className="card-header">
        <h3 className="flex items-center gap-sm">
          <MessageSquare size={18} />
          Email Forwarding
        </h3>
      </div>
      <div className="card-body">
        <p className="text-xs text-muted mb-md" style={{ lineHeight: 1.6 }}>
          Forward documents or paste decision text to your unique email address. Attachments (PDF,
          DOCX, XLSX, CSV, PPTX) are auto-analyzed. No attachments? The email body is analyzed
          instead.
        </p>
        {loading ? (
          <div className="text-xs text-muted">Loading...</div>
        ) : forwardingAddress ? (
          <div className="flex flex-col gap-sm">
            <div
              className="flex items-center gap-sm"
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <code
                className="text-sm flex-1"
                style={{ color: 'var(--accent-primary)', wordBreak: 'break-all' }}
              >
                {forwardingAddress}
              </code>
              <button
                onClick={handleCopy}
                className="text-xs font-medium"
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: copied ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: copied ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={regenerating}
              className="text-xs text-muted"
              style={{
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                textAlign: 'left',
                padding: 0,
              }}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate address'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={regenerating}
            className="text-sm font-medium"
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              cursor: regenerating ? 'wait' : 'pointer',
            }}
          >
            {regenerating ? 'Generating...' : 'Generate Forwarding Address'}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="flex items-center justify-between">
      <div>
        <div id={`${id}-label`} style={{ fontWeight: 500, marginBottom: '2px' }}>
          {label}
        </div>
        <div id={`${id}-desc`} className="text-xs text-muted">
          {description}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          background: checked ? '#FFFFFF' : 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: checked ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            position: 'absolute',
            top: 2,
            left: checked ? 24 : 2,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}
