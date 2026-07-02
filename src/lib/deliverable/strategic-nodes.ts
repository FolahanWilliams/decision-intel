/**
 * Strategic exposure nodes — the cross-class "attack path" — locked 2026-07-02.
 *
 * Our toxic combinations are bias × bias (cognitive nodes). But a catastrophic
 * strategic failure is almost never pure bias — it's a bias AMPLIFIED by the
 * governance STRUCTURE it sat inside, the EXECUTION pressure it ran under, and
 * the INFORMATION gap it hid behind. That cross-class chain is the "combination
 * → outcome" a buyer reads for (the Wiz attack-path applied to reasoning), and
 * it's exactly what a bias-only audit misses. On a RETRO of a public failure,
 * those structural/execution/info facts are stated right in the filing, so we
 * detect them from the text with NO LLM — pure + testable.
 *
 * Three classes:
 *  - structural   (S): governance conditions (oversized board, dominant CEO…)
 *  - execution    (E): deal pressure (compressed diligence, hostile auction…)
 *  - informational(I): blind spots (self-referential valuation, unverified margins…)
 *
 * The load-bearing idea + the ego-safe reframe: a structural node doesn't just
 * cause a bias, it CONCEALS the fatal gap FROM the deciders (the suppression
 * edge). So the audit says "your structure hid this from you", never "you were
 * biased" — the structure is the villain, not the person.
 *
 * DISPLAY-ONLY: does NOT feed detection or scoring (no DQI change, no
 * methodology bump) — same class as the pattern `consequence`/`fix`. It surfaces
 * on the deliverable as the "how these risks multiply" panel. Honesty: these are
 * CONDITIONS historically correlated with a failure archetype, NEVER a claim
 * they caused the outcome.
 */

export type StrategicNodeClass = 'structural' | 'execution' | 'informational';

export interface StrategicNodeDef {
  id: string;
  class: StrategicNodeClass;
  /** Buyer-language node name. */
  label: string;
  /** One line: why this multiplies the reasoning risk. */
  amplifies: string;
  /** The suppression edge — what this condition hid from the deciders (when it does). */
  conceals?: string;
  /**
   * Existential weight (1-3) — how close this is to ending the company. The
   * Fermi retro taught the lesson: rank by "what ends the company soonest",
   * not by a bias label. 3 = a company-ender (concentration / valuation /
   * key-person / no-diligence); 2 = a serious amplifier; 1 = a softer signal.
   * The detected list sorts by this DESC so the killers always lead + survive
   * the cap. Defaults to 2 when omitted.
   */
  weight?: number;
  /** Detection patterns (bounded — precision-first, like the PII scanner). */
  signals: RegExp[];
}

export interface DetectedStrategicNode {
  id: string;
  class: StrategicNodeClass;
  label: string;
  amplifies: string;
  conceals?: string;
  /** Existential weight (1-3) — drives the existential-first ordering. */
  weight: number;
  /** The matched phrase, for provenance. */
  evidence: string;
}

export const STRATEGIC_NODE_CLASS_LABEL: Record<StrategicNodeClass, string> = {
  structural: 'Structural',
  execution: 'Execution pressure',
  informational: 'Information gap',
};

export const STRATEGIC_NODES: StrategicNodeDef[] = [
  // ─── Company-enders (weight 3) — the structural risks that actually END
  // the company, promoted to first-class detectors after the Fermi retro
  // (single-tenant concentration + $20B-on-$0-revenue + key-person all lived
  // only as Forgotten Questions, while a construction-timeline bias headlined).
  {
    id: 'concentration_risk',
    class: 'structural',
    label: 'Single-point concentration',
    weight: 3,
    amplifies:
      'One tenant, customer, or counterparty carrying the thesis means one exit collapses it — the #1 killer of pre-revenue infrastructure and single-anchor stories.',
    conceals: 'The revenue that was never contracted, only assumed.',
    signals: [
      /\b(single|sole|primary|anchor|one|lead)[-\s]?(tenant|customer|counterparty|client|off[-\s]?taker|supplier|anchor)\b/i,
      /\b(customer|tenant|revenue|counterparty|supplier|client) concentration\b/i,
      /\bno (definitive|signed|binding|executed|firm) (leases|contracts|offtake|agreements|commitments)\b/i,
      /\b(a |our )?(single|limited number of|few) (customer|client|tenant|counterparty)s?\b.{0,40}\b(account|represent|generat|compris)\w*\b/i,
      /\bdepend\w*\b.{0,25}\b(a )?(limited number of|single|one|small number of|few) (customers|tenants|clients|counterparties)\b/i,
    ],
  },
  {
    id: 'valuation_vs_fundamentals',
    class: 'structural',
    label: 'Valuation detached from fundamentals',
    weight: 3,
    amplifies:
      'A multi-billion mark on little or no revenue prices the story, not the business — the base case is a repricing to fundamentals.',
    conceals: 'The cash-flow reality the narrative was built to outrun.',
    signals: [
      /\bpre[-\s]revenue\b/i,
      /\b(no|zero|minimal|little|limited)\b.{0,15}\b(current |material |generated )?(revenue|operating history)\b/i,
      /\bstory stock\b/i,
      /\bvaluation\b.{0,30}\b(detached|disconnected|unsupported|speculative|unproven|not supported)\b/i,
      /\b\$\s?[\d.,]+\s?(b|bn|billion|trillion|tn)\b.{0,60}\b(pre[-\s]revenue|no revenue|zero revenue|no operating history)\b/i,
    ],
  },
  {
    id: 'key_person_dependency',
    class: 'structural',
    label: 'Key-person / founder dependency',
    weight: 3,
    amplifies:
      "A single founder or visionary carrying the vision, with weak board checks, makes one person's judgment or conduct a company-level risk.",
    conceals: 'The governance guardrail that was never built around the founder.',
    signals: [
      /\bkey[-\s](person|man|employee|personnel)\b.{0,20}\b(risk|dependen|loss)\w*\b/i,
      /\bdepend\w*\b.{0,25}\bon (the |our |its )?(founder|chief executive|ceo|key (person|personnel|management|employees))\b/i,
      /\bfounder[-\s](led|halo|dependent|driven|controlled)\b/i,
      /\b(single|sole) (visionary|founder|decision[-\s]?maker)\b/i,
      /\bloss of (the |our )?(services of )?(our )?(founder|ceo|chief executive|key)\b/i,
    ],
  },
  // ─── Structural governance ─────────────────────────────────────────────
  {
    id: 'oversized_board',
    class: 'structural',
    label: 'Oversized board',
    amplifies:
      'A board too large for real debate defaults to groupthink; the dissent gets diluted.',
    conceals: 'The objection a smaller, sharper board would have forced into the open.',
    // The >12 numeric check lives in the detector; this catches the literal.
    signals: [/\boversized board\b/i, /\bunwieldy board\b/i],
  },
  {
    id: 'dominant_ceo',
    class: 'structural',
    label: 'Dominant CEO / founder',
    amplifies:
      'A dominant leader turns the committee into a ratifying body, not an adversarial audit.',
    conceals: 'The questions the leader did not want asked.',
    signals: [
      /\b(dominant|domineering|autocratic)\b.{0,45}\b(ceo|chief executive|chairman|founder|leader)\b/i,
      /\bsidelin\w+\b.{0,35}\b(non[-\s]executive|directors?|board)\b/i,
      /\b(overrode|unchallenged|neutralised internal|neutralized internal|aggressive style)\b/i,
    ],
  },
  {
    id: 'absent_dissent',
    class: 'structural',
    label: 'Absent dissent',
    amplifies: 'No recorded dissent means the kill case was never argued — approval by default.',
    conceals: 'The objection nobody in the room was willing to voice.',
    signals: [
      /\b(no dissent|without dissent|zero dissent|no documented dissent|no objections|rubber[-\s]?stamp)\b/i,
      /\bunanimous\w*\b/i,
    ],
  },
  {
    id: 'incentive_deal_volume',
    class: 'structural',
    label: 'Incentives tied to closing',
    amplifies: 'Pay tied to getting the deal done rewards the deal, not the diligence.',
    signals: [
      /\b(incentiv\w+|bonus\w*|compensation|remuneration|pay)\b.{0,45}\b(deal|close|closing|volume|acquisition|transaction)\b/i,
      /\bdeal[-\s]volume\b/i,
    ],
  },

  // ─── Execution pressure ────────────────────────────────────────────────
  {
    id: 'compressed_diligence',
    class: 'execution',
    label: 'Compressed due diligence',
    amplifies:
      'A compressed diligence window is exactly where a material misrepresentation survives.',
    conceals: 'What a full diligence would have surfaced before the vote.',
    signals: [
      /\b(due diligence|diligence|conference calls?)\b.{0,30}\b(\d{1,2}|six|seven|eight|nine|ten)[-\s]hours?\b/i,
      /\b(\d{1,2}|six|seven|eight|nine|ten)[-\s]hours?\b.{0,30}\b(due diligence|diligence|conference calls?)\b/i,
      /\blever[-\s]?arch folders?\b/i,
      /\b(compressed|expedited|rushed|superficial|cursory|limited)\b.{0,20}\bdiligence\b/i,
      /\b(\d{1,2})[-\s]day\b.{0,20}\bdiligence\b/i,
      /\bdiligence window\b.{0,20}(less than|under|<)\b/i,
    ],
  },
  {
    id: 'hostile_auction',
    class: 'execution',
    label: 'Hostile / competitive auction',
    amplifies:
      'A bidding war reprices the deal on fear of losing, not on fundamentals — the winner’s curse.',
    conceals: 'The walk-away price the fundamentals would have set.',
    signals: [
      /\b(hostile (bid|takeover|auction|acquisition)|bidding war|competitive process|preempt\w*|outbid\w*|winner’?s curse|winners? curse)\b/i,
      /\b(cannot|could not|couldn’?t) let\b.{0,30}\b(acquire|get|have|win)\b/i,
      /\bwin the (deal|auction|asset)\b/i,
    ],
  },
  {
    id: 'high_leverage',
    class: 'execution',
    label: 'High / short-term leverage',
    amplifies: 'Leverage removes the buffer for the downside you did not model.',
    conceals: 'The liquidity shock the funding structure could not survive.',
    signals: [
      /\b(highly leveraged|debt[-\s]financed|short[-\s]term (wholesale|money[-\s]?market|funding)|wholesale funding|multi[-\s]layer debt|off[-\s]balance[-\s]sheet)\b/i,
    ],
  },
  {
    id: 'ego_trophy',
    class: 'execution',
    label: 'Ego / trophy motive',
    amplifies: 'A trophy motive converts price discipline into a reflex to win.',
    signals: [
      /\b(strategic necessity|must[-\s]win|trophy (asset|deal)|cannot afford to lose|ego[-\s]driven)\b/i,
    ],
  },

  // ─── Information gaps ──────────────────────────────────────────────────
  {
    id: 'self_referential_valuation',
    class: 'informational',
    label: 'Self-referential valuation',
    amplifies: 'A valuation you set for yourself is not a valuation — the market never tested it.',
    conceals: 'The price a real external round would have discovered.',
    signals: [
      /\b(self[-\s](led|referential|determined|marked)|internal mark[-\s]?ups?|own valuation|self[-\s]mark[-\s]?ups?|marked (it )?up)\b/i,
    ],
  },
  {
    id: 'unverified_revenue_margin',
    class: 'informational',
    label: 'Unverified revenue / margins',
    amplifies: 'Margins nobody independently verified are the ones that collapse post-close.',
    conceals: 'The revenue quality the diligence never tested.',
    signals: [
      /\b(unverified|unaudited|pro[-\s]forma|unusually high margins?|margin anomal\w+|aggressive revenue|artificially inflat\w+|restated (revenue|earnings|accounts))\b/i,
      /\bhardware\b.{0,45}\b(booked|recognis\w+|recogniz\w+)\b.{0,25}\bsoftware\b/i,
    ],
  },
  {
    id: 'narrative_over_fundamentals',
    class: 'informational',
    label: 'Narrative over fundamentals',
    amplifies:
      'A story priced like software, on a business that behaves like something far more cyclical.',
    conceals: 'The unit economics the narrative was written to obscure.',
    signals: [
      /\b(space[-\s]as[-\s]a[-\s]service|physical social network|reimagin\w+ (real estate|the)|tech(nology)? narrative|priced like software)\b/i,
    ],
  },
  {
    id: 'sunk_cost_escalation',
    class: 'informational',
    label: 'Sunk-cost escalation',
    amplifies: 'The next check is justified by the last one, not by forward yield.',
    conceals: 'The forward economics the prior commitment is masking.',
    signals: [
      /\b(already (invested|spent|committed))\b.{0,25}\$?\s?[\d.,]+\s?(b|bn|billion|m|million)/i,
      /\b(good money.{0,12}bad|v[-\s]shaped recovery|throwing good money|escalat\w+ commitment)\b/i,
    ],
  },
  {
    id: 'demand_unvalidated',
    class: 'informational',
    label: 'Unvalidated demand',
    amplifies: 'Demand assumed from insider enthusiasm, never tested with a real user.',
    conceals: 'The customer signal the room mistook polite agreement for.',
    signals: [
      /\b(on[-\s]the[-\s]go|in[-\s]between moments|consumers will pay|assumed demand|polite (agreement|nods)|insider (validation|enthusiasm)|problem hallucination)\b/i,
    ],
  },
];

const NODE_BY_ID: Record<string, StrategicNodeDef> = Object.fromEntries(
  STRATEGIC_NODES.map(n => [n.id, n])
);

const SCAN_CAP = 200_000;
const MAX_NODES = 8;

/** Trim the match into a clean single-line evidence snippet (≤140 chars). */
function evidenceSnippet(text: string, index: number, matchLen: number): string {
  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + matchLen + 25);
  return text.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, 140);
}

function toDetected(def: StrategicNodeDef, evidence: string): DetectedStrategicNode {
  return {
    id: def.id,
    class: def.class,
    label: def.label,
    amplifies: def.amplifies,
    conceals: def.conceals,
    weight: def.weight ?? 2,
    evidence,
  };
}

/**
 * Detect the structural / execution / information nodes present in a document.
 * Pure, no I/O, no LLM. Precision-first; dedups by id; caps at MAX_NODES
 * (structural first, then execution, then information — the order the attack
 * path reads). Returns [] on empty input.
 */
export function detectStrategicNodes(content: string): DetectedStrategicNode[] {
  if (!content) return [];
  // Normalize whitespace to a single-space stream so the bounded `.{0,N}` gaps
  // in the signals span across the arbitrary line breaks real filings/memos
  // carry ("." does not match a newline).
  const text = content.slice(0, SCAN_CAP).replace(/\s+/g, ' ');
  const found = new Map<string, DetectedStrategicNode>();

  for (const def of STRATEGIC_NODES) {
    for (const re of def.signals) {
      const m = text.match(re);
      if (m && m.index != null) {
        found.set(def.id, toDetected(def, evidenceSnippet(text, m.index, m[0].length)));
        break;
      }
    }
  }

  // Numeric board-size check: "board of 17" / "17-member board" fires the
  // oversized_board node when the count exceeds 12 (the Lehman/Cadbury governance floor).
  if (!found.has('oversized_board')) {
    const sizeMatch =
      text.match(/\bboard of (\d{1,3})\b/i) || text.match(/\b(\d{1,3})[-\s]member board\b/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1], 10);
      if (Number.isFinite(size) && size > 12) {
        found.set('oversized_board', toDetected(NODE_BY_ID.oversized_board, sizeMatch[0].trim()));
      }
    }
  }

  // Rank EXISTENTIAL-first (the Fermi lesson: lead with what ends the company
  // soonest, not a bias label), then by class for a stable read. The killers
  // (weight 3) always lead and survive the cap.
  const order: StrategicNodeClass[] = ['structural', 'execution', 'informational'];
  return [...found.values()]
    .sort((a, b) => b.weight - a.weight || order.indexOf(a.class) - order.indexOf(b.class))
    .slice(0, MAX_NODES);
}

/**
 * Format the detected structural conditions as a PROMPT CONTEXT block for
 * the reasoning nodes (locked 2026-07-02, founder-approved pipeline
 * change — co-work #4 done at the generation layer). The deterministic
 * detectors (concentration / valuation-vs-fundamentals / key-person /
 * governance / execution / information) point the strongest generative
 * modules (forgottenQuestions, deepAnalysis red team, metaJudge) at
 * exactly the company-enders, instead of leaving them display-only.
 *
 * Returns '' when nothing is detected — the prompts are byte-identical
 * to before on documents with no structural conditions. The block asks
 * the model to INTERROGATE the conditions (quantify the loss they imply,
 * name what they conceal), never to assert outcomes — the same
 * risk-indicator honesty as every other surface.
 */
export function buildStrategicConditionsPromptBlock(content: string): string {
  const nodes = detectStrategicNodes(content);
  if (nodes.length === 0) return '';
  const lines = nodes.map(n => {
    const cls = STRATEGIC_NODE_CLASS_LABEL[n.class];
    return `- ${n.label} [${cls}${(n.weight ?? 1) >= 3 ? ' · EXISTENTIAL' : ''}]: ${n.amplifies}${
      n.conceals ? ` What it conceals from the room: ${n.conceals}` : ''
    }`;
  });
  return `

=== DETECTED STRUCTURAL CONDITIONS (deterministic scan of this document — treat as ground truth) ===
${lines.join('\n')}

Interrogate these conditions DIRECTLY and give them priority over generic risks: quantify the maximum loss each implies from the document's own numbers, stress-test the assumption that makes each survivable, and surface what the deal's structure conceals from its reviewers. These are correlated risk indicators to pressure-test, never a prediction that the decision fails.`;
}
