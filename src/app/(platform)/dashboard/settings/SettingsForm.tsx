'use client';

import { useState, useTransition, useEffect } from 'react';
import {
    Settings, Bell, User, Shield, Moon,
    Save, CheckCircle, Loader2, Trash2, AlertTriangle
} from 'lucide-react';
import { updateUserSettings, UserSettingsData } from '@/app/actions/settings';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastContext';

interface SettingsFormProps {
    initialSettings: UserSettingsData;
    userEmail?: string | null;
}

export default function SettingsForm({ initialSettings, userEmail }: SettingsFormProps) {
    // Notification preferences
    const [emailNotifications, setEmailNotifications] = useState(initialSettings.emailNotifications);
    const [analysisAlerts, setAnalysisAlerts] = useState(initialSettings.analysisAlerts);
    const [weeklyDigest, setWeeklyDigest] = useState(initialSettings.weeklyDigest);

    // Display preferences
    const [darkMode, setDarkMode] = useState(initialSettings.darkMode);
    const [compactView, setCompactView] = useState(initialSettings.compactView);

    // Save state
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const { setTheme } = useTheme();
    const router = useRouter();
    const { showToast } = useToast();

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Sync theme with state
    useEffect(() => {
        setTheme(darkMode ? 'dark' : 'light');
    }, [darkMode, setTheme]);

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
            router.push('/sign-in');
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
                    compactView
                });
                setSaved(true);
                showToast('Settings saved successfully', 'success');
                setTimeout(() => setSaved(false), 2000);
            } catch (error) {
                console.error("Failed to save settings:", error);
                showToast('Failed to save settings', 'error');
            }
        });
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
                                {userEmail || 'Connected via Clerk'}
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
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="btn btn-primary flex items-center gap-sm"
                >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Danger Zone */}
            <div className="card mt-xl animate-fade-in" style={{ animationDelay: '0.5s', borderColor: 'var(--error)' }}>
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
                                Permanently removes all your documents, analyses, audit logs, and settings. This cannot be undone.
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="btn flex items-center gap-sm"
                            style={{ background: 'transparent', borderColor: 'var(--error)', color: 'var(--error)', flexShrink: 0, marginLeft: '24px' }}
                        >
                            <Trash2 size={14} />
                            Delete my data
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                    aria-describedby="delete-modal-desc"
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}
                    onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteError(null); } }}
                    onKeyDown={(e) => { if (e.key === 'Escape' && !deleting) { setShowDeleteModal(false); setDeleteError(null); } }}
                >
                    <div className="card" style={{ maxWidth: 440, width: '90%', borderColor: 'var(--error)' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 id="delete-modal-title" className="flex items-center gap-sm" style={{ color: 'var(--error)' }}>
                                <AlertTriangle size={20} />
                                Delete all account data?
                            </h3>
                        </div>
                        <div className="card-body">
                            <p id="delete-modal-desc" className="text-sm mb-lg" style={{ lineHeight: 1.6 }}>
                                This will permanently erase <strong>all your documents, analyses, audit logs, and settings</strong>. You will be signed out immediately. This action <strong>cannot be undone</strong>.
                            </p>
                            {deleteError && (
                                <p className="text-sm mb-lg" role="alert" style={{ color: 'var(--error)' }}>
                                    {deleteError}
                                </p>
                            )}
                            <div className="flex items-center justify-end gap-sm">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
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
    const id = label.replace(/\s+/g, '-').toLowerCase();
    return (
        <div className="flex items-center justify-between">
            <div>
                <div id={`${id}-label`} style={{ fontWeight: 500, marginBottom: '2px' }}>{label}</div>
                <div id={`${id}-desc`} className="text-xs text-muted">{description}</div>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                aria-labelledby={`${id}-label`}
                aria-describedby={`${id}-desc`}
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
