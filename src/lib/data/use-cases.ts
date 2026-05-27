/**
 * /use/[slug] data SSOT — per-workflow shadow-link AEO pages.
 *
 * Shadow-link strategy (mirrors /compare/[slug] lock 2026-05-27):
 * each workflow gets its own crawlable URL for search-intent
 * coverage. LLMs and Google find them via sitemap.xml + llms.txt
 * + cross-links from the /use hub and the case-study cross-link
 * blocks. They are NOT exposed in MarketingNav (keeps human-facing
 * nav clean).
 *
 * Targets high-intent search queries the GSC pass on 2026-05-27
 * surfaced: searches like "M&A bias audit", "investment committee
 * memo review", "strategic memo cognitive bias", "decision pre-
 * mortem" — all commercial-intent phrases the case library + the
 * core flow already answer, but didn't have a workflow-named
 * landing page for.
 *
 * Each page maps to the 4 wedge personas (Fractional CSO /
 * Mid-market Corp Dev Head / Smaller-Fund GP / PE-Backed Founder)
 * + the broader F500 CSO ceiling buyer. Persona attribution feeds
 * the H1 + SCQA strip.
 *
 * Data discipline:
 * - 5-step HowTo flow maps to the canonical product flow
 *   (upload → audit → review biases → fix → export DPR)
 * - Related case-study slugs MUST exist in the 143-case library
 * - FAQ answers reference real product capabilities, never
 *   fabricated features
 * - Single primary CTA (Choice Paradox); always routes to /demo
 *   for cold visitors to absorb the audit live
 */

import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

/** SCQA-style 4-line cover strip — Situation → Complication → Question → Answer.
 *  Procurement-grade narrative shape borrowed from the McKinsey-grade audit
 *  deliverable; the same shape lands clean for SEO snippet rendering. */
export interface UseCaseScqa {
  situation: string;
  complication: string;
  question: string;
  answer: string;
}

/** HowTo schema step — surfaces as JSON-LD HowTo.step entries. */
export interface UseCaseHowToStep {
  /** Step number for the visible UI; HowTo schema uses array position. */
  n: number;
  /** Short title (≤8 words). */
  title: string;
  /** 1-2 sentence detail. */
  detail: string;
}

export interface UseCase {
  /** URL slug (kebab-case). Used at /use/[slug]. Stable; never rename
   *  without a 308 redirect from the old slug. */
  slug: string;
  /** Display name of the workflow (the H1 promise). */
  workflow: string;
  /** Eyebrow text rendered above the workflow name. */
  eyebrow: string;
  /** Who's at the door — the wedge persona label used in copy + SEO desc. */
  targetPersona: string;
  /** One-liner ≤140 chars for card preview + SEO description + page hero. */
  oneLiner: string;
  /** 4-line SCQA cover strip. */
  scqa: UseCaseScqa;
  /** HowTo 5-step canonical flow. */
  steps: UseCaseHowToStep[];
  /** Why this matters — single body paragraph anchoring the workflow in
   *  real failure mode (not feature copy). */
  whyItMatters: string;
  /** Case-study slugs cross-linked at the bottom of the page. Stable
   *  slugs only; validated by the page route at render time. */
  relatedCaseSlugs: string[];
  /** FAQ entries — 3-4 workflow-specific questions. */
  faq: Array<{ q: string; a: string }>;
  /** CTA label specific to the workflow (e.g. "Audit your IC memo"). */
  ctaLabel: string;
}

const COMMON_STEPS: UseCaseHowToStep[] = [
  {
    n: 1,
    title: 'Upload the document',
    detail:
      'Paste the memo or drop the PDF / DOCX / spreadsheet. The 12-node R²F pipeline runs in ~60 seconds.',
  },
  {
    n: 2,
    title: 'Review the audit',
    detail: `Decision Quality Index score, ${BIAS_COUNT}-bias R²F detection, named compound failure patterns, and verbatim evidence quotes for every finding.`,
  },
  {
    n: 3,
    title: 'Read the hardening questions',
    detail:
      'Each finding ships with an audit-committee-ready hardening question — the specific question a procurement reader would ask if they saw this memo cold.',
  },
  {
    n: 4,
    title: 'Strengthen the reasoning',
    detail:
      'Rewrite the flagged passages with the inline co-edit panel. Get a passage-level DQI delta before re-running the full audit.',
  },
  {
    n: 5,
    title: 'Export the Decision Provenance Record',
    detail: `Procurement-grade PDF — hashed + tamper-evident, with the ${FRAMEWORK_COUNT}-framework regulatory mapping, methodology version, and audit-log trail your audit committee + GC will recognise.`,
  },
];

/** SCQA + workflow-tuned HowTo for each use case. Steps are the
 *  COMMON_STEPS pattern unless the workflow genuinely diverges (e.g.
 *  fund-thesis-audit drops step 5 — DPR isn't the buyer's primary
 *  artefact, the thesis revision is). */
export const USE_CASES: UseCase[] = [
  {
    slug: 'strategic-memo-audit',
    workflow: 'Strategic memo audit',
    eyebrow: 'For CSOs and Heads of Strategic Planning',
    targetPersona: 'F500 CSO + Fractional CSO',
    oneLiner:
      'Audit a strategic memo for cognitive bias and forecast errors in 60 seconds — before the board sees it.',
    scqa: {
      situation:
        "You're writing a strategic memo the executive team will react to. Every line carries weight.",
      complication:
        'Cognitive bias compounds invisibly: confirmation, anchoring, narrative coherence. By the time the board catches it, the memo has shaped the decision.',
      question: 'How do you stress-test your own reasoning before the room does?',
      answer: `Decision Intel runs a ${BIAS_COUNT}-bias Recognition-Rigor Framework audit on the memo text. The audit catches what the author cannot — by construction. ${HISTORICAL_CASE_COUNT}-case reference library calibrated.`,
    },
    steps: COMMON_STEPS,
    whyItMatters:
      'Most strategic memos pass cleanly. The ones that do not are the ones that destroy value. You cannot tell the catastrophic memo from the clean memo without auditing both — which is why you run the audit on every memo, not just the suspicious ones. The 60-second audit is a structural friction layer between thinking and acting.',
    relatedCaseSlugs: ['eastman-kodak', 'blockbuster', 'nokia'],
    faq: [
      {
        q: 'How long is the audit?',
        a: 'About 60 seconds end-to-end on a typical 1500–4000 word memo. The 12-node R²F pipeline runs in parallel where possible; the procurement-grade DPR PDF generates in another few seconds after that.',
      },
      {
        q: 'Does it work on memos in spreadsheets or slide decks?',
        a: 'Yes. The parser accepts .docx, .pdf, .pptx, .xlsx, and pasted text up to 4000 words. Excel memos trigger the synergy-model overlay — for M&A and integration plans where claims compound across rows.',
      },
      {
        q: "What's the difference between this and a peer review?",
        a: 'Peer review depends on the reviewer noticing what you missed. The R²F audit fires the same detectors on every memo, with verbatim citations to a 143-case reference library. The audit is not better than a senior reviewer — it is a structural addition that catches the patterns the reviewer is also vulnerable to.',
      },
      {
        q: 'Can I keep the memo private?',
        a: 'Yes — documents are encrypted at rest with AES-256-GCM, the GDPR / NDPR anonymizer runs first in the pipeline, and you can disable Bias Genome contribution at the org level. Solo users on the Free / Individual tier are private by default.',
      },
    ],
    ctaLabel: 'Audit a strategic memo',
  },
  {
    slug: 'ic-memo-pre-vote-audit',
    workflow: 'IC memo pre-vote stress test',
    eyebrow: 'For Heads of Corp Dev and Investment Committee chairs',
    targetPersona: 'Mid-market Corp Dev Head + Smaller-Fund GP',
    oneLiner:
      'Stress-test an investment committee memo before the vote — catch Synergy Mirage, Winner&apos;s Curse, and Conglomerate Fallacy.',
    scqa: {
      situation:
        "Your investment committee is voting on a deal next week. The memo is in everyone's inbox.",
      complication:
        'The room reads the memo as authored. The synergy claims, the comp set, the why-now: every line is a candidate for the patterns that produce 70-90% deal-failure rates per McKinsey + KPMG.',
      question:
        'Where exactly does this memo fail to defend itself? And what would the audit committee ask?',
      answer:
        "Decision Intel runs the M&A-specific overlays — Synergy Mirage detection, BCG-mandate filter on every synergy claim, Conglomerate Fallacy and Winner's Curse compound patterns — before the IC convenes. Verbatim hardening questions for the sponsor.",
    },
    steps: [
      ...COMMON_STEPS.slice(0, 4),
      {
        n: 5,
        title: 'Run the Deal Fever pre-mortem',
        detail:
          'Three brutal questions anchored on the Kyle Price (Roblox) Deal Fever framework — the specific signal a sponsor must produce a number / mechanism / owner / milestone for. Pre-vote, not post-mortem.',
      },
    ],
    whyItMatters:
      'IC memo failures are biased toward overcommitment + narrative coherence: the sponsor wrote the memo to close the deal, and the room reads it from the same frame. The audit is the antagonist that costs no political capital — fires before the IC memo can hide what the deal sponsor does not want to see.',
    relatedCaseSlugs: ['wework', 'aol-time-warner', 'quibi'],
    faq: [
      {
        q: 'Does this replace the deal team?',
        a: "No. The audit is a structural addition to the IC workflow — it fires the same detectors on every memo, at every gate, so the deal team isn't the only line of defense against the sponsor's narrative.",
      },
      {
        q: 'How does it handle confidential / NDA-bound deals?',
        a: 'Documents are encrypted at rest with AES-256-GCM. The GDPR / NDPR anonymizer runs as the first pipeline node — counterparty names + amounts can be redacted before downstream nodes see them. Organisations can also disable Bias Genome contribution so deal data never feeds cross-org calibration.',
      },
      {
        q: 'What if the memo is a spreadsheet model, not prose?',
        a: 'Synergy models in Excel trigger the per-claim defensibility scorer + the BCG-mandate filter. The parser reads rows, classifies each claim (mechanism / owner / 90-day milestone), and surfaces the synergy mirage band on the DPR cover.',
      },
      {
        q: 'How long does an IC memo audit take?',
        a: 'Typically 60-90 seconds for an IC memo + 1-2 supporting documents (synergy model, QofE, integration plan). The cross-reference layer also runs across all attached documents to surface conflicting claims between the memo and the model.',
      },
    ],
    ctaLabel: 'Audit your IC memo',
  },
  {
    slug: 'board-deck-pre-presentation-audit',
    workflow: 'Board deck pre-presentation audit',
    eyebrow: 'For CSOs and CEOs presenting to a board',
    targetPersona: 'F500 CSO + PE-Backed CEO',
    oneLiner:
      'Audit a board deck before the presentation — predict the toughest questions the room will ask.',
    scqa: {
      situation:
        "You're presenting to the board on Thursday. The deck is set; the talking points are not.",
      complication:
        'Board members are pattern-matchers. They have seen this kind of decision before — and they will ask the question you forgot to anticipate. Most of the damage in a board meeting happens in the Q&A, not the deck.',
      question:
        'What are the three hardest questions the board will ask, and how do you answer them now?',
      answer:
        'Decision Intel audits the deck, runs the boardroom simulator across 5 personas (Margaret-class CSO, Damien-class corp dev head, James-class GC, Adaeze-class PE partner, Riya-class VC associate), and surfaces predicted Q&A with verbatim suggested responses.',
    },
    steps: [
      ...COMMON_STEPS.slice(0, 3),
      {
        n: 4,
        title: 'Run the boardroom simulator',
        detail:
          'The 5-persona boardroom twin fires Q&A questions in the actual voice of each archetype — the CSO will ask about competitive positioning; the GC about indemnification; the corp dev head about valuation framework.',
      },
      {
        n: 5,
        title: 'Export the board-grade brief',
        detail: `Procurement-grade 2-page brief — board-ready typography, ${FRAMEWORK_COUNT}-framework regulatory anchor, audit-log fingerprint. Attach to the deck as the appendix.`,
      },
    ],
    whyItMatters:
      'A board meeting is a high-stakes single-shot event. The presenter cannot run the audit during the meeting — only before. The boardroom simulator is the dress rehearsal: every persona-voiced question that fires in the simulator is a question that does not surprise you in the room.',
    relatedCaseSlugs: ['eastman-kodak', 'blockbuster', 'sears'],
    faq: [
      {
        q: 'How realistic are the simulator personas?',
        a: 'The 5 boardroom personas are calibrated against verbatim quotes from real M&A Science podcast episodes, Sequoia / a16z partner letters, and Bessemer GP behaviour. The simulator does not produce generic SaaS questions — it produces the specific question the archetype has asked variants of for two decades.',
      },
      {
        q: 'Can I add a custom persona for my actual board members?',
        a: "Yes, on the Team tier. Add a custom persona profile (background, sector, prior decisions, known pet topics) and the simulator weights its Q&A questions to that profile. The simulator's structure is open — it isn't tied to the canonical 5.",
      },
      {
        q: 'Does the brief render in PowerPoint?',
        a: "The board-grade brief is a 2-page PDF. The DPR cover (hash + methodology + regulatory anchor) renders on page 1; the predicted Q&A renders on page 2. You attach it to the deck as the appendix — most board chairs prefer the appendix attached to the deck PDF rather than slides embedded inside the speaker's flow.",
      },
    ],
    ctaLabel: 'Audit your board deck',
  },
  {
    slug: 'fund-investment-thesis-audit',
    workflow: 'Fund investment thesis audit',
    eyebrow: 'For VC / PE General Partners',
    targetPersona: 'Smaller-Fund GP',
    oneLiner:
      'Audit a fund investment thesis before the LP raise — catch Narrative Coherence, Reference-Class Blindness, and Optimism Trap.',
    scqa: {
      situation:
        "You're raising the next fund. The thesis is the pitch — and it's also the document LPs will hold you accountable to.",
      complication:
        'Narrative coherence is the GP killer: a beautifully-coherent thesis attracts capital and locks in a frame that 5-10 years of deployment may not honour. Inside-view dominance compounds when the GP wrote the prior fund and is grading its own paper.',
      question:
        "Where does the thesis fail to defend itself against an outside-view reviewer who has never seen this fund's prior performance?",
      answer: `Decision Intel runs the Recognition-Rigor Framework on the thesis text — narrative coherence detection, ${HISTORICAL_CASE_COUNT}-case reference library lookup, inside-view dominance flag, validity-class shift for low-validity domains.`,
    },
    steps: COMMON_STEPS,
    whyItMatters:
      'The thesis sets the frame for every IC vote in the next 5-10 years. A flawed thesis compounds across every deal in the fund. The audit catches the patterns the GP wrote in — patterns the GP cannot see because the GP is operating from the inside view by construction.',
    relatedCaseSlugs: ['theranos', 'ftx', 'wework'],
    faq: [
      {
        q: 'Does this work on a single-thesis or multi-thesis fund?',
        a: 'Both. For multi-thesis funds (e.g. fund of funds, multi-strategy PE), the audit fires per-thesis + flags inconsistency across theses. The Decision Knowledge Graph links related deal artefacts across theses.',
      },
      {
        q: 'How does it handle pan-African / EM fund theses?',
        a: 'The structural assumptions audit applies the EM jurisdiction overlay — Nigeria NDPR + CBN, Kenya CMA, South Africa PoPIA + SARB, WAEMU, Egypt CBE — so a Pan-African thesis is audited against the actual regulatory landscape, not a US-default assumption set.',
      },
      {
        q: 'Will an LP see the audit?',
        a: "The DPR is your artefact to share or withhold. Most GPs use the audit internally as a pre-LP-deck stress test. Some attach a redacted DPR to the LP data room as a procurement-grade signal — particularly when the LP base is DFI-heavy or audit-committee-driven. It's your call.",
      },
      {
        q: 'What happens after the fund closes?',
        a: 'The thesis becomes the anchor for every IC vote in the deployment cycle. The R²F framework re-applies at each deal stage; the Outcome Gate logs every closed outcome against the original thesis prediction; per-fund Brier calibration sharpens the audit specifically for your fund over time.',
      },
    ],
    ctaLabel: 'Audit a fund thesis',
  },
  {
    slug: 'm-and-a-bias-audit',
    workflow: 'M&A bias audit',
    eyebrow: 'For Heads of Corp Dev and M&A advisors',
    targetPersona: 'Mid-market Corp Dev Head + PE-Backed Founder',
    oneLiner:
      'Audit an acquisition thesis for the three named M&A failure patterns: Synergy Mirage, Conglomerate Fallacy, Winner&apos;s Curse.',
    scqa: {
      situation:
        "You're recommending an acquisition. The deal team has spent months on diligence. The thesis is set.",
      complication:
        '70-90% of acquisitions miss their synergy targets per McKinsey + KPMG. The patterns that drive the failures are visible in the original memo — but only if you know what to look for.',
      question:
        'Which of the three named M&A failure patterns does this thesis fire on, and what is the procurement-grade response to each?',
      answer:
        "Decision Intel runs the M&A overlays — Synergy Mirage with BCG-mandate filter, Conglomerate Fallacy with parenting-advantage test, Winner's Curse with auction-dynamics detection. Compound-pattern severity bands on the DPR cover.",
    },
    steps: [
      ...COMMON_STEPS.slice(0, 4),
      {
        n: 5,
        title: 'Run the cross-document conflict scan',
        detail:
          'Acquisition theses ship with attached documents (CIM, synergy model, integration plan, QofE). The cross-reference layer fires conflict detection across them — surfaces synergy claims in the memo that the model does not defend, or integration assumptions that contradict the deal rationale.',
      },
    ],
    whyItMatters:
      'M&A failure is rarely a surprise on the day. It is a slow-motion failure visible in the original memo to anyone outside the deal team. The audit is the outside-view layer that the inside-view deal team cannot supply for itself.',
    relatedCaseSlugs: ['aol-time-warner', 'wework', 'microsoft-2013'],
    faq: [
      {
        q: 'What if the acquisition is a tech tuck-in, not a platform merger?',
        a: 'The audit re-weights based on validity class. Programmatic mid-market tech tuck-ins are a high-validity decision class per Kahneman & Klein 2009 — the audit accordingly weights historical alignment higher and flags less aggressively on narrative coherence. Platform mergers are low-validity; the audit weights compound-pattern detection higher.',
      },
      {
        q: 'How does it handle deals with PE / equity-warrant structures?',
        a: 'The structural assumptions audit detects warrant terms, milestone triggers, and earn-out structures from the memo + term sheet. Conflict scan flags inconsistency between the deal-team memo and the term sheet — common failure mode where the memo promises one alignment shape and the term sheet locks in another.',
      },
      {
        q: 'Can I run this on a deal that has already closed?',
        a: 'Yes — the retroactive audit mode (shipped 2026-05-23) lets you backfill historical deals where the outcome is already known. Run the audit on closed deals to populate per-org Brier calibration and Decision DNA; the platform learns your specific failure modes from real outcomes, not synthetic forecasts.',
      },
      {
        q: 'Does the audit detect non-English memos?',
        a: 'The pipeline runs on the English text the parser extracts. For non-English source documents, translate first; the structural detection layers (named compound patterns, BCG-mandate filter on synergy claims) work on semantic patterns, not idiom-bound phrasing.',
      },
    ],
    ctaLabel: 'Audit an acquisition thesis',
  },
  {
    slug: 'decision-pre-mortem',
    workflow: 'Decision pre-mortem',
    eyebrow: 'For any high-stakes decision, before commitment',
    targetPersona: 'F500 CSO + Fractional CSO + Corp Dev Head',
    oneLiner:
      'Run a structured pre-mortem before the decision is final — surface failure modes the room cannot see from the inside.',
    scqa: {
      situation: "You've reached the decision point. The room is converging on a recommendation.",
      complication:
        'Klein & Mitchell 1995 + Mitchell-Russo-Pennington 1989 found that asking the room "what could go wrong?" produces conditional-voice hedging. Asking them to describe the disaster in past tense produces 25-30% more, higher-quality failure-cause insights.',
      question:
        'What does the failure look like a year from now, in past tense — and what is the warning sign everyone missed?',
      answer:
        'Decision Intel runs the prospective-hindsight pre-mortem on the decision memo: projects one year forward, frames the outcome as a total disaster, generates the history of how it failed. Identifies the warning sign in the original memo before the decision is committed.',
    },
    steps: [
      ...COMMON_STEPS.slice(0, 3),
      {
        n: 4,
        title: 'Generate the prospective-hindsight narrative',
        detail:
          'The pre-mortem agent projects forward one year, frames the outcome as a total disaster, and writes the past-tense history of how it failed. Anchors the narrative on real bias patterns detected in the memo.',
      },
      {
        n: 5,
        title: 'Lock the priors record',
        detail:
          'Before commitment, capture the falsifiable 90-day operational proxies the decision rests on. The Outcome Gate auto-fires at 90 days to score them. This is the calibration loop closure that compounds quarter after quarter.',
      },
    ],
    whyItMatters:
      'A pre-mortem is the single highest-leverage discipline in strategic decision-making per the Kahneman literature. The audit operationalises it: every decision gets the pre-mortem treatment, every failure mode gets a falsifiable proxy, every outcome gets logged. The calibration loop is the moat, not the audit.',
    relatedCaseSlugs: ['long-term-capital-management', 'enron', 'lehman-brothers'],
    faq: [
      {
        q: "What's the difference between pre-mortem and red-teaming?",
        a: 'Red teams scale poorly: they degrade into performative "list-the-risks" exercises because the political cost of dissent is unsustainable. The pre-mortem agent absorbs the antagonist role — the human user becomes the facilitator, not the antagonist. The system fires the dissent that the room cannot fire from the inside.',
      },
      {
        q: 'How do I structure the priors record?',
        a: 'The priors panel asks for: conviction level (0-100), rationale (≤500 chars), kill criteria (the falsifiable signals that would change your mind), and 1-3 micro-predictions with 90-day horizons. The Outcome Gate auto-fires at 90 days to score them with Brier loss.',
      },
      {
        q: 'Can I run a pre-mortem on a decision I already made?',
        a: 'Yes — the retroactive audit mode handles closed historical decisions. Useful for calibration: how well-calibrated were the priors you actually wrote? Per-org Brier score sharpens as you log more closed outcomes against original priors.',
      },
      {
        q: 'Does this work for non-strategic decisions (hiring, vendor selection)?',
        a: 'The pre-mortem detector is workflow-agnostic — it fires on any memo with a recommendation + supporting evidence + projected outcome. Hiring memos, vendor RFPs, product-bet memos, market-entry plans all work. The platform is positioned for strategic decisions but the underlying audit applies broadly.',
      },
    ],
    ctaLabel: 'Run a pre-mortem',
  },
];

/** Helpers used by the page route + sitemap. */

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return USE_CASES.find(u => u.slug === slug);
}

export function listUseCaseSlugs(): string[] {
  return USE_CASES.map(u => u.slug);
}
