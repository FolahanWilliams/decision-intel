'use client';

import { useState } from 'react';
import {
    Settings, Bell, Key, User, Shield, Moon,
    Save, CheckCircle, AlertTriangle
} from 'lucide-react';

import { ApiKeyList } from './ApiKeyList';

export default function SettingsPage() {
    // Notification preferences
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [analysisAlerts, setAnalysisAlerts] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);

    // Display preferences
    const [darkMode, setDarkMode] = useState(true);
    const [compactView, setCompactView] = useState(false);

    // Save state
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // In a real app, this would save to backend
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', maxWidth: 800 }}>
            {/* Header */}
            <header className="mb-xl">
                <div className="flex items-center gap-md mb-sm">
                    <Settings size={28} style={{ color: 'var(--accent-primary)' }} />
                    <h1>Settings</h1>
                </div>
                <p className="text-muted">
                    Manage your account preferences and notifications
                </p>
            </header>

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
                            <label className="text-xs text-muted uppercase tracking-wider mb-xs block">Email</label>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)'
                            }}>
                                Connected via Clerk
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted uppercase tracking-wider mb-xs block">Plan</label>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <span style={{
                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '11px',
                                    fontWeight: 600
                                }}>PRO</span>
                                Professional Plan
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-header">
                    <h3 className="flex items-center gap-sm">
                        <Bell size={18} />
                        Notification Preferences
                    </h3>
                </div>
                <div className="card-body">
                    <div className="flex flex-col gap-lg">
                        <ToggleOption
                            label="Email Notifications"
                            description="Receive email updates about your analyses"
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                        />
                        <ToggleOption
                            label="Analysis Alerts"
                            description="Get notified when document analysis completes"
                            checked={analysisAlerts}
                            onChange={setAnalysisAlerts}
                        />
                        <ToggleOption
                            label="Weekly Digest"
                            description="Receive a weekly summary of your risk assessments"
                            checked={weeklyDigest}
                            onChange={setWeeklyDigest}
                        />
                    </div>
                </div>
            </div>

            {/* Display Preferences */}
            <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
                        />
                        <ToggleOption
                            label="Compact View"
                            description="Show more documents per page"
                            checked={compactView}
                            onChange={setCompactView}
                        />
                    </div>
                </div>
            </div>

            {/* API Configuration */}
            <div className="card mb-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="card-header justify-between">
                    <h3 className="flex items-center gap-sm">
                        <Key size={18} />
                        Developer API Keys
                    </h3>
                    <button
                        onClick={async () => {
                            const result = await import('@/app/actions/api-keys').then(m => m.createApiKey());
                            // In a real app, use a proper modal. For now, prompt/alert is a quick way to show "Here is your key"
                            window.prompt("SAVE THIS KEY NOW! It will not be shown again.", result.key);
                            // Refresh list
                            window.location.reload();
                        }}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '12px' }}
                    >
                        Generate New Key
                    </button>
                </div>
                <div className="card-body">
                    <div className="mb-lg">
                        <p className="text-xs text-muted mb-md">
                            Use these keys to authenticate via the <code>x-api-key</code> header.
                            Keys are hashed and cannot be recovered if lost.
                        </p>

                        <ApiKeyList />
                    </div>

                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div className="flex items-center gap-sm mb-sm">
                            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                            <span className="text-xs font-bold uppercase" style={{ color: 'var(--warning)' }}>Security Note</span>
                        </div>
                        <p className="text-xs text-muted">
                            Do not share these keys. If a key is compromised, revoke it immediately.
                        </p>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="card-header">
                    <h3 className="flex items-center gap-sm">
                        <Shield size={18} />
                        Security
                    </h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-2 gap-lg">
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div className="flex items-center gap-sm mb-sm">
                                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>Two-Factor Auth</span>
                            </div>
                            <p className="text-xs text-muted">Enabled via Clerk</p>
                        </div>
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div className="flex items-center gap-sm mb-sm">
                                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>Data Encryption</span>
                            </div>
                            <p className="text-xs text-muted">AES-256 at rest</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-md">
                {saved && (
                    <span className="flex items-center gap-sm text-sm" style={{ color: 'var(--success)' }}>
                        <CheckCircle size={16} />
                        Settings saved!
                    </span>
                )}
                <button onClick={handleSave} className="btn btn-primary flex items-center gap-sm">
                    <Save size={16} />
                    Save Changes
                </button>
            </div>
        </div>
    );
}

function ToggleOption({
    label,
    description,
    checked,
    onChange
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div style={{ fontWeight: 500, marginBottom: '2px' }}>{label}</div>
                <div className="text-xs text-muted">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    background: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: checked ? 25 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
            </button>
        </div>
    );
}
