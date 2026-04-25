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

export interface DocumentAccessResolution {
  /**
   * A Prisma `where` clause to spread into a Document.findFirst({ where: { id, ...resolved } }).
   * Already excludes soft-deleted rows.
   */
  where: Record<string, unknown>;
  /**
   * Surface for downstream callers: which path matched access.
   * `unknown` until the actual query runs and the document exists.
   */
  membershipOrgId: string | null;
  grantedDocumentIds: string[];
}

export async function buildDocumentAccessWhere(
  documentId: string,
  userId: string
): Promise<DocumentAccessResolution> {
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

  // Pull all DocumentAccess grants for this user. We pull all and filter on
  // documentId at the OR level rather than passing a single id, so this same
  // helper can power list endpoints later without reshaping. Wrapped in
  // try/catch because the table won't exist on environments where the
  // migration hasn't run yet (the seed-business-data postmortem rule —
  // never let a missing table break the read path).
  try {
    const grants = await prisma.documentAccess.findMany({
      where: { userId },
      select: { documentId: true },
    });
    grantedDocumentIds = grants.map(g => g.documentId);
  } catch {
    // DocumentAccess table missing — pre-3.5 schema. Fall through.
  }

  // Build the OR list. The owner always wins (visibility='private' included).
  const orClauses: Array<Record<string, unknown>> = [
    { userId, visibility: 'private' },
    { userId, visibility: 'team' },
    { userId, visibility: 'specific' },
    { userId, visibility: null },
  ];

  if (membershipOrgId) {
    orClauses.push({
      orgId: membershipOrgId,
      visibility: 'team',
    });
    // Pre-3.5 docs have no `visibility` set — treat null as team-visible so
    // existing rows don't disappear when the migration runs.
    orClauses.push({
      orgId: membershipOrgId,
      visibility: null,
    });
  }

  if (grantedDocumentIds.length > 0) {
    orClauses.push({
      id: { in: grantedDocumentIds },
      visibility: 'specific',
    });
  }

  return {
    where: {
      id: documentId,
      deletedAt: null,
      OR: orClauses,
    },
    membershipOrgId,
    grantedDocumentIds,
  };
}
