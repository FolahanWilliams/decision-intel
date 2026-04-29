/**
 * NinetyDayActionPlan consumer data — May-Jul 2026 sequenced moves
 * across product / GTM / fundraise / data / positioning / authority.
 * Split out from monolithic data.ts at F2 lock 2026-04-29.
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
  // Weeks 1-4 (May 2026)
  {
    id: 'close_3_design_partners',
    week: 'Weeks 1-4 · May 2026',
    weekNumber: 1,
    category: 'gtm',
    action: 'Close 3 paid design partners on £2,499/mo Strategy contract or equivalent',
    why: 'Outcome-gate-enforcement requires contracted partners. Cathedral-of-code trap requires paid validation. Pre-seed deck requires booked ARR.',
    successCriterion:
      '3 signed contracts · £7,497/mo MRR · outcome-gate enforced contractually · integration-first onboarding live',
    blocker:
      'Slow procurement cycles · founder time on inbound vs outbound · advisor-network activation cadence',
    effort: 'large',
  },
  {
    id: 'sankore_close',
    week: 'Weeks 1-2',
    weekNumber: 1,
    category: 'gtm',
    action: 'Close Sankore on contract — first wedge proof',
    why: 'Sankore brief is at-the-ready. Pan-African anchor IS the moat. Closed Sankore unlocks the Pan-African PE network referrals.',
    successCriterion:
      'Sankore signed contract · 90-day onboarding plan · 3 retro-audits + live IC pipeline · outcome-gate enforced',
    blocker:
      'ISA 2007 framework gap (critical Nigerian regulator). DQI explainability + CIs not yet shipped.',
    dependsOn: ['ship_isa_2007', 'ship_dqi_cis'],
    effort: 'medium',
  },
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

