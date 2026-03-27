/**
 * SEC Regulation D Framework
 *
 * Maps cognitive biases to the key provisions of SEC Regulation D, which
 * governs private placement exemptions from Securities Act registration.
 * Regulation D provides Rules 501–508 establishing conditions under which
 * issuers may sell securities without SEC registration.
 *
 * Reference: 17 CFR §§ 230.501–230.508 (as amended through 2024)
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const SEC_REG_D_FRAMEWORK: RegulatoryFramework = {
  id: 'sec_reg_d',
  name: 'SEC Regulation D',
  jurisdiction: 'United States',
  category: 'financial',
  lastUpdated: '2026-03-01',

  provisions: [
    {
      id: 'sec_rd_rule_501',
      framework: 'sec_reg_d',
      section: 'Rule 501',
      title: 'Rule 501: Accredited Investor Definition',
      description:
        'Defines the categories of accredited investors eligible to participate in Regulation D offerings, including natural persons meeting income or net worth thresholds, institutional investors, and entities with sufficient assets. Proper verification of accredited status is foundational to the exemption.',
      riskLevel: 'high',
      keywords: [
        'accredited investor',
        'net worth',
        'income threshold',
        'investor verification',
        'qualified purchaser',
        'sophisticated investor',
        'financial criteria',
      ],
    },
    {
      id: 'sec_rd_rule_502',
      framework: 'sec_reg_d',
      section: 'Rule 502',
      title: 'Rule 502: General Conditions',
      description:
        'Establishes the general conditions applicable to Regulation D offerings, including integration of offerings, information requirements for non-accredited investors, and limitations on resale of securities. Compliance with these conditions is necessary to maintain the exemption from registration.',
      riskLevel: 'high',
      keywords: [
        'integration',
        'information requirements',
        'resale limitations',
        'offering conditions',
        'restricted securities',
        'holding period',
        'disclosure obligations',
      ],
    },
    {
      id: 'sec_rd_rule_503',
      framework: 'sec_reg_d',
      section: 'Rule 503',
      title: 'Rule 503: Filing of Notice',
      description:
        'Requires issuers to file a Form D notice with the SEC within 15 days of the first sale of securities in a Regulation D offering. The filing provides the SEC with basic information about the offering and the issuer, and failure to file may jeopardize the exemption.',
      riskLevel: 'medium',
      keywords: [
        'Form D',
        'SEC filing',
        'notice of sale',
        'filing deadline',
        'offering notification',
        'regulatory notice',
        'disclosure filing',
      ],
    },
    {
      id: 'sec_rd_rule_506b',
      framework: 'sec_reg_d',
      section: 'Rule 506(b)',
      title: 'Rule 506(b): Limited Solicitation',
      description:
        'Permits offerings to an unlimited number of accredited investors and up to 35 non-accredited but sophisticated investors, provided no general solicitation or advertising is used. Issuers must have a pre-existing substantive relationship with each offeree, and additional disclosure requirements apply when non-accredited investors participate.',
      riskLevel: 'high',
      keywords: [
        'private placement',
        'limited solicitation',
        'substantive relationship',
        'no general solicitation',
        'sophisticated investor',
        'pre-existing relationship',
        'private offering',
      ],
    },
    {
      id: 'sec_rd_rule_506c',
      framework: 'sec_reg_d',
      section: 'Rule 506(c)',
      title: 'Rule 506(c): General Solicitation',
      description:
        'Permits general solicitation and advertising in offerings made exclusively to verified accredited investors. Issuers must take reasonable steps to verify that all purchasers are accredited investors, using methods such as reviewing tax returns, bank statements, or obtaining third-party confirmation.',
      riskLevel: 'high',
      keywords: [
        'general solicitation',
        'accredited verification',
        'advertising permitted',
        'reasonable verification',
        'accredited only',
        'verification methods',
        'public offering exemption',
      ],
    },
  ],

  biasMappings: [
    // ── authority_bias ──────────────────────────────────────────────────
    {
      biasType: 'authority_bias',
      provisionId: 'sec_rd_rule_501',
      riskWeight: 0.8,
      mechanism:
        'Deference to prominent or high-profile investors leads placement agents to relax accredited investor verification procedures. When a well-known figure or institutional name expresses interest, compliance teams assume accreditation status rather than conducting independent verification, creating exemption risk.',
      example:
        'A fund manager waives the standard income and net worth verification process for a celebrity investor who "obviously" qualifies as accredited, only to discover during an SEC examination that the individual did not meet the net worth threshold after accounting for primary residence exclusions.',
    },
    {
      biasType: 'authority_bias',
      provisionId: 'sec_rd_rule_506b',
      riskWeight: 0.7,
      mechanism:
        'Senior deal partners assert that a pre-existing substantive relationship exists with a prospective investor based on their own reputation or industry standing, overriding compliance protocols that require documented evidence of prior contact. Junior team members defer to partnership authority rather than enforcing relationship verification.',
      example:
        'A managing director insists that a prospect met at a single industry conference constitutes a substantive relationship, and the compliance team accepts this characterization without challenge, exposing the offering to general solicitation violations.',
    },

    // ── confirmation_bias ───────────────────────────────────────────────
    {
      biasType: 'confirmation_bias',
      provisionId: 'sec_rd_rule_501',
      riskWeight: 0.75,
      mechanism:
        'Investor verification processes selectively gather evidence confirming accredited status while overlooking contradictory indicators. Teams accept self-certification questionnaires at face value and interpret ambiguous financial documentation in the most favorable light to close the subscription.',
      example:
        'An issuer reviews a prospective investor\'s bank statement showing a large account balance as proof of net worth, ignoring visible mortgage and credit card liabilities that, if properly counted, would bring the investor below the $1 million net worth threshold.',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'sec_rd_rule_502',
      riskWeight: 0.65,
      mechanism:
        'Integration analysis selectively identifies factors supporting the conclusion that multiple offerings are separate, while downplaying similarities in timing, investor overlap, and use of proceeds that suggest the offerings should be integrated and treated as a single transaction.',
      example:
        'A startup conducts two convertible note rounds three months apart with overlapping investor lists. Legal counsel focuses on the different terms and pricing to justify non-integration, while ignoring that both rounds fund the same development milestone and share the same investor deck.',
    },

    // ── overconfidence_bias ─────────────────────────────────────────────
    {
      biasType: 'overconfidence_bias',
      provisionId: 'sec_rd_rule_506c',
      riskWeight: 0.8,
      mechanism:
        'Issuers conducting 506(c) offerings overestimate the adequacy of their accredited investor verification procedures, believing that cursory checks satisfy the "reasonable steps" standard. Overconfidence in internal processes leads to verification methods that would not withstand SEC scrutiny.',
      example:
        'A real estate syndicator using general solicitation relies solely on investor self-certification checkboxes on an online subscription form, confident this constitutes reasonable verification, when the SEC has repeatedly stated that self-certification alone is insufficient under Rule 506(c).',
    },
    {
      biasType: 'overconfidence_bias',
      provisionId: 'sec_rd_rule_503',
      riskWeight: 0.6,
      mechanism:
        'Management overestimates the organization\'s ability to meet Form D filing deadlines, assuming administrative processes will function smoothly without dedicated tracking. Overconfidence in operational capabilities leads to missed or late filings that jeopardize the exemption.',
      example:
        'A fund administrator assumes the 15-day Form D filing deadline will be handled as part of routine closing procedures, but the first sale date is ambiguously defined across multiple subscription documents, and the filing is submitted 30 days late.',
    },

    // ── anchoring_bias ──────────────────────────────────────────────────
    {
      biasType: 'anchoring_bias',
      provisionId: 'sec_rd_rule_501',
      riskWeight: 0.65,
      mechanism:
        'Accredited investor thresholds established decades ago anchor compliance thinking to outdated wealth benchmarks. Teams anchor their risk assessment to the nominal dollar figures without adjusting for inflation or considering whether the thresholds still meaningfully distinguish sophisticated from unsophisticated investors.',
      example:
        'A compliance officer applies the $200,000 income threshold mechanically, treating an investor earning $210,000 in a high-cost metropolitan area as equally sophisticated as the threshold originally intended, without considering that the 1982 threshold would be approximately $650,000 in current dollars.',
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'sec_rd_rule_506b',
      riskWeight: 0.6,
      mechanism:
        'Placement agents anchor to the 35 non-accredited investor limit as a target rather than a maximum, structuring offerings to include as many non-accredited investors as permitted rather than minimizing non-accredited participation to reduce compliance risk and disclosure obligations.',
      example:
        'A fund manager deliberately structures a 506(b) offering to include exactly 35 non-accredited investors to maximize capital raised, anchoring to the regulatory ceiling as a goal rather than recognizing that each non-accredited investor substantially increases disclosure requirements and litigation risk.',
    },

    // ── availability_heuristic ──────────────────────────────────────────
    {
      biasType: 'availability_heuristic',
      provisionId: 'sec_rd_rule_506c',
      riskWeight: 0.7,
      mechanism:
        'Issuers assess the risk of general solicitation violations based on memorable enforcement actions rather than systematic analysis of their own marketing practices. High-profile SEC actions against crowdfunding platforms dominate risk perception while quieter enforcement patterns affecting traditional placements are underweighted.',
      example:
        'A private equity firm concludes that its LinkedIn marketing campaign for a 506(c) offering poses minimal risk because recent SEC enforcement has focused on cryptocurrency offerings, failing to recognize that the SEC has been building cases against traditional fund managers using social media solicitation.',
    },

    // ── groupthink ──────────────────────────────────────────────────────
    {
      biasType: 'groupthink',
      provisionId: 'sec_rd_rule_502',
      riskWeight: 0.75,
      mechanism:
        'Deal teams developing offering memoranda reach premature consensus on disclosure adequacy without genuinely stress-testing whether the information provided to non-accredited investors meets the heightened Rule 502(b) requirements. Dissenting views on disclosure completeness are suppressed to maintain deal momentum.',
      example:
        'A deal team unanimously approves a private placement memorandum for a complex real estate offering that includes non-accredited investors, despite one associate\'s unvoiced concern that the financial projections lack the audited financial statements required under Rule 502(b)(2).',
    },
    {
      biasType: 'groupthink',
      provisionId: 'sec_rd_rule_506b',
      riskWeight: 0.7,
      mechanism:
        'Investment committees collectively rationalize that their investor outreach activities do not constitute general solicitation because the firm has always conducted business this way. Group consensus around existing practices prevents critical examination of whether evolving communication methods have crossed the solicitation boundary.',
      example:
        'A venture capital firm\'s partners collectively agree that sending a mass email about a new fund to their combined 5,000-person contact list is not general solicitation because "we know all these people," when in reality many contacts are superficial connections who do not constitute pre-existing substantive relationships.',
    },

    // ── framing_effect ──────────────────────────────────────────────────
    {
      biasType: 'framing_effect',
      provisionId: 'sec_rd_rule_502',
      riskWeight: 0.7,
      mechanism:
        'Offering documents frame investment risks in ways that technically comply with disclosure requirements while systematically understating downside scenarios. The framing of risk factors as remote or theoretical possibilities rather than material contingencies undermines the informational purpose of Rule 502 disclosures.',
      example:
        'A private placement memorandum discloses illiquidity risk as "investors should be prepared for the possibility that resale may be limited" rather than clearly stating that securities cannot be resold for at least 12 months and there is no secondary market, effectively burying a critical constraint in euphemistic language.',
    },
    {
      biasType: 'framing_effect',
      provisionId: 'sec_rd_rule_506c',
      riskWeight: 0.65,
      mechanism:
        'Marketing materials for 506(c) offerings frame the general solicitation permission as a license for aggressive advertising, while minimizing the correspondingly stringent verification requirements. The "general solicitation permitted" framing anchors issuers to the freedom granted while obscuring the verification obligations imposed.',
      example:
        'A syndicator promotes a 506(c) offering through Facebook ads emphasizing "now open to all accredited investors" with projected 15% returns, framing the offering as broadly accessible while burying the verification requirements in a footnote that most respondents never read before expressing interest.',
    },

    // ── halo_effect ─────────────────────────────────────────────────────
    {
      biasType: 'halo_effect',
      provisionId: 'sec_rd_rule_501',
      riskWeight: 0.7,
      mechanism:
        'Positive impressions of an investor\'s professional credentials, educational background, or social status create a halo that leads compliance teams to assume financial accreditation without rigorous verification. Professional sophistication is conflated with meeting specific income or net worth thresholds.',
      example:
        'A placement agent assumes a physician with a prestigious hospital affiliation is accredited based on professional status alone, without verifying income or net worth. The physician, early in their career with substantial medical school debt, does not actually meet the net worth threshold.',
    },

    // ── status_quo_bias ─────────────────────────────────────────────────
    {
      biasType: 'status_quo_bias',
      provisionId: 'sec_rd_rule_503',
      riskWeight: 0.55,
      mechanism:
        'Filing procedures established years ago persist unchanged despite evolving SEC requirements and EDGAR system updates. Organizations resist updating Form D filing workflows, templates, and responsible parties even when the existing process has produced errors or near-misses.',
      example:
        'A fund administrator continues to use a 2019 Form D template and manual filing procedure despite the SEC updating several form fields and introducing new electronic filing requirements, resulting in incomplete filings that trigger SEC staff comment letters.',
    },
    {
      biasType: 'status_quo_bias',
      provisionId: 'sec_rd_rule_502',
      riskWeight: 0.5,
      mechanism:
        'Offering document templates and disclosure practices remain static despite changes in the regulatory landscape and no-action letter guidance. Legal teams resist revising established PPM templates because the existing format has "always worked," even when new SEC guidance suggests enhanced disclosure expectations.',
      example:
        'A law firm continues to use a boilerplate private placement memorandum template from 2018 for a technology startup offering, omitting disclosures about cryptocurrency-related risks and AI governance considerations that the SEC has since flagged as material for technology companies.',
    },
  ],
};
