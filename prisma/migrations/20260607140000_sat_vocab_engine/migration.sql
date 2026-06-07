-- SAT Prep vocab engine: quiz substrate + honest-SR signal columns on SatVocabCard.
-- Additive only, all nullable / defaulted — zero-risk, pre-migration rows behave as before.

ALTER TABLE "SatVocabCard"
  ADD COLUMN "userMnemonic" TEXT,
  ADD COLUMN "ipa" TEXT,
  ADD COLUMN "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "antonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "relatedWords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "clozeSentence" TEXT,
  ADD COLUMN "responseMsEma" DOUBLE PRECISION,
  ADD COLUMN "failedTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;
