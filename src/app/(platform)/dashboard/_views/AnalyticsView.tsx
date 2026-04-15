'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const DecisionPerformance = dynamic(
  () => import('@/components/visualizations/DecisionPerformance'),
  { ssr: false }
);
const EnhancedDashboardCharts = dynamic(
  () =>
    import('@/components/visualizations/EnhancedDashboardCharts').then(m => ({
      default: m.EnhancedDashboardCharts,
    })),
  { ssr: false }
);

type DashboardDoc = {
  status: string;
  uploadedAt: string;
  analyses?: { overallScore?: number; createdAt?: string }[];
};

type RiskSummary = {
  total: number;
  high: number;
  medium: number;
  low: number;
  avg: number;
};

interface AnalyticsViewProps {
  uploadedDocs: DashboardDoc[];
  riskSummary: RiskSummary;
}

export default function AnalyticsView({ uploadedDocs, riskSummary }: AnalyticsViewProps) {
  return (
    <div className="flex flex-col gap-xl">
      <ErrorBoundary sectionName="Decision Performance">
        <DecisionPerformance />
      </ErrorBoundary>
      {uploadedDocs.length > 0 && (
        <ErrorBoundary sectionName="Dashboard Charts">
          <EnhancedDashboardCharts
            riskDistribution={{
              highRisk: riskSummary.high,
              mediumRisk: riskSummary.medium,
              lowRisk: riskSummary.low,
            }}
            scoreTrend={uploadedDocs
              .filter(d => d.status === 'complete' && d.analyses?.[0]?.overallScore != null)
              .map(d => ({
                date: d.analyses?.[0]?.createdAt ?? d.uploadedAt,
                score: d.analyses?.[0]?.overallScore ?? 0,
              }))
              .sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )}
            topBiases={[]}
            totalAnalyzed={riskSummary.total}
            avgScore={riskSummary.avg}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
