# Boeing / Spirit AeroSystems Re-Acquisition · Source Corpus · 2024-07

**Use this file for the manual end-to-end Decision Intel diagnostic.**

Two artefacts combined into one paste-ready corpus:
1. **Boeing's July 1, 2024 press release** announcing the $8.3B Spirit AeroSystems re-acquisition.
2. **Boeing's July 31, 2024 Q2 2024 earnings call** transcript — the Spirit-specific portions (CEO Dave Calhoun + CFO Brian West prepared remarks + the one analyst Q&A exchange that touched Spirit).

Sources verified 2026-05-01 from Boeing's investor-relations media room and the Motley Fool transcript archive. Both are public.

---

## How to run this

1. Start the dev server: `npm run dev` from project root.
2. Sign in at `localhost:3000` as your test user (or admin per `ADMIN_USER_IDS`).
3. Navigate to `/dashboard`. In the upload zone, click **"Paste text"** (one of the four doors below the upload box).
4. **Paste everything between the `--- BEGIN PASTE ---` and `--- END PASTE ---` markers below.**
5. Set document type to **"Strategic Initiative"** or **"M&A"** (M&A surfaces the cross-document conflict + structural-assumptions overlays).
6. Click **Analyze**. Start screen recording (QuickTime → File → New Screen Recording, capture the full browser).
7. Watch the SSE stream narrate the 12 pipeline nodes. Capture screenshots at each milestone (DQI reveal, biases tab, boardroom simulation, toxic combinations, reference class forecast, DPR cover).
8. Export the DPR PDF from the Export button.
9. Save the JSON outputs from the Network tab (`/api/analyze/stream` response).

Then write the assessment per the structure in the previous diagnostic plan: **what DI caught** + **what DI missed**.

---

## What to look for (advance read for what to flag during the run)

The combined corpus is unusually rich in detectable bias signals, even without hindsight:

- **Calhoun's "course correct as — made decades ago"** is verbatim escalation of commitment + sunk-cost framing on the 2005 spin-off decision.
- **"Fully unify our safety and quality management systems"** is narrative fallacy — assumes re-integration produces unification (a system property), without citing the operational mechanism by which integration produces quality.
- **"We believe this deal is in the best interest of the flying public"** is halo-effect / motivated-reasoning rhetoric — the public-interest frame substitutes for unit-economics defence.
- **30+ risk factors listed in the safe harbor** AFTER the strategic rationale is asserted, including "successful integration of Spirit," "transaction costs exceeding expectations," "management diversion from ongoing operations." This is the disclosure-vs-confidence asymmetry the regulator-hostile noise frame penalises.
- **Brian West's "we will not be shy or bashful with any investments"** is planning fallacy + overconfidence — no quantitative gate, no per-milestone budget, no deferral trigger.
- **Inside-view dominance (DI-B-022) signal**: the press release and call frame the deal as singular ("course correct," "unify," "centered on safety and quality") with no reference class. The closest analog set — re-acquisitions of previously-spun-off subsidiaries (Cisco/Linksys, Texas Instruments/Burr-Brown, GE/Avio) — have a documented cost-overrun + cultural-integration failure base rate that the rationale never engages.
- **Q&A thinness as a "forgotten questions" signal**: only ONE analyst (Seth Seifman) asked a Spirit question, and the answer was a deflection ("we look forward to closing"). What didn't get asked: integration cost ceiling, FAA antitrust position, DOJ second-look, post-737-MAX consolidation regulatory risk, union integration with Spirit's IAM-organised workforce, the Belfast / Prestwick / Subang divestitures. These are the questions a smart M&A reader catches by their absence.

The Reference Class Forecast block on the DPR cover should ideally surface re-acquisition analogs from the 143-case library. If it returns `reference_class_too_small_to_judge`, that's itself a useful gap-flag for the writeup.

---

--- BEGIN PASTE ---

# Boeing to Acquire Spirit AeroSystems
## Boeing press release · July 1, 2024

Boeing has entered into a definitive agreement to acquire Spirit AeroSystems in an all-stock transaction valued at approximately $4.7 billion in equity, or $37.25 per share. The total transaction value is approximately $8.3 billion, including Spirit's net debt.

Exchange ratio: 0.18 to 0.25 Boeing shares per Spirit share, calculated based on volume weighted average price over 15 trading days, with a floor of $149.00 and a ceiling of $206.94 per Boeing share.

## Strategic Rationale

- Demonstrates commitment to aviation safety, improves quality for Boeing Commercial Airplanes
- Leverages Boeing enterprise engineering and manufacturing capabilities
- Maintains continuity for key U.S. defense and national security programs
- Supports supply chain stability and critical manufacturing workforce
- Provides long-term value for commercial and defense customers, employees and shareholders

## CEO Statements

"We believe this deal is in the best interest of the flying public, our airline customers, the employees of Spirit and Boeing, our shareholders and the country more broadly. By reintegrating Spirit, we can fully align our commercial production systems, including our Safety and Quality Management Systems, and our workforce to the same priorities, incentives and outcomes — centered on safety and quality." — Boeing President and CEO Dave Calhoun

"We are proud of the role Boeing plays in supporting our men and women in uniform and are committed to ensuring continuity for Spirit's defense programs." — Dave Calhoun

## Transaction Scope

Boeing will acquire substantially all Boeing-related commercial operations of Spirit, plus additional commercial, defense and aftermarket operations.

Airbus SE has entered into a binding term sheet to acquire certain commercial work packages Spirit currently performs for Airbus, concurrent with Boeing-Spirit merger closing.

Spirit proposes to sell operations including those in Belfast (Northern Ireland), Prestwick (Scotland), and Subang (Malaysia).

Expected closing: mid-2025, subject to the sale of Airbus-related work packages and customary closing conditions including regulatory and shareholder approvals.

## Advisors

Lead financial advisor: PJT Partners. Additional financial advisors: Goldman Sachs & Co. LLC, Consello. Outside counsel: Sullivan & Cromwell LLP.

## Forward-Looking Statements Disclaimer

This press release contains forward-looking statements within the meaning of Section 27A of the Securities Act, Section 21E of the Exchange Act, and the Private Securities Litigation Reform Act of 1995. Words such as "expects," "believes," "may," "should," "will," "intends," "projects," "plans," "estimates," "targets," "anticipates," and similar expressions identify forward-looking statements.

Forward-looking statements address anticipated benefits and synergies, transaction completion timeline, and impacts on business and financial condition. These statements are not guarantees and are subject to risks, uncertainties, and changes difficult to predict.

Key risk factors include: timely satisfaction of closing conditions, including stockholder approval; realizing anticipated benefits and synergies in expected timeframe; successful integration of Spirit; events triggering termination rights; Spirit's ability to enter definitive agreements with Airbus and consummate related transactions; reputational risk and adverse reactions from customers, regulators, employees, or partners; transaction costs exceeding expectations; management diversion from ongoing operations; legal, regulatory, tax, and economic developments; regulatory approvals and conditions in timely manner; general economic and industry conditions; reliance on commercial airline customers; aircraft production system health and quality issues; production rates and ability to develop and certify new aircraft; budget changes and appropriation delays for U.S. government; subcontractor and supplier dependence, labor availability; labor disruptions; market competition; non-U.S. operations and sales; accounting estimate changes; mergers, acquisitions, and divestitures integration; U.S. government contract dependence; fixed-price and cost-type contract reliance; in-orbit incentive payments; information security and system access threats; business disruptions from physical security threats, IT disruptions, extreme weather, pandemics; pending litigation and government inquiries; environmental liabilities; climate change effects; credit rating actions and debt financing; pension and postretirement benefit obligations; insurance coverage adequacy; customer and aircraft concentration.

Forward-looking statements speak only as of the date made. The company assumes no obligation to update statements except as required by law.

---

# Boeing Q2 2024 Earnings Call · July 31, 2024
## Spirit AeroSystems-specific portions

### Prepared remarks · Dave Calhoun, President and CEO

"Before turning it over to Brian, let me touch on the recently announced agreement to acquire Spirit AeroSystems. This is an important shift in strategic direction, and it would course correct as — made decades ago. This planned acquisition is a very significant demonstration of our resolve to invest heavily in quality and safety and to take the additional actions needed to reshape our company. As we have said, we believe this proposed deal is in the best interest of the flying public, the best interest of our airline customers and the employees of Spirit and Boeing, and the country more broadly. By bringing critical manufacturing work back within our four walls, we can unify our safety and quality management systems and ensure our engineers and mechanics are working together as one team day in and day out."

### Prepared remarks · Brian J. West, Executive Vice President, Finance and CFO

"Before jumping into the financial results, let me take a moment on our planned acquisition of Spirit AeroSystems. On July 1, we announced a definitive agreement to acquire Spirit in an all-stock transaction worth approximately $4.7 billion with a total enterprise value of approximately $8.3 billion. As our materials indicated, we expect the transaction to close mid-2025, subject to the satisfaction of customary closing conditions, including regulatory and Spirit shareholder approvals as well as the sale of Spirit operations related to certain Airbus commercial work packages.

This agreement contemplates us acquiring substantially all Boeing-related commercial operations primarily consisting of the Wichita, Kansas, Tulsa, Oklahoma, and Dallas, Texas facilities as well as other commercial, defense, and aftermarket operations that would further augment our capabilities and offerings across the portfolio. Regarding the defense programs, we're committed to working with Spirit, its customers, and the DoD to ensure continuity in order to support these critical missions. We continue to believe that this reintegration leverages and builds on our capabilities, supports supply chain stability, integrates critical manufacturing and engineering workforces that allows for the ultimate unification of safety and quality management systems. Fully aligning to the same priorities, incentives, and outcomes — centered on safety and quality — is in the best interest of our customers, the aviation industry, and all stakeholders, including the flying public.

All of this demonstrates our ongoing commitment to aviation safety, quality, and stability."

### Analyst Q&A · the only Spirit-specific exchange

**Seth Seifman, analyst:**
"Hi. Thanks very much. Good morning. Wanted to ask on Spirit, which you mentioned on the last question. When you think about their ability to fund themselves through the close of this transaction in mid-2025, is that — are you contemplating having to — any additional action to fund Spirit through close? And then secondly, when you think about the investment plan for Boeing into Spirit when Spirit is part of Boeing, what can you tell us qualitatively or quantitatively to characterize that investment plan to prepare Spirit for the rate ramp ahead?"

**Brian J. West, CFO:**
"So I'd be careful not to speak for Spirit too much. On the other hand, they're performing well. We expect them to continue to perform well, and we've got confidence that we're going to get clean fuselages that helps coincide with our delivery schedule. So we feel pretty good about where they sit and their continued performance. So nothing there gives us any concern at the moment. And in terms of investing, we look forward to closing this acquisition. We look forward toward bringing them into the Boeing world. And we will not be shy or bashful with any investments that are needed in order for long-term stability. We feel really good about what is in front of us on that front, and we can't wait to close."

--- END PASTE ---

---

## Source verification

- Boeing official press release: [boeing.mediaroom.com/2024-07-01-Boeing-to-Acquire-Spirit-AeroSystems](https://boeing.mediaroom.com/2024-07-01-Boeing-to-Acquire-Spirit-AeroSystems)
- Boeing Q2 2024 earnings call transcript (Motley Fool, full text): [fool.com/earnings/call-transcripts/2024/07/31/boeing-ba-q2-2024-earnings-call-transcript](https://www.fool.com/earnings/call-transcripts/2024/07/31/boeing-ba-q2-2024-earnings-call-transcript/)
- Boeing investor relations Q2 2024 transcript PDF (canonical): [s2.q4cdn.com/661678649/files/doc_financials/2024/q2/2Q24-Boeing-Earnings-Call-Transcript.pdf](https://s2.q4cdn.com/661678649/files/doc_financials/2024/q2/2Q24-Boeing-Earnings-Call-Transcript.pdf)
- Spirit AeroSystems counterpart announcement: [spiritaero.com](https://www.spiritaero.com/pages/release/spirit-aerosystems-announces-acquisition-by-boeing-in-8.3-billion-transaction/)
