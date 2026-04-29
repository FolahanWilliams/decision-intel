/**
 * FailureModesWatchtower consumer data — 6 traps (3 internal + 3
 * external attack vectors) with named tripwires. Split out from
 * monolithic data.ts at F2 lock 2026-04-29.
 *
 * Source synthesis: NotebookLM Master KB note `9a249bd8` (External
 * Attack Vectors) + internal-execution pre-mortems from CLAUDE.md.
 */

export type FailureMode = {
  id: string;
  trap: string;
  killedCompany: string;
  diagnostic: string;
  diExposure: 'critical' | 'high' | 'medium' | 'low';
  countermove: string[];
  tripwire: string;
  whatToWatch: string;
  evidence: string;
};

export const FAILURE_MODES: FailureMode[] = [
  {
    id: 'quantellia_consulting_trap',
    trap: 'The Unscalable Consulting Trap',
    killedCompany: 'Quantellia',
    diagnostic:
      'Building highly bespoke, complex decision-orchestration models that require heavy consulting + rapid modelling + education to use. The platform becomes difficult to scale, QA, and secure across organisations.',
    diExposure: 'high',
    countermove: [
      'Force the productized 12-node pipeline as the surface — no per-customer custom pipelines',
      'Bespoke design-partner asks become roadmap items if generally applicable, NOT one-off code paths',
      'Founder School lesson es_7 + es_11 codify the rule: free pilots have a 6-week ceiling, then transition to paid Strategy contract',
    ],
    tripwire:
      'If a design-partner conversation requires "let me build that just for you" within the first 30 days, surface the trade-off explicitly. Either the feature is generally applicable (build into the pipeline) or it is not (decline with a why).',
    whatToWatch:
      'Per-customer custom code paths. Engineering hours spent on bespoke vs productized. If bespoke exceeds 30% of weekly engineering, the trap is engaged.',
    evidence:
      'NotebookLM external attack synthesis 2026-04-27 + Founder School lessons es_7 + es_11 + CLAUDE.md anti-scope-creep',
  },
  {
    id: 'cloverpop_adoption_trap',
    trap: 'The Manual-Logging Adoption Trap',
    killedCompany: 'Cloverpop (pre-acquisition)',
    diagnostic:
      'Building a system focused on multi-stakeholder collaboration and decision tracking that relies on humans to manually log decisions and fill out templates. Massive adoption friction. Becomes shelfware by month three.',
    diExposure: 'critical',
    countermove: [
      'Integration-first onboarding (Founder School es_9): map workflow IN the discovery call, set up Drive polling or analyze+token@in.decision-intel.com forwarder in 15 minutes BEFORE contract',
      "Zero behavior change is the default — DI runs on the analyst's existing artefact stream",
      'Outcome Gate Phase 3 (shipped 2026-04-27) auto-prefills outcome drafts so the user clicks ONCE to confirm',
    ],
    tripwire:
      'If audits per active user drop below 5/month sustained, integration broke. Diagnose: is the email forwarder firing? is Drive polling stuck? did the analyst manually disable?',
    whatToWatch:
      'Audit velocity per design partner per month. Time from analysis-complete to outcome-logged. Both should be under 24 hours when integration is healthy.',
    evidence:
      'NotebookLM Q6 pre-mortem (note `9a249bd8`) + CLAUDE.md Outcome Gate locks + NotebookLM PITFALLS.cloverpop_trap entry',
  },
  {
    id: 'cathedral_of_code',
    trap: 'The Cathedral-of-Code Trap (DI-specific, currently active)',
    killedCompany: 'Many over-engineered AI-native startups',
    diagnostic:
      'Sophisticated technical product without paid validation. 200+ components, 70+ API routes, 190K+ LOC built BEFORE the first paid customer.',
    diExposure: 'critical',
    countermove: [
      'Stop horizontal feature shipping. Until first paid design partner closes, every shipping decision answers: "does this make the first 60 seconds of the demo better OR close the first contract faster?"',
      'Outcome Gate Enforcement (Phase 1 + 2 + 3 shipped 2026-04-27) — design partners contractually commit to logging outcomes, accelerating the data flywheel',
      '90-day target: 3-5 paid design partners on £2,499/mo Strategy contract or per-deal pricing',
    ],
    tripwire:
      'If 60 days pass without a paid pilot signed, this weakness is no longer dormant — it IS the active unicorn-killer. Stop building, start closing.',
    whatToWatch:
      'Days since last paid contract signed. Engineering hours spent on net-new features vs. closing-related work. Founder time on building vs founder time on outbound + meetings.',
    evidence:
      'CLAUDE.md "Cathedral of code" section + NotebookLM Q6 pre-mortem (note `9a249bd8`) + Honest Probability Path Hard Truth Risks',
  },
  {
    id: 'cloverpop_data_advantage',
    trap: 'Cloverpop Data Advantage (External Attack Vector #1)',
    killedCompany: 'Cloverpop is the threat, not the killed-by',
    diagnostic:
      'Cloverpop was acquired in September 2025 by Clearbox Decisions specifically to commercialize for enterprise. They have YEARS of structured enterprise decision + outcome data we do not have. If Clearbox simply licenses GPT-4o or Claude to run a Kahneman-style bias prompt over their massive existing repository of logged decisions, they instantly replicate "audit" capability backed by REAL historical data.',
    diExposure: 'critical',
    countermove: [
      'Outcome Gate Enforcement accelerates outcome-data accumulation for design-partner orgs — every gated audit forces the loop closure that builds OUR data moat',
      'Pan-African specimen library (WeWork + Dangote + future co-authored sectoral specimens) compounds in dimensions Cloverpop cannot easily extend',
      'The 17-framework regulatory map across G7 / EU / GCC / African markets is structurally something a US-incumbent would need 12-18 months to match',
    ],
    tripwire:
      'If Clearbox launches "Cloverpop AI Audit" with bias-detection capability before Q3 2026, they have closed the gap. Track Clearbox Decisions press releases monthly.',
    whatToWatch:
      'Clearbox Decisions hiring page (any behavioral-science academic hires?) + Cloverpop product release notes + Google Scholar for "decision intelligence + bias" papers from their team',
    evidence:
      'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
  {
    id: 'ibm_watsonx_bundling',
    trap: 'IBM watsonx.governance Bundling (External Attack Vector #2)',
    killedCompany: 'IBM is the threat, not the killed-by',
    diagnostic:
      'IBM launched massive Q1 2026 updates to watsonx.governance explicitly targeting EU AI Risk Assessments + automated compliance accelerators. We argue we audit the human decision and IBM audits the model — but Fortune 500 GCs do NOT want to buy two separate governance SKUs. If IBM adds a basic "Human Decision Provenance" module to their existing entrenched watsonx suite, F500 CSOs and GCs will check the EU AI Act Article 14 compliance box with IBM by August 2026 enforcement deadline.',
    diExposure: 'high',
    countermove: [
      'Pan-African / EM-fund wedge is the bypass — IBM does not sell into Pan-African corp dev or EM-focused fund partners with our regulatory depth',
      "The DPR's Pan-African regulatory mapping (NDPR / CBN / WAEMU / PoPIA / CMA Kenya) is something IBM watsonx does NOT cover",
      'Long-term: position Decision Intel as the audit layer that integrates WITH IBM watsonx rather than competes — but only after the wedge is established + references exist',
    ],
    tripwire:
      'If IBM watsonx product roadmap shipping notes mention "human decision provenance" or "strategic memo audit" as a Q2-Q3 2026 feature, the bundle threat is active.',
    whatToWatch:
      'IBM watsonx.governance product release notes + IBM Think conference announcements + IBM partner-program AI governance changes + IBM hiring for "AI ethics + decision audit" roles',
    evidence:
      'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
  {
    id: 'agentic_shift',
    trap: 'Agentic Shift Makes Strategic Memo Obsolete (External Attack Vector #3)',
    killedCompany: 'Palantir + Databricks + Aera Technology + Snowflake (the threat is structural)',
    diagnostic:
      'Palantir launched its "Agentic AI Hives" manifesto. Databricks is positioning Unity Catalog as an agent control tower. Aera Technology is deploying autonomous agents that execute supply-chain decisions directly. Snowflake is pitching agents acting over governed data. Our entire product is built around uploading a written "strategic memo" — but the volume of human-authored 40-page strategy memos may plummet as enterprises shift from decision-SUPPORT to decision-EXECUTION via agents.',
    diExposure: 'medium',
    countermove: [
      'The 7-minute live audit motion on specimens (Founder School es_10) does NOT depend on memo format — depends on the bias-detection IP being applicable to ANY structured artefact (IC memos, board decks, agent decision logs, agentic system prompts)',
      'Strategic question to revisit Q3 2026: position Decision Intel as the audit layer FOR agents — agentic systems making capital-allocation decisions need a reasoning audit too',
      'Track the agentic-shift telemetry: is the 12-month-out F500 CSO ICP shrinking the volume of human-authored strategic memos?',
    ],
    tripwire:
      'If two F500 prospects independently mention "agents are doing this for us now" in 2026, the memo format is declining faster than the wedge can close. Pivot to audit-layer-for-agents.',
    whatToWatch:
      'Palantir + Databricks + Aera + Snowflake quarterly earnings calls for agentic-decision case studies. Track F500 CSO LinkedIn posts for "agent-led strategy" framing. NotebookLM monitor for the agentic-shift narrative shift.',
    evidence:
      'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
];

// =========================================================================
// SECTION 11 · WARM-INTRO NETWORK MAP
// =========================================================================

