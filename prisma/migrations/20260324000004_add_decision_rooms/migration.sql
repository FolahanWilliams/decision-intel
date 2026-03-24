CREATE TABLE "DecisionRoom" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "analysisId" TEXT,
    "title" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "orgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DecisionRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "DecisionRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "BlindPrior" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultAction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlindPrior_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BlindPrior_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "DecisionRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RoomParticipant_roomId_userId_key" ON "RoomParticipant"("roomId", "userId");
CREATE UNIQUE INDEX "BlindPrior_roomId_userId_key" ON "BlindPrior"("roomId", "userId");
CREATE INDEX "DecisionRoom_createdBy_idx" ON "DecisionRoom"("createdBy");
CREATE INDEX "DecisionRoom_orgId_idx" ON "DecisionRoom"("orgId");
CREATE INDEX "DecisionRoom_status_idx" ON "DecisionRoom"("status");
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");
CREATE INDEX "BlindPrior_roomId_idx" ON "BlindPrior"("roomId");
