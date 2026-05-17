import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseFeedDate } from './newsService';

/**
 * Regression lock for the 2026-05-17 production crash-spam: several RSS
 * feeds (notably FCA) emit non-standard pubDate strings. `new Date(raw)`
 * resolved them to `Invalid Date`, which threw inside the Prisma upsert
 * ("Invalid value for argument `publishedAt`") and logged a full object
 * per article — serially slowing the whole news sync. `parseFeedDate`
 * must always return a VALID Date so a single bad date can never break
 * or slow the sync.
 */
describe('parseFeedDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses a valid RFC-822 RSS pubDate', () => {
    const d = parseFeedDate('Wed, 14 May 2025 09:00:00 GMT');
    expect(d.getTime()).not.toBeNaN();
    expect(d.getUTCFullYear()).toBe(2025);
  });

  it('parses a valid ISO-8601 string', () => {
    const d = parseFeedDate('2025-05-14T09:00:00.000Z');
    expect(d.toISOString()).toBe('2025-05-14T09:00:00.000Z');
  });

  it('falls back to "now" for an unparseable string (the FCA bug)', () => {
    const fixed = new Date('2026-05-17T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixed);
    const d = parseFeedDate('not a date at all');
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.toISOString()).toBe(fixed.toISOString());
  });

  it('falls back to "now" for undefined / empty pubDate', () => {
    expect(Number.isNaN(parseFeedDate(undefined).getTime())).toBe(false);
    expect(Number.isNaN(parseFeedDate('').getTime())).toBe(false);
  });

  it('never returns an Invalid Date for any input shape', () => {
    for (const raw of [
      undefined,
      '',
      '   ',
      'Invalid Date',
      '0000-00-00',
      'May 32, 2025',
      '🗓️',
      'Mon, 99 Zzz 9999 99:99:99 ZZZ',
    ]) {
      const d = parseFeedDate(raw);
      expect(Number.isNaN(d.getTime())).toBe(false);
    }
  });
});
