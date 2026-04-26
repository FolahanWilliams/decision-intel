/**
 * Document-level access resolution (3.5).
 *
 * Replaces the old "userId match OR orgId match" check with a
 * three-state visibility model:
 *
 *   - private   → only the document owner (Document.userId) can read.
 *   - team      → anyone in the same org as the document. This matches
 *                 the pre-3.5 default and stays the default for new uploads.
 *   - specific  → owner + the userIds in the DocumentAccess allowlist.
 *
 * The owner always has access regardless of visibility.
 *
 * Returns a Prisma `where` clause fragment plus a small metadata block
 * for callers that need to know which mode resolved access.
 */

import { prisma } from '@/lib/prisma';

export interface DocumentAccessFilter {
  /**
   * Prisma `where` fragment that gates document reads to docs the user is
   * allowed to see (owner of any visibility, teammate of `team` docs, explicit
   * grantee of `specific` docs). Already excludes soft-deleted rows.
   *
   * Use as a top-level filter on Document queries (list, count) OR as a
   * nested filter under `analysis.document: { ... }`, `share.analysis.document`,
   * etc. — the shape is the same.
   */
  where: Record<string, unknown>;
  membershipOrgId: string | null;
  grantedDocumentIds: string[];
}

export type DocumentAccessResolution = DocumentAccessFilter;

/**
 * Builds the OR clauses + deletedAt filter for ANY document the given user
 * is allowed to read. Use this when the caller is querying a list of
 * documents, or filtering analyses by their parent document.
 *
 * Three categories merge:
 *   1. owner    — userId match wins regardless of visibility
 *   2. team     — same org AND visibility in {'team', null}  (null = pre-3.5)
 *   3. specific — id is in the user's DocumentAccess grant list
 */
export async function buildDocumentAccessFilter(userId: string): Promise<DocumentAccessFilter> {
  let membershipOrgId: string | null = null;
  let grantedDocumentIds: string[] = [];

  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    membershipOrgId = membership?.orgId ?? null;
  } catch {
    // Schema drift — fall back to userId-only access.
  }

  try {
    const grants = await prisma.documentAccess.findMany({
      where: { userId },
      select: { documentId: true },
    });
    grantedDocumentIds = grants.map(g => g.documentId);
  } catch {
    // DocumentAccess table missing — pre-3.5 schema. Fall through.
  }

  const orClauses: Array<Record<string, unknown>> = [
    // Owner — always wins, every visibility mode included so private docs
    // remain visible to their own creator.
    { userId, visibility: 'private' },
    { userId, visibility: 'team' },
    { userId, visibility: 'specific' },
    { userId, visibility: null },
  ];

  if (membershipOrgId) {
    orClauses.push({ orgId: membershipOrgId, visibility: 'team' });
    // Pre-3.5 docs have no `visibility` set — treat null as team-visible so
    // existing rows don't disappear when the migration runs.
    orClauses.push({ orgId: membershipOrgId, visibility: null });
  }

  if (grantedDocumentIds.length > 0) {
    orClauses.push({
      id: { in: grantedDocumentIds },
      visibility: 'specific',
    });
  }

  return {
    where: {
      deletedAt: null,
      OR: orClauses,
    },
    membershipOrgId,
    grantedDocumentIds,
  };
}

/**
 * Single-document gate. Wraps `buildDocumentAccessFilter` and pins the id.
 * Use for findFirst/findUnique on Document.
 */
export async function buildDocumentAccessWhere(
  documentId: string,
  userId: string
): Promise<DocumentAccessResolution> {
  const filter = await buildDocumentAccessFilter(userId);
  return {
    ...filter,
    where: { id: documentId, ...filter.where },
  };
}

/**
 * Analysis-level gate: checks whether the user can read the document that
 * owns the given analysis. Returns null when the analysis doesn't exist or
 * the user cannot see the parent document. Schema-drift tolerant.
 */
export async function resolveAnalysisAccess(
  analysisId: string,
  userId: string
): Promise<{ analysisId: string; documentId: string } | null> {
  const filter = await buildDocumentAccessFilter(userId);
  try {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        document: filter.where,
      },
      select: { id: true, documentId: true },
    });
    if (!analysis) return null;
    return { analysisId: analysis.id, documentId: analysis.documentId };
  } catch {
    return null;
  }
}

/**
 * Filter a list of document IDs (e.g. RAG/embedding hit results) down to
 * only those the user is allowed to read under the visibility model.
 * Returns the subset; preserves order. Used as a post-filter on raw SQL
 * paths that can't use the Prisma where clause directly (pgvector queries).
 */
export async function filterDocumentIdsByAccess(
  documentIds: string[],
  userId: string
): Promise<string[]> {
  if (documentIds.length === 0) return [];
  const filter = await buildDocumentAccessFilter(userId);
  try {
    const allowed = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        ...filter.where,
      },
      select: { id: true },
    });
    const allowedSet = new Set(allowed.map(d => d.id));
    return documentIds.filter(id => allowedSet.has(id));
  } catch {
    // Schema drift — fall back to the full list. Better than dropping
    // every result on a transient migration mismatch; the upstream callers
    // still gate by userId match in their raw SQL.
    return documentIds;
  }
}
