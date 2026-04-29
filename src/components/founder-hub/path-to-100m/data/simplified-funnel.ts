/**
 * SimplifiedThirtyDayFunnel consumer data — funnel screens + feature
 * verdicts. Split out from monolithic data.ts at F2 lock 2026-04-29.
 */

export type FunnelScreen = {
  id: string;
  step: number;
  name: string;
  what: string;
  action: string;
  whatToHide: string[];
};

export const SIMPLIFIED_FUNNEL: FunnelScreen[] = [
  {
    id: 'landing',
    step: 1,
    name: 'Landing · the hook',
    what: 'No "native reasoning layer." No "17 frameworks." Above-the-fold = a single H1 that names the buyer\'s acute fear.',
    action:
      'H1: "Bulletproof your IC memo / CIM before the partners tear it apart." Hero: massive textbox + PDF dropzone. Sub-CTA: "Paste your draft. Get the 3 fatal flaws in 60 seconds."',
    whatToHide: [
      'Founder Hub access link',
      'Content Studio',
      'Decision Knowledge Graph teasers',
      'AI boardroom simulator',
      'Multi-persona reveal copy',
      'Hero credibility strip beyond "60-second audit · 30+ biases · DPR appendix"',
    ],
  },
  {
    id: 'upload',
    step: 2,
    name: 'Upload · the ingestion',
    what: 'Immediate processing. No decision-frame form, no success-criteria input, no team invites. Drop file, audit fires.',
    action:
      '60-second streaming progress bar with pipeline-node animation. No friction between drop and reveal.',
    whatToHide: [
      'Decision-frame capture form (if added per R²F lever 3, gate behind a "deeper audit" tier)',
      'Success criteria input',
      'Team-member invite step',
      'Document-type selection dropdown (auto-detect from filename + content)',
    ],
  },
  {
    id: 'reveal_paywall',
    step: 3,
    name: 'Audit reveal + the wall',
    what: '60-second progress completes. Screen reveals: DQI Score (e.g., "DQI: 42 · High Risk"), top-3 cognitive biases by name (e.g., "Anchoring · Sunk Cost · Overconfidence"), the Dr Red Team\'s SINGLE most-damaging objection.',
    action:
      'Above-the-fold reveal triggers urgency. Below-the-fold: the EXACT excerpts, mitigation playbooks, and counterfactual outputs are BLURRED with a paywall overlay.',
    whatToHide: [
      'Hard counterfactual dollar amounts (REMOVED — never show again until validated)',
      'Full passage excerpts (blurred)',
      'Mitigation playbooks (blurred)',
      'Cross-document conflict scan (blurred — premium feature in the locked tier)',
      '12-node pipeline visualisation (out of scope for this view; available in /how-it-works)',
    ],
  },
  {
    id: 'checkout',
    step: 4,
    name: 'Checkout · the conversion',
    what: 'Single Stripe modal · two pricing options matched to the 3 fast-converter archetypes.',
    action:
      '"Unlock this audit: $499" (boutique M&A advisor · per-deal). "Upgrade to Professional: £149/mo · cancel anytime" (mid-market PE/VC associate + solo fractional CSO).',
    whatToHide: [
      'Strategy tier (£2,499/mo · enterprise-ish · do not show on the 30-day funnel)',
      'Enterprise quote builder (out of scope for solo-tier conversion)',
      'Team / multi-seat upsell (defer to month 2 when single-user retention is proven)',
    ],
  },
];

export type FeatureVerdict = {
  id: string;
  feature: string;
  verdict: 'keep' | 'hide_flag' | 'enterprise_tier' | 'kill';
  why: string;
};

export const FEATURE_VERDICTS: FeatureVerdict[] = [
  // KEEP — front + center
  {
    id: 'dr_red_team',
    feature: 'Dr Red Team adversarial node',
    verdict: 'keep',
    why: 'Single feature that proves "the AI is smarter than the analyst." Pre-paywall on the audit reveal. The reason the associate / advisor pays.',
  },
  {
    id: 'browser_extension',
    feature: 'Browser extension',
    verdict: 'keep',
    why: 'Massive ingestion-friction killer. 5-second quick-score on a DocSend CIM without download. Direct accelerator for the boutique M&A advisor archetype.',
  },
  {
    id: 'dpr_pdf_export',
    feature: 'DPR PDF export',
    verdict: 'keep',
    why: 'Literal deliverable the fractional CSO attaches to their strategy deck. The differentiation lever. If the PDF export is buried, the value prop vanishes.',
  },
  {
    id: 'dqi_score',
    feature: 'DQI score (without dollar counterfactuals)',
    verdict: 'keep',
    why: 'Bias detection + R²F arbitration is academically grounded. KEEP the score; REMOVE the unvalidated dollar counterfactuals.',
  },

  // HIDE BEHIND FEATURE FLAG — useful at month 6+, distracting at month 1
  {
    id: 'decision_knowledge_graph',
    feature: 'Decision Knowledge Graph + Causal DAG',
    verdict: 'hide_flag',
    why: 'Empty graph at month 1 = zero value. Surface at month 6 when 30+ decisions logged. Hide entry point on solo-tier surfaces.',
  },
  {
    id: 'ai_boardroom_simulator',
    feature: 'Full 5-persona AI boardroom simulator',
    verdict: 'hide_flag',
    why: 'Too heavy for solo workflow. KEEP the Dr Red Team adversarial node (predicting the single hardest MD/buyer objection IS the value). Hide the multi-persona debate UI.',
  },
  {
    id: 'meeting_recording',
    feature: 'Zoom / meeting-recording analysis',
    verdict: 'hide_flag',
    why: '30-day wedge is auditing written memos and CIMs. Analyzing meetings is a different product with massive friction. Hide entry point until written-memo workflow is proven.',
  },
  {
    id: 'rss_feeds',
    feature: '14 RSS feeds + Content Studio',
    verdict: 'hide_flag',
    why: 'Procurement-stage signal is "this looks polished" — not "this team built 50 features." Hide RSS / Content Studio from solo-tier surfaces.',
  },

  // MOVE TO ENTERPRISE TIER — only F500 / Sankore-class care
  {
    id: 'team_cognitive_profiles',
    feature: 'Team Cognitive Profiles + Org Benchmarking',
    verdict: 'enterprise_tier',
    why: 'Solo associates + advisors have no team to benchmark. Move to Strategy / Enterprise tier where team data is real.',
  },
  {
    id: 'compliance_17_frameworks',
    feature: '17-framework compliance mapping (SOX, EU AI Act, etc.)',
    verdict: 'enterprise_tier',
    why: "A 24-year-old associate doesn't care about EU AI Act. F500 GCs care — but they're a 12-month play. Move to Strategy / Enterprise tier; surface only on enterprise quote pages.",
  },
  {
    id: 'enterprise_slack',
    feature: 'Enterprise Slack integration',
    verdict: 'enterprise_tier',
    why: "Solo users aren't deploying Slack bots. Move to Strategy / Enterprise tier.",
  },
  {
    id: 'outcome_gate_enforcement',
    feature: 'Outcome Gate enforcement (blocking)',
    verdict: 'enterprise_tier',
    why: 'First-time solo buyer has no past decisions to log. Asking gates conversion. Defer outcome-gating to month 2 of any account; enforce contractually only on Sankore-class design partners.',
  },

  // KILL — vanity surfaces that dilute the focus
  {
    id: 'extra_dashboards',
    feature: 'Extra "explore" dashboards (10+ tabs of SWOT / Noise / Logic / Intelligence views)',
    verdict: 'kill',
    why: 'They surface data, not the answer. The buyer wants "will my MD reject this?" — not "explore the data." Cathedral-of-code symptom.',
  },
];

// =========================================================================
// META · count helpers
// =========================================================================

