/**
 * JURISDICTION_REGISTRY regression suite (F-3 ship 2026-05-13).
 *
 * Locks the matcher's behaviour + the canonical 10-entry baseline so
 * any future jurisdiction addition (Rwanda-specific, Ghana 2025 update,
 * etc.) doesn't silently break the existing matches.
 *
 * Tested invariants:
 *   - matchJurisdictions returns entries in canonical registry order.
 *   - Single-country matches (Nigeria, Kenya, etc.) hit exactly once.
 *   - WAEMU multi-country triggers collapse to ONE bullet, not N.
 *   - Case-insensitivity holds across triggers.
 *   - Unknown countries return empty array.
 *   - Self-narrative bullets are well-formed (start with "• ", end with ".")
 *   - All 10 baseline jurisdictions remain present with their canonical IDs.
 */

import { describe, it, expect } from 'vitest';
import {
  JURISDICTION_REGISTRY,
  matchJurisdictions,
  matchJurisdictionNarratives,
  type JurisdictionId,
} from './jurisdiction-registry';

describe('JURISDICTION_REGISTRY canonical shape', () => {
  it('contains all 10 canonical jurisdictions in stable order', () => {
    const ids = JURISDICTION_REGISTRY.map(e => e.id);
    expect(ids).toEqual([
      'nigeria',
      'kenya',
      'ghana',
      'waemu',
      'south_africa',
      'egypt',
      'tanzania',
      'east_africa_peers',
      'argentina',
      'turkey',
    ] satisfies JurisdictionId[]);
  });

  it('every entry has a well-formed narrative bullet', () => {
    for (const entry of JURISDICTION_REGISTRY) {
      expect(entry.narrative.startsWith('• ')).toBe(true);
      // Should end with a period (full-stop discipline for procurement reading).
      expect(entry.narrative.trimEnd().endsWith('.')).toBe(true);
      // Must mention the label (or at minimum a recognisable currency reference)
      // to remain procurement-grade.
      expect(entry.narrative.length).toBeGreaterThan(80);
    }
  });

  it('every entry has at least one trigger', () => {
    for (const entry of JURISDICTION_REGISTRY) {
      expect(entry.triggers.length).toBeGreaterThan(0);
    }
  });

  it('triggers are all lowercase (case-insensitive matching assumption)', () => {
    for (const entry of JURISDICTION_REGISTRY) {
      for (const trigger of entry.triggers) {
        expect(trigger).toBe(trigger.toLowerCase());
      }
    }
  });
});

describe('matchJurisdictions — single-country', () => {
  it('matches Nigeria on "Nigeria"', () => {
    const hits = matchJurisdictions(['Nigeria']);
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe('nigeria');
  });

  it('is case-insensitive', () => {
    expect(matchJurisdictions(['NIGERIA'])).toHaveLength(1);
    expect(matchJurisdictions(['nigeria'])).toHaveLength(1);
    expect(matchJurisdictions(['NiGeRiA'])).toHaveLength(1);
  });

  it('matches Kenya', () => {
    expect(matchJurisdictions(['Kenya'])[0].id).toBe('kenya');
  });

  it('matches South Africa with space', () => {
    expect(matchJurisdictions(['South Africa'])[0].id).toBe('south_africa');
  });
});

describe('matchJurisdictions — WAEMU multi-country', () => {
  it('matches any single WAEMU member', () => {
    expect(matchJurisdictions(['Senegal'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Mali'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Burkina Faso'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Benin'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Togo'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Niger'])[0].id).toBe('waemu');
    expect(matchJurisdictions(['Guinea-Bissau'])[0].id).toBe('waemu');
  });

  it("matches Côte d'Ivoire in both apostrophe styles", () => {
    expect(matchJurisdictions(['Côte d’Ivoire'])[0].id).toBe('waemu');
    expect(matchJurisdictions(["Côte d'Ivoire"])[0].id).toBe('waemu');
  });

  it('collapses multi-WAEMU-member inputs to ONE bullet (not N)', () => {
    // A memo touching three WAEMU countries should yield ONE WAEMU bullet,
    // not three, in the structural-assumptions prompt.
    const hits = matchJurisdictions(['Senegal', 'Mali', 'Côte d’Ivoire']);
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe('waemu');
  });
});

describe('matchJurisdictions — East-Africa peers', () => {
  it('matches Rwanda / Uganda / Ethiopia under the peer-group entry', () => {
    expect(matchJurisdictions(['Rwanda'])[0].id).toBe('east_africa_peers');
    expect(matchJurisdictions(['Uganda'])[0].id).toBe('east_africa_peers');
    expect(matchJurisdictions(['Ethiopia'])[0].id).toBe('east_africa_peers');
  });

  it('Kenya and Tanzania are separate from the peers entry', () => {
    // Kenya has its own canonical entry (deeper coverage); Tanzania too.
    expect(matchJurisdictions(['Kenya'])[0].id).toBe('kenya');
    expect(matchJurisdictions(['Tanzania'])[0].id).toBe('tanzania');
  });
});

describe('matchJurisdictions — sort order', () => {
  it('returns hits in canonical registry order regardless of input order', () => {
    // Input: Turkey first, Argentina second, Nigeria third.
    // Expected output: Nigeria → Argentina → Turkey (registry order).
    const hits = matchJurisdictions(['Turkey', 'Argentina', 'Nigeria']);
    expect(hits.map(h => h.id)).toEqual(['nigeria', 'argentina', 'turkey']);
  });

  it('Lagos-Nairobi-Cairo deal yields three distinct bullets in canonical order', () => {
    const narratives = matchJurisdictionNarratives(['Egypt', 'Kenya', 'Nigeria']);
    expect(narratives).toHaveLength(3);
    // Registry order is Nigeria → Kenya → Egypt; the output should mirror it.
    expect(narratives[0]).toMatch(/Nigeria/);
    expect(narratives[1]).toMatch(/Kenya/);
    expect(narratives[2]).toMatch(/Egypt/);
  });
});

describe('matchJurisdictions — defensive', () => {
  it('returns empty array on empty input', () => {
    expect(matchJurisdictions([])).toEqual([]);
    expect(matchJurisdictionNarratives([])).toEqual([]);
  });

  it('returns empty array when no countries match', () => {
    expect(matchJurisdictions(['Mars', 'Atlantis'])).toEqual([]);
    expect(matchJurisdictionNarratives(['unknown country'])).toEqual([]);
  });

  it('partially-matching country lists return only the matching entries', () => {
    const hits = matchJurisdictions(['Nigeria', 'Mars', 'Kenya']);
    expect(hits).toHaveLength(2);
    expect(hits.map(h => h.id)).toEqual(['nigeria', 'kenya']);
  });
});

describe('matchJurisdictionNarratives — wrapper consistency', () => {
  it('returns same length as matchJurisdictions', () => {
    const countries = ['Nigeria', 'Ghana', 'South Africa', 'Egypt'];
    const entries = matchJurisdictions(countries);
    const narratives = matchJurisdictionNarratives(countries);
    expect(narratives).toHaveLength(entries.length);
  });

  it('narratives match the corresponding entry order', () => {
    const countries = ['Egypt', 'Nigeria', 'Ghana'];
    const entries = matchJurisdictions(countries);
    const narratives = matchJurisdictionNarratives(countries);
    for (let i = 0; i < entries.length; i++) {
      expect(narratives[i]).toBe(entries[i].narrative);
    }
  });
});
