'use client';

import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MeetingSpeaker {
  id: string;
  name: string;
  speakTimeMs: number;
  wordCount: number;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface MeetingTranscript {
  id: string;
  speakers: MeetingSpeaker[];
  segments: TranscriptSegment[];
  fullText: string;
  language: string;
  confidence: number;
}

// ─── Phase 2 Intelligence Types ─────────────────────────────────────────────

export interface ActionItem {
  id: string;
  text: string;
  assignee: string | null;
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: string;
}

export interface KeyDecision {
  id: string;
  text: string;
  madeBy: string | null;
  context: string;
  decisionType: string;
  confidence: number;
  rationale: string;
  dissent: string | null;
}

export interface SpeakerBiasProfile {
  speaker: string;
  biases: Array<{
    biasType: string;
    count: number;
    avgSeverity: number;
    examples: string[];
  }>;
  dominanceScore: number;
  dissenterScore: number;
}

export interface SimilarMeeting {
  meetingId: string;
  title: string;
  similarity: number;
  outcome: string;
  lessonsLearned: string;
}

// ─── Meeting Summary Types ──────────────────────────────────────────────────

export interface MeetingSummary {
  id: string;
  title: string;
  meetingType: string;
  source: string;
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  participants: string[];
  status: string;
  transcriptionProgress: number;
  errorMessage: string | null;
  humanDecisionId: string | null;
  createdAt: string;
  // Phase 2 intelligence
  summary: string | null;
  actionItems: ActionItem[] | null;
  keyDecisions: KeyDecision[] | null;
  transcript?: {
    id: string;
    speakers: MeetingSpeaker[];
    language: string;
    confidence: number;
  } | null;
  humanDecision?: {
    id: string;
    status: string;
    cognitiveAudit?: {
      decisionQualityScore: number;
      noiseScore: number;
      biasFindings: unknown;
      summary: string;
    } | null;
  } | null;
}

export interface MeetingDetail extends MeetingSummary {
  storagePath: string | null;
  transcript: MeetingTranscript | null;
  // Phase 2 intelligence
  speakerBiases: SpeakerBiasProfile[] | null;
  similarMeetings: SimilarMeeting[] | null;
  humanDecision: {
    id: string;
    status: string;
    content?: string;
    cognitiveAudit: {
      id: string;
      decisionQualityScore: number;
      noiseScore: number;
      sentimentScore: number | null;
      biasFindings: unknown;
      noiseStats: unknown;
      complianceResult: unknown;
      preMortem: unknown;
      swotAnalysis: unknown;
      summary: string;
      teamConsensusFlag: boolean;
      dissenterCount: number;
    } | null;
    nudges: Array<{
      id: string;
      nudgeType: string;
      message: string;
      severity: string;
      createdAt: string;
    }>;
  } | null;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useMeetings(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<{
    meetings: MeetingSummary[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/meetings?page=${page}&limit=${limit}`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    // Poll while any meeting is still processing
    refreshInterval: latestData => {
      if (!latestData?.meetings) return 0;
      const processing = latestData.meetings.some(
        m => m.status === 'uploading' || m.status === 'transcribing' || m.status === 'analyzing'
      );
      return processing ? 3000 : 0;
    },
  });

  return {
    meetings: data?.meetings ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useMeeting(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MeetingDetail>(
    id ? `/api/meetings/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000,
      // Auto-poll while still processing
      refreshInterval: latestData => {
        if (!latestData) return 0;
        const processing = ['uploading', 'transcribing', 'analyzing'].includes(latestData.status);
        return processing ? 2000 : 0;
      },
    }
  );

  return { meeting: data ?? null, isLoading, error, mutate };
}

// ─── Speaker Profiles & Quality Prediction Hooks ──────────────────────────

export interface QualitySignal {
  signal: string;
  value: number;
  impact: number;
  description: string;
}

export interface QualityPrediction {
  predictedScore: number;
  confidence: number;
  signals: QualitySignal[];
  recommendations: string[];
}

export interface QualityPredictionResponse {
  meetingId: string;
  prediction: QualityPrediction;
  dataCompleteness: 'partial' | 'full';
  note: string;
}

export interface SpeakerProfileResponse {
  profile: {
    name: string;
    meetingsAnalyzed: number;
    totalSpeakingTime: number;
    biasProfile: Array<{
      biasType: string;
      totalCount: number;
      avgSeverity: number;
      meetingsWithBias: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    dominanceTrend: Array<{ meetingDate: string; meetingId: string; score: number }>;
    dissenterTrend: Array<{ meetingDate: string; meetingId: string; score: number }>;
    riskFactors: string[];
    strengths: string[];
  };
}

export interface TeamDynamicsResponse {
  snapshot: {
    orgId: string;
    totalMeetingsAnalyzed: number;
    speakers: Array<{
      name: string;
      meetingsAnalyzed: number;
      avgDominance: number;
      avgDissent: number;
    }>;
    dominantSpeakers: string[];
    dissenters: string[];
    mostBalancedMeetings: Array<{ meetingId: string; title: string; balanceScore: number }>;
    cognitiveDiversityScore: number;
    redFlags: string[];
  };
}

export function useMeetingQuality(meetingId: string | null) {
  const { data, error, isLoading } = useSWR<QualityPredictionResponse>(
    meetingId ? `/api/meetings/${meetingId}/quality` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return { prediction: data?.prediction ?? null, dataCompleteness: data?.dataCompleteness, isLoading, error };
}

export function useTeamDynamics(orgId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TeamDynamicsResponse>(
    orgId ? `/api/meetings/speakers?orgId=${orgId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return { snapshot: data?.snapshot ?? null, isLoading, error, mutate };
}

export function useSpeakerProfile(speakerName: string | null, orgId: string | null) {
  const { data, error, isLoading } = useSWR<SpeakerProfileResponse>(
    speakerName && orgId
      ? `/api/meetings/speakers?speaker=${encodeURIComponent(speakerName)}&orgId=${orgId}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return { profile: data?.profile ?? null, isLoading, error };
}
