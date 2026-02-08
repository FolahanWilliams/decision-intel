
import { getUserSettings } from '@/app/actions/settings';
import SettingsForm from './SettingsForm';
import { currentUser } from '@clerk/nextjs/server';

export default async function SettingsPage() {
    const settings = await getUserSettings();
    const user = await currentUser();

    const defaultSettings = {
        emailNotifications: true,
        analysisAlerts: true,
        weeklyDigest: false,
        darkMode: true,
        compactView: false
    };

    return (
        <SettingsForm
            initialSettings={settings || defaultSettings}
            userEmail={user?.emailAddresses[0]?.emailAddress}
        />
    );
}
