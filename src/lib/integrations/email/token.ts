import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Generate a unique email forwarding token for a user.
 * The token is URL-safe and 16 characters long.
 */
export async function generateEmailToken(userId: string): Promise<string> {
  const token = randomBytes(12).toString('base64url'); // URL-safe, 16 chars
  await prisma.userSettings.upsert({
    where: { userId },
    update: { emailForwardToken: token },
    create: { userId, emailForwardToken: token },
  });
  return token;
}

/**
 * Look up a userId from an email forwarding token.
 * Returns null if no user is found.
 */
export async function resolveUserFromToken(token: string): Promise<string | null> {
  const settings = await prisma.userSettings.findFirst({
    where: { emailForwardToken: token },
    select: { userId: true },
  });
  return settings?.userId ?? null;
}

/**
 * Build the full forwarding email address for a given token.
 */
export function getForwardingAddress(token: string): string {
  const domain = process.env.EMAIL_INBOUND_DOMAIN || 'in.decision-intel.com';
  return `analyze+${token}@${domain}`;
}
