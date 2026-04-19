# SSO / SAML — Enterprise Trust Spine Phase 2

## Context

Fortune-500 procurement teams gate on SSO. The current auth stack is Google
OAuth via Supabase Auth. That covers individual design partners and small
teams, but any enterprise pilot with a real IT / security review will reject
"only Google OAuth" in the security questionnaire. This plan scopes the SSO
build without writing the code — so the founder can tell a design-partner
prospect "yes, we support SSO, here's the roadmap and the release window" with
a concrete answer rather than a hedge.

Not in scope for this plan: SCIM (user provisioning), directory sync, granular
role mapping, or identity-proxy deployment. Those are Phase 3.

## Goals

1. Support SAML 2.0 SP-initiated and IdP-initiated login for a single enterprise
   customer per deployment, with Okta as the lead IdP.
2. Support OIDC (as a fallback for Okta / Azure AD / Google Workspace /
   OneLogin) because some smaller enterprises prefer OIDC over SAML.
3. Map an SSO login to an existing `User` + `Organization` row (do NOT
   auto-provision at first — Phase 3 adds SCIM).
4. Enforce SSO-only login at the org level once an org is SSO-enabled (no more
   password fallback, no more Google OAuth for that org's users).
5. Ship an `/security` section entry and an admin-side "SSO setup" UI so the
   customer's IT admin can self-configure without a support ticket.

## Non-goals

- Multi-IdP simultaneous support per org (one IdP per org at first).
- Automatic user provisioning / de-provisioning (Phase 3 via SCIM).
- Custom attribute mapping (first release uses `email` as the join key only).

## Architecture

Use the **WorkOS SSO** SaaS (https://workos.com). It is the pragmatic
build-vs-buy answer for a solo founder — WorkOS ships every major IdP (Okta,
Azure AD, Google Workspace, OneLogin, Ping, JumpCloud, generic SAML, generic
OIDC), handles IdP metadata parsing, signing-cert rotation, and the admin
portal UI out of the box. The alternative is implementing SAML from scratch,
which means maintaining `samlify` or `node-saml` forever and building the IdP
admin portal ourselves. WorkOS is ~$125 / connection / month at pilot scale,
drops to per-seat pricing at enterprise scale — cheaper than one engineer-
month of build-and-maintain time.

If the founder wants zero vendor dependency later, the code path is:
`lib/auth/sso/provider.ts` abstracts the SSO provider interface so we can swap
WorkOS for a self-hosted `samlify` implementation without changing call sites.

## Data model

New tables:

```prisma
model OrgSso {
  id                String       @id @default(cuid())
  organizationId    String       @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  providerType      String       // 'saml' | 'oidc'
  workosConnectionId String?     // non-null once the IdP setup completes
  status            String       // 'pending_setup' | 'active' | 'disabled'
  domain            String       // primary email domain (e.g. "acme.com")
  enforceSsoOnly    Boolean      @default(false)
  createdBy         String
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  @@index([status])
}

// Additional column on User
// ssoExternalId String?  // the IdP's sub/nameId for this user
```

## Flow

1. Org admin visits `/dashboard/settings/sso` (admin-only).
2. UI shows the WorkOS-embedded admin portal (iframe or redirect with return
   URL) so the IT admin pastes their IdP metadata.
3. On WorkOS's `connection.activated` webhook, we upsert `OrgSso.status =
   'active'` and surface a confirmation in the settings UI.
4. User logs in at `/login?email=...@acme.com`. Middleware checks if the
   domain has an active SSO connection; if yes, redirect to
   `/api/auth/sso/start?org=<id>` which creates a WorkOS SSO redirect.
5. Post-IdP, WorkOS redirects to `/api/auth/sso/callback` with a state token.
   We exchange for the user profile, find-or-fail-by-email (no auto-
   provision), create a Supabase session, redirect to `/dashboard`.
6. If `enforceSsoOnly = true`, the password + Google OAuth buttons on
   `/login` are hidden for that domain.

## Files to change (when this is implemented)

- `prisma/schema.prisma` — add `OrgSso` model + `User.ssoExternalId`.
- `src/lib/auth/sso/workos-client.ts` — thin wrapper around the WorkOS SDK.
- `src/lib/auth/sso/provider.ts` — provider interface (future swap-out).
- `src/app/api/auth/sso/start/route.ts` — SP-initiated flow entry.
- `src/app/api/auth/sso/callback/route.ts` — IdP response handler.
- `src/app/api/webhooks/workos/route.ts` — connection lifecycle events.
- `src/middleware.ts` — domain-based SSO redirect check.
- `src/app/(platform)/dashboard/settings/sso/page.tsx` — admin setup UI.
- `src/app/login/page.tsx` — hide password/Google for SSO-only domains.
- `src/app/(marketing)/security/page.tsx` — update the SSO row to "Available
  on Enterprise, Okta / Azure AD / Google Workspace / OneLogin supported".

## Verification / release gates

1. Dry-run with a WorkOS test connection against a seed Okta tenant.
2. Playwright test: full SAML round trip from `/login` → Okta mock → callback
   → session cookie set → `/dashboard` accessible.
3. Security review: audit-log entries for every SSO login event (already
   covered by existing `auth.login` audit action — just verify the new
   provider writes them).
4. Rollback plan: `OrgSso.status = 'disabled'` bypasses the middleware check
   and restores password / Google OAuth for that org.

## Timeline

- Week 1: Prisma migration + WorkOS SDK wire-up + `/api/auth/sso/*` routes.
- Week 2: Admin setup UI + middleware domain check + login page updates.
- Week 3: E2E testing + security review + ship to staging.
- Week 4: First design-partner IdP integration + GA announcement.

## Procurement-unblock phrasing

On the security questionnaire, the answer becomes:

> "SSO is available on Enterprise. We support SAML 2.0 and OIDC via WorkOS,
> with out-of-the-box connectors for Okta, Azure AD, Google Workspace,
> OneLogin, and generic IdPs. Setup is self-service via the admin portal;
> full round-trip is typically 15 minutes from metadata paste to first login.
> SSO-only enforcement is available per-org. SCIM provisioning is on the
> roadmap for Q1 2027."

That's what wins the procurement question.
