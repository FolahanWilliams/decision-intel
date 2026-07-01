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
