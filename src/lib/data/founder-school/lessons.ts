/**
 * Founder School — 7 tracks × 7 lessons, tuned specifically to Decision Intel
 * and Folahan Williams (16-year-old solo founder, pre-revenue, targeting enterprise).
 */

export interface Lesson {
  id: string;
  order: number;
  title: string;
  readTime: string;
  summary: string;
  insight: string;
  whyItMatters: string;
  action: string;
  reflection: string;
  /** Primary-source references (books, papers, authors). Optional —
   *  Platform Foundations lessons carry these so the founder can read the
   *  canonical research behind their own product. */
  sources?: Array<{
    label: string;
    detail?: string;
  }>;
  /** The 60-second pitch to a Chief Strategy Officer. Short, confident,
   *  pain-focused. Optional — populated on methodology + GTM lessons. */
  csoPitch?: string;
  /** The 60-second pitch to an M&A team (deal partners / senior analysts).
   *  Framed in IC/committee-prep and due-diligence vocabulary. */
  mnaPitch?: string;
  /** The 60-second pitch to a corporate strategy group (PMO / strategy-ops
   *  lead / head of strategic planning). Framed as a recurring hygiene
   *  step inside the strategic-review cadence. */
  corpStrategyPitch?: string;
  /** The 60-second pitch to a VC. Short, confident, moat-focused.
   *  Optional — populated on methodology + GTM lessons. */
  vcPitch?: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  lessons: Lesson[];
}

export const TRACKS: Track[] = [
  {
    id: 'enterprise_sales',
    title: 'Enterprise Sales',
    description: 'Close your first B2B deal without a sales team',
    color: '#16A34A',
    emoji: '🤝',
    lessons: [
      {
        id: 'es_1',
        order: 1,
        title: 'Enterprise Sales Is Change Management',
        readTime: '3 min',
        summary:
          "You're not selling software — you're asking an org to change how it makes decisions.",
        insight:
          "Enterprise deals take 6–18 months not because decisions are hard, but because you're proposing organizational behavior change. Decision Intel doesn't replace a tool — it introduces a process that never existed. Understanding this flips your entire approach: your job isn't to convince individuals, it's to build organizational momentum toward a new behavior.",
        whyItMatters:
          "Most prospects have never audited their strategic process before. You're not competing with another vendor — you're competing with \"doing nothing.\" Frame every conversation around the cost of inaction, not your product's features.",
        action:
          'Reframe your next outreach pitch: replace "here\'s what our product does" with "here\'s what changes for your team when strategic decisions are audited." Write this new framing today.',
        reflection:
          'What specific organizational behavior does Decision Intel change at your top target company?',
        csoPitch:
          "You don't have a process for auditing your own strategic memos before they reach the board, because three years ago it wasn't technically possible. LLMs couldn't read a 40-page market-entry recommendation, flag the confirmation-bias paragraph, and surface the five objections your steering committee will raise. Now they can. Decision Intel isn't replacing anything in your stack — it's adding the 60-second audit layer that happens between your analyst and the committee. One behavioural change: every board-bound memo gets run through DI before it leaves the desk. Everything compounding on top of that — the Decision Knowledge Graph, the DQI trend, the recalibrated case library — happens automatically.",
        mnaPitch:
          'The diligence memos your team writes for IC are where DI earns its keep. Before a deal thesis reaches the partners, it runs through DI: confirmation bias, overconfidence, sunk-cost anchoring, base-rate neglect — each flagged with the exact sentence it lives in, and each carrying a historical exemplar from our 135-case library. Your deal team can say "we hit the same pattern Nortel did on Nokia-Siemens" with evidence, not analogy. You\'re not slowing deals down — you\'re removing the category of post-close partner question that starts with "why didn\'t we see that in Q3?"',
        corpStrategyPitch:
          "Your strategy function ships 40-60 recommendations a year. Each one survives or dies inside the steering committee — and the variance isn't in the data; it's in which biases the memo author didn't catch themselves. DI is the missing hygiene step: every memo gets audited for the specific decision-failure patterns your organisation has produced before. Not a new meeting, not a new dashboard, not a new workflow — a 60-second pass that happens before the committee pack is finalised. Over 12 months it compounds into a Decision Knowledge Graph your CEO can ask questions of.",
        vcPitch:
          "The interesting thing about enterprise strategy software isn't that it takes 6-18 months — it's that the decision to buy requires the organisation to admit they don't currently have this capability. Nobody has a process for auditing their own strategic memos because three years ago it wasn't technically feasible. That makes this a category-creation sale, not a displacement sale: no incumbent, no competitive RFP, and the longer we're in market defining the category, the more expensive it becomes for anyone else to enter. At pre-seed our moat is time-in-market, not just tech.",
      },
      {
        id: 'es_2',
        order: 2,
        title: 'Find Your Champion',
        readTime: '3 min',
        summary:
          "Every enterprise deal needs an internal ally who fights for you when you're not in the room.",
        insight:
          "The champion is not the economic buyer and not the end user — they're the person who wants to win internally by bringing Decision Intel to their team. They do the selling for you in internal meetings you'll never attend. Without a champion, you're just another vendor in a procurement queue.",
        whyItMatters:
          'For Decision Intel, your champion is likely a VP of Strategy or a senior M&A analyst — someone who has personally experienced a decision go wrong and sees auditing as their competitive advantage internally.',
        action:
          "For each prospect in your pipeline, name your champion specifically. If you can't name a person, finding one is your next task before any other sales activity.",
        reflection:
          'What does your champion gain internally by championing Decision Intel? How does it make them look to their boss?',
        csoPitch:
          "I'll be direct — I'm not selling to you initially. I'm selling to your VP of Strategy or Director-level, the person who's already watched one memo land badly in front of the board and felt the asymmetry: the analyst gets blamed, you have to rebuild trust. That person wants DI because running the audit makes them the adult in the room on every recommendation. They bring me in; you approve. Economic buyer is you; champion is them. Both roles have to be right for this to close — if you approve without a champion who lives in the workflow, it becomes shelfware inside six months.",
        mnaPitch:
          "Your champion is almost always a senior associate or VP who has personally worked on a deal that blew up, and who can now name the exact bias that drove the miss. They don't hold budget, but they hold credibility. When they walk into your office and say \"this would have caught the Nortel analogue on that Q3 deal,\" you listen because they lived it. Without that internal narrator I'm just another vendor the deal team doesn't have time to evaluate — the champion is the oxygen in this sale.",
        corpStrategyPitch:
          'In corporate strategy teams, the champion is usually a strategy-ops lead or PMO director — someone who owns the process around strategic reviews and wants more rigour, not less. They sit through every board pack and wince when a recommendation lands without supporting evidence. They bring DI to the CSO as a "quality gate," not as a tool — that framing is what gets it budgeted. Pitch DI as the piece of infrastructure that makes strategic-review cadence feel defensible, and you\'ll close faster than if you sell it as features.',
        vcPitch:
          "The champion model is why bottom-up enterprise GTM works at all. Every target org has someone who has felt the pain but can't name the category — when they see DI, they name it instantly. Our job isn't to find 500 buyers; it's to find 20 champions in the right ICPs who become our internal narrators. Each champion unlocks an org, each org becomes a published case study, and each case study finds the next 20 champions. That's the distribution flywheel — cheaper than outbound, more defensible than paid.",
      },
      {
        id: 'es_3',
        order: 3,
        title: 'Economic Buyer vs. Champion',
        readTime: '3 min',
        summary: 'Confusing who loves you with who signs the check kills deals.',
        insight:
          "The champion loves you. The economic buyer has never heard of you and holds the budget. Founders waste months selling to the wrong person. You need both, but the path is champion first, then economic buyer introduction. Never try to go around your champion to the economic buyer — you'll lose both.",
        whyItMatters:
          "For Decision Intel, the economic buyer is typically a CSO, COO, or whoever owns the strategic planning budget — not the analyst who runs the audits. Know which conversations you're having with which person.",
        action:
          'For your top 3 prospects, write: (1) champion name and title, (2) economic buyer role, (3) your plan to get from champion to economic buyer introduction.',
        reflection:
          'What\'s the specific conversation that moves a deal from "champion loves us" to "economic buyer approved"?',
        csoPitch:
          "Let me be honest about the buying motion: you don't need to love this tool. Your VP of Strategy does. You need to trust her judgement, see the evidence pack she's built, and approve the budget — that's the relationship this software has to your office. If I try to sell directly to you and skip the person who actually uses it, we end up with shelfware. The champion uses it every week; you fund it once a year; the metric that moves is the DQI trend she shows you at quarterly reviews.",
        mnaPitch:
          'In M&A, the champion is your senior analyst or VP; the economic buyer is the managing director or the partner holding deal-support budget. The champion never says "buy this" — she says "the last three deals we lost, DI would have surfaced the root-cause bias pre-IC, here\'s the pattern match against our case library." That\'s the evidence the MD needs. The check-signing conversation happens once; the champion-loved conversation is what gets you there. Skip the champion layer and the MD will politely ask you to "come back after we\'ve heard from the team" — which is where deals quietly die.',
        corpStrategyPitch:
          "In a corporate strategy group, the economic buyer is typically the CSO or COO, depending on where strategic planning reports. The champion is the strategy lead or PMO owner of the review cadence. The critical thing founders get wrong: they pitch straight to the CSO, get a polite \"we'll take a look,\" and nothing happens. The CSO isn't saying no — they're saying \"I can't evaluate this without the person who'll use it.\" Champion first. Economic buyer second. In that order, enterprise strategy deals close in 60-90 days; inverted, they take 18 months and usually die.",
        vcPitch:
          "The champion-then-economic-buyer motion is what makes enterprise CAC defensible. We're not running outbound to CSOs — we're running content and product at the analyst layer who becomes the champion, and letting them sell up. That's why content-led GTM (Bias Genome, case studies, LinkedIn founder voice) works for us: the champion finds us through research, not a pitch. By the time the economic-buyer conversation happens, the deal is already championed internally. Our blended CAC at scale is projected to land well under $3K per seat — unusual for enterprise strategy software, and it's a direct consequence of this motion.",
      },
      {
        id: 'es_4',
        order: 4,
        title: 'The Discovery Call That Closes',
        readTime: '3 min',
        summary: 'The best first calls are 80% questions, 20% positioning.',
        insight:
          'Most founders run pitch calls disguised as discovery calls. Great discovery surfaces the cost of inaction so clearly that prospects talk themselves into the deal. The key: questions that reveal the organizational pain. "What happens to your deal pipeline if a major acquisition thesis turns out to be driven by bias?" That question closes deals.',
        whyItMatters:
          "Decision Intel's core insight — that cognitive bias corrupts strategic decisions — is most powerful when the prospect articulates it themselves. Your job is to ask questions that lead them there.",
        action:
          'Write 5 discovery questions that would make a CSO visibly uncomfortable — but also have a natural answer that points toward Decision Intel. Test them on your advisor.',
        reflection:
          "What's the most uncomfortable question you could ask a prospect that they'd still want to answer?",
        csoPitch:
          "I want to understand your team before I talk about our tool. Walk me through the last strategic memo that landed badly in front of your board — not to relitigate it, just to understand what your process looked like the week before. What did the analyst believe was the weakest assumption? Did it survive into the final memo? Was the dissenting voice represented? Most CSOs I talk to can name the exact paragraph that went wrong in hindsight — and they can also name the moment in their review cadence where it should have been caught. That moment is what we build around.",
        mnaPitch:
          'Before you tell me about your deal process, tell me about the last thesis that turned out wrong in Year 2. What bias do you think dominated the diligence? Was there a dissenting associate? Did the committee hear them? These aren\'t gotcha questions — I need to understand how IC memos get pressure-tested at your firm today so I know whether DI slots in upstream of IC or replaces a step entirely. The firms where we land fastest are the ones where the answer is "honestly, the pressure-test is the MD\'s instincts" — and they know it.',
        corpStrategyPitch:
          "Walk me through your strategic-review cadence — not the slide template, the actual conversation. When a recommendation goes in, who argues against it? Is there a written dissent? Is there a quality bar the memo has to clear before the committee pack is finalised? Most corporate strategy groups I talk to have a polished output process and a completely tacit quality process — and the gap is where bad calls slip through. I'm trying to locate that gap in your specific cadence so I know whether DI becomes a pre-committee hygiene step or a CSO-office audit.",
        vcPitch:
          "Enterprise discovery should feel like a good therapist, not a sales pitch. The best founders in our category run discovery that surfaces cost-of-inaction so clearly the prospect sells themselves — and that only happens when the questions target the moment of pain, not the feature list. Our discovery playbook is five questions, each tested against our advisor network, and each one forces the prospect to name a memo that went wrong. The close rate on calls that answer those five honestly is dramatically higher than the close rate on calls that drift into our feature matrix.",
      },
      {
        id: 'es_5',
        order: 5,
        title: 'The Proposal That Gets Approved Internally',
        readTime: '3 min',
        summary:
          "Enterprise proposals aren't for your champion — they're for the approval chain above them.",
        insight:
          "Your champion uses your proposal to justify the budget to people who've never met you. It must answer in plain language: What problem are we solving? What's the cost without this? What does success look like at month 6? What's the risk of doing nothing? Clear answer to all four and procurement becomes a formality.",
        whyItMatters:
          'For a design partner proposal, include: your 6-month commitment structure, 3 specific deliverables (weekly audit sessions, roadmap input, case study), the $2K/month investment, and one reference from your Wiz advisor network.',
        action:
          "Draft a 1-page design partner proposal template this week. Have your Wiz advisor review it — they've seen hundreds of enterprise proposals from the other side.",
        reflection:
          'Who besides your champion will read this proposal, and what does each person need to see to say yes?',
        csoPitch:
          "The proposal isn't for you or me — it's for the four people above you who have never met me and will each spend ninety seconds deciding whether this is a yes. CFO wants to see cost justification and a budget line, not our 12-node pipeline. Legal wants the DPA and the MSA, not our bias taxonomy. Procurement wants the security FAQ, not our research citations. Your audit committee wants the board-ready export, not our per-bias severity breakdown. One page, four answers, in the order they read.",
        mnaPitch:
          'The thing that kills pilot approvals inside M&A firms is a proposal that reads like a tool spec instead of a business case. Your MD doesn\'t want our product deck — she wants "what\'s the 6-month success criteria, what does it cost against the budget line, and what\'s the reference?" We ship a proposal template that leads with your firm-specific case library: three deals from the last 5 years where DI would have flagged the dominant bias pre-IC. You hand that to the MD and the question becomes "why didn\'t we have this three years ago," not "what is this."',
        corpStrategyPitch:
          'Corporate strategy proposals die in CFO review, not in CSO review. The CFO reads three things: what does it cost, what\'s the budget line, and what\'s the comparable spend. We give you a one-pager that benchmarks DI against the alternative — the Q4 where a recommendation landed badly, estimated cost of the cycle lost, and DI\'s annualised cost as a fraction of that. The frame is "this is the insurance premium on strategic-planning cadence," not "this is a new tool."',
        vcPitch:
          "The design-partner proposal is a distribution asset. Once we ship it, every champion we've landed can quietly pass it up their approval chain, and the approval chain reads the same document we handed the champion. That consistency is what lets a 16-year-old solo founder run enterprise sales — the document does the explaining in rooms the founder isn't in. It's why our close rates from first call to signed DP agreement outperform most pre-seed enterprise startups: the proposal is pre-approved to read correctly at every level above the champion.",
      },
      {
        id: 'es_6',
        order: 6,
        title: 'Navigating Procurement Without Dying',
        readTime: '3 min',
        summary: "Procurement is where deals go to die — unless you've prepared in advance.",
        insight:
          "Most founders are blindsided by procurement. Once you're compliant, deals close in days not months. Before your first pilot conversation: have a draft MSA ready (use YC's template), accept standard security questionnaires, prepare a data processing agreement. Don't wait for a prospect to ask — proactively share your security posture.",
        whyItMatters:
          'Enterprise security teams will ask about data handling for documents uploaded to Decision Intel. You need clear answers: documents are encrypted at rest, not used for training, deleted per customer schedule. Prepare this now.',
        action:
          'Draft a one-page "Security & Data Handling" FAQ for Decision Intel. This becomes your standard procurement response. Run it past a legal-minded advisor before sharing.',
        reflection:
          "What question would a $1B company's procurement team ask about Decision Intel that you're not prepared to answer today?",
      },
      {
        id: 'es_7',
        order: 7,
        title: 'Design Partner vs. Free Trial',
        readTime: '3 min',
        summary:
          'Free trials have 0% commitment. Design partnerships convert at dramatically higher rates.',
        insight:
          'A design partnership is: they pay ($500–$2K/month), they commit to 6 weekly sessions, they give feedback that shapes the roadmap, they become a case study. The payment is not about revenue — it\'s about commitment. Unpaid pilots almost never convert. The framing: "We\'re co-building this together, not just giving you free access."',
        whyItMatters:
          "Your first 3 design partners are Decision Intel's most valuable asset — not for revenue, but for the case studies, testimonials, and referrals they generate. Choose them carefully. Prioritize companies where a failed decision would be highly visible.",
        action:
          'Write your 5-sentence design partner pitch. Practice it out loud until it takes under 3 minutes and feels natural. The ask should come naturally at the end, not feel like a sales close.',
        reflection:
          'What outcome would a design partner need to see by month 3 to feel like this was worth their time and money?',
        csoPitch:
          "I'm not selling you a subscription; I'm asking you to co-build the category. Five strategy offices will shape Decision Intel over the next six months — unlimited audits, weekly working sessions with me, guaranteed roadmap input, and your office becomes one of the three published reference cases. £2K/month, six-month term, case-study consent. I'm deliberately not calling it a pilot — pilots are about proving a vendor. This is you helping me define the shape of decision-quality auditing before the rest of the market gets to.",
        mnaPitch:
          'This is a design partnership, not a pilot. Five M&A firms will shape what DI looks like for deal work through Q4 — unlimited audits on live and historical theses, weekly working sessions to stress-test your diligence, roadmap input on every feature that touches IC flow, and a published case study once you\'re through three confirmed outcomes. £2K/mo, six months, case-study consent. What you get isn\'t software access — it\'s the chance to tell every other M&A buyer what auditing a thesis should look like. The firms that join now set the template.',
        corpStrategyPitch:
          "Five corporate strategy groups will define what DI looks like inside the strategic-review cadence. The offer: unlimited audits on every recommendation you put through committee for six months, weekly co-build sessions with me, guaranteed roadmap input, and a published case study at month six once you can point to measurable decision-quality lift. £2K/month, case-study consent, six-month commitment. Why £2K and not free: free pilots get deprioritised the second a quarter-end hits. Paid design partners get the founder on speed-dial.",
        vcPitch:
          "Design partners are how we compound GTM without an SDR team. £2K/month is sub-procurement at every target ICP and creates 10× the engagement of a free pilot — paid partners show up to weekly calls, give feedback, tell peers. Each partnership yields a published case study in month 6, and each case study is a distribution asset that finds the next champion. Our target: 5 design partners by end of Q3, 3 published references by Q4, first priced Enterprise contract by Q1 the year after. That's the ladder to Seed.",
      },
    ],
  },
  {
    id: 'fundraising',
    title: 'Fundraising',
    description: 'Raise pre-seed capital from a position of strength',
    color: '#7C3AED',
    emoji: '💰',
    lessons: [
      {
        id: 'fr_1',
        order: 1,
        title: 'Pre-Seed Is a Bet on You',
        readTime: '3 min',
        summary:
          "At pre-seed, investors aren't buying a product — they're buying a lottery ticket on a person.",
        insight:
          'Pre-seed is signal, not validation. Investors are betting on: (1) exceptional founder insight, (2) execution speed, (3) an unfair advantage that makes you the right person for this. You are 16, building in Nigeria, advised by someone who scaled Wiz to $32B. That combination is genuinely rare and worth leading with.',
        whyItMatters:
          "Decision Intel's fundability argument: exceptional founder (youngest in any comparable cohort), real problem ($200M acquisitions fail partly due to cognitive bias), proprietary approach (12-node LangGraph pipeline on Gemini with Claude fallback), and ~90% blended gross margins that hold up through diligence.",
        action:
          "Write your 3-sentence investor thesis from the investor's perspective: \"We are betting on X because Y and the downside is Z.\" Read it aloud. If you're not excited by it, investors won't be either.",
        reflection:
          'What would make you pass on Decision Intel if you were a rational investor who had seen 500 pre-seed decks?',
      },
      {
        id: 'fr_2',
        order: 2,
        title: 'What Investors Actually Look For',
        readTime: '3 min',
        summary:
          'Three signals that move pre-seed investors: domain insight, execution speed, unfair advantage.',
        insight:
          "Obsessive domain insight means you understand decision quality better than people 3x your age who've studied it. Execution speed means you ship in days what funded teams ship in months. Unfair advantage means something about your situation that cannot be replicated — your Wiz advisor relationship is that thing for Decision Intel.",
        whyItMatters:
          "Your advisor helped take Wiz from 0 to $32B. That's the strongest possible signal on enterprise GTM for a pre-seed company in your space. Name them in your pitch (with their permission). A warm intro from them to a pre-seed investor is worth 100 cold emails.",
        action:
          "List your 3 non-obvious unfair advantages. If anyone could claim them, they're not unfair. Pressure-test this list with your advisor.",
        reflection:
          "What's the one thing about Decision Intel that a 35-year-old founder with an MBA at a well-funded startup couldn't replicate?",
      },
      {
        id: 'fr_3',
        order: 3,
        title: 'The Fundraising Narrative',
        readTime: '3 min',
        summary:
          "The best fundraising story: problem no one has solved, you're the ones who can, why now.",
        insight:
          "Decision Intel's narrative: \"Enterprise strategy teams make billion-dollar decisions using cognitive processes riddled with bias. No software audits for this in real-time — Cloverpop tracks decisions after the fact; we detect flaws before they're made. AI now makes this fast enough to be useful. We're the first and only company built specifically for this problem.\" That's 4 sentences. Less is more.",
        whyItMatters:
          "The \"why now\" is your most important slide. What's true today that wasn't 3 years ago? LLMs can read and reason about strategic documents in seconds at $0.07 per analysis. That's new. Lead with it.",
        action:
          "Record yourself delivering this 90-second narrative on your phone. Listen back. Cut anything that doesn't land. Repeat until it sounds like conversation, not a pitch.",
        reflection:
          'What\'s the single sharpest version of your "why now" — the one thing that makes Decision Intel possible today that wasn\'t possible before?',
      },
      {
        id: 'fr_4',
        order: 4,
        title: "Projections That Don't Make You Look Naive",
        readTime: '3 min',
        summary:
          "Investors know your numbers are made up. They're checking if your logic is sound.",
        insight:
          "Don't project 100 enterprise deals in Year 1. Project 3 design partners at $2K/month, 1 paid pilot at $8K/month, ending Year 1 at $36K ARR — believable and impressive for pre-seed. What investors want to see: do you understand unit economics, is your burn plan reasonable, does your growth model make sense?",
        whyItMatters:
          "At ~90% blended gross margin and 10% churn, Decision Intel's LTV:CAC ratio is still exceptional — even with high acquisition costs. Know your unit economics cold — this is the conversation that separates founders who understand their business from those who don't.",
        action:
          "Build a 3-year monthly model in Google Sheets. Bear case, base case, bull case. Share with your Wiz advisor before any investor meeting — they've seen what real enterprise growth looks like.",
        reflection:
          "What's the most optimistic assumption in your current financial model, and what would make it true?",
      },
      {
        id: 'fr_5',
        order: 5,
        title: 'Running a Tight Process',
        readTime: '3 min',
        summary: 'Spray and pray fails. Velocity and warm intros close rounds.',
        insight:
          'Build a tier-1 list of 15–20 investors: Africa/emerging tech focus, B2B SaaS pre-seed, AI infrastructure. Warm intro >> cold email by 10x. Run 10 meetings in 2 weeks to create perceived momentum ("we\'re getting a lot of interest"). Update your deck between batches. Get a term sheet before you feel like you need one.',
        whyItMatters:
          'Your Wiz advisor likely knows pre-seed investors who back enterprise AI. That\'s your first conversation: "Who are the 3 investors you\'d trust to back Decision Intel at pre-seed?" Have you asked this directly?',
        action:
          'Build your investor target list this week. 15 names, warm intro path for each. Ask your advisor for 3 introductions to start.',
        reflection:
          "Who is the one investor that, if they led your round, would be the strongest signal to every other investor you're targeting?",
      },
      {
        id: 'fr_6',
        order: 6,
        title: 'The 5 Terms That Actually Matter',
        readTime: '3 min',
        summary:
          'Understand these before you sign anything: valuation cap, pro-rata, board seats, information rights, SAFE vs. priced.',
        insight:
          'At pre-seed: $3–6M post-money SAFE cap is normal for Africa-based AI startups, higher with strong US investor signals. No board seats at pre-seed (observer at most). SAFE is simpler and standard — avoid priced rounds until Seed. Pro-rata rights let investors maintain their stake in future rounds — give them only to investors who will actually exercise.',
        whyItMatters:
          'Nigeria-incorporated companies often need a Delaware C-Corp holding entity for US investors. Set this up before term sheet conversations start — it delays deals by weeks if you do it after.',
        action:
          "Read the YC Simple Agreement for Future Equity (SAFE) template. Understand every clause before any investor conversation. Identify 2–3 terms you'd need legal advice on.",
        reflection:
          "What's the one term that, if an investor demanded it, you'd walk away from the deal?",
      },
      {
        id: 'fr_7',
        order: 7,
        title: 'Due Diligence: Prepare Now',
        readTime: '3 min',
        summary:
          'Diligence should take days, not weeks. Prepare your folder before any term sheet.',
        insight:
          "Standard pre-seed diligence: clean GitHub repo with clear README, working demo that doesn't break, reference list (your Wiz advisor, any beta users), cap table (just you right now), incorporation documents. Investors move fast when diligence is painless — and drag their feet when it's not.",
        whyItMatters:
          "Decision Intel's biggest diligence question will likely be: can a 16-year-old close enterprise deals? Your answer: advisor network provides enterprise access, design partner process de-risks it, and here are the specific companies we're targeting with warm intros.",
        action:
          "Create a diligence folder today: GitHub link, 5-minute demo video, advisor bios, cap table, incorporation docs. Treat the process of assembling it as an audit of your company's state.",
        reflection:
          "What's the one thing an investor would find in due diligence that you'd want to have fixed before they looked?",
      },
    ],
  },
  {
    id: 'brand_distribution',
    title: 'Brand & Distribution',
    description: 'Build trust and distribution before product-market fit',
    color: '#F59E0B',
    emoji: '📡',
    lessons: [
      {
        id: 'bd_1',
        order: 1,
        title: 'Distribution Beats Product',
        readTime: '3 min',
        summary:
          'Anyone can build a great product. The founders who win are those who build distribution.',
        insight:
          'Andy Rachleff: "If you address a market that really wants your product — even with a terrible product — you\'ll do well. But great product without distribution fails." Your Wiz advisor built a $32B company by becoming impossible to ignore in enterprise security before the sales conversation even started. Every CISO knew Wiz before they were approached. That\'s your model for decision quality.',
        whyItMatters:
          'Decision Intel needs CSOs to hear "decision bias auditing" and immediately think of you. This is a 12–24 month content game. But the earlier you start, the bigger the compounding advantage. You have time. Most founders don\'t start this until it\'s too late.',
        action:
          "Name one person in your ICP who already follows you on LinkedIn. If you can't name one, that's the gap you're solving starting today.",
        reflection:
          'What does it look like to be "known" in the decision quality space? Who specifically would you need to know you for that to be true?',
      },
      {
        id: 'bd_2',
        order: 2,
        title: 'The Trust Equation',
        readTime: '3 min',
        summary:
          'Trust = (Credibility + Reliability + Intimacy) / Self-Orientation. Most founder content fails on self-orientation.',
        insight:
          'David Maister\'s formula breaks down: credibility is what you know, reliability is showing up consistently, intimacy is personal/vulnerable content that reveals real thinking, self-orientation is content that\'s about you rather than the reader. Most startup content fails because self-orientation is too high. "Look what we built" vs. "Here\'s what I learned about how executives destroy value through anchoring bias."',
        whyItMatters:
          "Your age is actually a trust asset — not a liability — if framed right. A 16-year-old who understands cognitive bias better than most MBAs is credible AND intimate. It's a story people want to follow.",
        action:
          'Audit your last 5 LinkedIn posts. Rate each 1–5 on self-orientation (5 = entirely about you/your company). Cut the highest-scoring one from your next plan.',
        reflection:
          'Which of the four trust levers — credibility, reliability, intimacy, low self-orientation — needs the most work in your content right now?',
      },
      {
        id: 'bd_3',
        order: 3,
        title: 'Own a Mental Category',
        readTime: '3 min',
        summary:
          'Marketing is a battle of perceptions. Decision Intel needs to own "decision quality" the way Wiz owns "cloud security."',
        insight:
          'Al Ries and Jack Trout: "Marketing isn\'t a battle of products — it\'s a battle of perceptions." The goal is that every time your ICP hears "decision bias" or "cognitive audit," they think Decision Intel. Every piece of content, every talk, every case study should reinforce the same frame. Consistency over 18 months builds a category.',
        whyItMatters:
          "You have a structural advantage: Decision Intel is the category creator. You don't have to differentiate from competitors — you have to make the category real. Every Cloverpop or generic decision-tracking tool accidentally validates your market when you're positioned correctly.",
        action:
          'Write a 10-word positioning statement for Decision Intel. Test: does it immediately communicate category and differentiation? Try it on 5 people outside the startup world.',
        reflection:
          'What content format or argument would make a CSO say "I\'ve never thought about strategic decisions that way before"?',
      },
      {
        id: 'bd_4',
        order: 4,
        title: 'Content as a Compounding Asset',
        readTime: '3 min',
        summary:
          'A LinkedIn post fades in 3 days. A well-argued framework post compounds for years.',
        insight:
          'Your content portfolio should have four types: framework posts (evergreen mental models on decision quality), case study posts (bias autopsy of real corporate failures), founder journey posts (building at 16 in Nigeria), and opinion posts (contrarian takes on how enterprises make decisions). The goal: someone lands on your profile 6 months from now and reads 15 posts in a row.',
        whyItMatters:
          "The Boeing 737 MAX, WeWork, AOL-Time Warner — these are Decision Intel's best marketing materials. A deep, specific bias breakdown of these decisions teaches and sells simultaneously. That's the content that enterprise buyers forward to their peers.",
        action:
          'Identify your most compoundable piece of content — the one that would still be relevant in 3 years. Draft it this week. This is worth 10x more time than your next batch of short-form posts.',
        reflection:
          "What perspective do you have on decision-making that most enterprise leaders haven't encountered clearly stated?",
      },
      {
        id: 'bd_5',
        order: 5,
        title: 'Thought Leadership That Converts',
        readTime: '3 min',
        summary:
          'Not "7 tips for better decisions" — "here\'s the specific cognitive pattern that caused Boeing\'s 737 MAX failure."',
        insight:
          "Generic thought leadership entertains. Specific thought leadership converts. The CSO who reads \"here's how groupthink and sunk cost fallacy combined to kill $20B in Boeing's enterprise value — and here's the same pattern I see in most M&A committee processes\" will forward that to their CEO. That's the post that generates a warm intro.",
        whyItMatters:
          'Decision Intel\'s best content is uncomfortable for its readers. It should make a CSO think "this is exactly what happened in our last strategy offsite" — even if they\'d never admit it publicly. Make it that specific.',
        action:
          'Pick one real corporate failure from the last 5 years. Write a 300-word bias autopsy: which biases, what evidence, what a Decision Intel audit would have flagged. Publish it.',
        reflection:
          "What corporate decision failure story do you know best, and why would your telling of it be more insightful than what's been published?",
      },
      {
        id: 'bd_6',
        order: 6,
        title: 'Where Enterprise Buyers Actually Are',
        readTime: '3 min',
        summary:
          'LinkedIn for reach. Newsletter for depth. Industry events for credibility. Your ICP is not on Twitter.',
        insight:
          'Enterprise strategy and M&A professionals are on LinkedIn, at industry conferences (ACG, Intralinks events), and in private forums (CFO roundtables, strategy director communities). Twitter/X has the VC crowd, not your buyers. Newsletter is your highest-trust channel — the content people chose to receive. LinkedIn is discovery; newsletter is relationship.',
        whyItMatters:
          'A 1,000-person newsletter of CSOs and strategy directors is worth more than 50,000 LinkedIn followers of VCs and founders. Optimize for ICP density, not raw reach.',
        action:
          "Find 3 LinkedIn groups, Slack communities, or forums where your ICP congregates. Engage this week — not to pitch, but to add insight. Become a familiar name before you're a vendor.",
        reflection:
          'Which single channel, if you showed up consistently for 90 days, would most likely yield your first warm inbound from a design partner candidate?',
      },
      {
        id: 'bd_7',
        order: 7,
        title: 'The Flywheel Starts With Phase 1',
        readTime: '3 min',
        summary:
          'Brand → inbound → credibility → more brand. The flywheel only starts if you start Phase 1.',
        insight:
          'Phase 1 (now → first customer): post daily, build 1,000 LinkedIn followers in your ICP. Phase 2 (first customer → seed): case study content, warm intros from followers. Phase 3 (seed → Series A): speaking engagements, industry recognition. The mistake: waiting to start Phase 1 until Phase 2 feels urgent. The flywheel takes 12–18 months to build speed.',
        whyItMatters:
          "Every day you don't publish is a day of compounding you lose. Your Wiz advisor started building Wiz's brand before anyone knew them. That pattern — brand ahead of product-market fit — is what turns good companies into category leaders.",
        action:
          "Publish today. Not tomorrow. One substantive LinkedIn post on your area of expertise. The first one is always the hardest. The flywheel doesn't start on its own.",
        reflection:
          "What's the one thing about decision quality you could teach better than anyone else in the world right now?",
      },
    ],
  },
  {
    id: 'unit_economics',
    title: 'Unit Economics',
    description: 'Know your numbers cold — LTV, CAC, payback, gross margin',
    color: '#0891B2',
    emoji: '📊',
    lessons: [
      {
        id: 'ue_1',
        order: 1,
        title: 'The 3 Numbers at Pre-Revenue',
        readTime: '3 min',
        summary:
          'Before customers exist, focus on gross margin, target ACV, and days to first revenue.',
        insight:
          "Three numbers define Decision Intel's fundability before a single customer signs: (1) Gross margin: ~90% blended — very strong, fundable on its own, and the number survives diligence. (2) Target ACV: ~$30K/year (Strategy tier at $2,499/month), scaling to $50–100K+ enterprise. (3) Days to first revenue: know your clock. Every investor will ask all three in the first 10 minutes.",
        whyItMatters:
          '~90% blended gross margin means roughly 90¢ of every revenue dollar becomes gross profit at scale — and the number holds up when the investor runs due diligence. That margin still justifies aggressive investment in CAC — you pay back fast. Lead with gross margin in every investor conversation, but lead with the honest blended number, not the 97% ghost-user figure that ignores flywheel API costs.',
        action:
          'Commit your 3 numbers to memory: gross margin, target ACV by tier (design partner / SMB / enterprise), and your target "days to first signed customer." These should be instant answers.',
        reflection:
          'What would you need to believe about the market for your ACV assumptions to be correct?',
      },
      {
        id: 'ue_2',
        order: 2,
        title: 'Estimating CAC Before You Have Customers',
        readTime: '3 min',
        summary:
          'Customer Acquisition Cost is calculable even pre-revenue. Know it before investors ask.',
        insight:
          'CAC = all acquisition costs / customers acquired. Pre-revenue estimate: 10 hours of outreach per prospect × 10% conversion = 100 hours per customer. At $100/hr opportunity cost, CAC ≈ $10K. With a $270K LTV ($30K Strategy ACV × ~90% blended margin × 10 for 10% churn), your LTV:CAC is 27x — world-class. The benchmark is 3–5x.',
        whyItMatters:
          'Your job is to get CAC as low as possible while LTV stays high. For Decision Intel, content-driven inbound has CAC near zero (just your time). Advisor-led warm intros have CAC of roughly one lunch. Cold outreach is 100 hours. Optimize your channel mix accordingly.',
        action:
          'Map your current outreach process step by step. Count the hours. Calculate estimated CAC for each channel (cold outreach, warm intro, inbound). Which is most efficient?',
        reflection:
          "What's one change to your outreach process that would cut CAC by half without reducing conversion rate?",
      },
      {
        id: 'ue_3',
        order: 3,
        title: 'Why Gross Margin Is Everything',
        readTime: '3 min',
        summary:
          "LTV = ACV × gross margin × (1/churn). Decision Intel's LTV is exceptional by design.",
        insight:
          'Formula: LTV = ACV × gross margin × (1/annual churn). At ~90% blended margin, $30K Strategy ACV, 10% churn: $30K × 0.90 × 10 = $270K LTV. At 5% churn: $540K LTV. This math is your moat — SaaS businesses with ~90% margins can afford high CAC and still build durable businesses. Software gross margins at 80%+ are fundable; ~90% blended is strong and, unlike the 97% ghost-user figure, it survives diligence.',
        whyItMatters:
          "Every dollar of enterprise revenue at Decision Intel generates ~$0.90 of gross profit (blended). That's the number that makes investors lean forward, and — critically — it's the number that survives diligence. Contrast with a hardware company at 40% margins — they need 2× more revenue to hit the same gross profit. You don't.",
        action:
          'Build the LTV formula in a spreadsheet. Run 3 churn scenarios: 20% (bad), 10% (base), 5% (excellent). Present all three to investors — the range shows you understand the drivers.',
        reflection:
          "What does Decision Intel do to reduce churn? What's the customer behavior that signals they're about to churn?",
      },
      {
        id: 'ue_4',
        order: 4,
        title: 'Payback Period: What VCs Actually Watch',
        readTime: '3 min',
        summary: 'Payback = CAC / (monthly revenue × gross margin). Sub-6-month payback is elite.',
        insight:
          "Payback period tells you how quickly customer acquisition investment returns. At $10K CAC and $2,499/month Strategy tier at ~90% blended margin: payback = $10K / ($2,499 × 0.90) ≈ 4–5 months. This means every dollar spent acquiring a customer comes back in about 4–5 months — then it's mostly profit. Sub-6-month payback justifies aggressive CAC spend at Series A.",
        whyItMatters:
          'This metric matters most at Seed and Series A when investors are deciding how much growth capital to deploy. If payback is ~5 months, every $100K in sales investment returns $270K+ in LTV (using the Strategy-tier math above). That\'s the math behind "pour fuel on the fire."',
        action:
          'Calculate your payback period using estimated CAC and target ACV. Bring this number to every investor conversation before they ask for it. Showing you know it signals financial maturity.',
        reflection:
          "At what ACV would Decision Intel's payback period cross the 12-month threshold? What does that tell you about your pricing floor?",
      },
      {
        id: 'ue_5',
        order: 5,
        title: 'The Rule of 40',
        readTime: '3 min',
        summary: "Growth rate + profit margin ≥ 40. Know where you're headed at $1M ARR.",
        insight:
          "Rule of 40: a healthy SaaS business's revenue growth rate + operating profit margin should be at least 40. Pre-revenue this is theoretical, but it frames your destination: at $1M ARR growing 100% YoY with 40% operating margin = 140. Elite. At $5M ARR with 60% growth and 20% margin = 80. Still exceptional. This is your Series A conversation.",
        whyItMatters:
          "Most Decision Intel cost is AWS/Vercel + API costs. No office, no large team until Series A. That means operating margin at $1M ARR could be 80%+. Know this number. It's your strongest financial argument for the business model.",
        action:
          'Calculate what Rule of 40 score Decision Intel would achieve at $1M ARR (use your gross margin and a reasonable growth assumption). This becomes your Series A financial narrative.',
        reflection:
          'At what revenue level does hiring a first sales employee change your Rule of 40 score, and is that trade-off worth it?',
      },
      {
        id: 'ue_6',
        order: 6,
        title: 'Burn Rate and Runway',
        readTime: '3 min',
        summary: 'Always have 12+ months of runway. Raise from strength, not desperation.',
        insight:
          'Monthly burn = how fast you spend. Runway = cash / monthly burn. Rule: 12+ months always. When you hit 6 months, start fundraising regardless of readiness — investors smell desperation. The founders who raise on good terms are the ones who raise early, with leverage. For Decision Intel: keep burn under $5K/month (no office, no salaries, API costs only) until first revenue.',
        whyItMatters:
          'The longer you extend runway pre-revenue, the more leverage you have in investor negotiations. Every month of additional runway is a negotiating chip. Track burn obsessively — more founders fail from running out of money than from building the wrong product.',
        action:
          'Calculate your exact monthly burn today. Project your runway. Set a hard rule: if no design partner by [specific date], start fundraising process regardless.',
        reflection:
          "What's the one expense you're currently running that, if eliminated, would extend runway meaningfully without hurting your actual progress?",
      },
      {
        id: 'ue_7',
        order: 7,
        title: 'Building a Credible Financial Model',
        readTime: '3 min',
        summary: "Investors don't believe your numbers — they believe your logic.",
        insight:
          "A believable model: 3-year monthly with rows for new customers by channel, churn rate, ACV by tier, revenue, COGS (API costs only), gross profit, S&M spend, net burn. Conservative base + 2 scenarios. The point isn't precision — it's demonstrating you understand the levers and know which assumptions matter most.",
        whyItMatters:
          "The most common founder mistake: unrealistic Year 1 enterprise sales numbers. 3 design partners at $2K/month and 1 enterprise pilot at $8K/month = $36K ARR. That's conservative but impressive for pre-seed — and credible. Credibility compounds.",
        action:
          "Build this model in Google Sheets this week. Send it to your Wiz advisor for review before any investor meeting. They've seen what real enterprise sales trajectories look like.",
        reflection:
          "What's the biggest difference between your base case and bull case projection? Is that delta driven by something in your control?",
      },
    ],
  },
  {
    id: 'decision_quality',
    title: 'Decision Quality',
    description: "Make better decisions — your product's core insight, applied to yourself",
    color: '#059669',
    emoji: '🧠',
    lessons: [
      {
        id: 'dq_1',
        order: 1,
        title: 'The Biases That Hit Founders Hardest',
        readTime: '3 min',
        summary:
          'The same biases Decision Intel detects in enterprises hit founders most severely — because conviction is a feature.',
        insight:
          'Confirmation bias: founders surround themselves with people who validate the vision. Overconfidence: conviction is rewarded so often it goes unchecked. Sunk cost: "we\'ve already built this" drives decisions that should be reversed. The founders who reach unicorn scale are those who hold conviction and skepticism simultaneously — they stay bullish on the vision while being ruthlessly honest about the path.',
        whyItMatters:
          "As the founder of a decision quality company, your personal decision-making is a marketing asset. Run the same rigor on your own choices that you want your customers to run on theirs. If you don't, a prospect will notice.",
        action:
          'Run a bias audit on your current biggest strategic assumption. Which biases are most present? What evidence would change your mind?',
        reflection:
          'Where are you most likely suffering from overconfidence right now — about the product, the market, or the timeline?',
      },
      {
        id: 'dq_2',
        order: 2,
        title: 'The Pre-Mortem',
        readTime: '3 min',
        summary:
          "Before deciding, imagine it's 12 months later and it failed spectacularly. Write why.",
        insight:
          "Kahneman's pre-mortem is your most powerful solo-founder tool. Before any major decision — new feature, investor meeting strategy, hiring choice — imagine failure and write the cause. Your optimistic brain suppresses risks; the pre-mortem forces them to the surface. Teams use it because individuals are too confident. Solo founders need it even more.",
        whyItMatters:
          'As founder of Decision Intel, running pre-mortems on your own decisions gives you two things: better decisions, and authentic content. "I ran a pre-mortem on our pricing strategy and here\'s what I found" is a post that resonates with every founder and CSO who reads it.',
        action:
          "Run a pre-mortem on your next investor meeting or design partner outreach attempt. What's the most likely failure mode, and what does that tell you about preparation?",
        reflection:
          "When was the last time a pre-mortem changed a decision you were already committed to? What would have happened if you hadn't run it?",
      },
      {
        id: 'dq_3',
        order: 3,
        title: 'Reference Class Forecasting',
        readTime: '3 min',
        summary:
          'Escape optimism bias by asking "how long does this usually take?" instead of "how long will this take?"',
        insight:
          "Your brain is hardwired to think you're the exception. Reference class forecasting is the correction: look at the base rate for your situation before estimating your own outcome. Pre-seed rounds: 3–6 months median to close. Enterprise deals: 6–18 months. Design partner conversion from free pilot: ~30%. These rates almost never apply to you as quickly as you think.",
        whyItMatters:
          "Decision Intel should model Decision Intel. If you're telling enterprises that reference class forecasting prevents overconfident strategic decisions, you need to practice it in your own fundraising and GTM planning.",
        action:
          'For your top 3 current planning assumptions, find the base rate. What actually happens to companies in your specific situation? Adjust your timelines accordingly.',
        reflection:
          'Which of your current planning timelines is most likely to be optimism bias disguised as a plan?',
      },
      {
        id: 'dq_4',
        order: 4,
        title: 'Decision Journaling',
        readTime: '3 min',
        summary:
          'Write decisions down as you make them. Review quarterly. Patterns emerge that nothing else reveals.',
        insight:
          "Template for each entry: Decision. Context (what you knew at the time). Options considered. Why you chose this. What would prove you wrong. Review quarterly and look for patterns: are you consistently overconfident on timelines? Always underestimating technical complexity? The journal doesn't improve individual decisions — it improves decision-making as a practice.",
        whyItMatters:
          'The decision journal is the personal version of what Decision Intel sells to enterprises. Using it yourself makes you a credible advocate for the product. It also gives you authentic content: your own decision quality data, over time.',
        action:
          'Start today. Write your most significant decision from this week using the template. Don\'t wait for the "right" format — the habit matters more than the structure.',
        reflection:
          "What pattern in your own decision-making do you most want to identify and change? How would you know if you'd changed it?",
      },
      {
        id: 'dq_5',
        order: 5,
        title: 'Decision Quality ≠ Outcome Quality',
        readTime: '3 min',
        summary:
          'A good decision can produce a bad outcome. A bad decision can produce a good outcome. Most people confuse the two.',
        insight:
          "Outcome quality is a function of decision quality + luck. When you conflate them, you learn the wrong lessons: you punish good decisions that went wrong, you reward bad decisions that got lucky, and you can't build a reliable decision-making process. This is Decision Intel's core intellectual contribution — and it should govern how you evaluate your own choices.",
        whyItMatters:
          "Every investor pass, every deal that doesn't close, every feature that doesn't land — don't judge the decision by the outcome. Evaluate the process. Did you have the right information? Did you consider the alternatives? Did you identify the key risks? If yes: it was a good decision. Learn from the outcome, but don't let it reprice the quality of your reasoning.",
        action:
          'Identify one past decision that had a bad outcome but was well-reasoned. Write a 1-paragraph defense of the decision quality, separate from the outcome. Practice presenting it.',
        reflection:
          'How do you currently distinguish between good decision-making and good luck in evaluating your own past choices?',
      },
      {
        id: 'dq_6',
        order: 6,
        title: 'High-Stakes vs. Low-Stakes Decisions',
        readTime: '3 min',
        summary:
          'Not all decisions deserve equal cognitive investment. Match the rigor to the reversibility.',
        insight:
          "Framework by reversibility × cost: (1) Reversible + low cost: just decide, don't overthink. (2) Reversible + high cost: decide carefully, set a review date. (3) Irreversible + low cost: slow down, get outside input. (4) Irreversible + high cost: full deliberation — pre-mortem, reference class, external perspective. Most founder decisions are category 1–2. Save the expensive cognitive process for category 4.",
        whyItMatters:
          'Many founders spend too much cognitive energy on category 1 decisions (feature choices, copy changes, UI tweaks) and too little on category 4 (co-founder selection, key hires, pivot vs. persist). Recognizing the category changes how you allocate attention.',
        action:
          "List your current open decisions. Classify each into one of the four categories. Are you spending cognitive effort proportionally? Identify one category 4 decision you've been treating as category 1.",
        reflection:
          "What's one irreversible decision you're treating as easily reversible right now?",
      },
      {
        id: 'dq_7',
        order: 7,
        title: 'Your Personal Decision Audit Habit',
        readTime: '3 min',
        summary:
          'Quarterly 45-minute audit of your own decisions — the founder version of what Decision Intel sells.',
        insight:
          "Ritual: list your 5 biggest decisions from the quarter, identify the dominant bias in each, note what you'd do differently, identify patterns across all five. Run it like a post-mortem on your own quarter. The output: a bias profile of your current decision-making style that changes over time as you develop awareness.",
        whyItMatters:
          "This gives you personal credibility. When you tell prospects \"I run cognitive audits on my own strategic decisions, and here's what I've learned about my patterns\" — that's the most authentic possible endorsement of Decision Intel's value proposition.",
        action:
          "Do the quarterly audit now — even if it's been less than a quarter. What bias showed up most often in your recent decisions? Write it down.",
        reflection:
          'If Decision Intel audited your last 10 decisions, what would the bias breakdown look like? Which bias score would surprise you most?',
      },
    ],
  },
  {
    id: 'gtm_strategy',
    title: 'GTM Strategy',
    description: 'Get from 0 to your first 10 paying enterprise customers',
    color: '#D97706',
    emoji: '🚀',
    lessons: [
      {
        id: 'gtm_1',
        order: 1,
        title: 'Your ICP Is Narrower Than You Think',
        readTime: '3 min',
        summary:
          'Selling to everyone means closing no one. You should be able to name 50 target companies.',
        insight:
          "Decision Intel's beachhead ICP: CSOs or Chief Strategy Officers at companies with $500M+ revenue, active M&A programs, and at least one deal gone wrong in the last 3 years. Geography: US and UK first — Nigerian startup selling enterprise requires trust-building and existing signals (advisor, design partner) before cold outreach lands. This is a list of ~500 companies globally. You should know 50 by name.",
        whyItMatters:
          'Trying to sell to all enterprise teams is the same mistake as trying to talk to all LinkedIn users. The more specific your ICP, the more specific your content, outreach, and product decisions — and the higher your conversion rate at every stage.',
        action:
          'Build a list of 50 companies that exactly match your ICP. Use LinkedIn Sales Navigator, Apollo, or Crunchbase. For each: company, ICP contact name and title, and whether you have a warm path in.',
        reflection:
          'What\'s the one filter that most precisely identifies a company that is "ready to buy" Decision Intel right now?',
        csoPitch:
          "Our ICP isn't \"enterprise.\" It's the Chief Strategy Officer at a $500M+ company with an active strategic-review cadence, a historical case in the last 24 months of a recommendation landing badly in front of the board, and a strategy function of 6-20 analysts who already write the memos we audit. 500 companies globally meet that filter; about 50 in US + UK combined. If your office matches, DI was built for you. If it doesn't — if you're $5B or you're pre-revenue or you've never sent a deck to a board — I'll tell you today so we don't waste a quarter.",
        mnaPitch:
          "Our sharpest ICP in M&A is a VP or Director at a mid-market PE-backed portco's corporate-development team, or an associate-to-VP at a $1-5B active-acquiror strategic. Deal frequency matters more than deal size: 6+ theses a year beats one $500M mega-deal because the flywheel needs repeated audits to show compounding value. If your firm closes one transformative deal every 18 months, we're not the right fit this year; if you close 8-12 a year, we're the most obvious 60-second hygiene step you haven't added yet.",
        corpStrategyPitch:
          "Corporate strategy groups inside $1-5B operating companies are the cleanest fit — you ship 40-60 recommendations a year, every one of them goes to a steering committee, and the variance in outcome isn't in the data, it's in which biases the memo author didn't catch themselves. If you're below that volume you'll get value but the ROI math is softer; above that volume you'll get value but you need the Strategy tier with team seats. The sweet spot is strategy teams of 8-25 with a formal review cadence.",
        vcPitch:
          "\"Enterprise strategy software\" sounds broad and that's why founders drown in it. Our true buyable ICP is 500 companies globally — CSOs at $500M+ companies with active strategic cadence. 50 in the US + UK are the beachhead. This is a list, not a TAM calculation; we know every name, have a warm path to roughly a third through the Wiz advisor network, and content is doing the work on the rest. At pre-seed the right question isn't \"how big is the market?\" — it's \"can the founder name the 50 accounts and the path in?\" That's what we have.",
      },
      {
        id: 'gtm_2',
        order: 2,
        title: 'Your Beachhead: Own One Market First',
        readTime: '3 min',
        summary: "Dominate a small, specific market first — then expand. This is Thiel's law.",
        insight:
          "Decision Intel's beachhead: M&A teams at mid-market PE-backed portfolio companies ($500M–$2B revenue). Why: high-frequency strategic decisions, real budget, career consequences of failed deals (high motivation), and PE firms talk to each other (fast word of mouth). Own this segment, then expand to strategy consulting firms, then large enterprise C-suites.",
        whyItMatters:
          'The worst GTM mistake is diffuse focus. Three design partners in the same specific segment is more valuable than one design partner each across three different segments. Reference stories need to match your target buyer — one PE-adjacent design partner generates more warm intros than three unrelated ones.',
        action:
          'Write a 1-paragraph "beachhead thesis" — why this specific market, why now, why you can own it in 24 months. Share it with your advisor. Is it believable?',
        reflection:
          'What would "owning" your beachhead look like in 18 months — specifically, how many customers, what market recognition, and what inbound rate?',
        csoPitch:
          "Our beachhead is corporate-strategy groups and M&A teams inside $500M-$2B operating companies — deliberately mid-market rather than Fortune 100. The reason is simple: mid-market CSOs write their own memos, own their own budget line, and can run a design partner without a Gartner procurement review. We dominate this segment first, publish the reference cases, and expand upward into large-cap strategy in Year 2 with reference logos already in hand. That's how you own a category, not how you chase revenue.",
        mnaPitch:
          "Mid-market PE-backed portcos are the M&A beachhead: $500M-$2B revenue, high-frequency deal cadence, real budget for decision-quality tooling, and — critically — PE sponsors talk to each other. When a portco CEO mentions DI at the quarterly board review, every other portco in that fund hears about it within 30 days. That's the word-of-mouth compounding that replaces an SDR team. We don't chase the mega-deals until we've published 3 mid-market PE references.",
        corpStrategyPitch:
          "The beachhead isn't where the biggest spend lives — it's where we can own a reference story fastest. Corporate strategy at $500M-$2B operating companies is dense enough that 5 logos is a credible \"category leader\" claim, budget-real enough to close at enterprise ACV, and reference-able because the CSOs know each other through industry forums. Three published case studies inside that band and the Fortune 500 conversation shifts from \"who is this\" to \"why don't we have this yet.\"",
        vcPitch:
          "Thiel's law: dominate a small, specific market first. Ours is corporate strategy + M&A at mid-market $500M-$2B. 200-300 accounts globally fit. We target 5 design partners inside it in the first 12 months, publish 3 reference case studies, then expand upward to large-cap in Year 2. The expansion doesn't require new product — it requires a new brand story (\"used by these 3 mid-caps, now landing at Fortune 500\"). That's why beachhead discipline matters more at pre-seed than at any later stage.",
      },
      {
        id: 'gtm_3',
        order: 3,
        title: 'Where Your First 10 Customers Come From',
        readTime: '3 min',
        summary: 'First 10 customers almost never come from cold outreach. Map your warm path.',
        insight:
          'Sources for first 10: (1) Warm intros from advisors, (2) LinkedIn content followers who are in your ICP, (3) Speaking in ICP communities, (4) Former contacts in adjacent roles, (5) Inbound from thought leadership. Cold outreach is a last resort at this stage — your conversion rate is 10x higher from warm paths. Map your network today.',
        whyItMatters:
          "Your Wiz advisor likely knows 5–10 people who should be Decision Intel's first customers. That's not a coincidence — it's the most direct path. Have you asked directly: \"Who are the 5 strategy executives you'd most trust me to work with?\" That's worth asking this week.",
        action:
          'Map your 2nd-degree LinkedIn connections to CSOs and strategy directors. For each warm path, write the ask: "Can you intro me to X for a 20-minute conversation about decision quality?" ',
        reflection:
          'What would you need to do today to have a warm intro to one design partner candidate within the next 7 days?',
      },
      {
        id: 'gtm_4',
        order: 4,
        title: 'PLG vs. Enterprise: Decision Intel Is Enterprise',
        readTime: '3 min',
        summary:
          "Product-led growth doesn't work when the buyer isn't the user and contracts are required.",
        insight:
          "PLG works for Slack, Figma, and Notion because users adopt independently and budgets follow usage. Enterprise sales is required when: (1) buyer ≠ user, (2) contracts are mandatory, (3) security review is required, (4) C-suite approval is needed. Decision Intel is all four. Don't build self-serve onboarding until you have 10 enterprise customers — it confuses buyers who expect a sales process.",
        whyItMatters:
          'Every hour spent building self-serve flows before you have enterprise customers is an hour not spent closing enterprise customers. The right order: close 10 enterprise deals → learn exactly what they need → then automate.',
        action:
          "List every product decision you've made in the last month. Were any driven by PLG thinking? Those might be misallocated effort. Evaluate each against: does this help close an enterprise deal?",
        reflection:
          "What's the self-serve feature you've been tempted to build that would actually distract from your enterprise sales process?",
      },
      {
        id: 'gtm_5',
        order: 5,
        title: 'Your GTM Motion: Advisor-Led + Content Inbound',
        readTime: '3 min',
        summary: 'Not cold outreach — get known, get warm, get a design partner.',
        insight:
          "Decision Intel's GTM motion: content builds awareness → advisor intros create warm meetings → discovery calls identify design partner candidates → design partner program converts to paying. This motion doesn't require a sales team, a CRM, or an SDR. It requires consistent content and active use of your advisor network. Cold outreach is a supplement, not the primary motion.",
        whyItMatters:
          'The Prospect Pipeline in your Founder Hub is the right tool for this — it tracks every contact from first outreach through conversion. Every week: 1 new outreach, 1 follow-up, 1 pipeline update. Consistent small actions compound into a pipeline.',
        action:
          'Map the source of every current pipeline prospect. Which source is converting at the highest rate? How do you do more of that specific thing?',
        reflection:
          "What's one concrete action this week that would activate your advisor's network more aggressively than you have been?",
      },
      {
        id: 'gtm_6',
        order: 6,
        title: 'Charge More Than You Think',
        readTime: '3 min',
        summary: 'Founders undercharge in B2B. Price to value, not to cost.',
        insight:
          "Decision Intel's value: preventing a failed strategic decision. A $200M bad acquisition costs $20–50M in destroyed value — that's a low estimate. Your software's value is a fraction of that risk. Pricing targets: design partner $2K/month, startup pilot $500/deal audit, enterprise $50–150K/year. If prospects don't flinch at the price, you're undercharging.",
        whyItMatters:
          'High price signals value in enterprise. A $500/month software is "cheap analytics." A $10K/month software is "strategic infrastructure." The positioning changes with the price point. Enterprise buyers expect to pay enterprise prices for tools that touch C-suite decisions.',
        action:
          "In your next design partner conversation, quote a price 20% higher than your instinct. Watch the reaction. If there's no pushback, raise again. Price is information — let the market tell you where the ceiling is.",
        reflection:
          'What objection are you most afraid of hearing to a higher price, and is that fear based on data or assumption?',
        csoPitch:
          "DI is priced to the risk it prevents, not to the hours it saves. A single failed $200M strategic recommendation destroys $20-50M of enterprise value through the value-destruction curve — and the frequency of that in corporate strategy is roughly one per 2-3 years. Our Strategy tier is £30K/year for a 15-seat team with unlimited audits on your entire memo pipeline. The unit economics work at 0.06% of the risk we're priced against. If that feels expensive, I'd rather hear that upfront than discount into a relationship that won't renew.",
        mnaPitch:
          "Pricing for M&A buyers is anchored to deal-support spend, not SaaS. Your firm spends 6-8 figures per deal on banker fees, diligence providers, and post-close integration consultants — DI at £30K a year as a deal-quality audit layer across every thesis is measured in basis points, not percentage points. The sharpest M&A firms don't flinch; the ones who do aren't the ones who would renew. If a prospective MD flinches at £30K for unlimited audits on 6-10 theses a year, the deal pipeline isn't dense enough for the tool to compound.",
        corpStrategyPitch:
          "Corporate strategy buyers price-anchor to consulting spend, not SaaS. You pay McKinsey or BCG £500K-£2M for a single engagement; a £30K/year subscription to DI that audits every memo across every project, every quarter, quarter after quarter, is a fraction of a percent of your total advisory budget. Frame it that way and the procurement conversation gets 10× shorter. We deliberately don't benchmark against \"decision management\" tooling because that category isn't priced to strategic impact; it's priced to analyst seats.",
        vcPitch:
          "Enterprise strategy founders systematically undercharge — the instinct is to discount to close, and the instinct is wrong. High price signals value in this category: £500/month reads as \"cheap analytics\"; £30K/year reads as \"strategic infrastructure.\" Our pricing ladder (Individual £249/mo → Strategy £2,499/mo → Enterprise custom) is deliberately flat for the first 15 seats, steep after, which lets the Strategy tier anchor the Enterprise negotiation. Pricing is information: the ones who flinch were never buyers.",
      },
      {
        id: 'gtm_7',
        order: 7,
        title: 'The Design Partner Pitch',
        readTime: '3 min',
        summary:
          'The framing: co-building, not selling. Exclusivity, commitment, and roadmap input.',
        insight:
          '"We\'re offering a 6-month partnership with 5 companies who want to shape the future of strategic decision quality. You get unlimited audits, weekly sessions with me, and guaranteed roadmap input. We\'re asking $2,000/month." This works because: (1) exclusivity signals value, (2) co-build framing makes them feel like builders not buyers, (3) $2K/month is often below procurement approval threshold.',
        whyItMatters:
          'The payment amount matters less than the commitment it signals. A company paying $500/month is 10x more engaged than a free pilot. They schedule calls, give feedback, and tell colleagues. Free trials are expensive in attention cost, not free.',
        action:
          'Memorize this pitch. Practice it out loud until it takes under 3 minutes and the ask comes naturally. Record yourself. The first 3 times will be uncomfortable — do it anyway.',
        reflection:
          'What would need to be true for a CSO to say yes to this in the first 10 minutes of a call?',
        csoPitch:
          "I'm building a five-office design partner programme for the next two quarters. The offer is straightforward: unlimited audits across your strategic-memo pipeline, weekly working sessions with me to shape the product specifically against your review cadence, guaranteed roadmap input on anything that touches your committee flow, and a published reference once you're through one full quarterly cycle. £2K per month for six months. You're not licensing software; you're co-authoring the category of strategic-decision auditing. Five seats — four open as of this week.",
        mnaPitch:
          'Five M&A firms are shaping DI for deal work this year. The partnership runs six months: unlimited audits on live theses and post-mortem re-analysis on anything from your last two years of closed deals, weekly working sessions with me, roadmap input on the IC flow, and a case study we publish jointly once you\'re through three confirmed outcomes. £2K/month. Why I\'m limiting to five: product depth. I can\'t give every design partner weekly founder time if there are twenty. This is the window where the founder is available.',
        corpStrategyPitch:
          "Five corporate strategy groups will shape DI across the back half of this year. What your team gets: unlimited audits across every recommendation you put through committee, weekly co-build sessions with me, roadmap input, and a joint case study at month six. £2K a month, six-month term, case-study consent. Why paid and not a free pilot — free pilots die on a quarter-end. £2K is sub-procurement approval for every ICP group I've spoken to, and it creates the engagement pattern we need to build the product correctly. Four partner slots left.",
        vcPitch:
          "The design-partner pitch is the most compressed version of our entire GTM. Three ideas in one paragraph: exclusivity (five seats, not five hundred), co-build (you shape the roadmap, not subscribe to one), payment (£2K/mo proves engagement and clears procurement). That combination is why our expected close rate from first discovery to signed DP is 3-5×pre-seed industry baseline. The founder pitches it under three minutes on every call — we've trained it against the advisor network and know where it bends.",
      },
    ],
  },
  {
    id: 'leadership',
    title: 'Leadership',
    description: 'Build culture, manage stakeholders, and compound your learning velocity',
    color: '#0A66C2',
    emoji: '👑',
    lessons: [
      {
        id: 'ldr_1',
        order: 1,
        title: 'Getting 10x Value from Your Advisor',
        readTime: '3 min',
        summary:
          'Most founders treat advisors like a network unlock. The best treat them like board members.',
        insight:
          'Monthly update format: (1) progress since last call, (2) biggest current blocker, (3) 2–3 specific decisions where their perspective is uniquely valuable, (4) one ask. Act on their input and report back next month. Show them it mattered. Your Wiz advisor helped scale Wiz from 0 to $32B — their enterprise GTM judgment is worth millions to Decision Intel. Use it systematically.',
        whyItMatters:
          "The most common founder mistake with advisors: saving all the asks for one big meeting instead of dripping them consistently. Your advisor remembers you better and advocates for you more actively if you're a regular presence, not a quarterly interruption.",
        action:
          "Write your monthly advisor update template. Send this month's update before your next call. Format: progress (2 sentences), blocker (1 sentence), 2 decisions I need your take on, 1 specific ask.",
        reflection:
          "What's one question only your Wiz advisor could answer — drawing on their Wiz experience specifically — that you haven't asked yet?",
      },
      {
        id: 'ldr_2',
        order: 2,
        title: 'Building Culture Before a Team',
        readTime: '3 min',
        summary: "Culture is what happens when no one is watching. You're building it right now.",
        insight:
          "Solo founder culture = your working habits, your values in decisions under pressure, how you handle a prospect who ghosts you, the quality of code you ship when tired. By the time you hire person #1, your culture is already set — they're joining it, not co-creating it. The implication: be intentional now about the behaviors you want to be permanent.",
        whyItMatters:
          'The best founders can describe their culture in 3–4 actual behavioral principles — not aspirational values but observable habits. "We ship and test rather than plan and plan" is a real principle. "We value excellence" is not.',
        action:
          'Write 3 cultural principles that are actually true of how you work today — not how you aspire to work. These become the filter for your first hire.',
        reflection:
          "What behavior would immediately signal to you that a potential hire wouldn't fit — even if they had perfect technical skills?",
      },
      {
        id: 'ldr_3',
        order: 3,
        title: 'When and Who to Hire First',
        readTime: '3 min',
        summary:
          'Wrong order: a friend, a developer, a marketer. Right order: whoever makes you 10x more effective.',
        insight:
          "First hire criteria: (1) Makes you 10x more effective, not 10% better. (2) Fills a critical skill gap you can't automate or advise your way out of. (3) Is better than you in their domain — not just good enough. For Decision Intel: first hire should probably be an enterprise sales motion specialist — someone who can own the design partner pipeline while you build.",
        whyItMatters:
          "Don't hire for tasks Claude can handle. Don't hire for tasks only you can do (investor relationships, strategic vision). Hire for the gap between those — the execution that requires human judgment but not necessarily the founder's specific judgment.",
        action:
          'Write a first hire job description as if you were posting it tomorrow. What does this person spend 80% of their time on? Read it back — does it describe a real gap or an imagined one?',
        reflection:
          "What's the one capability gap in Decision Intel right now that, if filled, would most directly accelerate your path to first paid customer?",
      },
      {
        id: 'ldr_4',
        order: 4,
        title: 'The 20-Person Company of One',
        readTime: '3 min',
        summary:
          'Leverage model: Claude handles implementation, automation handles ops, advisors handle strategy, content handles brand. You handle only what requires your specific judgment.',
        insight:
          'Before every task, ask: can Claude do this? If yes, delegate. If no, do it yourself — but record your reasoning so Claude can do it next time. The buckets: (1) Only you: investor relationships, design partner calls, strategic vision. (2) You + Claude: architecture decisions, content generation, outreach drafts. (3) Fully automated: builds, deployments, follow-up reminders, monitoring. Minimize bucket 1, expand bucket 3.',
        whyItMatters:
          "You're already operating at a leverage ratio most early-stage founders don't reach until they have a team of 5. The question is how to push that ratio further. The answer is always: what system can I build today that removes a recurring task from my plate permanently?",
        action:
          'This week, log every task you do. Classify: only-me, Claude-able, advisor-able, automatable. The "only-me" bucket will be smaller than you expect. Delegate one item from it.',
        reflection:
          "What's one thing you do regularly that you haven't yet tried to give to Claude — because you assumed it required your judgment?",
      },
      {
        id: 'ldr_5',
        order: 5,
        title: "The Founder's Psychology",
        readTime: '3 min',
        summary:
          "Weeks where nothing works are guaranteed. Solo founders need tools for that — there's no team to absorb the weight.",
        insight:
          "Tools that work: (1) Separate decision quality from outcome quality — a good call that failed is still a good call. (2) Weekly review ritual: 3 wins, 1 loss, 1 decision you'd make differently. (3) The 10-year test: will this matter in a decade? If not, don't give it more than 10 minutes of stress. (4) Physical reset — when your thinking loops, the answer is usually not more thinking.",
        whyItMatters:
          "At 16, you're building emotional regulation habits that will determine how you handle every future crisis. The founder who can maintain clarity under pressure has a fundamental competitive advantage. This is a skill, and it compounds like all other skills.",
        action:
          "Set up a weekly 20-minute review ritual. Same time, same day every week. Write 3 wins, 1 loss, 1 decision you'd make differently. Do it even in bad weeks — especially in bad weeks.",
        reflection:
          "What's the emotion you're most likely to make bad decisions from? What's your specific protocol when you notice that state?",
      },
      {
        id: 'ldr_6',
        order: 6,
        title: 'Stakeholder Management',
        readTime: '3 min',
        summary:
          'Each stakeholder has different needs. Treating all of them the same is an expensive mistake.',
        insight:
          'Investors need: momentum narrative, de-risking story, clear ask. Advisors need: specific questions, updates on prior advice, credit for input. Design partners need: responsiveness, roadmap visibility, feeling of exclusivity. Each stakeholder relationship has a distinct "currency." Giving the wrong currency — pitching an advisor like an investor, or updating a design partner like an investor report — erodes trust quickly.',
        whyItMatters:
          "A design partner who doesn't hear from you for 3 weeks churns. An investor who gets a vague monthly update stops helping. Relationships degrade faster than they build. Consistent, predictable communication is the most underrated leadership skill at early stage.",
        action:
          'Build a stakeholder communication calendar: each person, their communication frequency, their preferred format, your last interaction date. Look at it weekly.',
        reflection:
          'Which current stakeholder relationship are you underpaying — and what would it cost you if that relationship degraded over the next 3 months?',
      },
      {
        id: 'ldr_7',
        order: 7,
        title: 'Learning Velocity: How the Best Founders Learn Faster',
        readTime: '3 min',
        summary:
          'Your single biggest long-term advantage at 16 is learning velocity. You can compound it for 40 years.',
        insight:
          'Five practices that compound: (1) Deliberate reflection (decision journal), (2) Exposure to exceptional people (your advisor, investors, design partners — they compress years of learning into minutes), (3) Deep reading (books, not tweets — frameworks that last 10+ years), (4) Building in public (teaching forces clarity of thought), (5) Acting on uncertainty (the best learning comes from doing, not planning to do).',
        whyItMatters:
          "The founders who reach unicorn scale are almost universally exceptional learners. It's not their initial knowledge — it's the rate at which they close the gap between where they are and where they need to be. You've already demonstrated this with Decision Intel. Systematize it.",
        action:
          'Set a 12-month learning goal: one book per month (send a reading list request to your advisor), 3 conversations with exceptional people per quarter, one new domain studied per quarter.',
        reflection:
          "Who is one person that, if you had a 1-hour quarterly conversation with them, would most accelerate Decision Intel's success? How do you get that conversation?",
      },
    ],
  },
  {
    id: 'platform_foundations',
    title: 'Platform Foundations',
    description:
      'The methodologies Decision Intel is built on — so you can explain them at CSO depth and VC depth',
    color: '#0F172A',
    emoji: '🏛️',
    lessons: [
      {
        id: 'pf_1',
        order: 1,
        title: 'The Heuristics & Biases Program',
        readTime: '6 min',
        summary:
          "Decision Intel's 30+ bias taxonomy descends directly from Kahneman & Tversky's Nobel-winning research program. You should be able to trace every bias back to it.",
        insight:
          'Amos Tversky and Daniel Kahneman\'s 1974 paper "Judgment Under Uncertainty: Heuristics and Biases" launched the entire field of behavioural decision science. The core finding: people don\'t compute probabilities; they substitute harder questions with easier ones (availability, representativeness, anchoring). Each substitution produces a systematic error — a bias. Over 50 years of peer-reviewed research has catalogued these errors, and Decision Intel\'s taxonomy (DI-B-001 through DI-B-020, plus the broader 30+ marketing scope) maps each one to that literature. Confirmation bias, anchoring, overconfidence, optimism, sunk cost, availability, representativeness — these are not our inventions. We operationalised what already existed. Kahneman\'s 2011 "Thinking, Fast and Slow" is the layperson synthesis; the 1982 "Judgment Under Uncertainty" collection (Kahneman, Slovic, Tversky) is the academic canon.',
        whyItMatters:
          'When a CSO asks "how do you know these biases are real?" you need to answer with names, dates, and papers — not "our AI detects them." The credibility of the whole product rests on the credibility of the underlying research. You are not asking prospects to trust your algorithm; you are asking them to trust 50 years of cognitive science, and your job is to make them confident that your platform applies it correctly.',
        action:
          'Read the opening chapter of "Thinking, Fast and Slow" this week. Then write a 2-paragraph answer to: "What research is Decision Intel built on?" — as if answering a skeptical CSO.',
        reflection:
          'If a VC asks "what prevents GPT-5 from replacing Decision Intel?" — how do you use the bias taxonomy provenance to answer that?',
        sources: [
          {
            label: 'Tversky & Kahneman (1974)',
            detail:
              '"Judgment under Uncertainty: Heuristics and Biases" — Science, 185(4157). The founding paper.',
          },
          {
            label: 'Kahneman, Slovic & Tversky (1982)',
            detail:
              '"Judgment Under Uncertainty: Heuristics and Biases" — Cambridge University Press. The academic canon collection.',
          },
          {
            label: 'Kahneman (2011)',
            detail:
              '"Thinking, Fast and Slow" — Farrar, Straus and Giroux. The layperson synthesis; System 1 / System 2.',
          },
          {
            label: 'Malmendier & Tate (2005, 2008)',
            detail:
              '"CEO Overconfidence and Corporate Investment" and follow-up papers applying bias research directly to CEO decision-making at public companies.',
          },
        ],
        csoPitch:
          "Decision Intel didn't invent its bias taxonomy. It operationalises fifty years of Nobel-winning research — Kahneman, Tversky, Thaler — and applies it to the exact artefacts your team already produces: strategic memos, board decks, market-entry recommendations. Every flag we surface cites the published literature behind it. Your audit committee can defend the rigour.",
        mnaPitch:
          "Every bias we flag on a thesis carries a citation — Tversky-Kahneman 1974 for anchoring, Malmendier-Tate 2005 for CEO overconfidence, Thaler-Sunstein for availability in deal comparables. When a partner asks \"where does this come from?\" the answer isn't our algorithm; it's fifty years of peer-reviewed economics research applied specifically to M&A decision artefacts. That provenance is what makes DI defensible inside a post-close review where the board is asking why the thesis broke.",
        corpStrategyPitch:
          "The research our taxonomy is built on predates every management consultancy's decision-support offering. Twenty biases (DI-B-001 through DI-B-020) plus thirty more in the broader scope, each traced to a specific paper in the Kahneman-Tversky lineage, each mapped to the strategic-memo sections where it typically appears. If a steering-committee member challenges a flag, your analyst can pull the source citation in one click. Decision hygiene isn't an opinion at DI; it's a published literature your CSO office can defend.",
        vcPitch:
          "The moat isn't the model. It's the methodology. GPT can identify a bias; it cannot tell you which of the 30+ canonical biases is present, at what severity, in which section, mapped to which regulatory framework, with which compound-risk interaction. That mapping is three academic lineages deep and updates as the research updates. LLM wrappers can't reconstruct that.",
      },
      {
        id: 'pf_2',
        order: 2,
        title: 'Noise: The Other Kind of Judgment Error',
        readTime: '5 min',
        summary:
          "Bias is the average error; noise is the variance. Kahneman's 2021 book argued noise is the larger, unmeasured problem. Decision Intel is the first product to quantify it in strategic memos.",
        insight:
          'Kahneman, Sibony and Sunstein\'s "Noise: A Flaw in Human Judgment" (2021) is the sequel to "Thinking, Fast and Slow" and the intellectual foundation for our 3-judge noise measurement. Their thesis: in any system of professional judgment (underwriters, radiologists, judges, executives), if you show the same case to different experts, or the same expert on different days, you get wildly different answers. That variance is noise. Their field studies across insurance, law, medicine, and HR found noise typically accounts for as much error as bias — sometimes more. Decision Intel addresses noise directly: the pipeline runs three independent LLM "judges" over the same memo and surfaces the standard deviation of their verdicts. A low-noise memo says what it means; a high-noise memo is ambiguous and the disagreement is a signal of work to do.',
        whyItMatters:
          "No competitor measures noise. McKinsey doesn't; BCG doesn't; Cloverpop doesn't; ChatGPT definitely doesn't (it's a single judge by architecture). Noise is the unclaimed half of judgment error. Owning it is a durable positioning. When you describe Decision Intel, lead with noise after DQI — it's the feature no one else has a good answer to.",
        action:
          'Re-read chapters 1–3 of "Noise." Then practice a 2-minute pitch that explains to a CSO why noise matters and why your 3-judge architecture is the fix. Time yourself.',
        reflection:
          'If a competitor builds a single-LLM "decision auditor," what do you say when asked what makes you different? Your answer must survive 10 seconds of scrutiny.',
        sources: [
          {
            label: 'Kahneman, Sibony & Sunstein (2021)',
            detail: '"Noise: A Flaw in Human Judgment" — Little, Brown Spark. Canonical.',
          },
          {
            label: 'Kahneman, Rosenfield, Gandhi & Blaser (2016)',
            detail:
              '"Noise: How to Overcome the High, Hidden Cost of Inconsistent Decision Making" — Harvard Business Review. 18-page condensed version.',
          },
          {
            label: 'Bohnet (2016)',
            detail:
              '"What Works: Gender Equality by Design" — Harvard University Press. Applied-noise intervention case studies.',
          },
        ],
        csoPitch:
          "Your board already asks you to reduce bias. Almost none of them ask you to reduce noise — the variance you'd see if three equally qualified analysts read the same memo on the same morning. Kahneman's 2021 research showed noise often accounts for more judgment error than bias. We measure both. It's the half of the problem your current process has never named.",
        mnaPitch:
          "Ask three senior associates to read the same deal memo on a Monday morning and you'll get three different verdicts. Ask the same associate on a Tuesday versus a Friday and you'll often get two different verdicts. That variance is noise — and Kahneman's 2021 research showed it frequently accounts for more judgment error than bias does. DI runs three independent LLM judges over every memo and reports the standard deviation of their verdicts. A noisy thesis is a warning to pressure-test before IC; a quiet thesis is a signal the reasoning is tight enough to defend.",
        corpStrategyPitch:
          "Kahneman's 2021 \"Noise\" book showed that professional judgment systems — underwriters, radiologists, judges, executives — produce wildly variable answers to identical cases, and that variance typically matches or exceeds bias as a source of error. Your strategic-review cadence runs on professional judgment. DI's 3-judge architecture measures how much the judgment on a specific recommendation would swing across equally qualified reviewers on different days. A high-noise memo is the one that needs another round of pressure-testing before the committee pack goes out. No other decision-support tool architecturally measures this.",
        vcPitch:
          "The bias-detection category is becoming commoditised. Noise measurement is not. Kahneman's 2021 book put noise on the map, and no incumbent — McKinsey, Cloverpop, or a ChatGPT prompt — architecturally measures it. Our 3-judge pipeline is a defensible product surface, not a marketing claim.",
      },
      {
        id: 'pf_3',
        order: 3,
        title: 'The Decision Quality Index — Why Those Six Components',
        readTime: '6 min',
        summary:
          'DQI is a weighted composite of six inputs. Each weight has a reason. You should be able to defend every weight the way a CFO defends a cap-ex allocation.',
        insight:
          "DQI is Decision Intel's single most-cited output. It grades a decision A–F on a 0–100 scale, boundaries A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F < 40. Under the hood it weights six components: (1) bias profile — presence and severity across the 30+ taxonomy, (2) noise — cross-judge variance, (3) logical coherence — internal consistency of the argument, (4) evidence grounding — claims that survive fact-check, (5) pre-mortem robustness — how many failure modes the memo has considered, (6) stakeholder coverage — whether the dissenting voice is represented. The weights aren't arbitrary. Each comes from published research on what predicts good outcomes: noise and bias carry the most weight because Kahneman-Sibony showed they're the largest error sources; stakeholder coverage is weighted because Mercier & Sperber's argumentative theory of reasoning showed individual cognition is worst when uncontested. DQI is to strategic decisions what FICO is to credit: a transparent composite grounded in predictive research, not a vibe.",
        whyItMatters:
          'The DQI is the single artefact you will be asked about most often — by prospects, by investors, by the press. You should know every weight from memory and be able to defend it in two sentences. If a CSO says "these weights look arbitrary," that\'s a product-level credibility attack and it needs a 30-second answer. The weights are in `src/lib/scoring/dqi.ts` and mapped against FOUNDER_CONTEXT; re-read them before any investor meeting.',
        action:
          "Memorise the six components and their weights. Practice explaining each weight's rationale out loud — as if you were the CFO defending a budget allocation.",
        reflection:
          'Which DQI component is hardest for you to defend the weighting of? That is probably where a sophisticated prospect will push — prepare the answer now.',
        sources: [
          {
            label: 'Keeney (1992)',
            detail:
              '"Value-Focused Thinking" — Harvard University Press. Foundational work on how to weight multi-criteria decision models defensibly.',
          },
          {
            label: 'Howard & Matheson (2004)',
            detail:
              '"Influence Diagrams, Decision Diagrams, and Decision Quality" — Strategic Decisions Group. The "Six Elements of Decision Quality" framework.',
          },
          {
            label: 'Internal',
            detail:
              'src/lib/scoring/dqi.ts (792 lines) — the canonical implementation. FOUNDER_CONTEXT.dqiWeights is the source of truth.',
          },
        ],
        csoPitch:
          "DQI is a weighted composite of six decision-quality components — each weight grounded in a specific published finding about what predicts good strategic outcomes. Every memo you run comes back with its DQI, its sub-scores, and the exact weightings that produced them. Your audit committee doesn't have to take our word for anything; the methodology is transparent and re-runnable.",
        mnaPitch:
          "Every thesis gets a single-number DQI your IC can compare across deals — 28% bias profile, 18% noise, 18% logical coherence, 13% evidence grounding, 13% pre-mortem robustness, 10% stakeholder coverage. Partners who've sat through eight hours of diligence read-outs immediately get the value: one number, defensible weightings, pattern-matched against 135 historical theses. An A means this memo would have cleared IC at a firm that successfully acquired; a D means it shares structure with the ones that didn't. That's the signal gap we fill.",
        corpStrategyPitch:
          "DQI is the hygiene score your steering committee will eventually demand. Six components, each weighted from published outcome research, producing a single A-F grade on every recommendation that crosses the committee table. The weights are public (they live in dqi.ts in our repo); the sub-scores are drill-downable; the recalibration curves against your own committee's confirmed outcomes over 12 months. Think of it as a PMO quality gate — except the gate is quantitative and the standard sharpens as your decision history accumulates.",
      },
      {
        id: 'pf_4',
        order: 4,
        title: 'Pre-Mortems & Red-Teams — Klein, Mercier, Sperber',
        readTime: '5 min',
        summary:
          "The pre-mortem and the red-team are both adversarial-cognition techniques with specific research provenance. Decision Intel's pipeline operationalises both — and the research tells us why they work.",
        insight:
          'Gary Klein introduced the pre-mortem in a 2007 Harvard Business Review piece: before committing, imagine the decision has failed and write the most plausible cause. The technique works because of "prospective hindsight" — shifting the brain from defence to diagnosis bypasses optimism bias. Klein\'s field tests showed pre-mortems surface failure modes that traditional risk reviews miss by 30%+. The red-team is adjacent: assign a person or process to argue against the decision, with the specific brief of finding weaknesses. Mercier and Sperber\'s "The Enigma of Reason" (2017) argues that individual reasoning evolved for argumentation, not truth-seeking; reasoning is most accurate under adversarial pressure, which is why red-teams work. Decision Intel runs both natively: our pre-mortem node (src/lib/agents/nodes.ts) generates failure scenarios; Dr. Red Team surfaces the single most-damaging objection against the weakest load-bearing assumption.',
        whyItMatters:
          "A CSO who has run a pre-mortem before will recognise the technique instantly. The 20% who haven't need you to explain it in two sentences and attribute it to Klein. When you do that crisply, you sound like someone who has thought deeply about the tooling, not just built it.",
        action:
          "Pick one current high-stakes decision of your own (fundraising timing, hire, roadmap). Run Klein's pre-mortem on it. Write the failure story. See what changes.",
        reflection:
          'When you pitch Decision Intel, do you currently use the word "pre-mortem" or the phrase "imagine the failure"? Both work — but the first is positioning, and the second is explanation. Know when to use which.',
        sources: [
          {
            label: 'Klein (2007)',
            detail:
              '"Performing a Project Premortem" — Harvard Business Review, September. The founding article.',
          },
          {
            label: 'Mitchell, Russo & Pennington (1989)',
            detail:
              '"Back to the Future: Temporal Perspective in the Explanation of Events" — Journal of Behavioral Decision Making. The prospective-hindsight research underneath.',
          },
          {
            label: 'Mercier & Sperber (2017)',
            detail:
              '"The Enigma of Reason" — Harvard University Press. Argumentative theory of reasoning; why red-teams work.',
          },
        ],
        csoPitch:
          'Every memo we audit gets a pre-mortem — Gary Klein\'s 2007 technique, used inside most Fortune 500 strategy functions — plus a Red Team pass that synthesises the single most damaging objection against your weakest load-bearing assumption. Your board walks in with the dissent already surfaced. There\'s no "what did we miss?" moment.',
        mnaPitch:
          "Every thesis gets two adversarial passes before IC. The pre-mortem — Klein 2007, the canonical failure-imagination technique — forces the brain from defence to diagnosis by asking \"it's 18 months post-close and this deal failed; what happened?\" The Red Team pass then synthesises the single most damaging objection against your weakest load-bearing assumption. Your deal team walks into committee with the counterfactual already drafted, not improvised at the table. That's the conversation partners have been trying to force through structure for decades.",
        corpStrategyPitch:
          "Gary Klein's pre-mortem has been a recommended strategic-planning technique since 2007 — but almost no one runs them systematically because they require scheduling, facilitation, and the right meeting culture. DI runs one automatically on every memo: failure scenarios generated, ranked by plausibility, surfaced in the committee pack. Your review cadence gets the adversarial cognition it was supposed to have without the meeting overhead. Plus a Red Team pass that names the single sharpest objection — the one a CEO would ask in 30 seconds and that most committees only surface after the call.",
        vcPitch:
          'This is a good example of what we mean by "operationalising the research." The pre-mortem has been in the management canon since 2007. Nobody has packaged it as a mandatory, automated step inside a strategic-memo audit. We did — and it ships on Individual, not just Enterprise.',
      },
      {
        id: 'pf_5',
        order: 5,
        title: 'The Outcome Loop — Tetlock, Brier, and Bayesian Calibration',
        readTime: '6 min',
        summary:
          "Decision Intel's outcome flywheel is the Tetlock superforecasting research, applied to corporate strategy. Confirmed outcomes recalibrate the org's DQI so scores get sharper over time. This is the compounding moat.",
        insight:
          "Philip Tetlock's 20-year \"Good Judgment Project\" showed that forecasting skill is trainable — but only when judgments are scored by their actual outcomes, with Brier scores (a proper scoring rule that rewards both accuracy and calibration), and the feedback loop is fast enough to learn from. Tetlock's superforecasters averaged a Brier of ~0.13 over 20 years; CIA analysts on the same questions averaged ~0.23 using identical public information, because the superforecasters had a working outcome loop. Decision Intel ships the same mechanic inside the product: every confirmed outcome runs through src/lib/learning/brier-scoring.ts, computing (predicted DQI / 100 − actual)² and bucketing into excellent (≤ 0.10), good (≤ 0.20), fair (≤ 0.35), or poor (> 0.35) — the same thresholds that define Tetlock's bands. The per-outcome Brier is persisted on DecisionOutcome; the per-org trend is surfaced on the Outcome Flywheel dashboard. Parallel to Brier, confirmed and dismissed flags update a private bias-confidence profile that future audits upweight or downweight. After 12 months your organisation's calibration is tuned to your decisions, not an industry baseline — and the bias library knows which flags your team actually trusts.",
        whyItMatters:
          'The outcome loop is the single hardest thing for a competitor to replicate and the single easiest thing for an investor to misunderstand. You need a 30-second explanation that uses the word "calibration" and the name "Tetlock." When a VC asks "what\'s the moat?" — this is the answer, delivered without hedging.',
        action:
          'Read the introduction to Tetlock & Gardner\'s "Superforecasting" this week. Then rewrite your VC moat paragraph using the words "calibration," "Brier," and "per-org recalibration."',
        reflection:
          'If Cloverpop announced an "outcome tracker" feature tomorrow, why would Decision Intel still win? Your answer has to be better than "we got here first."',
        sources: [
          {
            label: 'Tetlock & Gardner (2015)',
            detail: '"Superforecasting: The Art and Science of Prediction" — Crown. Canonical.',
          },
          {
            label: 'Tetlock (2005)',
            detail:
              '"Expert Political Judgment: How Good Is It? How Can We Know?" — Princeton University Press. The original 20-year study.',
          },
          {
            label: 'Brier (1950)',
            detail:
              '"Verification of Forecasts Expressed in Terms of Probability" — Monthly Weather Review, 78(1). The proper scoring rule the whole field uses.',
          },
        ],
        csoPitch:
          "Your DQI starts at an industry baseline. Every confirmed outcome your team reports — good or bad — tunes the model to your specific decision patterns. After 12 months, the score is calibrated to the way your organisation actually makes calls, not a generic average. That's not a feature; that's how Tetlock's superforecasters outperformed CIA analysts by 30% on the same information.",
        mnaPitch:
          "Every closed deal, win or lose, becomes a training signal. You report the outcome (revenue hit, revenue miss, integration flop, thesis held), we compute the Brier score against our pre-IC DQI, and the weights recalibrate against your specific firm. After 18-24 months of closed deals, your DQI isn't pointing at a generic bias baseline — it's pointing at the failure modes your partners specifically under-weight in diligence. The compounding is per-firm; the learning is private; the moat is unreachable without a full cycle of closed deals.",
        corpStrategyPitch:
          "The outcome loop is what turns a one-off audit into a compounding quality system. Every recommendation that goes through committee gets its DQI at commit time; six to eighteen months later, your team reports the outcome (revenue delta, milestone hit, strategic thesis held); the gap between DQI and outcome feeds back into your organisation's private DQI model. Over four quarters, your score gets tuned to your CSO office's blind spots, not an industry average. No consulting engagement, no competing tool, can replicate that — it requires actual outcome history, which only your own review cadence produces.",
      },
      {
        id: 'pf_6',
        order: 6,
        title: 'The 20×20 Bias Interaction Matrix — Why Biases Are Toxic in Combination',
        readTime: '5 min',
        summary:
          'Biases rarely appear alone. The research on bias interactions — why overconfidence × confirmation is lethal — is recent but robust, and it\'s the intellectual basis for our "toxic combinations" feature.',
        insight:
          'The solo-bias literature (Tversky-Kahneman and descendants) treats each bias independently. The 2010s research asks the harder question: how do biases compound when they appear together? The answer is: multiplicatively, not additively. Confirmation bias paired with overconfidence produces catastrophic decision-making: you only look at evidence that supports your view (confirmation), and you trust that view more than the evidence warrants (overconfidence). You can predict the failure before it happens. Bazerman & Chugh (2022) "Better, Not Perfect" consolidates the interaction research; Kogut & Zander showed similar compounding effects in M&A contexts. Decision Intel\'s 20×20 interaction matrix encodes 18 named toxic combinations from this literature — "overconfidence + confirmation," "sunk cost + optimism," "anchoring + availability" — each with a severity weight and a mapped historical case showing the pattern in the wild (Kodak, Blockbuster, Nokia, etc.). The compound DQI penalty for a toxic combination is larger than the sum of its parts.',
        whyItMatters:
          'Single-bias tooling (any LLM prompt) can identify a confirmation bias. It cannot identify that confirmation + overconfidence + sunk cost is the specific pattern that preceded Kodak\'s 2012 collapse. That pattern-matching is the step between "bias detection" and "decision intelligence" — and it\'s where a sophisticated buyer realises we\'re a different category of product.',
        action:
          'Memorise 3 named toxic combinations and their historical cases. When a CSO asks "what\'s an example?" — you should not hesitate.',
        reflection:
          'Which toxic combination is most present in your own current decision-making about Decision Intel? (Seriously — go look at the matrix.)',
        sources: [
          {
            label: 'Bazerman & Chugh (2022)',
            detail:
              '"Better, Not Perfect: A Realist\'s Guide to Maximum Sustainable Goodness" — Harper Business. Consolidates the bias-interaction research.',
          },
          {
            label: 'Kogut & Zander (1996)',
            detail:
              '"What Firms Do? Coordination, Identity, and Learning" — Organization Science. Compounding effects of cognitive biases in M&A.',
          },
          {
            label: 'Internal',
            detail:
              'src/lib/scoring/toxic-combinations.ts — the 18 canonical patterns and their severity weights.',
          },
        ],
        csoPitch:
          "Single biases are manageable. The dangerous thing is the combination. When overconfidence layers on top of confirmation bias on top of sunk cost, you've reproduced the decision pattern that preceded Kodak, Nokia, and Blockbuster — and the failure rate compounds multiplicatively. We price the compound risk directly: 18 named toxic combinations with historical exemplars. Your existing tooling gives you a bias; we give you the bias pattern.",
        mnaPitch:
          "The deals that fail catastrophically almost never fail from a single cognitive error. They fail from pattern: overconfidence plus confirmation plus sunk-cost anchoring is the exact triad that ran through AOL-Time Warner, HP-Autonomy, and Kraft-Heinz-Unilever. DI's 20×20 interaction matrix flags 18 named toxic combinations and maps each to the specific historical deal that demonstrated the pattern. Your associate's memo doesn't get \"confirmation bias detected\"; it gets \"this is structurally the Kraft-Heinz pattern, here's the post-close literature on what broke and why.\"",
        corpStrategyPitch:
          "The strategic-planning decisions that unwind in hindsight almost always carry a toxic combination — not a single bias. Kodak's 2012 collapse was confirmation plus overconfidence plus sunk cost compounding over a decade. DI's 20×20 matrix encodes 18 of these named patterns with the historical exemplar for each, so when a recommendation carries the Kodak pattern, the flag doesn't read as an algorithmic verdict — it reads as \"your memo's structural profile matches the company-level decision sequence that preceded a known multi-billion-dollar unwind.\" That's the conversation steering committees can actually have.",
        vcPitch:
          'The toxic-combinations feature is a good example of why we refuse to call ourselves an "LLM bias detector." An LLM can find a single bias in text. It cannot tell you that the specific triad of biases present is the one that killed Kodak. That requires a matrix of named combinations, calibrated severities, and a case library — three assets that don\'t exist outside our product.',
      },
      {
        id: 'pf_7',
        order: 7,
        title: 'The 12-Node Pipeline — Why Not Just One LLM Call',
        readTime: '6 min',
        summary:
          "Decision Intel's LangGraph pipeline runs 12 specialised nodes over each memo, not one generalist LLM prompt. This is the architectural reason we exist.",
        insight:
          "Every memo goes through 12 nodes in our LangGraph pipeline. They split into roughly 8 sequential + 4 parallel, driven by data dependencies. The sequence: (1) GDPR anonymiser strips PII, (2) structurer parses the memo into sections, (3) intelligence gatherer pulls relevant external context, (4) bias detection flags the 30+ taxonomy matches, (5) three-judge noise measurement runs in parallel, (6) logical coherence analysis checks argument validity, (7) pre-mortem generates failure scenarios, (8) Red Team surfaces the top adversarial objection, (9) fact-check verifies quantitative claims against external sources, (10) compliance mapper cross-links flags to 7 regulatory frameworks, (11) compound-risk scorer applies the 20×20 matrix, (12) verdict synthesiser produces DQI + summary. Each node has a specialised prompt and a specialised output schema; the outputs feed forward. A single LLM call cannot hit this depth because the model has to do everything at once with no specialised context per step. The pipeline is the product. It's also why per-audit cost is ~£0.30–0.50 — we're firing ~17 LLM calls, not one.",
        whyItMatters:
          'When a VC asks "what stops OpenAI from replacing you?" or a CSO asks "isn\'t this just a ChatGPT wrapper?" — you need the pipeline in your head. Twelve specialised nodes, each with distinct prompts, each calibrated to a specific decision-quality dimension, each with schema-validated outputs. Describe it, name three nodes by function, and you\'ve ended the ChatGPT-wrapper question.',
        action:
          'Read src/lib/agents/graph.ts and src/lib/agents/nodes.ts. Then write a 3-sentence architecture answer for "is this just GPT-4?" Memorise it.',
        reflection:
          'If you had to cut one node from the pipeline to reduce per-audit cost, which is least load-bearing? Your answer reveals how well you understand the architecture.',
        sources: [
          {
            label: 'LangGraph docs',
            detail:
              "LangChain's graph-based orchestration framework — the substrate we're built on.",
          },
          {
            label: 'Anthropic (2024)',
            detail:
              '"Building effective agents" — Anthropic Engineering Blog. Sequential vs. parallel agent patterns.',
          },
          {
            label: 'Internal',
            detail:
              'src/lib/agents/nodes.ts (2,297 lines), src/lib/agents/graph.ts, src/lib/agents/prompts.ts.',
          },
        ],
        csoPitch:
          'Every strategic memo goes through twelve specialised analyses: anonymisation, structure parsing, intelligence enrichment, bias detection, noise measurement across three judges, logical coherence, pre-mortem, red team, fact-check, compliance mapping, compound-risk scoring, and final verdict. Each step has a different prompt, a different output schema, and a different validation pass. A single ChatGPT call can give you an opinion on the memo. This gives you twelve calibrated answers, composed into a DQI your audit committee can defend.',
        mnaPitch:
          "Every deal memo runs through twelve specialised analyses end-to-end. The ones that matter most for M&A: intelligence gatherer pulls comparable-deal context and acquirer filings; bias detector flags confirmation and anchoring by paragraph; three-judge noise measurement shows whether equally qualified associates would verdict this deal the same way; pre-mortem generates the 12-month failure scenarios; Red Team surfaces the single objection the partner hasn't yet asked; compliance mapper cites SOX materiality on any earnings-related claim. You get twelve validated outputs, not one opinion. Your IC memo becomes a defensible evidence pack, not a narrative.",
        corpStrategyPitch:
          "Twelve specialised nodes, each calibrated to a specific decision-quality dimension your strategic-review cadence already cares about: structure, intelligence, bias, noise, coherence, failure scenarios, adversarial objections, fact-check, compliance mapping, compound risk, and verdict synthesis. Each node runs its own prompt against a schema-validated output, and the pipeline's outputs feed forward so downstream nodes reason over upstream evidence. One ChatGPT call can't reproduce this because the model would have to do everything at once without specialised context. That architectural choice is what converts \"AI-assisted strategy\" from a buzzword into an auditable workflow your CSO office can defend.",
        vcPitch:
          "We're an agent pipeline, not an LLM wrapper. Twelve specialised nodes across LangGraph, with schema-validated outputs between each step, fallback model routing, and a per-node cost model. Our cost per audit is £0.30–0.50 because we're running seventeen LLM calls end-to-end. The architecture is the defensibility — anyone trying to catch up has to rebuild all twelve specialised prompt-output pairs and the glue between them. That's twelve specialised products, not one.",
      },
      {
        id: 'pf_8',
        order: 8,
        title: 'Regulatory Frameworks — The Seven We Map Against',
        readTime: '5 min',
        summary:
          'Every flag Decision Intel surfaces is cross-linked to the specific section of the specific framework it touches. Without that, enterprise sales is blocked. With it, we unlock procurement.',
        insight:
          'We map against seven frameworks: GDPR (data processing + Article 22 automated-decision provisions), SOC 2 Type II (trust services criteria — security, availability, confidentiality, processing integrity, privacy), HIPAA (health-sector decisions), CCPA (California residents), SOX (financial materiality), the EU AI Act (risk tiers + transparency obligations), and NIST AI Risk Management Framework (Govern/Map/Measure/Manage). Each framework appears because a category of Fortune 500 customer cannot purchase without it. GDPR gates EU deals; SOC 2 gates any regulated industry; HIPAA gates healthcare; SOX gates public-company CFO approval; the EU AI Act is the rising gate on any AI-involved decision process; NIST is becoming the US federal standard. Each flag in our taxonomy carries a mapped reference — "this overconfidence flag in a quarterly earnings memo is material under SOX § 404." That mapping is the product surface that turns a strategy tool into one the audit committee will sign off on.',
        whyItMatters:
          "Compliance mapping is the single most underrated product moat in our category. Cloverpop doesn't have it. Consulting doesn't bundle it. ChatGPT can't credibly provide it. Any Fortune 500 buyer's procurement team will require it within 48 hours of the decision to buy. You should name all seven frameworks and explain which gates which customer — when a CSO starts visualising their audit committee meeting, that is the moment of purchase intent.",
        action:
          'For each of the seven frameworks, write one sentence on what it requires and which customer category it gates. Keep that card close before any enterprise call.',
        reflection:
          "Which of the seven do you currently understand least? Learn it this week — it will come up in a CSO call, and you don't want that first time to be the meeting.",
        sources: [
          {
            label: 'EU AI Act (2024)',
            detail: 'Regulation (EU) 2024/1689. Risk tiers + obligations for high-risk AI systems.',
          },
          {
            label: 'NIST AI RMF (2023)',
            detail: '"AI Risk Management Framework 1.0" — NIST. Govern/Map/Measure/Manage.',
          },
          {
            label: 'AICPA TSC',
            detail:
              'SOC 2 Trust Services Criteria. The five trust principles that define the audit scope.',
          },
          {
            label: 'Internal',
            detail:
              'src/lib/compliance/* — our seven framework mappers and the Audit Defense Packet exporter.',
          },
        ],
        csoPitch:
          "Every flag comes with a regulatory citation. If we detect confirmation bias in a quarterly earnings memo, the flag carries a SOX §404 materiality reference. If we detect automated-decision influence in a GDPR-scope pipeline, the flag carries Article 22. Your audit committee doesn't have to take the tool on faith; they can review each flag against its cited regulatory source. That's the standard required to put AI inside a regulated decision process.",
        mnaPitch:
          "Deal-side compliance is where most strategy tools fail procurement. Every flag on a DI-audited thesis is cross-mapped to the specific regulatory framework that touches it: SOX §404 materiality on any earnings-impact claim, GDPR Article 22 on automated-decision influence over EU data subjects, EU AI Act risk tiers on AI-assisted due diligence, HIPAA for healthcare-sector deals. Your GC's team doesn't have to take the tool on faith — they can review each flag against its citation. This is the standard that lets DI sit inside IC workflows at regulated acquirors.",
        corpStrategyPitch:
          "Your audit committee will eventually ask how AI-assisted strategic-decision tooling is defensible under their compliance posture. DI ships that answer as product, not documentation. Every flag cross-links to one of seven regulatory frameworks — GDPR, SOC 2 Type II, HIPAA, CCPA, SOX, EU AI Act, NIST AI RMF — with the specific section the flag touches. On Pro tier you get the Audit Defense Packet as a regulator-grade PDF for every memo. The practical consequence: your strategy function can adopt AI-assisted decision auditing six months before the rest of your peers do, because compliance isn't a gating conversation — it's a pre-answered one.",
        vcPitch:
          "Every Fortune 500 procurement team vetoes a tool that can't produce regulator-grade defence documents. We ship the Audit Defense Packet on Pro tier — a regulator-grade PDF citing every framework section our flags touch. This isn't a \"compliance feature\"; it's the thing that unblocks the procurement gate. Our enterprise sales motion is built around it.",
      },
      {
        id: 'pf_9',
        order: 9,
        title: 'The 135 Case Library — Cross-Decision Intelligence',
        readTime: '6 min',
        summary:
          "Our library of 135 audited historical decisions is not a marketing asset — it's the training prior for every new audit. Pattern-matching a new memo against known failures is the research contribution.",
        insight:
          'Our library currently holds 135 deduplicated historical strategic decisions — Kodak digital delay, Blockbuster rejecting Netflix, Nokia on touchscreen, Kraft-Heinz 3G merger, Wirecard fraud, Theranos, Quibi, Meta metaverse pivot, etc. Each case carries the pre-decision memo (or reconstructed equivalent), the biases present at decision time, the red flags detectable without hindsight, and the eventual outcome. Tier 2 cases carry DQI estimate, timeline, stakeholders, counterfactual, post-mortem citations, and pattern-family classification. The library powers two distinct product behaviours: (1) Bias Genome — a ranked leaderboard of which biases appear most often in failed decisions, with failure-lift multipliers computed against baseline, and (2) cross-decision intelligence on the audit page — "this memo\'s bias profile matches 12 historical cases; 9 of 12 produced negative outcomes." Number matters: 135 is large enough to reject "anecdotal" objections, small enough that each entry is hand-verified and primary-source cited. We deliberately fight survivorship bias by including cases where the same pattern produced good outcomes.',
        whyItMatters:
          "The case library is the answer to \"isn't this all speculative?\" If a CSO pushes back on the bias framework as theoretical, the case library is the deflection: \"Your memo's profile is structurally identical to Case A, Case B, Case C — here are the outcomes each produced.\" That's concrete enough to shift the conversation from 'do I believe this' to 'how confident am I that I'm not in that pattern.' That is a different sale entirely.",
        action:
          'Read five Tier 2 cases in full (Kodak, Blockbuster, Wirecard, Theranos, Meta). Memorise each pattern family. You should be able to invoke them by name on a call.',
        reflection:
          'If a VC said "135 cases is small — McKinsey has thousands," what is your two-sentence answer? If you don\'t have one, write it now.',
        sources: [
          {
            label: 'Internal',
            detail:
              'src/lib/data/case-studies/* — the full 135-case library, deduplicated and primary-source cited.',
          },
          {
            label: 'Lovallo & Sibony (2010)',
            detail:
              '"The Case for Behavioral Strategy" — McKinsey Quarterly. Frames the behavioural-strategy opportunity at scale.',
          },
          {
            label: 'Finkelstein (2004)',
            detail:
              '"Why Smart Executives Fail" — Portfolio. Pattern-family taxonomy for corporate decision failures.',
          },
        ],
        csoPitch:
          "Your decision is not novel. We have 135 structurally similar memos in the library, each with the pre-decision document, the bias profile, and the confirmed outcome. When we audit your memo, we surface the five closest historical matches and show you what each produced. That's the step your quarterly strategy review cannot replicate — it's lookup against five decades of corporate decision history, not one analyst's opinion.",
        mnaPitch:
          "Your firm has written, at most, a few hundred theses in its history. Our library holds 135 structurally comparable deals — AOL-Time Warner, Nortel-Nokia-Siemens, Kraft-Heinz, HP-Autonomy, Yahoo-Tumblr, Microsoft-Nokia — each with the pre-close memo, the biases present at decision time, and the confirmed outcome. When we audit your thesis, we surface the five closest historical matches and show you what each produced. Your partners can say \"we hit the same pattern Kraft-Heinz did on Unilever\" with evidence, not analogy. That conversation doesn't happen today because the lookup infrastructure doesn't exist outside DI.",
        corpStrategyPitch:
          "135 deduplicated historical strategic recommendations, each with the original pre-decision memo (or reconstructed equivalent), the biases present at decision time, the pattern-family classification (Kodak-pattern, Blockbuster-pattern, Nortel-pattern, etc.), and the confirmed outcome. When your committee audits a recommendation, DI surfaces the five closest historical matches and the outcome distribution across them. This is what turns the conversation from \"do I believe this memo\" into \"the memo's structural profile matches twelve historical recommendations; nine produced negative outcomes.\" Your steering committee isn't arguing taste; it's reviewing evidence.",
        vcPitch:
          'The case library is the training prior for every new audit. Each new confirmed customer outcome extends it, making subsequent audits more accurate. 135 is the deduplicated count — every case is hand-verified, primary-source cited, and includes a counter-exemplar where available to defuse survivorship bias. Building this library took years and is the kind of content moat that compounds, not depreciates.',
      },
    ],
  },
];

export const TOTAL_LESSONS = TRACKS.reduce((sum, t) => sum + t.lessons.length, 0);

export function getProgress(completed: string[]): {
  total: number;
  done: number;
  pct: number;
  byTrack: Record<string, { done: number; total: number }>;
} {
  const byTrack: Record<string, { done: number; total: number }> = {};
  for (const track of TRACKS) {
    const done = track.lessons.filter(l => completed.includes(l.id)).length;
    byTrack[track.id] = { done, total: track.lessons.length };
  }
  const done = completed.filter(id => TRACKS.some(t => t.lessons.some(l => l.id === id))).length;
  return { total: TOTAL_LESSONS, done, pct: Math.round((done / TOTAL_LESSONS) * 100), byTrack };
}
