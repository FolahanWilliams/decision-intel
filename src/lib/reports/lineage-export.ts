/**
 * Decision Lineage Export — generates compliance-ready audit trails
 * with decision provenance chains.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('LineageExport');

export interface DecisionLineageRecord {
  decisionId: string;
  decisionType: string;
  label: string;
  timestamp: string;
  score: number;
  participants: string[];
  biasesDetected: Array<{ type: string; severity: string }>;
  nudgesServed: Array<{ type: string; severity: string; acknowledged: boolean; helpful: boolean | null }>;
  outcome: { result: string; impactScore: number | null; lessonsLearned: string | null } | null;
  connectedDecisions: Array<{ id: string; edgeType: string; strength: number; direction: string }>;
}

/**
 * Generate a complete lineage export for an organization's decisions
 * within a date range. Suitable for compliance, audit, and governance.
 */
export async function generateLineageExport(
  orgId: string,
  dateRange: { from: Date; to: Date }
): Promise<DecisionLineageRecord[]> {
  try {
    // Fetch analyses with all related data
    const analyses = await prisma.analysis.findMany({
      where: {
        document: { orgId },
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      include: {
        document: { select: { filename: true, userId: true } },
        biases: { select: { biasType: true, severity: true } },
        outcome: {
          select: { outcome: true, impactScore: true, lessonsLearned: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    const analysisIds = analyses.map(a => a.id);

    // Batch fetch edges
    let edges: Array<{
      sourceId: string; targetId: string; edgeType: string; strength: number;
    }> = [];
    try {
      edges = await prisma.decisionEdge.findMany({
        where: {
          orgId,
          OR: [
            { sourceId: { in: analysisIds } },
            { targetId: { in: analysisIds } },
          ],
        },
        select: { sourceId: true, targetId: true, edgeType: true, strength: true },
      });
    } catch { /* schema drift */ }

    // Batch fetch nudges linked to analyses (via humanDecisionId or targetUserId)
    let nudges: Array<{
      humanDecisionId: string | null; nudgeType: string; severity: string;
      acknowledgedAt: Date | null; wasHelpful: boolean | null;
    }> = [];
    try {
      nudges = await prisma.nudge.findMany({
        where: {
          orgId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
        select: {
          humanDecisionId: true,
          nudgeType: true,
          severity: true,
          acknowledgedAt: true,
          wasHelpful: true,
        },
      });
    } catch { /* schema drift */ }

    // Build edge lookup
    const edgesByNode = new Map<string, Array<{ id: string; edgeType: string; strength: number; direction: string }>>();
    for (const e of edges) {
      if (!edgesByNode.has(e.sourceId)) edgesByNode.set(e.sourceId, []);
      edgesByNode.get(e.sourceId)!.push({
        id: e.targetId, edgeType: e.edgeType, strength: e.strength, direction: 'outgoing',
      });
      if (!edgesByNode.has(e.targetId)) edgesByNode.set(e.targetId, []);
      edgesByNode.get(e.targetId)!.push({
        id: e.sourceId, edgeType: e.edgeType, strength: e.strength, direction: 'incoming',
      });
    }

    // Build records
    const records: DecisionLineageRecord[] = analyses.map(a => ({
      decisionId: a.id,
      decisionType: 'analysis',
      label: a.document.filename || a.id.slice(0, 20),
      timestamp: a.createdAt.toISOString(),
      score: a.overallScore,
      participants: [],
      biasesDetected: a.biases.map(b => ({ type: b.biasType, severity: b.severity })),
      nudgesServed: nudges
        .filter(n => n.humanDecisionId === a.id)
        .map(n => ({
          type: n.nudgeType,
          severity: n.severity,
          acknowledged: n.acknowledgedAt !== null,
          helpful: n.wasHelpful,
        })),
      outcome: a.outcome ? {
        result: a.outcome.outcome,
        impactScore: a.outcome.impactScore,
        lessonsLearned: a.outcome.lessonsLearned,
      } : null,
      connectedDecisions: (edgesByNode.get(a.id) || []).slice(0, 20),
    }));

    return records;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') return [];
    log.error('Lineage export failed:', error);
    return [];
  }
}

/**
 * Convert lineage records to CSV format.
 */
export function lineageToCSV(records: DecisionLineageRecord[]): string {
  const headers = [
    'Decision ID', 'Type', 'Label', 'Timestamp', 'Score',
    'Biases', 'Bias Severities', 'Outcome', 'Impact Score',
    'Nudges Served', 'Nudges Acknowledged', 'Connected Decisions',
  ];

  const rows = records.map(r => [
    r.decisionId,
    r.decisionType,
    `"${r.label.replace(/"/g, '""')}"`,
    r.timestamp,
    r.score,
    `"${r.biasesDetected.map(b => b.type).join('; ')}"`,
    `"${r.biasesDetected.map(b => b.severity).join('; ')}"`,
    r.outcome?.result || 'pending',
    r.outcome?.impactScore ?? '',
    r.nudgesServed.length,
    r.nudgesServed.filter(n => n.acknowledged).length,
    r.connectedDecisions.length,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
