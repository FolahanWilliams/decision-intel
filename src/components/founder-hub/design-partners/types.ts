import type { PartnerRichProfile } from '@/types/partner-profile';

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'scheduled_call'
  | 'accepted'
  | 'declined'
  | 'withdrawn';

export interface Application {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  linkedInUrl: string | null;
  industry: string;
  teamSize: string;
  memoCadence: string | null;
  currentStack: string | null;
  whyNow: string;
  source: string | null;
  status: ApplicationStatus;
  founderNotes: string | null;
  reviewedAt: string | null;
  callScheduledAt: string | null;
  submittedAt: string;
  slotOrder?: number | null;
  richProfile?: PartnerRichProfile | null;
}

export interface PartnerContact {
  id: string;
  partnerAppId: string;
  name: string;
  role: string;
  linkedInUrl: string | null;
  linkedInInfo: string;
  meetingContext: string | null;
  founderAsk: string | null;
  generatedPrep: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_SEATS = 5;
