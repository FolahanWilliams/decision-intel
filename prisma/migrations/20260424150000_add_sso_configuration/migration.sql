-- Per-Org SAML / OIDC SSO configuration.
-- Maps an email domain to a stable Supabase `sso_provider_id` (UUID returned
-- by `supabase sso add`). One domain = one config = one Org. See
-- prisma/schema.prisma model `SsoConfiguration` for the field-level doc.

CREATE TABLE "SsoConfiguration" (
    "id"              TEXT NOT NULL,
    "orgId"           TEXT NOT NULL,
    "domain"          TEXT NOT NULL,
    "providerId"      TEXT NOT NULL,
    "protocol"        TEXT NOT NULL DEFAULT 'saml',
    "displayName"     TEXT,
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "activatedAt"     TIMESTAMP(3),
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SsoConfiguration_domain_key" ON "SsoConfiguration"("domain");
CREATE INDEX "SsoConfiguration_orgId_idx" ON "SsoConfiguration"("orgId");
CREATE INDEX "SsoConfiguration_providerId_idx" ON "SsoConfiguration"("providerId");

ALTER TABLE "SsoConfiguration"
    ADD CONSTRAINT "SsoConfiguration_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
