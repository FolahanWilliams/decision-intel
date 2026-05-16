/**
 * Public-case-anchored 1-pager — Phase C of the warm-outreach engine.
 *
 * Produces the leave-behind a founder hands a named prospect: "here's
 * what an audit caught in [a PUBLIC famous case in your sector] — the
 * same lens runs on your next memo." It NEVER audits, references, or
 * speculates about the prospect's own deal.
 *
 * The ego-threat lock is enforced in the DATA FLOW, not just the
 * prompt: the anchor case can only ever come from the injected
 * 143-case library (via Phase B's canonical pickAnchorCase), and the
 * route is given NO prospect-decision input to leak. The instruction
 * additionally forbids the model from inventing one.
 *
 * Reuse, not rebuild: anchor selection delegates to the canonical
 * prospect-shortlist helpers; the voice/positioning comes from the
 * personal-social archetype engine; persistence reuses OutreachArtifact.
 * This module is PURE (no I/O, no LLM, no Prisma) + unit-tested; the
 * route is the only I/O wrapper.
 */

import type { CaseStudy } from '@/lib/data/case-studies/types';
import type { PostArchetypeId } from '@/lib/data/personal-social-system-prompt';
import type { WedgePersonaId } from '@/lib/data/event-prep';
import { normalizeSectorToIndustry, pickAnchorCase } from './prospect-shortlist';

export interface OnepagerRequest {
  /** The named prospect the founder is targeting (display only — never audited). */
  prospectCompany: string;
  /** The prospect's role / persona label (frames the problem, not the prospect's deal). */
  prospectRole: string;
  /** Coarse sector — drives the PUBLIC anchor-case selection. */
  sector: string;
  /** Optional persona id for archetype routing. */
  personaId?: WedgePersonaId;
}

/**
 * Resolve the PUBLIC anchor case for a sector. Returns null when the
 * sector doesn't map or the library has no case there — the route
 * then 400s rather than generating an unanchored (and therefore
 * ego-unsafe) 1-pager. Delegates to the canonical Phase-B helpers.
 */
export function selectOnepagerAnchor(sector: string, cases: CaseStudy[]): CaseStudy | null {
  const industry = normalizeSectorToIndustry(sector);
  if (!industry) return null;
  return pickAnchorCase(industry, cases);
}

/**
 * Route to the right personal-social archetype. Cross-border / EM /
 * fund-GP framings land on `cross_border_reality`; everything else on
 * `billion_dollar_autopsy` (the plan's two 1-pager archetypes).
 */
export function pickOnepagerArchetypeId(
  sector: string,
  role: string,
  personaId?: WedgePersonaId
): PostArchetypeId {
  const blob = `${sector} ${role}`.toLowerCase();
  const crossBorder =
    personaId === 'smaller_fund_gp' ||
    /\bfund\b|\bgp\b|\blp\b|cross-border|pan-african|emerging market|\bem\b/.test(blob);
  return crossBorder ? 'cross_border_reality' : 'billion_dollar_autopsy';
}

/**
 * The content-type instruction handed to buildPersonalSocialSystemPrompt.
 * The hard ego-safe constraint is the load-bearing part: anchor ONLY
 * on the public case; invent nothing about the prospect's own deal.
 */
export function buildOnepagerInstruction(req: OnepagerRequest, anchor: CaseStudy): string {
  return `Write a SINGLE-PAGE outreach leave-behind (~380-450 words, no markdown headers — plain prose with at most one short list) for a named prospect.

Prospect (display context only — see the hard rule below): ${req.prospectCompany} · ${req.prospectRole} · ${req.sector}.

PUBLIC ANCHOR CASE (the ONLY case you may reference): ${anchor.company} — "${anchor.title}". Primary bias pattern: ${anchor.primaryBias}. Outcome class: ${anchor.outcome}.

Structure:
1. Open on the recurring decision problem someone in the ${req.prospectRole} seat recognises (in their language — no product vocabulary yet).
2. Show, concretely, what a reasoning audit surfaced in the PUBLIC ${anchor.company} case — the bias pattern, where it hid in the reasoning, what it cost. This is the proof, not a pitch.
3. Bridge: the same lens runs in ~60 seconds on their next strategic memo — name what they'd get back (patterns, the counterfactual, a record), still plain-language.
4. Close with a low-commitment ask: a 60-second audit on one real memo, no slides, no pitch.

HARD RULE — non-negotiable, this is the whole point:
- Anchor EXCLUSIVELY on ${anchor.company}. You were given NO information about ${req.prospectCompany}'s own deals, decisions, memos, or outcomes — and you must INVENT none. Never state, imply, or speculate that ${req.prospectCompany} made a mistake or has a bias. The artefact audits a PUBLIC historical case to demonstrate the lens; it never audits the reader.
- Name a missing process ("unaudited reasoning"), never broken thinking. The reader's judgment is never the subject.
- Use no accusatory framing and no crowded category nouns; the positioning + banned-vocabulary guard is already in the system prompt — obey it.`;
}
