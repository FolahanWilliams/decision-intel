/**
 * DecisionNetworkPanel — the 7th deliverable tab ("Decision network").
 *
 * Mounts the production 3D DecisionKnowledgeGraph scoped to THIS document's
 * analysis: the analysis sits at the centre (highlightNodeId) and the graph
 * shows its immediate connections — the biases it carries, the people who
 * touched it, prior decisions it resembles, and any outcome. Lazy-loaded
 * (the WebGL/reagraph bundle is heavy) and only mounted when the user opens
 * this tab, so it never costs anything on the other slides.
 *
 * orgId is resolved the same way /dashboard/decision-graph does (GET /api/team);
 * null = personal scope.
 */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Network } from 'lucide-react';

const DecisionKnowledgeGraph = dynamic(
  () => import('@/components/visualizations/DecisionKnowledgeGraph').then(m => m.DecisionKnowledgeGraph),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 540,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          fontSize: 13,
        }}
      >
        <Loader2 size={16} className="animate-spin" />
        Loading the decision network…
      </div>
    ),
  }
);

export function DecisionNetworkPanel({ analysisId }: { analysisId: string }) {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const id = data?.orgId || data?.organization?.id;
        if (id && !cancelled) setOrgId(id);
      })
      .catch(() => {
        // Non-fatal: fall back to personal scope (orgId stays null).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 6,
          }}
        >
          <Network size={13} />
          Decision network
        </div>
        <h3
          style={{
            fontSize: 'clamp(18px, 2.4vw, 22px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
            textWrap: 'balance',
          }}
        >
          How this decision connects to the rest
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '52ch' }}>
          This audit sits at the centre. The graph maps its live connections — the biases it
          carries, the people who shaped it, prior decisions it resembles, and the outcome once
          it lands. Drag to orbit; click a node to inspect it.
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: 540,
          width: '100%',
          minWidth: 0,
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        <DecisionKnowledgeGraph orgId={orgId} timeRange={365} highlightNodeId={analysisId} />
      </div>
    </section>
  );
}
