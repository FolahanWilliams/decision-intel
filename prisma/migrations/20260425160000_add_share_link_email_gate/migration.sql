-- 3.3 deep — recipient-email gate on share links.
-- Adds an opt-in flag on ShareLink and a viewer-email column on
-- ShareLinkAccess so a procurement-grade share can require the recipient
-- to enter an email before the analysis loads (and the email is captured
-- on the access log for follow-up).

ALTER TABLE "ShareLink"
  ADD COLUMN IF NOT EXISTS "requireEmail" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ShareLinkAccess"
  ADD COLUMN IF NOT EXISTS "viewerEmail" TEXT;
