/**
 * API Key Management — POST / GET / DELETE
 *
 * These endpoints require a Supabase session (cookie auth), NOT an API key.
 * Users manage their API keys through the dashboard, then use those keys
 * for programmatic access to /api/v1/* endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api/auth';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ApiKeysRoute');

const VALID_SCOPES = ['analyze', 'documents', 'outcomes', 'insights'] as const;
type Scope = (typeof VALID_SCOPES)[number];

// Maximum number of active (non-revoked) keys per user
const MAX_KEYS_PER_USER = 10;

// ---------------------------------------------------------------------------
// POST — Create a new API key
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { name, scopes } = body as { name?: string; scopes?: string[] };

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '"name" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: '"name" must be 100 characters or fewer.' },
        { status: 400 }
      );
    }

    // Validate scopes
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: `"scopes" must be a non-empty array. Valid scopes: [${VALID_SCOPES.join(', ')}]` },
        { status: 400 }
      );
    }
    const invalidScopes = scopes.filter((s): s is string => !VALID_SCOPES.includes(s as Scope));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid scopes: [${invalidScopes.join(', ')}]. Valid scopes: [${VALID_SCOPES.join(', ')}]`,
        },
        { status: 400 }
      );
    }

    // Check key limit
    let activeKeyCount: number;
    try {
      activeKeyCount = await prisma.apiKey.count({
        where: { userId: user.id, revokedAt: null },
      });
    } catch (dbErr: unknown) {
      const code = (dbErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'API keys not available — database migration required.' },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    if (activeKeyCount >= MAX_KEYS_PER_USER) {
      return NextResponse.json(
        {
          error: `Maximum of ${MAX_KEYS_PER_USER} active API keys allowed. Revoke an existing key first.`,
        },
        { status: 409 }
      );
    }

    // Resolve org membership
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift — TeamMember may not exist
    }

    const {
      key: rawKey,
      keyId,
      keyPrefix,
    } = await generateApiKey({
      userId: user.id,
      orgId,
      name: name.trim(),
      scopes: scopes as string[],
    });

    log.info(`API key ${keyId} created by user ${user.id}`);

    return NextResponse.json(
      {
        id: keyId,
        name: name.trim(),
        keyPrefix,
        rawKey, // Only returned once — user must save it
        scopes,
        rateLimit: 100,
        createdAt: new Date().toISOString(),
        _warning: 'Save this key now — it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — List user's API keys (redacted)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let keys;
    try {
      keys = await prisma.apiKey.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          lastUsedAt: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true,
        },
      });
    } catch (dbErr: unknown) {
      const code = (dbErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'API keys not available — database migration required.' },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    return NextResponse.json({ keys });
  } catch (error) {
    log.error('Error listing API keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Revoke an API key by ID
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    if (!keyId) {
      return NextResponse.json({ error: '"id" query parameter is required.' }, { status: 400 });
    }

    let apiKey;
    try {
      apiKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId: user.id },
      });
    } catch (dbErr: unknown) {
      const code = (dbErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json(
          { error: 'API keys not available — database migration required.' },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found.' }, { status: 404 });
    }

    if (apiKey.revokedAt) {
      return NextResponse.json({ error: 'API key is already revoked.' }, { status: 409 });
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    log.info(`API key ${keyId} revoked by user ${user.id}`);

    return NextResponse.json({ message: 'API key revoked successfully.', id: keyId });
  } catch (error) {
    log.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
