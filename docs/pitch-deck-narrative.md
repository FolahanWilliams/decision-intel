# Decision Intel — Pre-Seed Pitch Narrative

> The content foundation for investor conversations and pitch deck slides.
> Each section maps to a pitch deck slide.

---

## Slide 1: Title

**Decision Intel — The Cognitive Bias Audit Engine for PE/VC Investment Committees**

*"Every IC memo has 3–5 hidden biases. We find them before they cost your fund $50M."*

---

## Slide 2: The Problem

Every enterprise makes high-stakes strategic decisions: acquisitions, pricing, market entry, capital allocation, executive hiring. These decisions are made by humans carrying 188+ documented cognitive biases (Kahneman & Tversky, 1974).

**The data is damning:**

- **Only 28%** of executives say strategic decision quality in their company is "generally good." 60% say bad decisions are as frequent as good ones. *(McKinsey survey, 2,207 executives)*
- **Overconfident CEOs are 65% more likely** to make acquisitions — and systematically overpay. *(Malmendier & Tate, 2008)*
- **IT projects average 189% of original cost estimates.** 31% are cancelled outright. The sunk cost fallacy keeps the rest alive long past the point of no return. *(Standish Group CHAOS Report)*
- German utility **RWE lost over EUR 10 billion** on conventional power plants. Their CFO later acknowledged the company fell victim to status quo bias and confirmation bias "in combination." Had they stretched the investment timeline, losses could have been EUR 1–2B instead of 10B. *(McKinsey case study)*
- **AOL-Time Warner's $165B merger** was driven by executive overconfidence about digital media synergies. The combined company lost $99B in market value within 2 years.

**The current "solution" makes it worse:**

Enterprises pay McKinsey, BCG, and Bain **$500K–$2M per engagement** to pressure-test strategic thinking. These engagements take 6–12 weeks. And here's the irony: **the consultants have the same cognitive biases.** Overconfidence is "the most robust finding in the psychology of judgment" (Kahneman) — it doesn't exempt the people you hire to check for it.

**Nobody is measuring decision quality continuously.** It's the single largest unmonitored cost center in enterprise operations.

---

## Slide 3: The Solution

**Decision Intel is an AI-powered cognitive bias audit engine.** Upload any strategic document — an investment memo, board deck, strategy proposal, M&A analysis — and get a comprehensive bias audit in minutes.

**What we detect:**
- **20 cognitive bias types** with confidence scores and textual evidence (anchoring, confirmation, sunk cost, groupthink, overconfidence, availability, framing, authority, halo effect, and 11 more)
- **Decision noise** — measuring inconsistency across evaluators using a 3-judge AI jury system
- **Compliance gaps** — automated mapping to FCA Consumer Duty, SOX Section 302/404, and Basel III frameworks
- **Toxic combinations** — compound bias interactions that are exponentially more dangerous than individual biases (e.g., "Echo Chamber" = confirmation bias + authority bias + groupthink)
- **Fact verification** — claims checked against financial data (Finnhub) and web sources with Google grounding

**What makes us different from "just running an LLM":**
- 9-node AI pipeline with adversarial debate protocol — not a single prompt
- Outcome tracking that creates a data flywheel — accuracy improves with every decision tracked
- Decision knowledge graph connecting an organization's past choices to current patterns
- Team cognitive profiles showing systematic bias tendencies over time

---

## Slide 4: How It Works (Product)

**The Analysis Pipeline:**

```
Document Upload
  -> GDPR Anonymization (PII redaction gate — analysis blocked if it fails)
    -> Document Structuring (extract speakers, sections, claims)
      -> Intelligence Gathering (macro context, industry data, web grounding)
        -> 5 Parallel Analysis Nodes (fan-out):
            |-- Bias Detective (20 bias types, research-backed insights)
            |-- Noise Judge (3-judge jury, statistical variance analysis)
            |-- Verification Node (fact-check + compliance mapping)
            |-- Deep Analysis (sentiment, logic, SWOT, cognitive red-team)
            |-- Simulation (decision twin boardroom, institutional memory recall)
          -> Meta Judge (adversarial debate between all findings)
            -> Risk Scorer (calibrated score with compound adjustments)
```

**User Experience:**
1. Upload a PDF, DOCX, or TXT document
2. Watch real-time analysis stream with 12 progress steps
3. Explore results across 8 interactive tabs: Overview, Logic, SWOT, Noise, Red Team, Boardroom, Simulator, Intelligence
4. Set an outcome timeframe to track decision results
5. Over time, build a decision knowledge graph and team cognitive profile

**Key Product Screens:**
- Document detail page with bias network visualization
- Interactive decision knowledge graph (D3-powered)
- Team cognitive dashboard with trend analytics
- Toxic combination alert banners with compound risk scores

---

## Slide 5: Market

**Decision Intelligence is a $15B market today, growing to $36–50B by 2030.**

| Source | 2024 | 2030 Forecast | CAGR |
|--------|------|---------------|------|
| Grand View Research | $15.2B | $36.3B | 15.4% |
| MarketsandMarkets | $13.3B | $50.1B | 24.7% |

*(Sources: Grand View Research "Decision Intelligence Market Report"; MarketsandMarkets "Decision Intelligence Market" press release, 2024)*

**But the real opportunity is bigger.** The global management consulting market is **$300B+**. Every dollar spent on McKinsey to review a strategic decision is a dollar that could be spent on continuous, AI-powered bias detection instead. We're not competing with consulting — we're making their most expensive service 1,000x cheaper and always-on.

**Our niche within this market — cognitive bias detection in enterprise decisions — is essentially unoccupied.** Cloverpop (acquired 2023) tracks decisions but doesn't detect bias. Palantir does data analytics but not cognitive analysis. IBM Watson does broad AI but not specialized bias auditing. There is no AI-native cognitive bias audit engine.

---

## Slide 6: Competitive Landscape

| | McKinsey / BCG | Cloverpop | Palantir | Decision Intel |
|---|---|---|---|---|
| **What they do** | Manual decision review | Decision tracking | Data analytics | AI bias detection |
| **Bias detection** | Subjective, consultant-dependent | None | None | 20 types, automated |
| **Cost** | $500K–$2M / engagement | ~$50K/yr enterprise | $1M+ / yr | $499/mo per team |
| **Speed** | 6–12 weeks | N/A (tracking only) | Weeks to deploy | Minutes per document |
| **Continuous** | No — point-in-time | Yes (tracking) | Yes (analytics) | Yes (detection + tracking) |
| **Outcome flywheel** | No | Partial | No | Yes — improves with data |
| **Auditor has biases?** | Yes | N/A | N/A | No — AI doesn't have ego |

**Our positioning:** We're not a business intelligence tool. We're not a project management tool. We're the **automated version of what consulting firms charge $1M to do manually** — and we do it continuously, without the consultants' own biases contaminating the audit.

---

## Slide 7: Go-to-Market

**Wedge Vertical: Tech Companies Making Strategic Decisions**

Why tech first:
- Highest AI adoption rate — lowest sales friction
- High-frequency strategic decisions (M&A, pricing, market entry, hiring)
- VP/CSO buyer persona exists at every growth-stage and public tech company
- SOX compliance matters for public/pre-IPO companies (already built)

**Entry strategy: Top-down through warm introductions**
- Pre-seed investor network connections to tech leadership
- Advisor from Wiz (helped take Wiz public at $32B) with relationships across major tech companies
- Direct outreach to strategy and risk teams at growth-stage companies

**Expand to:**
- **Financial services** (PE, VC, investment committees) — compliance frameworks already built
- **Risk/compliance firms** (like LRQA) as channel partners — they embed our tool in their service offering, we get distribution without building a sales team

**Pricing wedge:**
- Free (3 analyses/mo) → Pro ($129/mo) → Team ($499/mo) → Enterprise (custom)
- Land with one strategist on Pro → prove ROI with outcome data → expand to team → negotiate enterprise contract

---

## Slide 8: Business Model

**SaaS subscription with usage-based tiers.**

| Metric | Value |
|--------|-------|
| API cost per analysis | ~$0.03–0.07 (Gemini Flash) |
| Pro price per analysis | ~$2.58 ($129 / 50) |
| **Gross margin** | **~97%** |
| Target SMB ACV | $6,000–$15,000/yr |
| Target Enterprise ACV | $50,000–$200,000/yr |

**Revenue drivers:**
- Per-seat expansion within organizations (Team → Enterprise)
- Usage growth as teams analyze more documents
- Outcome tracking creates lock-in — switching costs increase every month

**Unit economics at scale (Year 3 target):**
- 500 paying teams x $10K avg ACV = $5M ARR
- 50 enterprise accounts x $100K avg ACV = $5M ARR
- **Combined: $10M ARR target at 36-month mark**

---

## Slide 9: Traction & Validation

**Product:**
- Working product deployed at production URL
- 9-node AI pipeline processing real documents end-to-end
- 233 automated tests, all passing
- Full auth (Google OAuth), multi-tenant organizations, team collaboration
- Compliance frameworks (FCA, SOX, Basel III) fully implemented
- Slack integration with OAuth flow and encrypted token storage

**Validation:**
- Reviewed by senior consultant who helped take Wiz public ($32B valuation) — "genuinely fascinated by the role of unconscious cognitive biases in decision-making"
- LRQA executive (global risk management firm) review in progress
- Product demonstrated to multiple industry professionals with strong positive reception

**Technical milestones:**
- LangGraph pipeline with adversarial debate protocol
- Toxic combination detection engine (compound bias interactions)
- Decision knowledge graph with learned edge weights
- Team cognitive profiling system
- GDPR anonymization gate (privacy-first architecture)

---

## Slide 10: The Moat

**Four layers of defensibility that compound over time:**

**1. Technical Complexity (Day 1 moat)**
A 9-node LangGraph pipeline with GDPR gating, adversarial debate, compound scoring, and causal analysis. This isn't a ChatGPT wrapper — it's a purpose-built cognitive analysis engine. Replicating the architecture takes months; getting the prompt engineering and node interactions right takes much longer.

**2. Data Flywheel (Month 6+ moat)**
Every decision outcome reported by users improves our scoring accuracy. Over time, we build the world's largest dataset of "decision → bias profile → outcome" triples. This calibration data is proprietary and irreplicable — nobody else is collecting it.

**3. Network Effects (Month 12+ moat)**
The decision knowledge graph connects every analysis within an organization. As density increases, the graph reveals systemic patterns: "Your M&A team shows anchoring bias 3x more than industry average" or "Decisions made on Mondays score 12% lower on noise." More decisions = more connections = more insight = more value.

**4. Switching Cost (Month 6+ moat)**
After 6 months of outcome tracking, calibration profiles, and decision graph data, moving to a competitor means abandoning all historical context. The tool becomes more valuable the longer you use it — classic enterprise lock-in, but earned through genuine value creation.

---

## Slide 11: Team

**[Founder Name] — Founder & CEO**

16-year-old founder from Nigeria. Built the entire Decision Intel platform solo — from the 9-node AI pipeline to the interactive D3 visualizations to the Slack OAuth integration to the compliance mapping engine.

Background in AP Psychology with deep self-directed study in behavioral economics (Kahneman, Thaler, Ariely), cognitive science, and enterprise software architecture.

**The founder story:**

*"If a 16-year-old from Nigeria can see that enterprises are bleeding millions from cognitive bias — and nobody else is building the automated tool to fix it — that tells you two things: the blind spot is real, and the opportunity is massive. Now imagine what happens with a full team and real resources behind this."*

**Advisory Network:**
- Senior consultant who helped take Wiz public at $32B — providing go-to-market guidance and tech industry introductions
- LRQA executive (global risk management) — validating enterprise risk/compliance use case
- [Additional advisors to be formalized post-raise]

---

## Slide 12: The Ask

**Raising: $[X] in pre-seed funding**

**Use of funds (18-month runway):**

| Allocation | % | Purpose |
|-----------|---|---------|
| Engineering | 40% | ML engineer (calibration flywheel), backend engineer |
| Go-to-Market | 30% | GTM lead, initial enterprise sales motions |
| Product | 15% | Designer, UX research with design partners |
| Operations | 15% | Infrastructure, legal, compliance certifications |

**12-month milestones:**
1. 10 paying teams on Pro/Team plans
2. 3 enterprise design partners (co-development)
3. Launch ML-powered calibration pipeline (outcome data → improved scoring)
4. SOC 2 Type I certification (enterprise sales requirement)
5. First channel partnership (risk/compliance firm)

**The vision:**

Decision Intel is the **category-defining company in cognitive bias auditing** — the "Grammarly for strategic decisions." Every enterprise will eventually audit their decisions for cognitive bias, just as they audit their finances, their code, and their security. We're building the tool that makes that possible.

---

## Appendix: Research Citations

1. **Kahneman, D., Lovallo, D., & Sibony, O. (2011).** "Before You Make That Big Decision." *Harvard Business Review*, 89(6), 50–60.
2. **Lovallo, D. & Sibony, O. (2010).** "The Case for Behavioral Strategy." *McKinsey Quarterly*.
3. **McKinsey & Company.** "Biases in Decision-Making: A Guide for CFOs." *McKinsey Strategy & Corporate Finance*.
4. **Malmendier, U. & Tate, G. (2008).** "Who Makes Acquisitions? CEO Overconfidence and the Market's Reaction." *Journal of Financial Economics*, 89(1), 20–43.
5. **Roll, R. (1986).** "The Hubris Hypothesis of Corporate Takeovers." *Journal of Business*, 59(2), 197–216.
6. **Standish Group.** "CHAOS Report." — IT project success/failure statistics.
7. **Grand View Research (2024).** "Decision Intelligence Market Size, Share & Trends Analysis Report."
8. **MarketsandMarkets (2024).** "Decision Intelligence Market worth $50.1 billion by 2030."
9. **Arkes, H.R. & Blumer, C. (1985).** "The Psychology of Sunk Cost." *Organizational Behavior and Human Decision Processes*, 35(1), 124–140.
10. **Kahneman, D. & Tversky, A. (1974).** "Judgment Under Uncertainty: Heuristics and Biases." *Science*, 185(4157), 1124–1131.

---

## Appendix: Competitive Comparison (Detailed)

### Cloverpop
- Founded 2012, raised $12.6M, acquired by Clearbox Decisions (June 2023)
- Focus: Decision tracking and workflow, not bias detection
- "Decision Playbooks" and "Decision Flows" — process tools, not AI analysis
- No cognitive bias detection, no noise analysis, no compliance mapping
- Ranked #608 on 2025 Inc. 5000

### Palantir Foundry
- $1M+/year enterprise contracts
- General-purpose data analytics and operations platform
- No cognitive bias detection capability
- Not positioned as a decision quality tool

### IBM watsonx
- Broad AI/ML platform with governance features
- No specialized cognitive bias detection
- Enterprise sales cycle: 6–18 months
- Pricing starts at $100K+/year

### Traditional Consulting (McKinsey, BCG, Bain)
- $500K–$2M per strategic review engagement
- 6–12 week delivery timelines
- Manual process dependent on individual consultant quality
- Point-in-time deliverable — no continuous monitoring
- Consultants carry their own cognitive biases into the analysis
