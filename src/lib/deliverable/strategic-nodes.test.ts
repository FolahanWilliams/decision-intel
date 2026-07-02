import { describe, it, expect } from 'vitest';
import { detectStrategicNodes, STRATEGIC_NODES } from './strategic-nodes';

const ids = (content: string) => detectStrategicNodes(content).map(n => n.id);

describe('detectStrategicNodes — the four retro case archetypes', () => {
  it('RBS / ABN AMRO: dominant CEO + oversized board + hostile auction + compressed diligence + leverage', () => {
    const text = `The acquisition was driven by the dominant CEO Fred Goodwin, whose aggressive style
      sidelined the non-executive directors. The board of 17 members was too large for meaningful debate.
      Seeking to beat its rival in a hostile bid, RBS fell victim to the winner's curse and voted to proceed
      on due diligence consisting of merely two lever arch folders and a CD. The deal was financed with
      volatile short-term wholesale funding.`;
    const got = ids(text);
    expect(got).toContain('dominant_ceo');
    expect(got).toContain('oversized_board');
    expect(got).toContain('hostile_auction');
    expect(got).toContain('compressed_diligence');
    expect(got).toContain('high_leverage');
  });

  it('HP / Autonomy: compressed diligence + unverified revenue/margins', () => {
    const text = `Under intense pressure to show a rapid transformation, HP's team spent a total of only six hours
      in due diligence conference calls. The board ignored public analyst warnings about Autonomy's unusually high margins.
      Autonomy had been selling low-end hardware to clients and then booking the loss-making transaction as pure
      software licensing revenue.`;
    const got = ids(text);
    expect(got).toContain('compressed_diligence');
    expect(got).toContain('unverified_revenue_margin');
  });

  it('WeWork / SoftBank: narrative over fundamentals + self-referential valuation + sunk-cost escalation', () => {
    const text = `Neumann rebranded commercial real estate subleasing as space-as-a-service and a physical social network.
      SoftBank continued to mark its private holdings up using self-led markups rather than cash-flow value.
      Having already invested $7.5 billion, SoftBank refused to admit a mistake, believing a capital infusion would
      force a V-shaped recovery.`;
    const got = ids(text);
    expect(got).toContain('narrative_over_fundamentals');
    expect(got).toContain('self_referential_valuation');
    expect(got).toContain('sunk_cost_escalation');
  });

  it('Quibi: unvalidated demand', () => {
    const text = `The thesis assumed commuters would pay a premium for short clips to watch on-the-go. The leadership
      mistook polite agreement from industry insiders for actual customer validation and leaned on celebrity star power.`;
    const got = ids(text);
    expect(got).toContain('demand_unvalidated');
  });
});

describe('detectStrategicNodes — the company-enders (Fermi S-11 lesson)', () => {
  it('Fermi shape: single-tenant concentration + valuation-vs-fundamentals + key-person all fire', () => {
    const text = `Risk factors. We are pre-revenue and have a limited operating history. We depend on a
      limited number of customers; our first anchor tenant accounts for substantially all of our
      contracted capacity, and we have no definitive leases in place for the remainder. We depend on
      our founder and chief executive; the loss of our founder could materially harm the business.`;
    const got = ids(text);
    expect(got).toContain('concentration_risk');
    expect(got).toContain('valuation_vs_fundamentals');
    expect(got).toContain('key_person_dependency');
  });

  it('ranks the company-enders (weight 3) ABOVE softer signals — the ranking fix', () => {
    // A doc with BOTH a company-ender and a lower-weight condition: the ender leads.
    const nodes = detectStrategicNodes(
      'the board of 17 approved it; but we depend on a single anchor tenant with no definitive leases.'
    );
    expect(nodes[0].id).toBe('concentration_risk'); // weight 3 leads the weight-2 oversized_board
    expect(nodes[0].weight).toBe(3);
  });

  it('a healthy, diversified, revenue-generating memo fires none of the enders', () => {
    const got = ids(
      'We have a diversified customer base across 40 accounts, $200M of recurring revenue, and a board-approved downside plan.'
    );
    expect(got).not.toContain('concentration_risk');
    expect(got).not.toContain('valuation_vs_fundamentals');
    expect(got).not.toContain('key_person_dependency');
  });
});

describe('detectStrategicNodes — mechanics', () => {
  it('fires nothing on a clean memo with none of the conditions', () => {
    expect(
      detectStrategicNodes(
        'We propose entering the Nordic market after a staged pilot, with an independent review at each gate and a documented downside case.'
      )
    ).toHaveLength(0);
  });

  it('returns [] on empty input', () => {
    expect(detectStrategicNodes('')).toHaveLength(0);
  });

  it('the oversized_board numeric check fires only above 12', () => {
    expect(ids('the board of 17 approved the deal')).toContain('oversized_board');
    expect(ids('the board of 8 approved the deal')).not.toContain('oversized_board');
    expect(ids('a 15-member board signed off')).toContain('oversized_board');
  });

  it('every detected node carries non-empty evidence + a known class', () => {
    const nodes = detectStrategicNodes(
      'the dominant CEO sidelined the board of 17 in a hostile bid'
    );
    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) {
      expect(n.evidence.trim().length).toBeGreaterThan(0);
      expect(['structural', 'execution', 'informational']).toContain(n.class);
      expect(n.amplifies.length).toBeGreaterThan(10);
    }
  });

  it('orders structural → execution → information and caps the list', () => {
    // A dense doc hitting many nodes; structural must precede execution/info.
    const nodes = detectStrategicNodes(
      `the dominant CEO sidelined the board of 17; a hostile bid with short-term wholesale funding;
       unaudited pro-forma margins; self-led markups; already invested $7.5 billion.`
    );
    const classes = nodes.map(n => n.class);
    const firstExec = classes.indexOf('execution');
    const firstInfo = classes.indexOf('informational');
    const lastStruct = classes.lastIndexOf('structural');
    if (firstExec !== -1 && lastStruct !== -1) expect(lastStruct).toBeLessThan(firstExec);
    if (firstInfo !== -1 && firstExec !== -1) expect(firstExec).toBeLessThan(firstInfo);
    expect(nodes.length).toBeLessThanOrEqual(8);
  });

  it('every catalog node has bounded signals + an amplifies line (honesty: no causal overclaim)', () => {
    for (const n of STRATEGIC_NODES) {
      expect(n.signals.length).toBeGreaterThan(0);
      expect(n.amplifies.length).toBeGreaterThan(10);
      // Risk-indicator framing, never a causal guarantee.
      expect(n.amplifies.toLowerCase()).not.toMatch(/\bwill (cause|fail|lose|destroy)\b/);
    }
  });
});

// ─── Prompt-context block (2026-07-02 — structural detectors feed the
//     reasoning nodes) ──────────────────────────────────────────────────

import { buildStrategicConditionsPromptBlock } from './strategic-nodes';

describe('buildStrategicConditionsPromptBlock', () => {
  it('returns EMPTY STRING when nothing is detected — prompts byte-identical on clean docs', () => {
    expect(
      buildStrategicConditionsPromptBlock('A staged market pilot with an independent gate review.')
    ).toBe('');
  });

  it('formats detected conditions with class labels + EXISTENTIAL flag + the interrogation instruction', () => {
    const block = buildStrategicConditionsPromptBlock(
      'The dominant CEO sidelined the board of 17 in a hostile bid, on due diligence of only six hours.'
    );
    expect(block).toContain('DETECTED STRUCTURAL CONDITIONS');
    expect(block).toContain('Interrogate these conditions DIRECTLY');
    // Honesty guard — risk indicators, never a prediction of failure.
    expect(block).toContain('never a prediction that the decision fails');
  });
});

// ─── Evidence-snippet word-boundary snapping (2026-07-02 — the DPR "pment-stage
//     company…" mid-word fragment fix) ─────────────────────────────────────

import { evidenceSnippet } from './strategic-nodes';

describe('evidenceSnippet — word-boundary snapping (no mid-word fragments)', () => {
  it('never emits a mid-word fragment; every token is a whole word from the source', () => {
    const filler = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod ';
    const text = `${filler}this development-stage company has never generated revenue and may never be profitable at scale`;
    const idx = text.indexOf('development-stage');
    const snip = evidenceSnippet(text, idx, 'development-stage'.length);
    // The matched phrase survives intact.
    expect(snip).toContain('development-stage');
    // Strip the excerpt ellipses, then every remaining token must appear as a
    // WHOLE word in the source — a mid-word fragment ("evelopment") fails this.
    const core = snip.replace(/^…/, '').replace(/…$/, '').trim();
    for (const token of core.split(' ')) {
      const clean = token.replace(/[^\w-]/g, '');
      if (!clean) continue;
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(new RegExp(`\\b${escaped}\\b`).test(text)).toBe(true);
    }
  });

  it('marks a mid-stream excerpt with leading + trailing ellipses', () => {
    const text =
      'aaaa bbbb cccc dddd eeee ffff the diligence window was less than six weeks gggg hhhh iiii jjjj';
    const idx = text.indexOf('diligence window');
    const snip = evidenceSnippet(text, idx, 'diligence window'.length);
    expect(snip.startsWith('…')).toBe(true);
    expect(snip.endsWith('…')).toBe(true);
    expect(snip).toContain('diligence window');
  });

  it('no leading ellipsis when the snippet starts at the document head', () => {
    const snip = evidenceSnippet(
      'depend on a single anchor tenant for all capacity',
      0,
      'depend'.length
    );
    expect(snip.startsWith('…')).toBe(false);
  });
});
