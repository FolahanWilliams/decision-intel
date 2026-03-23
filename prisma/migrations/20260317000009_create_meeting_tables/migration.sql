-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL DEFAULT 'general',
    "source" TEXT NOT NULL DEFAULT 'upload',
    "sourceRef" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "storagePath" TEXT,
    "durationSeconds" INTEGER,
    "participants" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "errorMessage" TEXT,
    "transcriptionProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "actionItems" JSONB,
    "keyDecisions" JSONB,
    "speakerBiases" JSONB,
    "similarMeetings" JSONB,
    "humanDecisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingTranscript" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speakers" JSONB NOT NULL DEFAULT '[]',
    "segments" JSONB NOT NULL DEFAULT '[]',
    "fullText" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_humanDecisionId_key" ON "Meeting"("humanDecisionId");
CREATE INDEX "Meeting_userId_idx" ON "Meeting"("userId");
CREATE INDEX "Meeting_orgId_idx" ON "Meeting"("orgId");
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");
CREATE INDEX "Meeting_createdAt_idx" ON "Meeting"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingTranscript_meetingId_key" ON "MeetingTranscript"("meetingId");
CREATE INDEX "MeetingTranscript_meetingId_idx" ON "MeetingTranscript"("meetingId");

-- AddForeignKey
ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
