'use client';

import type React from 'react';
import { GraduationCap, Lightbulb } from 'lucide-react';

const card: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: 'var(--bg-secondary, #111)',
  border: '1px solid var(--border-primary, #222)',
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const subLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-muted, #71717a)',
  marginBottom: 4,
};

const bodyText: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #b4b4bc)',
  lineHeight: 1.6,
  marginBottom: 6,
};

const entryTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 4,
};

const pill = (shipped: boolean): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginLeft: 8,
  background: shipped ? '#16A34A20' : '#eab30820',
  color: shipped ? '#16A34A' : '#eab308',
  border: `1px solid ${shipped ? '#16A34A40' : '#eab30840'}`,
});

type Entry = {
  name: string;
  origin: string;
  summary: string;
  why: string;
  surface: string;
  shipped: boolean;
};

function EntryBlock({ e }: { e: Entry }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 8,
        background: 'var(--bg-tertiary, #0a0a0a)',
        border: '1px solid var(--border-primary, #222)',
        marginBottom: 12,
      }}
    >
      <div style={entryTitle}>
        {e.name}
        <span style={pill(e.shipped)}>{e.shipped ? 'Shipped' : 'Roadmap'}</span>
      </div>
      <div style={{ ...subLabel, marginTop: 2 }}>Origin</div>
      <div style={bodyText}>{e.origin}</div>
      <div style={subLabel}>Summary</div>
      <div style={bodyText}>{e.summary}</div>
      <div style={subLabel}>Why it matters for Decision Intel</div>
      <div style={bodyText}>{e.why}</div>
      <div style={subLabel}>Product surface</div>
      <div style={{ ...bodyText, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
        {e.surface}
      </div>
    </div>
  );
}

const SECTION_B: Entry[] = [
  {
    name: 'Daniel Kahneman and Olivier Sibony, Noise and decision hygiene',
    origin:
      'Noise: A Flaw in Human Judgment (2021). Insurance underwriter study showed 55% variance where 10% was expected.',
    summary:
      'Noise is unwanted variability in judgments that should be identical. Decision hygiene (structured, independent, aggregated judgment) cuts noise without requiring domain expertise.',
    why: 'Noise is the theoretical backbone of the triple-judge scoring engine and the NoiseTax component of DQI. It reframes the sales pitch from "avoid bias" to "measure and reduce decision variance."',
    surface: 'src/lib/scoring/noise-decomposition.ts, NoiseTaxCard.tsx, triple-judge pipeline',
    shipped: true,
  },
  {
    name: 'Gary Klein, Recognition-Primed Decision (RPD)',
    origin:
      'Sources of Power (1998). Research on firefighters, nurses, and NICU clinicians showed experts pattern-match, they do not enumerate options.',
    summary:
      'Experts recognize situations from prior experience and mentally simulate how the chosen course will play out. Pre-mortem and narrative simulation are standard RPD tools.',
    why: 'DI sits at the intersection of structured debiasing (Kahneman) and expert intuition amplification (Klein). The RPD tab surfaces recognition cues from historical cases so the user gets both.',
    surface:
      'src/app/(platform)/documents/[id]/tabs/RpdTab.tsx, PreMortemScenarioCards.tsx, /api/rpd-simulator',
    shipped: true,
  },
  {
    name: 'Tversky and Kahneman, System 1 / System 2 and Prospect Theory',
    origin:
      'Judgment under Uncertainty (1974), Thinking Fast and Slow (2011). Catalogued the heuristics and biases that drive systematic error.',
    summary:
      'Fast, automatic System 1 judgment is easily hijacked by anchoring, availability, representativeness, loss aversion, and confirmation. System 2 is capable of correction but lazy.',
    why: 'The 31-bias taxonomy the platform detects is a direct inheritance from this research program. Every bias card in the app traces back to a specific paper here.',
    surface: '31-bias taxonomy across the bias-detection pipeline, Compound Scoring Engine',
    shipped: true,
  },
  {
    name: 'Philip Tetlock, Superforecasting',
    origin:
      'Expert Political Judgment (2005) and Superforecasting (2015). IARPA forecasting tournaments.',
    summary:
      'Hybrid human-machine forecasters beat both pure AI and pure humans. Calibration is trainable. Brier scores measure how well stated probabilities match outcomes.',
    why: 'Validates the whole product architecture (AI augmenting expert judgment rather than replacing it) and grounds the calibration dashboard and its Bronze to Platinum tiers.',
    surface: 'CalibrationContent.tsx, personal calibration dashboard, Brier-score tracking',
    shipped: true,
  },
  {
    name: 'Annie Duke, probabilistic decision-making',
    origin: 'Thinking in Bets (2018), How to Decide (2020). Former professional poker player.',
    summary:
      'Distinguishes decision quality from outcome quality (resulting bias). Pre-commitment and decision architecture beat willpower for debiasing.',
    why: 'Validates the nudge system and outcome reporting loop. The distinction between decision quality and outcome is the core framing of the DQI.',
    surface: 'nudge system, outcome reporting, resulting-bias callouts',
    shipped: true,
  },
  {
    name: 'Thomas Bayes and modern Bayesian epistemology',
    origin:
      'An Essay towards solving a Problem in the Doctrine of Chances (1763). Applied to decision theory by Savage, Jeffreys, and Jaynes.',
    summary:
      'Rational belief update combines a prior with likelihood of new evidence. Blind priors captured before new evidence arrives create a clean audit trail for belief change.',
    why: 'Grounds the DecisionPriorCapture feature and the blind-prior collection inside Decision Rooms. The whole calibration story depends on capturing priors cleanly.',
    surface:
      'src/lib/scoring/bayesian-priors.ts, DecisionPriorCapture.tsx, Decision Rooms blind priors',
    shipped: true,
  },
];

const SECTION_C: Entry[] = [
  {
    name: 'Pre-mortem',
    origin: 'Gary Klein, Performing a Project Premortem (HBR 2007).',
    summary:
      'Imagine the decision has failed catastrophically a year from now. Write the story of why. Surfaces concerns that direct optimism suppresses.',
    why: 'One of the highest-ROI debiasing interventions in the literature. The Pre-Mortem Scenario Cards feature is a direct implementation.',
    surface: 'PreMortemScenarioCards.tsx, RPD tab',
    shipped: true,
  },
  {
    name: 'Reference Class Forecasting and the Outside View',
    origin: 'Bent Flyvbjerg and Daniel Kahneman, multiple papers on megaproject forecasting.',
    summary:
      'Instead of forecasting from project-specific details (inside view), look at the base rate of comparable projects (outside view). Humans wildly over-rely on the inside view.',
    why: 'For a PE buyer staring at an IC memo, the single most persuasive number is the historical base rate of deals with this ticket size, sector, and sponsor profile.',
    surface:
      'src/lib/data/reference-class-forecasting.ts, src/components/ui/OutsideViewCard.tsx, shown on the document Overview tab',
    shipped: true,
  },
  {
    name: 'Inversion',
    origin:
      'Charlie Munger, Poor Charlie\u2019s Almanack. Adapted from Carl Jacobi: invert, always invert.',
    summary:
      'Solve the problem backward. Instead of asking how to succeed, ask what guarantees failure, then avoid those paths.',
    why: 'Pairs naturally with pre-mortem as a standalone prompt. Very cheap to ship and immediately differentiating in demos.',
    surface: 'Roadmap: Inversion prompt inside Decision Rooms',
    shipped: false,
  },
  {
    name: 'Red Team and the 10th Man Rule',
    origin:
      'RAND Corporation and Israeli military intelligence after the 1973 Yom Kippur surprise.',
    summary:
      'If nine people agree, the tenth must argue the contrarian position no matter how implausible. Institutionalised dissent.',
    why: 'Complements blind priors. Makes structured dissent a first-class product primitive.',
    surface: 'Roadmap: Red Team role in Decision Rooms with a forced-dissent prompt',
    shipped: false,
  },
  {
    name: 'Ulysses Contracts and pre-commitment',
    origin: 'Thomas Schelling, Jon Elster, Richard Thaler.',
    summary:
      'Lock yourself into a future action while your judgment is clear so your later, biased self cannot defect. Odysseus tying himself to the mast.',
    why: 'Natural fit for the Decision Frame defaultAction field: lock the default action at frame time, reveal only after evidence review, then measure drift.',
    surface: 'Roadmap: pre-commit defaultAction at frame time, reveal at review',
    shipped: false,
  },
  {
    name: 'Second-Order Thinking',
    origin: 'Howard Marks, Oaktree memos.',
    summary:
      '"And then what?" Chain out the consequences of the consequences. First-order thinking stops at the obvious move.',
    why: 'Fits the Counterfactual panel as an additional prompt: after the model suggests an action, force a second-order chain.',
    surface: 'Roadmap: second-order prompt inside the Counterfactual panel',
    shipped: false,
  },
  {
    name: 'OODA Loop',
    origin: 'John Boyd, US Air Force strategist.',
    summary:
      'Observe, Orient, Decide, Act. Decision tempo under uncertainty. Whoever cycles faster with correct orientation wins.',
    why: 'Frames Decision Intel as a tool that speeds OODA cycles for investment committees. A useful sales metaphor for military-trained or operator buyers.',
    surface: 'Roadmap: OODA framing in Sales Toolkit for operator buyers',
    shipped: false,
  },
  {
    name: 'Cynefin Framework',
    origin: 'Dave Snowden, IBM Research.',
    summary:
      'Classifies a situation as simple, complicated, complex, or chaotic. Each class demands a different decision approach.',
    why: 'Could route analyses to different playbooks automatically. A complicated M&A deal needs different tooling than a complex organisational decision.',
    surface: 'Roadmap: Cynefin-based routing in the analysis pipeline',
    shipped: false,
  },
  {
    name: 'Wisdom of Crowds',
    origin: 'James Surowiecki (2004), synthesising Condorcet and Galton.',
    summary:
      'Four conditions (diversity, independence, decentralisation, aggregation) make group judgment outperform any individual expert. Violate any condition and the crowd becomes a mob.',
    why: 'The theoretical grounding for blind priors in Decision Rooms. Worth citing explicitly in marketing so buyers see the peer-reviewed backing.',
    surface: 'Roadmap: Wisdom-of-Crowds citation on Decision Rooms marketing page',
    shipped: false,
  },
  {
    name: 'Bezos One-Way and Two-Way Doors',
    origin: 'Jeff Bezos, Amazon 2015 shareholder letter.',
    summary:
      'Classify decisions as reversible (two-way doors, move fast) versus irreversible (one-way doors, deliberate carefully). Most decisions are two-way but teams treat them as one-way.',
    why: 'A reversibility tag on the Decision Frame would let the product scale the rigour of analysis to the stakes. High-signal UX feature.',
    surface: 'Roadmap: reversibility tag on DecisionFrame, scaled analysis depth',
    shipped: false,
  },
  {
    name: 'Decision Quality Chain',
    origin: 'Ron Howard and Jim Matheson, Strategic Decisions Group.',
    summary:
      'Six-element chain: appropriate frame, creative alternatives, meaningful information, clear values, logical reasoning, commitment to action. A decision is only as strong as its weakest link.',
    why: 'Could become the spine of a DQ Scorecard that complements the DQI. The existing DQI scores the document, the DQ Scorecard would score the process.',
    surface: 'Roadmap: DQ Scorecard companion to DQI',
    shipped: false,
  },
];
const SECTION_D: Entry[] = [
  {
    name: 'Chris Voss, Tactical Empathy',
    origin:
      'Never Split the Difference (2016). Former FBI lead international kidnapping negotiator.',
    summary:
      'Labelling, mirroring, calibrated questions, and accusation audits lower the other side\u2019s defences so they can hear you. Emotion first, logic second.',
    why: 'The Content Studio already cites this. Critical for selling a product that implies the buyer\u2019s current process is biased, without putting them on the defensive.',
    surface: 'src/app/api/founder-hub/content/route.ts TACTICAL_EMPATHY_INSTRUCTION',
    shipped: true,
  },
  {
    name: 'Barbara Minto, Pyramid Principle (BLUF)',
    origin: 'The Pyramid Principle (1978). McKinsey consulting method.',
    summary:
      'Lead with the conclusion. Support it with two to three arguments. Detail each argument. Mirrors how busy executives consume information.',
    why: 'Already the content structure standard. Also the recommended structure for every AI-generated pitch and memo the platform produces.',
    surface: 'src/app/api/founder-hub/content/route.ts MINTO_INSTRUCTION',
    shipped: true,
  },
  {
    name: 'Donald Miller, StoryBrand',
    origin: 'Building a StoryBrand (2017).',
    summary:
      'The customer is the hero, not the brand. The brand is the guide. Seven-part framework (character, problem, guide, plan, call to action, success, failure).',
    why: 'Would tighten the landing page copy and onboarding flow. Currently the product is positioned as the hero of the story.',
    surface: 'Roadmap: StoryBrand rewrite of the landing page and onboarding',
    shipped: false,
  },
  {
    name: 'Nir Eyal, Hooked Model',
    origin: 'Hooked (2014).',
    summary:
      'Trigger then action then variable reward then investment. Builds habit loops that survive without ongoing motivation.',
    why: 'Frames the calibration gamification loop (Bronze to Platinum tiers). Each reported outcome is an investment that feeds the next variable reward.',
    surface: 'Roadmap: formalise Hooked loop in the calibration UI copy',
    shipped: false,
  },
];
const SECTION_E: Entry[] = [
  {
    name: 'Clayton Christensen and Bob Moesta, Jobs-to-be-Done',
    origin: 'Competing Against Luck (2016). Originated in Christensen\u2019s disruption research.',
    summary:
      'Customers hire products to do a job in their life. The job is stable even as demographics, technologies, and competitors change. Focus on the job, not the customer.',
    why: 'The right job for Decision Intel is "help me trust my IC\u2019s yes-or-no." That one sentence should anchor landing-page positioning and discovery calls.',
    surface: 'Roadmap: JTBD statement on landing page, sales discovery script',
    shipped: false,
  },
  {
    name: 'Geoffrey Moore, Crossing the Chasm',
    origin: 'Crossing the Chasm (1991).',
    summary:
      'Early markets (innovators, early adopters) require radically different go-to-market motions than mainstream markets (early majority). Most startups die in the chasm between them.',
    why: 'The proven PE/VC IC vertical is a beachhead. The enterprise M&A expansion path is the chasm crossing. Having this framing explicit prevents premature horizontal expansion.',
    surface: 'Roadmap: beachhead strategy doc in Sales Toolkit',
    shipped: false,
  },
  {
    name: 'Matt Dixon and Brent Adamson, The Challenger Sale',
    origin: 'The Challenger Sale (2011), CEB (now Gartner) research on 6,000+ reps.',
    summary:
      'Top sales performers teach customers something counterintuitive about their own business, tailor the message, and take control of the conversation. Relationship builders are the worst performers in complex B2B.',
    why: 'Decision Intel is literally a Challenger product. It teaches buyers that their current process is biased and noisy in measurable ways. This is the single most natural sales motion to adopt.',
    surface: 'Sales Toolkit tab, Challenger Sale Playbook card (Teach / Tailor / Take Control)',
    shipped: true,
  },
  {
    name: 'Neil Rackham, SPIN Selling',
    origin: 'SPIN Selling (1988). Huthwaite research on 35,000+ sales calls.',
    summary:
      'Situation, Problem, Implication, Need-payoff. Large-ticket sales are won by asking a specific sequence of discovery questions that make the buyer articulate their own pain.',
    why: 'Ready-made structure for discovery calls. The Implication stage is where noise and bias data becomes a sharp argument.',
    surface:
      'Sales Toolkit tab, SPIN Discovery Script card (Situation / Problem / Implication / Need-Payoff)',
    shipped: true,
  },
  {
    name: 'Dick Dunkel, MEDDPICC',
    origin: 'MEDDIC originated at PTC (1996), extended by Dick Dunkel and Andy Whyte.',
    summary:
      'Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion, Competition. Enterprise deal qualification checklist.',
    why: 'Any enterprise deal above $50k should be scored on these eight dimensions weekly. Keeps the pipeline honest and surfaces dying deals early.',
    surface: 'Sales Toolkit tab, MEDDPICC Qualification Checklist card',
    shipped: true,
  },
  {
    name: 'Kim and Mauborgne, Blue Ocean Strategy',
    origin: 'Blue Ocean Strategy (2005), INSEAD.',
    summary:
      'Compete in uncontested market space by simultaneously pursuing differentiation and low cost. The Value Curve plots competing offerings across buyer attributes.',
    why: 'The DQI is the value-curve primitive. No competitor scores decision quality on a 0-to-100 composite. Plotting this explicitly in an analyst deck is immediately differentiating.',
    surface: 'Roadmap: Value Curve diagram in Strategy and Positioning tab',
    shipped: false,
  },
  {
    name: 'Richard Rumelt, Good Strategy Bad Strategy',
    origin: 'Good Strategy Bad Strategy (2011).',
    summary:
      'The kernel of strategy is diagnosis, guiding policy, and coherent actions. Most "strategy" is actually wishful goals with no diagnosis.',
    why: 'Apply to the founder\u2019s own quarterly strategy reviews. Also a useful meta-lens for evaluating the strategy documents the platform audits.',
    surface: 'Roadmap: kernel-of-strategy template for internal founder reviews',
    shipped: false,
  },
  {
    name: 'Alex Osterwalder, Value Proposition Canvas',
    origin: 'Value Proposition Design (2014).',
    summary:
      'Map customer jobs, pains, and gains to products, pain relievers, and gain creators. Forces explicit fit between offer and customer.',
    why: 'Complements JTBD. A filled-in canvas for the IC Chair persona would be a useful internal artifact and a sales collateral piece.',
    surface: 'Roadmap: filled Value Proposition Canvas per target persona',
    shipped: false,
  },
  {
    name: 'Rob Fitzpatrick, The Mom Test',
    origin: 'The Mom Test (2013).',
    summary:
      'Customer interviews should talk about the prospect\u2019s life and problems, not about your idea. Even your mom cannot lie about specific past behaviours.',
    why: 'Prevents the classic failure mode of interpreting polite "that sounds cool" as demand. Should be standard practice for every new user interview.',
    surface: 'Roadmap: Mom Test script in the user research playbook',
    shipped: false,
  },
  {
    name: 'Alex Hormozi, $100M Offers value equation',
    origin: '$100M Offers (2021).',
    summary:
      'Perceived value equals (dream outcome times perceived likelihood of achievement) divided by (time delay times effort and sacrifice). Maximise the numerator, minimise the denominator.',
    why: 'Useful pricing-page lens. Decision Intel\u2019s dream outcome (avoid a $50M bad deal) and perceived likelihood (historical calibration data) are both high, and time-to-result is sub-60 seconds. The equation sells itself.',
    surface: 'Roadmap: value-equation framing on pricing page and trial CTA',
    shipped: false,
  },
  {
    name: 'Christopher Lochhead, Category Design',
    origin: 'Play Bigger (2016), Niche Down (2018).',
    summary:
      'Frame it, name it, claim it. Category kings take 76% of category economics. Winning a category beats winning a product competition.',
    why: 'Already cited in the Playbook. The Decision Quality Index is the category primitive. Should be reinforced across every marketing surface.',
    surface: 'Cross-link to Playbook and Research tab',
    shipped: true,
  },
];
const SECTION_F: Entry[] = [
  {
    name: 'Hamilton Helmer, 7 Powers',
    origin: '7 Powers: The Foundations of Business Strategy (2016).',
    summary:
      'Seven and only seven sources of durable competitive advantage: Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power. Anything else is table stakes.',
    why: 'Already the backbone of the Moat Strength table in Strategy and Positioning. The calibrated behavioural data moat maps to Cornered Resource plus Process Power.',
    surface: 'Strategy and Positioning tab Moat Strength table',
    shipped: true,
  },
  {
    name: 'Peter Thiel, Zero to One',
    origin: 'Zero to One (2014).',
    summary:
      'Contrarian truth: what important truth do very few people agree with you on? Monopoly is the goal, competition is for losers. Last-mover advantage in a new category.',
    why: 'The contrarian truth for Decision Intel: executive teams think their decisions are rational, they are actually riddled with measurable noise and bias nobody audits.',
    surface: 'Founder Context and pitch narrative',
    shipped: true,
  },
  {
    name: 'Ilya Strebulaev, VC Decision Science',
    origin: 'Stanford GSB research on venture capital decision making.',
    summary:
      'Nine principles of VC decision making. Consensus-seeking committees have LOWER success rates. Home runs drive returns, not averages. Reframe the pitch from defensive (avoid mistakes) to offensive (swing with confidence).',
    why: 'Validates the blind-prior Decision Rooms feature and reshapes the pitch. Unanimous-consensus toxic pattern is a direct Strebulaev citation.',
    surface: 'Cross-link to Playbook and Research tab',
    shipped: true,
  },
  {
    name: 'Michael Porter, Five Forces',
    origin: 'Competitive Strategy (1980), Harvard Business School.',
    summary:
      'Industry profitability is determined by supplier power, buyer power, threat of substitutes, threat of new entrants, and rivalry among existing competitors.',
    why: 'Complements 7 Powers in customer conversations with traditional MBA-trained buyers who still think in Five Forces. Useful translation layer, not a replacement.',
    surface: 'Roadmap: Five Forces diagram for Strategy and Positioning tab',
    shipped: false,
  },
  {
    name: 'Ben Thompson, Aggregation Theory',
    origin: 'Stratechery, multiple essays since 2015.',
    summary:
      'In the internet era, value accrues to whoever aggregates demand (users), not whoever controls supply. The moat is the user relationship plus data network effects, not the underlying technology.',
    why: 'Frames why the behavioural-data flywheel is a true moat in an age of commodity LLMs. The model is not the moat, the calibrated outcome data is.',
    surface: 'Roadmap: Aggregation Theory moat essay in Playbook tab',
    shipped: false,
  },
];

export function MethodologiesAndPrinciplesTab() {
  const renderSection = (title: string, entries: Entry[]) => (
    <div style={card}>
      <div style={sectionTitle}>{title}</div>
      {entries.map((e, i) => (
        <EntryBlock key={i} e={e} />
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <GraduationCap size={20} /> Methodologies and Principles
        </div>
        <div style={bodyText}>
          The intellectual foundation of Decision Intel. Every entry below lists the framework, its
          origin, a one-paragraph summary, why it matters for this product, and the specific file or
          component where it lives (or Roadmap if not yet shipped). Use this page as both a
          reference for sales conversations and a backlog of intellectual integrations to ship.
        </div>
      </div>

      {renderSection('B. Cognitive and Decision Science Foundations', SECTION_B)}
      {renderSection('C. Decision Structuring Frameworks', SECTION_C)}
      {renderSection('D. Communication and Persuasion Frameworks', SECTION_D)}
      {renderSection('E. Go-to-Market and Sales Methodologies', SECTION_E)}
      {renderSection('F. Competitive Strategy and Moat Theory', SECTION_F)}

      <div style={{ ...card, borderLeft: '3px solid #eab308' }}>
        <div style={sectionTitle}>
          <Lightbulb size={20} /> G. Adoption Backlog
        </div>
        <div style={bodyText}>
          Roadmap frameworks ranked by expected leverage. Each is documented above, ready to be
          turned into a product ticket.
        </div>
        <div style={{ ...bodyText, marginBottom: 8 }}>
          Recently shipped: Reference Class Forecasting (Outside View panel), Challenger Sale
          playbook, MEDDPICC qualification checklist, SPIN discovery script.
        </div>
        <ol style={{ ...bodyText, paddingLeft: 20 }}>
          <li>Jobs-to-be-Done positioning rewrite of the landing page</li>
          <li>Inversion and Red Team prompts inside Decision Rooms</li>
          <li>Decision Quality Chain scorecard as a companion to DQI</li>
          <li>Cynefin-based routing in the analysis pipeline</li>
          <li>Wisdom-of-Crowds explicit citation in Decision Rooms marketing</li>
          <li>StoryBrand rewrite of the landing page</li>
          <li>Aggregation Theory moat essay in the Playbook tab</li>
        </ol>
      </div>
    </div>
  );
}
