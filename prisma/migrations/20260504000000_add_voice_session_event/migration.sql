-- CreateTable
CREATE TABLE "VoiceSessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "personaId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceSessionEvent_sessionId_idx" ON "VoiceSessionEvent"("sessionId");

-- CreateIndex
CREATE INDEX "VoiceSessionEvent_eventType_createdAt_idx" ON "VoiceSessionEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceSessionEvent_createdAt_idx" ON "VoiceSessionEvent"("createdAt");
