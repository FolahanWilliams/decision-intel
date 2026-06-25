/**
 * Org-access verification — the canonical guard for any route that reads or
 * mutates ORG-scoped data by an orgId taken from request params/query.
 *
 * The decision-graph / triage / maturity-score routes accept `?orgId=...` and
 * scope their queries to it. Without verifying the caller belongs to that org,
 * a user can pass ANY orgId and read another tenant's entire decision graph,
 * stats, root-cause analysis, report, trends, benchmarks, risk-state, lineage,
 * triage and maturity score (a cross-tenant read of the most sensitive data in
 * the product). Builders like buildDecisionGraph trust the orgId by contract
 * ("caller must verify the user has access to the org before calling this"),
 * so the verification has to live at the route boundary — this helper is it.
 *
 * Pattern at every org-scoped route, right after extracting orgId:
 *
 *   if (!(await userHasOrgAccess(user.id, orgId))) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 *   }
 *
 * For routes where orgId is OPTIONAL (null = personal scope), guard only the
 * provided case:  if (orgId && !(await userHasOrgAccess(user.id, orgId))) ...
 */
import { prisma } from '@/lib/prisma';
import { isAdminUserId } from '@/lib/utils/admin';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('OrgAccess');

/**
 * The org ids the user is a member of. Fails CLOSED (empty array) on a query
 * error so a transient DB failure can never widen access.
 */
export async function getUserOrgIds(userId: string): Promise<string[]> {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      select: { orgId: true },
    });
    return memberships.map(m => m.orgId);
  } catch (err) {
    log.warn('getUserOrgIds failed (returning empty fallback):', err);
    return [];
  }
}

/**
 * True iff the user belongs to `orgId`. Platform admins (the founder's
 * dogfooding bypass, consistent with getUserPlan/getOrgPlan) pass for any org.
 */
export async function userHasOrgAccess(userId: string, orgId: string): Promise<boolean> {
  if (isAdminUserId(userId)) return true;
  const orgIds = await getUserOrgIds(userId);
  return orgIds.includes(orgId);
}
