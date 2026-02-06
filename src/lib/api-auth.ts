import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generates a new API Key.
 * Format: dk_live_[32_random_hex_chars]
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
    const randomBytes = crypto.randomBytes(24).toString('hex'); // 48 chars
    const key = `dk_live_${randomBytes}`; // 8 + 48 = 56 chars
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 16); // "dk_live_" + first 8 chars

    return { key, hash, prefix };
}

/**
 * Validates an API Key from a request header.
 * Returns the userId if valid, or null.
 */
export async function validateApiKey(rawKey: string): Promise<string | null> {
    if (!rawKey || !rawKey.startsWith('dk_live_')) return null;

    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findFirst({
        where: {
            keyHash: hash,
            isActive: true
        }
    });

    if (apiKey) {
        // Async update last used (fire and forget)
        prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() }
        }).catch(console.error);

        return apiKey.userId;
    }

    return null;
}
