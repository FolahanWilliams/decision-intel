import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/prisma';
import { getCacheStats } from '@/lib/utils/cache';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('HealthRoute');

export async function GET() {
  try {
    // Test database connection
    const dbHealthy = await testDatabaseConnection();

    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const cacheStats = await getCacheStats();

    return NextResponse.json({
      status: 'healthy',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: cacheStats
        ? { backend: 'postgres', ...cacheStats }
        : { backend: 'postgres', status: 'unavailable' },
    });
  } catch (error) {
    log.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
