/**
 * Tenant context for Postgres Row-Level Security (defense-in-depth).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * STATUS: READY, NOT YET WIRED ON THE HOT PATH.
 * This module is the runtime half of the RLS rollout (SQL half: prisma/rls/).
 * Wiring it into request handlers is a staged, founder-gated change — see
 * docs/rls-rollout-runbook.md. Until the enforce stage (prisma/rls/03_enforce.sql)
 * is applied, the policies fail open, so an un-wired path is harmless.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * WHY IT LOOKS LIKE THIS
 * Prisma talks to Postgres through the Supabase pooler as a privileged role
 * with no user JWT, so `auth.uid()`-based RLS does not apply. Instead, the RLS
 * policies read session variables (`app.current_user_id`, `app.current_org_id`,
 * `app.bypass_rls`). Those variables must be set with SET LOCAL *inside the same
 * transaction* as the queries — SET LOCAL is transaction-scoped, which is the
 * only connection-pooler-safe option (a session-level SET would leak across
 * pooled clients). `set_config(name, value, is_local => true)` is the
 * parameterizable, injection-safe function form of SET LOCAL.
 *
 * USAGE (request handler — enforce tenant scope):
 *   const docs = await withTenantContext({ userId, orgId }, (tx) =>
 *     tx.document.findMany({ where: { ... } })
 *   );
 *   // Inside the callback you MUST use `tx`, not the global `prisma`, or the
 *   // session context will not be on the connection the query runs on.
 *
 * USAGE (cron / pipeline / admin — legitimate cross-tenant work):
 *   const all = await withRlsBypass((tx) => tx.analysis.findMany({ ... }));
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface TenantContext {
  /** Supabase auth user id of the requester. */
  userId?: string | null;
  /** Organization id the requester is acting within, if any. */
  orgId?: string | null;
}

/** Prisma transaction client type (the `tx` handed to interactive transactions). */
export type TxClient = Prisma.TransactionClient;

const TXN_OPTS = {
  // Keep within the pooler's transaction budget; tune in the runbook if needed.
  maxWait: 5_000,
  timeout: 20_000,
};

async function applyContext(
  tx: TxClient,
  vars: { userId?: string | null; orgId?: string | null; bypass?: boolean }
): Promise<void> {
  // set_config(setting, value, is_local=true) == SET LOCAL, transaction-scoped,
  // and parameter-safe (SET LOCAL itself cannot take bind parameters).
  await tx.$executeRaw`select set_config('app.current_user_id', ${vars.userId ?? ''}, true)`;
  await tx.$executeRaw`select set_config('app.current_org_id', ${vars.orgId ?? ''}, true)`;
  await tx.$executeRaw`select set_config('app.bypass_rls', ${vars.bypass ? 'on' : 'off'}, true)`;
}

/**
 * Run `fn` inside a transaction whose connection carries the caller's tenant
 * context, so RLS scopes every query in `fn` to this user/org.
 */
export function withTenantContext<T>(
  ctx: TenantContext,
  fn: (tx: TxClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await applyContext(tx, { userId: ctx.userId, orgId: ctx.orgId, bypass: false });
    return fn(tx);
  }, TXN_OPTS);
}

/**
 * Run `fn` with RLS bypassed — for trusted server paths that legitimately span
 * tenants (cron jobs, the analysis pipeline, admin tooling, background workers).
 * Use sparingly and never with request-derived input as the only guard.
 */
export function withRlsBypass<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await applyContext(tx, { bypass: true });
    return fn(tx);
  }, TXN_OPTS);
}

/**
 * Probe helper for the rollout: returns what context the DB currently sees on a
 * fresh connection. Used by the verification step in the runbook to confirm the
 * fail-open guard is doing what we think before flipping to enforce.
 */
export async function readRlsContext(): Promise<{
  userId: string | null;
  orgId: string | null;
  bypassed: boolean;
}> {
  const rows = await prisma.$queryRaw<
    Array<{ user_id: string | null; org_id: string | null; bypassed: boolean }>
  >`select app.current_user_id() as user_id, app.current_org_id() as org_id, app.rls_bypassed() as bypassed`;
  const r = rows[0] ?? { user_id: null, org_id: null, bypassed: false };
  return { userId: r.user_id, orgId: r.org_id, bypassed: r.bypassed };
}
