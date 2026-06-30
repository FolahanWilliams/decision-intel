import { describe, it, expect } from 'vitest';
import {
  briefDateFor,
  selectCorpDevArticles,
  buildIntelSynthesisPrompt,
  parseIntelSynthesis,
  MAX_ARTICLES_FOR_SYNTHESIS,
  MAX_BRIEF_ITEMS,
  type IntelSourceArticle,
} from './intel-brief';

function art(over: Partial<IntelSourceArticle> = {}): IntelSourceArticle {
  return {
    title: 'Generic business update',
    link: `https://example.com/${Math.random().toString(36).slice(2)}`,
    source: 'Test Feed',
    description: 'A neutral business article with no deal language.',
    publishedAt: new Date('2026-05-16T00:00:00Z'),
    relevanceScore: 0.5,
    biasTypes: [],
    extractedTopics: [],
    feedCategory: 'business',
    ...over,
  };
}

describe('briefDateFor', () => {
  it('returns the UTC YYYY-MM-DD key', () => {
    expect(briefDateFor(new Date('2026-05-17T23:59:00Z'))).toBe('2026-05-17');
    expect(briefDateFor(new Date('2026-01-02T00:00:01Z'))).toBe('2026-01-02');
  });
});

describe('selectCorpDevArticles', () => {
  it('keeps corp_dev-category articles regardless of relevance/keywords', () => {
    const a = art({ feedCategory: 'corp_dev', relevanceScore: 0.1, title: 'Quiet note' });
    expect(selectCorpDevArticles([a])).toHaveLength(1);
  });

  it('keeps keyword-matching articles above the relevance floor', () => {
    const a = art({ title: 'BigCo announces $4B acquisition of SmallCo', relevanceScore: 0.6 });
    expect(selectCorpDevArticles([a])).toHaveLength(1);
  });

  it('drops keyword-matching articles below the relevance floor', () => {
    const a = art({ title: 'Rumoured merger chatter', relevanceScore: 0.2 });
    expect(selectCorpDevArticles([a])).toHaveLength(0);
  });

  it('drops non-corp-dev articles with no deal keywords', () => {
    const a = art({ title: 'Quarterly earnings beat expectations', relevanceScore: 0.9 });
    expect(selectCorpDevArticles([a])).toHaveLength(0);
  });

  it('dedupes by link', () => {
    const a = art({ link: 'https://x.com/1', feedCategory: 'corp_dev' });
    const b = art({ link: 'https://x.com/1', feedCategory: 'corp_dev' });
    expect(selectCorpDevArticles([a, b])).toHaveLength(1);
  });

  it('sorts by relevance then recency', () => {
    const low = art({
      feedCategory: 'corp_dev',
      relevanceScore: 0.5,
      link: 'https://x.com/low',
    });
    const high = art({
      feedCategory: 'corp_dev',
      relevanceScore: 0.9,
      link: 'https://x.com/high',
    });
    const out = selectCorpDevArticles([low, high]);
    expect(out[0].link).toBe('https://x.com/high');
  });

  it('caps at MAX_ARTICLES_FOR_SYNTHESIS', () => {
    const many = Array.from({ length: MAX_ARTICLES_FOR_SYNTHESIS + 5 }, (_, i) =>
      art({ feedCategory: 'corp_dev', link: `https://x.com/${i}` })
    );
    expect(selectCorpDevArticles(many)).toHaveLength(MAX_ARTICLES_FOR_SYNTHESIS);
  });

  it('matches keywords inside extractedTopics', () => {
    const a = art({
      title: 'Strategy note',
      relevanceScore: 0.7,
      extractedTopics: ['leveraged buyout'],
    });
    expect(selectCorpDevArticles([a])).toHaveLength(1);
  });
});

describe('buildIntelSynthesisPrompt', () => {
  it('indexes articles and carries the ego-safe pattern-level instruction', () => {
    const p = buildIntelSynthesisPrompt([
      art({ title: 'Deal A', feedCategory: 'corp_dev' }),
      art({ title: 'Deal B', feedCategory: 'corp_dev' }),
    ]);
    expect(p).toContain('[0] "Deal A"');
    expect(p).toContain('[1] "Deal B"');
    expect(p).toContain('never assert a named person reasoned badly');
    expect(p).toContain('sourceIndex');
  });
});

describe('parseIntelSynthesis', () => {
  const sources = [
    art({ title: 'AlphaCo buys BetaCo', link: 'https://n.com/a' }),
    art({ title: 'GammaCo divestiture', link: 'https://n.com/g' }),
  ];

  it('parses a clean response and resolves sourceIndex to the real article', () => {
    const raw = JSON.stringify({
      summary: 'Two notable deals today.',
      items: [
        {
          sourceIndex: 0,
          headline: 'AlphaCo acquires BetaCo for $2B',
          whyItMatters: 'Tests integration risk.',
          sector: 'Technology',
          biasAngle: 'synergy claims of this shape often rest on planning fallacy',
        },
      ],
    });
    const out = parseIntelSynthesis(raw, sources);
    expect(out.summary).toBe('Two notable deals today.');
    expect(out.items).toHaveLength(1);
    expect(out.items[0].sourceLink).toBe('https://n.com/a');
    expect(out.items[0].sourceTitle).toBe('AlphaCo buys BetaCo');
  });

  it('strips markdown fences', () => {
    const raw =
      '```json\n' +
      JSON.stringify({ summary: 'x', items: [{ sourceIndex: 1, headline: 'h' }] }) +
      '\n```';
    const out = parseIntelSynthesis(raw, sources);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].sourceLink).toBe('https://n.com/g');
  });

  it('tolerates prose before the JSON object', () => {
    const raw =
      'Here is the brief you asked for:\n' +
      JSON.stringify({ summary: 's', items: [{ sourceIndex: 0, headline: 'h' }] });
    const out = parseIntelSynthesis(raw, sources);
    expect(out.summary).toBe('s');
    expect(out.items).toHaveLength(1);
  });

  it('drops items whose sourceIndex is out of range (anti-hallucination)', () => {
    const raw = JSON.stringify({
      summary: 's',
      items: [
        { sourceIndex: 99, headline: 'invented' },
        { sourceIndex: 0, headline: 'real' },
      ],
    });
    const out = parseIntelSynthesis(raw, sources);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].headline).toBe('real');
  });

  it('drops items with an empty headline', () => {
    const raw = JSON.stringify({
      summary: 's',
      items: [{ sourceIndex: 0, headline: '' }],
    });
    expect(parseIntelSynthesis(raw, sources).items).toHaveLength(0);
  });

  it('caps items at MAX_BRIEF_ITEMS', () => {
    const raw = JSON.stringify({
      summary: 's',
      items: Array.from({ length: MAX_BRIEF_ITEMS + 4 }, () => ({
        sourceIndex: 0,
        headline: 'h',
      })),
    });
    expect(parseIntelSynthesis(raw, sources).items).toHaveLength(MAX_BRIEF_ITEMS);
  });

  it('returns an empty result on malformed JSON', () => {
    expect(parseIntelSynthesis('not json at all', sources)).toEqual({ summary: '', items: [] });
  });

  it('defaults sector to General when missing', () => {
    const raw = JSON.stringify({
      summary: 's',
      items: [{ sourceIndex: 0, headline: 'h' }],
    });
    expect(parseIntelSynthesis(raw, sources).items[0].sector).toBe('General');
  });
});
