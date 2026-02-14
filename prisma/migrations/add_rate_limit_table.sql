-- Migration: Add RateLimit table for PostgreSQL-based rate limiting
-- Run this in Supabase SQL Editor

-- Create RateLimit table
CREATE TABLE IF NOT EXISTS "RateLimit" (
    id TEXT PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    identifier TEXT NOT NULL,
    route TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "RateLimit_identifier_route_key" UNIQUE (identifier, route)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "RateLimit_identifier_idx" ON "RateLimit"(identifier);
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- Verify table was created
SELECT * FROM "RateLimit" LIMIT 1;
