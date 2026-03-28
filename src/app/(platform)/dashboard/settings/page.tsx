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
  };

  return (
    <ErrorBoundary sectionName="Settings">
      <SettingsForm initialSettings={settings || defaultSettings} userEmail={user?.email} />
    </ErrorBoundary>
  );
}
