/**
 * Proprietary Bias Ontology — Directed Graph of Bias Relationships
 *
 * A directed graph encoding empirically-grounded interaction weights between
 * cognitive biases observed in organizational decision-making. Relationships
 * are drawn from behavioral economics, social psychology, and judgment &
 * decision-making (JDM) research.
 */

// BiasCategory type used for reference — ontology uses string literals for extensibility

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BiasRelationship {
  from: string; // BiasCategory
  to: string; // BiasCategory
  type: 'amplifies' | 'enables' | 'masks' | 'correlates' | 'mitigates';
  weight: number; // 0.0-2.0 (1.0 = neutral, >1 = amplification, <1 = dampening)
  mechanism: string; // brief explanation of HOW they interact
  citation: string; // academic source
}

export interface BiasNode {
  id: string; // BiasCategory
  category: 'judgment' | 'memory' | 'social' | 'decision' | 'attention';
  cognitiveSystem: 'system1' | 'system2' | 'both'; // Kahneman dual-process
  prevalence: number; // 0-1 base rate in organizational decisions
  detectability: number; // 0-1 how easy to detect (low = harder)
}

// ---------------------------------------------------------------------------
// Nodes — every core BiasCategory with metadata
// ---------------------------------------------------------------------------

export const BIAS_NODES: BiasNode[] = [
  {
    id: 'confirmation_bias',
    category: 'judgment',
    cognitiveSystem: 'both',
    prevalence: 0.85,
    detectability: 0.35,
  },
  {
    id: 'anchoring_bias',
    category: 'judgment',
    cognitiveSystem: 'system1',
    prevalence: 0.78,
    detectability: 0.45,
  },
  {
    id: 'availability_heuristic',
    category: 'memory',
    cognitiveSystem: 'system1',
    prevalence: 0.72,
    detectability: 0.4,
  },
  {
    id: 'groupthink',
    category: 'social',
    cognitiveSystem: 'system2',
    prevalence: 0.65,
    detectability: 0.3,
  },
  {
    id: 'authority_bias',
    category: 'social',
    cognitiveSystem: 'system1',
    prevalence: 0.7,
    detectability: 0.5,
  },
  {
    id: 'bandwagon_effect',
    category: 'social',
    cognitiveSystem: 'system1',
    prevalence: 0.6,
    detectability: 0.55,
  },
  {
    id: 'overconfidence_bias',
    category: 'judgment',
    cognitiveSystem: 'system2',
    prevalence: 0.75,
    detectability: 0.25,
  },
  {
    id: 'hindsight_bias',
    category: 'memory',
    cognitiveSystem: 'system1',
    prevalence: 0.68,
    detectability: 0.3,
  },
  {
    id: 'planning_fallacy',
    category: 'decision',
    cognitiveSystem: 'system2',
    prevalence: 0.8,
    detectability: 0.5,
  },
  {
    id: 'loss_aversion',
    category: 'decision',
    cognitiveSystem: 'system1',
    prevalence: 0.82,
    detectability: 0.4,
  },
  {
    id: 'sunk_cost_fallacy',
    category: 'decision',
    cognitiveSystem: 'system2',
    prevalence: 0.7,
    detectability: 0.55,
  },
  {
    id: 'status_quo_bias',
    category: 'decision',
    cognitiveSystem: 'both',
    prevalence: 0.75,
    detectability: 0.45,
  },
  {
    id: 'framing_effect',
    category: 'judgment',
    cognitiveSystem: 'system1',
    prevalence: 0.77,
    detectability: 0.35,
  },
  {
    id: 'selective_perception',
    category: 'attention',
    cognitiveSystem: 'system1',
    prevalence: 0.73,
    detectability: 0.2,
  },
  {
    id: 'recency_bias',
    category: 'memory',
    cognitiveSystem: 'system1',
    prevalence: 0.7,
    detectability: 0.5,
  },
  {
    id: 'cognitive_misering',
    category: 'attention',
    cognitiveSystem: 'system1',
    prevalence: 0.8,
    detectability: 0.2,
  },
];

// ---------------------------------------------------------------------------
// Relationships — 50 research-backed directed edges
// ---------------------------------------------------------------------------

export const BIAS_RELATIONSHIPS: BiasRelationship[] = [
  // ---- Core relationships from specification ----
  {
    from: 'confirmation_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Seekers of confirmatory evidence anchor more strongly on hypothesis-consistent data, deepening the anchoring effect.',
    citation: 'Nickerson 1998, "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises"',
  },
  {
    from: 'groupthink',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.5,
    mechanism:
      'Group pressure to maintain consensus suppresses dissent, creating a shared confirmation loop where contradictory evidence is dismissed.',
    citation: 'Janis 1972, "Victims of Groupthink"',
  },
  {
    from: 'authority_bias',
    to: 'groupthink',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Deference to authority figures reduces independent evaluation, accelerating convergence toward a single viewpoint.',
    citation: 'Milgram 1963, "Behavioral Study of Obedience"',
  },
  {
    from: 'overconfidence_bias',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.6,
    mechanism:
      'Overconfident estimators systematically underweight risk and overestimate their ability to control outcomes, inflating planning optimism.',
    citation: 'Kahneman & Lovallo 1993, "Timid Choices and Bold Forecasts"',
  },
  {
    from: 'loss_aversion',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.5,
    mechanism:
      'The pain of realizing a loss from abandoning a project is weighted ~2x more than equivalent gains, driving continued investment.',
    citation: 'Thaler 1980, "Toward a Positive Theory of Consumer Choice"',
  },
  {
    from: 'anchoring_bias',
    to: 'framing_effect',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Initial anchors set a reference frame that biases subsequent evaluations toward the anchor-consistent frame.',
    citation: 'Tversky & Kahneman 1981, "The Framing of Decisions and the Psychology of Choice"',
  },
  {
    from: 'status_quo_bias',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Preference for existing arrangements reduces the perceived need for effortful deliberation, reinforcing System 1 dominance.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },
  {
    from: 'availability_heuristic',
    to: 'recency_bias',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Recent events are more cognitively available, making the availability heuristic disproportionately weight recent information.',
    citation:
      'Tversky & Kahneman 1973, "Availability: A Heuristic for Judging Frequency and Probability"',
  },
  {
    from: 'bandwagon_effect',
    to: 'groupthink',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Social proof cascades accelerate consensus formation, reducing the threshold for groupthink to emerge.',
    citation: 'Asch 1951, "Effects of Group Pressure upon the Modification of Judgments"',
  },
  {
    from: 'overconfidence_bias',
    to: 'selective_perception',
    type: 'masks',
    weight: 1.2,
    mechanism:
      'Overconfident individuals believe their perceptions are accurate, preventing recognition of selective filtering.',
    citation: 'Kruger & Dunning 1999, "Unskilled and Unaware of It"',
  },
  {
    from: 'hindsight_bias',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Believing past outcomes were foreseeable inflates confidence in the ability to predict future outcomes.',
    citation: 'Fischhoff 1975, "Hindsight ≠ Foresight"',
  },
  {
    from: 'framing_effect',
    to: 'loss_aversion',
    type: 'enables',
    weight: 1.4,
    mechanism:
      'Negative framing activates loss-aversion circuits; the same outcome framed as a loss triggers stronger avoidance.',
    citation: 'Kahneman & Tversky 1979, "Prospect Theory"',
  },
  {
    from: 'cognitive_misering',
    to: 'availability_heuristic',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Reluctance to engage System 2 leads to reliance on whatever information is most easily retrieved.',
    citation: 'Fiske & Taylor 1991, "Social Cognition"',
  },
  {
    from: 'selective_perception',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.5,
    mechanism:
      'Pre-attentive filtering screens out disconfirming stimuli before they can even be considered, reinforcing existing beliefs.',
    citation: 'Hastorf & Cantril 1954, "They Saw a Game"',
  },
  {
    from: 'recency_bias',
    to: 'availability_heuristic',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Recent events dominate memory retrieval, amplifying the ease-of-recall mechanism underlying availability judgments.',
    citation: 'Schwarz et al 1991, "Ease of Retrieval as Information"',
  },

  // ---- Additional research-backed relationships (25+) ----
  {
    from: 'confirmation_bias',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Active search for confirming evidence trains perceptual filters to preferentially pass hypothesis-consistent signals.',
    citation: 'Wason 1960, "On the Failure to Eliminate Hypotheses in a Conceptual Task"',
  },
  {
    from: 'anchoring_bias',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Anchored estimates feel precise, inflating confidence in the accuracy of the estimate around the anchor.',
    citation: 'Epley & Gilovich 2006, "The Anchoring-and-Adjustment Heuristic"',
  },
  {
    from: 'loss_aversion',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.5,
    mechanism:
      'Potential losses from change are weighted more heavily than potential gains, making the status quo feel safer.',
    citation:
      'Kahneman, Knetsch & Thaler 1991, "Anomalies: The Endowment Effect, Loss Aversion, and Status Quo Bias"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Continued investment in failing projects necessitates revised (optimistic) plans to justify past expenditure.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },
  {
    from: 'groupthink',
    to: 'overconfidence_bias',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Group consensus creates an illusion of invulnerability, inflating collective confidence beyond what evidence supports.',
    citation: 'Janis 1982, "Groupthink: Psychological Studies of Policy Decisions and Fiascoes"',
  },
  {
    from: 'authority_bias',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Authority endorsement of a viewpoint creates a strong prior that subsequent information seeking tends to confirm.',
    citation: 'Cialdini 2001, "Influence: Science and Practice"',
  },
  {
    from: 'bandwagon_effect',
    to: 'authority_bias',
    type: 'correlates',
    weight: 1.1,
    mechanism:
      'Widespread adoption signals implicit authority endorsement, strengthening deference to perceived consensus leaders.',
    citation:
      'Bikhchandani, Hirshleifer & Welch 1992, "A Theory of Fads, Fashion, Custom, and Cultural Change"',
  },
  {
    from: 'cognitive_misering',
    to: 'anchoring_bias',
    type: 'enables',
    weight: 1.4,
    mechanism:
      'System 1 default processing insufficiently adjusts from initial anchors, as adjustment requires effortful System 2 engagement.',
    citation:
      'Epley & Gilovich 2001, "Putting Adjustment Back in the Anchoring and Adjustment Heuristic"',
  },
  {
    from: 'framing_effect',
    to: 'selective_perception',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Frames prime perceptual filters, causing downstream information to be processed through the lens of the initial frame.',
    citation: 'Levin, Schneider & Gaeth 1998, "All Frames Are Not Created Equal"',
  },
  {
    from: 'hindsight_bias',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Retrospective inevitability narratives strengthen belief that the chosen hypothesis was always correct.',
    citation: 'Roese & Vohs 2012, "Hindsight Bias"',
  },
  {
    from: 'overconfidence_bias',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Overconfident decision-makers believe they can still turn failing projects around, escalating commitment.',
    citation: 'Staw 1976, "Knee-Deep in the Big Muddy"',
  },
  {
    from: 'planning_fallacy',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Successfully completing under-estimated plans (survivorship) reinforces the belief that optimistic estimates are accurate.',
    citation: 'Buehler, Griffin & Ross 1994, "Exploring the Planning Fallacy"',
  },
  {
    from: 'status_quo_bias',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Framing any change as departure from the status quo activates loss aversion for the current endowment.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },
  {
    from: 'recency_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'The most recent data point serves as a stronger anchor because it is more salient in working memory.',
    citation: 'Hogarth & Einhorn 1992, "Order Effects in Belief Updating"',
  },
  {
    from: 'confirmation_bias',
    to: 'overconfidence_bias',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Selective evidence gathering creates a distorted evidence base that makes confidence seem warranted.',
    citation: 'Koriat, Lichtenstein & Fischhoff 1980, "Reasons for Confidence"',
  },
  {
    from: 'availability_heuristic',
    to: 'framing_effect',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Easily recalled vivid examples create implicit frames that shape how subsequent options are evaluated.',
    citation: 'Slovic, Finucane, Peters & MacGregor 2002, "The Affect Heuristic"',
  },
  {
    from: 'groupthink',
    to: 'bandwagon_effect',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Strong group consensus signals social proof, creating pressure for remaining dissenters to join.',
    citation: 'Sunstein 2002, "The Law of Group Polarization"',
  },
  {
    from: 'cognitive_misering',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Evaluating alternatives requires cognitive effort that System 1 avoids, defaulting to existing arrangements.',
    citation: 'Stanovich & West 2000, "Individual Differences in Reasoning"',
  },
  {
    from: 'anchoring_bias',
    to: 'loss_aversion',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Anchored reference points define the boundary between gains and losses, triggering asymmetric loss weighting.',
    citation: 'Kahneman & Tversky 1979, "Prospect Theory"',
  },
  {
    from: 'selective_perception',
    to: 'availability_heuristic',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Perceptual filtering determines which events are encoded into memory, shaping what is later "available" for recall.',
    citation: 'Broadbent 1958, "Perception and Communication"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Past investments create an endowment effect around the current course of action, increasing resistance to change.',
    citation: 'Thaler 1980, "Toward a Positive Theory of Consumer Choice"',
  },
  {
    from: 'framing_effect',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'The frame within which information is presented establishes implicit anchors for subsequent judgments.',
    citation: 'Tversky & Kahneman 1981, "The Framing of Decisions"',
  },
  {
    from: 'authority_bias',
    to: 'bandwagon_effect',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Authority endorsement triggers cascading adoption as followers treat authority choice as a quality signal.',
    citation: 'Cialdini 2001, "Influence: Science and Practice"',
  },
  {
    from: 'overconfidence_bias',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism: 'High confidence in a hypothesis reduces motivation to seek disconfirming evidence.',
    citation:
      'Klayman & Ha 1987, "Confirmation, Disconfirmation, and Information in Hypothesis Testing"',
  },
  {
    from: 'loss_aversion',
    to: 'framing_effect',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Loss-averse individuals are disproportionately sensitive to how options are framed (gain vs loss frame).',
    citation: 'Kahneman & Tversky 1984, "Choices, Values, and Frames"',
  },
  {
    from: 'hindsight_bias',
    to: 'planning_fallacy',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Believing past timelines were foreseeable prevents learning from past planning errors.',
    citation: 'Fischhoff 1982, "Debiasing"',
  },
  {
    from: 'cognitive_misering',
    to: 'bandwagon_effect',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Following the crowd is a low-effort heuristic that avoids the cognitive cost of independent evaluation.',
    citation: 'Fiske & Taylor 1991, "Social Cognition"',
  },
  {
    from: 'recency_bias',
    to: 'framing_effect',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'The most recent frame encountered tends to dominate evaluation of subsequent information.',
    citation:
      'Krosnick & Alwin 1987, "An Evaluation of a Cognitive Theory of Response-Order Effects"',
  },
  {
    from: 'groupthink',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Group norms create shared perceptual filters that screen out information threatening to consensus.',
    citation: 'Janis 1972, "Victims of Groupthink"',
  },
  {
    from: 'availability_heuristic',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Easily recalled successes inflate perceived competence, while failures are less cognitively available.',
    citation: 'Lichtenstein, Fischhoff & Phillips 1982, "Calibration of Probabilities"',
  },
  {
    from: 'bandwagon_effect',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Joining a popular position creates a commitment that subsequent information processing seeks to confirm.',
    citation: 'Festinger 1957, "A Theory of Cognitive Dissonance"',
  },
  {
    from: 'status_quo_bias',
    to: 'sunk_cost_fallacy',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Preference for the current path legitimizes continued investment in existing commitments regardless of merit.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },
  {
    from: 'selective_perception',
    to: 'framing_effect',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Pre-attentive selection of frame-consistent information reinforces the dominant frame.',
    citation: 'Entman 1993, "Framing: Toward Clarification of a Fractured Paradigm"',
  },
  {
    from: 'planning_fallacy',
    to: 'sunk_cost_fallacy',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Optimistic initial plans create investments that become sunk costs when reality diverges from projections.',
    citation: 'Buehler, Griffin & Peetz 2010, "The Planning Fallacy"',
  },
  {
    from: 'hindsight_bias',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Retrospective certainty causes reinterpretation of ambiguous cues as having been clearly predictive.',
    citation: 'Hawkins & Hastie 1990, "Hindsight: Biased Judgments of Past Events"',
  },
  {
    from: 'cognitive_misering',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Seeking confirming evidence is less effortful than generating and testing alternative hypotheses.',
    citation: 'Stanovich 2009, "What Intelligence Tests Miss"',
  },
  {
    from: 'authority_bias',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Deferring to authority eliminates the cognitive work of independent analysis and judgment.',
    citation: 'Milgram 1974, "Obedience to Authority"',
  },
  {
    from: 'loss_aversion',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Aversion to acknowledging potential losses leads to optimistically biased risk and timeline estimates.',
    citation: 'Lovallo & Kahneman 2003, "Delusions of Success"',
  },
  {
    from: 'anchoring_bias',
    to: 'confirmation_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Initial anchors create hypotheses that subsequent information processing seeks to confirm.',
    citation: 'Chapman & Johnson 2002, "Incorporating the Irrelevant"',
  },
  {
    from: 'framing_effect',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.1,
    mechanism:
      'Accepting the presented frame avoids the cognitive effort of reframing the problem.',
    citation: 'Kahneman 2011, "Thinking, Fast and Slow"',
  },
  {
    from: 'recency_bias',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Recent events supporting a hypothesis are weighted more heavily, strengthening the confirmation loop.',
    citation: 'Nickerson 1998, "Confirmation Bias"',
  },
  {
    from: 'overconfidence_bias',
    to: 'groupthink',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Overconfident leaders drive group convergence by projecting certainty that discourages dissent.',
    citation: 'Tetlock 2005, "Expert Political Judgment"',
  },
  {
    from: 'availability_heuristic',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Vivid loss experiences are more available than equivalent gains, amplifying asymmetric loss weighting.',
    citation: 'Slovic 1987, "Perception of Risk"',
  },
  {
    from: 'selective_perception',
    to: 'groupthink',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Shared perceptual filters within a group create the illusion of unanimous agreement on ambiguous evidence.',
    citation: 'Schulz-Hardt et al 2000, "Biased Information Search in Group Decision Making"',
  },
  {
    from: 'hindsight_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.1,
    mechanism:
      'Retrospective knowledge of outcomes creates powerful anchors that distort evaluation of future decisions.',
    citation: 'Fischhoff & Beyth 1975, "I Knew It Would Happen"',
  },
  {
    from: 'bandwagon_effect',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Following the majority is a low-cost decision heuristic that substitutes social proof for analysis.',
    citation: 'Gigerenzer & Goldstein 1996, "Reasoning the Fast and Frugal Way"',
  },
  {
    from: 'status_quo_bias',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Preference for current arrangements motivates selective search for evidence justifying inaction.',
    citation: 'Eidelman & Crandall 2012, "Bias in Favor of the Status Quo"',
  },
  {
    from: 'cognitive_misering',
    to: 'framing_effect',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Low-effort processing accepts presented frames without the effortful reframing that could correct distortions.',
    citation: 'Kahneman 2011, "Thinking, Fast and Slow"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Escalation of commitment requires maintaining confidence that the investment will eventually pay off.',
    citation: 'Staw & Ross 1987, "Behavior in Escalation Situations"',
  },
  {
    from: 'authority_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Estimates provided by authority figures serve as stronger anchors due to perceived expertise.',
    citation: 'Cialdini 2001, "Influence: Science and Practice"',
  },

  // ---- Hindsight cluster ----
  {
    from: 'hindsight_bias',
    to: 'authority_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Retrospective certainty leads people to believe authorities "should have known," inflating expectations of expert foresight.',
    citation: 'Fischhoff 1975, "Hindsight ≠ Foresight"',
  },
  {
    from: 'recency_bias',
    to: 'hindsight_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Recent events feel more vivid and thus more predictable in retrospect, strengthening the knew-it-all-along effect.',
    citation: 'Roese & Vohs 2012, "Hindsight Bias"',
  },
  {
    from: 'hindsight_bias',
    to: 'groupthink',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Shared hindsight narratives reinforce group consensus that the chosen path was always obvious, suppressing future dissent.',
    citation: 'Roese & Vohs 2012, "Hindsight Bias"',
  },
  {
    from: 'hindsight_bias',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Retrospective clarity about missed opportunities intensifies the perceived pain of losses that feel like they were avoidable.',
    citation: 'Fischhoff 1975, "Hindsight ≠ Foresight"',
  },

  // ---- Loss aversion cluster ----
  {
    from: 'loss_aversion',
    to: 'groupthink',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Fear of incurring losses from deviating creates conformity pressure, as dissent risks personal and group losses.',
    citation:
      'Kahneman, Knetsch & Thaler 1991, "Anomalies: The Endowment Effect, Loss Aversion, and Status Quo Bias"',
  },
  {
    from: 'loss_aversion',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'People anchor to purchase prices or initial investments to avoid realizing losses relative to that reference point.',
    citation: 'Kahneman & Tversky 1979, "Prospect Theory"',
  },
  {
    from: 'loss_aversion',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'The emotional discomfort of contemplating losses discourages effortful analysis of risk trade-offs.',
    citation: 'Kahneman 2011, "Thinking, Fast and Slow"',
  },
  {
    from: 'loss_aversion',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Loss-averse individuals selectively attend to threat-related information, filtering out gain-related signals.',
    citation: 'Kahneman & Tversky 1979, "Prospect Theory"',
  },

  // ---- Availability ↔ anchoring ----
  {
    from: 'availability_heuristic',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Vivid, easily recalled examples become implicit numerical anchors that dominate subsequent estimation.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },
  {
    from: 'anchoring_bias',
    to: 'availability_heuristic',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Anchored values prime retrieval of anchor-consistent memories, making them more cognitively available.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },

  // ---- Social bias cluster expansion ----
  {
    from: 'groupthink',
    to: 'authority_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Group consensus elevates the perceived authority of the group leader, strengthening deference to their judgment.',
    citation: 'Janis 1982, "Groupthink: Psychological Studies of Policy Decisions and Fiascoes"',
  },
  {
    from: 'authority_bias',
    to: 'selective_perception',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Deference to authority primes perceptual filters to prioritize information consistent with the authority position.',
    citation: 'Milgram 1963, "Behavioral Study of Obedience"',
  },
  {
    from: 'authority_bias',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Authority endorsement inflates confidence in endorsed conclusions beyond what the evidence warrants.',
    citation: 'Cialdini 2001, "Influence: Science and Practice"',
  },
  {
    from: 'bandwagon_effect',
    to: 'overconfidence_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Widespread adoption creates social validation that inflates individual confidence in the popular choice.',
    citation: 'Asch 1951, "Effects of Group Pressure upon the Modification of Judgments"',
  },
  {
    from: 'bandwagon_effect',
    to: 'selective_perception',
    type: 'enables',
    weight: 1.1,
    mechanism:
      'Joining a popular position activates perceptual filters that screen out evidence against the consensus view.',
    citation: 'Asch 1951, "Effects of Group Pressure upon the Modification of Judgments"',
  },

  // ---- Planning / temporal cluster ----
  {
    from: 'planning_fallacy',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Initial project estimates become powerful anchors that resist adjustment even as evidence of overrun accumulates.',
    citation: 'Buehler, Griffin & Ross 1994, "Exploring the Planning Fallacy"',
  },
  {
    from: 'planning_fallacy',
    to: 'recency_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Planners base estimates on the most recent similar task rather than the full distribution of past experience.',
    citation: 'Buehler, Griffin & Ross 1994, "Exploring the Planning Fallacy"',
  },
  {
    from: 'planning_fallacy',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Once an optimistic plan is committed, planners selectively seek evidence that the timeline is achievable.',
    citation: 'Buehler, Griffin & Peetz 2010, "The Planning Fallacy"',
  },
  {
    from: 'planning_fallacy',
    to: 'loss_aversion',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Acknowledging a plan is behind schedule feels like admitting a loss, triggering avoidance of realistic reassessment.',
    citation: 'Lovallo & Kahneman 2003, "Delusions of Success"',
  },
  {
    from: 'recency_bias',
    to: 'overconfidence_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Recent successes are overweighted in self-assessment, inflating confidence in future performance.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },

  // ---- Framing / perception cluster ----
  {
    from: 'framing_effect',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'A favorable initial frame triggers confirmatory information search that reinforces the frame-consistent hypothesis.',
    citation: 'Nickerson 1998, "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises"',
  },
  {
    from: 'framing_effect',
    to: 'groupthink',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'A shared frame narrows the range of acceptable positions, accelerating convergence toward group consensus.',
    citation: 'Sunstein & Hastie 2015, "Wiser: Getting Beyond Groupthink"',
  },
  {
    from: 'selective_perception',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Selectively perceived data points become de facto anchors because they are the only evidence considered.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },
  {
    from: 'selective_perception',
    to: 'overconfidence_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Filtering out disconfirming information creates an artificially consistent evidence base that inflates confidence.',
    citation: 'Kruger & Dunning 1999, "Unskilled and Unaware of It"',
  },
  {
    from: 'selective_perception',
    to: 'recency_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Perceptual filters preferentially encode recent stimuli, making recent events disproportionately salient in memory.',
    citation: 'Broadbent 1958, "Perception and Communication"',
  },

  // ---- Cross-cluster bridges ----
  {
    from: 'sunk_cost_fallacy',
    to: 'groupthink',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Shared investment in a course of action creates collective commitment that suppresses individual dissent.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Escalated commitment motivates selective search for evidence that the investment will eventually pay off.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'The larger the sunk cost, the more painful abandonment feels, intensifying loss-averse continuation.',
    citation: 'Thaler 1980, "Toward a Positive Theory of Consumer Choice"',
  },
  {
    from: 'overconfidence_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Overconfident individuals set narrower confidence intervals, effectively creating tighter anchors for estimation.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },
  {
    from: 'availability_heuristic',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Easily recalled hypothesis-consistent examples create a biased evidence sample that reinforces existing beliefs.',
    citation: 'Nickerson 1998, "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises"',
  },
  {
    from: 'availability_heuristic',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'High-availability categories prime perceptual attention, causing people to notice category-consistent stimuli more readily.',
    citation: 'Slovic et al 1982, "Facts versus Fears"',
  },
  {
    from: 'cognitive_misering',
    to: 'authority_bias',
    type: 'enables',
    weight: 1.3,
    mechanism:
      'Deferring to authority is a low-effort heuristic that substitutes expert judgment for independent analysis.',
    citation: 'Fiske & Taylor 1991, "Social Cognition"',
  },
  {
    from: 'cognitive_misering',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Shallow processing fails to generate counterarguments, leaving initial confidence estimates unchallenged.',
    citation: 'Stanovich & West 2000, "Individual Differences in Reasoning"',
  },

  // ---- New relationships: confirmation bias outbound ----
  {
    from: 'confirmation_bias',
    to: 'groupthink',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Individual confirmation tendencies compound in groups as members selectively share belief-consistent evidence, accelerating false consensus.',
    citation: 'Nickerson 1998, "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises"',
  },
  {
    from: 'confirmation_bias',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Selective evidence gathering favors information supporting the wisdom of past investments, reinforcing escalation of commitment.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },
  {
    from: 'confirmation_bias',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Confirmatory search for threat information amplifies the salience of potential losses relative to equivalent gains.',
    citation: 'Kahneman & Tversky 1979, "Prospect Theory"',
  },
  {
    from: 'confirmation_bias',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Planners selectively attend to evidence consistent with optimistic timelines, ignoring base-rate data on delays.',
    citation: 'Buehler, Griffin & Ross 1994, "Exploring the Planning Fallacy"',
  },
  {
    from: 'confirmation_bias',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Selective search for evidence favoring existing arrangements makes the status quo appear more justified than alternatives.',
    citation: 'Eidelman & Crandall 2012, "Bias in Favor of the Status Quo"',
  },

  // ---- Anchoring outbound gaps ----
  {
    from: 'anchoring_bias',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.4,
    mechanism:
      'Initial time or cost anchors constrain subsequent estimation, causing insufficient adjustment toward realistic figures.',
    citation: 'Epley & Gilovich 2006, "The Anchoring-and-Adjustment Heuristic"',
  },
  {
    from: 'anchoring_bias',
    to: 'status_quo_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Existing metrics and benchmarks serve as anchors that make any departure from current performance seem unreasonable.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },
  {
    from: 'anchoring_bias',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Anchoring to the original investment amount magnifies the perceived magnitude of the sunk cost, making abandonment harder.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },

  // ---- Groupthink outbound gaps ----
  {
    from: 'groupthink',
    to: 'loss_aversion',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Group cohesion makes deviating from consensus feel like a social loss, intensifying individual loss aversion around group decisions.',
    citation: 'Janis 1982, "Groupthink: Psychological Studies of Policy Decisions and Fiascoes"',
  },
  {
    from: 'groupthink',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Collective investment in a group decision creates shared sunk costs that no individual wants to be first to write off.',
    citation: 'Sunstein & Hastie 2015, "Wiser: Getting Beyond Groupthink"',
  },
  {
    from: 'groupthink',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Group consensus around existing policy makes challenging the status quo a dual violation of both social norms and established practice.',
    citation: 'Janis 1982, "Groupthink: Psychological Studies of Policy Decisions and Fiascoes"',
  },
  {
    from: 'groupthink',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Groups suppress pessimistic estimates to maintain cohesion, producing collectively overoptimistic plans.',
    citation: 'Sunstein & Hastie 2015, "Wiser: Getting Beyond Groupthink"',
  },
  {
    from: 'groupthink',
    to: 'framing_effect',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Group consensus imposes a dominant frame that members adopt uncritically, suppressing alternative framings.',
    citation: 'Janis 1982, "Groupthink: Psychological Studies of Policy Decisions and Fiascoes"',
  },

  // ---- Overconfidence outbound gaps ----
  {
    from: 'overconfidence_bias',
    to: 'loss_aversion',
    type: 'mitigates',
    weight: 0.8,
    mechanism:
      'Overconfident individuals underweight the probability of losses, temporarily reducing loss-averse behavior in risky decisions.',
    citation: 'Kahneman & Lovallo 1993, "Timid Choices and Bold Forecasts"',
  },
  {
    from: 'overconfidence_bias',
    to: 'status_quo_bias',
    type: 'mitigates',
    weight: 0.85,
    mechanism:
      'Overconfident decision-makers are more willing to depart from the status quo, believing they can manage the risks of change.',
    citation: 'Kahneman & Lovallo 1993, "Timid Choices and Bold Forecasts"',
  },

  // ---- Hindsight outbound gaps ----
  {
    from: 'hindsight_bias',
    to: 'availability_heuristic',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Outcome knowledge makes outcome-consistent cues more cognitively available, biasing future frequency and probability judgments.',
    citation: 'Fischhoff 1975, "Hindsight ≠ Foresight"',
  },
  {
    from: 'hindsight_bias',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Believing past outcomes were inevitable makes current arrangements feel like the natural and correct state of affairs.',
    citation: 'Roese & Vohs 2012, "Hindsight Bias"',
  },

  // ---- Loss aversion outbound gaps ----
  {
    from: 'loss_aversion',
    to: 'confirmation_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Fear of realizing losses motivates selective search for information confirming that the current position will recover.',
    citation:
      'Kahneman, Knetsch & Thaler 1991, "Anomalies: The Endowment Effect, Loss Aversion, and Status Quo Bias"',
  },
  {
    from: 'loss_aversion',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'The need to justify holding losing positions inflates subjective confidence that the situation will improve.',
    citation: 'Thaler 1980, "Toward a Positive Theory of Consumer Choice"',
  },

  // ---- Status quo outbound gaps ----
  {
    from: 'status_quo_bias',
    to: 'groupthink',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Organizational inertia normalizes existing consensus, making challenges to the status quo feel like threats to group identity.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },
  {
    from: 'status_quo_bias',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Current performance metrics and processes serve as default anchors from which alternatives are insufficiently adjusted.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },
  {
    from: 'status_quo_bias',
    to: 'planning_fallacy',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Preference for existing plans makes it difficult to acknowledge that current timelines and budgets are unrealistic.',
    citation: 'Samuelson & Zeckhauser 1988, "Status Quo Bias in Decision Making"',
  },

  // ---- Sunk cost outbound gaps ----
  {
    from: 'sunk_cost_fallacy',
    to: 'anchoring_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'The magnitude of past investment creates a powerful anchor that distorts evaluation of future expected returns.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'selective_perception',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Commitment to a failing investment activates perceptual filters that preferentially notice progress signals and ignore warning signs.',
    citation: 'Staw 1976, "Knee-Deep in the Big Muddy"',
  },
  {
    from: 'sunk_cost_fallacy',
    to: 'cognitive_misering',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Continuing the current course is the low-effort default; reassessing sunk costs requires effortful counterfactual reasoning.',
    citation: 'Arkes & Blumer 1985, "The Psychology of Sunk Cost"',
  },

  // ---- Framing outbound gaps ----
  {
    from: 'framing_effect',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Framing change as risky and the current state as safe amplifies preference for existing arrangements.',
    citation: 'Kahneman & Tversky 1984, "Choices, Values, and Frames"',
  },
  {
    from: 'framing_effect',
    to: 'sunk_cost_fallacy',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Framing abandonment as "wasting" prior investment rather than as cutting losses amplifies sunk cost reasoning.',
    citation: 'Thaler 1980, "Toward a Positive Theory of Consumer Choice"',
  },
  {
    from: 'framing_effect',
    to: 'overconfidence_bias',
    type: 'enables',
    weight: 1.2,
    mechanism:
      'Positively framed outcomes inflate subjective probability estimates, boosting confidence beyond calibrated levels.',
    citation: 'Levin, Schneider & Gaeth 1998, "All Frames Are Not Created Equal"',
  },

  // ---- Recency outbound gaps ----
  {
    from: 'recency_bias',
    to: 'planning_fallacy',
    type: 'amplifies',
    weight: 1.3,
    mechanism:
      'Overweighting the most recent project outcome (especially if successful) leads to systematically optimistic estimates for the next one.',
    citation: 'Buehler, Griffin & Ross 1994, "Exploring the Planning Fallacy"',
  },
  {
    from: 'recency_bias',
    to: 'status_quo_bias',
    type: 'amplifies',
    weight: 1.2,
    mechanism:
      'Recent stability makes the current state feel permanent and natural, increasing resistance to change.',
    citation: 'Tversky & Kahneman 1974, "Judgment under Uncertainty"',
  },
];

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Get all relationships where the given bias is amplified by another bias.
 */
export function getAmplifiers(biasType: string): BiasRelationship[] {
  return BIAS_RELATIONSHIPS.filter(
    r => r.to === biasType && (r.type === 'amplifies' || r.type === 'enables')
  );
}

/**
 * Get all relationships involving the given bias (inbound or outbound).
 */
export function getRelatedBiases(
  biasType: string
): Array<{ bias: string; relationship: BiasRelationship }> {
  const results: Array<{ bias: string; relationship: BiasRelationship }> = [];

  for (const rel of BIAS_RELATIONSHIPS) {
    if (rel.from === biasType) {
      results.push({ bias: rel.to, relationship: rel });
    } else if (rel.to === biasType) {
      results.push({ bias: rel.from, relationship: rel });
    }
  }

  return results;
}

/**
 * Compute the compound risk multiplier for a set of co-occurring biases.
 *
 * Algorithm:
 * 1. Find all pairwise interaction weights between detected biases.
 * 2. Multiply: baseRisk * product(weights)
 * 3. Apply log-scaling for large bias sets (>4 biases) to prevent explosion.
 * 4. Cap at a maximum multiplier of 5.0.
 */
export function getCompoundRisk(biases: string[]): number {
  if (biases.length <= 1) return 1.0;

  let product = 1.0;
  let pairCount = 0;

  // Collect all pairwise interaction weights
  for (let i = 0; i < biases.length; i++) {
    for (let j = i + 1; j < biases.length; j++) {
      const a = biases[i];
      const b = biases[j];

      // Check both directions
      for (const rel of BIAS_RELATIONSHIPS) {
        if ((rel.from === a && rel.to === b) || (rel.from === b && rel.to === a)) {
          product *= rel.weight;
          pairCount++;
        }
      }
    }
  }

  // If no known interactions, return a mild compound penalty based on count
  if (pairCount === 0) {
    return Math.min(1.0 + (biases.length - 1) * 0.1, 2.0);
  }

  // Log-scale for large bias sets (>4) to prevent exponential explosion
  if (biases.length > 4) {
    const excess = biases.length - 4;
    // Dampen the product: take the (1 / (1 + 0.2 * excess)) root
    const dampening = 1 / (1 + 0.2 * excess);
    product = Math.pow(product, dampening);
  }

  // Cap at 5.0
  return Math.min(product, 5.0);
}
