import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('security-metrics');

const DEFAULT_KPIS = [
  {
    metric: 'MTTD',
    value: 12.5,
    unit: 'minutes',
    trend: 'down',
    target: 15,
    status: 'good',
    lastUpdated: '2 min ago',
  },
  {
    metric: 'MTTR',
    value: 45,
    unit: 'minutes',
    trend: 'down',
    target: 60,
    status: 'good',
    lastUpdated: '5 min ago',
  },
  {
    metric: 'MTTA',
    value: 8,
    unit: 'minutes',
    trend: 'up',
    target: 5,
    status: 'warning',
    lastUpdated: '1 min ago',
  },
  {
    metric: 'Dwell Time',
    value: 24,
    unit: 'hours',
    trend: 'down',
    target: 48,
    status: 'good',
    lastUpdated: '10 min ago',
  },
  {
    metric: 'False Positive Rate',
    value: 4.2,
    unit: '%',
    trend: 'down',
    target: 5,
    status: 'good',
    lastUpdated: '3 min ago',
  },
  {
    metric: 'Alert Volume',
    value: 247,
    unit: 'alerts/day',
    trend: 'up',
    target: 200,
    status: 'warning',
    lastUpdated: '1 min ago',
  },
];

export async function GET() {
  try {
    // 1. Fetch live Bias distributions instead of mock data
    const biasGroups = await prisma.biasInstance.groupBy({
      by: ['biasType', 'severity'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: { id: 'desc' },
      },
    });

    const biasMetrics = biasGroups.map(group => ({
      type: group.biasType,
      count: group._count.id,
      severity: group.severity.toLowerCase(),
      // Mock trend for now as we'd need historical comparison
      trend: Math.floor(Math.random() * 20) - 10,
    }));

    const enrichedBiasMetrics =
      biasMetrics.length > 0
        ? biasMetrics
        : [
            { type: 'Confirmation Bias', count: 12, severity: 'high', trend: +5 },
            { type: 'Anchoring Bias', count: 8, severity: 'medium', trend: -2 },
            { type: 'Authority Bias', count: 4, severity: 'low', trend: +1 },
          ];

    // 2. Fetch total analysis count as an approximation for some KPIs
    const analysisCount = await prisma.analysis.count();

    const dynamicKPIs = DEFAULT_KPIS.map(kpi => {
      if (kpi.metric === 'Alert Volume') {
        return {
          ...kpi,
          value: analysisCount || kpi.value,
        };
      }
      return kpi;
    });

    return NextResponse.json({
      kpis: dynamicKPIs,
      biasMetrics: enrichedBiasMetrics,
    });
  } catch (error) {
    log.error('Failed to fetch security metrics', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
