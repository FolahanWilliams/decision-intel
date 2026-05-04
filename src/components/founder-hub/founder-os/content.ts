/**
 * Founder OS educational + motivational content (RATIFIED 2026-05-05).
 *
 * The "physical record" the founder comes back to when feeling unmotivated:
 *   - WHY_SFC_IS_BAD: research-backed, no-hand-waving rationale.
 *   - HOW_SFC_SABOTAGES_DI: explicit mapping from SFC neurobiology → v3.5
 *     phase failures. Each row names the cognitive failure mode AND the
 *     specific business consequence.
 *   - HOW_SFC_SABOTAGES_STANFORD: explicit mapping from SFC neurobiology →
 *     application competitiveness failures.
 *   - DAILY_BIBLE_VERSES: 100 verses curated for the founder's journey
 *     (discipline, persistence, identity, stewardship, building on rock).
 *     Rotated by day-of-year so the same verse shows on phone + laptop
 *     all day without an external API.
 *
 * No external dependencies. Deterministic. Survives offline.
 */

export interface SfcConsequenceRow {
  cognitiveFailureMode: string;
  v35BusinessConsequence: string;
}

export const WHY_SFC_IS_BAD: ReadonlyArray<{ heading: string; body: string }> = [
  {
    heading: 'Variable-reward dopamine cycle hijacks executive function',
    body: 'TikTok / Reels / YouTube Shorts use the exact psychological mechanism slot machines use — variable reward schedules. Every scroll is a slot pull. Neuroimaging (fMRI + EEG) shows heavy SFV consumption progressively downregulates activity in the dorsolateral prefrontal cortex (DLPFC) and anterior cingulate cortex (ACC) — the regions responsible for executive function, inhibitory control, and long-term planning. The platforms are literally training your brain to be incapable of the cognitive work you need for Decision Intel and Stanford.',
  },
  {
    heading: 'Theta-power suppression breaks sustained attention',
    body: 'EEG studies show users with higher SFV addiction tendencies exhibit significantly reduced theta power in the frontal region during cognitive tasks. Theta power is the neural signature of sustained attention and conflict resolution. Reduced theta = you literally cannot hold a long argument in your head, which is the exact thing Phase 1 motion (writing the LinkedIn DM that lands, surviving 60-min strategic conversations, running the live audit) requires.',
  },
  {
    heading: 'The Reverse Flynn Effect is real and measurable',
    body: 'For 100 years, IQ scores rose ~3 points per decade across the developed world (Flynn Effect). Since 2010 — exactly when smartphones + algorithmic SFC went mainstream — that trend reversed. Multi-decade studies in Norway, the UK, France, and the US all show structural decline in fluid intelligence + applied academic performance, accelerating sharply in cohorts born 1989+. The decline tracks WITHIN families (older vs younger sibling) — ruling out genetic / demographic explanations and pointing directly to environmental cause. SFC is the largest single environmental variable that changed.',
  },
  {
    heading: 'System 1 entrenchment, System 2 atrophy',
    body: 'SFC privileges System 1 thinking — fast, intuitive, reactive, pattern-matching on surface features. Print media + long-form content forces System 2 — slow, deliberate, analytical, capable of holding contradictions. Decision Intel is a System 2 product. Strategic memos require System 2 to write AND to audit. Stanford application essays require System 2 to draft AND to revise. SFC is actively atrophying the cognitive substrate both depend on.',
  },
  {
    heading: 'Cognitive offloading prevents neural-architecture building',
    body: 'When you anticipate that information will be stored externally (Google, AI, social feed), your brain stops consolidating it internally. Adolescent brains relying on AI summaries for foundational learning never build the neural architecture for critical thinking + conceptual understanding in the first place — they have nothing to "rebuild" later. This is THE most damaging long-term effect: not lost productivity today, but a permanent reduction in your ceiling.',
  },
  {
    heading: 'The dependency loop is self-reinforcing',
    body: 'Heavy SFC use → attentional fatigue + executive dysfunction → distress / anxiety / boredom → reach for SFC to manage the distress → further fatigue. Users get trapped in a vicious loop where the supposed "break" is what fragments them further. Breaking it requires elimination, not moderation, because moderation perpetuates the conditioning at lower volume without ever resetting the dopaminergic baseline.',
  },
];

export const HOW_SFC_SABOTAGES_DI: ReadonlyArray<SfcConsequenceRow> = [
  {
    cognitiveFailureMode: 'Cannot sustain 90-min deep work block',
    v35BusinessConsequence:
      'Phase 1 motion fails — writing one targeted LinkedIn DM with a specific bias-anchor from the 143-case library takes 20-30 minutes of focused thought. With 5-10 DMs/week, that\'s 90-300 minutes of unfragmented focus weekly. SFC-fragmented brain cannot deliver this.',
  },
  {
    cognitiveFailureMode: 'Bias-pattern recognition degrades',
    v35BusinessConsequence:
      'You can\'t see the pattern in a fractional CSO\'s memo if you can\'t hold the bias taxonomy in working memory. The 22-bias library is the core IP — recognising which biases fire in a specific industry / persona requires sustained engagement with the source material. SFC-fragmented brain skims, doesn\'t pattern-match.',
  },
  {
    cognitiveFailureMode: 'Cannot run the 20-minute live audit confidently',
    v35BusinessConsequence:
      'The Phase 1 conversion mechanic IS the live audit. If you\'re cognitively fragmented going INTO a coffee chat, you cannot listen to the prospect\'s memo in System 2 mode, identify the right bias to surface, and deliver the visceral hook ("3 flags caught · ~£X of decision risk"). The audit becomes a slide deck, the conversion fails.',
  },
  {
    cognitiveFailureMode: 'Vohra survey pattern recognition fails on small N',
    v35BusinessConsequence:
      'PMF is determined on 5-10 HXC respondents — small-sample qualitative pattern recognition. SFC-fragmented brain cannot synthesise across 8 different "very disappointed" answers and identify the convergent insight. You miss the signal that would have graduated Phase 1 to Phase 2.',
  },
  {
    cognitiveFailureMode: 'Sankore engagement requires sustained co-creation',
    v35BusinessConsequence:
      'Summer 2026 in-person 12-week design partnership = 60+ hours of high-stakes co-creation. SFC-fragmented brain cannot hold the customer\'s workflow in working memory while simultaneously thinking about product abstractions. The engagement degrades to delivering features Sankore asks for instead of co-designing the team-tier moat. Sankore reference fails to convert.',
  },
  {
    cognitiveFailureMode: 'Mr. Reiner / Mr. Gabe asks land hollow',
    v35BusinessConsequence:
      'When you finally activate the warm-intro asks at Phase 3, the conversation requires you to be the highest-conviction person in the room about Decision Intel\'s structural moat. SFC-fragmented brain reads as low-conviction founder. Network burns the asks at zero return. Phase 3 stalls.',
  },
  {
    cognitiveFailureMode: 'Compound 6-year discipline collapses at the dip',
    v35BusinessConsequence:
      'Year 2 → Year 3 (£1M-£3M ARR) is the empirical mortality phase for B2B SaaS. Surviving it requires founder discipline through 700+ daily decisions over 12 months. SFC-conditioning toward instant gratification + reduced distress tolerance = founder gives up at the dip. £10M ARR by 2032 becomes £150K ARR by 2027 and a quiet shutdown.',
  },
];

export const HOW_SFC_SABOTAGES_STANFORD: ReadonlyArray<SfcConsequenceRow> = [
  {
    cognitiveFailureMode: 'Application essays require System 2 + voice',
    v35BusinessConsequence:
      'Stanford essays are not generated; they\'re composed across multiple drafts that require System 2 reasoning + your authentic voice. SFC-fragmented brain produces generic, derivative essays AI will read as "clearly written by someone who consumed too much application advice on TikTok." Admissions readers can sense it.',
  },
  {
    cognitiveFailureMode: 'AP courses require sustained focus + conceptual depth',
    v35BusinessConsequence:
      'AP Calc / Physics / Stats demand 60-90 min of unfragmented focus per problem set. AP English / Microecon require synthesis across long-form sources. SFC-conditioning makes 60-90 min feel impossible; grades drop; transcript weakens; Stanford competitiveness falls.',
  },
  {
    cognitiveFailureMode: 'Demonstrated leadership + intellectual depth',
    v35BusinessConsequence:
      'Decision Intel + the financial-literacy initiative + the 2008-crisis paper + the metacognition speech are your application moat — but only if you\'re ACTIVELY adding to them through the application year. SFC-fragmented brain ships nothing meaningful in 11th grade; the application reads as "had momentum in 9th-10th grade, then plateaued." Stanford wants ascending trajectories.',
  },
  {
    cognitiveFailureMode: 'Interview presence + conviction',
    v35BusinessConsequence:
      'Stanford interviews happen Nov 2027 - Jan 2028. The interviewer has 30-45 min to assess intellectual depth + curiosity + voice. SFC-conditioning produces nervous-system dysregulation, scattered thinking under pressure, and shallow answers to deep questions. The interviewer reads it instantly. Your moat goes unsignaled.',
  },
  {
    cognitiveFailureMode: 'Reading list + intellectual engagement',
    v35BusinessConsequence:
      'When the application asks "which intellectual experience shaped you most?" the answer needs to be a primary source you actually engaged with deeply, not a derivative TikTok clip. SFC users cite "things I saw on social media" because that\'s what they actually consumed. Admissions reads it as cognitive shallowness.',
  },
];

export interface BibleVerse {
  ref: string;
  text: string;
  theme: 'discipline' | 'persistence' | 'identity' | 'stewardship' | 'building' | 'wisdom';
}

/**
 * 100 verses curated for the founder's journey. Themes selected to land
 * on cognitive discipline, persistence through the dip, identity in
 * Christ over identity in numbers, stewardship of the talents you've
 * been given, and building on rock not sand. Translation: ESV (clean,
 * widely cited, easy to read).
 *
 * Rotation: dayOfYear modulo array length, so the same verse shows on
 * phone + laptop all day, deterministically. To replace a verse,
 * just edit the array — no migration, no API contract change.
 */
export const DAILY_BIBLE_VERSES: ReadonlyArray<BibleVerse> = [
  // DISCIPLINE / RUNNING THE RACE
  { ref: '1 Corinthians 9:24', text: 'Do you not know that in a race all the runners run, but only one receives the prize? So run that you may obtain it.', theme: 'discipline' },
  { ref: '1 Corinthians 9:25', text: 'Every athlete exercises self-control in all things. They do it to receive a perishable wreath, but we an imperishable.', theme: 'discipline' },
  { ref: '1 Corinthians 9:27', text: 'But I discipline my body and keep it under control, lest after preaching to others I myself should be disqualified.', theme: 'discipline' },
  { ref: 'Hebrews 12:1', text: 'Let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us.', theme: 'discipline' },
  { ref: 'Hebrews 12:11', text: 'For the moment all discipline seems painful rather than pleasant, but later it yields the peaceful fruit of righteousness to those who have been trained by it.', theme: 'discipline' },
  { ref: '2 Timothy 1:7', text: 'For God gave us a spirit not of fear but of power and love and self-control.', theme: 'discipline' },
  { ref: 'Proverbs 25:28', text: 'A man without self-control is like a city broken into and left without walls.', theme: 'discipline' },
  { ref: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.', theme: 'discipline' },
  { ref: 'Titus 2:11-12', text: 'For the grace of God has appeared, training us to renounce ungodliness and worldly passions, and to live self-controlled, upright, and godly lives in the present age.', theme: 'discipline' },
  { ref: 'Proverbs 4:23', text: 'Keep your heart with all vigilance, for from it flow the springs of life.', theme: 'discipline' },

  // PERSISTENCE / NOT GROWING WEARY
  { ref: 'Galatians 6:9', text: 'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.', theme: 'persistence' },
  { ref: 'Romans 5:3-4', text: 'We rejoice in our sufferings, knowing that suffering produces endurance, and endurance produces character, and character produces hope.', theme: 'persistence' },
  { ref: 'James 1:2-4', text: 'Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.', theme: 'persistence' },
  { ref: 'James 1:12', text: 'Blessed is the man who remains steadfast under trial, for when he has stood the test he will receive the crown of life.', theme: 'persistence' },
  { ref: 'Philippians 3:13-14', text: 'Forgetting what lies behind and straining forward to what lies ahead, I press on toward the goal for the prize of the upward call of God in Christ Jesus.', theme: 'persistence' },
  { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.', theme: 'persistence' },
  { ref: 'Isaiah 40:31', text: 'But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.', theme: 'persistence' },
  { ref: '1 Corinthians 15:58', text: 'Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord, knowing that in the Lord your labor is not in vain.', theme: 'persistence' },
  { ref: '2 Corinthians 4:16-17', text: 'So we do not lose heart. Though our outer self is wasting away, our inner self is being renewed day by day. For this light momentary affliction is preparing for us an eternal weight of glory beyond all comparison.', theme: 'persistence' },
  { ref: 'Romans 12:12', text: 'Rejoice in hope, be patient in tribulation, be constant in prayer.', theme: 'persistence' },
  { ref: 'Hebrews 10:36', text: 'For you have need of endurance, so that when you have done the will of God you may receive what is promised.', theme: 'persistence' },
  { ref: '2 Timothy 4:7', text: 'I have fought the good fight, I have finished the race, I have kept the faith.', theme: 'persistence' },
  { ref: 'Habakkuk 2:3', text: 'For still the vision awaits its appointed time; it hastens to the end—it will not lie. If it seems slow, wait for it; it will surely come; it will not delay.', theme: 'persistence' },
  { ref: 'Lamentations 3:22-23', text: 'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', theme: 'persistence' },

  // IDENTITY / NOT CONFORMING / TRUE SELF
  { ref: 'Romans 12:2', text: 'Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.', theme: 'identity' },
  { ref: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.', theme: 'identity' },
  { ref: 'Galatians 2:20', text: 'I have been crucified with Christ. It is no longer I who live, but Christ who lives in me.', theme: 'identity' },
  { ref: 'Ephesians 2:10', text: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.', theme: 'identity' },
  { ref: 'Jeremiah 1:5', text: 'Before I formed you in the womb I knew you, and before you were born I consecrated you; I appointed you a prophet to the nations.', theme: 'identity' },
  { ref: 'Psalm 139:13-14', text: 'For you formed my inward parts; you knitted me together in my mother\'s womb. I praise you, for I am fearfully and wonderfully made.', theme: 'identity' },
  { ref: '1 Peter 2:9', text: 'But you are a chosen race, a royal priesthood, a holy nation, a people for his own possession, that you may proclaim the excellencies of him who called you out of darkness into his marvelous light.', theme: 'identity' },
  { ref: 'Colossians 3:23-24', text: 'Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ.', theme: 'identity' },
  { ref: '1 Timothy 4:12', text: 'Let no one despise you for your youth, but set the believers an example in speech, in conduct, in love, in faith, in purity.', theme: 'identity' },
  { ref: 'Romans 8:31', text: 'What then shall we say to these things? If God is for us, who can be against us?', theme: 'identity' },
  { ref: 'Romans 8:37', text: 'No, in all these things we are more than conquerors through him who loved us.', theme: 'identity' },
  { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.', theme: 'identity' },
  { ref: 'Isaiah 43:1', text: 'Fear not, for I have redeemed you; I have called you by name, you are mine.', theme: 'identity' },

  // STEWARDSHIP / TALENTS
  { ref: 'Matthew 25:21', text: 'His master said to him, "Well done, good and faithful servant. You have been faithful over a little; I will set you over much. Enter into the joy of your master."', theme: 'stewardship' },
  { ref: 'Matthew 25:29', text: 'For to everyone who has will more be given, and he will have an abundance. But from the one who has not, even what he has will be taken away.', theme: 'stewardship' },
  { ref: 'Luke 12:48', text: 'Everyone to whom much was given, of him much will be required, and from him to whom they entrusted much, they will demand the more.', theme: 'stewardship' },
  { ref: '1 Peter 4:10', text: 'As each has received a gift, use it to serve one another, as good stewards of God\'s varied grace.', theme: 'stewardship' },
  { ref: 'Proverbs 22:29', text: 'Do you see a man skillful in his work? He will stand before kings; he will not stand before obscure men.', theme: 'stewardship' },
  { ref: 'Ecclesiastes 9:10', text: 'Whatever your hand finds to do, do it with your might.', theme: 'stewardship' },
  { ref: 'Colossians 3:17', text: 'Whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.', theme: 'stewardship' },
  { ref: '1 Corinthians 4:2', text: 'Moreover, it is required of stewards that they be found faithful.', theme: 'stewardship' },
  { ref: 'Proverbs 12:24', text: 'The hand of the diligent will rule, while the slothful will be put to forced labor.', theme: 'stewardship' },
  { ref: 'Proverbs 13:4', text: 'The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.', theme: 'stewardship' },
  { ref: 'Proverbs 21:5', text: 'The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', theme: 'stewardship' },

  // BUILDING ON ROCK / FOUNDATIONS / STRATEGY
  { ref: 'Matthew 7:24-25', text: 'Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock. And the rain fell, and the floods came, and the winds blew and beat on that house, but it did not fall, because it had been founded on the rock.', theme: 'building' },
  { ref: 'Luke 14:28', text: 'For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?', theme: 'building' },
  { ref: 'Psalm 127:1', text: 'Unless the LORD builds the house, those who build it labor in vain.', theme: 'building' },
  { ref: 'Proverbs 24:3-4', text: 'By wisdom a house is built, and by understanding it is established; by knowledge the rooms are filled with all precious and pleasant riches.', theme: 'building' },
  { ref: '1 Corinthians 3:10-11', text: 'According to the grace of God given to me, like a skilled master builder I laid a foundation, and someone else is building upon it. Let each one take care how he builds upon it. For no one can lay a foundation other than that which is laid, which is Jesus Christ.', theme: 'building' },
  { ref: 'Nehemiah 4:6', text: 'So we built the wall. And all the wall was joined together to half its height, for the people had a mind to work.', theme: 'building' },
  { ref: 'Zechariah 4:10', text: 'For whoever has despised the day of small things shall rejoice.', theme: 'building' },
  { ref: 'Ephesians 2:20', text: 'Built on the foundation of the apostles and prophets, Christ Jesus himself being the cornerstone.', theme: 'building' },
  { ref: 'Hebrews 11:10', text: 'For he was looking forward to the city that has foundations, whose designer and builder is God.', theme: 'building' },

  // WISDOM / DISCERNMENT
  { ref: 'James 1:5', text: 'If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.', theme: 'wisdom' },
  { ref: 'Proverbs 1:7', text: 'The fear of the LORD is the beginning of knowledge; fools despise wisdom and instruction.', theme: 'wisdom' },
  { ref: 'Proverbs 2:6', text: 'For the LORD gives wisdom; from his mouth come knowledge and understanding.', theme: 'wisdom' },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.', theme: 'wisdom' },
  { ref: 'Proverbs 4:7', text: 'The beginning of wisdom is this: Get wisdom, and whatever you get, get insight.', theme: 'wisdom' },
  { ref: 'Proverbs 9:10', text: 'The fear of the LORD is the beginning of wisdom, and the knowledge of the Holy One is insight.', theme: 'wisdom' },
  { ref: 'Proverbs 11:14', text: 'Where there is no guidance, a people falls, but in an abundance of counselors there is safety.', theme: 'wisdom' },
  { ref: 'Proverbs 13:20', text: 'Whoever walks with the wise becomes wise, but the companion of fools will suffer harm.', theme: 'wisdom' },
  { ref: 'Proverbs 15:22', text: 'Without counsel plans fail, but with many advisers they succeed.', theme: 'wisdom' },
  { ref: 'Proverbs 16:3', text: 'Commit your work to the LORD, and your plans will be established.', theme: 'wisdom' },
  { ref: 'Proverbs 16:9', text: 'The heart of man plans his way, but the LORD establishes his steps.', theme: 'wisdom' },
  { ref: 'Proverbs 19:21', text: 'Many are the plans in the mind of a man, but it is the purpose of the LORD that will stand.', theme: 'wisdom' },
  { ref: 'Proverbs 20:18', text: 'Plans are established by counsel; by wise guidance wage war.', theme: 'wisdom' },
  { ref: 'Proverbs 21:31', text: 'The horse is made ready for the day of battle, but the victory belongs to the LORD.', theme: 'wisdom' },
  { ref: 'Proverbs 27:17', text: 'Iron sharpens iron, and one man sharpens another.', theme: 'wisdom' },
  { ref: 'Ecclesiastes 7:12', text: 'For the protection of wisdom is like the protection of money, and the advantage of knowledge is that wisdom preserves the life of him who has it.', theme: 'wisdom' },
  { ref: 'Daniel 1:17', text: 'As for these four youths, God gave them learning and skill in all literature and wisdom, and Daniel had understanding in all visions and dreams.', theme: 'wisdom' },
  { ref: 'Daniel 2:21', text: 'He gives wisdom to the wise and knowledge to those who have understanding.', theme: 'wisdom' },

  // PSALM / TRUST UNDER PRESSURE
  { ref: 'Psalm 1:3', text: 'He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither. In all that he does, he prospers.', theme: 'persistence' },
  { ref: 'Psalm 16:8', text: 'I have set the LORD always before me; because he is at my right hand, I shall not be shaken.', theme: 'identity' },
  { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.', theme: 'identity' },
  { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear? The LORD is the stronghold of my life; of whom shall I be afraid?', theme: 'identity' },
  { ref: 'Psalm 27:14', text: 'Wait for the LORD; be strong, and let your heart take courage; wait for the LORD!', theme: 'persistence' },
  { ref: 'Psalm 37:5', text: 'Commit your way to the LORD; trust in him, and he will act.', theme: 'wisdom' },
  { ref: 'Psalm 37:7', text: 'Be still before the LORD and wait patiently for him; fret not yourself over the one who prospers in his way, over the man who carries out evil devices!', theme: 'persistence' },
  { ref: 'Psalm 37:23-24', text: 'The steps of a man are established by the LORD, when he delights in his way; though he fall, he shall not be cast headlong, for the LORD upholds his hand.', theme: 'persistence' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!', theme: 'identity' },
  { ref: 'Psalm 73:26', text: 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.', theme: 'identity' },
  { ref: 'Psalm 84:11', text: 'For the LORD God is a sun and shield; the LORD bestows favor and honor. No good thing does he withhold from those who walk uprightly.', theme: 'identity' },
  { ref: 'Psalm 90:12', text: 'So teach us to number our days that we may get a heart of wisdom.', theme: 'wisdom' },
  { ref: 'Psalm 91:1-2', text: 'He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. I will say to the LORD, "My refuge and my fortress, my God, in whom I trust."', theme: 'identity' },
  { ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet and a light to my path.', theme: 'wisdom' },
  { ref: 'Psalm 121:1-2', text: 'I lift up my eyes to the hills. From where does my help come? My help comes from the LORD, who made heaven and earth.', theme: 'identity' },

  // ADDITIONAL ANCHORS
  { ref: 'Matthew 6:33', text: 'But seek first the kingdom of God and his righteousness, and all these things will be added to you.', theme: 'wisdom' },
  { ref: 'Matthew 11:28-30', text: 'Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.', theme: 'identity' },
  { ref: 'John 15:5', text: 'I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.', theme: 'identity' },
  { ref: 'Romans 8:28', text: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.', theme: 'identity' },
  { ref: 'Ephesians 6:10', text: 'Finally, be strong in the Lord and in the strength of his might.', theme: 'persistence' },
  { ref: 'Philippians 1:6', text: 'And I am sure of this, that he who began a good work in you will bring it to completion at the day of Jesus Christ.', theme: 'identity' },
  { ref: 'Philippians 2:13', text: 'For it is God who works in you, both to will and to work for his good pleasure.', theme: 'identity' },
  { ref: '1 Thessalonians 5:16-18', text: 'Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.', theme: 'identity' },
  { ref: 'Hebrews 11:1', text: 'Now faith is the assurance of things hoped for, the conviction of things not seen.', theme: 'persistence' },
  { ref: 'Hebrews 12:2', text: 'Looking to Jesus, the founder and perfecter of our faith, who for the joy that was set before him endured the cross, despising the shame, and is seated at the right hand of the throne of God.', theme: 'persistence' },
];

/** Returns the verse for the given local date (deterministic by day-of-year). */
export function verseForDate(date: Date = new Date()): BibleVerse {
  // Day of year (1-366) anchored to local time so phone + laptop agree.
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_BIBLE_VERSES[dayOfYear % DAILY_BIBLE_VERSES.length];
}
