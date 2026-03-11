'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface UserSettingsData {
    emailNotifications: boolean;
    analysisAlerts: boolean;
    weeklyDigest: boolean;
    darkMode: boolean;
    compactView: boolean;
}

export async function getUserSettings() {
    const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
    if (!userId) return null;

    let settings = await prisma.userSettings.findUnique({
        where: { userId }
    });

    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {
                userId,
                // Defaults are handled by Prisma schema
            }
        });
    }

    return settings;
}

export async function updateUserSettings(data: UserSettingsData) {
    const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: {
            userId,
            ...data
        }
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
}
