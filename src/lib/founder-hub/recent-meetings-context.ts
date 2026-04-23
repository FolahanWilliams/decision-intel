/**
 * Recent-meetings context builder for the Founder AI chat.
 *
 * The founder flagged that the mentor should know "where he is right
 * now" without being told each session. Rather than dumping every
 * meeting row into the prompt (expensive + noisy), we grab up to N
 * recent records within the last 90 days and hand the model a compact
 * summary: one-line headers + trimmed notes / learnings / next steps
 * where they exist. Silent-fails to an empty block on schema drift or
 * empty tables so the chat never breaks.
 *
 * Budget: the block is capped at MAX_CHARS so a prolific founder
 * doesn't blow out the context window. Older / less-useful rows are
 * dropped first; pinned-style signals (status=ready + imminent
 * scheduledAt) are preferred.
 */

import { prisma } from '@/lib/prisma';

const LOOKBACK_DAYS = 90;
const MAX_MEETINGS = 8;
const MAX_CHARS = 4500;

type FounderMeetingLite = {
  id: string;
  meetingType: string;
  prospectName: string | null;
  prospectRole: string | null;
  prospectCompany: string | null;
  meetingContext: string;
  founderAsk: string;
  scheduledAt: Date | null;
  happenedAt: Date | null;
  notes: string | null;
  learnings: string | null;
  nextSteps: string | null;
  outcome: string | null;
  status: string;
  createdAt: Date;
};

function truncate(value: string, max: number): string {
  const clean = (value ?? '').trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

function headerFor(m: FounderMeetingLite): string {
  const parts: string[] = [];
  if (m.prospectName) parts.push(m.prospectName);
  const roleCompany = [m.prospectRole, m.prospectCompany].filter(Boolean).join(' @ ');
  if (roleCompany) parts.push(roleCompany);
  if (parts.length === 0) parts.push(m.meetingType.replace(/_/g, ' '));
  return parts.join(' · ');
}

function formatMeeting(m: FounderMeetingLite): string {
  const date = m.happenedAt ?? m.scheduledAt ?? m.createdAt;
  const when = date.toISOString().slice(0, 10);
  const header = headerFor(m);
  const lines: string[] = [
    `${when} · ${header} · type: ${m.meetingType} · status: ${m.status}${m.outcome ? ` · outcome: ${m.outcome}` : ''}`,
    `  context: ${truncate(m.meetingContext, 220)}`,
    `  ask: ${truncate(m.founderAsk, 180)}`,
  ];
  if (m.notes) lines.push(`  notes: ${truncate(m.notes, 400)}`);
  if (m.learnings) lines.push(`  learnings: ${truncate(m.learnings, 300)}`);
  if (m.nextSteps) lines.push(`  next: ${truncate(m.nextSteps, 220)}`);
  return lines.join('\n');
}

/** Fetch + format a compact summary of the founder's recent meetings.
 *  Returns empty string on any error so callers can unconditionally
 *  append the result without guarding. */
export async function buildRecentMeetingsBlock(): Promise<string> {
  try {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.founderMeeting.findMany({
      where: {
        OR: [
          { happenedAt: { gte: since } },
          { scheduledAt: { gte: since } },
          { createdAt: { gte: since } },
        ],
      },
      orderBy: [{ scheduledAt: 'desc' }, { happenedAt: 'desc' }, { createdAt: 'desc' }],
      take: MAX_MEETINGS * 2,
      select: {
        id: true,
        meetingType: true,
        prospectName: true,
        prospectRole: true,
        prospectCompany: true,
        meetingContext: true,
        founderAsk: true,
        scheduledAt: true,
        happenedAt: true,
        notes: true,
        learnings: true,
        nextSteps: true,
        outcome: true,
        status: true,
        createdAt: true,
      },
    });
    if (rows.length === 0) return '';

    // Priority: status=ready + upcoming first, then recently-happened,
    // then plan-only. Within each bucket: most recent effective-date
    // first. Caps to MAX_MEETINGS after sort.
    const now = Date.now();
    const scored = rows.map(r => {
      const when = (r.scheduledAt ?? r.happenedAt ?? r.createdAt).getTime();
      const isUpcoming = r.status === 'ready' && when >= now;
      const isRecent = r.status === 'completed' && when >= now - 30 * 24 * 60 * 60 * 1000;
      const priority = isUpcoming ? 0 : isRecent ? 1 : 2;
      return { row: r, priority, when };
    });
    scored.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.when - a.when;
    });

    const picked = scored.slice(0, MAX_MEETINGS).map(s => s.row);

    const blocks = picked.map(formatMeeting);
    let combined = blocks.join('\n\n');
    // Trim from the tail if we're over budget — keep the higher-priority
    // rows at the top of the block.
    while (combined.length > MAX_CHARS && blocks.length > 1) {
      blocks.pop();
      combined = blocks.join('\n\n');
    }
    if (combined.length > MAX_CHARS) combined = combined.slice(0, MAX_CHARS - 1) + '…';

    return [
      '=== RECENT MEETINGS (auto-injected from Meetings Log) ===',
      'Real-time snapshot of the founder’s meeting state. Use these to know "where he is right now" — what he just came out of, what is imminent, what learnings he captured. If he references "the Sarah call" or "yesterday’s VC meeting," look here first before asking him to re-explain. When suggesting actions, reference specific meetings by name + date so he sees continuity across sessions.',
      '',
      combined,
    ].join('\n');
  } catch {
    // Schema drift (P2021/P2022 on fresh migration) or DB outage —
    // return empty so the chat continues without this context.
    return '';
  }
}
