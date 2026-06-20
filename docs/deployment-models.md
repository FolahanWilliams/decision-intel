# Deployment models — where Decision Intel runs

Honest map of how the product is deployed today, what regulated buyers
(banks, institutions) require, and exactly what each tier costs to reach. Written
to be handed to a governance architect during diligence — including the real
lock-ins, not a marketing version.

## The requirement a bank actually stated

> "An HTTP web app can't work for banks that need it running on their own
> infrastructure — and they need accessible runtime logs."

Two distinct asks:
1. **Deployment locus** — runs inside the customer's own cloud/VPC or datacenter
   (single-tenant / self-hosted), so data never leaves their boundary.
2. **Observability ownership** — the customer's own SIEM (Splunk / ELK / Datadog /
   CloudWatch) ingests the runtime logs; they are not trapped in a vendor console.

Both are **ceiling** requirements (F500 / bank tier), not wedge requirements. The
GTM sequence is individual buyers → design-partner bridge → enterprise ceiling, and
"Premature Enterprise Escalation" is the named #1 failure mode. We do **not** build a
full on-prem product before the wedge fires. We do lay the cheap, dual-purpose
foundation below so the eventual port is months, not years — and so this exact
conversation has an honest answer.

## The three tiers

| Tier | Who | Runs where | Status |
|---|---|---|---|
| **A · Multi-tenant SaaS** | individual buyers, design partners | Vercel + hosted Supabase, shared `decision-intel.com` | **live today** |
| **B · Single-tenant dedicated** | mid-market, security-sensitive | one container + one Postgres per customer, in a region/cloud they approve | **foundation shipped** (container + structured logs); needs B-list below |
| **C · Self-hosted / BYOC** | banks, regulated institutions | customer's own VPC / k8s / datacenter, customer-managed | **future ceiling**; needs C-list below |

Tier B (a dedicated instance in an approved region the customer's security team
signs off on) satisfies a large share of "runs on their own things" *without* full
on-prem, and is the realistic first enterprise step. The Gmail-in-Workspace analogy
the architect used maps to Tier B: a SaaS the customer controls the tenancy, data
boundary, admin, and logs of.

## Dependency-swap matrix (the lock-ins, named)

| Concern | Tier A today | Self-host swap | Status |
|---|---|---|---|
| Compute | Vercel serverless | **container** (Dockerfile, `output: standalone`) → k8s/ECS/VM | ✅ **shipped** (this change) |
| Database | hosted Supabase Postgres | their managed/own Postgres via `DATABASE_URL` | ✅ already env-driven |
| Runtime logs | Vercel/Sentry console | **structured JSON on stdout** (`LOG_FORMAT=json`) → their SIEM | ✅ **shipped** (this change) |
| Audit trail | `AuditLog` table in our DB | same table in *their* DB (DB is theirs in B/C) | ✅ already in-DB |
| Secrets | Vercel env | injected at runtime from their KMS/Vault/k8s secrets (never baked into the image) | ✅ env-driven; `.dockerignore` excludes `.env` |
| **Identity / auth** | **Supabase Auth (hosted)** | **OIDC / SAML against the customer IdP** | ⚠️ **the one real lock-in to retire** |
| LLM inference | Gemini/Grok via AI gateway (egress to a vendor) | a model endpoint inside their network (Azure OpenAI in-tenant, Bedrock, private gateway) | ⚠️ config + an egress-policy story |
| Object/email/etc. | Resend, Cloudflare, Google Drive OAuth | optional integrations, disable-able per deploy | ◻️ make each individually disable-able |

✅ ready · ⚠️ real work, scoped · ◻️ minor config

**The honest headline:** the compute and observability lock-ins are retired by this
change. The remaining hard one is **Supabase Auth** — it's a hosted dependency, and
a self-hosted bank deploy needs auth to run against *their* identity provider
(which they want anyway). That's a real, scoped project (abstract the auth boundary
to OIDC/SAML), not a checkbox — and it should not be started until a real
enterprise opportunity with budget is on the table.

## What shipped now (the cheap, dual-purpose foundation)

- **Container**: `Dockerfile` (multi-stage, non-root, healthcheck on `/api/health`)
  + `output: 'standalone'` gated on `BUILD_STANDALONE=1` so the Vercel build is
  byte-identical. Produces a portable image that runs on any container platform.
- **Structured logs**: `LOG_FORMAT=json` (default in production) emits one JSON
  event per line on stdout/stderr — ingestible by `docker logs`, CloudWatch,
  Splunk, ELK, Datadog, Vercel. Stamps `service` / `deployment` / `commit` from
  env so a single-tenant instance's logs are self-identifying. This also closes
  the SaaS-side observability gap (logs were previously plaintext, Vercel-only).
- This doc — so the architecture answer is written down, lock-ins and all.

These three help **Tier A today** (better logs, reproducible builds) and are
prerequisites for **B/C** — zero wasted work, no premature rebuild.

## What is deliberately NOT built yet (and why)

- **OIDC/SAML auth abstraction** — the real self-host blocker. Scoped, not started:
  needs a real enterprise opportunity to justify the auth-boundary refactor.
- **In-network LLM endpoint + egress policy** — a bank won't allow egress to a
  public model API. Needs the model provider to be swappable to their endpoint and
  a documented data-flow/egress story. Config-shaped, deferred to first enterprise.
- **Helm chart / Terraform / air-gapped install** — packaging for k8s/IaC. Only
  worth it once a customer names their platform.
- **Per-instance update/patch channel** — how a self-hosted customer gets security
  updates. A real operational commitment; design when Tier C is real.

Building any of these now would be Premature Enterprise Escalation. The container +
structured logs are the correct amount to do today: they're useful immediately and
they keep the door open.

## Runbook (Tier B, single-tenant container)

```bash
# Build the standalone image (sets BUILD_STANDALONE=1 internally)
docker build -t decision-intel:<ver> .

# Run, with secrets injected at runtime (never baked into the image)
docker run --env-file .env.production -p 3000:3000 decision-intel:<ver>

# Logs are JSON on stdout — ship them wherever the customer's SIEM lives
docker logs -f <container> | <their-log-forwarder>
```

Release step (against the customer's DB, not at image-build time):
`npx prisma migrate deploy` — applies the migration history to their Postgres.
RLS (`prisma/rls/`, `docs/rls-rollout-runbook.md`) gives DB-level tenant isolation
even in a single-tenant deploy as defense-in-depth.
