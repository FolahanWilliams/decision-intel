/**
 * FCA Consumer Duty Framework (2023)
 *
 * Maps cognitive biases to the four FCA Consumer Duty outcomes under PRIN 2A.
 * The Consumer Duty requires firms to act to deliver good outcomes for retail
 * customers across products, price, understanding, and support.
 *
 * Reference: FCA PS22/9 — A new Consumer Duty (July 2022, effective July 2023)
 */

import type { RegulatoryFramework } from '../regulatory-graph';

export const FCA_CONSUMER_DUTY: RegulatoryFramework = {
  id: 'fca_consumer_duty',
  name: 'FCA Consumer Duty',
  jurisdiction: 'United Kingdom',
  category: 'financial',
  lastUpdated: '2025-12-01',

  provisions: [
    {
      id: 'fca_cd_products_services',
      framework: 'fca_consumer_duty',
      section: 'PRIN 2A.2',
      title: 'Products and Services Outcome',
      description:
        'Products and services must be designed to meet the needs, characteristics, and objectives of customers in the identified target market. Firms must ensure products are distributed appropriately and reviewed regularly to confirm they continue to meet target market needs.',
      riskLevel: 'high',
      keywords: [
        'product design',
        'target market',
        'suitability',
        'distribution',
        'product governance',
        'customer needs',
        'product review',
      ],
    },
    {
      id: 'fca_cd_price_value',
      framework: 'fca_consumer_duty',
      section: 'PRIN 2A.3',
      title: 'Price and Value Outcome',
      description:
        'The price of products and services must provide fair value to retail customers. Firms must assess whether the total cost to the consumer — including fees, charges, and any cross-subsidisation — is reasonable relative to the benefits received.',
      riskLevel: 'high',
      keywords: [
        'fair value',
        'pricing',
        'fees',
        'charges',
        'cost-benefit',
        'value assessment',
        'cross-subsidisation',
      ],
    },
    {
      id: 'fca_cd_consumer_understanding',
      framework: 'fca_consumer_duty',
      section: 'PRIN 2A.4',
      title: 'Consumer Understanding Outcome',
      description:
        'Firms must support retail customers\' understanding through communications that are clear, fair, and not misleading. Information must be provided in a way that enables customers to make effective, timely, and properly informed decisions.',
      riskLevel: 'medium',
      keywords: [
        'communications',
        'disclosure',
        'clarity',
        'informed decisions',
        'transparency',
        'plain language',
        'customer understanding',
      ],
    },
    {
      id: 'fca_cd_consumer_support',
      framework: 'fca_consumer_duty',
      section: 'PRIN 2A.5',
      title: 'Consumer Support Outcome',
      description:
        'Firms must provide a level of support that meets consumers\' needs throughout the lifecycle of the product or service. Support must be accessible, responsive, and must not create unreasonable barriers to switching, claiming, or complaining.',
      riskLevel: 'medium',
      keywords: [
        'customer support',
        'complaints',
        'switching',
        'barriers',
        'lifecycle',
        'vulnerable customers',
        'accessibility',
      ],
    },
  ],

  biasMappings: [
    // ── confirmation_bias ──────────────────────────────────────────────
    {
      biasType: 'confirmation_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.8,
      mechanism:
        'Designing products based on confirming evidence while ignoring counter-evidence about customer needs. Product governance teams selectively interpret market research to validate pre-existing product concepts rather than objectively assessing target market fit.',
      example:
        'A product committee reviews customer feedback but only highlights positive responses, ignoring systematic complaints about product complexity that indicate poor target market alignment.',
    },
    {
      biasType: 'confirmation_bias',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.6,
      mechanism:
        'Teams assume customers understand product features because internal testing confirms their own expectations. Comprehension testing is designed to confirm clarity rather than genuinely probe for misunderstanding.',
      example:
        'Consumer testing of a key information document uses leading questions that confirm the document is clear, rather than open-ended questions that might reveal confusion about charges or risks.',
    },

    // ── anchoring_bias ─────────────────────────────────────────────────
    {
      biasType: 'anchoring_bias',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.85,
      mechanism:
        'Pricing decisions anchored to historical price points or competitor pricing rather than independent fair value assessment. Legacy fee structures persist because they anchor value discussions to outdated reference points.',
      example:
        'A fund charges 1.5% AMC because the original price was set when active management costs were higher, and subsequent reviews anchor to this figure rather than reassessing whether the fee reflects current value delivered.',
    },
    {
      biasType: 'anchoring_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.5,
      mechanism:
        'Product design anchored to existing product features rather than fresh assessment of target market needs. Iterative product development anchors to the current version rather than the customer\'s actual requirements.',
      example:
        'A mortgage product retains a complex offset feature because the original design included it, even though research shows the target market rarely uses or understands the feature.',
    },

    // ── availability_heuristic ─────────────────────────────────────────
    {
      biasType: 'availability_heuristic',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.65,
      mechanism:
        'Product suitability decisions driven by recent or vivid customer experiences rather than systematic analysis. Teams over-weight recently encountered customer stories when assessing whether products meet target market needs.',
      example:
        'After a single high-profile complaint about a savings product, the team redesigns the product for a niche use case, neglecting the broader target market that was well served by the original design.',
    },
    {
      biasType: 'availability_heuristic',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.55,
      mechanism:
        'Communication design influenced by easily recalled customer interactions rather than representative data about comprehension levels across the target market.',
      example:
        'A disclosure document is simplified based on complaints from a vocal minority, inadvertently removing information that the majority of customers needed to make informed decisions.',
    },

    // ── groupthink ─────────────────────────────────────────────────────
    {
      biasType: 'groupthink',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.7,
      mechanism:
        'Committee groupthink leads to pricing decisions that prioritize consensus over fair value analysis. Challenge functions are suppressed when the committee has already coalesced around a pricing position.',
      example:
        'A pricing committee unanimously approves a fee increase without dissent because the chair signalled support early in the meeting, and no member raised the consumer value impact analysis.',
    },
    {
      biasType: 'groupthink',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.75,
      mechanism:
        'Product governance committees reach consensus too quickly, failing to challenge whether products genuinely meet target market needs. Dissenters self-censor to maintain group harmony.',
      example:
        'A product governance board approves a structured product for retail distribution despite one member\'s unvoiced concerns about suitability, because the committee culture discourages dissent.',
    },
    {
      biasType: 'groupthink',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.6,
      mechanism:
        'Support teams develop shared assumptions about what constitutes adequate service without testing those assumptions against actual consumer needs and expectations.',
      example:
        'A customer service team collectively believes their 48-hour response time is acceptable because no team member has challenged this standard, despite customer satisfaction data showing otherwise.',
    },

    // ── authority_bias ─────────────────────────────────────────────────
    {
      biasType: 'authority_bias',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.6,
      mechanism:
        'Frontline staff defer to management directives on support processes without questioning whether those processes serve consumer interests. Complaints are handled per management protocol rather than customer need.',
      example:
        'A complaints handler follows a senior manager\'s instruction to apply a standardised resolution template rather than exercising judgment to provide fair individual redress for a vulnerable customer.',
    },
    {
      biasType: 'authority_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.55,
      mechanism:
        'Product design decisions driven by senior leadership preferences rather than evidence-based target market analysis. Junior product managers defer to executive opinions on customer needs.',
      example:
        'A CEO\'s conviction that customers want app-based investing drives product design away from the advisory model that the target market of older, less digitally-engaged customers actually needs.',
    },

    // ── bandwagon_effect ───────────────────────────────────────────────
    {
      biasType: 'bandwagon_effect',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.5,
      mechanism:
        'Consumer support practices adopted because competitors use them, rather than because they genuinely serve customer needs. Industry-standard practices are assumed to be adequate without independent validation.',
      example:
        'A firm implements chatbot-only first-line support because competitors have done so, without assessing whether their specific customer base — which includes many vulnerable customers — can effectively use chatbot support.',
    },
    {
      biasType: 'bandwagon_effect',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.45,
      mechanism:
        'Communication formats and disclosure approaches copied from industry peers rather than designed to meet the specific comprehension needs of the firm\'s target market.',
      example:
        'A firm adopts a competitor\'s Key Information Document format verbatim, assuming that industry-standard templates automatically satisfy the Consumer Understanding outcome, without testing comprehension with their own customer base.',
    },

    // ── overconfidence_bias ─────────────────────────────────────────────
    {
      biasType: 'overconfidence_bias',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.7,
      mechanism:
        'Overconfidence in communication clarity leads to assuming customers understand complex products without adequate testing. Firms overestimate the effectiveness of their disclosures and underestimate customer confusion.',
      example:
        'A firm\'s compliance team is confident that their KIID effectively communicates fund risks, but customer testing reveals that 60% of the target market cannot correctly identify the maximum potential loss.',
    },
    {
      biasType: 'overconfidence_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.6,
      mechanism:
        'Overconfidence in product design quality leads to insufficient post-launch monitoring and review. Teams believe their initial target market analysis is correct and do not re-evaluate as evidence accumulates.',
      example:
        'A product team is confident their new pension drawdown product suits the target market and delays the 12-month product review, missing early signals that customers are making suboptimal drawdown decisions.',
    },

    // ── hindsight_bias ─────────────────────────────────────────────────
    {
      biasType: 'hindsight_bias',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.5,
      mechanism:
        'After customer harm events, firms reconstruct the narrative to suggest the outcome was foreseeable, undermining genuine root-cause analysis of communication failures.',
      example:
        'After a wave of customer complaints about misunderstood product terms, the firm claims "it was always clear" and resists changing its communications, believing the issue was customer error rather than communication failure.',
    },
    {
      biasType: 'hindsight_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.45,
      mechanism:
        'Hindsight bias distorts product review processes by making past product failures seem predictable, leading to over-correction on specific risks while missing systemic design issues.',
      example:
        'After a product recall, the governance team focuses exclusively on the specific failure mode that occurred, believing it was obvious in retrospect, while neglecting other design risks that remain unaddressed.',
    },

    // ── planning_fallacy ───────────────────────────────────────────────
    {
      biasType: 'planning_fallacy',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.55,
      mechanism:
        'Underestimating the time and resources needed for proper product governance, leading to rushed target market assessments and insufficient product testing before launch.',
      example:
        'A firm plans a 4-week product approval timeline for a complex structured product, but the target market assessment is compressed into 3 days, resulting in superficial analysis of customer needs.',
    },
    {
      biasType: 'planning_fallacy',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.5,
      mechanism:
        'Underestimating the volume and complexity of support needed post-launch leads to inadequate resourcing, creating barriers for customers seeking help.',
      example:
        'A firm launches a new digital investment platform estimating 50 support calls per day, but actual volume reaches 300, causing multi-hour wait times and abandoned calls during the critical onboarding period.',
    },

    // ── loss_aversion ──────────────────────────────────────────────────
    {
      biasType: 'loss_aversion',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.65,
      mechanism:
        'Fear of revenue loss prevents firms from reducing fees or restructuring charges even when fair value assessments indicate current pricing does not represent good value for consumers.',
      example:
        'A value assessment reveals that an investment product\'s charges exceed the benefits delivered, but the firm resists fee reductions because the projected revenue loss outweighs the regulatory risk in management\'s mental calculus.',
    },
    {
      biasType: 'loss_aversion',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.5,
      mechanism:
        'Loss aversion drives firms to maintain legacy products rather than withdraw them from market, even when evidence shows the products no longer serve the target market effectively.',
      example:
        'An outdated with-profits product remains on sale because withdrawing it would crystallise guaranteed liabilities, despite evidence that new purchasers receive poor outcomes relative to modern alternatives.',
    },

    // ── sunk_cost_fallacy ──────────────────────────────────────────────
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.6,
      mechanism:
        'Historical investment in product development or distribution infrastructure justifies maintaining price levels that do not represent fair value. Sunk development costs are factored into ongoing pricing.',
      example:
        'A platform charges elevated fees to recoup a costly technology migration, passing development costs to consumers rather than absorbing them as a cost of doing business.',
    },
    {
      biasType: 'sunk_cost_fallacy',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.55,
      mechanism:
        'Continued investment in failing product lines because of prior development spend, rather than objectively assessing whether the product serves customer needs.',
      example:
        'A firm continues distributing a complex structured product after investing heavily in its development, despite post-launch evidence that the target market finds it unsuitable and confusing.',
    },

    // ── status_quo_bias ────────────────────────────────────────────────
    {
      biasType: 'status_quo_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.65,
      mechanism:
        'Resistance to changing established product ranges prevents firms from adapting products to evolving customer needs. Product reviews default to continuation rather than genuine reassessment.',
      example:
        'Annual product reviews rubber-stamp existing product ranges without genuinely reconsidering whether each product continues to meet target market needs in light of changed market conditions.',
    },
    {
      biasType: 'status_quo_bias',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.55,
      mechanism:
        'Support processes remain unchanged despite evidence that customer needs have evolved. Firms resist updating support channels, hours, or approaches that no longer serve consumers effectively.',
      example:
        'A firm maintains phone-only support during business hours because it has always operated this way, despite data showing that a large segment of their customer base needs evening and weekend digital support.',
    },

    // ── framing_effect ─────────────────────────────────────────────────
    {
      biasType: 'framing_effect',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.75,
      mechanism:
        'Fees and charges framed in ways that obscure total cost to the consumer. Percentage-based fees, drip pricing, or temporal framing (daily vs annual cost) mislead consumers about true value.',
      example:
        'A platform advertises charges as "just 0.03% per day" rather than the equivalent 11% annual rate, exploiting framing effects to make poor-value products appear attractively priced.',
    },
    {
      biasType: 'framing_effect',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.7,
      mechanism:
        'Product risks and benefits framed asymmetrically — gains emphasised with vivid language while losses are buried in technical disclaimers, preventing genuinely informed customer decisions.',
      example:
        'A product brochure frames potential returns as "you could earn up to 12% annually" in bold text, while the risk of capital loss appears only in small-print footnotes using technical language.',
    },

    // ── selective_perception ───────────────────────────────────────────
    {
      biasType: 'selective_perception',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.6,
      mechanism:
        'Product governance teams selectively perceive market data that supports existing product strategies, filtering out signals that customers\' needs have changed or that products are causing harm.',
      example:
        'A product review team focuses on net sales figures (positive) while ignoring rising complaint volumes and decreasing customer retention rates that indicate the product is underperforming for the target market.',
    },
    {
      biasType: 'selective_perception',
      provisionId: 'fca_cd_consumer_support',
      riskWeight: 0.5,
      mechanism:
        'Customer support metrics selectively interpreted to present a positive picture. Management perceives support quality as adequate by focusing on metrics that look good while ignoring those that don\'t.',
      example:
        'A firm reports high first-call resolution rates but ignores the 40% of customers who abandon the call queue before reaching an agent, selectively perceiving only completed interactions as representative.',
    },

    // ── recency_bias ───────────────────────────────────────────────────
    {
      biasType: 'recency_bias',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.5,
      mechanism:
        'Product reviews disproportionately influenced by recent performance data or recent customer feedback, losing sight of longer-term trends in product suitability and target market alignment.',
      example:
        'A product review concludes that a fund is suitable for its target market based on strong recent 6-month performance, ignoring a 5-year track record of underperformance and high volatility relative to the stated risk profile.',
    },
    {
      biasType: 'recency_bias',
      provisionId: 'fca_cd_price_value',
      riskWeight: 0.45,
      mechanism:
        'Value assessments anchored to recent cost trends rather than long-term value delivery, leading to misjudgement of whether pricing represents fair value over the product lifecycle.',
      example:
        'A value assessment justifies high charges based on recent strong investment returns, without considering that fees compounded over a 20-year pension term will significantly erode long-term customer outcomes.',
    },

    // ── cognitive_misering ─────────────────────────────────────────────
    {
      biasType: 'cognitive_misering',
      provisionId: 'fca_cd_consumer_understanding',
      riskWeight: 0.55,
      mechanism:
        'Decision-makers take mental shortcuts when designing communications, producing superficial or template-driven disclosures rather than investing cognitive effort in genuinely clear, customer-centric communications.',
      example:
        'A compliance team uses boilerplate risk warnings copied from regulatory guidance rather than crafting disclosures tailored to how their specific target market actually processes risk information.',
    },
    {
      biasType: 'cognitive_misering',
      provisionId: 'fca_cd_products_services',
      riskWeight: 0.5,
      mechanism:
        'Product governance teams default to heuristic-based assessments rather than investing the analytical effort needed for rigorous target market analysis and ongoing product review.',
      example:
        'A product governance committee spends 10 minutes reviewing a complex product\'s target market assessment, applying quick heuristics rather than engaging with the detailed customer outcome data available.',
    },
  ],
};
