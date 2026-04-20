'use client';

/**
 * UnicornRoadmapTab — the "where is this going, how do we get there"
 * dashboard. Full-page strategic roadmap with:
 *
 *   1. Executive memo (refined synthesis, my honest take)
 *   2. Unicorn timeline (5-year multi-track plan)
 *   3. Moat radar (defensibility stacks)
 *   4. 90-day sprint board (checkable, localStorage-persisted)
 *   5. Design partner funnel
 *   6. Authority tracker (founder signals)
 *   7. Pitfall radar (10 failure modes + mitigations)
 *   8. Operating cadence (weekly rhythm)
 *   9. Fundraising readiness gauge (12 checkpoints)
 *  10. Competitive positioning map
 *
 * Source: LLM Council roadmap + CLAUDE.md positioning + Claude's
 * refined synthesis (2026-04-22). Update quarterly.
 */

import { NorthStarHero } from './unicorn-roadmap/NorthStarHero';
import { ExecutiveMemo } from './unicorn-roadmap/ExecutiveMemo';
import { UnicornTimeline } from './unicorn-roadmap/UnicornTimeline';
import { MoatRadar } from './unicorn-roadmap/MoatRadar';
import { SprintBoard } from './unicorn-roadmap/SprintBoard';
import { DesignPartnerFunnel } from './unicorn-roadmap/DesignPartnerFunnel';
import { AuthorityTracker } from './unicorn-roadmap/AuthorityTracker';
import { PitfallRadar } from './unicorn-roadmap/PitfallRadar';
import { OperatingCadence } from './unicorn-roadmap/OperatingCadence';
import { FundraisingGauge } from './unicorn-roadmap/FundraisingGauge';
import { CompetitiveMap } from './unicorn-roadmap/CompetitiveMap';

export function UnicornRoadmapTab() {
  return (
    <div style={{ paddingBottom: 64 }}>
      <NorthStarHero />
      <ExecutiveMemo />
      <UnicornTimeline />
      <MoatRadar />
      <CompetitiveMap />
      <SprintBoard />
      <DesignPartnerFunnel />
      <AuthorityTracker />
      <OperatingCadence />
      <FundraisingGauge />
      <PitfallRadar />
    </div>
  );
}
