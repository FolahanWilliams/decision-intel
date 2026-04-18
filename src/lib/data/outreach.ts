// Outreach Command Center — structured content from the six execution-ready
// outreach docs (Customer Discovery Map, Framework Audit, POC Outreach
// Templates, POC Playbook, Traction Plan, POC Target List).
//
// All runtime state (pipeline stages, discovery call notes, pattern tags,
// POC progress) lives in localStorage — no DB migration. Update here when
// the seed data changes (new targets, template edits, etc.).

// ─── Traction Plan: 4-week priority timeline ──────────────────────────────

export interface WeekPlan {
  weekNumber: number;
  label: string;
  theme: string;
  primaryGoal: string;
  keyActions: string[];
  deliverable: string;
  startDate: string; // ISO date when this week starts
}

// Start date anchor: 2026-04-18 (today in the founder's calendar)
export const TRACTION_PLAN: WeekPlan[] = [
  {
    weekNumber: 1,
    label: 'Week 1 · Discovery',
    theme: 'Discovery — 10 conversations, no pitch',
    primaryGoal: 'Find 3+ repeating pain patterns named without prompting',
    keyActions: [
      'Send 40 LinkedIn connection requests using the discovery opener',
      'Book first 3–5 discovery calls',
      'Run Goldner\'s 4-question script on every call',
      'Tell Josh Rainer the wedge is sharp — request Tier 1 intros',
      'Draft one-page Validation Summary with anonymized quotes',
    ],
    deliverable: 'Validation Summary: 3+ pain patterns with direct quotes',
    startDate: '2026-04-18',
  },
  {
    weekNumber: 2,
    label: 'Week 2 · POC Recruitment',
    theme: 'Convert best conversations into 3–5 confirmed POCs',
    primaryGoal: '3–5 confirmed POC participants with kick-off calls booked',
    keyActions: [
      'Activate Josh Rainer warm intros (pitch is now sharp)',
      'Send POC recruitment follow-up to best discovery contacts',
      'Schedule kick-off calls (NDA turnaround window)',
      'Prepare private workspaces in Decision Intel per POC',
    ],
    deliverable: '3+ signed NDAs, 3+ kick-off calls scheduled',
    startDate: '2026-04-25',
  },
  {
    weekNumber: 3,
    label: 'Week 3 · POCs Active',
    theme: 'Run POCs. Document everything in real time.',
    primaryGoal: '3+ POCs actively running with first memos analyzed',
    keyActions: [
      'Run first deal memo through 12-node pipeline (2–3 hrs compute per memo)',
      'Deliver first report with 10-slide summary within 5 days',
      'Hold Week 3 check-in call per POC (20 min)',
      'Frame every session around the specific pain pattern from discovery',
      'Document quote + reaction after every session',
    ],
    deliverable: 'First audit reports delivered. Usage tracked.',
    startDate: '2026-05-02',
  },
  {
    weekNumber: 4,
    label: 'Week 4 · Close the Loop',
    theme: 'Evaluate POCs. Update materials. Re-engage Antler + Goldner.',
    primaryGoal: 'Proof assets ready. Next conversations earned.',
    keyActions: [
      'Week 5 formal evaluation calls (60 min per POC)',
      'Collect feedback via 8–10 structured questions',
      'Ask for case study + testimonial on every evaluation call',
      'Update decision-intel.com with anonymized POC results',
      'Build 5-slide Validation Deck from pattern data',
      'Follow up to Yumiko (Antler) + Andrew Goldner with proof',
    ],
    deliverable: 'Validation Deck + 2+ case studies + 1+ testimonial',
    startDate: '2026-05-09',
  },
];

// ─── Contact Target Accounts (from POC Target List) ───────────────────────

export type Tier = 'tier_1' | 'tier_2' | 'tier_3';
export type Industry = 'tech' | 'healthcare' | 'industrial' | 'financial' | 'defense';

export interface SeedTarget {
  id: string;
  company: string;
  tier: Tier;
  industry: Industry;
  reason: string;
  roleToTarget: string;
  dealFrequency: string;
  dealSizeRange: string;
  approach: string;
  personalisationHook: string;
}

export const TIER_LABEL: Record<Tier, string> = {
  tier_1: 'Tier 1 · Josh warm intro',
  tier_2: 'Tier 2 · LinkedIn cold',
  tier_3: 'Tier 3 · Strategic path',
};

export const TIER_COLOR: Record<Tier, string> = {
  tier_1: '#16A34A',
  tier_2: '#0EA5E9',
  tier_3: '#8B5CF6',
};

export const INDUSTRY_LABEL: Record<Industry, string> = {
  tech: 'Technology',
  healthcare: 'Healthcare',
  industrial: 'Industrial',
  financial: 'Financial Services',
  defense: 'Defense / Aerospace',
};

export const SEED_TARGETS: SeedTarget[] = [
  {
    id: 'alphabet',
    company: 'Alphabet (Google Cloud)',
    tier: 'tier_1',
    industry: 'tech',
    reason: 'Alphabet acquires 10–15 companies per year. Wiz ($32B) was Josh\'s direct deal. Corp Dev team is one of the most sophisticated in tech.',
    roleToTarget: 'VP, Corporate Development, Strategy / Director, M&A, Google Cloud',
    dealFrequency: '10–15 per year',
    dealSizeRange: '$500M–$15B',
    approach: 'Josh Rainer warm intro (direct Wiz connection)',
    personalisationHook: 'Reference Wiz acquisition and post-close integration complexity of a $32B cloud security deal.',
  },
  {
    id: 'salesforce',
    company: 'Salesforce',
    tier: 'tier_1',
    industry: 'tech',
    reason: '$30B+ in acquisitions (Tableau, Slack, MuleSoft). Organizational pain around deal ROI and board scrutiny.',
    roleToTarget: 'VP / SVP, Corporate Development',
    dealFrequency: '8–12 per year',
    dealSizeRange: '$1B–$15B',
    approach: 'Josh intro (SaaS/cloud network)',
    personalisationHook: 'Slack acquisition challenges and the gap between pre-deal hype and post-integration reality.',
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    tier: 'tier_1',
    industry: 'tech',
    reason: 'Activision ($69B) was controversial — regulatory scrutiny, integration complexity, board-level scrutiny. Actively re-evaluating M&A strategy.',
    roleToTarget: 'Corporate Vice President, Corporate Development / VP, M&A Strategy',
    dealFrequency: '8–12 per year',
    dealSizeRange: '$500M–$75B',
    approach: 'Josh intro (enterprise software network)',
    personalisationHook: 'Activision Blizzard post-close cultural/regulatory integration. Pre-deal bias audit could have highlighted risks earlier.',
  },
  {
    id: 'cisco',
    company: 'Cisco',
    tier: 'tier_1',
    industry: 'tech',
    reason: 'Aggressive repositioning into security/software (Splunk). Known for disciplined M&A but recent integration challenges.',
    roleToTarget: 'VP, Corporate Development / Director, M&A',
    dealFrequency: '6–10 per year',
    dealSizeRange: '$500M–$28B',
    approach: 'Josh intro (enterprise/security network)',
    personalisationHook: 'Shift into security-driven M&A and complexity of integrating software into a hardware-centric company.',
  },
  {
    id: 'servicenow',
    company: 'ServiceNow',
    tier: 'tier_1',
    industry: 'tech',
    reason: '15+ acquisitions in last 5 years. Building a platform via consolidation. Recent CEO transition brought new M&A discipline.',
    roleToTarget: 'SVP, Corporate Development / VP, M&A, Strategy',
    dealFrequency: '8–15 per year',
    dealSizeRange: '$100M–$5B',
    approach: 'Josh intro (cloud/SaaS network)',
    personalisationHook: 'Platform consolidation strategy. Pattern of smaller acquisitions rolled into a larger platform.',
  },
  {
    id: 'jnj',
    company: 'Johnson & Johnson',
    tier: 'tier_2',
    industry: 'healthcare',
    reason: '6–10 per year across pharma, devices, consumer health. Post-acquisition integration challenges. Healthcare M&A is high-stakes.',
    roleToTarget: 'VP, Corporate Development / Head of M&A, Pharmaceuticals',
    dealFrequency: '6–10 per year',
    dealSizeRange: '$500M–$30B',
    approach: 'Cold LinkedIn outreach + warm follow-up',
    personalisationHook: 'Predicting post-acquisition R&D productivity and regulatory outcomes. Pre-deal bias audit on clinical/regulatory assumptions.',
  },
  {
    id: 'unitedhealth',
    company: 'UnitedHealth Group / Optum',
    tier: 'tier_2',
    industry: 'healthcare',
    reason: '10–15 per year. Consolidating healthcare value chain. Board-level scrutiny extremely high.',
    roleToTarget: 'SVP, Corporate Development, Optum / VP, M&A Strategy',
    dealFrequency: '10–15 per year',
    dealSizeRange: '$500M–$15B',
    approach: 'Cold LinkedIn, reference consolidation thesis',
    personalisationHook: 'Integrating services across payer/provider/technology businesses. Groupthink in complex deals.',
  },
  {
    id: 'honeywell',
    company: 'Honeywell International',
    tier: 'tier_2',
    industry: 'industrial',
    reason: '8–12 per year across aerospace, building tech, materials, software. CEO driving portfolio optimization.',
    roleToTarget: 'VP, Corporate Development / Head of M&A',
    dealFrequency: '8–12 per year',
    dealSizeRange: '$500M–$10B',
    approach: 'Cold LinkedIn, reference portfolio strategy',
    personalisationHook: 'Portfolio restructuring and synergy identification across diverse business units. 60% of synergies don\'t materialize.',
  },
  {
    id: 'pfizer',
    company: 'Pfizer',
    tier: 'tier_2',
    industry: 'healthcare',
    reason: '4–8 per year. Post-COVID intense shareholder scrutiny on R&D ROI. Board-level accountability for deal success.',
    roleToTarget: 'VP, Corporate Development / SVP, Strategy & M&A',
    dealFrequency: '4–8 per year',
    dealSizeRange: '$1B–$43B',
    approach: 'Cold LinkedIn, reference recent acquisitions',
    personalisationHook: 'Integrating companies into a diversified pharma portfolio. Cognitive bias in biotech M&A (hype vs. reality).',
  },
  {
    id: 'adobe',
    company: 'Adobe',
    tier: 'tier_2',
    industry: 'tech',
    reason: '5–8 per year. Consolidating creative and marketing workflows. Public-facing M&A strategy.',
    roleToTarget: 'VP, Corporate Development / SVP, Strategy & Corp Dev',
    dealFrequency: '5–8 per year',
    dealSizeRange: '$500M–$20B',
    approach: 'Cold LinkedIn, reference strategy',
    personalisationHook: 'Consolidation strategy. Pre-close bias audit to inform deal selection and integration.',
  },
  {
    id: 'emerson',
    company: 'Emerson Electric',
    tier: 'tier_2',
    industry: 'industrial',
    reason: '8–15 per year. Building automation/software empire via M&A. Shift toward digital transformation.',
    roleToTarget: 'VP, Corporate Development / Director, M&A Strategy',
    dealFrequency: '8–15 per year',
    dealSizeRange: '$100M–$5B',
    approach: 'Cold LinkedIn, reference digital transformation thesis',
    personalisationHook: 'Shift toward software/digital via M&A. Synergy realization in tech-into-industrial deals.',
  },
  {
    id: 'deloitte',
    company: 'Deloitte M&A Advisory',
    tier: 'tier_3',
    industry: 'financial',
    reason: 'Advises 100+ Fortune 500 clients per year. Channel partner — Decision Intel embedded in their deal playbook = massive distribution.',
    roleToTarget: 'M&A Advisory Partner / Head of deal methodology practice',
    dealFrequency: '100s per year (client-side)',
    dealSizeRange: 'Varies',
    approach: 'Cold email to M&A Advisory partner',
    personalisationHook: 'Complementary to their integration playbook. Add AI-powered bias auditing to their rigor.',
  },
  {
    id: 'goldman',
    company: 'Goldman Sachs M&A Advisory',
    tier: 'tier_3',
    industry: 'financial',
    reason: 'Advises on $500B+ in deals annually. Embedded in advisor workflow = mega-deal center.',
    roleToTarget: 'Goldman M&A partner or VP specializing in your ICP',
    dealFrequency: '100s per year (client-side)',
    dealSizeRange: 'Mega-deals',
    approach: 'Warm intro via Goldman contact',
    personalisationHook: 'De-risk their advisory relationships. Catch bias before the deal fails post-close.',
  },
  {
    id: 'berkshire',
    company: 'Berkshire Hathaway',
    tier: 'tier_3',
    industry: 'financial',
    reason: '5–10 per year. A validation POC with Berkshire would be the most credible case study in the world.',
    roleToTarget: 'IR team / Treasury / Corporate Development office',
    dealFrequency: '5–10 per year',
    dealSizeRange: '$1B–$40B',
    approach: 'IR team first, then corporate development',
    personalisationHook: 'Pride-based, not shame-based. Position as validation tool for disciplined decision-making.',
  },
  {
    id: 'defense',
    company: 'General Dynamics / Lockheed Martin',
    tier: 'tier_3',
    industry: 'defense',
    reason: 'Compliance requirements (CFIUS, export controls, clearances) add complexity. Prove compliance + bias audits = own a niche.',
    roleToTarget: 'VP, Corporate Development (Defense / Aerospace)',
    dealFrequency: '4–8 per year per company',
    dealSizeRange: '$500M–$10B',
    approach: 'Cold outreach emphasizing compliance + bias',
    personalisationHook: 'Board asks two questions: Is this strategic? Are we compliant? We answer both.',
  },
];

export type PipelineStage =
  | 'not_contacted'
  | 'connection_sent'
  | 'responded'
  | 'call_booked'
  | 'call_done'
  | 'pattern_validated'
  | 'poc_asked'
  | 'poc_running'
  | 'poc_converted'
  | 'dormant';

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'not_contacted',
  'connection_sent',
  'responded',
  'call_booked',
  'call_done',
  'pattern_validated',
  'poc_asked',
  'poc_running',
  'poc_converted',
  'dormant',
];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  not_contacted: 'Not Contacted',
  connection_sent: 'Connection Sent',
  responded: 'Responded',
  call_booked: 'Call Booked',
  call_done: 'Call Done',
  pattern_validated: 'Pattern Validated',
  poc_asked: 'POC Asked',
  poc_running: 'POC Running',
  poc_converted: 'Converted',
  dormant: 'Dormant / Nurture',
};

export const STAGE_COLOR: Record<PipelineStage, string> = {
  not_contacted: '#64748B',
  connection_sent: '#94A3B8',
  responded: '#0EA5E9',
  call_booked: '#6366F1',
  call_done: '#8B5CF6',
  pattern_validated: '#EC4899',
  poc_asked: '#F59E0B',
  poc_running: '#F97316',
  poc_converted: '#16A34A',
  dormant: '#475569',
};

// ─── Goldner's Discovery Script (from Traction Plan + Customer Discovery Map)

export interface DiscoveryQuestion {
  number: number;
  question: string;
  probes: string[];
  listenFor: string;
}

export const GOLDNER_QUESTIONS: DiscoveryQuestion[] = [
  {
    number: 1,
    question: 'Tell me about a deal you got wrong — or one you overpaid on. What happened?',
    probes: [
      'Can you give me a specific example?',
      'How often does that happen — is it a one-off or a pattern?',
      'What did it cost you? Time, money, credibility?',
    ],
    listenFor:
      'Deflection to "market changed" is a red flag — probe for internal process failures. Listen for which part failed (diligence, IC approval, integration).',
  },
  {
    number: 2,
    question: 'What did you miss? When did you realise it?',
    probes: [
      'What would you have needed to know earlier?',
      'Was there a moment where someone raised it and it didn\'t stick?',
      'Who was responsible for stress-testing that assumption?',
    ],
    listenFor:
      'Anchoring on the first comparable, confirmation bias, "everyone fell in love with the deal," synergy overestimation. These are your wedge signals.',
  },
  {
    number: 3,
    question: 'When do IC discussions break down — what does that look like in the room?',
    probes: [
      'Is the disagreement documented anywhere? Does it affect the final recommendation?',
      'How is dissent captured?',
      '"The senior person wins" — is that a pattern?',
    ],
    listenFor:
      'Decision noise disguised as leadership. "Resolved informally" = the gap. Groupthink in committee decisions. This maps to Pattern A.',
  },
  {
    number: 4,
    question: 'What do you wish you\'d known earlier in diligence?',
    probes: [
      'What would it have to offer for you to consider an external bias audit?',
      'Have you ever used McKinsey / outside counsel for a second opinion?',
      'What would a good pre-IC review actually look like?',
    ],
    listenFor:
      'Pre-IC diligence gaps. Their vocabulary for reasoning failures — "too bullish," "management captured," "no one challenged the synergy assumptions." Use their language.',
  },
];

// ─── The 4 Pain Patterns (from Customer Discovery Map) ────────────────────

export type PatternId = 'A' | 'B' | 'C' | 'D';

export interface Pattern {
  id: PatternId;
  name: string;
  description: string;
  wedge: string;
  threshold: number; // # of independent confirmations to validate
  color: string;
}

export const PATTERNS: Pattern[] = [
  {
    id: 'A',
    name: 'The Room Dynamic Problem',
    description:
      '3+ people describe a deal where "the senior person pushed it through" or where dissent was suppressed. Decision noise disguised as leadership.',
    wedge:
      'Decision noise measurement + 3-judge jury disagreement index. The strongest wedge — confirms noise (not data) is the real issue.',
    threshold: 3,
    color: '#EC4899',
  },
  {
    id: 'B',
    name: 'The Memo Quality Problem',
    description:
      '3+ people say variants of "the memo looked rigorous but missed [X]." Bias baked into the document; nobody catches it pre-IC.',
    wedge:
      'Pre-IC memo bias audit with paragraph-level citations. "The memo hides it in plain sight" framing validated.',
    threshold: 3,
    color: '#F59E0B',
  },
  {
    id: 'C',
    name: 'The Compliance / Documentation Pressure',
    description:
      '3+ people mention lawyers, boards, or regulators asking for "better documentation of decision rationale." SOX / SEC / Delaware fiduciary duty.',
    wedge:
      'Compliance gap mapping + audit defense packet. Opens procurement doors via regulatory mandate.',
    threshold: 3,
    color: '#8B5CF6',
  },
  {
    id: 'D',
    name: 'The Institutional Memory Loss',
    description:
      '3+ people mention "knowledge leaving with people" or "made the same mistake twice." VPs rotate every 2 years; reasoning leaves with them.',
    wedge:
      'Decision Knowledge Graph as primary feature (not add-on). Compounding institutional memory across every deal.',
    threshold: 3,
    color: '#0EA5E9',
  },
];

// ─── 7 Outreach Templates (from POC Outreach Templates) ───────────────────

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: 'email' | 'linkedin_connection' | 'linkedin_message' | 'verbal';
  subject?: string;
  body: string;
  when: string;
  tone: string;
  variables: string[]; // placeholder names used in body
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'discovery_connection',
    name: '1. Discovery LinkedIn Connection (Week 1 — no pitch)',
    channel: 'linkedin_connection',
    body: `Hi {{FIRST_NAME}} — I'm Folahan, a 16-year-old building an AI tool for M&A deal review. Would love 15 min to ask you about your diligence process — genuine learning, no pitch.`,
    when: 'Week 1, after identifying a Tier 1-2 target',
    tone: 'Disarming, learning-stance, no pitch',
    variables: ['FIRST_NAME'],
  },
  {
    id: 'discovery_followup',
    name: '2. Discovery Message After Connection Accepted',
    channel: 'linkedin_message',
    body: `Thanks for connecting. I'm building Decision Intel — an AI layer that sits on top of deal memos to flag reasoning gaps before IC. Before I build anything else, I'm doing 10 conversations with corp dev leaders to understand where memos actually break down.

Two questions I'm curious about: What's one diligence area that tends to get underweighted in the memo stage? And have you ever had a deal close where you wished you'd caught something earlier?

Would you be open to a 15-min call this week? No pitch — I'm at the learning stage.`,
    when: 'Within 24h of them accepting the connection request',
    tone: 'Honest, specific, low-friction',
    variables: [],
  },
  {
    id: 'josh_warm_intro',
    name: '3. Josh Rainer Warm Intro (Josh sends)',
    channel: 'email',
    subject: 'Quick intro — Folahan Williams, Decision Intel',
    body: `Hi {{FIRST_NAME}},

I want to introduce you to Folahan Williams. He's built an AI platform that audits deal memos for cognitive biases, decision noise, and compliance gaps — outputs a full report in under a minute.

You're one of the people I think should see this. Folahan's done something few people do at any age: shipped a production system that actually works. He's looking for 3–5 companies to run live deal memos through the platform for free, no strings attached, under NDA.

Think this is worth 20 minutes? I'll let him take it from here.

Josh`,
    when: 'Week 2 — after Week 1 pitch sharpening. Paste + hand to Josh.',
    tone: 'Understated — Josh\'s credibility does the heavy lifting',
    variables: ['FIRST_NAME'],
  },
  {
    id: 'folahan_followup_after_josh',
    name: '4. Folahan Follow-Up After Josh\'s Intro',
    channel: 'email',
    subject: "Let's run one deal memo",
    body: `Hi {{FIRST_NAME}},

Thanks for taking Josh's intro. Wanted to follow up directly.

Decision Intel takes your deal memo (investment memo, board deck, M&A analysis — any strategic doc) and surfaces the cognitive biases, decision noise, and compliance gaps your team might have missed. Runs in under 60 seconds.

Here's what I'd propose: next time you're working on a live deal, run it through the platform for free. You get the full report — bias breakdown, noise score, compliance map. Takes one memo and about 20 minutes of your team's time over 6 weeks. If it's valuable, we can talk about next steps. If not, you've only lost an email.

Are you working on anything right now that would work for this?

Folahan`,
    when: '24h after Josh sends the warm intro',
    tone: 'Confident, specific, easy yes',
    variables: ['FIRST_NAME'],
  },
  {
    id: 'cold_email',
    name: '5. Cold Email (Tier 2 — no warm intro)',
    channel: 'email',
    subject: 'One thing almost every deal memo gets wrong',
    body: `Hi {{FIRST_NAME}},

I'm Folahan, 16, and I built Decision Intel — an AI platform that audits deal memos for cognitive biases, decision noise, and compliance gaps.

I'm reaching out because {{PERSONALISATION_HOOK}}. Companies like {{COMPANY}} do {{DEAL_FREQUENCY}} acquisitions per year. Each one relies on a memo that nobody's systematically audited for bias.

Deal teams go deep on financials and synergies, but cognitive biases (anchoring, confirmation bias, overconfidence, groupthink) aren't caught until the acquisition underperforms. By then, the damage is done.

Three things worth knowing:
— Built 190K lines of production code solo
— Just finished academic research on cognitive bias drivers in the 2008 financial crisis
— Validated by Josh Rainer (ex-Wiz $32B, helped take them public)

The ask: I'm recruiting 3–5 companies to test Decision Intel for free. Next time your team has a live deal memo, we run it through the platform under NDA. You get the full bias report, noise score, compliance map. Takes one memo and 20 minutes of your team's time over 6 weeks. No cost, no commitment.

If it's valuable, we can talk. If not, you've only spent a memo and lost nothing.

Open to this?

Folahan`,
    when: 'Week 2 — after Week 1 pain pattern validation',
    tone: 'Credibility-first, specific hook, easy yes',
    variables: ['FIRST_NAME', 'COMPANY', 'PERSONALISATION_HOOK', 'DEAL_FREQUENCY'],
  },
  {
    id: 'followup_no_reply',
    name: '6. Follow-Up (No Reply After 5–7 Days)',
    channel: 'email',
    subject: 'Re: {{PREVIOUS_SUBJECT}}',
    body: `One more thing: I recently looked at the M&A deals {{COMPANY}} has done in the last 18 months. The patterns I'm seeing in post-acquisition performance data suggest underperformance correlates with anchoring on synergy estimates that the deal memo didn't pressure-test. That's what we're trying to catch before the deal closes. Worth a conversation?`,
    when: '5–7 days after the original message with no reply',
    tone: 'Adds new information or angle, not a re-ask',
    variables: ['COMPANY', 'PREVIOUS_SUBJECT'],
  },
  {
    id: 'poc_verbal_ask',
    name: '7. The POC Ask (Verbal — Week 1 Discovery Close)',
    channel: 'verbal',
    body: `Look, here's what I'd love to do. We take your next deal memo — whatever you're working on — run it through Decision Intel completely free, under NDA. You get the full bias report: anchoring, confirmation bias, groupthink, overconfidence, any systematic reasoning gaps. We also surface decision noise — how much disagreement your team has on key assumptions — and compliance blind spots.

Takes about one memo and 20 minutes of your team's time spread over 6 weeks. We handle all the analysis; you just give us the memo and 20 minutes to review the report with your team.

If it's useful, we can talk about next steps. If not, you've only spent a memo and lost nothing. Fair deal?`,
    when: 'End of discovery call, after they\'ve named the pain',
    tone: 'Confident. Offering, not asking.',
    variables: [],
  },
];

export const TEMPLATE_CHANNEL_LABEL: Record<OutreachTemplate['channel'], string> = {
  email: 'Email',
  linkedin_connection: 'LinkedIn Connection',
  linkedin_message: 'LinkedIn Message',
  verbal: 'Verbal Script',
};

export const TEMPLATE_CHANNEL_COLOR: Record<OutreachTemplate['channel'], string> = {
  email: '#0EA5E9',
  linkedin_connection: '#8B5CF6',
  linkedin_message: '#EC4899',
  verbal: '#F59E0B',
};

// ─── POC Kit (from POC Playbook) ──────────────────────────────────────────

export interface POCMilestone {
  week: number;
  label: string;
  deliverables: string[];
}

export const POC_MILESTONES: POCMilestone[] = [
  {
    week: 1,
    label: 'Kick-Off & Intake',
    deliverables: [
      'NDA sent + signed (both parties)',
      'Kick-off call held (30 min)',
      'Deal memos received (1–2 real memos)',
      'Success criteria defined in writing',
      'Private workspace created with team name',
    ],
  },
  {
    week: 2,
    label: 'First Analysis',
    deliverables: [
      'First deal memo run through 12-node pipeline',
      'First report delivered with 10-slide summary',
      'Week 3 check-in call scheduled',
    ],
  },
  {
    week: 3,
    label: 'First Check-In',
    deliverables: [
      '20-min check-in call completed',
      'Walked through biases + noise score + compliance gaps',
      'Early feedback captured: "what\'s useful? what\'s confusing?"',
      'Second memo confirmed (if doing 2)',
    ],
  },
  {
    week: 4,
    label: 'Second Analysis + Knowledge Graph',
    deliverables: [
      'Second memo analyzed (if applicable)',
      'Knowledge Graph showing cross-memo patterns',
      'Usage tracking: logins, sections viewed, comments',
    ],
  },
  {
    week: 5,
    label: 'Formal Evaluation',
    deliverables: [
      '60-min evaluation call held',
      '8–10 structured feedback questions answered',
      'Success criteria reviewed — did we hit them?',
      'Conversion signal: "Would you pay $2,499/month?"',
      'Case study + testimonial asked for',
    ],
  },
  {
    week: 6,
    label: 'Close & Loop',
    deliverables: [
      'POC summary email sent',
      '60-day follow-up scheduled',
      'Product roadmap updated with feedback',
    ],
  },
];

export interface POCSuccessCriterion {
  id: string;
  name: string;
  description: string;
  measurement: string;
}

export const POC_SUCCESS_CRITERIA: POCSuccessCriterion[] = [
  {
    id: 'novel_bias',
    name: 'Novel Bias Detection',
    description: 'At least 2 cognitive biases surfaced that the team hadn\'t explicitly identified before.',
    measurement: 'Week 5: "Did any of the biases we flagged surprise you or change how you think about this deal?"',
  },
  {
    id: 'actionable_insight',
    name: 'Specific Actionable Insight',
    description: 'Participant articulates 1 specific insight they\'ll use going forward.',
    measurement: '"Because of Decision Intel, we\'re now going to..." — must be concrete, not generic.',
  },
  {
    id: 'nps',
    name: 'NPS ≥ 8',
    description: 'How likely to recommend Decision Intel to a peer in your industry? (0–10)',
    measurement: '8 or higher = promoter.',
  },
  {
    id: 'conversion',
    name: 'Conversion Signal',
    description: 'Would your team pay $2,499/month for a subscription?',
    measurement: '"Yes" or "Yes, but..." = win. "No" or "Maybe" = fail.',
  },
];

// ─── 7-Framework Audit Summary (from Framework Audit doc) ─────────────────

export interface FrameworkScore {
  id: string;
  name: string;
  score: number; // 0–10
  note: string;
  priorityFix?: string;
}

export const FRAMEWORK_AUDIT_TOP_FIXES: string[] = [
  'Get 3–5 design partners running real deal memos through the product.',
  'Add a before/after transformation statement to every document.',
  'Add a "zoom out" beat to every pitch — second-order effects.',
  'Name the specific buyer (VP of Corporate Development at a Fortune 500) in all materials.',
  'Start the 7-day founder content cycle this week.',
  'Add product screenshots to the deck.',
  'End every document with a specific, frictionless CTA.',
  'Articulate the brand belief: "The biggest risk in any deal isn\'t the market — it\'s the reasoning."',
  'Use buyer language: deal memo, acquisition rationale, deal thesis, red flag, kill the deal.',
  'Quantify the cost of inaction: "$340M average value destroyed per failed deal."',
];
