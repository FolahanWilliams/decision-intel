'use server';

import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-auth';
import { auth } from '@clerk/nextjs/server';
import { logAudit } from '@/lib/audit';

export async function createApiKey(name: string = 'Default Key') {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { key, hash, prefix } = generateApiKey();

    await prisma.apiKey.create({
        data: {
            userId,
            name,
            keyPrefix: prefix,
            keyHash: hash,
        }
    });

    await logAudit({
        action: 'VIEW_DOCUMENT', // Re-using existing action type or adding new one? Let's use generic logging context
        resource: 'ApiKey',
        details: { action: 'CREATED', name }
    });

    // Return the raw key ONLY ONCE. It is never stored.
    return { key, prefix, name };
}

export async function revokeApiKey(keyId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await prisma.apiKey.updateMany({
        where: { id: keyId, userId },
        data: { isActive: false }
    });

    await logAudit({
        action: 'VIEW_DOCUMENT',
        resource: 'ApiKey',
        details: { action: 'REVOKED', keyId }
    });

    return { success: true };
}

export async function listApiKeys() {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.apiKey.findMany({
        where: { userId, isActive: true },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            lastUsed: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
}
