'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BrainCircuit, Bell, Target, FlaskConical } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TabBar } from '@/components/ui/TabBar';
import { AuditsPageContent } from '@/components/audits/AuditsPageContent';
import { NudgesPageContent } from '@/components/nudges/NudgesPageContent';
import { CalibrationContent } from '@/components/calibration/CalibrationContent';
import { ExperimentsContent } from '@/components/experiments/ExperimentsContent';

const TABS = [
  { key: 'audits', label: 'Audits', icon: <BrainCircuit size={15} /> },
  { key: 'nudges', label: 'Nudges', icon: <Bell size={15} /> },
  { key: 'calibration', label: 'Calibration', icon: <Target size={15} /> },
  { key: 'experiments', label: 'Experiments', icon: <FlaskConical size={15} /> },
];

const VALID_TABS = new Set(['audits', 'nudges', 'calibration', 'experiments']);

function DecisionQualityInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab') ?? 'audits';
  const tab = VALID_TABS.has(rawTab) ? rawTab : 'audits';

  return (
    <div>
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 0 }}>
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Decision Quality' }]}
        />
        <div className="page-header">
          <div>
            <h1
              style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}
            >
              <span className="text-gradient">Decision Quality</span>
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 640 }}>
              Audits, nudges, personal calibration, and A/B prompt experiments.
            </p>
          </div>
        </div>
        <TabBar
          tabs={TABS}
          activeTab={tab}
          onTabChange={key =>
            router.replace(`/dashboard/decision-quality?tab=${key}`, { scroll: false })
          }
        />
      </div>
      <div style={{ marginTop: 'var(--spacing-md)' }}>
        {tab === 'audits' && <AuditsPageContent />}
        {tab === 'nudges' && <NudgesPageContent />}
        {tab === 'calibration' && <CalibrationContent />}
        {tab === 'experiments' && <ExperimentsContent />}
      </div>
    </div>
  );
}

export default function DecisionQualityPage() {
  return (
    <ErrorBoundary sectionName="Decision Quality">
      <Suspense fallback={<PageSkeleton />}>
        <DecisionQualityInner />
      </Suspense>
    </ErrorBoundary>
  );
}
