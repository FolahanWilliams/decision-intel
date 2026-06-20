# RLS rollout runbook — DB-level tenant isolation

**Status:** SQL + runtime code shipped; production apply is staged and founder-gated.
**Why:** today tenant isolation is 100% application-layer (~340 hand-written `where`
filters). One forgotten clause = a cross-customer data leak with nothing underneath
to catch it. Postgres Row-Level Security is the defense-in-depth backstop enterprise
security reviews require. This runbook turns it on **without an outage**.

## The one thing that will bite you

Prisma connects through the Supabase pooler as a privileged role with **no user JWT**.
So the Supabase-tutorial RLS (`CREATE POLICY USING (auth.uid() = user_id)`) is wrong
for this app — it would either do nothing (owner bypass) or return **zero rows for
every query** (no `auth.uid()`), taking the app down. Our policies instead read
**session variables** that the Prisma extension sets per-transaction, and use `FORCE`
so the owning role is actually subject to them. Do not hand-write `auth.uid()` policies.

## Artifacts

| File | What | When to run |
|---|---|---|
| `prisma/rls/01_helpers.sql` | `app` schema + context functions | once, first |
| `prisma/rls/02_enable_failopen.sql` | ENABLE + FORCE RLS + **fail-open** policies (82 tables) | Stage 2 — safe now |
| `prisma/rls/03_enforce.sql` | drops the fail-open clause → **protection on** | Stage 4 — after extension live |
| `prisma/rls/99_rollback.sql` | disable + drop everything | kill switch, any time |
| `prisma/rls/04_indirect_review.todo.sql` | 14 tables needing hand-written join policies | Stage 5 — reviewed |
| `src/lib/db/tenant-context.ts` | `withTenantContext` / `withRlsBypass` runtime | Stage 3 — wire into handlers |
| `scripts/lint-tenant-isolation.mjs` | ratchet blocking new unguarded queries | already in CI |

Regenerate the SQL after any schema change: `npm run gen:rls`.

## Stages

### Stage 0 — least-privilege role (recommended, not strictly required)
`FORCE` already subjects the table owner to RLS, so this works with the current
`postgres` role. For a cleaner posture, have Prisma connect as a dedicated
`app_user` role **without** `BYPASSRLS` (so a future accidental policy gap can't be
silently bypassed) and reserve `postgres`/`service_role` for migrations + admin.
This is a `DATABASE_URL` change only; defer if you want to ship Stages 1–4 first.

### Stage 1 — helpers (zero risk)
Run `01_helpers.sql` in the Supabase SQL editor. Creates the `app` schema and the
context functions. No table is touched; nothing changes behaviorally.

### Stage 2 — enable RLS, fail-open (zero behavior change) ✅ safe to do today
Run `02_enable_failopen.sql`. This `ENABLE`s + `FORCE`s RLS on all 82 directly
tenant-scoped tables, but every policy includes `app.no_tenant_context()` — which is
true for every current Prisma query (none set a context) — so **every row still
passes**. Verify the app is unchanged (browse, upload, audit). Roll back instantly
with `99_rollback.sql` if anything looks off.

> Do Stage 2 on a Supabase **branch** first if you have one, or during a low-traffic
> window with `99_rollback.sql` open in a second tab.

### Stage 3 — wire the runtime context (the real integration work)
Make request handlers run their tenant queries through `withTenantContext`, and make
cron / pipeline / admin paths use `withRlsBypass`. Inside the callback, use the `tx`
client, not the global `prisma`. Start with the highest-value surfaces (documents,
analyses, decision containers) and expand. The `lint-tenant-isolation` baseline (72)
is your worklist: burn it down as you convert each site.

Verify a connection sees the context with `readRlsContext()` from a wired handler.

### Stage 4 — enforce (protection on)
Only after Stage 3 covers 100% of DB paths: run `03_enforce.sql`. This re-creates
the policies **without** the fail-open clause, so any query that reaches the DB
without a context (and without bypass) now returns zero rows — the desired behavior,
and the signal that a path was missed. Roll out by watching error/empty-result rates;
`99_rollback.sql` reverts to fail-open instantly.

### Stage 5 — indirect tables
Hand-write join policies for the 14 indirectly-scoped tables listed in
`04_indirect_review.todo.sql` (Analysis→Document, BiasInstance→Analysis, container
children, etc.). Do not guess the parent path — review each.

## Kill switch
`prisma/rls/99_rollback.sql` disables RLS and drops the policies on every generated
table in one run. Isolation reverts to application-layer only (today's posture).
Keep it handy through Stages 2 and 4.

## Verification checklist
- [ ] Stage 2 applied; app behaves identically (manual smoke + error rate flat)
- [ ] A handler wired with `withTenantContext`; `readRlsContext()` shows the user/org
- [ ] Cross-tenant probe: with context set to user A, a direct `tx.document.findMany()`
      with **no** where-clause returns only A's rows (the RLS backstop working)
- [ ] Cron/pipeline jobs wrapped in `withRlsBypass` still see all rows
- [ ] Stage 4 applied table-by-table; empty-result alerts clean
