# Design Partner Master Service Agreement — Template Skeleton

> **Status:** template skeleton for the 5-seat design-partner cohort. Not legal advice. Every MSA signed under this program must be reviewed by both parties' counsel. The founder's counsel (or any UK/Delaware corporate solicitor experienced with SaaS MSAs) should tighten this into a production MSA before the first signature.

This skeleton is the founder's starting point for redlining. Sections marked `[...]` are placeholders to complete per partner. Sections marked `// FOUNDER NOTE:` are guidance for the founder, not contract text.

---

## 1. Parties

This Design Partner Master Service Agreement ("**Agreement**") is entered into on `[DATE]` (the "**Effective Date**") between:

- **Decision Intel Ltd** ("**Decision Intel**"), a UK company registered as `[COMPANY NUMBER]`, with registered office at `[REGISTERED OFFICE ADDRESS]`; and
- `[PARTNER LEGAL ENTITY NAME]` ("**Customer**"), a `[JURISDICTION]` company registered as `[COMPANY NUMBER]`, with registered office at `[REGISTERED OFFICE ADDRESS]`.

Decision Intel and Customer are each a "**Party**" and together the "**Parties**."

## 2. Program Scope

### 2.1 The Platform

"**Platform**" means the Decision Intel SaaS product as described at https://www.decision-intel.com, including the strategic-memo audit pipeline, Decision Knowledge Graph, Recognition-Rigor Framework (R²F) outputs, Decision Provenance Record generator, and all associated integrations the Customer elects to use.

### 2.2 The Program

Customer is accepted as a Design Partner in a cohort of no more than five (5) Fortune 500 corporate strategy teams for an initial term of twelve (12) months beginning on the Effective Date (the "**Design Partner Term**"). Customer acknowledges that this is a pre-commercial engagement during which the Platform is actively under development and that product changes, pricing changes, and feature availability may evolve.

### 2.3 Decision Intel Commitments

During the Design Partner Term, Decision Intel will:

1. Provide Customer with seats on the **Strategy tier** of the Platform at a locked rate of $1,999 per month (see §5).
2. Bundle the **Decision Provenance Record** on every Customer audit at no additional cost during the Design Partner Term.
3. Tune the 20×20 toxic-combination weight matrix to Customer's industry using Customer-supplied historical memo data (see §6).
4. Provision a direct Slack channel between Customer's designated point-of-contact and the Decision Intel founder.
5. Host a 30-minute weekly product-feedback call, rescheduled (not cancelled) as Customer's calendar requires.
6. Host a 1-hour quarterly strategy session with the Decision Intel founder.
7. Provide early access to new Platform capabilities at least `[14]` days before the public changelog.

### 2.4 Customer Commitments

During the Design Partner Term, Customer will:

1. Pay the monthly service fee stated in §5.
2. Participate in the weekly 30-minute product-feedback call, either at the scheduled time or a reschedule within the same week.
3. Complete the monthly structured feedback form (5–10 questions) within 7 business days of receipt.
4. Provide written approval or redline feedback on the public case study draft at Month 12 within 10 business days of receipt.

## 3. Licence

### 3.1 Grant

Subject to Customer's compliance with this Agreement, Decision Intel grants Customer a non-exclusive, non-transferable, non-sublicensable licence to access and use the Platform during the Design Partner Term, for Customer's internal business purposes only.

### 3.2 Restrictions

Customer shall not (a) reverse engineer, decompile, or attempt to derive the source code of the Platform; (b) resell, sublicense, or make the Platform available to any third party; (c) use the Platform to build a competing product; or (d) remove any proprietary notices from Platform outputs.

## 4. Data

### 4.1 Customer Data

"**Customer Data**" means all strategic memos, board decks, decision records, outcomes, and related content Customer submits to the Platform. Customer retains all right, title, and interest in Customer Data.

### 4.2 No Training

Decision Intel shall NOT use Customer Data to train any machine-learning model, either its own or any third-party model. All third-party AI processors engaged by Decision Intel operate under no-training contract terms, confirmed in the DPA signed alongside this Agreement.

### 4.3 Processing

The Parties will execute a Data Processing Addendum ("**DPA**") in the form attached as **Schedule A** no later than the Effective Date. In the event of conflict between this Agreement and the DPA on any data-processing term, the DPA controls.

### 4.4 Output Data

Analysis outputs (DQI scores, bias detections, Decision Provenance Records, Decision Knowledge Graph derivatives) are Customer's property; Decision Intel retains an aggregated, de-identified statistical derivative (the "**Bias Genome Data**") for the sole purpose of improving Platform calibration. Bias Genome Data never contains raw Customer content, raw memos, or identifiable decision records.

## 5. Fees and Payment

### 5.1 Service Fee

The monthly service fee during the Design Partner Term is **$1,999 (USD)**, locked for the twelve (12) month Term (the "**Locked Rate**").

### 5.2 Commitment Fee

The first month's Service Fee (**$1,999**) is payable within five (5) business days of the Effective Date as a **commitment fee** and is non-refundable except in the case of a material breach of this Agreement by Decision Intel (see §8).

### 5.3 Billing

After the commitment fee, the Service Fee will be billed monthly in advance via `[Stripe / invoice / wire]` with payment terms of net `[15]` days.

### 5.4 Renewal

At Month 12, Customer has **first right of refusal** to renew at **$2,499/month** (the Strategy-tier list price locked for Year 2) before Decision Intel is permitted to raise the price further. Customer must exercise this right by written notice no later than thirty (30) days before the end of the Design Partner Term.

## 6. Industry Calibration

Customer may, but is not required to, provide Decision Intel with up to `[10]` historical strategic memos (redacted or otherwise) for the purpose of calibrating the toxic-combination weight matrix to Customer's industry. Any such memos are treated as Customer Data under §4 and subject to the DPA. Calibration outputs (weight adjustments) are Platform IP and do not become Customer's property; the benefit of the calibration accrues to Customer through improved audit quality on their workspace.

## 7. Publicity

### 7.1 Optional Marquee Placement

Customer may, but is not required to, authorise Decision Intel to display Customer's name and/or logo on the https://www.decision-intel.com/proof page as a design partner. Authorisation is by separate written consent and is revocable on 30 days' notice.

### 7.2 Investor Deck

Customer may, but is not required to, authorise Decision Intel to name Customer as a design partner in fundraising materials. Authorisation is by separate written consent and is revocable on 30 days' notice.

### 7.3 Case Study

At Month 12, Decision Intel will produce a draft case study describing Customer's use of the Platform. Customer retains editorial approval. If Customer declines public attribution, an anonymised version may be published with Customer's redline approval.

## 8. Term, Termination, and Exit

### 8.1 Term

This Agreement commences on the Effective Date and continues for the Design Partner Term unless terminated earlier under §8.2.

### 8.2 Termination for Cause

Either Party may terminate this Agreement on 30 days' written notice if the other Party materially breaches any term of this Agreement and fails to cure within the notice period.

### 8.3 Data Export on Exit

On termination for any reason, Decision Intel will export all Customer Data and audit outputs (including all Decision Provenance Records and the Customer's Decision Knowledge Graph) to Customer within thirty (30) days and delete the source copies within sixty (60) days (subject to legal-hold obligations). Export format: structured JSON + PDF artefacts for packets.

### 8.4 Commitment Fee Refund

If Decision Intel materially breaches this Agreement and fails to cure within the notice period in §8.2, Customer is entitled to a pro rata refund of the commitment fee.

## 9. Warranties and Limitations

### 9.1 Mutual Warranties

Each Party warrants that (a) it has full authority to enter into this Agreement; and (b) performance of this Agreement will not violate any other agreement to which it is a party.

### 9.2 Platform Warranty

Decision Intel warrants that the Platform will materially conform to the description in §2.1 during the Design Partner Term. Customer's exclusive remedy for breach of this warranty is the cure obligation in §8.2.

### 9.3 Disclaimer

Except as expressly stated in this Agreement, the Platform is provided "as is" and Decision Intel disclaims all implied warranties. **The Platform produces decision-quality analysis for informational purposes only. Decision Intel does not make the decision; Customer's own officers, boards, and counsel are responsible for the ultimate decision and its outcome.**

### 9.4 Liability Cap

Except for breaches of §3.2 (Restrictions), §4 (Data), or a Party's indemnification obligations, each Party's aggregate liability under this Agreement is capped at the total Service Fees paid by Customer in the twelve (12) months preceding the claim.

## 10. Confidentiality

Each Party will treat the other Party's non-public technical, business, and customer information as Confidential Information and will not disclose it to third parties except as required by law or under a written non-disclosure obligation at least as protective as this §10. Customer's memos and analysis outputs are also governed by §4.

## 11. Indemnification

Decision Intel will defend and indemnify Customer against third-party claims alleging that the Platform, as provided by Decision Intel, infringes a third party's intellectual property right, subject to standard SaaS exceptions (Customer modifications, unauthorised combinations, use outside this Agreement).

## 12. General

### 12.1 Governing Law

This Agreement is governed by the laws of `[ENGLAND AND WALES / DELAWARE / etc.]`, without regard to conflict-of-laws principles.

### 12.2 Dispute Resolution

The Parties will first attempt to resolve any dispute by good-faith negotiation between their respective leadership. If unresolved within 30 days, the dispute will be submitted to `[MEDIATION / ARBITRATION / COURTS]`.

### 12.3 Entire Agreement

This Agreement (together with the DPA at Schedule A) is the entire agreement between the Parties on the subject matter and supersedes all prior discussions, representations, and agreements.

### 12.4 Amendments

This Agreement may only be amended in writing, signed by authorised representatives of both Parties.

### 12.5 Assignment

Neither Party may assign this Agreement without the other's prior written consent, except to a successor in a merger or asset sale.

---

### Signatures

**DECISION INTEL LTD**

Name: `[FOUNDER NAME]`

Title: Chief Executive Officer

Date: `[DATE]`

Signature: `_______________________________`

**CUSTOMER: `[PARTNER LEGAL ENTITY NAME]`**

Name: `[SIGNATORY NAME]`

Title: `[SIGNATORY TITLE]`

Date: `[DATE]`

Signature: `_______________________________`

---

### Schedule A — Data Processing Addendum

> The DPA is a separate document. A GDPR-aligned, EU-AI-Act-ready DPA template lives at `docs/positioning/design-partner-dpa-template.md` _(to be drafted — flag in the first legal review)_. The short version: Decision Intel is Processor, Customer is Controller, sub-processors are listed and updated in the DPA, no model training on Customer Data, EU-region hosting available on request, standard Article 28 processor terms.

---

// FOUNDER NOTE — TO DO BEFORE FIRST SIGNATURE:
// 1. Form the UK Ltd (or Delaware C-Corp if structuring for US VC from Day 1).
// 2. Have a UK or DE corporate solicitor tighten this skeleton — Notion, Linear,
// and Vercel's early MSAs are all public; pattern-match before engaging.
// 3. Draft the DPA Schedule A before any partner signs.
// 4. Choose governing law based on the first partner's preference (most F500s
// will accept either UK or DE Delaware — don't fight this one).
// 5. Set up a simple redline workflow via Docusign / PandaDoc for speed.
// 6. Keep a version history of each partner's signed MSA; Year-2 pricing
// conversations will reference §5.4 verbatim.
