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

import { prisma } from '@/lib/prisma';

export interface DecisionPackageAccessFilter {
  /** Prisma `where` for DecisionPackage findMany / findFirst. */
  where: Record<string, unknown>;
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

  const orClauses: Array<Record<string, unknown>> = [
    // Owner always wins, every visibility mode included.
    { ownerUserId: userId },
  ];

  if (membershipOrgId) {
    orClauses.push({ orgId: membershipOrgId, visibility: 'team' });
    // Pre-flag rows: treat null visibility as team-visible, in case future
    // migrations leave it unset on legacy data.
    orClauses.push({ orgId: membershipOrgId, visibility: null });
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
