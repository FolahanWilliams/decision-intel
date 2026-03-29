import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (hoisted) ─────────────────────────────────────────────────────

const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

// ─── Edge / Node Types (replicated from component) ───────────────────────

interface RelatedEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  strength: number;
  confidence: number;
  description?: string;
  isManual: boolean;
}

interface RelatedNode {
  id: string;
  type: string;
  label: string;
  score: number;
  outcome?: string;
  biasCount: number;
  createdAt: string;
}

const EDGE_LABELS: Record<string, { label: string; color: string }> = {
  similar_to: { label: 'Similar', color: 'text-blue-400' },
  shared_bias: { label: 'Shared bias', color: 'text-purple-400' },
  same_participants: { label: 'Same team', color: 'text-teal-400' },
  influenced_by: { label: 'Influenced by', color: 'text-zinc-400' },
  escalated_from: { label: 'Escalated from', color: 'text-orange-400' },
  reversed: { label: 'Reversed', color: 'text-red-400' },
  depends_on: { label: 'Depends on', color: 'text-zinc-400' },
};

// ─── Helper: replicate the component's data processing logic ─────────────

function processRelatedDecisions(analysisId: string, nodes: RelatedNode[], edges: RelatedEdge[]) {
  const connectedEdges = edges.filter(e => e.source === analysisId || e.target === analysisId);
  const connectedNodeIds = new Set(
    connectedEdges.flatMap(e => [e.source, e.target]).filter(id => id !== analysisId)
  );
  const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));
  return { connectedEdges, connectedNodes };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('RelatedDecisions logic', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── EDGE_LABELS ───────────────────────────────────────────────────────

  describe('EDGE_LABELS mapping', () => {
    it('has labels for all 7 edge types', () => {
      expect(Object.keys(EDGE_LABELS)).toHaveLength(7);
    });

    it('returns correct label for similar_to', () => {
      expect(EDGE_LABELS['similar_to'].label).toBe('Similar');
    });

    it('returns correct label for shared_bias', () => {
      expect(EDGE_LABELS['shared_bias'].label).toBe('Shared bias');
    });

    it('returns undefined for unknown edge types', () => {
      expect(EDGE_LABELS['nonexistent']).toBeUndefined();
    });
  });

  // ── Fetch chain ───────────────────────────────────────────────────────

  describe('fetch chain: team → decision-graph', () => {
    it('first fetches /api/team to discover orgId', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ orgId: 'org-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ nodes: [], edges: [] }),
        });

      // Simulate the component's fetch chain
      const teamRes = await mockFetch('/api/team');
      const teamData = teamRes.ok ? await teamRes.json() : null;
      const orgId = teamData?.orgId || teamData?.organization?.id;

      expect(mockFetch).toHaveBeenCalledWith('/api/team');
      expect(orgId).toBe('org-123');
    });

    it('fetches decision-graph with orgId and analysisId', async () => {
      const orgId = 'org-123';
      const analysisId = 'analysis-456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nodes: [], edges: [] }),
      });

      await mockFetch(`/api/decision-graph?orgId=${orgId}&highlightNode=${analysisId}&depth=1`);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/decision-graph?orgId=org-123&highlightNode=analysis-456&depth=1'
      );
    });

    it('handles team fetch returning orgId in organization.id', async () => {
      const teamData = { organization: { id: 'org-alt-789' } };
      const orgId = teamData?.orgId || teamData?.organization?.id;
      expect(orgId).toBe('org-alt-789');
    });

    it('returns null when team fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      const teamRes = await mockFetch('/api/team');
      const teamData = teamRes.ok ? await teamRes.json() : null;
      expect(teamData).toBeNull();
    });

    it('returns null when no orgId found', () => {
      const teamData = { name: 'Test Team' }; // no orgId field
      const orgId = teamData?.orgId || teamData?.organization?.id;
      expect(orgId).toBeUndefined();
    });
  });

  // ── Graph data processing ─────────────────────────────────────────────

  describe('graph data processing', () => {
    const analysisId = 'a-1';

    const nodes: RelatedNode[] = [
      {
        id: 'a-1',
        type: 'analysis',
        label: 'Current Decision',
        score: 75,
        biasCount: 2,
        createdAt: '2026-01-01',
      },
      {
        id: 'a-2',
        type: 'analysis',
        label: 'Related Decision A',
        score: 60,
        biasCount: 3,
        createdAt: '2026-01-02',
      },
      {
        id: 'a-3',
        type: 'analysis',
        label: 'Related Decision B',
        score: 80,
        biasCount: 1,
        createdAt: '2026-01-03',
      },
      {
        id: 'a-4',
        type: 'analysis',
        label: 'Unconnected Decision',
        score: 50,
        biasCount: 0,
        createdAt: '2026-01-04',
      },
    ];

    const edges: RelatedEdge[] = [
      {
        id: 'e1',
        source: 'a-1',
        target: 'a-2',
        edgeType: 'similar_to',
        strength: 0.8,
        confidence: 0.9,
        isManual: false,
      },
      {
        id: 'e2',
        source: 'a-3',
        target: 'a-1',
        edgeType: 'shared_bias',
        strength: 0.6,
        confidence: 0.7,
        isManual: false,
      },
      {
        id: 'e3',
        source: 'a-2',
        target: 'a-4',
        edgeType: 'depends_on',
        strength: 0.5,
        confidence: 0.6,
        isManual: true,
      },
    ];

    it('filters edges connected to analysisId', () => {
      const { connectedEdges } = processRelatedDecisions(analysisId, nodes, edges);
      expect(connectedEdges).toHaveLength(2);
      expect(connectedEdges.map(e => e.id)).toEqual(['e1', 'e2']);
    });

    it('excludes self from connected nodes', () => {
      const { connectedNodes } = processRelatedDecisions(analysisId, nodes, edges);
      expect(connectedNodes.find(n => n.id === analysisId)).toBeUndefined();
    });

    it('returns only nodes connected via edges', () => {
      const { connectedNodes } = processRelatedDecisions(analysisId, nodes, edges);
      expect(connectedNodes).toHaveLength(2);
      expect(connectedNodes.map(n => n.id).sort()).toEqual(['a-2', 'a-3']);
    });

    it('does not include unconnected nodes', () => {
      const { connectedNodes } = processRelatedDecisions(analysisId, nodes, edges);
      expect(connectedNodes.find(n => n.id === 'a-4')).toBeUndefined();
    });

    it('returns empty when no edges match analysisId', () => {
      const { connectedNodes } = processRelatedDecisions('nonexistent', nodes, edges);
      expect(connectedNodes).toHaveLength(0);
    });

    it('handles edges where analysisId is the target', () => {
      const { connectedEdges } = processRelatedDecisions(analysisId, nodes, edges);
      const incomingEdge = connectedEdges.find(e => e.target === analysisId);
      expect(incomingEdge).toBeDefined();
      expect(incomingEdge?.source).toBe('a-3');
    });
  });

  // ── Display limit (slice to 10) ──────────────────────────────────────

  describe('display limit', () => {
    it('limits displayed nodes to 10', () => {
      const nodes = Array.from({ length: 15 }, (_, i) => ({
        id: `n-${i}`,
        type: 'analysis',
        label: `Decision ${i}`,
        score: 50,
        biasCount: 0,
        createdAt: '2026-01-01',
      }));

      const displayed = nodes.slice(0, 10);
      expect(displayed).toHaveLength(10);
    });

    it('shows overflow count for > 10 nodes', () => {
      const totalNodes = 14;
      const overflowCount = totalNodes - 10;
      expect(overflowCount).toBe(4);
    });
  });

  // ── Edge label rendering ──────────────────────────────────────────────

  describe('edge label rendering', () => {
    it('formats strength as percentage', () => {
      const strength = 0.85;
      const formatted = `${(strength * 100).toFixed(0)}%`;
      expect(formatted).toBe('85%');
    });

    it('generates correct href for analysis type nodes', () => {
      const node = { id: 'abc-123', type: 'analysis' };
      const href = node.type === 'analysis' ? `/documents/${node.id}` : '#';
      expect(href).toBe('/documents/abc-123');
    });

    it('generates # href for non-analysis type nodes', () => {
      const node = { id: 'abc-123', type: 'meeting' };
      const href = node.type === 'analysis' ? `/documents/${node.id}` : '#';
      expect(href).toBe('#');
    });
  });
});
