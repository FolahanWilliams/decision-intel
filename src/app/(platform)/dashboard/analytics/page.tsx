'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BarChart3, Dna } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { InsightsPageContent } from '@/components/insights/InsightsPageContent';
import { DecisionDNAPageContent } from '@/components/dna/DecisionDNAPageContent';

const TABS = [
  { key: 'trends', label: 'Trends & Insights', icon: <BarChart3 size={15} /> },
  { key: 'dna', label: 'Decision DNA', icon: <Dna size={15} /> },
];

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') === 'dna' ? 'dna' : 'trends';

  return (
    <div>
      <div
        className="container"
        style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 0 }}
      >
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics' },
          ]}
        />
        <header className="mb-lg">
          <div className="flex items-center gap-md mb-sm">
            <BarChart3 size={28} style={{ color: 'var(--accent-primary)' }} />
            <h1>Analytics</h1>
          </div>
          <p className="text-muted">
            Trends, insights, and your personal decision profile
          </p>
        </header>
        <TabBar
          tabs={TABS}
          activeTab={view}
          onTabChange={(key) =>
            router.replace(`/dashboard/analytics?view=${key}`, { scroll: false })
          }
        />
      </div>
      <div style={{ marginTop: 'var(--spacing-md)' }}>
        {view === 'trends' ? <InsightsPageContent /> : <DecisionDNAPageContent />}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
