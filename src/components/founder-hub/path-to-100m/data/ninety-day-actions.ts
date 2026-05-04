/**
 * NinetyDayActionPlan consumer data — May-Jul 2026 sequenced moves
 * across product / GTM / fundraise / data / positioning / authority.
 * Split out from monolithic data.ts at F2 lock 2026-04-29.
 * Re-framed 2026-05-04 around GTM v3.5 RATIFIED Phase 1 Individual wedge
 * (NOT the v3.4 mid-market £2,499/mo direct motion that v3.5 superseded).
 *
 * When the sprint plan rolls forward (next 90-day window), update HERE.
 */

export type NinetyDayAction = {
  id: string;
  week: string;
  weekNumber: number;
  category: 'product' | 'gtm' | 'fundraise' | 'data' | 'positioning' | 'authority';
  action: string;
  why: string;
  successCriterion: string;
  blocker: string;
  dependsOn?: string[];
  effort: 'small' | 'medium' | 'large';
};

export const NINETY_DAY_ACTIONS: NinetyDayAction[] = [
  // Weeks 1-2 — GTM v3.5 operational lock criteria
  {
    id: 'ship_vohra_pmf',
    week: 'Week 1 · May 2026',
    weekNumber: 1,
    category: 'product',
    action:
      'Ship Vohra PMF survey infrastructure (modal + cron + admin metrics) + Phase 1 persona gating + Outcome Gate auto-enforce on HXC users',
    why: 'GTM v3.5 lock criteria 1-3 (RATIFIED 2026-05-04). Without Vohra surveying running monthly + persona gating filtering non-buyer-class users + Outcome Gate enforcing on Individual tier, the Phase 1 graduation gate (≥40% "very disappointed" on HXC cohort) cannot fire — and the data flywheel never starts.',
    successCriterion:
      'In-app modal fires after 2 audits in 14 days · /api/cron/vohra-pmf-trigger live · /api/founder-hub/vohra-pmf returns HXC % · sign-up form gates 4 personas + auto-redirects "other" · Outcome Gate enforces on phase1HxcEligible=true',
    blocker: 'Migration deployment timing on production Supabase',
    effort: 'medium',
  },
  {
    id: 'phase_1_wedge_outreach',
    week: 'Weeks 1-12 · May-July 2026',
    weekNumber: 1,
    category: 'gtm',
    action:
      'Run 5-10 personalised LinkedIn DMs/week to buyer-class-continuous personas (fractional CSO, mid-market Corp Dev, smaller-fund GP, PE-backed founder)',
    // drift-tolerant — "143 cases" is the founder's verbatim DM-script anchor at v3.5 ratification time; will be re-locked when historical-case corpus next grows.
    why: 'GTM v3.5 ratified Phase 1 motion. Script discipline: lead with a specific bias from one of the 143 cases that matches the prospect industry, offer a free 60-second audit on their next memo. NOT direct outbound at scale; targeted high-signal DMs to people who fit the wedge.',
    successCriterion:
      '8-12 paid Individual £249/mo customers retained 90+ days by month 6 · ≥3 documented ROI case studies · ≥2 warm intros to mid-market peers generated',
    blocker:
      'Founder time on outbound vs product · LinkedIn API rate limits · finding the 4 personas without Sales Navigator',
    effort: 'large',
  },
  {
    id: 'phase_1_kill_criterion_calendar',
    week: 'Month 4 · August 2026',
    weekNumber: 13,
    category: 'gtm',
    action: 'Phase 1 kill-criterion review — 8-12 paid customers OR pivot',
    why: 'GTM v3.5 baseline: <5 paid customers by month 4 OR Vohra "very disappointed" <30% on HXC cohort = halt scaling, run product-discovery sprint with somewhat-disappointed + not-disappointed cohorts. Founder ratified the 8-12 baseline (not the 40 stretch goal from Gemini report — that assumes existing audience).',
    successCriterion:
      'If baseline hit: graduate to Phase 2 (Sankore bridge). If kill fires: 5+ qualitative interviews with non-fits to surface the right pivot. NEVER push harder on the same motion when the early-warning signal is red.',
    blocker: 'None — calendar-locked review',
    effort: 'small',
  },
  {
    id: 'london_strategy_world_june',
    week: 'Weeks 5-6 · June 2026',
    weekNumber: 5,
    category: 'gtm',
    action: 'Strategy World London (June 9-10, BAFTA) + AI in Business Conference (May 14, Prospero House)',
    why: 'GTM v3.5 ratified events list. Strategy World is the highest-signal CSO event in London; AI in Business is high-signal for fractional CSOs + mid-market Heads of Strategic Planning. Cap at 2/month maximum to protect 1-1-1 traffic-source discipline.',
    successCriterion:
      '5+ pre-booked 1:1 coffees with target-persona attendees per event · Hybrid Discovery + Tailored-Pitch script run in every conversation · post-event CRM record per conversation · 2-3 follow-up audits booked',
    blocker: 'Travel + accommodation cost (~£500/event) · founder time vs product velocity',
    effort: 'medium',
  },
  // Existing v3.4 actions — kept but re-framed below as Phase 2 / 3 work
  {
    id: 'sankore_phase_2_close',
    week: 'Weeks 5-12 · June-July 2026 (ramp to summer engagement)',
    weekNumber: 5,
    category: 'gtm',
    action: 'Close Sankore on £1,999/mo founding-pilot contract — Phase 2 BRIDGE (NOT Phase 1 wedge)',
    why: 'Sankore is the v3.5 Phase 2 design-partner BRIDGE, not the Phase 1 wedge. £1,999/mo founding-pilot rate (locked from v3.3 brief; £4,999/mo is the post-Sankore Phase 3 mid-market wedge price). Pan-African anchor IS the moat. 12-week structured engagement produces 3+ anonymised DPR specimens + 5+ warm intros to mid-market peer GPs / portfolio CSOs.',
    successCriterion:
      'Sankore signed at £1,999/mo · 12-week engagement plan with concrete deliverables · ≥3 anonymised DPRs published · ≥5 mid-market warm intros queued for Phase 3 activation · Outcome Gate enforced contractually',
    blocker:
      'ISA 2007 framework gap (critical Nigerian regulator). DQI explainability + CIs not yet shipped. Phase 1 Individual evidence not yet accumulated.',
    dependsOn: ['ship_isa_2007', 'ship_dqi_cis', 'phase_1_wedge_outreach'],
    effort: 'medium',
  },
  // Note: legacy sankore_close action superseded 2026-05-04 by sankore_phase_2_close
  // above (re-framed as Phase 2 BRIDGE per GTM v3.5, with locked £1,999/mo
  // founding-pilot rate from v3.3 Sankore brief, NOT a Phase 1 wedge proof).
  {
    id: 'ship_isa_2007',
    week: 'Weeks 1-2',
    weekNumber: 1,
    category: 'product',
    action: 'Ship ISA 2007 (Nigerian Investment & Securities Act 2007) framework module',
    why: 'Sankore-class deal-killer. The Pan-African 17-framework map drops to 18 with this. CLAUDE.md Enterprise Friction Matrix lock 2026-04-26.',
    successCriterion:
      'ISA 2007 framework live in getAllRegisteredFrameworks() · DPR specimens regenerated · /security page updated',
    blocker: 'Solo dev time. ISA 2007 statute reading time.',
    effort: 'medium',
  },
  {
    id: 'ship_dqi_cis',
    week: 'Weeks 1-3',
    weekNumber: 1,
    category: 'product',
    action: 'Add 90% confidence intervals on counterfactual dollar outputs',
    why: 'F500 audit chairs reject heuristic-based financial estimates without CIs. DQI explainability is the procurement-gate enabler for F500 expansion.',
    successCriterion:
      'CounterfactualPanel renders ±X% CI band · DPR Counterfactual Impact section carries Wilson-CI text · regression tests pass',
    blocker:
      'Sample-size requirements (Wilson CI requires N≥10 outcomes for tightest band). Acceptable to ship with low-N caveat.',
    effort: 'medium',
  },

  // Weeks 5-8 (June 2026)
  {
    id: 'agentic_shift_investigation',
    week: 'Weeks 1-8 · May-June 2026 (synthesis at end of June)',
    weekNumber: 5,
    category: 'positioning',
    action:
      'Run agentic-shift Q2 2026 investigation · 10 prospect discovery conversations + end-of-June synthesis memo + path-lock (A/B/C)',
    why: 'External Attack Vector #3 needs evidence-grounded triage before the wedge sequencing reaches the design-partner conversion gate. The discovery question slots into the §7 hybrid-motion script as Q5 (after the 4 discovery questions, before the tailored pitch). Investigation scaffolding ships docs/agentic-shift-investigation-q2-2026.md; the founder writes the one-page synthesis end of June + locks Path A (wedge holds) / Path B (ship AI-assistance signature detector) / Path C (extend structurer for agent decision-chain logs in 2026 H2). Without this triage, Vector #3 stays a generic risk instead of a navigable decision tree.',
    successCriterion:
      '10 discovery conversations logged in the memo sample table · synthesis memo written + path-locked by 2026-06-30 · CLAUDE.md Vector #3 + founder-context.ts + GTM v3.3 §5 propagated lock-step',
    blocker:
      'Warm-intro velocity (need ~10 conversations sampled across F500 CSO + PE M&A + Pan-African fund + corp-dev + GC archetypes — persona diversity discipline, no clustering 5+ in same buyer org). Discovery-before-pitch discipline (poisoning the data with pitches kills the sample).',
    effort: 'medium',
  },
  {
    id: 'mckinsey_quantumblack_intro',
    week: 'Weeks 5-6 · June 2026',
    weekNumber: 5,
    category: 'authority',
    action: 'Activate Wiz advisor → McKinsey QuantumBlack alliance intro',
    why: 'Per NotebookLM McKinsey synthesis 2026-04-27, this is the highest-ROI advisor ask. Channel partnership unlocks F500 CSO direct ARR pull-through.',
    successCriterion:
      'First peer-level conversation booked with QuantumBlack senior partner or alliances head · category-conversation deck delivered',
    blocker: 'Advisor-relationship cadence. Specific-ask preparation discipline.',
    effort: 'small',
  },
  {
    id: 'lrqa_meeting_executed',
    week: 'Weeks 5-6',
    weekNumber: 5,
    category: 'authority',
    action: 'Execute LRQA / Ian Spaulding meeting + 48h follow-up playbook',
    why: 'Family-warm-intro at C-level. EiQ + Partner Africa integration paths are uniquely fit. The LRQA precedent becomes the template for future warm-intro briefs.',
    successCriterion:
      'Meeting delivered · 48h follow-up cadence executed · second meeting booked OR decline-with-reason logged',
    blocker: 'Single highest-stakes meeting of the quarter. Preparation must be category-grade.',
    effort: 'large',
  },
  {
    id: 'pre_seed_deck_v1',
    week: 'Weeks 5-8',
    weekNumber: 5,
    category: 'fundraise',
    action:
      'Draft pre-seed deck v1 — 12 slides + the HonestProbabilityPath + the 16 investor metrics tracker',
    why: 'Once 3 design partners closed + LRQA second meeting + QuantumBlack alliance conversation, the deck is the next leverage point.',
    successCriterion:
      'Deck draft v1 reviewed by Wiz advisor · 3 specific revisions complete · ready for warm investor intros',
    blocker:
      'Deck writing time. Investor-narrative discipline (size before growth, no chart tricks).',
    dependsOn: ['close_3_design_partners'],
    effort: 'medium',
  },

  // Weeks 9-12 (July 2026)
  {
    id: 'gtm_co_founder_search',
    week: 'Weeks 9-10 · July 2026',
    weekNumber: 9,
    category: 'authority',
    action: 'Launch GTM co-founder / advisor search via Wiz-advisor network + operator-angel list',
    why: 'Founder continuity question is the #1 pre-seed VC objection. GTM co-founder addresses both continuity AND outbound capacity.',
    successCriterion:
      '5 GTM-co-founder conversations completed · 2 advisor convertibles closed · continuity playbook v1 drafted for pre-seed deck',
    blocker:
      'Co-founder economic alignment (equity grant + cash compensation). Founder evaluation discipline.',
    effort: 'large',
  },
  {
    id: 'reference_case_first_publication',
    week: 'Weeks 11-12',
    weekNumber: 11,
    category: 'authority',
    action: 'Publish first anonymised reference case (Sankore-anchored, name-redacted)',
    why: 'Wedge generates references. References unlock F500 ceiling. CLAUDE.md no-named-prospects rule is the discipline gate.',
    successCriterion:
      'First anonymised reference case live on /case-studies · LinkedIn announcement drives X content engagements',
    blocker: 'Sankore approval for anonymised publication. Outcome-data accumulation timeline.',
    dependsOn: ['sankore_close'],
    effort: 'medium',
  },
  {
    id: 'pre_seed_lead_term_sheet',
    week: 'Weeks 11-12',
    weekNumber: 11,
    category: 'fundraise',
    action: 'Secure pre-seed lead term sheet · target £2-4M lead at £20-30M pre-money',
    why: 'Pre-seed close by Q4 2026 is the HonestProbabilityPath Phase 1 conditional probability gate. Without it, the path collapses.',
    successCriterion:
      'Term sheet from a thesis-fit pre-seed VC · co-investor confirmation · 12-week close timeline',
    blocker:
      'Investor due-diligence cycle. Continuity playbook strength. Design-partner reference readiness.',
    dependsOn: ['close_3_design_partners', 'gtm_co_founder_search', 'pre_seed_deck_v1'],
    effort: 'large',
  },

  // Continuous (every week)
  {
    id: 'outcome_gate_telemetry',
    week: 'Continuous',
    weekNumber: 0,
    category: 'data',
    action:
      'Monitor outcome-gate telemetry weekly · audit velocity per design partner · time-to-outcome-logged',
    why: 'Cloverpop manual-logging trap is the #1 active failure mode. Audit velocity drop signals integration broke.',
    successCriterion:
      'Audits per active user per month >5 sustained · time-from-analysis-to-outcome <48h sustained',
    blocker: 'Manual telemetry today. Automated dashboard would be ideal but is not blocking.',
    effort: 'small',
  },
  {
    id: 'competitive_intelligence_sweep',
    week: 'Continuous · monthly',
    weekNumber: 0,
    category: 'positioning',
    action:
      'Monthly competitive intelligence sweep · Cloverpop / Aera / IBM watsonx / Palantir / Quantexa / Snowflake',
    why: 'External attack vectors require active monitoring. The moment any incumbent ships a competing feature, the strategic posture shifts.',
    successCriterion:
      'Monthly sweep documented · Failure Modes Watchtower tripwires updated · CLAUDE.md External Attack Vectors section refreshed if needed',
    blocker: 'Time investment (~2-3 hours per month).',
    effort: 'small',
  },
];

// =========================================================================
// SECTION 13 · NOTEBOOKLM FOLLOW-UP LAB (10 high-value next questions)
// =========================================================================

