/*
  Warnings:

  - Added the required column `updatedAt` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BiasInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "compliance" JSONB,
ADD COLUMN     "factCheck" JSONB,
ADD COLUMN     "noiseStats" JSONB,
ADD COLUMN     "preMortem" JSONB,
ADD COLUMN     "sentiment" JSONB,
ADD COLUMN     "speakers" TEXT[],
ADD COLUMN     "structuredContent" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "BiasInstance" ADD COLUMN     "confidence" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "DecisionEmbedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,

    CONSTRAINT "DecisionEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionEmbedding_documentId_idx" ON "DecisionEmbedding"("documentId");

-- CreateIndex
CREATE INDEX "Analysis_documentId_idx" ON "Analysis"("documentId");

-- CreateIndex
CREATE INDEX "BiasInstance_analysisId_idx" ON "BiasInstance"("analysisId");

-- AddForeignKey
ALTER TABLE "DecisionEmbedding" ADD CONSTRAINT "DecisionEmbedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
