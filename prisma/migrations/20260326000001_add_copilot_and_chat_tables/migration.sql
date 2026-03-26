-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "pinnedDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New Decision',
    "decisionPrompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvedAt" TIMESTAMP(3),
    "decisionSummary" TEXT,
    "dqiScore" DOUBLE PRECISION,
    "chosenOption" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopilotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotOutcome" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "outcome" TEXT NOT NULL,
    "impactScore" INTEGER,
    "lessonsLearned" TEXT,
    "whatWorked" TEXT,
    "whatFailed" TEXT,
    "wouldChooseSame" BOOLEAN,
    "helpfulAgents" TEXT[],
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "agentType" TEXT,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "toolCalls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatSession_userId_updatedAt_idx" ON "ChatSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "CopilotSession_userId_updatedAt_idx" ON "CopilotSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CopilotSession_orgId_idx" ON "CopilotSession"("orgId");

-- CreateIndex
CREATE INDEX "CopilotSession_status_idx" ON "CopilotSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CopilotOutcome_sessionId_key" ON "CopilotOutcome"("sessionId");

-- CreateIndex
CREATE INDEX "CopilotOutcome_userId_idx" ON "CopilotOutcome"("userId");

-- CreateIndex
CREATE INDEX "CopilotOutcome_orgId_idx" ON "CopilotOutcome"("orgId");

-- CreateIndex
CREATE INDEX "CopilotOutcome_outcome_idx" ON "CopilotOutcome"("outcome");

-- CreateIndex
CREATE INDEX "CopilotOutcome_reportedAt_idx" ON "CopilotOutcome"("reportedAt");

-- CreateIndex
CREATE INDEX "CopilotTurn_sessionId_createdAt_idx" ON "CopilotTurn"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotOutcome" ADD CONSTRAINT "CopilotOutcome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CopilotSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotTurn" ADD CONSTRAINT "CopilotTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CopilotSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
