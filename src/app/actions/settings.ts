'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface UserSettingsData {
  emailNotifications: boolean;
  analysisAlerts: boolean;
  weeklyDigest: boolean;
  darkMode: boolean;
  notificationSeverity: 'all' | 'high_critical' | 'critical';
}

const UserSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  analysisAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
  darkMode: z.boolean(),
  notificationSeverity: z.enum(['all', 'high_critical', 'critical']),
});

export async function getUserSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return null;

  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        // Defaults are handled by Prisma schema
      },
    });
  }

  return settings;
}

export async function updateUserSettings(data: UserSettingsData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) throw new Error('Unauthorized');

  // Runtime validation — server actions receive unsanitized client input
  const parsed = UserSettingsSchema.parse(data);

  await prisma.userSettings.upsert({
    where: { userId },
    update: parsed,
    create: {
      userId,
      ...parsed,
    },
  });

  revalidatePath('/dashboard/settings');
  return { success: true };
}
