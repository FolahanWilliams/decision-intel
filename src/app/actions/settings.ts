'use server';

import { auth } from '@clerk/nextjs/server';
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
    const { userId } = await auth();
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
    const { userId } = await auth();
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
