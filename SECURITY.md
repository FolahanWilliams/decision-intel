# Security Policy

Decision Intel handles strategic decision memos and their reasoning trails —
material a customer treats as confidential. We hold security to a procurement
grade and welcome coordinated disclosure.

## Reporting a vulnerability

Email **security@decision-intel.com** with:

- a description of the issue and its impact,
- steps to reproduce (or a proof-of-concept), and
- any logs, request/response captures, or affected endpoints.

Please do **not** open a public GitHub issue for security reports.

We aim to acknowledge within **2 business days**, give an initial assessment
within **5 business days**, and keep you updated through remediation. We credit
reporters who request it. We ask that you avoid privacy violations, data
destruction, and service degradation while testing, and give us a reasonable
window to remediate before public disclosure.

## Scope

In scope: the application, its API, authentication/session handling, tenant
isolation, and data handling. Out of scope: volumetric DoS, social engineering,
and findings that require a compromised end-user device or privileged local
access.

## Security posture (summary)

| Control | Status |
|---|---|
| Encryption in transit | TLS 1.2+ |
| Encryption at rest (documents, tokens) | AES-256-GCM with versioned key rotation |
| Tenant isolation | application-layer filters + Postgres Row-Level Security backstop (`prisma/rls/`, `docs/rls-rollout-runbook.md`) + CI ratchet (`npm run lint:tenant-isolation`) |
| Audit trail | immutable in-database `AuditLog` of security-relevant events |
| Runtime logs | structured JSON on stdout (`LOG_FORMAT=json`) with per-request correlation ids — ingestible by the customer's SIEM |
| Authentication | Supabase Auth (Google OAuth, magic link, email/password); SAML SSO for enterprise |
| Secrets | environment-injected; never committed (`.dockerignore` / `.gitignore` exclude `.env*`) |
| Dependency hygiene | `npm audit` in CI + grouped automated dependency PRs |
| Deployment | hosted SaaS today; portable container for single-tenant / self-hosted (`Dockerfile`, `docs/deployment-models.md`) |
| Attestation | SOC 2 Type I targeted Q4 2026 (Type II observation to follow); aligned with the AI Verify governance principles |

For the customer-facing trust surface (sub-processors, DPA, retention SLAs, data
ownership), see `/trust` and `/security` in the product.

## Supported versions

Decision Intel ships continuously; the deployed version is always the supported
one. Self-hosted / single-tenant customers receive security updates through their
release channel as defined in their agreement.
