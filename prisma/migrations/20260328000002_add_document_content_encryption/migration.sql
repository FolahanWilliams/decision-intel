-- AlterTable
ALTER TABLE "Document" ADD COLUMN "contentEncrypted" TEXT;
ALTER TABLE "Document" ADD COLUMN "contentIv" TEXT;
ALTER TABLE "Document" ADD COLUMN "contentTag" TEXT;
