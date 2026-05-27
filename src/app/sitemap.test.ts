/**
 * AEO verification — sitemap.xml integrity.
 *
 * Locks the sitemap shape so a future refactor can't silently drop a
 * high-value indexable surface (the GSC 2026-05-18 audit caught 14
 * missing entries; this test makes that recurrence detectable at
 * commit time).
 *
 * Tests cover:
 *   1. The static-routes spine renders
 *   2. Every case-study slug appears in the sitemap
 *   3. Every comparison slug appears in the sitemap
 *   4. Every use-case slug appears in the sitemap
 *   5. No URL appears twice
 *   6. Every URL starts with the canonical site URL
 *   7. No noindex / redirect path leaks (login, calibration, decision-
 *      alpha, design-partner)
 */

import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { getAllCaseSlugs } from '@/lib/data/case-studies';
import { listComparisonSlugs } from '@/lib/data/compare-pages';
import { listUseCaseSlugs } from '@/lib/data/use-cases';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

const NOINDEX_OR_REDIRECT_PATHS = [
  '/login',
  '/calibration', // redirect to /r2f-standard#calibration
  '/decision-alpha', // 308 to /proof
  '/decision-intel-for-boards', // noindex
  '/design-partner', // noindex (unlisted 5-seat program)
  '/pricing/quote', // noindex (public quote builder)
];

describe('sitemap integrity', () => {
  const entries = sitemap();
  const urls = entries.map(e => e.url);

  it('returns a non-empty list', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every URL starts with the canonical site URL', () => {
    for (const url of urls) {
      expect(url.startsWith(siteUrl)).toBe(true);
    }
  });

  it('no URL appears twice', () => {
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('includes the landing page', () => {
    expect(urls).toContain(`${siteUrl}`);
  });

  it('includes every case-study slug', () => {
    for (const slug of getAllCaseSlugs()) {
      expect(urls).toContain(`${siteUrl}/case-studies/${slug}`);
    }
  });

  it('includes every comparison slug', () => {
    for (const slug of listComparisonSlugs()) {
      expect(urls).toContain(`${siteUrl}/compare/${slug}`);
    }
  });

  it('includes every use-case slug', () => {
    for (const slug of listUseCaseSlugs()) {
      expect(urls).toContain(`${siteUrl}/use/${slug}`);
    }
  });

  it('includes the use-case hub at /use', () => {
    expect(urls).toContain(`${siteUrl}/use`);
  });

  it('includes the compare hub at /compare', () => {
    expect(urls).toContain(`${siteUrl}/compare`);
  });

  it('does NOT leak noindex / redirect paths', () => {
    for (const banned of NOINDEX_OR_REDIRECT_PATHS) {
      expect(urls).not.toContain(`${siteUrl}${banned}`);
    }
  });

  it('every entry has a priority between 0 and 1', () => {
    for (const entry of entries) {
      const p = entry.priority;
      if (p === undefined) continue;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('landing page has the highest priority (1.0)', () => {
    const landing = entries.find(e => e.url === `${siteUrl}`);
    expect(landing?.priority).toBe(1.0);
  });
});
