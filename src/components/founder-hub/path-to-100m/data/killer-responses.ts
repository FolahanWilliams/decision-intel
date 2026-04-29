/**
 * KillerResponsesPlaybook consumer data — JOLT-effect handling for
 * "not for us" + "I'm confused" + 3 category-contrast lines. Split
 * out from monolithic data.ts at F2 lock 2026-04-29.
 *
 * Source synthesis: 2026-04-27 killer-responses NotebookLM synthesis.
 */

export type KillerResponse = {
  id: string;
  scenario:
    | 'not_right_now'
    | 'confused'
    | 'too_expensive'
    | 'we_have_a_process'
    | 'how_are_you_different';
  buyerSignal: string;
  underlyingRoadblock: string;
  responseCategory: string;
  exactPhrasing: string;
  whyItWorks: string;
  followUpMove: string;
};

export const KILLER_RESPONSES: KillerResponse[] = [
  // -----------------------------------------------------------------------
  // "This isn't for us at the moment"
  // -----------------------------------------------------------------------
  {
    id: 'not_right_now_honest_off_ramp',
    scenario: 'not_right_now',
    buyerSignal: '"This isn\'t for us at the moment."',
    underlyingRoadblock:
      'The JOLT effect — buyer is paralyzed by fear of making a mistake or overwhelmed by competing priorities. They are NOT saying no to the value; they are saying yes to inertia.',
    responseCategory: 'The Honest Off-Ramp · validate then disqualify',
    exactPhrasing:
      '"You might be right. To be completely honest, if your Investment Committee isn\'t experiencing any post-close surprises, and if your team already has a perfect system of record for tracking why decisions were made, you don\'t need this tool."',
    whyItWorks:
      'Enterprise buyers expect you to push. Giving them permission to walk away builds profound trust, while subtly reminding them that they DO have post-close surprises and they DO NOT have a system of record for the why.',
    followUpMove:
      'After the off-ramp, wait. The buyer who is genuinely uninterested will say "yeah, you are probably right." The buyer with latent pain will surface it within 30 seconds.',
  },
  {
    id: 'not_right_now_pings_and_echoes',
    scenario: 'not_right_now',
    buyerSignal:
      '"This isn\'t for us at the moment." (when off-ramp does not surface clear disinterest)',
    underlyingRoadblock:
      '"Not right now" usually masks a fear of implementation risk OR organizational friction. You must "ping" that fear to see if it echoes back.',
    responseCategory: 'Pings and Echoes · diagnose the real fear',
    exactPhrasing:
      '"I completely understand, and I appreciate your candor. Usually, when partners tell me \'not right now,\' it is because they are worried a new AI tool will slow down their deal velocity, OR they are concerned about the compliance risk. Is it a timing issue for your team, or is it more of an implementation concern?"',
    whyItWorks:
      'You make their unstated fear feel perfectly normal ("other partners feel this way too"), which gives them the psychological safety to admit what is actually holding up the deal.',
    followUpMove:
      'Whichever fear they admit becomes the next 60 seconds of conversation. Address it specifically — never generically.',
  },
  {
    id: 'not_right_now_refrigerator',
    scenario: 'not_right_now',
    buyerSignal: '"This isn\'t for us at the moment." (when timing genuinely is the issue)',
    underlyingRoadblock:
      'Real timing constraints (mid-IC-cycle, year-end close, quarterly board prep). You need to keep the deal alive without burning the relationship.',
    responseCategory:
      'Asynchronous Refrigerator · move the deal off the kitchen table without losing the lead',
    exactPhrasing:
      '"No problem. Whenever your next major IC memo is ready for a stress test, let me know. In the meantime, I will leave you with this 60-second audit we ran on the 2014 Dangote expansion — it catches the exact blind spots the market missed."',
    whyItWorks:
      'You hand them a usable artefact (the Dangote DPR or WeWork DPR) that does the persuasion asynchronously. They will read it on their commute. The artefact opens the door for the next conversation without you pushing.',
    followUpMove:
      'Set a calendar reminder for 4-6 weeks out (matching their stated cycle). Reach back out with a NEW artefact (a fresh case study, a relevant regulatory update) — never just "checking in."',
  },

  // -----------------------------------------------------------------------
  // "I'm confused / I don't see the benefit"
  // -----------------------------------------------------------------------
  {
    id: 'confused_vulnerability_reset',
    scenario: 'confused',
    buyerSignal:
      'Eyes glaze over · "Can you walk me through that again?" · long silence after a feature explanation',
    underlyingRoadblock:
      'Cognitive load is too high. You have fallen into the founder trap of over-explaining the technology instead of solving their business problem.',
    responseCategory:
      'Vulnerability Reset · reset the dynamic from vendor-pitch to peer-conversation',
    exactPhrasing:
      '"I apologize, I think I just fell into the founder trap of over-explaining the technology instead of your problem. Let me take a step back."',
    whyItWorks:
      'Showing vulnerability instantly resets the dynamic from a "vendor pitch" to a peer-to-person conversation. The buyer relaxes; the meeting recovers.',
    followUpMove:
      'Immediately re-anchor on a specific business pain they have already mentioned. "When you said the post-close partner question on the X deal cost you Y — let me show you what we would have flagged before that vote."',
  },
  {
    id: 'confused_5th_grade_anchor',
    scenario: 'confused',
    buyerSignal:
      'Buyer cannot articulate the value back to you · "what does this actually do for me?"',
    underlyingRoadblock:
      'Your vocabulary is too technical. Switch from features (R²F, DPR, DQI, 12-node pipeline) to PROTECTED REVENUE.',
    responseCategory: '5th Grade Financial Anchor · feature → protected revenue',
    exactPhrasing:
      '"Let me explain it simply: Consulting firms charge you $1M to tell you about cognitive bias, and they have the same biases themselves. We built an AI that does not. If your team had removed anchoring bias from your last 20 decisions, your success rate would be 14% higher. This is not a software tool; it is a 60-second insurance premium on your strategic-planning cadence."',
    whyItWorks:
      'You replaced a feature explanation with a financial anchor against the $300B consulting industry. The "$1M to tell you about bias" line forces the buyer to do the math against their own consulting budget.',
    followUpMove:
      'Once they nod at the consulting anchor, immediately transition to the live-audit move ("Don\'t take my word for it — let me run the audit on a memo of yours"). Stop talking, start showing.',
  },
  {
    id: 'confused_evidence_challenge',
    scenario: 'confused',
    buyerSignal:
      'Words are not landing · the buyer is sceptical but not closing the conversation · they say "show me"',
    underlyingRoadblock:
      'You need to stop talking and let the artefact do the persuasion. Fund buyers and procurement-stage CSOs evaluate evidence for a living; they are allergic to generic pitches.',
    responseCategory:
      'Ultimate Evidence Challenge · put your product on the line against their own failed document',
    exactPhrasing:
      '"Don\'t take my word for it. Let\'s do this: bring a redacted IC memo from a deal of yours that went sideways to our next call. I will run the audit live in 7 minutes. If it does not immediately flag the exact blind spots that cost you money, the product is not for you."',
    whyItWorks:
      'Putting your product on the line against THEIR own failed document is the ultimate display of confidence. You shift the buyer from a confused listener into an active participant — they are now invested in seeing what the audit catches.',
    followUpMove:
      'Confirm the next-call date in the same breath. "Tuesday at 2pm — I will block 30 minutes. Bring the memo, redact what you need to. The audit takes 7 minutes; the rest is conversation."',
  },

  // -----------------------------------------------------------------------
  // "How are you different from Cloverpop / Aera / IBM watsonx?"
  // -----------------------------------------------------------------------
  {
    id: 'different_cloverpop',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from Cloverpop?"',
    underlyingRoadblock:
      'Buyer has heard of Cloverpop and is anchoring DI to it — the comparison flattens our category claim. We need to surface the structural difference in one sentence.',
    responseCategory: 'Category Contrast · one-sentence structural difference',
    exactPhrasing:
      '"Cloverpop logs decisions; Decision Intel audits them. They are a logging + collaboration tool relying on humans to manually fill out templates. We are a 12-node Recognition-Rigor reasoning audit — Kahneman + Klein synthesised into one pipeline, with a 30+ bias academic taxonomy and 17-framework regulatory mapping."',
    whyItWorks:
      'Names the structural difference (logging vs auditing) in one sentence, then anchors the depth (R²F, 30+ taxonomy, 17 frameworks) so the buyer cannot collapse us back into the Cloverpop category.',
    followUpMove:
      'Hand over the WeWork or Dangote DPR. "Cloverpop cannot generate this artefact. Their architecture does not have the Klein-side, the regulatory mapping, or the metaJudge synthesis."',
  },
  {
    id: 'different_aera',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from Aera?"',
    underlyingRoadblock:
      'Aera is operational-decision automation (supply chain, demand planning). Buyer is conflating operational with strategic.',
    responseCategory: 'Category Contrast · operational vs strategic',
    exactPhrasing:
      '"Aera automates operational decisions; Decision Intel audits strategic decisions. A COO buys Aera for supply-chain execution. A CSO buys Decision Intel for boardroom memos and IC theses. Different artefact, different buyer, different governance need."',
    whyItWorks:
      'Names the buyer / artefact / governance distinction. The COO vs CSO contrast is sharp enough that procurement teams cannot conflate the categories on the next pass.',
    followUpMove:
      'If the buyer is still mid-comparison, surface the agentic-shift external attack vector framing — "Aera is positioned for the agentic decision-execution future. We are positioned for the strategic-reasoning audit in either future, including agentic systems making capital-allocation calls."',
  },
  {
    id: 'different_ibm_watsonx',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from IBM watsonx.governance?"',
    underlyingRoadblock:
      'Buyer is asking the EU AI Act question. IBM bundles model governance; the buyer is wondering if a one-stop bundle is sufficient.',
    responseCategory: 'Category Contrast · governs the model vs governs the human decision',
    exactPhrasing:
      '"IBM watsonx governs the AI model. Decision Intel governs the human strategic decision the AI informed. Both serve EU AI Act Article 14 record-keeping requirements, but for entirely different artefacts. IBM\'s watsonx tells you the model behaved correctly. Our DPR tells the audit committee the human reasoning behind the decision was rigorous."',
    whyItWorks:
      'Acknowledges IBM directly (no defensive defensiveness), then names the structurally different governance scope. The "different artefacts" framing is procurement-grade because it surfaces what each tool ACTUALLY produces.',
    followUpMove:
      'Surface the Pan-African / EM-fund wedge as the IBM-bundle bypass. "IBM does not sell into Pan-African corp dev or EM-focused funds with our regulatory depth. Win the wedge, expand to F500 with reference cases — by then the bundling argument is already lost on the strategic-reasoning side."',
  },
];

// =========================================================================
// SECTION 7 · PERSONA PITCH LIBRARY (the WHY by buyer persona)
// =========================================================================

