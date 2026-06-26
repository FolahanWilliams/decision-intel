/**
 * Upload guidance SSOT — "what do I upload, and why does it matter?"
 * (locked 2026-06-17).
 *
 * The friction this solves: a confused user lands on the upload zone and
 * stalls on two questions the product never answered at the point of
 * upload — (1) "is MY document even welcome here?" and (2) "why would I
 * give it to this thing?" The answers existed, but only in the pipeline
 * prompt layer (`DOC_TYPE_OVERLAYS` in
 * src/lib/prompts/investment-vertical.ts) — procurement-grade detector
 * language the user never sees.
 *
 * This file distils that content into plain, ego-safe, user-facing
 * language and makes it the single source the upload surfaces read from:
 *   - the dashboard "What can I upload?" panel (UploadGuidancePanel)
 *   - the upload-confirmation doc-type picker payoff
 *   - (cascade phase) /demo + the InlinePasteMemoCard
 *
 * Voice rules (mirror the pain-framing lock in icp.ts): name a MISSING
 * PROCESS, never broken thinking. "We surface where the narrative
 * outruns the evidence" — never "your reasoning is flawed." The DQI is a
 * RISK SCORE, not a grade the user failed.
 *
 * Two parallel structures, by design, because they serve two different
 * surfaces with two different keys:
 *   - UPLOAD_GUIDANCE_BY_ROLE — the PANEL, in the user's own vocabulary
 *     ("a board recommendation", "a forecast"). A CSO/BizOps user does
 *     not think in the M&A picker enum, so forcing the panel through
 *     INVESTMENT_DOCUMENT_TYPES would mangle the language.
 *   - DOC_TYPE_CATCH — the PICKER payoff, keyed by the actual
 *     INVESTMENT_DOCUMENT_TYPES enum value the <select> offers.
 * They are different framings of related content, not the same fact in
 * two places (so not the canonical-imports drift class). When the
 * pipeline overlays change materially, refresh the matching plain-language
 * line here.
 *
 * Forward-looking rule: edit copy HERE only; every upload surface reads by
 * import. When a new INVESTMENT_DOCUMENT_TYPES value lands, add a
 * DOC_TYPE_CATCH line in the same commit (the picker payoff silently
 * falls back to the bias-preview when a type has no catch line — not a
 * crash, but the "why" goes missing).
 */

import type { SampleRole } from '@/lib/data/sample-bundles';

export interface UploadDocGuide {
  /** The document in the user's own vocabulary. */
  label: string;
  /**
   * What the audit zeroes in on for this document — the "why it matters".
   * Process-named, ego-safe. One sentence.
   */
  catch: string;
}

export interface RoleUploadGuidance {
  /** One-line framing that resolves "is my document welcome here?". */
  intro: string;
  /** The 3-5 documents this persona actually brings, most-common first. */
  brings: UploadDocGuide[];
}

/**
 * Universal framing shown at the top of the panel regardless of role —
 * resolves the "does my document qualify?" anxiety and calibrates the
 * DQI expectation so a first score of 52 doesn't read as "F".
 */
export const UPLOAD_UNIVERSAL = {
  whatCounts:
    'If a person, committee, or board has to weigh a recommendation and decide on it, it is auditable. A memo, a deck, a model, a transcript, even an email all count. The audit reads the reasoning, not the file type.',
  strongUpload: [
    'Paste or upload the real thing. A draft you actually wrote beats a polished sample, because the audit works on the reasoning that is actually in it.',
    'One to two pages is plenty. The recommendation, the rationale, and the risks are the sections that carry the signal.',
    'It works in hindsight too. Run it on a decision you have already made to see what the audit would have flagged against the outcome you now know.',
    'Around 50 words is the floor. Below that there is not enough reasoning to audit.',
  ],
  calibration:
    'A first audit usually lands in the 45-65 range. That is a risk score, not a grade you failed: 70+ means the reasoning held up, and below that the flagged biases show you exactly where to pressure-test before the room does.',
} as const;

/**
 * Per-role "documents you usually bring" — the PANEL content, authored in
 * each persona's own vocabulary. Keys are the canonical SampleRole union.
 */
export const UPLOAD_GUIDANCE_BY_ROLE: Record<SampleRole, RoleUploadGuidance> = {
  cso: {
    intro:
      'You bring the documents that lead to a board-level call. If a committee will weigh in on it, it belongs here.',
    brings: [
      {
        label: 'Board recommendation / strategy memo',
        catch:
          'Surfaces where the narrative outruns the evidence, and where the downside case gets less ink than the upside.',
      },
      {
        label: 'Market-entry recommendation',
        catch:
          'Flags single-comparable anchoring and adoption optimism before you commit capital to a new market.',
      },
      {
        label: 'Strategic acquisition memo',
        catch:
          'Surfaces the "why us as the owner" gap and the conflicts counsel may not have escalated yet.',
      },
      {
        label: 'Quarterly board deck or review',
        catch:
          'Reads the reasoning behind the numbers and names the questions the board is about to ask.',
      },
    ],
  },
  ma: {
    intro:
      'Drop any artefact from a deal in flight. The audit recognises the IC memo, CIM, model, and diligence shapes and fires the patterns that sink committee votes.',
    brings: [
      {
        label: 'IC / decision memo',
        catch:
          'The document the committee votes on. Catches Synergy Mirage, Winner’s Curse, and a missing "reasons to decline" section.',
      },
      {
        label: 'CIM / target profile',
        catch:
          'Applies the seller-halo filter: best-case projections and the competitive picture the seller left out.',
      },
      {
        label: 'Synergy model',
        catch:
          'Tests every synergy line for a named mechanism, an owner, and a 90-day milestone, the BCG bar most models miss.',
      },
      {
        label: 'Quality of Earnings (QofE)',
        catch:
          'Flags recurring "one-time" add-backs and aggressive owner-comp adjustments inflating adjusted EBITDA.',
      },
      {
        label: 'Integration plan',
        catch:
          'Surfaces cultural-fit blind spots, talent-flight risk, and synergies with no Day-1 owner.',
      },
    ],
  },
  bizops: {
    intro: 'Bring the recurring call that has to hold up in front of the steering committee.',
    brings: [
      {
        label: 'Forecast / plan',
        catch:
          'Flags the anchoring and optimism that ship miss-the-quarter forecasts before they reach the committee.',
      },
      {
        label: 'Buy-vs-build recommendation',
        catch:
          'Catches planning-fallacy on internal-build timelines and the savings case that ignores switching cost.',
      },
      {
        label: 'Budget recommendation',
        catch:
          'Surfaces survivorship bias on last year’s winners and projections set quietly at best-case.',
      },
      {
        label: 'Shut-down or wind-down call',
        catch:
          'Names sunk-cost escalation, the "one more quarter" argument, and tests it against forward value.',
      },
    ],
  },
  pe_vc: {
    intro:
      'Drop any decision-grade memo your IC actually reads: pre-IC, source, growth-round, or fund-launch.',
    brings: [
      {
        label: 'Pre-IC / source memo',
        catch:
          'Catches anchoring on a single comparable deal and narrative-fallacy on regulatory tailwinds.',
      },
      {
        label: 'Growth-round CIM',
        catch:
          'Tests the growth-curve extrapolation and the TAM story against real adoption friction.',
      },
      {
        label: 'Fund-launch thesis',
        catch: 'Flags overconfidence on the AUM ramp and anchoring on prior-fund returns.',
      },
      {
        label: 'Pre-commitment review',
        catch: 'Produces an LP-grade, tamper-evident record of the reasoning behind the commit.',
      },
    ],
  },
  eta: {
    intro:
      'Bring the deal you are working — your thesis, the target CIM, the debt model. You decide alone with no IC, so the audit is the second set of eyes that catches what a committee would, before you sign.',
    brings: [
      {
        label: 'Acquisition thesis / deal memo',
        catch:
          'The document you raise on and stake a personal guarantee on. Catches deal fever, LOI-price anchoring, operating-thesis overconfidence, and the cultural-fit blind spot at draft time.',
      },
      {
        label: 'Target CIM',
        catch:
          'Applies the seller-halo filter as a fast Go / No-Go screen — the deal-killers that warrant walking away before you spend on diligence.',
      },
      {
        label: 'SBA / debt-service model',
        catch:
          'Stress-tests the DSCR: flags a coverage ratio that only clears on add-backs the lender will reject, a funding gap at close.',
      },
      {
        label: 'Quality of Earnings (QofE)',
        catch:
          'Flags recurring "one-time" add-backs and aggressive owner-comp adjustments inflating adjusted EBITDA.',
      },
    ],
  },
  other: {
    intro:
      'Anything strategic you actually wrote: a fundraise deck, a board update, a strategy memo, an investor email. The wow lands harder on your own content than on a sample.',
    brings: [
      {
        label: 'Strategy memo or recommendation',
        catch:
          'Runs the full bias audit on your reasoning, with every flag traceable to an excerpt.',
      },
      {
        label: 'Board or investor update',
        catch: 'Reads what the narrative is doing and names the questions a committee would ask.',
      },
      {
        label: 'A deck or one-pager',
        catch:
          'Even a recommendation section or a pre-mortem is enough. The audit works on the reasoning, not the format.',
      },
    ],
  },
};

/**
 * Picker payoff — keyed by the INVESTMENT_DOCUMENT_TYPES enum value the
 * upload-confirmation <select> offers. One plain-language line of "what
 * picking this focuses the audit on", so "(optional)" stops reading as
 * "skippable with no consequence". Distilled from DOC_TYPE_OVERLAYS.
 */
export const DOC_TYPE_CATCH: Record<string, string> = {
  ic_memo:
    'We scrutinise the vote document hardest: Synergy Mirage, Winner’s Curse, and whether the "reasons to decline" are taken seriously.',
  cim: 'We apply the seller-halo filter: best-case projections and the competitive picture the seller left out.',
  pitch_deck:
    'We watch for the narrative outrunning the numbers, TAM inflation, and logos standing in for analysis.',
  term_sheet:
    'We flag anchoring to the headline valuation while the dilutive terms get glossed over.',
  due_diligence:
    'We check whether findings just confirm the thesis and whether the real risks are buried below the positives.',
  lp_report:
    'We watch for survivorship bias: winners highlighted, underperformers quietly minimised.',
  qofe: 'We test the add-backs: recurring "one-time" items and aggressive owner-comp inflating adjusted EBITDA.',
  synergy_model:
    'We test every synergy line for a named mechanism, an owner, and a 90-day milestone.',
  integration_plan:
    'We surface cultural-fit blind spots, talent-flight risk, and synergies with no Day-1 owner.',
  meeting_minutes: 'We look for sanitised dissent, vague action items, and manufactured consensus.',
  meeting_transcript:
    'We read airtime dominance, interruption patterns, and dissent that was raised but never explored.',
  site_analysis:
    'We flag hot-cycle comparables and absorption assumptions faster than the local market supports.',
  financial_pro_forma:
    'We test exit-cap anchoring, lease-up optimism, and under-reserved construction contingency.',
  regulatory_checklist:
    'We flag approvals treated as foregone and entitlement timelines set at the optimistic tail.',
  contractor_selection:
    'We check for lowest-bid anchoring and schedule optimism in the construction phase.',
  appraisal:
    'We watch for commissioning-party bias and comparable selection that flatters the valuation.',
  thesis_memo: 'We flag overconfidence on the AUM ramp and anchoring on prior-fund returns.',
  fund_prospectus: 'We check track-record curation, fee-structure opacity, and key-person risk.',
  lp_ask_deck: 'We watch for commitment-momentum anchoring and the "strategic LP" halo.',
  regulatory_filing:
    'We check disclosure consistency and the jurisdiction-specific gates that are easy to miss.',
  acquisition_thesis:
    'We catch the deal-killers a solo buyer has no IC to catch: deal fever, LOI-price anchoring, the winner’s curse, an SBA debt-service model that only clears on add-backs the lender will reject, and the cultural-fit blind spot — before you sign a personal guarantee.',
  other: 'We run the full bias audit on the reasoning, whatever the format.',
};

/**
 * The "why picking this matters" payoff for a given doc-type enum value.
 * Returns null when the type has no authored line (the picker then falls
 * back to the bias-preview alone). Never throws.
 */
export function getDocTypeCatch(docType: string | undefined | null): string | null {
  if (!docType) return null;
  return DOC_TYPE_CATCH[docType] ?? null;
}
