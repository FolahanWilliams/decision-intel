/**
 * Access resolution for bias-level collaboration (BiasComment, BiasTask).
 *
 * Both surfaces need the same access policy:
 *   - the user must own the BiasInstance's underlying Document, OR
 *   - the user must be a TeamMember of the Document's Org.
 *
 * Resolves the orgId for denormalisation onto the comment / task row in the
 * same lookup, so callers don't need a second round-trip.
 */

import { prisma } from '@/lib/prisma';

export interface BiasInstanceAccessResult {
  ok: true;
  /** Document's orgId (or null for personal docs). Always populated when ok=true. */
  orgId: string | null;
  /** Document.userId — useful for ownership-only operations. */
  documentOwnerId: string;
  /** Document.id — useful for downstream audit-log writes. */
  documentId: string;
  /** Analysis.id — useful when we need to refetch sibling collab rows. */
  analysisId: string;
}

export type BiasInstanceAccessFailure = {
  ok: false;
  /** 'not_found' | 'forbidden' */
  reason: 'not_found' | 'forbidden';
};

export type BiasInstanceAccess = BiasInstanceAccessResult | BiasInstanceAccessFailure;

export async function resolveBiasInstanceAccess(
  biasInstanceId: string,
  userId: string
): Promise<BiasInstanceAccess> {
  const bias = await prisma.biasInstance.findUnique({
    where: { id: biasInstanceId },
    select: {
      id: true,
      analysisId: true,
      analysis: {
        select: {
          id: true,
          documentId: true,
          document: {
            select: { id: true, userId: true, orgId: true, deletedAt: true },
          },
        },
      },
    },
  });
  if (!bias) {
    return { ok: false, reason: 'not_found' };
  }
  // Soft-deleted documents are invisible to collaboration surfaces too — a
  // doc in the grace window cannot be commented on or assigned.
  if (bias.analysis.document.deletedAt) {
    return { ok: false, reason: 'not_found' };
  }

  const docOwnerId = bias.analysis.document.userId;
  const docOrgId = bias.analysis.document.orgId;

  // Ownership check — personal docs.
  if (docOwnerId === userId) {
    return {
      ok: true,
      orgId: docOrgId,
      documentOwnerId: docOwnerId,
      documentId: bias.analysis.document.id,
      analysisId: bias.analysisId,
    };
  }

  // Org-membership check — shared docs.
  if (docOrgId) {
    const membership = await prisma.teamMember
      .findFirst({
        where: { userId, orgId: docOrgId },
        select: { id: true },
      })
      .catch(() => null);
    if (membership) {
      return {
        ok: true,
        orgId: docOrgId,
        documentOwnerId: docOwnerId,
        documentId: bias.analysis.document.id,
        analysisId: bias.analysisId,
      };
    }
  }

  return { ok: false, reason: 'forbidden' };
}

/**
 * Parse @mentions out of a comment body and resolve them to TeamMember
 * userIds in the given org. Supports two syntaxes:
 *   @user@example.com   → email match
 *   @"Display Name"     → exact-displayName match (quoted to allow spaces)
 *
 * Returns deduplicated userIds. Unknown mentions are silently dropped — we
 * never fail the comment write because of a typo'd @mention.
 */
export async function resolveMentions(
  body: string,
  orgId: string | null
): Promise<{ userIds: string[]; emails: string[] }> {
  if (!orgId) return { userIds: [], emails: [] };

  const emailMatches = Array.from(body.matchAll(/@([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g)).map(m =>
    m[1].toLowerCase()
  );
  const quotedNameMatches = Array.from(body.matchAll(/@"([^"]+)"/g)).map(m => m[1]);

  if (emailMatches.length === 0 && quotedNameMatches.length === 0) {
    return { userIds: [], emails: [] };
  }

  const members = await prisma.teamMember.findMany({
    where: {
      orgId,
      OR: [
        emailMatches.length > 0 ? { email: { in: emailMatches } } : undefined,
        quotedNameMatches.length > 0 ? { displayName: { in: quotedNameMatches } } : undefined,
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
    select: { userId: true, email: true },
  });

  const userIds = Array.from(new Set(members.map(m => m.userId)));
  const emails = Array.from(new Set(members.map(m => m.email.toLowerCase())));
  return { userIds, emails };
}
