/**
 * Cornerstone VC warm-intro brief — private founder-hub data
 * (locked 2026-05-09 evening, Phase 2 of the DecisionContainer
 * refactor).
 *
 * NEVER LEAK. This file ships in the founder-hub bundle behind the
 * Supabase platform-auth gate. Per CLAUDE.md no-named-prospects rule:
 * the visible tab label is role-neutral ("Pre-seed VC · Warm Intro");
 * file paths + internal data carry the proper noun for the founder's
 * own recall; the rendered React components stay role-neutral.
 *
 * Strategic frame (locked 2026-05-09 against the Grok-pushback): the
 * Cornerstone internship is positioned for the SENIOR-DIRECT corp dev
 * track (technical-strategist via acqui-hire-structured terms at
 * Lazard / KKR Capstone / Vista Operating Group / Databricks /
 * Snowflake), NOT the analyst ladder that AI is displacing. The
 * artefact carried out is "I built and validated the audit layer for
 * committee-stage decisions while embedded in a fund" — not "I made
 * analyst tasks faster." Per the External Attack Vector #3
 * defensive-acceleration lock, the framing also hardens against the
 * agentic shift by emphasising authorship-agnostic R²F.
 */

export interface CornerstoneIntegrationPath {
  id: string;
  title: string;
  pitch: string;
  fitStrength: 'critical' | 'high' | 'medium';
  detail: string;
}

export interface CornerstoneAsk {
  tier: 1 | 2 | 3;
  label: string;
  literalAsk: string;
  whyYes: string;
  whyNo: string;
  fallback: string;
}

export interface CornerstoneMeetingPrepItem {
  category: 'research' | 'artefact' | 'rehearse' | 'avoid';
  label: string;
  detail: string;
}

export interface CornerstoneInternshipGoal {
  goal: string;
  why: string;
  measure: string;
}

export const CORNERSTONE_PROFILE = {
  firmName: 'Cornerstone VC',
  firmAum: '£20M Fund I (planned ~40 portfolio companies, £250K-£1M cheques)',
  thesis:
    'People-first pre-seed / seed UK tech investing. Black-led GP team. Sectors: Live (HealthTech, CarbonTech, Supply Chain, PropTech), Work (Enterprise SaaS, AI/ML, FinTech, EdTech), Play (Networks & Marketplaces, Communities, Web3, Adtech).',
  team: [
    {
      name: 'Rodney Appiah',
      role: 'Founder & Managing Partner',
      background:
        'BGF, Foresight Group, investment banking. Experienced angel investor. Led the Cornerstone fund launch.',
    },
    {
      name: 'Edwin Appiah',
      role: 'GP',
      background: 'Investor with operator background.',
    },
    {
      name: 'Ella Wales Bonner',
      role: 'GP',
      background: 'UK tech investor.',
    },
  ],
  warmIntroSource:
    'Inbound — applying to NextGen Fellowship / Intern Analyst role. Asymmetric edge: 16-y-o solo founder of DI, building exactly the audit layer their pre-IC workflow needs.',
  positionForFounder:
    'The internship is positioned for the SENIOR-DIRECT corp dev track, not the contracting analyst ladder. The artefact carried out is "I built and validated the audit layer for committee-stage decisions while embedded in a fund." That story is the technical-strategist track at Lazard / KKR Capstone / Vista Operating Group / Databricks / Snowflake via acqui-hire-structured terms, not analyst-track hiring (per the agentic-shift defensive-acceleration lock).',
} as const;

export const CORNERSTONE_INTEGRATION_PATHS: ReadonlyArray<CornerstoneIntegrationPath> = [
  {
    id: 'pre_ic_audit',
    title: 'Pre-IC memo audit before Monday partner meeting',
    pitch:
      'R²F audit pipeline fires hardest at the IC moment. Validity classifier auto-flags VC pre-seed/seed as canonical low-validity domain (Kahneman & Klein 2009 first condition). DI-B-021 illusion_of_validity catches narrative-coherence-without-base-rates — the canonical VC failure mode. "Coherent Confidence" toxic combo (Illusion of Validity + Overconfidence + Confirmation/Halo) fires on the most dangerous pattern in low-validity domains.',
    fitStrength: 'critical',
    detail:
      'Cornerstone partners review 30+ pitches/week and second-guess every IC memo in the shower. The 60-second pre-IC audit collapses that anxiety into a procurement-grade artefact carried into the partner meeting. Direct fit; zero workflow change.',
  },
  {
    id: 'thesis_stress_test',
    title: 'Founder thesis stress-test before sending term sheet',
    pitch:
      'Reference-class forecast against the 143-case library answers "is this thesis structurally novel, or repeating a known failure pattern?" with named analogs. WeWork S-1, Theranos, FTX, Quibi all live in the case library — the RCF surfaces them automatically when the new memo shares structural shape.',
    fitStrength: 'critical',
    detail:
      'Turns DI from "audit tool" into "second-thinker on the call before commit." Per CLAUDE.md the audit BEFORE commit is the wedge moment. Cornerstone investments at £250K-£1M deserve this treatment — every loss compounds in a £20M fund.',
  },
  {
    id: 'portfolio_quarterly',
    title: 'Portfolio quarterly review audit',
    pitch:
      'Escalation of commitment / disposition effect / sunk-cost — the canonical biases that kill follow-on decisions on underperformers. Quarterly audit on each portco update doc surfaces them by pattern, not gut.',
    fitStrength: 'high',
    detail:
      'Most VCs review portfolio updates without a structured bias check. DI catches "we have already invested 3× in this company" anchoring before another follow-on cheque goes in.',
  },
  {
    id: 'cross_partner_calibration',
    title: 'Cross-partner DQI calibration',
    pitch:
      'Per-partner Brier accumulation. Rodney + Edwin + Ella each get an individual calibration profile after 10-20 closed outcomes. Answers "which of us is actually right about people more often" — and answers the LP-governance question Cornerstone\'s LPs will start asking by Fund II.',
    fitStrength: 'high',
    detail:
      'No competitor offers per-partner calibration. By Fund II this becomes an LP-grade governance signal that helps the GP team raise the next fund.',
  },
  {
    id: 'agentic_shift_defense',
    title: 'Agentic-shift defensive moat (authorship-agnostic R²F)',
    pitch:
      'WEF projects 92M info-sector jobs displaced by AI by 2030. Palantir / Aera / Snowflake are pushing toward agent-authored strategic artefacts. DI was designed authorship-agnostic from day one — R²F detectors fire identically on human-authored AND agent-generated reasoning patterns. The wedge widens, not narrows.',
    fitStrength: 'medium',
    detail:
      "Future-proofs Cornerstone's portfolio when their investee companies ship agent-generated memos to their boards. DI audits the agent's reasoning trail, not just human-authored docs.",
  },
];

export const CORNERSTONE_ASK_HIERARCHY: ReadonlyArray<CornerstoneAsk> = [
  {
    tier: 1,
    label: "Beta-pilot DI on Cornerstone's own diligence",
    literalAsk:
      'Run 30-50 anonymised IC memos through DI privately during the internship. Track which biases fire, which miss, which recommendations land with the partner team, which they ignore. Iterate prompts in lockstep.',
    whyYes:
      "Zero downside for Cornerstone — anonymisation is the locked default; no IP leakage; tightens DI's small-fund-GP HXC persona; produces real reference-grade outputs.",
    whyNo:
      'Internship NDA might be aggressive; partner team might not have time to review the audit outputs in addition to their own work.',
    fallback:
      'Negotiate IP carve-out + non-compete scope BEFORE signing the internship contract. Per saved memory feedback-no-local-destructive — read carefully.',
  },
  {
    tier: 2,
    label: 'Intro to 3-5 peer GPs at similar £5-100M AUM funds',
    literalAsk:
      'After 3-4 months of demonstrated value, ask Rodney for warm intros to peer GPs at funds matching the small-fund-GP HXC persona (Aisha-class). Goal: convert one peer-GP relationship into a paid pilot conversation by month 4.',
    whyYes:
      "Rodney is exactly the kind of GP who could become a multi-tier connector — Cornerstone's peer network is the v3.5 wedge motion catalyst.",
    whyNo: "Too early; Rodney needs 3-4 months of seeing DI work before he'll vouch.",
    fallback:
      'Spend the time building the artefact; the warm intros come naturally if the value lands.',
  },
  {
    tier: 3,
    label: 'Angel check + small-fund-GP advisor relationship',
    literalAsk:
      'At month 6, ask Rodney explicitly: "Would you angel-check DI?" Customer-before-investor rule (Mr. Gabe lock) still applies — but Rodney sits on both sides: candidate paid customer AND candidate angel.',
    whyYes:
      'Rodney has angel-investing background pre-Cornerstone. £25-100K personal cheque on conviction is well within range. The cheque + advisory relationship + warm intros bundle is worth more than the internship credential.',
    whyNo:
      'Rodney might prefer to stay arms-length given GP fiduciary; might prefer to refer rather than write.',
    fallback:
      'Even a "no, but here are 5 GPs you should meet" is worth more than the cheque alone.',
  },
];

export const CORNERSTONE_MEETING_PREP: ReadonlyArray<CornerstoneMeetingPrepItem> = [
  {
    category: 'research',
    label: "Cornerstone's portfolio + recent funding rounds",
    detail:
      "Evaro (Series A · home care) · Storia · Aster · Definely · Passionfruit · Smart Bricks · Monq. Recent news: Capsa AI (PE due-diligence). Read each portfolio company's latest funding news; mention 1-2 by name in conversation to show genuine engagement.",
  },
  {
    category: 'research',
    label: "NextGen Fellowship structure + Rodney's public-voice quotes",
    detail:
      'Listen to recent podcasts featuring Rodney (Sifted, Newton Venture Program). Note the "people-first" thesis framing — it\'s the load-bearing language he uses in pitches. Mirror it back.',
  },
  {
    category: 'artefact',
    label: 'WeWork or Dangote DPR specimen — leave-behind',
    detail:
      "Send the WeWork S-1 specimen DPR (US/global signal) before the meeting. Cold readers haven't earned the platform vocabulary; the artefact does the persuasion. Per the saved memory feedback-empathic-mode-first.",
  },
  {
    category: 'artefact',
    label: 'Anonymised audit on a real Cornerstone-public memo',
    detail:
      "Pick a Cornerstone portfolio company's public pitch deck or thesis post; run it through DI; arrive with the audit as a conversation starter. NOT a sales pitch — research-driven engagement.",
  },
  {
    category: 'rehearse',
    label: 'The pivot from cold to warm-context vocabulary',
    detail:
      '"We run 60-second audits on strategic memos. The technical name is a reasoning layer — Recognition-Rigor Framework, scored as a Decision Quality Index." Practise the bridge in 10 seconds. Per CLAUDE.md vocabulary-discipline-by-reader-temperature lock.',
  },
  {
    category: 'rehearse',
    label: 'The senior-direct framing for forward applications',
    detail:
      '"I built and validated the audit layer for committee-stage decisions while embedded in a fund." This is the technical-strategist track artefact; rehearse it as the natural follow-up when Rodney asks "what\'s next after the internship."',
  },
  {
    category: 'avoid',
    label: "Don't pitch DI as analyst-coordination tooling",
    detail:
      'Per Grok-pushback (2026-05-09): the analyst-track entry point is what AI is displacing. "DI helps analysts deliver higher-quality work faster" is the wrong framing for the senior-direct track. Frame DI as decision-quality infrastructure for partner-level reviewing instead.',
  },
  {
    category: 'avoid',
    label: "Don't use banned vocabulary",
    detail:
      'Per CLAUDE.md BANNED_VOCABULARY: "decision intelligence platform" / "decision hygiene" / "boardroom strategic decision" / "company knowledge base" / "AI-powered decision platform" / "native reasoning layer" / "bad strategic decisions". Use locked phrases: "the reasoning audit platform" / "audit your reasoning, not your data" / "capital eroded by unaudited reasoning."',
  },
  {
    category: 'avoid',
    label: "Don't share confidential deal-flow on shipped surfaces",
    detail:
      "Per the no-named-prospects rule: anything DI builds from Cornerstone's deal flow stays anonymised. Never let it appear on /security, /case-studies, marketing surfaces, or in CLAUDE.md commit messages.",
  },
];

export const CORNERSTONE_INTERNSHIP_GOALS: ReadonlyArray<CornerstoneInternshipGoal> = [
  {
    goal: 'Run 30-50 anonymised IC memos through DI privately during the internship',
    why: 'Sharpens the small-fund-GP HXC persona; produces reference-grade case-study evidence; data moat compounds.',
    measure: '30-50 audits logged with bias-fire / miss tracking + prompt-iteration notes',
  },
  {
    goal: 'Convert one peer-GP relationship into a paid pilot conversation by month 4',
    why: 'Tests the wedge motion (small-fund-GP HXC persona) with a real prospect.',
    measure: '1+ pilot conversation locked (paid intent confirmed)',
  },
  {
    goal: 'Generate 5-10 anonymised reference-grade DPR specimens',
    why: 'Activates Phase 2 of the v3.5 GTM (Sankore + warm-intro motion); makes the wedge motion citable across both VC and Corp Dev.',
    measure: '5-10 DPRs anonymised + ready for cold-context distribution',
  },
  {
    goal: 'Negotiate IP carve-out + non-compete scope BEFORE signing the internship contract',
    why: 'Standard small-fund employment language can lock founders out of selling to peer funds. Material risk to v3.5 wedge.',
    measure: 'Contract signed with explicit carve-out for DI prior + future independent work',
  },
  {
    goal: 'At month 6, ask Rodney directly: "Would you angel-check DI?"',
    why: 'Customer-before-investor rule still applies (Mr. Gabe lock), but Rodney can be both. £25-100K personal cheque + advisory bundle is worth more than the internship credential alone.',
    measure: 'Direct ask made; outcome (yes / no-but-here-are-5-people / not-yet) documented',
  },
  {
    goal: 'Cap internship at 10 hrs/week to protect DI velocity',
    why: 'Above 10 hrs/week the v3.5 Phase 1 wedge motion (5-10 LinkedIn DMs/week + 2 events/month + Sankore scoping + pre-seed prep) collapses. Time math from the Cornerstone-pushback discussion.',
    measure: 'Hours logged ≤ 10/week; DI cadence stays at 18+ hrs/week',
  },
];

export const CORNERSTONE_FOLLOWUP_TEMPLATE = {
  postMeeting: {
    subject: 'Follow-up: [topic discussed] + DI specimen',
    body: `Rodney,

Thanks for the time today. The point on [specific topic] is the one that landed for me — [1-2 sentence reflection].

Attached: the WeWork S-1 specimen DPR I mentioned. The interesting bit is §4.10 (Synergy Defensibility) and §4.4 (Calibrated Rejection of Subjective Confidence) — the audit catches what the original memo couldn't.

Looking forward to running this on real materials during the internship. Open to grabbing 30 min the week of [date] to walk through one anonymised audit if useful.

— Folahan`,
    timing: 'Within 24h of every meeting',
  },
  midPointReview: {
    subject: 'DI internship · month 3 update',
    body: `Rodney,

Quick update on the work so far. Thirty IC memos audited; here\'s what I\'m seeing:

1. [pattern that fires repeatedly]
2. [bias the audit catches that the partner team initially dismissed]
3. [structural gap in the audit pipeline I\'m iterating on]

What I\'d find most useful from your end: [specific ask — meeting time / portfolio access / peer-GP intro].

— Folahan`,
    timing: 'Month 3 of the internship',
  },
} as const;
