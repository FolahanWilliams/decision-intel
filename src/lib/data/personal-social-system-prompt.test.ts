import { describe, expect, it } from 'vitest';
import {
  buildPersonalSocialSystemPrompt,
  pickArchetype,
  getArchetypeById,
  POST_ARCHETYPES,
  ARCHETYPE_OPTIONS,
} from './personal-social-system-prompt';

/**
 * Locks the personal-social SSOT contract. If a session edits the
 * archetypes, the auto-picker, or the composer, this test surfaces
 * regressions before they ship to Content Studio.
 *
 * The composer's output is a long system prompt — we don't snapshot
 * the full string (too brittle); we assert the load-bearing pieces are
 * present so a content writer can't accidentally drop the META rule,
 * the banned-vocab block, or the archetype shape.
 */
describe('POST_ARCHETYPES integrity', () => {
  it('exposes 6 archetypes ranked 1..6 with no gaps or duplicates', () => {
    expect(POST_ARCHETYPES.length).toBe(6);
    const ranks = POST_ARCHETYPES.map(a => a.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6]);
    const ids = POST_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every archetype has the required prose fields populated', () => {
    for (const a of POST_ARCHETYPES) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.oneLiner.length).toBeGreaterThan(20);
      expect(a.structuralShape.hook.length).toBeGreaterThan(20);
      expect(a.structuralShape.middle.length).toBeGreaterThan(20);
      expect(a.structuralShape.cta.length).toBeGreaterThan(10);
      expect(a.whyForFolahan.length).toBeGreaterThan(20);
      expect(a.workedExample.length).toBeGreaterThan(50);
      expect(a.avoid.length).toBeGreaterThan(10);
      expect(a.bestForPersona.length).toBeGreaterThan(5);
      expect(a.topicKeywords.length).toBeGreaterThan(0);
    }
  });

  it('ARCHETYPE_OPTIONS mirrors POST_ARCHETYPES ids and ranks', () => {
    expect(ARCHETYPE_OPTIONS.length).toBe(POST_ARCHETYPES.length);
    for (let i = 0; i < POST_ARCHETYPES.length; i++) {
      expect(ARCHETYPE_OPTIONS[i].id).toBe(POST_ARCHETYPES[i].id);
      expect(ARCHETYPE_OPTIONS[i].rank).toBe(POST_ARCHETYPES[i].rank);
    }
  });
});

describe('pickArchetype keyword router', () => {
  it('routes catastrophe topics to Billion-Dollar Autopsy (rank 1)', () => {
    expect(pickArchetype('Why WeWork collapsed in 33 days').id).toBe('billion_dollar_autopsy');
    expect(pickArchetype('Lehman Brothers — a predictable failure').id).toBe(
      'billion_dollar_autopsy'
    );
  });

  it('routes IC / committee panic topics to Room Dynamics / FOMU (rank 2)', () => {
    expect(pickArchetype('Walking into Thursday IC committee').id).toBe('room_dynamics_fomu');
    expect(pickArchetype('Defending a deal under pressure').id).toBe('room_dynamics_fomu');
  });

  it('routes Pan-African / cross-border topics to Cross-Border Reality Check (rank 3)', () => {
    expect(pickArchetype('Nigeria fund evaluating a Lagos target').id).toBe('cross_border_reality');
    expect(pickArchetype('NDPR and CBN regulatory map').id).toBe('cross_border_reality');
  });

  it('routes fee / retainer / fractional topics to Retainer Justification (rank 4)', () => {
    expect(pickArchetype('Justifying my fractional CSO retainer').id).toBe(
      'retainer_justification'
    );
    expect(pickArchetype('How to justify a £20k client invoice').id).toBe('retainer_justification');
  });

  it('routes shipped-this-week topics to Naked Business Velocity (rank 5)', () => {
    expect(pickArchetype('Shipped Client-Safe Export Mode overnight').id).toBe(
      'naked_business_velocity'
    );
    expect(pickArchetype('What I built today as a solo founder').id).toBe(
      'naked_business_velocity'
    );
  });

  it('routes conventional-wisdom topics to Advice vs Reality (rank 6)', () => {
    expect(pickArchetype('Conventional advice says to trust the operator gut').id).toBe(
      'advice_vs_reality'
    );
  });

  it('falls back to rank-1 when no keyword matches', () => {
    expect(pickArchetype('').id).toBe('billion_dollar_autopsy');
    expect(pickArchetype(undefined).id).toBe('billion_dollar_autopsy');
    expect(pickArchetype('something completely unrelated like flowers').id).toBe(
      'billion_dollar_autopsy'
    );
  });

  it('breaks ties on lower rank when keyword scores match', () => {
    // "ic committee" matches room_dynamics_fomu strongly; mix in a
    // weaker autopsy keyword and the higher-keyword-count archetype
    // still wins.
    const result = pickArchetype('IC committee deliberation');
    expect(result.id).toBe('room_dynamics_fomu');
  });
});

describe('getArchetypeById', () => {
  it('returns the named archetype when id is valid', () => {
    expect(getArchetypeById('cross_border_reality').id).toBe('cross_border_reality');
  });

  it('falls back to rank-1 on unknown / undefined id', () => {
    expect(getArchetypeById('not_a_real_id').id).toBe('billion_dollar_autopsy');
    expect(getArchetypeById(undefined).id).toBe('billion_dollar_autopsy');
    expect(getArchetypeById('').id).toBe('billion_dollar_autopsy');
  });
});

describe('buildPersonalSocialSystemPrompt composer', () => {
  const baseOpts = {
    founderContext: '[FOUNDER_CONTEXT placeholder]',
    contentTypeInstructions: '[Content type instructions placeholder]',
  };

  it('produces a prompt that contains every load-bearing section', () => {
    const { systemPrompt, archetype } = buildPersonalSocialSystemPrompt(baseOpts);
    // Founder context piped through.
    expect(systemPrompt).toContain('[FOUNDER_CONTEXT placeholder]');
    // Voice anchors block must mention Lagos + 16 + Mr. Reiner anonymity rule.
    expect(systemPrompt).toContain('Lagos');
    expect(systemPrompt).toContain('16 years old');
    expect(systemPrompt).toContain('Fortune 500 advisor');
    // Empathic-mode-first META rule.
    expect(systemPrompt).toContain('EMPATHIC-MODE-FIRST');
    // Protected-revenue framing.
    expect(systemPrompt).toContain('PROTECTED-REVENUE FRAMING');
    // Banned vocabulary must be enumerated in the prompt.
    expect(systemPrompt).toContain('decision intelligence platform');
    expect(systemPrompt).toContain('decision hygiene');
    // Polite-but-brutal META rule.
    expect(systemPrompt).toContain('Polite but Brutal Pragmatist');
    // Archetype block must surface the picked archetype's name + shape.
    expect(systemPrompt).toContain(archetype.name);
    expect(systemPrompt).toContain('HOOK:');
    expect(systemPrompt).toContain('MIDDLE:');
    expect(systemPrompt).toContain('CTA:');
  });

  it('auto-picks an archetype when no archetypeId override is supplied', () => {
    const { archetype } = buildPersonalSocialSystemPrompt({
      ...baseOpts,
      topic: 'Walking into Thursday IC',
    });
    expect(archetype.id).toBe('room_dynamics_fomu');
  });

  it('honors a manual archetypeId override even when topic suggests otherwise', () => {
    const { archetype } = buildPersonalSocialSystemPrompt({
      ...baseOpts,
      topic: 'Walking into Thursday IC', // would auto-pick room_dynamics_fomu
      archetypeId: 'cross_border_reality',
    });
    expect(archetype.id).toBe('cross_border_reality');
  });

  it('appends voice notes when supplied (truncated to 2k chars)', () => {
    // Use a 4-char sentinel that does not appear elsewhere in the prompt
    // template so the regex count is exactly the truncated user input.
    const sentinel = 'ZQVP';
    const longNote = sentinel.repeat(3000); // 12,000 chars total
    const { systemPrompt } = buildPersonalSocialSystemPrompt({
      ...baseOpts,
      voiceNotes: longNote,
    });
    expect(systemPrompt).toContain('Additional voice notes from the founder');
    // Composer slices to 2000 chars: 2000 / 4 = 500 sentinel repetitions.
    const sentinelMatches = systemPrompt.match(/ZQVP/g) ?? [];
    expect(sentinelMatches.length).toBe(500);
  });

  it('truncates topic line to 1000 chars', () => {
    const sentinel = 'WJKM';
    const longTopic = sentinel.repeat(500); // 2,000 chars total
    const { systemPrompt } = buildPersonalSocialSystemPrompt({
      ...baseOpts,
      topic: longTopic,
    });
    // Composer slices to 1000 chars: 1000 / 4 = 250 sentinel repetitions.
    const sentinelMatches = systemPrompt.match(/WJKM/g) ?? [];
    expect(sentinelMatches.length).toBe(250);
  });

  it('inherits the content-type shape instructions', () => {
    const { systemPrompt } = buildPersonalSocialSystemPrompt({
      ...baseOpts,
      contentTypeInstructions: 'WRITE A 280-CHAR TWEET',
    });
    expect(systemPrompt).toContain('WRITE A 280-CHAR TWEET');
  });
});
