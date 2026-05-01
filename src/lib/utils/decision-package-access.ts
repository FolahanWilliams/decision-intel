/**
 * Decision Package access resolver (4.4 deep).
 *
 * Mirrors the Document RBAC resolver but for package-shell access. The
 * package's own `visibility` field controls whether teammates can see
 * the package surface (name + composite metrics). Member documents
 * still go through the per-doc visibility resolver — adding a private
 * doc to a team package does NOT widen its read radius.
 *
 * Three categories merge:
 *   1. owner    — ownerUserId match wins regardless of visibility
 *   2. team     — same org AND visibility = 'team'
 *   3. private  — only owner sees private packages
 *
 * (We deliberately don't ship per-user package grants in v1 — the doc-
 * level grants already cover "I want a teammate to see this specific
 * doc inside this private package". Add DecisionPackageAccess if/when
 * the use case actually surfaces.)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface DecisionPackageAccessFilter {
  /**
   * Prisma `where` for DecisionPackage findMany / findFirst.
   *
   * Typed as `Prisma.DecisionPackageWhereInput` so any field-shape mismatch
   * (e.g. `visibility: null` against the non-null `String` schema column)
   * is a compile error, not a runtime PrismaClientValidationError. Mirrors
   * the document-access.ts compile-time guard added 2026-05-01.
   */
  where: Prisma.DecisionPackageWhereInput;
  /** The user's org membership at the time of the call. */
  membershipOrgId: string | null;
}

export async function buildPackageAccessFilter(
  userId: string
): Promise<DecisionPackageAccessFilter> {
  let membershipOrgId: string | null = null;
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    membershipOrgId = membership?.orgId ?? null;
  } catch {
    // Schema drift — fall back to ownership-only.
  }

  const orClauses: Prisma.DecisionPackageWhereInput[] = [
    // Owner always wins, every visibility mode included.
    { ownerUserId: userId },
  ];

  if (membershipOrgId) {
    // 2026-05-01: dropped the `visibility: null` clause — DecisionPackage's
    // visibility column is non-null String @default("team"), so Prisma 7.8+
    // rejects `visibility: null` filters. Same fix as document-access.ts.
    orClauses.push({ orgId: membershipOrgId, visibility: 'team' });
  }

  return {
    where: { OR: orClauses },
    membershipOrgId,
  };
}

/**
 * Single-package gate. Returns the package row or null when the user
 * cannot read it. Used by every detail-route handler.
 */
export async function resolvePackageAccess(packageId: string, userId: string) {
  const filter = await buildPackageAccessFilter(userId);
  return prisma.decisionPackage.findFirst({
    where: {
      id: packageId,
      ...filter.where,
    },
  });
}
