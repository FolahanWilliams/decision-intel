'use client';

import { useState, useEffect } from 'react';
import { DecisionKnowledgeGraph } from '@/components/visualizations/DecisionKnowledgeGraph';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Network } from 'lucide-react';

export default function DecisionGraphPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(90);

  // Fetch user's org
  useEffect(() => {
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const id = data?.orgId || data?.organization?.id;
        if (id) setOrgId(id);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Decision Graph' },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-400" />
            Decision Knowledge Graph
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Explore how decisions connect, cascade, and influence each other across your organization.
          </p>
        </div>

        <select
          value={timeRange}
          onChange={e => setTimeRange(parseInt(e.target.value, 10))}
          className="text-sm px-3 py-1.5 rounded bg-white/5 border border-white/10 text-zinc-300"
        >
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <ErrorBoundary>
        {orgId ? (
          <DecisionKnowledgeGraph orgId={orgId} timeRange={timeRange} />
        ) : (
          <div className="card">
            <div className="card-body flex items-center justify-center h-64 text-zinc-500">
              <p>Join an organization to view the decision graph.</p>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
