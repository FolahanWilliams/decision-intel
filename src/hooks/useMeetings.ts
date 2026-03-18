'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
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
    refreshInterval: (latestData) => {
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
      refreshInterval: (latestData) => {
        if (!latestData) return 0;
        const processing = ['uploading', 'transcribing', 'analyzing'].includes(latestData.status);
        return processing ? 2000 : 0;
      },
    }
  );

  return { meeting: data ?? null, isLoading, error, mutate };
}
