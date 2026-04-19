# Team Session Management — Enterprise Trust Spine Phase 2

## Context

Security questionnaires ask three questions an admin needs to be able to
answer about their team's sessions:

1. "How can an admin see every active session across their team?"
2. "How can an admin force-log-out a departing employee immediately?"
3. "How long do idle sessions live before auto-expiring?"

Decision Intel today answers "Supabase Auth" for all three — which is
technically true but undefendable in a procurement review because (a) there
is no admin surface to list / revoke sessions, (b) the idle-timeout is the
Supabase default (1 hour access, 1 week refresh) with no org-level override.
This plan scopes the build without writing the code so the answer in every
security questionnaire becomes concrete.

## Goals

1. Admins see a list of every active session for every member of their org
   (device, IP country, last-active timestamp, login method).
2. Admins can force-revoke any single session, every session for a specific
   member (force-logout), or every session org-wide (break-glass).
3. Per-org idle timeout override (default 1h, configurable 15m–8h).
4. Session activity feeds the existing AuditLog so every revoke is
   attributable to an admin.
5. Member-side UI: every user can see their own active sessions in settings
   and self-revoke.

## Non-goals

- Step-up auth (MFA prompt on re-auth). Separate workstream.
- IP allowlisting per org. Separate enterprise feature.
- Browser-fingerprint-based risk scoring. Out of scope.

## Architecture

Supabase Auth already persists sessions in `auth.sessions` with `user_id`,
`created_at`, `updated_at`, `refreshed_at`, and `user_agent` columns. The
piece we need to add is a per-user / per-org view over that table plus a
small `UserSession` Prisma model that decorates each Supabase session with
DI-specific metadata (device label, login method, revoked-by).

New model:

```prisma
model UserSession {
  id              String   @id                 // Supabase session ID (auth.sessions.id)
  userId          String
  organizationId  String?                      // null for pre-team users
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  loginMethod     String                       // 'google_oauth' | 'sso_saml' | 'sso_oidc' | 'magic_link'
  deviceLabel     String?                      // parsed from user_agent, e.g. "Chrome on macOS"
  ipCountry       String?                      // populated on session refresh via Vercel IP geo header
  lastActiveAt    DateTime @default(now())
  revokedAt       DateTime?
  revokedBy       String?                      // userId of the admin who revoked
  revokeReason    String?                      // 'self' | 'admin_force' | 'org_wide' | 'policy_timeout'
  createdAt       DateTime @default(now())
  @@index([userId, revokedAt])
  @@index([organizationId, lastActiveAt])
}
```

Per-org settings:

```prisma
// Add columns to Organization
// sessionIdleTimeoutMinutes Int? @default(60)
// sessionEnforceMfa         Boolean @default(false)    // Phase 3
```

## Files to change (when implemented)

- `prisma/schema.prisma` — new `UserSession` model + two Organization cols.
- `src/lib/auth/sessions.ts` — `listActiveSessions(orgId)`, `revokeSession(id,
  reason)`, `revokeAllForUser(userId, reason)`, `revokeAllForOrg(orgId,
  reason)`. Uses Supabase admin client for the underlying `auth.admin.
  signOut()` call, writes AuditLog on every mutation.
- `src/middleware.ts` — on each request, touch `UserSession.lastActiveAt`
  and check idle-timeout against the org's `sessionIdleTimeoutMinutes`.
  Expired sessions get auto-revoked with reason `policy_timeout`.
- `src/app/api/auth/sessions/route.ts` — GET (list for current user), DELETE
  (revoke one). Standard apiSuccess / apiError envelope.
- `src/app/api/admin/team/[orgId]/sessions/route.ts` — GET (list for org,
  admin-only), DELETE (revoke one or all-for-user, admin-only).
- `src/app/(platform)/dashboard/settings/sessions/page.tsx` — member self-
  service session list.
- `src/app/(platform)/dashboard/team/sessions/page.tsx` — admin view of the
  full org session list with revoke actions.
- `src/app/(marketing)/security/page.tsx` — surface the idle-timeout range
  + force-revoke capability.

## Flow

### Member self-service

1. User visits `/dashboard/settings/sessions`.
2. Page lists every session for their user — device, location, last active,
   login method. The current session is labelled "This device".
3. User clicks "Revoke" on any non-current session. Client hits DELETE
   `/api/auth/sessions/<id>`. Server calls Supabase admin `signOut(id)`,
   writes `UserSession.revokedAt` + `revokedBy = self`, writes
   `AuditLog { action: 'session.revoke', userId, sessionId, reason: 'self' }`.
4. User clicks "Revoke all others" → same flow, batched.

### Admin force-revoke

1. Admin visits `/dashboard/team/sessions` (admin-only, 403 otherwise).
2. Page groups active sessions by member, sorted by last-active.
3. Admin clicks "Force log out" next to a member → confirm modal → DELETE
   `/api/admin/team/<orgId>/sessions?userId=<id>`. Server revokes every
   session for that user, writes AuditLog with reason `admin_force`.
4. "Revoke entire org" button is break-glass: requires re-auth in the modal,
   revokes every session org-wide.

### Idle-timeout policy

1. Middleware touches `UserSession.lastActiveAt` on every authenticated
   request.
2. On each touch, if `now - lastActiveAt > sessionIdleTimeoutMinutes` for
   the org, the session is revoked in-request and the user is redirected to
   `/login?reason=idle_timeout`.

## Verification

1. Playwright: member revokes own session → next request returns 401.
2. Playwright: admin force-revokes member → that member's next request
   returns 401.
3. Unit: idle-timeout calculation respects per-org override.
4. AuditLog sanity: every revoke event appears with the correct actor in
   `/dashboard/admin/audit-log` (built in Phase 1 of this Trust Spine).

## Timeline

- Week 1: Prisma migration + `sessions.ts` lib + member GET/DELETE API.
- Week 2: Member self-service UI + middleware idle-timeout.
- Week 3: Admin org-session view + force-revoke + break-glass flow.
- Week 4: Security questionnaire phrasing + `/security` page update.

## Procurement-unblock phrasing

On the questionnaire:

> "Every admin can view and revoke every active session across their org
> from the Team → Sessions dashboard. Force-logout is instant. Idle-session
> timeout is per-org configurable from 15 minutes to 8 hours (default 60).
> Every revoke event is written to the immutable audit log with the
> revoking actor, the target user, and the reason. Break-glass org-wide
> revoke is available for incident response."

That is the answer that passes.
