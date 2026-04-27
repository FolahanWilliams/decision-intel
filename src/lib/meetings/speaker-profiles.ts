/**
 * Speaker Profile Aggregator — Meeting Intelligence Data Moat
 *
 * Aggregates speaker behavior across multiple meetings to build longitudinal
 * profiles and team dynamics snapshots. This turns per-meeting bias analysis
 * into a compounding data asset: the more meetings analyzed, the richer and
 * more predictive the profiles become.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import type { SpeakerBiasProfile } from '@/lib/meetings/intelligence';

const log = createLogger('SpeakerProfiles');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BiasAggregate {
  biasType: string;
  /** Total occurrences across all meetings */
  totalCount: number;
  /** Average severity (0-1) across all meetings */
  avgSeverity: number;
  /** Number of meetings where this bias appeared */
  meetingsWithBias: number;
  /** Trend direction over recent meetings */
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendPoint {
  meetingDate: string;
  meetingId: string;
  score: number;
}

export interface SpeakerProfile {
  name: string;
  meetingsAnalyzed: number;
  totalSpeakingTime: number;
  biasProfile: BiasAggregate[];
  dominanceTrend: TrendPoint[];
  dissenterTrend: TrendPoint[];
  riskFactors: string[];
  strengths: string[];
}

export interface TeamDynamicsSnapshot {
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
}

// ─── Internal helpers ───────────────────────────────────────────────────────

interface MeetingRow {
  id: string;
  createdAt: Date;
  speakerBiases: unknown;
  title: string;
}

/**
 * Safely parse the speakerBiases JSON column into typed profiles.
 * Returns an empty array if the data is missing or malformed.
 */
function parseSpeakerBiases(raw: unknown): SpeakerBiasProfile[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SpeakerBiasProfile =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).speaker === 'string'
  );
}

/**
 * Compute a simple linear trend from a series of scores.
 * Returns 'increasing', 'decreasing', or 'stable'.
 */
function computeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable';
  // Compare first-third average to last-third average
  const third = Math.max(1, Math.floor(values.length / 3));
  const firstAvg = values.slice(0, third).reduce((a, b) => a + b, 0) / third;
  const lastAvg = values.slice(-third).reduce((a, b) => a + b, 0) / third;
  const diff = lastAvg - firstAvg;
  if (diff > 5) return 'increasing';
  if (diff < -5) return 'decreasing';
  return 'stable';
}

/**
 * Fetch meetings with speakerBiases for an org, with schema-drift protection.
 */
async function fetchOrgMeetings(orgId: string): Promise<MeetingRow[]> {
  try {
    return (await prisma.meeting.findMany({
      where: {
        orgId,
        status: 'analyzed',
        speakerBiases: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        createdAt: true,
        speakerBiases: true,
        title: true,
      },
      orderBy: { createdAt: 'asc' },
    })) as MeetingRow[];
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift: speakerBiases column not yet migrated');
      // Retry with core fields only in a separate transaction
      try {
        return (
          await prisma.$transaction(async tx => {
            return tx.meeting.findMany({
              where: { orgId, status: 'analyzed' },
              select: { id: true, createdAt: true, title: true },
              orderBy: { createdAt: 'asc' },
            });
          })
        ).map(m => ({ ...m, speakerBiases: null })) as MeetingRow[];
      } catch (err) {
        // Schema-drift fallback also failed — log and return empty per CLAUDE.md fire-and-forget discipline.
        log.warn('meeting fallback query failed (returning empty):', err);
        return [];
      }
    }
    throw err;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Aggregate a single speaker's profile across all meetings in an org.
 *
 * Queries every analyzed meeting, extracts the speaker's bias data from each,
 * and builds a longitudinal profile showing trends, risk factors, and strengths.
 */
export async function aggregateSpeakerProfile(
  speakerName: string,
  orgId: string
): Promise<SpeakerProfile> {
  log.info(`Aggregating profile for "${speakerName}" in org ${orgId}`);

  const meetings = await fetchOrgMeetings(orgId);

  const dominanceTrend: TrendPoint[] = [];
  const dissenterTrend: TrendPoint[] = [];
  const biasMap = new Map<
    string,
    { totalCount: number; severities: number[]; meetingIds: Set<string> }
  >();
  let totalSpeakingTime = 0;
  let meetingsWithSpeaker = 0;

  for (const meeting of meetings) {
    const biases = parseSpeakerBiases(meeting.speakerBiases);
    const profile = biases.find(b => b.speaker.toLowerCase() === speakerName.toLowerCase());

    if (!profile) continue;

    meetingsWithSpeaker++;

    // Accumulate dominance and dissenter trends
    dominanceTrend.push({
      meetingDate: meeting.createdAt.toISOString(),
      meetingId: meeting.id,
      score: profile.dominanceScore,
    });
    dissenterTrend.push({
      meetingDate: meeting.createdAt.toISOString(),
      meetingId: meeting.id,
      score: profile.dissenterScore,
    });

    // Accumulate bias data
    for (const bias of profile.biases) {
      const existing = biasMap.get(bias.biasType) || {
        totalCount: 0,
        severities: [],
        meetingIds: new Set<string>(),
      };
      existing.totalCount += bias.count;
      existing.severities.push(bias.avgSeverity);
      existing.meetingIds.add(meeting.id);
      biasMap.set(bias.biasType, existing);
    }
  }

  // Estimate speaking time from transcript data if available
  try {
    const transcripts = await prisma.meetingTranscript.findMany({
      where: {
        meeting: { orgId, status: 'analyzed' },
      },
      select: { speakers: true },
    });

    for (const t of transcripts) {
      const speakers = Array.isArray(t.speakers) ? t.speakers : [];
      for (const s of speakers) {
        const sp = s as { name?: string; speakTimeMs?: number };
        if (sp.name?.toLowerCase() === speakerName.toLowerCase() && sp.speakTimeMs) {
          totalSpeakingTime += sp.speakTimeMs;
        }
      }
    }
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== 'P2021' && code !== 'P2022') throw err;
    log.warn('Schema drift: MeetingTranscript query failed, skipping speaking time');
  }

  // Build bias aggregates
  const biasProfile: BiasAggregate[] = Array.from(biasMap.entries())
    .map(([biasType, data]) => ({
      biasType,
      totalCount: data.totalCount,
      avgSeverity: data.severities.reduce((a, b) => a + b, 0) / data.severities.length,
      meetingsWithBias: data.meetingIds.size,
      trend: computeTrend(data.severities),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  // Compute risk factors and strengths
  const riskFactors: string[] = [];
  const strengths: string[] = [];

  const dominanceScores = dominanceTrend.map(t => t.score);
  const dissentScores = dissenterTrend.map(t => t.score);
  const avgDominance =
    dominanceScores.length > 0
      ? dominanceScores.reduce((a, b) => a + b, 0) / dominanceScores.length
      : 0;
  const avgDissent =
    dissentScores.length > 0 ? dissentScores.reduce((a, b) => a + b, 0) / dissentScores.length : 0;

  // High dominance risk
  const highDominanceMeetings = dominanceScores.filter(s => s >= 85).length;
  if (highDominanceMeetings >= 3 && meetingsWithSpeaker >= 5) {
    riskFactors.push(
      `Consistently anchors discussions (dominance 85+/100 in ${highDominanceMeetings}/${meetingsWithSpeaker} meetings)`
    );
  } else if (avgDominance >= 75) {
    riskFactors.push(
      `High average dominance (${Math.round(avgDominance)}/100) — may suppress other voices`
    );
  }

  // Recurring biases risk
  for (const bias of biasProfile) {
    if (bias.meetingsWithBias >= 3 && bias.avgSeverity >= 0.6) {
      riskFactors.push(
        `Recurring ${bias.biasType.replace(/_/g, ' ')} (appeared in ${bias.meetingsWithBias} meetings, avg severity ${(bias.avgSeverity * 100).toFixed(0)}%)`
      );
    }
    if (bias.trend === 'increasing' && bias.meetingsWithBias >= 3) {
      riskFactors.push(
        `${bias.biasType.replace(/_/g, ' ')} is trending upward over recent meetings`
      );
    }
  }

  // Low dissent risk
  if (avgDissent < 10 && meetingsWithSpeaker >= 5) {
    riskFactors.push(
      `Rarely challenges group consensus (avg dissent ${Math.round(avgDissent)}/100) — potential groupthink contributor`
    );
  }

  // Strengths
  if (avgDissent >= 40 && meetingsWithSpeaker >= 3) {
    strengths.push(
      `Primary source of dissent — challenges groupthink effectively (avg ${Math.round(avgDissent)}/100)`
    );
  }

  if (avgDominance >= 30 && avgDominance <= 60 && meetingsWithSpeaker >= 3) {
    strengths.push(
      `Balanced participation — contributes without dominating (avg dominance ${Math.round(avgDominance)}/100)`
    );
  }

  if (biasProfile.length === 0 && meetingsWithSpeaker >= 3) {
    strengths.push(`No recurring cognitive biases detected across ${meetingsWithSpeaker} meetings`);
  }

  const dominanceTrendDir = computeTrend(dominanceScores);
  if (dominanceTrendDir === 'decreasing' && meetingsWithSpeaker >= 5) {
    strengths.push('Dominance trending downward — showing improved collaborative behavior');
  }

  log.info(
    `Profile aggregated for "${speakerName}": ${meetingsWithSpeaker} meetings, ${biasProfile.length} bias types, ${riskFactors.length} risks, ${strengths.length} strengths`
  );

  return {
    name: speakerName,
    meetingsAnalyzed: meetingsWithSpeaker,
    totalSpeakingTime,
    biasProfile,
    dominanceTrend,
    dissenterTrend,
    riskFactors,
    strengths,
  };
}

/**
 * Build a team-level dynamics snapshot for an entire org.
 *
 * Aggregates all speakers across all meetings to surface team patterns:
 * who dominates, who dissents, how balanced are discussions, and what
 * red flags should leadership be aware of.
 */
export async function getTeamDynamicsSnapshot(orgId: string): Promise<TeamDynamicsSnapshot> {
  log.info(`Building team dynamics snapshot for org ${orgId}`);

  const meetings = await fetchOrgMeetings(orgId);

  // Accumulate per-speaker data across all meetings
  const speakerData = new Map<
    string,
    {
      dominanceScores: number[];
      dissentScores: number[];
      meetingIds: Set<string>;
    }
  >();

  // Per-meeting balance scores for "most balanced" ranking
  const meetingBalanceScores: Array<{
    meetingId: string;
    title: string;
    balanceScore: number;
  }> = [];

  // Track meetings with zero dissent
  let meetingsWithZeroDissent = 0;
  const recentMeetingCount = Math.min(meetings.length, 5);

  for (const meeting of meetings) {
    const biases = parseSpeakerBiases(meeting.speakerBiases);
    if (biases.length === 0) continue;

    // Per-meeting stats
    const dominanceScores = biases.map(b => b.dominanceScore);
    const dissentScores = biases.map(b => b.dissenterScore);
    const maxDissent = Math.max(...dissentScores, 0);

    if (maxDissent < 15) {
      meetingsWithZeroDissent++;
    }

    // Balance score: low standard deviation of dominance = more balanced
    const avgDominance = dominanceScores.reduce((a, b) => a + b, 0) / dominanceScores.length;
    const variance =
      dominanceScores.reduce((sum, d) => sum + Math.pow(d - avgDominance, 2), 0) /
      dominanceScores.length;
    const stdDev = Math.sqrt(variance);
    // Balance: 100 = perfectly equal, 0 = one person dominates completely
    const balanceScore = Math.max(0, Math.min(100, 100 - stdDev * 2));

    meetingBalanceScores.push({
      meetingId: meeting.id,
      title: meeting.title,
      balanceScore: Math.round(balanceScore),
    });

    // Accumulate per-speaker
    for (const profile of biases) {
      const existing = speakerData.get(profile.speaker) || {
        dominanceScores: [],
        dissentScores: [],
        meetingIds: new Set<string>(),
      };
      existing.dominanceScores.push(profile.dominanceScore);
      existing.dissentScores.push(profile.dissenterScore);
      existing.meetingIds.add(meeting.id);
      speakerData.set(profile.speaker, existing);
    }
  }

  // Build speaker summaries
  const speakers = Array.from(speakerData.entries())
    .map(([name, data]) => ({
      name,
      meetingsAnalyzed: data.meetingIds.size,
      avgDominance: Math.round(
        data.dominanceScores.reduce((a, b) => a + b, 0) / data.dominanceScores.length
      ),
      avgDissent: Math.round(
        data.dissentScores.reduce((a, b) => a + b, 0) / data.dissentScores.length
      ),
    }))
    .sort((a, b) => b.meetingsAnalyzed - a.meetingsAnalyzed);

  // Identify dominant speakers (avg dominance > 70)
  const dominantSpeakers = speakers
    .filter(s => s.avgDominance > 70 && s.meetingsAnalyzed >= 2)
    .map(s => s.name);

  // Identify dissenters (avg dissent > 35)
  const dissenters = speakers
    .filter(s => s.avgDissent > 35 && s.meetingsAnalyzed >= 2)
    .map(s => s.name);

  // Most balanced meetings (top 5)
  const mostBalancedMeetings = meetingBalanceScores
    .sort((a, b) => b.balanceScore - a.balanceScore)
    .slice(0, 5);

  // Cognitive diversity score (0-100)
  let cognitiveDiversityScore = 50; // baseline
  if (speakers.length > 0) {
    // Factor 1: Dissent variety
    const hasDissenters = speakers.some(s => s.avgDissent >= 30);
    if (hasDissenters) cognitiveDiversityScore += 15;
    if (dissenters.length >= 2) cognitiveDiversityScore += 10;

    // Factor 2: Dominance distribution
    const dominanceValues = speakers.map(s => s.avgDominance);
    const dominanceRange = Math.max(...dominanceValues) - Math.min(...dominanceValues);
    if (dominanceRange < 30) {
      cognitiveDiversityScore += 15; // Well-distributed
    } else if (dominanceRange > 60) {
      cognitiveDiversityScore -= 15; // Highly concentrated
    }

    // Factor 3: Meeting-level diversity
    const balanceScores = meetingBalanceScores.map(m => m.balanceScore);
    const avgBalance =
      balanceScores.length > 0
        ? balanceScores.reduce((a, b) => a + b, 0) / balanceScores.length
        : 50;
    cognitiveDiversityScore += Math.round((avgBalance - 50) * 0.2);
  }
  cognitiveDiversityScore = Math.max(0, Math.min(100, cognitiveDiversityScore));

  // Red flags
  const redFlags: string[] = [];

  // Recent meetings with no dissent
  const recentMeetings = meetings.slice(-recentMeetingCount);
  let recentZeroDissent = 0;
  for (const meeting of recentMeetings) {
    const biases = parseSpeakerBiases(meeting.speakerBiases);
    const maxDissent = biases.length > 0 ? Math.max(...biases.map(b => b.dissenterScore)) : 0;
    if (maxDissent < 15) recentZeroDissent++;
  }
  if (recentZeroDissent >= 3 && recentMeetingCount >= 5) {
    redFlags.push(
      `${recentZeroDissent} of last ${recentMeetingCount} meetings had zero dissent — high groupthink risk`
    );
  }

  // Single person dominating
  for (const speaker of speakers) {
    if (speaker.avgDominance >= 80 && speaker.meetingsAnalyzed >= 3) {
      redFlags.push(
        `${speaker.name} dominates discussions (avg ${speaker.avgDominance}/100 across ${speaker.meetingsAnalyzed} meetings)`
      );
    }
  }

  // No one dissents
  if (dissenters.length === 0 && meetings.length >= 5) {
    redFlags.push(
      `No regular dissenters identified across ${meetings.length} meetings — team may lack cognitive diversity`
    );
  }

  // Overall low dissent
  if (meetingsWithZeroDissent > meetings.length * 0.6 && meetings.length >= 5) {
    redFlags.push(
      `${meetingsWithZeroDissent}/${meetings.length} meetings (${Math.round((meetingsWithZeroDissent / meetings.length) * 100)}%) had negligible dissent`
    );
  }

  log.info(
    `Team snapshot for org ${orgId}: ${speakers.length} speakers, ${meetings.length} meetings, diversity=${cognitiveDiversityScore}, ${redFlags.length} red flags`
  );

  return {
    orgId,
    totalMeetingsAnalyzed: meetings.length,
    speakers,
    dominantSpeakers,
    dissenters,
    mostBalancedMeetings,
    cognitiveDiversityScore,
    redFlags,
  };
}
