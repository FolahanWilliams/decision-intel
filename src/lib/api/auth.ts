/**
 * Public API key authentication middleware.
 *
 * API keys use the format `di_live_<32 hex chars>`. Only the SHA-256 hash
 * is stored in the database — the raw key is shown exactly once at creation.
 */

import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ApiAuth');

const API_KEY_PREFIX = 'di_live_';

export interface ApiKeyContext {
  userId: string;
  orgId: string | null;
  keyId: string;
  scopes: string[];
  rateLimit: number;
}

export interface ValidateResult {
  success: true;
  context: ApiKeyContext;
}

export interface ValidateError {
  success: false;
  error: string;
  status: number;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

export interface GenerateApiKeyOptions {
  userId: string;
  orgId?: string | null;
  name: string;
  scopes: string[];
  rateLimit?: number;
  expiresAt?: Date | null;
}

export interface GenerateApiKeyResult {
  key: string;
  keyId: string;
  name: string;
  scopes: string[];
  expiresAt?: string;
  /** @deprecated use key */
  rawKey?: string;
  /** @deprecated */
  keyPrefix?: string;
}

export async function generateApiKey(
  userIdOrOptions: string | GenerateApiKeyOptions,
  orgId?: string | null,
  name?: string,
  scopes?: string[]
): Promise<GenerateApiKeyResult> {
  let opts: GenerateApiKeyOptions;
  if (typeof userIdOrOptions === 'object') {
    opts = userIdOrOptions;
  } else {
    // Legacy positional-argument signature
    opts = {
      userId: userIdOrOptions,
      orgId: orgId ?? null,
      name: name ?? '',
      scopes: scopes ?? [],
    };
  }

  const rawHex = randomBytes(16).toString('hex'); // 32 hex chars
  const rawKey = `${API_KEY_PREFIX}${rawHex}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 16); // "di_live_" + first 8 hex chars

  const record = await prisma.apiKey.create({
    data: {
      userId: opts.userId,
      orgId: opts.orgId ?? null,
      name: opts.name,
      keyHash,
      keyPrefix,
      scopes: opts.scopes,
      ...(opts.rateLimit !== undefined && { rateLimit: opts.rateLimit }),
      ...(opts.expiresAt !== undefined && opts.expiresAt !== null && { expiresAt: opts.expiresAt }),
    },
  });

  log.info(`API key created: ${record.id} for user ${opts.userId} (prefix: ${keyPrefix})`);

  return {
    key: rawKey,
    rawKey,
    keyId: record.id,
    keyPrefix,
    name: record.name,
    scopes: record.scopes,
    ...(record.expiresAt && { expiresAt: record.expiresAt.toISOString() }),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function validateApiKey(
  request: NextRequest
): Promise<ValidateResult | ValidateError> {
  // Extract bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'API key required',
      status: 401,
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return {
      success: false,
      error: 'Invalid API key format',
      status: 401,
    };
  }

  const keyHash = hashApiKey(rawKey);

  // Look up the key — schema-drift safe (ApiKey table may not exist yet)
  let apiKey;
  try {
    apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
    });
  } catch (dbError: unknown) {
    const code = (dbError as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.error('ApiKey table missing (schema drift). Run prisma migrate.');
      return {
        success: false,
        error: 'API keys not available — schema migration required.',
        status: 503,
      };
    }
    throw dbError;
  }

  if (!apiKey) {
    return { success: false, error: 'Invalid API key', status: 401 };
  }

  // Check revocation
  if (apiKey.revokedAt) {
    return { success: false, error: 'API key has been revoked', status: 401 };
  }

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { success: false, error: 'API key has expired', status: 401 };
  }

  // Rate limiting — use per-key identifier
  const rateLimitResult = await checkRateLimit(`apikey:${apiKey.id}`, '/api/v1', {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: apiKey.rateLimit,
    failMode: 'closed',
  });

  const allowed =
    (rateLimitResult as { allowed?: boolean }).allowed ?? rateLimitResult.success;
  if (!allowed) {
    const retryAfter =
      (rateLimitResult as { retryAfter?: number }).retryAfter ??
      (rateLimitResult.reset - Math.floor(Date.now() / 1000));
    return {
      success: false,
      error: 'Rate limit exceeded',
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    };
  }

  // Update lastUsedAt (fire-and-forget)
  void Promise.resolve(
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
  ).catch((err: unknown) => {
    log.warn(
      'Failed to update lastUsedAt: ' + (err instanceof Error ? err.message : String(err))
    );
  });

  return {
    success: true,
    context: {
      userId: apiKey.userId,
      orgId: apiKey.orgId,
      keyId: apiKey.id,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
    },
  };
}

// ---------------------------------------------------------------------------
// Scope check helper
// ---------------------------------------------------------------------------

export function requireScope(context: ApiKeyContext, scope: string): ValidateError | null {
  if (!context.scopes.includes(scope)) {
    return {
      success: false,
      error: `API key missing required scope: "${scope}". Current scopes: [${context.scopes.join(', ')}]`,
      status: 403,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

export async function revokeApiKey(keyId: string): Promise<boolean> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  return true;
}

export async function listApiKeys(
  userId: string,
  orgId?: string
): Promise<
  Array<{
    id: string;
    name: string;
    scopes: string[];
    rateLimit: number;
    lastUsedAt: Date | null;
    createdAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
  }>
> {
  return prisma.apiKey.findMany({
    where: {
      userId,
      ...(orgId !== undefined && { orgId }),
    },
    select: {
      id: true,
      name: true,
      scopes: true,
      rateLimit: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getApiKeyStats(
  keyId: string,
  from?: Date,
  to?: Date
): Promise<{ totalRequests: number; averageResponseTime: number | null }> {
  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
      : {};

  const [count, agg] = await Promise.all([
    prisma.apiKeyUsage.count({
      where: { keyId, ...dateFilter },
    }),
    prisma.apiKeyUsage.aggregate({
      where: { keyId, ...dateFilter },
      _avg: { responseTime: true },
    }),
  ]);

  return {
    totalRequests: count,
    averageResponseTime: agg?._avg?.responseTime ?? null,
  };
}
