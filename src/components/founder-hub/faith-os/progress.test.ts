import { describe, it, expect } from 'vitest';
import {
  computeFaithProgress,
  type ProgressJournalEntry,
  type ProgressReadingRow,
  type ProgressCheckin,
} from './progress';

const TODAY = '2026-05-28';

function j(partial: Partial<ProgressJournalEntry>): ProgressJournalEntry {
  return {
    kind: 'reflection',
    scriptureRef: null,
    answered: false,
    createdAt: `${TODAY}T12:00:00.000Z`,
    ...partial,
  };
}

describe('computeFaithProgress', () => {
  it('returns a safe empty shape for no data', () => {
    const p = computeFaithProgress([], [], [], TODAY);
    expect(p.totalEntries).toBe(0);
    expect(p.supplicationCount).toBe(0);
    expect(p.answeredRate).toBe(0);
    expect(p.prayerStreak).toBe(0);
    expect(p.bothStreak).toBe(0);
    expect(p.recurringScripture).toEqual([]);
    // heatmap always renders the full window
    expect(p.disciplineDays).toHaveLength(91);
    expect(p.disciplineDays.every(d => d.level === 0)).toBe(true);
  });

  it('counts ACTS distribution and answered-prayer rate', () => {
    const journal: ProgressJournalEntry[] = [
      j({ kind: 'supplication', answered: true }),
      j({ kind: 'supplication', answered: false }),
      j({ kind: 'supplication', answered: true }),
      j({ kind: 'adoration' }),
      j({ kind: 'confession' }),
    ];
    const p = computeFaithProgress(journal, [], [], TODAY);
    expect(p.totalEntries).toBe(5);
    expect(p.actsDistribution.supplication).toBe(3);
    expect(p.actsDistribution.adoration).toBe(1);
    expect(p.supplicationCount).toBe(3);
    expect(p.answeredCount).toBe(2);
    expect(p.answeredRate).toBeCloseTo(2 / 3, 5);
  });

  it('computes consecutive prayer/scripture/both streaks ending today', () => {
    const checkins: ProgressCheckin[] = [
      { date: '2026-05-28', prayer: true, scripture: true },
      { date: '2026-05-27', prayer: true, scripture: false },
      { date: '2026-05-26', prayer: true, scripture: true },
    ];
    const p = computeFaithProgress([], [], checkins, TODAY);
    expect(p.prayerStreak).toBe(3); // 28, 27, 26 all prayer
    expect(p.scriptureStreak).toBe(1); // 28 only (27 breaks it)
    expect(p.bothStreak).toBe(1); // 28 only (27 not both)
  });

  it('does not break the streak when today is not logged yet', () => {
    // today (28) absent; yesterday (27) + day before (26) both prayer
    const checkins: ProgressCheckin[] = [
      { date: '2026-05-27', prayer: true, scripture: true },
      { date: '2026-05-26', prayer: true, scripture: true },
    ];
    const p = computeFaithProgress([], [], checkins, TODAY);
    expect(p.prayerStreak).toBe(2);
    expect(p.bothStreak).toBe(2);
  });

  it('reports reading completion per plan against the SSOT totals', () => {
    const reading: ProgressReadingRow[] = [
      {
        planId: 'proverbs',
        reference: 'Proverbs 1',
        reflection: null,
        completedAt: `${TODAY}T00:00:00Z`,
      },
      {
        planId: 'proverbs',
        reference: 'Proverbs 2',
        reflection: 'note',
        completedAt: `${TODAY}T00:00:00Z`,
      },
      {
        planId: 'founders-journey',
        reference: 'Joshua 1:9',
        reflection: null,
        completedAt: `${TODAY}T00:00:00Z`,
      },
    ];
    const p = computeFaithProgress([], reading, [], TODAY);
    const proverbs = p.readingCompletion.find(r => r.planId === 'proverbs');
    const journey = p.readingCompletion.find(r => r.planId === 'founders-journey');
    expect(proverbs?.done).toBe(2);
    expect(proverbs?.total).toBe(31);
    expect(journey?.done).toBe(1);
  });

  it('surfaces recurring scripture (chapter-normalised, ≥2 only)', () => {
    const journal: ProgressJournalEntry[] = [
      j({ scriptureRef: 'Proverbs 3:5-6' }),
      j({ scriptureRef: 'Proverbs 3:7' }), // same chapter → normalises to "Proverbs 3"
      j({ scriptureRef: 'Psalm 23:1' }), // appears once → excluded
    ];
    const reading: ProgressReadingRow[] = [
      {
        planId: 'proverbs',
        reference: 'Proverbs 16',
        reflection: null,
        completedAt: `${TODAY}T00:00:00Z`,
      },
    ];
    const p = computeFaithProgress(journal, reading, [], TODAY);
    const prov3 = p.recurringScripture.find(r => r.ref === 'Proverbs 3');
    expect(prov3?.count).toBe(2);
    expect(p.recurringScripture.some(r => r.ref === 'Psalm 23')).toBe(false); // only once
  });

  it('buckets journal cadence into the trailing 12 weeks', () => {
    const journal: ProgressJournalEntry[] = [
      j({ createdAt: '2026-05-28T10:00:00Z' }), // this week
      j({ createdAt: '2026-05-27T10:00:00Z' }), // this week
      j({ createdAt: '2026-05-20T10:00:00Z' }), // prior week
    ];
    const p = computeFaithProgress(journal, [], [], TODAY);
    expect(p.cadence).toHaveLength(12);
    // newest week last (sorted ascending by weekStart)
    const total = p.cadence.reduce((s, w) => s + w.count, 0);
    expect(total).toBe(3);
    expect(p.cadence[p.cadence.length - 1].count).toBe(2); // this week has 2
  });
});
