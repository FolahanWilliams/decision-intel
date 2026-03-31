import { NextResponse } from 'next/server';
import { testDatabaseConnection, getPoolStats, prisma } from '@/lib/prisma';
import { getCacheStats } from '@/lib/utils/cache';
import { createLogger } from '@/lib/utils/logger';
import { getOptionalEnvVar } from '@/lib/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

const log = createLogger('HealthRoute');

// Short-lived cache for expensive health checks (LLM ping).
// On serverless this only helps within a single warm instance, which is fine —
// it prevents burst-cost when multiple health probes hit the same instance.
const healthCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Check LLM API availability
 */
async function checkLLMHealth(): Promise<{ status: string; model?: string; error?: string }> {
  const cached = healthCache.get('llm');
  if (cached && cached.expires > Date.now()) {
    return cached.data as { status: string; model?: string; error?: string };
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { status: 'misconfigured', error: 'Missing API key' };
    }

    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Lightweight check - just verify model is accessible
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });

    const health = {
      status: 'healthy',
      model: modelName,
    };

    healthCache.set('llm', { data: health, expires: Date.now() + CACHE_TTL });
    return health;
  } catch (error) {
    const health = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthCache.set('llm', { data: health, expires: Date.now() + 60000 }); // Cache errors for 1 minute
    return health;
  }
}

/**
 * Check Supabase Storage availability
 */
async function checkStorageHealth(): Promise<{ status: string; error?: string }> {
  try {
    // Check if storage URL is configured
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!storageUrl) {
      return { status: 'misconfigured', error: 'Missing storage URL' };
    }

    // Simple connectivity check
    const response = await fetch(`${storageUrl}/storage/v1/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    if (response && response.ok) {
      return { status: 'healthy' };
    }

    return { status: 'degraded', error: 'Storage not responding' };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check for schema drift between Prisma and database
 */
async function checkSchemaDrift(): Promise<{
  status: string;
  drift?: boolean;
  missing?: string[];
  extra?: string[];
}> {
  try {
    // Check critical tables
    const tables = ['Analysis', 'Document', 'BiasInstance', 'FailedAnalysis'];
    const driftReport: { missing: string[]; extra: string[] } = {
      missing: [],
      extra: [],
    };

    for (const table of tables) {
      const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${table}
        AND table_schema = 'public'
      `;

      const dbColumns = new Set(result.map(r => r.column_name));

      // Define expected columns for each table (simplified check)
      const expectedColumns: Record<string, string[]> = {
        Analysis: [
          'id',
          'documentId',
          'overallScore',
          'noiseScore',
          'summary',
          'version',
          'promptVersionId',
        ],
        Document: ['id', 'userId', 'filename', 'content', 'status'],
        BiasInstance: ['id', 'analysisId', 'biasType', 'severity'],
        FailedAnalysis: ['id', 'documentId', 'userId', 'error', 'retryCount'],
      };

      const expected = expectedColumns[table] || [];

      // Check for missing columns
      for (const col of expected) {
        if (!dbColumns.has(col)) {
          driftReport.missing.push(`${table}.${col}`);
        }
      }

      // Check for critical new columns that might indicate schema ahead
      if (table === 'Analysis' && dbColumns.has('version') && !dbColumns.has('promptVersionId')) {
        log.warn(`Schema drift detected: ${table} has version but missing promptVersionId`);
      }
    }

    const hasDrift = driftReport.missing.length > 0 || driftReport.extra.length > 0;

    return {
      status: hasDrift ? 'drift_detected' : 'in_sync',
      drift: hasDrift,
      ...(hasDrift && { missing: driftReport.missing, extra: driftReport.extra }),
    };
  } catch (error) {
    log.error('Schema drift check failed:', error);
    return {
      status: 'check_failed',
      drift: undefined,
    };
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Parallel health checks
    const [dbHealthy, poolStats, cacheStats, llmHealth, storageHealth, schemaDrift] =
      await Promise.all([
        testDatabaseConnection(),
        getPoolStats(),
        getCacheStats(),
        checkLLMHealth(),
        checkStorageHealth(),
        checkSchemaDrift(),
      ]);

    // Determine overall health status
    const criticalServicesHealthy = dbHealthy;
    const hasWarnings =
      llmHealth.status !== 'healthy' || storageHealth.status !== 'healthy' || schemaDrift.drift;

    const overallStatus = !criticalServicesHealthy ? 'error' : hasWarnings ? 'degraded' : 'healthy';

    // Return 503 only if critical services are down
    const statusCode = !criticalServicesHealthy ? 503 : 200;

    const response = {
      status: overallStatus,
      message: criticalServicesHealthy
        ? hasWarnings
          ? 'Some services degraded'
          : 'All systems operational'
        : 'Critical service failure',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          poolStats,
        },
        cache: cacheStats
          ? { status: 'healthy', backend: 'postgres', ...cacheStats }
          : { status: 'unavailable', backend: 'postgres' },
        llm: llmHealth,
        storage: storageHealth,
        schemaDrift,
      },
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overallStatus,
      },
    });
  } catch (error) {
    log.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
