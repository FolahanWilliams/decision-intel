-- CreateTable
CREATE TABLE "CacheEntry" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CacheEntry_expiresAt_idx" ON "CacheEntry"("expiresAt");
