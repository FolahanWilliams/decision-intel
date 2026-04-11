export type OutreachIntent = 'connect' | 'pilot' | 'poc' | 'investor';

export const OUTREACH_INTENTS: OutreachIntent[] = ['connect', 'pilot', 'poc', 'investor'];

export const INTENT_LABELS: Record<OutreachIntent, string> = {
  connect: 'Connect',
  pilot: 'Pilot Customer',
  poc: 'Proof of Concept',
  investor: 'Investor',
};

export const INTENT_DESCRIPTIONS: Record<OutreachIntent, string> = {
  connect: 'Warm, curiosity-led — no ask, just start a conversation',
  pilot: 'Offer a 30-day free audit, proof-point heavy',
  poc: 'Technical, scoped 2-week pilot proposal',
  investor: 'Positioning-first, moat narrative, why-now hook',
};

export interface ExtractedProfile {
  name: string | null;
  role: string | null;
  company: string | null;
  location: string | null;
  tenure: string | null;
  recentTopics: string[];
  inferredPriorities: string[];
  potentialObjections: string[];
  icpFit: 'high' | 'medium' | 'low' | 'unknown';
  icpFitReason: string;
}

export interface IntentCallouts {
  kind: OutreachIntent;
  headline: string;
  body: string;
  bullets: string[];
}

export interface GeneratedOutreach {
  profile: ExtractedProfile;
  message: string;
  talkingPoints: string[];
  warmOpeners: string[];
  callouts: IntentCallouts;
}

export type OutreachStreamEvent =
  | { type: 'step'; step: 'parse' | 'analyze' | 'match' | 'draft'; label: string }
  | { type: 'profile'; profile: ExtractedProfile }
  | { type: 'result'; outreach: GeneratedOutreach; artifactId: string }
  | { type: 'error'; message: string }
  | { type: 'done' };
