/**
 * Tests for meeting-transcript-parser. Locks the speaker-detection +
 * airtime + dominance + dissent-signal logic so a regression on the
 * "Yes Committee" detection (founder's stated value driver for the
 * meeting-transcript document type) can't slip through silently.
 */

import { describe, it, expect } from 'vitest';
import {
  scoreMeetingTranscript,
  toParsedMeetingTranscriptData,
  formatMeetingTranscriptForAudit,
} from './meeting-transcript-parser';

describe('scoreMeetingTranscript', () => {
  it('returns hasSpeakerMarkers=false for plain prose with no Name: markers', () => {
    const result = scoreMeetingTranscript(
      'This is just a meeting summary. The team discussed the acquisition and decided to proceed.'
    );
    expect(result.hasSpeakerMarkers).toBe(false);
    expect(result.speakers).toHaveLength(0);
    expect(result.totalTurns).toBe(0);
  });

  it('extracts speaker turns and computes per-speaker airtime', () => {
    const transcript = `
Alice: We should move forward with the acquisition.
Bob: I disagree with that recommendation.
Alice: My reasoning is the synergies are clear.
Carol: I think we need more diligence first.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.hasSpeakerMarkers).toBe(true);
    expect(result.totalTurns).toBe(4);
    expect(result.speakers).toHaveLength(3);
    const alice = result.speakers.find(s => s.name === 'Alice');
    const bob = result.speakers.find(s => s.name === 'Bob');
    expect(alice?.turnCount).toBe(2);
    expect(bob?.turnCount).toBe(1);
    expect(alice?.airtimeShare).toBeGreaterThan(bob?.airtimeShare ?? 1);
  });

  it('detects severe dominance when one speaker > 50% airtime', () => {
    const transcript = `
CEO: We are absolutely going to acquire this company. The strategic logic is undeniable. Synergies will exceed our model. The board is fully aligned. Customer feedback is glowing. Management team is world-class. Integration risk is minimal. Cultural fit is excellent. Timeline is tight but achievable.
Analyst: Sounds good.
Director: Agreed.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.dominanceFlag).toBe('severe_dominance');
    expect(result.speakers[0].name).toBe('CEO');
    expect(result.speakers[0].airtimeShare).toBeGreaterThan(0.5);
  });

  it('detects lead_dominant in the 35-50% airtime band', () => {
    // Construct a transcript where Alice's airtime lands in the 35-50%
    // band by giving her ~25 words and the other two ~20 words combined.
    const transcript = `
Alice: I have several thoughts about this acquisition target. First strategic fit looks strong on paper. Second the model shows acceptable returns this year.
Bob: I agree with the strategic fit assessment but want to flag two concerns about deal pricing and synergy realization timeline today.
Carol: My main concern is customer concentration risk and the potential renewal cliff in twelve months from now or even sooner.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.dominanceFlag).toBe('lead_dominant');
    const alice = result.speakers.find(s => s.name === 'Alice');
    expect(alice?.airtimeShare).toBeGreaterThanOrEqual(0.35);
    expect(alice?.airtimeShare).toBeLessThanOrEqual(0.5);
  });

  it('detects balanced when no speaker exceeds 35% airtime', () => {
    const transcript = `
Alice: First point. Strategic fit looks good.
Bob: Second point. Financial returns acceptable.
Carol: Third point. Integration risk manageable.
Dave: Fourth point. Customer base is strong.
Eve: Fifth point. Management team is solid.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.dominanceFlag).toBe('balanced');
  });

  it('returns cannot_assess when only one speaker is detected', () => {
    const transcript = `
Alice: I have several thoughts on this proposal.
Alice: First the synergies look good.
Alice: Second the timing is right.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.dominanceFlag).toBe('cannot_assess');
  });

  it('catches hedging language as dissent attempts', () => {
    const transcript = `
Alice: I think we should pause and reconsider this.
Bob: I'd be cautious about the cultural integration assumptions.
Carol: I'm not convinced that the synergy timeline is realistic.
Dave: Have we considered the customer concentration risk?
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.hedgingHits.length).toBeGreaterThanOrEqual(3);
    expect(result.dissentRaised).toBe(true);
  });

  it('flags dissentRaised=false when fewer than 3 hedging hits surfaced', () => {
    const transcript = `
Alice: We should proceed.
Bob: I agree.
Carol: I'd push back on the timeline.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.hedgingHits.length).toBeLessThan(3);
    expect(result.dissentRaised).toBe(false);
  });

  it('handles speaker names with role tags like (CFO)', () => {
    const transcript = `
Sarah Williams (CFO): The financials are concerning.
Mike Chen [CEO]: I disagree.
Sarah Williams (CFO): We need to review the assumptions.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.hasSpeakerMarkers).toBe(true);
    const sarah = result.speakers.find(s => s.name.startsWith('Sarah'));
    expect(sarah?.turnCount).toBe(2);
  });

  it('appends continuation lines to the current turn', () => {
    const transcript = `
Alice: Here is my first thought
which spans multiple lines
and continues here.
Bob: Got it.
`;
    const result = scoreMeetingTranscript(transcript);
    expect(result.totalTurns).toBe(2);
    const alice = result.speakers.find(s => s.name === 'Alice');
    // Alice's word count should reflect ALL three lines, not just the first.
    expect(alice?.wordCount).toBeGreaterThan(8);
  });

  it('caps hedging hits at 8 to keep the structured block readable', () => {
    // 10 lines of hedge-language; only 8 should be captured.
    const lines = Array.from({ length: 10 }, (_, i) => `Speaker${i}: I disagree with the plan.`);
    const result = scoreMeetingTranscript(lines.join('\n'));
    expect(result.hedgingHits.length).toBeLessThanOrEqual(8);
  });
});

describe('toParsedMeetingTranscriptData', () => {
  it('wraps the assessment with kind + version + parsedAt timestamp', () => {
    const assessment = scoreMeetingTranscript('Alice: Hello.\nBob: Hi.');
    const wrapped = toParsedMeetingTranscriptData(assessment, 22);
    expect(wrapped.kind).toBe('meeting_transcript');
    expect(wrapped.version).toBe(1);
    expect(wrapped.bodyLength).toBe(22);
    expect(wrapped.parsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(wrapped.assessment).toBe(assessment);
  });
});

describe('formatMeetingTranscriptForAudit', () => {
  it('returns empty string when no speaker markers were detected', () => {
    const assessment = scoreMeetingTranscript('Just plain prose, no markers here.');
    const wrapped = toParsedMeetingTranscriptData(assessment, 36);
    const block = formatMeetingTranscriptForAudit(wrapped);
    expect(block).toBe('');
  });

  it('renders a structured block with header + airtime + dissent signals', () => {
    const transcript = `
Alice: We should go ahead with the deal.
Bob: I'm concerned about the integration risk.
Carol: I disagree, the synergies are clear.
Dave: I'd push back on the timeline.
`;
    const assessment = scoreMeetingTranscript(transcript);
    const wrapped = toParsedMeetingTranscriptData(assessment, transcript.length);
    const block = formatMeetingTranscriptForAudit(wrapped);
    expect(block).toContain('STRUCTURED MEETING TRANSCRIPT');
    expect(block).toContain('Per-speaker airtime');
    expect(block).toContain('Dissent signals');
    expect(block).toContain('Alice');
    expect(block).toContain('Bob');
  });

  it('flags Yes Committee risk when fewer than 3 hedges surfaced', () => {
    const transcript = `
CEO: Approving the acquisition.
CFO: Approved.
COO: Approved.
`;
    const assessment = scoreMeetingTranscript(transcript);
    const wrapped = toParsedMeetingTranscriptData(assessment, transcript.length);
    const block = formatMeetingTranscriptForAudit(wrapped);
    expect(block).toContain('Yes Committee');
  });
});
