import type { BiasCategory } from '@/types';

/**
 * Structured academic reference for a cognitive bias.
 *
 * `citation` is the human-readable full reference (used by existing UI surfaces
 * as a string fallback). The other fields are structured so the UI can render
 * a clickable DOI link, a hover card with author/venue/year, or feed a Works
 * Cited section in exported PDFs.
 */
export interface AcademicReference {
  /** Full formatted citation, APA-style. Always present. */
  citation: string;
  authors: string;
  year: string;
  title: string;
  venue: string;
  /** DOI without the https://doi.org/ prefix, e.g. "10.1126/science.185.4157.1124". */
  doi?: string;
  /** Stable URL for works without a DOI (books, pre-DOI papers, etc.). */
  url?: string;
}

export interface BiasEducationContent {
  realWorldExample: {
    title: string;
    description: string;
    company?: string;
    year?: string;
  };
  debiasingTechniques: string[];
  relatedBiases: Array<{ key: BiasCategory; reason: string }>;
  academicReference: AcademicReference;
  quickTip: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

export const BIAS_EDUCATION: Record<BiasCategory, BiasEducationContent> = {
  confirmation_bias: {
    realWorldExample: {
      title: 'Kodak and Digital Photography',
      description:
        'Kodak engineer Steve Sasson invented the digital camera in 1975, but leadership dismissed evidence that digital would replace film — selectively citing data showing film was still profitable. By the time they pivoted, it was too late.',
      company: 'Kodak',
      year: '1975–2012',
    },
    debiasingTechniques: [
      'Assign a "Devil\'s Advocate" to challenge the dominant hypothesis before any major decision.',
      'Use a structured "Consider the Opposite" exercise: list 3 reasons your conclusion might be wrong.',
      'Seek out disconfirming evidence before finalizing — specifically look for data that contradicts your position.',
    ],
    relatedBiases: [
      {
        key: 'selective_perception',
        reason: 'Both involve filtering information to match existing beliefs',
      },
      {
        key: 'anchoring_bias',
        reason: 'Initial beliefs act as anchors that confirmation bias reinforces',
      },
    ],
    academicReference: {
      citation:
        'Wason, P.C. (1960). "On the failure to eliminate hypotheses in a conceptual task." Quarterly Journal of Experimental Psychology, 12(3), 129–140.',
      authors: 'Wason, P.C.',
      year: '1960',
      title: 'On the failure to eliminate hypotheses in a conceptual task',
      venue: 'Quarterly Journal of Experimental Psychology, 12(3), 129–140',
      doi: '10.1080/17470216008416717',
    },
    quickTip:
      'Before deciding, write down what evidence would change your mind — then go look for it.',
    difficulty: 'hard',
  },
  anchoring_bias: {
    realWorldExample: {
      title: 'Real Estate Pricing Experiments',
      description:
        "In Northcraft & Neale's landmark study, real estate agents were given different listing prices for identical properties. Even experienced agents' valuations were heavily influenced by the arbitrary initial price, despite claiming they ignored it.",
      company: 'University of Arizona Study',
      year: '1987',
    },
    debiasingTechniques: [
      'Generate your own estimate BEFORE seeing any reference numbers or proposals.',
      'Use multiple independent anchors — get 3+ data points from different sources before averaging.',
      'Explicitly challenge the first number you encounter: ask "Why is this the right starting point?"',
    ],
    relatedBiases: [
      {
        key: 'framing_effect',
        reason: 'Anchors are a specific form of framing that sets a reference point',
      },
      {
        key: 'confirmation_bias',
        reason: 'Once anchored, people seek data confirming the anchor value',
      },
    ],
    academicReference: {
      citation:
        'Tversky, A. & Kahneman, D. (1974). "Judgment under Uncertainty: Heuristics and Biases." Science, 185(4157), 1124–1131.',
      authors: 'Tversky, A. & Kahneman, D.',
      year: '1974',
      title: 'Judgment under Uncertainty: Heuristics and Biases',
      venue: 'Science, 185(4157), 1124–1131',
      doi: '10.1126/science.185.4157.1124',
    },
    quickTip:
      'Always ask: "Would I reach the same conclusion if the first number I saw was different?"',
    difficulty: 'moderate',
  },
  availability_heuristic: {
    realWorldExample: {
      title: 'Post-9/11 Driving Deaths',
      description:
        'After 9/11, Americans drove instead of flying due to vivid fear of terrorism. This led to an estimated 1,595 additional traffic deaths in the year following — far exceeding the risk of another attack. Vivid, recent events distorted risk assessment.',
      company: 'U.S. Transportation Data',
      year: '2001–2002',
    },
    debiasingTechniques: [
      'Always check base rates: ask "How often does this actually happen?" before making probability judgments.',
      'Use statistical data instead of examples — replace "I heard about a case where…" with "The data shows…"',
      'Create a "recency check": is this top of mind because it\'s truly important or because it happened recently?',
    ],
    relatedBiases: [
      {
        key: 'recency_bias',
        reason: 'Recent events are more available in memory, amplifying this heuristic',
      },
      { key: 'framing_effect', reason: 'Vivid examples frame perception of probability' },
    ],
    academicReference: {
      citation:
        'Tversky, A. & Kahneman, D. (1973). "Availability: A heuristic for judging frequency and probability." Cognitive Psychology, 5(2), 207–232.',
      authors: 'Tversky, A. & Kahneman, D.',
      year: '1973',
      title: 'Availability: A heuristic for judging frequency and probability',
      venue: 'Cognitive Psychology, 5(2), 207–232',
      doi: '10.1016/0010-0285(73)90033-9',
    },
    quickTip: 'When a risk feels scary, look up the actual statistics before adjusting your plans.',
    difficulty: 'moderate',
  },
  groupthink: {
    realWorldExample: {
      title: 'Bay of Pigs Invasion',
      description:
        "President Kennedy's advisory team unanimously supported the 1961 invasion of Cuba despite serious flaws in the plan. Advisors suppressed doubts to maintain group harmony. After the disaster, Kennedy restructured his decision-making process to explicitly encourage dissent.",
      company: 'U.S. Government',
      year: '1961',
    },
    debiasingTechniques: [
      'Use anonymous voting or written submissions before group discussion to capture independent opinions.',
      'Rotate a formal "dissenter" role — someone whose job is to find flaws in the consensus position.',
      'Split into independent sub-groups that analyze the problem separately before reconvening.',
    ],
    relatedBiases: [
      {
        key: 'authority_bias',
        reason: 'Senior voices can suppress dissent, accelerating groupthink',
      },
      { key: 'bandwagon_effect', reason: 'People join the majority to avoid social friction' },
    ],
    academicReference: {
      citation:
        'Janis, I.L. (1972). Victims of Groupthink: A Psychological Study of Foreign-Policy Decisions and Fiascoes. Boston: Houghton Mifflin.',
      authors: 'Janis, I.L.',
      year: '1972',
      title:
        'Victims of Groupthink: A Psychological Study of Foreign-Policy Decisions and Fiascoes',
      venue: 'Houghton Mifflin (book)',
      url: 'https://psycnet.apa.org/record/1975-29417-000',
    },
    quickTip: "If everyone agrees too quickly, that's a red flag — not a green light.",
    difficulty: 'hard',
  },
  authority_bias: {
    realWorldExample: {
      title: 'Milgram Obedience Experiments',
      description:
        "Stanley Milgram's experiments showed that 65% of participants administered what they believed were lethal electric shocks when instructed by an authority figure in a lab coat. Authority cues override independent moral judgment.",
      company: 'Yale University',
      year: '1963',
    },
    debiasingTechniques: [
      "Evaluate arguments on evidence quality, not the seniority of who's making them.",
      'Use blind review processes where the source identity is hidden during evaluation.',
      'Ask: "Would I accept this argument if an intern presented it?"',
    ],
    relatedBiases: [
      {
        key: 'groupthink',
        reason: 'Authority figures can trigger conformity that leads to groupthink',
      },
      {
        key: 'bandwagon_effect',
        reason: 'Authority endorsement creates a bandwagon others follow',
      },
    ],
    academicReference: {
      citation:
        'Milgram, S. (1963). "Behavioral Study of Obedience." Journal of Abnormal and Social Psychology, 67(4), 371–378.',
      authors: 'Milgram, S.',
      year: '1963',
      title: 'Behavioral Study of Obedience',
      venue: 'Journal of Abnormal and Social Psychology, 67(4), 371–378',
      doi: '10.1037/h0040525',
    },
    quickTip: 'Separate the argument from the arguer — evaluate evidence, not credentials.',
    difficulty: 'moderate',
  },
  bandwagon_effect: {
    realWorldExample: {
      title: 'Dot-Com Bubble',
      description:
        'In the late 1990s, investors poured money into internet companies with no revenue models because "everyone else was investing." The NASDAQ lost 78% of its value when the bubble burst in 2000–2002, wiping out $5 trillion in market value.',
      company: 'NASDAQ Market',
      year: '1997–2002',
    },
    debiasingTechniques: [
      'Before following a trend, write down your independent rationale — would you still do this if nobody else was?',
      'Track the base rate of trend adoption vs. actual success rates in your industry.',
      'Implement a "cooling off" period: wait 48 hours before joining any fast-moving consensus.',
    ],
    relatedBiases: [
      { key: 'groupthink', reason: 'Bandwagon adoption in groups becomes groupthink' },
      {
        key: 'authority_bias',
        reason: 'Following authorities can trigger broader bandwagon effects',
      },
    ],
    academicReference: {
      citation:
        'Leibenstein, H. (1950). "Bandwagon, Snob, and Veblen Effects in the Theory of Consumers\' Demand." Quarterly Journal of Economics, 64(2), 183–207.',
      authors: 'Leibenstein, H.',
      year: '1950',
      title: "Bandwagon, Snob, and Veblen Effects in the Theory of Consumers' Demand",
      venue: 'Quarterly Journal of Economics, 64(2), 183–207',
      doi: '10.2307/1882692',
    },
    quickTip:
      'Popularity is not proof. Ask: "What\'s the evidence this works, separate from who else is doing it?"',
    difficulty: 'easy',
  },
  overconfidence_bias: {
    realWorldExample: {
      title: 'Long-Term Capital Management Collapse',
      description:
        'Nobel Prize-winning economists running LTCM were so confident in their models that they leveraged $4.8B into $125B in derivatives. When markets moved against them in 1998, the fund collapsed so catastrophically it threatened the global financial system.',
      company: 'LTCM',
      year: '1998',
    },
    debiasingTechniques: [
      'Use calibration training: practice estimating ranges and track your accuracy over time.',
      'Replace point estimates with ranges (e.g., "between 2-4 months" instead of "3 months exactly").',
      "Ask: \"What's the probability I'm wrong?\" and if you can't say at least 10%, you're likely overconfident.",
    ],
    relatedBiases: [
      { key: 'planning_fallacy', reason: 'Overconfidence in timelines is the planning fallacy' },
      { key: 'hindsight_bias', reason: 'Past "correct" predictions inflate future confidence' },
    ],
    academicReference: {
      citation:
        'Moore, D.A. & Healy, P.J. (2008). "The trouble with overconfidence." Psychological Review, 115(2), 502–517.',
      authors: 'Moore, D.A. & Healy, P.J.',
      year: '2008',
      title: 'The trouble with overconfidence',
      venue: 'Psychological Review, 115(2), 502–517',
      doi: '10.1037/0033-295X.115.2.502',
    },
    quickTip: "Add 30% to your worst-case estimate — that's probably closer to realistic.",
    difficulty: 'hard',
  },
  hindsight_bias: {
    realWorldExample: {
      title: '2008 Financial Crisis "Predictors"',
      description:
        'After the 2008 crash, countless analysts claimed they "saw it coming." However, pre-crisis records show most were bullish. Hindsight bias rewrites memory to make past events seem predictable, which prevents learning the real lessons.',
      company: 'Global Financial Markets',
      year: '2008',
    },
    debiasingTechniques: [
      'Keep a decision journal: record your predictions AND your confidence BEFORE outcomes are known.',
      'In post-mortems, start by asking "What did we believe at the time?" before discussing what happened.',
      'Use pre-registration: document your analysis and predictions before events unfold.',
    ],
    relatedBiases: [
      {
        key: 'overconfidence_bias',
        reason: 'Hindsight bias inflates confidence in future predictions',
      },
      {
        key: 'confirmation_bias',
        reason: 'After the fact, people selectively remember confirming signals',
      },
    ],
    academicReference: {
      citation:
        'Fischhoff, B. (1975). "Hindsight is not equal to foresight: The effect of outcome knowledge on judgment under uncertainty." Journal of Experimental Psychology: Human Perception and Performance, 1(3), 288–299.',
      authors: 'Fischhoff, B.',
      year: '1975',
      title:
        'Hindsight is not equal to foresight: The effect of outcome knowledge on judgment under uncertainty',
      venue: 'Journal of Experimental Psychology: Human Perception and Performance, 1(3), 288–299',
      doi: '10.1037/0096-1523.1.3.288',
    },
    quickTip:
      'Before reviewing what happened, write down what you expected — then compare honestly.',
    difficulty: 'moderate',
  },
  planning_fallacy: {
    realWorldExample: {
      title: 'Sydney Opera House',
      description:
        'Originally estimated at $7M and 4 years, the Sydney Opera House took 16 years and cost $102M — a 1,457% cost overrun. This pattern repeats across 90% of large infrastructure projects worldwide.',
      company: 'NSW Government, Australia',
      year: '1957–1973',
    },
    debiasingTechniques: [
      'Use "reference class forecasting": compare to similar past projects rather than building bottom-up estimates.',
      'Apply a "planning fallacy multiplier" — historical data suggests multiplying time estimates by 1.5–2x.',
      'Break projects into small milestones and estimate each independently, then add buffer time.',
    ],
    relatedBiases: [
      {
        key: 'overconfidence_bias',
        reason: 'Overconfidence in ability to execute leads to optimistic plans',
      },
      {
        key: 'anchoring_bias',
        reason: 'Initial optimistic estimates anchor subsequent adjustments',
      },
    ],
    academicReference: {
      citation:
        'Kahneman, D. & Tversky, A. (1979). "Intuitive prediction: biases and corrective procedures." TIMS Studies in Management Science, 12, 313–327.',
      authors: 'Kahneman, D. & Tversky, A.',
      year: '1979',
      title: 'Intuitive prediction: biases and corrective procedures',
      venue: 'TIMS Studies in Management Science, 12, 313–327',
      url: 'https://apps.dtic.mil/sti/pdfs/ADA047747.pdf',
    },
    quickTip:
      'How long did similar projects actually take? Use that as your baseline, not your optimism.',
    difficulty: 'moderate',
  },
  loss_aversion: {
    realWorldExample: {
      title: 'New Coke Reversal',
      description:
        'In 1985, Coca-Cola replaced its formula with New Coke after winning blind taste tests. Despite better taste-test results, consumers revolted — not because New Coke was bad, but because losing the original felt like a loss. Coca-Cola reversed the decision within 79 days.',
      company: 'Coca-Cola',
      year: '1985',
    },
    debiasingTechniques: [
      'Reframe decisions in terms of total outcomes rather than gains vs. losses — focus on the end state.',
      'Use the "10/10/10 rule": How will you feel about this in 10 minutes, 10 months, and 10 years?',
      'Calculate the expected value objectively: multiply probability × magnitude for both gain and loss scenarios.',
    ],
    relatedBiases: [
      { key: 'status_quo_bias', reason: 'Fear of loss makes people prefer the status quo' },
      {
        key: 'sunk_cost_fallacy',
        reason: 'Loss aversion on invested resources drives sunk cost thinking',
      },
    ],
    academicReference: {
      citation:
        'Kahneman, D. & Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk." Econometrica, 47(2), 263–291.',
      authors: 'Kahneman, D. & Tversky, A.',
      year: '1979',
      title: 'Prospect Theory: An Analysis of Decision under Risk',
      venue: 'Econometrica, 47(2), 263–291',
      doi: '10.2307/1914185',
    },
    quickTip:
      'Ask: "If I didn\'t already have this, would I pay to get it?" That reveals whether you\'re protecting a loss or making a smart choice.',
    difficulty: 'moderate',
  },
  sunk_cost_fallacy: {
    realWorldExample: {
      title: 'Concorde Supersonic Jet',
      description:
        'The British and French governments continued funding Concorde for decades despite clear evidence it would never be commercially viable — because billions had already been spent. The project became the textbook "Concorde fallacy" example.',
      company: 'British/French Governments',
      year: '1962–2003',
    },
    debiasingTechniques: [
      'Apply the "clean slate test": If you were starting fresh today with no prior investment, would you still choose this path?',
      "Separate past costs from future decisions — what's spent is gone regardless of what you decide next.",
      'Set pre-defined "kill criteria" at the start of projects and honor them when triggered.',
    ],
    relatedBiases: [
      {
        key: 'loss_aversion',
        reason: 'Abandoning a project feels like "losing" the sunk investment',
      },
      {
        key: 'overconfidence_bias',
        reason: 'Confidence that more investment will turn things around',
      },
    ],
    academicReference: {
      citation:
        'Arkes, H.R. & Blumer, C. (1985). "The psychology of sunk cost." Organizational Behavior and Human Decision Processes, 35(1), 124–140.',
      authors: 'Arkes, H.R. & Blumer, C.',
      year: '1985',
      title: 'The psychology of sunk cost',
      venue: 'Organizational Behavior and Human Decision Processes, 35(1), 124–140',
      doi: '10.1016/0749-5978(85)90049-4',
    },
    quickTip:
      'Money already spent is gone. The only question is: "What\'s the best use of the NEXT dollar?"',
    difficulty: 'moderate',
  },
  status_quo_bias: {
    realWorldExample: {
      title: 'Blockbuster vs. Netflix',
      description:
        'Blockbuster had the chance to buy Netflix for $50M in 2000 but chose to protect its existing store model. The preference for the status quo — 9,000 physical stores — led to bankruptcy in 2010, while Netflix grew to a $150B company.',
      company: 'Blockbuster',
      year: '2000–2010',
    },
    debiasingTechniques: [
      'Periodically conduct "zero-base" reviews: justify every ongoing process as if starting from scratch.',
      'Assign someone to champion change — a specific person whose role is to argue for alternatives.',
      'Reframe the question: instead of "Should we change?" ask "If we were starting new, would we choose this current setup?"',
    ],
    relatedBiases: [
      {
        key: 'loss_aversion',
        reason: 'Change involves potential losses that trigger loss aversion',
      },
      {
        key: 'sunk_cost_fallacy',
        reason: 'Investment in the current state makes change feel wasteful',
      },
    ],
    academicReference: {
      citation:
        'Samuelson, W. & Zeckhauser, R. (1988). "Status quo bias in decision making." Journal of Risk and Uncertainty, 1(1), 7–59.',
      authors: 'Samuelson, W. & Zeckhauser, R.',
      year: '1988',
      title: 'Status quo bias in decision making',
      venue: 'Journal of Risk and Uncertainty, 1(1), 7–59',
      doi: '10.1007/BF00055564',
    },
    quickTip: 'Inaction is also a decision. Ask: "What is the cost of NOT changing?"',
    difficulty: 'easy',
  },
  framing_effect: {
    realWorldExample: {
      title: 'Asian Disease Problem',
      description:
        'Tversky & Kahneman showed that when a medical program was framed as "saving 200 out of 600 people" vs. "400 will die," participants reversed their preferences — despite identical outcomes. How information is presented changes decisions.',
      company: 'Stanford/Princeton Study',
      year: '1981',
    },
    debiasingTechniques: [
      'Reframe every proposal in at least two ways (positive and negative framing) before deciding.',
      'Convert relative numbers to absolute: "20% improvement" → "improves from 50 to 60 out of 300."',
      'Ask the presenter: "Can you show me this data framed differently?" — then compare your reactions.',
    ],
    relatedBiases: [
      { key: 'anchoring_bias', reason: 'Frames set anchors that influence subsequent judgment' },
      {
        key: 'selective_perception',
        reason: 'Framing activates selective attention to certain aspects',
      },
    ],
    academicReference: {
      citation:
        'Tversky, A. & Kahneman, D. (1981). "The framing of decisions and the psychology of choice." Science, 211(4481), 453–458.',
      authors: 'Tversky, A. & Kahneman, D.',
      year: '1981',
      title: 'The framing of decisions and the psychology of choice',
      venue: 'Science, 211(4481), 453–458',
      doi: '10.1126/science.7455683',
    },
    quickTip:
      'Flip the frame: if the data was presented oppositely, would you still reach the same conclusion?',
    difficulty: 'easy',
  },
  selective_perception: {
    realWorldExample: {
      title: 'Dartmouth vs. Princeton Football Study',
      description:
        'After a rough 1951 football game, students from each school watched identical film footage but "saw" completely different games — each side counted more fouls by the opposing team. Prior allegiances filtered perception of identical evidence.',
      company: 'Hastorf & Cantril Study',
      year: '1954',
    },
    debiasingTechniques: [
      'Use structured evaluation rubrics that force attention to all aspects, not just salient ones.',
      'Have someone with a different perspective review the same information independently.',
      'Practice "steel-manning": articulate the strongest version of the opposing view before critiquing it.',
    ],
    relatedBiases: [
      {
        key: 'confirmation_bias',
        reason: 'Selective perception is how confirmation bias operates at the perceptual level',
      },
      {
        key: 'framing_effect',
        reason: 'Expectations create internal frames that filter perception',
      },
    ],
    academicReference: {
      citation:
        'Hastorf, A.H. & Cantril, H. (1954). "They saw a game: A case study." Journal of Abnormal and Social Psychology, 49(1), 129–134.',
      authors: 'Hastorf, A.H. & Cantril, H.',
      year: '1954',
      title: 'They saw a game: A case study',
      venue: 'Journal of Abnormal and Social Psychology, 49(1), 129–134',
      doi: '10.1037/h0057880',
    },
    quickTip:
      'Ask someone who disagrees with you to read the same document — compare what each of you noticed.',
    difficulty: 'hard',
  },
  recency_bias: {
    realWorldExample: {
      title: 'Performance Review Season',
      description:
        "Research by Deloitte found that 62% of a performance rating is driven by events in the last 3 months, despite reviews covering a full year. A strong Q4 erases a weak Q1 in most managers' evaluations.",
      company: 'Deloitte Research',
      year: '2015',
    },
    debiasingTechniques: [
      'Keep running logs of events/data throughout the evaluation period rather than relying on memory.',
      'Weight time periods explicitly: assign equal importance to each quarter/month in your analysis.',
      'When making forecasts, compare current trends against 5-year and 10-year averages.',
    ],
    relatedBiases: [
      { key: 'availability_heuristic', reason: 'Recent events are more mentally available' },
      { key: 'anchoring_bias', reason: 'Recent data points anchor subsequent judgments' },
    ],
    academicReference: {
      citation:
        'Murdock, B.B. (1962). "The serial position effect of free recall." Journal of Experimental Psychology, 64(5), 482–488.',
      authors: 'Murdock, B.B.',
      year: '1962',
      title: 'The serial position effect of free recall',
      venue: 'Journal of Experimental Psychology, 64(5), 482–488',
      doi: '10.1037/h0045106',
    },
    quickTip:
      'Before making a judgment based on recent data, check whether the longer-term trend tells a different story.',
    difficulty: 'easy',
  },
  cognitive_misering: {
    realWorldExample: {
      title: 'Theranos Due Diligence Failures',
      description:
        "Investors poured $700M into Theranos based on Elizabeth Holmes' compelling narrative, without conducting basic technical due diligence. Board members — including former secretaries of state — relied on surface impressions rather than verifying the technology actually worked.",
      company: 'Theranos',
      year: '2003–2018',
    },
    debiasingTechniques: [
      'Implement mandatory "verification checkpoints" — specific stages where claims must be independently confirmed.',
      'Use the "5 Whys" technique: ask "why?" five times to push past superficial reasoning.',
      'Set a minimum deliberation time proportional to decision stakes — high-stakes decisions get at least 48 hours.',
    ],
    relatedBiases: [
      { key: 'authority_bias', reason: 'Deferring to authority is a form of cognitive misering' },
      {
        key: 'availability_heuristic',
        reason: 'Grabbing the most available answer instead of investigating',
      },
    ],
    academicReference: {
      citation:
        'Stanovich, K.E. & West, R.F. (2000). "Individual differences in reasoning: Implications for the rationality debate?" Behavioral and Brain Sciences, 23(5), 645–665.',
      authors: 'Stanovich, K.E. & West, R.F.',
      year: '2000',
      title: 'Individual differences in reasoning: Implications for the rationality debate?',
      venue: 'Behavioral and Brain Sciences, 23(5), 645–665',
      doi: '10.1017/S0140525X00003435',
    },
    quickTip:
      "If a high-stakes decision took less than an hour, you probably didn't think hard enough.",
    difficulty: 'moderate',
  },
  halo_effect: {
    realWorldExample: {
      title: 'Enron and the "Smartest Guys in the Room"',
      description:
        "Enron's early success in energy trading created a halo that blinded analysts, rating agencies, and investors to massive accounting fraud. The company's prestige and charismatic leadership made stakeholders assume competence across all operations, even as internal controls collapsed.",
      company: 'Enron',
      year: '1985–2001',
    },
    debiasingTechniques: [
      'Evaluate each dimension of a decision independently — score financial, operational, and strategic merits separately before combining.',
      'Use blind evaluation where possible: strip names, brands, and reputations from materials before assessment.',
      'Ask "Would I still rate this highly if the brand/person/track record were unknown?"',
    ],
    relatedBiases: [
      { key: 'authority_bias', reason: 'Prestige creates a halo that mimics authority' },
      {
        key: 'confirmation_bias',
        reason: 'A positive halo makes you seek confirming evidence',
      },
    ],
    academicReference: {
      citation:
        'Thorndike, E.L. (1920). "A constant error in psychological ratings." Journal of Applied Psychology, 4(1), 25–29.',
      authors: 'Thorndike, E.L.',
      year: '1920',
      title: 'A constant error in psychological ratings',
      venue: 'Journal of Applied Psychology, 4(1), 25–29',
      doi: '10.1037/h0071663',
    },
    quickTip:
      "If you can't name a specific weakness in the option you favor, you're probably under a halo.",
    difficulty: 'moderate',
  },
  gamblers_fallacy: {
    realWorldExample: {
      title: 'Monte Carlo Casino, 1913',
      description:
        'At the Monte Carlo Casino, the roulette ball landed on black 26 times in a row. Gamblers lost millions betting on red, convinced that a "correction" was due — but each spin was independent. The same fallacy appears in investment committees after a string of successful deals: "We\'re due for a miss."',
      company: 'Monte Carlo Casino',
      year: '1913',
    },
    debiasingTechniques: [
      'Explicitly state the base rate for each outcome before evaluating a sequence of events.',
      'Ask "Is there a causal mechanism linking past outcomes to this decision, or am I pattern-matching on randomness?"',
      'Use pre-commitment: decide your criteria before seeing the outcome sequence.',
    ],
    relatedBiases: [
      {
        key: 'recency_bias',
        reason: 'Recent streaks amplify the fallacy',
      },
      {
        key: 'overconfidence_bias',
        reason: 'Believing you can predict random outcomes',
      },
    ],
    academicReference: {
      citation:
        'Tversky, A. & Kahneman, D. (1971). "Belief in the law of small numbers." Psychological Bulletin, 76(2), 105–110.',
      authors: 'Tversky, A. & Kahneman, D.',
      year: '1971',
      title: 'Belief in the law of small numbers',
      venue: 'Psychological Bulletin, 76(2), 105–110',
      doi: '10.1037/h0031322',
    },
    quickTip:
      'Past outcomes only predict future ones when there is a genuine causal link — not just a pattern.',
    difficulty: 'moderate',
  },
  zeigarnik_effect: {
    realWorldExample: {
      title: "Yahoo's Incomplete Acquisitions",
      description:
        'Yahoo famously passed on acquiring Google (2002) and Facebook (2006). In subsequent acquisition decisions, the unfinished business of those missed deals heavily influenced strategy — leading to the overpriced $1.1B acquisition of Tumblr, partly driven by the psychological weight of previous "ones that got away."',
      company: 'Yahoo',
      year: '2002–2013',
    },
    debiasingTechniques: [
      'Explicitly list all "open loops" (unresolved past decisions) before starting a new evaluation — then consciously set them aside.',
      'Use a decision journal: closing out past decisions in writing reduces their psychological pull.',
      'Ask "Am I evaluating this opportunity on its own merits, or trying to close an old chapter?"',
    ],
    relatedBiases: [
      {
        key: 'sunk_cost_fallacy',
        reason: 'Unfinished tasks create psychological investment similar to sunk costs',
      },
      {
        key: 'loss_aversion',
        reason: 'Incomplete tasks feel like losses, driving irrational action',
      },
    ],
    academicReference: {
      citation:
        'Zeigarnik, B. (1927). "Das Behalten erledigter und unerledigter Handlungen" [On finished and unfinished tasks]. Psychologische Forschung, 9, 1–85.',
      authors: 'Zeigarnik, B.',
      year: '1927',
      title:
        'Das Behalten erledigter und unerledigter Handlungen [On finished and unfinished tasks]',
      venue: 'Psychologische Forschung, 9, 1–85',
      doi: '10.1007/BF02409755',
    },
    quickTip:
      'If a past missed opportunity keeps coming up in your current deliberation, name it and set it aside.',
    difficulty: 'hard',
  },
  paradox_of_choice: {
    realWorldExample: {
      title: 'Jam Study and Enterprise Software Selection',
      description:
        "Sheena Iyengar's famous study showed customers were 10x more likely to purchase when offered 6 jam varieties vs. 24. The same effect plagues enterprise procurement: when evaluating too many vendor options, committees often default to the incumbent or delay decisions indefinitely.",
      company: 'Columbia University / Enterprise Procurement',
      year: '2000',
    },
    debiasingTechniques: [
      'Limit initial screening to 3–5 options maximum using pre-agreed criteria before deep evaluation.',
      'Use "satisficing" deliberately: define your minimum acceptable criteria upfront and choose the first option that meets them.',
      'Implement a two-stage process: broad screening with hard cutoffs, then deep comparison of the shortlist only.',
    ],
    relatedBiases: [
      {
        key: 'status_quo_bias',
        reason: 'Too many choices leads to defaulting to the current option',
      },
      {
        key: 'cognitive_misering',
        reason: 'Choice overload triggers low-effort decision shortcuts',
      },
    ],
    academicReference: {
      citation:
        'Iyengar, S.S. & Lepper, M.R. (2000). "When choice is demotivating: Can one desire too much of a good thing?" Journal of Personality and Social Psychology, 79(6), 995–1006.',
      authors: 'Iyengar, S.S. & Lepper, M.R.',
      year: '2000',
      title: 'When choice is demotivating: Can one desire too much of a good thing?',
      venue: 'Journal of Personality and Social Psychology, 79(6), 995–1006',
      doi: '10.1037/0022-3514.79.6.995',
    },
    quickTip:
      'If your team has been evaluating options for weeks without converging, you probably have too many options.',
    difficulty: 'easy',
  },
};

/** Get education content for a bias, with safe fallback for unrecognized keys. */
export function getBiasEducation(biasType: string): BiasEducationContent | null {
  const normalized = biasType
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '') as BiasCategory;
  return BIAS_EDUCATION[normalized] || null;
}

/** Difficulty colors for display. */
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'var(--success)',
  moderate: 'var(--warning)',
  hard: 'var(--error)',
};
