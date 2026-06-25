/**
 * Founder narrative SSOT — the canonical "why" + the two signature mental
 * models, in the founder's own voice. Created 2026-06-25 after the founder
 * shared his corrected motivational core (two GPT/Claude conversations).
 *
 * WHY THIS EXISTS: the mission framing ("retire my parents + a school for
 * kids", money as a MEANS) was nowhere in the codebase — the only founder
 * narrative was the generational-change "16-year-old data-native anchor"
 * story. The earlier framing the founder used ("the average path isn't good
 * enough for me") is REJECTED by him as status anxiety — thin fuel, a
 * treadmill with no finish line, and a reason an investor worries about him
 * rather than trusts him. Centralising it here stops that status framing from
 * creeping back into any one surface.
 *
 * CONSUMERS (keep in lockstep — edit the strings HERE only):
 *   - founder-context.ts          → chat coaching (buildFounderWhyBlock)
 *   - sparring-room-data.ts        → the "why are you doing this" drill
 *   - path-to-100m/data/*          → the generational-change + AI-native cards
 *   - (marketing)/about            → the navigation PHILOSOPHY only (NOT the
 *                                    personal mission — cold procurement /about
 *                                    is the wrong home for "retire my parents")
 *   - personal-social-system-prompt.ts → Content Studio voice anchors
 *
 * EM-DASH DISCIPLINE: every string here is em-dash-clean (commas / colons /
 * periods only) so the navigation + leverage frames are safe to render on the
 * /about marketing surface under the 1-em-dash-per-page cap. Same posture as
 * the upload-guidance SSOT.
 *
 * SURFACE BOUNDARY (load-bearing): FOUNDER_MISSION + FOUNDER_DRIVE +
 * FOUNDER_WHY_DISCIPLINE are WARM / founder-private (investor prep, chat,
 * Sparring) — the personal mission belongs where the reader is already warm.
 * FOUNDER_NAVIGATION_FRAME + FOUNDER_LEVERAGE_FRAME are the PHILOSOPHY layer
 * and may go public (they are about the product thesis, not "the scrappy
 * 16-year-old"); never put stage-of-company / "solo founder" language from
 * these onto a marketing surface (banned per the marketing voice rules).
 */

/** The mission — money as a MEANS, never the end. Lead with this. */
export const FOUNDER_MISSION =
  'Money is a means, never the end. The mission is twofold: first, the financial freedom to retire my parents (they have done more than enough for me, and I want them to be able to stop working) and to be genuinely there for my family. Then, to build a school that teaches young people the foundational skills they need to navigate a fast-changing world. That is where the deeper purpose lives.';

/** The durable drive — the obsession that is the PROOF of founder-market fit. */
export const FOUNDER_DRIVE =
  'The thing I cannot stop circling, with or without anyone watching, is why intelligent people make bad decisions. It runs from a published honors thesis on the cognitive roots of the 2008 financial crisis, through Decision Intel, to reading Superforecasting for fun. That obsession is the proof of fit. The emotional anchor was watching a former professional athlete light up with raw passion for his craft, the moment I recognised the default school-to-job route would never produce that in me. The anchor is real, but the work is the proof; never let the story stand in for the track record.';

/** The framing discipline — how to SAY the why (and how NOT to). */
export const FOUNDER_WHY_DISCIPLINE =
  "Lead with the mission and the obsession, never with 'the average path is not good enough for me.' The first earns trust; the second reads as status anxiety, a treadmill with no finish line. And hold the mission rigid while holding the timeline as a direction, not a deadline. A confident date with no reference class (financially free by 25) is the exact illusion-of-validity that Decision Intel is built to audit; applying R2F to your own life means treating the deadline as a heading, not a contract. Not lowering the ambition, auditing it.";

/** Mental model 1 — success is navigation, not maps. The product-thesis bridge. */
export const FOUNDER_NAVIGATION_FRAME =
  "Success is navigation, not maps. Most people want a step-by-step formula, but the terrain keeps changing, so no fixed route survives a storm. What travels is the sailor's skill: judgment, resilience, adaptability, learning from rejection, emotional control, tenacity. With those you can route around any closed path and still reach the destination. It is the belief beneath Decision Intel: the best decision-makers do not follow scripts, they observe, update, and correct course. Do not replace intuition, audit it. And success is not reaching one island; it is becoming the kind of sailor who can reach many.";

/** Mental model 2 — leverage is the wind. The AI-native operator story. */
export const FOUNDER_LEVERAGE_FRAME =
  'Leverage is the wind. The naive model is effort to results; the real one is effort times leverage. Rowing alone only takes you as far as your muscles allow, but a sail lets a little effort plus the wind carry you hundreds of miles. AI is the new wind: one operator can now do the work of a whole team across research, build, design, distribution, and sales. The discipline that keeps it honest: the wind is useless without the skill to capture it. AI amplifies competence, it does not create it.';

/**
 * The founder-private coaching block for the chat. Mission + drive + discipline,
 * plus the two frames named so the chat can deploy them when the founder is
 * rehearsing an investor / advisor answer or drafting personal-brand content.
 */
export function buildFounderWhyBlock(): string {
  return [
    'FOUNDER WHY + MENTAL MODELS (locked 2026-06-25 — the founder shared his corrected motivational core; SSOT in src/lib/data/founder-narrative.ts). When the founder asks "what is my why" / "how do I answer why are you doing this" / "what should I tell an investor about my motivation" / "the sailing analogy" / "leverage" — coach from HERE, and HOLD the discipline below (do not let the rejected status framing creep back in).',
    `THE MISSION (lead with this): ${FOUNDER_MISSION}`,
    `THE DRIVE (the proof of fit): ${FOUNDER_DRIVE}`,
    `FRAMING DISCIPLINE (load-bearing): ${FOUNDER_WHY_DISCIPLINE}`,
    `MENTAL MODEL 1 (use for content + the "why decision quality matters" story): ${FOUNDER_NAVIGATION_FRAME}`,
    `MENTAL MODEL 2 (the AI-native operator / generational-change asset; pre-empts "couldn\'t anyone do this with ChatGPT?"): ${FOUNDER_LEVERAGE_FRAME}`,
  ].join('\n');
}
