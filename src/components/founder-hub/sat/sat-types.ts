/** SAT Prep — client-side row shapes (no Prisma import; matches the API responses). */
import type { SatSection } from './sat-content';

export interface SatErrorEntry {
  id: string;
  date: string;
  source: string;
  section: SatSection;
  skill: string;
  rootCause: string | null;
  confidence: number | null;
  wasCorrect: boolean;
  note: string | null;
  explanation: string | null;
  // SM-2 spaced-review state over the miss itself (the active error loop).
  nextDue: string | null;
  reviewArchived: boolean;
  repetitions: number;
  intervalDays: number;
  totalReviews: number;
  successfulReviews: number;
  createdAt?: string;
}

export interface SatSettings {
  benchmarkTestDate: string | null;
  targetTestDate: string | null;
}

export interface SatSession {
  id: string;
  date: string;
  focusSkills: string[] | null;
  attempted: number;
  correct: number;
  minutes: number | null;
  completed: boolean;
  xpAwarded: number;
}

export interface SatTest {
  id: string;
  date: string;
  source: string;
  section: string;
  rwScore: number | null;
  mathScore: number | null;
  totalScore: number | null;
  rwCorrect: number | null;
  rwTotal: number | null;
  mathCorrect: number | null;
  mathTotal: number | null;
  durationMin: number | null;
  notes: string | null;
}

export interface SatVocab {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: string | null;
  mnemonic: string | null;
  userMnemonic: string | null;
  etymology: string | null;
  exampleSentence: string | null;
  ipa: string | null;
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  clozeSentence: string | null;
  status: string;
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  lastReviewed: string | null;
  nextDue: string | null;
  totalReviews: number;
  successfulReviews: number;
  responseMsEma: number | null;
  failedTypes: string[];
  consecutiveFailures: number;
}

export interface DrillQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface GenVocabWord {
  word: string;
  definition: string;
  partOfSpeech?: string;
  mnemonic?: string;
  etymology?: string;
  exampleSentence?: string;
  ipa?: string;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  clozeSentence?: string;
}

/** The founder's local calendar day (their day, not UTC) — matches FounderOs convention. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
