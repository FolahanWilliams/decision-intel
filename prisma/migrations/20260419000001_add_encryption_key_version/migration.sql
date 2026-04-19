-- Add key-rotation version stamps to rows that carry encrypted data at
-- rest. Null = legacy (v1). The application treats missing versions as
-- v1 so existing rows continue to decrypt without a backfill. The
-- rotate:encryption-key CLI populates the column once a new key is
-- provisioned and production is ready to cut over.

ALTER TABLE "Document"
  ADD COLUMN "contentKeyVersion" INTEGER;

ALTER TABLE "SlackInstallation"
  ADD COLUMN "botTokenKeyVersion" INTEGER;
