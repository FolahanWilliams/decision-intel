-- SAT Prep — founder-private study surface (2026-06-07)
-- Additive only: four new tables, all partitioned by userId. Zero-risk,
-- schema-drift tolerant — no existing table or column is touched, so every
-- other surface behaves unchanged until the founder runs `npx prisma migrate
-- deploy` lock-step with the deploy.

-- 1. Error log — the heart. One row per attempted/missed question worth
--    analysing. Confidence × wasCorrect drives the Brier calibration loop.
CREATE TABLE "SatErrorLogEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'daily_drill',
    "section" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "rootCause" TEXT,
    "confidence" INTEGER,
    "wasCorrect" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatErrorLogEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SatErrorLogEntry_userId_idx" ON "SatErrorLogEntry"("userId");
CREATE INDEX "SatErrorLogEntry_userId_date_idx" ON "SatErrorLogEntry"("userId", "date");
CREATE INDEX "SatErrorLogEntry_userId_section_skill_idx" ON "SatErrorLogEntry"("userId", "section", "skill");

-- 2. Daily training session — one per day, the input-streak + focus tracker.
CREATE TABLE "SatDailySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "focusSkills" JSONB,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatDailySession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SatDailySession_userId_date_key" ON "SatDailySession"("userId", "date");
CREATE INDEX "SatDailySession_userId_idx" ON "SatDailySession"("userId");
CREATE INDEX "SatDailySession_userId_date_idx" ON "SatDailySession"("userId", "date");

-- 3. Official test result — the ONLY source of the projected score (real
--    Bluebook/Khan/released/real-SAT scores; never the in-app AI questions).
CREATE TABLE "SatTestResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'bluebook',
    "section" TEXT NOT NULL DEFAULT 'full',
    "rwScore" INTEGER,
    "mathScore" INTEGER,
    "totalScore" INTEGER,
    "rwCorrect" INTEGER,
    "rwTotal" INTEGER,
    "mathCorrect" INTEGER,
    "mathTotal" INTEGER,
    "durationMin" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatTestResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SatTestResult_userId_idx" ON "SatTestResult"("userId");
CREATE INDEX "SatTestResult_userId_date_idx" ON "SatTestResult"("userId", "date");

-- 4. Vocab card — persisted SM-2 spaced-repetition state.
CREATE TABLE "SatVocabCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "mnemonic" TEXT,
    "etymology" TEXT,
    "exampleSentence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "nextDue" TIMESTAMP(3),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "successfulReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatVocabCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SatVocabCard_userId_word_key" ON "SatVocabCard"("userId", "word");
CREATE INDEX "SatVocabCard_userId_idx" ON "SatVocabCard"("userId");
CREATE INDEX "SatVocabCard_userId_nextDue_idx" ON "SatVocabCard"("userId", "nextDue");
