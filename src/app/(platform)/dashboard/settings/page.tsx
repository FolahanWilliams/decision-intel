import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getUserSettings } from '@/app/actions/settings';
import SettingsForm from './SettingsForm';
import { createClient } from '@/utils/supabase/server';

export default async function SettingsPage() {
  const settings = await getUserSettings();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultSettings = {
    emailNotifications: true,
    analysisAlerts: true,
    weeklyDigest: false,
    darkMode: true,
    notificationSeverity: 'all' as const,
  };

  const initialSettings = settings
    ? {
        emailNotifications: settings.emailNotifications,
        analysisAlerts: settings.analysisAlerts,
        weeklyDigest: settings.weeklyDigest,
        darkMode: settings.darkMode,
        notificationSeverity: (settings.notificationSeverity || 'all') as
          | 'all'
          | 'high_critical'
          | 'critical',
      }
    : defaultSettings;

  return (
    <ErrorBoundary sectionName="Settings">
      <SettingsForm initialSettings={initialSettings} userEmail={user?.email} />
    </ErrorBoundary>
  );
}
