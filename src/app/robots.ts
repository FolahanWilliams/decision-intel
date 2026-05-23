import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

/**
 * robots.ts — crawl policy for traditional search + AI answer engines.
 *
 * Two layers:
 *
 *   (1) Generic `User-agent: *` — the baseline rule for every other crawler
 *       (Bingbot, DuckDuckBot, Slackbot link-unfurl, LinkedInBot, plus the
 *       long tail). Allows `/`, disallows the standard `/api/ /dashboard/
 *       /shared/` set (utility endpoints + authed surfaces + token-gated
 *       share links; sitemapping or indexing those would manufacture the
 *       "Crawled - currently not indexed" GSC signal AND leak per-share
 *       link tokens via the index).
 *
 *   (2) Explicit allow-lists for the named AI answer-engine bots —
 *       Anthropic (ClaudeBot + anthropic-ai), OpenAI (GPTBot + OAI-SearchBot
 *       + ChatGPT-User), Google's AI extension (Google-Extended, separate
 *       from Googlebot which is already covered by `*`), Perplexity
 *       (PerplexityBot + Perplexity-User), plus Cohere, Apple (Applebot-
 *       Extended), Meta (Meta-ExternalAgent), Amazon (Amazonbot), DiffBot,
 *       and ByteDance (Bytespider). Each gets the SAME allow/disallow
 *       posture as `*` — no special restrictions, because AEO discipline
 *       (locked 2026-05-23) is "we WANT to be cited and ingested by AI
 *       answer engines."
 *
 * Why list AI bots explicitly even though `*` already covers them: some
 * AI crawlers honour ONLY their named directive and ignore the wildcard,
 * because the wildcard is ambiguous about whether the publisher consents
 * to LLM-training vs answer-engine-indexing. The explicit named directive
 * is the procurement-grade signal that says "yes, you may index us." Per
 * Google's published crawler documentation (https://developers.google.com/
 * search/docs/crawling-indexing/google-extended), Google-Extended is
 * specifically the toggle for AI training + AI-grounded answers (Bard,
 * Vertex AI, Gemini App); allowing it is the surface that gets us cited
 * in AI Overviews and Gemini answers.
 *
 * Naming: bot user-agent strings are case-sensitive per RFC 9309. The
 * casing below mirrors each vendor's published documentation.
 *
 * Forward-looking rule: when a new AI answer engine ships a publicly
 * documented bot, ADD it here in the same commit you discover it. A
 * named bot rule that doesn't exist is the AEO equivalent of an
 * indexable page absent from the sitemap (the 2026-05-18 GSC fix
 * lock) — discoverability suppression by omission.
 */

const STANDARD_DISALLOW = ['/api/', '/dashboard/', '/shared/'];

const AI_ANSWER_ENGINE_BOTS = [
  // Anthropic
  'ClaudeBot', // claude.ai web search + retrieval grounding
  'anthropic-ai', // legacy training crawler (kept for symmetry)
  'Claude-Web', // historical Anthropic identifier
  // OpenAI
  'GPTBot', // ChatGPT browse + training (publisher-controlled)
  'OAI-SearchBot', // OpenAI search index (post-2024 SearchGPT)
  'ChatGPT-User', // user-initiated ChatGPT browse fetches
  // Google AI surfaces (separate from Googlebot, which `*` covers)
  'Google-Extended', // Gemini + AI Overviews + Vertex AI training opt-in
  // Perplexity
  'PerplexityBot', // perplexity.ai crawler
  'Perplexity-User', // user-initiated Perplexity browse fetches
  // Apple
  'Applebot-Extended', // Apple Intelligence training opt-in (separate from Applebot)
  // Meta
  'Meta-ExternalAgent', // Meta AI / Llama training + grounding
  'FacebookBot', // Facebook crawl + link-preview
  // Amazon
  'Amazonbot', // Alexa + Amazon AI assistants
  // Cohere
  'cohere-ai', // Cohere Command training + retrieval
  'cohere-training-data-crawler', // explicit Cohere training crawler name
  // Other AI / answer engines
  'Bytespider', // ByteDance (Doubao / Coze)
  'DiffBot', // structured-data extraction for AI vendors
  'YouBot', // you.com chat
  // Social link-unfurl bots that surface DI in AI-adjacent contexts
  'Slackbot-LinkExpanding', // Slack link unfurl (powers Slack AI summaries)
  'LinkedInBot', // LinkedIn link preview + AI-feed surfacing
  'Twitterbot', // X / Grok link preview + grounding
];

export default function robots(): MetadataRoute.Robots {
  const aiBotRules = AI_ANSWER_ENGINE_BOTS.map(userAgent => ({
    userAgent,
    allow: '/',
    disallow: STANDARD_DISALLOW,
  }));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: STANDARD_DISALLOW,
      },
      ...aiBotRules,
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
