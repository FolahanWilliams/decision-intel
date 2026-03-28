-- AlterTable: make expiresAt nullable (case studies don't expire)
ALTER TABLE "ShareLink" ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable: add isCaseStudy flag
ALTER TABLE "ShareLink" ADD COLUMN "isCaseStudy" BOOLEAN NOT NULL DEFAULT false;
