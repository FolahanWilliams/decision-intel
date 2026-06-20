# Self-host / single-tenant container image for Decision Intel.
#
# This is the "runs on the customer's own infrastructure" artifact: a portable
# OCI image a bank/institution can run in their own VPC on Kubernetes, ECS, or a
# plain VM — no Vercel required. It pairs with `output: 'standalone'` (gated on
# BUILD_STANDALONE=1 in next.config.ts) so the hosted Vercel build is untouched.
#
# What still has to be provided by the host (see docs/deployment-models.md):
#   - a Postgres database (their own / their cloud's managed PG) via DATABASE_URL
#   - identity: today via Supabase Auth env; OIDC/SAML against the customer IdP
#     is the documented self-host swap (the one real lock-in to retire)
#   - an LLM endpoint reachable from their network (private model / gateway)
#   - secrets injected at runtime (their KMS / Vault / k8s secrets) — never baked
#
# Build:   docker build -t decision-intel:local .
# Run:     docker run --env-file .env.production -p 3000:3000 decision-intel:local
# Logs:    structured JSON on stdout (LOG_FORMAT=json) → pipe to their SIEM.

# ---- deps ----------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# openssl is required by Prisma's query engine at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- build ---------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
# Generate Prisma client + zod schemas, then build the standalone server.
# DB-touching build steps (migrate/seed) are intentionally skipped here — those
# run as a release step against the customer's DB, not at image-build time.
RUN npx prisma generate \
  && NODE_OPTIONS='--max-old-space-size=6144' npx tsc --noEmit \
  && NODE_OPTIONS='--max-old-space-size=7168' npx next build --webpack

# ---- runtime -------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV LOG_FORMAT=json
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user (regulated-deploy baseline).
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Next standalone output: the minimal server + only the deps it actually uses.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Prisma client + the migration history, so the release job can `migrate deploy`.
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Liveness: the app already exposes GET /api/health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
